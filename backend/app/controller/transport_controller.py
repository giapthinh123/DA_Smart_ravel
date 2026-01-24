"""
Transport Controller
Select transport mode based on distance and time
"""

from typing import Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import logging

from ..config import ConfigRecommender

logger = logging.getLogger(__name__)


class TransportMode(Enum):
    """Available transport modes"""
    WALKING = "walking"
    MOTORBIKE = "motorbike"
    TAXI = "taxi"


@dataclass
class TransportInfo:
    """Transport information for a journey"""
    mode: str
    distance_km: float
    travel_time_hours: float
    travel_time_minutes: float
    cost_usd: float


class TransportController:
    """Select and calculate transport options"""
    
    CONFIGS = {
        TransportMode.WALKING: {
            "max_km": ConfigRecommender.WALKING_MAX_KM,
            "speed_kmh": ConfigRecommender.WALKING_SPEED_KMH,
            "cost_per_km": 0
        },
        TransportMode.MOTORBIKE: {
            "max_km": ConfigRecommender.MOTORBIKE_MAX_KM,
            "speed_kmh": ConfigRecommender.MOTORBIKE_SPEED_KMH,
            "cost_per_km": ConfigRecommender.MOTORBIKE_COST_PER_KM
        },
        TransportMode.TAXI: {
            "max_km": ConfigRecommender.TAXI_MAX_KM,
            "speed_kmh": ConfigRecommender.TAXI_SPEED_KMH,
            "cost_per_km": ConfigRecommender.TAXI_COST_PER_KM
        }
    }
    
    @classmethod
    def select_transport(
        cls,
        distance_km: float,
        available_time_hours: Optional[float] = None
    ) -> Tuple[TransportMode, str]:
        """
        Select best transport mode.
        Priority: walking -> motorbike -> taxi
        """
        priority_order = [TransportMode.WALKING, TransportMode.MOTORBIKE, TransportMode.TAXI]
        
        for mode in priority_order:
            config = cls.CONFIGS[mode]
            
            # Check distance constraint
            if distance_km > config["max_km"]:
                continue
            
            # Check time constraint if provided
            if available_time_hours is not None:
                travel_time = distance_km / config["speed_kmh"]
                if travel_time > available_time_hours:
                    continue
            
            return mode, f"Selected {mode.value} for {distance_km:.2f}km"
        
        # Fallback to taxi
        return TransportMode.TAXI, f"Fallback to taxi for {distance_km:.2f}km"
    
    @classmethod
    def get_transport_info(
        cls,
        distance_km: float,
        available_time_hours: Optional[float] = None
    ) -> TransportInfo:
        """Get complete transport information for a journey"""
        mode, _ = cls.select_transport(distance_km, available_time_hours)
        config = cls.CONFIGS[mode]
        
        travel_time_hours = distance_km / config["speed_kmh"]
        cost = distance_km * config["cost_per_km"]
        
        return TransportInfo(
            mode=mode.value,
            distance_km=round(distance_km, 2),
            travel_time_hours=round(travel_time_hours, 2),
            travel_time_minutes=round(travel_time_hours * 60, 1),
            cost_usd=round(cost, 2)
        )
    
    @classmethod
    def calculate_travel_time(cls, distance_km: float, mode: TransportMode) -> float:
        """Calculate travel time in hours for a given mode"""
        config = cls.CONFIGS[mode]
        return distance_km / config["speed_kmh"]
    
    @classmethod
    def calculate_cost(cls, distance_km: float, mode: TransportMode) -> float:
        """Calculate travel cost for a given mode"""
        config = cls.CONFIGS[mode]
        return distance_km * config["cost_per_km"]
