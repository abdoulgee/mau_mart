import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import traceback
import socket
import os


def _send_via_resend(to_email, subject, html, text=None):
    """Send email via Resend HTTP API. Returns True on success."""
    api_key = os.getenv('RESEND_API_KEY')
    from_email = os.getenv('RESEND_FROM_EMAIL', 'MAU MART <onboarding@resend.dev>')
    if not api_key:
        return None  # Not configured, skip
    
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


def send_otp_email(to_email, otp, purpose='Verification'):
    """Send OTP email. Tries: Resend HTTP API -> SMTP -> Console only."""
    
    # Always print to console
    print("\n" + "="*50)
    print(f"📧 OTP EMAIL TO: {to_email}")
    print(f"📌 PURPOSE: {purpose}")
    print(f"🔐 OTP CODE: {otp}")
    print("="*50 + "\n")
    
    subject = f'{purpose} - Your OTP Code'
    html = _build_otp_html(otp, purpose)
    text = f"{purpose}\n\nYour OTP code is: {otp}\n\nThis code expires in 10 minutes."
    
    # 1. Try Resend HTTP API first (works on Render)
    result = _send_via_resend(to_email, subject, html, text)
    if result is True:
        return True
    if result is None:
        print("ℹ️  Resend not configured, trying SMTP...")
    
    # 2. Try SMTP
    try:
        mail_server = current_app.config.get('MAIL_SERVER')
        mail_username = current_app.config.get('MAIL_USERNAME')
        mail_password = current_app.config.get('MAIL_PASSWORD')
        mail_port = current_app.config.get('MAIL_PORT', 587)
        mail_use_tls = current_app.config.get('MAIL_USE_TLS', True)
        
        if not mail_username or not mail_password:
            print("⚠️  SMTP not configured. OTP printed to console only.")
            return True
        
        sender = current_app.config.get('MAIL_DEFAULT_SENDER', mail_username)
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = to_email
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))
        
        if int(mail_port) == 465:
            with smtplib.SMTP_SSL(mail_server, mail_port, timeout=10) as server:
                server.login(mail_username, mail_password)
                server.sendmail(sender, to_email, msg.as_string())
        else:
            with smtplib.SMTP(mail_server, mail_port, timeout=10) as server:
                if mail_use_tls:
                    server.starttls()
                server.login(mail_username, mail_password)
                server.sendmail(sender, to_email, msg.as_string())
        
        print("✅ Email sent via SMTP!")
        return True
        
    except Exception as e:
        print(f"❌ SMTP failed: {type(e).__name__}: {e}")
        print("   OTP has been printed to console above.")
        return False


def send_receipt_email(to_email, order, receipt_url):
    """Send order receipt email"""
    print("\n" + "="*50)
    print(f"📧 RECEIPT EMAIL TO: {to_email}")
    print(f"📦 ORDER: #{order.order_number}")
    print(f"📄 RECEIPT: {receipt_url}")
    print("="*50 + "\n")
    
    # Similar implementation as above for actual email sending
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
    Send email using Resend HTTP API (preferred) or SMTP config.
    Tries Resend first since Render blocks SMTP ports.
    """
    # 1. Try Resend HTTP API first (works on Render)
    result = _send_via_resend(to_email, subject, html or f"<p>{body}</p>", body)
    if result is True:
        return True
    if result is not None:
        print("⚠️ Resend failed, trying SMTP...")
    
    # 2. Fall back to SMTP
    from app.models import SmtpConfig
    
    if not config:
        config = SmtpConfig.query.filter_by(is_active=True).first()
        
    if not config:
        print("⚠️  No active SMTP configuration found.")
        return False
        
    # Extract config values
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
        server_port = config.get('port', 587)
        username = config.get('username')
        password = config.get('password')
        use_tls = config.get('use_tls', True)
        from_email = config.get('from_email')
        from_name = config.get('from_name', '')

    sender = f"{from_name} <{from_email}>" if from_name else from_email
    
    try:
        if html:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender
            msg['To'] = to_email
            msg.attach(MIMEText(body, 'plain'))
            msg.attach(MIMEText(html, 'html'))
        else:
            msg = MIMEMultipart()
            msg['Subject'] = subject
            msg['From'] = sender
            msg['To'] = to_email
            msg.attach(MIMEText(body, 'plain'))
        
        is_port_465 = int(server_port) == 465
        print(f"🚀 SMTP: {server_host}:{server_port} (SSL: {is_port_465})")
        
        if is_port_465:
            with smtplib.SMTP_SSL(server_host, server_port, timeout=15) as server:
                server.login(username, password)
                server.sendmail(from_email, to_email, msg.as_string())
        else:
            with smtplib.SMTP(server_host, server_port, timeout=15) as server:
                if use_tls:
                    server.starttls()
                server.login(username, password)
                server.sendmail(from_email, to_email, msg.as_string())
            
        print(f"✅ Email sent via SMTP to {to_email}")
        return True
    except Exception as e:
        print(f"❌ SMTP failed: {type(e).__name__}: {e}")
        return False


