# backend/app/api/investigator_tasks.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/investigator/tasks", tags=["Investigator Tasks"])

class TaskCreateRequest(BaseModel):
    case_id: str
    title: str
    description: str
    due_date: str
    priority: str = "MEDIUM"  # HIGH, MEDIUM, LOW
    assigned_to: Optional[str] = None

class TaskUpdateRequest(BaseModel):
    status: str  # PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    notes: Optional[str] = None

@router.post("/create")
async def create_task(payload: TaskCreateRequest, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Create a new investigation task"""
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    task_id = f"TASK-{uuid.uuid4().hex[:8].upper()}"
    
    task = {
        "task_id": task_id,
        "case_id": payload.case_id,
        "case_number": case.get("case_number"),
        "title": payload.title,
        "description": payload.description,
        "priority": payload.priority,
        "status": "PENDING",
        "due_date": payload.due_date,
        "assigned_to": payload.assigned_to or current_user["email"],
        "assigned_by": current_user["email"],
        "assigned_by_name": current_user.get("full_name"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "notes": []
    }
    
    # Save task
    tasks = await mongo_storage.get_case_tasks(payload.case_id)
    tasks[task_id] = task
    await mongo_storage.save_case_tasks(payload.case_id, tasks)
    
    return task

@router.get("/case/{case_id}")
async def get_case_tasks(case_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get all tasks for a case"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    tasks = await mongo_storage.get_case_tasks(case_id)
    return list(tasks.values())

@router.put("/{task_id}/status")
async def update_task_status(task_id: str, payload: TaskUpdateRequest, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Update task status"""
    # Find task across all cases
    all_cases = await mongo_storage.get_all_cases()
    found_task = None
    found_case_id = None
    
    for case in all_cases:
        tasks = await mongo_storage.get_case_tasks(case.get("case_id"))
        if task_id in tasks:
            found_task = tasks[task_id]
            found_case_id = case.get("case_id")
            break
    
    if not found_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    tasks = await mongo_storage.get_case_tasks(found_case_id)
    tasks[task_id]["status"] = payload.status
    tasks[task_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if payload.notes:
        tasks[task_id]["notes"].append({
            "note": payload.notes,
            "by": current_user["email"],
            "at": datetime.now(timezone.utc).isoformat()
        })
    
    await mongo_storage.save_case_tasks(found_case_id, tasks)
    
    return {"message": f"Task status updated to {payload.status}", "task": tasks[task_id]}

@router.get("/my-tasks")
async def get_my_tasks(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get all tasks assigned to current investigator"""
    all_cases = await mongo_storage.get_all_cases()
    my_tasks = []
    
    for case in all_cases:
        if case.get("investigator_email") == current_user["email"]:
            tasks = await mongo_storage.get_case_tasks(case.get("case_id"))
            for task in tasks.values():
                if task.get("assigned_to") == current_user["email"]:
                    my_tasks.append(task)
    
    return sorted(my_tasks, key=lambda x: x.get("created_at", ""), reverse=True)

@router.get("/stats")
async def get_task_stats(current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Get task statistics for investigator"""
    all_cases = await mongo_storage.get_all_cases()
    stats = {
        "total": 0,
        "pending": 0,
        "in_progress": 0,
        "completed": 0,
        "overdue": 0,
        "high_priority": 0,
        "medium_priority": 0,
        "low_priority": 0
    }
    
    today = datetime.now(timezone.utc).date()
    
    for case in all_cases:
        if case.get("investigator_email") == current_user["email"]:
            tasks = await mongo_storage.get_case_tasks(case.get("case_id"))
            for task in tasks.values():
                stats["total"] += 1
                status = task.get("status", "PENDING")
                if status.lower() == "pending":
                    stats["pending"] += 1
                elif status.lower() == "in_progress":
                    stats["in_progress"] += 1
                elif status.lower() == "completed":
                    stats["completed"] += 1
                
                priority = task.get("priority", "MEDIUM")
                if priority.lower() == "high":
                    stats["high_priority"] += 1
                elif priority.lower() == "medium":
                    stats["medium_priority"] += 1
                elif priority.lower() == "low":
                    stats["low_priority"] += 1
                
                # Check overdue
                if status != "COMPLETED" and task.get("due_date"):
                    try:
                        due_date = datetime.fromisoformat(task["due_date"]).date()
                        if due_date < today:
                            stats["overdue"] += 1
                    except (ValueError, TypeError):
                        pass
    
    return stats

@router.get("/forensic-status/{case_id}")
async def get_forensic_status(case_id: str, current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))):
    """Check if evidence has been accepted by forensic"""
    case = await mongo_storage.get_case(case_id)
    if not case or case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    all_evidence = await mongo_storage.get_all_evidence()
    forensic_status = []
    
    for ev in all_evidence:
        if ev.get("case_id") == case_id:
            forensic_status.append({
                "evidence_id": ev.get("evidence_id"),
                "title": ev.get("title"),
                "status": ev.get("status"),
                "analysis_status": ev.get("analysis_status", "PENDING"),
                "accepted_by_forensic": ev.get("status") == "TRANSFERRED_TO_FORENSIC",
                "analysis_completed": ev.get("analysis_status") == "COMPLETED",
                "transferred_at": ev.get("transferred_at"),
                "analysis_completed_at": ev.get("analysis_completed_at")
            })
    
    return {
        "case_id": case_id,
        "case_title": case.get("title"),
        "evidence": forensic_status
    }

@router.post("/send-to-forensic/{evidence_id}")
async def send_evidence_to_forensic(
    evidence_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Investigator sends evidence to forensic lab"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence["status"] = "TRANSFERRED_TO_FORENSIC"
    evidence["analysis_status"] = "PENDING"
    evidence["transferred_at"] = datetime.now(timezone.utc).isoformat()
    evidence["transferred_by"] = current_user["email"]
    
    await mongo_storage.save_evidence(evidence_id, evidence)
    
    return {"message": "Evidence sent to forensic lab", "evidence_id": evidence_id}