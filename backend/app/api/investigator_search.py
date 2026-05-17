# backend/app/api/investigator_search.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/investigator/search", tags=["Investigator Search"])

@router.get("/cases")
async def search_cases(
    q: Optional[str] = Query(None, description="Search query"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    from_date: Optional[str] = Query(None, description="From date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="To date (YYYY-MM-DD)"),
    fir_number: Optional[str] = Query(None, description="Search by FIR number"),
    complainant_name: Optional[str] = Query(None, description="Search by complainant name"),
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Advanced search for cases"""
    all_cases = await mongo_storage.get_all_cases()
    my_cases = [c for c in all_cases if c.get("investigator_email") == current_user["email"]]
    
    results = my_cases
    
    # Filter by status
    if status:
        results = [c for c in results if c.get("status") == status]
    
    # Filter by priority
    if priority:
        results = [c for c in results if c.get("priority") == priority]
    
    # Filter by date range
    if from_date:
        try:
            from_dt = datetime.fromisoformat(from_date).date()
            results = [c for c in results if datetime.fromisoformat(c.get("created_at", "")).date() >= from_dt]
        except (ValueError, TypeError):
            pass
    
    if to_date:
        try:
            to_dt = datetime.fromisoformat(to_date).date()
            results = [c for c in results if datetime.fromisoformat(c.get("created_at", "")).date() <= to_dt]
        except (ValueError, TypeError):
            pass
    
    # Search by FIR number
    if fir_number:
        results = [c for c in results if fir_number.lower() in c.get("fir_number", "").lower()]
    
    # Search by complainant name (need to fetch FIR)
    if complainant_name:
        filtered_results = []
        for case in results:
            fir = await mongo_storage.get_fir(case.get("fir_id"))
            if fir and complainant_name.lower() in fir.get("complainant_name", "").lower():
                filtered_results.append(case)
        results = filtered_results
    
    # Full-text search
    if q:
        filtered_results = []
        q_lower = q.lower()
        for case in results:
            if (q_lower in case.get("title", "").lower() or
                q_lower in case.get("description", "").lower() or
                q_lower in case.get("case_number", "").lower()):
                filtered_results.append(case)
        results = filtered_results
    
    # Add FIR details to results
    enriched_results = []
    for case in results:
        fir = await mongo_storage.get_fir(case.get("fir_id"))
        enriched_results.append({
            "case": case,
            "fir": {
                "fir_number": fir.get("fir_number") if fir else None,
                "complainant_name": fir.get("complainant_name") if fir else None,
                "complainant_contact": fir.get("complainant_contact") if fir else None,
                "incident_location": fir.get("incident_location") if fir else None,
                "incident_datetime": fir.get("incident_datetime") if fir else None
            } if fir else None
        })
    
    return {
        "total": len(enriched_results),
        "results": enriched_results
    }

@router.get("/saved-searches")
async def get_saved_searches(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get saved search queries"""
    saved = await mongo_storage.get_saved_searches(current_user["email"])
    return list(saved.values())

@router.post("/save-search")
async def save_search(
    name: str,
    query: dict,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Save a search query for later use"""
    search_id = str(uuid.uuid4())[:8]
    saved_searches = await mongo_storage.get_saved_searches(current_user["email"])
    
    saved_searches[search_id] = {
        "id": search_id,
        "name": name,
        "query": query,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await mongo_storage.save_saved_searches(current_user["email"], saved_searches)
    return {"id": search_id, "message": "Search saved"}

@router.delete("/saved-search/{search_id}")
async def delete_saved_search(search_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Delete a saved search"""
    saved_searches = await mongo_storage.get_saved_searches(current_user["email"])
    if search_id in saved_searches:
        del saved_searches[search_id]
        await mongo_storage.save_saved_searches(current_user["email"], saved_searches)
    return {"message": "Search deleted"}