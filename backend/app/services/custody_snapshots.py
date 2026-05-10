"""Optional IPFS snapshots for custody events (immutable JSON on IPFS; CID stored on evidence + snapshots table)."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.config import settings
from app.core.ipfs_client import ipfs_client
from app.storage.sqlite_index import SqliteIndex

_snapshot_idx: SqliteIndex | None = None


def _idx() -> SqliteIndex:
    global _snapshot_idx
    if _snapshot_idx is None:
        _snapshot_idx = SqliteIndex(settings.SQLITE_PATH)
        _snapshot_idx.init_schema()
    return _snapshot_idx


async def append_custody_ipfs_snapshot_if_enabled(
    evidence_id: str,
    evidence: Dict[str, Any],
) -> Dict[str, Any]:
    if not settings.ENABLE_CUSTODY_IPFS_SNAPSHOTS:
        return evidence

    bundle = {
        "type": "custody_snapshot",
        "evidence_id": evidence_id,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "custody_log": evidence.get("custody_log", []),
        "custody_transfers": evidence.get("custody_transfers", []),
    }
    json_str = json.dumps(bundle, sort_keys=True, default=str)
    content_hash = hashlib.sha256(json_str.encode("utf-8")).hexdigest()

    try:
        cid = await ipfs_client.upload_json(bundle)
    except Exception:
        return evidence

    entry = {
        "cid": cid,
        "content_hash": content_hash,
        "created_at": bundle["captured_at"],
    }
    evidence.setdefault("custody_snapshot_cids", []).append(entry)
    try:
        _idx().insert_snapshot("custody", evidence_id, cid, content_hash)
    except Exception:
        pass
    return evidence
