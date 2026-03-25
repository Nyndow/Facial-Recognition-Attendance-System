import cv2
import torch
import numpy as np
from facenet_pytorch import InceptionResnetV1

class FaceEmbedder:
    def __init__(self, device="cpu"):
        self.device = torch.device(device)
        self.model = InceptionResnetV1(pretrained="vggface2").eval().to(self.device)

    def embed(self, crop: np.ndarray) -> np.ndarray | None:
        try:
            rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
            resized = cv2.resize(rgb, (160,160), interpolation=cv2.INTER_CUBIC)
            tensor = torch.tensor(resized, dtype=torch.float32).permute(2,0,1)
            tensor = (tensor-127.5)/128.0
            tensor = tensor.unsqueeze(0).to(self.device)
            with torch.no_grad():
                emb = self.model(tensor).squeeze().cpu().numpy()
            return emb / (np.linalg.norm(emb)+1e-9)
        except Exception as e:
            print(f"[EMBED ERROR] {e}")
            return None