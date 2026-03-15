from flask import Blueprint, request, jsonify, send_file
from config.database import db
from models.ClassSession import ClassSession
from models.Class import Class
from models.Room import Room
from utils.utilToken import token_required, admin_required
from utils.utilPdf import generate_attendance_pdf

from datetime import datetime
class_session_bp = Blueprint("class_sessions", __name__)

def _serialize_session(session, class_name=None, teacher_name=None):
    room_name = session.room_ref.nameRoom if session.room_ref else None
    camera_id = session.room_ref.idCamera if session.room_ref else None
    camera_name = None
    if session.room_ref and session.room_ref.camera_ref:
        camera_name = session.room_ref.camera_ref.nameCamera
    return {
        "id": session.id,
        "idRoom": session.idRoom,
        "nameRoom": room_name,
        "room": room_name,  # backward-compatible response field
        "idCamera": camera_id,
        "nameCamera": camera_name,
        "subject": session.subject,
        "time": session.time.isoformat() if session.time else None,
        "endSession": session.endSession.isoformat() if session.endSession else None,
        "teacher_id": session.teacher_id,
        "teacher_name": teacher_name,
        "class_id": session.class_id,
        "class_name": class_name
    }


# Get all class sessions
@class_session_bp.route("/class_sessions", methods=["GET"])
@token_required
@admin_required
def get_class_sessions():
    sessions = ClassSession.query.all()
    return jsonify([_serialize_session(s) for s in sessions])


# Get a single class session by ID
@class_session_bp.route("/class_sessions/<int:session_id>", methods=["GET"])
@token_required
@admin_required
def get_class_session(session_id):
    s = ClassSession.query.get_or_404(session_id)
    return jsonify(_serialize_session(s))


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

    end_time_str = data.get("endSession")
    end_time_obj = None
    if end_time_str:
        end_time_obj = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
    else:
        return jsonify({"error": "endSession is required"}), 400

    room_id = data.get("idRoom")
    if room_id is None and data.get("room"):
        room = Room.query.filter_by(nameRoom=data["room"]).first()
        room_id = room.idRoom if room else None

    if room_id is None:
        return jsonify({"error": "idRoom is required"}), 400

    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404

    new_session = ClassSession(
        idRoom=room_id,
        subject=data["subject"],
        time=time_obj,
        endSession=end_time_obj,
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

    if "idRoom" in data:
        room = Room.query.get(data["idRoom"])
        if not room:
            return jsonify({"error": "Room not found"}), 404
        s.idRoom = data["idRoom"]
    elif "room" in data:
        room = Room.query.filter_by(nameRoom=data["room"]).first()
        if not room:
            return jsonify({"error": "Room not found"}), 404
        s.idRoom = room.idRoom

    s.subject = data.get("subject", s.subject)

    # ✅ Convert time string to datetime
    time_str = data.get("time")
    if time_str:
        s.time = datetime.fromisoformat(time_str.replace("Z", "+00:00"))

    if "endSession" in data:
        end_time_str = data.get("endSession")
        if end_time_str:
            s.endSession = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
        else:
            return jsonify({"error": "endSession cannot be empty"}), 400

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
        result.append(_serialize_session(s, class_name=class_name, teacher_name=teacher_name))

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

    result = _serialize_session(session, class_name=class_name, teacher_name=teacher_name)
    result["time"] = session.time.strftime("%Y-%m-%d %H:%M") if session.time else None
    result["endSession"] = session.endSession.strftime("%Y-%m-%d %H:%M") if session.endSession else None

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
