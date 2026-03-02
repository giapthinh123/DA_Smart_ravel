from bson import ObjectId


class TourModel:
    COLLECTION = "tours"

    @staticmethod
    def _serialize(doc):
        if doc and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    @staticmethod
    def create_tour(mongo, data):
        return mongo.db[TourModel.COLLECTION].insert_one(data)

    @staticmethod
    def get_all_tours(mongo):
        docs = list(mongo.db[TourModel.COLLECTION].find({}))
        return [TourModel._serialize(d) for d in docs]

    @staticmethod
    def get_tour_by_id(mongo, tour_id):
        doc = mongo.db[TourModel.COLLECTION].find_one({"tour_id": tour_id})
        return TourModel._serialize(doc)

    @staticmethod
    def delete_tour(mongo, tour_id):
        return mongo.db[TourModel.COLLECTION].delete_one({"tour_id": tour_id})

    @staticmethod
    def update_tour(mongo, tour_id, update_data):
        return mongo.db[TourModel.COLLECTION].update_one(
            {"tour_id": tour_id},
            {"$set": update_data}
        )

    @staticmethod
    def tour_exists(mongo, tour_id):
        return mongo.db[TourModel.COLLECTION].find_one({"tour_id": tour_id}, {"_id": 1}) is not None
