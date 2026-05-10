# backend/app/services/ipfs_storage.py
import json
import hashlib
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.core.config import settings


class IPFSStorage:
    def __init__(self):
        root = settings.DATA_DIR
        os.makedirs(root, exist_ok=True)
        self._data_dir = root
        self.firs_file = os.path.join(root, "firs.json")
        self.cases_file = os.path.join(root, "cases.json")
        self.evidence_file = os.path.join(root, "evidence.json")
        self.users_file = os.path.join(root, "users.json")
        self.reports_file = os.path.join(root, "reports.json")
        self.judgments_file = os.path.join(root, "judgments.json")
        self.drafts_file = os.path.join(root, "drafts.json")
        self.documents_file = os.path.join(root, "documents.json")
        self.feedback_file = os.path.join(root, "feedback.json")
        self.emergency_file = os.path.join(root, "emergency.json")
        self.subscriptions_file = os.path.join(root, "subscriptions.json")
        self.case_shares_file = os.path.join(root, "case_shares.json")
        self.tasks_file = os.path.join(root, "tasks.json")
        self.messages_file = os.path.join(root, "messages.json")
        self.saved_searches_file = os.path.join(root, "saved_searches.json")
        self.court_packages_file = os.path.join(root, "court_packages.json")
        self.forensic_analyses_file = os.path.join(root, "forensic_analyses.json")
        self.forensic_templates_file = os.path.join(root, "forensic_templates.json")
        self.forensic_reports_file = os.path.join(root, "forensic_reports.json")
        self.hearings_file = os.path.join(root, "hearings.json")
        self.notifications_file = os.path.join(root, "notifications.json")
        self._data_dir = root


        self._init_files()
    
    def _init_files(self):
        files_to_create = [
            self.firs_file, self.cases_file, self.evidence_file, 
            self.users_file, self.reports_file, self.judgments_file,
            self.drafts_file, self.documents_file, self.feedback_file,
            self.emergency_file, self.subscriptions_file, self.case_shares_file,
            self.tasks_file,
            self.messages_file,
            self.saved_searches_file,
            self.court_packages_file,
            self.forensic_analyses_file,
            self.forensic_templates_file,
            self.forensic_reports_file,
            self.hearings_file,
            self.notifications_file,
        ]
        for file in files_to_create:
            if not os.path.exists(file):
                with open(file, 'w') as f:
                    json.dump({}, f)
    
    def _load_file(self, filepath: str) -> Dict:
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def _save_file(self, filepath: str, data: Dict):
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    
    def generate_hash(self, data: Any) -> str:
        json_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode()).hexdigest()
    
    # ============ FIR METHODS ============
    def save_fir(self, fir_id: str, fir_data: Dict):
        data = self._load_file(self.firs_file)
        data[fir_id] = fir_data
        self._save_file(self.firs_file, data)
    
    def get_fir(self, fir_id: str) -> Optional[Dict]:
        data = self._load_file(self.firs_file)
        return data.get(fir_id)
    
    def update_fir(self, fir_id: str, fir_data: Dict):
        self.save_fir(fir_id, fir_data)
    
    def get_all_firs(self) -> List[Dict]:
        data = self._load_file(self.firs_file)
        return list(data.values())
    
    # ============ CASE METHODS ============
    def save_case(self, case_id: str, case_data: Dict):
        data = self._load_file(self.cases_file)
        data[case_id] = case_data
        self._save_file(self.cases_file, data)
    
    def get_case(self, case_id: str) -> Optional[Dict]:
        data = self._load_file(self.cases_file)
        return data.get(case_id)
    
    def update_case(self, case_id: str, case_data: Dict):
        self.save_case(case_id, case_data)
    
    def get_all_cases(self) -> List[Dict]:
        data = self._load_file(self.cases_file)
        return list(data.values())
    
    # ============ EVIDENCE METHODS ============
    def save_evidence(self, evidence_id: str, evidence_data: Dict):
        data = self._load_file(self.evidence_file)
        data[evidence_id] = evidence_data
        self._save_file(self.evidence_file, data)
    
    def get_evidence(self, evidence_id: str) -> Optional[Dict]:
        data = self._load_file(self.evidence_file)
        return data.get(evidence_id)
    
    def get_all_evidence(self) -> List[Dict]:
        data = self._load_file(self.evidence_file)
        return list(data.values())
    
    # ============ USER METHODS ============
    def save_user(self, email: str, user_data: Dict):
        data = self._load_file(self.users_file)
        data[email] = user_data
        self._save_file(self.users_file, data)
    
    def get_user(self, email: str) -> Optional[Dict]:
        data = self._load_file(self.users_file)
        return data.get(email)
    
    def get_all_users(self) -> List[Dict]:
        data = self._load_file(self.users_file)
        return list(data.values())
    
    # ============ REPORT METHODS ============
    def save_report(self, report_id: str, report_data: Dict):
        data = self._load_file(self.reports_file)
        data[report_id] = report_data
        self._save_file(self.reports_file, data)
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        data = self._load_file(self.reports_file)
        return data.get(report_id)
    
    def get_all_reports(self) -> List[Dict]:
        data = self._load_file(self.reports_file)
        return list(data.values())
    
    # ============ JUDGMENT METHODS ============
    def save_judgment(self, judgment_id: str, judgment_data: Dict):
        data = self._load_file(self.judgments_file)
        data[judgment_id] = judgment_data
        self._save_file(self.judgments_file, data)
    
    def get_judgment(self, judgment_id: str) -> Optional[Dict]:
        data = self._load_file(self.judgments_file)
        return data.get(judgment_id)
    
    def get_all_judgments(self) -> Dict:
        """Return judgments as dictionary (not list)"""
        return self._load_file(self.judgments_file)
    
    # ============ DRAFT METHODS ============
    def get_user_drafts(self, email: str) -> Dict:
        data = self._load_file(self.drafts_file)
        return data.get(email, {})
    
    def save_user_drafts(self, email: str, drafts: Dict):
        data = self._load_file(self.drafts_file)
        data[email] = drafts
        self._save_file(self.drafts_file, data)
    
    # ============ DOCUMENT METHODS ============
    def get_user_documents(self, email: str) -> List[Dict]:
        data = self._load_file(self.documents_file)
        return list(data.get(email, {}).values())
    
    def save_user_document(self, email: str, doc_id: str, document: Dict):
        data = self._load_file(self.documents_file)
        if email not in data:
            data[email] = {}
        data[email][doc_id] = document
        self._save_file(self.documents_file, data)
    
    def delete_user_document(self, email: str, doc_id: str):
        data = self._load_file(self.documents_file)
        if email in data and doc_id in data[email]:
            del data[email][doc_id]
            self._save_file(self.documents_file, data)
    
    # ============ FEEDBACK METHODS ============
    def save_feedback(self, feedback_id: str, feedback: Dict):
        data = self._load_file(self.feedback_file)
        data[feedback_id] = feedback
        self._save_file(self.feedback_file, data)
    
    def get_all_feedback(self) -> List[Dict]:
        data = self._load_file(self.feedback_file)
        return list(data.values())
    
    # ============ EMERGENCY METHODS ============
    def get_emergency_contacts(self, email: str) -> Dict:
        data = self._load_file(self.emergency_file)
        return data.get(email, {}).get("contacts", {})
    
    def save_emergency_contacts(self, email: str, contacts: Dict):
        data = self._load_file(self.emergency_file)
        if email not in data:
            data[email] = {}
        data[email]["contacts"] = contacts
        self._save_file(self.emergency_file, data)
    
    def save_sos_record(self, sos_id: str, sos_record: Dict):
        data = self._load_file(self.emergency_file)
        if "sos_records" not in data:
            data["sos_records"] = {}
        data["sos_records"][sos_id] = sos_record
        self._save_file(self.emergency_file, data)
    
    # ============ SUBSCRIPTION METHODS ============
    def get_user_subscriptions(self, email: str) -> Dict:
        data = self._load_file(self.subscriptions_file)
        return data.get(email, {})
    
    def save_user_subscriptions(self, email: str, subscriptions: Dict):
        data = self._load_file(self.subscriptions_file)
        data[email] = subscriptions
        self._save_file(self.subscriptions_file, data)
    
    # ============ CASE SHARE METHODS ============
    def get_case_shares(self, case_id: str) -> Dict:
        data = self._load_file(self.case_shares_file)
        return data.get(case_id, {})
    
    def save_case_shares(self, case_id: str, shares: Dict):
        data = self._load_file(self.case_shares_file)
        data[case_id] = shares
        self._save_file(self.case_shares_file, data)
    
    # ============ TASK METHODS ============
    def get_case_tasks(self, case_id: str) -> Dict:
        data = self._load_file(self.tasks_file)
        return data.get(case_id, {})
    
    def save_case_tasks(self, case_id: str, tasks: Dict):
        data = self._load_file(self.tasks_file)
        data[case_id] = tasks
        self._save_file(self.tasks_file, data)
    
    # ============ MESSAGE METHODS ============
    def get_case_messages(self, case_id: str) -> Dict:
        data = self._load_file(self.messages_file)
        return data.get(case_id, {})
    
    def save_case_messages(self, case_id: str, messages: Dict):
        data = self._load_file(self.messages_file)
        data[case_id] = messages
        self._save_file(self.messages_file, data)
    
    # ============ SAVED SEARCHES ============
    def get_saved_searches(self, email: str) -> Dict:
        data = self._load_file(self.saved_searches_file)
        return data.get(email, {})
    
    def save_saved_searches(self, email: str, searches: Dict):
        data = self._load_file(self.saved_searches_file)
        data[email] = searches
        self._save_file(self.saved_searches_file, data)
    
    # ============ COURT PACKAGES ============
    def get_court_packages(self, case_id: str) -> Dict:
        data = self._load_file(self.court_packages_file)
        return data.get(case_id, {})
    
    def save_court_packages(self, case_id: str, packages: Dict):
        data = self._load_file(self.court_packages_file)
        data[case_id] = packages
        self._save_file(self.court_packages_file, data)
    
    # ============ FORENSIC METHODS ============
    def get_evidence_analyses(self, evidence_id: str) -> Dict:
        data = self._load_file(self.forensic_analyses_file)
        return data.get(evidence_id, {})
    
    def save_evidence_analyses(self, evidence_id: str, analyses: Dict):
        data = self._load_file(self.forensic_analyses_file)
        data[evidence_id] = analyses
        self._save_file(self.forensic_analyses_file, data)
    
    def get_user_templates(self, email: str) -> Dict:
        data = self._load_file(self.forensic_templates_file)
        return data.get(email, {})
    
    def save_user_templates(self, email: str, templates: Dict):
        data = self._load_file(self.forensic_templates_file)
        data[email] = templates
        self._save_file(self.forensic_templates_file, data)
    
    def get_forensic_reports(self) -> Dict:
        return self._load_file(self.forensic_reports_file)
    
    def save_forensic_reports(self, reports: Dict):
        self._save_file(self.forensic_reports_file, reports)
    
        # ============ HEARING METHODS ============
    def get_case_hearings(self, case_id: str) -> Dict:
        data = self._load_file(self.hearings_file)
        return data.get(case_id, {})
    
    def save_case_hearings(self, case_id: str, hearings: Dict):
        data = self._load_file(self.hearings_file)
        data[case_id] = hearings
        self._save_file(self.hearings_file, data)

    def get_hearing_events(self, hearing_id: str) -> dict:
        """Get all events for a hearing"""
        hearing_events_dir = os.path.join(self._data_dir, "hearing_events")
        os.makedirs(hearing_events_dir, exist_ok=True)
        file_path = os.path.join(hearing_events_dir, f"{hearing_id}.json")
        return self._load_file(file_path)
    
    def save_hearing_events(self, hearing_id: str, events: dict):
        """Save hearing events"""
        hearing_events_dir = os.path.join(self._data_dir, "hearing_events")
        os.makedirs(hearing_events_dir, exist_ok=True)
        file_path = os.path.join(hearing_events_dir, f"{hearing_id}.json")
        self._save_file(file_path, events)
    
    # ============ EVIDENCE COMPLETE HISTORY ============
    def get_evidence_complete_history(self, evidence_id: str) -> dict:
        """Get complete history of an evidence including all actions"""
        evidence = self.get_evidence(evidence_id)
        if not evidence:
            return None
        
        history = []
        
        # 1. Evidence Creation
        history.append({
            "type": "CREATION",
            "timestamp": evidence.get("created_at"),
            "action": "Evidence Uploaded",
            "description": f"Evidence '{evidence.get('title')}' was uploaded to the system",
            "by": evidence.get("created_by"),
            "by_name": evidence.get("created_by_name", evidence.get("created_by")),
            "details": {
                "title": evidence.get("title"),
                "description": evidence.get("description"),
                "type": evidence.get("type", "DOCUMENT"),
                "ipfs_cid": evidence.get("ipfs_cid"),
                "hash": evidence.get("hash")
            }
        })
        
        # 2. Verification History
        for verif in evidence.get("verifications", []):
            history.append({
                "type": "VERIFICATION",
                "timestamp": verif.get("verified_at"),
                "action": "Evidence Verified" if verif.get("result") else "Verification Failed",
                "description": f"Evidence verification {'passed' if verif.get('result') else 'failed'}",
                "by": verif.get("verified_by"),
                "by_name": verif.get("verified_by_name", verif.get("verified_by")),
                "result": verif.get("result"),
                "details": {
                    "stored_hash": verif.get("stored_hash"),
                    "provided_hash": verif.get("provided_hash"),
                    "verification_time": verif.get("verified_at")
                }
            })
        
        # 3. Views/Access Logs
        for log in evidence.get("custody_log", []):
            history.append({
                "type": "ACCESS",
                "timestamp": log.get("timestamp"),
                "action": log.get("action", "VIEW"),
                "description": log.get("notes", f"Evidence {log.get('action', 'accessed')}"),
                "by": log.get("accessed_by"),
                "by_name": log.get("accessed_by_name", log.get("accessed_by")),
                "details": {
                    "action": log.get("action"),
                    "notes": log.get("notes")
                }
            })
        
        # 4. Transfers (to forensic, to court, between analysts)
        for transfer in evidence.get("custody_transfers", []):
            history.append({
                "type": "TRANSFER",
                "timestamp": transfer.get("transferred_at"),
                "action": "Evidence Transferred",
                "description": f"Evidence transferred from {transfer.get('transferred_from_name')} to {transfer.get('transferred_to_name')}",
                "from": transfer.get("transferred_from"),
                "from_name": transfer.get("transferred_from_name"),
                "to": transfer.get("transferred_to"),
                "to_name": transfer.get("transferred_to_name"),
                "reason": transfer.get("reason"),
                "details": {
                    "reason": transfer.get("reason"),
                    "status": transfer.get("status")
                }
            })
        
        # 5. Sent to Forensic
        if evidence.get("transferred_at") and evidence.get("status") == "TRANSFERRED_TO_FORENSIC":
            history.append({
                "type": "FORENSIC_SUBMISSION",
                "timestamp": evidence.get("transferred_at"),
                "action": "Sent to Forensic Lab",
                "description": f"Evidence sent to forensic lab for analysis",
                "by": evidence.get("transferred_by"),
                "by_name": evidence.get("transferred_by_name", evidence.get("transferred_by")),
                "details": {
                    "status": evidence.get("status"),
                    "analysis_status": evidence.get("analysis_status")
                }
            })
        
        # 6. Forensic Acceptance
        if evidence.get("accepted_at"):
            history.append({
                "type": "FORENSIC_ACCEPTANCE",
                "timestamp": evidence.get("accepted_at"),
                "action": "Accepted by Forensic",
                "description": f"Evidence accepted for forensic analysis. Estimated: {evidence.get('estimated_days', 7)} days",
                "by": evidence.get("accepted_by"),
                "by_name": evidence.get("accepted_by_name", evidence.get("accepted_by")),
                "details": {
                    "estimated_days": evidence.get("estimated_days"),
                    "accepted_at": evidence.get("accepted_at")
                }
            })
        
        # 7. Forensic Rejection
        if evidence.get("rejected_at"):
            history.append({
                "type": "FORENSIC_REJECTION",
                "timestamp": evidence.get("rejected_at"),
                "action": "Rejected by Forensic",
                "description": f"Evidence rejected: {evidence.get('rejection_reason', 'Not specified')}",
                "by": evidence.get("rejected_by"),
                "by_name": evidence.get("rejected_by_name", evidence.get("rejected_by")),
                "details": {
                    "reason": evidence.get("rejection_reason")
                }
            })
        
        # 8. Analysis Started
        if evidence.get("analysis_started_at"):
            history.append({
                "type": "ANALYSIS_START",
                "timestamp": evidence.get("analysis_started_at"),
                "action": "Analysis Started",
                "description": f"Forensic analysis started",
                "by": evidence.get("analyzed_by"),
                "by_name": evidence.get("analyzed_by_name", evidence.get("analyzed_by")),
                "details": {
                    "analysis_status": evidence.get("analysis_status")
                }
            })
        
        # 9. Analysis Completed
        if evidence.get("analysis_completed_at"):
            forensic_reports = self.get_forensic_reports()
            report = None
            for r_id, r in forensic_reports.items():
                if r.get("evidence_id") == evidence_id:
                    report = r
                    break
            
            history.append({
                "type": "ANALYSIS_COMPLETE",
                "timestamp": evidence.get("analysis_completed_at"),
                "action": "Analysis Completed",
                "description": f"Forensic analysis completed. Report available.",
                "by": evidence.get("analyzed_by"),
                "by_name": evidence.get("analyzed_by_name", evidence.get("analyzed_by")),
                "details": {
                    "report_id": report.get("report_id") if report else None,
                    "report_number": report.get("report_number") if report else None,
                    "findings": report.get("findings") if report else None,
                    "conclusion": report.get("conclusion") if report else None
                }
            })
        
        # 10. Sent to Court
        if evidence.get("transferred_to_court_at"):
            history.append({
                "type": "COURT_SUBMISSION",
                "timestamp": evidence.get("transferred_to_court_at"),
                "action": "Sent to Court",
                "description": f"Forensic report submitted to court",
                "by": evidence.get("transferred_by"),
                "by_name": evidence.get("transferred_by_name", evidence.get("transferred_by")),
                "details": {
                    "assigned_court_officer": evidence.get("assigned_court_officer"),
                    "status": evidence.get("status")
                }
            })
        
        # Sort by timestamp (oldest first for better timeline)
        history.sort(key=lambda x: x.get("timestamp") or "", reverse=False)
        
        return {
            "evidence_id": evidence_id,
            "evidence_title": evidence.get("title"),
            "evidence_description": evidence.get("description"),
            "current_status": evidence.get("status"),
            "current_analysis_status": evidence.get("analysis_status", "PENDING"),
            "current_custodian": evidence.get("current_custodian"),
            "current_custodian_name": evidence.get("current_custodian_name"),
            "created_at": evidence.get("created_at"),
            "created_by": evidence.get("created_by"),
            "created_by_name": evidence.get("created_by_name"),
            "history": history,
            "verification_count": len(evidence.get("verifications", [])),
            "view_count": len([l for l in evidence.get("custody_log", []) if l.get("action") == "VIEW"]),
            "transfer_count": len(evidence.get("custody_transfers", [])),
            "last_verified_at": evidence.get("verifications", [])[-1].get("verified_at") if evidence.get("verifications") else None
        }
    
    # ============ NOTIFICATION METHODS ============
def get_user_notifications(self, email: str) -> Dict:
    data = self._load_file(self.notifications_file)
    return data.get(email, {})

def save_user_notifications(self, email: str, notifications: Dict):
    data = self._load_file(self.notifications_file)
    data[email] = notifications
    self._save_file(self.notifications_file, data)

def mark_notification_read(self, email: str, notification_id: str):
    notifications = self.get_user_notifications(email)
    if notification_id in notifications:
        notifications[notification_id]["is_read"] = True
        self.save_user_notifications(email, notifications)


def _make_storage():
    if settings.USE_SQLITE_INDEX:
        from app.storage.hybrid_storage import HybridStorage

        return HybridStorage()
    return IPFSStorage()


ipfs_storage = _make_storage()