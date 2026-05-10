from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import uuid
import hashlib
import requests
import json
from io import BytesIO
from app.core.authz import require_roles, get_current_user
from app.core.roles import UserRole
from app.core.config import settings
from app.services.ipfs_storage import ipfs_storage
from app.core.ipfs_client import ipfs_client
from app.services.chain_anchor import anchor_sha256
from app.services.encryption_service import encryption_service
from app.api.websocket import notify_case_update
from app.services.chain_anchor import (
    anchor_sha256, 
    approve_multisig, 
    get_approval_status,
    file_appeal,
    get_appeal,
    deposit_escrow,
    release_fine,
    get_escrow,
    update_case_timeline
)

# PDF libraries
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("Warning: reportlab not installed. PDF download disabled. Run: pip install reportlab")

# DOCX libraries
try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Warning: python-docx not installed. DOCX download disabled. Run: pip install python-docx")

router = APIRouter(prefix="/cases", tags=["Cases"])

class CaseCreateRequest(BaseModel):
    fir_id: str
    title: str
    description: str
    priority: str = "MEDIUM"

class CaseResponse(BaseModel):
    case_id: str
    case_number: str
    fir_id: str
    title: str
    description: str
    status: str
    priority: str
    investigator_email: str
    created_at: str
    updated_at: str
    ipfs_cid: str = ""
    hash: str = ""

class SuspectAddRequest(BaseModel):
    case_id: str
    name: str
    father_name: str
    cnic: Optional[str] = None
    address: str
    description: str
    photo_cid: Optional[str] = None

class WitnessAddRequest(BaseModel):
    case_id: str
    name: str
    contact: str
    address: str
    statement: str

class EvidenceCreateRequest(BaseModel):
    case_id: str
    title: str
    description: str
    ipfs_cid: str
    file_hash: str

class EvidenceVerifyRequest(BaseModel):
    evidence_id: str
    provided_hash: str

class SubmitToCourtRequest(BaseModel):
    court_email: str

class SubmitToForensicRequest(BaseModel):
    forensic_email: str

async def get_file_hash_from_ipfs(cid: str) -> str:
    try:
        response = requests.get(f"{settings.IPFS_GATEWAY_URL}/ipfs/{cid}", timeout=30)
        response.raise_for_status()
        return hashlib.sha256(response.content).hexdigest()
    except Exception as e:
        print(f"Error getting file from IPFS: {e}")
        return ""

# backend/app/api/cases.py - UPDATE the create_case endpoint

