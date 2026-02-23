from flask import Blueprint, request, jsonify
from config.database import db
from models.Teacher import Teacher
from utils.utilToken import token_required, admin_required

teacher_bp = Blueprint("teachers", __name__)

# Get all teachers
@teacher_bp.route("/teachers", methods=["GET"])
@token_required
@admin_required
def get_teachers():
    teachers = Teacher.query.all()
    return jsonify([
        {"id": t.id, "name": t.name} for t in teachers
    ])

# Get a single teacher by ID
@teacher_bp.route("/teachers/<int:teacher_id>", methods=["GET"])
@token_required
@admin_required
def get_teacher(teacher_id):
    t = Teacher.query.get_or_404(teacher_id)
    return jsonify({"id": t.id, "name": t.name})

# Create a new teacher
@teacher_bp.route("/teachers", methods=["POST"])
@token_required
@admin_required
def add_teacher():
    data = request.json
    new_teacher = Teacher(name=data["name"])
    db.session.add(new_teacher)
    db.session.commit()
    return jsonify({"message": "Teacher added", "id": new_teacher.id}), 201

# Update a teacher
@teacher_bp.route("/teachers/<int:teacher_id>", methods=["PUT"])
@token_required
@admin_required
def update_teacher(teacher_id):
    t = Teacher.query.get_or_404(teacher_id)
    data = request.json
    t.name = data.get("name", t.name)
    db.session.commit()
    return jsonify({"message": "Teacher updated"})

# Delete a teacher
@teacher_bp.route("/teachers/<int:teacher_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_teacher(teacher_id):
    t = Teacher.query.get_or_404(teacher_id)
    db.session.delete(t)
    db.session.commit()
    return jsonify({"message": "Teacher deleted"})
