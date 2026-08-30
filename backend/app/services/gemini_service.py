import os
import re
import json
import uuid
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, List
import httpx
from google.api_core.client_options import ClientOptions
from app.config import settings

logger = logging.getLogger("gemini_service")

# Multi-region endpoint required by Google Cloud for location 'us'
US_ENDPOINT = "geminidataanalytics.us.rep.googleapis.com"

# Check for official Google Cloud Conversational Analytics SDK
try:
    from google.cloud import geminidataanalytics_v1beta as gemini_analytics
    HAS_SDK = True
    logger.info("google.cloud.geminidataanalytics_v1beta SDK available.")
except ImportError:
    gemini_analytics = None
    HAS_SDK = False
    logger.warning("google.cloud.geminidataanalytics_v1beta SDK not found.")


class GeminiService:
    def __init__(self):
        self._analytics_client = None

    def get_analytics_client(self):
        """
        Initializes Google Cloud DataChatServiceClient with the required 'us' multi-region
        endpoint (geminidataanalytics.us.rep.googleapis.com).
        """
        if not HAS_SDK:
            return None
        if self._analytics_client is not None:
            return self._analytics_client
        try:
            opts = ClientOptions(api_endpoint=US_ENDPOINT)
            self._analytics_client = gemini_analytics.DataChatServiceClient(client_options=opts)
            logger.info(f"DataChatServiceClient connected to {US_ENDPOINT}")
            return self._analytics_client
        except Exception as e:
            logger.warning(f"Could not initialize DataChatServiceClient with endpoint {US_ENDPOINT}: {e}")
            return None

    def _process_system_message(self, sys_msg: Any) -> List[Dict[str, Any]]:
        """
        Extracts thoughts, final responses, generated SQL, and follow-up suggestions
        from Google Cloud Conversational Analytics systemMessage objects.
        """
        events = []
        if not sys_msg:
            return events

        # 1. Text payload (Thoughts, Final Responses, Follow-up Questions)
        text_obj = getattr(sys_msg, "text", None) or (sys_msg.get("text") if isinstance(sys_msg, dict) else None)
        if text_obj:
            parts = getattr(text_obj, "parts", None) or (text_obj.get("parts") if isinstance(text_obj, dict) else [])
            raw_type = getattr(sys_msg, "text_type", None) or getattr(text_obj, "text_type", None)
            if raw_type is None and isinstance(sys_msg, dict):
                raw_type = sys_msg.get("textType") or text_obj.get("textType", "")

            type_name = str(getattr(raw_type, "name", raw_type)).upper()

            if "FOLLOWUP" in type_name or "SUGGESTION" in type_name:
                for q in parts:
                    if q and str(q).strip():
                        events.append({"type": "SUGGESTION", "content": str(q).strip()})
            elif "THOUGHT" in type_name:
                content = "\n".join(str(p) for p in parts if p)
                if content:
                    events.append({"type": "THOUGHT", "content": content})
            else:
                content = "\n".join(str(p) for p in parts if p)
                if content:
                    events.append({"type": "FINAL_RESPONSE", "content": content})

        # 2. Suggestions list
        suggestions = getattr(sys_msg, "suggestions", None) or (sys_msg.get("suggestions") if isinstance(sys_msg, dict) else None)
        if suggestions:
            for s in suggestions:
                title = getattr(s, "title", None) or (s.get("title") if isinstance(s, dict) else str(s))
                if title:
                    events.append({"type": "SUGGESTION", "content": title})

        # 3. Data payload (Generated SQL, BigQuery Job, Query Results)
        data_obj = getattr(sys_msg, "data", None) or (sys_msg.get("data") if isinstance(sys_msg, dict) else None)
        if data_obj:
            gen_sql = getattr(data_obj, "generated_sql", None) or (data_obj.get("generatedSql") if isinstance(data_obj, dict) else None)
            if gen_sql:
                events.append({"type": "SQL_QUERY", "sql": gen_sql})

        return events

    async def _stream_via_sdk(
        self, 
        client, 
        message: str, 
        agent_path: str
    ) -> AsyncGenerator[str, None]:
        """
        Executes query via DataChatServiceClient with valid Protobuf fields.
        """
        conv_id = f"projects/{settings.GCP_PROJECT_ID}/locations/us/conversations/{uuid.uuid4()}"

        conversation_ref = gemini_analytics.ConversationReference(
            conversation=conv_id,
            data_agent_context=gemini_analytics.DataAgentContext(
                data_agent=agent_path
            )
        )

        # UserMessage only accepts text
        user_msg = gemini_analytics.UserMessage(text=message)

        chat_request = gemini_analytics.ChatRequest(
            parent=f"projects/{settings.GCP_PROJECT_ID}/locations/us",
            messages=[gemini_analytics.Message(user_message=user_msg)],
            conversation_reference=conversation_ref,
        )

        response_stream = client.chat(request=chat_request)
        for chunk in response_stream:
            sys_msg = chunk.system_message
            if not sys_msg:
                continue
            for event in self._process_system_message(sys_msg):
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.04)

        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

    async def _stream_via_rest(
        self, 
        message: str, 
        agent_path: str
    ) -> AsyncGenerator[str, None]:
        """
        Direct REST streaming endpoint using Google Cloud's Protobuf JSON format.
        """
        import google.auth
        import google.auth.transport.requests

        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        credentials.refresh(google.auth.transport.requests.Request())
        token = credentials.token

        conv_id = f"projects/{settings.GCP_PROJECT_ID}/locations/us/conversations/{uuid.uuid4()}"

        # Standard Protobuf JSON payload accepted by geminidataanalytics
        payload = {
            "parent": f"projects/{settings.GCP_PROJECT_ID}/locations/us",
            "messages": [
                {
                    "userMessage": {
                        "text": message
                    }
                }
            ],
            "conversationReference": {
                "conversation": conv_id,
                "dataAgentContext": {
                    "dataAgent": agent_path
                }
            }
        }

        url = f"https://{US_ENDPOINT}/v1beta/projects/{settings.GCP_PROJECT_ID}/locations/us:chat"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream, application/json"
        }

        async with httpx.AsyncClient(timeout=60.0) as http_client:
            async with http_client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    raise RuntimeError(f"HTTP {response.status_code}: {err_body.decode('utf-8')}")

                buffer = ""
                async for chunk in response.aiter_bytes():
                    buffer += chunk.decode('utf-8', errors='ignore')

                count = 0
                if "data:" in buffer:
                    for line in buffer.splitlines():
                        line = line.strip()
                        if line.startswith("data:"):
                            raw = line[5:].strip()
                            if not raw or raw == "[DONE]":
                                continue
                            try:
                                obj = json.loads(raw)
                                sys_msg = obj.get("data", {}).get("systemMessage") or obj.get("systemMessage") or {}
                                for evt in self._process_system_message(sys_msg):
                                    yield f"data: {json.dumps(evt)}\n\n"
                                    count += 1
                                    await asyncio.sleep(0.04)
                            except Exception:
                                continue
                else:
                    try:
                        parsed = json.loads(buffer.strip())
                        items = parsed if isinstance(parsed, list) else [parsed]
                        for item in items:
                            sys_msg = item.get("data", {}).get("systemMessage") or item.get("systemMessage") or {}
                            for evt in self._process_system_message(sys_msg):
                                yield f"data: {json.dumps(evt)}\n\n"
                                count += 1
                                await asyncio.sleep(0.04)
                    except Exception as parse_err:
                        logger.warning(f"Failed to parse JSON body: {parse_err}")

                if count > 0:
                    yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

    async def stream_chat(self, message: str, history: List[Dict[str, str]] = None) -> AsyncGenerator[str, None]:
        """
        Executes query directly on your BigQuery Data Agent.
        Tries official gRPC SDK first, then HTTPS REST.
        """
        history = history or []
        agent_id = settings.DATA_AGENT_ID
        agent_path = settings.DATA_AGENT_PATH
        errors = []

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Connecting to BigQuery Data Agent: {agent_id}...'})}\n\n"
        await asyncio.sleep(0.08)

        # ---------------------------------------------------------------------
        # 1. Official Conversational Analytics API (SDK - Primary)
        # ---------------------------------------------------------------------
        analytics_client = self.get_analytics_client()
        if analytics_client is not None:
            try:
                yield f"data: {json.dumps({'type': 'THOUGHT', 'content': 'Dispatching to BigQuery Data Agent via gRPC SDK...'})}\n\n"
                async for chunk in self._stream_via_sdk(analytics_client, message, agent_path):
                    yield chunk
                return
            except Exception as e:
                logger.error(f"SDK Error: {e}")
                errors.append(f"gRPC SDK Error: {str(e)}")

        # ---------------------------------------------------------------------
        # 2. Official Conversational Analytics API (HTTPS REST Stream - Secondary)
        # ---------------------------------------------------------------------
        try:
            yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Connecting via HTTPS REST to {US_ENDPOINT}...'})}\n\n"
            async for chunk in self._stream_via_rest(message, agent_path):
                yield chunk
            return
        except Exception as e:
            logger.error(f"REST Error: {e}")
            errors.append(f"HTTPS REST Error: {str(e)}")

        # ---------------------------------------------------------------------
        # Strict Failure Reporting (Zero Fallbacks)
        # ---------------------------------------------------------------------
        error_details = "\n".join(f"- {err}" for err in errors) if errors else "No active client could be established."
        
        failure_message = (
            f"❌ **Conversational Analytics Connection Failure**\n\n"
            f"The chat assistant failed to connect to your BigQuery Data Agent:\n"
            f"- **Agent ID**: `{agent_id}`\n"
            f"- **Agent Path**: `{agent_path}`\n"
            f"- **Target Endpoint**: `{US_ENDPOINT}`\n\n"
            f"### Error Diagnostics:\n"
            f"```text\n{error_details}\n```\n"
        )

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': 'Conversational Analytics connection failed.'})}\n\n"
        yield f"data: {json.dumps({'type': 'FINAL_RESPONSE', 'content': failure_message})}\n\n"
        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

gemini_service = GeminiService()
