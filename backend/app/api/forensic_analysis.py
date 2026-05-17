# backend/app/api/forensic_analysis.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
import uuid
import hashlib
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/forensic/analysis", tags=["Forensic Analysis"])

class AnalysisRequest(BaseModel):
    evidence_id: str
    analysis_type: str
    findings: str
    conclusion: str
    methodology: Optional[str] = None
    equipment_used: Optional[str] = None

class ReviewRequest(BaseModel):
    report_id: str
    status: str  # APPROVED, NEEDS_REVISION, REJECTED
    comments: str

# Analysis Templates
ANALYSIS_TEMPLATES = {
    "DIGITAL_FORENSICS": {
        "name": "Digital Forensics Analysis",
        "sections": [
            "Device Information",
            "Acquisition Method",
            "Hash Verification",
            "Recovered Files",
            "Deleted Files Analysis",
            "Timeline Analysis",
            "Findings",
            "Conclusion"
        ]
    },
    "DNA_ANALYSIS": {
        "name": "DNA Analysis Report",
        "sections": [
            "Sample Information",
            "Extraction Method",
            "PCR Amplification",
            "Electrophoresis Results",
            "Profile Comparison",
            "Statistical Analysis",
            "Conclusion"
        ]
    },
    "FINGERPRINT": {
        "name": "Fingerprint Analysis",
        "sections": [
            "Latent Print Information",
            "Comparison Method",
            "Minutiae Points",
            "Comparison Results",
            "Conclusion"
        ]
    },
    "BALLISTICS": {
        "name": "Ballistics Analysis",
        "sections": [
            "Firearm Information",
            "Ammunition Type",
            "Barrel Marks",
            "Firing Pin Impression",
            "Comparison Results",
            "Conclusion"
        ]
    },
    "TOXICOLOGY": {
        "name": "Toxicology Report",
        "sections": [
            "Sample Type",
            "Testing Method",
            "Substances Tested",
            "Results",
            "Interpretation",
            "Conclusion"
        ]
    }
}

