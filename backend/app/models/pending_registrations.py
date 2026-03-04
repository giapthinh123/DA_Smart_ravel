"""
Pending Registrations Model
Temporary storage for user registration data before payment completion
"""

import uuid
from datetime import datetime, timedelta


class PendingRegistrations:
    @staticmethod
    def create(data, mongo):
        """
        Tạo pending registration mới
        Data should include: email, password_hash, fullname, phone, plan_id, amount_usd, payment_id, device_id
        """
        registration = {
            "registration_id": str(uuid.uuid4()),
            "email": data["email"],
            "password_hash": data["password_hash"],
            "fullname": data.get("fullname", ""),
            "phone": data.get("phone", ""),
            "plan_id": data["plan_id"],
            "amount_usd": data["amount_usd"],
            "payment_id": data["payment_id"],
            "device_id": data.get("device_id"),
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=30),
        }
        result = mongo.db.pending_registrations.insert_one(registration)
        registration["_id"] = result.inserted_id
        return registration
    
    @staticmethod
    def find_by_registration_id(mongo, registration_id):
        """Tìm pending registration theo registration_id"""
        return mongo.db.pending_registrations.find_one({"registration_id": registration_id})
    
    @staticmethod
    def find_by_payment_id(mongo, payment_id):
        """Tìm pending registration theo payment_id"""
        return mongo.db.pending_registrations.find_one({"payment_id": payment_id})
    
    @staticmethod
    def find_by_email(mongo, email):
        """Tìm pending registration theo email"""
        return mongo.db.pending_registrations.find_one({"email": email})
    
    @staticmethod
    def delete_by_registration_id(mongo, registration_id):
        """Xóa pending registration theo registration_id"""
        return mongo.db.pending_registrations.delete_one({"registration_id": registration_id})
    
    @staticmethod
    def delete_by_payment_id(mongo, payment_id):
        """Xóa pending registration theo payment_id"""
        return mongo.db.pending_registrations.delete_one({"payment_id": payment_id})
    
    @staticmethod
    def cleanup_expired(mongo):
        """Xóa các pending registrations đã hết hạn (> 30 phút)"""
        now = datetime.now()
        result = mongo.db.pending_registrations.delete_many({
            "expires_at": {"$lt": now}
        })
        return result.deleted_count
    
    @staticmethod
    def count_all(mongo):
        """Đếm tổng số pending registrations"""
        return mongo.db.pending_registrations.count_documents({})
