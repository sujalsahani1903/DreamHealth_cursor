import os

from dotenv import load_dotenv
from flask import Flask, send_from_directory

load_dotenv()


def create_app(config_name=None):
    from config import config_by_name
    from extensions import bcrypt, cors, db, jwt, limiter, mail

    cfg_name = config_name or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(cfg_name, config_by_name["default"]))

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_URL"].split(",")}},
        supports_credentials=True,
    )
    limiter.init_app(app)

    from routes.admin import bp as admin_bp
    from routes.auth import bp as auth_bp
    from routes.cart import bp as cart_bp
    from routes.categories import bp as categories_bp
    from routes.inventory import bp as inventory_bp
    from routes.orders import bp as orders_bp
    from routes.payment import bp as payment_bp
    from routes.products import bp as products_bp
    from routes.raw_materials import bp as raw_bp
    from routes.reviews import bp as reviews_bp
    from routes.wishlist import bp as wishlist_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(raw_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(wishlist_bp)

    @app.get("/uploads/<path:subpath>")
    def serve_uploads(subpath):
        return send_from_directory(app.config["UPLOAD_FOLDER"], subpath)

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "dream-health-foods-api"}, 200

    @app.cli.command("init-db")
    def init_db():
        """Create tables from models (dev convenience). Production: use schema.sql."""
        db.create_all()
        print("Tables ensured.")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
