from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(String, primary_key=True)  # e.g. S001
    phone_number = Column(String, unique=True, index=True)
    imei = Column(String, index=True, nullable=True)
    imsi = Column(String, nullable=True)
    name = Column(String, nullable=True)
    risk_score = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    communications = relationship("Communication", back_populates="subject")

class Communication(Base):
    __tablename__ = "communications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(String, ForeignKey("subjects.id"), index=True)
    a_party = Column(String, index=True)
    b_party = Column(String, index=True)
    call_type = Column(String)  # voice / data / sms
    start_time = Column(String)
    duration = Column(Integer, nullable=True)
    data_usage_mb = Column(Float, nullable=True)
    cell_tower_id = Column(String, nullable=True)
    imei = Column(String, nullable=True)
    imsi = Column(String, nullable=True)
    public_ip = Column(String, nullable=True)
    subject = relationship("Subject", back_populates="communications")

class CellTower(Base):
    __tablename__ = "cell_towers"
    tower_id = Column(String, primary_key=True)
    latitude = Column(Float)
    longitude = Column(Float)
    city = Column(String)
    state = Column(String)
    operator = Column(String)

class Case(Base):
    __tablename__ = "cases"
    id = Column(String, primary_key=True)
    case_number = Column(String, unique=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")
    investigating_officer = Column(String, nullable=True)
    created_date = Column(String)
    case_subjects = relationship("CaseSubject", back_populates="case")

class CaseSubject(Base):
    __tablename__ = "case_subjects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id"))
    subject_id = Column(String)
    phone_number = Column(String)
    role = Column(String, default="suspect")  # suspect/witness/victim
    case = relationship("Case", back_populates="case_subjects")

class PatternRecord(Base):
    __tablename__ = "patterns"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(String, index=True)
    pattern_type = Column(String)
    confidence = Column(Float)
    risk = Column(String)
    detected_at = Column(String)
    details = Column(Text, nullable=True)

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    imei = Column(String, unique=True, index=True)
    model = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    tac = Column(String, nullable=True)
    first_seen = Column(String)
    last_seen = Column(String)
    sim_swap_alert = Column(Boolean, default=False)
