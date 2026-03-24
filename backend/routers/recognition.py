from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import cv2
import numpy as np

from routers.auth import role_required
from database import SessionLocal
from models.student import Student
from services.face_recognition_service import face_recognizer
from services.face_detection import face_detector
from services.attendance_service import attendance_service

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_liveness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance > 100.0, variance


def check_face_quality(face_crop):
    if face_crop is None or face_crop.size == 0:
        return False, "Empty face crop"

    h, w = face_crop.shape[:2]

    if h < 80 or w < 80:
        return False, "Face too small"

    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

    brightness = gray.mean()
    if brightness < 50:
        return False, "Face too dark"
    if brightness > 220:
        return False, "Face too bright"

    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < 50:
        return False, "Face too blurry"

    return True, "Good quality"


@router.post("/recognize", dependencies=[Depends(role_required(["Admin", "Security Guard"]))])
async def recognize_face(
    file: UploadFile = File(...),
    camera_source: str = "Camera 1",
    action: str = "Entry",
    db: Session = Depends(get_db)
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    face_bboxes = face_detector.detect_faces(image)
    if not face_bboxes:
        return {
            "success": True,
            "recognized_count": 0,
            "total_faces": 0,
            "matches": [],
            "message": "No faces detected in the image"
        }

    students_with_faces = db.query(Student).filter(
        Student.has_face_embedding == True,
        Student.face_status == "approved"
    ).all()

    if not students_with_faces:
        return {
            "success": True,
            "recognized_count": 0,
            "total_faces": len(face_bboxes),
            "matches": [],
            "message": "No approved student faces found in database"
        }
    stored_embeddings = []
    for s in students_with_faces:
        if s.embedding:
            emb = face_recognizer.deserialize_embedding(s.embedding)
            stored_embeddings.append((s.StudentID, emb))

    matches = []

    for i, bbox in enumerate(face_bboxes):
        face_crop = face_detector.extract_face(image, bbox)

        if face_crop is None:
            matches.append({
                "face_index": i,
                "status": "Invalid face crop"
            })
            continue

        is_good_quality, quality_message = check_face_quality(face_crop)
        if not is_good_quality:
            matches.append({
                "face_index": i,
                "status": quality_message
            })
            continue

        is_live, liveness_score = check_liveness(face_crop)
        if not is_live:
            matches.append({
                "face_index": i,
                "status": f"Liveness failed ({liveness_score:.1f})"
            })
            continue

        try:
            query_emb = face_recognizer.get_embedding(face_crop)
        except Exception:
            matches.append({
                "face_index": i,
                "status": "Embedding failed"
            })
            continue

        match_result = face_recognizer.find_match(query_emb, stored_embeddings, threshold=0.8)

        if match_result:
            student_id, distance = match_result

            attendance_service.record_attendance(
                db,
                student_id,
                camera_source=camera_source,
                action=action
            )

            student = next((s for s in students_with_faces if s.StudentID == student_id), None)

            matches.append({
                "face_index": i,
                "student_id": student.StudentID if student else student_id,
                "full_name": student.FullName if student else "Unknown",
                "course": student.Course if student else "",
                "confidence": round(1.0 - distance, 4),
                "status": "Recognized & Logged"
            })
        else:
            matches.append({
                "face_index": i,
                "status": "Unknown"
            })

    recognized_count = len([m for m in matches if m["status"] == "Recognized & Logged"])

    return {
        "success": True,
        "recognized_count": recognized_count,
        "total_faces": len(face_bboxes),
        "matches": matches,
        "message": f"Recognized {recognized_count} of {len(face_bboxes)} face(s)"
    }