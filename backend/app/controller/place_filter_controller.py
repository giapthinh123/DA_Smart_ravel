"""
Place Filter Controller
Filter places by type, opening hours, and criteria
"""

from typing import List, Optional
from datetime import time
import logging

from ..models.itinerary_models import Place
from ..config import ConfigRecommender

logger = logging.getLogger(__name__)


class PlaceFilterController:
    """Filter places based on various criteria"""
    
    @staticmethod
    def is_restaurant(place: Place) -> bool:
        """Check if place is a restaurant"""
        return any(t in ConfigRecommender.RESTAURANT_TYPES for t in place.types)
    
    @staticmethod
    def is_cafe(place: Place) -> bool:
        """Check if place is a cafe"""
        return any(t in ConfigRecommender.CAFE_TYPES for t in place.types)
    
    @staticmethod
    def is_hotel(place: Place) -> bool:
        """Check if place is a hotel"""
        return any(t in ConfigRecommender.HOTEL_TYPES for t in place.types)
    
    @staticmethod
    def is_activity(place: Place) -> bool:
        """Check if place is an activity/attraction"""
        if PlaceFilterController.is_restaurant(place):
            return False
        if PlaceFilterController.is_hotel(place):
            return False
        return any(t in ConfigRecommender.ACTIVITY_TYPES for t in place.types)
    
    @staticmethod
    def filter_by_category(places: List[Place], category: str) -> List[Place]:
        """Filter places by category"""
        if category == "restaurant":
            return [p for p in places if PlaceFilterController.is_restaurant(p)]
        elif category == "cafe":
            return [p for p in places if PlaceFilterController.is_cafe(p)]
        elif category == "hotel":
            return [p for p in places if PlaceFilterController.is_hotel(p)]
        elif category == "activity":
            return [p for p in places if PlaceFilterController.is_activity(p)]
        return places
    
    @staticmethod
    def filter_by_rating(places: List[Place], min_rating: float = 3.0) -> List[Place]:
        """Filter places by minimum rating"""
        return [p for p in places if p.rating >= min_rating]
    
    @staticmethod
    def filter_by_budget(places: List[Place], budget: str) -> List[Place]:
        """Filter places by budget range"""
        budget_map = {
            "low": [0, 1],
            "medium": [1, 2, 3],
            "high": [2, 3, 4]
        }
        allowed = budget_map.get(budget, [0, 1, 2, 3, 4])
        
        return [
            p for p in places
            if p.price_level == 0 or p.price_level in allowed
        ]
    
    @staticmethod
    def categorize_places(places: List[Place]) -> dict:
        """Categorize places into restaurants, hotels, activities"""
        return {
            "restaurants": [p for p in places if PlaceFilterController.is_restaurant(p)],
            "hotels": [p for p in places if PlaceFilterController.is_hotel(p)],
            "activities": [p for p in places if PlaceFilterController.is_activity(p)]
        }
    
    @staticmethod
    def get_balanced_recommendations(
        places: List[Place],
        scores: dict,
        k: int = 50
    ) -> List[Place]:
        """Get balanced recommendations across categories"""
        categorized = PlaceFilterController.categorize_places(places)
        
        # Sort each category by score
        for cat in categorized:
            categorized[cat].sort(
                key=lambda p: scores.get(p.place_id, 0),
                reverse=True
            )
        
        # Balance: 60% activities, 30% restaurants, 10% hotels
        k_activities = min(len(categorized["activities"]), int(k * 0.6))
        k_restaurants = min(len(categorized["restaurants"]), int(k * 0.3))
        k_hotels = min(len(categorized["hotels"]), k - k_activities - k_restaurants)
        
        result = (
            categorized["activities"][:k_activities] +
            categorized["restaurants"][:k_restaurants] +
            categorized["hotels"][:k_hotels]
        )
        
        # Sort final list by score
        result.sort(key=lambda p: scores.get(p.place_id, 0), reverse=True)
        
        return result
