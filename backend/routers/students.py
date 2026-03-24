from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import SessionLocal
from models.student import Student
from schemas.student import StudentCreate, StudentResponse
from datetime import datetime
import shutil
import os
import cv2
import numpy as np
from services.face_recognition_service import face_recognizer
from routers.auth import role_required

router = APIRouter()

UPLOAD_DIR = "uploads/faces"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=StudentResponse,
    dependencies=[Depends(role_required(["Admin", "Registrar"]))]
)
def register_student(student: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.StudentID == student.StudentID).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")

    basic_ed_levels = [
        "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
        "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
    ]

    if student.Year in basic_ed_levels:
        student.Course = ""

    new_student = Student(
        StudentID=student.StudentID,
        FullName=student.FullName,
        Course=student.Course,
        Year=student.Year,
        privacy_consent=student.privacy_consent,
        consent_timestamp=datetime.utcnow() if student.privacy_consent else None,
        face_status="pending"
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


@router.get(
    "/",
    response_model=list[StudentResponse],
    dependencies=[Depends(role_required(["Admin", "Registrar"]))]
)
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


# IMPORTANT: put this BEFORE /{student_id}
@router.get(
    "/pending-faces",
    dependencies=[Depends(role_required(["Admin"]))]
)
def get_pending_faces(db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.face_status == "pending").all()

    return [
        {
            "student_id": s.StudentID,
            "full_name": s.FullName,
            "course": s.Course,
            "year": s.Year,
            "photo_path": s.PhotoPath,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
            "face_status": s.face_status
        }
        for s in students
    ]


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    dependencies=[Depends(role_required(["Admin", "Registrar"]))]
)
def get_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.delete(
    "/{student_id}",
    dependencies=[Depends(role_required(["Admin", "Registrar"]))]
)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}


@router.post(
    "/{student_id}/face",
    dependencies=[Depends(role_required(["Admin", "Registrar"]))]
)
def upload_face(
    student_id: str,
    angle: str = "front",
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    angle = angle.lower()
    if angle not in ["front", "left", "right"]:
        raise HTTPException(status_code=400, detail="Invalid angle. Must be front, left, or right")

    # Save file with angle suffix
    suffix = f"_{angle}" if angle != "front" else ""
    file_path = os.path.join(UPLOAD_DIR, f"{student_id}{suffix}.jpg")

    contents = file.file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    embedding = face_recognizer.get_embedding(image)

    file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Map angle to model fields
    if angle == "left":
        student.PhotoPathLeft = file_path
        student.embedding_left = face_recognizer.serialize_embedding(embedding)
    elif angle == "right":
        student.PhotoPathRight = file_path
        student.embedding_right = face_recognizer.serialize_embedding(embedding)
    else:  # front
        student.PhotoPath = file_path
        student.embedding = face_recognizer.serialize_embedding(embedding)

    # Set status to pending and update timestamps
    student.face_status = "pending"
    student.submitted_at = datetime.utcnow()
    student.approved_at = None
    
    # We only set has_face_embedding to True after Admin Approval
    student.has_face_embedding = False

    db.commit()
    db.refresh(student)

    return {
        "message": f"Face ({angle}) submitted for approval",
        "student_id": student.StudentID,
        "angle": angle,
        "photo_path": file_path,
        "face_status": student.face_status
    }


@router.post(
    "/{student_id}/approve-face",
    dependencies=[Depends(role_required(["Admin"]))]
)
def approve_face(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.face_status = "approved"
    student.has_face_embedding = True
    student.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(student)

    return {
        "message": "Face approved successfully",
        "student_id": student.StudentID,
        "face_status": student.face_status
    }


@router.post(
    "/{student_id}/reject-face",
    dependencies=[Depends(role_required(["Admin"]))]
)
def reject_face(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.face_status = "rejected"
    student.has_face_embedding = False
    student.approved_at = None

    db.commit()
    db.refresh(student)

    return {
        "message": "Face rejected",
        "student_id": student.StudentID,
        "face_status": student.face_status
    }