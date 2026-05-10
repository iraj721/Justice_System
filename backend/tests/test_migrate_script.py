def test_migrate_json_to_sqlite_dry_run():
    from app.scripts.migrate_json_to_sqlite import migrate

    counts = migrate(dry_run=True)
    assert isinstance(counts, dict)
    for key in ("firs", "cases", "evidence", "users", "documents"):
        assert key in counts
        assert counts[key] >= 0
