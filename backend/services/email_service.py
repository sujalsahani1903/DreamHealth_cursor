import requests
from flask import current_app
from flask_mail import Message

from extensions import mail


def send_email(subject: str, html_body: str, recipients: list[str]):
    cfg = current_app.config
    if cfg.get("RESEND_API_KEY"):
        r = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {cfg['RESEND_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={
                "from": cfg.get("MAIL_DEFAULT_SENDER") or "Dream Health <onboarding@resend.dev>",
                "to": recipients,
                "subject": subject,
                "html": html_body,
            },
            timeout=20,
        )
        if r.status_code >= 400:
            current_app.logger.error("Resend error: %s %s", r.status_code, r.text)
            raise RuntimeError("Failed to send email via Resend")
        return

    if not cfg.get("MAIL_USERNAME"):
        current_app.logger.warning("No RESEND_API_KEY or MAIL_USERNAME — email skipped (dev)")
        return

    msg = Message(subject=subject, recipients=recipients, html=html_body)
    mail.send(msg)


def send_otp_email(to_email: str, otp: str, purpose: str):
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


def send_order_confirmation(to_email: str, name: str, order_id: int, total: str):
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
