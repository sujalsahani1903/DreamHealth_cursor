from decimal import Decimal

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from extensions import db
from middleware.auth import admin_required
from models import Product, User
from utils.serializers import calc_profit_margin, product_to_dict

bp = Blueprint("products", __name__, url_prefix="/api/products")


@bp.get("")
def list_products():
    q = Product.query
    category_id = request.args.get("category_id", type=int)
    featured = request.args.get("featured")
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if featured == "1":
        q = q.filter(Product.featured.is_(True))
    page = request.args.get("page", default=1, type=int)
    per_page = min(request.args.get("per_page", default=12, type=int), 48)
    items = q.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [product_to_dict(p) for p in items.items],
            "total": items.total,
            "page": page,
            "per_page": per_page,
            "pages": items.pages,
        }
    ), 200


@bp.get("/search")
def search_products():
    term = (request.args.get("q") or "").strip()
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    min_rating = request.args.get("min_rating", type=float)
    category_id = request.args.get("category_id", type=int)
    sort = (request.args.get("sort") or "newest").lower()
    page = request.args.get("page", default=1, type=int)
    per_page = min(request.args.get("per_page", default=12, type=int), 48)

    q = Product.query
    if term:
        like = f"%{term}%"
        q = q.filter(or_(Product.name.ilike(like), Product.description.ilike(like)))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if min_price is not None:
        q = q.filter(Product.selling_price >= min_price)
    if max_price is not None:
        q = q.filter(Product.selling_price <= max_price)
    if min_rating is not None:
        q = q.filter(Product.rating >= min_rating)

    if sort == "price_asc":
        q = q.order_by(Product.selling_price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.selling_price.desc())
    elif sort == "rating":
        q = q.order_by(Product.rating.desc())
    else:
        q = q.order_by(Product.created_at.desc())

    items = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [product_to_dict(p) for p in items.items],
            "total": items.total,
            "page": page,
            "per_page": per_page,
            "pages": items.pages,
        }
    ), 200


@bp.get("/category/<int:cid>")
def products_by_category(cid: int):
    q = Product.query.filter(Product.category_id == cid)
    page = request.args.get("page", default=1, type=int)
    per_page = min(request.args.get("per_page", default=12, type=int), 48)
    items = q.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [product_to_dict(p) for p in items.items],
            "total": items.total,
            "page": page,
            "per_page": per_page,
            "pages": items.pages,
        }
    ), 200


@bp.get("/<int:pid>")
def get_product(pid: int):
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Not found"}), 404
    include_cost = False
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid is not None:
            u = User.query.get(int(uid))
            if u and u.role == "admin":
                include_cost = True
    except Exception:  # noqa: BLE001
        include_cost = False
    return jsonify(product_to_dict(p, include_cost=include_cost)), 200


@bp.post("")
@jwt_required()
@admin_required
def create_product():
    data = request.get_json() or {}
    required = ["category_id", "name", "description", "price", "stock", "cost_price", "selling_price"]
    if any(data.get(k) is None for k in required):
        return jsonify({"message": "Missing fields"}), 400
    cost = Decimal(str(data["cost_price"]))
    sell = Decimal(str(data["selling_price"]))
    margin = calc_profit_margin(cost, sell)
    p = Product(
        category_id=int(data["category_id"]),
        name=data["name"],
        description=data["description"],
        price=Decimal(str(data["price"])),
        stock=int(data["stock"]),
        cost_price=cost,
        selling_price=sell,
        profit_margin=margin,
        image=data.get("image"),
        rating=Decimal(str(data.get("rating") or 0)),
        total_reviews=int(data.get("total_reviews") or 0),
        featured=bool(data.get("featured")),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(product_to_dict(p, include_cost=True)), 201


@bp.put("/<int:pid>")
@jwt_required()
@admin_required
def update_product(pid: int):
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Not found"}), 404
    data = request.get_json() or {}
    if "category_id" in data:
        p.category_id = int(data["category_id"])
    if "name" in data:
        p.name = data["name"]
    if "description" in data:
        p.description = data["description"]
    if "price" in data:
        p.price = Decimal(str(data["price"]))
    if "stock" in data:
        p.stock = int(data["stock"])
    if "cost_price" in data:
        p.cost_price = Decimal(str(data["cost_price"]))
    if "selling_price" in data:
        p.selling_price = Decimal(str(data["selling_price"]))
    if "image" in data:
        p.image = data["image"]
    if "featured" in data:
        p.featured = bool(data["featured"])
    if "rating" in data:
        p.rating = Decimal(str(data["rating"]))
    if "total_reviews" in data:
        p.total_reviews = int(data["total_reviews"])
    p.profit_margin = calc_profit_margin(Decimal(str(p.cost_price)), Decimal(str(p.selling_price)))
    db.session.commit()
    return jsonify(product_to_dict(p, include_cost=True)), 200


@bp.delete("/<int:pid>")
@jwt_required()
@admin_required
def delete_product(pid: int):
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Not found"}), 404
    try:
        db.session.delete(p)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(
            {
                "message": "Cannot delete this product because it is linked to past orders. "
                "Set stock to 0 or hide it instead."
            }
        ), 409
    return jsonify({"message": "Deleted"}), 200
