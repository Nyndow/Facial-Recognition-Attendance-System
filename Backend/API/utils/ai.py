import base64
import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
from insightface.app import FaceAnalysis

_arcface_app = None
_yolo_face_model = None

# =============================
# YOLO (best.pt) LIVE FACE DETECTION
# =============================
def detect(conf_threshold: float = 0.5, camera_index: int = 0):

    model_path = Path(__file__).resolve().parents[2] / "AI" / "best.pt"
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    model = YOLO(str(model_path))
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        raise RuntimeError("Cannot open webcam")

    print("Starting YOLO webcam detection... Press 'q' to quit")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        results = model.predict(frame, conf=conf_threshold, verbose=False)
        if results:
            boxes = results[0].boxes
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0]) if hasattr(box, "conf") else 0.0

                    x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
                    label = f"Face {conf:.2f}"

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame,
                        label,
                        (x1, max(0, y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 0),
                        2,
                    )

        cv2.imshow("YOLO Face Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


# =============================
# ArcFace (InsightFace) Face Recognition
# =============================
def _get_arcface_app():
    global _arcface_app
    if _arcface_app is not None:
        return _arcface_app

    app = FaceAnalysis(name="buffalo_l")
    # ctx_id = -1 forces CPU; change to 0 if GPU is available
    app.prepare(ctx_id=-1, det_size=(640, 640))
    _arcface_app = app
    return _arcface_app


def _get_yolo_face_model():
    global _yolo_face_model
    if _yolo_face_model is not None:
        return _yolo_face_model

    model_path = Path(__file__).resolve().parents[2] / "AI" / "best.pt"
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    _yolo_face_model = YOLO(str(model_path))
    return _yolo_face_model


def _decode_base64_image(image_b64: str) -> np.ndarray:
    if not image_b64:
        raise ValueError("Image is required")

    # Handle data URI prefix if present
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as exc:
        raise ValueError("Invalid base64 image") from exc

    img_array = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    return img


def extract_arcface_embedding(image_b64: str) -> np.ndarray:
    """
    Extract a normalized ArcFace embedding from a base64 image.
    Returns a 1D float32 numpy array.
    """
    img = _decode_base64_image(image_b64)
    app = _get_arcface_app()

    faces = app.get(img)
    if not faces:
        raise ValueError("No face detected")

    # Pick the largest detected face
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    emb = face.normed_embedding
    if emb is None:
        raise ValueError("Failed to extract embedding")

    return emb.astype(np.float32)


def extract_arcface_embedding_with_yolo(image_b64: str, conf_threshold: float = 0.5) -> np.ndarray:
    """
    Detect face using YOLO (best.pt), then extract ArcFace embedding.
    Returns a 1D float32 numpy array.
    """
    img = _decode_base64_image(image_b64)
    model = _get_yolo_face_model()

    results = model.predict(img, conf=conf_threshold, verbose=False)
    if not results:
        raise ValueError("No face detected")

    boxes = results[0].boxes
    if boxes is None or len(boxes) == 0:
        raise ValueError("No face detected")

    # Pick the largest detected box
    best_box = None
    best_area = 0.0
    for box in boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        area = max(0.0, (x2 - x1)) * max(0.0, (y2 - y1))
        if area > best_area:
            best_area = area
            best_box = (x1, y1, x2, y2)

    if best_box is None:
        raise ValueError("No face detected")

    x1, y1, x2, y2 = map(int, best_box)
    h, w = img.shape[:2]
    x1 = max(0, min(x1, w - 1))
    y1 = max(0, min(y1, h - 1))
    x2 = max(0, min(x2, w))
    y2 = max(0, min(y2, h))
    if x2 <= x1 or y2 <= y1:
        raise ValueError("Invalid face box")

    crop = img[y1:y2, x1:x2]
    app = _get_arcface_app()
    faces = app.get(crop)
    if not faces:
        raise ValueError("No face detected")

    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    emb = face.normed_embedding
    if emb is None:
        raise ValueError("Failed to extract embedding")

    return emb.astype(np.float32)


def compare_embeddings(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """
    Cosine similarity between two embeddings.
    Returns a float in [-1, 1], higher is more similar.
    """
    if emb1 is None or emb2 is None:
        raise ValueError("Embeddings must not be None")

    v1 = np.asarray(emb1, dtype=np.float32)
    v2 = np.asarray(emb2, dtype=np.float32)
    if v1.ndim != 1 or v2.ndim != 1:
        raise ValueError("Embeddings must be 1D vectors")

    denom = (np.linalg.norm(v1) * np.linalg.norm(v2))
    if denom == 0:
        raise ValueError("Zero-norm embedding")

    return float(np.dot(v1, v2) / denom)


def match_embedding(query_emb: np.ndarray, db_embeddings: np.ndarray):
    """
    Compare a query embedding to a list/array of embeddings.
    Returns (best_index, best_score). If db is empty, returns (None, None).
    """
    if db_embeddings is None or len(db_embeddings) == 0:
        return None, None

    db = np.asarray(db_embeddings, dtype=np.float32)
    q = np.asarray(query_emb, dtype=np.float32)

    # Normalize if not already
    q = q / (np.linalg.norm(q) + 1e-8)
    db = db / (np.linalg.norm(db, axis=1, keepdims=True) + 1e-8)

    scores = np.dot(db, q)
    best_idx = int(np.argmax(scores))
    best_score = float(scores[best_idx])
    return best_idx, best_score
