"""JSON file store + SQLite index (dual-write; single-key reads try SQLite first)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.core.config import settings
# Lazy import to avoid circular dependency
import sys
if 'app.services.ipfs_storage' not in sys.modules:
    from app.services.ipfs_storage import IPFSStorage
else:
    IPFSStorage = sys.modules['app.services.ipfs_storage'].IPFSStorage

from app.storage.sqlite_index import SqliteIndex


class HybridStorage(IPFSStorage):
    def __init__(self) -> None:
        super().__init__()
        self._idx = SqliteIndex(settings.SQLITE_PATH)
        self._idx.init_schema()

    def save_evidence(self, evidence_id: str, evidence_data: Dict[str, Any]) -> None:
        super().save_evidence(evidence_id, evidence_data)
        self._idx.upsert_entity("evidence", evidence_id, evidence_data)
        cid = evidence_data.get("ipfs_cid")
        if cid:
            self._idx.record_pin(str(cid), "evidence", evidence_id)

    def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        row = self._idx.get_entity("evidence", evidence_id)
        if row is not None:
            return row
        return super().get_evidence(evidence_id)

    def save_case(self, case_id: str, case_data: Dict[str, Any]) -> None:
        super().save_case(case_id, case_data)
        self._idx.upsert_entity("cases", case_id, case_data)
        cid = case_data.get("ipfs_cid")
        if cid and cid != "UPLOAD_FAILED":
            self._idx.record_pin(str(cid), "case", case_id)

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        row = self._idx.get_entity("cases", case_id)
        if row is not None:
            return row
        return super().get_case(case_id)

    def save_fir(self, fir_id: str, fir_data: Dict[str, Any]) -> None:
        super().save_fir(fir_id, fir_data)
        self._idx.upsert_entity("firs", fir_id, fir_data)
        cid = fir_data.get("ipfs_cid")
        if cid and cid != "UPLOAD_FAILED":
            self._idx.record_pin(str(cid), "fir", fir_id)

    def get_fir(self, fir_id: str) -> Optional[Dict[str, Any]]:
        row = self._idx.get_entity("firs", fir_id)
        if row is not None:
            return row
        return super().get_fir(fir_id)

    def save_user(self, email: str, user_data: Dict[str, Any]) -> None:
        super().save_user(email, user_data)
        self._idx.upsert_entity("users", email, user_data)
        cid = user_data.get("ipfs_cid")
        if cid and cid != "UPLOAD_FAILED":
            self._idx.record_pin(str(cid), "user", email)

    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        row = self._idx.get_entity("users", email)
        if row is not None:
            return row
        return super().get_user(email)

    def save_user_document(self, email: str, doc_id: str, document: Dict[str, Any]) -> None:
        super().save_user_document(email, doc_id, document)
        eid = f"{email}__{doc_id}"
        self._idx.upsert_entity("documents", eid, document)
        cid = document.get("ipfs_cid")
        if cid:
            self._idx.record_pin(str(cid), "document", doc_id)

    def delete_user_document(self, email: str, doc_id: str) -> None:
        super().delete_user_document(email, doc_id)
        self._idx.delete_entity("documents", f"{email}__{doc_id}")
