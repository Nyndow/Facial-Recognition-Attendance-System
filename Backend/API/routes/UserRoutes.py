from flask import Blueprint, request, jsonify
from config.database import db
from models.User import User
from models.Class import Class
from models.Teacher import Teacher
from utils.utilToken import token_required, admin_required

users_bp = Blueprint("users", __name__)

def _resolve_user_names(user):
    class_name = None
    if user.idClass:
        class_obj = Class.query.get(user.idClass)
        class_name = class_obj.name if class_obj else None
    teacher_name = None
    if user.idTeacher:
        teacher_obj = Teacher.query.get(user.idTeacher)
        teacher_name = teacher_obj.name if teacher_obj else None
    return class_name, teacher_name

# -------------------------
# GET ALL USERS
# -------------------------
@users_bp.route("/users", methods=["GET"])
@token_required
@admin_required
def get_users():
    users = User.query.all()
    result = []
    for u in users:
        class_name, teacher_name = _resolve_user_names(u)
        result.append({
            "id": u.id,
            "username": u.username,
            "isAdmin": u.isAdmin,
            "idClass": u.idClass,
            "idTeacher": u.idTeacher,
            "class_name": class_name,
            "teacher_name": teacher_name
        })
    return jsonify(result), 200


# -------------------------
# CREATE NEW USER
# -------------------------
@users_bp.route("/users", methods=["POST"])
@token_required
@admin_required
def create_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    isAdmin = data.get("isAdmin", False)
    idClass = data.get("idClass")
    idTeacher = data.get("idTeacher")

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exists"}), 409

    user = User(
        username=username,
        isAdmin=isAdmin,
        idClass=idClass,
        idTeacher=idTeacher
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created"}), 201


# -------------------------
# GET SINGLE USER BY ID
# -------------------------
@users_bp.route("/users/<int:user_id>", methods=["GET"])
@token_required
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    class_name, teacher_name = _resolve_user_names(user)
    return jsonify({
        "id": user.id,
        "username": user.username,
        "isAdmin": user.isAdmin,
        "idClass": user.idClass,
        "idTeacher": user.idTeacher,
        "class_name": class_name,
        "teacher_name": teacher_name
    }), 200


# -------------------------
# UPDATE USER BY ID
# -------------------------
@users_bp.route("/users/<int:user_id>", methods=["PUT"])
@token_required
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json

    user.username = data.get("username", user.username)
    user.isAdmin = data.get("isAdmin", user.isAdmin)
    user.idClass = data.get("idClass", user.idClass)
    user.idTeacher = data.get("idTeacher", user.idTeacher)

    # If password is provided, update it
    if data.get("password"):
        user.set_password(data["password"])

    db.session.commit()

    return jsonify({"message": "User updated"}), 200


# -------------------------
# DELETE USER BY ID
# -------------------------
@users_bp.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200

# -------------------------
# GET CURRENT USER
# -------------------------
@users_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    current_user = request.user
    return jsonify({
        "id": current_user.get("id"),
        "username": current_user.get("username"),
        "isAdmin": current_user.get("isAdmin"),
        "idClass": current_user.get("idClass"),
        "idTeacher": current_user.get("idTeacher")
    }), 200


# -------------------------
# UPDATE CURRENT USER
# -------------------------
@users_bp.route("/me", methods=["PUT"])
@token_required
def update_me():
    current_user = request.user
    data = request.json

    new_username = data.get("username")
    new_password = data.get("password")

    if new_username:
        # Prevent username collision
        if User.query.filter_by(username=new_username).first():
            return jsonify({"error": "Username already taken"}), 409
        current_user.username = new_username

    if new_password:
        current_user.set_password(new_password)

    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200
