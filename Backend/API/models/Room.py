from config.database import db

class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    # # Relationship to Attendance
    # attendance_records = db.relationship("Attendance", backref="room")

    def __repr__(self):
        return f"<Room id={self.id} name={self.name}>"
