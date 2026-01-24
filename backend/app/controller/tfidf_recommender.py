"""
TF-IDF Recommender Controller
Content-based filtering using TF-IDF vectorization
"""

import numpy as np
from typing import List, Dict, Optional
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..models.itinerary_models import Place, UserPreference

logger = logging.getLogger(__name__)


class TfidfRecommender:
    """TF-IDF based content filtering for place recommendations"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english',
            lowercase=True
        )
        self.place_vectors = None
        self.place_id_to_idx: Dict[str, int] = {}
        self.idx_to_place_id: Dict[int, str] = {}
        self._is_fitted = False
        
        logger.info("TfidfRecommender initialized")
    
    def _create_place_text(self, place: Place) -> str:
        """Create text representation for TF-IDF"""
        components = []
        
        if place.types:
            components.append(' '.join(place.types))
        if place.name:
            components.append(place.name)
        if place.city:
            components.append(place.city)
        
        return ' '.join(components)
    
    def fit(self, places: List[Place]) -> None:
        """Build TF-IDF matrix from places"""
        if not places:
            logger.warning("No places to fit")
            return
        
        self.place_id_to_idx = {p.place_id: idx for idx, p in enumerate(places)}
        self.idx_to_place_id = {idx: pid for pid, idx in self.place_id_to_idx.items()}
        
        texts = [self._create_place_text(p) for p in places]
        self.place_vectors = self.vectorizer.fit_transform(texts)
        self._is_fitted = True
        
        logger.info(f"Fitted TF-IDF on {len(places)} places")
    
    def _create_user_profile(self, selected_places: List[Place]) -> Optional[np.ndarray]:
        """Create user profile from selected places"""
        if not selected_places or not self._is_fitted:
            return None
        
        indices = [
            self.place_id_to_idx[p.place_id]
            for p in selected_places
            if p.place_id in self.place_id_to_idx
        ]
        
        if not indices:
            return None
        
        selected_vectors = self.place_vectors[indices]
        user_profile = selected_vectors.mean(axis=0)
        
        if hasattr(user_profile, 'toarray'):
            return user_profile.A.flatten()
        return np.asarray(user_profile).flatten()
    
    def calculate_scores(
        self,
        candidate_places: List[Place],
        selected_places: List[Place]
    ) -> Dict[str, float]:
        """Calculate content scores for candidates"""
        if not self._is_fitted:
            self.fit(candidate_places)
        
        user_profile = self._create_user_profile(selected_places)
        
        if user_profile is None:
            return {p.place_id: 0.5 for p in candidate_places}
        
        user_profile_2d = user_profile.reshape(1, -1)
        similarities = cosine_similarity(user_profile_2d, self.place_vectors).flatten()
        
        scores = {}
        selected_ids = {p.place_id for p in selected_places}
        
        for place in candidate_places:
            if place.place_id in selected_ids:
                continue
            
            if place.place_id in self.place_id_to_idx:
                idx = self.place_id_to_idx[place.place_id]
                similarity = similarities[idx]
                score = (similarity + 1) / 2
            else:
                score = 0.5
            
            rating_boost = (place.rating / 5.0) * 0.1
            scores[place.place_id] = float(min(1.0, score + rating_boost))
        
        return scores
    
    def get_top_recommendations(
        self,
        candidate_places: List[Place],
        selected_places: List[Place],
        k: int = 50
    ) -> List[tuple]:
        """Get top K recommendations"""
        scores = self.calculate_scores(candidate_places, selected_places)
        
        place_dict = {p.place_id: p for p in candidate_places}
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        return [
            (place_dict[pid], score)
            for pid, score in sorted_scores[:k]
            if pid in place_dict
        ]
