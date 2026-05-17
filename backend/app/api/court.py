# backend/app/api/court.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
import hashlib
import json
from app.core.authz import require_roles, get_current_user
from app.core.roles import UserRole
from app.services.mongo_storage import mongo_storage
from fastapi import UploadFile, File
from fastapi.responses import FileResponse, Response
from app.services.notification_service import notification_service


router = APIRouter(prefix="/court", tags=["Court"])

# ============ Request Models ============
class JudgmentRequest(BaseModel):
    case_id: str
    suspect_id: Optional[str] = None
    suspect_name: Optional[str] = None
    verdict: str
    sentence: Optional[str] = None
    reasoning: str
    punishment_details: Optional[str] = None
    hearing_date: Optional[str] = None

class HearingScheduleRequest(BaseModel):
    case_id: str
    hearing_date: str
    hearing_time: str
    hearing_type: str = "VIRTUAL"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class HearingUpdateRequest(BaseModel):
    hearing_id: str
    status: str
    notes: Optional[str] = None

class EvidenceReviewRequest(BaseModel):
    evidence_id: str
    review_notes: str
    is_admissible: bool

# ============ Cases for Review ============
@router.get("/cases-for-review")
async def get_cases_for_review(current_user: dict = Depends(require_roles(UserRole.COURT))):
    """Get all cases submitted to court for review"""
    all_cases = await mongo_storage.get_all_cases()
    
    court_cases = []
    for case in all_cases:
        if case.get("status") in ["SUBMITTED_TO_COURT", "UNDER_COURT_REVIEW"]:
            fir = await mongo_storage.get_fir(case.get("fir_id"))
            evidence_list = []
            for ev_id in case.get("evidence", []):
                ev = await mongo_storage.get_evidence(ev_id)
                if ev:
                    evidence_list.append({
                        "evidence_id": ev.get("evidence_id"),
                        "title": ev.get("title"),
                        "description": ev.get("description"),
                        "cloudinary_url": ev.get("cloudinary_url") or ev.get("ipfs_cid"),
                        "hash": ev.get("hash"),
                        "status": ev.get("status"),
                        "verifications": ev.get("verifications", [])
                    })
            
            court_cases.append({
                "case_id": case.get("case_id"),
                "case_number": case.get("case_number"),
                "title": case.get("title"),
                "description": case.get("description"),
                "status": case.get("status"),
                "priority": case.get("priority"),
                "fir_id": case.get("fir_id"),
                "fir_number": fir.get("fir_number") if fir else None,
                "complainant_name": fir.get("complainant_name") if fir else None,
                "complainant_contact": fir.get("complainant_contact") if fir else None,
                "investigator_email": case.get("investigator_email"),
                "investigator_name": case.get("investigator_name"),
                "submitted_at": case.get("submitted_to_court_at"),
                "evidence_count": len(evidence_list),
                "evidence": evidence_list,
                "suspects": case.get("suspects", []),
                "witnesses": case.get("witnesses", []),
                "timeline": case.get("timeline", []),
                "created_at": case.get("created_at")
            })
    
    return sorted(court_cases, key=lambda x: x.get("submitted_at", ""), reverse=True)

