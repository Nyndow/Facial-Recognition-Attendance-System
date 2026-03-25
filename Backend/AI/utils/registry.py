from pathlib import Path
import numpy as np

class FaceRegistry:
    def __init__(self, registry_path: Path, similarity_threshold: float=0.6):
        self.path = registry_path
        self.threshold = similarity_threshold
        self.embeddings: list[np.ndarray] = self._load()
        print(f"Registry loaded — {len(self.embeddings)} face(s) known.")

    def _load(self) -> list[np.ndarray]:
        if self.path.exists():
            try:
                data = np.load(str(self.path))
                return [data[k] for k in data.files]
            except Exception:
                print("Registry corrupt — starting fresh.")
        return []

    def _save(self):
        np.savez(str(self.path), *self.embeddings)

    def is_known(self, embedding: np.ndarray) -> bool:
        for known in self.embeddings:
            if float(np.dot(embedding, known)) >= self.threshold:
                return True
        return False

    def register(self, embedding: np.ndarray):
        self.embeddings.append(embedding)
        self._save()

    def total(self) -> int:
        return len(self.embeddings)