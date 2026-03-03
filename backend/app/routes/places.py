from ..extensions import mongo
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from ..models.places import places
import hashlib
import hmac
import time
import uuid
import os

places_bp = Blueprint("places", __name__)

@places_bp.route("/imagekit-auth", methods=["GET"])
@jwt_required()
def imagekit_auth():
    """Generate ImageKit upload authentication signature for client-side uploads."""
    try:
        private_key = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
        if not private_key:
            return jsonify({"error": "ImageKit not configured"}), 500

        token = str(uuid.uuid4())
        expire = int(time.time()) + 600  # valid for 10 minutes
        sig_string = token + str(expire)
        signature = hmac.new(
            private_key.encode("utf-8"),
            sig_string.encode("utf-8"),
            hashlib.sha1
        ).hexdigest()

        return jsonify({
            "token": token,
            "expire": expire,
            "signature": signature,
            "publicKey": os.getenv("IMAGEKIT_PUBLIC_KEY", ""),
            "urlEndpoint": os.getenv("IMAGEKIT_URL_ENDPOINT", ""),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@places_bp.route("/", methods=["GET"])
@jwt_required()
def get_places():
    places_list = places.get_all_places(mongo)
    return jsonify({"place": places_list})

@places_bp.route("/<string:city_id>", methods=["GET"])
@jwt_required()
def get_places_by_city_id(city_id):
    places_list = places.get_all_place_by_city_id(mongo, city_id)
    
    # Categorize places by search_type
    categorized_places = {
        "hotel": [],
        "restaurant": [],
        "attraction": []
    }
    
    for place in places_list:
        search_type = place.get("search_type", "")
        if search_type in categorized_places:
            categorized_places[search_type].append(place)
    
    return jsonify(categorized_places)

@places_bp.route("/place", methods=["POST"])
@jwt_required()
def create_place():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        required = ["displayName_text", "city_id", "search_type"]
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"'{field}' is required"}), 400

        # Check duplicate by id if provided
        place_id = data.get("id", "").strip()
        if place_id and places.place_exists(mongo, place_id):
            return jsonify({"error": f"Place with id '{place_id}' already exists"}), 409

        import uuid
        from datetime import datetime

        new_place = {
            "id": place_id or str(uuid.uuid4()),
            "city": data.get("city", ""),
            "city_id": data.get("city_id", ""),
            "displayName_text": data.get("displayName_text", ""),
            "editorialSummary_text": data.get("editorialSummary_text", ""),
            "location": data.get("location", {"latitude": 0, "longitude": 0}),
            "rating": float(data.get("rating", 0)),
            "userRatingCount": 0,
            "avg_price": float(data.get("avg_price", 0)),
            "search_type": data.get("search_type", "restaurant"),
            "types": data.get("types", []),
            "image_url": data.get("image_url", []),
            "filter_criteria": data.get("filter_criteria", ""),
            "filtered_at": {"$date": datetime.utcnow().isoformat()},
        }

        result = places.create_place(mongo, new_place)
        if result.inserted_id:
            new_place.pop("_id", None)
            return jsonify({"message": "Place created successfully", "place": new_place}), 201
        return jsonify({"error": "Failed to create place"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@places_bp.route("/place/<string:place_id>", methods=["GET"])
@jwt_required()
def get_place_by_id(place_id):
    place = places.get_place_by_id(mongo, place_id)
    return jsonify(place)

@places_bp.route("/place/<string:place_id>", methods=["PUT"])
@jwt_required()
def update_place(place_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        allowed_fields = [
            "displayName_text", "editorialSummary_text",
            "city", "city_id", "location", "rating",
            "avg_price", "search_type", "types", "image_url"
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400

        result = places.update_place(mongo, place_id, update_data)
        if result.matched_count == 0:
            return jsonify({"error": "Place not found"}), 404

        return jsonify({"message": "Place updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@places_bp.route("/place/<string:place_id>", methods=["DELETE"])
@jwt_required()
def delete_place(place_id):
    try:
        result = places.delete_place(mongo, place_id)
        if result.deleted_count == 0:
            return jsonify({"error": "Place not found"}), 404
        return jsonify({"message": "Place deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@places_bp.route("/preferences", methods=["POST"])
@jwt_required()
def set_preferences():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_id = data.get("user_id")
        city_id = data.get("city_id")
        
        if not user_id or not city_id:
            return jsonify({"error": "user_id and city_id are required"}), 400
        
        # Create preferences object from data
        class Preferences:
            def __init__(self, data):
                self.like_hotel = data.get("like_hotel", [])
                self.like_restaurant = data.get("like_restaurant", [])
                self.like_attraction = data.get("like_attraction", [])
                self.like_local_transport = data.get("like_local_transport", [])
                self.dislike_hotel = data.get("dislike_hotel", [])
                self.dislike_restaurant = data.get("dislike_restaurant", [])
                self.dislike_attraction = data.get("dislike_attraction", [])
                self.dislike_local_transport = data.get("dislike_local_transport", [])
        
        preferences = Preferences(data)
        
        # Check if preferences exist
        check_preferences = places.check_preferences(mongo, user_id, city_id)
        
        if check_preferences:
            # Update existing preferences
            result = places.update_preferences(mongo, preferences, user_id, city_id)
            if result.modified_count > 0:
                return jsonify({
                    "message": "Preferences updated successfully",
                    "action": "update",
                    "user_id": user_id,
                    "city_id": city_id
                }), 200
            else:
                return jsonify({
                    "message": "No changes made to preferences",
                    "action": "no_change",
                    "user_id": user_id,
                    "city_id": city_id
                }), 200
        else:
            # Create new preferences
            result = places.set_preferences(mongo, preferences, user_id, city_id)
            if result.inserted_id:
                return jsonify({
                    "message": "Preferences created successfully",
                    "action": "create",
                    "user_id": user_id,
                    "city_id": city_id
                }), 201
            else:
                return jsonify({"error": "Failed to create preferences"}), 500
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@places_bp.route("/preferences/<string:user_id>/<string:city_id>", methods=["GET"])
@jwt_required()
def get_preferences(user_id, city_id):
    """Get user preferences for a specific city"""
    try:
        if not user_id or not city_id:
            return jsonify({"error": "user_id and city_id are required"}), 400
        
        preferences = places.get_preferences(mongo, user_id, city_id)
        
        if preferences:
            return jsonify(preferences), 200
        else:
            # Return empty preferences if not found
            return jsonify({
                "like_hotel": [],
                "like_restaurant": [],
                "like_attraction": [],
                "like_local_transport": [],
                "dislike_hotel": [],
                "dislike_restaurant": [],
                "dislike_attraction": [],
                "dislike_local_transport": [],
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500