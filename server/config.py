"""Global app configuration with dev/prod classes"""
import os
from dotenv import load_dotenv

load_dotenv()

class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # JWT token settings
    JWT_TOKEN_LOCATION = ["headers"]

    # CORS
    CORS_SUPPORTS_CREDENTIALS = False
    CORS_ALLOW_HEADERS = ["Content-Type", "Authorization", "X-Requested-With"]
    CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

    # Token expiry minutes
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 1600))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 604800))

    # RATE LIMIT defaults
    RATELIMIT_DEFAULT = "15 per minute"

class DevConfig(BaseConfig):
    """Development config: Allow non-HTTPS and non-CSRF protect"""
    DEBUG = True
    CORS_ORIGINS = ["http://localhost:5173","http://127.0.0.1:5173"]

class ProdConfig(BaseConfig):
    """Production config: Enforce HTTPS and CSRF protect for custom domain"""
    DEBUG = False
    CORS_ORIGINS = [os.getenv("PROD_FRONTEND_ORIGIN")]