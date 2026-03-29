import time
from pathlib import Path
import cv2
import torch
import numpy as np
import requests
from ultralytics import YOLO
from utils.smoother import DetectionSmoother
from utils.embedder import FaceEmbedder
from utils.registry import FaceRegistry
from utils.sender import FaceSender
from utils.utils import draw_detections, draw_hud, sharpen, safe_crop

_running = False
embedder = FaceEmbedder(device="cuda" if torch.cuda.is_available() else "cpu")
yolo_model = None  # Loaded once per session


# Improve brightness condition
def clahe_enhance(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def is_running():
    return _running


def stop_detection():
    global _running
    _running = False


def init_yolo(model_path: str):
    global yolo_model
    if yolo_model is None:
        yolo_model = YOLO(model_path)
    return yolo_model


def compare_embeddings(embedding: np.ndarray, embedding_list: list[np.ndarray]) -> list[float]:
    embedding = embedding / (np.linalg.norm(embedding) + 1e-9)
    emb_matrix = np.array(embedding_list, dtype=np.float32)
    emb_matrix /= (np.linalg.norm(emb_matrix, axis=1, keepdims=True) + 1e-9)
    sims = np.dot(emb_matrix, embedding)
    return sims.tolist()


# Camera detection
def run_detection(session_id, args, embedding_list=None, embedding_ids=None):
    global _running
    _running = True

    print(f"[SESSION] Starting detection for session {session_id}")

    yolo = YOLO(args.model)

    registry_dir = Path(args.detected_dir)
    registry_dir.mkdir(parents=True, exist_ok=True)
    session_dir = registry_dir / f"session_{session_id}"
    session_dir.mkdir(parents=True, exist_ok=True)

    registry = FaceRegistry(
        session_dir / "embeddings.npz",
        similarity_threshold=args.similarity
    )

    sender = FaceSender(args.service_url) if args.service_url else None

    # 🔥 prevent duplicate attendance
    marked_students = set()

    source = args.source
    try:
        source = int(source)
    except:
        pass

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {args.source}")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    writer = None
    if args.save:
        fourcc = cv2.VideoWriter_fourcc(*"MJPG")
        writer = cv2.VideoWriter(args.output, fourcc, src_fps, (width, height))

    smoother = DetectionSmoother(
        window=args.smooth_window,
        iou_threshold=args.smooth_iou
    )

    pending = []
    last_stable = []
    frame_idx = 0
    prev_time = time.time()

    while _running:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1

        if frame_idx % args.skip_frames == 0:

            # =========================
            # PREPROCESSING
            # =========================
            inf_frame = clahe_enhance(frame)

            if args.sharpen:
                inf_frame = sharpen(inf_frame)

            results = yolo.predict(
                source=inf_frame,
                conf=args.conf,
                iou=args.iou,
                imgsz=max(width, height),
                device=args.device or ("cuda" if torch.cuda.is_available() else "cpu"),
                verbose=False,
                augment=False,
            )

            boxes_result = results[0].boxes
            if boxes_result is not None and len(boxes_result):
                xyxy = boxes_result.xyxy.cpu().numpy().tolist()
                scores = boxes_result.conf.cpu().numpy().tolist()
            else:
                xyxy, scores = [], []

            smoother.update(xyxy, scores)
            last_stable = smoother.get_stable_boxes()

            while len(pending) < len(last_stable):
                pending.append({"emb_sum": None, "count": 0, "crop": None})
            while len(pending) > len(last_stable):
                pending.pop()

            for idx, ((x1, y1, x2, y2), _score) in enumerate(last_stable):
                crop_full = safe_crop(frame, int(x1), int(y1), int(x2), int(y2), pad=0)
                if crop_full is None:
                    continue

                crop_full = clahe_enhance(crop_full)

                crop_emb = cv2.resize(crop_full, (160, 160), interpolation=cv2.INTER_CUBIC)
                emb = embedder.embed(crop_emb)
                if emb is None:
                    continue

                slot = pending[idx]

                if slot["emb_sum"] is None:
                    slot["emb_sum"] = emb.copy()
                else:
                    slot["emb_sum"] += emb

                slot["count"] += 1
                slot["crop"] = crop_full.copy()

                # =========================
                # CONFIRM FACE
                # =========================
                if slot["count"] >= args.confirm_frames:
                    avg_emb = slot["emb_sum"] / slot["count"]
                    avg_emb = avg_emb / (np.linalg.norm(avg_emb) + 1e-9)

                    is_new = not registry.is_known(avg_emb)

                    if is_new:
                        ts = time.strftime("%Y%m%d_%H%M%S")
                        fname = session_dir / f"face_{ts}.png"

                        cv2.imwrite(str(fname), slot["crop"], [cv2.IMWRITE_PNG_COMPRESSION, 0])
                        registry.register(avg_emb)

                        print(f"[NEW][Session {session_id}] {fname.name} (total {registry.total()})")

                        if sender:
                            sender.send_async(fname, session_id=session_id)

                    # =========================
                    # MATCH WITH STUDENTS
                    # =========================
                    if embedding_list is not None and embedding_ids is not None:
                        sims = compare_embeddings(avg_emb, embedding_list)
                        max_idx = int(np.argmax(sims))

                        if sims[max_idx] >= args.similarity:
                            matched_id = embedding_ids[max_idx]

                            # 🔥 Avoid duplicate attendance spam
                            if matched_id not in marked_students:
                                marked_students.add(matched_id)

                                print(f"[MATCH][Session {session_id}] ID {matched_id} similarity {sims[max_idx]:.3f}")
                                mark_attendance(session_id, matched_id)

                                if sender:
                                    sender.send_async_id(matched_id, session_id=session_id)

                    # reset slot
                    slot["emb_sum"], slot["count"], slot["crop"] = None, 0, None

        annotated = draw_detections(frame.copy(), last_stable)

        if args.show_fps:
            curr_time = time.time()
            fps_display = 1.0 / (curr_time - prev_time + 1e-9)
            prev_time = curr_time
            draw_hud(annotated, fps_display, registry.total())

        cv2.imshow(f"Face Detection [Session {session_id}]", annotated)

        if writer:
            writer.write(annotated)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    if writer:
        writer.release()
    cv2.destroyAllWindows()

    _running = False
    print(f"[STOP] Session {session_id} → {registry.total()} unique faces")

# Mark Attendance
def mark_attendance(session_id, student_id):
    try:
        url = f"http://localhost:5000/set-attendance/{session_id}"
        res = requests.post(url, json={"student_id": student_id}, timeout=2)

        if res.status_code == 200:
            print(f"[ATTENDANCE] Marked present → {student_id}")
        else:
            print(f"[ATTENDANCE ERROR] {res.text}")
    except Exception as e:
        print(f"[ATTENDANCE FAIL] {e}")


# Extract Embeddings
def extract_embedding_from_array(img: np.ndarray) -> np.ndarray | None:
    global embedder, yolo_model

    if yolo_model is None:
        print("[ERROR] YOLO model not loaded yet")
        return None

    # SMART LIGHTING FIX
    img_proc = clahe_enhance(img)

    results = yolo_model.predict(
        source=img_proc,
        conf=0.3,
        iou=0.5,
        imgsz=max(img.shape[:2]),
        device="cuda" if torch.cuda.is_available() else "cpu",
        verbose=False,
        augment=False,
    )

    boxes = results[0].boxes
    if boxes is None or len(boxes) == 0:
        print("[WARN] No faces detected in image")
        return None

    xyxy = boxes.xyxy.cpu().numpy()

    areas = (xyxy[:, 2] - xyxy[:, 0]) * (xyxy[:, 3] - xyxy[:, 1])
    largest_idx = int(np.argmax(areas))
    x1, y1, x2, y2 = xyxy[largest_idx].astype(int)

    crop_face = safe_crop(img_proc, x1, y1, x2, y2, pad=0)
    if crop_face is None:
        print("[ERROR] Failed to crop face")
        return None

    # normalize crop too
    crop_face = clahe_enhance(crop_face)

    crop_face_resized = cv2.resize(crop_face, (160, 160), interpolation=cv2.INTER_CUBIC)

    return embedder.embed(crop_face_resized)