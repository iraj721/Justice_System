# backend/app/api/investigator_court.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import uuid
import json
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage


router = APIRouter(prefix="/investigator/court", tags=["Investigator Court Package"])

class CourtSubmissionPackage(BaseModel):
    case_id: str
    court_email: str
    submission_notes: Optional[str] = None

@router.post("/prepare-package")
async def prepare_court_package(payload: CourtSubmissionPackage, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Prepare complete court submission package"""
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    # Gather all evidence
    evidence_list = []
    for ev_id in case.get("evidence", []):
        ev = await mongo_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append(ev)
    
    # Create court package
    package_id = f"PKG-{uuid.uuid4().hex[:8].upper()}"
    
    package = {
        "package_id": package_id,
        "case_id": payload.case_id,
        "case_number": case.get("case_number"),
        "prepared_by": current_user["email"],
        "prepared_by_name": current_user.get("full_name"),
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "submitted_to_court": payload.court_email,
        "submission_notes": payload.submission_notes,
        "contents": {
            "fir": {
                "fir_number": fir.get("fir_number"),
                "complainant_name": fir.get("complainant_name"),
                "complainant_contact": fir.get("complainant_contact"),
                "incident_title": fir.get("incident_title"),
                "incident_description": fir.get("incident_description"),
                "incident_location": fir.get("incident_location"),
                "incident_datetime": fir.get("incident_datetime"),
                "accused_person": fir.get("accused_person"),
                "witness_names": fir.get("witness_names")
            },
            "case_details": {
                "case_number": case.get("case_number"),
                "title": case.get("title"),
                "description": case.get("description"),
                "status": case.get("status"),
                "priority": case.get("priority"),
                "created_at": case.get("created_at")
            },
            "suspects": case.get("suspects", []),
            "witnesses": case.get("witnesses", []),
            "evidence": [
                {
                    "evidence_id": e.get("evidence_id"),
                    "title": e.get("title"),
                    "description": e.get("description"),
                    "cloudinary_url": e.get("cloudinary_url") or e.get("ipfs_cid"),
                    "hash": e.get("hash"),
                    "status": e.get("status"),
                    "collected_by": e.get("created_by"),
                    "collected_at": e.get("created_at"),
                    "verifications": e.get("verifications", [])
                } for e in evidence_list
            ],
            "timeline": case.get("timeline", []),
            "investigation_notes": case.get("investigation_notes", [])
        },
        "summary": {
            "total_evidence": len(evidence_list),
            "verified_evidence": len([e for e in evidence_list if e.get("verifications")]),
            "total_suspects": len(case.get("suspects", [])),
            "total_witnesses": len(case.get("witnesses", [])),
            "case_duration_days": (datetime.now(timezone.utc) - datetime.fromisoformat(case.get("created_at"))).days
        }
    }
    
    # Save package
    packages = await mongo_storage.get_court_packages(payload.case_id)
    packages[package_id] = package
    await mongo_storage.save_court_packages(payload.case_id, packages)
    
    # No IPFS upload needed - data stored in MongoDB
    package["storage_cid"] = "STORED_IN_MONGODB"
    await mongo_storage.save_court_packages(payload.case_id, packages)
    
    return JSONResponse(
        content=package,
        headers={"Access-Control-Allow-Origin": "*"}
    )

@router.get("/packages/{case_id}")
async def get_court_packages(case_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get all court packages for a case"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    packages = await mongo_storage.get_court_packages(case_id)
    return JSONResponse(
        content=list(packages.values()),
        headers={"Access-Control-Allow-Origin": "*"}
    )

@router.post("/submit/{package_id}")
async def submit_package_to_court(package_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Submit prepared package to court"""
    # Find package
    all_cases = await mongo_storage.get_all_cases()
    found_package = None
    found_case_id = None
    
    for case in all_cases:
        packages = await mongo_storage.get_court_packages(case.get("case_id"))
        if package_id in packages:
            found_package = packages[package_id]
            found_case_id = case.get("case_id")
            break
    
    if not found_package:
        return JSONResponse(
            status_code=404,
            content={"detail": "Package not found"},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    
    # Submit to court using existing endpoint
    court_email = found_package.get("submitted_to_court")
    
    # Get case
    case = await mongo_storage.get_case(found_case_id)
    if not case:
        return JSONResponse(
            status_code=404,
            content={"detail": "Case not found"},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    
    # Update case status to SUBMITTED_TO_COURT
    case["status"] = "SUBMITTED_TO_COURT"
    case["submitted_to_court_at"] = datetime.now(timezone.utc).isoformat()
    case["submitted_by"] = current_user["email"]
    case["assigned_court_officer"] = court_email
    case["assigned_court_officer_name"] = found_package.get("submitted_to_court_name", court_email)
    
    await mongo_storage.update_case(found_case_id, case)
    
    # Update package status
    packages = await mongo_storage.get_court_packages(found_case_id)
    packages[package_id]["submitted_at"] = datetime.now(timezone.utc).isoformat()
    packages[package_id]["status"] = "SUBMITTED"
    await mongo_storage.save_court_packages(found_case_id, packages)
    
    return JSONResponse(
        content={
            "message": f"Package {package_id} submitted to court",
            "package": packages[package_id]
        },
        headers={"Access-Control-Allow-Origin": "*"}
    )


# ============ CORS OPTIONS HANDLERS ============

@router.options("/prepare-package")
async def prepare_package_options():
    """Handle CORS preflight for prepare-package"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/packages/{case_id}")
async def get_packages_options(case_id: str):
    """Handle CORS preflight for get packages"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/submit/{package_id}")
async def submit_package_options(package_id: str):
    """Handle CORS preflight for submit package"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400",
        }
    )