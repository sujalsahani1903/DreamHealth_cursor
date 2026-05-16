import os
from datetime import datetime, timedelta
from decimal import Decimal

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from extensions import db
from middleware.auth import admin_required
from models import Order, OrderItem, Product, Review, Supplier, User

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/dashboard")
@jwt_required()
@admin_required
def dashboard():
    total_users = User.query.count()
    total_products = Product.query.count()
    total_orders = Order.query.count()
    paid_orders = Order.query.filter_by(payment_status="paid").all()
    revenue = sum(Decimal(str(o.total_amount)) for o in paid_orders)
    profit = (
        db.session.query(
            func.coalesce(
                func.sum((OrderItem.price - Product.cost_price) * OrderItem.quantity), 0
            )
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .filter(Order.payment_status == "paid")
        .scalar()
    )
    profit = float(profit or 0)
    low_stock = Product.query.filter(Product.stock < 25).count()
    return jsonify(
        {
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "paid_orders": len(paid_orders),
            "total_revenue": float(revenue),
            "estimated_profit": profit,
            "low_stock_products": low_stock,
        }
    ), 200


@bp.get("/users")
@jwt_required()
@admin_required
def users():
    rows = User.query.order_by(User.created_at.desc()).limit(500).all()
    return jsonify(
        [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in rows
        ]
    ), 200


@bp.get("/orders")
@jwt_required()
@admin_required
def admin_orders():
    rows = Order.query.order_by(Order.created_at.desc()).limit(500).all()
    out = []
    for o in rows:
        out.append(
            {
                "id": o.id,
                "user": {"id": o.user.id, "name": o.user.name, "email": o.user.email},
                "total_amount": float(o.total_amount),
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "items": [
                    {"product_id": i.product_id, "name": i.product.name, "quantity": i.quantity, "price": float(i.price)}
                    for i in o.items
                ],
            }
        )
    return jsonify(out), 200


@bp.put("/orders/<int:oid>/status")
@jwt_required()
@admin_required
def update_order_status(oid: int):
    o = Order.query.get(oid)
    if not o:
        return jsonify({"message": "Not found"}), 404
    status = (request.get_json() or {}).get("order_status")
    if status not in ("pending", "processing", "shipped", "delivered", "cancelled"):
        return jsonify({"message": "Invalid status"}), 400
    o.order_status = status
    db.session.commit()
    return jsonify({"message": "Updated", "order_status": o.order_status}), 200


@bp.get("/revenue-analytics")
@jwt_required()
@admin_required
def revenue_analytics():
    now = datetime.utcnow()
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_week = now - timedelta(days=7)
    start_day = now - timedelta(days=1)

    def sum_since(dt):
        q = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.payment_status == "paid", Order.created_at >= dt
        )
        return float(q.scalar() or 0)

    monthly = sum_since(start_month)
    weekly = sum_since(start_week)
    daily = sum_since(start_day)
    return jsonify({"daily": daily, "weekly": weekly, "monthly": monthly}), 200


@bp.get("/product-performance")
@jwt_required()
@admin_required
def product_performance():
    pid = request.args.get("product_id", type=int)
    base = (
        db.session.query(
            Product.id.label("pid"),
            Product.name.label("name"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.price), 0).label("revenue"),
            func.coalesce(
                func.sum((OrderItem.price - Product.cost_price) * OrderItem.quantity), 0
            ).label("profit"),
            func.count(func.distinct(OrderItem.order_id)).label("orders_count"),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .filter(Order.payment_status == "paid")
        .group_by(Product.id, Product.name)
    )
    if pid:
        base = base.filter(Product.id == pid)
    rows = base.all()
    out = []
    for r in rows:
        p = Product.query.get(r.pid)
        out.append(
            {
                "product_id": r.pid,
                "name": r.name,
                "units_sold": int(r.units_sold or 0),
                "revenue": float(r.revenue or 0),
                "profit": float(r.profit or 0),
                "orders": int(r.orders_count or 0),
                "current_stock": p.stock if p else 0,
                "rating": float(p.rating) if p else 0,
                "total_reviews": p.total_reviews if p else 0,
            }
        )
    return jsonify(out), 200


