import uuid

import pytest


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _register_and_login(client, email: str, password: str, role: str, subscription_tier: str):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "role": role,
            "subscription_tier": subscription_tier,
        },
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "login_as": "admin" if role == "admin" else "individual plus"},
    )
    return response.json()["data"]["tokens"]["access_token"]


@pytest.mark.anyio
async def test_admin_can_list_plan_limits(client):
    email = f"admin-{uuid.uuid4()}@example.com"
    token = await _register_and_login(client, email, "password123", "admin", "admin")

    response = await client.get("/api/v1/admin/plan-limits", headers=_auth_header(token))

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 4


@pytest.mark.anyio
async def test_non_admin_cannot_list_plan_limits(client):
    email = f"user-{uuid.uuid4()}@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "role": "merchandiser",
            "subscription_tier": "individual-plus",
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123", "login_as": "individual plus"},
    )
    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get("/api/v1/admin/plan-limits", headers=_auth_header(token))

    assert response.status_code == 403
    assert response.json()["error"] == "forbidden"


@pytest.mark.anyio
async def test_quota_evaluator_blocks_and_allows_as_expected():
    from services.quota_service import evaluate_planogram_quota

    blocked = evaluate_planogram_quota(current_count=15, annual_planogram_limit=15, is_unlimited=False)
    allowed = evaluate_planogram_quota(current_count=14, annual_planogram_limit=15, is_unlimited=False)
    unlimited = evaluate_planogram_quota(current_count=500, annual_planogram_limit=None, is_unlimited=True)

    assert blocked["allowed"] is False
    assert blocked["error_code"] == "quota_exceeded"
    assert allowed["allowed"] is True
    assert allowed["remaining"] == 1
    assert unlimited["allowed"] is True
    assert unlimited["limit"] is None