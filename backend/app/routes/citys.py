from ..extensions import mongo
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..models.citys import citys

citys_bp = Blueprint("citys", __name__)

@citys_bp.route("/", methods=["GET"])
# @jwt_required()
def get_citys():
    citys_list = citys.get_all_citys(mongo)
    return jsonify(citys_list)

@citys_bp.route("/<string:city_id>", methods=["GET"])
@jwt_required()
def get_city(city_id):
    city = citys.get_city_by_id(mongo, city_id)
    if not city:
        return jsonify({"message": "City not found"}), 404
    return jsonify(city)
