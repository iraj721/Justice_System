# backend/app/api/forensic_dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/forensic/dashboard", tags=["Forensic Dashboard"])

@router.get("/stats")
async def get_forensic_dashboard(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get comprehensive forensic dashboard statistics"""
    all_evidence = await mongo_storage.get_all_evidence()
    all_cases = await mongo_storage.get_all_cases()
    
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Evidence status breakdown
    status_counts = {
        "PENDING": 0,
        "IN_PROGRESS": 0,
        "COMPLETED": 0,
        "TRANSFERRED": 0
    }
    
    analysis_types = defaultdict(int)
    priority_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    
    for evidence in all_evidence:
        status = evidence.get("analysis_status", "PENDING")
        if status == "PENDING":
            status_counts["PENDING"] += 1
        elif status == "IN_PROGRESS":
            status_counts["IN_PROGRESS"] += 1
        elif status == "COMPLETED":
            status_counts["COMPLETED"] += 1
        elif status == "TRANSFERRED":
            status_counts["TRANSFERRED"] += 1
        
        # Analysis types from completed analyses
        if status == "COMPLETED":
            analyses = await mongo_storage.get_evidence_analyses(evidence.get("evidence_id"))
            for analysis in analyses.values():
                atype = analysis.get("analysis_type", "UNKNOWN")
                analysis_types[atype] += 1
        
        priority = evidence.get("priority", "MEDIUM")
        priority_counts[priority] = priority_counts.get(priority, 0) + 1
    
    # My performance
    my_analyses = []
    for evidence in all_evidence:
        analyses = await mongo_storage.get_evidence_analyses(evidence.get("evidence_id"))
        for analysis in analyses.values():
            if analysis.get("analyzed_by") == current_user["email"]:
                my_analyses.append(analysis)
    
    completed_by_me = len([a for a in my_analyses if a.get("status") == "COMPLETED"])
    
    # Average analysis time (in days)
    analysis_times = []
    for analysis in my_analyses:
        if analysis.get("created_at") and analysis.get("updated_at"):
            try:
                created = datetime.fromisoformat(analysis["created_at"])
                updated = datetime.fromisoformat(analysis["updated_at"])
                days = (updated - created).days
                if days > 0:
                    analysis_times.append(days)
            except (ValueError, TypeError):
                pass
    
    avg_time = round(sum(analysis_times) / len(analysis_times), 1) if analysis_times else 0
    
    return {
        "overview": {
            "total_evidence": len(all_evidence),
            "pending": status_counts["PENDING"],
            "in_progress": status_counts["IN_PROGRESS"],
            "completed": status_counts["COMPLETED"],
            "transferred": status_counts["TRANSFERRED"]
        },
        "by_priority": priority_counts,
        "analysis_types": dict(analysis_types),
        "my_performance": {
            "total_analyses": len(my_analyses),
            "completed": completed_by_me,
            "average_completion_days": avg_time
        },
        "completion_rate": round((status_counts["COMPLETED"] / len(all_evidence)) * 100, 1) if all_evidence else 0
    }

@router.get("/recent")
async def get_recent_activity(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get recent forensic activity"""
    all_evidence = await mongo_storage.get_all_evidence()
    recent_activity = []
    
    for evidence in all_evidence:
        # Check for recent status changes
        if evidence.get("analysis_started_at"):
            recent_activity.append({
                "type": "ANALYSIS_STARTED",
                "evidence_id": evidence.get("evidence_id"),
                "title": evidence.get("title"),
                "timestamp": evidence.get("analysis_started_at"),
                "by": evidence.get("analyzed_by"),
                "by_name": evidence.get("analyzed_by_name")
            })
        
        if evidence.get("analysis_completed_at"):
            recent_activity.append({
                "type": "ANALYSIS_COMPLETED",
                "evidence_id": evidence.get("evidence_id"),
                "title": evidence.get("title"),
                "timestamp": evidence.get("analysis_completed_at"),
                "by": evidence.get("analyzed_by"),
                "by_name": evidence.get("analyzed_by_name")
            })
    
    # Sort by timestamp descending and take last 10
    recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return recent_activity[:10]