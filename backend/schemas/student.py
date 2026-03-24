from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    StudentID: str
    FullName: str
    Course: str
    Year: str
    privacy_consent: bool = False
    consent_timestamp: Optional[datetime] = None


class StudentUpdate(BaseModel):
    FullName: Optional[str] = None
    Course: Optional[str] = None
    Year: Optional[str] = None
    PhotoPath: Optional[str] = None
    PhotoPathLeft: Optional[str] = None
    PhotoPathRight: Optional[str] = None
    has_face_embedding: Optional[bool] = None
    privacy_consent: Optional[bool] = None
    consent_timestamp: Optional[datetime] = None

    face_status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None


class StudentResponse(BaseModel):
    id: int
    StudentID: str
    FullName: str
    Course: str
    Year: str
    PhotoPath: Optional[str] = None
    PhotoPathLeft: Optional[str] = None
    PhotoPathRight: Optional[str] = None
    has_face_embedding: bool
    privacy_consent: bool
    consent_timestamp: Optional[datetime]

    face_status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True