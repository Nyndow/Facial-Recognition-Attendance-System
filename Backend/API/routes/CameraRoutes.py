from flask import Blueprint, request, jsonify
import os
from datetime import datetime
from sqlalchemy import and_
from config.database import db
from models.Camera import Camera
from models.Room import Room
from models.ClassSession import ClassSession
from models.Student import Student

camera_bp = Blueprint("cameras", __name__)
camera_status = {}


def _has_active_session_for_camera(camera_id):
    room_ids = [r.idRoom for r in Room.query.filter_by(idCamera=camera_id).all()]
    if not room_ids:
        return False
    now = datetime.utcnow()
    active_session = ClassSession.query.filter(
        and_(
            ClassSession.idRoom.in_(room_ids),
            ClassSession.time <= now,
            ClassSession.endSession >= now,
        )
    ).first()
    return active_session is not None

def get_active_session_for_camera(camera_id: int):
    now = datetime.utcnow()

    active_session = (
        db.session.query(ClassSession)
        .join(Room, ClassSession.idRoom == Room.idRoom)
        .filter(Room.idCamera == camera_id)
        .filter(ClassSession.time <= now, ClassSession.endSession >= now)
        .first()
    )

    return active_session

def _serialize_camera(camera):
    return {
        "idCamera": camera.idCamera,
        "nameCamera": camera.nameCamera,
        "urlCamera": camera.urlCamera
    }



@camera_bp.route("/cameras", methods=["GET"])
def get_cameras():
    cameras = Camera.query.all()
    return jsonify([_serialize_camera(c) for c in cameras])


@camera_bp.route("/cameras", methods=["POST"])
def add_camera():
    data = request.json
    name_camera = data.get("nameCamera")
    if not name_camera:
        return jsonify({"error": "nameCamera is required"}), 400

    new_camera = Camera(
        nameCamera=name_camera,
        urlCamera=data.get("urlCamera")
    )
    db.session.add(new_camera)
    db.session.commit()
    return jsonify({"message": "Camera added", "idCamera": new_camera.idCamera}), 201


@camera_bp.route("/cameras/<int:camera_id>", methods=["GET"])
def get_camera(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    return jsonify(_serialize_camera(camera))


@camera_bp.route("/cameras/<int:camera_id>", methods=["PUT"])
def update_camera(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    data = request.json
    camera.nameCamera = data.get("nameCamera", camera.nameCamera)
    if "urlCamera" in data:
        camera.urlCamera = data.get("urlCamera")
    db.session.commit()
    return jsonify({"message": "Camera updated"})


@camera_bp.route("/cameras/<int:camera_id>", methods=["DELETE"])
def delete_camera(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    linked_room = Room.query.filter_by(idCamera=camera.idCamera).first()
    if linked_room:
        return jsonify({"error": "Camera is linked to rooms and cannot be deleted"}), 400
    db.session.delete(camera)
    db.session.commit()
    return jsonify({"message": "Camera deleted"})


@camera_bp.route("/camera-status/<int:camera_id>", methods=["GET"])
def get_camera_status(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    has_active_session = _has_active_session_for_camera(camera.idCamera)

    if has_active_session:
        status = camera_status.get(camera.idCamera, 1)
        camera_status[camera.idCamera] = status
        print(f"[STATUS] Camera {camera.idCamera} active session detected, status={status}")
    else:
        status = 0
        camera_status[camera.idCamera] = 0
        print(f"[STATUS] Camera {camera.idCamera} no active session, status set to 0")

    return jsonify({"idCamera": camera.idCamera, "status": status})


@camera_bp.route("/camera-status/<int:camera_id>", methods=["POST"])
def set_camera_status(camera_id):
    camera = Camera.query.get_or_404(camera_id)

    if not _has_active_session_for_camera(camera_id):
        print(here := f"[STATUS] Camera {camera.idCamera} no active session, cannot set status")
        return jsonify({"error": "No active session for this camera"}), 400

    data = request.json or {}
    status = data.get("status")

    if status not in (0, 1):
        return jsonify({"error": "status must be 0 or 1"}), 400

    camera_status[camera.idCamera] = int(status)
    session = get_active_session_for_camera(camera_id)

    if session:
        import requests
        try:
            detector_url = "http://127.0.0.1:5002/start" if status == 1 else "http://127.0.0.1:5002/stop"

            payload = {"session_id": session.id}

            if status == 1:
                students = Student.query.filter_by(class_id=session.class_id).all()
                embeddings = []
                for s in students:
                    if s.face_emb:
                        embeddings.append({"id": s.id, "embedding": s.face_emb})
                
                payload["embeddings"] = embeddings

            res = requests.post(detector_url, json=payload)
            if res.status_code == 200:
                print(f"[DETECTOR] {'Started' if status == 1 else 'Stopped'} for session {session.id}")
            else:
                print(f"[DETECTOR] Failed to {'start' if status == 1 else 'stop'}: {res.text}")

        except Exception as e:
            print(f"[DETECTOR] Error contacting detector: {e}")

    return jsonify({
        "message": "Camera status updated",
        "status": camera_status[camera.idCamera]
    })

@camera_bp.route("/upload-photos", methods=["POST"])
def upload_face():
    file = request.files.get("file")
    if file:
        save_dir = "received"
        os.makedirs(save_dir, exist_ok=True)
        file.save(os.path.join(save_dir, file.filename))
        return "OK", 200
    return "No file", 400

