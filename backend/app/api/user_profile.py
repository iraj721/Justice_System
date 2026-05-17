# backend/app/api/user_profile.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.authz import get_current_user
from app.core.security import verify_password, hash_password
from app.services.mongo_storage import mongo_storage
import json
import os

router = APIRouter(prefix="/user", tags=["User Profile"])

# ============ Request/Response Models ============

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = Field(None, pattern=r'^[0-9+\-\s]{10,15}$')
    alternative_phone: Optional[str] = Field(None, pattern=r'^[0-9+\-\s]{10,15}$')
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    profile_picture_cid: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)

class NotificationPreferencesUpdate(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = False
    case_updates: bool = True
    hearing_reminders: bool = True

# ============ Helper Functions ============

def calculate_case_progress(status: str) -> int:
    """Calculate progress percentage based on case status"""
    status_weights = {
        "SUBMITTED": 5,
        "UNDER_REVIEW": 10,
        "ACCEPTED": 15,
        "UNDER_INVESTIGATION": 30,
        "EVIDENCE_COLLECTING": 40,
        "FORENSIC_SUBMITTED": 55,
        "FORENSIC_COMPLETED": 65,
        "SUBMITTED_TO_COURT": 75,
        "UNDER_COURT_REVIEW": 85,
        "DECIDED": 100,
        "CLOSED": 100
    }
    return status_weights.get(status, 5)

def get_next_step(status: str) -> str:
    """Get user-friendly next step description"""
    next_steps = {
        "SUBMITTED": "Your FIR is in queue. An investigator will review it soon.",
        "UNDER_REVIEW": "Investigator is reviewing your FIR.",
        "ACCEPTED": "FIR accepted. Case will be registered shortly.",
        "UNDER_INVESTIGATION": "Investigation in progress. Evidence being collected.",
        "EVIDENCE_COLLECTING": "Investigators are gathering evidence.",
        "FORENSIC_SUBMITTED": "Evidence sent to forensic lab for analysis.",
        "FORENSIC_COMPLETED": "Forensic report prepared. Awaiting court submission.",
        "SUBMITTED_TO_COURT": "Case submitted to court. Hearing date will be announced.",
        "UNDER_COURT_REVIEW": "Court is reviewing the case.",
        "DECIDED": "Final verdict delivered. Check judgment details."
    }
    return next_steps.get(status, "Case registered. Awaiting updates.")

def get_estimated_time(status: str) -> str:
    """Get estimated time for next update"""
    estimates = {
        "SUBMITTED": "1-2 days",
        "UNDER_REVIEW": "2-3 days",
        "ACCEPTED": "1 day",
        "UNDER_INVESTIGATION": "2-4 weeks",
        "EVIDENCE_COLLECTING": "1-2 weeks",
        "FORENSIC_SUBMITTED": "2-3 weeks",
        "FORENSIC_COMPLETED": "1 week",
        "SUBMITTED_TO_COURT": "2-3 weeks",
        "UNDER_COURT_REVIEW": "1-2 weeks"
    }
    return estimates.get(status, "Timeline to be announced")

async def get_user_activity(email: str, limit: int = 10) -> List[Dict]:
    """Get recent user activity"""
    all_firs = await mongo_storage.get_all_firs()
    user_firs = [f for f in all_firs if f.get("complainant_email") == email]
    
    activities = []
    for fir in sorted(user_firs, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]:
        activities.append({
            "type": "FIR_FILED",
            "title": fir.get("incident_title", "Unknown"),
            "fir_number": fir.get("fir_number", ""),
            "fir_id": fir.get("fir_id", ""),
            "date": fir.get("created_at", ""),
            "status": fir.get("status", "UNKNOWN"),
            "icon": "📋"
        })
        
        # Add status changes as activities
        for history in fir.get("status_history", []):
            activities.append({
                "type": "STATUS_CHANGE",
                "title": f"FIR {fir.get('fir_number', '')} - {history.get('status', '')}",
                "description": history.get("remarks", ""),
                "date": history.get("timestamp", ""),
                "status": history.get("status", ""),
                "icon": "🔄"
            })
    
    # Sort by date descending
    activities.sort(key=lambda x: x.get("date", ""), reverse=True)
    return activities[:limit]

async def generate_fir_timeline(fir: dict, case: dict = None) -> List[Dict]:
    """Generate complete timeline for FIR"""
    timeline = []
    
    # 1. FIR Filed
    timeline.append({
        "date": fir.get("created_at"),
        "event": "FIR Filed",
        "description": f"FIR Number: {fir.get('fir_number', 'N/A')}",
        "icon": "📝",
        "status": "completed",
        "details": {
            "title": fir.get("incident_title"),
            "location": fir.get("incident_location")
        }
    })
    
    # 2. Status changes from history
    status_icons = {
        "ACCEPTED": "✅",
        "REJECTED": "❌",
        "UNDER_REVIEW": "🔍",
        "UNDER_INVESTIGATION": "🔬",
        "SUBMITTED_TO_COURT": "⚖️",
        "DECIDED": "📜"
    }
    
    for history in fir.get("status_history", []):
        if history.get("status") != "SUBMITTED":
            timeline.append({
                "date": history.get("timestamp"),
                "event": history.get("status", "").replace("_", " "),
                "description": history.get("remarks", ""),
                "icon": status_icons.get(history.get("status", ""), "🔄"),
                "status": "completed",
                "details": {
                    "changed_by": history.get("changed_by", "System")
                }
            })
    
    # 3. Case created
    if case:
        timeline.append({
            "date": case.get("created_at"),
            "event": "Case Registered",
            "description": f"Case Number: {case.get('case_number', 'N/A')}",
            "icon": "⚖️",
            "status": "completed",
            "details": {
                "case_id": case.get("case_id"),
                "investigator": case.get("investigator_name", "Assigned")
            }
        })
        
        # 4. Evidence added
        for ev_id in case.get("evidence", []):
            ev = await mongo_storage.get_evidence(ev_id)
            if ev:
                timeline.append({
                    "date": ev.get("created_at"),
                    "event": "Evidence Added",
                    "description": ev.get("title", "Evidence"),
                    "icon": "📎",
                    "status": "completed",
                    "details": {
                        "evidence_id": ev.get("evidence_id"),
                        "verified": bool(ev.get("verifications"))
                    }
                })
    
    # 5. Current incomplete stage
    current_status = case.get("status") if case else fir.get("status")
    if current_status not in ["DECIDED", "CLOSED", 100]:
        timeline.append({
            "date": datetime.now(timezone.utc).isoformat(),
            "event": current_status.replace("_", " "),
            "description": get_next_step(current_status),
            "icon": "⏳",
            "status": "pending",
            "details": {
                "progress": calculate_case_progress(current_status),
                "estimated_time": get_estimated_time(current_status)
            }
        })
    
    return timeline

# ============ API Endpoints ============

@router.get("/profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get complete user profile with statistics"""
    user = await mongo_storage.get_user(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's FIRs
    all_firs = await mongo_storage.get_all_firs()
    my_firs = [f for f in all_firs if f.get("complainant_email") == current_user["email"]]
    
    # Get cases related to user's FIRs
    all_cases = await mongo_storage.get_all_cases()
    my_cases = [c for c in all_cases if c.get("fir_id") in [f.get("fir_id") for f in my_firs]]
    
    # Calculate statistics
    active_cases = [c for c in my_cases if c.get("status") not in ["DECIDED", "CLOSED"]]
    resolved_cases = [c for c in my_cases if c.get("status") in ["DECIDED", "CLOSED"]]
    
    # Get recent activity
    recent_activity = await get_user_activity(current_user["email"])
    
    # Get notification preferences
    notification_prefs = user.get("notification_preferences", {
        "email_notifications": True,
        "sms_notifications": False,
        "case_updates": True,
        "hearing_reminders": True
    })
    
    return {
        "user_info": {
            "id": user.get("id"),
            "full_name": user.get("full_name"),
            "email": user.get("email"),
            "role": user.get("role"),
            "phone_number": user.get("phone_number", ""),
            "alternative_phone": user.get("alternative_phone", ""),
            "address": user.get("address", ""),
            "city": user.get("city", ""),
            "district": user.get("district", ""),
            "province": user.get("province", ""),
            "postal_code": user.get("postal_code", ""),
            "profile_picture_cid": user.get("profile_picture_cid", ""),
            "member_since": user.get("created_at"),
            "last_login": user.get("last_login", "")
        },
        "statistics": {
            "total_firs_filed": len(my_firs),
            "total_cases": len(my_cases),
            "active_cases": len(active_cases),
            "resolved_cases": len(resolved_cases),
            "evidence_submitted": sum([len(c.get("evidence", [])) for c in my_cases])
        },
        "notification_preferences": notification_prefs,
        "recent_activity": recent_activity
    }

@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information"""
    user = await mongo_storage.get_user(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    update_data = payload.dict(exclude_unset=True)
    user.update(update_data)
    user["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await mongo_storage.save_user(current_user["email"], user)
    
    return {
        "message": "Profile updated successfully",
        "updated_fields": list(update_data.keys())
    }

@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    # Load passwords
    password_file = "passwords.json"
    if not os.path.exists(password_file):
        raise HTTPException(status_code=500, detail="System error")
    
    with open(password_file, 'r') as f:
        passwords = json.load(f)
    
    stored_hash = passwords.get(current_user["email"])
    if not stored_hash or not verify_password(payload.old_password, stored_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Update password
    passwords[current_user["email"]] = hash_password(payload.new_password)
    with open(password_file, 'w') as f:
        json.dump(passwords, f)
    
    return {"message": "Password changed successfully"}

@router.put("/notification-preferences")
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's notification preferences"""
    user = await mongo_storage.get_user(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["notification_preferences"] = payload.dict()
    await mongo_storage.save_user(current_user["email"], user)
    
    return {"message": "Notification preferences updated"}

@router.get("/my-firs")
async def get_my_complete_firs(current_user: dict = Depends(get_current_user)):
    """Get all FIRs with detailed status and case info"""
    all_firs = await mongo_storage.get_all_firs()
    my_firs = []
    
    for fir in all_firs:
        if fir.get("complainant_email") == current_user["email"]:
            # Get associated case if exists
            case = None
            if fir.get("case_id"):
                case = await mongo_storage.get_case(fir.get("case_id"))
            
            # Calculate progress
            current_status = case.get("status") if case else fir.get("status")
            progress = calculate_case_progress(current_status)
            
            my_firs.append({
                "fir_id": fir.get("fir_id"),
                "fir_number": fir.get("fir_number"),
                "incident_title": fir.get("incident_title"),
                "incident_description": fir.get("incident_description"),
                "incident_location": fir.get("incident_location"),
                "incident_datetime": fir.get("incident_datetime"),
                "status": fir.get("status"),
                "created_at": fir.get("created_at"),
                "case_id": fir.get("case_id"),
                "case_number": fir.get("case_number"),
                "case_status": case.get("status") if case else None,
                "investigator": case.get("investigator_name") if case else None,
                "progress_percentage": progress,
                "current_stage": current_status.replace("_", " "),
                "timeline": await generate_fir_timeline(fir, case)
            })
    
    return sorted(my_firs, key=lambda x: x["created_at"], reverse=True)

@router.get("/case/{case_id}/track")
async def track_case_progress(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Track case progress with percentage and next steps"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Verify ownership through FIR
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if not fir or fir.get("complainant_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied. This is not your case.")
    
    progress = calculate_case_progress(case.get("status", "UNKNOWN"))
    
    return {
        "case_id": case.get("case_id"),
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "current_status": case.get("status", "UNKNOWN"),
        "progress_percentage": progress,
        "next_step": get_next_step(case.get("status", "UNKNOWN")),
        "estimated_time": get_estimated_time(case.get("status", "UNKNOWN")),
        "last_updated": case.get("updated_at", ""),
        "investigator_name": case.get("investigator_name"),
        "court_name": case.get("assigned_court_officer")
    }

@router.get("/case/{case_id}/timeline")
async def get_case_timeline(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get visual timeline for a case"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Verify ownership
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if not fir or fir.get("complainant_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    timeline = await generate_fir_timeline(fir, case)
    
    return {
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "timeline": timeline,
        "current_progress": calculate_case_progress(case.get("status", "UNKNOWN")),
        "estimated_completion": get_estimated_time(case.get("status", "UNKNOWN"))
    }

@router.get("/dashboard-stats")
async def get_user_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get quick stats for user dashboard"""
    all_firs = await mongo_storage.get_all_firs()
    my_firs = [f for f in all_firs if f.get("complainant_email") == current_user["email"]]
    
    # Count FIRs by status
    status_counts = {}
    for fir in my_firs:
        status = fir.get("status", "UNKNOWN")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Get recent FIRs
    recent_firs = sorted(my_firs, key=lambda x: x.get("created_at", ""), reverse=True)[:3]
    
    return {
        "total_firs": len(my_firs),
        "status_breakdown": status_counts,
        "recent_firs": [
            {
                "fir_number": f.get("fir_number"),
                "incident_title": f.get("incident_title"),
                "status": f.get("status"),
                "created_at": f.get("created_at")
            } for f in recent_firs
        ]
    }

@router.post("/update-last-login")
async def update_last_login(current_user: dict = Depends(get_current_user)):
    """Update user's last login timestamp"""
    user = await mongo_storage.get_user(current_user["email"])
    if user:
        user["last_login"] = datetime.now(timezone.utc).isoformat()
        await mongo_storage.save_user(current_user["email"], user)
    return {"status": "ok"}