"""
TestEndpoints.py – Verifies that the web endpoints return HTTP 200.

Run with:  pytest tests/TestEndpoints.py -v
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.Main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
class TestHealth:
    def test_health_returns_200(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "version" in body


# ---------------------------------------------------------------------------
# Skills endpoint
# ---------------------------------------------------------------------------
class TestSkillsEndpoint:
    def test_extract_skills_returns_200(self):
        resp = client.post(
            "/api/skills/extract",
            json={"texts": ["I am skilled in communication and data analysis"]},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "results" in body
        assert isinstance(body["results"], list)
        assert len(body["results"]) == 1

    def test_extract_skills_empty_list_returns_422(self):
        resp = client.post("/api/skills/extract", json={"texts": []})
        assert resp.status_code == 422  # validation error


# ---------------------------------------------------------------------------
# Risk endpoint
# ---------------------------------------------------------------------------
class TestRiskEndpoint:
    def test_risk_assess_returns_200(self):
        resp = client.post(
            "/api/risk/assess",
            json={"country_code": "KEN"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "risk_score" in body
        assert 0 <= body["risk_score"] <= 100
        assert "explanation" in body
        assert isinstance(body["explanation"], list)

    def test_risk_assess_invalid_code_returns_422(self):
        resp = client.post(
            "/api/risk/assess",
            json={"country_code": "X"},  # too short
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Badges endpoint
# ---------------------------------------------------------------------------
class TestBadgesEndpoint:
    def test_issue_badge_returns_200(self):
        resp = client.post(
            "/api/badges/issue",
            json={
                "recipient_name": "Jane Doe",
                "recipient_id": "did:example:jane123",
                "skills": [
                    {"name": "Communication", "description": "Verbal and written"},
                    {"name": "Data Analysis"},
                ],
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "credential" in body
        cred = body["credential"]
        assert "VerifiableCredential" in cred["type"]
        assert "OpenBadgeCredential" in cred["type"]

    def test_issue_badge_no_skills_returns_422(self):
        resp = client.post(
            "/api/badges/issue",
            json={
                "recipient_name": "Jane Doe",
                "recipient_id": "did:example:jane123",
                "skills": [],
            },
        )
        assert resp.status_code == 422
