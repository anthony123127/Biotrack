from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.student import Student
from models.attendance import Attendance


class AttendanceService:
    """Handles attendance recording, querying, and reporting."""

    @staticmethod
    def _format_time(t):
        if not t: return None
        if isinstance(t, str): return t.split()[1] if ' ' in t else t
        return t.strftime("%H:%M:%S")

    @staticmethod
    def _format_dt(dt):
        if not dt: return None
        if isinstance(dt, str): return dt
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def record_attendance(
        db: Session, 
        student_id: str, 
        camera_source: str = "Camera 1", 
        action: str = "Entry"
    ) -> Attendance:
        """Record entry or exit for a student for today."""
        today = date.today()
        now = datetime.utcnow()

        # Check for existing record today for this student
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == student_id,
                Attendance.date == today
            )
            .first()
        )
        
        # Get student info for detailed logging
        student = db.query(Student).filter(Student.StudentID == student_id).first()
        
        full_name = student.FullName if student else "Unknown"
        course = student.Course if student else "Unknown"
        grade = student.Year if student else "Unknown"
        edu = "Basic Education" if "Grade" in grade or "Kinder" in grade else "Higher Education"

        if existing:
            attendance = existing
            # Ensure names/details are correctly updated if they were missing or changed
            attendance.full_name = full_name
            attendance.course = course
            attendance.grade_level = grade
            attendance.education_level = edu
        else:
            attendance = Attendance(
                student_id=student_id,
                full_name=full_name,
                course=course,
                grade_level=grade,
                education_level=edu,
                date=today,
                status="Present"
            )
            db.add(attendance)

        # Apply specific scan data based on action
        if action == "Entry":
            attendance.time_in = now
            attendance.camera_source_in = camera_source
            attendance.entry_status = "Entry"
            # Backward compatibility
            attendance.timestamp = now
        else:
            attendance.time_out = now
            attendance.camera_source_out = camera_source
            attendance.exit_status = "Exit"

        db.commit()
        db.refresh(attendance)
        return attendance

    @staticmethod
    def get_daily_attendance(
        db: Session, target_date: Optional[date] = None
    ) -> List[dict]:
        """Return attendance records for a given date."""
        if target_date is None:
            target_date = date.today()

        records = (
            db.query(Attendance)
            .filter(Attendance.date == target_date)
            .all()
        )

        return [
            {
                "id": r.id,
                "student_id": r.student_id,
                "full_name": r.full_name,
                "course": r.course,
                "grade_level": r.grade_level,
                "education_level": r.education_level,
                "date": r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date),
                "time_in": AttendanceService._format_time(r.time_in),
                "time_out": AttendanceService._format_time(r.time_out),
                "entry_status": r.entry_status,
                "exit_status": r.exit_status,
                "camera_source_in": r.camera_source_in,
                "camera_source_out": r.camera_source_out,
                "status": r.status,
                "timestamp": AttendanceService._format_dt(r.timestamp),
            }
            for r in records
        ]

    @staticmethod
    def get_student_history(db: Session, student_id: str) -> List[dict]:
        """Return the complete attendance history for a single student."""
        records = (
            db.query(Attendance)
            .filter(Attendance.student_id == student_id)
            .order_by(Attendance.date.desc())
            .all()
        )

        return [
            {
                "id": r.id,
                "student_id": r.student_id,
                "full_name": r.full_name,
                "course": r.course,
                "grade_level": r.grade_level,
                "date": r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date),
                "time_in": AttendanceService._format_time(r.time_in),
                "time_out": AttendanceService._format_time(r.time_out),
                "status": r.status,
            }
            for r in records
        ]

    @staticmethod
    def get_all_attendance(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        grade_level: Optional[str] = None,
        year_level: Optional[str] = None
    ) -> List[dict]:
        """Return filtered and paginated attendance records."""
        query = db.query(Attendance)
        
        if grade_level:
            query = query.filter(Attendance.grade_level == grade_level)
        if year_level:
            query = query.filter(Attendance.grade_level == year_level)

        records = (
            query.order_by(Attendance.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": r.id,
                "student_id": r.student_id,
                "full_name": r.full_name,
                "course": r.course,
                "grade_level": r.grade_level,
                "date": r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date),
                "time_in": AttendanceService._format_time(r.time_in),
                "time_out": AttendanceService._format_time(r.time_out),
                "entry_status": r.entry_status,
                "exit_status": r.exit_status,
                "camera_source": r.camera_source_in or r.camera_source_out,
                "timestamp": AttendanceService._format_dt(r.timestamp),
            }
            for r in records
        ]


    @staticmethod
    def get_presence_status(db: Session) -> List[dict]:
        """Determine who is inside, timed out, or absent today."""
        from models.student import Student
        from datetime import date
        
        today = date.today()
        students = db.query(Student).all()
        attendance = db.query(Attendance).filter(Attendance.date == today).all()
        
        att_map = {a.student_id: a for a in attendance}
        
        results = []
        for s in students:
            record = att_map.get(s.StudentID)
            status = "Absent"
            time_in = None
            time_out = None
            
            if record:
                if record.time_in and not record.time_out:
                    status = "Inside"
                elif record.time_out:
                    status = "Timed Out"
                
                time_in = AttendanceService._format_time(record.time_in)
                time_out = AttendanceService._format_time(record.time_out)
                
            results.append({
                "student_id": s.StudentID,
                "full_name": s.FullName,
                "grade_level": s.Year,
                "status": status,
                "time_in": time_in,
                "time_out": time_out
            })
            
        return results

    @staticmethod
    def manual_override(db: Session, student_id: str, date_str: str, time_in_str: str, time_out_str: str) -> Attendance:
        """Manually update or create an attendance record for a student with robust datetime handling."""
        from datetime import datetime, time
        from models.student import Student
        
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # Helper to combine date and time string
        def get_dt(t_str):
            if not t_str: return None
            try:
                t_obj = datetime.strptime(t_str, "%H:%M:%S").time()
                return datetime.combine(target_date, t_obj)
            except ValueError:
                # Try HH:MM if first attempt fails
                try:
                    t_obj = datetime.strptime(t_str, "%H:%M").time()
                    return datetime.combine(target_date, t_obj)
                except ValueError:
                    return None

        dt_in = get_dt(time_in_str)
        dt_out = get_dt(time_out_str)
        
        record = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.date == target_date
        ).first()
        
        if record:
            if dt_in:
                record.time_in = dt_in
                record.entry_status = "Entry"
            if dt_out:
                record.time_out = dt_out
                record.exit_status = "Exit"
        else:
            # Fetch student metadata to ensure record is complete
            student = db.query(Student).filter(Student.StudentID == student_id).first()
            if not student:
                raise ValueError(f"Student with ID {student_id} not found")

            record = Attendance(
                student_id=student_id,
                full_name=student.FullName,
                course=student.Course,
                grade_level=student.Year,
                education_level=student.Course, # Logic seems to use Course as Dept/EdLevel in some places
                date=target_date,
                time_in=dt_in,
                time_out=dt_out,
                entry_status="Entry" if dt_in else None,
                exit_status="Exit" if dt_out else None,
                camera_source_in="Manual Override" if dt_in else None,
                camera_source_out="Manual Override" if dt_out else None,
                status="Present"
            )
            db.add(record)
            
        db.commit()
        db.refresh(record)
        return record


# Singleton instance
attendance_service = AttendanceService()
