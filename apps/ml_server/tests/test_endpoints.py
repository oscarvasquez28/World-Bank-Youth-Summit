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

    def test_extract_skills_spanish_locale(self):
        resp = client.post(
            "/api/skills/extract",
            json={
                "texts": ["I have experience in strategic planning"],
                "locale": "MEX"
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        results = body["results"]
        # The label should be translated to Spanish
        mapped_labels = [s["mapped"] for s in results[0]["skills"]]
        assert "planificación estratégica" in mapped_labels

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

    def test_risk_lens_spanish_locale(self):
        resp = client.post(
            "/api/risk/lens",
            json={
                "country_code": "MEX",
                "skills_profile": ["planificación estratégica"],
                "locale": "MEX",
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        # Response skills should be in Spanish
        all_skills = body["durable_skills"] + body["skills_at_risk"]
        if all_skills:
            assert all_skills[0]["skill"] != ""

    def test_risk_occupations_english(self):
        resp = client.post(
            "/api/risk/occupations",
            json={
                "skills": ["strategic planning", "data entry"],
                "locale": "USA",
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, dict)
        if body:
            # Check the first occupation key
            occ_name = list(body.keys())[0]
            occ = body[occ_name]
            assert "matching_skills" in occ
            assert "description" in occ
            assert "matching_percentage" in occ

    def test_risk_occupations_spanish(self):
        resp = client.post(
            "/api/risk/occupations",
            json={
                "skills": ["planificación estratégica"],
                "locale": "MEX",
            }
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, dict)
        if body:
            occ_name = list(body.keys())[0]
            assert "matching_percentage" in body[occ_name]

    def test_risk_occupations_invalid_locale(self):
        resp = client.post(
            "/api/risk/occupations",
            json={
                "skills": ["strategic planning"],
                "locale": "XX",
            }
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
