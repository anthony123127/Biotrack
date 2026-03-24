# BioTrack
## Automated Facial Recognition Attendance System Using Deep Learning for Real-Time Institutional Monitoring

**Institution:** Lyceum of San Pedro

---

## Overview

BioTrack is an automated campus monitoring system that tracks student entry and exit through campus gates using facial recognition. The system captures video from gate cameras, identifies students in real time using deep learning, and automatically records attendance.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 |
| Backend | Python FastAPI |
| Computer Vision | OpenCV (Haar Cascade) |
| Deep Learning | FaceNet (InceptionResnetV1 / VGGFace2) |
| Database | Microsoft SQL Server |
| API | REST API (JSON) |

## Project Structure

```
BioTrack/
├── backend/                  # FastAPI backend server
│   ├── models/               # SQLAlchemy ORM models
│   ├── routers/              # API endpoint handlers
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/             # Business logic (detection, recognition, attendance)
│   ├── utils/                # Helper utilities
│   ├── main.py               # Application entry point
│   ├── config.py             # Environment configuration
│   ├── database.py           # Database connection & session management
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React.js admin dashboard
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── services/         # API service layer (Axios)
│   │   ├── App.js            # Root component with routing
│   │   ├── App.css           # Global styles
│   │   └── index.js          # React entry point
│   └── package.json          # Node.js dependencies
├── ai_module/                # Standalone face recognition pipeline
├── database/                 # SQL setup scripts
├── documentation/            # Project documentation
└── uploads/                  # Stored face images
```

## Core Modules

### 1. Student Registration Module
- Register student information (ID, name, course, year)
- Capture face images via webcam
- Generate 512-d facial embeddings using FaceNet
- Store embeddings as binary data in the database

### 2. Facial Recognition Monitoring Module
- Real-time face detection using OpenCV Haar Cascade
- Convert detected faces into embeddings using FaceNet
- Compare against stored embeddings via Euclidean distance
- Automatically record attendance for recognized students

### 3. Admin Dashboard
- Real-time attendance statistics (present, absent, total)
- Today's attendance log with student details
- Student database management (register, view, delete)
- Live monitoring panel with camera feed

### 4. Reports Module
- Generate daily attendance reports by date
- View attendance summary with present/late/absent counts
- Export reports as downloadable CSV files

## Database Schema

### Students
- `StudentID` (PK) — Unique student identifier
- `FullName` — Student's full name
- `Course` — Academic program
- `Year` — Year level
- `FaceEmbedding` — Serialized 512-d FaceNet embedding (VARBINARY)
- `PhotoPath` — Path to stored face image

### Attendance
- `AttendanceID` (PK, auto-increment)
- `StudentID` (FK → Students)
- `Date` — Attendance date
- `TimeIn` — Time of entry
- `Status` — Present / Late / Absent

### EntryExitLogs
- `LogID` (PK, auto-increment)
- `StudentID` (FK → Students)
- `Date`, `TimeIn`, `TimeOut`
- `VerificationMethod` — FacialRecognition / Fingerprint

## Quick Start

See `SETUP_GUIDE.md` for detailed installation instructions.

```bash
# 1. Set up the database
# Run database/setup.sql in SQL Server Management Studio

# 2. Start the backend
cd backend
pip install -r requirements.txt
cp .env.example .env        # Edit with your DB credentials
uvicorn main:app --reload --port 8000

# 3. Start the frontend
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:8000`.
