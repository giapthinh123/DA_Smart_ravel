from flask import Blueprint, request, jsonify
from ..models.flight import information_flight

flight_bp = Blueprint("flight", __name__)

@flight_bp.route("/", methods=["POST"])
def flight_search():
    """
    Search for flights
    Expected JSON body:
    {
        "departure_city": "Hanoi",
        "arrival_city": "Ho Chi Minh City", 
        "departure_date": "2026-01-15"
    }
    """
    try:
        # Lấy data từ request body
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Missing request body",
                "data": None
            }), 400
        
        departure_city = data.get("departure_city")
        arrival_city = data.get("arrival_city")
        departure_date = data.get("departure_date")
        
        # Validate required fields
        if not departure_city or not arrival_city or not departure_date:
            return jsonify({
                "success": False,
                "error": "Missing required fields: departure_city, arrival_city, departure_date",
                "data": None
            }), 400
        
        # Gọi function để lấy thông tin chuyến bay
        flight_data = information_flight(departure_city, arrival_city, departure_date)
        
        return jsonify({
            "success": True,
            "data": flight_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "data": None
        }), 500