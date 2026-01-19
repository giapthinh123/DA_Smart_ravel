class places:
    @staticmethod
    def get_all_places(mongo):
        return list(
            mongo.db.places.aggregate([
                {
                    "$project": {
                        "_id": 0,
                        "place": 1,
                    }
                }
            ])
        )
    @staticmethod
    def get_all_place_by_city_id(mongo, city_id):
        return list(mongo.db.combined_places.find(
            {"city_id": city_id},
            {
                "_id": 0,
                "id": 1,
                "rating": 1,
                "userRatingCount": 1,
                "avg_price": 1,
                "search_type": 1,
                "location.latitude": 1,
                "location.longitude": 1,
                "displayName_text": 1,
            }
        ))