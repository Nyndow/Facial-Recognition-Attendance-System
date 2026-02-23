from flask import Blueprint, request, jsonify
from config.database import db
from models.User import User
import jwt
import datetime
from werkzeug.security import check_password_hash
from utils.utilToken import token_required

SECRET_KEY = "your_secret_key_here"  # Change this to a secure value in production

auth_bp = Blueprint("auth", __name__)

# Register route
@auth_bp.route("/register", methods=["POST"])
def register():
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
    return jsonify({"message": "User registered"}), 201

# Login route
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        token = jwt.encode({
            'user_id': user.id,
            'isAdmin': user.isAdmin,
            'idClass': user.idClass,
            'idTeacher': user.idTeacher,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({"token": token})
    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route("/auth/me", methods=["GET"])
@token_required
def me():
    user = request.user
    return jsonify({"isAdmin": user["isAdmin"]}), 200

