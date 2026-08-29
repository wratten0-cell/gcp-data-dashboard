from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from sse_starlette.sse import EventSourceResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/chat", tags=["AI Chat & Natural Language"])

class ChatMessagePayload(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

@router.post("/stream")
async def chat_stream(payload: ChatMessagePayload):
    """
    Streams conversational data responses via Server-Sent Events (SSE).
    Emits THOUGHT, FINAL_RESPONSE, SQL_QUERY, and SUGGESTIONS events.
    """
    return EventSourceResponse(
        gemini_service.stream_chat(
            message=payload.message,
            history=payload.history
        ),
        media_type="text/event-stream"
    )
