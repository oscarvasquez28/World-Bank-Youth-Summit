"""
TestInference.py – Verifies that skills extraction and risk assessment
produce correct / expected output shapes.

Run with:  pytest tests/TestInference.py -v
"""

from __future__ import annotations

import numpy as np
import pytest


# ---------------------------------------------------------------------------
# Skills extraction (NLP)
# ---------------------------------------------------------------------------
class TestSkillsInference:
    def test_extract_returns_list(self):
        from ml_engine.NlpExtractor import extract_skills

        results = extract_skills(["I know Python and Excel"])
        assert isinstance(results, list)
        assert len(results) == 1

    def test_each_result_has_required_keys(self):
        from ml_engine.NlpExtractor import extract_skills

        results = extract_skills(["communication and teamwork"])
        item = results[0]
        assert "text" in item
        assert "skills" in item
        assert isinstance(item["skills"], list)

    def test_mapped_field_present(self):
        from ml_engine.NlpExtractor import extract_skills

        results = extract_skills(["data analysis and problem solving"])
        for skill in results[0]["skills"]:
            assert "raw" in skill
            assert "mapped" in skill


# ---------------------------------------------------------------------------
# Risk model
# ---------------------------------------------------------------------------
class TestRiskInference:
    def test_risk_score_in_range(self):
        from ml_engine.RiskModel import assess_risk

        result = assess_risk("KEN")
        assert 0 <= result["risk_score"] <= 100

    def test_explanation_is_list(self):
        from ml_engine.RiskModel import assess_risk

        result = assess_risk("KEN")
        assert isinstance(result["explanation"], list)
        if result["explanation"]:
            item = result["explanation"][0]
            assert "feature" in item
            assert "weight" in item

    def test_indicators_returned(self):
        from ml_engine.RiskModel import assess_risk

        result = assess_risk("KEN")
        assert isinstance(result["indicators"], dict)
        assert len(result["indicators"]) > 0

    def test_evaluate_skills_risk_with_alt_labels(self):
        from ml_engine.SkillAssessor import evaluate_skills_risk
        from ml_engine.Econometrics import fetch_country_indicators

        indicators = fetch_country_indicators("KEN")
        # "use mathematical tools and equipment" is the preferredLabel
        # "use calculator" is an altLabel
        at_risk, durable = evaluate_skills_risk(indicators, ["use calculator", "use mathematical tools and equipment"])
        
        # They should both resolve to the exact same risk score
        assert len(durable) == 2
        assert durable[0]["risk_score"] == durable[1]["risk_score"]



# ---------------------------------------------------------------------------
# Econometrics feature vector
# ---------------------------------------------------------------------------
class TestEconometrics:
    def test_feature_vector_length(self):
        from ml_engine.Econometrics import build_feature_vector, get_feature_names

        dummy = {name: 42.0 for name in get_feature_names()}
        vec = build_feature_vector(dummy)
        assert len(vec) == len(get_feature_names())

    def test_missing_values_imputed_as_zero(self):
        from ml_engine.Econometrics import build_feature_vector, get_feature_names

        empty = {name: None for name in get_feature_names()}
        vec = build_feature_vector(empty)
        assert all(v == 0.0 for v in vec)
