from flask import Blueprint, request, jsonify
from config.database import db
from models.Attendance import Attendance
from models.Class import Class
from models.ClassSession import ClassSession
from models.Room import Room
from models.Student import Student
from models.Teacher import Teacher
from utils.utilToken import token_required, admin_required
from datetime import datetime

attendance_bp = Blueprint("attendance", __name__)


def _serialize_attendance_record(record):
    return {
        "id": record.id,
        "student_id": record.student_id,
        "class_session_id": record.class_session_id,
        "timestamp": record.timestamp.isoformat() if record.timestamp else None,
        "present": record.present
    }


def _build_attendance_overview():
    sessions = ClassSession.query.order_by(ClassSession.time.desc()).all()
    attendance_records = Attendance.query.all()
    students = Student.query.all()
    classes = Class.query.all()
    teachers = Teacher.query.all()
    rooms = Room.query.all()

    attendance_map = {
        (record.class_session_id, record.student_id): record for record in attendance_records
    }
    students_by_class = {}
    for student in students:
        students_by_class.setdefault(student.class_id, []).append(student)

    classes_by_id = {class_item.id: class_item for class_item in classes}
    teachers_by_id = {teacher.id: teacher for teacher in teachers}
    rooms_by_id = {room.idRoom: room for room in rooms}

    overview = []
    for session in sessions:
        class_students = students_by_class.get(session.class_id, [])
        room = rooms_by_id.get(session.idRoom)
        class_item = classes_by_id.get(session.class_id)
        teacher = teachers_by_id.get(session.teacher_id)

        for student in class_students:
            attendance = attendance_map.get((session.id, student.id))
            overview.append({
                "attendance_id": attendance.id if attendance else None,
                "student_id": student.id,
                "student_name": student.name,
                "matricule": student.matricule,
                "class_id": student.class_id,
                "class_name": class_item.name if class_item else None,
                "class_session_id": session.id,
                "subject": session.subject,
                "session_time": session.time.isoformat() if session.time else None,
                "session_end": session.endSession.isoformat() if session.endSession else None,
                "teacher_id": session.teacher_id,
                "teacher_name": teacher.name if teacher else None,
                "room_id": session.idRoom,
                "room_name": room.nameRoom if room else None,
                "timestamp": attendance.timestamp.isoformat() if attendance and attendance.timestamp else None,
                "present": attendance.present if attendance else False,
            })

    return overview

# GET all attendance records
@attendance_bp.route("/attendance", methods=["GET"])
def get_attendance():
    records = Attendance.query.all()
    return jsonify([_serialize_attendance_record(a) for a in records])


@attendance_bp.route("/attendance/overview", methods=["GET"])
@token_required
@admin_required
def get_attendance_overview():
    return jsonify(_build_attendance_overview())

# CREATE a new attendance record
@attendance_bp.route("/attendance", methods=["POST"])
def add_attendance():
    data = request.json
    new_attendance = Attendance(
        student_id=data["student_id"],
        class_session_id=data["class_session_id"],
        present=data.get("present", True)
    )
    db.session.add(new_attendance)
    db.session.commit()
    return jsonify({"message": "Attendance added"}), 201

# GET a single attendance record by ID
@attendance_bp.route("/attendance/<int:attendance_id>", methods=["GET"])
def get_attendance_record(attendance_id):
    a = Attendance.query.get_or_404(attendance_id)
    return jsonify(_serialize_attendance_record(a))

# UPDATE an attendance record by ID
@attendance_bp.route("/attendance/<int:attendance_id>", methods=["PUT"])
def update_attendance(attendance_id):
    a = Attendance.query.get_or_404(attendance_id)
    data = request.json
    a.student_id = data.get("student_id", a.student_id)
    a.class_session_id = data.get("class_session_id", a.class_session_id)
    a.present = data.get("present", a.present)
    db.session.commit()
    return jsonify({"message": "Attendance updated"})

# DELETE an attendance record by ID
@attendance_bp.route("/attendance/<int:attendance_id>", methods=["DELETE"])
def delete_attendance(attendance_id):
    a = Attendance.query.get_or_404(attendance_id)
    db.session.delete(a)
    db.session.commit()
    return jsonify({"message": "Attendance deleted"})

@attendance_bp.route("/set-attendance/<int:session_id>", methods=["POST"])
def set_attendance(session_id):
    data = request.json or {}
    student_id = data.get("student_id")

    if not student_id:
        return jsonify({"error": "No student_id provided"}), 400

    attendance_record = Attendance.query.filter_by(
        student_id=student_id,
        class_session_id=session_id
    ).first()

    if attendance_record:
        attendance_record.present = True
        attendance_record.timestamp = datetime.now()
        db.session.commit()
        return jsonify({"status": "ok"}), 200
    else:

        new_record = Attendance(
            student_id=student_id,
            class_session_id=session_id,
            present=True,
            timestamp=datetime.now()
        )
        db.session.add(new_record)
        db.session.commit()
        print(f"[ATTENDANCE] Session {session_id} → student {student_id} added and marked present")
        return jsonify({"status": "ok", "created": True}), 200
