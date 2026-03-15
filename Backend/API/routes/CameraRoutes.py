from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import and_
from config.database import db
from models.Camera import Camera
from models.Room import Room
from models.ClassSession import ClassSession

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
    else:
        status = 0
        camera_status[camera.idCamera] = 0

    return jsonify({"idCamera": camera.idCamera, "status": status})


@camera_bp.route("/camera-status/<int:camera_id>", methods=["POST"])
def set_camera_status(camera_id):
    camera = Camera.query.get_or_404(camera_id)

    if not _has_active_session_for_camera(camera_id):
        return jsonify({"error": "No active session for this camera"}), 400

    data = request.json or {}
    status = data.get("status")

    if status not in (0, 1):
        return jsonify({"error": "status must be 0 or 1"}), 400

    camera_status[camera.idCamera] = int(status)

    return jsonify({
        "message": "Camera status updated",
        "status": camera_status[camera.idCamera]
    })