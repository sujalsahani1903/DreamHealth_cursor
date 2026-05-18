from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import and_, func

from extensions import db
from models import Order, OrderItem, Product, Review, User

bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


def _recalc_product_rating(product_id: int):
    p = Product.query.get(product_id)
    if not p:
        return
    agg = db.session.query(func.avg(Review.rating), func.count(Review.id)).filter(
        Review.product_id == product_id
    ).one()
    avg, cnt = agg[0] or 0, agg[1] or 0
    p.rating = round(float(avg), 2) if cnt else 0
    p.total_reviews = int(cnt)


@bp.post("/add")
@jwt_required()
def add_review():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    pid = int(data.get("product_id") or 0)
    oid = int(data.get("order_id") or 0)
    rating = int(data.get("rating") or 0)
    feedback = (data.get("feedback") or "").strip()
    if not (pid and oid and 1 <= rating <= 5 and feedback):
        return jsonify({"message": "product_id, order_id, rating 1-5, feedback required"}), 400

    order = Order.query.filter_by(id=oid, user_id=uid).first()
    if not order:
        return jsonify({"message": "Invalid order"}), 400
    if order.order_status == "cancelled":
        return jsonify({"message": "Cannot review a cancelled order"}), 400
    if order.payment_status != "paid" and order.payment_method != "cod":
        return jsonify({"message": "Order must be placed before reviewing"}), 400
    if order.payment_method == "cod" and order.order_status == "pending":
        return jsonify({"message": "Order not confirmed yet"}), 400

    purchased = OrderItem.query.filter(and_(OrderItem.order_id == oid, OrderItem.product_id == pid)).first()
    if not purchased:
        return jsonify({"message": "You can only review purchased products"}), 403

    if Review.query.filter_by(user_id=uid, product_id=pid, order_id=oid).first():
        return jsonify({"message": "Already reviewed for this order"}), 409

    r = Review(user_id=uid, product_id=pid, order_id=oid, rating=rating, feedback=feedback)
    db.session.add(r)
    db.session.commit()
    _recalc_product_rating(pid)
    db.session.commit()
    return jsonify({"id": r.id, "message": "Review added"}), 201


@bp.get("/product/<int:pid>")
def product_reviews(pid: int):
    rows = Review.query.filter_by(product_id=pid).order_by(Review.created_at.desc()).all()
    out = []
    for r in rows:
        u = r.user
        out.append(
            {
                "id": r.id,
                "rating": r.rating,
                "feedback": r.feedback,
                "admin_reply": r.admin_reply,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "user": {"name": u.name},
            }
        )
    return jsonify(out), 200


@bp.delete("/<int:rid>")
@jwt_required()
def delete_review(rid: int):
    uid = int(get_jwt_identity())
    r = Review.query.get(rid)
    if not r:
        return jsonify({"message": "Not found"}), 404
    user = User.query.get(uid)
    if r.user_id != uid and (not user or user.role != "admin"):
        return jsonify({"message": "Forbidden"}), 403
    pid = r.product_id
    db.session.delete(r)
    db.session.commit()
    _recalc_product_rating(pid)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
