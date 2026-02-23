# create_app.py
from flask import Flask
from config.config import Config
from config.database import db
from config.cors import init_cors

# Import all models BEFORE db.create_all()
from models.Student import Student
from models.Class import Class
from models.ClassSession import ClassSession
from models.Attendance import Attendance
from models.User import User
from models.Room import Room

#test

from routes.StudentRoutes import student_bp
from routes.AuthRoutes import auth_bp
from routes.ClassSessionRoutes import class_session_bp
from routes.ClassSessionStudentRoutes import class_session_student_bp
from routes.AttendanceRoutes import attendance_bp
from routes.RoomRoutes import room_bp
from routes.TeacherRoutes import teacher_bp
from routes.UserRoutes import users_bp
from routes.ClassRoutes import class_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Init CORS
    init_cors(app)

    # Init DB
    db.init_app(app)
    with app.app_context():
        db.create_all()  # now Student & Class are known

    # Register routes
    app.register_blueprint(student_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(class_session_bp)
    app.register_blueprint(class_session_student_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(room_bp)
    app.register_blueprint(teacher_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(class_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
