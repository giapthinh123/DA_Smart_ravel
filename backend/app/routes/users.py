from typing import Any
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import mongo
from ..models.users import Users

users_bp = Blueprint("users", __name__)

@users_bp.route("/", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")  # Only admin can view all users
def get_users():
    """
    Get all users - ADMIN ONLY
    OWASP: Role-based access control, no password exposure
    """
    users = Users.get_all_users(mongo)
    return jsonify({"users": users, "count": len(users)}), 200

@users_bp.route("/", methods=["POST"])
@jwt_required()
@Users.roles_required("admin")  # Only admin can create users
def create_user():
    """
    Create new user - ADMIN ONLY
    OWASP: Role-based access control, password hashing
    """
    data = request.json
    
    # Validation
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email and password are required"}), 400
    
    # Check if email exists
    if Users.find_user_by_email(mongo, data["email"]):
        return jsonify({"msg": "Email already exists"}), 400
    
    # Password strength check
    if len(data["password"]) < 8:
        return jsonify({"msg": "Password must be at least 8 characters"}), 400
    
    # Create user
    Users.create(data, mongo)
    return jsonify({"msg": "User created successfully"}), 201

@users_bp.route("/<user_id>", methods=["PUT"])
@jwt_required()
@Users.roles_required("admin")  # Only admin can update users
def update_user(user_id):
    """
    Update user - ADMIN ONLY
    OWASP: Role-based access control, safe field updates
    """
    data = request.json
    
    # Remove fields that shouldn't be updated this way
    data.pop("id", None)
    data.pop("password", None)  # Password change requires separate endpoint
    data.pop("created_at", None)
    
    # Add updated timestamp
    from datetime import datetime
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Update user
    result = Users.update_user_by_id(mongo, user_id, data)
    
    if result.matched_count == 0:
        return jsonify({"msg": "User not found"}), 404
    
    if result.modified_count == 0:
        return jsonify({"msg": "No changes made"}), 200
    
    # Get updated user data
    updated_user = Users.find_user_by_id_safe(mongo, user_id)
    
    return jsonify({
        "msg": "User updated successfully",
        "user": updated_user
    }), 200


@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """
    Get current user profile
    OWASP: User can only access their own data
    """
    identity = get_jwt_identity()
    user = Users.find_user_by_id_safe(mongo, identity["id"])
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify({"user": user}), 200

@users_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    Update current user profile
    OWASP: User can only update their own data, role cannot be changed
    """
    identity = get_jwt_identity()
    data = request.json
    
    # Remove fields that shouldn't be updated by user
    data.pop("role", None)
    data.pop("id", None)
    data.pop("email", None)  # Email change requires verification
    data.pop("password", None)  # Password change requires separate endpoint
    data.pop("status", None)  # Status change requires separate endpoint
    
    # Add updated timestamp
    from datetime import datetime
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Update user
    result = Users.update_user_by_id(mongo, identity["id"], data)
    
    if result.modified_count == 0:
        return jsonify({"msg": "No changes made"}), 200
    
    # Get updated user data
    updated_user = Users.find_user_by_id_safe(mongo, identity["id"])
    
    return jsonify({
        "msg": "Profile updated successfully",
        "user": updated_user
    }), 200

@users_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required()
@Users.roles_required("admin")  # Only admin can delete users
def delete_user(user_id):
    """
    Delete user - ADMIN ONLY
    OWASP: Role-based access control, prevent self-deletion
    """
    identity = get_jwt_identity()
    
    # Prevent admin from deleting themselves
    if identity["id"] == user_id:
        return jsonify({"msg": "Cannot delete your own account"}), 400
    
    result = Users.delete_user_by_id(mongo, user_id)
    
    if result.deleted_count == 0:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify({"msg": "User deleted successfully"}), 200

@users_bp.route("/<user_id>/role", methods=["PUT"])
@jwt_required()
@Users.roles_required("admin")  # Only admin can change roles
def update_user_role(user_id):
    """
    Update user role - ADMIN ONLY
    OWASP: Role-based access control, audit trail
    """
    identity = get_jwt_identity()
    data = request.json
    
    if not data or "role" not in data:
        return jsonify({"msg": "Role is required"}), 400
    
    new_role = data["role"]
    
    # Validate role
    valid_roles = ["user", "admin"]
    if new_role not in valid_roles:
        return jsonify({"msg": f"Invalid role. Must be one of: {', '.join(valid_roles)}"}), 400
    
    # Prevent admin from changing their own role
    if identity["id"] == user_id:
        return jsonify({"msg": "Cannot change your own role"}), 400
    
    result = Users.update_user_role(mongo, user_id, new_role)
    
    if result.modified_count == 0:
        return jsonify({"msg": "User not found or role unchanged"}), 404
    
    return jsonify({"msg": f"User role updated to {new_role}"}), 200

@users_bp.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_own_account():
    """
    Soft delete own account (set status to 'delete')
    OWASP: Verify password before deletion, soft delete for data recovery
    """
    identity = get_jwt_identity()
    data = request.json
    
    if not data or not data.get("password"):
        return jsonify({"msg": "Password is required to delete account"}), 400
    
    # Get user from database
    user = Users.find_user_by_id(mongo, identity["id"])
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Verify password
    if not Users.verify_password(data["password"], user["password"]):
        return jsonify({"msg": "Password is incorrect"}), 401
    
    # Soft delete: set status to 'delete'
    result = Users.soft_delete_user(mongo, identity["id"])
    
    if result.modified_count == 0:
        return jsonify({"msg": "Failed to delete account"}), 500
    
    # Add token to blacklist to force logout
    jti = get_jwt()["jti"]
    Users.add_token_to_blacklist(mongo, jti)
    
    return jsonify({"msg": "Account deleted successfully"}), 200

@users_bp.route("/stats", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")  # Admin only can view stats
def get_user_stats():
    """
    Get user statistics - ADMIN ONLY
    OWASP: Role-based access control
    """
    total_users = Users.count_all_users(mongo)
    active_users = Users.count_users_by_status(mongo, "active")
    
    # Count by role
    admin_count = Users.count_users_by_role(mongo, "admin")
    user_count = Users.count_users_by_role(mongo, "user")
    
    return jsonify({
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "by_role": {
            "admin": admin_count,
            "user": user_count
        }
    }), 200
