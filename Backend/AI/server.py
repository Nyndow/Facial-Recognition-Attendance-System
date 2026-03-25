from flask import Flask, request, jsonify
import threading
import base64
import numpy as np
import cv2
from core import run_detection, stop_detection, is_running, extract_embedding_from_array, init_yolo, compare_embeddings
from config.config import parse_args

app = Flask(__name__)
args = parse_args()
init_yolo(args.model)
SIMILARITY_THRESHOLD = 0.7

@app.route("/start", methods=["POST"])
def start():
    if is_running():
        return jsonify({"error": "Detection already running"}), 400

    data = request.json or {}
    session_id = data.get("session_id")
    embeddings_data = data.get("embeddings")

    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
    if not embeddings_data or not isinstance(embeddings_data, list):
        return jsonify({"error": "Missing or invalid embeddings"}), 400

    embedding_ids = []
    embedding_list = []
    for e in embeddings_data:
        if "id" not in e or "embedding" not in e:
            continue
        embedding_ids.append(e["id"])
        emb_array = np.array(e["embedding"], dtype=np.float32)
        embedding_list.append(emb_array)

    thread = threading.Thread(
        target=run_detection,
        args=(session_id, args, embedding_list, embedding_ids)
    )
    thread.start()

    return jsonify({"message": "Detection started", "session_id": session_id})


@app.route("/stop", methods=["POST"])
def stop():
    stop_detection()
    return jsonify({"message": "Stopping detection"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running" if is_running() else "idle"})


@app.route("/extract-embedding", methods=["POST"])
def extract_embedding_route():
    data = request.json
    if not data or "image" not in data:
        return jsonify({"error": "Missing image"}), 400

    image_data = data["image"]
    if image_data.startswith("data:image"):
        image_data = image_data.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400

    if img is None or img.size == 0:
        return jsonify({"error": "Could not read image"}), 400

    emb = extract_embedding_from_array(img)
    if emb is None:
        return jsonify({"error": "Failed to extract embedding"}), 500

    embedding_list = data.get("embedding_list")
    if embedding_list and isinstance(embedding_list, list):
        sims = compare_embeddings(emb, embedding_list)
        if any(s >= SIMILARITY_THRESHOLD for s in sims):
            print(f"similarities: {sims}")
            return jsonify({"error": "Face already registered", "similarities": sims}), 400

    return jsonify({"embedding": emb.tolist()})

if __name__ == "__main__":
    app.run(port=5002, debug=True)