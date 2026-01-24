"""
Itinerary API Routes
Day-by-day itinerary generation endpoints
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
import logging

from ..extensions import mongo
from ..controller.itinerary_controller import ItineraryController

logger = logging.getLogger(__name__)

itinerary_bp = Blueprint("itinerary", __name__)


@itinerary_bp.route("/create", methods=["POST"])
@jwt_required()
def create_itinerary():
    """
    Create a new itinerary with pending status
    
    Request:
    {
        "city_id": "1764068610",
        "trip_duration_days": 3,
        "start_date": "2026-02-15",
        "guest_count": 2,
        "budget": 1000
    }
    """
    try:
        identity = get_jwt_identity()
        # Handle both dict and string identity formats
        user_id = identity["id"] if isinstance(identity, dict) else identity
        data = request.get_json() or {}
        
        city_id = data.get("city_id")
        if not city_id:
            return jsonify({"error": "city_id is required"}), 400
        
        trip_duration_days = data.get("trip_duration_days", 1)
        start_date = data.get("start_date") or date.today().isoformat()
        guest_count = data.get("guest_count", 2)
        budget = data.get("budget", 1000)
        
        controller = ItineraryController(mongo)
        result = controller.create_itinerary(
            user_id=user_id,
            city_id=city_id,
            trip_duration_days=trip_duration_days,
            start_date=start_date,
            guest_count=guest_count,
            budget=budget
        )
        
        return jsonify(result), 201
        
    except Exception as e:
        logger.error(f"Error creating itinerary: {e}")
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/generate-day", methods=["POST"])
@jwt_required()
def generate_day():
    """
    Generate a single day for an existing itinerary
    
    Request:
    {
        "itinerary_id": "itin_xxx",
        "day_number": 1
    }
    """
    try:
        data = request.get_json() or {}
        
        itinerary_id = data.get("itinerary_id")
        if not itinerary_id:
            return jsonify({"error": "itinerary_id is required"}), 400
        
        day_number = data.get("day_number")
        if not day_number:
            return jsonify({"error": "day_number is required"}), 400
        
        controller = ItineraryController(mongo)
        result = controller.generate_day(
            itinerary_id=itinerary_id,
            day_number=int(day_number)
        )
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error generating day: {e}")
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/<itinerary_id>", methods=["GET"])
@jwt_required()
def get_itinerary(itinerary_id):
    """Get an itinerary by ID"""
    try:
        controller = ItineraryController(mongo)
        itinerary = controller.get_itinerary(itinerary_id)
        
        if not itinerary:
            return jsonify({"error": "Itinerary not found"}), 404
        
        return jsonify(itinerary), 200
        
    except Exception as e:
        logger.error(f"Error getting itinerary: {e}")
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/user", methods=["GET"])
@jwt_required()
def get_user_itineraries():
    """Get all itineraries for current user"""
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        controller = ItineraryController(mongo)
        itineraries = controller.get_user_itineraries(user_id)
        
        return jsonify({
            "count": len(itineraries),
            "itineraries": itineraries
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting itineraries: {e}")
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/<itinerary_id>", methods=["DELETE"])
@jwt_required()
def delete_itinerary(itinerary_id):
    """Delete an itinerary"""
    try:
        controller = ItineraryController(mongo)
        if controller.delete_itinerary(itinerary_id):
            return jsonify({"message": "Deleted"}), 200
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/<itinerary_id>/day/<int:day_number>", methods=["DELETE"])
@jwt_required()
def delete_day(itinerary_id, day_number):
    """Delete a specific day from itinerary to allow regeneration"""
    try:
        controller = ItineraryController(mongo)
        result = controller.delete_day(itinerary_id, day_number)
        if result:
            return jsonify({
                "message": f"Day {day_number} deleted",
                "itinerary_id": itinerary_id,
                "day_number": day_number
            }), 200
        return jsonify({"error": "Day not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting day: {e}")
        return jsonify({"error": str(e)}), 500
