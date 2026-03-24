"""
BioTrack AI Module — Face Recognition Pipeline
Standalone script for testing and batch-processing face recognition.

Usage:
  python face_recognition_pipeline.py --image path/to/image.jpg
  python face_recognition_pipeline.py --register --student-id 2024-00001 --image path/to/face.jpg
"""
import argparse
import sys
import os
import cv2
import numpy as np
import torch
from facenet_pytorch import InceptionResnetV1


# ---------------------------------------------------------------------------
# Pipeline Components
# ---------------------------------------------------------------------------

class FaceRecognitionPipeline:
    """End-to-end pipeline: detect → preprocess → embed → compare."""

    def __init__(self, threshold: float = 1.0):
        self.threshold = threshold

        # Face detection — Haar Cascade
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        # Face embedding — FaceNet (InceptionResnetV1 pre-trained on VGGFace2)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = InceptionResnetV1(pretrained="vggface2").eval().to(self.device)
        print(f"[Pipeline] FaceNet loaded on {self.device}")

    # ----- Detection -----

    def detect_faces(self, image: np.ndarray):
        """Detect faces and return bounding boxes."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]

    # ----- Preprocessing -----

    def preprocess_face(self, image: np.ndarray, bbox: tuple) -> np.ndarray:
        """Crop, pad, and resize a face region to 160×160."""
        x, y, w, h = bbox
        pad = int(0.2 * max(w, h))
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image.shape[1], x + w + pad)
        y2 = min(image.shape[0], y + h + pad)
        face = image[y1:y2, x1:x2]
        return cv2.resize(face, (160, 160))

    # ----- Embedding -----

    def get_embedding(self, face_bgr: np.ndarray) -> np.ndarray:
        """Generate a 512-d embedding from a 160×160 BGR face image."""
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        face_norm = (face_rgb.astype(np.float32) - 127.5) / 128.0
        tensor = torch.from_numpy(face_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)
        with torch.no_grad():
            embedding = self.model(tensor)
        return embedding.cpu().numpy().flatten()

    # ----- Comparison -----

    @staticmethod
    def euclidean_distance(emb1: np.ndarray, emb2: np.ndarray) -> float:
        return float(np.linalg.norm(emb1 - emb2))

    def find_match(self, query_emb, stored_embeddings, threshold=None):
        """Return (label, distance) of the best match, or None."""
        threshold = threshold or self.threshold
        best_label, best_dist = None, float("inf")
        for label, emb in stored_embeddings:
            dist = self.euclidean_distance(query_emb, emb)
            if dist < best_dist:
                best_label, best_dist = label, dist
        if best_label and best_dist < threshold:
            return best_label, round(best_dist, 4)
        return None

    # ----- Serialization -----

    @staticmethod
    def serialize(embedding: np.ndarray) -> bytes:
        return embedding.astype(np.float32).tobytes()

    @staticmethod
    def deserialize(data: bytes) -> np.ndarray:
        return np.frombuffer(data, dtype=np.float32)

    # ----- High-level helpers -----

    def process_image(self, image_path: str):
        """Detect all faces in an image and return their embeddings."""
        image = cv2.imread(image_path)
        if image is None:
            print(f"[Error] Cannot read image: {image_path}")
            return []

        faces = self.detect_faces(image)
        print(f"[Pipeline] Detected {len(faces)} face(s) in {image_path}")

        results = []
        for i, bbox in enumerate(faces):
            face_crop = self.preprocess_face(image, bbox)
            embedding = self.get_embedding(face_crop)
            results.append({
                "index": i,
                "bbox": bbox,
                "embedding_shape": embedding.shape,
                "embedding": embedding,
            })
            print(f"  Face {i}: bbox={bbox}, embedding_norm={np.linalg.norm(embedding):.4f}")

        return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="BioTrack Face Recognition Pipeline")
    parser.add_argument("--image", required=True, help="Path to input image")
    parser.add_argument("--register", action="store_true", help="Register mode (save embedding)")
    parser.add_argument("--student-id", help="Student ID for registration")
    parser.add_argument("--threshold", type=float, default=1.0, help="Match threshold")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"[Error] Image not found: {args.image}")
        sys.exit(1)

    pipeline = FaceRecognitionPipeline(threshold=args.threshold)
    results = pipeline.process_image(args.image)

    if not results:
        print("[Result] No faces detected.")
        sys.exit(0)

    if args.register:
        if not args.student_id:
            print("[Error] --student-id is required for registration")
            sys.exit(1)
        if len(results) != 1:
            print("[Error] Registration requires exactly one face in the image")
            sys.exit(1)

        emb_bytes = pipeline.serialize(results[0]["embedding"])
        save_path = f"{args.student_id}_embedding.bin"
        with open(save_path, "wb") as f:
            f.write(emb_bytes)
        print(f"[Saved] Embedding for {args.student_id} → {save_path} ({len(emb_bytes)} bytes)")
    else:
        for r in results:
            print(f"\n  Face {r['index']}: {r['embedding_shape']} embedding generated")
            print(f"    Bounding box: {r['bbox']}")


if __name__ == "__main__":
    main()