# ============ Judgment Management ============
@router.post("/judgment")
async def create_judgment(
    payload: JudgmentRequest,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Deliver judgment for a case"""
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    existing_judgments_dict = await mongo_storage.get_all_judgments()
    for j in existing_judgments_dict.values():
        if j.get("case_id") == payload.case_id:
            raise HTTPException(status_code=400, detail="Judgment already delivered for this case")
    
    judgment_id = f"JUDG-{uuid.uuid4().hex[:10].upper()}"
    judgment_number = f"JUSTICE-JUDG-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    
    judgment_data = {
        "judgment_id": judgment_id,
        "judgment_number": judgment_number,
        "case_id": payload.case_id,
        "case_number": case.get("case_number"),
        "case_title": case.get("title"),
        "verdict": payload.verdict,
        "sentence": payload.sentence,
        "reasoning": payload.reasoning,
        "punishment_details": payload.punishment_details,
        "judge_email": current_user["email"],
        "judge_name": current_user.get("full_name", ""),
        "hearing_date": payload.hearing_date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    judgment_hash = hashlib.sha256(json.dumps(judgment_data, default=str).encode()).hexdigest()
    judgment_data["hash"] = judgment_hash
    judgment_data["storage_cid"] = "STORED_IN_MONGODB"

    await mongo_storage.save_judgment(judgment_id, judgment_data)
    
    case["status"] = "DECIDED"
    case["verdict"] = payload.verdict
    case["judgment_id"] = judgment_id
    case["judgment_date"] = datetime.now(timezone.utc).isoformat()
    case["judge_name"] = current_user.get("full_name", "")
    await mongo_storage.update_case(payload.case_id, case)
    
    return judgment_data

@router.get("/judgments")
async def get_judgments(
    current_user: dict = Depends(require_roles(UserRole.COURT)),
    case_id: Optional[str] = None
):
    """Get all judgments or filter by case"""
    all_judgments_dict = await mongo_storage.get_all_judgments()
    judgments_list = list(all_judgments_dict.values())
    
    if case_id:
        judgments_list = [j for j in judgments_list if j.get("case_id") == case_id]
    
    return sorted(judgments_list, key=lambda x: x.get("created_at", ""), reverse=True)

@router.get("/judgment/{judgment_id}")
async def get_judgment(judgment_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific judgment details"""
    judgment = await mongo_storage.get_judgment(judgment_id)
    if not judgment:
        raise HTTPException(status_code=404, detail="Judgment not found")
    
    user_role = current_user.get("role")
    
    if user_role == UserRole.INVESTIGATOR.value:
        case = await mongo_storage.get_case(judgment.get("case_id"))
        if case and case.get("investigator_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if user_role == UserRole.PUBLIC_USER.value:
        case = await mongo_storage.get_case(judgment.get("case_id"))
        if case:
            fir = await mongo_storage.get_fir(case.get("fir_id"))
            if fir and fir.get("complainant_email") != current_user["email"]:
                raise HTTPException(status_code=403, detail="Access denied")
    
    return judgment

@router.post("/schedule-hearing")
async def schedule_hearing(
    payload: HearingScheduleRequest,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Schedule a court hearing for a case"""
    case = await mongo_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    hearing_id = f"HRG-{uuid.uuid4().hex[:10].upper()}"
    
    # Generate meeting link if not provided
    meeting_link = payload.meeting_link
    if not meeting_link:
        meeting_link = f"https://meet.jit.si/justice-hearing-{hearing_id.lower()}"
    
    hearing_data = {
        "hearing_id": hearing_id,
        "case_id": payload.case_id,
        "case_number": case.get("case_number"),
        "case_title": case.get("title"),
        "hearing_date": payload.hearing_date,
        "hearing_time": payload.hearing_time,
        "hearing_type": payload.hearing_type,
        "meeting_link": meeting_link,
        "status": "SCHEDULED",
        "notes": payload.notes,
        "scheduled_by": current_user["email"],
        "scheduled_by_name": current_user.get("full_name"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    hearings = await mongo_storage.get_case_hearings(payload.case_id)
    hearings[hearing_id] = hearing_data
    await mongo_storage.save_case_hearings(payload.case_id, hearings)
    
    if "hearings" not in case:
        case["hearings"] = []
    case["hearings"].append(hearing_id)
    case["next_hearing_date"] = f"{payload.hearing_date} {payload.hearing_time}"
    await mongo_storage.update_case(payload.case_id, case)
    
    # ============ SEND EMAIL NOTIFICATIONS ============
    try:
        fir = await mongo_storage.get_fir(case.get("fir_id"))
        hearing_datetime = f"{payload.hearing_date} at {payload.hearing_time}"
        
        # Email to Investigator
        investigator_email = case.get("investigator_email")
        if investigator_email:
            await notification_service.send_hearing_reminder(
                user_email=investigator_email,
                case_number=case.get("case_number"),
                hearing_date=hearing_datetime,
                meeting_link=meeting_link
            )
            print(f"✅ Hearing email sent to investigator: {investigator_email}")
        
        # Email to Complainant
        complainant_email = fir.get("complainant_email") if fir else None
        if complainant_email:
            await notification_service.send_hearing_reminder(
                user_email=complainant_email,
                case_number=case.get("case_number"),
                hearing_date=hearing_datetime,
                meeting_link=meeting_link
            )
            print(f"✅ Hearing email sent to complainant: {complainant_email}")
        
        # Also send in-app notifications
        try:
            # Notification for investigator
            investigator_notification = {
                "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
                "user_email": case.get("investigator_email"),
                "title": "New Hearing Scheduled",
                "message": f"A hearing has been scheduled for case {case.get('case_number')} on {payload.hearing_date} at {payload.hearing_time}. Meeting link: {meeting_link}",
                "type": "HEARING_SCHEDULED",
                "related_id": hearing_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_read": False
            }
            
            # Notification for complainant
            complainant_notification = {
                "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
                "user_email": fir.get("complainant_email"),
                "title": "Court Hearing Scheduled",
                "message": f"A court hearing has been scheduled for your case {case.get('case_number')} on {payload.hearing_date} at {payload.hearing_time}. Please be available.",
                "type": "HEARING_SCHEDULED",
                "related_id": hearing_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_read": False
            }
            
            # Save notifications
            if case.get("investigator_email"):
                inv_notifications = await mongo_storage.get_user_notifications(case.get("investigator_email"))
                inv_notifications[investigator_notification["notification_id"]] = investigator_notification
                await mongo_storage.save_user_notifications(case.get("investigator_email"), inv_notifications)
            
            if complainant_email:
                comp_notifications = await mongo_storage.get_user_notifications(complainant_email)
                comp_notifications[complainant_notification["notification_id"]] = complainant_notification
                await mongo_storage.save_user_notifications(complainant_email, comp_notifications)
            
            print(f"✅ In-app notifications sent for hearing {hearing_id}")
        except Exception as e:
            print(f"❌ Error sending in-app notifications: {e}")
            
    except Exception as e:
        print(f"❌ Error sending email notifications: {e}")
    
    # Return full details including ID and link
    return {
        "success": True,
        "hearing_id": hearing_id,
        "meeting_link": meeting_link,
        "hearing_date": payload.hearing_date,
        "hearing_time": payload.hearing_time,
        "case_number": case.get("case_number"),
        "message": f"Hearing scheduled successfully! ID: {hearing_id}"
    }

@router.get("/hearings/{case_id}")
async def get_case_hearings(case_id: str, current_user: dict = Depends(require_roles(UserRole.COURT))):
    """Get all hearings for a case"""
    hearings = await mongo_storage.get_case_hearings(case_id)
    return list(hearings.values())

@router.put("/hearing/{hearing_id}")
async def update_hearing_status(
    payload: HearingUpdateRequest,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Update hearing status"""
    all_cases = await mongo_storage.get_all_cases()
    found_hearing = None
    found_case_id = None
    
    for case in all_cases:
        hearings = await mongo_storage.get_case_hearings(case.get("case_id"))
        if payload.hearing_id in hearings:
            found_hearing = hearings[payload.hearing_id]
            found_case_id = case.get("case_id")
            break
    
    if not found_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    hearings = await mongo_storage.get_case_hearings(found_case_id)
    hearings[payload.hearing_id]["status"] = payload.status
    if payload.notes:
        hearings[payload.hearing_id]["notes"] = payload.notes
    hearings[payload.hearing_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await mongo_storage.save_case_hearings(found_case_id, hearings)
    
    return {"message": f"Hearing status updated to {payload.status}", "hearing": hearings[payload.hearing_id]}

# ============ Evidence Review ============
@router.post("/review-evidence")
async def review_evidence(
    payload: EvidenceReviewRequest,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Review evidence for admissibility"""
    evidence = await mongo_storage.get_evidence(payload.evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    review_record = {
        "review_id": str(uuid.uuid4())[:8],
        "evidence_id": payload.evidence_id,
        "reviewed_by": current_user["email"],
        "reviewed_by_name": current_user.get("full_name"),
        "is_admissible": payload.is_admissible,
        "notes": payload.review_notes,
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "court_reviews" not in evidence:
        evidence["court_reviews"] = []
    
    evidence["court_reviews"].append(review_record)
    evidence["court_admissible"] = payload.is_admissible
    await mongo_storage.save_evidence(payload.evidence_id, evidence)
    
    return review_record

# ============ Statistics ============
@router.get("/stats")
async def get_court_stats(current_user: dict = Depends(require_roles(UserRole.COURT))):
    """Get court statistics"""
    all_cases = await mongo_storage.get_all_cases()
    all_judgments_dict = await mongo_storage.get_all_judgments()
    all_judgments_list = list(all_judgments_dict.values())
    
    pending_cases = [c for c in all_cases if c.get("status") in ["SUBMITTED_TO_COURT", "UNDER_COURT_REVIEW"]]
    decided_cases = [c for c in all_cases if c.get("status") == "DECIDED"]
    
    verdict_counts = {}
    for j in all_judgments_list:
        verdict = j.get("verdict", "UNKNOWN")
        verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
    
    priority_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for case in pending_cases:
        priority = case.get("priority", "MEDIUM")
        if priority in priority_counts:
            priority_counts[priority] += 1
        else:
            priority_counts["MEDIUM"] += 1
    
    total_hearings = 0
    upcoming_hearings = 0
    today = datetime.now(timezone.utc).date()
    
    for case in all_cases:
        hearings = await mongo_storage.get_case_hearings(case.get("case_id"))
        total_hearings += len(hearings)
        for hearing in hearings.values():
            if hearing.get("status") == "SCHEDULED":
                try:
                    hearing_date = datetime.fromisoformat(hearing.get("hearing_date")).date()
                    if hearing_date >= today:
                        upcoming_hearings += 1
                except:
                    pass
    
    return {
        "pending_cases": len(pending_cases),
        "decided_cases": len(decided_cases),
        "total_judgments": len(all_judgments_list),
        "verdict_breakdown": verdict_counts,
        "priority_breakdown": priority_counts,
        "total_hearings": total_hearings,
        "upcoming_hearings": upcoming_hearings
    }

# ============ Search Cases ============
@router.get("/search")
async def search_cases(
    q: Optional[str] = None,
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Search cases with filters"""
    all_cases = await mongo_storage.get_all_cases()
    results = []
    
    for case in all_cases:
        if status and case.get("status") != status:
            continue
        
        if from_date:
            try:
                created = datetime.fromisoformat(case.get("created_at", "")).date()
                from_dt = datetime.fromisoformat(from_date).date()
                if created < from_dt:
                    continue
            except:
                pass
        
        if to_date:
            try:
                created = datetime.fromisoformat(case.get("created_at", "")).date()
                to_dt = datetime.fromisoformat(to_date).date()
                if created > to_dt:
                    continue
            except:
                pass
        
        if q:
            q_lower = q.lower()
            if not (q_lower in case.get("case_number", "").lower() or
                    q_lower in case.get("title", "").lower() or
                    q_lower in case.get("description", "").lower()):
                continue
        
        fir = await mongo_storage.get_fir(case.get("fir_id"))
        results.append({
            "case_id": case.get("case_id"),
            "case_number": case.get("case_number"),
            "title": case.get("title"),
            "status": case.get("status"),
            "priority": case.get("priority"),
            "complainant_name": fir.get("complainant_name") if fir else None,
            "created_at": case.get("created_at"),
            "judgment_date": case.get("judgment_date")
        })
    
    return sorted(results, key=lambda x: x.get("created_at", ""), reverse=True)

# ============ Verify Evidence ============
@router.get("/evidence-list/{case_id}")
async def get_case_evidence_for_court(case_id: str, current_user: dict = Depends(require_roles(UserRole.COURT))):
    """Get all evidence for a specific case"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_list = []
    for ev_id in case.get("evidence", []):
        ev = await mongo_storage.get_evidence(ev_id)
        if ev:
            evidence_list.append({
                "evidence_id": ev.get("evidence_id"),
                "title": ev.get("title"),
                "description": ev.get("description"),
                "cloudinary_url": ev.get("cloudinary_url") or ev.get("ipfs_cid"),
                "hash": ev.get("hash"),
                "status": ev.get("status"),
                "verifications": ev.get("verifications", []),
                "created_at": ev.get("created_at"),
                "created_by": ev.get("created_by")
            })
    
    return evidence_list

@router.get("/evidence-timeline/{evidence_id}")
async def get_evidence_timeline(evidence_id: str, current_user: dict = Depends(require_roles(UserRole.COURT))):
    """Get complete timeline of evidence from upload to current state"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    timeline = []
    
    # 1. Evidence Created/Uploaded
    timeline.append({
        "stage": "EVIDENCE_UPLOADED",
        "title": "Evidence Uploaded",
        "description": f"Evidence '{evidence.get('title')}' was uploaded to the system",
        "timestamp": evidence.get("created_at"),
        "by": evidence.get("created_by"),
        "icon": "📤",
        "color": "#3b82f6"
    })
    
    # 2. Transferred to Forensic (if any)
    if evidence.get("transferred_at"):
        timeline.append({
            "stage": "TRANSFERRED_TO_FORENSIC",
            "title": "Sent to Forensic Lab",
            "description": "Evidence transferred to forensic lab for analysis",
            "timestamp": evidence.get("transferred_at"),
            "by": evidence.get("transferred_by"),
            "icon": "🔬",
            "color": "#f59e0b"
        })
    
    # 3. Forensic Analysis (if any)
    if evidence.get("analysis_status") == "COMPLETED":
        timeline.append({
            "stage": "FORENSIC_ANALYZED",
            "title": "Forensic Analysis Completed",
            "description": f"Analysis completed",
            "timestamp": evidence.get("analysis_completed_at"),
            "by": evidence.get("analyzed_by"),
            "icon": "📊",
            "color": "#10b981"
        })
    
    # 4. Submitted to Court
    if evidence.get("submitted_to_court_at"):
        timeline.append({
            "stage": "SUBMITTED_TO_COURT",
            "title": "Submitted to Court",
            "description": "Evidence submitted to court for review",
            "timestamp": evidence.get("submitted_to_court_at"),
            "by": evidence.get("submitted_by"),
            "icon": "⚖️",
            "color": "#8b5cf6"
        })
    
    # 5. Court Review (if any)
    for review in evidence.get("court_reviews", []):
        timeline.append({
            "stage": "COURT_REVIEWED",
            "title": "Court Review",
            "description": f"Evidence marked as {'ADMISSIBLE' if review.get('is_admissible') else 'INADMISSIBLE'}",
            "timestamp": review.get("reviewed_at"),
            "by": review.get("reviewed_by"),
            "icon": "✅" if review.get("is_admissible") else "❌",
            "color": "#10b981" if review.get("is_admissible") else "#ef4444"
        })
    
    # 6. Verifications
    for verify in evidence.get("verifications", []):
        timeline.append({
            "stage": "VERIFIED",
            "title": "Evidence Verified",
            "description": f"Verification: {'PASSED' if verify.get('result') else 'FAILED'}",
            "timestamp": verify.get("verified_at"),
            "by": verify.get("verified_by"),
            "icon": "🔐",
            "color": "#10b981" if verify.get("result") else "#ef4444"
        })
    
    timeline.sort(key=lambda x: x.get("timestamp", ""), reverse=False)
    
    return {
        "evidence_id": evidence_id,
        "evidence_title": evidence.get("title"),
        "hash": evidence.get("hash"),
        "cloudinary_url": evidence.get("cloudinary_url") or evidence.get("ipfs_cid"),
        "timeline": timeline
    }

@router.post("/verify-evidence-file-court")
async def verify_evidence_file_court(
    evidence_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Verify evidence by uploading original file"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    stored_hash = evidence.get("hash")
    file_content = await file.read()
    uploaded_hash = hashlib.sha256(file_content).hexdigest()
    is_valid = uploaded_hash == stored_hash
    
    verification_record = {
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": current_user["email"],
        "verified_by_name": current_user.get("full_name"),
        "uploaded_hash": uploaded_hash,
        "stored_hash": stored_hash,
        "result": is_valid,
        "method": "FILE_UPLOAD"
    }
    
    if "verifications" not in evidence:
        evidence["verifications"] = []
    evidence["verifications"].append(verification_record)
    await mongo_storage.save_evidence(evidence_id, evidence)
    
    return {
        "verified": is_valid,
        "message": "✅ File is AUTHENTIC!" if is_valid else "❌ File has been TAMPERED!",
        "uploaded_hash": uploaded_hash,
        "stored_hash": stored_hash,
        "verification_time": verification_record["verified_at"]
    }

@router.post("/verify-evidence-hash-court")
async def verify_evidence_hash_court(
    evidence_id: str,
    provided_hash: str,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Verify evidence by providing hash"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    stored_hash = evidence.get("hash")
    is_valid = provided_hash == stored_hash
    
    verification_record = {
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": current_user["email"],
        "verified_by_name": current_user.get("full_name"),
        "provided_hash": provided_hash,
        "stored_hash": stored_hash,
        "result": is_valid,
        "method": "HASH"
    }
    
    if "verifications" not in evidence:
        evidence["verifications"] = []
    evidence["verifications"].append(verification_record)
    await mongo_storage.save_evidence(evidence_id, evidence)
    
    return {
        "verified": is_valid,
        "message": "✅ Hash matches! Evidence is authentic." if is_valid else "❌ Hash mismatch! Evidence may be tampered.",
        "stored_hash": stored_hash,
        "verification_time": verification_record["verified_at"]
    }

@router.get("/case-forensic-reports/{case_id}")
async def get_case_forensic_reports(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Get all forensic reports for a case and mark as viewed"""
    forensic_reports = await mongo_storage.get_forensic_reports()
    reports_list = list(forensic_reports.values())
    
    case_reports = []
    for report in reports_list:
        if report.get("case_id") == case_id:
            # Mark as viewed by court
            if "court_viewed_at" not in report:
                report["court_viewed_at"] = datetime.now(timezone.utc).isoformat()
                report["court_viewed_by"] = current_user["email"]
                report["court_viewed_by_name"] = current_user.get("full_name")
                await mongo_storage.save_forensic_reports(forensic_reports)
            
            evidence = await mongo_storage.get_evidence(report.get("evidence_id"))
            case_reports.append({
                "report_id": report.get("report_id"),
                "report_number": report.get("report_number"),
                "evidence_id": report.get("evidence_id"),
                "evidence_title": evidence.get("title") if evidence else "Unknown",
                "analysis_type": report.get("analysis_type"),
                "findings": report.get("findings"),
                "conclusion": report.get("conclusion"),
                "analyst_name": report.get("analyst_name"),
                "analyst_email": report.get("analyst_email"),
                "created_at": report.get("created_at"),
                "cloudinary_url": report.get("cloudinary_url") or report.get("ipfs_cid", ""),
                "hash": report.get("hash", "")
            })
    
    return sorted(case_reports, key=lambda x: x.get("created_at", ""), reverse=True)

@router.post("/download-full-case-report")
async def download_full_case_report(
    payload: dict,
    current_user: dict = Depends(require_roles(UserRole.COURT))
):
    """Generate and download complete case report with timeline"""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from fastapi.responses import Response
    import io
    
    case_id = payload.get("case_id")
    report_data = payload.get("report_data")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#6366f1'),
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#4f46e5'),
        spaceAfter=12,
        spaceBefore=20
    )
    
    subheading_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#818cf8'),
        spaceAfter=8,
        spaceBefore=12
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.black,
        spaceAfter=6
    )
    
    story = []
    
    # Title
    story.append(Paragraph("Complete Case Report", title_style))
    story.append(Spacer(1, 12))
    
    # Case Details Table
    case = report_data.get("case_details", {})
    case_info = [
        ["Case Number:", case.get("case_number", "N/A")],
        ["Case Title:", case.get("title", "N/A")],
        ["Status:", case.get("status", "N/A")],
        ["Priority:", case.get("priority", "N/A")],
        ["Investigator:", case.get("investigator_name", "N/A")],
        ["Created:", case.get("created_at", "N/A")],
        ["Updated:", case.get("updated_at", "N/A")]
    ]
    
    table = Table(case_info, colWidths=[120, 380])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    
    # FIR Details
    fir = report_data.get("fir_details", {})
    if fir:
        story.append(Paragraph("FIR Information", heading_style))
        fir_info = [
            ["FIR Number:", fir.get("fir_number", "N/A")],
            ["Complainant:", fir.get("complainant_name", "N/A")],
            ["Contact:", fir.get("complainant_contact", "N/A")],
            ["Incident:", fir.get("incident_title", "N/A")],
            ["Location:", fir.get("incident_location", "N/A")]
        ]
        fir_table = Table(fir_info, colWidths=[120, 380])
        fir_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fef3c7')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        story.append(fir_table)
        story.append(Spacer(1, 15))
    
    # Suspects
    suspects = report_data.get("suspects", [])
    if suspects:
        story.append(Paragraph("Suspects", heading_style))
        for suspect in suspects:
            story.append(Paragraph(f"• {suspect.get('name')}: {suspect.get('description', 'No description')}", body_style))
        story.append(Spacer(1, 10))
    
    # Witnesses
    witnesses = report_data.get("witnesses", [])
    if witnesses:
        story.append(Paragraph("Witnesses", heading_style))
        for witness in witnesses:
            story.append(Paragraph(f"• {witness.get('name')}: {witness.get('statement', 'No statement')}", body_style))
        story.append(Spacer(1, 10))
    
    # Evidence Summary
    evidence = report_data.get("evidence", [])
    story.append(Paragraph(f"Evidence ({len(evidence)} items)", heading_style))
    for ev in evidence:
        story.append(Paragraph(f"• {ev.get('title')}", subheading_style))
        story.append(Paragraph(f"  {ev.get('description', 'No description')}", body_style))
    story.append(Spacer(1, 10))
    
    # Forensic Reports
    forensic_reports = report_data.get("forensic_reports", [])
    if forensic_reports:
        story.append(Paragraph("Forensic Reports", heading_style))
        for report in forensic_reports:
            story.append(Paragraph(f"• {report.get('report_number')} - {report.get('analysis_type')}", subheading_style))
            story.append(Paragraph(f"  Analyst: {report.get('analyst_name')}", body_style))
        story.append(Spacer(1, 10))
    
    # Timeline
    timeline = report_data.get("timeline", [])
    if timeline:
        story.append(Paragraph(f"Case Timeline ({len(timeline)} events)", heading_style))
        for event in timeline:
            story.append(Paragraph(f"• {event.get('event')}", subheading_style))
            story.append(Paragraph(f"  Date: {event.get('date')}", body_style))
            story.append(Paragraph(f"  Description: {event.get('description')}", body_style))
            story.append(Spacer(1, 5))
    
    doc.build(story)
    buffer.seek(0)
    
    # Return with CORS headers
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Content-Disposition": f"attachment; filename=case_report_{case.get('case_number', 'case')}.pdf"
        }
    )


# Add OPTIONS handler for CORS preflight
@router.options("/download-full-case-report")
async def download_full_case_report_options():
    """Handle CORS preflight requests"""
    return Response(
        content="",
        media_type="text/plain",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400",
        }
    )


# ============ HEARING ACCESS ENDPOINT ============
@router.get("/hearing/access/{hearing_id}")
async def check_hearing_access(
    hearing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if user can access the hearing (only at scheduled time)"""
    from datetime import timedelta
    
    # Find hearing
    all_cases = await mongo_storage.get_all_cases()
    found_hearing = None
    found_case = None
    
    for case in all_cases:
        hearings = await mongo_storage.get_case_hearings(case.get("case_id"))
        if hearing_id in hearings:
            found_hearing = hearings[hearing_id]
            found_case = case
            break
    
    if not found_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    # Check authorization
    fir = await mongo_storage.get_fir(found_case.get("fir_id"))
    user_email = current_user["email"]
    user_role = current_user["role"]
    
    is_investigator = found_case.get("investigator_email") == user_email
    is_complainant = fir and fir.get("complainant_email") == user_email
    is_court = user_role == "COURT"
    
    if not (is_investigator or is_complainant or is_court):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check timing
    now = datetime.now(timezone.utc)
    hearing_datetime = datetime.fromisoformat(f"{found_hearing['hearing_date']}T{found_hearing['hearing_time']}")
    
    # Allow access 15 minutes before scheduled time
    can_access_early = now >= (hearing_datetime - timedelta(minutes=15))
    can_access_late = now <= (hearing_datetime + timedelta(hours=2))
    
    can_access = can_access_early and can_access_late and found_hearing.get("status") == "SCHEDULED"
    
    return {
        "can_access": can_access,
        "hearing_id": hearing_id,
        "hearing_datetime": hearing_datetime.isoformat(),
        "now": now.isoformat(),
        "meeting_link": found_hearing.get("meeting_link") if can_access else None,
        "message": "You can join the hearing now" if can_access else "Hearing is not available at this time"
    }


# ============ CORS OPTIONS HANDLERS ============
@router.options("/hearing/access/{hearing_id}")
async def hearing_access_options():
    """Handle CORS preflight for hearing access"""
    from fastapi.responses import Response
    return Response(
        content="",
        media_type="text/plain",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400",
        }
    )