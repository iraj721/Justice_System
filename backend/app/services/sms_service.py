# backend/app/services/sms_service.py
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    Client = None
    logger.warning("Twilio not installed. SMS features disabled.")

class SMSService:
    def __init__(self):
        self.enabled = TWILIO_AVAILABLE and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN
        if self.enabled:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            self.from_number = settings.TWILIO_PHONE_NUMBER
            logger.info("SMS service enabled")
        else:
            logger.warning("SMS service disabled - install twilio and configure credentials")
    
    async def send_sms(self, to_number: str, message: str) -> bool:
        """Send SMS to a phone number"""
        if not self.enabled:
            logger.info(f"[SMS would send] To: {to_number}, Message: {message}")
            return True
        
        try:
            # Format number (ensure it has country code)
            if not to_number.startswith('+'):
                to_number = '+92' + to_number.lstrip('0')  # Pakistan code
            
            sms = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            logger.info(f"SMS sent: {sms.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False
    
    async def send_case_status_update(self, phone: str, case_number: str, status: str):
        """Send case status update SMS"""
        message = f"""JUSTICE SYSTEM: Case {case_number} status updated to {status}. Login to dashboard for details. Helpline: 1234"""
        await self.send_sms(phone, message)
    
    async def send_hearing_reminder(self, phone: str, case_number: str, hearing_date: str, hearing_time: str):
        """Send hearing reminder SMS"""
        message = f"""JUSTICE SYSTEM REMINDER: Hearing for case {case_number} scheduled on {hearing_date} at {hearing_time}. Join via link in dashboard."""
        await self.send_sms(phone, message)
    
    async def send_otp(self, phone: str, otp: str):
        """Send OTP for verification"""
        message = f"""JUSTICE SYSTEM: Your verification code is {otp}. Valid for 5 minutes."""
        await self.send_sms(phone, message)
    
    async def send_fir_accepted(self, phone: str, fir_number: str):
        """Send FIR acceptance notification"""
        message = f"""JUSTICE SYSTEM: Your FIR {fir_number} has been accepted. Case number will be assigned soon."""
        await self.send_sms(phone, message)
    
    async def send_judgment_delivered(self, phone: str, case_number: str, verdict: str):
        """Send judgment notification"""
        message = f"""JUSTICE SYSTEM: Judgment delivered for case {case_number}. Verdict: {verdict}. Login for details."""
        await self.send_sms(phone, message)

sms_service = SMSService()