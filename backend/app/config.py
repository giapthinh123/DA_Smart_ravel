from dotenv import load_dotenv
import os
from datetime import timedelta

load_dotenv()

class Config:
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
    
    # VNPAY Configuration
    VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "CGPNVAII")
    VNPAY_HASH_SECRET = os.getenv("VNPAY_HASH_SECRET", "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ")
    VNPAY_URL = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")
    VNPAY_RETURN_URL = os.getenv("VNPAY_RETURN_URL", "http://localhost:3000/vnpay-return")
    VNPAY_RETURN_URL_REGISTER = os.getenv("VNPAY_RETURN_URL_REGISTER", "http://localhost:5000/api/payments/vnpay/return-register")
    USD_TO_VND_RATE = int(os.getenv("USD_TO_VND_RATE", "25000"))
    
    # Registration Plans Configuration
    REGISTRATION_PLANS = {
        "monthly": {"price_usd": 7.96, "duration_days": 30, "name": "Gói tháng"},
        "yearly": {"price_usd": 79.6, "duration_days": 365, "name": "Gói năm"},
        "lifetime": {"price_usd": 199.6, "duration_days": 36500, "name": "Trọn đời"}
    }
    
    # SMTP Email Configuration
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@smarttravel.com")
    
    # Security Headers (OWASP)
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
    }


class ConfigRecommender:
    """Configuration for the itinerary recommendation system"""
    
    # Algorithm Parameters
    DEFAULT_ALPHA = 0.7  # Weight for content-based vs collaborative
    TOP_K_PLACES = 50    # Number of top places to recommend
    
    # Time Blocks (start_hour, start_min, end_hour, end_min)
    BREAKFAST_TIME = (7, 0, 8, 0)
    MORNING_ACTIVITY = (8, 0, 11, 0)
    LUNCH_TIME = (11, 0, 13, 0)
    AFTERNOON_ACTIVITY = (13, 0, 18, 30)
    DINNER_TIME = (18, 30, 20, 30)
    EVENING_ACTIVITY = (20, 30, 22, 0)
    HOTEL_TIME = (22, 0, 7, 0)
    
    # Places per block
    PLACES_PER_BLOCK = {
        "breakfast": 1,
        "morning": 2,
        "lunch": 1,
        "afternoon": 3,
        "dinner": 1,
        "evening": 1,
        "hotel": 1
    }
    
    # Place type mappings
    RESTAURANT_TYPES = [
        'restaurant', 'meal_delivery', 'meal_takeaway',
        'vietnamese_restaurant', 'asian_restaurant', 'thai_restaurant',
        'chinese_restaurant', 'indian_restaurant', 'japanese_restaurant'
    ]
    
    CAFE_TYPES = ['cafe', 'bakery', 'coffee_shop', 'breakfast_restaurant']
    
    HOTEL_TYPES = ['lodging', 'hotel', 'hostel', 'guest_house', 'inn']
    
    ACTIVITY_TYPES = [
        'tourist_attraction', 'museum', 'park', 'zoo', 'aquarium',
        'art_gallery', 'amusement_park', 'shopping_mall', 'night_club',
        'bar', 'spa', 'gym', 'movie_theater', 'historical_landmark',
        'cultural_center', 'monument', 'garden', 'beach', 'temple'
    ]
    
    # Transport settings
    WALKING_MAX_KM = 1.5
    WALKING_SPEED_KMH = 5
    MOTORBIKE_MAX_KM = 30
    MOTORBIKE_SPEED_KMH = 35
    MOTORBIKE_COST_PER_KM = 0.4
    TAXI_MAX_KM = 100
    TAXI_SPEED_KMH = 30
    TAXI_COST_PER_KM = 0.75