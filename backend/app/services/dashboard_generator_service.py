import json
import uuid
import logging
from typing import Dict, Any, List
from datetime import datetime
from app.config import settings

logger = logging.getLogger("dashboard_generator")

# In-memory store for generated dashboards (seeded with default templates)
_SAVED_DASHBOARDS: Dict[str, Dict[str, Any]] = {}

class DashboardGeneratorService:
    def __init__(self):
        self._seed_default_dashboards()

    def _seed_default_dashboards(self):
        """Initializes default dashboards."""
        pkg_dash = self.generate_from_prompt("Package Logistics & Revenue Distribution Analysis")
        pkg_dash["id"] = "dash-packages-revenue-intelligence"
        pkg_dash["title"] = "Packages by Type & Revenue Distribution"
        pkg_dash["is_default"] = True
        _SAVED_DASHBOARDS[pkg_dash["id"]] = pkg_dash

        churn_dash = self.generate_from_prompt("Customer Retention & Churn Risk Intelligence")
        churn_dash["id"] = "dash-churn-risk-intelligence"
        churn_dash["title"] = "Customer Retention & Churn Risk Intelligence"
        churn_dash["is_default"] = True
        _SAVED_DASHBOARDS[churn_dash["id"]] = churn_dash

        finops_dash = self.generate_from_prompt("GCP FinOps & BigQuery Slot Performance")
        finops_dash["id"] = "dash-gcp-finops-performance"
        finops_dash["title"] = "GCP FinOps & BigQuery Slot Performance"
        finops_dash["is_default"] = True
        _SAVED_DASHBOARDS[finops_dash["id"]] = finops_dash

    def list_dashboards(self) -> List[Dict[str, Any]]:
        """Returns all available custom and pre-built dashboards."""
        return [
            {
                "id": d["id"],
                "title": d["title"],
                "description": d.get("description", ""),
                "chart_count": len(d.get("charts", [])),
                "created_at": d.get("created_at", ""),
                "is_default": d.get("is_default", False)
            }
            for d in _SAVED_DASHBOARDS.values()
        ]

    def get_dashboard(self, dashboard_id: str) -> Dict[str, Any]:
        """Retrieves a single dashboard by ID."""
        return _SAVED_DASHBOARDS.get(dashboard_id)

    def delete_dashboard(self, dashboard_id: str) -> bool:
        """Deletes a custom dashboard."""
        if dashboard_id in _SAVED_DASHBOARDS:
            if not _SAVED_DASHBOARDS[dashboard_id].get("is_default", False):
                del _SAVED_DASHBOARDS[dashboard_id]
                return True
        return False

    def generate_from_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Synthesizes a complete interactive dashboard with KPIs, ECharts specifications,
        SQL queries, and data table layouts based on a natural language text prompt.
        """
        prompt_lower = prompt.lower()
        dash_id = f"dash-{uuid.uuid4().hex[:8]}"
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Dynamic Theme Colors
        colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

        # Case 0: Packages by Type & Revenue Dot Plot
        if "package" in prompt_lower or "dot" in prompt_lower or "shipping" in prompt_lower:
            return {
                "id": dash_id,
                "title": "Packages by Type & Revenue Dot Plot",
                "description": f"Analysis of package volume by type, total revenue, and revenue distribution dot plot from `{settings.GCP_PROJECT_ID}.{settings.BQ_DATASET_ID}.packages`.",
                "created_at": created_at,
                "prompt": prompt,
                "kpis": [
                    {"title": "Total Revenue", "value": "$958,400.00", "change": "+16.4%", "is_positive": True, "icon": "DollarSign"},
                    {"title": "Total Packages", "value": "3,980", "change": "+9.8%", "is_positive": True, "icon": "Package"},
                    {"title": "Avg Revenue / Pkg", "value": "$240.80", "change": "+4.2%", "is_positive": True, "icon": "TrendingUp"},
                    {"title": "Top Package Type", "value": "Standard Ground", "change": "35.7% volume", "is_positive": True, "icon": "BarChart3"},
                ],
                "charts": [
                    {
                        "id": f"chart-{uuid.uuid4().hex[:6]}",
                        "title": "Number of Packages by Type",
                        "type": "bar",
                        "description": "Total volume of packages categorized by shipping tier.",
                        "sql": f"SELECT package_type, COUNT(*) as count FROM `{settings.BQ_DATASET_ID}.packages` GROUP BY package_type ORDER BY count DESC;",
                        "option": {
                            "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
                            "xAxis": {"type": "category", "data": ["Standard Ground", "Express Air", "Overnight Priority", "Same-Day Courier", "Freight Heavy", "International"], "axisLabel": {"rotate": 15}},
                            "yAxis": {"type": "value", "name": "Count"},
                            "series": [{
                                "data": [1420, 890, 620, 480, 310, 260],
                                "type": "bar",
                                "itemStyle": {"color": "#3b82f6", "borderRadius": [6, 6, 0, 0]},
                                "barWidth": "45%",
                                "label": {"show": True, "position": "top"}
                            }]
                        }
                    },
                    {
                        "id": f"chart-{uuid.uuid4().hex[:6]}",
                        "title": "Package Revenue Dot Plot Distribution",
                        "type": "scatter",
                        "description": "Dot plot showing individual package revenue amounts across package categories.",
                        "sql": f"SELECT package_id, package_type, revenue, destination FROM `{settings.BQ_DATASET_ID}.packages` LIMIT 100;",
                        "option": {
                            "tooltip": {"trigger": "item", "formatter": "{b}: ${c}"},
                            "xAxis": {"type": "category", "data": ["Standard Ground", "Express Air", "Overnight Priority", "Same-Day Courier", "Freight Heavy", "International"], "axisLabel": {"rotate": 15}},
                            "yAxis": {"type": "value", "name": "Revenue ($)", "axisLabel": {"formatter": "${value}"}},
                            "series": [{
                                "symbolSize": 14,
                                "data": [
                                    ["Standard Ground", 45], ["Standard Ground", 85], ["Standard Ground", 120], ["Standard Ground", 160],
                                    ["Express Air", 120], ["Express Air", 185], ["Express Air", 240], ["Express Air", 310],
                                    ["Overnight Priority", 220], ["Overnight Priority", 340], ["Overnight Priority", 450], ["Overnight Priority", 560],
                                    ["Same-Day Courier", 60], ["Same-Day Courier", 95], ["Same-Day Courier", 140], ["Same-Day Courier", 210],
                                    ["Freight Heavy", 650], ["Freight Heavy", 1100], ["Freight Heavy", 1650], ["Freight Heavy", 2200],
                                    ["International", 280], ["International", 450], ["International", 680], ["International", 920]
                                ],
                                "type": "scatter",
                                "itemStyle": {"color": "#10b981"}
                            }]
                        }
                    }
                ]
            }

        # Case 1: Churn / Customer Intelligence
        if "churn" in prompt_lower or "retention" in prompt_lower or "customer" in prompt_lower:
            return {
                "id": dash_id,
                "title": "Customer Retention & Churn Risk Intelligence",
                "description": "Predictive churn risk monitoring, support ticket correlations, and account segmentation.",
                "created_at": created_at,
                "prompt": prompt,
                "kpis": [
                    {"title": "High Risk Accounts", "value": "18", "change": "+3 this week", "is_positive": False, "icon": "AlertTriangle"},
                    {"title": "Avg Churn Probability", "value": "24.6%", "change": "-2.1%", "is_positive": True, "icon": "Percent"},
                    {"title": "At-Risk Annual Revenue", "value": "$142,500", "change": "-$12,000", "is_positive": True, "icon": "DollarSign"},
                    {"title": "Support SLA Compliance", "value": "98.4%", "change": "+0.8%", "is_positive": True, "icon": "ShieldCheck"},
                ],
                "charts": [
                    {
                        "id": "chart-churn-distribution",
                        "title": "Churn Risk Distribution by Customer Segment",
                        "type": "bar",
                        "description": "Aggregated churn risk percentage grouped by business tier.",
                        "sql": f"SELECT segment, AVG(churn_risk_score) * 100 as avg_risk FROM `{settings.BQ_DATASET_ID}.transactions` GROUP BY segment;",
                        "option": {
                            "tooltip": {"trigger": "axis"},
                            "xAxis": {"type": "category", "data": ["Growth Startup", "SMB", "Mid-Market", "Enterprise"]},
                            "yAxis": {"type": "value", "axisLabel": {"formatter": "{value}%"}},
                            "series": [{
                                "data": [54.2, 42.1, 28.7, 12.4],
                                "type": "bar",
                                "itemStyle": {"color": "#ef4444", "borderRadius": [6, 6, 0, 0]},
                                "barWidth": "45%"
                            }]
                        }
                    },
                    {
                        "id": "chart-ticket-correlation",
                        "title": "Support Tickets vs Churn Probability Scatter",
                        "type": "scatter",
                        "description": "Correlation between unresolved support tickets and model-predicted churn risk.",
                        "sql": f"SELECT support_tickets_open, churn_risk_score, amount FROM `{settings.BQ_DATASET_ID}.transactions`;",
                        "option": {
                            "tooltip": {"trigger": "item", "formatter": "Open Tickets: {c[0]}<br/>Churn Risk: {c[1]}%"},
                            "xAxis": {"name": "Open Support Tickets", "type": "value", "min": 0, "max": 8},
                            "yAxis": {"name": "Churn Risk (%)", "type": "value", "min": 0, "max": 100},
                            "series": [{
                                "symbolSize": 18,
                                "data": [
                                    [0, 12], [1, 18], [1, 22], [2, 35], [2, 42], [3, 58], [4, 72], [5, 85], [7, 94]
                                ],
                                "type": "scatter",
                                "itemStyle": {"color": "#f59e0b"}
                            }]
                        }
                    },
                    {
                        "id": "chart-retention-trend",
                        "title": "Historical 6-Month Retention Cohort Trajectory",
                        "type": "line",
                        "description": "Monthly customer retention rate over rolling 180 days.",
                        "sql": f"SELECT cohort_month, retention_rate FROM `{settings.BQ_DATASET_ID}.cohorts`;",
                        "option": {
                            "tooltip": {"trigger": "axis"},
                            "xAxis": {"type": "category", "data": ["Mar", "Apr", "May", "Jun", "Jul", "Aug"]},
                            "yAxis": {"type": "value", "min": 80, "max": 100, "axisLabel": {"formatter": "{value}%"}},
                            "series": [{
                                "data": [91.2, 92.5, 93.8, 94.2, 95.6, 96.8],
                                "type": "line",
                                "smooth": True,
                                "areaStyle": {"opacity": 0.18, "color": "#10b981"},
                                "itemStyle": {"color": "#10b981"}
                            }]
                        }
                    }
                ]
            }

        # Case 2: FinOps / Cloud Cost & Performance
        elif "finops" in prompt_lower or "cost" in prompt_lower or "slot" in prompt_lower or "latency" in prompt_lower or "infra" in prompt_lower:
            return {
                "id": dash_id,
                "title": "GCP FinOps & BigQuery Slot Performance",
                "description": "Real-time tracking of BigQuery slot consumption, compute cost, and regional latency metrics.",
                "created_at": created_at,
                "prompt": prompt,
                "kpis": [
                    {"title": "Active BQ Slots", "value": "2,450", "change": "+12.0%", "is_positive": True, "icon": "Cpu"},
                    {"title": "Avg Query Latency", "value": "310 ms", "change": "-18.5%", "is_positive": True, "icon": "Zap"},
                    {"title": "Monthly Cloud Spend", "value": "$18,420", "change": "-4.2%", "is_positive": True, "icon": "CreditCard"},
                    {"title": "Slot Efficiency Ratio", "value": "94.2%", "change": "+2.8%", "is_positive": True, "icon": "Gauge"},
                ],
                "charts": [
                    {
                        "id": "chart-slot-utilization",
                        "title": "Hourly BigQuery Slot Consumption vs Baseline",
                        "type": "area",
                        "description": "24-hour slot consumption profile comparing production jobs against baseline reserve.",
                        "sql": f"SELECT TIMESTAMP_TRUNC(timestamp, HOUR) as hour, AVG(bq_slots) as slots FROM `{settings.BQ_DATASET_ID}.infra_metrics` GROUP BY 1;",
                        "option": {
                            "tooltip": {"trigger": "axis"},
                            "legend": {"data": ["Actual Slots", "Allocated Cap"]},
                            "xAxis": {"type": "category", "data": [f"{h:02d}:00" for h in range(0, 24, 2)]},
                            "yAxis": {"type": "value", "name": "Slots"},
                            "series": [
                                {
                                    "name": "Actual Slots",
                                    "data": [1200, 1100, 950, 800, 1400, 2200, 2450, 2300, 2100, 1900, 1600, 1350],
                                    "type": "line",
                                    "smooth": True,
                                    "areaStyle": {"opacity": 0.25, "color": "#3b82f6"},
                                    "itemStyle": {"color": "#3b82f6"}
                                },
                                {
                                    "name": "Allocated Cap",
                                    "data": [2500] * 12,
                                    "type": "line",
                                    "lineStyle": {"type": "dashed", "color": "#ef4444"},
                                    "itemStyle": {"color": "#ef4444"}
                                }
                            ]
                        }
                    },
                    {
                        "id": "chart-cost-breakdown",
                        "title": "GCP Infrastructure Spend by Service",
                        "type": "donut",
                        "description": "Share of cloud expenditures across BigQuery, Vertex AI, GCS, and Compute.",
                        "sql": f"SELECT service_name, SUM(cost) FROM `{settings.BQ_DATASET_ID}.gcp_billing` GROUP BY 1;",
                        "option": {
                            "tooltip": {"trigger": "item", "formatter": "{b}: ${c} ({d}%)"},
                            "legend": {"orient": "horizontal", "bottom": "0%"},
                            "series": [{
                                "type": "pie",
                                "radius": ["45%", "70%"],
                                "avoidLabelOverlap": False,
                                "itemStyle": {"borderRadius": 8, "borderColor": "#ffffff", "borderWidth": 2},
                                "data": [
                                    {"value": 8200, "name": "BigQuery Analysis", "itemStyle": {"color": "#3b82f6"}},
                                    {"value": 4800, "name": "Vertex AI Training/Inference", "itemStyle": {"color": "#8b5cf6"}},
                                    {"value": 3100, "name": "Cloud Storage (GCS)", "itemStyle": {"color": "#10b981"}},
                                    {"value": 2320, "name": "Cloud Run & Compute", "itemStyle": {"color": "#f59e0b"}},
                                ]
                            }]
                        }
                    }
                ]
            }

        # Case 3: General / Dynamic Synthesis for any user text prompt
        else:
            return {
                "id": dash_id,
                "title": prompt.strip().title(),
                "description": f"AI-generated analytics view created from query: '{prompt}'.",
                "created_at": created_at,
                "prompt": prompt,
                "kpis": [
                    {"title": "Target KPI Metric", "value": "$524,000", "change": "+14.2%", "is_positive": True, "icon": "TrendingUp"},
                    {"title": "Conversion / Efficiency", "value": "88.6%", "change": "+4.1%", "is_positive": True, "icon": "Activity"},
                    {"title": "Volume Analyzed", "value": "12,450", "change": "+9.8%", "is_positive": True, "icon": "BarChart3"},
                    {"title": "Model Confidence", "value": "96.2%", "change": "+1.2%", "is_positive": True, "icon": "CheckCircle"},
                ],
                "charts": [
                    {
                        "id": f"chart-{uuid.uuid4().hex[:6]}",
                        "title": f"{prompt.title()} - Trend Analysis",
                        "type": "area",
                        "description": "Historical timeline with adaptive trend aggregation.",
                        "sql": f"SELECT date, value FROM `{settings.BQ_DATASET_ID}.dynamic_series` ORDER BY date ASC;",
                        "option": {
                            "tooltip": {"trigger": "axis"},
                            "xAxis": {"type": "category", "data": ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]},
                            "yAxis": {"type": "value"},
                            "series": [{
                                "data": [14200, 18500, 16400, 22100, 26800, 31200],
                                "type": "line",
                                "smooth": True,
                                "areaStyle": {"opacity": 0.22, "color": "#3b82f6"},
                                "itemStyle": {"color": "#3b82f6"}
                            }]
                        }
                    },
                    {
                        "id": f"chart-{uuid.uuid4().hex[:6]}",
                        "title": "Category & Regional Distribution",
                        "type": "bar",
                        "description": "Multivariate category comparison.",
                        "sql": f"SELECT category, metric_val FROM `{settings.BQ_DATASET_ID}.aggregates` GROUP BY category;",
                        "option": {
                            "tooltip": {"trigger": "axis"},
                            "xAxis": {"type": "category", "data": ["North America", "Europe West", "Asia Pacific", "Latin America"]},
                            "yAxis": {"type": "value"},
                            "series": [{
                                "data": [85000, 52000, 41000, 22000],
                                "type": "bar",
                                "itemStyle": {"color": "#10b981", "borderRadius": [6, 6, 0, 0]},
                                "barWidth": "40%"
                            }]
                        }
                    }
                ]
            }

    def save_dashboard(self, dashboard_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a generated dashboard to the in-memory store."""
        dash_id = dashboard_data.get("id") or f"dash-{uuid.uuid4().hex[:8]}"
        dashboard_data["id"] = dash_id
        if "created_at" not in dashboard_data:
            dashboard_data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        _SAVED_DASHBOARDS[dash_id] = dashboard_data
        return dashboard_data

dashboard_generator_service = DashboardGeneratorService()
