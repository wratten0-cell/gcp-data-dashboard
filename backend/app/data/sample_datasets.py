import math
import random
from datetime import datetime, timedelta

def generate_package_data():
    base_date = datetime.now() - timedelta(days=60)
    package_types = [
        "Ground Advantage",
        "Priority Mail"
    ]
    
    destinations = [
        "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", 
        "Seattle, WA", "Atlanta, GA"
    ]

    # Real USPS Package types from tribal-datum-507019-m0.uploadeddataset.packages
    type_profiles = {
        "Ground Advantage": {"count": 60, "min_rev": 6.80, "max_rev": 12.50, "avg_rev": 9.53, "avg_weight": 0.8},
        "Priority Mail": {"count": 40, "min_rev": 7.50, "max_rev": 14.20, "avg_rev": 9.98, "avg_weight": 1.4},
    }

    packages_by_type = []
    dot_plot_data = []
    table_rows = []
    
    total_revenue = 0.0
    total_packages = 0

    # Generate aggregates per type
    for p_type, prof in type_profiles.items():
        type_count = prof["count"]
        # Generate revenue sum
        type_rev = 0.0
        
        # Sample points for dot plot
        sample_size = min(40, type_count)
        for i in range(sample_size):
            rev = round(random.uniform(prof["min_rev"], prof["max_rev"]), 2)
            type_rev += rev * (type_count / sample_size)
            weight = round(max(0.5, random.gauss(prof["avg_weight"], prof["avg_weight"] * 0.3)), 1)
            pkg_id = f"PKG-{p_type[:3].upper()}-{1000 + len(dot_plot_data)}"
            dest = random.choice(destinations)
            status = random.choice(["Delivered", "Delivered", "In Transit", "Out for Delivery", "Delayed"])
            
            # Format for ECharts Dot Plot: [x_category_index, revenue, package_id, weight, destination, status]
            dot_plot_data.append({
                "package_type": p_type,
                "revenue": rev,
                "package_id": pkg_id,
                "weight_kg": weight,
                "destination": dest,
                "status": status,
                "timestamp": (datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M")
            })

        type_rev = round(type_rev, 2)
        total_revenue += type_rev
        total_packages += type_count

        packages_by_type.append({
            "package_type": p_type,
            "count": type_count,
            "total_revenue": type_rev,
            "avg_revenue": round(type_rev / type_count, 2)
        })

    # Prepare table rows
    table_rows = dot_plot_data.copy()
    random.shuffle(table_rows)

    avg_rev_per_pkg = round(total_revenue / total_packages, 2)

    # 30-day timeline trend
    daily_trends = []
    for day in range(30):
        d_str = (base_date + timedelta(days=day + 30)).strftime("%Y-%m-%d")
        daily_rev = round(total_revenue / 30 * random.uniform(0.85, 1.25), 2)
        daily_pkgs = int(total_packages / 30 * random.uniform(0.85, 1.25))
        daily_trends.append({
            "date": d_str,
            "revenue": daily_rev,
            "packages_count": daily_pkgs,
        })

    return {
        "dataset_name": "uploadeddataset",
        "tables": ["packages"],
        "packages_by_type": packages_by_type,
        "dot_plot_data": dot_plot_data,
        "table_rows": table_rows,
        "daily_trends": daily_trends,
        "kpis": {
            "total_revenue": {"value": f"${total_revenue:,.2f}", "raw": total_revenue, "change": "+16.4%", "is_positive": True},
            "total_packages": {"value": f"{total_packages:,}", "raw": total_packages, "change": "+9.8%", "is_positive": True},
            "avg_revenue_per_pkg": {"value": f"${avg_rev_per_pkg:,.2f}", "raw": avg_rev_per_pkg, "change": "+4.2%", "is_positive": True},
            "top_package_type": {"value": "Standard Ground", "raw": 1420, "change": "35.7% share", "is_positive": True},
        }
    }

def generate_forecast_sample(horizon_days=30):
    base_date = datetime.now()
    forecast_results = []
    base_val = 31500.0
    
    for i in range(1, horizon_days + 1):
        future_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        growth = (1 + (i / 100.0))
        seasonal = 1.10 if (base_date + timedelta(days=i)).weekday() < 5 else 0.80
        val = base_val * growth * seasonal + random.uniform(-600, 800)
        
        uncertainty = 1600 * math.sqrt(i / 5.0)
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
        metric_val = 135 + random.uniform(-15, 20)
        is_anom = False
        severity = "NORMAL"
        prob = 0.04
        
        if day in (18, 44):
            is_anom = True
            if day == 18:
                metric_val = 310
                severity = "HIGH_VOLUME_SPIKE"
                prob = 0.97
            else:
                metric_val = 25
                severity = "WEATHER_DELIVERY_DROP"
                prob = 0.92
                
        anomalies.append({
            "timestamp": d,
            "actual_value": round(metric_val, 2),
            "expected_value": 135.0,
            "is_anomaly": is_anom,
            "anomaly_probability": prob,
            "severity": severity,
            "metric_name": "daily_packages_processed"
        })
    return anomalies

def generate_key_drivers_sample():
    return [
        {"feature": "package_weight_kg", "importance_score": 0.42, "direction": "Positive Revenue Driver (Heavier Weight)", "relative_impact": 96},
        {"feature": "expedited_service_tier", "importance_score": 0.31, "direction": "Positive Revenue Driver (Express/Overnight)", "relative_impact": 82},
        {"feature": "distance_zone_miles", "importance_score": 0.16, "direction": "Positive Revenue Driver (Cross-Country)", "relative_impact": 48},
        {"feature": "fuel_surcharge_rate", "importance_score": 0.08, "direction": "Positive Surcharge Factor", "relative_impact": 26},
        {"feature": "signature_confirmation", "importance_score": 0.03, "direction": "Add-on Revenue Factor", "relative_impact": 12}
    ]
