from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
mongo = PyMongo()

jwt = JWTManager()

cors = CORS()

limiter = Limiter (
    key_func=get_remote_address,  # Dùng IP để track
    # default_limits=["200 per day", "50 per hour"],  # Giới hạn mặc định
)