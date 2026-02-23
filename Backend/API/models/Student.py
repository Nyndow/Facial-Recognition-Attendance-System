from config.database import db
from sqlalchemy import JSON

class Student(db.Model):
    __tablename__ = "student"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    face_emb = db.Column(JSON, nullable=False)
    matricule = db.Column(db.String(50), unique=True, nullable=False)
    class_id = db.Column(db.Integer, nullable=True)

    def __repr__(self):
        return f"<Student {self.id}: {self.name}, {self.matricule}>"
