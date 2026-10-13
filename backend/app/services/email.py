import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import os


def _get_email_provider():
    """Get the configured email provider from AppSettings. Returns 'resend' or 'smtp'."""
    try:
        from app.models import AppSettings
        row = AppSettings.query.first()
        if row and row.data:
            provider = row.data.get('email_provider', 'resend')
            # Migrate old 'mailgun' setting to 'resend'
            if provider == 'mailgun':
                return 'resend'
            return provider
    except Exception:
        pass
    return 'resend'


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


def _send_via_resend(to_email, subject, html, text=None):
    """Send email via Resend HTTP API."""
    api_key = os.getenv('RESEND_API_KEY')
    from_email = os.getenv('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
    # Wrap plain email in display name
    if from_email and '@' in from_email and '<' not in from_email:
        from_email = f'MAU MART <{from_email}>'

    if not api_key:
        print("⚠️  Resend not configured (RESEND_API_KEY missing)")
        return False

    try:
        import requests
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': from_email,
                'to': [to_email],
                'subject': subject,
                'html': html,
                'text': text or '',
            },
            timeout=15
        )
        if response.status_code in (200, 201):
            print(f"✅ Resend: Email sent to {to_email}")
            return True
        else:
            print(f"❌ Resend failed ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ Resend error: {e}")
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
    provider = 'resend' -> uses Resend HTTP API
    provider = 'smtp'   -> uses SMTP (from DB config or env config)
    """
    provider = _get_email_provider()
    if smtp_config is None:
        from app.models import SmtpConfig
        smtp_config = SmtpConfig.query.filter_by(is_active=True).first()

    if provider == 'resend':
        result = _send_via_resend(to_email, subject, html, text)
        if result:
            return True
        print("⚠️  Resend failed, falling back to SMTP...")
        return _send_via_smtp(to_email, subject, html, text, smtp_config)
    else:
        # SMTP mode
        result = _send_via_smtp(to_email, subject, html, text, smtp_config)
        if result:
            return True
        print("⚠️  SMTP failed, falling back to Resend...")
        return _send_via_resend(to_email, subject, html, text)


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
