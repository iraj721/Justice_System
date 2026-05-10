from fastapi import APIRouter, Depends, HTTPException
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.ipfs_storage import ipfs_storage

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users/by-role/{role}")
async def get_users_by_role(
    role: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.FORENSIC_ANALYST))
):
    """Get all users with specific role"""
    users_data = ipfs_storage.get_all_users()
    
    filtered_users = []
    for user in users_data:
        if user.get("role") == role:
            filtered_users.append({
                "email": user.get("email"),
                "full_name": user.get("full_name"),
                "user_id": user.get("id")
            })
    
    return filtered_users

@router.get("/court-officers")
async def get_court_officers(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST, UserRole.INVESTIGATOR))):
    """Get all court officers for transfer"""
    users_data = ipfs_storage.get_all_users()
    
    court_officers = []
    for user in users_data:
        if user.get("role") == "COURT":
            court_officers.append({
                "email": user.get("email"),
                "full_name": user.get("full_name"),
                "user_id": user.get("id")
            })
    
    return court_officers

@router.get("/fir-details/{fir_id}")
async def get_fir_details(
    fir_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.PUBLIC_USER, UserRole.COURT))
):
    fir = ipfs_storage.get_fir(fir_id)
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    
    case = None
    if fir.get("case_id"):
        case = ipfs_storage.get_case(fir.get("case_id"))
    
    evidence_list = []
    if case and case.get("evidence"):
        for ev_id in case.get("evidence", []):
            ev = ipfs_storage.get_evidence(ev_id)
            if ev:
                evidence_list.append(ev)
    
    return {
        "fir": fir,
        "case": case,
        "evidence": evidence_list
    }