@router.post("/", response_model=CaseResponse)
async def create_case(
    payload: CaseCreateRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    fir = ipfs_storage.get_fir(payload.fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    case_id = f"CASE-{uuid.uuid4().hex[:10].upper()}"
    case_number = f"JUSTICE-CASE-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    
    # Get full user details for investigator name
    investigator_user = ipfs_storage.get_user(current_user["email"])
    investigator_name = investigator_user.get("full_name", current_user.get("full_name", current_user["email"]))
    
    case_data = {
        "case_id": case_id,
        "case_number": case_number,
        "fir_id": payload.fir_id,
        "title": payload.title,
        "description": payload.description,
        "priority": payload.priority,
        "status": "UNDER_INVESTIGATION",
        "investigator_email": current_user["email"],
        "investigator_name": investigator_name,  # FIXED: Now using actual name
        "investigator_phone": investigator_user.get("phone_number", ""),
        "suspects": [],
        "witnesses": [],
        "evidence": [],
        "timeline": [{
            "action": "Case created",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "by": current_user["email"],
            "by_name": investigator_name
        }],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        case_cid = await ipfs_client.upload_json(case_data)
        case_hash = ipfs_client.generate_hash(case_data)
        case_data["ipfs_cid"] = case_cid
        case_data["hash"] = case_hash
    except Exception as e:
        print(f"IPFS upload failed for case: {e}")
        case_data["ipfs_cid"] = "UPLOAD_FAILED"
        case_data["hash"] = ipfs_client.generate_hash(case_data)
    
    ipfs_storage.save_case(case_id, case_data)
    anchor_sha256(
        object_type="CASE",
        object_id=case_id,
        sha256_hex=case_data.get("hash", ""),
        ipfs_cid=case_data.get("ipfs_cid", ""),
    )
    
    fir["status"] = "ACCEPTED"
    fir["assigned_investigator"] = current_user["email"]
    fir["case_id"] = case_id
    ipfs_storage.update_fir(payload.fir_id, fir)
    
    return CaseResponse(
        case_id=case_id,
        case_number=case_number,
        fir_id=payload.fir_id,
        title=payload.title,
        description=payload.description,
        status=case_data["status"],
        priority=payload.priority,
        investigator_email=current_user["email"],
        created_at=case_data["created_at"],
        updated_at=case_data["updated_at"],
        ipfs_cid=case_data.get("ipfs_cid", ""),
        hash=case_data.get("hash", "")
    )

@router.post("/evidence")
async def add_evidence(
    payload: EvidenceCreateRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    case = ipfs_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_id = f"EVD-{uuid.uuid4().hex[:10].upper()}"
    
    evidence_data = {
        "evidence_id": evidence_id,
        "case_id": payload.case_id,
        "title": payload.title,
        "description": payload.description,
        "ipfs_cid": payload.ipfs_cid,
        "hash": payload.file_hash,
        "created_by": current_user["email"],
        "status": "COLLECTED",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    ipfs_storage.save_evidence(evidence_id, evidence_data)
    anchor_sha256(
        object_type="EVIDENCE",
        object_id=evidence_id,
        sha256_hex=evidence_data.get("hash", ""),
        ipfs_cid=evidence_data.get("ipfs_cid", ""),
    )
    
    if "evidence" not in case:
        case["evidence"] = []
    case["evidence"].append(evidence_id)
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    ipfs_storage.update_case(payload.case_id, case)
    
    return {
        "evidence_id": evidence_id,
        "hash": payload.file_hash,
        "ipfs_cid": payload.ipfs_cid,
        "title": payload.title,
        "case_id": payload.case_id,
        "status": "COLLECTED",
        "created_at": evidence_data["created_at"],
        "message": "Evidence added successfully"
    }


@router.post("/evidence/upload-file")
async def add_evidence_upload_file(
    case_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR)),
):
    """Upload evidence file to IPFS and register metadata (same fields as JSON /evidence flow)."""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    result = await ipfs_client.upload_file(content, file.filename or "evidence.bin")
    cid = result["cid"]
    evidence_id = f"EVD-{uuid.uuid4().hex[:10].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    evidence_data = {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "title": title,
        "description": description,
        "ipfs_cid": cid,
        "hash": file_hash,
        "file_size": len(content),
        "mime_type": file.content_type or "application/octet-stream",
        "original_filename": file.filename or "evidence.bin",
        "pinned_at": now,
        "gateway_url": result.get("gateway_url"),
        "created_by": current_user["email"],
        "status": "COLLECTED",
        "created_at": now,
        "updated_at": now,
    }

    ipfs_storage.save_evidence(evidence_id, evidence_data)
    if "evidence" not in case:
        case["evidence"] = []
    case["evidence"].append(evidence_id)
    case["updated_at"] = now
    ipfs_storage.update_case(case_id, case)
    anchor_sha256(
        object_type="EVIDENCE",
        object_id=evidence_id,
        sha256_hex=evidence_data.get("hash", ""),
        ipfs_cid=evidence_data.get("ipfs_cid", ""),
    )

    return {
        "evidence_id": evidence_id,
        "hash": file_hash,
        "ipfs_cid": cid,
        "title": title,
        "case_id": case_id,
        "status": "COLLECTED",
        "created_at": evidence_data["created_at"],
        "message": "Evidence uploaded to IPFS and registered successfully",
    }


@router.post("/evidence/verify-by-file")
async def verify_evidence_by_file(
    evidence_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.FORENSIC_ANALYST, UserRole.COURT))
):
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    stored_hash = evidence.get("hash")
    stored_cid = evidence.get("ipfs_cid", "N/A")
    stored_title = evidence.get("title", "N/A")
    
    file_content = await file.read()
    uploaded_file_name = file.filename
    uploaded_file_size = len(file_content)
    uploaded_hash = hashlib.sha256(file_content).hexdigest()
    is_valid = uploaded_hash == stored_hash
    
    verification_record = {
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": current_user["email"],
        "uploaded_file_name": uploaded_file_name,
        "uploaded_file_size": uploaded_file_size,
        "uploaded_hash": uploaded_hash,
        "stored_hash": stored_hash,
        "result": is_valid
    }
    
    if "verifications" not in evidence:
        evidence["verifications"] = []
    evidence["verifications"].append(verification_record)
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    return {
        "evidence_id": evidence_id,
        "evidence_title": stored_title,
        "verified": is_valid,
        "uploaded_file_name": uploaded_file_name,
        "uploaded_hash": uploaded_hash,
        "stored_hash": stored_hash,
        "stored_cid": stored_cid,
        "message": "✅ FILE IS AUTHENTIC!" if is_valid else "❌ FILE IS TAMPERED!",
        "verification_time": verification_record["verified_at"],
        "match_percentage": 100 if is_valid else 0
    }

@router.get("/evidence/investigator")
async def get_investigator_evidence(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    all_cases = ipfs_storage.get_all_cases()
    investigator_case_ids = [case["case_id"] for case in all_cases if case.get("investigator_email") == current_user["email"]]
    all_evidence = ipfs_storage.get_all_evidence()
    evidence = [e for e in all_evidence if e.get("case_id") in investigator_case_ids]
    evidence.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return evidence

@router.get("/evidence/case/{case_id}")
async def get_case_evidence_list(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    evidence_ids = case.get("evidence", [])
    evidence_list = []
    for ev_id in evidence_ids:
        ev = ipfs_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append({
                "evidence_id": ev["evidence_id"],
                "title": ev["title"],
                "hash": ev.get("hash", ""),
                "ipfs_cid": ev.get("ipfs_cid", ""),
                "status": ev.get("status", "UNKNOWN"),
                "created_at": ev.get("created_at", "")
            })
    return evidence_list

@router.get("/evidence/{evidence_id}")
async def get_evidence(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.FORENSIC_ANALYST, UserRole.COURT))
):
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence

