from ..extensions import mongo
from flask import Blueprint, jsonify
from ..models.places import places

places_bp = Blueprint("places", __name__)

@places_bp.route("/", methods=["GET"])
def get_places():
    places_list = places.get_all_places(mongo)
    return jsonify(places_list)

@places_bp.route("/<string:city_id>", methods=["GET"])
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
