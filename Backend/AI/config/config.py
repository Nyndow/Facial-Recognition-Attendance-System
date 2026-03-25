from pathlib import Path
import argparse

IMAGE_SIZE = 416
GRID_SIZE = 13
NUM_CLASSES = 1

def parse_args():
    parser = argparse.ArgumentParser(description="Real-time face detection with embedding & sending")
    parser.add_argument("--model", default="model/best.pt")
    parser.add_argument("--source", default="0")
    parser.add_argument("--conf", type=float, default=0.45)
    parser.add_argument("--iou", type=float, default=0.4)
    parser.add_argument("--device", default="")
    parser.add_argument("--imgsz", type=int, default=IMAGE_SIZE)
    parser.add_argument("--smooth-window", type=int, default=2)
    parser.add_argument("--smooth-iou", type=float, default=0.4)
    parser.add_argument("--skip-frames", type=int, default=2)
    parser.add_argument("--sharpen", action="store_true")
    parser.add_argument("--confirm-frames", type=int, default=5)
    parser.add_argument("--similarity", type=float, default=0.6)
    parser.add_argument("--detected-dir", default="detected")
    parser.add_argument("--show-fps", action="store_true")
    parser.add_argument("--save", action="store_true")
    parser.add_argument("--output", default="output.avi")
    parser.add_argument("--service-url", default="", help="Remote URL to send captured faces")
    return parser.parse_args()