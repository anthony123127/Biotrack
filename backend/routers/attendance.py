from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from routers.auth import role_required
from database import SessionLocal
from services.attendance_service import attendance_service

print("Loaded NEW attendance router")

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
@router.get("/logs", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def get_attendance_logs(
    grade_level: str = Query(None),
    year_level: str = Query(None),
    db: Session = Depends(get_db)
):
    return attendance_service.get_all_attendance(
        db,
        grade_level=grade_level,
        year_level=year_level
    )


@router.get("/daily", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def get_daily_attendance(date: str = Query(None), db: Session = Depends(get_db)):
    target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else None
    return attendance_service.get_daily_attendance(db, target_date)


@router.get("/presence", dependencies=[Depends(role_required(["Admin", "Security Guard"]))])
def get_presence_board(db: Session = Depends(get_db)):
    return attendance_service.get_presence_status(db)


class OverrideRequest(BaseModel):
    student_id: str
    date: str
    time_in: Optional[str] = None
    time_out: Optional[str] = None


@router.post("/override", dependencies=[Depends(role_required(["Admin"]))])
def manual_override(request: OverrideRequest, db: Session = Depends(get_db)):
    return attendance_service.manual_override(
        db,
        request.student_id,
        request.date,
        request.time_in,
        request.time_out
    )


@router.get("/stats", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def get_attendance_stats(db: Session = Depends(get_db)):
    from routers.reports import get_report_stats
    return get_report_stats(db)