"""
Utility Helper Functions
Shared helpers for file handling and image processing.
"""
import base64
import os
from datetime import datetime


def generate_filename(student_id: str, extension: str = "jpg") -> str:
    """Generate a unique timestamped filename for a face image."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{student_id}_{timestamp}.{extension}"


def image_to_base64(image_path: str) -> str:
    """Read an image file and return its base64-encoded string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def ensure_directory(path: str) -> None:
    """Ensure a directory exists, creating it (and parents) if necessary."""
    os.makedirs(path, exist_ok=True)
