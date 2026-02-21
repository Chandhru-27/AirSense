
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from user.services import get_user_by_id, update_user

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
	"""Return current authenticated user's basic profile."""
	user_id = get_jwt_identity()
	try:
		user = get_user_by_id(int(user_id))
	except Exception as e:
		return jsonify({"error": str(e)}), 400

	if not user:
		return jsonify({"error": "User not found"}), 404

	return jsonify({"user": user}), 200


@user_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
	"""Update allowed user profile fields."""
	user_id = get_jwt_identity()
	data = request.json or {}
	
	if 'age' in data:
		try:
			data['age'] = int(data['age'])
		except Exception:
			return jsonify({"error": "Invalid age"}), 400

	if 'gender' in data and data['gender'] not in ('Male', 'Female', 'Other'):
		return jsonify({"error": "Invalid gender"}), 400

	try:
		updated = update_user(int(user_id), data)
	except Exception as e:
		return jsonify({"error": str(e)}), 400

	if not updated:
		return jsonify({"error": "User not found"}), 404

	return jsonify({"user": updated}), 200

