from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone

from ..extensions import mongo, get_user_id_from_jwt
from ..models.tours import TourModel

tours_bp = Blueprint("tours", __name__)


def _get_place(place_id):
    """Fetch a place document by its `id` field."""
    return mongo.db.places.find_one(
        {"id": place_id},
        {
            "_id": 0,
            "displayName_text": 1,
            "search_type": 1,
            "rating": 1,
            "avg_price": 1,
            "image_url": 1,
        },
    )


@tours_bp.route("/", methods=["GET"])
@jwt_required()
def get_tours():
    """Return all tours."""
    try:
        tours = TourModel.get_all_tours(mongo)
        return jsonify({"tours": tours}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tours_bp.route("/", methods=["POST"])
@jwt_required()
def create_tour():
    """
    Create a new tour. The backend enriches place references with live data.

    Expected payload:
    {
        "title": "...",
        "description": "...",
        "destination": { "city": "...", "country": "..." },
        "duration_days": 4,
        "accommodation": { "hotel_id": "ChIJ..." },
        "itinerary": [
            {
                "day_number": 1,
                "theme": "...",
                "activities": [
                    { "place_id": "ChIJ...", "time": "09:00", "duration_hours": 2.5, "meal": "lunch" }
                ]
            }
        ],
        "pricing": {
            "accommodation": 196,
            "activities": 136,
            "transportation": 116,
            "misc": 60,
            "total": 508
        }
    }
    """
    try:
        user_id = get_user_id_from_jwt()
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        # --- Validate required top-level fields ---
        required = ["title", "destination", "duration_days", "accommodation", "itinerary", "pricing"]
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"'{field}' is required"}), 400

        destination = data["destination"]
        city_name = destination.get("city", "").strip()
        if not city_name:
            return jsonify({"error": "'destination.city' is required"}), 400

        # --- Generate tour_id ---
        now = datetime.now(timezone.utc)
        tour_id = f"{city_name.lower().replace(' ', '_')}_{now.strftime('%Y%m%d%H%M%S')}"

        # --- Enrich accommodation ---
        hotel_id = data["accommodation"].get("hotel_id", "")
        hotel_doc = _get_place(hotel_id) if hotel_id else None

        if hotel_doc:
            accommodation = {
                "hotel_id": hotel_id,
                "hotel_name": hotel_doc.get("displayName_text", ""),
                "hotel_rating": hotel_doc.get("rating", 0),
                "price_per_night": hotel_doc.get("avg_price", 0),
                "images": hotel_doc.get("image_url", []),
            }
        else:
            accommodation = {
                "hotel_id": hotel_id,
                "hotel_name": "",
                "hotel_rating": 0,
                "price_per_night": 0,
                "images": [],
            }

        # --- Enrich itinerary activities ---
        enriched_itinerary = []
        for day in data.get("itinerary", []):
            enriched_activities = []
            for act in day.get("activities", []):
                place_id = act.get("place_id", "")
                place_doc = _get_place(place_id) if place_id else None

                if place_doc:
                    search_type = place_doc.get("search_type", "attraction")
                    activity_type = "restaurant" if search_type == "restaurant" else "attraction"
                    name = place_doc.get("displayName_text", "")
                    rating = place_doc.get("rating", 0)
                    estimated_cost = place_doc.get("avg_price", 0)
                else:
                    activity_type = act.get("type", "attraction")
                    name = ""
                    rating = 0
                    estimated_cost = 0

                enriched_act = {
                    "time": act.get("time", "09:00"),
                    "duration_hours": float(act.get("duration_hours", 1)),
                    "place_id": place_id,
                    "name": name,
                    "type": activity_type,
                    "rating": rating,
                    "estimated_cost": estimated_cost,
                }

                # Add meal field for restaurant activities
                if activity_type == "restaurant" and act.get("meal"):
                    enriched_act["meal"] = act["meal"]

                enriched_activities.append(enriched_act)

            daily_cost = sum(a.get("estimated_cost", 0) for a in enriched_activities)

            enriched_day = {
                "day_number": day.get("day_number", 1),
                "theme": day.get("theme", ""),
                "activities": enriched_activities,
                "estimated_daily_cost": daily_cost,
            }
            enriched_itinerary.append(enriched_day)

        # --- Pricing ---
        pricing_input = data.get("pricing", {})
        pricing = {
            "accommodation": float(pricing_input.get("accommodation", 0)),
            "activities": float(pricing_input.get("activities", 0)),
            "transportation": float(pricing_input.get("transportation", 0)),
            "misc": float(pricing_input.get("misc", 0)),
            "total": float(pricing_input.get("total", 0)),
        }

        # --- Build final document ---
        tour_doc = {
            "tour_id": tour_id,
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "destination": {
                "city": city_name,
                "country": destination.get("country", ""),
            },
            "duration_days": int(data.get("duration_days", 1)),
            "accommodation": accommodation,
            "itinerary": enriched_itinerary,
            "pricing": pricing,
            "created_by": user_id,
            "created_at": now.isoformat(),
        }

        result = TourModel.create_tour(mongo, tour_doc)
        if result.inserted_id:
            tour_doc.pop("_id", None)
            return jsonify({"message": "Tour created successfully", "tour": tour_doc}), 201

        return jsonify({"error": "Failed to create tour"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tours_bp.route("/<string:tour_id>", methods=["PUT"])
@jwt_required()
def update_tour(tour_id):
    """
    Update an existing tour. Same payload & enrichment logic as POST.
    Preserves tour_id, created_by, created_at.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        existing = TourModel.get_tour_by_id(mongo, tour_id)
        if not existing:
            return jsonify({"error": "Tour not found"}), 404

        destination = data.get("destination", {})
        city_name = destination.get("city", "").strip()
        if not city_name:
            return jsonify({"error": "'destination.city' is required"}), 400

        # --- Enrich accommodation ---
        hotel_id = (data.get("accommodation") or {}).get("hotel_id", "")
        hotel_doc = _get_place(hotel_id) if hotel_id else None

        if hotel_doc:
            accommodation = {
                "hotel_id": hotel_id,
                "hotel_name": hotel_doc.get("displayName_text", ""),
                "hotel_rating": hotel_doc.get("rating", 0),
                "price_per_night": hotel_doc.get("avg_price", 0),
                "images": hotel_doc.get("image_url", []),
            }
        else:
            accommodation = existing.get("accommodation", {
                "hotel_id": hotel_id, "hotel_name": "", "hotel_rating": 0,
                "price_per_night": 0, "images": []
            })

        # --- Enrich itinerary ---
        enriched_itinerary = []
        for day in data.get("itinerary", []):
            enriched_activities = []
            for act in day.get("activities", []):
                place_id = act.get("place_id", "")
                place_doc = _get_place(place_id) if place_id else None

                if place_doc:
                    search_type = place_doc.get("search_type", "attraction")
                    activity_type = "restaurant" if search_type == "restaurant" else "attraction"
                    name = place_doc.get("displayName_text", "")
                    rating = place_doc.get("rating", 0)
                    estimated_cost = place_doc.get("avg_price", 0)
                else:
                    activity_type = act.get("type", "attraction")
                    name = act.get("name", "")
                    rating = act.get("rating", 0)
                    estimated_cost = act.get("estimated_cost", 0)

                enriched_act = {
                    "time": act.get("time", "09:00"),
                    "duration_hours": float(act.get("duration_hours", 1)),
                    "place_id": place_id,
                    "name": name,
                    "type": activity_type,
                    "rating": rating,
                    "estimated_cost": estimated_cost,
                }
                if activity_type == "restaurant" and act.get("meal"):
                    enriched_act["meal"] = act["meal"]
                enriched_activities.append(enriched_act)

            daily_cost = sum(a.get("estimated_cost", 0) for a in enriched_activities)
            enriched_itinerary.append({
                "day_number": day.get("day_number", 1),
                "theme": day.get("theme", ""),
                "activities": enriched_activities,
                "estimated_daily_cost": daily_cost,
            })

        # --- Pricing ---
        pricing_input = data.get("pricing", {})
        pricing = {
            "accommodation": float(pricing_input.get("accommodation", 0)),
            "activities": float(pricing_input.get("activities", 0)),
            "transportation": float(pricing_input.get("transportation", 0)),
            "misc": float(pricing_input.get("misc", 0)),
            "total": float(pricing_input.get("total", 0)),
        }

        update_data = {
            "title": data.get("title", existing.get("title", "")),
            "description": data.get("description", existing.get("description", "")),
            "destination": {
                "city": city_name,
                "country": destination.get("country", ""),
            },
            "duration_days": int(data.get("duration_days", existing.get("duration_days", 1))),
            "accommodation": accommodation,
            "itinerary": enriched_itinerary,
            "pricing": pricing,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        result = TourModel.update_tour(mongo, tour_id, update_data)
        if result.matched_count == 0:
            return jsonify({"error": "Tour not found"}), 404

        updated = TourModel.get_tour_by_id(mongo, tour_id)
        return jsonify({"message": "Tour updated successfully", "tour": updated}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tours_bp.route("/<string:tour_id>", methods=["DELETE"])
@jwt_required()
def delete_tour(tour_id):
    """Delete a tour by tour_id."""
    try:
        result = TourModel.delete_tour(mongo, tour_id)
        if result.deleted_count == 0:
            return jsonify({"error": "Tour not found"}), 404
        return jsonify({"message": "Tour deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tours_bp.route("/<string:tour_id>", methods=["GET"])
@jwt_required()
def get_tour(tour_id):
    """Get a single tour by tour_id."""
    try:
        tour = TourModel.get_tour_by_id(mongo, tour_id)
        if not tour:
            return jsonify({"error": "Tour not found"}), 404
        return jsonify(tour), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
