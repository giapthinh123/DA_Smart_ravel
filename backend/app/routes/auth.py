from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt,
    decode_token,
)
from datetime import datetime
from ..extensions import mongo, limiter, parse_jwt_identity
from ..models.users import Users
from ..models.user_sessions import UserSessions

auth_bp = Blueprint("auth", __name__)


def _create_tokens_and_session(user_id, role, email, device_id, device_name):
    """Shared helper: create JWT pair, persist session, return token strings."""
    identity = {"id": user_id, "role": role, "email": email}

    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

    decoded_access = decode_token(access_token)
    decoded_refresh = decode_token(refresh_token)

    access_exp = datetime.utcfromtimestamp(decoded_access["exp"])
    refresh_exp = datetime.utcfromtimestamp(decoded_refresh["exp"])

    UserSessions.create_session(
        mongo,
        user_id=user_id,
        access_jti=decoded_access["jti"],
        refresh_jti=decoded_refresh["jti"],
        device_id=device_id,
        device_name=device_name,
        access_expires_at=access_exp,
        refresh_expires_at=refresh_exp,
    )

    return access_token, refresh_token


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = request.json

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email and password are required"}), 400

    if not data.get("device_id"):
        return jsonify({"msg": "Device ID is required"}), 400

    if Users.find_user_by_email(mongo, data["email"]):
        return jsonify({"msg": "Email already exists"}), 400

    if len(data["password"]) < 8:
        return jsonify({"msg": "Password must be at least 8 characters"}), 400

    Users.create(data, mongo)
    return jsonify({"msg": "Register success"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email and password are required", "status": "error", "code": 400}), 400

    if not data.get("device_id"):
        return jsonify({"msg": "Device ID is required", "status": "error", "code": 400}), 400

    try:
        user = Users.find_user_by_email_with_timeout(mongo, data["email"], timeout_ms=2000)
    except Exception:
        return jsonify({"msg": "Request timed out", "status": "error", "code": 504}), 504

    if not user or not Users.verify_password(data["password"], user["password"]):
        return jsonify({"msg": "Password is incorrect", "status": "error", "code": 401}), 401

    if user.get("status") != "active":
        return jsonify({"msg": "Account is not active", "status": "error", "code": 403}), 403

    device_id = data["device_id"]
    device_name = data.get("device_name", "Unknown Device")
    devices = user.get("devices", [])

    device_exists = any(d.get("device_id") == device_id for d in devices)

    if device_exists:
        Users.update_device_last_used(mongo, data["email"], device_id)
    elif len(devices) == 0:
        Users.add_device(mongo, data["email"], device_id, device_name)
    else:
        from ..models.device_verifications import DeviceVerifications
        from ..services.email_service import EmailService

        code = DeviceVerifications.create(data["email"], device_id, mongo)
        EmailService.send_device_verification_email(data["email"], code, device_name)

        return jsonify({
            "msg": "Device verification required. Please check your email for verification code.",
            "status": "error",
            "code": 403,
            "error_type": "device_verification_required",
        }), 403

    user_id = str(user["id"])

    UserSessions.revoke_all_sessions(mongo, user_id)

    user.pop("password", None)
    user.pop("_id", None)

    access_token, refresh_token = _create_tokens_and_session(
        user_id, user["role"], user["email"], device_id, device_name,
    )

    return jsonify({
        "auth_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
        "status": user["status"],
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    jwt_data = get_jwt()
    refresh_jti = jwt_data["jti"]
    identity = parse_jwt_identity()

    session = UserSessions.find_session_by_refresh_jti(mongo, refresh_jti)
    if not session:
        return jsonify({"msg": "Session expired, please login again"}), 401

    old_access_jti = session["access_jti"]
    Users.add_token_to_blacklist(mongo, old_access_jti)

    access_token = create_access_token(identity=identity)
    decoded_access = decode_token(access_token)
    new_access_exp = datetime.utcfromtimestamp(decoded_access["exp"])

    UserSessions.update_access_token(
        mongo, refresh_jti, decoded_access["jti"], new_access_exp,
    )

    return jsonify({"auth_token": access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    identity = parse_jwt_identity()
    user_id = identity["id"]

    session = UserSessions.find_session_by_user(mongo, user_id)
    if session:
        Users.add_token_to_blacklist(mongo, session["access_jti"])
        Users.add_token_to_blacklist(mongo, session["refresh_jti"])

    UserSessions.delete_session(mongo, user_id)

    return jsonify({"msg": "Successfully logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    identity = parse_jwt_identity()
    user = Users.find_user_by_id_safe(mongo, identity["id"])

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"user": user}), 200


@auth_bp.route("/verify-device", methods=["POST"])
def verify_device():
    import logging
    logger = logging.getLogger(__name__)

    data = request.json

    if not data or not data.get("email") or not data.get("code") or not data.get("device_id"):
        return jsonify({"msg": "Email, code, and device_id are required"}), 400

    from ..models.device_verifications import DeviceVerifications
    verified_device_id = DeviceVerifications.verify_code(data["email"], data["code"], mongo)

    if not verified_device_id or verified_device_id != data["device_id"]:
        return jsonify({"msg": "Invalid or expired verification code"}), 400

    user = Users.find_user_by_email(mongo, data["email"])
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user_id = str(user["id"])
    device_id = data["device_id"]
    device_name = data.get("device_name", "Unknown Device")

    revoked = UserSessions.revoke_all_sessions(mongo, user_id)
    logger.info("Revoked %d session(s) for user %s during device verification", revoked, user_id)

    Users.replace_all_devices(mongo, data["email"], device_id, device_name)

    user.pop("password", None)
    user.pop("_id", None)

    access_token, refresh_token = _create_tokens_and_session(
        user_id, user["role"], user["email"], device_id, device_name,
    )

    return jsonify({
        "auth_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
        "msg": "Device verified successfully",
    }), 200


@auth_bp.route("/debug/check-token", methods=["GET"])
@jwt_required()
def debug_check_token():
    jwt_data = get_jwt()
    jti = jwt_data["jti"]
    identity = parse_jwt_identity()

    is_blacklisted = Users.is_token_blacklisted(jti)
    session = UserSessions.find_session_by_user(mongo, identity["id"])

    return jsonify({
        "current_jti": jti,
        "is_blacklisted": is_blacklisted,
        "has_active_session": session is not None,
        "session_access_jti": session["access_jti"] if session else None,
        "session_refresh_jti": session["refresh_jti"] if session else None,
        "session_device_id": session.get("device_id") if session else None,
        "session_last_used": str(session.get("last_used_at")) if session else None,
        "user_id": identity["id"],
    }), 200


@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    identity = parse_jwt_identity()
    data = request.json

    if not data or not data.get("currentPassword") or not data.get("newPassword"):
        return jsonify({"msg": "Current password and new password are required"}), 400

    user = Users.find_user_by_id(mongo, identity["id"])
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not Users.verify_password(data["currentPassword"], user["password"]):
        return jsonify({"msg": "Current password is incorrect"}), 401

    if len(data["newPassword"]) < 8:
        return jsonify({"msg": "New password must be at least 8 characters"}), 400

    from werkzeug.security import generate_password_hash
    result = Users.update_user_password(
        mongo, identity["id"], generate_password_hash(data["newPassword"]),
    )

    if result.modified_count == 0:
        return jsonify({"msg": "Failed to update password"}), 500

    return jsonify({"msg": "Password changed successfully"}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per minute")
def forgot_password():
    data = request.json

    if not data or not data.get("email"):
        return jsonify({"msg": "Email is required"}), 400

    email = data["email"].strip().lower()

    # Always return success to avoid leaking whether the email exists
    user = Users.find_user_by_email(mongo, email)
    if user and user.get("status") == "active":
        from ..models.password_resets import PasswordResets
        from ..services.email_service import EmailService

        code = PasswordResets.create(email, mongo)
        EmailService.send_password_reset_email(email, code)

    return jsonify({"msg": "If this email exists, a reset code has been sent."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per minute")
def reset_password():
    data = request.json

    if not data or not data.get("email") or not data.get("new_password"):
        return jsonify({"msg": "Email and new_password are required"}), 400

    email = data["email"].strip().lower()
    new_password = data["new_password"]

    if len(new_password) < 8:
        return jsonify({"msg": "Password must be at least 8 characters"}), 400

    user = Users.find_user_by_email(mongo, email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    from werkzeug.security import generate_password_hash

    user_id = str(user["id"])
    result = Users.update_user_password(
        mongo, user_id, generate_password_hash(new_password)
    )

    if result.modified_count == 0:
        return jsonify({"msg": "Failed to reset password"}), 500

    # Clean up used code
    from ..models.password_resets import PasswordResets as PasswordResetsModel
    PasswordResetsModel.delete_by_email(mongo, email)

    return jsonify({"msg": "Password reset successfully"}), 200

@auth_bp.route("/verify-code-password", methods=["POST"])
def verify_code_password():
    data = request.json

    if not data or not data.get("email") or not data.get("code"):
        return jsonify({"code": "400","msg": "Email and code are required"}), 400

    email = data["email"].strip().lower()
    code = data["code"].strip()

    from ..models.password_resets import PasswordResets

    if not PasswordResets.verify_code(email, code, mongo):
        return jsonify({"code": "400","msg": "Invalid or expired verification code"}), 400

    return jsonify({"code": "200","msg": "Verification code is valid"}), 200