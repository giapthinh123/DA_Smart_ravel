from dotenv import load_dotenv
import os
from datetime import timedelta

load_dotenv()

class Config:
    print(os.getenv("IMAGEKIT_PRIVATE_KEY"))
    print(os.getenv("IMAGEKIT_PUBLIC_KEY"))
    print(os.getenv("IMAGEKIT_URL_ENDPOINT"))
    print(os.getenv("IMAGEKIT_TOKEN_ENDPOINT"))
    # Basic Flask config
    SECRET_KEY = os.getenv("SECRET_KEY")
    
    # JWT Configuration (OWASP Best Practices)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Short-lived access tokens
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # Longer refresh tokens
    JWT_ALGORITHM = "HS256"
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    
    # JWT Blacklist (for logout)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]
    
    # MongoDB config
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "DA-smart_travel")
    
    _base_uri = os.getenv("MONGO_URI", "")
    if _base_uri and not _base_uri.endswith(f"/{MONGODB_DB_NAME}"):
        _base_uri = _base_uri.rstrip("/")
        MONGO_URI = f"{_base_uri}/{MONGODB_DB_NAME}"
    else:
        MONGO_URI = _base_uri
    
    # Security Headers (OWASP)
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
    }