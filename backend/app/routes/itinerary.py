"""
Itinerary API Routes
Day-by-day itinerary generation endpoints
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import date, datetime
import logging

from ..extensions import mongo, get_user_id_from_jwt
from ..controller.itinerary_controller import ItineraryController
from ..models.tour_bookings import TourBookings
from ..models.citys import citys as CitysModel
from ..models.itineraries import Itineraries

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
        user_id = get_user_id_from_jwt()
        data = request.get_json() or {}
        print(data)
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

        # Also create a tour_booking record for unified history
        dest_name = city_name or ""
        if not dest_name and city_id:
            city_doc = CitysModel.find_city_by_id(mongo, city_id)
            if city_doc:
                dest_name = city_doc.get("name", "")

        try:
            TourBookings.create(
                {
                    "user_id": user_id,
                    "tour_type": "itinerary",
                    "tour_ref_id": result.get("itinerary_id", ""),
                    "booking_status": "planning",
                    "tour_name": name or f"{dest_name} Adventure",
                    "destination": dest_name,
                    "total_cost": budget or 0,
                    "duration_days": trip_duration_days,
                    "guest_count": guest_count,
                    "start_date": start_date,
                },
                mongo,
            )
        except Exception as booking_err:
            logger.warning(f"Failed to create tour_booking record: {booking_err}")

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

        # When itinerary is complete, update booking status to "created"
        if result.get("status") == "complete":
            try:
                summary = result.get("summary", {})
                update_fields = {"booking_status": "created"}
                if summary.get("total_cost"):
                    update_fields["total_cost"] = summary["total_cost"]
                TourBookings.update_status_by_tour_ref(
                    mongo, itinerary_id, "created"
                )
                if summary.get("total_cost"):
                    booking = TourBookings.find_by_tour_ref(mongo, itinerary_id)
                    if booking:
                        TourBookings.update_info(
                            mongo,
                            booking["booking_id"],
                            {"total_cost": summary["total_cost"]},
                        )
            except Exception as booking_err:
                logger.warning(f"Failed to update tour_booking status: {booking_err}")

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
        user_id = get_user_id_from_jwt()
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
        user_id = get_user_id_from_jwt()
        
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
        itineraries = Itineraries.find_with_query(mongo, query, sort_field="created_at", sort_order=-1, skip=skip, limit=limit)
        
        # Transform to frontend format
        history = []
        for itin in itineraries:
            try:
                # Get city info for destination name
                city = None
                city_id = itin.get("city_id")
                if city_id:
                    city = CitysModel.find_city_by_id(mongo, city_id)
                
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
        total_count = Itineraries.count_by_query(mongo, query)
        
        return jsonify({
            "count": len(history),
            "total": total_count,
            "history": history
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting tour history: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/edit-context", methods=["GET"])
@jwt_required()
def get_itinerary_edit_context():
    """
    Get combined itinerary + booking info for editing.

    Query params:
    - booking_id (preferred)
    - itinerary_id
    """
    try:
        user_id = get_user_id_from_jwt()
        booking_id = request.args.get("booking_id")
        itinerary_id = request.args.get("itinerary_id")

        if not booking_id and not itinerary_id:
            return jsonify({"error": "booking_id or itinerary_id is required"}), 400

        booking = None
        if booking_id:
            booking = TourBookings.find_by_booking_id(mongo, booking_id)
        else:
            booking = TourBookings.find_by_tour_ref(mongo, itinerary_id)

        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        if booking.get("user_id") != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        if booking.get("tour_type") != "itinerary":
            return jsonify({"error": "Only itinerary bookings can be edited"}), 400

        booking_status = booking.get("booking_status", "planning")
        if booking_status not in ("planning", "created"):
            return jsonify({"error": "Booking status does not allow editing"}), 400

        itin_id = booking.get("tour_ref_id")
        controller = ItineraryController(mongo)
        itinerary = controller.get_itinerary(itin_id)
        if not itinerary:
            return jsonify({"error": "Itinerary not found"}), 404

        has_generated_days = bool(itinerary.get("daily_itinerary"))

        context = {
            "itinerary_id": itin_id,
            "booking_id": booking.get("booking_id"),
            "tour_type": booking.get("tour_type", "itinerary"),
            "booking_status": booking_status,
            "name": itinerary.get("name") or booking.get("tour_name") or "",
            "destination": booking.get("destination") or itinerary.get("city_name") or "",
            "start_date": itinerary.get("start_date") or booking.get("start_date") or "",
            "trip_duration_days": itinerary.get("trip_duration_days", booking.get("duration_days", 1)),
            "guest_count": itinerary.get("guest_count", booking.get("guest_count", 1)),
            "budget": itinerary.get("budget", booking.get("total_cost", 0)),
            "has_generated_days": has_generated_days,
        }

        return jsonify(context), 200

    except Exception as e:
        logger.error(f"Error getting itinerary edit context: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@itinerary_bp.route("/update-metadata", methods=["POST"])
@jwt_required()
def update_itinerary_metadata():
    """
    Update itinerary metadata (start_date, duration, budget, guests, name)
    and keep TourBookings in sync. May clear existing daily_itinerary when
    core scheduling fields change.
    """
    try:
        user_id = get_user_id_from_jwt()
        data = request.get_json() or {}

        booking_id = data.get("booking_id")
        itinerary_id = data.get("itinerary_id")

        if not booking_id and not itinerary_id:
            return jsonify({"error": "booking_id or itinerary_id is required"}), 400

        booking = None
        if booking_id:
            booking = TourBookings.find_by_booking_id(mongo, booking_id)
        else:
            booking = TourBookings.find_by_tour_ref(mongo, itinerary_id)

        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        if booking.get("user_id") != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        if booking.get("tour_type") != "itinerary":
            return jsonify({"error": "Only itinerary bookings can be edited"}), 400

        booking_status = booking.get("booking_status", "planning")
        if booking_status not in ("planning", "created"):
            return jsonify({"error": "Booking status does not allow editing"}), 400

        itin_id = booking.get("tour_ref_id")
        controller = ItineraryController(mongo)
        itinerary = controller.get_itinerary(itin_id)
        if not itinerary:
            return jsonify({"error": "Itinerary not found"}), 404

        original_start_date = itinerary.get("start_date") or booking.get("start_date") or ""
        original_duration = int(itinerary.get("trip_duration_days", booking.get("duration_days", 1)))
        original_budget = float(itinerary.get("budget", booking.get("total_cost", 0) or 0))
        original_guest_count = int(itinerary.get("guest_count", booking.get("guest_count", 1)))
        original_name = itinerary.get("name") or booking.get("tour_name") or ""

        new_start_date = data.get("start_date") or original_start_date
        new_duration = int(data.get("trip_duration_days") or original_duration)
        new_budget = float(data.get("budget") if data.get("budget") is not None else original_budget)
        new_guest_count = int(data.get("guest_count") or original_guest_count)
        new_name = data.get("name") or original_name

        has_existing_days = bool(itinerary.get("daily_itinerary"))

        changed_start_date = new_start_date != original_start_date
        changed_duration = new_duration != original_duration
        changed_budget = new_budget != original_budget
        changed_guest_count = new_guest_count != original_guest_count
        changed_name = new_name != original_name

        full_regen = (changed_start_date or changed_duration) and has_existing_days

        itinerary_update = {
            "start_date": new_start_date,
            "trip_duration_days": new_duration,
            "guest_count": new_guest_count,
            "budget": new_budget,
            "name": new_name,
            "updated_at": datetime.utcnow(),
        }

        if full_regen:
            itinerary_update["daily_itinerary"] = []
            itinerary_update["status"] = "pending"
            itinerary_update["summary"] = None

        Itineraries.update_by_id(mongo, itin_id, itinerary_update)

        booking_update_fields = {
            "tour_name": new_name,
            "duration_days": new_duration,
            "guest_count": new_guest_count,
            "start_date": new_start_date,
        }
        if changed_budget:
            booking_update_fields["total_cost"] = new_budget

        TourBookings.update_info(
            mongo,
            booking.get("booking_id"),
            booking_update_fields,
        )

        response = {
            "message": "Itinerary updated",
            "itinerary_id": itin_id,
            "booking_id": booking.get("booking_id"),
            "regen_mode": "full" if full_regen else "metadata_only",
            "has_existing_days": has_existing_days,
        }

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error updating itinerary metadata: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
