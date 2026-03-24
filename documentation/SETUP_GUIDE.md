# BioTrack Setup Guide
## Step-by-Step Installation and Configuration

---

## Prerequisites

1. **Python 3.9+** — [Download](https://www.python.org/downloads/)
2. **Node.js 18+** — [Download](https://nodejs.org/)
3. **Microsoft SQL Server** — Express edition is sufficient
4. **SQL Server Management Studio (SSMS)** — For running database scripts
5. **ODBC Driver 17 for SQL Server** — [Download](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
6. **Webcam** — Required for face capture and live monitoring

---

## Step 1: Database Setup

1. Open **SQL Server Management Studio (SSMS)**.
2. Connect to your SQL Server instance.
3. Open the file `database/setup.sql`.
4. Execute the script — this will create:
   - `BioTrackDB` database
   - `Students` table
   - `Attendance` table
   - `EntryExitLogs` table

---

## Step 2: Backend Setup

### 2.1 — Create a Python Virtual Environment

```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 2.2 — Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** `torch` and `torchvision` are large packages. If you have an NVIDIA GPU and
want GPU acceleration, install the CUDA version of PyTorch first:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

### 2.3 — Configure Environment Variables

```bash
# Copy the example file
copy .env.example .env
```

Edit `.env` with your database credentials:

```
DB_SERVER=localhost
DB_NAME=BioTrackDB
DB_USERNAME=sa
DB_PASSWORD=YourActualPassword
DB_DRIVER=ODBC Driver 17 for SQL Server
FACE_RECOGNITION_THRESHOLD=1.0
```

### 2.4 — Start the Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Visit `http://localhost:8000/docs` for interactive Swagger API documentation.

---

## Step 3: Frontend Setup

### 3.1 — Install Node.js Dependencies

```bash
cd frontend
npm install
```

### 3.2 — Start the Development Server

```bash
npm start
```

The dashboard will open automatically at `http://localhost:3000`.

---

## Step 4: Verify the System

1. **API Health Check:** Open `http://localhost:8000/` — you should see:
   ```json
   {"message": "BioTrack API is running", "version": "1.0.0"}
   ```

2. **Dashboard:** Open `http://localhost:3000/` — the BioTrack dashboard should load.

3. **Register a Student:**
   - Navigate to "Student Registration"
   - Fill in the student details and submit

4. **Capture a Face:**
   - Navigate to "Face Capture"
   - Select a student from the dropdown
   - Allow camera access, capture a face image, and register it

5. **Test Live Monitoring:**
   - Navigate to "Live Monitoring"
   - Click "Start Monitoring" — the system will detect and identify faces

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SERVER` | `localhost` | SQL Server hostname or IP |
| `DB_NAME` | `BioTrackDB` | Database name |
| `DB_USERNAME` | `sa` | SQL Server username |
| `DB_PASSWORD` | *(empty)* | SQL Server password |
| `DB_DRIVER` | `ODBC Driver 17 for SQL Server` | ODBC driver name |
| `FACE_RECOGNITION_THRESHOLD` | `1.0` | Euclidean distance threshold (lower = stricter) |

---

## Troubleshooting

### "No module named 'pyodbc'"
Install pyodbc: `pip install pyodbc`
Ensure the ODBC Driver 17 for SQL Server is installed on your system.

### "Cannot connect to database"
- Verify SQL Server is running and accepting TCP/IP connections
- Check that the credentials in `.env` are correct
- Ensure the `BioTrackDB` database exists (run `setup.sql` first)

### "No face detected in image"
- Ensure the webcam is working and the face is clearly visible
- Improve lighting conditions — avoid strong backlighting
- Face the camera directly; the Haar Cascade works best with frontal faces

### GPU not detected by PyTorch
- Install the CUDA-compatible version of PyTorch
- Verify CUDA installation: `python -c "import torch; print(torch.cuda.is_available())"`
