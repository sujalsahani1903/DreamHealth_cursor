from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Cart, Product
from utils.serializers import product_to_dict

bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _cart_item_dict(entry: Cart):
    p = entry.product
    return {
        "id": entry.id,
        "quantity": entry.quantity,
        "product": product_to_dict(p),
    }


@bp.get("")
@jwt_required()
def get_cart():
    uid = int(get_jwt_identity())
    rows = Cart.query.filter_by(user_id=uid).all()
    return jsonify([_cart_item_dict(r) for r in rows]), 200


@bp.post("/add")
@jwt_required()
def add_cart():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    pid = int(data.get("product_id") or 0)
    qty = int(data.get("quantity") or 1)
    if qty < 1:
        return jsonify({"message": "Invalid quantity"}), 400
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Product not found"}), 404
    if p.stock < qty:
        return jsonify({"message": "Insufficient stock"}), 400
    row = Cart.query.filter_by(user_id=uid, product_id=pid).first()
    if row:
        new_q = row.quantity + qty
        if p.stock < new_q:
            return jsonify({"message": "Insufficient stock"}), 400
        row.quantity = new_q
    else:
        row = Cart(user_id=uid, product_id=pid, quantity=qty)
        db.session.add(row)
    db.session.commit()
    return jsonify(_cart_item_dict(row)), 201


@bp.put("/update/<int:cid>")
@jwt_required()
def update_cart(cid: int):
    uid = int(get_jwt_identity())
    row = Cart.query.filter_by(id=cid, user_id=uid).first()
    if not row:
        return jsonify({"message": "Not found"}), 404
    qty = int((request.get_json() or {}).get("quantity") or 1)
    if qty < 1:
        return jsonify({"message": "Invalid quantity"}), 400
    if row.product.stock < qty:
        return jsonify({"message": "Insufficient stock"}), 400
    row.quantity = qty
    db.session.commit()
    return jsonify(_cart_item_dict(row)), 200


@bp.delete("/remove/<int:cid>")
@jwt_required()
def remove_cart(cid: int):
    uid = int(get_jwt_identity())
    row = Cart.query.filter_by(id=cid, user_id=uid).first()
    if not row:
        return jsonify({"message": "Not found"}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200
