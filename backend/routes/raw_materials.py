from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from extensions import db
from middleware.auth import admin_required
from models import RawMaterial

bp = Blueprint("raw_materials", __name__, url_prefix="/api/raw-materials")


@bp.post("/add")
@jwt_required()
@admin_required
def add_raw():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "name required"}), 400
    r = RawMaterial(
        name=name,
        supplier=data.get("supplier"),
        quantity=data.get("quantity") or 0,
        purchase_price=data.get("purchase_price") or 0,
        purchase_date=date.fromisoformat(data["purchase_date"]) if data.get("purchase_date") else None,
        remaining_stock=data.get("remaining_stock") if data.get("remaining_stock") is not None else data.get("quantity") or 0,
    )
    db.session.add(r)
    db.session.commit()
    return jsonify({"id": r.id}), 201


@bp.get("")
@jwt_required()
@admin_required
def list_raw():
    rows = RawMaterial.query.order_by(RawMaterial.id.desc()).all()
    return jsonify(
        [
            {
                "id": r.id,
                "name": r.name,
                "supplier": r.supplier,
                "quantity": float(r.quantity),
                "purchase_price": float(r.purchase_price),
                "purchase_date": r.purchase_date.isoformat() if r.purchase_date else None,
                "remaining_stock": float(r.remaining_stock),
            }
            for r in rows
        ]
    ), 200


@bp.put("/update/<int:rid>")
@jwt_required()
@admin_required
def update_raw(rid: int):
    r = RawMaterial.query.get(rid)
    if not r:
        return jsonify({"message": "Not found"}), 404
    data = request.get_json() or {}
    for f in ["name", "supplier", "quantity", "purchase_price", "remaining_stock"]:
        if f in data:
            setattr(r, f, data[f])
    if "purchase_date" in data and data["purchase_date"]:
        r.purchase_date = date.fromisoformat(data["purchase_date"])
    db.session.commit()
    return jsonify({"message": "Updated"}), 200
