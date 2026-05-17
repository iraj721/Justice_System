# backend/app/api/investigator_comm.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage
from app.services.notification_service import notification_service

router = APIRouter(prefix="/investigator/comm", tags=["Investigator Communication"])

class MessageRequest(BaseModel):
    case_id: str
    subject: str
    message: str
    recipient_email: str

class NoteRequest(BaseModel):
    case_id: str
    note: str

@router.post("/send-message")
async def send_message_to_complainant(payload: MessageRequest, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Send message to complainant with email and timeline"""
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    message_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"
    
    message_data = {
        "message_id": message_id,
        "case_id": payload.case_id,
        "case_number": case.get("case_number"),
        "subject": payload.subject,
        "message": payload.message,
        "from_email": current_user["email"],
        "from_name": current_user.get("full_name"),
        "to_email": payload.recipient_email,
        "to_name": fir.get("complainant_name"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "SENT"
    }
    
    # Save message
    messages = await mongo_storage.get_case_messages(payload.case_id)
    messages[message_id] = message_data
    await mongo_storage.save_case_messages(payload.case_id, messages)
    
    # ============ 1. SEND EMAIL TO COMPLAINANT ============
    email_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0b0e1a; color: #e8ecf8;">
        <div style="max-width: 550px; margin: 0 auto; background: #0c0f1a; border: 1px solid #6366f1; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 25px; text-align: center;">
                <div style="font-size: 40px;">📬</div>
                <h2 style="color: white; margin: 10px 0 0 0;">New Message from Investigator</h2>
            </div>
            <div style="padding: 25px;">
                <p>Dear <strong>{fir.get('complainant_name')}</strong>,</p>
                <p>You have received a new message regarding your case.</p>
                <div style="background: #1e293b; padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <p><strong>📋 Case:</strong> {case.get('case_number')}</p>
                    <p><strong>📌 Subject:</strong> {payload.subject}</p>
                    <p><strong>💬 Message:</strong></p>
                    <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-top: 8px;">
                        <p style="margin: 0; color: #94a3b8;">{payload.message}</p>
                    </div>
                </div>
                <p><strong>👮 From:</strong> {current_user.get('full_name')} (Investigator)</p>
                <p><strong>🕐 Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}</p>
                <a href="http://localhost:5173/app" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin-top: 15px;">📱 View in Dashboard</a>
                <hr style="border-color: #1e293b; margin: 20px 0;">
                <p style="color: #64748b; font-size: 11px;">This is an automated notification from Justice System.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await notification_service.send_email(
        payload.recipient_email,
        f"📬 New Message from Investigator - Case {case.get('case_number')}",
        email_body
    )
    
    # ============ 2. ADD TIMELINE EVENT TO CASE ============
    # Get fresh case data again to ensure we have latest timeline
    case = await mongo_storage.get_case(payload.case_id)
    
    if "timeline" not in case:
        case["timeline"] = []
    
    timeline_event = {
        "date": datetime.now(timezone.utc).isoformat(),
        "event": "💬 Message Sent to Complainant",
        "description": f"Subject: {payload.subject}",
        "icon": "💬",
        "status": "completed",
        "by": current_user["email"],
        "by_name": current_user.get("full_name"),
        "type": "case_level",
        "details": {
            "subject": payload.subject,
            "message": payload.message[:200],
            "to": payload.recipient_email
        }
    }
    
    case["timeline"].append(timeline_event)
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Save case with updated timeline
    await mongo_storage.update_case(payload.case_id, case)
    
    print(f"✅ Timeline event added for case {payload.case_id}: {timeline_event['event']}")
    # ============ END TIMELINE ============
    
    return {
        "message_id": message_id, 
        "status": "Sent", 
        "email_sent": True, 
        "timeline_added": True
    }


@router.post("/add-note")
async def add_investigation_note(payload: NoteRequest, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Add internal investigation note with timeline"""
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    note = {
        "note_id": str(uuid.uuid4())[:8],
        "note": payload.note,
        "added_by": current_user["email"],
        "added_by_name": current_user.get("full_name"),
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "investigation_notes" not in case:
        case["investigation_notes"] = []
    
    case["investigation_notes"].append(note)
    
    # ============ ADD TIMELINE EVENT FOR NOTE ============
    if "timeline" not in case:
        case["timeline"] = []
    
    case["timeline"].append({
        "date": datetime.now(timezone.utc).isoformat(),
        "event": "📝 Investigation Note Added",
        "description": payload.note[:150],
        "icon": "📝",
        "status": "completed",
        "by": current_user["email"],
        "by_name": current_user.get("full_name"),
        "type": "case_level"
    })
    
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    await mongo_storage.update_case(payload.case_id, case)
    # ============ END TIMELINE ============
    
    return {"note": note, "message": "Note added"}


@router.get("/messages/{case_id}")
async def get_case_messages(case_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get all messages for a case"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    messages = await mongo_storage.get_case_messages(case_id)
    return list(messages.values())


@router.get("/notes/{case_id}")
async def get_case_notes(case_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get all investigation notes for a case"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    return case.get("investigation_notes", [])