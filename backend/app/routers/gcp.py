from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.gcp_service import gcp_service
from app.config import settings

router = APIRouter(prefix="/api/gcp", tags=["GCP"])

class GCPConfigUpdate(BaseModel):
    project_id: Optional[str] = None
    dataset_id: Optional[str] = None
    region: Optional[str] = None
    gemini_api_key: Optional[str] = None
    demo_mode: Optional[bool] = None

@router.get("/status")
def get_gcp_status():
    """Returns current GCP connection and configuration state."""
    return gcp_service.get_status()

@router.post("/config")
def update_gcp_config(payload: GCPConfigUpdate):
    """Updates runtime GCP project, dataset, and demo mode settings."""
    if payload.project_id is not None:
        settings.GCP_PROJECT_ID = payload.project_id
    if payload.dataset_id is not None:
        settings.BQ_DATASET_ID = payload.dataset_id
    if payload.region is not None:
        settings.GCP_REGION = payload.region
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key
    if payload.demo_mode is not None:
        settings.DEMO_MODE = payload.demo_mode

    # Reset client cache so new settings take effect
    gcp_service._bq_client = None
    return {
        "success": True,
        "message": "GCP configuration updated successfully",
        "status": gcp_service.get_status()
    }
