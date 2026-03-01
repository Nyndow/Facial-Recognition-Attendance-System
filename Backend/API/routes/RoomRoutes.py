from flask import Blueprint, request, jsonify
from config.database import db
from models.Room import Room
from models.Camera import Camera
from models.ClassSession import ClassSession

room_bp = Blueprint("rooms", __name__)

def _serialize_room(room):
    return {
        "idRoom": room.idRoom,
        "nameRoom": room.nameRoom,
        "idCamera": room.idCamera,
        "nameCamera": room.camera_ref.nameCamera if room.camera_ref else None,
        "urlCamera": room.camera_ref.urlCamera if room.camera_ref else None,
        "id": room.idRoom,     # backward-compatible alias
        "name": room.nameRoom  # backward-compatible alias
    }

@room_bp.route("/rooms", methods=["GET"])
def get_rooms():
    rooms = Room.query.all()
    return jsonify([_serialize_room(r) for r in rooms])

@room_bp.route("/rooms", methods=["POST"])
def add_room():
    data = request.json
    room_name = data.get("nameRoom", data.get("name"))
    if not room_name:
        return jsonify({"error": "nameRoom is required"}), 400

    camera_id = data.get("idCamera")
    if camera_id is not None:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({"error": "Camera not found"}), 404

    new_room = Room(nameRoom=room_name, idCamera=camera_id)
    db.session.add(new_room)
    db.session.commit()
    return jsonify({"message": "Room added", "idRoom": new_room.idRoom}), 201

@room_bp.route("/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    return jsonify(_serialize_room(room))

@room_bp.route("/rooms/<int:room_id>", methods=["PUT"])
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.json
    room.nameRoom = data.get("nameRoom", data.get("name", room.nameRoom))

    if "idCamera" in data:
        camera_id = data["idCamera"]
        if camera_id is not None:
            camera = Camera.query.get(camera_id)
            if not camera:
                return jsonify({"error": "Camera not found"}), 404
        room.idCamera = camera_id

    db.session.commit()
    return jsonify({"message": "Room updated"})

@room_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    linked_sessions = ClassSession.query.filter_by(idRoom=room.idRoom).first()
    if linked_sessions:
        return jsonify({"error": "Room is linked to class sessions and cannot be deleted"}), 400
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Room deleted"})
