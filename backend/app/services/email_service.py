"""
Email notification service using aiosmtplib.
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import asyncio


async def send_email(to: str, subject: str, html_body: str):
    """Send an HTML email asynchronously."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Skip in dev if not configured
        print(f"[EMAIL SKIP] To: {to} | Subject: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


async def notify_owner_approved(owner_email: str, owner_name: str):
    html = f"""
    <h2>Congratulations, {owner_name}!</h2>
    <p>Your owner account has been approved. You can now log in and start listing properties.</p>
    <a href="{settings.FRONTEND_URL}/login" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Login Now</a>
    """
    await send_email(owner_email, "Your Account is Approved! 🎉", html)


async def notify_owner_new_inquiry(owner_email: str, owner_name: str, property_title: str, user_name: str):
    html = f"""
    <h2>New Inquiry, {owner_name}!</h2>
    <p><strong>{user_name}</strong> has sent you a message about your property: <strong>{property_title}</strong>.</p>
    <a href="{settings.FRONTEND_URL}/owner/inquiries" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View Inquiry</a>
    """
    await send_email(owner_email, f"New Inquiry for {property_title}", html)
