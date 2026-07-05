from app.seed_data import get_demo_data
from app.database import SessionLocal
from app.models import Subject, Communication, CellTower, Case, CaseSubject

db = SessionLocal()

demo = get_demo_data()

# Clear old data
db.query(Communication).delete()
db.query(CaseSubject).delete()
db.query(Case).delete()
db.query(CellTower).delete()
db.query(Subject).delete()

db.commit()

# Subjects
for s in demo["subjects"]:
    db.add(
        Subject(
            id=s["id"],
            phone_number=s["phone_number"],
            imei=s["imei"],
        )
    )

# Towers
for t in demo["towers"]:
    db.add(
        CellTower(
            tower_id=t["tower_id"],
            latitude=t["latitude"],
            longitude=t["longitude"],
            city=t["city"],
            state=t["state"],
            operator=t["operator"],
        )
    )

# Cases
for c in demo["cases"]:
    db.add(
        Case(
            id=c["id"],
            case_number=c["case_number"],
            title=c["title"],
            status=c["status"],
            created_date=c["created_date"],
        )
    )

    for sid in c["subjects"]:
        db.add(
            CaseSubject(
                case_id=c["id"],
                subject_id=sid,
                phone_number=demo["phones"][sid],
                role="suspect",
            )
        )

# Communications
for r in demo["records"]:
    subject_id = None

    for sid, phone in demo["phones"].items():
        if phone == r["a_party"]:
            subject_id = sid
            break

    db.add(
        Communication(
            subject_id=subject_id,
            a_party=r["a_party"],
            b_party=r["b_party"],
            call_type=r["call_type"],
            start_time=r["start_time"],
            duration=r["duration"],
            data_usage_mb=r["data_usage_mb"],
            cell_tower_id=r["cell_tower_id"],
            imei=r["imei"],
            imsi=r["imsi"],
            public_ip=r["public_ip"],
        )
    )

db.commit()
db.close()

print("Database seeded successfully!")