"""MongoDB Storage Service - Centralized Database"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.core.config import settings


def _convert_objectid(obj: Any) -> Any:
    """Convert ObjectId to string recursively in dict/list"""
    if isinstance(obj, dict):
        return {k: _convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_objectid(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj


def _remove_id(data: Dict) -> Dict:
    """Remove _id field from dict if present (immutable field)"""
    if "_id" in data:
        del data["_id"]
    return data


class MongoStorage:
    def __init__(self):
        self.client = None
        self.db = None
        self._connect()
        self._init_collections()
    
    def _connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.MONGODB_DB_NAME]
            print(f"✅ MongoDB connected: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise
    
    def _init_collections(self):
        """Initialize all collections"""
        self.users = self.db.users
        self.firs = self.db.firs
        self.cases = self.db.cases
        self.evidence = self.db.evidence
        self.judgments = self.db.judgments
        self.feedback = self.db.feedback
        self.reports = self.db.reports
        self.documents = self.db.documents
        self.drafts = self.db.drafts
        self.emergency = self.db.emergency
        self.subscriptions = self.db.subscriptions
        self.case_shares = self.db.case_shares
        self.tasks = self.db.tasks
        self.messages = self.db.messages
        self.hearings = self.db.hearings
        self.notifications = self.db.notifications
        self.forensic_reports = self.db.forensic_reports
        self.forensic_analyses = self.db.forensic_analyses
        self.forensic_templates = self.db.forensic_templates
        self.court_packages = self.db.court_packages
        self.hearing_events = self.db.hearing_events
        self.saved_searches = self.db.saved_searches
        self.otp = self.db.otp
        
        # Create indexes for performance
        self._create_indexes()
    
    def _create_indexes(self):
        """Create database indexes (run in background)"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(self._create_indexes_async())
        except:
            pass
    
    async def _create_indexes_async(self):
        try:
        # User indexes
            await self.users.create_index("email", unique=True)
            await self.users.create_index("role")
        
        # FIR indexes
            await self.firs.create_index("fir_id", unique=True)
            await self.firs.create_index("complainant_email")
            await self.firs.create_index("status")
            await self.firs.create_index("created_at")
            await self.firs.create_index([("status", 1), ("created_at", -1)])  # Compound index
        
        # Case indexes
            await self.cases.create_index("case_id", unique=True)
            await self.cases.create_index("investigator_email")
            await self.cases.create_index("status")
            await self.cases.create_index("fir_id")
            await self.cases.create_index([("investigator_email", 1), ("status", 1)])
            await self.cases.create_index([("status", 1), ("created_at", -1)])
        
        # Evidence indexes
            await self.evidence.create_index("evidence_id", unique=True)
            await self.evidence.create_index("case_id")
            await self.evidence.create_index("status")
            await self.evidence.create_index("analysis_status")
            await self.evidence.create_index([("case_id", 1), ("status", 1)])
        
        # Other indexes
            await self.judgments.create_index("case_id")
            await self.judgments.create_index("created_at")
            await self.feedback.create_index("case_id")
            await self.feedback.create_index("created_at")
            await self.hearings.create_index("case_id")
            await self.hearings.create_index("hearing_date")
            await self.notifications.create_index("user_email")
            await self.notifications.create_index([("user_email", 1), ("is_read", 1)])
            await self.otp.create_index("email", unique=True)
            await self.otp.create_index("expires_at", expireAfterSeconds=0)  # TTL index
        
            print("✅ MongoDB indexes created successfully")
        except Exception as e:
            print(f"⚠️ Index creation error: {e}")
    
    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()
    
    # ============ USER METHODS ============
    async def save_user(self, email: str, user_data: Dict):
        user_data["email"] = email
        user_data["updated_at"] = self._now()
        _remove_id(user_data)
        await self.users.update_one(
            {"email": email},
            {"$set": user_data},
            upsert=True
        )
    
    async def get_user(self, email: str) -> Optional[Dict]:
        user = await self.users.find_one({"email": email})
        return _convert_objectid(user) if user else None
    
    async def get_all_users(self) -> List[Dict]:
        users = await self.users.find().to_list(1000)
        return _convert_objectid(users)
    
    async def delete_user(self, email: str):
        await self.users.delete_one({"email": email})
    
    # ============ FIR METHODS ============
    async def save_fir(self, fir_id: str, fir_data: Dict):
        fir_data["fir_id"] = fir_id
        fir_data["updated_at"] = self._now()
        _remove_id(fir_data)
        await self.firs.update_one(
            {"fir_id": fir_id},
            {"$set": fir_data},
            upsert=True
        )
    
    async def get_fir(self, fir_id: str) -> Optional[Dict]:
        fir = await self.firs.find_one({"fir_id": fir_id})
        return _convert_objectid(fir) if fir else None
    
    async def get_all_firs(self) -> List[Dict]:
        firs = await self.firs.find().to_list(1000)
        return _convert_objectid(firs)
    
    async def update_fir(self, fir_id: str, fir_data: Dict):
        fir_data["updated_at"] = self._now()
        _remove_id(fir_data)
        await self.firs.update_one(
            {"fir_id": fir_id},
            {"$set": fir_data}
        )
    
    async def delete_fir(self, fir_id: str):
        await self.firs.delete_one({"fir_id": fir_id})
    
    # ============ CASE METHODS ============
    async def save_case(self, case_id: str, case_data: Dict):
        case_data["case_id"] = case_id
        case_data["updated_at"] = self._now()
        _remove_id(case_data)
        await self.cases.update_one(
            {"case_id": case_id},
            {"$set": case_data},
            upsert=True
        )
    
    async def get_case(self, case_id: str) -> Optional[Dict]:
        case = await self.cases.find_one({"case_id": case_id})
        return _convert_objectid(case) if case else None
    
    async def get_all_cases(self) -> List[Dict]:
        cases = await self.cases.find().to_list(1000)
        return _convert_objectid(cases)
    
    async def update_case(self, case_id: str, case_data: Dict):
        case_data["updated_at"] = self._now()
        _remove_id(case_data)
        await self.cases.update_one(
            {"case_id": case_id},
            {"$set": case_data}
        )
    
    async def delete_case(self, case_id: str):
        await self.evidence.delete_many({"case_id": case_id})
        await self.cases.delete_one({"case_id": case_id})
    
    # ============ EVIDENCE METHODS ============
    async def save_evidence(self, evidence_id: str, evidence_data: Dict):
        evidence_data["evidence_id"] = evidence_id
        evidence_data["updated_at"] = self._now()
        _remove_id(evidence_data)
        await self.evidence.update_one(
            {"evidence_id": evidence_id},
            {"$set": evidence_data},
            upsert=True
        )
    
    async def get_evidence(self, evidence_id: str) -> Optional[Dict]:
        evidence = await self.evidence.find_one({"evidence_id": evidence_id})
        return _convert_objectid(evidence) if evidence else None
    
    async def get_all_evidence(self) -> List[Dict]:
        evidence = await self.evidence.find().to_list(1000)
        return _convert_objectid(evidence)
    
    async def delete_evidence(self, evidence_id: str):
        await self.evidence.delete_one({"evidence_id": evidence_id})
    
    # ============ JUDGMENT METHODS ============
    async def save_judgment(self, judgment_id: str, judgment_data: Dict):
        judgment_data["judgment_id"] = judgment_id
        _remove_id(judgment_data)
        await self.judgments.update_one(
            {"judgment_id": judgment_id},
            {"$set": judgment_data},
            upsert=True
        )
    
    async def get_judgment(self, judgment_id: str) -> Optional[Dict]:
        judgment = await self.judgments.find_one({"judgment_id": judgment_id})
        return _convert_objectid(judgment) if judgment else None
    
    async def get_all_judgments(self) -> Dict:
        judgments = await self.judgments.find().to_list(1000)
        return {j["judgment_id"]: _convert_objectid(j) for j in judgments}
    
    # ============ FEEDBACK ============
    async def save_feedback(self, feedback_id: str, feedback_data: Dict):
        feedback_data["feedback_id"] = feedback_id
        _remove_id(feedback_data)
        await self.feedback.update_one(
            {"feedback_id": feedback_id},
            {"$set": feedback_data},
            upsert=True
        )
    
    async def get_all_feedback(self) -> List[Dict]:
        feedback = await self.feedback.find().to_list(1000)
        return _convert_objectid(feedback)
    
    # ============ DRAFTS ============
    async def get_user_drafts(self, email: str) -> Dict:
        drafts = await self.drafts.find_one({"email": email})
        return _convert_objectid(drafts.get("drafts", {})) if drafts else {}
    
    async def save_user_drafts(self, email: str, drafts: Dict):
        await self.drafts.update_one(
            {"email": email},
            {"$set": {"drafts": drafts, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ DOCUMENTS ============
    async def get_user_documents(self, email: str) -> List[Dict]:
        docs = await self.documents.find_one({"email": email})
        if not docs:
            return []
        documents = docs.get("documents", {})
        return _convert_objectid(list(documents.values()))
    
    async def save_user_document(self, email: str, doc_id: str, document: Dict):
        await self.documents.update_one(
            {"email": email},
            {"$set": {f"documents.{doc_id}": document}},
            upsert=True
        )
    
    async def delete_user_document(self, email: str, doc_id: str):
        await self.documents.update_one(
            {"email": email},
            {"$unset": {f"documents.{doc_id}": ""}}
        )
    
    # ============ CASE SHARES ============
    async def get_case_shares(self, case_id: str) -> Dict:
        shares = await self.case_shares.find_one({"case_id": case_id})
        return _convert_objectid(shares.get("shares", {})) if shares else {}
    
    async def save_case_shares(self, case_id: str, shares: Dict):
        await self.case_shares.update_one(
            {"case_id": case_id},
            {"$set": {"shares": shares, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ TASKS ============
    async def get_case_tasks(self, case_id: str) -> Dict:
        tasks = await self.tasks.find_one({"case_id": case_id})
        return _convert_objectid(tasks.get("tasks", {})) if tasks else {}
    
    async def save_case_tasks(self, case_id: str, tasks: Dict):
        await self.tasks.update_one(
            {"case_id": case_id},
            {"$set": {"tasks": tasks, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ MESSAGES ============
    async def get_case_messages(self, case_id: str) -> Dict:
        messages = await self.messages.find_one({"case_id": case_id})
        return _convert_objectid(messages.get("messages", {})) if messages else {}
    
    async def save_case_messages(self, case_id: str, messages: Dict):
        await self.messages.update_one(
            {"case_id": case_id},
            {"$set": {"messages": messages, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ HEARINGS ============
    async def get_case_hearings(self, case_id: str) -> Dict:
        hearings = await self.hearings.find_one({"case_id": case_id})
        return _convert_objectid(hearings.get("hearings", {})) if hearings else {}
    
    async def save_case_hearings(self, case_id: str, hearings: Dict):
        await self.hearings.update_one(
            {"case_id": case_id},
            {"$set": {"hearings": hearings, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ NOTIFICATIONS ============
    async def get_user_notifications(self, email: str) -> Dict:
        notifs = await self.notifications.find_one({"email": email})
        return _convert_objectid(notifs.get("notifications", {})) if notifs else {}
    
    async def save_user_notifications(self, email: str, notifications: Dict):
        await self.notifications.update_one(
            {"email": email},
            {"$set": {"notifications": notifications, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ FORENSIC REPORTS ============
    async def get_forensic_reports(self) -> Dict:
        reports = await self.forensic_reports.find().to_list(1000)
        return {r["report_id"]: _convert_objectid(r) for r in reports}
    
    async def save_forensic_reports(self, reports: Dict):
        for report_id, report in reports.items():
            _remove_id(report)
            await self.forensic_reports.update_one(
                {"report_id": report_id},
                {"$set": report},
                upsert=True
            )
    
    # ============ HEARING EVENTS ============
    async def get_hearing_events(self, hearing_id: str) -> Dict:
        events = await self.hearing_events.find_one({"hearing_id": hearing_id})
        return _convert_objectid(events.get("events", {})) if events else {}
    
    async def save_hearing_events(self, hearing_id: str, events: Dict):
        await self.hearing_events.update_one(
            {"hearing_id": hearing_id},
            {"$set": {"events": events, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ FORENSIC ANALYSES ============
    async def get_evidence_analyses(self, evidence_id: str) -> Dict:
        analyses = await self.forensic_analyses.find_one({"evidence_id": evidence_id})
        return _convert_objectid(analyses.get("analyses", {})) if analyses else {}
    
    async def save_evidence_analyses(self, evidence_id: str, analyses: Dict):
        await self.forensic_analyses.update_one(
            {"evidence_id": evidence_id},
            {"$set": {"analyses": analyses, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ FORENSIC TEMPLATES ============
    async def get_user_templates(self, email: str) -> Dict:
        templates = await self.forensic_templates.find_one({"email": email})
        return _convert_objectid(templates.get("templates", {})) if templates else {}
    
    async def save_user_templates(self, email: str, templates: Dict):
        await self.forensic_templates.update_one(
            {"email": email},
            {"$set": {"templates": templates, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ COURT PACKAGES ============
    async def get_court_packages(self, case_id: str) -> Dict:
        packages = await self.court_packages.find_one({"case_id": case_id})
        return _convert_objectid(packages.get("packages", {})) if packages else {}
    
    async def save_court_packages(self, case_id: str, packages: Dict):
        await self.court_packages.update_one(
            {"case_id": case_id},
            {"$set": {"packages": packages, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ EMERGENCY ============
    async def get_emergency_contacts(self, email: str) -> Dict:
        emergency = await self.emergency.find_one({"email": email})
        return _convert_objectid(emergency.get("contacts", {})) if emergency else {}
    
    async def save_emergency_contacts(self, email: str, contacts: Dict):
        await self.emergency.update_one(
            {"email": email},
            {"$set": {"contacts": contacts, "updated_at": self._now()}},
            upsert=True
        )
    
    async def save_sos_record(self, sos_id: str, sos_record: Dict):
        _remove_id(sos_record)
        await self.emergency.update_one(
            {"sos_id": sos_id},
            {"$set": sos_record},
            upsert=True
        )
    
    async def get_all_sos_records(self) -> Dict:
        """Get all SOS records"""
        records = await self.emergency.find().to_list(1000)
        return {r["sos_id"]: _convert_objectid(r) for r in records if r.get("sos_id")}
    
    # ============ SUBSCRIPTIONS ============
    async def get_user_subscriptions(self, email: str) -> Dict:
        subs = await self.subscriptions.find_one({"email": email})
        return _convert_objectid(subs.get("subscriptions", {})) if subs else {}
    
    async def save_user_subscriptions(self, email: str, subscriptions: Dict):
        await self.subscriptions.update_one(
            {"email": email},
            {"$set": {"subscriptions": subscriptions, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ SAVED SEARCHES ============
    async def get_saved_searches(self, email: str) -> Dict:
        searches = await self.saved_searches.find_one({"email": email})
        return _convert_objectid(searches.get("searches", {})) if searches else {}
    
    async def save_saved_searches(self, email: str, searches: Dict):
        await self.saved_searches.update_one(
            {"email": email},
            {"$set": {"searches": searches, "updated_at": self._now()}},
            upsert=True
        )
    
    # ============ REPORTS (Investigation Reports) ============
    async def save_report(self, report_id: str, report_data: Dict):
        _remove_id(report_data)
        await self.reports.update_one(
            {"report_id": report_id},
            {"$set": report_data},
            upsert=True
        )
    
    async def get_report(self, report_id: str) -> Optional[Dict]:
        report = await self.reports.find_one({"report_id": report_id})
        return _convert_objectid(report) if report else None
    
    async def get_all_reports(self) -> List[Dict]:
        reports = await self.reports.find().to_list(1000)
        return _convert_objectid(reports)


# Create singleton instance
mongo_storage = MongoStorage()