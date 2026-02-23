
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from user.services import (
    get_user_by_id,
    update_user,
    create_user_message,
    create_pollution_report,
    get_reports_by_user,
    delete_pollution_report,
    get_health_profile,
    upsert_health_profile,
)
from db.s3 import upload_report_image, delete_report_image

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


@user_bp.route('/message', methods=['POST'])
@jwt_required()
def send_user_message():
    """Store a support message from the user."""
    user_id = get_jwt_identity()
    data = request.json or {}
    full_name = data.get('full_name')
    email = data.get('email')
    message = data.get('message')

    if not message:
        return jsonify({"error": "Message content is required"}), 400

    try:
        msg_id = create_user_message(int(user_id), full_name, email, message)
        return jsonify({"message": "Message sent securely", "id": msg_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Pollution Reports ────────────────────────────────────────────────────────

@user_bp.route('/reports', methods=['POST'])
@jwt_required()
def submit_pollution_report():
    """
    POST /api/user/reports
    Multipart form fields:
        description  (str, required)
        lat          (float, required)
        lon          (float, required)
        image        (file, optional — image/*, max 5 MB)
    """
    user_id = int(get_jwt_identity())

    description = request.form.get('description', '').strip()
    if not description:
        return jsonify({"error": "description is required"}), 400

    try:
        lat = float(request.form.get('lat', ''))
        lon = float(request.form.get('lon', ''))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon must be valid numbers"}), 400

    # ── Optional image upload ─────────────────────────────────────────────────
    image_meta: dict = {}
    file = request.files.get('image')
    if file and file.filename:
        # Read once so we can measure size without seeking back (stream may not support it)
        file_bytes = file.read()
        size = len(file_bytes)
        mime = file.mimetype or 'image/jpeg'

        try:
            import io
            image_meta = upload_report_image(
                file_stream=io.BytesIO(file_bytes),
                filename=file.filename,
                mime_type=mime,
                size_bytes=size,
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 422
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 502

    try:
        report = create_pollution_report(
            user_id=user_id,
            description=description,
            lat=lat,
            lon=lon,
            **image_meta,
        )
        # Convert datetime to ISO string for JSON
        if report.get('created_at'):
            report['created_at'] = report['created_at'].isoformat()
        return jsonify({"status": "success", "report": report}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@user_bp.route('/reports', methods=['GET'])
@jwt_required()
def list_my_reports():
    """
    GET /api/user/reports?limit=20&offset=0
    Returns the paginated list of reports submitted by the authenticated user.
    """
    user_id = int(get_jwt_identity())
    try:
        limit  = min(int(request.args.get('limit', 20)), 100)
        offset = int(request.args.get('offset', 0))
    except ValueError:
        return jsonify({"error": "limit and offset must be integers"}), 400

    reports = get_reports_by_user(user_id, limit=limit, offset=offset)
    for r in reports:
        if r.get('created_at'):
            r['created_at'] = r['created_at'].isoformat()

    return jsonify({"status": "success", "count": len(reports), "reports": reports}), 200


@user_bp.route('/reports/<int:report_id>', methods=['DELETE'])
@jwt_required()
def delete_my_report(report_id: int):
    """
    DELETE /api/user/reports/<report_id>
    Deletes the report and removes the associated image from S3 if present.
    Only the report's owner can delete it.
    """
    user_id = int(get_jwt_identity())

    try:
        image_key = delete_pollution_report(report_id, user_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if image_key is None:
        return jsonify({"error": "Report not found or access denied"}), 404

    # Clean up S3 object if one was attached
    if image_key:
        try:
            delete_report_image(image_key)
        except RuntimeError:
            pass  # Log but don't fail the request — row is already deleted

    return jsonify({"status": "success", "message": "Report deleted"}), 200


# ─── Health Profile ───────────────────────────────────────────────────────────

@user_bp.route('/health-profile', methods=['GET'])
@jwt_required()
def get_my_health_profile():
    """
    GET /api/user/health-profile
    Returns the health profile for the current user, or null if not set yet.
    """
    user_id = int(get_jwt_identity())
    profile = get_health_profile(user_id)
    return jsonify({"profile": profile}), 200


@user_bp.route('/health-profile', methods=['POST'])
@jwt_required()
def save_my_health_profile():
    """
    POST /api/user/health-profile
    Creates or fully updates the health profile for the current user.
    All fields are optional — only provided keys are updated.
    """
    user_id = int(get_jwt_identity())
    data = request.json or {}

    bool_fields = [
        "has_asthma", "has_copd", "has_allergies",
        "has_heart_condition", "is_pregnant", "takes_inhaler",
    ]
    valid_smoking = {"Never", "Former", "Current"}
    valid_fitness = {"Sedentary", "Moderate", "Active"}
    valid_outdoor = {"Low", "Medium", "High"}
    valid_breathing = {"Never", "Sometimes", "Often"}

    for field in bool_fields:
        if field in data and not isinstance(data[field], bool):
            return jsonify({"error": f"'{field}' must be a boolean"}), 400

    if "smoking_status" in data and data["smoking_status"] not in valid_smoking:
        return jsonify({"error": "smoking_status must be Never, Former, or Current"}), 400
    if "fitness_level" in data and data["fitness_level"] not in valid_fitness:
        return jsonify({"error": "fitness_level must be Sedentary, Moderate, or Active"}), 400
    if "outdoor_exposure" in data and data["outdoor_exposure"] not in valid_outdoor:
        return jsonify({"error": "outdoor_exposure must be Low, Medium, or High"}), 400
    if "breathing_difficulty" in data and data["breathing_difficulty"] not in valid_breathing:
        return jsonify({"error": "breathing_difficulty must be Never, Sometimes, or Often"}), 400

    try:
        profile = upsert_health_profile(user_id, data)
        if profile.get("created_at"):
            profile["created_at"] = profile["created_at"].isoformat()
        if profile.get("updated_at"):
            profile["updated_at"] = profile["updated_at"].isoformat()
        return jsonify({"status": "success", "profile": profile}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
