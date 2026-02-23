from flask import request, jsonify
import jwt
from functools import wraps

SECRET_KEY = "your_secret_key_here"

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({"error": "Token format invalid"}), 401

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=["HS256"],
                options={"verify_exp": False}  # 🔴 disable expiration
            )
            request.user = data
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # request.user is a dict from the token
        if not request.user.get("isAdmin", False):
            return jsonify({"error": "Admin only"}), 403
        return f(*args, **kwargs)
    return decorated

