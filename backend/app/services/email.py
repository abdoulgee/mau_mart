import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import traceback
import os


def _get_email_provider():
    """Get the configured email provider from AppSettings. Returns 'mailgun' or 'smtp'."""
    try:
        from app.models import AppSettings
        row = AppSettings.query.first()
        if row and row.data:
            return row.data.get('email_provider', 'mailgun')
    except Exception:
        pass
    return 'mailgun'  # Default to mailgun


def _build_otp_html(otp, purpose):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; text-align: center; }}
            .otp-code {{ background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0; }}
            .otp-code span {{ font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; }}
            .footer {{ padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>MAU MART</h1></div>
            <div class="content">
                <h2>{purpose}</h2>
                <p>Use the following code to complete your verification:</p>
                <div class="otp-code"><span>{otp}</span></div>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p style="color: #ef4444; font-size: 13px;">If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer"><p>&copy; MAU MART - Campus Marketplace</p></div>
        </div>
    </body>
    </html>
    """


def _send_via_mailgun(to_email, subject, html, text=None):
    """Send email via Mailgun HTTP API."""
    api_key = os.getenv('MAILGUN_API_KEY')
    domain = os.getenv('MAILGUN_DOMAIN')
    from_email = os.getenv('MAILGUN_FROM_EMAIL', f'noreply@{domain}' if domain else '')
    # Wrap plain email in display name
    if from_email and '@' in from_email and '<' not in from_email:
        from_email = f'MAU MART <{from_email}>'

    if not api_key or not domain:
        print("⚠️  Mailgun not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN missing)")
        return False

    try:
        import requests
        response = requests.post(
            f'https://api.mailgun.net/v3/{domain}/messages',
            auth=('api', api_key),
            data={
                'from': from_email,
                'to': [to_email],
                'subject': subject,
                'text': text or '',
                'html': html,
            },
            timeout=15
        )
        if response.status_code == 200:
            print(f"✅ Mailgun: Email sent to {to_email}")
            return True
        else:
            print(f"❌ Mailgun failed ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ Mailgun error: {e}")
        return False


def _send_via_smtp(to_email, subject, html, text, config=None):
    """Send email via SMTP. Uses provided config or falls back to env/app config."""
    try:
        if config:
            from app.models import SmtpConfig
            if isinstance(config, SmtpConfig):
                server_host = config.server
                server_port = config.port
                username = config.username
                password = config.password
                use_tls = config.use_tls
                from_email = config.from_email
                from_name = config.from_name
            else:
                server_host = config.get('server')
                server_port = config.get('port', 465)
                username = config.get('username')
                password = config.get('password')
                use_tls = config.get('use_tls', False)
                from_email = config.get('from_email')
                from_name = config.get('from_name', '')
            sender = f"{from_name} <{from_email}>" if from_name else from_email
        else:
            server_host = current_app.config.get('MAIL_SERVER')
            username = current_app.config.get('MAIL_USERNAME')
            password = current_app.config.get('MAIL_PASSWORD')
            server_port = current_app.config.get('MAIL_PORT', 465)
            use_tls = current_app.config.get('MAIL_USE_TLS', False)
            sender = current_app.config.get('MAIL_DEFAULT_SENDER', username)

            if not server_host or not username or not password:
                print("⚠️  SMTP not configured.")
                return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = to_email
        msg.attach(MIMEText(text or '', 'plain'))
        msg.attach(MIMEText(html, 'html'))

        is_ssl = int(server_port) == 465
        print(f"🚀 SMTP: {server_host}:{server_port} (SSL: {is_ssl})")

        if is_ssl:
            with smtplib.SMTP_SSL(server_host, int(server_port), timeout=15) as server:
                server.login(username, password)
                server.sendmail(sender, to_email, msg.as_string())
        else:
            with smtplib.SMTP(server_host, int(server_port), timeout=15) as server:
                if use_tls:
                    server.starttls()
                server.login(username, password)
                server.sendmail(sender, to_email, msg.as_string())

        print(f"✅ Email sent via SMTP to {to_email}")
        return True

    except Exception as e:
        print(f"❌ SMTP failed: {type(e).__name__}: {e}")
        return False


def send_email(to_email, subject, html, text=None, smtp_config=None):
    """
    Universal email sender. Checks admin settings for provider preference.
    provider = 'mailgun' -> uses Mailgun HTTP API
    provider = 'smtp'    -> uses SMTP (from DB config or env config)
    """
    provider = _get_email_provider()
    print(f"📧 Email provider: {provider}")

    if provider == 'mailgun':
        result = _send_via_mailgun(to_email, subject, html, text)
        if result:
            return True
        # If Mailgun fails, try SMTP as fallback
        print("⚠️  Mailgun failed, falling back to SMTP...")
        return _send_via_smtp(to_email, subject, html, text, smtp_config)
    else:
        # SMTP mode
        result = _send_via_smtp(to_email, subject, html, text, smtp_config)
        if result:
            return True
        # If SMTP fails, try Mailgun as fallback
        print("⚠️  SMTP failed, falling back to Mailgun...")
        return _send_via_mailgun(to_email, subject, html, text)


def send_otp_email(to_email, otp, purpose='Verification'):
    """Send OTP email using the configured provider."""
    print("\n" + "="*50)
    print(f"📧 OTP EMAIL TO: {to_email}")
    print(f"📌 PURPOSE: {purpose}")
    print(f"🔐 OTP CODE: {otp}")
    print("="*50 + "\n")

    subject = f'{purpose} - Your OTP Code'
    html = _build_otp_html(otp, purpose)
    text = f"{purpose}\n\nYour OTP code is: {otp}\n\nThis code expires in 10 minutes."

    result = send_email(to_email, subject, html, text)
    if not result:
        print("   OTP has been printed to console above.")
    return result


def send_receipt_email(to_email, order, receipt_url):
    """Send order receipt email"""
    print("\n" + "="*50)
    print(f"📧 RECEIPT EMAIL TO: {to_email}")
    print(f"📦 ORDER: #{order.order_number}")
    print(f"📄 RECEIPT: {receipt_url}")
    print("="*50 + "\n")
    return True


def send_notification_email(to_email, subject, message):
    """Send general notification email"""
    print("\n" + "="*50)
    print(f"📧 NOTIFICATION TO: {to_email}")
    print(f"📌 SUBJECT: {subject}")
    print(f"📝 MESSAGE: {message}")
    print("="*50 + "\n")
    return True


def send_smtp_email(to_email, subject, body, config=None, html=None):
    """
    Send email using the configured provider.
    Used by email marketing and SMTP test features.
    smtp_config from DB is passed to SMTP if SMTP is the active provider.
    """
    if not html:
        html = f"<div style='font-family: sans-serif;'>{body}</div>"

    # For SMTP test, we load config from DB
    if not config:
        from app.models import SmtpConfig
        config = SmtpConfig.query.filter_by(is_active=True).first()

    return send_email(to_email, subject, html, body, smtp_config=config)
