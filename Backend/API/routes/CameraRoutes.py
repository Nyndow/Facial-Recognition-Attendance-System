from flask import Blueprint, request, jsonify
from config.database import db
from models.Camera import Camera
from models.Room import Room
from utils.ai import recognize_multiple_faces
import cv2
import base64

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

@camera_bp.route("/open-camera", methods=["GET"])
def open_camera():
    data = request.json
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    # Use webcam (0) or RTSP/RTMP URL
    camera_url = "rtsp://localhost:8554/live"  # change to "rtsp://localhost:8554/live" for MediaMTX
    cap = cv2.VideoCapture(camera_url)

    if not cap.isOpened():
        return jsonify({"error": f"Could not open camera: {camera_url}"}), 500

    recognized_students = []

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to capture frame")
                break

            # Convert frame to base64
            _, buffer = cv2.imencode(".jpg", frame)
            image_b64 = base64.b64encode(buffer).decode("utf-8")

            # Recognize faces in this frame
            results = recognize_multiple_faces(image_b64, session_id)
            recognized_students = results

            # Display the frame with a window
            cv2.imshow("Camera - Press Q to quit", frame)

            # Quit if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()

    return jsonify({
        "session_id": session_id,
        "recognized_count": len(recognized_students),
        "students": recognized_students
    })