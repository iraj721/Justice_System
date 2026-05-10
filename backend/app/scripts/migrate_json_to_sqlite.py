"""
Import existing JSON store into SQLite entities table (idempotent).

Run from backend directory:
  python -m app.scripts.migrate_json_to_sqlite
  python -m app.scripts.migrate_json_to_sqlite --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from app.core.config import settings
from app.storage.sqlite_index import SqliteIndex


def _load_json(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def migrate(*, dry_run: bool) -> dict:
    idx = SqliteIndex(settings.SQLITE_PATH)
    idx.init_schema()
    ddir = settings.DATA_DIR
    counts: dict[str, int] = {}

    def upsert_many(collection: str, items: dict) -> int:
        n = 0
        for k, v in items.items():
            if not isinstance(v, dict):
                continue
            if not dry_run:
                idx.upsert_entity(collection, str(k), v)
            n += 1
        return n

    pairs = [
        ("firs.json", "firs"),
        ("cases.json", "cases"),
        ("evidence.json", "evidence"),
        ("users.json", "users"),
    ]
    for fname, coll in pairs:
        path = os.path.join(ddir, fname)
        data = _load_json(path)
        c = upsert_many(coll, data)
        counts[f"{coll}"] = c

    doc_path = os.path.join(ddir, "documents.json")
    doc_root = _load_json(doc_path)
    doc_n = 0
    for email, docs in doc_root.items():
        if not isinstance(docs, dict):
            continue
        for doc_id, doc in docs.items():
            if not isinstance(doc, dict):
                continue
            eid = f"{email}__{doc_id}"
            if not dry_run:
                idx.upsert_entity("documents", eid, doc)
            doc_n += 1
    counts["documents"] = doc_n

    return counts


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="Count only, do not write SQLite")
    args = p.parse_args()
    try:
        counts = migrate(dry_run=args.dry_run)
    except Exception as e:
        print("Migration failed:", e, file=sys.stderr)
        return 1
    mode = "dry-run" if args.dry_run else "applied"
    print(f"Migration ({mode}) entity counts:", counts)
    print("SQLite path:", os.path.abspath(settings.SQLITE_PATH))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
