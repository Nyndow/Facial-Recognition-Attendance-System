import os
import base64
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras import layers, Model
from sklearn.metrics.pairwise import cosine_similarity
from insightface.app import FaceAnalysis

# ===============================
# Configuration
# ===============================
IMAGE_SIZE = 416
GRID_SIZE = 13
NUM_CLASSES = 1
DETECTION_THRESHOLD = 0.5
SIMILARITY_THRESHOLD = 0.5

# ===============================
# Exact architecture from training
# ===============================
def conv_block(x, filters, kernel=3, stride=1):
    x = layers.Conv2D(filters, kernel, stride, padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.1)(x)
    return x


def build_tiny_yolo(input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3)):
    inputs = layers.Input(shape=input_shape)
    x = conv_block(inputs, 16)
    x = layers.MaxPooling2D(2)(x)
    x = conv_block(x, 32)
    x = layers.MaxPooling2D(2)(x)
    x = conv_block(x, 64)
    x = layers.MaxPooling2D(2)(x)
    x = conv_block(x, 128)
    x = layers.MaxPooling2D(2)(x)
    x = conv_block(x, 256)
    x = layers.MaxPooling2D(2)(x)
    x = conv_block(x, 512)
    output = layers.Conv2D(5 + NUM_CLASSES, 1, padding="same")(x)
    return Model(inputs, output)


# ===============================
# Custom YOLO loss (must match training — required to load weights)
# ===============================
def yolo_loss(y_true, y_pred):
    obj_mask = y_true[..., 4:5]
    box_loss = tf.reduce_sum(
        obj_mask * tf.square(y_true[..., 0:4] - y_pred[..., 0:4])
    )
    obj_loss = tf.reduce_sum(
        tf.square(y_true[..., 4:5] - y_pred[..., 4:5])
    )
    class_loss = tf.reduce_sum(
        obj_mask * tf.square(y_true[..., 5:] - y_pred[..., 5:])
    )
    return box_loss + obj_loss + class_loss


# ===============================
# Decode predictions (identical to training code)
# ===============================
def decode_predictions(pred, threshold=DETECTION_THRESHOLD):
    """
    pred shape: (GRID_SIZE, GRID_SIZE, 5 + NUM_CLASSES)
    Returns list of [x, y, w, h] boxes (normalised 0-1) above confidence threshold.
    """
    boxes = []
    for y in range(GRID_SIZE):
        for x in range(GRID_SIZE):
            cell = pred[y, x]
            if cell[4] > threshold:
                boxes.append(cell[0:4].tolist())
    return boxes


# ===============================
# Lazy-loaded singletons
# ===============================
_yolo_model = None
_arcface_app = None


def _get_yolo_model(weights_path: str) -> Model:
    """
    Rebuild Tiny YOLO with the exact same architecture + loss used during training,
    then load weights from best.pt.  Cached after first call.
    """
    global _yolo_model
    if _yolo_model is None:
        if not os.path.exists(weights_path):
            raise FileNotFoundError(f"YOLO weights not found at: {weights_path}")

        model = build_tiny_yolo()
        # compile with the same loss so Keras recognises the custom object
        model.compile(
            optimizer=tf.keras.optimizers.Adam(1e-4),
            loss=yolo_loss,
        )
        model.load_weights(weights_path)
        _yolo_model = model
    return _yolo_model


def _get_arcface_app() -> FaceAnalysis:
    """Load (or return cached) InsightFace ArcFace app."""
    global _arcface_app
    if _arcface_app is None:
        app = FaceAnalysis(
            name="buffalo_l",   # ArcFace R100 — swap to "buffalo_s" for lighter/faster
            providers=["CPUExecutionProvider"],
        )
        app.prepare(ctx_id=0, det_size=(640, 640))
        _arcface_app = app
    return _arcface_app


