from config.database import db

class Room(db.Model):
    __tablename__ = "rooms"

    idRoom = db.Column(db.Integer, primary_key=True)
    nameRoom = db.Column(db.String(100), nullable=False, unique=True)
    idCamera = db.Column(db.Integer, db.ForeignKey("cameras.idCamera"), nullable=True)
    class_sessions = db.relationship("ClassSession", backref="room_ref", lazy=True)

    def __repr__(self):
        return f"<Room idRoom={self.idRoom} nameRoom={self.nameRoom} idCamera={self.idCamera}>"
