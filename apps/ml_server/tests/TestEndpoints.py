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

    def test_extract_skills_advanced_mapping(self):
        resp = client.post(
            "/api/skills/extract",
            json={
                "texts": [
                    "I know how to handle customer requests related to cargo",
                    "I have experience in writing database queries"
                ]
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        results = body["results"]
        
        # Verify exact string match
        cargo_mapped = [s["mapped"] for s in results[0]["skills"]]
        assert "handle customer requests related to cargo" in cargo_mapped
        
        # Verify semantic mapping
        db_mapped = [s["mapped"] for s in results[1]["skills"]]
        assert "using database query language" in db_mapped



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

    def test_risk_lens_returns_200(self):
        resp = client.post(
            "/api/risk/lens",
            json={
                "country_code": "KEN",
                "skills_profile": [
                    "theatre techniques", "strategic planning", "data entry", "typing"
                ]
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "skills_at_risk" in body
        assert "durable_skills" in body
        assert "resilience_pathways" in body
        assert "market_context" in body
        assert isinstance(body["durable_skills"], list)



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
