from flask import Blueprint, request, jsonify
from config.database import db
from models.Class import Class

class_bp = Blueprint("classes", __name__)

# -------------------------
# GET ALL CLASSES
# -------------------------
@class_bp.route("/classes", methods=["GET"])
def get_classes():
    classes = Class.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in classes]), 200


# -------------------------
# CREATE CLASS
# -------------------------
@class_bp.route("/classes", methods=["POST"])
def create_class():
    data = request.json
    name = data.get("name")

    if not name:
        return jsonify({"error": "Name is required"}), 400

    new_class = Class(name=name)
    db.session.add(new_class)
    db.session.commit()

    return jsonify({"message": "Class created"}), 201


# -------------------------
# GET SINGLE CLASS
# -------------------------
@class_bp.route("/classes/<int:class_id>", methods=["GET"])
def get_class(class_id):
    c = Class.query.get_or_404(class_id)
    return jsonify({"id": c.id, "name": c.name}), 200


# -------------------------
# UPDATE CLASS
# -------------------------
@class_bp.route("/classes/<int:class_id>", methods=["PUT"])
def update_class(class_id):
    c = Class.query.get_or_404(class_id)
    data = request.json
    c.name = data.get("name", c.name)
    db.session.commit()
    return jsonify({"message": "Class updated"}), 200


# -------------------------
# DELETE CLASS
# -------------------------
@class_bp.route("/classes/<int:class_id>", methods=["DELETE"])
def delete_class(class_id):
    c = Class.query.get_or_404(class_id)
    db.session.delete(c)
    db.session.commit()
    return jsonify({"message": "Class deleted"}), 200
