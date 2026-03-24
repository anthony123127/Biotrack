"""
Face Detection Service
Uses OpenCV's Haar Cascade classifier for detecting faces in images.
Provides utilities for decoding base64 images and extracting face regions.
"""
import base64
import cv2
import numpy as np
from typing import List, Tuple


class FaceDetector:
    """Handles face detection using OpenCV's pre-trained Haar Cascade."""

    def __init__(self):
        # Load the built-in Haar Cascade model for frontal face detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image.

        Args:
            image: BGR image as numpy array.

        Returns:
            List of face bounding boxes as (x, y, w, h) tuples.
        """
        # Convert to grayscale for cascade detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Run the Haar Cascade detector with tuned parameters
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )

        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]

    def extract_face(
        self,
        image: np.ndarray,
        bbox: Tuple[int, int, int, int],
        target_size: Tuple[int, int] = (160, 160),
    ) -> np.ndarray:
        """
        Crop and resize a detected face region from the image.

        Args:
            image: BGR image as numpy array.
            bbox: Bounding box (x, y, w, h) from detect_faces().
            target_size: Output dimensions (default 160x160 for FaceNet).

        Returns:
            Cropped and resized face image (BGR).
        """
        x, y, w, h = bbox

        # Add 20 % padding around the face for better recognition accuracy
        pad = int(0.2 * max(w, h))
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image.shape[1], x + w + pad)
        y2 = min(image.shape[0], y + h + pad)

        face = image[y1:y2, x1:x2]
        face = cv2.resize(face, target_size)
        return face

    @staticmethod
    def decode_base64_image(base64_string: str) -> np.ndarray:
        """
        Decode a base64-encoded image string into a BGR numpy array.

        Args:
            base64_string: Base64 string (may include a data-URI prefix).

        Returns:
            Decoded image as a BGR numpy array, or None on failure.
        """
        # Strip the data-URI prefix if present (e.g. "data:image/jpeg;base64,...")
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]

        img_bytes = base64.b64decode(base64_string)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        return image


# Singleton instance used across the application
face_detector = FaceDetector()
