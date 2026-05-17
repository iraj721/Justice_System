from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
import hashlib
import json
from app.core.authz import require_roles, get_current_user
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/fir", tags=["FIR"])

class FIRCreateRequest(BaseModel):
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

class FIRStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None

async def auto_create_case_from_fir(fir_data: dict, investigator_email: str) -> dict:
    """Automatically create a case when FIR is accepted"""
    case_id = f"CASE-{uuid.uuid4().hex[:10].upper()}"
    case_number = f"JUSTICE-CASE-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    
    case_data = {
        "case_id": case_id,
        "case_number": case_number,
        "fir_id": fir_data["fir_id"],
        "fir_number": fir_data.get("fir_number"),
        "title": fir_data["incident_title"],
        "description": fir_data["incident_description"],
        "priority": "MEDIUM",
        "status": "UNDER_INVESTIGATION",
        "investigator_email": investigator_email,
        "investigator_name": "",
        "complainant_name": fir_data.get("complainant_name"),
        "complainant_contact": fir_data.get("complainant_contact"),
        "suspects": [],
        "witnesses": [],
        "evidence": [],
        "timeline": [{
            "action": "Case auto-created from accepted FIR",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "by": investigator_email
        }],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Generate hash for case
    case_hash = hashlib.sha256(json.dumps(case_data, default=str).encode()).hexdigest()
    case_data["hash"] = case_hash
    case_data["ipfs_cid"] = "STORED_IN_MONGODB"
    
    await mongo_storage.save_case(case_id, case_data)
    return case_data

@router.post("/")
async def create_fir(
    payload: FIRCreateRequest,
    current_user: dict = Depends(require_roles(UserRole.PUBLIC_USER))
):
    fir_id = f"FIR-{uuid.uuid4().hex[:10].upper()}"
    fir_number = f"JUSTICE-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    
    fir_data = {
        "fir_id": fir_id,
        "fir_number": fir_number,
        "complainant_email": current_user["email"],
        "complainant_name": payload.complainant_name,
        "complainant_contact": payload.complainant_contact,
        "complainant_address": payload.complainant_address,
        "incident_title": payload.incident_title,
        "incident_description": payload.incident_description,
        "incident_location": payload.incident_location,
        "incident_datetime": payload.incident_datetime,
        "accused_person": payload.accused_person,
        "accused_description": payload.accused_description,
        "witness_names": payload.witness_names,
        "witness_contact": payload.witness_contact,
        "status": "SUBMITTED",
        "status_history": [{
            "status": "SUBMITTED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "remarks": "FIR submitted by complainant",
            "changed_by": current_user["email"]
        }],
        "assigned_investigator": None,
        "case_id": None,
        "case_number": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Generate hash for FIR
    fir_hash = hashlib.sha256(json.dumps(fir_data, default=str).encode()).hexdigest()
    fir_data["hash"] = fir_hash
    fir_data["ipfs_cid"] = "STORED_IN_MONGODB"
    
    await mongo_storage.save_fir(fir_id, fir_data)
    
    return {
        "message": "FIR submitted successfully",
        "fir_id": fir_id,
        "fir_number": fir_number,
        "status": "SUBMITTED",
        "hash": fir_data.get("hash", "")
    }

@router.get("/pending")
async def get_pending_firs(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    all_firs = await mongo_storage.get_all_firs()
    pending = [f for f in all_firs if f.get("status") in ["SUBMITTED", "UNDER_REVIEW"]]
    return sorted(pending, key=lambda x: x.get("created_at", ""), reverse=True)

@router.put("/{fir_id}/status")
async def update_fir_status(
    fir_id: str,
    payload: FIRStatusUpdate,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    fir = await mongo_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    old_status = fir["status"]
    fir["status"] = payload.status
    fir["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "status_history" not in fir:
        fir["status_history"] = []
    fir["status_history"].append({
        "status": payload.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "remarks": payload.remarks or f"Status changed to {payload.status}",
        "changed_by": current_user["email"]
    })
    
    created_case = None
    
    # AUTO-CREATE CASE when status is ACCEPTED
    if payload.status == "ACCEPTED":
        fir["assigned_investigator"] = current_user["email"]
        fir["assigned_at"] = datetime.now(timezone.utc).isoformat()
        created_case = await auto_create_case_from_fir(fir, current_user["email"])
        fir["case_id"] = created_case["case_id"]
        fir["case_number"] = created_case["case_number"]
        
        # Send email to complainant
        from app.services.notification_service import notification_service
        
        complainant_email = fir.get("complainant_email")
        complainant_name = fir.get("complainant_name", "User")
        
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h2 style="margin: 0;">🏛️ Justice System</h2>
            </div>
            <div style="background: #0c0f1a; padding: 30px; border: 1px solid #1e293b; border-radius: 0 0 10px 10px;">
                <h3 style="color: #818cf8;">✓ Your FIR has been ACCEPTED!</h3>
                <p>Dear <strong>{complainant_name}</strong>,</p>
                <p>Good news! Your FIR has been reviewed and <strong>ACCEPTED</strong> by the investigator.</p>
                <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📋 FIR Number:</strong> {fir.get('fir_number')}</p>
                    <p><strong>⚖️ Case Number:</strong> {created_case.get('case_number')}</p>
                    <p><strong>👮 Assigned Investigator:</strong> {current_user.get('full_name', current_user['email'])}</p>
                </div>
                <p>You can now track your case progress from your dashboard.</p>
                <a href="http://localhost:5173/app" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">📱 View Case Status</a>
                <hr style="border-color: #1e293b; margin: 20px 0;">
                <p style="color: #64748b; font-size: 12px;">This is an automated notification from Justice System.</p>
            </div>
        </body>
        </html>
        """
        
        await notification_service.send_email(
            to_email=complainant_email,
            subject=f"✅ FIR Accepted - Case #{created_case.get('case_number')}",
            body=email_body
        )
    
    await mongo_storage.update_fir(fir_id, fir)
    
    response = {
        "message": f"FIR status updated from {old_status} to {payload.status}",
        "fir_id": fir_id,
        "status": payload.status
    }
    
    if created_case:
        response["case"] = created_case
        response["message"] = f"✅ FIR accepted! Case '{created_case['case_number']}' has been auto-created."
    
    return response

@router.get("/my")
async def get_my_firs(current_user: dict = Depends(require_roles(UserRole.PUBLIC_USER))):
    all_firs = await mongo_storage.get_all_firs()
    firs = [f for f in all_firs if f.get("complainant_email") == current_user["email"]]
    return sorted(firs, key=lambda x: x.get("created_at", ""), reverse=True)

@router.get("/all")
async def get_all_firs(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.COURT))):
    return await mongo_storage.get_all_firs()

@router.get("/{fir_id}")
async def get_fir(fir_id: str, current_user: dict = Depends(get_current_user)):
    fir = await mongo_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    if current_user["role"] == UserRole.PUBLIC_USER.value and fir.get("complainant_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your FIR")
    
    return fir