"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User 
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from datetime import datetime
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

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

@api.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"msg": "email y password son obligatorios"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "Credenciales inválidas"}), 401


    # actualiza last_login_at
    user.last_login_at = datetime.utcnow()
    db.session.commit()

    # crea token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.serialize()
    }), 200