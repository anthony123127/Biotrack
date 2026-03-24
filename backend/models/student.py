from sqlalchemy import Column, Integer, String, Boolean, DateTime, LargeBinary
from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    StudentID = Column(String(50), unique=True, index=True, nullable=False)
    FullName = Column(String(100), nullable=False)
    Course = Column(String(100), nullable=False)
    Year = Column(String(50), nullable=False)

    PhotoPath = Column(String(255), nullable=True)
    PhotoPathLeft = Column(String(255), nullable=True)
    PhotoPathRight = Column(String(255), nullable=True)
    has_face_embedding = Column(Boolean, default=False)
    embedding = Column(LargeBinary, nullable=True)
    embedding_left = Column(LargeBinary, nullable=True)
    embedding_right = Column(LargeBinary, nullable=True)

    privacy_consent = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime, nullable=True)

    # ✅ NEW FIELDS
    face_status = Column(String(20), default="pending")  # pending / approved / rejected
    submitted_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)