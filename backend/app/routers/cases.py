from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
import phonenumbers

from app.database import get_db
from app.models import Case, CaseSubject

router = APIRouter()


class LinkRequest(BaseModel):
    phones: List[str]


def fuzzy_match_phone(p1: str, p2: str) -> bool:
    try:
        n1 = phonenumbers.parse(
            p1 if p1.startswith("+") else f"+91{p1}", "IN"
        )
        n2 = phonenumbers.parse(
            p2 if p2.startswith("+") else f"+91{p2}", "IN"
        )

        return (
            phonenumbers.is_possible_number(n1)
            and phonenumbers.is_possible_number(n2)
            and n1.national_number == n2.national_number
        )

    except:
        if len(p1) >= 10 and len(p2) >= 10:
            return p1[-10:] == p2[-10:]
        return p1 == p2


@router.get("/")
def get_all_cases(db: Session = Depends(get_db)):

    cases = db.query(Case).all()

    result = []

    for case in cases:

        subjects = (
            db.query(CaseSubject)
            .filter(CaseSubject.case_id == case.id)
            .all()
        )

        result.append(
            {
                "id": case.id,
                "case_number": case.case_number,
                "title": case.title,
                "description": case.description,
                "status": case.status,
                "created_date": case.created_date,
                "subjects": [s.subject_id for s in subjects],
            }
        )

    return {"cases": result}


@router.post("/link")
def link_cases(req: LinkRequest, db: Session = Depends(get_db)):

    search_phones = [p.strip() for p in req.phones if p.strip()]

    if not search_phones:
        raise HTTPException(
            status_code=400,
            detail="No valid phone numbers provided",
        )

    linked_cases = []
    seen_cases = set()

    for phone in search_phones:

        rows = (
            db.query(CaseSubject)
            .filter(CaseSubject.phone_number == phone)
            .all()
        )

        for row in rows:

            case = (
                db.query(Case)
                .filter(Case.id == row.case_id)
                .first()
            )

            if case and case.case_number not in seen_cases:

                seen_cases.add(case.case_number)

                linked_cases.append(
                    {
                        "case_number": case.case_number,
                        "title": case.title,
                        "match_type": "Direct",
                        "confidence": 98,
                        "matched_as": row.role,
                        "case_date": case.created_date,
                        "status": case.status,
                    }
                )

    timeline = []

    for c in linked_cases:

        timeline.append(
            {
                "date": c["case_date"],
                "event": f"Appeared as {c['matched_as']} in {c['title']}",
                "case_number": c["case_number"],
                "severity": "critical",
            }
        )

    timeline.sort(key=lambda x: x["date"], reverse=True)

    return {
        "is_repeat_offender": len(linked_cases) > 0,
        "is_known_associate": False,
        "confidence": 98 if linked_cases else 0,
        "linked_cases": linked_cases,
        "timeline": timeline,
    }