from fastapi.staticfiles import StaticFiles
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from models.student import Student
from models.attendance import Attendance
from models.user import User
from routers import students, attendance, reports, recognition, auth

# 🔥 DEBUG: check if tables are being created
print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created or already exist.")

app = FastAPI(title="BioTrack API")
os.makedirs("uploads/faces", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(recognition.router, prefix="/api/recognition", tags=["Recognition"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


@app.get("/")
def root():
    return {"message": "BioTrack API is running", "version": "1.0.0"}