"""
Payment API Routes
Handles payment creation, status updates, and retrieval
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

from ..extensions import mongo
from ..models.payments import Payments
from ..models.users import Users
from ..models.itinerary_models import TourItinerary
logger = logging.getLogger(__name__)

payments_bp = Blueprint("payments", __name__)


@payments_bp.route("/create", methods=["POST"])
@jwt_required()
def create_payment():
    """
    Create a new payment record

    Request body:
    {
        "tour_id": "itin_xxx",
        "payment_type": "tour_booking",
        "amount": 1217.28,
        "currency": "USD",
        "payment_method": "credit_card",
        "payment_gateway": "stripe",
        "payment_details": {
            "itinerary_summary": {...},
            "flight_cost": 429.28,
            "daily_costs": [...]
        }
    }
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        data = request.get_json() or {}

        # Validate required fields
        tour_id = data.get("tour_id")
        if not tour_id:
            return jsonify({"error": "tour_id is required"}), 400

        amount = data.get("amount")
        if amount is None or float(amount) <= 0:
            return jsonify({"error": "Valid amount is required"}), 400

        # Build payment data
        payment_data = {
            "user_id": user_id,
            "tour_id": tour_id,
            "payment_type": data.get("payment_type", "tour_booking"),
            "amount": float(amount),
            "currency": data.get("currency", "USD"),
            "payment_method": data.get("payment_method", "credit_card"),
            "payment_status": "pending",
            "payment_gateway": data.get("payment_gateway", "manual"),
            "payment_details": data.get("payment_details", {}),
        }

        payment = Payments.create(payment_data, mongo)

        # Remove MongoDB ObjectId for JSON serialization
        payment.pop("_id", None)

        logger.info(f"Payment created: {payment['payment_id']} for user {user_id}")

        return jsonify({
            "message": "Payment created successfully",
            "payment": Payments._serialize(payment),
        }), 201

    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/confirm/<payment_id>", methods=["PUT"])
@jwt_required()
def confirm_payment(payment_id):
    """
    Confirm/complete a payment (simulate payment gateway callback)

    Request body (optional):
    {
        "transaction_id": "txn_xxx",
        "payment_status": "completed"
    }
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity
        data = request.get_json() or {}

        # Verify payment exists and belongs to user
        payment = Payments.find_by_payment_id(mongo, payment_id)
        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        if payment["user_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        new_status = data.get("payment_status", "completed")
        transaction_id = data.get("transaction_id", f"txn_{payment_id}")

        success = Payments.update_status(
            mongo, payment_id, new_status, transaction_id
        )

        if success:
            updated = Payments.find_by_payment_id(mongo, payment_id)
            logger.info(f"Payment {payment_id} confirmed: {new_status}")
            mongo.db.itineraries.update_one(
                {"itinerary_id": payment["tour_id"]},
                {"$set": {"status": "completed", "updated_at": datetime.utcnow()}}
            )
            return jsonify({
                "message": f"Payment {new_status}",
                "payment": updated,
            }), 200
        else:
            return jsonify({"error": "Failed to update payment"}), 500

    except Exception as e:
        logger.error(f"Error confirming payment: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/<payment_id>", methods=["GET"])
@jwt_required()
def get_payment(payment_id):
    """Get a specific payment by payment_id"""
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity

        payment = Payments.find_by_payment_id(mongo, payment_id)
        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # Only allow user to see their own payments (unless admin)
        user_role = identity.get("role", "user") if isinstance(identity, dict) else "user"
        if payment["user_id"] != user_id and user_role != "admin":
            return jsonify({"error": "Unauthorized"}), 403

        return jsonify({"payment": payment}), 200

    except Exception as e:
        logger.error(f"Error getting payment: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/user", methods=["GET"])
@jwt_required()
def get_user_payments():
    """
    Get all payments for the current user

    Query params:
        - limit: number of results (default 50)
        - skip: pagination offset (default 0)
    """
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity

        limit = int(request.args.get("limit", 50))
        skip = int(request.args.get("skip", 0))

        payments = Payments.find_by_user_id(mongo, user_id, limit=limit, skip=skip)
        total = Payments.count_by_user(mongo, user_id)

        return jsonify({
            "count": len(payments),
            "total": total,
            "payments": payments,
        }), 200

    except Exception as e:
        logger.error(f"Error getting user payments: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/tour/<tour_id>", methods=["GET"])
@jwt_required()
def get_tour_payments(tour_id):
    """Get all payments for a specific tour/itinerary"""
    try:
        payments = Payments.find_by_tour_id(mongo, tour_id)
        return jsonify({
            "count": len(payments),
            "payments": payments,
        }), 200

    except Exception as e:
        logger.error(f"Error getting tour payments: {e}")
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_payment_stats():
    """Get payment statistics for current user"""
    try:
        identity = get_jwt_identity()
        user_id = identity["id"] if isinstance(identity, dict) else identity

        total_payments = Payments.count_by_user(mongo, user_id)
        total_spent = Payments.get_total_spent(mongo, user_id)

        return jsonify({
            "total_payments": total_payments,
            "total_spent": round(total_spent, 2),
        }), 200

    except Exception as e:
        logger.error(f"Error getting payment stats: {e}")
        return jsonify({"error": str(e)}), 500


# ========== Admin routes ==========


@payments_bp.route("/admin/all", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")
def get_all_payments():
    """Get all payments (admin only)"""
    try:
        limit = int(request.args.get("limit", 100))
        skip = int(request.args.get("skip", 0))
        status = request.args.get("status")

        payments = Payments.get_all_payments(
            mongo, limit=limit, skip=skip, status=status
        )

        return jsonify({
            "count": len(payments),
            "payments": payments,
        }), 200

    except Exception as e:
        logger.error(f"Error getting all payments: {e}")
        return jsonify({"error": str(e)}), 500
