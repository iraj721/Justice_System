# backend/app/api/fir_draft.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
from app.core.authz import get_current_user
from app.services.ipfs_storage import ipfs_storage

router = APIRouter(prefix="/fir/draft", tags=["FIR Drafts"])

class FIRDraftRequest(BaseModel):
    draft_id: Optional[str] = None
    incident_title: str
    incident_description: str
    incident_location: str
    incident_datetime: str
    complainant_contact: str
    complainant_name: str
    complainant_address: str
    accused_person: Optional[str] = None
    accused_description: Optional[str] = None
    witness_names: Optional[str] = None
    witness_contact: Optional[str] = None

@router.post("/save")
async def save_draft(payload: FIRDraftRequest, current_user: dict = Depends(get_current_user)):
    """Save FIR as draft (not submitted yet)"""
    drafts = ipfs_storage.get_user_drafts(current_user["email"])
    
    if payload.draft_id and payload.draft_id in drafts:
        # Update existing draft
        draft_id = payload.draft_id
        drafts[draft_id]["data"] = payload.dict()
        drafts[draft_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    else:
        # Create new draft
        draft_id = f"DR-{uuid.uuid4().hex[:8].upper()}"
        drafts[draft_id] = {
            "draft_id": draft_id,
            "user_email": current_user["email"],
            "data": payload.dict(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    ipfs_storage.save_user_drafts(current_user["email"], drafts)
    return {"draft_id": draft_id, "message": "Draft saved successfully"}

@router.get("/my-drafts")
async def get_my_drafts(current_user: dict = Depends(get_current_user)):
    """Get all saved drafts"""
    drafts = ipfs_storage.get_user_drafts(current_user["email"])
    return list(drafts.values())

@router.get("/{draft_id}")
async def get_draft(draft_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific draft"""
    drafts = ipfs_storage.get_user_drafts(current_user["email"])
    if draft_id not in drafts:
        raise HTTPException(status_code=404, detail="Draft not found")
    return drafts[draft_id]

@router.delete("/{draft_id}")
async def delete_draft(draft_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a draft"""
    drafts = ipfs_storage.get_user_drafts(current_user["email"])
    if draft_id in drafts:
        del drafts[draft_id]
        ipfs_storage.save_user_drafts(current_user["email"], drafts)
    return {"message": "Draft deleted"}