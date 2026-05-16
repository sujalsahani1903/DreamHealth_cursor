import re
from datetime import timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import func

from extensions import bcrypt, db, limiter
from models import Address, User
from services.email_service import send_otp_email
from services.otp_service import create_otp_record, mark_otp_used, validate_latest_otp
from utils.serializers import user_public

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""))


@bp.post("/signup")
@limiter.limit("10 per hour")
def signup():
    data = request.get_json() or {}
    name = (data.get("full_name") or data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    confirm = data.get("confirm_password") or ""
    role = (data.get("role") or "user").strip()

    if not all([name, email, phone, password, confirm]):
        return jsonify({"message": "All fields are required"}), 400
    if password != confirm:
        return jsonify({"message": "Passwords do not match"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400
    if not _valid_email(email):
        return jsonify({"message": "Invalid email"}), 400
    if role not in ("user", "admin"):
        return jsonify({"message": "Invalid role"}), 400
    if role == "admin" and not current_app.config.get("ALLOW_PUBLIC_ADMIN"):
        role = "user"

    existing = User.query.filter(func.lower(User.email) == email).first()
    if existing and existing.is_verified:
        return jsonify({"message": "Email already registered"}), 409

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    if existing:
        existing.name = name
        existing.phone = phone
        existing.password = pw_hash
        existing.role = role
        existing.is_verified = False
        user = existing
    else:
        user = User(
            name=name,
            email=email,
            phone=phone,
            password=pw_hash,
            role=role,
            is_verified=False,
        )
        db.session.add(user)
    db.session.commit()

    plain, _ = create_otp_record(
        user.id,
        email,
        "signup",
        current_app.config.get("OTP_EXPIRY_MINUTES", 10),
    )
    try:
        send_otp_email(email, plain, "signup")
    except Exception as exc:  # noqa: BLE001
        current_app.logger.exception(exc)
        return jsonify({"message": "Account created but email failed. Use resend OTP."}), 201

    return jsonify({"message": "Signup successful. Verify OTP sent to your email.", "email": email}), 201


@bp.post("/send-otp")
@limiter.limit("5 per 15 minutes")
def send_otp():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    purpose = (data.get("purpose") or "").strip()
    if purpose not in ("signup", "forgot_password"):
        return jsonify({"message": "Invalid purpose"}), 400
    if not _valid_email(email):
        return jsonify({"message": "Invalid email"}), 400

    user = User.query.filter(func.lower(User.email) == email).first()
    if purpose == "signup" and not user:
        return jsonify({"message": "No signup found for this email"}), 404
    if purpose == "forgot_password" and not user:
        return jsonify({"message": "User not found"}), 404
    if purpose == "signup" and user and user.is_verified:
        return jsonify({"message": "Already verified"}), 400

    uid = user.id if user else None
    plain, _ = create_otp_record(
        uid,
        email,
        purpose,
        current_app.config.get("OTP_EXPIRY_MINUTES", 10),
    )
    try:
        send_otp_email(email, plain, purpose)
    except Exception as exc:  # noqa: BLE001
        current_app.logger.exception(exc)
        return jsonify({"message": "Could not send email"}), 502
    return jsonify({"message": "OTP sent"}), 200


@bp.post("/verify-otp")
@limiter.limit("30 per hour")
def verify_otp():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    otp = (data.get("otp") or "").strip()
    purpose = (data.get("purpose") or "").strip()
    if not all([email, otp, purpose]):
        return jsonify({"message": "email, otp, and purpose required"}), 400
    if purpose not in ("signup", "forgot_password"):
        return jsonify({"message": "Invalid purpose"}), 400
    row = validate_latest_otp(email, purpose, otp)
    if not row:
        return jsonify({"message": "Invalid or expired OTP"}), 400

    user = User.query.filter(func.lower(User.email) == email).first()
    if purpose == "signup":
        if not user:
            return jsonify({"message": "User not found"}), 404
        user.is_verified = True
        mark_otp_used(row)
        db.session.commit()
        return jsonify({"message": "Email verified. You can log in."}), 200

    if purpose == "forgot_password":
        if not user:
            return jsonify({"message": "User not found"}), 404
        mark_otp_used(row)
        db.session.commit()
        reset_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(minutes=20),
            additional_claims={"type": "password_reset"},
        )
        return jsonify({"reset_token": reset_token}), 200

    return jsonify({"message": "Invalid purpose"}), 400


@bp.post("/login")
@limiter.limit("20 per hour")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter(func.lower(User.email) == email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401
    if not user.is_verified:
        return jsonify({"message": "Please verify your email first (complete signup verification)", "requires_verification": True}), 403

    access = create_access_token(identity=str(user.id), fresh=True)
    refresh = create_refresh_token(identity=str(user.id))
    return jsonify({"access_token": access, "refresh_token": refresh, "user": user_public(user)}), 200


@bp.post("/refresh")
def refresh():
    data = request.get_json() or {}
    token = data.get("refresh_token")
    if not token:
        return jsonify({"message": "refresh_token required"}), 400
    from flask_jwt_extended import decode_token

    try:
        decoded = decode_token(token)
    except Exception:  # noqa: BLE001
        return jsonify({"message": "Invalid refresh token"}), 401
    if decoded.get("type") != "refresh":
        return jsonify({"message": "Invalid token type"}), 401
    uid = decoded.get("sub")
    user = User.query.get(int(uid))
    if not user:
        return jsonify({"message": "User not found"}), 401
    access = create_access_token(identity=str(user.id), fresh=False)
    return jsonify({"access_token": access}), 200


@bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"message": "Logged out"}), 200


@bp.post("/forgot-password")
@limiter.limit("5 per hour")
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter(func.lower(User.email) == email).first()
    if not user:
        return jsonify({"message": "If the account exists, an OTP will be sent"}), 200
    plain, _ = create_otp_record(
        user.id,
        email,
        "forgot_password",
        current_app.config.get("OTP_EXPIRY_MINUTES", 10),
    )
    try:
        send_otp_email(email, plain, "forgot_password")
    except Exception as exc:  # noqa: BLE001
        current_app.logger.exception(exc)
        return jsonify({"message": "Could not send email"}), 502
    return jsonify({"message": "OTP sent"}), 200


@bp.post("/reset-password")
@limiter.limit("10 per hour")
def reset_password():
    data = request.get_json() or {}
    reset_token = data.get("reset_token")
    new_password = data.get("new_password") or ""
    confirm = data.get("confirm_password") or ""
    if not reset_token or not new_password:
        return jsonify({"message": "reset_token and new_password required"}), 400
    if new_password != confirm:
        return jsonify({"message": "Passwords do not match"}), 400
    if len(new_password) < 8:
        return jsonify({"message": "Password too short"}), 400
    from flask_jwt_extended import decode_token

    try:
        decoded = decode_token(reset_token)
    except Exception:  # noqa: BLE001
        return jsonify({"message": "Invalid reset token"}), 401
    if decoded.get("type") != "password_reset":
        return jsonify({"message": "Invalid token"}), 401
    uid = int(decoded["sub"])
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "User not found"}), 404
    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return jsonify({"message": "Password updated"}), 200


