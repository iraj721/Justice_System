# backend/app/api/case_timeline.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.core.authz import get_current_user
from app.services.mongo_storage import mongo_storage

router = APIRouter(prefix="/case-timeline", tags=["Case Timeline"])

@router.get("/{case_id}")
async def get_complete_case_timeline(case_id: str, current_user: dict = Depends(get_current_user)):
    """Get complete timeline for a case including all activities"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    print(f"🔍 DEBUG: Case {case_id} has timeline: {case.get('timeline', [])}")
    
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    current_user_role = current_user.get("role")
    current_user_email = current_user.get("email")
    
    # Allow access for: complainant, investigator, forensic, court, admin
    is_complainant = fir and fir.get("complainant_email") == current_user_email
    is_investigator = case.get("investigator_email") == current_user_email
    is_forensic = current_user_role == "FORENSIC_ANALYST"
    is_court = current_user_role == "COURT"
    is_admin = current_user_role == "ADMIN"
    
    if not (is_complainant or is_investigator or is_forensic or is_court or is_admin):
        raise HTTPException(status_code=403, detail="Access denied")
    
    timeline = []
    # Track unique events using multiple keys to prevent duplicates
    added_event_keys = set()
    added_evidence_events = set()
    added_report_events = set()
    
    def add_event(event_data):
        """Add event to timeline with duplicate prevention"""
        event_name = event_data.get("event", "")
        evidence_id = event_data.get("evidence_id", "")
        report_id = event_data.get("report_id", "")
        event_date = event_data.get("date", "")
        event_by = event_data.get("by", "")
        
        # Create unique key based on event type
        if "Forensic Report Generated" in event_name and report_id:
            event_key = f"report_generated_{report_id}"
        elif "Forensic Report Shared" in event_name and report_id:
            event_key = f"report_shared_{report_id}_{event_data.get('details', {}).get('shared_with', '')}"
        elif "Evidence Sent to Forensic" in event_name and evidence_id:
            event_key = f"evidence_sent_{evidence_id}"
        elif "Evidence Added" in event_name and evidence_id:
            event_key = f"evidence_added_{evidence_id}"
        elif "Document Submitted" in event_name and evidence_id:
            event_key = f"document_submitted_{evidence_id}"
        elif "Evidence Verified" in event_name and evidence_id:
            event_key = f"evidence_verified_{evidence_id}_{event_date}"
        elif "Verification Failed" in event_name and evidence_id:
            event_key = f"evidence_failed_{evidence_id}_{event_date}"
        else:
            # For other events, use date + event name + by
            event_key = f"{event_date}_{event_name}_{event_by}"
        
        if event_key not in added_event_keys:
            added_event_keys.add(event_key)
            timeline.append(event_data)
            return True
        else:
            print(f"⚠️ Duplicate prevented: {event_key}")
            return False
    
    # ============ GET TIMELINE EVENTS FROM CASE STORAGE ============
    if case.get("timeline"):
        for event in case.get("timeline", []):
            add_event({
                "date": event.get("timestamp") or event.get("date"),
                "event": event.get("action") or event.get("event"),
                "description": event.get("description", ""),
                "icon": event.get("icon", "📌"),
                "status": event.get("status", "completed"),
                "by": event.get("by") or event.get("by_name", "System"),
                "type": event.get("type", "case_level"),
                "details": event.get("details")
            })
    
    # Get all evidence for this case
    all_evidence = await mongo_storage.get_all_evidence()
    case_evidence = [ev for ev in all_evidence if ev.get("case_id") == case_id]
    forensic_reports = await mongo_storage.get_forensic_reports()
    
    # ============ 1. FIR SUBMISSION ============
    if fir and fir.get("created_at"):
        already_added = any(e.get("event") == "📝 FIR Submitted" for e in timeline)
        if not already_added:
            add_event({
                "date": fir.get("created_at"),
                "event": "📝 FIR Submitted",
                "description": f"FIR #{fir.get('fir_number')} has been filed successfully",
                "icon": "📝",
                "status": "completed",
                "by": fir.get("complainant_name"),
                "type": "case_level"
            })
    
    # ============ 2. FIR STATUS HISTORY ============
    for history in fir.get("status_history", []):
        status_name = history.get("status", "").replace("_", " ")
        icon_map = {"UNDER_REVIEW": "🔍", "ACCEPTED": "✅", "REJECTED": "❌"}
        add_event({
            "date": history.get("timestamp"),
            "event": f"📌 FIR {status_name}",
            "description": history.get("remarks", f"FIR status updated to {status_name}"),
            "icon": icon_map.get(history.get("status"), "📌"),
            "status": "completed",
            "by": history.get("changed_by", "System"),
            "type": "case_level"
        })
    
    # ============ 3. CASE CREATED ============
    if case.get("created_at"):
        already_added = any(e.get("event") == "⚖️ Case Created" for e in timeline)
        if not already_added:
            add_event({
                "date": case.get("created_at"),
                "event": "⚖️ Case Created",
                "description": f"Case #{case.get('case_number')} has been registered",
                "icon": "⚖️",
                "status": "completed",
                "by": case.get("investigator_name", "System"),
                "type": "case_level"
            })
    
    # ============ 4. SUSPECTS ADDED ============
    for suspect in case.get("suspects", []):
        add_event({
            "date": suspect.get("added_at") or case.get("created_at"),
            "event": "👤 Suspect Identified",
            "description": f"Suspect: {suspect.get('name')}",
            "icon": "👤",
            "status": "completed",
            "by": suspect.get("added_by", "Investigator"),
            "type": "case_level"
        })
    
    # ============ 5. WITNESSES ADDED ============
    for witness in case.get("witnesses", []):
        add_event({
            "date": witness.get("added_at") or case.get("created_at"),
            "event": "👥 Witness Recorded",
            "description": f"Witness: {witness.get('name')}",
            "icon": "👥",
            "status": "completed",
            "by": witness.get("added_by", "Investigator"),
            "type": "case_level"
        })
    
    # ============ 6. EVIDENCE ADDED ============
    for ev in case_evidence:
        if ev.get("created_at"):
            is_user_document = ev.get("source") == "USER_DOCUMENT"
            event_title = "📄 Document Submitted" if is_user_document else "📦 Evidence Added"
            
            add_event({
                "date": ev.get("created_at"),
                "event": event_title,
                "description": f"{ev.get('title')}",
                "icon": "📄" if is_user_document else "📦",
                "status": "completed",
                "by": ev.get("created_by_name") or ev.get("created_by", "User"),
                "type": "evidence_level",
                "evidence_id": ev.get("evidence_id"),
                "evidence_title": ev.get("title")
            })
    
    # ============ 7. EVIDENCE VERIFICATION ============
    for ev in case_evidence:
        for verif in ev.get("verifications", []):
            add_event({
                "date": verif.get("verified_at"),
                "event": "🔐 Evidence Verified" if verif.get("result") else "❌ Verification Failed",
                "description": f"Evidence '{ev.get('title')}' verification {'passed' if verif.get('result') else 'failed'}",
                "icon": "✅" if verif.get("result") else "❌",
                "status": "completed",
                "by": verif.get("verified_by", "System"),
                "type": "evidence_level",
                "evidence_id": ev.get("evidence_id")
            })
    
    # ============ 8. EVIDENCE SENT TO FORENSIC ============
    for ev in case_evidence:
        if ev.get("transferred_at"):
            add_event({
                "date": ev.get("transferred_at"),
                "event": "🔬 Evidence Sent to Forensic Lab",
                "description": f"Evidence '{ev.get('title')}' sent for forensic analysis",
                "icon": "🔬",
                "status": "completed",
                "by": ev.get("transferred_by", "Investigator"),
                "type": "evidence_level",
                "evidence_id": ev.get("evidence_id"),
                "evidence_title": ev.get("title")
            })
    
    # ============ 9. FEEDBACK EVENTS ============
    all_feedback = await mongo_storage.get_all_feedback()
    case_feedback = [f for f in all_feedback if f.get("case_id") == case_id]
    
    for feedback in case_feedback:
        category_icons = {"COMPLAINT": "⚠️", "SUGGESTION": "💡", "APPRECIATION": "👍", "BUG": "🐛"}
        icon = category_icons.get(feedback.get("category"), "📝")
        
        add_event({
            "date": feedback.get("created_at"),
            "event": f"{icon} Feedback: {feedback.get('subject')}",
            "description": feedback.get("message", "")[:200],
            "icon": icon,
            "status": "completed",
            "by": feedback.get("user_name", feedback.get("user_email")),
            "type": "case_level",
            "details": {
                "category": feedback.get("category"),
                "feedback_id": feedback.get("feedback_id"),
                "rating": feedback.get("rating")
            }
        })
    
    # ============ 10. SHARE CASE EVENTS ============
    shares = await mongo_storage.get_case_shares(case_id)
    for share_id, share in shares.items():
        add_event({
            "date": share.get("created_at"),
            "event": "👥 Case Shared",
            "description": f"Case shared with {share.get('shared_with_name')} ({share.get('permission')} permission)",
            "icon": "👥",
            "status": "completed",
            "by": share.get("shared_by_name", share.get("shared_by")),
            "type": "case_level",
            "details": {
                "shared_with": share.get("shared_with"),
                "permission": share.get("permission")
            }
        })
    
    # ============ 11. SOS EVENTS ============
    sos_records = await mongo_storage.get_all_sos_records()
    
    for sos_id, sos in sos_records.items():
        if sos.get("case_id") == case_id:
            add_event({
                "date": sos.get("created_at"),
                "event": "🚨 SOS Alert Sent",
                "description": f"Emergency SOS alert sent. Location: {sos.get('location', 'Unknown')[:100]}",
                "icon": "🚨",
                "status": "completed",
                "by": sos.get("user_name", sos.get("user_email")),
                "type": "case_level",
                "details": {
                    "location": sos.get("location"),
                    "message": sos.get("message"),
                    "alerts_sent": sos.get("alerts_sent", [])
                }
            })
    
    # ============ 12. CASE ACCEPTED BY FORENSIC ============
    if case.get("forensic_accepted_at"):
        add_event({
            "date": case.get("forensic_accepted_at"),
            "event": "✅ Case Accepted by Forensic Lab",
            "description": f"Case accepted for forensic analysis",
            "icon": "✅",
            "status": "completed",
            "by": case.get("forensic_accepted_by_name", "Forensic Lab"),
            "type": "case_level"
        })
    
    # ============ 13. FORENSIC REPORT GENERATED ============
    added_report_ids = set()
    
    for ev in case_evidence:
        for report_id, report in forensic_reports.items():
            if (report.get("evidence_id") == ev.get("evidence_id") and 
                report.get("status") == "COMPLETED"):
                
                if report_id in added_report_ids:
                    continue
                
                add_event({
                    "date": report.get("created_at"),
                    "event": "📊 Forensic Report Generated",
                    "description": f"Forensic report {report.get('report_number')} generated for evidence '{ev.get('title')}'",
                    "icon": "📊",
                    "status": "completed",
                    "by": report.get("analyst_name", "Forensic Analyst"),
                    "type": "evidence_level",
                    "evidence_id": ev.get("evidence_id"),
                    "evidence_title": ev.get("title"),
                    "report_id": report_id,
                    "report_number": report.get("report_number")
                })
                added_report_ids.add(report_id)
    
    # ============ 14. FORENSIC REPORT SHARED ============
    added_share_keys = set()
    
    # From forensic_reports
    for report_id, report in forensic_reports.items():
        if report.get("case_id") != case_id:
            continue
        
        for shared in report.get("shared_with", []):
            share_key = f"{report_id}_{shared.get('email')}"
            
            if share_key in added_share_keys:
                continue
            
            add_event({
                "date": shared.get("shared_at"),
                "event": "📋 Forensic Report Shared",
                "description": f"Forensic report {report.get('report_number')} shared with {shared.get('name')} ({shared.get('role')})",
                "icon": "📋",
                "status": "completed",
                "by": shared.get("shared_by_name", shared.get("shared_by", "Forensic Analyst")),
                "type": "evidence_level",
                "details": {
                    "report_id": report_id,
                    "report_number": report.get("report_number"),
                    "shared_with": shared.get("email"),
                    "shared_with_name": shared.get("name"),
                    "shared_with_role": shared.get("role"),
                    "evidence_id": report.get("evidence_id")
                },
                "report_id": report_id,
                "evidence_id": report.get("evidence_id")
            })
            added_share_keys.add(share_key)
    
    # From case.shared_reports (if exists)
    for shared_report in case.get("shared_reports", []):
        share_key = f"{shared_report.get('report_id')}_{shared_report.get('shared_with')}"
        
        if share_key in added_share_keys:
            continue
        
        add_event({
            "date": shared_report.get("shared_at"),
            "event": "📋 Forensic Report Shared",
            "description": f"Forensic report {shared_report.get('report_number')} shared with {shared_report.get('shared_with_name')}",
            "icon": "📋",
            "status": "completed",
            "by": shared_report.get("shared_by_name", shared_report.get("shared_by", "System")),
            "type": "evidence_level",
            "details": {
                "report_id": shared_report.get("report_id"),
                "report_number": shared_report.get("report_number"),
                "shared_with": shared_report.get("shared_with"),
                "shared_with_name": shared_report.get("shared_with_name")
            },
            "report_id": shared_report.get("report_id")
        })
        added_share_keys.add(share_key)
    
    # ============ 15. CASE SUBMITTED TO COURT ============
    if case.get("submitted_to_court_at"):
        add_event({
            "date": case.get("submitted_to_court_at"),
            "event": "🏛️ Case Submitted to Court",
            "description": f"Case submitted to court",
            "icon": "🏛️",
            "status": "completed",
            "by": case.get("submitted_by", "Investigator"),
            "type": "case_level"
        })
    
    # ============ 16. COURT HEARING SCHEDULED ============
    hearings = await mongo_storage.get_case_hearings(case_id)
    for hearing_id, hearing in hearings.items():
        if hearing.get("created_at"):
            add_event({
                "date": hearing.get("created_at"),
                "event": "🎙️ Court Hearing Scheduled",
                "description": f"Hearing on {hearing.get('hearing_date')} at {hearing.get('hearing_time')}",
                "icon": "🎙️",
                "status": "completed",
                "by": hearing.get("scheduled_by_name", "Court Officer"),
                "type": "case_level",
                "details": {
                    "hearing_id": hearing.get("hearing_id"),
                    "meeting_link": hearing.get("meeting_link")
                }
            })
    
    # ============ 17. JUDGMENT DELIVERED ============
    if case.get("status") == "DECIDED" and case.get("judgment_date"):
        add_event({
            "date": case.get("judgment_date"),
            "event": "⚖️ Judgment Delivered",
            "description": f"Verdict: {case.get('verdict', 'Unknown')}",
            "icon": "⚖️",
            "status": "completed",
            "by": case.get("judge_name", "Court"),
            "type": "case_level"
        })
    
    # Sort timeline by date (oldest first)
    timeline.sort(key=lambda x: x.get("date", ""))
    
    # Calculate progress percentage
    progress_map = {
        "SUBMITTED": 5,
        "UNDER_REVIEW": 15,
        "ACCEPTED": 25,
        "UNDER_INVESTIGATION": 40,
        "FORENSIC_PENDING": 50,
        "FORENSIC_ACCEPTED": 60,
        "FORENSIC_COMPLETED": 70,
        "SUBMITTED_TO_COURT": 85,
        "DECIDED": 100,
        "CLOSED": 100
    }
    
    progress_percentage = progress_map.get(case.get("status", "SUBMITTED"), 10)
    
    print(f"🔍 DEBUG: Total events in timeline: {len(timeline)}")
    print(f"🔍 DEBUG: Unique event keys: {len(added_event_keys)}")
    
    return {
        "case_id": case.get("case_id"),
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "status": case.get("status"),
        "progress_percentage": progress_percentage,
        "current_stage": case.get("status", "").replace("_", " ").title(),
        "investigator_name": case.get("investigator_name", "Assigned"),
        "investigator_contact": case.get("investigator_phone", "Not available"),
        "created_at": case.get("created_at"),
        "updated_at": case.get("updated_at"),
        "timeline": timeline,
        "evidence_summary": {
            "total": len(case_evidence),
            "verified": len([ev for ev in case_evidence if ev.get("verifications") and ev.get("verifications")[-1].get("result")]),
            "pending": len([ev for ev in case_evidence if not ev.get("verifications")]),
            "tampered": len([ev for ev in case_evidence if ev.get("verifications") and not ev.get("verifications")[-1].get("result")])
        },
        "suspects_count": len(case.get("suspects", [])),
        "witnesses_count": len(case.get("witnesses", []))
    }