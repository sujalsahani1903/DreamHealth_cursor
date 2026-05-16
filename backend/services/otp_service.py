import random
import string
from datetime import datetime, timedelta
from typing import Optional

from extensions import bcrypt, db
from models import EmailOTP


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def hash_otp(plain: str) -> str:
    return bcrypt.generate_password_hash(plain).decode("utf-8")


def verify_otp(plain: str, hashed: str) -> bool:
    return bcrypt.check_password_hash(hashed, plain)


def create_otp_record(user_id, email: str, purpose: str, expiry_minutes: int):
    plain = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    row = EmailOTP(
        user_id=user_id,
        email=email.lower().strip(),
        otp=hash_otp(plain),
        purpose=purpose,
        expires_at=expires_at,
        verified=False,
    )
    db.session.add(row)
    db.session.commit()
    return plain, row


def validate_latest_otp(email: str, purpose: str, plain_otp: str) -> Optional[EmailOTP]:
    email_l = email.lower().strip()
    row = (
        EmailOTP.query.filter_by(email=email_l, purpose=purpose, verified=False)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )
    if not row or row.expires_at < datetime.utcnow():
        return None
    if not verify_otp(plain_otp, row.otp):
        return None
    return row


def mark_otp_used(row: EmailOTP):
    row.verified = True
    db.session.commit()
