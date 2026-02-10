from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify

class Users:
    @staticmethod
    def create(data, mongo):
        """Tạo user mới với validation"""
        user = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "password": generate_password_hash(data["password"]),
            "fullname": data.get("fullname", ""),
            "phone": data.get("phone", ""),
            "address": data.get("address", ""),
            "role": data.get("role", "user"),  # Default: user
            "status": "active",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        return mongo.db.users.insert_one(user)

    @staticmethod
    def verify_password(password, hash_pw):
        """Xác thực password"""
        return check_password_hash(hash_pw, password)
    
    @staticmethod
    def roles_required(*roles):
        """
        Decorator để kiểm tra quyền truy cập dựa trên role
        
        Usage:
            @Users.roles_required("admin")
            @Users.roles_required("admin", "manager")
        
        OWASP Best Practices:
        - Kiểm tra JWT token hợp lệ
        - Kiểm tra role từ JWT (không tin frontend)
        - Trả về 403 nếu không đủ quyền
        - Không tiết lộ thông tin về hệ thống
        """
        def wrapper(fn):
            @wraps(fn)
            def decorator(*args, **kwargs):
                # 1. Verify JWT token exists and valid
                verify_jwt_in_request()
                
                # 2. Get user identity from JWT (trusted source)
                from ..extensions import parse_jwt_identity
                user = parse_jwt_identity()
                
                # 3. Check if user has required role
                if not user or "role" not in user:
                    return jsonify({"msg": "Invalid token"}), 401
                
                if user["role"] not in roles:
                    return jsonify({"msg": "Forbidden - Insufficient permissions"}), 403
                
                # 4. Execute the protected function
                return fn(*args, **kwargs)
            return decorator
        return wrapper
    
    @staticmethod
    def get_current_user():
        """
        Lấy thông tin user hiện tại từ JWT
        Sử dụng trong các protected routes
        """
        verify_jwt_in_request()
        from ..extensions import parse_jwt_identity
        return parse_jwt_identity()
    
    @staticmethod
    def is_token_blacklisted(jti):
        """
        Kiểm tra JWT token có bị blacklist không
        (Dùng khi implement logout)
        """
        from ..extensions import mongo
        token = mongo.db.token_blacklist.find_one({"jti": jti})
        return token is not None
    
    # ========== DATABASE FUNCTIONS ==========
    
    @staticmethod
    def find_user_by_email(mongo, email):
        """Tìm user theo email"""
        return mongo.db.users.find_one({"email": email})
    
    @staticmethod
    def find_user_by_email_with_timeout(mongo, email, timeout_ms=2000):
        """Tìm user theo email với timeout"""
        return mongo.db.users.find_one({"email": email}, max_time_ms=timeout_ms)
    
    @staticmethod
    def find_user_by_id(mongo, user_id):
        """Tìm user theo id (trả về tất cả fields)"""
        return mongo.db.users.find_one({"id": user_id})
    
    @staticmethod
    def find_user_by_id_safe(mongo, user_id):
        """Tìm user theo id (không trả về password và _id)"""
        return mongo.db.users.find_one(
            {"id": user_id}, 
            {"password": 0, "_id": 0}
        )
    
    @staticmethod
    def get_all_users(mongo):
        """Lấy danh sách tất cả users (không bao gồm password và _id)"""
        return list(mongo.db.users.find({}, {"password": 0, "_id": 0}))
    
    @staticmethod
    def update_user_by_id(mongo, user_id, data):
        """Cập nhật user theo id"""
        return mongo.db.users.update_one(
            {"id": user_id},
            {"$set": data}
        )
    
    @staticmethod
    def update_user_password(mongo, user_id, new_password_hash):
        """Cập nhật password của user"""
        from datetime import datetime
        return mongo.db.users.update_one(
            {"id": user_id},
            {"$set": {
                "password": new_password_hash,
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }}
        )
    
    @staticmethod
    def update_user_role(mongo, user_id, new_role):
        """Cập nhật role của user"""
        return mongo.db.users.update_one(
            {"id": user_id},
            {"$set": {"role": new_role}}
        )
    
    @staticmethod
    def delete_user_by_id(mongo, user_id):
        """Xóa user theo id"""
        return mongo.db.users.delete_one({"id": user_id})
    
    @staticmethod
    def soft_delete_user(mongo, user_id):
        """Soft delete user (đặt status = 'delete')"""
        from datetime import datetime
        return mongo.db.users.update_one(
            {"id": user_id},
            {"$set": {
                "status": "delete",
                "deleted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }}
        )
    
    @staticmethod
    def count_all_users(mongo):
        """Đếm tổng số users"""
        return mongo.db.users.count_documents({})
    
    @staticmethod
    def count_users_by_status(mongo, status):
        """Đếm số users theo status"""
        return mongo.db.users.count_documents({"status": status})
    
    @staticmethod
    def count_users_by_role(mongo, role):
        """Đếm số users theo role"""
        return mongo.db.users.count_documents({"role": role})
    
    @staticmethod
    def add_token_to_blacklist(mongo, jti):
        """Thêm token vào blacklist"""
        from datetime import datetime
        return mongo.db.token_blacklist.insert_one({
            "jti": jti,
            "created_at": datetime.now()
        })
