# backend/app/api/notifications.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone  # ADD THIS IMPORT
import random

from app.core.authz import get_current_user, require_roles
from app.core.roles import UserRole
from app.services.sms_service import sms_service
from app.services.ipfs_storage import ipfs_storage

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class SMSRequest(BaseModel):
    phone_number: str
    message: str

class OTPRequest(BaseModel):
    phone_number: str

# Store OTPs in memory (in production use Redis)
otp_storage = {}

@router.post("/send-sms")
async def send_sms(
    payload: SMSRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.COURT))
):
    """Send SMS notification (for authorized users only)"""
    result = await sms_service.send_sms(payload.phone_number, payload.message)
    return {"success": result, "message": "SMS sent" if result else "SMS failed"}

@router.post("/send-otp")
async def send_otp(
    payload: OTPRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send OTP for verification"""
    otp = str(random.randint(100000, 999999))
    
    # Store OTP with expiry
    otp_storage[payload.phone_number] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc).timestamp() + 300  # 5 minutes
    }
    
    result = await sms_service.send_otp(payload.phone_number, otp)
    return {"success": result, "message": "OTP sent" if result else "Failed to send OTP"}

@router.post("/verify-otp")
async def verify_otp(
    payload: OTPRequest,
    otp: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify OTP"""
    stored = otp_storage.get(payload.phone_number)
    if not stored:
        return {"success": False, "message": "No OTP requested"}
    
    if datetime.now(timezone.utc).timestamp() > stored["expires_at"]:
        del otp_storage[payload.phone_number]
        return {"success": False, "message": "OTP expired"}
    
    if stored["otp"] != otp:
        return {"success": False, "message": "Invalid OTP"}
    
    del otp_storage[payload.phone_number]
    return {"success": True, "verified": True}

@router.post("/case-update/{case_id}")
async def send_case_update_sms(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Send SMS update to complainant about case"""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    fir = ipfs_storage.get_fir(case.get("fir_id"))
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    phone = fir.get("complainant_contact")
    if not phone:
        return {"error": "No phone number available"}
    
    await sms_service.send_case_status_update(
        phone, 
        case.get("case_number", case_id), 
        case.get("status", "UPDATED")
    )
    
    return {"success": True, "message": "SMS sent to complainant"}