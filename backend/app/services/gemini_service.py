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

    def _build_messages(self, message: str, history: List[Dict[str, str]]) -> List[Any]:
        """Formats client messages from conversation history and user message."""
        client_history = []
        for msg in (history or []):
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user":
                client_history.append(
                    gemini_analytics.Message(user_message=gemini_analytics.UserMessage(text=content))
                )
            elif role in ("assistant", "model"):
                client_history.append(
                    gemini_analytics.Message(
                        system_message=gemini_analytics.SystemMessage(
                            text=gemini_analytics.TextMessage(parts=[content])
                        )
                    )
                )
        client_history.append(
            gemini_analytics.Message(user_message=gemini_analytics.UserMessage(text=message))
        )
        return client_history

    async def _stream_stateless_sdk(
        self, 
        client, 
        message: str, 
        history: List[Dict[str, str]], 
        agent_path: str
    ) -> AsyncGenerator[str, None]:
        """
        Stateless interaction: uses data_agent_context directly on ChatRequest.
        """
        messages = self._build_messages(message, history)
        agent_ctx = gemini_analytics.DataAgentContext(data_agent=agent_path)

        chat_request = gemini_analytics.ChatRequest(
            parent=f"projects/{settings.GCP_PROJECT_ID}/locations/us",
            messages=messages,
            data_agent_context=agent_ctx,
        )

        response_stream = client.chat(request=chat_request)
        for chunk in response_stream:
            sys_msg = chunk.system_message
            if not sys_msg:
                continue

            if sys_msg.suggestions:
                for s in sys_msg.suggestions:
                    yield f"data: {json.dumps({'type': 'SUGGESTION', 'content': s.title})}\n\n"

            if sys_msg.text and sys_msg.text.parts:
                raw_type = getattr(sys_msg, "text_type", None) or getattr(sys_msg.text, "text_type", None)
                type_name = getattr(raw_type, "name", str(raw_type)) if raw_type is not None else ""

                if "UNSPECIFIED" in type_name or raw_type == 0:
                    for suggestion in sys_msg.text.parts:
                        if suggestion and suggestion.strip():
                            yield f"data: {json.dumps({'type': 'SUGGESTION', 'content': suggestion.strip()})}\n\n"
                else:
                    text_content = "".join(sys_msg.text.parts)
                    evt_type = "THOUGHT" if ("THOUGHT" in type_name or str(raw_type) == "1") else "FINAL_RESPONSE"
                    yield f"data: {json.dumps({'type': evt_type, 'content': text_content})}\n\n"

        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

    async def _stream_stateful_sdk(
        self, 
        client, 
        message: str, 
        history: List[Dict[str, str]], 
        agent_path: str
    ) -> AsyncGenerator[str, None]:
        """
        Stateful interaction: creates a managed Conversation resource on Google Cloud first,
        then chats with a valid ConversationReference.
        """
        parent_loc = f"projects/{settings.GCP_PROJECT_ID}/locations/us"
        
        # 1. Create a server-side Conversation bound to the agent
        conv_obj = gemini_analytics.Conversation(agents=[agent_path])
        create_req = gemini_analytics.CreateConversationRequest(
            parent=parent_loc,
            conversation=conv_obj,
        )
        conversation = client.create_conversation(request=create_req)
        logger.info(f"Created stateful conversation resource: {conversation.name}")

        # 2. Chat using the created conversation reference
        conversation_ref = gemini_analytics.ConversationReference(
            conversation=conversation.name,
            data_agent_context=gemini_analytics.DataAgentContext(data_agent=agent_path),
        )

        messages = [gemini_analytics.Message(user_message=gemini_analytics.UserMessage(text=message))]
        chat_request = gemini_analytics.ChatRequest(
            parent=parent_loc,
            messages=messages,
            conversation_reference=conversation_ref,
        )

        response_stream = client.chat(request=chat_request)
        for chunk in response_stream:
            sys_msg = chunk.system_message
            if not sys_msg:
                continue

            if sys_msg.suggestions:
                for s in sys_msg.suggestions:
                    yield f"data: {json.dumps({'type': 'SUGGESTION', 'content': s.title})}\n\n"

            if sys_msg.text and sys_msg.text.parts:
                raw_type = getattr(sys_msg, "text_type", None) or getattr(sys_msg.text, "text_type", None)
                type_name = getattr(raw_type, "name", str(raw_type)) if raw_type is not None else ""

                if "UNSPECIFIED" in type_name or raw_type == 0:
                    for suggestion in sys_msg.text.parts:
                        if suggestion and suggestion.strip():
                            yield f"data: {json.dumps({'type': 'SUGGESTION', 'content': suggestion.strip()})}\n\n"
                else:
                    text_content = "".join(sys_msg.text.parts)
                    evt_type = "THOUGHT" if ("THOUGHT" in type_name or str(raw_type) == "1") else "FINAL_RESPONSE"
                    yield f"data: {json.dumps({'type': evt_type, 'content': text_content})}\n\n"

        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

    async def _stream_via_rest(
        self, 
        message: str, 
        history: List[Dict[str, str]], 
        agent_path: str
    ) -> AsyncGenerator[str, None]:
        """
        Direct REST streaming endpoint pointing to geminidataanalytics.us.rep.googleapis.com.
        """
        import google.auth
        import google.auth.transport.requests

        credentials, project = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        token = credentials.token

        url = f"https://{US_ENDPOINT}/v1beta/projects/{settings.GCP_PROJECT_ID}/locations/us:chat"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        messages = []
        for msg in (history or []):
            if msg.get("role") == "user":
                messages.append({"userMessage": {"text": msg.get("content", "")}})
            elif msg.get("role") in ("assistant", "model"):
                messages.append({"systemMessage": {"text": {"parts": [msg.get("content", "")]}}})

        messages.append({"userMessage": {"text": message}})

        # Stateless DataAgent payload format
        payload = {
            "messages": messages,
            "dataAgentContext": {
                "dataAgent": agent_path
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as http_client:
            async with http_client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise RuntimeError(f"REST API ({US_ENDPOINT}) HTTP {response.status_code}: {error_text.decode('utf-8')}")

                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        raw_data = line[5:].strip()
                        if not raw_data or raw_data == "[DONE]":
                            continue
                        try:
                            data_obj = json.loads(raw_data)
                            sys_msg = data_obj.get("systemMessage", {})
                            if sys_msg.get("suggestions"):
                                for s in sys_msg["suggestions"]:
                                    yield f"data: {json.dumps({'type': 'SUGGESTION', 'content': s.get('title')})}\n\n"
                            
                            text_obj = sys_msg.get("text", {})
                            parts = text_obj.get("parts", [])
                            if parts:
                                text_type = sys_msg.get("textType") or text_obj.get("textType", "")
                                evt_type = "THOUGHT" if "THOUGHT" in str(text_type) else "FINAL_RESPONSE"
                                yield f"data: {json.dumps({'type': evt_type, 'content': ''.join(parts)})}\n\n"
                        except Exception:
                            continue

        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

    async def stream_chat(self, message: str, history: List[Dict[str, str]] = None) -> AsyncGenerator[str, None]:
        """
        Strict Conversational Analytics execution for your BigQuery Data Agent.
        Tries Stateless SDK -> Stateful SDK -> Direct REST.
        Fails explicitly if none succeed.
        """
        history = history or []
        agent_id = settings.DATA_AGENT_ID
        agent_path = settings.DATA_AGENT_PATH
        errors = []

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Connecting to BigQuery Data Agent: {agent_id} at {US_ENDPOINT}...'})}\n\n"
        await asyncio.sleep(0.08)

        analytics_client = self.get_analytics_client()

        # ---------------------------------------------------------------------
        # 1. Stateless SDK Call (data_agent_context directly on ChatRequest)
        # ---------------------------------------------------------------------
        if analytics_client is not None:
            try:
                yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Dispatching stateless request to Data Agent ({agent_id})...'})}\n\n"
                async for chunk in self._stream_stateless_sdk(analytics_client, message, history, agent_path):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Stateless SDK attempt failed: {e}")
                errors.append(f"Stateless SDK Error: {str(e)}")

        # ---------------------------------------------------------------------
        # 2. Stateful SDK Call (create_conversation resource -> chat)
        # ---------------------------------------------------------------------
        if analytics_client is not None:
            try:
                yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Initializing stateful conversation session for Data Agent ({agent_id})...'})}\n\n"
                async for chunk in self._stream_stateful_sdk(analytics_client, message, history, agent_path):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Stateful SDK attempt failed: {e}")
                errors.append(f"Stateful SDK Error: {str(e)}")

        # ---------------------------------------------------------------------
        # 3. Direct REST Stream Call
        # ---------------------------------------------------------------------
        try:
            yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Connecting via HTTPS REST stream to {US_ENDPOINT}...'})}\n\n"
            async for chunk in self._stream_via_rest(message, history, agent_path):
                yield chunk
            return
        except Exception as e:
            logger.error(f"Conversational Analytics REST error: {e}")
            errors.append(f"HTTPS REST Error: {str(e)}")

        # ---------------------------------------------------------------------
        # Strict Failure Reporting (Zero Fallbacks)
        # ---------------------------------------------------------------------
        error_details = "\n".join(f"- {err}" for err in errors) if errors else "No active Conversational Analytics client could be initialized."
        
        failure_message = (
            f"❌ **Conversational Analytics Connection Failure**\n\n"
            f"The chat assistant failed to connect to your BigQuery Data Agent:\n"
            f"- **Agent ID**: `{agent_id}`\n"
            f"- **Agent Path**: `{agent_path}`\n"
            f"- **Target Endpoint**: `{US_ENDPOINT}`\n\n"
            f"### Error Diagnostics:\n"
            f"```text\n{error_details}\n```\n"
        )

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': 'Conversational Analytics connection failed. Terminating stream as requested.'})}\n\n"
        yield f"data: {json.dumps({'type': 'FINAL_RESPONSE', 'content': failure_message})}\n\n"
        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

gemini_service = GeminiService()
