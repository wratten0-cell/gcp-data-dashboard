import os
import re
import json
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, List
import httpx
from google.api_core.client_options import ClientOptions
from app.config import settings
from app.services.gcp_service import gcp_service

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
    logger.warning("google.cloud.geminidataanalytics_v1beta SDK not found. Will use REST API / GenAI fallback.")


class GeminiService:
    def __init__(self):
        self._analytics_client = None
        self._genai_client = None

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

    def get_genai_client(self):
        """Fallback Google GenAI client."""
        if self._genai_client is not None:
            return self._genai_client
        
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                return self._genai_client
            except Exception as e:
                logger.warning(f"Could not initialize GenAI with key: {e}")

        try:
            from google import genai
            self._genai_client = genai.Client(
                vertexai=True,
                project=settings.GCP_PROJECT_ID,
                location=settings.GCP_REGION
            )
            return self._genai_client
        except Exception as e:
            logger.warning(f"Could not initialize Vertex AI client: {e}")
            return None

    async def _stream_via_sdk(
        self, 
        client, 
        message: str, 
        history: List[Dict[str, str]], 
        agent_path: str
    ) -> AsyncGenerator[str, None]:
        """
        Invokes the user's specific BigQuery Data Agent via DataChatServiceClient.
        Agent: projects/tribal-datum-507019-m0/locations/us/dataAgents/agent_c4a8c97f-d9a1-47ea-a65d-bfe6f2797718
        """
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

        conversation_ref = gemini_analytics.ConversationReference(
            data_agent_context=gemini_analytics.DataAgentContext(
                data_agent=agent_path
            )
        )

        chat_request = gemini_analytics.ChatRequest(
            parent=f"projects/{settings.GCP_PROJECT_ID}/locations/us",
            messages=client_history + [
                gemini_analytics.Message(user_message=gemini_analytics.UserMessage(text=message))
            ],
            conversation_reference=conversation_ref,
        )

        response_stream = client.chat(request=chat_request)
        for chunk in response_stream:
            sys_msg = chunk.system_message
            if not sys_msg:
                continue

            # Stream follow-up interactive suggestions from the Data Agent
            if sys_msg.suggestions:
                for s in sys_msg.suggestions:
                    yield f"data: {json.dumps({'type': 'SUGGESTION', 'content': s.title})}\n\n"

            # Stream text parts: thoughts vs final responses
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

        payload = {
            "messages": messages,
            "conversationReference": {
                "dataAgentContext": {
                    "dataAgent": agent_path
                }
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as http_client:
            async with http_client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise RuntimeError(f"REST API ({US_ENDPOINT}) status {response.status_code}: {error_text.decode('utf-8')}")

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
        Primary chat entry point connecting directly to the user's BigQuery Data Agent.
        """
        history = history or []
        agent_path = settings.DATA_AGENT_PATH
        agent_id = settings.DATA_AGENT_ID
        table_name = f"`{settings.GCP_PROJECT_ID}.{settings.BQ_DATASET_ID}.packages`"

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Connecting to BigQuery Data Agent: {agent_id} at {US_ENDPOINT}...'})}\n\n"
        await asyncio.sleep(0.1)

        # ---------------------------------------------------------------------
        # 1. Official Conversational Analytics API (SDK) with Multi-Region Endpoint
        # ---------------------------------------------------------------------
        analytics_client = self.get_analytics_client()
        if analytics_client is not None:
            try:
                logger.info(f"Invoking Data Agent {agent_path} via gRPC SDK at {US_ENDPOINT}...")
                yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Query dispatched to BigQuery Data Agent ({agent_id}). Awaiting response stream...'})}\n\n"
                async for chunk in self._stream_via_sdk(analytics_client, message, history, agent_path):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"DataChatServiceClient failed with: {e}. Trying REST endpoint.")

        # ---------------------------------------------------------------------
        # 2. Official Conversational Analytics API (Direct HTTPS REST Stream)
        # ---------------------------------------------------------------------
        try:
            logger.info(f"Invoking Data Agent {agent_path} via REST stream at {US_ENDPOINT}...")
            yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Connecting via HTTPS to {US_ENDPOINT} for Data Agent ({agent_id})...'})}\n\n"
            async for chunk in self._stream_via_rest(message, history, agent_path):
                yield chunk
            return
        except Exception as e:
            logger.warning(f"Conversational Analytics REST endpoint error: {e}. Falling back to direct BigQuery execution loop.")
            yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Data Agent API notice: {e}. Executing direct BigQuery analysis...'})}\n\n"

        # ---------------------------------------------------------------------
        # 3. Dynamic BigQuery Reasoning Loop Fallback
        # ---------------------------------------------------------------------
        sql = ""
        genai_client = self.get_genai_client()

        if genai_client:
            prompt = f"""You are a BigQuery SQL analyst for table `{settings.GCP_PROJECT_ID}.{settings.BQ_DATASET_ID}.packages`.
Columns:
- `Type` (STRING): 'Ground Advantage', 'Priority Mail'
- `Revenue` (FLOAT64): Dollar postage price

USER QUESTION: "{message}"
Generate the exact BigQuery SQL query:
"""
            for m in [settings.GEMINI_MODEL, "gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    resp = genai_client.models.generate_content(model=m, contents=[prompt])
                    s = resp.text.strip()
                    if s.startswith("```"):
                        s = re.sub(r"^```[a-zA-Z]*\n", "", s)
                        s = re.sub(r"\n```$", "", s).strip()
                    if "select" in s.lower() and "from" in s.lower():
                        sql = s
                        break
                except Exception:
                    continue

        if not sql:
            msg_low = message.lower()
            price_match = re.search(r'(?:under|less than|below|<|over|more than|greater than|>)\s*\$?(\d+(?:\.\d+)?)', msg_low)
            is_under = any(w in msg_low for w in ["under", "less", "below", "<"])
            op = "<" if is_under else ">"
            
            if price_match:
                val = float(price_match.group(1))
                sql = f"""SELECT `Type`, COUNT(*) AS count, ROUND(AVG(`Revenue`), 2) AS avg_price
FROM {table_name}
WHERE `Revenue` {op} {val}
GROUP BY `Type`
ORDER BY `Type`;"""
            elif "standard dev" in msg_low or "variance" in msg_low:
                sql = f"SELECT `Type`, ROUND(STDDEV(`Revenue`), 2) AS std_dev, ROUND(AVG(`Revenue`), 2) AS avg_price FROM {table_name} GROUP BY `Type`;"
            else:
                sql = f"SELECT `Type`, COUNT(*) AS count, ROUND(AVG(`Revenue`), 2) AS avg_price FROM {table_name} GROUP BY `Type`;"

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Running SQL: {sql}'})}\n\n"
        await asyncio.sleep(0.1)

        query_res = gcp_service.execute_query(sql)
        rows = query_res.get("rows", [])

        yield f"data: {json.dumps({'type': 'THOUGHT', 'content': f'Database returned {len(rows)} verified records. Formulating answer...'})}\n\n"
        await asyncio.sleep(0.08)

        table_lines = []
        bullets = []
        if rows:
            cols = list(rows[0].keys())
            header = "| " + " | ".join(c.replace('_', ' ').title() for c in cols) + " |"
            sep = "| " + " | ".join([":---"] * len(cols)) + " |"
            table_lines.extend([header, sep])
            for r in rows:
                row_str = "| " + " | ".join(str(r.get(c)) for c in cols) + " |"
                table_lines.append(row_str)
                type_val = r.get("Type") or "Package"
                val = r.get(cols[1]) if len(cols) > 1 else ""
                bullets.append(f"- **{type_val}**: {val}")

        response_text = (
            f"### Analysis Results\n\n"
            f"Queried from `{table_name}`:\n\n" +
            "\n".join(bullets) + "\n\n" +
            "\n".join(table_lines)
        )

        yield f"data: {json.dumps({'type': 'FINAL_RESPONSE', 'content': response_text})}\n\n"
        await asyncio.sleep(0.05)
        yield f"data: {json.dumps({'type': 'SQL_QUERY', 'sql': sql})}\n\n"
        await asyncio.sleep(0.04)
        yield f"data: {json.dumps({'type': 'DONE'})}\n\n"

gemini_service = GeminiService()
