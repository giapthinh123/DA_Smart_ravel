class citys:
    @staticmethod
    def get_all_citys(mongo):
        return list(
            mongo.db.cities.aggregate([
                {
                    "$project": {
                        "_id": 0,
                        "id": 1,
                        "city": 1,
                        "country": 1,
                        "location": {
                            "lat": "$lat",
                            "lng": "$lng"
                        }
                    }
                }
            ])
        )

    @staticmethod
    def get_city_by_id(mongo, city_id):
        """Lấy thông tin city theo id"""
        return mongo.db.cities.find_one(
            {"id": city_id},
            {
                "_id": 0,
                "id": 1,
                "city": 1,
                "country": 1,
                "lat": 1,
                "lng": 1
            }
        )

    @staticmethod
    def find_city_by_id(mongo, city_id):
        """Find city from citys collection by id field (used by itinerary routes)."""
        return mongo.db.citys.find_one({"id": str(city_id)})
