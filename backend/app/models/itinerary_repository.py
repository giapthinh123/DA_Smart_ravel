"""
Itinerary Repository - Database operations for itinerary system
Uses Flask-PyMongo extension for database connection
"""

from typing import List, Dict, Any, Optional
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class ItineraryRepository:
    """Repository for itinerary-related database operations"""
    
    def __init__(self, mongo):
        """
        Initialize with Flask-PyMongo instance
        
        Args:
            mongo: Flask-PyMongo instance from extensions
        """
        self.mongo = mongo
    
    # ========== PLACES ==========
    
    def get_places_by_city(self, city_name: str, limit: int = None) -> List[Dict]:
        """Get all places in a city"""
        cursor = self.mongo.db.places.find({"city": city_name})
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    
    def get_places_by_city_id(self, city_id: str, limit: int = None) -> List[Dict]:
        """Get places by city_id from places collection"""
        cursor = self.mongo.db.places.find({"city_id": city_id})
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    
    def get_place_by_id(self, place_id: str) -> Optional[Dict]:
        """Get a single place by ID"""
        return self.mongo.db.places.find_one({"id": place_id})
    
    def get_places_by_ids(self, place_ids: List[str]) -> List[Dict]:
        """Get multiple places by their IDs"""
        return list(self.mongo.db.places.find({"id": {"$in": place_ids}}))
    
    def get_places_by_type(self, city_name: str, place_type: str) -> List[Dict]:
        """Get places by type (hotel, restaurant, etc.)"""
        return list(self.mongo.db.places.find({
            "city": city_name,
            "types": {"$in": [place_type]}
        }))
    
    def count_places_in_city(self, city_name: str) -> int:
        """Count places in a city"""
        return self.mongo.db.places.count_documents({"city": city_name})
    
    # ========== TOURS ==========
    
    def get_tour_by_id(self, tour_id: str) -> Optional[Dict]:
        """Get a tour by its ID"""
        return self.mongo.db.tours.find_one({"tour_id": tour_id})
    
    def get_tours_by_user(self, user_id: str) -> List[Dict]:
        """Get all tours for a user"""
        try:
            user_oid = ObjectId(user_id)
            return list(self.mongo.db.tours.find({"participants": user_oid}))
        except Exception:
            return []
    
    def get_tours_by_destination(self, destination: str) -> List[Dict]:
        """Get all tours for a destination city"""
        return list(self.mongo.db.tours.find({"destination": destination}))
    
    def save_tour(self, tour_data: Dict) -> str:
        """Save a new tour and return its ID"""
        result = self.mongo.db.tours.insert_one(tour_data)
        return str(result.inserted_id)
    
    def update_tour(self, tour_id: str, update_data: Dict) -> bool:
        """Update an existing tour"""
        result = self.mongo.db.tours.update_one(
            {"tour_id": tour_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    def delete_tour(self, tour_id: str) -> bool:
        """Delete a tour"""
        result = self.mongo.db.tours.delete_one({"tour_id": tour_id})
        return result.deleted_count > 0
    
    # ========== USER PREFERENCES ==========
    
    def get_user_preferences(self, user_id: str, city_id: str = None) -> Optional[Dict]:
        """Get user preferences, optionally filtered by city"""
        query = {"user_id": user_id}
        if city_id:
            query["city_id"] = city_id
        return self.mongo.db.user_preferences.find_one(query)
    
    def save_user_preferences(self, user_id: str, city_id: str, preferences: Dict) -> str:
        """Save user preferences"""
        doc = {
            "user_id": user_id,
            "city_id": city_id,
            **preferences
        }
        result = self.mongo.db.user_preferences.insert_one(doc)
        return str(result.inserted_id)
    
    def update_user_preferences(self, user_id: str, city_id: str, preferences: Dict) -> bool:
        """Update user preferences"""
        result = self.mongo.db.user_preferences.update_one(
            {"user_id": user_id, "city_id": city_id},
            {"$set": preferences}
        )
        return result.modified_count > 0
    
    def get_liked_places(self, user_id: str, city_id: str) -> Dict[str, List[str]]:
        """Get user's liked places by category"""
        pref = self.get_user_preferences(user_id, city_id)
        if not pref:
            return {"hotels": [], "restaurants": [], "attractions": []}
        
        return {
            "hotels": pref.get("like_hotel", []),
            "restaurants": pref.get("like_restaurant", []),
            "attractions": pref.get("like_attraction", [])
        }
    
    def get_all_liked_place_ids(self, user_id: str, city_id: str) -> List[str]:
        """Get all liked place IDs as a flat list"""
        liked = self.get_liked_places(user_id, city_id)
        return liked["hotels"] + liked["restaurants"] + liked["attractions"]
    
    # ========== CITIES ==========
    
    def get_city_by_name(self, city_name: str) -> Optional[Dict]:
        """Get city info by name"""
        return self.mongo.db.worldcities.find_one({"city": city_name})
    
    def get_city_by_id(self, city_id: str) -> Optional[Dict]:
        """Get city info by ID"""
        return self.mongo.db.worldcities.find_one({"id": city_id})
    
    def city_has_places(self, city_name: str) -> bool:
        """Check if city has places in database"""
        count = self.mongo.db.places.count_documents({"city": city_name}, limit=1)
        return count > 0
