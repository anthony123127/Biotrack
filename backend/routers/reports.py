from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
import io
import csv
from typing import Optional

from routers.auth import role_required
from database import SessionLocal
from models.student import Student
from models.attendance import Attendance
from services.attendance_service import AttendanceService

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def get_report_stats(db: Session = Depends(get_db)):
    today = date.today()
    total_students = db.query(Student).count()

    today_records = (
        db.query(Attendance)
        .filter(Attendance.date == today)
        .all()
    )

    captured_today = len(set(r.student_id for r in today_records))
    unaccounted = max(total_students - captured_today, 0)
    historical_scan_volume = db.query(Attendance).count()

    daily_attendance_rate = (
        round((captured_today / total_students) * 100, 1)
        if total_students > 0
        else 0.0
    )

    hourly_trend = []
    for h in range(7, 19):
        count = db.query(Attendance).filter(
            Attendance.date == today,
            func.hour(Attendance.time_in) == h
        ).count()
        hourly_trend.append({"hour": f"{h}:00", "count": count})

    grade_dist = db.query(
        Attendance.grade_level,
        func.count(Attendance.id)
    ).group_by(Attendance.grade_level).all()

    distribution = [{"name": str(g), "value": c} for g, c in grade_dist if g]

    return {
        "totalStudents": total_students,
        "presentToday": captured_today,
        "absentToday": unaccounted,
        "totalRecords": historical_scan_volume,
        "dailyAttendanceRate": daily_attendance_rate,
        "hourlyTrend": hourly_trend,
        "distribution": distribution,
        "activePopulation": total_students,
        "capturedToday": captured_today,
        "unaccounted": unaccounted,
        "historicalScanVolume": historical_scan_volume
    }


@router.get("/search", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def search_student_reports(
    name: Optional[str] = Query(None),
    grade_level: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)

    if name:
        query = query.filter(Attendance.full_name.ilike(f"%{name}%"))
    if grade_level:
        query = query.filter(Attendance.grade_level == grade_level)
    if startDate:
        start = datetime.strptime(startDate, "%Y-%m-%d").date()
        query = query.filter(Attendance.date >= start)
    if endDate:
        end = datetime.strptime(endDate, "%Y-%m-%d").date()
        query = query.filter(Attendance.date <= end)

    records = query.order_by(Attendance.date.desc(), Attendance.time_in.desc()).limit(200).all()

    return [
        {
            "id": r.id,
            "student_id": r.student_id,
            "full_name": r.full_name,
            "grade_level": r.grade_level,
            "date": r.date.isoformat() if hasattr(r.date, "isoformat") else str(r.date),
            "time_in": AttendanceService._format_time(r.time_in),
            "time_out": AttendanceService._format_time(r.time_out),
            "camera_in": r.camera_source_in,
            "camera_out": r.camera_source_out,
        }
        for r in records
    ]


@router.get("/export", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def export_attendance(
    startDate: str = Query(None),
    endDate: str = Query(None),
    studentId: str = Query(None),
    course: str = Query(None),
    grade_level: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)

    if startDate:
        start = datetime.strptime(startDate, "%Y-%m-%d").date()
        query = query.filter(Attendance.date >= start)
    if endDate:
        end = datetime.strptime(endDate, "%Y-%m-%d").date()
        query = query.filter(Attendance.date <= end)
    if studentId:
        query = query.filter(Attendance.student_id == studentId)
    if course:
        query = query.filter(Attendance.course == course)
    if grade_level:
        query = query.filter(Attendance.grade_level == grade_level)

    records = query.order_by(Attendance.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Student Name", "Student ID", "Grade/Year Level", "Date",
        "Time In", "Time Out", "Entry Status", "Exit Status", "Camera Source In", "Camera Source Out"
    ])

    for r in records:
        writer.writerow([
            r.full_name,
            r.student_id,
            r.grade_level,
            r.date.isoformat() if hasattr(r.date, "isoformat") else str(r.date),
            AttendanceService._format_time(r.time_in) or "",
            AttendanceService._format_time(r.time_out) or "",
            r.entry_status or "",
            r.exit_status or "",
            r.camera_source_in or "",
            r.camera_source_out or ""
        ])

    output.seek(0)
    filename = f"attendance_report_{date.today().isoformat()}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/summaries/daily", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def daily_summary(days: int = 30, db: Session = Depends(get_db)):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    results = (
        db.query(
            Attendance.date.label("date"),
            func.count(Attendance.id).label("count")
        )
        .filter(Attendance.date >= start_date)
        .group_by(Attendance.date)
        .all()
    )

    summary = {str(r.date): r.count for r in results}
    full_summary = []

    for i in range(days):
        d = start_date + timedelta(days=i)
        ds = str(d)
        full_summary.append({"date": ds, "count": summary.get(ds, 0)})

    return full_summary


@router.get("/summaries/monthly", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def monthly_summary(db: Session = Depends(get_db)):
    results = (
        db.query(
            func.month(Attendance.date).label("month"),
            func.count(Attendance.id).label("count")
        )
        .filter(func.year(Attendance.date) == date.today().year)
        .group_by("month")
        .all()
    )

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    summary = {r.month: r.count for r in results}

    return [{"month": months[m - 1], "count": summary.get(m, 0)} for m in range(1, 13)]


@router.get("/summaries/student/{student_id}", dependencies=[Depends(role_required(["Admin", "Registrar", "Security Guard"]))])
def get_student_history(student_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.desc())
        .all()
    )

    return {
        "student_id": student_id,
        "logs": [
            {
                "date": r.date.isoformat() if hasattr(r.date, "isoformat") else str(r.date),
                "time_in": AttendanceService._format_time(r.time_in),
                "time_out": AttendanceService._format_time(r.time_out),
                "entry_status": r.entry_status,
                "exit_status": r.exit_status,
                "camera_source": r.camera_source_in or r.camera_source_out or "Unknown"
            }
            for r in records
        ]
    }