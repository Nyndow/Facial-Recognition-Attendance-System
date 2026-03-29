from flask import Blueprint, request, jsonify
import numpy as np
import os
import requests

from config.database import db
from models.Student import Student
from models.Attendance import Attendance


student_bp = Blueprint("students", __name__)
EMBED_API_URL = "http://127.0.0.1:5002/extract-embedding"

# Get all students
@student_bp.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "matricule": s.matricule,
            "class_id": s.class_id,
        }
        for s in students
    ])


# Get student by id
@student_bp.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify({
        "id": student.id,
        "name": student.name,
        "matricule": student.matricule,
        "class_id": student.class_id,
    })

# Add student
@student_bp.route("/students", methods=["POST"])
def add_student():
    data = request.json or {}
    image_b64 = data.get("image")
    class_id = data.get("class_id")

    if not image_b64:
        return jsonify({"error": "image is required"}), 400

    for field in ("name", "matricule"):
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
        
    embedding_list = []
    if class_id:
        students = Student.query.filter_by(class_id=class_id).all()
        embedding_list = [s.face_emb for s in students if s.face_emb]

    try:
        response = requests.post(
            EMBED_API_URL,
            json={
                "image": image_b64,
                "embedding_list": embedding_list
            }
        )

        if response.status_code != 200:
            try:
                error_data = response.json()
            except Exception:
                error_data = {"error": response.text}

            return jsonify(error_data), response.status_code

        face_emb = response.json().get("embedding")

    except Exception as e:
        return jsonify({"error": "Error calling embedding API", "details": str(e)}), 500

    if not face_emb:
        return jsonify({"error": "No face detected in the provided image"}), 400

    new_student = Student(
        name=data["name"],
        matricule=data["matricule"],
        class_id=class_id,
        face_emb=face_emb,
    )

    db.session.add(new_student)
    db.session.commit()

    return jsonify({"message": "Student added", "id": new_student.id}), 201

# Update student
@student_bp.route("/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.json or {}
    student.name = data.get("name", student.name)
    student.matricule = data.get("matricule", student.matricule)
    class_id = data.get("class_id", student.class_id)
    student.class_id = class_id

    image_b64 = data.get("image")

    if image_b64:
        embedding_list = []
        if class_id:
            students = Student.query.filter_by(class_id=class_id).all()
            embedding_list = [
                s.face_emb for s in students
                if s.face_emb and s.id != student_id
            ]

        try:
            response = requests.post(
                EMBED_API_URL,
                json={
                    "image": image_b64,
                    "embedding_list": embedding_list
                }
            )

            if response.status_code != 200:
                try:
                    error_data = response.json()
                except Exception:
                    error_data = {"error": response.text}

                return jsonify(error_data), response.status_code

            face_emb = response.json().get("embedding")

        except Exception as e:
            return jsonify({
                "error": "Error calling embedding API",
                "details": str(e)
            }), 500

        if not face_emb:
            return jsonify({
                "error": "No face detected in the provided image"
            }), 400

        student.face_emb = face_emb

    db.session.commit()

    return jsonify({"message": "Student updated"})


# Delete student
@student_bp.route("/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted"})