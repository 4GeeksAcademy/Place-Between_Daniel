"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Emotion, EmotionCheckin, Activity, ActivityCompletion
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from datetime import datetime

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

@api.route('/register', methods=['POST'])
def register():
    body = request.get_json()

    email = (body.get("email") or "").strip().lower()
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    timezone = (body.get("timezone") or "UTC").strip()

    # Validaciones basicas
    if not email or not username or not password:
        return jsonify({"msg": "email, username y password son obligatorios"}), 400

    # Evitar duplicados
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Ese email ya está registrado"}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Ese username ya está registrado"}), 409

    # Crear usuario
    user = User(
        email=email,
        username=username,
        timezone=timezone,
        created_at=datetime.utcnow(),
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # TODO: Aquí luego llamas a Loops.so para welcome email
    # loops_service.send_welcome_email(user.email, user.username)
    # user.welcome_email_sent_at = datetime.utcnow()
    # db.session.commit()

    return jsonify({
        "msg": "Usuario creado",
        "user": user.serialize()
    }), 201



###### DAILY SESSION 





###### Emotions y Checkins

### GET Emotions

@api.route("/emotions", methods=["GET"])
def get_emotions():
    emotions = Emotion.query.all()
    return jsonify([e.serialize() for e in emotions])

### POST Emotion Checkin

@api.route("/sessions/<int:session_id>/emotion-checkin", methods=["POST"])
def create_emotion_checkin(session_id):
    data = request.json

    checkin = EmotionCheckin(
        daily_session_id=session_id,
        emotion_id=data["emotion_id"],
        note=data.get("note")
    )

    db.session.add(checkin)
    db.session.commit()

    return jsonify({
        "msg": "emotion checkin created",
        "checkin": checkin.serialize()
    }), 201

### GET MUSIC

DEFAULT_TRACK = "https://soundcloud.com/clubfuriess/default-track"

@api.route("/sessions/<int:session_id>/emotion-music", methods=["GET"])
def get_session_emotion_music(daily_session_id):
    checkin = (
        EmotionCheckin.query.filter_by(daily_session_id=daily_session_id)
        .order_by(EmotionCheckin.created_at.desc())
        .first()
    )

    if not checkin or not checkin.emotion:
        return jsonify({
            "emotion": None,
            "url_music": DEFAULT_TRACK
        }), 200

    return jsonify({
        "emotion": checkin.emotion.name,
        "url_music": checkin.emotion.url_music or DEFAULT_TRACK
    }), 200




###### Activity y Completions

### GET Activities 

@api.route("/activities", methods=["GET"])
def get_activities():
    activities = Activity.query.filter_by(is_active=True).all()
    return jsonify([a.serialize() for a in activities])


### POST Completion

@api.route("/sessions/<int:session_id>/activity-completion", methods=["POST"])
def complete_activity(session_id):
    data = request.json

    activity_completion = ActivityCompletion(
        daily_session_id=session_id,
        activity_id=data["activity_id"],
        points_awarded=data.get("points_awarded", 0)
    )

    db.session.add(activity_completion)
    db.session.commit()

    return jsonify({
        "msg": "activity completed",
        "completion": activity_completion.serialize()
    }), 201



### GET Activities Completed

@api.route("/sessions/<int:session_id>/activity-completions", methods=["GET"])
def get_activity_completions(session_id):
    act_completed = ActivityCompletion.query.filter_by(daily_session_id=session_id).all()
    return jsonify([ac.serialize() for ac in act_completed])