@router.get("/templates")
async def get_analysis_templates(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get available analysis templates"""
    return ANALYSIS_TEMPLATES

@router.post("/analyze")
async def perform_analysis(payload: AnalysisRequest, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Perform forensic analysis on evidence"""
    evidence = await mongo_storage.get_evidence(payload.evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Update evidence status
    evidence["analysis_status"] = "IN_PROGRESS"
    evidence["analysis_started_at"] = datetime.now(timezone.utc).isoformat()
    evidence["analyzed_by"] = current_user["email"]
    evidence["analyzed_by_name"] = current_user.get("full_name")
    await mongo_storage.save_evidence(payload.evidence_id, evidence)
    
    # Create analysis record
    analysis_id = f"ANALYSIS-{uuid.uuid4().hex[:8].upper()}"
    analysis = {
        "analysis_id": analysis_id,
        "evidence_id": payload.evidence_id,
        "case_id": evidence.get("case_id"),
        "analysis_type": payload.analysis_type,
        "findings": payload.findings,
        "conclusion": payload.conclusion,
        "methodology": payload.methodology,
        "equipment_used": payload.equipment_used,
        "analyzed_by": current_user["email"],
        "analyzed_by_name": current_user.get("full_name"),
        "status": "COMPLETED",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "review_status": "PENDING_REVIEW",
        "review_comments": []
    }
    
    # Save analysis
    analyses = await mongo_storage.get_evidence_analyses(payload.evidence_id)
    analyses[analysis_id] = analysis
    await mongo_storage.save_evidence_analyses(payload.evidence_id, analyses)
    
    # Update evidence status
    evidence["analysis_status"] = "COMPLETED"
    evidence["analysis_completed_at"] = datetime.now(timezone.utc).isoformat()
    evidence["analysis_id"] = analysis_id
    await mongo_storage.save_evidence(payload.evidence_id, evidence)
    
    return analysis

@router.get("/queue")
async def get_analysis_queue(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get evidence awaiting analysis"""
    all_evidence = await mongo_storage.get_all_evidence()
    queue = [e for e in all_evidence if e.get("analysis_status") == "PENDING" or e.get("analysis_status") is None]
    
    # Add to queue list
    queue_list = []
    for e in queue:
        queue_list.append({
            "evidence_id": e.get("evidence_id"),
            "case_id": e.get("case_id"),
            "title": e.get("title"),
            "description": e.get("description"),
            "cloudinary_url": e.get("cloudinary_url") or e.get("ipfs_cid"),
            "hash": e.get("hash"),
            "priority": e.get("priority", "MEDIUM"),
            "submitted_by": e.get("created_by"),
            "submitted_at": e.get("created_at")
        })
    
    return sorted(queue_list, key=lambda x: x.get("priority") == "HIGH", reverse=True)

@router.get("/my-analyses")
async def get_my_analyses(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get all analyses performed by current analyst"""
    all_evidence = await mongo_storage.get_all_evidence()
    my_analyses = []
    
    for evidence in all_evidence:
        analyses = await mongo_storage.get_evidence_analyses(evidence.get("evidence_id"))
        for analysis in analyses.values():
            if analysis.get("analyzed_by") == current_user["email"]:
                my_analyses.append({
                    "analysis": analysis,
                    "evidence": {
                        "evidence_id": evidence.get("evidence_id"),
                        "title": evidence.get("title"),
                        "case_id": evidence.get("case_id")
                    }
                })
    
    return sorted(my_analyses, key=lambda x: x["analysis"]["created_at"], reverse=True)

@router.get("/evidence/{evidence_id}/analyses")
async def get_evidence_analyses(evidence_id: str, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get all analyses for specific evidence"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    analyses = await mongo_storage.get_evidence_analyses(evidence_id)
    return list(analyses.values())

@router.post("/request-review")
async def request_review(payload: ReviewRequest, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Request peer review of analysis report"""
    # Find analysis
    all_evidence = await mongo_storage.get_all_evidence()
    found_analysis = None
    found_evidence_id = None
    
    for evidence in all_evidence:
        analyses = await mongo_storage.get_evidence_analyses(evidence.get("evidence_id"))
        if payload.report_id in analyses:
            found_analysis = analyses[payload.report_id]
            found_evidence_id = evidence.get("evidence_id")
            break
    
    if not found_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Update analysis
    analyses = await mongo_storage.get_evidence_analyses(found_evidence_id)
    analyses[payload.report_id]["review_status"] = payload.status
    analyses[payload.report_id]["review_comments"].append({
        "comment": payload.comments,
        "reviewed_by": current_user["email"],
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    })
    await mongo_storage.save_evidence_analyses(found_evidence_id, analyses)
    
    return {"message": f"Analysis {payload.status}", "analysis": analyses[payload.report_id]}

@router.get("/stats")
async def get_forensic_stats(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get forensic analyst statistics"""
    all_evidence = await mongo_storage.get_all_evidence()
    
    # Evidence stats
    total_evidence = len(all_evidence)
    pending_analysis = len([e for e in all_evidence if e.get("analysis_status") == "PENDING" or e.get("analysis_status") is None])
    in_progress = len([e for e in all_evidence if e.get("analysis_status") == "IN_PROGRESS"])
    completed = len([e for e in all_evidence if e.get("analysis_status") == "COMPLETED"])
    
    # My analyses
    my_analyses_count = 0
    for evidence in all_evidence:
        analyses = await mongo_storage.get_evidence_analyses(evidence.get("evidence_id"))
        for analysis in analyses.values():
            if analysis.get("analyzed_by") == current_user["email"]:
                my_analyses_count += 1
    
    # Analysis types breakdown
    analysis_types = {}
    for evidence in all_evidence:
        analyses = await mongo_storage.get_evidence_analyses(evidence.get("evidence_id"))
        for analysis in analyses.values():
            atype = analysis.get("analysis_type", "UNKNOWN")
            analysis_types[atype] = analysis_types.get(atype, 0) + 1
    
    return {
        "overview": {
            "total_evidence": total_evidence,
            "pending_analysis": pending_analysis,
            "in_progress": in_progress,
            "completed": completed,
            "my_analyses": my_analyses_count
        },
        "analysis_types": analysis_types,
        "completion_rate": round((completed / total_evidence) * 100, 1) if total_evidence else 0
    }

@router.get("/case-reports/{case_id}")
async def get_forensic_reports_by_case(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.COURT, UserRole.INVESTIGATOR))
):
    """Get all forensic reports for a specific case"""
    all_evidence = await mongo_storage.get_all_evidence()
    
    # Find all evidence for this case
    case_evidence = [e for e in all_evidence if e.get("case_id") == case_id]
    
    reports = []
    for evidence in case_evidence:
        if evidence.get("forensic_report_id"):
            # Get full report
            forensic_reports = await mongo_storage.get_forensic_reports()
            report = forensic_reports.get(evidence.get("forensic_report_id"))
            if report:
                reports.append({
                    "report_id": report.get("report_id"),
                    "report_number": report.get("report_number"),
                    "evidence_id": evidence.get("evidence_id"),
                    "evidence_title": evidence.get("title"),
                    "analysis_type": report.get("analysis_type"),
                    "findings": report.get("findings"),
                    "conclusion": report.get("conclusion"),
                    "analyst_name": report.get("analyst_name"),
                    "created_at": report.get("created_at")
                })
    
    return reports