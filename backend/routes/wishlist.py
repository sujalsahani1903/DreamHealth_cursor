from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Product, Wishlist
from utils.serializers import product_to_dict

bp = Blueprint("wishlist", __name__, url_prefix="/api/wishlist")


@bp.get("")
@jwt_required()
def list_wishlist():
    uid = int(get_jwt_identity())
    rows = Wishlist.query.filter_by(user_id=uid).all()
    return jsonify(
        [
            {
                "id": w.id,
                "created_at": w.created_at.isoformat() if w.created_at else None,
                "product": product_to_dict(w.product),
            }
            for w in rows
        ]
    ), 200


@bp.post("/add/<int:pid>")
@jwt_required()
def add_wishlist(pid: int):
    uid = int(get_jwt_identity())
    if not Product.query.get(pid):
        return jsonify({"message": "Product not found"}), 404
    if Wishlist.query.filter_by(user_id=uid, product_id=pid).first():
        return jsonify({"message": "Already in wishlist"}), 200
    w = Wishlist(user_id=uid, product_id=pid)
    db.session.add(w)
    db.session.commit()
    return jsonify({"id": w.id}), 201


@bp.delete("/remove/<int:wid>")
@jwt_required()
def remove_wishlist(wid: int):
    uid = int(get_jwt_identity())
    w = Wishlist.query.filter_by(id=wid, user_id=uid).first()
    if not w:
        return jsonify({"message": "Not found"}), 404
    db.session.delete(w)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200
