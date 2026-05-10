from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.authz import get_current_user
from app.core.config import settings
from app.storage.sqlite_index import SqliteIndex

router = APIRouter(prefix="/verify", tags=["Verify"])


class VerifyRequest(BaseModel):
    object_type: str
    object_id: str
    sha256_hex: str


@router.post("/by-hash")
async def verify_by_hash(payload: VerifyRequest, current_user: dict = Depends(get_current_user)) -> dict:
    """Return on-chain anchor records stored in local SQLite index (optional) + echo payload.

    This endpoint is safe even if chain anchoring is disabled.
    """
    _ = current_user
    idx = SqliteIndex(settings.SQLITE_PATH)
    idx.init_schema()
    anchors = idx.list_anchors(payload.object_type, payload.object_id)
    return {"input": payload.model_dump(), "anchors": anchors}

