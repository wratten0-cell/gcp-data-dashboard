import math
import random
from datetime import datetime, timedelta

def generate_ecommerce_data():
    base_date = datetime.now() - timedelta(days=90)
    records = []
    daily_revenue = []
    
    categories = ["Cloud Software", "Compute Nodes", "Enterprise Storage", "AI API Credits", "Networking Bandwidth"]
    regions = ["us-central1 (Iowa)", "us-east4 (N. Virginia)", "europe-west1 (Belgium)", "asia-east1 (Taiwan)"]
    segments = ["Enterprise", "Mid-Market", "SMB", "Growth Startup"]

    # Generate 90 days of time-series
    for day in range(90):
        current_date = base_date + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Base trend with weekly seasonality
        day_of_week = current_date.weekday()
        weekend_factor = 0.75 if day_of_week >= 5 else 1.15
        growth_trend = 1.0 + (day / 90.0) * 0.35  # 35% growth over 90 days
        base_val = 14500 * growth_trend * weekend_factor
        noise = random.uniform(-1200, 1500)
        
        # Inject occasional anomaly
        anomaly = False
        anomaly_score = 0.12
        if day in (42, 73):
            base_val *= 1.85
            anomaly = True
            anomaly_score = 0.94
        elif day == 61:
            base_val *= 0.45
            anomaly = True
            anomaly_score = 0.88
            
        revenue = round(base_val + noise, 2)
        transactions = int(revenue / random.uniform(85, 140))
        active_users = int(transactions * random.uniform(1.2, 1.8))
        conversion_rate = round(random.uniform(2.8, 4.6), 2)
        
        daily_revenue.append({
            "date": date_str,
            "revenue": revenue,
            "transactions": transactions,
            "active_users": active_users,
            "conversion_rate": conversion_rate,
            "is_anomaly": anomaly,
            "anomaly_score": anomaly_score
        })

    # Generate transaction level records for data table
    statuses = ["Completed", "Completed", "Completed", "Pending", "Processing", "Flagged"]
    customers = [
        ("Acme Corp", "Enterprise", "us-central1 (Iowa)"),
        ("Stripe Global", "Enterprise", "us-east4 (N. Virginia)"),
        ("Nova Dynamics", "Mid-Market", "europe-west1 (Belgium)"),
        ("Apex Cloudworks", "Growth Startup", "asia-east1 (Taiwan)"),
        ("Vortex Systems", "Enterprise", "us-east4 (N. Virginia)"),
        ("Beacon Analytics", "SMB", "us-central1 (Iowa)"),
        ("Crestline Media", "Mid-Market", "europe-west1 (Belgium)"),
        ("Pinnacle AI", "Growth Startup", "us-central1 (Iowa)"),
        ("Omni Retail Group", "Enterprise", "us-east4 (N. Virginia)"),
        ("Silverline Health", "Enterprise", "us-central1 (Iowa)"),
        ("Solstice Labs", "Growth Startup", "asia-east1 (Taiwan)"),
        ("Quantum Edge", "Mid-Market", "europe-west1 (Belgium)"),
        ("Horizon Logistics", "Enterprise", "us-east4 (N. Virginia)"),
        ("Atlas Logistics", "Mid-Market", "us-central1 (Iowa)"),
        ("Synergy Bio", "Enterprise", "europe-west1 (Belgium)"),
    ]

    for idx, (cust_name, segment, region) in enumerate(customers, start=1001):
        amount = round(random.uniform(1200, 48000), 2)
        churn_risk = round(random.uniform(0.05, 0.92), 2)
        status = random.choice(statuses)
        category = random.choice(categories)
        days_ago = random.randint(0, 14)
        tx_date = (datetime.now() - timedelta(days=days_ago, hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M")
        
        records.append({
            "id": f"TX-{idx}",
            "customer": cust_name,
            "segment": segment,
            "region": region,
            "category": category,
            "amount": amount,
            "churn_risk_score": churn_risk,
            "status": status,
            "timestamp": tx_date,
            "contract_months": random.choice([12, 24, 36]),
            "support_tickets_open": random.choice([0, 1, 2, 4, 7]),
            "sla_compliance_pct": round(random.uniform(94.5, 99.9), 1)
        })

    # Summary KPI stats
    total_rev = sum(d["revenue"] for d in daily_revenue)
    total_tx = sum(d["transactions"] for d in daily_revenue)
    avg_ticket = round(total_rev / total_tx, 2)
    avg_churn = round(sum(r["churn_risk_score"] for r in records) / len(records), 3)

    return {
        "dataset_name": "gcp_production_analytics",
        "tables": ["daily_kpis", "transactions", "customer_churn_features", "infra_utilization"],
        "daily_trends": daily_revenue,
        "table_rows": records,
        "kpis": {
            "total_revenue": {"value": f"${total_rev:,.0f}", "raw": total_rev, "change": "+14.8%", "is_positive": True},
            "total_transactions": {"value": f"{total_tx:,}", "raw": total_tx, "change": "+8.4%", "is_positive": True},
            "avg_order_value": {"value": f"${avg_ticket:,.2f}", "raw": avg_ticket, "change": "+5.2%", "is_positive": True},
            "avg_churn_risk": {"value": f"{avg_churn * 100:.1f}%", "raw": avg_churn, "change": "-3.1%", "is_positive": True},
            "active_gcp_slots": {"value": "2,450", "raw": 2450, "change": "+12.0%", "is_positive": True},
            "bq_query_latency": {"value": "310 ms", "raw": 310, "change": "-18.5%", "is_positive": True}
        },
        "category_breakdown": [
            {"category": "Cloud Software", "value": 412000, "share": 34.5},
            {"category": "Compute Nodes", "value": 298000, "share": 25.0},
            {"category": "AI API Credits", "value": 245000, "share": 20.5},
            {"category": "Enterprise Storage", "value": 142000, "share": 11.9},
            {"category": "Networking Bandwidth", "value": 96000, "share": 8.1},
        ],
        "region_distribution": [
            {"region": "us-central1", "revenue": 520000, "active_nodes": 140},
            {"region": "us-east4", "revenue": 385000, "active_nodes": 95},
            {"region": "europe-west1", "revenue": 210000, "active_nodes": 60},
            {"region": "asia-east1", "revenue": 178000, "active_nodes": 45},
        ]
    }

def generate_forecast_sample(horizon_days=30):
    base_date = datetime.now()
    forecast_results = []
    base_val = 19500.0
    
    for i in range(1, horizon_days + 1):
        future_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        growth = (1 + (i / 100.0))
        seasonal = 1.12 if (base_date + timedelta(days=i)).weekday() < 5 else 0.82
        val = base_val * growth * seasonal + random.uniform(-400, 600)
        
        # Uncertainty intervals widen as horizon increases
        uncertainty = 1200 * math.sqrt(i / 5.0)
        lower_bound = max(0, val - uncertainty)
        upper_bound = val + uncertainty
        
        forecast_results.append({
            "forecast_date": future_date,
            "prediction": round(val, 2),
            "lower_bound_80": round(lower_bound, 2),
            "upper_bound_80": round(upper_bound, 2),
            "lower_bound_95": round(max(0, val - uncertainty * 1.4), 2),
            "upper_bound_95": round(val + uncertainty * 1.4, 2),
            "trend_component": round(base_val * growth, 2)
        })
    return forecast_results

def generate_anomaly_sample():
    base_date = datetime.now() - timedelta(days=60)
    anomalies = []
    for day in range(60):
        d = (base_date + timedelta(days=day)).strftime("%Y-%m-%d")
        metric_val = 500 + random.uniform(-50, 60)
        is_anom = False
        severity = "NORMAL"
        prob = 0.05
        
        if day in (14, 38, 52):
            is_anom = True
            if day == 14:
                metric_val = 980
                severity = "HIGH"
                prob = 0.96
            elif day == 38:
                metric_val = 120
                severity = "CRITICAL_DROP"
                prob = 0.99
            else:
                metric_val = 860
                severity = "MEDIUM"
                prob = 0.84
                
        anomalies.append({
            "timestamp": d,
            "actual_value": round(metric_val, 2),
            "expected_value": 500.0,
            "is_anomaly": is_anom,
            "anomaly_probability": prob,
            "severity": severity,
            "metric_name": "bq_slot_consumption_per_min"
        })
    return anomalies

def generate_key_drivers_sample():
    return [
        {"feature": "contract_duration_months", "importance_score": 0.38, "direction": "Negative Churn (Retention Anchor)", "relative_impact": 94},
        {"feature": "open_support_tickets", "importance_score": 0.29, "direction": "Positive Churn Driver (Dissatisfaction)", "relative_impact": 76},
        {"feature": "monthly_slot_usage_growth", "importance_score": 0.18, "direction": "Negative Churn (High Engagement)", "relative_impact": 52},
        {"feature": "sla_breach_count", "importance_score": 0.11, "direction": "Positive Churn Driver", "relative_impact": 34},
        {"feature": "billing_dispute_history", "importance_score": 0.04, "direction": "Positive Churn Driver", "relative_impact": 18}
    ]
