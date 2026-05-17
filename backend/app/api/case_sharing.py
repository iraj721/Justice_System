# backend/app/api/case_sharing.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import Optional
import uuid
from app.core.authz import get_current_user
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/case-share", tags=["Case Sharing"])

class ShareRequest(BaseModel):
    case_id: str
    share_with_email: EmailStr
    permission: str  # VIEW, COMMENT

@router.post("/share")
async def share_case(payload: ShareRequest, current_user: dict = Depends(get_current_user)):
    """Share case with another user (family member, lawyer)"""
    # Verify case ownership
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if not fir or fir.get("complainant_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Cannot share someone else's case")
    
    # Check if user exists
    shared_user_data = await mongo_storage.get_user(payload.share_with_email)
    if not shared_user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    shares = await mongo_storage.get_case_shares(payload.case_id)
    
    share_id = str(uuid.uuid4())[:8]
    shares[share_id] = {
        "share_id": share_id,
        "case_id": payload.case_id,
        "shared_by": current_user["email"],
        "shared_by_name": current_user.get("full_name", current_user["email"]),
        "shared_with": payload.share_with_email,
        "shared_with_name": shared_user_data.get("full_name", payload.share_with_email),
        "permission": payload.permission,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await mongo_storage.save_case_shares(payload.case_id, shares)
    
    # ============ ADD TIMELINE EVENT ============
    if "timeline" not in case:
        case["timeline"] = []
    
    permission_text = "view" if payload.permission == "VIEW" else "view and comment on"
    
    case["timeline"].append({
        "action": "👥 Case Shared",
        "description": f"Case shared with {shared_user_data.get('full_name', payload.share_with_email)} ({permission_text} permission)",
        "type": "case_level",
        "event": "Case Shared",
        "icon": "👥",
        "shared_with": payload.share_with_email,
        "shared_with_name": shared_user_data.get("full_name", payload.share_with_email),
        "permission": payload.permission,
        "status": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": current_user["email"],
        "by_name": current_user.get("full_name", current_user["email"])
    })
    
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    await mongo_storage.update_case(payload.case_id, case)
    # ============ END TIMELINE EVENT ============
    
    # Send notification to shared user
    from app.services.notification_service import notification_service
    await notification_service.send_email(
        payload.share_with_email,
        f"Case Shared With You - {case.get('case_number')}",
        f"""
        <h2>📋 Case Shared Notification</h2>
        <p><strong>{current_user.get('full_name', current_user['email'])}</strong> has shared a case with you.</p>
        <p><strong>Case Number:</strong> {case.get('case_number')}</p>
        <p><strong>Case Title:</strong> {case.get('title')}</p>
        <p><strong>Permission:</strong> {payload.permission}</p>
        <p>Login to your dashboard to view this case.</p>
        """
    )
    
    return {"share_id": share_id, "message": f"Case shared with {payload.share_with_email}"}


@router.get("/shared-with-me")
async def cases_shared_with_me(current_user: dict = Depends(get_current_user)):
    """Get cases that others shared with me"""
    all_cases = await mongo_storage.get_all_cases()
    shared_cases = []
    
    for case in all_cases:
        shares = await mongo_storage.get_case_shares(case.get("case_id"))
        for share in shares.values():
            if share.get("shared_with") == current_user["email"]:
                fir = await mongo_storage.get_fir(case.get("fir_id"))
                shared_cases.append({
                    "case_id": case.get("case_id"),
                    "case_number": case.get("case_number"),
                    "title": case.get("title"),
                    "status": case.get("status"),
                    "shared_by": share.get("shared_by"),
                    "shared_by_name": share.get("shared_by_name"),
                    "permission": share.get("permission"),
                    "shared_at": share.get("created_at")
                })
    
    return shared_cases


@router.get("/my-shares")
async def cases_i_shared(current_user: dict = Depends(get_current_user)):
    """Get cases I have shared with others"""
    all_cases = await mongo_storage.get_all_cases()
    my_shares = []
    
    for case in all_cases:
        fir = await mongo_storage.get_fir(case.get("fir_id"))
        if fir and fir.get("complainant_email") == current_user["email"]:
            shares = await mongo_storage.get_case_shares(case.get("case_id"))
            for share in shares.values():
                my_shares.append({
                    "case_id": case.get("case_id"),
                    "case_number": case.get("case_number"),
                    "shared_with": share.get("shared_with"),
                    "shared_with_name": share.get("shared_with_name"),
                    "permission": share.get("permission"),
                    "shared_at": share.get("created_at")
                })
    
    return my_shares


@router.delete("/{case_id}/{share_id}")
async def remove_share(case_id: str, share_id: str, current_user: dict = Depends(get_current_user)):
    """Remove sharing permission"""
    shares = await mongo_storage.get_case_shares(case_id)
    if share_id in shares:
        del shares[share_id]
        await mongo_storage.save_case_shares(case_id, shares)
        
        # Add timeline event for share removal
        case = await mongo_storage.get_case(case_id)
        if case:
            if "timeline" not in case:
                case["timeline"] = []
            
            case["timeline"].append({
                "action": "🔒 Share Removed",
                "description": f"Sharing permission removed",
                "type": "case_level",
                "event": "Share Removed",
                "icon": "🔒",
                "status": "completed",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "by": current_user["email"],
                "by_name": current_user.get("full_name", current_user["email"])
            })
            await mongo_storage.update_case(case_id, case)
    
    return {"message": "Share removed"}


@router.get("/shared-messages")
async def get_shared_messages(current_user: dict = Depends(get_current_user)):
    """Get messages shared with me"""
    all_messages = []
    all_cases = await mongo_storage.get_all_cases()
    
    for case in all_cases:
        messages = await mongo_storage.get_case_messages(case.get("case_id"))
        for msg in messages.values():
            if msg.get("to_email") == current_user["email"]:
                all_messages.append(msg)
    
    return sorted(all_messages, key=lambda x: x.get("created_at", ""), reverse=True)