from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from datetime import datetime
from ..extensions import mongo, limiter
from ..models.users import Users

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")  # Rate limiting for registration
def register():
    """
    Register new user
    OWASP: Rate limiting, password hashing, input validation
    """
    data = request.json
    
    # Validation
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email and password are required"}), 400
    
    # Check if email exists
    if Users.find_user_by_email(mongo, data["email"]):
        return jsonify({"msg": "Email already exists"}), 400
    
    # Password strength check (basic)
    if len(data["password"]) < 8:
        return jsonify({"msg": "Password must be at least 8 characters"}), 400
    
    # Create user with default role 'user'
    Users.create(data, mongo)
    return jsonify({"msg": "Register success"}), 201

@auth_bp.route("/login", methods=["POST"])
# @limiter.limit("5 per minute")  # Prevent brute force attacks
def login():
    """
    Login user
    OWASP: Rate limiting, secure token generation, role-based access
    """
    data = request.json
    
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email and password are required", "status": "error", "code": 400}), 400
    
    try:
        user = Users.find_user_by_email_with_timeout(mongo, data["email"], timeout_ms=2000)
    except Exception as e:
        return jsonify({"msg": "Request timed out", "status": "error", "code": 504}), 504
    
    # Check credentials
    if not user or not Users.verify_password(data["password"], user["password"]):
        return jsonify({"msg": "Password is incorrect", "status": "error", "code": 401}), 401
    
    # Check if user is active
    if user.get("status") != "active":
        return jsonify({"msg": "Account is not active", "status": "error", "code": 403}), 403
    
    # Remove sensitive data
    user.pop("password", None)
    user.pop("_id", None)
    
    # Create JWT tokens with role information
    identity = {
        "id": str(user["id"]),
        "role": user["role"],
        "email": user["email"]
    }
    
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)
    
    return jsonify({
        "auth_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
        "status": user["status"]
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    OWASP: Separate refresh token mechanism
    """
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"auth_token": access_token}), 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Logout user by blacklisting the token
    OWASP: Token revocation
    """
    jti = get_jwt()["jti"]
    
    # Add token to blacklist
    Users.add_token_to_blacklist(mongo, jti)
    
    return jsonify({"msg": "Successfully logged out"}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get current user info from JWT
    OWASP: JWT validation, no sensitive data exposure
    """
    identity = get_jwt_identity()
    
    # Get fresh user data from database
    user = Users.find_user_by_id_safe(mongo, identity["id"])
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify({"user": user}), 200

@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    """
    Change user password
    OWASP: Verify current password, password strength check
    """
    identity = get_jwt_identity()
    data = request.json
    
    if not data or not data.get("currentPassword") or not data.get("newPassword"):
        return jsonify({"msg": "Current password and new password are required"}), 400
    
    # Get user from database
    user = Users.find_user_by_id(mongo, identity["id"])
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Verify current password
    if not Users.verify_password(data["currentPassword"], user["password"]):
        return jsonify({"msg": "Current password is incorrect"}), 401
    
    # Password strength check
    if len(data["newPassword"]) < 8:
        return jsonify({"msg": "New password must be at least 8 characters"}), 400
    
    # Update password
    from werkzeug.security import generate_password_hash
    result = Users.update_user_password(mongo, identity["id"], generate_password_hash(data["newPassword"]))
    
    if result.modified_count == 0:
        return jsonify({"msg": "Failed to update password"}), 500
    
    return jsonify({"msg": "Password changed successfully"}), 200