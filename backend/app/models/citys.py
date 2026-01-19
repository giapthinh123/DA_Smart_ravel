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

    