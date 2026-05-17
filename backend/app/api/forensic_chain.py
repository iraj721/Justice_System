# backend/app/api/forensic_chain.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/forensic/chain", tags=["Forensic Chain of Custody"])

class CustodyTransfer(BaseModel):
    evidence_id: str
    to_analyst_email: str
    reason: str

class CustodyAccess(BaseModel):
    evidence_id: str
    action: str
    notes: Optional[str] = None

@router.post("/track-access")
async def track_evidence_access(payload: CustodyAccess, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Track when evidence is accessed"""
    evidence = await mongo_storage.get_evidence(payload.evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    access_record = {
        "access_id": str(uuid.uuid4())[:8],
        "evidence_id": payload.evidence_id,
        "evidence_title": evidence.get("title"),
        "accessed_by": current_user["email"],
        "accessed_by_name": current_user.get("full_name"),
        "action": payload.action,
        "notes": payload.notes or f"Evidence {payload.action} by {current_user.get('full_name')}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if "custody_log" not in evidence:
        evidence["custody_log"] = []
    
    evidence["custody_log"].append(access_record)
    evidence["last_accessed"] = datetime.now(timezone.utc).isoformat()
    evidence["last_accessed_by"] = current_user["email"]
    
    await mongo_storage.save_evidence(payload.evidence_id, evidence)
    
    return access_record

@router.post("/transfer-custody")
async def transfer_custody(payload: CustodyTransfer, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Transfer evidence to another analyst"""
    evidence = await mongo_storage.get_evidence(payload.evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    target_user = await mongo_storage.get_user(payload.to_analyst_email)
    if not target_user or target_user.get("role") != "FORENSIC_ANALYST":
        raise HTTPException(status_code=404, detail="Target analyst not found")
    
    transfer_record = {
        "transfer_id": str(uuid.uuid4())[:8],
        "evidence_id": payload.evidence_id,
        "evidence_title": evidence.get("title"),
        "transferred_from": current_user["email"],
        "transferred_from_name": current_user.get("full_name"),
        "transferred_to": payload.to_analyst_email,
        "transferred_to_name": target_user.get("full_name"),
        "reason": payload.reason,
        "transferred_at": datetime.now(timezone.utc).isoformat(),
        "status": "COMPLETED"
    }
    
    access_record = {
        "access_id": str(uuid.uuid4())[:8],
        "evidence_id": payload.evidence_id,
        "evidence_title": evidence.get("title"),
        "accessed_by": current_user["email"],
        "accessed_by_name": current_user.get("full_name"),
        "action": "TRANSFER_OUT",
        "notes": f"Transferred to {target_user.get('full_name')} - Reason: {payload.reason}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if "custody_transfers" not in evidence:
        evidence["custody_transfers"] = []
    
    if "custody_log" not in evidence:
        evidence["custody_log"] = []
    
    evidence["custody_transfers"].append(transfer_record)
    evidence["custody_log"].append(access_record)
    evidence["current_custodian"] = payload.to_analyst_email
    evidence["current_custodian_name"] = target_user.get("full_name")
    evidence["last_transferred_at"] = datetime.now(timezone.utc).isoformat()
    
    await mongo_storage.save_evidence(payload.evidence_id, evidence)
    
    return transfer_record

@router.post("/transfer-in")
async def transfer_in_custody(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))
):
    """Accept transferred evidence"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    access_record = {
        "access_id": str(uuid.uuid4())[:8],
        "evidence_id": evidence_id,
        "evidence_title": evidence.get("title"),
        "accessed_by": current_user["email"],
        "accessed_by_name": current_user.get("full_name"),
        "action": "TRANSFER_IN",
        "notes": f"Evidence received by {current_user.get('full_name')}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if "custody_log" not in evidence:
        evidence["custody_log"] = []
    
    evidence["custody_log"].append(access_record)
    evidence["current_custodian"] = current_user["email"]
    evidence["current_custodian_name"] = current_user.get("full_name")
    evidence["last_transferred_in_at"] = datetime.now(timezone.utc).isoformat()
    
    await mongo_storage.save_evidence(evidence_id, evidence)
    
    return {"message": "Evidence received successfully", "evidence_id": evidence_id}

@router.get("/custody-log/{evidence_id}")
async def get_custody_log(evidence_id: str, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get complete chain of custody for evidence"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    all_activities = []
    
    # Add creation event
    all_activities.append({
        "type": "CREATION",
        "timestamp": evidence.get("created_at"),
        "by": evidence.get("created_by"),
        "by_name": evidence.get("created_by_name") or evidence.get("created_by", "System"),
        "details": "Evidence created and submitted to system"
    })
    
    # Add access logs
    for log in evidence.get("custody_log", []):
        all_activities.append({
            "type": "ACCESS",
            "timestamp": log.get("timestamp"),
            "by": log.get("accessed_by"),
            "by_name": log.get("accessed_by_name"),
            "action": log.get("action"),
            "details": log.get("notes")
        })
    
    # Add transfer logs
    for transfer in evidence.get("custody_transfers", []):
        all_activities.append({
            "type": "TRANSFER",
            "timestamp": transfer.get("transferred_at"),
            "from": transfer.get("transferred_from"),
            "from_name": transfer.get("transferred_from_name"),
            "to": transfer.get("transferred_to"),
            "to_name": transfer.get("transferred_to_name"),
            "reason": transfer.get("reason"),
            "details": f"Transferred from {transfer.get('transferred_from_name')} to {transfer.get('transferred_to_name')}"
        })
    
    # Sort by timestamp (newest first)
    all_activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "evidence_id": evidence_id,
        "evidence_title": evidence.get("title"),
        "current_custodian": evidence.get("current_custodian"),
        "current_custodian_name": evidence.get("current_custodian_name", "Not assigned"),
        "created_at": evidence.get("created_at"),
        "created_by": evidence.get("created_by"),
        "created_by_name": evidence.get("created_by_name"),
        "last_accessed": evidence.get("last_accessed"),
        "last_accessed_by": evidence.get("last_accessed_by"),
        "last_transferred_at": evidence.get("last_transferred_at"),
        "activities": all_activities,
        "access_log": evidence.get("custody_log", []),
        "transfer_log": evidence.get("custody_transfers", [])
    }

@router.get("/forensic-evidence")
async def get_forensic_evidence_list(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get all evidence available for forensic analyst"""
    all_evidence = await mongo_storage.get_all_evidence()
    
    evidence_list = []
    for evidence in all_evidence:
        evidence_list.append({
            "evidence_id": evidence.get("evidence_id"),
            "case_id": evidence.get("case_id"),
            "title": evidence.get("title"),
            "description": evidence.get("description"),
            "cloudinary_url": evidence.get("cloudinary_url") or evidence.get("ipfs_cid"),
            "hash": evidence.get("hash"),
            "status": evidence.get("status"),
            "analysis_status": evidence.get("analysis_status", "PENDING"),
            "current_custodian": evidence.get("current_custodian"),
            "current_custodian_name": evidence.get("current_custodian_name"),
            "created_at": evidence.get("created_at")
        })
    
    return evidence_list

@router.get("/evidence-history/{evidence_id}")
async def get_evidence_complete_history(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST, UserRole.INVESTIGATOR, UserRole.COURT)
)):
    """Get complete history of an evidence"""
    # Get evidence first
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Build complete history
    history = []
    
    # 1. Creation
    history.append({
        "type": "CREATION",
        "timestamp": evidence.get("created_at"),
        "action": "Evidence Uploaded",
        "description": f"Evidence '{evidence.get('title')}' was created",
        "by": evidence.get("created_by"),
        "by_name": evidence.get("created_by_name"),
        "details": {
            "title": evidence.get("title"),
            "description": evidence.get("description"),
            "hash": evidence.get("hash")
        }
    })
    
    # 2. Access logs
    for log in evidence.get("custody_log", []):
        history.append({
            "type": "ACCESS",
            "timestamp": log.get("timestamp"),
            "action": log.get("action", "ACCESSED"),
            "description": log.get("notes", f"Evidence accessed by {log.get('accessed_by_name')}"),
            "by": log.get("accessed_by"),
            "by_name": log.get("accessed_by_name"),
            "details": log
        })
    
    # 3. Transfers
    for transfer in evidence.get("custody_transfers", []):
        history.append({
            "type": "TRANSFER",
            "timestamp": transfer.get("transferred_at"),
            "action": "TRANSFERRED",
            "description": f"Evidence transferred from {transfer.get('transferred_from_name')} to {transfer.get('transferred_to_name')}",
            "from": transfer.get("transferred_from"),
            "from_name": transfer.get("transferred_from_name"),
            "to": transfer.get("transferred_to"),
            "to_name": transfer.get("transferred_to_name"),
            "details": transfer
        })
    
    # 4. Verifications
    for verify in evidence.get("verifications", []):
        history.append({
            "type": "VERIFICATION",
            "timestamp": verify.get("verified_at"),
            "action": "VERIFIED" if verify.get("result") else "VERIFICATION_FAILED",
            "description": f"Evidence verification {'passed' if verify.get('result') else 'failed'}",
            "by": verify.get("verified_by"),
            "by_name": verify.get("verified_by_name"),
            "details": verify
        })
    
    # 5. Analysis
    if evidence.get("analysis_status") == "COMPLETED":
        history.append({
            "type": "ANALYSIS",
            "timestamp": evidence.get("analysis_completed_at"),
            "action": "ANALYSIS_COMPLETED",
            "description": f"Forensic analysis completed by {evidence.get('analyzed_by_name')}",
            "by": evidence.get("analyzed_by"),
            "by_name": evidence.get("analyzed_by_name"),
            "details": {
                "analysis_status": evidence.get("analysis_status"),
                "analysis_id": evidence.get("analysis_id")
            }
        })
    
    # Sort by timestamp
    history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "evidence_id": evidence_id,
        "evidence_title": evidence.get("title"),
        "evidence_description": evidence.get("description"),
        "current_status": evidence.get("status"),
        "current_analysis_status": evidence.get("analysis_status", "PENDING"),
        "current_custodian": evidence.get("current_custodian"),
        "current_custodian_name": evidence.get("current_custodian_name"),
        "created_at": evidence.get("created_at"),
        "created_by": evidence.get("created_by"),
        "created_by_name": evidence.get("created_by_name"),
        "history": history,
        "verification_count": len(evidence.get("verifications", [])),
        "view_count": len([l for l in evidence.get("custody_log", []) if l.get("action") == "VIEW"]),
        "transfer_count": len(evidence.get("custody_transfers", [])),
        "last_verified_at": evidence.get("verifications", [])[-1].get("verified_at") if evidence.get("verifications") else None
    }