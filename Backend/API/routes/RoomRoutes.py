from flask import Blueprint, request, jsonify
from config.database import db
from models.Room import Room

room_bp = Blueprint("rooms", __name__)

@room_bp.route("/rooms", methods=["GET"])
def get_rooms():
    rooms = Room.query.all()
    return jsonify([{ "id": r.id, "name": r.name } for r in rooms])

@room_bp.route("/rooms", methods=["POST"])
def add_room():
    data = request.json
    new_room = Room(name=data["name"])
    db.session.add(new_room)
    db.session.commit()
    return jsonify({"message": "Room added"}), 201

@room_bp.route("/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    return jsonify({"id": room.id, "name": room.name})

@room_bp.route("/rooms/<int:room_id>", methods=["PUT"])
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.json
    room.name = data.get("name", room.name)
    db.session.commit()
    return jsonify({"message": "Room updated"})

@room_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Room deleted"})
