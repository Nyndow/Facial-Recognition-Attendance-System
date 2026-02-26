import base64
import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import insightface

from models.Student import Student
from models.ClassSession import ClassSession
from config.database import db

# =============================
# CONFIG
# =============================
SIMILARITY_THRESHOLD = 0.5

# =============================
# LOAD FACE MODEL (SINGLETON)
# =============================
_face_app = insightface.app.FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)
_face_app.prepare(ctx_id=0, det_size=(640, 640))

# =============================
# BASE64 → IMAGE
# =============================
def _b64_to_image(image_b64: str) -> np.ndarray:
    """
    Convert base64 string to OpenCV image
    """
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]

    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)

    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid base64 image")

    return img

# =============================
# EMBEDDING EXTRACTION
# =============================
def _extract_embedding(image_b64: str) -> np.ndarray:
    img = _b64_to_image(image_b64)

    if img is None:
        raise ValueError("Image decoding failed")

    faces = _face_app.get(img)

    if faces is None:
        raise ValueError("Face model returned None")

    if len(faces) == 0:
        raise ValueError("No face detected in image")

    embedding = faces[0].embedding

    if embedding is None:
        raise ValueError("Embedding extraction failed")

    return embedding.astype(float)


# =============================
# PUBLIC API
# =============================
def register_face(name: str, matricule: str, image_b64: str):
    embedding = _extract_embedding(image_b64)

    student = Student(
        name=name,
        matricule=matricule,
        face_emb=embedding.tolist()
    )

    db.session.add(student)
    db.session.commit()

    return student


def recognize_face(image_b64: str, session_id: int):
    print("Step 1: Start recognize_face")
    
    # Step 2: Extract embedding
    try:
        embedding = _extract_embedding(image_b64)
        print("Step 2: embedding shape:", embedding.shape if hasattr(embedding, "shape") else embedding)
    except Exception as e:
        print("Error extracting embedding:", e)
        return None

    # Step 3: Get the session
    session = ClassSession.query.get(session_id)
    print("Step 3: session found?", session is not None)
    if not session:
        print("Step 3: No session with id", session_id)
        return None

    # Step 4: Get students for that class
    students = Student.query.filter_by(class_id=session.class_id).all()
    print(f"Step 4: Found {len(students)} students in class {session.class_id}")
    if not students:
        print("Step 4: No students found")
        return None

    # Step 5: Compute similarity
    try:
        db_embeddings = np.array([s.face_emb for s in students])
        similarities = cosine_similarity([embedding], db_embeddings)[0]
        print("Step 5: similarities", similarities)
    except Exception as e:
        print("Error computing similarity:", e)
        return None

    # Step 6: Find best match
    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])
    print(f"Step 6: Best score {best_score} at index {best_idx}")

    # Step 7: Check threshold
    if best_score >= SIMILARITY_THRESHOLD:
        s = students[best_idx]
        print(f"Step 7: Match found - {s.name}")
        return {
            "id": s.id,
            "name": s.name,
            "matricule": s.matricule,
            "score": round(best_score, 3),
        }

    print("Step 7: No match above threshold")
    return None
