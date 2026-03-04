from flask import Blueprint, request, jsonify, send_file
import numpy as np
from config.database import db
from models.Student import Student
from models.Attendance import Attendance
from utils.ai import _extract_embedding, recognize_face
from sklearn.metrics.pairwise import cosine_similarity
import os
import base64

student_bp = Blueprint("students", __name__)

@student_bp.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    return jsonify([
        {"id": s.id, "name": s.name, "face_emb": s.face_emb, "matricule": s.matricule, "class_id": s.class_id}
        for s in students
    ])

@student_bp.route("/students", methods=["POST"])
def add_student():
    SIMILARITY_THRESHOLD = 0.5
    data = request.json
    image_b64 = data.get("image")

    if not image_b64:
        return jsonify({"error": "Image is required"}), 400

    try:
        # 1. Extract embedding (also checks face exists)
        face_emb = _extract_embedding(image_b64)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # 2. Check if face already exists
    students = Student.query.all()
    if students:
        db_embeddings = np.array([s.face_emb for s in students])
        similarities = cosine_similarity([face_emb], db_embeddings)[0]

        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])

        if best_score >= SIMILARITY_THRESHOLD:
            existing = students[best_idx]
            return jsonify({
                "error": "Face already registered",
                "matched_student": {
                    "id": existing.id,
                    "name": existing.name,
                    "matricule": existing.matricule,
                },
                "score": round(best_score, 3),
            }), 409  # Conflict

    # 3. Register new student
    new_student = Student(
        name=data["name"],
        face_emb=face_emb.tolist(),
        matricule=data["matricule"],
        class_id=data.get("class_id"),
    )

    db.session.add(new_student)
    db.session.commit()

    return jsonify({"message": "Student added"}), 201

@student_bp.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify({"id": student.id, "name": student.name, "face_emb": student.face_emb, "matricule": student.matricule, "class_id": student.class_id})

@student_bp.route("/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.json
    student.name = data.get("name", student.name)
    student.matricule = data.get("matricule", student.matricule)
    student.class_id = data.get("class_id", student.class_id)

    image_b64 = data.get("image")
    if image_b64:
        try:
            student.face_emb = _extract_embedding(image_b64).tolist()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
    else:
        student.face_emb = data.get("face_emb", student.face_emb)

    db.session.commit()
    return jsonify({"message": "Student updated"})

@student_bp.route("/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted"})

@student_bp.route("/students/upload-picture", methods=["POST"])
def upload_picture():
    data = request.json
    image_b64 = data.get("image")
    session_id = data.get("session_id")

    if not image_b64:
        return jsonify({"error": "No image provided"}), 400

    if not session_id:
        return jsonify({"error": "No session_id provided"}), 400

    try:
        session_id = int(session_id)
        result = recognize_face(image_b64, session_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if result:
        student_id = result["id"]

        # CHECK IF ALREADY MARKED PRESENT
        attendance = Attendance.query.filter_by(
            student_id=student_id,
            class_session_id=session_id
        ).first()

        if not attendance:
            attendance = Attendance(
                student_id=student_id,
                class_session_id=session_id,
                present=True
            )
            db.session.add(attendance)
            db.session.commit()

        return jsonify({
            "message": "Student recognized",
            "student": result,
            "attendance": "updated"
        }), 200

    return jsonify({"message": "No matching student found"}), 200
