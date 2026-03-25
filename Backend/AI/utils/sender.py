from pathlib import Path
import requests
import threading

class FaceSender:
    def __init__(self, url: str):
        self.url = url

    def send_async(self, image_path: Path) -> None:
        threading.Thread(target=self._send, args=(image_path,), daemon=True).start()

    def _send(self, image_path: Path) -> None:
        try:
            with open(image_path, "rb") as f:
                files = {"file": (image_path.name, f, "image/jpeg")}
                resp = requests.post(self.url, files=files, timeout=5)
            if resp.status_code == 200:
                print(f"[SENT] {image_path.name}")
            else:
                print(f"[ERROR] Failed to send {image_path.name}: {resp.status_code}")
        except Exception as e:
            print(f"[ERROR] Exception sending {image_path.name}: {e}")