def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_anchors_requires_auth(client):
    r = client.get("/anchors/case/test-case-1")
    assert r.status_code in (401, 403)
