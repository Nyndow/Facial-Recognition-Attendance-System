from flask import Blueprint, request, jsonify, send_file
from config.database import db
from models.ClassSession import ClassSession
from models.Class import Class
from utils.utilToken import token_required, admin_required
from utils.utilPdf import generate_attendance_pdf

from datetime import datetime
class_session_bp = Blueprint("class_sessions", __name__)


# Get all class sessions
@class_session_bp.route("/class_sessions", methods=["GET"])
@token_required
@admin_required
def get_class_sessions():
    sessions = ClassSession.query.all()
    return jsonify([
        {
            "id": s.id,
            "room": s.room,
            "subject": s.subject,
            "time": s.time.isoformat() if s.time else None,
            "teacher_id": s.teacher_id,
            "class_id": s.class_id
        } for s in sessions
    ])


# Get a single class session by ID
@class_session_bp.route("/class_sessions/<int:session_id>", methods=["GET"])
@token_required
@admin_required
def get_class_session(session_id):
    s = ClassSession.query.get_or_404(session_id)
    return jsonify({
        "id": s.id,
        "room": s.room,
        "subject": s.subject,
        "time": s.time.isoformat() if s.time else None,
        "teacher_id": s.teacher_id,
        "class_id": s.class_id
    })


# Create a new class session
@class_session_bp.route("/class_sessions", methods=["POST"])
@token_required
@admin_required
def add_class_session():
    data = request.json

    # Convert ISO string to datetime
    time_str = data.get("time")
    time_obj = None
    if time_str:
        time_obj = datetime.fromisoformat(time_str.replace("Z", "+00:00"))

    new_session = ClassSession(
        room=data["room"],
        subject=data["subject"],
        time=time_obj,
        teacher_id=data["teacher_id"],
        class_id=data["class_id"]
    )

    db.session.add(new_session)
    db.session.commit()
    return jsonify({"message": "Class session added", "id": new_session.id}), 201



# Update a class session
@class_session_bp.route("/class_sessions/<int:session_id>", methods=["PUT"])
@token_required
@admin_required
def update_class_session(session_id):
    s = ClassSession.query.get_or_404(session_id)
    data = request.json

    s.room = data.get("room", s.room)
    s.subject = data.get("subject", s.subject)

    # ✅ Convert time string to datetime
    time_str = data.get("time")
    if time_str:
        s.time = datetime.fromisoformat(time_str.replace("Z", "+00:00"))

    s.teacher_id = data.get("teacher_id", s.teacher_id)
    s.class_id = data.get("class_id", s.class_id)

    db.session.commit()
    return jsonify({"message": "Class session updated"})


# Delete a class session
@class_session_bp.route("/class_sessions/<int:session_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_class_session(session_id):
    s = ClassSession.query.get_or_404(session_id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({"message": "Class session deleted"})

@class_session_bp.route("/sessions", methods=["GET"])
@token_required
def get_sessions():
    user = request.user

    is_admin = user.get("isAdmin")
    class_id = user.get("idClass")
    teacher_id = user.get("idTeacher")

    # Check that non-admin users have at least class or teacher id
    if not is_admin and not class_id and not teacher_id:
        return jsonify({"error": "No class or teacher assigned"}), 403

    # Admin sees all sessions
    query = ClassSession.query

    if not is_admin:
        # Filter based on what the token provides
        if class_id:
            query = query.filter_by(class_id=class_id)
        elif teacher_id:
            query = query.filter_by(teacher_id=teacher_id)

    # Sort by most recent
    sessions = query.order_by(ClassSession.time.desc()).all()

    # Build result
    result = []
    from models.Teacher import Teacher
    for s in sessions:
        class_name = None
        if s.class_id:
            class_obj = Class.query.get(s.class_id)
            class_name = class_obj.name if class_obj else None
        teacher_name = None
        if s.teacher_id:
            teacher_obj = Teacher.query.get(s.teacher_id)
            teacher_name = teacher_obj.name if teacher_obj else None
        result.append({
            "id": s.id,
            "room": s.room,
            "subject": s.subject,
            "time": s.time.isoformat(),
            "teacher_name": teacher_name,
            "class_id": s.class_id,
            "class_name": class_name
        })

    return jsonify(result)

#get session info by id:
@class_session_bp.route("/sessions/by-session/<int:session_id>", methods=["GET"])
def get_session_by_session_id(session_id):
    session = ClassSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404

    from models.Teacher import Teacher

    # Resolve class name
    class_name = None
    if session.class_id:
        class_obj = Class.query.get(session.class_id)
        class_name = class_obj.name if class_obj else None

    # Resolve teacher name
    teacher_name = None
    if session.teacher_id:
        teacher_obj = Teacher.query.get(session.teacher_id)
        teacher_name = teacher_obj.name if teacher_obj else None

    result = {
        "id": session.id,
        "room": session.room,
        "subject": session.subject,
        "time": session.time.strftime("%Y-%m-%d %H:%M") if session.time else None,
        "teacher_name": teacher_name,
        "class_id": session.class_id,
        "class_name": class_name
    }

    return jsonify(result)

@class_session_bp.route("/export-attendance", methods=["POST"])
def export_attendance():
    data = request.get_json()
    session = data.get("session")
    students = data.get("students")

    if not session or not students:
        return {"message": "Missing data"}, 400

    pdf_buffer = generate_attendance_pdf(session, students)
    # Return PDF directly as response
    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"attendance_{session.get('id', 'sheet')}.pdf"
    )

