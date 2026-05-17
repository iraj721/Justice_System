# backend/app/api/admin.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.authz import require_roles, get_current_user
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/admin", tags=["Admin"])

# ============ USER MANAGEMENT (FULL ACCESS) ============

@router.get("/users")
async def get_all_users(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get all users in system - ADMIN ONLY"""
    users_data = await mongo_storage.get_all_users()
    return users_data

# backend/app/api/admin.py

@router.get("/users/by-role/{role}")
async def get_users_by_role(
    role: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INVESTIGATOR))
):
    """Get all users with specific role - accessible by ADMIN and INVESTIGATOR"""
    all_users = await mongo_storage.get_all_users()
    
    allowed_roles = ["INVESTIGATOR", "FORENSIC_ANALYST", "COURT", "PUBLIC_USER"]
    if role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    filtered_users = [
        {
            "email": u["email"], 
            "full_name": u.get("full_name", ""), 
            "user_id": u.get("user_id", "")
        }
        for u in all_users if u.get("role") == role
    ]
    return filtered_users


@router.get("/users/by-role/{role}/public")
async def get_users_by_role_public(
    role: str,
    current_user: dict = Depends(get_current_user)  # No admin restriction
):
    """Get users by role - accessible by INVESTIGATOR, FORENSIC, COURT"""
    allowed_roles = ["FORENSIC_ANALYST", "COURT"]
    
    if role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    all_users = await mongo_storage.get_all_users()
    filtered_users = [
        {"email": u["email"], "full_name": u.get("full_name", ""), "user_id": u.get("user_id", "")}
        for u in all_users if u.get("role") == role
    ]
    return filtered_users


@router.get("/users/{email}")
async def get_user_by_email(
    email: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Get specific user by email - ADMIN ONLY"""
    user = await mongo_storage.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's FIRs
    all_firs = await mongo_storage.get_all_firs()
    user_firs = [f for f in all_firs if f.get("complainant_email") == email]
    
    # Get user's cases
    all_cases = await mongo_storage.get_all_cases()
    user_cases = [c for c in all_cases if c.get("fir_id") in [f.get("fir_id") for f in user_firs]]
    
    return {
        "user": user,
        "statistics": {
            "total_firs": len(user_firs),
            "total_cases": len(user_cases)
        }
    }


@router.put("/users/{email}/role")
async def update_user_role(
    email: str,
    role: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Update user role - ADMIN ONLY"""
    user = await mongo_storage.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate role
    valid_roles = ["PUBLIC_USER", "INVESTIGATOR", "FORENSIC_ANALYST", "COURT", "ADMIN"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    old_role = user.get("role")
    user["role"] = role
    user["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await mongo_storage.save_user(email, user)
    
    return {
        "message": f"User role updated from {old_role} to {role}",
        "email": email,
        "new_role": role
    }


@router.delete("/users/{email}")
async def delete_user(
    email: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Delete a user and all their data - ADMIN ONLY"""
    user = await mongo_storage.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot delete yourself
    if email == current_user["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Get all FIRs by this user
    all_firs = await mongo_storage.get_all_firs()
    user_firs = [f for f in all_firs if f.get("complainant_email") == email]
    
    # Delete each FIR and associated case
    for fir in user_firs:
        fir_id = fir.get("fir_id")
        
        # Delete associated case if exists
        if fir.get("case_id"):
            case = await mongo_storage.get_case(fir.get("case_id"))
            if case:
                # Delete all evidence in case
                for ev_id in case.get("evidence", []):
                    await mongo_storage.delete_evidence(ev_id)
                await mongo_storage.delete_case(fir.get("case_id"))
        
        await mongo_storage.delete_fir(fir_id)
    
    # Delete user
    await mongo_storage.delete_user(email)
    
    return {"message": f"User {email} and all associated data deleted successfully"}


# ============ FIR MANAGEMENT ============

@router.get("/firs")
async def get_all_firs(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get all FIRs in system - ADMIN ONLY"""
    firs = await mongo_storage.get_all_firs()
    return sorted(firs, key=lambda x: x.get("created_at", ""), reverse=True)


@router.get("/firs/{fir_id}")
async def get_fir_by_id(
    fir_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Get specific FIR by ID - ADMIN ONLY"""
    fir = await mongo_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    # Get associated case if exists
    case = None
    if fir.get("case_id"):
        case = await mongo_storage.get_case(fir.get("case_id"))
    
    return {
        "fir": fir,
        "case": case
    }


@router.delete("/firs/{fir_id}")
async def delete_fir(
    fir_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Delete an FIR - ADMIN ONLY"""
    fir = await mongo_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    # Delete associated case if exists
    if fir.get("case_id"):
        case = await mongo_storage.get_case(fir.get("case_id"))
        if case:
            # Delete all evidence in case
            for ev_id in case.get("evidence", []):
                await mongo_storage.delete_evidence(ev_id)
            await mongo_storage.delete_case(fir.get("case_id"))
    
    await mongo_storage.delete_fir(fir_id)
    
    return {"message": f"FIR {fir_id} and associated case deleted successfully"}


@router.put("/firs/{fir_id}/status")
async def update_fir_status(
    fir_id: str,
    status: str,
    remarks: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Update FIR status - ADMIN ONLY"""
    fir = await mongo_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    old_status = fir.get("status")
    fir["status"] = status
    fir["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "status_history" not in fir:
        fir["status_history"] = []
    fir["status_history"].append({
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "remarks": remarks or f"Status changed by Admin from {old_status} to {status}",
        "changed_by": current_user["email"]
    })
    
    await mongo_storage.update_fir(fir_id, fir)
    
    return {
        "message": f"FIR status updated from {old_status} to {status}",
        "fir_id": fir_id,
        "status": status
    }


# ============ CASE MANAGEMENT ============

@router.get("/cases")
async def get_all_cases(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get all cases in system - ADMIN ONLY"""
    cases = await mongo_storage.get_all_cases()
    return sorted(cases, key=lambda x: x.get("created_at", ""), reverse=True)


@router.get("/cases/{case_id}")
async def get_case_by_id(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Get specific case by ID - ADMIN ONLY"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get all evidence in case
    evidence_list = []
    for ev_id in case.get("evidence", []):
        ev = await mongo_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append(ev)
    
    return {
        "case": case,
        "evidence": evidence_list
    }


@router.delete("/cases/{case_id}")
async def delete_case(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Delete a case and all its evidence - ADMIN ONLY"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Delete all evidence in case
    for ev_id in case.get("evidence", []):
        await mongo_storage.delete_evidence(ev_id)
    
    await mongo_storage.delete_case(case_id)
    
    return {"message": f"Case {case_id} and all evidence deleted successfully"}


@router.put("/cases/{case_id}/status")
async def update_case_status(
    case_id: str,
    status: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Update case status - ADMIN ONLY"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    old_status = case.get("status")
    case["status"] = status
    case["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Add to timeline
    if "timeline" not in case:
        case["timeline"] = []
    case["timeline"].append({
        "action": f"Status changed by Admin from {old_status} to {status}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "by": current_user["email"],
        "by_name": current_user.get("full_name", "Admin")
    })
    
    await mongo_storage.update_case(case_id, case)
    
    return {
        "message": f"Case status updated from {old_status} to {status}",
        "case_id": case_id,
        "status": status
    }


# ============ EVIDENCE MANAGEMENT ============

@router.get("/evidence")
async def get_all_evidence(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get all evidence in system - ADMIN ONLY"""
    evidence = await mongo_storage.get_all_evidence()
    return sorted(evidence, key=lambda x: x.get("created_at", ""), reverse=True)


@router.get("/evidence/{evidence_id}")
async def get_evidence_by_id(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Get specific evidence by ID - ADMIN ONLY"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence


@router.delete("/evidence/{evidence_id}")
async def delete_evidence(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Delete evidence - ADMIN ONLY"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Remove from case evidence list
    case = await mongo_storage.get_case(evidence.get("case_id"))
    if case and "evidence" in case:
        if evidence_id in case["evidence"]:
            case["evidence"].remove(evidence_id)
            await mongo_storage.update_case(evidence.get("case_id"), case)
    
    await mongo_storage.delete_evidence(evidence_id)
    
    return {"message": f"Evidence {evidence_id} deleted successfully"}


# ============ JUDGMENT MANAGEMENT ============

@router.get("/judgments")
async def get_all_judgments(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get all judgments in system - ADMIN ONLY"""
    judgments_dict = await mongo_storage.get_all_judgments()
    judgments_list = list(judgments_dict.values())
    return sorted(judgments_list, key=lambda x: x.get("created_at", ""), reverse=True)


@router.delete("/judgments/{judgment_id}")
async def delete_judgment(
    judgment_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Delete a judgment - ADMIN ONLY"""
    judgment = await mongo_storage.get_judgment(judgment_id)
    if not judgment:
        raise HTTPException(status_code=404, detail="Judgment not found")
    
    await mongo_storage.delete_judgment(judgment_id)
    
    return {"message": f"Judgment {judgment_id} deleted successfully"}


# ============ FEEDBACK MANAGEMENT ============

@router.get("/feedback")
async def get_all_feedback(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get all feedback in system - ADMIN ONLY"""
    feedback = await mongo_storage.get_all_feedback()
    return sorted(feedback, key=lambda x: x.get("created_at", ""), reverse=True)


@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN))
):
    """Delete feedback - ADMIN ONLY"""
    await mongo_storage.delete_feedback(feedback_id)
    return {"message": f"Feedback {feedback_id} deleted successfully"}


# ============ SYSTEM STATISTICS ============

@router.get("/stats")
async def get_system_stats(current_user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Get complete system statistics - ADMIN ONLY"""
    users = await mongo_storage.get_all_users()
    firs = await mongo_storage.get_all_firs()
    cases = await mongo_storage.get_all_cases()
    evidence = await mongo_storage.get_all_evidence()
    judgments_dict = await mongo_storage.get_all_judgments()
    feedback = await mongo_storage.get_all_feedback()
    
    # Count by role
    users_by_role = {}
    for user in users:
        role = user.get("role", "UNKNOWN")
        users_by_role[role] = users_by_role.get(role, 0) + 1
    
    # Count by status
    firs_by_status = {}
    for fir in firs:
        status = fir.get("status", "UNKNOWN")
        firs_by_status[status] = firs_by_status.get(status, 0) + 1
    
    cases_by_status = {}
    for case in cases:
        status = case.get("status", "UNKNOWN")
        cases_by_status[status] = cases_by_status.get(status, 0) + 1
    
    return {
        "total_users": len(users),
        "total_firs": len(firs),
        "total_cases": len(cases),
        "total_evidence": len(evidence),
        "total_judgments": len(judgments_dict),
        "total_feedback": len(feedback),
        "users_by_role": users_by_role,
        "firs_by_status": firs_by_status,
        "cases_by_status": cases_by_status
    }


# ============ COURT OFFICERS (For backward compatibility) ============

@router.get("/court-officers")
async def get_court_officers(current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.FORENSIC_ANALYST))):
    """Get all court officers for transfer"""
    users_data = await mongo_storage.get_all_users()
    
    court_officers = []
    for user in users_data:
        if user.get("role") == "COURT":
            court_officers.append({
                "email": user.get("email"),
                "full_name": user.get("full_name"),
                "user_id": user.get("id")
            })
    
    return court_officers


# ============ FIR DETAILS (For backward compatibility) ============

@router.get("/fir-details/{fir_id}")
async def get_fir_details(
    fir_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.PUBLIC_USER, UserRole.COURT))
):
    """Get complete FIR details with case and evidence"""
    fir = await mongo_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    case = None
    if fir.get("case_id"):
        case = await mongo_storage.get_case(fir.get("case_id"))
    
    evidence_list = []
    if case and case.get("evidence"):
        for ev_id in case.get("evidence", []):
            ev = await mongo_storage.get_evidence(ev_id)
            if ev:
                # Clean up evidence data (remove internal fields if needed)
                evidence_list.append({
                    "evidence_id": ev.get("evidence_id"),
                    "title": ev.get("title"),
                    "description": ev.get("description"),
                    "cloudinary_url": ev.get("cloudinary_url") or ev.get("ipfs_cid"),
                    "hash": ev.get("hash"),
                    "status": ev.get("status"),
                    "created_at": ev.get("created_at"),
                    "created_by": ev.get("created_by"),
                    "verifications": ev.get("verifications", [])
                })
    
    return {
        "fir": fir,
        "case": case,
        "evidence": evidence_list
    }