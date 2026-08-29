from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.ml_models_service import ml_models_service

router = APIRouter(prefix="/api/models", tags=["GCP AI/ML Models"])

class RunModelPayload(BaseModel):
    model_id: str
    parameters: Optional[Dict[str, Any]] = {}

@router.get("/list")
def list_models():
    """Lists available BigQuery ML and Vertex AI models."""
    return {"models": ml_models_service.list_available_models()}

@router.post("/run")
def run_model(payload: RunModelPayload):
    """Executes a GCP AI/ML model with provided parameters."""
    return ml_models_service.run_model(
        model_id=payload.model_id,
        parameters=payload.parameters
    )
