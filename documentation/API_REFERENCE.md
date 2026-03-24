# BioTrack API Reference
## REST API Endpoints

**Base URL:** `http://localhost:8000/api`

---

## Health Check

### `GET /`
Returns API status.

**Response:**
```json
{ "message": "BioTrack API is running", "version": "1.0.0" }
```

---

## Students

### `POST /api/students/`
Register a new student.

**Request Body:**
```json
{
  "StudentID": "2024-00001",
  "FullName": "Juan Dela Cruz",
  "Course": "BSIT",
  "Year": 1
}
```

**Response:** `200 OK` — Returns the created student object.

---

### `GET /api/students/`
Get a paginated list of all registered students.

**Query Parameters:**
- `skip` (int, default: 0) — Offset for pagination
- `limit` (int, default: 100) — Maximum results to return

**Response:** Array of student objects.

---

### `GET /api/students/{student_id}`
Get a single student by ID.

**Response:** Student object with `has_face_embedding` boolean.

---

### `DELETE /api/students/{student_id}`
Delete a student and their associated face image.

**Response:**
```json
{ "message": "Student 2024-00001 deleted successfully" }
```

---

### `POST /api/students/{student_id}/face`
Upload and register a face image for a student.

**Request Body:**
```json
{
  "image": "<base64_encoded_image>"
}
```

The image should be a base64-encoded JPEG or PNG. Data URI prefixes
(e.g. `data:image/jpeg;base64,...`) are automatically stripped.

**Processing Steps:**
1. Decode the base64 image
2. Detect exactly one face using OpenCV
3. Crop and resize the face to 160×160
4. Generate a 512-d embedding using FaceNet
5. Save the face image to disk and embedding to database

**Response:**
```json
{
  "message": "Face registered successfully",
  "student_id": "2024-00001",
  "photo_path": "faces/2024-00001_a1b2c3d4.jpg"
}
```

**Error Responses:**
- `400` — No face detected / Multiple faces detected / Invalid image
- `404` — Student not found

---

## Face Recognition

### `POST /api/recognition/recognize`
Recognize faces in an image and automatically record attendance.

**Request Body:**
```json
{
  "image": "<base64_encoded_image>"
}
```

**Response:**
```json
{
  "faces_detected": 2,
  "recognized": [
    {
      "student_id": "2024-00001",
      "name": "Juan Dela Cruz",
      "course": "BSIT",
      "confidence": 85.3,
      "distance": 0.1470,
      "bbox": { "x": 120, "y": 80, "w": 150, "h": 150 },
      "attendance_recorded": true,
      "time_in": "08:15:30"
    },
    {
      "student_id": null,
      "name": "Unknown",
      "confidence": 0,
      "bbox": { "x": 400, "y": 90, "w": 140, "h": 140 },
      "attendance_recorded": false
    }
  ]
}
```

---

## Attendance

### `GET /api/attendance/`
Get all attendance records with pagination.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)

**Response:** Array of attendance records with student names.

---

### `GET /api/attendance/daily`
Get attendance for a specific date.

**Query Parameters:**
- `target_date` (string, YYYY-MM-DD format; defaults to today)

**Response:** Array of attendance records for the specified date.

---

### `GET /api/attendance/student/{student_id}`
Get complete attendance history for a specific student.

**Response:** Array of attendance records ordered by date (newest first).

---

### `GET /api/attendance/stats`
Get summary statistics for the admin dashboard.

**Response:**
```json
{
  "total_students": 150,
  "today_present": 120,
  "today_absent": 30,
  "total_records": 5400
}
```

---

### `GET /api/attendance/export`
Export attendance records as a downloadable CSV file.

**Query Parameters:**
- `target_date` (string, optional, YYYY-MM-DD) — Filter by date; omit for all records

**Response:** CSV file download with columns:
`Student ID, Full Name, Course, Date, Time In, Status`

---

## Error Format

All error responses follow this format:
```json
{
  "detail": "Error description message"
}
```

Common HTTP status codes:
- `400` — Bad request (validation error)
- `404` — Resource not found
- `500` — Internal server error
