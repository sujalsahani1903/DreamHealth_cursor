import os
from datetime import timedelta
from dotenv import load_dotenv

# ADD THIS LINE: It forces Python to read your .env file right now
load_dotenv()

class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change")
    SQLALCHEMY_DATABASE_URI = os.getenv(
       "DATABASE_URL",
         "mysql+pymysql://root:Sul%40mysql@127.0.0.1:3306/dream_health_foods",
    )
    #SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:Sujal%40mysql@127.0.0.1/mydatabase"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret-change")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "30")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7")))
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    BCRYPT_LOG_ROUNDS = 12

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "noreply@dreamhealthfoods.com")

    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024

    OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
    ALLOW_PUBLIC_ADMIN = os.getenv("ALLOW_PUBLIC_ADMIN", "false").lower() == "true"


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
