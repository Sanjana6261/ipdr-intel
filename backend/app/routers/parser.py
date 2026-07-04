import io, json
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.seed_data import get_demo_data, set_uploaded_data

router = APIRouter()

def normalize_phone(p: str) -> str:
    p = str(p).strip().replace(" ", "").replace("-", "")
    if p.startswith("0"):
        p = "+91" + p[1:]
    elif p.startswith("91") and len(p) == 12:
        p = "+" + p
    elif len(p) == 10 and p[0] in "6789":
        p = "+91" + p
    return p

def parse_csv_content(content: str):
    lines = content.strip().split("\n")
    if not lines:
        return [], {}
    # Auto-detect delimiter
    header_line = lines[0]
    delim = ","
    for d in [",", "|", "\t", ";"]:
        if d in header_line:
            delim = d
            break

    headers = [h.strip().lower().replace(" ", "_") for h in header_line.split(delim)]

    # Column name mapping (flexible)
    col_map = {}
    for i, h in enumerate(headers):
        for key, variants in {
            "a_party": ["a_party","a-party","caller","msisdn","number","phone"],
            "b_party": ["b_party","b-party","called","destination","contact"],
            "call_type": ["call_type","type","record_type","service"],
            "start_time": ["start_time","datetime","timestamp","date","time"],
            "duration": ["duration","call_duration","dur"],
            "data_usage_mb": ["data_usage_mb","data_mb","data_usage","volume"],
            "cell_tower_id": ["cell_tower_id","tower_id","cell_id","cgi","lac"],
            "imei": ["imei","device_id"],
            "imsi": ["imsi"],
            "public_ip": ["public_ip","ip_address","ip"],
        }.items():
            if h in variants or any(v in h for v in variants):
                col_map[key] = i

    records = []
    errors = 0
    for line in lines[1:]:
        if not line.strip():
            continue
        parts = line.split(delim)
        try:
            rec = {}
            for field, idx in col_map.items():
                if idx < len(parts):
                    val = parts[idx].strip().strip('"\'')
                    rec[field] = val if val else None
            if "a_party" in rec and rec["a_party"]:
                rec["a_party"] = normalize_phone(rec["a_party"])
                if "b_party" in rec and rec["b_party"]:
                    rec["b_party"] = normalize_phone(rec["b_party"])
                if "duration" in rec and rec["duration"]:
                    try: rec["duration"] = int(float(rec["duration"]))
                    except: rec["duration"] = None
                if "data_usage_mb" in rec and rec["data_usage_mb"]:
                    try: rec["data_usage_mb"] = float(rec["data_usage_mb"])
                    except: rec["data_usage_mb"] = None
                records.append(rec)
        except Exception:
            errors += 1

    if not records:
        return [], {"errors": errors, "format": "unknown"}

    a_parties = list(set(r.get("a_party","") for r in records if r.get("a_party")))
    b_parties = list(set(r.get("b_party","") for r in records if r.get("b_party")))
    towers = list(set(r.get("cell_tower_id","") for r in records if r.get("cell_tower_id")))
    dates = [r["start_time"] for r in records if r.get("start_time")]
    date_range = f"{min(dates)[:10]} → {max(dates)[:10]}" if dates else "N/A"
    imei_recs = [r for r in records if r.get("imei")]

    stats = {
        "total_records": len(records),
        "subjects": len(a_parties),
        "contacts": len(b_parties),
        "towers": len(towers),
        "date_range": date_range,
        "format": "CSV",
        "errors": errors,
        "imei_records": len(imei_recs),
    }
    return records, stats

@router.post("/upload")
async def upload_ipdr(file: UploadFile = File(...)):
    if file.size and file.size > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 100MB)")
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    fname = file.filename.lower()
    if fname.endswith(".json"):
        try:
            data = json.loads(text)
            records = data if isinstance(data, list) else data.get("records", [])
            stats = {"total_records": len(records), "format": "JSON", "errors": 0,
                     "subjects": len(set(r.get("a_party","") for r in records)),
                     "contacts": len(set(r.get("b_party","") for r in records)),
                     "towers": len(set(r.get("cell_tower_id","") for r in records if r.get("cell_tower_id"))),
                     "date_range": "N/A", "imei_records": sum(1 for r in records if r.get("imei"))}
            set_uploaded_data(records)
            return {"records": records[:5000], "stats": stats}
        except:
            raise HTTPException(400, "Invalid JSON format")
    else:
        records, stats = parse_csv_content(text)
        if not records:
            raise HTTPException(400, "Could not parse file. Check format.")
        set_uploaded_data(records)
        return {"records": records[:5000], "stats": stats}

@router.post("/demo")
def load_demo():
    demo = get_demo_data()
    records = demo["records"][:5000]  # return first 5K for preview
    stats = {
        "total_records": len(demo["records"]),
        "subjects": len(demo["subjects"]),
        "contacts": 50,
        "towers": len(demo["towers"]),
        "date_range": "2026-01-01 → 2026-06-30",
        "format": "Synthetic Demo",
        "errors": 0,
        "imei_records": int(len(demo["records"]) * 0.85),
    }
    return {"records": records, "stats": stats}

@router.get("/records/{subject_id}")
def get_records(subject_id: str, page: int = 0, size: int = 100):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        raise HTTPException(404, f"Subject {subject_id} not found")
    recs = [r for r in demo["records"] if r["a_party"] == phone]
    return {"records": recs[page*size:(page+1)*size], "total": len(recs)}
