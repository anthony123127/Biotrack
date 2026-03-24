"""
Face Recognition Service
Uses FaceNet (InceptionResnetV1 from facenet-pytorch) to generate 512-dimensional
face embeddings and compare them via Euclidean distance.
"""
import cv2
import numpy as np
import torch
from facenet_pytorch import InceptionResnetV1
from typing import List, Optional, Tuple


class FaceRecognizer:
    """Generates face embeddings and finds matching students."""

    def __init__(self):
        # Select GPU if available, otherwise fall back to CPU
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load the pre-trained FaceNet model (trained on VGGFace2)
        self.model = InceptionResnetV1(pretrained="vggface2").eval().to(self.device)

        print(f"[BioTrack] FaceNet model loaded on {self.device}")

    # ------------------------------------------------------------------
    # Embedding generation
    # ------------------------------------------------------------------

    def get_embedding(self, face_image: np.ndarray) -> np.ndarray:
        """
        Generate a 512-dimensional face embedding from a cropped face image.

        Args:
            face_image: Cropped face (BGR, ideally 160x160).

        Returns:
            512-d numpy float32 vector.
        """
        # BGR -> RGB
        face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)

        # Resize to the FaceNet input size (160x160)
        face_resized = cv2.resize(face_rgb, (160, 160))

        # Normalize pixel values to the [-1, 1] range expected by FaceNet
        face_normalized = (face_resized.astype(np.float32) - 127.5) / 128.0

        # Convert from (H, W, C) to (1, C, H, W) tensor
        face_tensor = (
            torch.from_numpy(face_normalized).permute(2, 0, 1).unsqueeze(0)
        )
        face_tensor = face_tensor.to(self.device)

        # Forward pass — no gradient computation needed for inference
        with torch.no_grad():
            embedding = self.model(face_tensor)

        return embedding.cpu().numpy().flatten()

    # ------------------------------------------------------------------
    # Embedding comparison
    # ------------------------------------------------------------------

    @staticmethod
    def compare_embeddings(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate the Euclidean distance between two embeddings.
        A lower distance indicates higher similarity.
        """
        return float(np.linalg.norm(embedding1 - embedding2))

    def find_match(
        self,
        query_embedding: np.ndarray,
        stored_embeddings: List[Tuple[str, np.ndarray]],
        threshold: float = 1.0,
    ) -> Optional[Tuple[str, float]]:
        """
        Find the closest matching student from a list of stored embeddings.

        Args:
            query_embedding: 512-d vector of the detected face.
            stored_embeddings: List of (student_id, embedding) tuples.
            threshold: Maximum Euclidean distance for a valid match.

        Returns:
            (student_id, distance) of the best match, or None if no match
            is within the threshold.
        """
        best_match = None
        best_distance = float("inf")

        for student_id, stored_embedding in stored_embeddings:
            distance = self.compare_embeddings(query_embedding, stored_embedding)
            if distance < best_distance:
                best_distance = distance
                best_match = student_id

        if best_match is not None and best_distance < threshold:
            return (best_match, best_distance)

        return None

    # ------------------------------------------------------------------
    # Serialization helpers (for database storage)
    # ------------------------------------------------------------------

    @staticmethod
    def serialize_embedding(embedding: np.ndarray) -> bytes:
        """Convert a numpy embedding to raw bytes for VARBINARY storage."""
        return embedding.astype(np.float32).tobytes()

    @staticmethod
    def deserialize_embedding(data: bytes) -> np.ndarray:
        """Restore a numpy embedding from raw bytes."""
        return np.frombuffer(data, dtype=np.float32)


# Singleton instance used across the application
face_recognizer = FaceRecognizer()
