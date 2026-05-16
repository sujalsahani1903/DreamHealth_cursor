from decimal import Decimal

import stripe
from flask import Blueprint, current_app, jsonify, redirect, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Order, User
from routes.orders import fulfill_paid_order

bp = Blueprint("payment", __name__, url_prefix="/api/payment")


@bp.post("/create-checkout-session")
@jwt_required()
def create_checkout_session():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    order_id = int(data.get("order_id") or 0)
    order = Order.query.filter_by(id=order_id, user_id=uid).first()
    if not order:
        return jsonify({"message": "Order not found"}), 404
    if order.payment_status != "pending":
        return jsonify({"message": "Order not payable"}), 400

    stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        return jsonify({"message": "Stripe not configured"}), 503

    line_items = []
    for item in order.items:
        p = item.product
        line_items.append(
            {
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": p.name, "images": [p.image] if p.image else []},
                    "unit_amount": int(Decimal(str(item.price)) * 100),
                },
                "quantity": item.quantity,
            }
        )

    frontend = current_app.config.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    success_url = f"{frontend}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend}/checkout/cancel?order_id={order.id}"

    user = User.query.get(uid)
    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=user.email if user else None,
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": str(order.id), "user_id": str(uid)},
    )
    order.stripe_session_id = session.id
    db.session.commit()
    return jsonify({"url": session.url, "session_id": session.id}), 200


@bp.post("/webhook")
def webhook_received():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature", "")
    wh_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET")
    stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if not wh_secret or not stripe.api_key:
        return jsonify({"message": "Stripe webhook not configured"}), 503
    try:
        event = stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=wh_secret)
    except ValueError:
        return jsonify({"message": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:  # type: ignore[attr-defined]
        return jsonify({"message": "Invalid signature"}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = int(session["metadata"].get("order_id", 0))
        fulfill_paid_order(order_id, session)

    return jsonify({"received": True}), 200


@bp.get("/success")
def payment_success():
    session_id = request.args.get("session_id")
    frontend = current_app.config.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if not session_id:
        return redirect(f"{frontend}/checkout/success")
    stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if stripe.api_key:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            oid = session["metadata"].get("order_id")
            return redirect(f"{frontend}/checkout/success?order_id={oid}&session_id={session_id}")
        except Exception:  # noqa: BLE001
            pass
    return redirect(f"{frontend}/checkout/success")


@bp.get("/cancel")
def payment_cancel():
    frontend = current_app.config.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    oid = request.args.get("order_id", "")
    return redirect(f"{frontend}/checkout/cancel?order_id={oid}")
