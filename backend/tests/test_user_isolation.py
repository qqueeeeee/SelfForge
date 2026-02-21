from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def _register_and_login() -> str:
    email = f"test-{uuid4().hex[:10]}@example.com"
    password = "testpass123"

    register_response = client.post(
        "/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == 200

    login_response = client.post(
        "/token",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    return token


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_protected_endpoint_requires_auth():
    response = client.get("/calendar/items")
    assert response.status_code == 401


def test_calendar_data_is_isolated_by_user():
    token_a = _register_and_login()
    token_b = _register_and_login()

    create_payload = {
        "title": "User A Task",
        "description": "private",
        "start_datetime": datetime.now(timezone.utc).isoformat(),
        "end_datetime": datetime.now(timezone.utc).isoformat(),
        "category": "work",
        "item_type": "task",
        "priority": "medium",
    }
    create_response = client.post(
        "/calendar/items",
        json=create_payload,
        headers=_auth_headers(token_a),
    )
    assert create_response.status_code == 200
    created_id = create_response.json()["id"]

    list_a = client.get("/calendar/items", headers=_auth_headers(token_a))
    list_b = client.get("/calendar/items", headers=_auth_headers(token_b))
    assert list_a.status_code == 200
    assert list_b.status_code == 200
    assert any(item["id"] == created_id for item in list_a.json())
    assert not any(item["id"] == created_id for item in list_b.json())

    get_b = client.get(f"/calendar/items/{created_id}", headers=_auth_headers(token_b))
    assert get_b.status_code == 404


def test_preferences_are_user_scoped():
    token_a = _register_and_login()
    token_b = _register_and_login()

    update_a = client.put(
        "/preferences",
        json={"default_calendar_view": "week", "default_pomodoro_duration": 45},
        headers=_auth_headers(token_a),
    )
    assert update_a.status_code == 200

    get_a = client.get("/preferences", headers=_auth_headers(token_a))
    get_b = client.get("/preferences", headers=_auth_headers(token_b))
    assert get_a.status_code == 200
    assert get_b.status_code == 200
    assert get_a.json()["default_calendar_view"] == "week"
    assert get_b.json()["default_calendar_view"] != "week"


def test_legacy_logs_are_user_scoped():
    token_a = _register_and_login()
    token_b = _register_and_login()

    create_a = client.post(
        "/logs",
        json={"habit": "water", "value": {"glasses": 8}},
        headers=_auth_headers(token_a),
    )
    assert create_a.status_code == 200

    logs_a = client.get("/logs", headers=_auth_headers(token_a))
    logs_b = client.get("/logs", headers=_auth_headers(token_b))
    assert logs_a.status_code == 200
    assert logs_b.status_code == 200
    assert any(log["habit"] == "water" for log in logs_a.json())
    assert not any(log["habit"] == "water" for log in logs_b.json())
