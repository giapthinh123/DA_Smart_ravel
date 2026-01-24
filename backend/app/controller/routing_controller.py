"""
Routing Controller
Graph-based routing with Dijkstra algorithm and Haversine distance
"""

import heapq
import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import logging

from ..models.itinerary_models import Place

logger = logging.getLogger(__name__)


@dataclass
class Edge:
    """Edge in the graph"""
    to_place_id: str
    distance_km: float


class RoutingController:
    """Graph-based routing with Dijkstra shortest path"""
    
    def __init__(self, places: List[Place]):
        self.places_dict = {p.place_id: p for p in places}
        self.adjacency_list: Dict[str, List[Edge]] = {}
        self._build_graph()
    
    def _haversine_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate Haversine distance in km"""
        R = 6371  # Earth radius in km
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _build_graph(self):
        """Build complete graph with Haversine distances"""
        place_ids = list(self.places_dict.keys())
        
        for place_id1 in place_ids:
            place1 = self.places_dict[place_id1]
            self.adjacency_list[place_id1] = []
            
            for place_id2 in place_ids:
                if place_id1 == place_id2:
                    continue
                
                place2 = self.places_dict[place_id2]
                distance = self._haversine_distance(
                    place1.latitude, place1.longitude,
                    place2.latitude, place2.longitude
                )
                
                self.adjacency_list[place_id1].append(
                    Edge(to_place_id=place_id2, distance_km=distance)
                )
        
        logger.info(f"Built graph with {len(self.adjacency_list)} nodes")
    
    def get_distance(self, start_id: str, end_id: str) -> float:
        """Get direct distance between two places"""
        if start_id == end_id:
            return 0.0
        
        if start_id not in self.places_dict or end_id not in self.places_dict:
            return float('inf')
        
        p1 = self.places_dict[start_id]
        p2 = self.places_dict[end_id]
        
        return self._haversine_distance(
            p1.latitude, p1.longitude, p2.latitude, p2.longitude
        )
    
    def dijkstra(self, start_id: str, end_id: str) -> Tuple[float, List[str]]:
        """Find shortest path using Dijkstra algorithm"""
        if start_id not in self.places_dict or end_id not in self.places_dict:
            return float('inf'), []
        
        if start_id == end_id:
            return 0.0, [start_id]
        
        distances = {pid: float('inf') for pid in self.places_dict}
        distances[start_id] = 0
        predecessors = {pid: None for pid in self.places_dict}
        
        pq = [(0, start_id)]
        visited = set()
        
        while pq:
            current_dist, current_id = heapq.heappop(pq)
            
            if current_id in visited:
                continue
            
            visited.add(current_id)
            
            if current_id == end_id:
                break
            
            for edge in self.adjacency_list.get(current_id, []):
                if edge.to_place_id in visited:
                    continue
                
                new_dist = current_dist + edge.distance_km
                
                if new_dist < distances[edge.to_place_id]:
                    distances[edge.to_place_id] = new_dist
                    predecessors[edge.to_place_id] = current_id
                    heapq.heappush(pq, (new_dist, edge.to_place_id))
        
        # Reconstruct path
        path = []
        current = end_id
        while current is not None:
            path.append(current)
            current = predecessors[current]
        path.reverse()
        
        if path[0] != start_id:
            return float('inf'), []
        
        return distances[end_id], path
    
    def optimize_route(
        self, place_ids: List[str], start_id: Optional[str] = None
    ) -> List[str]:
        """Optimize route using nearest neighbor heuristic"""
        if not place_ids:
            return []
        
        if len(place_ids) == 1:
            return place_ids
        
        current = start_id if start_id and start_id in place_ids else place_ids[0]
        unvisited = set(place_ids) - {current}
        route = [current]
        
        while unvisited:
            nearest = min(unvisited, key=lambda p: self.get_distance(current, p))
            route.append(nearest)
            current = nearest
            unvisited.remove(nearest)
        
        return route
    
    def calculate_route_distance(self, place_ids: List[str]) -> float:
        """Calculate total distance for a route"""
        if len(place_ids) < 2:
            return 0.0
        
        total = 0.0
        for i in range(len(place_ids) - 1):
            total += self.get_distance(place_ids[i], place_ids[i + 1])
        
        return total
