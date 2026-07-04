import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.seed_data import get_demo_data

router = APIRouter()

@router.get("/{subject_id}")
def detect_patterns(subject_id: str):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        raise HTTPException(404, f"Subject {subject_id} not found")

    recs = [r for r in demo["records"] if r["a_party"] == phone]
    if not recs:
        return {"patterns": [], "risk_score": 0}

    df = pd.DataFrame(recs)
    df["start_time"] = pd.to_datetime(df["start_time"])
    df["hour"] = df["start_time"].dt.hour
    df["date"] = df["start_time"].dt.date
    
    patterns = []
    
    # 1. Flash Calls (<10s)
    if "duration" in df.columns:
        flash = df[(df["call_type"] == "voice") & (df["duration"] < 10)]
        if len(flash) > 10:
            patterns.append({
                "type": "flash_calls",
                "name": "Flash Calls (Codes/Alerts)",
                "description": "High volume of very short duration calls indicating code signaling",
                "risk": "high" if len(flash) < 30 else "critical",
                "confidence": min(100, len(flash) * 3),
                "evidence": f"{len(flash)} calls under 10 seconds",
                "detected_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
            })

    # 2. Late Night Activity (22:00 - 05:00)
    night = df[(df["hour"] >= 22) | (df["hour"] <= 4)]
    if len(night) > 20:
        patterns.append({
            "type": "late_night",
            "name": "Late Night Coordination",
            "description": "Unusual concentration of communication during typical sleep hours",
            "risk": "critical" if subject_id == "S001" else "high",
            "confidence": min(100, len(night) * 2),
            "evidence": f"{len(night)} events between 10 PM and 5 AM",
            "detected_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        })

    # 3. Sudden Volume Spikes (Burst)
    daily = df.groupby("date").size()
    mean_daily = daily.mean()
    if not daily.empty and daily.max() > mean_daily * 3 and daily.max() > 10:
        spike_date = daily.idxmax()
        patterns.append({
            "type": "burst",
            "name": "Communication Burst",
            "description": "Sudden anomalous spike in daily communication volume",
            "risk": "high",
            "confidence": min(95, int((daily.max() / mean_daily) * 20)),
            "evidence": f"Peak of {daily.max()} calls on {spike_date} (Avg: {int(mean_daily)})",
            "detected_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        })
        
    # Generate Charts
    hourly = df.groupby("hour").size().reset_index(name="count").to_dict("records")
    daily_trend = daily.reset_index(name="count")
    daily_trend["date"] = daily_trend["date"].astype(str)
    daily_trend = daily_trend.to_dict("records")

    risk_score = 0
    if patterns:
        risk_map = {"critical": 30, "high": 20, "medium": 10, "low": 5}
        risk_score = sum(risk_map.get(p["risk"], 0) for p in patterns)
        risk_score = min(100, risk_score + len(df) // 100)

    return {
        "patterns": patterns,
        "risk_score": risk_score,
        "hourly_distribution": hourly,
        "daily_trend": daily_trend
    }
