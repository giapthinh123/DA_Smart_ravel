from flask import Flask, request
from .config import Config
from .extensions import mongo, jwt, limiter, cors
import logging
import smtplib

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Disable strict slashes to prevent redirect issues with Docker internal URLs
    app.url_map.strict_slashes = False

    # CORS Configuration
    cors.init_app(app, resources={
        r"/api/*": {
            # "origins": ["http://localhost:3000", "http://a36a0a125b14.sn.mynetname.net:8116","https://races-merchant-schedules-kinda.trycloudflare.com"],  
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Log all incoming requests
    @app.before_request
    def log_request():
        logger.info(f"===== INCOMING REQUEST =====")
        logger.info(f"Method: {request.method}")
        logger.info(f"Path: {request.path}")
        logger.info(f"Origin: {request.headers.get('Origin', 'NO ORIGIN')}")
        logger.info(f"Referer: {request.headers.get('Referer', 'NO REFERER')}")
        logger.info(f"Authorization: {request.headers.get('Authorization', 'NO AUTH')[:50] if request.headers.get('Authorization') else 'NO AUTH'}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"=============================")

    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)

    # Create DB indexes after mongo is initialised
    with app.app_context():
        from .models.user_sessions import UserSessions
        UserSessions.ensure_indexes(mongo)

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token_type = jwt_payload.get("type", "access")

        if mongo.db.token_blacklist.find_one({"jti": jti}):
            return True

        if token_type == "access":
            session = mongo.db.user_sessions.find_one({"access_jti": jti})
        else:
            session = mongo.db.user_sessions.find_one({"refresh_jti": jti})

        if session is None:
            return True

        if token_type == "access":
            from .models.user_sessions import UserSessions as _US
            _US.update_last_used(mongo, jti)

        return False
    
    # JWT identity handlers for dict identity support
    # Serialize dict identity to JSON string when creating token
    import json
    
    @jwt.user_identity_loader
    def user_identity_lookup(identity):
        """Convert dict identity to JSON string for JWT subject"""
        if isinstance(identity, dict):
            return json.dumps(identity)
        return identity
    
    @jwt.decode_key_loader  
    def decode_key_callback(jwt_header, jwt_payload):
        """Return the decode key - needed for proper JWT handling"""
        return app.config.get('JWT_SECRET_KEY')
    
    # Add security headers to all responses (OWASP)
    @app.after_request
    def add_security_headers(response):
        for header, value in Config.SECURITY_HEADERS.items():
            response.headers[header] = value
        return response
    
    # Import and register blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.citys import citys_bp
    from .routes.flight import flight_bp
    from .routes.places import places_bp
    from .routes.itinerary import itinerary_bp
    from .routes.payments import payments_bp
    from .routes.tours import tours_bp
    from .routes.devices import devices_bp
    from .routes.admin import admin_bp
    from .routes.tour_bookings import tour_bookings_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(citys_bp, url_prefix="/api/citys")
    app.register_blueprint(flight_bp, url_prefix="/api/flights")
    app.register_blueprint(places_bp, url_prefix="/api/places")
    app.register_blueprint(itinerary_bp, url_prefix="/api/itinerary")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(tours_bp, url_prefix="/api/tours")
    app.register_blueprint(devices_bp, url_prefix="/api/devices")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(tour_bookings_bp, url_prefix="/api/tour-bookings")

    return app
