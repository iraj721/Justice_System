from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import List, Optional
import uuid
from app.core.authz import get_current_user
from app.services.ipfs_storage import ipfs_storage
from app.services.notification_service import notification_service

router = APIRouter(prefix="/emergency", tags=["Emergency"])

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[EmailStr] = None

class SOSRequest(BaseModel):
    case_id: Optional[str] = None
    location: str
    message: str

@router.post("/contacts/add")
async def add_emergency_contact(payload: EmergencyContact, current_user: dict = Depends(get_current_user)):
    """Add emergency contact person"""
    contacts = ipfs_storage.get_emergency_contacts(current_user["email"])
    
    contact_id = str(uuid.uuid4())[:8]
    contacts[contact_id] = {
        "id": contact_id,
        **payload.dict(),
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    ipfs_storage.save_emergency_contacts(current_user["email"], contacts)
    return {"contact_id": contact_id, "message": "Emergency contact added"}

@router.get("/contacts")
async def get_emergency_contacts(current_user: dict = Depends(get_current_user)):
    """Get all emergency contacts"""
    return list(ipfs_storage.get_emergency_contacts(current_user["email"]).values())

@router.delete("/contacts/{contact_id}")
async def delete_emergency_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    """Delete emergency contact"""
    contacts = ipfs_storage.get_emergency_contacts(current_user["email"])
    if contact_id in contacts:
        del contacts[contact_id]
        ipfs_storage.save_emergency_contacts(current_user["email"], contacts)
    return {"message": "Contact deleted"}

@router.post("/sos")
async def send_sos(payload: SOSRequest, current_user: dict = Depends(get_current_user)):
    """Send SOS alert to emergency contacts (even non-registered users)"""
    contacts = ipfs_storage.get_emergency_contacts(current_user["email"])
    
    if not contacts:
        raise HTTPException(status_code=400, detail="No emergency contacts added")
    
    sos_id = f"SOS-{uuid.uuid4().hex[:8].upper()}"
    user = ipfs_storage.get_user(current_user["email"])
    
    alerts_sent = []
    
    for contact_id, contact in contacts.items():
        contact_name = contact.get("name", "Emergency Contact")
        contact_phone = contact.get("phone")
        contact_email = contact.get("email")
        
        # ============ 1. SEND EMAIL (Even if user not registered) ============
        if contact_email:
            from app.services.notification_service import notification_service
            
            email_body = f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; background: #0b0e1a; color: #e8ecf8;">
                <div style="max-width: 500px; margin: 0 auto; background: #0c0f1a; border: 1px solid #ef4444; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;">
                        <div style="font-size: 48px;">🚨</div>
                        <h1 style="color: white;">EMERGENCY SOS ALERT</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p><strong>⚠️ URGENT: Please respond immediately</strong></p>
                        <p><strong>👤 Person in danger:</strong> {user.get('full_name')} ({current_user['email']})</p>
                        <p><strong>📍 Location:</strong> {payload.location}</p>
                        <p><strong>💬 Message:</strong> {payload.message}</p>
                        <p><strong>🕐 Time:</strong> {datetime.now(timezone.utc).isoformat()}</p>
                        <div style="margin-top: 20px; padding: 15px; background: #1e293b; border-radius: 8px;">
                            <p><strong>📞 Contact Number:</strong> {contact_phone or 'Not provided'}</p>
                            <p><strong>🤝 Relationship:</strong> {contact.get('relationship')}</p>
                        </div>
                        <p style="margin-top: 20px;">Please contact them immediately and offer assistance.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            email_sent = await notification_service.send_email(
                to_email=contact_email,
                subject=f"🚨 URGENT: SOS Alert from {user.get('full_name')}",
                body=email_body
            )
            
            alerts_sent.append({
                "contact_name": contact_name,
                "method": "email",
                "address": contact_email,
                "status": "SENT" if email_sent else "FAILED"
            })
        
        # ============ 2. SEND SMS (via Twilio or print) ============
        if contact_phone:
            from app.services.sms_service import sms_service
            
            sms_message = f"🚨 SOS ALERT! {user.get('full_name')} needs help. Location: {payload.location[:50]}. Msg: {payload.message[:50]}"
            
            sms_sent = await sms_service.send_sms(contact_phone, sms_message)
            
            alerts_sent.append({
                "contact_name": contact_name,
                "method": "sms",
                "address": contact_phone,
                "status": "SENT" if sms_sent else "QUEUED"
            })
    
    # ============ 3. SEND CONFIRMATION TO COMPLAINANT ============
    try:
        from app.services.notification_service import notification_service
        await notification_service.send_email(
            to_email=current_user["email"],
            subject=f"✅ SOS Alert Sent Successfully",
            body=f"""
            <html>
            <body>
                <h2>✅ SOS Alert Sent</h2>
                <p>Your emergency alert has been sent to {len(alerts_sent)} contact(s).</p>
                <h3>Sent to:</h3>
                <ul>
                    {''.join([f'<li>{a["contact_name"]} via {a["method"]} ({a["address"]}) - {a["status"]}</li>' for a in alerts_sent])}
                </ul>
                <p>Help has been notified and will contact you shortly.</p>
                <p><strong>Your Location:</strong> {payload.location}</p>
                <p><strong>Your Message:</strong> {payload.message}</p>
            </body>
            </html>
            """
        )
    except Exception as e:
        print(f"Confirmation email failed: {e}")
    
    # ============ 4. ADD TIMELINE EVENT TO CASE ============
    if payload.case_id:
        case = ipfs_storage.get_case(payload.case_id)
        if case:
            if "timeline" not in case:
                case["timeline"] = []
            
            # Count how many email and SMS alerts were sent
            email_count = len([a for a in alerts_sent if a.get("method") == "email" and a.get("status") == "SENT"])
            sms_count = len([a for a in alerts_sent if a.get("method") == "sms" and a.get("status") == "SENT"])
            
            alert_summary = []
            if email_count > 0:
                alert_summary.append(f"{email_count} email(s)")
            if sms_count > 0:
                alert_summary.append(f"{sms_count} SMS(s)")
            
            case["timeline"].append({
                "action": "🚨 SOS Alert Sent",
                "description": f"Emergency SOS alert sent to {len(alerts_sent)} contact(s) via {', '.join(alert_summary)}. Location: {payload.location[:100]}",
                "type": "case_level",
                "event": "SOS Alert",
                "icon": "🚨",
                "status": "completed",
                "details": {
                    "location": payload.location,
                    "message": payload.message,
                    "alerts_sent": alerts_sent,
                    "total_contacts": len(alerts_sent)
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "by": current_user["email"],
                "by_name": user.get("full_name", current_user["email"])
            })
            
            case["updated_at"] = datetime.now(timezone.utc).isoformat()
            ipfs_storage.update_case(payload.case_id, case)
    # ============ END TIMELINE EVENT ============
    
    # Save SOS record
    sos_record = {
        "sos_id": sos_id,
        "user_email": current_user["email"],
        "user_name": user.get("full_name"),
        "location": payload.location,
        "message": payload.message,
        "case_id": payload.case_id,
        "alerts_sent": alerts_sent,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    ipfs_storage.save_sos_record(sos_id, sos_record)
    
    return {
        "sos_id": sos_id,
        "alerts_sent": alerts_sent,
        "message": f"SOS alerts sent to {len(alerts_sent)} recipient(s)"
    }