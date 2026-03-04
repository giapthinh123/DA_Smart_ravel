"""
TourBookings model for unified tour history tracking.
Links users to both itinerary-created tours and pre-made tours.
"""

import uuid
from datetime import datetime


VALID_STATUSES = ("planning", "created", "saved", "paid")
VALID_TOUR_TYPES = ("itinerary", "premade_tour")


class TourBookings:
    """Static class for tour_bookings collection operations"""

    @staticmethod
    def create(data, mongo):
        now = datetime.utcnow()

        booking = {
            "booking_id": f"booking_{uuid.uuid4().hex[:16]}",
            "user_id": data["user_id"],
            "tour_type": data["tour_type"],
            "tour_ref_id": data["tour_ref_id"],
            "booking_status": data.get("booking_status", "planning"),
            "payment_id": data.get("payment_id"),
            "tour_name": data.get("tour_name", ""),
            "destination": data.get("destination", ""),
            "total_cost": float(data.get("total_cost", 0)),
            "duration_days": int(data.get("duration_days", 1)),
            "guest_count": int(data.get("guest_count", 1)),
            "start_date": data.get("start_date", ""),
            "image": data.get("image"),
            "created_at": now,
            "updated_at": now,
        }

        result = mongo.db.tour_bookings.insert_one(booking)
        booking["_id"] = str(result.inserted_id)
        return booking

    @staticmethod
    def find_by_booking_id(mongo, booking_id):
        booking = mongo.db.tour_bookings.find_one(
            {"booking_id": booking_id}, {"_id": 0}
        )
        return TourBookings._serialize(booking) if booking else None

    @staticmethod
    def find_by_user_id(mongo, user_id, status=None, limit=100, skip=0):
        query = {"user_id": user_id}
        if status:
            query["booking_status"] = status

        bookings = list(
            mongo.db.tour_bookings.find(query, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return [TourBookings._serialize(b) for b in bookings]

    @staticmethod
    def find_by_tour_ref(mongo, tour_ref_id, user_id=None):
        query = {"tour_ref_id": tour_ref_id}
        if user_id:
            query["user_id"] = user_id
        booking = mongo.db.tour_bookings.find_one(query, {"_id": 0})
        return TourBookings._serialize(booking) if booking else None

    @staticmethod
    def count_by_user(mongo, user_id, status=None):
        query = {"user_id": user_id}
        if status:
            query["booking_status"] = status
        return mongo.db.tour_bookings.count_documents(query)

    @staticmethod
    def update_status(mongo, booking_id, new_status, payment_id=None):
        update_data = {
            "booking_status": new_status,
            "updated_at": datetime.utcnow(),
        }
        if payment_id:
            update_data["payment_id"] = payment_id

        result = mongo.db.tour_bookings.update_one(
            {"booking_id": booking_id}, {"$set": update_data}
        )
        return result.modified_count > 0

    @staticmethod
    def update_status_by_tour_ref(mongo, tour_ref_id, new_status, payment_id=None):
        update_data = {
            "booking_status": new_status,
            "updated_at": datetime.utcnow(),
        }
        if payment_id:
            update_data["payment_id"] = payment_id

        result = mongo.db.tour_bookings.update_one(
            {"tour_ref_id": tour_ref_id}, {"$set": update_data}
        )
        return result.modified_count > 0

    @staticmethod
    def update_info(mongo, booking_id, update_fields):
        """Update denormalized info (name, cost, etc.) on a booking."""
        update_fields["updated_at"] = datetime.utcnow()
        result = mongo.db.tour_bookings.update_one(
            {"booking_id": booking_id}, {"$set": update_fields}
        )
        return result.modified_count > 0

    @staticmethod
    def find_bookings_paginated(mongo, query, skip=0, limit=100):
        """Find bookings matching query with sort/skip/limit, excluding _id."""
        bookings = list(
            mongo.db.tour_bookings.find(query, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return bookings

    @staticmethod
    def count_bookings(mongo, query):
        """Count tour_bookings documents matching the given query."""
        return mongo.db.tour_bookings.count_documents(query)

    @staticmethod
    def delete(mongo, booking_id):
        result = mongo.db.tour_bookings.delete_one({"booking_id": booking_id})
        return result.deleted_count > 0

    @staticmethod
    def _serialize(booking):
        if not booking:
            return None
        serialized = dict(booking)
        for key in ("created_at", "updated_at"):
            if key in serialized and isinstance(serialized[key], datetime):
                serialized[key] = serialized[key].isoformat()
        return serialized
