from flask import Blueprint, request, jsonify
import numpy as np
import os

from config.database import db
from models.Student import Student
from models.Attendance import Attendance

student_bp = Blueprint("students", __name__)

# ---------------------------------------------------------------------------
# Path to your trained Tiny YOLO weights — override via env var or set here
# ---------------------------------------------------------------------------
YOLO_WEIGHTS_PATH = os.environ.get("YOLO_WEIGHTS_PATH", "models/best.pt")

# ---------------------------------------------------------------------------
# GET /students  — list all
# ---------------------------------------------------------------------------
@student_bp.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "matricule": s.matricule,
            "class_id": s.class_id,
            # omit face_emb from list view (large payload)
        }
        for s in students
    ])


# ---------------------------------------------------------------------------
# GET /students/<id>
# ---------------------------------------------------------------------------
@student_bp.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify({
        "id": student.id,
        "name": student.name,
        "matricule": student.matricule,
        "class_id": student.class_id,
    })


# # ---------------------------------------------------------------------------
# # POST /students  — register a new student
# # ---------------------------------------------------------------------------
# @student_bp.route("/students", methods=["POST"])
# def add_student():
#     data = request.json or {}
#     image_b64 = data.get("image")

#     if not image_b64:
#         return jsonify({"error": "image is required"}), 400

#     for field in ("name", "matricule"):
#         if not data.get(field):
#             return jsonify({"error": f"{field} is required"}), 400

#     # 1. Detect face + extract ArcFace embedding
#     face_emb = extract_embedding(image_b64, YOLO_WEIGHTS_PATH)
#     if face_emb is None:
#         return jsonify({"error": "No face detected in the provided image"}), 400

#     # 2. Duplicate-face check
#     students = Student.query.all()
#     matched, score = find_matching_student(face_emb, students)
#     if matched:
#         return jsonify({
#             "error": "Face already registered",
#             "matched_student": {
#                 "id": matched.id,
#                 "name": matched.name,
#                 "matricule": matched.matricule,
#             },
#             "score": round(score, 3),
#         }), 409

#     # 3. Persist new student
#     new_student = Student(
#         name=data["name"],
#         matricule=data["matricule"],
#         class_id=data.get("class_id"),
#         face_emb=face_emb.tolist(),
#     )
#     db.session.add(new_student)
#     db.session.commit()

#     return jsonify({"message": "Student added", "id": new_student.id}), 201


# ---------------------------------------------------------------------------
# PUT /students/<id>  — update student info and/or face
# ---------------------------------------------------------------------------
# @student_bp.route("/students/<int:student_id>", methods=["PUT"])
# def update_student(student_id):
#     student = Student.query.get_or_404(student_id)
#     data = request.json or {}

#     student.name = data.get("name", student.name)
#     student.matricule = data.get("matricule", student.matricule)
#     student.class_id = data.get("class_id", student.class_id)

#     image_b64 = data.get("image")
#     if image_b64:
#         face_emb = extract_embedding(image_b64, YOLO_WEIGHTS_PATH)
#         if face_emb is None:
#             return jsonify({"error": "No face detected in the provided image"}), 400

#         # Optional: guard against accidentally overwriting with another person's face
#         other_students = [s for s in Student.query.all() if s.id != student_id]
#         matched, score = find_matching_student(face_emb, other_students)
#         if matched:
#             return jsonify({
#                 "error": "Face belongs to another registered student",
#                 "matched_student": {
#                     "id": matched.id,
#                     "name": matched.name,
#                     "matricule": matched.matricule,
#                 },
#                 "score": round(score, 3),
#             }), 409

#         student.face_emb = face_emb.tolist()

#     db.session.commit()
#     return jsonify({"message": "Student updated"})


# ---------------------------------------------------------------------------
# DELETE /students/<id>
# ---------------------------------------------------------------------------
@student_bp.route("/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted"})


# # ---------------------------------------------------------------------------
# # POST /students/upload-picture  — recognize face + mark attendance
# # ---------------------------------------------------------------------------
# @student_bp.route("/students/upload-picture", methods=["POST"])
# def upload_picture():
#     data = request.json or {}
#     image_b64 = data.get("image")
#     session_id = data.get("session_id")

#     if not image_b64:
#         return jsonify({"error": "No image provided"}), 400
#     if not session_id:
#         return jsonify({"error": "No session_id provided"}), 400

#     try:
#         session_id = int(session_id)
#     except (TypeError, ValueError):
#         return jsonify({"error": "session_id must be an integer"}), 400

#     # Fetch the session to get its class_id
#     from models.ClassSession import ClassSession
#     session = ClassSession.query.get(session_id)
#     if session is None:
#         return jsonify({"error": "Class session not found"}), 404

#     # Only compare against students in that class
#     class_students = Student.query.filter_by(class_id=session.class_id).all()
#     if not class_students:
#         return jsonify({"message": "No students registered in this class"}), 200

#     result = recognize_face(image_b64, YOLO_WEIGHTS_PATH, class_students)

#     if result is None:
#         return jsonify({"message": "No matching student found"}), 200

#     student_id = result["id"]

#     # Mark attendance (idempotent)
#     attendance = Attendance.query.filter_by(
#         student_id=student_id,
#         class_session_id=session_id,
#     ).first()

#     if not attendance:
#         attendance = Attendance(
#             student_id=student_id,
#             class_session_id=session_id,
#             present=True,
#         )
#         db.session.add(attendance)
#         db.session.commit()

#     return jsonify({
#         "message": "Student recognized",
#         "student": result,
#         "attendance": "updated",
#     }), 200