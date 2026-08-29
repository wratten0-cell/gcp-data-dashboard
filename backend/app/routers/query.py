from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.gcp_service import gcp_service

router = APIRouter(prefix="/api/data", tags=["Data & Query"])

class QueryRequest(BaseModel):
    sql: str
    limit: Optional[int] = 100

@router.get("/summary")
def get_dashboard_summary():
    """Returns overview KPI metrics and charts for default dashboard."""
    return gcp_service.get_dashboard_summary()

@router.post("/query")
def execute_sql_query(payload: QueryRequest):
    """Executes a custom SQL query against BigQuery or demo dataset."""
    return gcp_service.execute_query(sql_query=payload.sql, limit=payload.limit)

@router.get("/tables")
def list_dataset_tables():
    """Lists tables in the active BigQuery dataset."""
    return {"tables": gcp_service.list_tables()}
