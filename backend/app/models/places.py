from datetime import datetime

class places:
    @staticmethod
    def get_all_places(mongo):
        return list(mongo.db.places.find(
            {},
            {
                "_id": 0,
                "id": 1,
                "city":1,
                "city_id": 1,
                "displayName_text": 1,
                "location": 1,
                "rating": 1,
                "userRatingCount": 1,
                "avg_price": 1,
                "search_type": 1,
            }
        ))
    @staticmethod
    def get_all_place_by_city_id(mongo, city_id):
        return list(mongo.db.places.find(
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
    @staticmethod
    def get_place_by_id(mongo, place_id):
        return mongo.db.places.find_one(
            {"id": place_id},
            {
                "_id": 0,
                "city_id": 1,
                "rating": 1,
                "displayName_text":1,
                "editorialSummary_text" :1,
                "location.latitude":1,
                "location.longitude":1,
                "rating" : 1,
                "userRatingCount" :1,
                "reviews" : 1,
                "avg_price" : 1,
                "image_url" : 1,
            }
        )
    @staticmethod
    def set_preferences(mongo, preferences, user_id, city_id):
        return mongo.db.user_preferences.insert_one({
            "user_id": user_id,
            "city_id": city_id,
            "like_hotel": preferences.like_hotel,
            "like_restaurant": preferences.like_restaurant,
            "like_attraction": preferences.like_attraction,
            "like_local_transport": preferences.like_local_transport,
            "dislike_hotel": preferences.dislike_hotel,
            "dislike_restaurant": preferences.dislike_restaurant,
            "dislike_attraction": preferences.dislike_attraction,
            "dislike_local_transport": preferences.dislike_local_transport,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        })
    
    @staticmethod
    def update_preferences(mongo, preferences, user_id, city_id):
        return mongo.db.user_preferences.update_one(
            {"user_id": user_id, "city_id": city_id},
            {"$set": {
                "like_hotel": preferences.like_hotel,
                "like_restaurant": preferences.like_restaurant,
                "like_attraction": preferences.like_attraction,
                "like_local_transport": preferences.like_local_transport,
                "dislike_hotel": preferences.dislike_hotel,
                "dislike_restaurant": preferences.dislike_restaurant,
                "dislike_attraction": preferences.dislike_attraction,
                "dislike_local_transport": preferences.dislike_local_transport,
                "updated_at": datetime.now(),
            }},
        )
    
    @staticmethod
    def check_preferences(mongo, user_id, city_id) -> bool:
        preferences = mongo.db.user_preferences.find_one(
            {"user_id": user_id, "city_id": city_id}
        )
        if preferences:
            return True
        return False
    
    @staticmethod
    def create_place(mongo, data):
        return mongo.db.places.insert_one(data)

    @staticmethod
    def place_exists(mongo, place_id):
        return mongo.db.places.find_one({"id": place_id}, {"_id": 1}) is not None

    @staticmethod
    def update_place(mongo, place_id, data):
        return mongo.db.places.update_one(
            {"id": place_id},
            {"$set": data}
        )

    @staticmethod
    def delete_place(mongo, place_id):
        return mongo.db.places.delete_one({"id": place_id})

    @staticmethod
    def get_preferences(mongo, user_id, city_id):
        return mongo.db.user_preferences.find_one(
            {"user_id": user_id, "city_id": city_id},
            {
                "_id": 0,
                "like_hotel": 1,
                "like_restaurant": 1,
                "like_attraction": 1,
                "like_local_transport": 1,
                "dislike_hotel": 1,
                "dislike_restaurant": 1,
                "dislike_attraction": 1,
                "dislike_local_transport": 1,
            }
        )