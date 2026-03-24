"""
Pydantic Schemas for Attendance Data Validation
Defines request and response models for the Attendance API.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, time


class AttendanceCreate(BaseModel):
    """Schema for recording a new attendance entry."""
    StudentID: str
    Status: str = "Present"


class AttendanceResponse(BaseModel):
    """Schema for attendance API responses."""
    AttendanceID: int
    StudentID: str
    StudentName: Optional[str] = None
    Date: date
    TimeIn: time
    Status: str

    class Config:
        from_attributes = True


class AttendanceExport(BaseModel):
    """Schema for exported attendance data (CSV rows)."""
    StudentID: str
    StudentName: str
    Course: str
    Date: str
    TimeIn: str
    Status: str
