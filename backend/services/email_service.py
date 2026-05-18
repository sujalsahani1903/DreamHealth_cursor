import requests
from flask import current_app
from flask_mail import Message

from extensions import mail


def _send_via_resend(subject: str, html_body: str, recipients: list[str]) -> bool:
    """Returns True if Resend accepted the send, False otherwise."""
    cfg = current_app.config
    api_key = cfg.get("RESEND_API_KEY")
    if not api_key:
        return False

    from_addr = cfg.get("MAIL_DEFAULT_SENDER") or "Dream Health <onboarding@resend.dev>"
    r = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_addr,
            "to": recipients,
            "subject": subject,
            "html": html_body,
        },
        timeout=20,
    )
    if r.status_code >= 400:
        current_app.logger.error("Resend error: %s %s", r.status_code, r.text)
        return False
    return True


def send_email_smtp(subject: str, html_body: str, recipients: list[str]) -> None:
    cfg = current_app.config
    if not cfg.get("MAIL_USERNAME"):
        current_app.logger.warning("SMTP not configured (MAIL_USERNAME missing) — email skipped")
        raise RuntimeError("Email not configured. Set MAIL_USERNAME and MAIL_PASSWORD in .env")

    sender = cfg.get("MAIL_DEFAULT_SENDER") or cfg.get("MAIL_USERNAME")
    msg = Message(subject=subject, recipients=recipients, html=html_body, sender=sender)
    mail.send(msg)


def send_email(subject: str, html_body: str, recipients: list[str]) -> None:
    """
    Send email using Resend and/or Gmail SMTP.

    EMAIL_PROVIDER in .env:
      - smtp   → Gmail/SMTP only (recommended for sending to any user)
      - resend → Resend only
      - auto   → try Resend first, then SMTP if Resend fails (default)
    """
    cfg = current_app.config
    provider = (cfg.get("EMAIL_PROVIDER") or "auto").lower().strip()

    if provider == "smtp":
        send_email_smtp(subject, html_body, recipients)
        return

    if provider == "resend":
        if not _send_via_resend(subject, html_body, recipients):
            raise RuntimeError("Failed to send email via Resend")
        return

    # auto: Resend then SMTP fallback (fixes Resend test-mode 403 for other recipients)
    if cfg.get("RESEND_API_KEY"):
        if _send_via_resend(subject, html_body, recipients):
            return
        current_app.logger.warning("Resend failed — falling back to SMTP for %s", recipients)

    send_email_smtp(subject, html_body, recipients)


def send_otp_email(to_email: str, otp: str, purpose: str) -> None:
    titles = {
        "signup": "Verify your Dream Health Foods account",
        "login": "Your login verification code",
        "forgot_password": "Reset your password — verification code",
    }
    subject = titles.get(purpose, "Your verification code")
    html = f"""
    <div style="font-family:Georgia,serif;background:#f6f3ea;padding:24px;">
      <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2dfd7;">
        <h2 style="color:#1B4D3E;margin-top:0;">Dream Health Foods</h2>
        <p style="color:#3d3a36;">Your one-time code is:</p>
        <p style="font-size:32px;letter-spacing:6px;font-weight:700;color:#C9A227;">{otp}</p>
        <p style="color:#6b6560;font-size:14px;">This code expires in {current_app.config.get('OTP_EXPIRY_MINUTES', 10)} minutes.
        If you did not request this, you can ignore this email.</p>
      </div>
    </div>
    """
    send_email(subject, html, [to_email])


def send_order_confirmation(to_email: str, name: str, order_id: int, total: str) -> None:
    subject = f"Order #{order_id} confirmed — Dream Health Foods"
    html = f"""
    <div style="font-family:Georgia,serif;background:#f6f3ea;padding:24px;">
      <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:28px;">
        <h2 style="color:#1B4D3E;">Thank you, {name}!</h2>
        <p>Your order <strong>#{order_id}</strong> is confirmed.</p>
        <p>Total paid: <strong>₹{total}</strong></p>
        <p style="color:#6b6560;">Healthy grains for healthy life — Dream Health Foods.</p>
      </div>
    </div>
    """
    send_email(subject, html, [to_email])