@router.post("/evidence/verify")
async def verify_evidence(
    payload: EvidenceVerifyRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.FORENSIC_ANALYST, UserRole.COURT))
):
    evidence = ipfs_storage.get_evidence(payload.evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    stored_hash = evidence.get("hash")
    is_valid = payload.provided_hash == stored_hash
    
    verification_record = {
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": current_user["email"],
        "provided_hash": payload.provided_hash,
        "stored_hash": stored_hash,
        "result": is_valid
    }
    
    if "verifications" not in evidence:
        evidence["verifications"] = []
    evidence["verifications"].append(verification_record)
    ipfs_storage.save_evidence(payload.evidence_id, evidence)
    
    return {
        "evidence_id": payload.evidence_id,
        "verified": is_valid,
        "stored_hash": stored_hash,
        "provided_hash": payload.provided_hash,
        "message": "✅ Evidence is AUTHENTIC!" if is_valid else "❌ Evidence TAMPERED!",
        "verification_time": verification_record["verified_at"]
    }

@router.get("/debug/all-cids")
async def get_all_cids(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    all_cases = ipfs_storage.get_all_cases()
    all_evidence = ipfs_storage.get_all_evidence()
    all_firs = ipfs_storage.get_all_firs()
    
    return {
        "cases": [{"case_id": c.get("case_id"), "case_number": c.get("case_number"), "ipfs_cid": c.get("ipfs_cid", "NOT_UPLOADED"), "hash": c.get("hash", "NOT_GENERATED")} for c in all_cases],
        "evidence": [{"evidence_id": e.get("evidence_id"), "title": e.get("title"), "ipfs_cid": e.get("ipfs_cid", "NOT_UPLOADED"), "hash": e.get("hash", "NOT_GENERATED")} for e in all_evidence],
        "firs": [{"fir_id": f.get("fir_id"), "fir_number": f.get("fir_number"), "ipfs_cid": f.get("ipfs_cid", "NOT_UPLOADED"), "hash": f.get("hash", "NOT_GENERATED")} for f in all_firs]
    }

@router.post("/suspects")
async def add_suspect(
    payload: SuspectAddRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    case = ipfs_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    suspect = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "father_name": payload.father_name,
        "cnic": payload.cnic,
        "address": payload.address,
        "description": payload.description,
        "photo_cid": payload.photo_cid,
        "added_by": current_user["email"],
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    case["suspects"].append(suspect)
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    ipfs_storage.update_case(payload.case_id, case)
    
    return {"status": "success", "suspect": suspect}

@router.post("/witnesses")
async def add_witness(
    payload: WitnessAddRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    case = ipfs_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    witness = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "contact": payload.contact,
        "address": payload.address,
        "statement": payload.statement,
        "added_by": current_user["email"],
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    case["witnesses"].append(witness)
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    ipfs_storage.update_case(payload.case_id, case)
    
    return {"status": "success", "witness": witness}

@router.get("/investigator")
async def get_investigator_cases(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    all_cases = ipfs_storage.get_all_cases()
    cases = [c for c in all_cases if c.get("investigator_email") == current_user["email"]]
    return sorted(cases, key=lambda x: x.get("created_at", ""), reverse=True)

@router.post("/evidence/transfer/forensic/{evidence_id}")
async def transfer_to_forensic(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence["status"] = "TRANSFERRED_TO_FORENSIC"
    evidence["transferred_at"] = datetime.now(timezone.utc).isoformat()
    evidence["transferred_by"] = current_user["email"]
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    return {"status": "ok", "evidence_id": evidence_id}

@router.post("/evidence/transfer/court/{evidence_id}")
async def transfer_to_court(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence["status"] = "SUBMITTED_TO_COURT"
    evidence["transferred_to_court_at"] = datetime.now(timezone.utc).isoformat()
    evidence["transferred_by"] = current_user["email"]
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    case = ipfs_storage.get_case(evidence["case_id"])
    if case:
        case["status"] = "UNDER_COURT_REVIEW"
        ipfs_storage.update_case(evidence["case_id"], case)
    
    return {"status": "ok", "evidence_id": evidence_id}

@router.get("/{case_id}")
async def get_case(case_id: str, current_user: dict = Depends(get_current_user)):
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/{case_id}/evidence")
async def get_case_evidence(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_ids = case.get("evidence", [])
    evidence_list = []
    for ev_id in evidence_ids:
        ev = ipfs_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append(ev)
    
    return evidence_list

@router.get("/debug/all-evidence")
async def debug_all_evidence(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    all_evidence = ipfs_storage.get_all_evidence()
    return {"count": len(all_evidence), "evidence": all_evidence}

@router.get("/generate-report/{case_id}")
async def generate_investigation_report(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_list = []
    for ev_id in case.get("evidence", []):
        ev = ipfs_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append(ev)
    
    fir = ipfs_storage.get_fir(case.get("fir_id"))
    
    report = {
        "report_id": f"REP-{uuid.uuid4().hex[:8].upper()}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": current_user["email"],
        "case_details": {
            "case_id": case.get("case_id"),
            "case_number": case.get("case_number"),
            "title": case.get("title"),
            "description": case.get("description"),
            "status": case.get("status"),
            "priority": case.get("priority"),
            "created_at": case.get("created_at"),
            "investigator": case.get("investigator_email"),
            "investigator_name": case.get("investigator_name")
        },
        "fir_details": {
            "fir_id": fir.get("fir_id") if fir else None,
            "fir_number": fir.get("fir_number") if fir else None,
            "complainant_name": fir.get("complainant_name") if fir else None,
            "complainant_contact": fir.get("complainant_contact") if fir else None,
            "complainant_address": fir.get("complainant_address") if fir else None,
            "incident_title": fir.get("incident_title") if fir else None,
            "incident_description": fir.get("incident_description") if fir else None,
            "incident_location": fir.get("incident_location") if fir else None,
            "incident_datetime": fir.get("incident_datetime") if fir else None,
            "accused_person": fir.get("accused_person") if fir else None,
            "accused_description": fir.get("accused_description") if fir else None,
            "witness_names": fir.get("witness_names") if fir else None,
            "witness_contact": fir.get("witness_contact") if fir else None
        },
        "suspects": case.get("suspects", []),
        "witnesses": case.get("witnesses", []),
        "evidence": [
            {
                "evidence_id": e.get("evidence_id"),
                "title": e.get("title"),
                "description": e.get("description"),
                "ipfs_cid": e.get("ipfs_cid"),
                "hash": e.get("hash"),
                "status": e.get("status"),
                "collected_by": e.get("created_by"),
                "collected_at": e.get("created_at"),
                "verifications": e.get("verifications", [])
            } for e in evidence_list
        ],
        "timeline": case.get("timeline", []),
        "evidence_verification_status": {
            "total": len(evidence_list),
            "verified": len([e for e in evidence_list if e.get("verifications")]),
            "pending": len([e for e in evidence_list if not e.get("verifications")]),
            "tampered": len([e for e in evidence_list if e.get("verifications") and not e.get("verifications")[-1].get("result")])
        },
        "status_summary": {
            "case_status": case.get("status"),
            "evidence_collected": len(evidence_list),
            "suspects_identified": len(case.get("suspects", [])),
            "witnesses_recorded": len(case.get("witnesses", []))
        }
    }
    
    ipfs_storage.save_report(report["report_id"], report)
    return report

@router.get("/download-report/{case_id}")
async def download_investigation_report(
    case_id: str,
    format: str = "pdf",
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.COURT))
):
    """Download investigation report in PDF, DOCX, or TXT format"""
    
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_list = []
    for ev_id in case.get("evidence", []):
        ev = ipfs_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append(ev)
    
    fir = ipfs_storage.get_fir(case.get("fir_id"))
    
    report_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": current_user["email"],
        "case_details": {
            "case_id": case.get("case_id"),
            "case_number": case.get("case_number"),
            "title": case.get("title"),
            "description": case.get("description"),
            "status": case.get("status"),
            "priority": case.get("priority"),
            "created_at": case.get("created_at"),
            "investigator": case.get("investigator_email")
        },
        "fir_details": {
            "fir_number": fir.get("fir_number") if fir else None,
            "complainant_name": fir.get("complainant_name") if fir else None,
            "complainant_contact": fir.get("complainant_contact") if fir else None,
            "incident_title": fir.get("incident_title") if fir else None,
            "incident_description": fir.get("incident_description") if fir else None,
            "incident_location": fir.get("incident_location") if fir else None,
            "incident_datetime": fir.get("incident_datetime") if fir else None,
            "accused_person": fir.get("accused_person") if fir else None,
            "witness_names": fir.get("witness_names") if fir else None
        },
        "suspects": case.get("suspects", []),
        "witnesses": case.get("witnesses", []),
        "evidence": [
            {
                "title": e.get("title"),
                "description": e.get("description", ""),
                "ipfs_cid": e.get("ipfs_cid"),
                "hash": e.get("hash"),
                "status": e.get("status")
            } for e in evidence_list
        ],
        "timeline": case.get("timeline", [])
    }
    
    case_number = case.get("case_number", case_id)
    
    if format.lower() == "pdf":
        return await generate_pdf_report(report_data, case_number)
    elif format.lower() == "docx":
        return await generate_docx_report(report_data, case_number)
    else:
        return await generate_txt_report(report_data, case_number)

async def generate_pdf_report(data: dict, case_number: str) -> Response:
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available. Install reportlab: pip install reportlab")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#1e293b'), alignment=1, spaceAfter=30)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor('#3b82f6'), spaceBefore=20, spaceAfter=10)
    
    story.append(Paragraph(f"INVESTIGATION REPORT", title_style))
    story.append(Paragraph(f"Case Number: {case_number}", styles['Normal']))
    story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("1. CASE DETAILS", heading_style))
    case_table = Table([
        ["Case Number", data['case_details'].get('case_number', 'N/A')],
        ["Title", data['case_details'].get('title', 'N/A')],
        ["Status", data['case_details'].get('status', 'N/A')],
        ["Priority", data['case_details'].get('priority', 'N/A')],
        ["Investigator", data['case_details'].get('investigator', 'N/A')]
    ], colWidths=[2*inch, 4*inch])
    case_table.setStyle(TableStyle([('BACKGROUND', (0,0), (0,-1), colors.lightgrey), ('GRID', (0,0), (-1,-1), 0.5, colors.grey)]))
    story.append(case_table)
    story.append(Spacer(1, 15))
    
    if data['fir_details'] and data['fir_details'].get('fir_number'):
        story.append(Paragraph("2. FIR DETAILS", heading_style))
        story.append(Paragraph(f"FIR Number: {data['fir_details'].get('fir_number', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"Complainant: {data['fir_details'].get('complainant_name', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"Incident: {data['fir_details'].get('incident_title', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"Location: {data['fir_details'].get('incident_location', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 15))
    
    if data['suspects']:
        story.append(Paragraph("3. SUSPECTS", heading_style))
        for s in data['suspects']:
            story.append(Paragraph(f"• {s.get('name', 'Unknown')}: {s.get('description', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 10))
    
    if data['witnesses']:
        story.append(Paragraph("4. WITNESSES", heading_style))
        for w in data['witnesses']:
            story.append(Paragraph(f"• {w.get('name', 'Unknown')}: {w.get('statement', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 10))
    
    if data['evidence']:
        story.append(Paragraph("5. EVIDENCE", heading_style))
        for e in data['evidence']:
            story.append(Paragraph(f"• {e.get('title', 'Unknown')} - Status: {e.get('status', 'N/A')}", styles['Normal']))
            story.append(Paragraph(f"  CID: {e.get('ipfs_cid', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 10))
    
    doc.build(story)
    buffer.seek(0)
    
    return Response(
    content=buffer.getvalue(), 
    media_type="application/pdf", 
    headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Content-Disposition": f"attachment; filename=investigation_report_{case_number}.pdf"
    }
)

async def generate_docx_report(data: dict, case_number: str) -> Response:
    if not DOCX_AVAILABLE:
        raise HTTPException(status_code=500, detail="DOCX generation not available. Install python-docx: pip install python-docx")
    
    doc = docx.Document()
    title = doc.add_heading('INVESTIGATION REPORT', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph(f"Case Number: {case_number}")
    doc.add_paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}")
    doc.add_paragraph()
    
    doc.add_heading('1. CASE DETAILS', level=1)
    doc.add_paragraph(f"Case Number: {data['case_details'].get('case_number', 'N/A')}")
    doc.add_paragraph(f"Title: {data['case_details'].get('title', 'N/A')}")
    doc.add_paragraph(f"Status: {data['case_details'].get('status', 'N/A')}")
    doc.add_paragraph(f"Investigator: {data['case_details'].get('investigator', 'N/A')}")
    doc.add_paragraph()
    
    if data['fir_details'] and data['fir_details'].get('fir_number'):
        doc.add_heading('2. FIR DETAILS', level=1)
        doc.add_paragraph(f"FIR Number: {data['fir_details'].get('fir_number', 'N/A')}")
        doc.add_paragraph(f"Complainant: {data['fir_details'].get('complainant_name', 'N/A')}")
        doc.add_paragraph(f"Incident: {data['fir_details'].get('incident_title', 'N/A')}")
        doc.add_paragraph()
    
    if data['suspects']:
        doc.add_heading('3. SUSPECTS', level=1)
        for s in data['suspects']:
            doc.add_paragraph(f"• {s.get('name', 'Unknown')}: {s.get('description', 'N/A')}")
        doc.add_paragraph()
    
    if data['witnesses']:
        doc.add_heading('4. WITNESSES', level=1)
        for w in data['witnesses']:
            doc.add_paragraph(f"• {w.get('name', 'Unknown')}: {w.get('statement', 'N/A')}")
        doc.add_paragraph()
    
    if data['evidence']:
        doc.add_heading('5. EVIDENCE', level=1)
        for e in data['evidence']:
            doc.add_paragraph(f"• {e.get('title', 'Unknown')}", style='List Bullet')
            doc.add_paragraph(f"  Status: {e.get('status', 'N/A')}")
            doc.add_paragraph(f"  IPFS CID: {e.get('ipfs_cid', 'N/A')}")
    
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return Response(content=buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": f"attachment; filename=investigation_report_{case_number}.docx"})

async def generate_txt_report(data: dict, case_number: str) -> Response:
    lines = []
    lines.append("=" * 80)
    lines.append("INVESTIGATION REPORT".center(80))
    lines.append("=" * 80)
    lines.append(f"Case Number: {case_number}")
    lines.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    
    lines.append("-" * 80)
    lines.append("1. CASE DETAILS")
    lines.append("-" * 80)
    lines.append(f"Case Number: {data['case_details'].get('case_number', 'N/A')}")
    lines.append(f"Title: {data['case_details'].get('title', 'N/A')}")
    lines.append(f"Status: {data['case_details'].get('status', 'N/A')}")
    lines.append(f"Investigator: {data['case_details'].get('investigator', 'N/A')}")
    lines.append("")
    
    if data['fir_details'] and data['fir_details'].get('fir_number'):
        lines.append("-" * 80)
        lines.append("2. FIR DETAILS")
        lines.append("-" * 80)
        lines.append(f"FIR Number: {data['fir_details'].get('fir_number', 'N/A')}")
        lines.append(f"Complainant: {data['fir_details'].get('complainant_name', 'N/A')}")
        lines.append(f"Incident: {data['fir_details'].get('incident_title', 'N/A')}")
        lines.append("")
    
    if data['suspects']:
        lines.append("-" * 80)
        lines.append("3. SUSPECTS")
        lines.append("-" * 80)
        for s in data['suspects']:
            lines.append(f"• {s.get('name', 'Unknown')}: {s.get('description', 'N/A')}")
        lines.append("")
    
    if data['witnesses']:
        lines.append("-" * 80)
        lines.append("4. WITNESSES")
        lines.append("-" * 80)
        for w in data['witnesses']:
            lines.append(f"• {w.get('name', 'Unknown')}: {w.get('statement', 'N/A')}")
        lines.append("")
    
    if data['evidence']:
        lines.append("-" * 80)
        lines.append("5. EVIDENCE")
        lines.append("-" * 80)
        for e in data['evidence']:
            lines.append(f"• {e.get('title', 'Unknown')}")
            lines.append(f"  Status: {e.get('status', 'N/A')}")
            lines.append(f"  IPFS CID: {e.get('ipfs_cid', 'N/A')}")
        lines.append("")
    
    lines.append("=" * 80)
    lines.append("END OF REPORT".center(80))
    lines.append("=" * 80)
    
    return Response(content="\n".join(lines).encode('utf-8'), media_type="text/plain", headers={"Content-Disposition": f"attachment; filename=investigation_report_{case_number}.txt"})

# backend/app/api/cases.py
# REPLACE the existing submit-to-court endpoint with this:

@router.post("/submit-to-court/{case_id}")
async def submit_case_to_court(
    case_id: str,
    payload: SubmitToCourtRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check if court officer exists
    target_user = ipfs_storage.get_user(payload.court_email)
    if not target_user or target_user.get("role") != "COURT":
        raise HTTPException(status_code=404, detail="Court officer not found")
    
    for ev_id in case.get("evidence", []):
        ev = ipfs_storage.get_evidence(ev_id)
        if ev:
            ev["status"] = "SUBMITTED_TO_COURT"
            ev["submitted_to_court_at"] = datetime.now(timezone.utc).isoformat()
            ev["submitted_by"] = current_user["email"]
            ev["assigned_court_officer"] = payload.court_email
            ev["assigned_court_officer_name"] = target_user.get("full_name")
            ipfs_storage.save_evidence(ev_id, ev)
    
    case["status"] = "SUBMITTED_TO_COURT"
    case["submitted_to_court_at"] = datetime.now(timezone.utc).isoformat()
    case["submitted_by"] = current_user["email"]
    case["assigned_court_officer"] = payload.court_email
    case["assigned_court_officer_name"] = target_user.get("full_name")
    ipfs_storage.update_case(case_id, case)
    
    return {
        "message": f"Case submitted to {payload.court_email}", 
        "case_id": case_id, 
        "assigned_to": payload.court_email,
        "assigned_to_name": target_user.get("full_name")
    }


# REPLACE the existing submit-to-forensic endpoint with this:

@router.post("/submit-to-forensic/{evidence_id}")
async def submit_evidence_to_forensic(
    evidence_id: str,
    payload: SubmitToForensicRequest,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Check if forensic analyst exists
    target_user = ipfs_storage.get_user(payload.forensic_email)
    if not target_user or target_user.get("role") != "FORENSIC_ANALYST":
        raise HTTPException(status_code=404, detail="Forensic analyst not found")
    
    evidence["status"] = "TRANSFERRED_TO_FORENSIC"
    evidence["submitted_to_forensic_at"] = datetime.now(timezone.utc).isoformat()
    evidence["submitted_by"] = current_user["email"]
    evidence["assigned_forensic_analyst"] = payload.forensic_email
    evidence["assigned_forensic_analyst_name"] = target_user.get("full_name")
    evidence["analysis_status"] = "PENDING"
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    # Add to timeline
    case = ipfs_storage.get_case(evidence.get("case_id"))
    if case:
        if "timeline" not in case:
            case["timeline"] = []
        case["timeline"].append({
            "action": f"Evidence {evidence_id} submitted to forensic lab",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "by": current_user["email"],
            "assigned_to": payload.forensic_email,
            "assigned_to_name": target_user.get("full_name")
        })
        ipfs_storage.update_case(evidence.get("case_id"), case)
    
    return {
        "message": f"Evidence submitted to {payload.forensic_email}", 
        "evidence_id": evidence_id, 
        "assigned_to": payload.forensic_email,
        "assigned_to_name": target_user.get("full_name")
    }

@router.post("/evidence/upload-encrypted")
async def add_evidence_encrypted(
    case_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR)),
):
    """Upload evidence file to IPFS with encryption"""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    content = await file.read()
    
    # Encrypt evidence before uploading
    encrypted_content = encryption_service.encrypt(content)
    if encrypted_content is None and encryption_service.encryption_enabled:
        raise HTTPException(status_code=500, detail="Encryption failed")
    
    # Use encrypted content for hash calculation
    content_to_hash = encrypted_content if encrypted_content else content
    file_hash = hashlib.sha256(content_to_hash).hexdigest()
    
    # Upload encrypted file to IPFS
    result = await ipfs_client.upload_file(
        encrypted_content if encrypted_content else content, 
        f"{file.filename}.encrypted" if encrypted_content else file.filename
    )
    cid = result["cid"]
    
    evidence_id = f"EVD-{uuid.uuid4().hex[:10].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    evidence_data = {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "title": title,
        "description": description,
        "ipfs_cid": cid,
        "hash": file_hash,
        "encrypted": encryption_service.encryption_enabled,
        "file_size": len(content),
        "original_filename": file.filename,
        "created_by": current_user["email"],
        "status": "COLLECTED",
        "created_at": now,
        "updated_at": now,
    }

    ipfs_storage.save_evidence(evidence_id, evidence_data)
    
    if "evidence" not in case:
        case["evidence"] = []
    case["evidence"].append(evidence_id)
    case["updated_at"] = now
    ipfs_storage.update_case(case_id, case)
    
    anchor_sha256(
        object_type="EVIDENCE",
        object_id=evidence_id,
        sha256_hex=evidence_data.get("hash", ""),
        ipfs_cid=evidence_data.get("ipfs_cid", ""),
    )
    
    # Send WebSocket notification
    await notify_case_update(case_id, "evidence_added", {
        "evidence_id": evidence_id,
        "title": title,
        "added_by": current_user["email"]
    })
    
    return {
        "evidence_id": evidence_id,
        "hash": file_hash,
        "ipfs_cid": cid,
        "title": title,
        "case_id": case_id,
        "encrypted": encryption_service.encryption_enabled,
        "message": "Evidence uploaded with encryption"
    }

# ADD this endpoint for decryption (court/forensic only)
@router.get("/evidence/decrypt/{evidence_id}")
async def decrypt_evidence(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.COURT, UserRole.FORENSIC_ANALYST))
):
    """Decrypt evidence for authorized personnel"""
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    if not evidence.get("encrypted"):
        return {"message": "Evidence not encrypted", "data": evidence}
    
    # Get encrypted content from IPFS
    encrypted_content = await ipfs_client.get_file(evidence.get("ipfs_cid"))
    if not encrypted_content:
        raise HTTPException(status_code=404, detail="Evidence file not found")
    
    # Decrypt
    decrypted = encryption_service.decrypt(encrypted_content)
    if decrypted is None:
        raise HTTPException(status_code=500, detail="Decryption failed")
    
    # Log access
    log_entry = {
        "decrypted_at": datetime.now(timezone.utc).isoformat(),
        "decrypted_by": current_user["email"],
        "decrypted_by_name": current_user.get("full_name")
    }
    
    if "decryption_logs" not in evidence:
        evidence["decryption_logs"] = []
    evidence["decryption_logs"].append(log_entry)
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    return {
        "evidence_id": evidence_id,
        "decrypted": True,
        "file_size": len(decrypted),
        "original_filename": evidence.get("original_filename"),
        "decrypted_by": current_user["email"]
    }
# ============ NEW ENDPOINT: Multi-Signature Approval for Evidence ============

@router.post("/evidence/approve/{evidence_id}")
async def approve_evidence(
    evidence_id: str,
    approver_level: int,  # 1=IO, 2=DSP, 3=Court
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.COURT))
):
    """Multi-signature approval for evidence"""
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence_hash = evidence.get("hash", "")
    
    # Send to blockchain
    tx = approve_multisig(evidence_hash, approver_level)
    
    # Update local record
    if "approvals" not in evidence:
        evidence["approvals"] = []
    
    approval_level_names = {1: "IO", 2: "DSP", 3: "COURT"}
    
    evidence["approvals"].append({
        "level": approver_level,
        "level_name": approval_level_names.get(approver_level, "UNKNOWN"),
        "approved_by": current_user["email"],
        "approved_by_name": current_user.get("full_name"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tx_hash": tx.tx_hash if tx else None
    })
    
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    # Get current approval status
    status = get_approval_status(evidence_hash)
    
    return {
        "message": f"Level {approver_level} approval recorded",
        "evidence_id": evidence_id,
        "approval_status": status,
        "tx_hash": tx.tx_hash if tx else None
    }


@router.get("/evidence/approval-status/{evidence_id}")
async def get_evidence_approval_status(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get multi-signature approval status for evidence"""
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence_hash = evidence.get("hash", "")
    status = get_approval_status(evidence_hash)
    
    return {
        "evidence_id": evidence_id,
        "evidence_title": evidence.get("title"),
        "io_approved": status.get("io_approved", False),
        "dsp_approved": status.get("dsp_approved", False),
        "court_approved": status.get("court_approved", False),
        "fully_approved": status.get("io_approved") and status.get("dsp_approved") and status.get("court_approved")
    }


# ============ NEW ENDPOINT: Appeal System ============

@router.post("/case/appeal/{case_id}")
async def file_case_appeal(
    case_id: str,
    grounds: str,
    current_user: dict = Depends(require_roles(UserRole.PUBLIC_USER))
):
    """File an appeal against a judgment"""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check if case is decided
    if case.get("status") != "DECIDED":
        raise HTTPException(status_code=400, detail="Can only appeal decided cases")
    
    # Check if within 30 days
    judgment_date = case.get("judgment_date")
    if judgment_date:
        judgment_datetime = datetime.fromisoformat(judgment_date)
        days_passed = (datetime.now(timezone.utc) - judgment_datetime).days
        if days_passed > 30:
            raise HTTPException(status_code=400, detail="Appeal window closed (30 days)")
    
    # Send to blockchain
    tx = file_appeal(case_id, grounds)
    
    # Store appeal locally
    if "appeals" not in case:
        case["appeals"] = []
    
    case["appeals"].append({
        "grounds": grounds,
        "filed_by": current_user["email"],
        "filed_by_name": current_user.get("full_name"),
        "filed_at": datetime.now(timezone.utc).isoformat(),
        "tx_hash": tx.tx_hash if tx else None,
        "status": "PENDING"
    })
    
    ipfs_storage.update_case(case_id, case)
    
    return {
        "message": "Appeal filed successfully",
        "case_id": case_id,
        "grounds": grounds,
        "tx_hash": tx.tx_hash if tx else None
    }


@router.get("/case/appeal/{case_id}")
async def get_case_appeal(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get appeal details for a case"""
    appeal_data = get_appeal(case_id)
    return {
        "case_id": case_id,
        "appeal": appeal_data
    }


# ============ NEW ENDPOINT: Fine Escrow System ============

@router.post("/escrow/deposit/{case_id}")
async def deposit_fine_escrow(
    case_id: str,
    amount_pkr: float,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Deposit fine amount into escrow (called by court)"""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Convert PKR to Wei (simplified - in real life use Oracle)
    # 1 PKR ≈ 0.0003 ETH (example)
    amount_eth = amount_pkr * 0.0003
    amount_wei = int(amount_eth * 10**18)
    
    # Get complainant address (in real life, get from NADRA)
    fir = ipfs_storage.get_fir(case.get("fir_id"))
    beneficiary = current_user["email"]  # Placeholder
    
    tx = deposit_escrow(case_id, beneficiary, amount_wei)
    
    return {
        "message": f"Escrow deposit of PKR {amount_pkr} recorded",
        "case_id": case_id,
        "amount_pkr": amount_pkr,
        "tx_hash": tx.tx_hash if tx else None
    }


@router.post("/escrow/release/{case_id}")
async def release_fine_escrow(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Release fine to victim after judgment"""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    tx = release_fine(case_id)
    
    return {
        "message": "Fine released to victim",
        "case_id": case_id,
        "tx_hash": tx.tx_hash if tx else None
    }


@router.get("/escrow/{case_id}")
async def get_escrow_details(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get escrow details for a case"""
    escrow_data = get_escrow(case_id)
    return {
        "case_id": case_id,
        "escrow": escrow_data
    }


# ============ NEW ENDPOINT: Case Timeline ============

@router.post("/case/timeline/{case_id}")
async def update_case_timeline_blockchain(
    case_id: str,
    stage: int,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.COURT))
):
    """Update case timeline on blockchain"""
    stage_names = {
        1: "FIR Filed",
        2: "Police Assigned",
        3: "Investigation Completed",
        4: "Forensic Submitted",
        5: "Court Submitted",
        6: "Judgment Delivered"
    }
    
    tx = update_case_timeline(case_id, stage)
    
    return {
        "message": f"Timeline updated: {stage_names.get(stage, 'Unknown')}",
        "case_id": case_id,
        "stage": stage,
        "stage_name": stage_names.get(stage, "Unknown"),
        "tx_hash": tx.tx_hash if tx else None
    }

@router.get("/case/{case_id}/user-documents")
async def get_user_documents_for_case(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Get user documents related to a case"""
    case = ipfs_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    fir = ipfs_storage.get_fir(case.get("fir_id"))
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    complainant_email = fir.get("complainant_email")
    documents = ipfs_storage.get_user_documents(complainant_email)
    
    return list(documents.values())


@router.get("/list")
async def get_all_cases_list(current_user: dict = Depends(get_current_user)):
    """Get all cases (simple list for dropdowns)"""
    all_cases = ipfs_storage.get_all_cases()
    
    # Filter based on role
    if current_user["role"] == UserRole.FORENSIC_ANALYST.value:
        # Forensic can see all cases with evidence
        cases_list = []
        all_evidence = ipfs_storage.get_all_evidence()
        for case in all_cases:
            case_evidence = [ev for ev in all_evidence if ev.get("case_id") == case.get("case_id")]
            if case_evidence:  # Only cases with evidence
                cases_list.append({
                    "case_id": case.get("case_id"),
                    "case_number": case.get("case_number"),
                    "title": case.get("title"),
                    "status": case.get("status")
                })
        return cases_list
    else:
        return [
            {
                "case_id": case.get("case_id"),
                "case_number": case.get("case_number"),
                "title": case.get("title"),
                "status": case.get("status")
            }
            for case in all_cases
        ]
    
@router.get("/my-cases")
async def get_my_cases(current_user: dict = Depends(get_current_user)):
    """Get cases assigned to current investigator"""
    all_cases = ipfs_storage.get_all_cases()
    
    my_cases = []
    for case in all_cases:
        if case.get("investigator_email") == current_user["email"]:
            my_cases.append({
                "case_id": case.get("case_id"),
                "case_number": case.get("case_number"),
                "title": case.get("title"),
                "status": case.get("status"),
                "created_at": case.get("created_at")
            })
    
    return my_cases
    
@router.post("/{case_id}/evidence/{evidence_id}/send-to-forensic")
async def send_single_evidence_to_forensic(
    case_id: str,
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Investigator sends specific evidence to forensic lab"""
    case = ipfs_storage.get_case(case_id)
    if not case or case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence or evidence.get("case_id") != case_id:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Update evidence status
    evidence["status"] = "TRANSFERRED_TO_FORENSIC"
    evidence["analysis_status"] = "PENDING"
    evidence["transferred_at"] = datetime.now(timezone.utc).isoformat()
    evidence["transferred_by"] = current_user["email"]
    evidence["transferred_by_name"] = current_user.get("full_name")
    
    ipfs_storage.save_evidence(evidence_id, evidence)
    
    # Also update case to indicate forensic pending (if not already)
    if case.get("forensic_status") != "ACCEPTED":
        case["forensic_status"] = "PENDING"
        ipfs_storage.save_case(case_id, case)
    
    return {
        "message": f"Evidence '{evidence.get('title')}' sent to forensic lab",
        "evidence_id": evidence_id,
        "case_id": case_id
    }


@router.get("/my-hearings")
async def get_my_hearings(current_user: dict = Depends(get_current_user)):
    """Get all hearings for cases where user is involved (investigator or complainant)"""
    all_cases = ipfs_storage.get_all_cases()
    my_hearings = []
    
    user_email = current_user["email"]
    user_role = current_user["role"]
    
    for case in all_cases:
        fir = ipfs_storage.get_fir(case.get("fir_id"))
        
        # Check if user is complainant or investigator
        is_complainant = fir and fir.get("complainant_email") == user_email
        is_investigator = case.get("investigator_email") == user_email
        
        if is_complainant or is_investigator or user_role == "ADMIN":
            hearings = ipfs_storage.get_case_hearings(case.get("case_id"))
            for hearing_id, hearing in hearings.items():
                my_hearings.append({
                    "hearing_id": hearing_id,
                    "case_id": case.get("case_id"),
                    "case_number": case.get("case_number"),
                    "case_title": case.get("title"),
                    "hearing_date": hearing.get("hearing_date"),
                    "hearing_time": hearing.get("hearing_time"),
                    "hearing_type": hearing.get("hearing_type"),
                    "meeting_link": hearing.get("meeting_link"),
                    "status": hearing.get("status"),
                    "notes": hearing.get("notes"),
                    "scheduled_by_name": hearing.get("scheduled_by_name"),
                    "scheduled_by": hearing.get("scheduled_by"),
                    "created_at": hearing.get("created_at")
                })
    
    # Sort by date (upcoming first)
    my_hearings.sort(key=lambda x: x.get("hearing_date", ""))
    return my_hearings
