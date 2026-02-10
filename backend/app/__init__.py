from flask import Flask
from .config import Config
from .extensions import mongo, jwt, limiter, cors

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS Configuration
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": ["*"],  # TODO: Change to specific origins in production
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    # JWT token blacklist loader
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = mongo.db.token_blacklist.find_one({"jti": jti})
        return token is not None
    
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

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(citys_bp, url_prefix="/api/citys")
    app.register_blueprint(flight_bp, url_prefix="/api/flights")
    app.register_blueprint(places_bp, url_prefix="/api/places")
    app.register_blueprint(itinerary_bp, url_prefix="/api/itinerary")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")

    return app