# ===============================
# Crop helper
# ===============================
def _box_to_crop(image: np.ndarray, box: list, padding: float = 0.10):
    """
    Convert a normalised [x_centre, y_centre, w, h] box to a pixel crop.
    Adds padding around the face. Returns the cropped BGR array or None.
    """
    h_img, w_img = image.shape[:2]
    x_c, y_c, w_n, h_n = box

    x1 = int((x_c - w_n / 2 - padding * w_n) * w_img)
    y1 = int((y_c - h_n / 2 - padding * h_n) * h_img)
    x2 = int((x_c + w_n / 2 + padding * w_n) * w_img)
    y2 = int((y_c + h_n / 2 + padding * h_n) * h_img)

    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w_img, x2), min(h_img, y2)

    if x2 <= x1 or y2 <= y1:
        return None

    return image[y1:y2, x1:x2]


# ===============================
# Core public API
# ===============================
def extract_embedding(image_b64: str, weights_path: str) -> "np.ndarray | None":
    """
    Full pipeline:
      1. Decode base64 image
      2. Run Tiny YOLO (best.pt) to detect the face region
      3. Crop the best detection from the original full-res image
      4. Pass crop to InsightFace ArcFace for a 512-d embedding
      5. Return L2-normalised embedding, or None if no face found

    Parameters
    ----------
    image_b64    : base64-encoded image string (may include data-URI prefix)
    weights_path : path to best.pt saved with model.save_weights()

    Returns
    -------
    np.ndarray shape (512,), dtype float32  —  or  None
    """
    # 1. Decode image
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    image_bgr = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if image_bgr is None:
        return None

    # 2. YOLO inference — same preprocessing as training (resize → RGB → /255)
    resized = cv2.resize(image_bgr, (IMAGE_SIZE, IMAGE_SIZE))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    tensor = tf.expand_dims(tf.cast(rgb, tf.float32) / 255.0, axis=0)  # (1,416,416,3)

    yolo = _get_yolo_model(weights_path)
    pred = yolo(tensor, training=False).numpy()[0]   # (13, 13, 6)

    # 3. Decode boxes — same function as training code
    boxes = decode_predictions(pred, threshold=DETECTION_THRESHOLD)
    if not boxes:
        return None

    # Pick the box with the highest objectness score
    best_box = max(
        boxes,
        key=lambda b: pred[
            min(int(b[1] * GRID_SIZE), GRID_SIZE - 1),
            min(int(b[0] * GRID_SIZE), GRID_SIZE - 1),
            4,
        ],
    )

    # 4. Crop from original full-res image (not the 416-resized one)
    face_crop = _box_to_crop(image_bgr, best_box)
    if face_crop is None or face_crop.size == 0:
        return None

    # 5. ArcFace embedding
    arcface = _get_arcface_app()
    faces = arcface.get(face_crop)

    if not faces:
        # Fallback: try full image in case crop was too tight
        faces = arcface.get(image_bgr)

    if not faces:
        return None

    # Use the largest detected face if multiple are returned
    best_face = max(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
    )

    embedding = best_face.embedding  # (512,)
    norm = np.linalg.norm(embedding)
    if norm == 0:
        return None

    return (embedding / norm).astype(np.float32)


def find_matching_student(face_emb: np.ndarray, students: list, threshold: float = SIMILARITY_THRESHOLD):
    """
    Cosine-similarity search over all stored student embeddings.

    Returns
    -------
    (matched_student, score)  if best score >= threshold
    (None, best_score)        otherwise
    """
    if not students:
        return None, 0.0

    db_embeddings = np.array([s.face_emb for s in students], dtype=np.float32)
    similarities = cosine_similarity([face_emb], db_embeddings)[0]

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])

    if best_score >= threshold:
        return students[best_idx], best_score

    return None, best_score


def recognize_face(image_b64: str, weights_path: str, students: list, threshold: float = SIMILARITY_THRESHOLD):
    """
    Convenience wrapper: detect → embed → match.

    Returns
    -------
    dict  {"id", "name", "matricule", "score"}  on match
    None  if no face detected or no student matched
    """
    emb = extract_embedding(image_b64, weights_path)
    if emb is None:
        return None

    student, score = find_matching_student(emb, students, threshold)
    if student is None:
        return None

    return {
        "id": student.id,
        "name": student.name,
        "matricule": student.matricule,
        "score": round(score, 3),
    }