@bp.get("/top-selling-products")
@jwt_required()
@admin_required
def top_selling():
    rows = (
        db.session.query(
            Product.id,
            Product.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("units"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.price), 0).label("revenue"),
            Product.rating,
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.payment_status == "paid")
        .group_by(Product.id, Product.name, Product.rating)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(15)
        .all()
    )
    ranked = []
    for idx, r in enumerate(rows, start=1):
        ranked.append(
            {
                "rank": idx,
                "product_id": r.id,
                "name": r.name,
                "units_sold": int(r.units or 0),
                "revenue": float(r.revenue or 0),
                "rating": float(r.rating or 0),
            }
        )
    return jsonify(ranked), 200


@bp.get("/stock-summary")
@jwt_required()
@admin_required
def stock_summary():
    rows = Product.query.order_by(Product.stock.asc()).all()
    return jsonify(
        [
            {
                "id": p.id,
                "name": p.name,
                "stock": p.stock,
                "selling_price": float(p.selling_price),
                "cost_price": float(p.cost_price),
                "profit_margin": float(p.profit_margin),
            }
            for p in rows
        ]
    ), 200


@bp.get("/customer-feedbacks")
@jwt_required()
@admin_required
def feedbacks():
    bad_only = request.args.get("bad_only") == "1"
    q = (
        Review.query.join(User, User.id == Review.user_id)
        .join(Product, Product.id == Review.product_id)
    )
    if bad_only:
        q = q.filter(Review.rating <= 2)
    rows = q.order_by(Review.created_at.desc()).limit(300).all()
    return jsonify(
        [
            {
                "id": r.id,
                "rating": r.rating,
                "feedback": r.feedback,
                "admin_reply": r.admin_reply,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "product": {"id": r.product_id, "name": r.product.name},
                "user": {"id": r.user_id, "name": r.user.name, "email": r.user.email},
            }
            for r in rows
        ]
    ), 200


@bp.put("/reviews/<int:rid>/reply")
@jwt_required()
@admin_required
def reply_review(rid: int):
    r = Review.query.get(rid)
    if not r:
        return jsonify({"message": "Not found"}), 404
    text = (request.get_json() or {}).get("admin_reply", "")
    r.admin_reply = text
    db.session.commit()
    return jsonify({"message": "Saved"}), 200


@bp.get("/reports")
@jwt_required()
@admin_required
def sales_reports():
    period = (request.args.get("period") or "daily").lower()
    now = datetime.utcnow()
    if period == "weekly":
        start = now - timedelta(days=7)
    elif period == "monthly":
        start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=1)

    q = (
        db.session.query(func.coalesce(func.sum(Order.total_amount), 0), func.count(Order.id))
        .filter(Order.payment_status == "paid", Order.created_at >= start)
        .one()
    )
    return jsonify({"period": period, "revenue": float(q[0] or 0), "orders": int(q[1] or 0)}), 200


@bp.get("/suppliers")
@jwt_required()
@admin_required
def list_suppliers():
    rows = Supplier.query.order_by(Supplier.supplier_name).all()
    return jsonify(
        [
            {
                "id": s.id,
                "supplier_name": s.supplier_name,
                "contact_person": s.contact_person,
                "phone": s.phone,
                "email": s.email,
                "address": s.address,
            }
            for s in rows
        ]
    ), 200


@bp.post("/suppliers")
@jwt_required()
@admin_required
def create_supplier():
    data = request.get_json() or {}
    name = (data.get("supplier_name") or "").strip()
    if not name:
        return jsonify({"message": "supplier_name required"}), 400
    s = Supplier(
        supplier_name=name,
        contact_person=data.get("contact_person"),
        phone=data.get("phone"),
        email=data.get("email"),
        address=data.get("address"),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify({"id": s.id}), 201


@bp.post("/upload")
@jwt_required()
@admin_required
def upload_file():
    from werkzeug.utils import secure_filename
    import uuid

    if "file" not in request.files:
        return jsonify({"message": "file required"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"message": "empty filename"}), 400
    sub = (request.form.get("folder") or "products").strip().replace("..", "")
    ext = secure_filename(f.filename).rsplit(".", 1)[-1].lower()
    if ext not in ("png", "jpg", "jpeg", "webp", "gif"):
        return jsonify({"message": "invalid type"}), 400
    name = f"{uuid.uuid4().hex}.{ext}"
    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], sub)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, name)
    f.save(path)
    url = f"/uploads/{sub}/{name}"
    return jsonify({"url": url}), 201
