"""
Payment model for the Smart Travel Payment System
Based on the payments collection schema
"""

import uuid
from datetime import datetime


class Payments:
    """Static class for payment database operations"""

    @staticmethod
    def create(data, mongo):
        """
        Create a new payment record

        Required fields:
            - user_id (str): Reference to users collection
            - tour_id (str): Reference to tours/itineraries collection
            - payment_type (str): e.g. 'tour_booking', 'flight', 'hotel'
            - amount (float): Payment amount
            - currency (str): e.g. 'USD', 'VND'
            - payment_method (str): e.g. 'credit_card', 'bank_transfer', 'momo'
            - payment_status (str): e.g. 'pending', 'completed', 'failed', 'refunded'
            - payment_gateway (str): e.g. 'stripe', 'vnpay', 'momo', 'manual'
        """
        now = datetime.utcnow()

        payment = {
            "payment_id": f"pay_{uuid.uuid4().hex[:16]}",
            "user_id": data["user_id"],
            "tour_id": data["tour_id"],
            "payment_type": data.get("payment_type", "tour_booking"),
            "amount": float(data["amount"]),
            "currency": data.get("currency", "USD"),
            "payment_method": data.get("payment_method", "credit_card"),
            "payment_status": data.get("payment_status", "pending"),
            "transaction_id": data.get("transaction_id", ""),
            "payment_gateway": data.get("payment_gateway", "manual"),
            "payment_time": data.get("payment_time"),
            "created_at": now,
            "updated_at": now,
            # Extended fields for tour payment details
            "payment_details": data.get("payment_details", {}),
        }

        result = mongo.db.payments.insert_one(payment)
        payment["_id"] = str(result.inserted_id)
        return payment

    @staticmethod
    def find_by_payment_id(mongo, payment_id):
        """Find payment by payment_id"""
        payment = mongo.db.payments.find_one(
            {"payment_id": payment_id}, {"_id": 0}
        )
        return Payments._serialize(payment) if payment else None

    @staticmethod
    def find_by_user_id(mongo, user_id, limit=50, skip=0):
        """Find all payments for a user"""
        payments = list(
            mongo.db.payments.find({"user_id": user_id}, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return [Payments._serialize(p) for p in payments]

    @staticmethod
    def find_by_tour_id(mongo, tour_id):
        """Find all payments for a specific tour/itinerary"""
        payments = list(
            mongo.db.payments.find({"tour_id": tour_id}, {"_id": 0}).sort(
                "created_at", -1
            )
        )
        return [Payments._serialize(p) for p in payments]

    @staticmethod
    def update_status(mongo, payment_id, new_status, transaction_id=None):
        """Update payment status and optionally transaction_id"""
        update_data = {
            "payment_status": new_status,
            "updated_at": datetime.utcnow(),
        }
        if transaction_id:
            update_data["transaction_id"] = transaction_id
        if new_status == "completed":
            update_data["payment_time"] = datetime.utcnow()

        result = mongo.db.payments.update_one(
            {"payment_id": payment_id}, {"$set": update_data}
        )
        return result.modified_count > 0

    @staticmethod
    def count_by_user(mongo, user_id):
        """Count total payments for a user"""
        return mongo.db.payments.count_documents({"user_id": user_id})

    @staticmethod
    def get_total_spent(mongo, user_id):
        """Calculate total amount spent by user (completed payments only)"""
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "payment_status": "completed",
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = list(mongo.db.payments.aggregate(pipeline))
        return result[0]["total"] if result else 0.0

    @staticmethod
    def delete_by_payment_id(mongo, payment_id):
        """Delete a payment record"""
        result = mongo.db.payments.delete_one({"payment_id": payment_id})
        return result.deleted_count > 0

    @staticmethod
    def get_all_payments(mongo, limit=100, skip=0, status=None):
        """Get all payments (admin). Optionally filter by status."""
        query = {}
        if status:
            query["payment_status"] = status

        payments = list(
            mongo.db.payments.find(query, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return [Payments._serialize(p) for p in payments]

    @staticmethod
    def _serialize(payment):
        """Serialize datetime fields to ISO format strings"""
        if not payment:
            return None
        serialized = dict(payment)
        for key in ["created_at", "updated_at", "payment_time"]:
            if key in serialized and isinstance(serialized[key], datetime):
                serialized[key] = serialized[key].isoformat()
        return serialized

    @staticmethod
    def aggregate_by_date_range(mongo, pipeline):
        """Run an arbitrary aggregation pipeline on the payments collection."""
        return list(mongo.db.payments.aggregate(pipeline))

    @staticmethod
    def aggregate_revenue_by_status(mongo, start_date, end_date):
        """Aggregate revenue grouped by payment_status for a date range."""
        pipeline = [
            {
                "$match": {
                    "payment_status": "completed",
                    "created_at": {"$gte": start_date, "$lt": end_date},
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$amount"},
                    "count": {"$sum": 1},
                }
            },
        ]
        return list(mongo.db.payments.aggregate(pipeline))