@bp.get("/profile")
@jwt_required()
def profile():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "Not found"}), 404
    return jsonify(user_public(user)), 200


@bp.put("/profile")
@jwt_required()
def update_profile():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "Not found"}), 404
    data = request.get_json() or {}
    if "name" in data:
        user.name = (data.get("name") or "").strip() or user.name
    if "phone" in data:
        user.phone = (data.get("phone") or "").strip() or user.phone
    if "profile_image" in data:
        user.profile_image = data.get("profile_image")
    if data.get("new_password"):
        if not data.get("current_password"):
            return jsonify({"message": "current_password required"}), 400
        if not bcrypt.check_password_hash(user.password, data["current_password"]):
            return jsonify({"message": "Current password incorrect"}), 400
        user.password = bcrypt.generate_password_hash(data["new_password"]).decode("utf-8")
    db.session.commit()
    return jsonify(user_public(user)), 200


@bp.get("/addresses")
@jwt_required()
def list_addresses():
    uid = int(get_jwt_identity())
    rows = Address.query.filter_by(user_id=uid).all()
    return jsonify(
        [
            {
                "id": a.id,
                "address_line": a.address_line,
                "city": a.city,
                "state": a.state,
                "pincode": a.pincode,
                "country": a.country,
            }
            for a in rows
        ]
    ), 200


@bp.post("/addresses")
@jwt_required()
def add_address():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    required = ["address_line", "city", "state", "pincode", "country"]
    if any(not data.get(f) for f in required):
        return jsonify({"message": "All address fields required"}), 400
    a = Address(
        user_id=uid,
        address_line=data["address_line"],
        city=data["city"],
        state=data["state"],
        pincode=data["pincode"],
        country=data["country"],
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({"id": a.id, "message": "Saved"}), 201


@bp.put("/addresses/<int:aid>")
@jwt_required()
def update_address(aid: int):
    uid = int(get_jwt_identity())
    a = Address.query.filter_by(id=aid, user_id=uid).first()
    if not a:
        return jsonify({"message": "Not found"}), 404
    data = request.get_json() or {}
    for f in ["address_line", "city", "state", "pincode", "country"]:
        if f in data:
            setattr(a, f, data[f])
    db.session.commit()
    return jsonify({"message": "Updated"}), 200


@bp.delete("/addresses/<int:aid>")
@jwt_required()
def delete_address(aid: int):
    uid = int(get_jwt_identity())
    a = Address.query.filter_by(id=aid, user_id=uid).first()
    if not a:
        return jsonify({"message": "Not found"}), 404
    db.session.delete(a)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
