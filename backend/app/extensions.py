from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager, get_jwt_identity as _get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
import json

mongo = PyMongo()

jwt = JWTManager()

cors = CORS()

limiter = Limiter (
    key_func=get_remote_address,  # Dùng IP để track
    # default_limits=["200 per day", "50 per hour"],  # Giới hạn mặc định
)


def parse_jwt_identity():
    """
    Get JWT identity and parse JSON string to dict if needed.
    Supports both old format (dict) and new format (JSON string).
    Returns the identity dict or string.
    """
    identity = _get_jwt_identity()
    if isinstance(identity, str):
        try:
            identity = json.loads(identity)
        except json.JSONDecodeError:
            pass  # Keep as string if not valid JSON
    return identity


def get_user_id_from_jwt():
    """
    Helper to get user_id from JWT identity.
    Returns user_id string.
    """
    identity = parse_jwt_identity()
    return identity["id"] if isinstance(identity, dict) else identity