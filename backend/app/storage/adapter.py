"""
Single import point for persistence. Routers should keep using
`from app.services.ipfs_storage import ipfs_storage`; that object is either
`IPFSStorage` (JSON files) or `HybridStorage` (JSON + SQLite index) based on
`USE_SQLITE_INDEX` in settings.
"""

from app.services.ipfs_storage import ipfs_storage

__all__ = ["ipfs_storage"]
