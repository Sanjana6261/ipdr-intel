import random
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.seed_data import get_demo_data

router = APIRouter()

@router.get("/{subject_id}/heatmap")
def get_heatmap(subject_id: str, from_date: Optional[str] = None, to_date: Optional[str] = None):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        raise HTTPException(404, f"Subject {subject_id} not found")

    recs = [r for r in demo["records"] if r["a_party"] == phone and r.get("cell_tower_id")]
    if from_date:
        recs = [r for r in recs if r["start_time"] >= from_date]
    if to_date:
        recs = [r for r in recs if r["start_time"] <= to_date + " 23:59:59"]

    # Count visits per tower
    tower_counts = defaultdict(int)
    for r in recs:
        tower_counts[r["cell_tower_id"]] += 1

    tower_map = demo["tower_map"]
    max_count = max(tower_counts.values()) if tower_counts else 1
    points = []
    for tid, count in tower_counts.items():
        t = tower_map.get(tid)
        if t:
            # Add slight jitter so same tower spreads on heatmap
            for _ in range(min(count, 10)):
                points.append({
                    "lat": t["latitude"] + random.uniform(-0.003, 0.003),
                    "lon": t["longitude"] + random.uniform(-0.003, 0.003),
                    "weight": count / max_count,
                })
    return {"points": points, "total": len(recs)}

@router.get("/{subject_id}/path")
def get_path(subject_id: str, from_date: Optional[str] = None, to_date: Optional[str] = None):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        raise HTTPException(404, f"Subject {subject_id} not found")

    recs = sorted(
        [r for r in demo["records"] if r["a_party"] == phone and r.get("cell_tower_id")],
        key=lambda x: x["start_time"]
    )
    if from_date:
        recs = [r for r in recs if r["start_time"] >= from_date]

    tower_map = demo["tower_map"]
    path = []
    seen_consecutive = None
    for r in recs[:1000]:
        t = tower_map.get(r["cell_tower_id"])
        if t and r["cell_tower_id"] != seen_consecutive:
            path.append({
                "lat": t["latitude"],
                "lon": t["longitude"],
                "timestamp": r["start_time"],
                "tower_id": r["cell_tower_id"],
                "city": t["city"],
            })
            seen_consecutive = r["cell_tower_id"]
    return {"path": path[:500]}

@router.get("/{subject_id}/hotspots")
def get_hotspots(subject_id: str):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        raise HTTPException(404, f"Subject {subject_id} not found")

    recs = [r for r in demo["records"] if r["a_party"] == phone and r.get("cell_tower_id")]
    tower_counts = defaultdict(int)
    tower_hours = defaultdict(list)
    for r in recs:
        tower_counts[r["cell_tower_id"]] += 1
        try:
            h = int(r["start_time"][11:13])
            tower_hours[r["cell_tower_id"]].append(h)
        except:
            pass

    tower_map = demo["tower_map"]
    hotspots = []
    for tid, count in sorted(tower_counts.items(), key=lambda x: -x[1])[:10]:
        t = tower_map.get(tid)
        if not t: continue
        hours = tower_hours[tid]
        avg_hour = sum(hours) / len(hours) if hours else 12
        if avg_hour >= 22 or avg_hour <= 5:
            htype = "suspicious"
        elif count > 50:
            htype = "frequent"
        elif 8 <= avg_hour <= 18:
            htype = "work"
        else:
            htype = "home"

        hotspots.append({
            "tower_id": tid,
            "lat": t["latitude"],
            "lon": t["longitude"],
            "city": t["city"],
            "label": f"{t['city']} ({tid})",
            "visits": count,
            "dwell_hours": round(count * 0.5, 1),
            "type": htype,
            "avg_hour": round(avg_hour, 1),
        })
    return {"hotspots": hotspots}
