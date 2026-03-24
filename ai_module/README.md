# BioTrack AI Module
## Facial Recognition Pipeline Using FaceNet

This module implements the deep-learning-based facial recognition pipeline used by
BioTrack for automated student identification at campus gates.

## Pipeline Overview

```
Camera Frame → Face Detection (OpenCV) → Face Cropping → Embedding Generation (FaceNet) → Embedding Comparison → Identity Match
```

### Stage 1 — Face Detection
- **Library:** OpenCV (Haar Cascade Classifier)
- **Model:** `haarcascade_frontalface_default.xml` (built into OpenCV)
- **Parameters:** scaleFactor=1.1, minNeighbors=5, minSize=80×80
- **Output:** List of bounding boxes `(x, y, w, h)` for each detected face

### Stage 2 — Face Preprocessing
- Crop the detected face region with 20% padding for context
- Resize the cropped face to 160×160 pixels (FaceNet input size)
- Convert from BGR to RGB color space
- Normalize pixel values to the [-1, 1] range: `(pixel - 127.5) / 128.0`

### Stage 3 — Embedding Generation
- **Model:** InceptionResnetV1 from `facenet-pytorch` (pre-trained on VGGFace2)
- **Output:** 512-dimensional float32 embedding vector per face
- The embedding is a compact numerical representation of the face's identity

### Stage 4 — Embedding Comparison
- **Method:** Euclidean distance between query embedding and all stored embeddings
- **Threshold:** Configurable via `FACE_RECOGNITION_THRESHOLD` (default: 1.0)
- Lower distance = higher similarity; a match is accepted if distance < threshold
- The student with the lowest distance below the threshold is selected as the match

## Key Files

| File | Purpose |
|------|---------|
| `face_recognition_pipeline.py` | Standalone pipeline script for testing |
| `../backend/services/face_detection.py` | Face detection service (OpenCV Haar Cascade) |
| `../backend/services/face_recognition_service.py` | FaceNet embedding & matching service |

## Embedding Storage

Face embeddings are serialized as raw `float32` bytes and stored in the `Students.FaceEmbedding`
column (`VARBINARY(MAX)` in SQL Server). Each embedding is 512 × 4 = 2048 bytes.

## Hardware Requirements

- **CPU:** Runs on any modern CPU; inference takes ~50–100 ms per face
- **GPU (optional):** CUDA-compatible GPU accelerates inference to ~10–20 ms per face
- The pipeline automatically detects and uses GPU if available via PyTorch

## Dependencies

- `opencv-python` — Face detection and image processing
- `facenet-pytorch` — Pre-trained InceptionResnetV1 model
- `torch` / `torchvision` — Deep learning framework
- `numpy` — Numerical operations
- `Pillow` — Image handling utilities
