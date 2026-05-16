from datetime import datetime

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(190), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(32), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("user", "admin", name="user_role"), nullable=False, default="user")
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    profile_image = db.Column(db.String(512))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    carts = db.relationship("Cart", backref="user", lazy=True, cascade="all, delete-orphan")
    orders = db.relationship("Order", backref="user", lazy=True)


class EmailOTP(db.Model):
    __tablename__ = "email_otps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    email = db.Column(db.String(190), nullable=False, index=True)
    otp = db.Column(db.String(255), nullable=False)
    purpose = db.Column(db.Enum("signup", "login", "forgot_password", name="otp_purpose"), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    address_line = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(120), nullable=False)
    state = db.Column(db.String(120), nullable=False)
    pincode = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(120), nullable=False, default="India")


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    image = db.Column(db.String(512))

    products = db.relationship("Product", backref="category", lazy=True)


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    stock = db.Column(db.Integer, default=0, nullable=False)
    cost_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    selling_price = db.Column(db.Numeric(12, 2), nullable=False)
    profit_margin = db.Column(db.Numeric(6, 2), nullable=False, default=0)
    image = db.Column(db.String(512))
    rating = db.Column(db.Numeric(3, 2), nullable=False, default=0)
    total_reviews = db.Column(db.Integer, nullable=False, default=0)
    featured = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Cart(db.Model):
    __tablename__ = "cart"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    product = db.relationship("Product", backref="cart_entries", lazy=True)

    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),)


class Wishlist(db.Model):
    __tablename__ = "wishlists"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    product = db.relationship("Product", backref="wishlist_entries", lazy=True)

    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),)


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_status = db.Column(
        db.Enum("pending", "paid", "failed", "refunded", name="payment_status"),
        nullable=False,
        default="pending",
    )
    payment_method = db.Column(db.String(50), nullable=False, default="stripe")
    order_status = db.Column(
        db.Enum("pending", "processing", "shipped", "delivered", "cancelled", name="order_status"),
        nullable=False,
        default="pending",
    )
    stripe_session_id = db.Column(db.String(255))
    shipping_address = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")
    transactions = db.relationship("Transaction", backref="order", lazy=True, cascade="all, delete-orphan")


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=False)

    product = db.relationship("Product", backref="order_items", lazy=True)


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    stripe_payment_intent = db.Column(db.String(255))
    stripe_charge_id = db.Column(db.String(255))
    receipt_url = db.Column(db.String(512))
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_status = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    feedback = db.Column(db.Text, nullable=False)
    admin_reply = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref="reviews", lazy=True)

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", "order_id", name="uq_reviews_user_product_order"),
    )


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    supplier_name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(120))
    phone = db.Column(db.String(32))
    email = db.Column(db.String(190))
    address = db.Column(db.Text)


class RawMaterial(db.Model):
    __tablename__ = "raw_materials"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    supplier = db.Column(db.String(200))
    quantity = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    purchase_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    purchase_date = db.Column(db.Date)
    remaining_stock = db.Column(db.Numeric(12, 2), nullable=False, default=0)


class InventoryLog(db.Model):
    __tablename__ = "inventory_logs"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    action_type = db.Column(
        db.Enum("add", "subtract", "sale", "adjust", name="inventory_action"),
        nullable=False,
    )
    quantity = db.Column(db.Integer, nullable=False)
    previous_stock = db.Column(db.Integer, nullable=False)
    new_stock = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    product = db.relationship("Product", backref="inventory_logs", lazy=True)


class StockAlert(db.Model):
    __tablename__ = "stock_alerts"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    current_stock = db.Column(db.Integer, nullable=False)
    threshold_value = db.Column(db.Integer, nullable=False)
    alert_status = db.Column(
        db.Enum("open", "acknowledged", "resolved", name="alert_status"),
        nullable=False,
        default="open",
    )

    product = db.relationship("Product", backref="stock_alerts", lazy=True)
