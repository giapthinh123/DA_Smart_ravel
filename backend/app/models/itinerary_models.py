"""
Data models for the Smart Travel Itinerary System
Defines structure for places, tours, and user preferences
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Place:
    """Place/Location model"""
    place_id: str
    name: str
    city: str
    types: List[str]
    rating: float
    latitude: float
    longitude: float
    price_level: int = 0
    avg_price: float = 0.0
    user_rating_count: int = 0
    opening_hours: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Place':
        """Create Place from dictionary (MongoDB format)"""
        location = data.get("location", {})
        
        # Handle displayName which can be dict or string
        display_name = data.get("displayName_text", {})
        if isinstance(display_name, dict):
            name = display_name.get("text", "")
        else:
            name = str(display_name) if display_name else ""
        
        if not name:
            name = data.get("name", "Unknown Place")
        
        # Handle priceLevel as string or int
        price_level_raw = data.get("priceLevel", 0)
        if isinstance(price_level_raw, str):
            price_map = {
                "PRICE_LEVEL_FREE": 0,
                "PRICE_LEVEL_INEXPENSIVE": 1,
                "PRICE_LEVEL_MODERATE": 2,
                "PRICE_LEVEL_EXPENSIVE": 3,
                "PRICE_LEVEL_VERY_EXPENSIVE": 4
            }
            price_level = price_map.get(price_level_raw, 2)
        else:
            price_level = int(price_level_raw) if price_level_raw else 0
        
        return cls(
            place_id=data.get("id", ""),
            name=name,
            city=data.get("city", ""),
            types=data.get("types", []),
            rating=float(data.get("rating", 0.0)),
            latitude=float(location.get("latitude", 0.0)),
            longitude=float(location.get("longitude", 0.0)),
            price_level=price_level,
            avg_price=float(data.get("avg_price", 0.0)),
            user_rating_count=int(data.get("userRatingCount", 0)),
            opening_hours=data.get("regularOpeningHours", {})
        )
    
    def get_category(self) -> str:
        """Determine the main category of this place"""
        restaurant_types = ['restaurant', 'cafe', 'bakery', 'food']
        hotel_types = ['lodging', 'hotel', 'hostel']
        
        for t in self.types:
            if t in restaurant_types:
                return "restaurant"
            if t in hotel_types:
                return "hotel"
        return "activity"


@dataclass
class UserPreference:
    """User preference model for itinerary generation"""
    user_id: str
    selected_places: List[str] = field(default_factory=list)
    disliked_places: List[str] = field(default_factory=list)
    destination_city: str = ""
    trip_duration_days: int = 1
    budget_range: str = "medium"
    interests: List[str] = field(default_factory=list)
    travel_party: str = "solo"
    accommodation_type: str = "hotel"
    dietary_restrictions: List[str] = field(default_factory=list)
    accessibility_needs: List[str] = field(default_factory=list)
    _selected_place_objects: Optional[List['Place']] = field(default=None, repr=False)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserPreference':
        """Create UserPreference from API request"""
        return cls(
            user_id=data.get("user_id", ""),
            selected_places=data.get("selected_places", []),
            disliked_places=data.get("disliked_places", []),
            destination_city=data.get("destination_city", ""),
            trip_duration_days=data.get("trip_duration_days", 1),
            budget_range=data.get("budget_range", "medium"),
            interests=data.get("interests", []),
            travel_party=data.get("travel_party", "solo"),
            accommodation_type=data.get("accommodation_type", "hotel"),
            dietary_restrictions=data.get("dietary_restrictions", []),
            accessibility_needs=data.get("accessibility_needs", [])
        )
    
    @classmethod
    def from_mongo(cls, data: Dict[str, Any], trip_duration_days: int = 1,
                   budget_range: str = "medium", travel_party: str = "solo") -> 'UserPreference':
        """Create from MongoDB user_preferences collection"""
        # Combine liked places from all categories
        selected_places = (
            data.get("liked_restaurants", []) +
            data.get("liked_hotels", []) +
            data.get("liked_activities", [])
        )
        
        disliked_places = (
            data.get("disliked_restaurants", []) +
            data.get("disliked_hotels", []) +
            data.get("disliked_activities", [])
        )
        
        return cls(
            user_id=data.get("user_id", ""),
            selected_places=selected_places,
            disliked_places=disliked_places,
            destination_city=data.get("city_name", ""),
            trip_duration_days=trip_duration_days,
            budget_range=budget_range,
            travel_party=travel_party
        )
    
    def set_selected_places_data(self, places: List['Place']) -> None:
        """Cache loaded Place objects for alpha calculation"""
        self._selected_place_objects = places
    
    def calculate_alpha(self, total_available_places: int = 30) -> float:
        """
        Calculate alpha for content vs collaborative weighting.
        Alpha ∈ [0.3, 0.9]
        """
        num_selected = len(self.selected_places)
        
        if num_selected == 0:
            return 0.9
        
        selection_rate = num_selected / total_available_places
        places_per_day = num_selected / max(1, self.trip_duration_days)
        
        if selection_rate < 0.5:
            alpha = 0.3 + 0.3 * (selection_rate / 0.5)
        else:
            alpha = 0.6 + 0.3 * ((selection_rate - 0.5) / 0.5)
            if places_per_day >= 5:
                alpha = min(0.9, alpha + 0.05)
        
        return round(max(0.3, min(0.9, alpha)), 2)


@dataclass
class ScheduledPlace:
    """Place with scheduling information"""
    place: Place
    start_time: str
    duration_hours: float
    time_block: str
    transport_to_next: Optional[str] = None
    distance_to_next_km: Optional[float] = None
    travel_time_hours: Optional[float] = None
    score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary"""
        result = {
            "place_id": self.place.place_id,
            "name": self.place.name,
            "start_time": self.start_time,
            "duration_hours": round(self.duration_hours, 2),
            "time_block": self.time_block,
            "types": self.place.types,
            "rating": self.place.rating,
            "score": round(self.score, 3)
        }
        
        if self.transport_to_next:
            result["transport_to_next"] = self.transport_to_next
            result["distance_to_next_km"] = round(self.distance_to_next_km, 2)
            result["travel_time_hours"] = round(self.travel_time_hours, 2)
        
        return result

tạo 
@dataclass
class DayItinerary:
    """Itinerary for a single day"""
    day_number: int
    date: str
    places: List[ScheduledPlace] = field(default_factory=list)
    total_distance_km: float = 0.0
    estimated_cost: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary"""
        return {
            "day_number": self.day_number,
            "date": self.date,
            "places": [p.to_dict() for p in self.places],
            "total_distance_km": round(self.total_distance_km, 2),
            "estimated_cost": round(self.estimated_cost, 2)
        }


@dataclass
class TourItinerary:
    """Complete tour itinerary"""
    tour_id: str
    destination: str
    duration_days: int
    user_preference: UserPreference
    itinerary: List[DayItinerary] = field(default_factory=list)
    total_cost: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary"""
        return {
            "tour_id": self.tour_id,
            "destination": self.destination,
            "duration_days": self.duration_days,
            "user_preferences": {
                "destination_city": self.user_preference.destination_city,
                "trip_duration_days": self.user_preference.trip_duration_days,
                "budget_range": self.user_preference.budget_range,
                "interests": self.user_preference.interests,
                "travel_party": self.user_preference.travel_party
            },
            "itinerary": [day.to_dict() for day in self.itinerary],
            "total_cost_usd": round(self.total_cost, 2),
            "created_at": self.created_at.isoformat()
        }
    
    def get_total_places(self) -> int:
        """Count total places in tour"""
        return sum(len(day.places) for day in self.itinerary)
