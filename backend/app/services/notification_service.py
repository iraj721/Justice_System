import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict

class NotificationService:
    def __init__(self):
        # ============ USE HARDCODED EMAIL FROM EMAIL_SERVICE ============
        # Try to import email_service first
        try:
            from app.services.email_service import email_service
            self.email_service = email_service
            self.smtp_user = email_service.smtp_user
            self.smtp_password = email_service.smtp_password
            self.smtp_host = email_service.smtp_host
            self.smtp_port = email_service.smtp_port
            self.enabled = email_service.enabled
            self.test_mode = email_service.test_mode
            print(f"✅ Notification service using email_service: {self.smtp_user}")
        except ImportError:
            # Fallback to .env config
            self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
            self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
            self.smtp_user = os.getenv("SMTP_USER", "")
            self.smtp_password = os.getenv("SMTP_PASSWORD", "")
            self.test_mode = os.getenv("EMAIL_TEST_MODE", "true").lower() == "true"
            self.enabled = bool(self.smtp_user and self.smtp_password)
            self.email_service = None
            
            if self.enabled and not self.test_mode:
                print(f"✅ Email service enabled: {self.smtp_user}")
            elif self.test_mode:
                print("📧 Email service in TEST MODE (emails will be printed to console)")
            else:
                print("⚠️ Email service disabled - no credentials")
    
    async def send_email(self, to_email: str, subject: str, body: str):
        """Send email notification"""
        
        # Use email_service if available
        if self.email_service:
            return await self.email_service.send_email(to_email, subject, body, is_html=True)
        
        # Fallback to direct sending
        if self.test_mode:
            print(f"\n{'='*50}")
            print(f"📧 EMAIL (TEST MODE):")
            print(f"   To: {to_email}")
            print(f"   Subject: {subject}")
            print(f"   Body preview: {body[:200]}...")
            print(f"{'='*50}\n")
            return True
        
        if not self.enabled:
            print(f"❌ Email not configured. Would send to {to_email}")
            return False
        
        try:
            msg = MIMEMultipart()
            msg["From"] = self.smtp_user
            msg["To"] = to_email
            msg["Subject"] = subject
            
            msg.attach(MIMEText(body, "html"))
            
            print(f"📧 Connecting to {self.smtp_host}:{self.smtp_port}...")
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                print(f"📧 Logging in as {self.smtp_user}...")
                server.login(self.smtp_user, self.smtp_password)
                print(f"📧 Sending email to {to_email}...")
                server.send_message(msg)
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Email send failed: {e}")
            return False
    
    async def send_case_update(self, user_email: str, case_number: str, status: str, message: str):
        """Send case status update"""
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #1e293b;">🏛️ Justice System Update</h2>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Case Number:</strong> {case_number}</p>
                    <p><strong>Status:</strong> <span style="color: #3b82f6;">{status}</span></p>
                    <p><strong>Message:</strong> {message}</p>
                </div>
                <p style="color: #64748b; font-size: 12px;">
                    Track your case: <a href="http://localhost:5173/app">Login to Dashboard</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px;">This is an automated message from Justice System.</p>
            </div>
        </body>
        </html>
        """
        await self.send_email(user_email, f"Case Update: {case_number} - {status}", html_body)
    
    async def send_hearing_reminder(self, user_email: str, case_number: str, hearing_date: str, meeting_link: str):
        """Send hearing reminder"""
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #1e293b;">⚖️ Court Hearing Reminder</h2>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Case Number:</strong> {case_number}</p>
                    <p><strong>Date & Time:</strong> {hearing_date}</p>
                    <p><strong>Join Link:</strong> <a href="{meeting_link}">{meeting_link}</a></p>
                </div>
                <p>Please join 10 minutes before scheduled time.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px;">Justice System - Virtual Court</p>
            </div>
        </body>
        </html>
        """
        await self.send_email(user_email, f"Hearing Reminder: {case_number}", html_body)
    
    async def send_sos_alert(self, to_email: str, user_name: str, location: str, message: str, relationship: str = "", phone: str = ""):
        """Send SOS alert email"""
        html_body = f"""
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
                    <p><strong>🕐 Time:</strong> {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
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
        await self.send_email(to_email, f"🚨 URGENT: SOS Alert from {user_name}", html_body)
    
    async def send_confirmation_email(self, to_email: str, user_name: str, alerts_sent: list, location: str, message: str):
        """Send confirmation email that SOS was sent"""
        alerts_html = "".join([
            f'<li style="margin-bottom: 8px;"><strong>{alert.get("contact_name", "Unknown")}</strong> via {alert.get("method", "unknown")} ({alert.get("address", "N/A")}) - {alert.get("status", "unknown")}</li>'
            for alert in alerts_sent if alert.get("address")
        ])
        
        html_body = f"""
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
        await self.send_email(to_email, f"✅ SOS Alert Sent Successfully", html_body)

notification_service = NotificationService()