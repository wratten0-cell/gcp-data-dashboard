import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.data.sample_datasets import generate_ecommerce_data

logger = logging.getLogger("gcp_service")

class GCPService:
    def __init__(self):
        self._bq_client = None
        self._demo_data = generate_ecommerce_data()

    def get_bq_client(self):
        """Initializes and returns Google Cloud BigQuery client if credentials exist."""
        if self._bq_client is not None:
            return self._bq_client
        
        if settings.DEMO_MODE:
            return None

        try:
            from google.cloud import bigquery
            self._bq_client = bigquery.Client(project=settings.GCP_PROJECT_ID)
            logger.info(f"Initialized BigQuery client for project {settings.GCP_PROJECT_ID}")
            return self._bq_client
        except Exception as e:
            logger.warning(f"Failed to initialize BigQuery client: {e}. Falling back to demo mode.")
            return None

    def get_status(self) -> Dict[str, Any]:
        """Returns the GCP connection and configuration status."""
        client = self.get_bq_client()
        is_live = client is not None and not settings.DEMO_MODE
        
        return {
            "mode": "live" if is_live else "demo",
            "project_id": settings.GCP_PROJECT_ID,
            "region": settings.GCP_REGION,
            "dataset_id": settings.BQ_DATASET_ID,
            "has_gemini_key": bool(settings.GEMINI_API_KEY),
            "authenticated": is_live,
            "available_tables": self._demo_data["tables"] if not is_live else self.list_tables()
        }

    def list_tables(self) -> List[str]:
        """Lists available tables in the configured BigQuery dataset."""
        client = self.get_bq_client()
        if client is None:
            return self._demo_data["tables"]
        
        try:
            dataset_ref = client.dataset(settings.BQ_DATASET_ID)
            tables = list(client.list_tables(dataset_ref))
            return [t.table_id for t in tables]
        except Exception as e:
            logger.error(f"Error listing BigQuery tables: {e}")
            return self._demo_data["tables"]

    def execute_query(self, sql_query: str, limit: int = 100) -> Dict[str, Any]:
        """Executes a SQL query against BigQuery or simulates against demo data."""
        client = self.get_bq_client()
        
        if client is not None:
            try:
                query_job = client.query(sql_query)
                results = query_job.result()
                
                rows = []
                schema_fields = [field.name for field in results.schema] if results.schema else []
                
                for row in results:
                    rows.append(dict(row.items()))
                    if len(rows) >= limit:
                        break
                        
                return {
                    "success": True,
                    "columns": schema_fields,
                    "rows": rows,
                    "row_count": len(rows),
                    "total_bytes_processed": query_job.total_bytes_processed or 0,
                    "execution_time_ms": query_job.timeline[-1].active_units if query_job.timeline else 240,
                    "mode": "live"
                }
            except Exception as e:
                logger.error(f"BigQuery query execution error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "columns": [],
                    "rows": [],
                    "mode": "live"
                }

        # Fallback Demo Data Query Simulation
        sql_lower = sql_query.lower()
        if "daily" in sql_lower or "revenue" in sql_lower or "trend" in sql_lower:
            rows = self._demo_data["daily_trends"]
        else:
            rows = self._demo_data["table_rows"]

        columns = list(rows[0].keys()) if rows else []
        return {
            "success": True,
            "columns": columns,
            "rows": rows[:limit],
            "row_count": len(rows[:limit]),
            "total_bytes_processed": 1048576,
            "execution_time_ms": 142,
            "mode": "demo"
        }

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Returns high-level KPI and chart data for the default overview dashboard."""
        return self._demo_data

gcp_service = GCPService()
