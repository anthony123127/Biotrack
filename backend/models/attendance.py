from sqlalchemy import Column, Integer, String, DateTime, Date
from datetime import datetime
from database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    course = Column(String(100), nullable=True)
    grade_level = Column(String(50), nullable=True) # Year level from student
    education_level = Column(String(100), nullable=True) # Course/Dept
    date = Column(Date, default=datetime.utcnow().date(), index=True)
    time_in = Column(DateTime, nullable=True)
    time_out = Column(DateTime, nullable=True)
    entry_status = Column(String(20), nullable=True) # "Entry"
    exit_status = Column(String(20), nullable=True) # "Exit"
    camera_source_in = Column(String(50), nullable=True)
    camera_source_out = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow) # Kept for backward compatibility
    status = Column(String(20), default="Present") # Kept for backward compatibility