# backend/app/api/investigator_stats.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Dict, List
from collections import defaultdict
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.ipfs_storage import ipfs_storage

router = APIRouter(prefix="/investigator/stats", tags=["Investigator Stats"])

@router.get("/dashboard")
async def get_investigator_dashboard(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get comprehensive dashboard statistics"""
    all_cases = ipfs_storage.get_all_cases()
    my_cases = [c for c in all_cases if c.get("investigator_email") == current_user["email"]]
    
    # Calculate date ranges
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    stats = {
        "overview": {
            "total_cases": len(my_cases),
            "active_cases": len([c for c in my_cases if c.get("status") not in ["DECIDED", "CLOSED"]]),
            "resolved_cases": len([c for c in my_cases if c.get("status") in ["DECIDED", "CLOSED"]]),
            "total_evidence": sum([len(c.get("evidence", [])) for c in my_cases]),
            "total_suspects": sum([len(c.get("suspects", [])) for c in my_cases]),
            "total_witnesses": sum([len(c.get("witnesses", [])) for c in my_cases])
        },
        "by_status": {},
        "by_priority": {},
        "monthly_trend": [],
        "weekly_activity": [],
        "clearance_rate": 0,
        "avg_resolution_days": 0
    }
    
    # Status breakdown
    for case in my_cases:
        status = case.get("status", "UNKNOWN")
        stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
    
    # Priority breakdown
    for case in my_cases:
        priority = case.get("priority", "MEDIUM")
        stats["by_priority"][priority] = stats["by_priority"].get(priority, 0) + 1
    
    # Monthly trend (last 6 months)
    month_counts = defaultdict(int)
    for case in my_cases:
        created_at = datetime.fromisoformat(case.get("created_at", ""))
        month_key = created_at.strftime("%Y-%m")
        month_counts[month_key] += 1
    
    for month, count in sorted(month_counts.items())[-6:]:
        stats["monthly_trend"].append({"month": month, "cases": count})
    
    # Weekly activity (last 7 days)
    for i in range(7):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_cases = [c for c in my_cases if datetime.fromisoformat(c.get("created_at", "")).date() == day]
        stats["weekly_activity"].append({
            "day": day.strftime("%a"),
            "cases": len(day_cases)
        })
    
    # Clearance rate (resolved / total)
    resolved = len([c for c in my_cases if c.get("status") in ["DECIDED", "CLOSED"]])
    stats["clearance_rate"] = round((resolved / len(my_cases)) * 100, 1) if my_cases else 0
    
    # Average resolution days
    resolution_days = []
    for case in my_cases:
        if case.get("status") in ["DECIDED", "CLOSED"] and case.get("created_at"):
            created = datetime.fromisoformat(case["created_at"])
            updated = datetime.fromisoformat(case.get("updated_at", case["created_at"]))
            days = (updated - created).days
            if days > 0:
                resolution_days.append(days)
    
    if resolution_days:
        stats["avg_resolution_days"] = round(sum(resolution_days) / len(resolution_days), 1)
    
    return stats

@router.get("/performance")
async def get_performance_metrics(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get investigator performance metrics"""
    all_cases = ipfs_storage.get_all_cases()
    my_cases = [c for c in all_cases if c.get("investigator_email") == current_user["email"]]
    
    # Get all evidence by this investigator
    all_evidence = ipfs_storage.get_all_evidence()
    my_evidence = [e for e in all_evidence if e.get("created_by") == current_user["email"]]
    
    # Get tasks
    tasks_stats = {"total": 0, "completed": 0}
    for case in my_cases:
        case_tasks = ipfs_storage.get_case_tasks(case.get("case_id"))
        for task in case_tasks.values():
            tasks_stats["total"] += 1
            if task.get("status") == "COMPLETED":
                tasks_stats["completed"] += 1
    
    return {
        "cases_handled": len(my_cases),
        "evidence_collected": len(my_evidence),
        "evidence_verified": len([e for e in my_evidence if e.get("verifications")]),
        "suspects_identified": sum([len(c.get("suspects", [])) for c in my_cases]),
        "witnesses_recorded": sum([len(c.get("witnesses", [])) for c in my_cases]),
        "reports_generated": len(ipfs_storage.get_all_reports()),
        "task_completion_rate": round((tasks_stats["completed"] / tasks_stats["total"]) * 100, 1) if tasks_stats["total"] else 0
    }