from config.database import db


class Camera(db.Model):
    __tablename__ = "cameras"

    idCamera = db.Column(db.Integer, primary_key=True)
    nameCamera = db.Column(db.String(100), nullable=False, unique=True)
    urlCamera = db.Column(db.String(255), nullable=True)
    rooms = db.relationship("Room", backref="camera_ref", lazy=True)

    def __repr__(self):
        return f"<Camera idCamera={self.idCamera} nameCamera={self.nameCamera}>"
