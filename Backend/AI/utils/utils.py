import cv2
import numpy as np

def draw_detections(frame, stable_boxes, color=(0,255,0)):
    for (x1,y1,x2,y2), score in stable_boxes:
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
        label = f"face {score:.2f}"
        (lw, lh), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(frame, (int(x1), int(y1)-lh-baseline-4),
                             (int(x1)+lw, int(y1)), color, -1)
        cv2.putText(frame, label, (int(x1), int(y1)-baseline-2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0,0,0), 2)
    return frame

def draw_hud(frame, fps, total):
    cv2.putText(frame, f"FPS: {fps:.1f}", (10,32), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)
    cv2.putText(frame, f"Unique faces: {total}", (10,62), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,255), 2)
    return frame

def sharpen(frame):
    kernel = np.array([[0,-1,0], [-1,5,-1],[0,-1,0]], np.float32)
    return cv2.filter2D(frame, -1, kernel)

def safe_crop(frame, x1,y1,x2,y2,pad=20):
    h,w = frame.shape[:2]
    x1,y1 = max(0,x1-pad), max(0,y1-pad)
    x2,y2 = min(w,x2+pad), min(h,y2+pad)
    if x2<=x1 or y2<=y1: return None
    return frame[y1:y2, x1:x2].copy()