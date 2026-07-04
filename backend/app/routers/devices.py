from fastapi import APIRouter, HTTPException
from collections import defaultdict
from app.seed_data import get_demo_data

router = APIRouter()

@router.get("/{imei}")
def get_device(imei: str):
    demo = get_demo_data()
    recs = [r for r in demo["records"] if r.get("imei") == imei]
    
    if not recs:
        # Check if we have it in our mapping, even if no records
        sid = next((k for k, v in demo["imeis"].items() if v == imei), None)
        if not sid:
            raise HTTPException(404, "Device not found")
            
    return build_device_profile(imei, recs, demo)

@router.get("/subject/{subject_id}")
def get_subject_devices(subject_id: str):
    demo = get_demo_data()
    imei = demo["imeis"].get(subject_id)
    if not imei:
        raise HTTPException(404, "Subject has no registered devices")
        
    recs = [r for r in demo["records"] if r.get("imei") == imei]
    return {"devices": [build_device_profile(imei, recs, demo)]}


def build_device_profile(imei: str, recs: list, demo: dict):
    if not recs:
        return {
            "imei": imei,
            "status": "Inactive",
            "sim_history": [],
            "active_numbers": [],
            "location_summary": [],
        }

    recs.sort(key=lambda x: x["start_time"])
    first_seen = recs[0]["start_time"]
    last_seen = recs[-1]["start_time"]
    
    # Extract unique SIMs (IMSI or phone number)
    sims = defaultdict(list)
    for r in recs:
        # Use phone number as proxy for SIM if IMSI isn't tracked perfectly
        sims[r["a_party"]].append(r)
        
    sim_history = []
    active_numbers = []
    
    # Sort numbers by first appearance
    sorted_sims = sorted(sims.items(), key=lambda x: x[1][0]["start_time"])
    
    for idx, (number, sim_recs) in enumerate(sorted_sims):
        sim_history.append({
            "number": number,
            "imsi": sim_recs[0].get("imsi"),
            "operator": "Unknown", # Would typically look up IMSI prefix
            "date": sim_recs[0]["start_time"][:10],
            "reason": "Initial activation" if idx == 0 else "SIM Swap"
        })
        
        # Check if active in last 30 days of dataset
        last_used = sim_recs[-1]["start_time"]
        is_active = last_used > "2026-05-30" # mock active check
        
        active_numbers.append({
            "number": number,
            "operator": "Unknown",
            "first_used": sim_recs[0]["start_time"][:10],
            "last_used": last_used[:10],
            "active": is_active
        })

    # Location summary
    towers = defaultdict(int)
    for r in recs:
        if r.get("cell_tower_id"):
            towers[r["cell_tower_id"]] += 1
            
    loc_summary = []
    total_locs = sum(towers.values())
    
    for tid, count in sorted(towers.items(), key=lambda x: -x[1])[:3]:
        t = demo["tower_map"].get(tid)
        if t:
            loc_summary.append({
                "city": t["city"],
                "visits": count,
                "percentage": int((count / max(1, total_locs)) * 100),
                "unique_days": count // 5 + 1 # mock
            })
            
    return {
        "imei": imei,
        "model": "Unknown Smartphone",
        "manufacturer": "Unknown",
        "tac": imei[:8] if len(imei) > 8 else None,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "sim_swap_alert": len(sim_history) > 1,
        "sim_history": sim_history,
        "active_numbers": active_numbers,
        "location_summary": loc_summary,
        "status": "Active"
    }
