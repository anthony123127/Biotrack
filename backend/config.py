"""
BioTrack Configuration
Loads environment variables and defines application settings.
"""
import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# --- Microsoft SQL Server Connection ---
DB_SERVER = os.getenv("DB_SERVER", "localhost")
DB_NAME = os.getenv("DB_NAME", "BioTrackDB")
DB_USERNAME = os.getenv("DB_USERNAME", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

# SQLAlchemy connection string for MS SQL Server via pyodbc
DATABASE_URL = (
    f"mssql+pyodbc://{DB_USERNAME}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}"
    f"?driver={DB_DRIVER.replace(' ', '+')}"
)

# --- File Upload Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads", "faces")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Face Recognition Settings ---
# Euclidean distance threshold: lower value = stricter matching
FACE_RECOGNITION_THRESHOLD = float(os.getenv("FACE_RECOGNITION_THRESHOLD", "1.0"))
