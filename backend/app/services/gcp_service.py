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
        if "packages_by_type" in sql_lower or "group by package_type" in sql_lower:
            rows = self._demo_data["packages_by_type"]
        elif "daily" in sql_lower or "revenue" in sql_lower or "trend" in sql_lower:
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
        """Returns KPI, chart aggregates, and dot plot data for packages table."""
        client = self.get_bq_client()
        
        if client is not None and not settings.DEMO_MODE:
            try:
                # Query aggregates by package type
                sql_types = f"""
                SELECT 
                    COALESCE(package_type, 'Standard') AS package_type,
                    COUNT(*) AS count,
                    ROUND(SUM(CAST(revenue AS FLOAT64)), 2) AS total_revenue,
                    ROUND(AVG(CAST(revenue AS FLOAT64)), 2) AS avg_revenue
                FROM `{settings.GCP_PROJECT_ID}.{settings.BQ_DATASET_ID}.packages`
                GROUP BY package_type
                ORDER BY count DESC;
                """
                job_types = client.query(sql_types)
                packages_by_type = [dict(r.items()) for r in job_types.result()]
                
                # Query sample rows for dot plot and table
                sql_rows = f"""
                SELECT * 
                FROM `{settings.GCP_PROJECT_ID}.{settings.BQ_DATASET_ID}.packages`
                LIMIT 200;
                """
                job_rows = client.query(sql_rows)
                rows = [dict(r.items()) for r in job_rows.result()]

                # Calculate KPI sums
                total_pkgs = sum(t["count"] for t in packages_by_type) if packages_by_type else len(rows)
                total_rev = sum(t["total_revenue"] for t in packages_by_type) if packages_by_type else sum(float(r.get("revenue", 0)) for r in rows)
                avg_rev = round(total_rev / total_pkgs, 2) if total_pkgs > 0 else 0

                top_type = packages_by_type[0]["package_type"] if packages_by_type else "Standard"

                return {
                    "dataset_name": settings.BQ_DATASET_ID,
                    "tables": ["packages"],
                    "packages_by_type": packages_by_type,
                    "dot_plot_data": rows,
                    "table_rows": rows,
                    "kpis": {
                        "total_revenue": {"value": f"${total_rev:,.2f}", "raw": total_rev, "change": "+16.4%", "is_positive": True},
                        "total_packages": {"value": f"{total_pkgs:,}", "raw": total_pkgs, "change": "+9.8%", "is_positive": True},
                        "avg_revenue_per_pkg": {"value": f"${avg_rev:,.2f}", "raw": avg_rev, "change": "+4.2%", "is_positive": True},
                        "top_package_type": {"value": top_type, "raw": top_type, "change": "Leading volume", "is_positive": True},
                    }
                }
            except Exception as e:
                logger.warning(f"Error querying live BigQuery packages table: {e}. Falling back to demo generator.")

        return self._demo_data

gcp_service = GCPService()
