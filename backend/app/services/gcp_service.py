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
            "available_tables": ["packages"] if not is_live else self.list_tables()
        }

    def list_tables(self) -> List[str]:
        """Lists available tables in the configured BigQuery dataset."""
        client = self.get_bq_client()
        if client is None:
            return ["packages"]
        
        try:
            dataset_ref = client.dataset(settings.BQ_DATASET_ID)
            tables = list(client.list_tables(dataset_ref))
            return [t.table_id for t in tables]
        except Exception as e:
            logger.error(f"Error listing BigQuery tables: {e}")
            return ["packages"]

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
        if "package_type" in sql_lower or "group by" in sql_lower:
            rows = self._demo_data["packages_by_type"]
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
        """
        Dynamically inspects and queries tribal-datum-507019-m0.uploadeddataset.packages.
        Automatically detects column names and extracts ONLY the exact package types present.
        """
        client = self.get_bq_client()
        
        if client is not None:
            try:
                table_id = f"`{settings.GCP_PROJECT_ID}.{settings.BQ_DATASET_ID}.packages`"
                logger.info(f"Querying live BigQuery table: {table_id}")
                
                # Fetch records to inspect columns and rows
                query_sql = f"SELECT * FROM {table_id} LIMIT 1000"
                query_job = client.query(query_sql)
                raw_rows = [dict(r.items()) for r in query_job.result()]
                
                if raw_rows:
                    first_row = raw_rows[0]
                    cols = list(first_row.keys())
                    
                    # 1. Identify package_type column
                    type_col = None
                    for c in cols:
                        c_lower = c.lower()
                        if 'type' in c_lower or 'category' in c_lower:
                            type_col = c
                            break
                    if not type_col:
                        # Fallback to first text column
                        for c in cols:
                            if isinstance(first_row[c], str) and 'id' not in c.lower():
                                type_col = c
                                break
                    if not type_col:
                        type_col = cols[0]

                    # 2. Identify revenue column
                    rev_col = None
                    for c in cols:
                        c_lower = c.lower()
                        if any(k in c_lower for k in ['rev', 'amount', 'price', 'cost', 'val', 'total']):
                            rev_col = c
                            break
                    if not rev_col:
                        # Fallback to first numeric column
                        for c in cols:
                            if isinstance(first_row[c], (int, float)):
                                rev_col = c
                                break
                    if not rev_col:
                        rev_col = cols[1] if len(cols) > 1 else cols[0]

                    logger.info(f"Detected columns -> Package Type: '{type_col}', Revenue: '{rev_col}'")

                    # Normalize rows and calculate metrics strictly for the actual types present
                    type_groups = {}
                    normalized_rows = []

                    for r in raw_rows:
                        raw_type = str(r.get(type_col) or 'Unknown').strip()
                        raw_rev = 0.0
                        try:
                            raw_rev = float(r.get(rev_col) or 0.0)
                        except (ValueError, TypeError):
                            raw_rev = 0.0

                        if raw_type not in type_groups:
                            type_groups[raw_type] = {"count": 0, "total_revenue": 0.0}

                        type_groups[raw_type]["count"] += 1
                        type_groups[raw_type]["total_revenue"] += raw_rev

                        normalized_row = {
                            **r,
                            "package_type": raw_type,
                            "revenue": raw_rev,
                            "id": str(r.get("package_id") or r.get("id") or f"PKG-{len(normalized_rows) + 1}")
                        }
                        normalized_rows.append(normalized_row)

                    # Build packages_by_type strictly from discovered types
                    packages_by_type = [
                        {
                            "package_type": p_type,
                            "count": stats["count"],
                            "total_revenue": round(stats["total_revenue"], 2),
                            "avg_revenue": round(stats["total_revenue"] / stats["count"], 2) if stats["count"] > 0 else 0
                        }
                        for p_type, stats in sorted(type_groups.items(), key=lambda x: x[1]["count"], reverse=True)
                    ]

                    total_pkgs = sum(p["count"] for p in packages_by_type)
                    total_rev = sum(p["total_revenue"] for p in packages_by_type)
                    avg_rev = round(total_rev / total_pkgs, 2) if total_pkgs > 0 else 0
                    top_type = packages_by_type[0]["package_type"] if packages_by_type else "None"

                    return {
                        "dataset_name": settings.BQ_DATASET_ID,
                        "tables": ["packages"],
                        "packages_by_type": packages_by_type,
                        "dot_plot_data": normalized_rows,
                        "table_rows": normalized_rows,
                        "kpis": {
                            "total_revenue": {"value": f"${total_rev:,.2f}", "raw": total_rev, "change": "Live BigQuery", "is_positive": True},
                            "total_packages": {"value": f"{total_pkgs:,}", "raw": total_pkgs, "change": f"{len(packages_by_type)} Types", "is_positive": True},
                            "avg_revenue_per_pkg": {"value": f"${avg_rev:,.2f}", "raw": avg_rev, "change": "Average / Pkg", "is_positive": True},
                            "top_package_type": {"value": top_type, "raw": top_type, "change": "Leading Category", "is_positive": True},
                        }
                    }

            except Exception as e:
                logger.error(f"Error querying live BigQuery packages table: {e}", exc_info=True)

        return self._demo_data

gcp_service = GCPService()
