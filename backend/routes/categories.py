from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from middleware.auth import admin_required
from models import Category

bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@bp.get("")
def list_categories():
    rows = Category.query.order_by(Category.name).all()
    return jsonify([{"id": c.id, "name": c.name, "image": c.image} for c in rows]), 200


@bp.post("")
@jwt_required()
@admin_required
def create_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "name required"}), 400
    if Category.query.filter_by(name=name).first():
        return jsonify({"message": "Category exists"}), 409
    c = Category(name=name, image=data.get("image"))
    db.session.add(c)
    db.session.commit()
    return jsonify({"id": c.id, "name": c.name, "image": c.image}), 201
