from fastapi import APIRouter
from app.seed_data import get_demo_data

router = APIRouter()

@router.get("/{subject_id}")
def get_predictions(subject_id: str):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        phone = "+919876543210" # fallback for demo
        
    # Simulated ML predictions based on subject profile
    is_high_risk = subject_id in ["S001", "S002"]
    
    contacts = []
    if is_high_risk:
        contacts = [
            {"number": demo["phones"].get("S003", "+919998887776"), "expected_time": "Tomorrow, 10:30 AM", "relationship": "Frequent Associate", "confidence": 87, "expected_hours": 14},
            {"number": "+918821098765", "expected_time": "Within 48h", "relationship": "Unknown / New", "confidence": 62, "expected_hours": 42}
        ]
    else:
        contacts = [
            {"number": "+917766554433", "expected_time": "Today, 18:00", "relationship": "Family/Home", "confidence": 92, "expected_hours": 6}
        ]
        
    locations = [
        {"location": "Delhi NCR (TWR-110-0012)", "time_of_day": "Evening", "historical_visits": 45, "probability": 78},
        {"location": "Gurgaon (TWR-110-0045)", "time_of_day": "Late Night", "historical_visits": 12, "probability": 34}
    ]
    
    activities = [
        {"activity": "Data Usage Spike", "probability": 85 if is_high_risk else 25, "reasoning": "Historical pattern of large encrypted transfers on weekends"},
        {"activity": "Group Coordination", "probability": 72 if is_high_risk else 15, "reasoning": "Sequential calling chain detected in past week"}
    ]
    
    features = [
        {"feature": "Late Night Call Frequency", "importance": 0.45},
        {"feature": "New Contacts Added", "importance": 0.25},
        {"feature": "Location Variance", "importance": 0.18},
        {"feature": "Call Duration Patterns", "importance": 0.12}
    ]
    
    watch_list = []
    if is_high_risk:
        watch_list = [
            {"number": demo["phones"].get("S003", "+919998887776"), "reason": "Central figure in communication burst", "priority": "HIGH"},
            {"number": "+918821098765", "reason": "New contact interacting only with known subjects", "priority": "MEDIUM"}
        ]
        
    return {
        "risk_score": 88 if is_high_risk else 34,
        "risk_trend": "Increasing" if is_high_risk else "Stable",
        "model_accuracy": 92.4,
        "total_predictions": 14,
        "next_contacts": contacts,
        "next_locations": locations,
        "activity_predictions": activities,
        "feature_importance": features,
        "watch_list": watch_list
    }
