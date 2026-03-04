"""
Tour Bookings API Routes
Unified tour history: links users to both itinerary-created and pre-made tours.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
import logging

from ..extensions import mongo, get_user_id_from_jwt
from ..models.tour_bookings import TourBookings
from ..models.tours import TourModel

logger = logging.getLogger(__name__)

tour_bookings_bp = Blueprint("tour_bookings", __name__)


@tour_bookings_bp.route("/history", methods=["GET"])
@jwt_required()
def get_booking_history():
    """
    Unified tour history from tour_bookings collection.

    Query params:
    - status: planning | created | saved | paid | all (default all)
    - search: search by tour_name or destination
    - limit: number of results (default 100)
    - skip: pagination offset (default 0)
    """
    try:
        user_id = get_user_id_from_jwt()

        status = request.args.get("status")
        search = request.args.get("search")
        limit = int(request.args.get("limit", 100))
        skip = int(request.args.get("skip", 0))

        status_filter = None
        if status and status.lower() not in ("all", ""):
            status_map = {
                "planning": "planning",
                "created": "created",
                "saved": "saved",
                "paid": "paid",
                "completed": "created",
                "in progress": "planning",
                "pending": "planning",
                "payed": "paid",
            }
            status_filter = status_map.get(status.lower(), status.lower())

        query = {"user_id": user_id}
        if status_filter:
            query["booking_status"] = status_filter

        if search:
            query["$or"] = [
                {"tour_name": {"$regex": search, "$options": "i"}},
                {"destination": {"$regex": search, "$options": "i"}},
            ]

        bookings = TourBookings.find_bookings_paginated(mongo, query, skip, limit)
        total_count = TourBookings.count_bookings(mongo, query)

        history = []
        for b in bookings:
            status_label_map = {
                "planning": "Planning",
                "created": "Created",
                "saved": "Saved",
                "paid": "Paid",
            }
            frontend_status = status_label_map.get(
                b.get("booking_status", "planning"), "Planning"
            )

            start_date = b.get("start_date", "")
            dates = ""
            if start_date:
                try:
                    if isinstance(start_date, str):
                        if "T" in start_date:
                            start = datetime.fromisoformat(
                                start_date.replace("Z", "+00:00")
                            )
                        else:
                            start = datetime.strptime(start_date, "%Y-%m-%d")
                    else:
                        start = start_date
                    duration = b.get("duration_days", 1)
                    end = start + timedelta(days=duration - 1)
                    dates = f"{start.strftime('%d %b %Y')} - {end.strftime('%d %b %Y')}"
                except Exception:
                    dates = str(start_date)

            created_at = b.get("created_at")
            if isinstance(created_at, datetime):
                created_at = created_at.isoformat()
            else:
                created_at = str(created_at) if created_at else ""

            history.append(
                {
                    "id": b.get("tour_ref_id", ""),
                    "booking_id": b.get("booking_id", ""),
                    "tour_type": b.get("tour_type", "itinerary"),
                    "status": frontend_status,
                    "name": b.get("tour_name") or "Unnamed Tour",
                    "destination": b.get("destination") or "Unknown",
                    "dates": dates,
                    "travelers": f"{b.get('guest_count', 1)} guests",
                    "budget": f"${b.get('total_cost', 0):.0f}",
                    "image": b.get("image")
                    or "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
                    "activities": 0,
                    "rating": None,
                    "created_at": created_at,
                }
            )

        return (
            jsonify({"count": len(history), "total": total_count, "history": history}),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting booking history: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@tour_bookings_bp.route("/save", methods=["POST"])
@jwt_required()
def save_premade_tour():
    """
    Save / bookmark a pre-made tour for the current user.

    Request body:
    {
        "tour_id": "macau_20260129145457"
    }
    """
    try:
        user_id = get_user_id_from_jwt()
        data = request.get_json() or {}

        tour_id = data.get("tour_id")
        if not tour_id:
            return jsonify({"error": "tour_id is required"}), 400

        existing = TourBookings.find_by_tour_ref(mongo, tour_id, user_id)
        if existing:
            return (
                jsonify(
                    {
                        "message": "Tour already saved",
                        "booking": existing,
                    }
                ),
                200,
            )

        tour = TourModel.find_tour_by_id(mongo, tour_id)
        if not tour:
            return jsonify({"error": "Tour not found"}), 404

        destination_city = ""
        dest = tour.get("destination", {})
        if isinstance(dest, dict):
            destination_city = dest.get("city", "")

        image = None
        acc = tour.get("accommodation", {})
        if isinstance(acc, dict):
            images = acc.get("images", [])
            if images:
                image = images[0]

        booking_data = {
            "user_id": user_id,
            "tour_type": "premade_tour",
            "tour_ref_id": tour_id,
            "booking_status": "saved",
            "tour_name": tour.get("title", ""),
            "destination": destination_city,
            "total_cost": tour.get("pricing", {}).get("total", 0),
            "duration_days": tour.get("duration_days", 1),
            "guest_count": 1,
            "start_date": "",
            "image": image,
        }

        booking = TourBookings.create(booking_data, mongo)
        booking.pop("_id", None)

        logger.info(
            f"Premade tour saved: booking={booking['booking_id']}, "
            f"tour={tour_id}, user={user_id}"
        )

        return (
            jsonify(
                {
                    "message": "Tour saved successfully",
                    "booking": TourBookings._serialize(booking),
                }
            ),
            201,
        )

    except Exception as e:
        logger.error(f"Error saving tour: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@tour_bookings_bp.route("/<booking_id>", methods=["GET"])
@jwt_required()
def get_booking(booking_id):
    """Get a single booking by booking_id"""
    try:
        user_id = get_user_id_from_jwt()
        booking = TourBookings.find_by_booking_id(mongo, booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        if booking["user_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        return jsonify({"booking": booking}), 200
    except Exception as e:
        logger.error(f"Error getting booking: {e}")
        return jsonify({"error": str(e)}), 500


@tour_bookings_bp.route("/<booking_id>", methods=["DELETE"])
@jwt_required()
def delete_booking(booking_id):
    """Delete a booking record"""
    try:
        user_id = get_user_id_from_jwt()
        booking = TourBookings.find_by_booking_id(mongo, booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        if booking["user_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        TourBookings.delete(mongo, booking_id)
        logger.info(f"Booking deleted: {booking_id}")
        return jsonify({"message": "Booking deleted"}), 200
    except Exception as e:
        logger.error(f"Error deleting booking: {e}")
        return jsonify({"error": str(e)}), 500
