import base64
import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import insightface
from datetime import datetime

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
# PUBLIC API (ORIGINAL)
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
    
    try:
        embedding = _extract_embedding(image_b64)
        print("Step 2: embedding shape:", embedding.shape if hasattr(embedding, "shape") else embedding)
    except Exception as e:
        print("Error extracting embedding:", e)
        return None

    session = ClassSession.query.get(session_id)
    print("Step 3: session found?", session is not None)
    if not session:
        return None

    students = Student.query.filter_by(class_id=session.class_id).all()
    print(f"Step 4: Found {len(students)} students in class {session.class_id}")
    if not students:
        return None

    try:
        db_embeddings = np.array([s.face_emb for s in students])
        similarities = cosine_similarity([embedding], db_embeddings)[0]
    except Exception as e:
        print("Error computing similarity:", e)
        return None

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])

    if best_score >= SIMILARITY_THRESHOLD:
        s = students[best_idx]
        return {
            "id": s.id,
            "name": s.name,
            "matricule": s.matricule,
            "score": round(best_score, 3),
        }

    return None


# ==========================================================
# ===================== NEW FUNCTIONS ======================
# ==========================================================

# =============================
# Extract ALL embeddings from image
# =============================
def extract_all_embeddings(image_b64: str):
    img = _b64_to_image(image_b64)
    faces = _face_app.get(img)

    if not faces or len(faces) == 0:
        raise ValueError("No faces detected")

    return [face.embedding.astype(float) for face in faces]


# =============================
# Recognize MULTIPLE faces
# =============================
def recognize_multiple_faces(image_b64: str, session_id: int):
    session = ClassSession.query.get(session_id)
    if not session:
        return []

    students = Student.query.filter_by(class_id=session.class_id).all()
    if not students:
        return []

    db_embeddings = np.array([s.face_emb for s in students])
    embeddings = extract_all_embeddings(image_b64)

    results = []

    for emb in embeddings:
        similarities = cosine_similarity([emb], db_embeddings)[0]
        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])

        if best_score >= SIMILARITY_THRESHOLD:
            s = students[best_idx]
            results.append({
                "id": s.id,
                "name": s.name,
                "matricule": s.matricule,
                "score": round(best_score, 3),
            })

    return results

# =============================
# Update student face
# =============================
def update_student_face(student_id: int, image_b64: str):
    student = Student.query.get(student_id)
    if not student:
        return None

    embedding = _extract_embedding(image_b64)
    student.face_emb = embedding.tolist()

    db.session.commit()
    return student

# =============================
# Manual similarity check
# =============================
def compare_two_faces(image1_b64: str, image2_b64: str):
    emb1 = _extract_embedding(image1_b64)
    emb2 = _extract_embedding(image2_b64)

    score = cosine_similarity([emb1], [emb2])[0][0]

    return {
        "similarity": round(float(score), 4),
        "match": score >= SIMILARITY_THRESHOLD
    }


# =============================
# Mark attendance
# =============================
def mark_attendance(student_id: int, session_id: int):
    student = Student.query.get(student_id)
    session = ClassSession.query.get(session_id)

    if not student or not session:
        return None

    # Example: assuming session has attendance list
    if not hasattr(session, "attendees"):
        session.attendees = []

    session.attendees.append(student.id)
    db.session.commit()

    return {
        "student": student.name,
        "session": session.id,
        "timestamp": datetime.utcnow().isoformat()
    }

# =============================
# WEBCAM LIVE RECOGNITION
# =============================
def recognize_from_webcam(session_id: int):
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Cannot open webcam")
        return

    session = ClassSession.query.get(session_id)
    if not session:
        print("Session not found")
        return

    students = Student.query.filter_by(class_id=session.class_id).all()

    if not students:
        print("No students found")
        return

    db_embeddings = np.array([s.face_emb for s in students])

    print("Starting webcam recognition... Press 'q' to quit")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        faces = _face_app.get(frame)

        for face in faces:
            emb = face.embedding.astype(float)

            similarities = cosine_similarity([emb], db_embeddings)[0]
            best_idx = int(np.argmax(similarities))
            best_score = float(similarities[best_idx])

            x1, y1, x2, y2 = face.bbox.astype(int)

            if best_score >= SIMILARITY_THRESHOLD:
                student = students[best_idx]
                name = f"{student.name} ({round(best_score,2)})"
            else:
                name = "Unknown"

            # draw box
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)

            # draw name
            cv2.putText(
                frame,
                name,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0,255,0),
                2
            )

        cv2.imshow("Face Recognition", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()