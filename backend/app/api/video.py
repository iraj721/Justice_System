# backend/app/api/video.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone  # ADD THIS IMPORT

from app.core.authz import get_current_user, require_roles
from app.core.roles import UserRole
from app.services.video_service import video_service
from app.services.ipfs_storage import ipfs_storage

router = APIRouter(prefix="/video", tags=["Video Conferencing"])

class MeetingRequest(BaseModel):
    case_id: str
    meeting_type: str = "hearing"

@router.post("/create-meeting")
async def create_meeting(
    payload: MeetingRequest,
    current_user: dict = Depends(require_roles(UserRole.COURT, UserRole.INVESTIGATOR))
):
    """Create a video meeting for hearing"""
    case = ipfs_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    meeting = video_service.create_meeting(payload.case_id, payload.meeting_type)
    
    # Save meeting to case
    if "video_meetings" not in case:
        case["video_meetings"] = []
    
    case["video_meetings"].append({
        "meeting_id": meeting["meeting_id"],
        "channel_name": meeting["channel_name"],
        "meeting_type": meeting["meeting_type"],
        "created_at": meeting["created_at"],
        "status": "active"
    })
    ipfs_storage.update_case(payload.case_id, case)
    
    # Generate tokens for participants
    fir = ipfs_storage.get_fir(case.get("fir_id"))
    complainant_email = fir.get("complainant_email") if fir else None
    
    tokens = {
        "judge": video_service.get_token_for_user(meeting["meeting_id"], current_user["email"], "COURT"),
        "complainant": None,
        "investigator": None
    }
    
    if complainant_email:
        tokens["complainant"] = video_service.get_token_for_user(meeting["meeting_id"], complainant_email, "PUBLIC_USER")
    
    investigator = case.get("investigator_email")
    if investigator:
        tokens["investigator"] = video_service.get_token_for_user(meeting["meeting_id"], investigator, "INVESTIGATOR")
    
    return {
        "success": True,
        "meeting_id": meeting["meeting_id"],
        "channel_name": meeting["channel_name"],
        "agora_app_id": meeting["agora_app_id"],
        "tokens": tokens,
        "meeting_link": video_service.get_meeting_link(meeting["meeting_id"], "COURT")
    }

@router.get("/meeting/{meeting_id}/token")
async def get_meeting_token(
    meeting_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get token to join a meeting"""
    # Find case with this meeting
    all_cases = ipfs_storage.get_all_cases()
    found = False
    user_role = current_user.get("role")
    
    for case in all_cases:
        for meeting in case.get("video_meetings", []):
            if meeting.get("meeting_id") == meeting_id:
                found = True
                break
    
    if not found:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    token = video_service.get_token_for_user(meeting_id, current_user["email"], user_role)
    
    return {
        "success": True,
        "meeting_id": meeting_id,
        "token": token,
        "app_id": video_service.app_id if video_service.enabled else None
    }