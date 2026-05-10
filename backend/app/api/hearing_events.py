# backend/app/api/hearing_events.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
from app.core.authz import get_current_user, require_roles
from app.core.roles import UserRole
from app.services.ipfs_storage import ipfs_storage

router = APIRouter(prefix="/hearing/events", tags=["Hearing Events"])

class HearingJoinRequest(BaseModel):
    hearing_id: str
    action: str  # JOIN, LEAVE, END

class HearingEventResponse(BaseModel):
    event_id: str
    hearing_id: str
    user_email: str
    user_name: str
    user_role: str
    action: str
    timestamp: str
    duration_seconds: Optional[int] = None

# Store active hearing sessions
active_sessions = {}

@router.post("/join/{hearing_id}")
async def join_hearing(
    hearing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Record when a user joins a hearing"""
    
    # Find hearing
    all_cases = ipfs_storage.get_all_cases()
    found_hearing = None
    found_case = None
    
    for case in all_cases:
        hearings = ipfs_storage.get_case_hearings(case.get("case_id"))
        if hearing_id in hearings:
            found_hearing = hearings[hearing_id]
            found_case = case
            break
    
    if not found_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    # Check authorization
    fir = ipfs_storage.get_fir(found_case.get("fir_id"))
    user_email = current_user["email"]
    user_role = current_user["role"]
    user_name = current_user.get("full_name", user_email)
    
    is_investigator = found_case.get("investigator_email") == user_email
    is_complainant = fir and fir.get("complainant_email") == user_email
    is_court = user_role == "COURT"
    
    if not (is_investigator or is_complainant or is_court):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Record join event
    event_id = f"HEVT-{uuid.uuid4().hex[:8].upper()}"
    current_time = datetime.now(timezone.utc).isoformat()
    
    event_data = {
        "event_id": event_id,
        "hearing_id": hearing_id,
        "user_email": user_email,
        "user_name": user_name,
        "user_role": user_role,
        "action": "JOIN",
        "timestamp": current_time
    }
    
    # Store in hearing events
    hearing_events = ipfs_storage.get_hearing_events(hearing_id)
    hearing_events[event_id] = event_data
    ipfs_storage.save_hearing_events(hearing_id, hearing_events)
    
    # Track active session for duration calculation
    session_key = f"{hearing_id}_{user_email}"
    active_sessions[session_key] = current_time
    
    # Add to case timeline
    if "timeline" not in found_case:
        found_case["timeline"] = []
    
    found_case["timeline"].append({
        "timestamp": current_time,
        "action": f"🎙️ {user_name} ({user_role.replace('_', ' ')}) joined the hearing",
        "description": f"{user_name} joined the hearing at {datetime.now(timezone.utc).strftime('%I:%M %p')}",
        "icon": "🎙️",
        "status": "completed",
        "by": user_name,
        "by_name": user_name,
        "type": "hearing_level",
        "details": {
            "hearing_id": hearing_id,
            "action": "JOIN",
            "user_role": user_role
        }
    })
    
    ipfs_storage.save_case(found_case.get("case_id"), found_case)
    
    return {
        "success": True,
        "message": f"{user_name} joined the hearing",
        "event_id": event_id
    }


@router.post("/leave/{hearing_id}")
async def leave_hearing(
    hearing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Record when a user leaves a hearing and calculate duration"""
    
    # Find hearing
    all_cases = ipfs_storage.get_all_cases()
    found_hearing = None
    found_case = None
    
    for case in all_cases:
        hearings = ipfs_storage.get_case_hearings(case.get("case_id"))
        if hearing_id in hearings:
            found_hearing = hearings[hearing_id]
            found_case = case
            break
    
    if not found_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    user_email = current_user["email"]
    user_name = current_user.get("full_name", user_email)
    user_role = current_user["role"]
    
    # Calculate duration
    session_key = f"{hearing_id}_{user_email}"
    join_time = active_sessions.get(session_key)
    
    duration_seconds = None
    if join_time:
        join_dt = datetime.fromisoformat(join_time)
        leave_dt = datetime.now(timezone.utc)
        duration_seconds = int((leave_dt - join_dt).total_seconds())
        del active_sessions[session_key]
    
    # Record leave event
    event_id = f"HEVT-{uuid.uuid4().hex[:8].upper()}"
    current_time = datetime.now(timezone.utc).isoformat()
    
    event_data = {
        "event_id": event_id,
        "hearing_id": hearing_id,
        "user_email": user_email,
        "user_name": user_name,
        "user_role": user_role,
        "action": "LEAVE",
        "timestamp": current_time,
        "duration_seconds": duration_seconds
    }
    
    hearing_events = ipfs_storage.get_hearing_events(hearing_id)
    hearing_events[event_id] = event_data
    ipfs_storage.save_hearing_events(hearing_id, hearing_events)
    
    # Format duration for display
    duration_text = ""
    if duration_seconds:
        minutes = duration_seconds // 60
        seconds = duration_seconds % 60
        if minutes > 0:
            duration_text = f" (was in hearing for {minutes} min {seconds} sec)"
        else:
            duration_text = f" (was in hearing for {seconds} seconds)"
    
    # Add to case timeline
    if "timeline" not in found_case:
        found_case["timeline"] = []
    
    found_case["timeline"].append({
        "timestamp": current_time,
        "action": f"🎙️ {user_name} ({user_role.replace('_', ' ')}) left the hearing{duration_text}",
        "description": f"{user_name} left the hearing at {datetime.now(timezone.utc).strftime('%I:%M %p')}{duration_text}",
        "icon": "🎙️",
        "status": "completed",
        "by": user_name,
        "by_name": user_name,
        "type": "hearing_level",
        "details": {
            "hearing_id": hearing_id,
            "action": "LEAVE",
            "duration_seconds": duration_seconds,
            "user_role": user_role
        }
    })
    
    ipfs_storage.save_case(found_case.get("case_id"), found_case)
    
    return {
        "success": True,
        "message": f"{user_name} left the hearing",
        "duration_seconds": duration_seconds,
        "event_id": event_id
    }


@router.post("/end/{hearing_id}")
async def end_hearing(
    hearing_id: str,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Court officer ends the hearing (records overall hearing duration)"""
    
    # Find hearing
    all_cases = ipfs_storage.get_all_cases()
    found_hearing = None
    found_case = None
    
    for case in all_cases:
        hearings = ipfs_storage.get_case_hearings(case.get("case_id"))
        if hearing_id in hearings:
            found_hearing = hearings[hearing_id]
            found_case = case
            break
    
    if not found_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    # Get all join/leave events for this hearing
    hearing_events = ipfs_storage.get_hearing_events(hearing_id)
    events_list = list(hearing_events.values())
    
    # Calculate total hearing duration
    join_times = []
    leave_times = []
    
    for event in events_list:
        if event.get("action") == "JOIN":
            join_times.append(datetime.fromisoformat(event.get("timestamp")))
        elif event.get("action") == "LEAVE":
            leave_times.append(datetime.fromisoformat(event.get("timestamp")))
    
    # Calculate overall hearing duration (from first join to last leave)
    total_duration = None
    if join_times and leave_times:
        first_join = min(join_times)
        last_leave = max(leave_times)
        total_duration = int((last_leave - first_join).total_seconds())
    
    # Update hearing status
    hearings = ipfs_storage.get_case_hearings(found_case.get("case_id"))
    hearings[hearing_id]["status"] = "COMPLETED"
    hearings[hearing_id]["ended_at"] = datetime.now(timezone.utc).isoformat()
    if total_duration:
        hearings[hearing_id]["total_duration_seconds"] = total_duration
    ipfs_storage.save_case_hearings(found_case.get("case_id"), hearings)
    
    # Format duration
    duration_text = ""
    if total_duration:
        minutes = total_duration // 60
        seconds = total_duration % 60
        if minutes > 0:
            duration_text = f"Total hearing duration: {minutes} minutes {seconds} seconds"
        else:
            duration_text = f"Total hearing duration: {seconds} seconds"
    
    # Add to case timeline
    court_name = current_user.get("full_name", current_user["email"])
    current_time = datetime.now(timezone.utc).isoformat()
    
    if "timeline" not in found_case:
        found_case["timeline"] = []
    
    found_case["timeline"].append({
        "timestamp": current_time,
        "action": f"⚖️ Hearing Concluded - {duration_text}",
        "description": f"Hearing ended by Court Officer {court_name}. {duration_text}",
        "icon": "⚖️",
        "status": "completed",
        "by": court_name,
        "by_name": court_name,
        "type": "case_level",
        "details": {
            "hearing_id": hearing_id,
            "total_duration_seconds": total_duration,
            "total_participants": len(set([e.get("user_email") for e in events_list]))
        }
    })
    
    ipfs_storage.save_case(found_case.get("case_id"), found_case)
    
    return {
        "success": True,
        "message": f"Hearing {hearing_id} ended",
        "total_duration_seconds": total_duration,
        "total_participants": len(set([e.get("user_email") for e in events_list]))
    }


@router.get("/{hearing_id}")
async def get_hearing_events(
    hearing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all events for a hearing"""
    hearing_events = ipfs_storage.get_hearing_events(hearing_id)
    events_list = list(hearing_events.values())
    
    # Sort by timestamp
    events_list.sort(key=lambda x: x.get("timestamp", ""))
    
    return events_list