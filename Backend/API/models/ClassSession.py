from config.database import db
from datetime import datetime

class ClassSession(db.Model):
    __tablename__ = "class_sessions"

    id = db.Column(db.Integer, primary_key=True)
    room = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    teacher_id = db.Column(db.Integer, nullable=False) 
    class_id = db.Column(db.Integer, nullable=False)  

    # Relationship to Attendance
    # attendance_records = db.relationship("Attendance", backref="class_session")
    # class_ = db.relationship("Class", backref="sessions")
    # teacher = db.relationship("User", backref="class_sessions")

    def __repr__(self):
        return f"<ClassSession id={self.id} room={self.room} subject={self.subject} time={self.time} teacher_id={self.teacher_id}>"