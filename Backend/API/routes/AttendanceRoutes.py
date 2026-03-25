from flask import Blueprint, request, jsonify
from config.database import db
from models.Attendance import Attendance
from datetime import datetime

attendance_bp = Blueprint("attendance", __name__)

# GET all attendance records
@attendance_bp.route("/attendance", methods=["GET"])
def get_attendance():
    records = Attendance.query.all()
    return jsonify([
        {
            "id": a.id,
            "student_id": a.student_id,
            "class_session_id": a.class_session_id,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "present": a.present
        } for a in records
    ])

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
    return jsonify({
        "id": a.id,
        "student_id": a.student_id,
        "class_session_id": a.class_session_id,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "present": a.present
    })

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
        attendance_record.timestamp = datetime.utcnow()
        db.session.commit()
        return jsonify({"status": "ok"}), 200
    else:

        new_record = Attendance(
            student_id=student_id,
            class_session_id=session_id,
            present=True,
            timestamp=datetime.utcnow()
        )
        db.session.add(new_record)
        db.session.commit()
        print(f"[ATTENDANCE] Session {session_id} → student {student_id} added and marked present")
        return jsonify({"status": "ok", "created": True}), 200