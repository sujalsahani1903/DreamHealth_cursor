from decimal import Decimal

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from middleware.auth import admin_required
from models import Address, Cart, Order, OrderItem, Product, Transaction, User
from services.email_service import send_order_confirmation
from utils.inventory import log_inventory, sync_stock_alert

bp = Blueprint("orders", __name__, url_prefix="/api/orders")


def _format_address(a: Address) -> str:
    return f"{a.address_line}, {a.city}, {a.state} {a.pincode}, {a.country}"


@bp.post("")
@jwt_required()
def create_order():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    address_id = data.get("address_id")
    shipping_text = data.get("shipping_address")
    if address_id:
        addr = Address.query.filter_by(id=int(address_id), user_id=uid).first()
        if not addr:
            return jsonify({"message": "Address not found"}), 404
        shipping_text = _format_address(addr)
    if not shipping_text:
        return jsonify({"message": "shipping_address or address_id required"}), 400

    cart_rows = Cart.query.filter_by(user_id=uid).all()
    if not cart_rows:
        return jsonify({"message": "Cart is empty"}), 400

    total = Decimal("0")
    line_items = []
    for c in cart_rows:
        p = c.product
        if p.stock < c.quantity:
            return jsonify({"message": f"Insufficient stock for {p.name}"}), 400
        price = Decimal(str(p.selling_price))
        total += price * c.quantity
        line_items.append((p, c.quantity, price))

    order = Order(
        user_id=uid,
        total_amount=total,
        payment_status="pending",
        payment_method="stripe",
        order_status="pending",
        shipping_address=shipping_text,
    )
    db.session.add(order)
    db.session.flush()

    for p, qty, price in line_items:
        oi = OrderItem(order_id=order.id, product_id=p.id, quantity=qty, price=price)
        db.session.add(oi)

    db.session.commit()
    return jsonify({"order_id": order.id, "total_amount": float(total), "message": "Order created"}), 201


@bp.get("/my-orders")
@jwt_required()
def my_orders():
    uid = int(get_jwt_identity())
    rows = Order.query.filter_by(user_id=uid).order_by(Order.created_at.desc()).all()
    out = []
    for o in rows:
        out.append(
            {
                "id": o.id,
                "total_amount": float(o.total_amount),
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "items": [
                    {
                        "product_id": i.product_id,
                        "name": i.product.name,
                        "quantity": i.quantity,
                        "price": float(i.price),
                    }
                    for i in o.items
                ],
            }
        )
    return jsonify(out), 200


@bp.get("/<int:oid>/invoice")
@jwt_required()
def invoice(oid: int):
    uid = int(get_jwt_identity())
    o = Order.query.get(oid)
    if not o or o.user_id != uid:
        return jsonify({"message": "Not found"}), 404
    user = User.query.get(uid)
    return jsonify(
        {
            "business": {
                "name": "Dream Health Foods",
                "tagline": "Healthy Grains For Healthy Life",
                "address": "Eastern By Pass, Bangla Bazar, Beside Bhaktinagar P.S., Siliguri-734001",
                "phones": ["+91 7719180111", "9907278300"],
            },
            "order": {
                "id": o.id,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "shipping_address": o.shipping_address,
                "total_amount": float(o.total_amount),
                "items": [
                    {
                        "name": i.product.name,
                        "quantity": i.quantity,
                        "unit_price": float(i.price),
                        "line_total": float(Decimal(i.price) * i.quantity),
                    }
                    for i in o.items
                ],
            },
            "customer": {"name": user.name, "email": user.email, "phone": user.phone},
        }
    ), 200


@bp.get("/all-orders")
@jwt_required()
@admin_required
def all_orders():
    rows = Order.query.order_by(Order.created_at.desc()).limit(500).all()
    out = []
    for o in rows:
        u = o.user
        out.append(
            {
                "id": o.id,
                "user": {"id": u.id, "name": u.name, "email": u.email},
                "total_amount": float(o.total_amount),
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
        )
    return jsonify(out), 200


def fulfill_paid_order(order_id: int, session):
    """Called from Stripe webhook."""
    order = Order.query.get(order_id)
    if not order or order.payment_status == "paid":
        return
    order.payment_status = "paid"
    order.order_status = "processing"
    order.stripe_session_id = session.get("id")
    user = User.query.get(order.user_id)

    amount_total = session.get("amount_total", 0) or 0
    tr = Transaction(
        order_id=order.id,
        stripe_payment_intent=session.get("payment_intent"),
        stripe_charge_id=None,
        receipt_url=None,
        amount=Decimal(str(amount_total)) / Decimal("100") if amount_total else order.total_amount,
        payment_status="paid",
    )
    db.session.add(tr)

    for item in order.items:
        p = item.product
        prev = p.stock
        p.stock = prev - item.quantity
        log_inventory(p.id, "sale", item.quantity, prev, p.stock)
        sync_stock_alert(p)

    Cart.query.filter_by(user_id=order.user_id).delete()
    db.session.commit()
    try:
        send_order_confirmation(user.email, user.name, order.id, str(order.total_amount))
    except Exception as exc:  # noqa: BLE001
        current_app.logger.exception(exc)
