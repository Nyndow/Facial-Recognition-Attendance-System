from config.database import db

class FaceEmbedding(db.Model):
    __tablename__ = "face_embeddings"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    embedding = db.Column(db.PickleType, nullable=False)

    def __repr__(self):
        return f"<FaceEmbedding {self.name} {self.id}>"
