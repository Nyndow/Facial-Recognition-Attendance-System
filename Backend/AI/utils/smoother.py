from collections import deque
import numpy as np

class DetectionSmoother:
    def __init__(self, window: int = 2, iou_threshold: float = 0.4):
        self.history = deque(maxlen=window)
        self.iou_threshold = iou_threshold

    def _iou(self, a, b) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        ix1, iy1 = max(ax1, bx1), max(ay1, by1)
        ix2, iy2 = min(ax2, bx2), min(ay2, by2)
        inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
        if inter == 0:
            return 0.0
        area_a = (ax2 - ax1) * (ay2 - ay1)
        area_b = (bx2 - bx1) * (by2 - by1)
        return inter / (area_a + area_b - inter)

    def update(self, boxes: list, scores: list) -> None:
        self.history.append(list(zip(boxes, scores)))

    def get_stable_boxes(self) -> list[tuple]:
        if not self.history:
            return []
        all_detections = [det for frame in self.history for det in frame]
        if not all_detections:
            return []

        stable = []
        used = [False] * len(all_detections)
        for i, (box_i, score_i) in enumerate(all_detections):
            if used[i]:
                continue
            cluster_boxes = [box_i]
            cluster_scores = [score_i]
            used[i] = True
            for j, (box_j, score_j) in enumerate(all_detections):
                if not used[j] and self._iou(box_i, box_j) > self.iou_threshold:
                    cluster_boxes.append(box_j)
                    cluster_scores.append(score_j)
                    used[j] = True
            if len(cluster_boxes) >= len(self.history)//2:
                avg_box = np.mean(cluster_boxes, axis=0).astype(int)
                avg_score = float(np.mean(cluster_scores))
                stable.append((avg_box, avg_score))
        return stable