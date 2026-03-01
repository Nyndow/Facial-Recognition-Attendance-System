from flask import Blueprint, request, jsonify
from config.database import db
from models.Camera import Camera
from models.Room import Room

camera_bp = Blueprint("cameras", __name__)


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
