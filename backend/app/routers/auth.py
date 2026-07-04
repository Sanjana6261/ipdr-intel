from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter()
SECRET_KEY = "ipdr-iap-secret-2024-xk9m"
ALGORITHM = "HS256"

DEMO_USERS = {
    "admin":   {"name": "Rajesh Kumar", "role": "Senior Investigator", "badge": "IPS-001"},
    "analyst": {"name": "Priya Sharma", "role": "Intelligence Analyst", "badge": "CIA-042"},
    "viewer":  {"name": "Arjun Singh",  "role": "Field Officer",        "badge": "FO-099"},
}

class LoginReq(BaseModel):
    username: str
    password: str

def create_token(data: dict) -> str:
    payload = {**data, "exp": datetime.utcnow() + timedelta(hours=8)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login")
def login(req: LoginReq):
    user = DEMO_USERS.get(req.username.lower())
    if not user or req.password != "demo1234":
        raise HTTPException(status_code=401, detail="Invalid credentials. Use demo1234 as password.")
    token = create_token({"sub": req.username, **user})
    return {"access_token": token, "token_type": "bearer", "user": {"name": user["name"], "role": user["role"], "badge": user["badge"]}}
