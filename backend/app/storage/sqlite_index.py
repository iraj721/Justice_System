"""SQLite secondary index: dual-write with JSON files; get-by-id prefers SQL after migration."""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class SqliteIndex:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        parent = os.path.dirname(os.path.abspath(db_path))
        if parent:
            os.makedirs(parent, exist_ok=True)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS entities (
                    collection TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (collection, entity_id)
                );

                CREATE TABLE IF NOT EXISTS ipfs_pins (
                    cid TEXT PRIMARY KEY,
                    resource_type TEXT NOT NULL,
                    resource_id TEXT NOT NULL,
                    pinned_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    snapshot_type TEXT NOT NULL,
                    resource_key TEXT NOT NULL,
                    cid TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS anchors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    resource_type TEXT NOT NULL,
                    resource_id TEXT NOT NULL,
                    cid TEXT,
                    merkle_root TEXT,
                    tx_hash TEXT,
                    chain_id TEXT,
                    anchored_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_entities_collection ON entities(collection);
                CREATE INDEX IF NOT EXISTS idx_anchors_resource ON anchors(resource_type, resource_id);
                """
            )

    def upsert_entity(self, collection: str, entity_id: str, payload: Dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        blob = json.dumps(payload, default=str)
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO entities (collection, entity_id, payload, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(collection, entity_id) DO UPDATE SET
                    payload = excluded.payload,
                    updated_at = excluded.updated_at
                """,
                (collection, entity_id, blob, now),
            )

    def get_entity(self, collection: str, entity_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT payload FROM entities WHERE collection = ? AND entity_id = ?",
                (collection, entity_id),
            ).fetchone()
        if row is None:
            return None
        return json.loads(row["payload"])

    def delete_entity(self, collection: str, entity_id: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "DELETE FROM entities WHERE collection = ? AND entity_id = ?",
                (collection, entity_id),
            )

    def record_pin(self, cid: str, resource_type: str, resource_id: str) -> None:
        if not cid or cid == "UPLOAD_FAILED":
            return
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO ipfs_pins (cid, resource_type, resource_id, pinned_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(cid) DO UPDATE SET
                    resource_type = excluded.resource_type,
                    resource_id = excluded.resource_id,
                    pinned_at = excluded.pinned_at
                """,
                (cid, resource_type, resource_id, now),
            )

    def insert_snapshot(
        self,
        snapshot_type: str,
        resource_key: str,
        cid: str,
        content_hash: str,
    ) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO snapshots (snapshot_type, resource_key, cid, content_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (snapshot_type, resource_key, cid, content_hash, now),
            )
            return int(cur.lastrowid or 0)

    def insert_anchor(
        self,
        resource_type: str,
        resource_id: str,
        cid: Optional[str],
        merkle_root: Optional[str],
        tx_hash: Optional[str],
        chain_id: Optional[str],
    ) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO anchors (resource_type, resource_id, cid, merkle_root, tx_hash, chain_id, anchored_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (resource_type, resource_id, cid, merkle_root, tx_hash, chain_id, now),
            )
            return int(cur.lastrowid or 0)

    def list_anchors(self, resource_type: str, resource_id: str) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, resource_type, resource_id, cid, merkle_root, tx_hash, chain_id, anchored_at
                FROM anchors
                WHERE resource_type = ? AND resource_id = ?
                ORDER BY id DESC
                """,
                (resource_type, resource_id),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_schema_version(self) -> int:
        """Get current database schema version"""
        with self._connect() as conn:
            cursor = conn.execute("""
                SELECT version FROM schema_version 
                ORDER BY applied_at DESC LIMIT 1
            """)
            row = cursor.fetchone()
            return row[0] if row else 0
    
    def migrate_to_version(self, target_version: int) -> None:
        """Run migrations to reach target version"""
        current = self.get_schema_version()
        
        migrations = {
            1: self._migration_v1,
            2: self._migration_v2,
            3: self._migration_v3,
        }
        
        for version in range(current + 1, target_version + 1):
            if version in migrations:
                migrations[version]()
                self._record_migration(version)
    
    def _migration_v1(self) -> None:
        """Initial schema - already handled by init_schema"""
        pass
    
    def _migration_v2(self) -> None:
        """Add encryption fields to evidence"""
        with self._connect() as conn:
            try:
                conn.execute("ALTER TABLE entities ADD COLUMN encrypted INTEGER DEFAULT 0")
            except sqlite3.OperationalError:
                pass  # Column already exists
    
    def _migration_v3(self) -> None:
        """Add indexes for better performance"""
        with self._connect() as conn:
            conn.execute("CREATE INDEX IF NOT EXISTS idx_entities_updated ON entities(updated_at)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_anchors_tx_hash ON anchors(tx_hash)")
    
    def _record_migration(self, version: int) -> None:
        """Record that a migration was applied"""
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL
                )
            """)
            conn.execute(
                "INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
                (version, datetime.now(timezone.utc).isoformat())
            )
