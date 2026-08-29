from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.dashboard_generator_service import dashboard_generator_service

router = APIRouter(prefix="/api/dashboards", tags=["Dynamic Text-to-Dashboard"])

class GenerateDashboardPayload(BaseModel):
    prompt: str

@router.get("")
def list_dashboards():
    """Lists all available dynamic and pre-built dashboards."""
    return {"dashboards": dashboard_generator_service.list_dashboards()}

@router.get("/{dashboard_id}")
def get_dashboard(dashboard_id: str):
    """Retrieves a specific dashboard by ID."""
    dash = dashboard_generator_service.get_dashboard(dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dash

@router.post("/generate")
def generate_dashboard(payload: GenerateDashboardPayload):
    """Generates a complete new dashboard with ECharts visuals from a natural language prompt."""
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    generated = dashboard_generator_service.generate_from_prompt(payload.prompt)
    saved = dashboard_generator_service.save_dashboard(generated)
    return {"success": True, "dashboard": saved}

@router.delete("/{dashboard_id}")
def delete_dashboard(dashboard_id: str):
    """Deletes a custom dynamic dashboard."""
    success = dashboard_generator_service.delete_dashboard(dashboard_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete default dashboard or dashboard not found")
    return {"success": True, "message": "Dashboard deleted"}
