import smtplib
import random
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Store OTPs temporarily (in production use Redis)
otp_storage: Dict[str, dict] = {}

class EmailService:
    def __init__(self):
        # Read from environment variables (NO HARDCODE!)
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        # Support both naming conventions
        self.smtp_user = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("EMAIL_PASS") or os.getenv("SMTP_PASSWORD")
        self.test_mode = os.getenv("EMAIL_TEST_MODE", "false").lower() == "true"
        self.enabled = bool(self.smtp_user and self.smtp_password)
        
        if self.enabled and not self.test_mode:
            print(f"✅ Email service ENABLED (REAL): {self.smtp_user}")
            print(f"   Sending real emails to users!")
        elif self.enabled and self.test_mode:
            print(f"📧 Email service in TEST MODE (emails printed to console only)")
        else:
            print("⚠️ Email service DISABLED - no credentials found")
    
    def generate_otp(self) -> str:
        """Generate 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=6))
    
    async def send_email(self, to_email: str, subject: str, body: str, is_html: bool = True) -> bool:
        """Generic email sender"""
        if not self.enabled:
            print(f"❌ Email service disabled, cannot send to {to_email}")
            return False
        
        if self.test_mode:
            print(f"\n{'='*60}")
            print(f"📧 TEST MODE - Email would be sent:")
            print(f"   To: {to_email}")
            print(f"   Subject: {subject}")
            # Extract OTP from body for easy access
            import re
            otp_match = re.search(r'\b\d{6}\b', body)
            if otp_match:
                print(f"   🔑 OTP CODE: {otp_match.group()}")
            print(f"   Body preview: {body[:200]}...")
            print(f"{'='*60}\n")
            return True
        
        try:
            msg = MIMEMultipart()
            msg["From"] = self.smtp_user
            msg["To"] = to_email
            msg["Subject"] = subject
            
            if is_html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))
            
            print(f"📧 Connecting to {self.smtp_host}:{self.smtp_port}...")
            
            # Handle different ports
            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    async def send_otp_email(self, to_email: str, otp: str) -> bool:
        """Send OTP verification email"""
        subject = "🔐 Email Verification - Justice System"
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #0b0e1a;">
            <div style="max-width: 500px; margin: 0 auto; background: #0c0f1a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px; text-align: center;">
                    <div style="font-size: 48px;">⚖️</div>
                    <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">Decentralized Justice</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #e8ecf8; margin-top: 0;">Email Verification</h2>
                    <p style="color: #7a849c; line-height: 1.6;">Thank you for registering. Please use the following verification code to complete your registration:</p>
                    
                    <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 12px; margin: 25px 0;">
                        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #818cf8;">{otp}</span>
                    </div>
                    
                    <p style="color: #7a849c; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="color: #3d4459; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                </div>
                <div style="background: #07090e; padding: 15px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="color: #3d4459; font-size: 11px; margin: 0;">© 2024 Decentralized Justice System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to_email, subject, body, is_html=True)
    
    async def send_sos_email(self, to_email: str, user_name: str, location: str, message: str, relationship: str = "", phone: str = "") -> bool:
        """Send SOS alert email"""
        subject = f"🚨 URGENT: SOS Alert from {user_name}"
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #0b0e1a;">
                <div style="max-width: 550px; margin: 0 auto; background: #0c0f1a; border: 1px solid #ef4444; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;">
                        <div style="font-size: 48px;">🚨</div>
                        <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">EMERGENCY SOS ALERT</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #e8ecf8; font-size: 16px;"><strong>⚠️ IMMEDIATE ATTENTION REQUIRED</strong></p>
                        <p><strong>👤 Person in danger:</strong> {user_name}</p>
                        {f'<p><strong>🤝 Relationship:</strong> {relationship}</p>' if relationship else ''}
                        {f'<p><strong>📞 Contact Number:</strong> {phone}</p>' if phone else ''}
                        <p><strong>📍 Location:</strong> {location}</p>
                        <p><strong>💬 Message:</strong> {message}</p>
                        <p><strong>🕐 Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <div style="margin-top: 20px; padding: 15px; background: #1e293b; border-radius: 8px;">
                            <p style="color: #f87171; margin: 0;">Please contact them immediately and offer assistance.</p>
                        </div>
                    </div>
                    <div style="background: #07090e; padding: 15px; text-align: center; border-top: 1px solid #1e293b;">
                        <p style="color: #3d4459; font-size: 11px; margin: 0;">This is an automated emergency alert from Decentralized Justice System</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        return await self.send_email(to_email, subject, body, is_html=True)
    
    async def send_confirmation_email(self, to_email: str, user_name: str, alerts_sent: list, location: str, message: str) -> bool:
        """Send confirmation email that SOS was sent"""
        subject = f"✅ SOS Alert Sent Successfully"
        
        alerts_html = "".join([
            f'<li style="margin-bottom: 8px;"><strong>{alert["contact_name"]}</strong> via {alert["method"]} ({alert["address"]}) - {alert["status"]}</li>'
            for alert in alerts_sent if alert.get("address")
        ])
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #0b0e1a;">
                <div style="max-width: 550px; margin: 0 auto; background: #0c0f1a; border: 1px solid #10b981; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
                        <div style="font-size: 48px;">✅</div>
                        <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">SOS Alert Sent</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #e8ecf8;">Dear <strong>{user_name}</strong>,</p>
                        <p>Your emergency alert has been sent to <strong>{len(alerts_sent)} contact(s)</strong>.</p>
                        
                        <h3 style="color: #818cf8; margin-top: 20px;">Sent to:</h3>
                        <ul style="color: #7a849c;">
                            {alerts_html}
                        </ul>
                        
                        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>📍 Your Location:</strong> {location}</p>
                            <p><strong>💬 Your Message:</strong> {message}</p>
                        </div>
                        
                        <p style="color: #10b981;">Help has been notified and will contact you shortly.</p>
                        <p style="color: #7a849c; font-size: 12px; margin-top: 20px;">Stay safe. Help is on the way.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        return await self.send_email(to_email, subject, body, is_html=True)
    
    def store_otp(self, email: str, otp: str):
        """Store OTP with expiry (10 minutes)"""
        otp_storage[email] = {
            "otp": otp,
            "expires_at": datetime.now() + timedelta(minutes=10),
            "verified": False
        }
    
    def verify_otp(self, email: str, otp: str) -> bool:
        """Verify OTP"""
        stored = otp_storage.get(email)
        if not stored:
            return False
        
        if datetime.now() > stored["expires_at"]:
            del otp_storage[email]
            return False
        
        if stored["otp"] != otp:
            return False
        
        stored["verified"] = True
        return True
    
    def is_verified(self, email: str) -> bool:
        """Check if email is verified"""
        stored = otp_storage.get(email)
        return stored and stored.get("verified", False)
    
    def clear_otp(self, email: str):
        """Clear OTP after successful registration"""
        if email in otp_storage:
            del otp_storage[email]

email_service = EmailService()