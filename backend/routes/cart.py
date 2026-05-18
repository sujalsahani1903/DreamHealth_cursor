from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Cart, Product, ProductVariant
from utils.serializers import product_to_dict
from utils.serializers import variant_to_dict
from utils.variants import resolve_variant

bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _cart_item_dict(entry: Cart):
    p = entry.product
    v = entry.variant
    unit = float(v.selling_price) if v else float(p.selling_price)
    return {
        "id": entry.id,
        "quantity": entry.quantity,
        "unit_price": unit,
        "line_total": unit * entry.quantity,
        "variant": variant_to_dict(v) if v else None,
        "product": product_to_dict(p, include_variants=False),
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
    vid = data.get("variant_id")
    vid = int(vid) if vid is not None and vid != "" else None
    qty = int(data.get("quantity") or 1)
    if qty < 1:
        return jsonify({"message": "Invalid quantity"}), 400
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Product not found"}), 404

    variant = resolve_variant(p, vid)
    if p.variants and not variant:
        return jsonify({"message": "Please select a pack size"}), 400

    if variant:
        if variant.stock < qty:
            return jsonify({"message": f"Insufficient stock for {p.name} ({variant.label})"}), 400
        row = Cart.query.filter_by(user_id=uid, variant_id=variant.id).first()
        if row:
            new_q = row.quantity + qty
            if variant.stock < new_q:
                return jsonify({"message": "Insufficient stock"}), 400
            row.quantity = new_q
        else:
            row = Cart(user_id=uid, product_id=p.id, variant_id=variant.id, quantity=qty)
            db.session.add(row)
    else:
        if p.stock < qty:
            return jsonify({"message": "Insufficient stock"}), 400
        return jsonify({"message": "This product has no pack sizes configured"}), 400

    db.session.commit()
    return jsonify(_cart_item_dict(row)), 201


@bp.post("/buy-now")
@jwt_required()
def buy_now():
    """Replace cart with one item and go to checkout (Flipkart-style buy now)."""
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    pid = int(data.get("product_id") or 0)
    vid = data.get("variant_id")
    vid = int(vid) if vid is not None and vid != "" else None
    qty = int(data.get("quantity") or 1)
    if qty < 1:
        return jsonify({"message": "Invalid quantity"}), 400
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Product not found"}), 404
    variant = resolve_variant(p, vid)
    if p.variants and not variant:
        return jsonify({"message": "Please select a pack size"}), 400
    if not variant:
        return jsonify({"message": "This product has no pack sizes configured"}), 400
    if variant.stock < qty:
        return jsonify({"message": f"Insufficient stock for {p.name} ({variant.label})"}), 400
    Cart.query.filter_by(user_id=uid).delete()
    row = Cart(user_id=uid, product_id=p.id, variant_id=variant.id, quantity=qty)
    db.session.add(row)
    db.session.commit()
    return jsonify(_cart_item_dict(row)), 200


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
    stock = row.variant.stock if row.variant else row.product.stock
    if stock < qty:
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
