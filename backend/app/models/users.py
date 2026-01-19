from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
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
                user = get_jwt_identity()
                
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
        return get_jwt_identity()
    
    @staticmethod
    def is_token_blacklisted(jti):
        """
        Kiểm tra JWT token có bị blacklist không
        (Dùng khi implement logout)
        """
        from ..extensions import mongo
        token = mongo.db.token_blacklist.find_one({"jti": jti})
        return token is not None
