"""Placeholder anchor records for future on-chain CID / root anchoring."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.authz import get_current_user
from app.core.config import settings
from app.storage.sqlite_index import SqliteIndex

router = APIRouter(prefix="/anchors", tags=["Anchors"])

_idx_singleton: SqliteIndex | None = None


def _index() -> SqliteIndex:
    global _idx_singleton
    if _idx_singleton is None:
        _idx_singleton = SqliteIndex(settings.SQLITE_PATH)
        _idx_singleton.init_schema()
    return _idx_singleton


class AnchorCreate(BaseModel):
    resource_type: str
    resource_id: str
    cid: Optional[str] = None
    merkle_root: Optional[str] = None
    tx_hash: Optional[str] = None
    chain_id: Optional[str] = None


@router.get("/{resource_type}/{resource_id}")
async def list_anchors(
    resource_type: str,
    resource_id: str,
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    _ = current_user
    return _index().list_anchors(resource_type, resource_id)


@router.post("/record")
async def create_anchor_placeholder(
    payload: AnchorCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Record an anchor intent (e.g. pre-blockchain). tx_hash may be filled when chain is integrated."""
    if not payload.cid and not payload.merkle_root:
        raise HTTPException(status_code=400, detail="cid or merkle_root required")
    row_id = _index().insert_anchor(
        payload.resource_type,
        payload.resource_id,
        payload.cid,
        payload.merkle_root,
        payload.tx_hash,
        payload.chain_id,
    )
    return {
        "id": row_id,
        "recorded_by": current_user["email"],
        "resource_type": payload.resource_type,
        "resource_id": payload.resource_id,
    }
