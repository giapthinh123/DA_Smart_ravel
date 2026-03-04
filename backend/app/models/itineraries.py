"""
Itineraries model – static helper methods for the `itineraries` collection.
Used by admin, route, and report code that queries itineraries directly.
"""

from datetime import datetime


class Itineraries:
    """Static class for itineraries collection operations"""

    @staticmethod
    def count_by_date_range(mongo, start_date, end_date):
        """Count itineraries created within a date range (datetime objects)."""
        return mongo.db.itineraries.count_documents({
            "created_at": {"$gte": start_date, "$lt": end_date}
        })

    @staticmethod
    def count_by_query(mongo, query):
        """Count itineraries matching an arbitrary query."""
        return mongo.db.itineraries.count_documents(query)

    @staticmethod
    def find_with_query(mongo, query, sort_field="created_at", sort_order=-1, skip=0, limit=100):
        """Find itineraries with query, sort, skip, and limit."""
        return list(
            mongo.db.itineraries.find(query)
            .sort(sort_field, sort_order)
            .skip(skip)
            .limit(limit)
        )

    @staticmethod
    def update_by_id(mongo, itinerary_id, update_data):
        """Update an itinerary document by itinerary_id."""
        return mongo.db.itineraries.update_one(
            {"itinerary_id": itinerary_id},
            {"$set": update_data},
        )

    @staticmethod
    def update_status(mongo, itinerary_id, status):
        """Update itinerary status and updated_at timestamp."""
        return mongo.db.itineraries.update_one(
            {"itinerary_id": itinerary_id},
            {"$set": {"status": status, "updated_at": datetime.now()}},
        )
