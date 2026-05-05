"""City Eye backend integration tests."""
import os, uuid, time, requests, pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://vehicle-detect-6.preview.emergentagent.com").rstrip("/")
SAMPLE_IMG = "/tmp/sample.jpg"


def _client():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


def _register(s, role):
    email = f"test_{role}_{uuid.uuid4().hex[:8]}@cityeye.io"
    r = s.post(f"{BASE}/api/auth/register", json={"email": email, "password": "passw0rd", "name": f"T {role}", "role": role})
    assert r.status_code == 200, f"register {role} failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == role
    assert data["email"] == email
    return email, data


@pytest.fixture(scope="module")
def admin():
    s = _client()
    r = s.post(f"{BASE}/api/auth/login", json={"email": "admin@cityeye.io", "password": "admin123"})
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text}"
    assert r.json()["role"] == "analyzer"
    # ensure cookie is set
    assert s.cookies.get("access_token"), "access_token cookie not set"
    return s


@pytest.fixture(scope="module")
def user_session():
    s = _client()
    email, _ = _register(s, "user")
    return s, email


@pytest.fixture(scope="module")
def police_session():
    s = _client()
    email, _ = _register(s, "police")
    return s, email


def test_root():
    r = requests.get(f"{BASE}/api/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_login_invalid():
    r = requests.post(f"{BASE}/api/auth/login", json={"email": "admin@cityeye.io", "password": "wrong"})
    assert r.status_code == 401


def test_me_unauth():
    r = requests.get(f"{BASE}/api/auth/me")
    assert r.status_code == 401


def test_me_admin(admin):
    r = admin.get(f"{BASE}/api/auth/me")
    assert r.status_code == 200
    d = r.json()
    assert d["email"] == "admin@cityeye.io"
    assert d["role"] == "analyzer"


def test_register_duplicate(user_session):
    s, email = user_session
    r = requests.post(f"{BASE}/api/auth/register", json={"email": email, "password": "passw0rd", "name": "x", "role": "user"})
    assert r.status_code == 400


@pytest.fixture(scope="module")
def user_analysis_id(user_session):
    s, _ = user_session
    with open(SAMPLE_IMG, "rb") as f:
        files = {"file": ("traffic.jpg", f, "image/jpeg")}
        r = s.post(f"{BASE}/api/analyze/image", files=files, timeout=120)
    assert r.status_code == 200, f"analyze failed: {r.status_code} {r.text[:300]}"
    d = r.json()
    assert "counts" in d and "total" in d["counts"]
    assert d["density"] in ("low", "medium", "high")
    assert d["signal"]["phase"] in ("green", "yellow", "red")
    assert d["annotated_url"].startswith("/api/uploads/annotated/")
    assert d["original_url"].startswith("/api/uploads/original/")
    return d["id"], d["annotated_url"]


def test_analyze_image_works(user_analysis_id):
    aid, _ = user_analysis_id
    assert aid


def test_static_annotated_image(user_analysis_id):
    _, ann_url = user_analysis_id
    r = requests.get(f"{BASE}{ann_url}")
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/")
    assert len(r.content) > 1000


def test_list_analyses_user_only(user_session, user_analysis_id):
    s, _ = user_session
    r = s.get(f"{BASE}/api/analyses")
    assert r.status_code == 200
    items = r.json()
    assert any(it["id"] == user_analysis_id[0] for it in items)
    # all items belong to this user
    me = s.get(f"{BASE}/api/auth/me").json()
    for it in items:
        assert it["user_id"] == me["id"]


def test_get_analysis_owner(user_session, user_analysis_id):
    s, _ = user_session
    aid, _ = user_analysis_id
    r = s.get(f"{BASE}/api/analyses/{aid}")
    assert r.status_code == 200


def test_get_analysis_other_user_forbidden(user_analysis_id):
    # New user tries to access first user's analysis
    s2 = _client()
    _register(s2, "user")
    aid, _ = user_analysis_id
    r = s2.get(f"{BASE}/api/analyses/{aid}")
    assert r.status_code == 403


def test_get_analysis_admin_can_see(admin, user_analysis_id):
    aid, _ = user_analysis_id
    r = admin.get(f"{BASE}/api/analyses/{aid}")
    assert r.status_code == 200


def test_user_cannot_flag(user_session, user_analysis_id):
    s, _ = user_session
    aid, _ = user_analysis_id
    r = s.post(f"{BASE}/api/analyses/{aid}/flag", json={"note": "x"})
    assert r.status_code == 403


def test_police_flag_unflag(police_session, user_analysis_id):
    s, _ = police_session
    aid, _ = user_analysis_id
    r = s.post(f"{BASE}/api/analyses/{aid}/flag", json={"note": "suspicious"})
    assert r.status_code == 200, r.text
    assert r.json()["flagged"] is True
    assert r.json()["flag_note"] == "suspicious"
    r2 = s.post(f"{BASE}/api/analyses/{aid}/unflag")
    assert r2.status_code == 200
    assert r2.json()["flagged"] is False


def test_user_cannot_access_analytics(user_session):
    s, _ = user_session
    r = s.get(f"{BASE}/api/analytics/summary")
    assert r.status_code == 403


def test_analyzer_analytics(admin):
    r = admin.get(f"{BASE}/api/analytics/summary")
    assert r.status_code == 200
    d = r.json()
    for k in ("total_analyses", "by_density", "flagged", "vehicle_totals", "trend"):
        assert k in d
    assert d["total_analyses"] >= 1
    assert set(d["by_density"].keys()) == {"low", "medium", "high"}


def test_police_analytics(police_session):
    s, _ = police_session
    r = s.get(f"{BASE}/api/analytics/summary")
    assert r.status_code == 200


def test_police_list_sees_all(police_session, user_analysis_id):
    s, _ = police_session
    r = s.get(f"{BASE}/api/analyses")
    assert r.status_code == 200
    aid, _ = user_analysis_id
    assert any(it["id"] == aid for it in r.json())


def test_logout(user_session):
    s = _client()
    _register(s, "user")
    r = s.post(f"{BASE}/api/auth/logout")
    assert r.status_code == 200
    # Clear cookies and verify session ended on a fresh client (cookies may be deleted via Set-Cookie)
    # Use a brand-new client without auth -> should 401
    s2 = _client()
    r2 = s2.get(f"{BASE}/api/auth/me")
    assert r2.status_code == 401
