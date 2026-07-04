from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import phonenumbers
from app.seed_data import get_demo_data

router = APIRouter()

class LinkRequest(BaseModel):
    phones: List[str]

def fuzzy_match_phone(p1: str, p2: str) -> bool:
    try:
        n1 = phonenumbers.parse(p1 if p1.startswith("+") else f"+91{p1}", "IN")
        n2 = phonenumbers.parse(p2 if p2.startswith("+") else f"+91{p2}", "IN")
        return phonenumbers.is_possible_number(n1) and phonenumbers.is_possible_number(n2) and n1.national_number == n2.national_number
    except:
        # Fallback to simple string match of last 10 digits
        return p1[-10:] == p2[-10:] if len(p1) >= 10 and len(p2) >= 10 else p1 == p2

@router.post("/link")
def link_cases(req: LinkRequest):
    demo = get_demo_data()
    search_phones = [p.strip() for p in req.phones if p.strip()]
    if not search_phones:
        raise HTTPException(400, "No valid phone numbers provided")

    linked_cases = []
    seen_cases = set()
    is_repeat = False
    is_associate = False

    # A-parties are subjects in cases
    # B-parties are contacts
    
    # We map phone to cases
    subject_cases = {}
    for case in demo["cases"]:
        for sid in case["subjects"]:
            phone = demo["phones"].get(sid)
            if phone:
                if phone not in subject_cases:
                    subject_cases[phone] = []
                subject_cases[phone].append(case)

    # Check search phones against case subjects (A-Party)
    for sp in search_phones:
        for subj_phone, cases in subject_cases.items():
            if fuzzy_match_phone(sp, subj_phone):
                is_repeat = True
                for case in cases:
                    if case["case_number"] not in seen_cases:
                        seen_cases.add(case["case_number"])
                        linked_cases.append({
                            "case_number": case["case_number"],
                            "title": case["title"],
                            "match_type": "Direct",
                            "confidence": 98,
                            "matched_as": "A-Party",
                            "case_date": case["created_date"],
                            "status": case["status"],
                            "common_associates": [demo["phones"].get(s, "")[-10:] for s in case["subjects"][:3] if s in demo["phones"]]
                        })

    # Check B-Parties (Known Associates) if not direct match
    # Since checking 50K records is slow, we sample them
    if not is_repeat:
        contact_cases = {}
        for r in demo["records"][:10000]:
            if r["b_party"]:
                sid_a = next((k for k,v in demo["phones"].items() if v == r["a_party"]), None)
                if sid_a:
                    for case in demo["cases"]:
                        if sid_a in case["subjects"]:
                            if r["b_party"] not in contact_cases:
                                contact_cases[r["b_party"]] = []
                            contact_cases[r["b_party"]].append(case)
                            
        for sp in search_phones:
            for contact_phone, cases in contact_cases.items():
                if fuzzy_match_phone(sp, contact_phone):
                    is_associate = True
                    for case in cases:
                        if case["case_number"] not in seen_cases:
                            seen_cases.add(case["case_number"])
                            linked_cases.append({
                                "case_number": case["case_number"],
                                "title": case["title"],
                                "match_type": "Indirect",
                                "confidence": 85,
                                "matched_as": "Contact (B-Party)",
                                "case_date": case["created_date"],
                                "status": case["status"]
                            })

    timeline = []
    if linked_cases:
        for c in linked_cases:
            timeline.append({
                "date": c["case_date"],
                "event": f"Appeared as {c['matched_as']} in {c['title']}",
                "case_number": c["case_number"],
                "severity": "critical" if c["match_type"] == "Direct" else "high"
            })
        timeline.sort(key=lambda x: x["date"], reverse=True)

    return {
        "is_repeat_offender": is_repeat,
        "is_known_associate": is_associate,
        "confidence": 98 if is_repeat else (85 if is_associate else 0),
        "linked_cases": linked_cases,
        "timeline": timeline
    }

@router.get("/")
def get_all_cases():
    demo = get_demo_data()
    return {"cases": demo["cases"]}
