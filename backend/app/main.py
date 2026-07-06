from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models

from app.routers import (
    auth,
    parser,
    network,
    geo,
    cases,
    patterns,
    predictive,
    devices,
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="IPDR Intelligence & Analytics Platform",
    description="Advanced investigation support system for law enforcement",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ipdr-intel-delta.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def root():
    return {
        "message": "Welcome to IPDR Intelligence & Analytics Platform 🚀",
        "status": "Running",
        "version": "1.0.0",
        "health": "/api/health",
        "docs": "/docs",
    }


# -----------------------------
# Health Check Endpoint
# -----------------------------
@app.get("/api/health")
def health():
    return {
        "status": "online",
        "service": "IPDR IAP",
        "version": "1.0.0",
    }


# -----------------------------
# API Routers
# -----------------------------
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    parser.router,
    prefix="/api/parser",
    tags=["Parser"],
)

app.include_router(
    network.router,
    prefix="/api/network",
    tags=["Network Graph"],
)

app.include_router(
    geo.router,
    prefix="/api/geo",
    tags=["Geolocation"],
)

app.include_router(
    cases.router,
    prefix="/api/cases",
    tags=["Cases"],
)

app.include_router(
    patterns.router,
    prefix="/api/patterns",
    tags=["Patterns"],
)

app.include_router(
    predictive.router,
    prefix="/api/predict",
    tags=["Predictive"],
)

app.include_router(
    devices.router,
    prefix="/api/devices",
    tags=["Devices"],
)