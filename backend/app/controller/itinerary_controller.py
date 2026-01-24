"""
Itinerary Controller
Day-by-day itinerary generation with status tracking
"""

from typing import List, Dict, Optional
from datetime import date, datetime, timedelta
import uuid
import logging

from ..models.itinerary_models import Place, ScheduledPlace, DayItinerary
from ..models.itinerary_repository import ItineraryRepository
from .tfidf_recommender import TfidfRecommender
from .place_filter_controller import PlaceFilterController
from .routing_controller import RoutingController
from .transport_controller import TransportController

logger = logging.getLogger(__name__)

# Block time configurations
BLOCK_CONFIG = {
    "breakfast": {"time_range": "08:00-09:00", "duration": 1.0, "type": "restaurant"},
    "morning_activity": {"time_range": "09:30-12:00", "duration": 2.5, "type": "attraction"},
    "lunch": {"time_range": "12:30-13:30", "duration": 1.0, "type": "restaurant"},
    "afternoon_activity": {"time_range": "14:00-17:00", "duration": 3.0, "type": "attraction"},
    "dinner": {"time_range": "18:00-19:30", "duration": 1.5, "type": "restaurant"},
    "hotel": {"time_range": "21:00-08:00", "duration": 9.0, "type": "hotel"}
}


class ItineraryController:
    """Controller for day-by-day itinerary generation"""
    
    def __init__(self, mongo):
        self.mongo = mongo
        self.repository = ItineraryRepository(mongo)
        self.recommender = TfidfRecommender()
        self._places_cache = {}
        self._scores_cache = {}
    
    def create_itinerary(
        self,
        user_id: str,
        city_id: str,
        trip_duration_days: int,
        start_date: str,
        guest_count: int = 2,
        budget: float = 1000.0
    ) -> Dict:
        """Create a new empty itinerary with pending status"""
        now = datetime.utcnow()
        itinerary_id = f"itin_{user_id}_{city_id}_{int(now.timestamp())}"
        
        doc = {
            "itinerary_id": itinerary_id,
            "user_id": user_id,
            "city_id": city_id,
            "trip_duration_days": trip_duration_days,
            "start_date": start_date,
            "guest_count": guest_count,
            "budget": budget,
            "status": "pending",
            "daily_itinerary": [],
            "summary": None,
            "generated_by": "tfidf_planner",
            "generated_at": now.isoformat(),
            "created_at": now,
            "updated_at": now
        }
        
        self.mongo.db.itineraries.insert_one(doc)
        logger.info(f"Created itinerary: {itinerary_id}")
        
        return {
            "itinerary_id": itinerary_id,
            "user_id": user_id,
            "city_id": city_id,
            "trip_duration_days": trip_duration_days,
            "start_date": start_date,
            "status": "pending",
            "message": f"Itinerary created. Generate days 1-{trip_duration_days}"
        }
    
    def generate_day(self, itinerary_id: str, day_number: int) -> Dict:
        """Generate a single day and add to the itinerary"""
        logger.info(f"Generating day {day_number} for itinerary {itinerary_id}")
        
        # Get itinerary
        itinerary = self.mongo.db.itineraries.find_one({"itinerary_id": itinerary_id})
        if not itinerary:
            raise ValueError(f"Itinerary {itinerary_id} not found")
        
        city_id = itinerary["city_id"]
        user_id = itinerary["user_id"]
        start_date = itinerary["start_date"]
        trip_duration_days = itinerary["trip_duration_days"]
        
        # Check if day already exists
        existing_days = [d["day_number"] for d in itinerary.get("daily_itinerary", [])]
        if day_number in existing_days:
            raise ValueError(f"Day {day_number} already exists")
        
        if day_number > trip_duration_days:
            raise ValueError(f"Day {day_number} exceeds duration of {trip_duration_days}")
        
        # Load places (cached)
        if city_id not in self._places_cache:
            places_data = self.repository.get_places_by_city_id(city_id)
            if not places_data:
                raise ValueError(f"No places found for city {city_id}")
            
            places = [Place.from_dict(p) for p in places_data]
            self._places_cache[city_id] = places
            
            # Get liked places and calculate scores
            liked_ids = self.repository.get_all_liked_place_ids(user_id, city_id)
            liked_places = [p for p in places if p.place_id in liked_ids]
            
            self.recommender.fit(places)
            self._scores_cache[city_id] = self.recommender.calculate_scores(places, liked_places)
        
        places = self._places_cache[city_id]
        scores = self._scores_cache[city_id]
        
        # Get used IDs from existing days
        used_ids = set()
        for day in itinerary.get("daily_itinerary", []):
            for block in day.get("blocks", []):
                place = block.get("place", {})
                if place.get("id"):
                    used_ids.add(place["id"])
        
        # Calculate day date
        base_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        day_date = base_date + timedelta(days=day_number - 1)
        
        # Build day
        day_data = self._build_day(
            day_number=day_number,
            day_date=day_date,
            places=places,
            scores=scores,
            used_ids=used_ids
        )
        
        # Add to database atomically - only if day doesn't already exist
        result = self.mongo.db.itineraries.update_one(
            {
                "itinerary_id": itinerary_id,
                "daily_itinerary.day_number": {"$ne": day_number}  # Only update if day doesn't exist
            },
            {
                "$push": {"daily_itinerary": day_data},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # If no document was modified, the day already exists
        if result.modified_count == 0:
            # Re-fetch to get the existing day
            itinerary = self.mongo.db.itineraries.find_one({"itinerary_id": itinerary_id})
            existing_day = next((d for d in itinerary.get("daily_itinerary", []) if d.get("day_number") == day_number), None)
            if existing_day:
                logger.info(f"Day {day_number} already exists, returning existing data")
                current_days = len(itinerary.get("daily_itinerary", []))
                is_complete = current_days >= trip_duration_days
                return {
                    "itinerary_id": itinerary_id,
                    "day_number": day_number,
                    "day": existing_day,
                    "status": "complete" if is_complete else "pending",
                    "days_generated": current_days,
                    "days_remaining": trip_duration_days - current_days
                }
        
        # Check if complete
        current_days = len(itinerary.get("daily_itinerary", [])) + 1
        is_complete = current_days >= trip_duration_days
        
        if is_complete:
            self._finalize_itinerary(itinerary_id, itinerary, day_data)
        
        return {
            "itinerary_id": itinerary_id,
            "day_number": day_number,
            "day": day_data,
            "status": "complete" if is_complete else "pending",
            "days_generated": current_days,
            "days_remaining": trip_duration_days - current_days
        }
    
    def _build_day(
        self,
        day_number: int,
        day_date: date,
        places: List[Place],
        scores: Dict[str, float],
        used_ids: set
    ) -> Dict:
        """Build a single day's blocks"""
        blocks = []
        day_used_ids = set(used_ids)
        day_cost = 0.0
        
        # Categorize and sort places
        restaurants = sorted(
            [p for p in places if p.get_category() == "restaurant" and p.place_id not in day_used_ids],
            key=lambda p: scores.get(p.place_id, 0),
            reverse=True
        )
        hotels = sorted(
            [p for p in places if p.get_category() == "hotel" and p.place_id not in day_used_ids],
            key=lambda p: scores.get(p.place_id, 0),
            reverse=True
        )
        attractions = sorted(
            [p for p in places if p.get_category() == "activity" and p.place_id not in day_used_ids],
            key=lambda p: scores.get(p.place_id, 0),
            reverse=True
        )
        
        restaurant_idx = 0
        attraction_idx = 0
        
        # Build blocks
        for block_type, config in BLOCK_CONFIG.items():
            place = None
            
            if config["type"] == "restaurant" and restaurant_idx < len(restaurants):
                place = restaurants[restaurant_idx]
                restaurant_idx += 1
            elif config["type"] == "attraction" and attraction_idx < len(attractions):
                place = attractions[attraction_idx]
                attraction_idx += 1
            elif config["type"] == "hotel" and hotels:
                place = hotels[0]
            
            if place:
                block = {
                    "block_type": block_type,
                    "time_range": config["time_range"],
                    "place": {
                        "id": place.place_id,
                        "name": place.name,
                        "rating": place.rating,
                        "userRatingCount": place.user_rating_count,
                        "search_type": config["type"],
                        "location": {
                            "latitude": place.latitude,
                            "longitude": place.longitude
                        },
                        "avg_price": place.avg_price
                    },
                    "estimated_cost": place.avg_price
                }
                blocks.append(block)
                day_used_ids.add(place.place_id)
                day_cost += place.avg_price
        
        # Add transport info
        self._add_transport_to_blocks(blocks)
        
        return {
            "day_number": day_number,
            "date": day_date.isoformat(),
            "blocks": blocks,
            "day_cost": round(day_cost, 2)
        }
    
    def _add_transport_to_blocks(self, blocks: List[Dict]):
        """Add transport info between blocks"""
        import math
        
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlat, dlon = lat2 - lat1, lon2 - lon1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            return R * 2 * math.asin(math.sqrt(a))
        
        for i in range(len(blocks) - 1):
            loc1 = blocks[i]["place"]["location"]
            loc2 = blocks[i + 1]["place"]["location"]
            
            distance = haversine(
                loc1["latitude"], loc1["longitude"],
                loc2["latitude"], loc2["longitude"]
            )
            
            # Select transport
            if distance <= 1.5:
                mode = "walking"
                speed = 5
            elif distance <= 30:
                mode = "motorbike"
                speed = 35
            else:
                mode = "taxi"
                speed = 30
            
            travel_time = distance / speed
            
            blocks[i]["transport_to_next"] = mode
            blocks[i]["distance_to_next_km"] = round(distance, 2)
            blocks[i]["travel_time_minutes"] = round(travel_time * 60)
    
    def _finalize_itinerary(self, itinerary_id: str, itinerary: Dict, last_day: Dict):
        """Set status to complete and calculate summary"""
        all_days = itinerary.get("daily_itinerary", []) + [last_day]
        
        total_places = sum(len(d.get("blocks", [])) for d in all_days)
        total_cost = sum(d.get("day_cost", 0) for d in all_days)
        guest_count = itinerary.get("guest_count", 2)
        budget = itinerary.get("budget", 1000)
        
        summary = {
            "total_places": total_places,
            "total_cost": round(total_cost, 2),
            "cost_per_person": round(total_cost / guest_count, 2) if guest_count else total_cost,
            "budget_utilized_percent": round((total_cost / budget * 100), 1) if budget else 0,
            "avg_cost_per_day": round(total_cost / len(all_days), 2) if all_days else 0
        }
        
        self.mongo.db.itineraries.update_one(
            {"itinerary_id": itinerary_id},
            {"$set": {"status": "complete", "summary": summary, "updated_at": datetime.utcnow()}}
        )
        logger.info(f"Finalized itinerary {itinerary_id}")
    
    def get_itinerary(self, itinerary_id: str) -> Optional[Dict]:
        """Get itinerary by ID"""
        return self.mongo.db.itineraries.find_one(
            {"itinerary_id": itinerary_id},
            {"_id": 0}
        )
    
    def get_user_itineraries(self, user_id: str) -> List[Dict]:
        """Get all itineraries for a user"""
        return list(self.mongo.db.itineraries.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1))
    
    def delete_itinerary(self, itinerary_id: str) -> bool:
        """Delete an itinerary"""
        result = self.mongo.db.itineraries.delete_one({"itinerary_id": itinerary_id})
        return result.deleted_count > 0
    
    def delete_day(self, itinerary_id: str, day_number: int) -> bool:
        """Delete a specific day from itinerary to allow regeneration"""
        result = self.mongo.db.itineraries.update_one(
            {"itinerary_id": itinerary_id},
            {
                "$pull": {"daily_itinerary": {"day_number": day_number}},
                "$set": {"status": "pending", "summary": None, "updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Deleted day {day_number} from itinerary {itinerary_id}")
            # Clear cache to force reload
            itinerary = self.mongo.db.itineraries.find_one({"itinerary_id": itinerary_id})
            if itinerary:
                city_id = itinerary.get("city_id")
                if city_id in self._places_cache:
                    del self._places_cache[city_id]
                if city_id in self._scores_cache:
                    del self._scores_cache[city_id]
            return True
        return False
