"""
Device Management Routes
Handles device listing and removal
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from ..extensions import mongo, parse_jwt_identity
from ..models.users import Users

devices_bp = Blueprint("devices", __name__)


@devices_bp.route("/", methods=["GET"])
@jwt_required()
def get_devices():
    """Get all devices for current user"""
    try:
        identity = parse_jwt_identity()
        devices = Users.get_user_devices(mongo, identity["email"])
        return jsonify({"devices": devices}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@devices_bp.route("/<device_id>", methods=["DELETE"])
@jwt_required()
def remove_device(device_id):
    """Remove a device from user's account"""
    try:
        identity = parse_jwt_identity()
        result = Users.remove_device(mongo, identity["email"], device_id)
        
        if result.modified_count == 0:
            return jsonify({"msg": "Device not found"}), 404
        
        return jsonify({"msg": "Device removed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
