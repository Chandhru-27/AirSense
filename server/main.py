from flask import Flask
import os
from dotenv import load_dotenv
from flask import request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import limiter
from werkzeug.middleware.proxy_fix import ProxyFix
from db.db_setup import initialize_connection_pool, initialize_database_and_create_tables
from config import DevConfig, ProdConfig

load_dotenv()

def create_app():
    app = Flask(__name__)

    if os.getenv("FLASK_ENV") == "production":
        app.config.from_object(ProdConfig)
    else:
        app.config.from_object(DevConfig)
    
    app.wsgi_app = ProxyFix(
            app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
        )

    jwt = JWTManager(app)

    limiter.init_app(app=app)

    # CORS config for endpoint access
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=app.config["CORS_SUPPORTS_CREDENTIALS"],
        allow_headers=app.config["CORS_ALLOW_HEADERS"],
        methods=app.config.get("CORS_METHODS"),
        expose_headers=app.config.get("CORS_EXPOSE_HEADERS"),
    )

    # DEBUG frontend url
    print(">>> Loaded PROD_FRONTEND_ORIGIN:", app.config["CORS_ORIGINS"])
    
    # Import and register blueprints here to avoid circular imports
    from auth.routes import auth_bp
    from user.routes import user_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)

    # Security headers configuration
    @app.after_request
    def set_security_headers(response):
        env = os.getenv("FLASK_ENV", "production")
        frontend = os.getenv("PROD_FRONTEND_ORIGIN", "")

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"

        # ---- Development CSP ----
        if env == "development":
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; "
                "style-src 'self' 'unsafe-inline' http://localhost:5173; "
                "img-src 'self' data:; "
                "font-src 'self'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        
        # ---- Production CSP ----
        else:
            csp = (
                "default-src 'self'; "
                f"script-src 'self' {frontend}; "
                f"style-src 'self' 'unsafe-inline' {frontend}; "
                "img-src 'self' data:; "
                "font-src 'self'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )

        response.headers["Content-Security-Policy"] = csp

        return response

    return app

app = create_app()

with app.app_context():
    initialize_connection_pool()
    initialize_database_and_create_tables()
    
@app.route('/')
def home():
    return "Welcome to primer backend!"

if __name__ == "__main__":
    
    app.run(debug=app.config["DEBUG"], host="localhost", port=5000)
