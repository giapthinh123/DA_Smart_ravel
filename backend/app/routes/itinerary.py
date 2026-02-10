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
        "budget": 1000,
        "book_flight": true,
        "flights": { "selectedDepartureFlight": {...}, "selectedReturnFlight": {...} }
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
        name = data.get("name")
        city_name = data.get("city_name")
        book_flight = data.get("book_flight", False)
        flights = data.get("flights")

        controller = ItineraryController(mongo)
        result = controller.create_itinerary(
            user_id=user_id,
            city_id=city_id,
            trip_duration_days=trip_duration_days,
            start_date=start_date,
            guest_count=guest_count,
            budget=budget,
            name=name,
            city_name=city_name,
            book_flight=book_flight,
            flights=flights
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


@itinerary_bp.route("/history", methods=["GET"])
@jwt_required()
def get_tour_history():
    """
    Get user's tour history with filtering
    
    Query params:
    - status: filter by status (complete, pending, cancelled, saved)
    - search: search by destination or tour name
    - limit: number of results (default 100)
    - skip: pagination offset (default 0)
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        
        # Get query parameters
        status = request.args.get("status")
        search = request.args.get("search")
        limit = int(request.args.get("limit", 100))
        skip = int(request.args.get("skip", 0))
        
        # Build MongoDB query
        query = {"user_id": user_id}
        
        if status and status.lower() != "all":
            # Map frontend status to backend status
            status_map = {
                "completed": "complete",
                "in progress": "pending",
                "pending": "pending",
                "cancelled": "cancelled",
                "saved": "saved"
            }
            backend_status = status_map.get(status.lower(), status.lower())
            query["status"] = backend_status
        
        # Get itineraries from database
        itineraries_cursor = mongo.db.itineraries.find(query).sort("created_at", -1).skip(skip).limit(limit)
        itineraries = list(itineraries_cursor)
        
        # Transform to frontend format
        history = []
        for itin in itineraries:
            try:
                # Get city info for destination name
                city = None
                city_id = itin.get("city_id")
                if city_id:
                    city = mongo.db.citys.find_one({"id": str(city_id)})
                
                # Use city collection name, fallback to city_name field in document, then "Unknown"
                destination = (city.get("name") if city else None) or itin.get("city_name") or "Unknown"
                
                # Calculate stats from summary or daily_itinerary
                summary = itin.get("summary", {})
                total_places = summary.get("total_places", 0)
                total_cost = summary.get("total_cost", 0)
                
                # If summary doesn't have total_places, count from daily_itinerary
                if total_places == 0 and itin.get("daily_itinerary"):
                    for day in itin["daily_itinerary"]:
                        blocks = day.get("blocks", [])
                        total_places += len(blocks)
                
                # If summary doesn't have total_cost, calculate from daily_itinerary
                if total_cost == 0 and itin.get("daily_itinerary"):
                    for day in itin["daily_itinerary"]:
                        blocks = day.get("blocks", [])
                        for block in blocks:
                            total_cost += block.get("estimated_cost", 0)
                
                # Get first place image if available
                image = "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80"  # default
                if itin.get("daily_itinerary") and len(itin["daily_itinerary"]) > 0:
                    first_day = itin["daily_itinerary"][0]
                    if first_day.get("blocks") and len(first_day["blocks"]) > 0:
                        first_block = first_day["blocks"][0]
                        first_place = first_block.get("place", {})
                        if first_place:
                            # Try to get photo from place data
                            photos = first_place.get("photos", [])
                            if photos and len(photos) > 0:
                                photo_ref = photos[0].get("photo_reference", "")
                                if photo_ref:
                                    image = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key=YOUR_API_KEY"
                
                # Format dates
                start_date = itin.get("start_date", "")
                dates = ""
                if start_date:
                    from datetime import datetime, timedelta
                    try:
                        # Handle both ISO format and date string
                        if isinstance(start_date, str):
                            if "T" in start_date:
                                start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                            else:
                                start = datetime.strptime(start_date, "%Y-%m-%d")
                        else:
                            start = start_date
                        
                        trip_duration = itin.get("trip_duration_days", 1)
                        end = start + timedelta(days=trip_duration - 1)
                        end_date_str = end.strftime("%d %b %Y")
                        start_date_str = start.strftime("%d %b %Y")
                        dates = f"{start_date_str} - {end_date_str}"
                    except Exception as date_error:
                        logger.warning(f"Error formatting date: {date_error}, using raw value")
                        dates = str(start_date) if start_date else ""
                
                # Map status to frontend format
                backend_status = itin.get("status", "pending").lower()
                status_map = {
                    "complete": "Completed",
                    "completed": "Completed",
                    "pending": "Pending",
                    "cancelled": "Cancelled",
                    "canceled": "Cancelled",
                    "payed": "Payed"
                }
                frontend_status = status_map.get(backend_status, "Pending")
                
                # Build history item
                history_item = {
                    "id": itin.get("itinerary_id") or str(itin.get("_id", "")),
                    "status": frontend_status,
                    "name": itin.get("name") or f"{destination} Adventure",
                    "destination": destination,
                    "dates": dates,
                    "travelers": f"{itin.get('guest_count', 1)} guests",
                    "budget": f"${total_cost:.0f}" if total_cost > 0 else "$0",
                    "image": image,
                    "activities": total_places,
                    "rating": None if backend_status != "complete" else 4.5,
                    "created_at": itin.get("created_at").isoformat() if isinstance(itin.get("created_at"), datetime) else str(itin.get("created_at", "")),
                    "city_id": str(city_id) if city_id else None
                }
                
                # Apply search filter if provided
                if search:
                    search_lower = search.lower()
                    if (search_lower not in history_item["name"].lower() and 
                        search_lower not in history_item["destination"].lower()):
                        continue
                
                history.append(history_item)
            except Exception as item_error:
                logger.warning(f"Error processing itinerary item: {item_error}, skipping")
                continue
        
        # Get total count for pagination (before search filter)
        total_count = mongo.db.itineraries.count_documents(query)
        
        return jsonify({
            "count": len(history),
            "total": total_count,
            "history": history
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting tour history: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
