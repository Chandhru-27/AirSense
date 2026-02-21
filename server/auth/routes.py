from flask import Blueprint, request, jsonify
import psycopg2
from db.db_setup import get_db_connection
import re
import os
from extensions import bcrypt, limiter
import datetime
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt,
    get_csrf_token,
    create_access_token, 
    create_refresh_token, 
    set_refresh_cookies,
    set_access_cookies,
    unset_jwt_cookies,
)


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def is_valid_email(email):
    """Check if an email is valid with regex"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.fullmatch(pattern, email):
        return True
    else:
        return False
    
    
def is_token_revoked(jti):
    """Check if the current jti is revoked"""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute("SELECT 1 FROM token_blocklist WHERE jti=%s;", (jti,))
            exists = cur.fetchone() is not None
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 400
        finally:
            cur.close()

    return exists


def add_token_to_blocklist(jti, token_type, user_id=None):
    """Add a jti to the blocklist table"""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO token_blocklist (jti, token_type, user_id, revoked_at) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;",
                (jti, token_type, user_id, datetime.datetime.utcnow())
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 400
        finally:
            cur.close()


@auth_bp.route('/signup', methods=['POST'])
@limiter.limit("2 per minute")
def signup():
    """Signup route for making a post request"""
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not password or not email:
        return jsonify({"error": "All credentials required"}), 400
    
    if len(password) < 8: 
        return jsonify({"error": "Password must be at least 8 characters long"}), 400

    if not is_valid_email(email=email):
        return jsonify({"error": "Invalid Email"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO users (username,email, password) VALUES (%s, %s, %s) RETURNING id;",
                (username, email, hashed_password)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return jsonify({"error": "Username or email already exists"}), 400
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 400
        finally:
            cur.close()
            conn.close()

    return jsonify({"message": "User created!", "user_id": user_id}), 201
  

@auth_bp.route('/signin', methods=['POST'])
@limiter.limit("2 per minute")
def signin():
    """Sign in the user securely with JWTs"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute("SELECT id, password FROM users WHERE username=%s;", (username,))
            user = cur.fetchone()
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 400
        finally:
            cur.close()

    if not user:
        return jsonify({"error": "Invalid username or password"}), 401
    user_id, pw_hash = user
    if not bcrypt.check_password_hash(pw_hash, password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity=str(user_id), fresh=True)
    refresh_token = create_refresh_token(identity=str(user_id))

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_access_token():
    """Use refresh token to get the access token"""
    identity = get_jwt_identity()
    jti = get_jwt()['jti']

    if is_token_revoked(jti=jti):
        return jsonify({"message": "Token revoked"}), 401
    
    new_access_token = create_access_token(identity=identity)
    response = jsonify({"message" : "Access token refreshed", "access_token": new_access_token})
    
    return response,200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get the current user"""
    user_id = get_jwt_identity()
    return jsonify({"logged_in": True, "user_id":user_id}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Handle logout by blocking the jti"""
    jwt = get_jwt()
    jti = jwt['jti']
    identity = get_jwt_identity()

    add_token_to_blocklist(jti=jti, token_type="access", user_id=identity)

    response = jsonify({"message": "Logout successful"})

    return response,200
