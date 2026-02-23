from datetime import datetime
from config.database import db

class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer, 
        nullable=False
    )

    class_session_id = db.Column(
        db.Integer,
        nullable=False
    )

    timestamp = db.Column(
        db.DateTime, 
        default=datetime.utcnow
    )

    present = db.Column(
        db.Boolean, 
        nullable=False, 
        default=True
    )

    def __repr__(self):
        return f"<Attendance student={self.student_id} present={self.present}>"
