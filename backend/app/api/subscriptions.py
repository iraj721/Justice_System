# backend/app/api/subscriptions.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Optional
from app.core.authz import get_current_user
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

class SubscribeRequest(BaseModel):
    case_id: str
    channel: str  # email, sms

@router.post("/subscribe")
async def subscribe_to_case(payload: SubscribeRequest, current_user: dict = Depends(get_current_user)):
    """Subscribe to case updates"""
    # Verify case belongs to user
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if fir.get("complainant_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    subscriptions = await mongo_storage.get_user_subscriptions(current_user["email"])
    
    if payload.case_id not in subscriptions:
        subscriptions[payload.case_id] = {
            "case_id": payload.case_id,
            "channels": [payload.channel],
            "subscribed_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        if payload.channel not in subscriptions[payload.case_id]["channels"]:
            subscriptions[payload.case_id]["channels"].append(payload.channel)
    
    await mongo_storage.save_user_subscriptions(current_user["email"], subscriptions)
    return {"message": f"Subscribed to case {payload.case_id} via {payload.channel}"}

@router.post("/unsubscribe")
async def unsubscribe_from_case(payload: SubscribeRequest, current_user: dict = Depends(get_current_user)):
    """Unsubscribe from case updates"""
    subscriptions = await mongo_storage.get_user_subscriptions(current_user["email"])
    
    if payload.case_id in subscriptions:
        if payload.channel in subscriptions[payload.case_id]["channels"]:
            subscriptions[payload.case_id]["channels"].remove(payload.channel)
        
        if not subscriptions[payload.case_id]["channels"]:
            del subscriptions[payload.case_id]
        
        await mongo_storage.save_user_subscriptions(current_user["email"], subscriptions)
    
    return {"message": f"Unsubscribed from case {payload.case_id}"}

@router.get("/my-subscriptions")
async def get_my_subscriptions(current_user: dict = Depends(get_current_user)):
    """Get all case subscriptions"""
    return await mongo_storage.get_user_subscriptions(current_user["email"])