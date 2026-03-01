from flask import Blueprint, request, jsonify
from config.database import db
from models.ClassSession import ClassSession
from models.Student import Student
from models.Attendance import Attendance
from models.User import User
from utils.utilToken import token_required

class_session_student_bp = Blueprint("class_session_student", __name__)

# Route to get all students of a session by session_id
@class_session_student_bp.route("/session_students", methods=["GET"])
def get_session_students():
    session_id = request.args.get("session_id", type=int)
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    session = ClassSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    students = Student.query.filter_by(class_id=session.class_id).all()

    # Get attendance for this session
    attendance = Attendance.query.filter_by(class_session_id=session.id).all()
    attendance_map = {a.student_id: a for a in attendance}

    result = []
    for s in students:
        a = attendance_map.get(s.id)
        result.append({
            "id": s.id,
            "name": s.name,
            "matricule": s.matricule,
            "present": a.present if a else False,
            "attendance_id": a.id if a else None  
        })
    return jsonify(result)


# Route to get all attendances of a student
@class_session_student_bp.route("/student_attendance", methods=["GET"])
def get_student_attendance():
    student_id = request.args.get("student_id", type=int)
    if not student_id:
        return jsonify({"error": "Missing student_id"}), 400

    attendances = Attendance.query.filter_by(student_id=student_id).all()
    student = Student.query.get(student_id)
    result = []
    for a in attendances:
        # Get subject from the related class session
        class_session = ClassSession.query.get(a.class_session_id)
        subject = class_session.subject if class_session else None
        result.append({
            "matricule": student.matricule if student else None,
            "subject": subject,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "present": a.present
        })
    return jsonify(result)

# Route to get class sessions by class for students
@class_session_student_bp.route("/sessions_by_class", methods=["GET"])
@token_required
def sessions_by_class():
    user = request.user

    is_admin = user.get("isAdmin")
    class_id = user.get("idClass")

    # Student must have a class
    if not is_admin and not class_id:
        return jsonify({"error": "No class assigned"}), 403

    # Admin sees all sessions
    if is_admin:
        sessions = ClassSession.query.order_by(ClassSession.time.desc()).all()
    else:
        sessions = ClassSession.query.filter_by(
            class_id=class_id
        ).order_by(ClassSession.time.desc()).all()

    result = [{
        "id": s.id,
        "idRoom": s.idRoom,
        "nameRoom": s.room_ref.nameRoom if s.room_ref else None,
        "idCamera": s.room_ref.idCamera if s.room_ref else None,
        "nameCamera": s.room_ref.camera_ref.nameCamera if s.room_ref and s.room_ref.camera_ref else None,
        "urlCamera": s.room_ref.camera_ref.urlCamera if s.room_ref and s.room_ref.camera_ref else None,
        "room": s.room_ref.nameRoom if s.room_ref else None,
        "subject": s.subject,
        "time": s.time.strftime("%Y-%m-%d %H:%M"),
        "teacher_id": s.teacher_id,
        "class_id": s.class_id
    } for s in sessions]

    return jsonify(result)
