"""
Synthetic IPDR Data Generator
Generates realistic Indian telecom data for demo purposes.
"""
import random
import json
from datetime import datetime, timedelta

random.seed(42)

# Indian cities with realistic lat/lon
CITIES = [
    {"city": "Delhi",        "state": "Delhi",       "lat": 28.6139, "lon": 77.2090, "prefix": "110"},
    {"city": "Mumbai",       "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "prefix": "400"},
    {"city": "Bangalore",    "state": "Karnataka",   "lat": 12.9716, "lon": 77.5946, "prefix": "560"},
    {"city": "Hyderabad",    "state": "Telangana",   "lat": 17.3850, "lon": 78.4867, "prefix": "500"},
    {"city": "Chennai",      "state": "Tamil Nadu",  "lat": 13.0827, "lon": 80.2707, "prefix": "600"},
    {"city": "Kolkata",      "state": "West Bengal", "lat": 22.5726, "lon": 88.3639, "prefix": "700"},
    {"city": "Pune",         "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567, "prefix": "411"},
    {"city": "Ahmedabad",    "state": "Gujarat",     "lat": 23.0225, "lon": 72.5714, "prefix": "380"},
    {"city": "Jaipur",       "state": "Rajasthan",   "lat": 26.9124, "lon": 75.7873, "prefix": "302"},
    {"city": "Lucknow",      "state": "Uttar Pradesh","lat": 26.8467,"lon": 80.9462, "prefix": "226"},
]

OPERATORS = ["Jio", "Airtel", "Vi", "BSNL"]
CALL_TYPES = ["voice", "data", "sms"]
CALL_TYPE_WEIGHTS = [0.5, 0.35, 0.15]

def random_phone():
    prefix = random.choice(["9", "8", "7", "6"])
    return f"+91{prefix}{random.randint(100000000, 999999999)}"

def random_imei():
    tac = f"{random.randint(10000000, 99999999)}"
    serial = f"{random.randint(100000, 999999)}"
    base = tac + serial
    # Luhn check digit (simplified)
    cd = random.randint(0, 9)
    return base + str(cd)

def random_tower(city_data, idx):
    lat_offset = random.uniform(-0.05, 0.05)
    lon_offset = random.uniform(-0.05, 0.05)
    return {
        "tower_id": f"TWR-{city_data['prefix']}-{idx:04d}",
        "latitude": round(city_data["lat"] + lat_offset, 6),
        "longitude": round(city_data["lon"] + lon_offset, 6),
        "city": city_data["city"],
        "state": city_data["state"],
        "operator": random.choice(OPERATORS),
    }

def generate_demo_data(n_records=50000):
    """Generate n_records synthetic IPDR records with embedded criminal patterns."""

    # Generate cell towers (200 towers across cities)
    towers = []
    for i, city in enumerate(CITIES):
        for j in range(20):
            towers.append(random_tower(city, i * 20 + j))

    tower_ids = [t["tower_id"] for t in towers]
    tower_map = {t["tower_id"]: t for t in towers}

    # 3 cases, ~15 subjects
    # Case 1: Drug trafficking network (subjects S001-S005)
    # Case 2: Cyber fraud ring (subjects S006-S010)
    # Case 3: Historical case - repeat offenders (subjects S011-S015)

    subjects = []
    phones = {}  # subject_id -> phone
    imeis = {}   # subject_id -> imei

    for i in range(1, 16):
        sid = f"S{i:03d}"
        ph = random_phone()
        im = random_imei()
        phones[sid] = ph
        imeis[sid] = im
        subjects.append({"id": sid, "phone_number": ph, "imei": im})

    # Additional contact phones (B-parties not in subject list)
    extra_phones = [random_phone() for _ in range(50)]

    cases_data = [
        {"id": "C001", "case_number": "CR-2026-0033", "title": "Drug Trafficking Network — NCB",
         "status": "Active", "created_date": "2026-01-15", "subjects": ["S001","S002","S003","S004","S005"]},
        {"id": "C002", "case_number": "CR-2026-0047", "title": "Cyber Fraud Ring — CBI",
         "status": "Active", "created_date": "2026-02-20", "subjects": ["S006","S007","S008","S009","S010"]},
        {"id": "C003", "case_number": "CR-2024-0892", "title": "Terror Financing — NIA (Closed)",
         "status": "Closed", "created_date": "2024-08-10", "subjects": ["S001","S011","S012","S013"]},
    ]

    # Generate records
    records = []
    start_date = datetime(2026, 1, 1)
    end_date = datetime(2026, 6, 30)

    # Subject S001 has criminal patterns embedded
    criminal_subject = "S001"
    criminal_phone = phones[criminal_subject]
    criminal_imei = imeis[criminal_subject]
    criminal_city_towers = [t for t in tower_ids if t.startswith("TWR-110")]  # Delhi towers

    for i in range(n_records):
        # Pick subject weighted toward first few
        if i < n_records * 0.4:
            subject_id = random.choice(["S001", "S002", "S003"])
        else:
            subject_id = random.choice(list(phones.keys()))

        a_phone = phones[subject_id]
        subj_imei = imeis[subject_id]

        # Inject criminal patterns for S001
        if subject_id == "S001" and random.random() < 0.3:
            # Flash calls pattern (very short duration)
            call_type = "voice"
            duration = random.randint(1, 8)
            # Late night calls
            hour = random.choice([22, 23, 0, 1, 2, 3, 4])
            day = start_date + timedelta(days=random.randint(0, 180))
            dt = day.replace(hour=hour, minute=random.randint(0, 59))
            b_phone = random.choice([phones[s] for s in ["S002","S003","S011"]] + extra_phones[:5])
            tower = random.choice(criminal_city_towers) if criminal_city_towers else random.choice(tower_ids)
        else:
            call_type = random.choices(CALL_TYPES, weights=CALL_TYPE_WEIGHTS)[0]
            day = start_date + timedelta(days=random.randint(0, 180))
            hour = int(random.triangular(6, 23, 14))
            dt = day.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            duration = random.randint(5, 1800) if call_type == "voice" else None
            b_phone = random.choice(extra_phones + [phones[s] for s in random.sample(list(phones.keys()), 3)])
            tower = random.choice(tower_ids)

        rec = {
            "a_party": a_phone,
            "b_party": b_phone,
            "call_type": call_type,
            "start_time": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "duration": duration,
            "data_usage_mb": round(random.uniform(0.1, 500), 2) if call_type == "data" else None,
            "cell_tower_id": tower,
            "imei": subj_imei,
            "imsi": f"40{random.randint(400,499)}{random.randint(1000000000, 9999999999)}",
            "public_ip": f"49.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}" if call_type == "data" else None,
        }
        records.append(rec)

    return {
        "records": records,
        "subjects": subjects,
        "towers": towers,
        "tower_map": tower_map,
        "cases": cases_data,
        "phones": phones,
        "imeis": imeis,
    }


_DEMO_DATA = None

def get_demo_data():
    global _DEMO_DATA
    if _DEMO_DATA is None:
        _DEMO_DATA = generate_demo_data(50000)
    return _DEMO_DATA

def set_uploaded_data(records):
    global _DEMO_DATA
    
    from collections import Counter
    
    # Extract unique parties
    a_parties = [r.get("a_party") for r in records if r.get("a_party")]
    
    # Find most frequent callers to assign Subject IDs
    counts = Counter(a_parties)
    top_phones = [p for p, c in counts.most_common(20)]
    
    phones = {}
    subjects = []
    
    for i, p in enumerate(top_phones):
        sid = f"S{i+1:03d}"
        phones[sid] = p
        subjects.append({"id": sid, "phone_number": p, "imei": ""})
    
    # Also map literal phone numbers to themselves so direct search works
    all_parties = set(a_parties) | set([r.get("b_party") for r in records if r.get("b_party")])
    for p in all_parties:
        phones[p] = p
        
    _DEMO_DATA = {
        "records": records,
        "subjects": subjects,
        "towers": [],
        "tower_map": {},
        "cases": [],
        "phones": phones,
        "imeis": {},
    }

