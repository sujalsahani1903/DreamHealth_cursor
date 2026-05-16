from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from extensions import db
from middleware.auth import admin_required
from models import InventoryLog, Product, StockAlert
from utils.inventory import log_inventory, sync_stock_alert
from utils.serializers import product_to_dict

bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


@bp.get("")
@jwt_required()
@admin_required
def list_inventory():
    rows = Product.query.order_by(Product.name).all()
    return jsonify([product_to_dict(p, include_cost=True) for p in rows]), 200


@bp.post("/add-stock")
@jwt_required()
@admin_required
def add_stock():
    data = request.get_json() or {}
    pid = int(data.get("product_id") or 0)
    qty = int(data.get("quantity") or 0)
    if pid <= 0 or qty <= 0:
        return jsonify({"message": "product_id and positive quantity required"}), 400
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Not found"}), 404
    prev = p.stock
    p.stock = prev + qty
    log_inventory(p.id, "add", qty, prev, p.stock)
    sync_stock_alert(p)
    db.session.commit()
    return jsonify({"message": "Stock added", "stock": p.stock}), 200


@bp.put("/update-stock")
@jwt_required()
@admin_required
def update_stock():
    data = request.get_json() or {}
    pid = int(data.get("product_id") or 0)
    new_stock = data.get("new_stock")
    if pid <= 0 or new_stock is None:
        return jsonify({"message": "product_id and new_stock required"}), 400
    new_stock = int(new_stock)
    if new_stock < 0:
        return jsonify({"message": "Invalid stock"}), 400
    p = Product.query.get(pid)
    if not p:
        return jsonify({"message": "Not found"}), 404
    prev = p.stock
    diff = new_stock - prev
    action = "adjust"
    if diff > 0:
        action = "add"
    elif diff < 0:
        action = "subtract"
    p.stock = new_stock
    log_inventory(p.id, action, abs(diff), prev, p.stock)
    sync_stock_alert(p)
    db.session.commit()
    return jsonify({"message": "Updated", "stock": p.stock}), 200


@bp.get("/alerts")
@jwt_required()
@admin_required
def alerts():
    rows = StockAlert.query.filter_by(alert_status="open").all()
    return jsonify(
        [
            {
                "id": a.id,
                "product_id": a.product_id,
                "product_name": a.product.name,
                "current_stock": a.current_stock,
                "threshold_value": a.threshold_value,
                "alert_status": a.alert_status,
            }
            for a in rows
        ]
    ), 200


@bp.get("/logs")
@jwt_required()
@admin_required
def logs():
    rows = InventoryLog.query.order_by(InventoryLog.created_at.desc()).limit(200).all()
    return jsonify(
        [
            {
                "id": r.id,
                "product_id": r.product_id,
                "product_name": r.product.name,
                "action_type": r.action_type,
                "quantity": r.quantity,
                "previous_stock": r.previous_stock,
                "new_stock": r.new_stock,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    ), 200
