"""
RiskModel.py – Automation-risk scoring with scikit-learn + LIME explanations.

The model combines ILO Generative-AI task-exposure indices with local
infrastructure parameters extracted from the World Bank (via Econometrics.py)
to produce a 0-100 risk score.  Every prediction is accompanied by a
human-readable LIME explanation.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import joblib
import numpy as np
from lime.lime_tabular import LimeTabularExplainer
from sklearn.ensemble import GradientBoostingRegressor

from ml_engine.Econometrics import (
    build_feature_vector,
    fetch_country_indicators,
    get_feature_names,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model loading / bootstrap
# ---------------------------------------------------------------------------
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), os.pardir, "local_models", "RiskRegressor.pkl"
)


def _load_or_create_model() -> GradientBoostingRegressor:
    """
    Load the serialized model if it exists, otherwise create a lightweight
    placeholder that can be swapped out later without changing any API code.
    """
    abs_path = os.path.abspath(_MODEL_PATH)
    if os.path.isfile(abs_path):
        logger.info("Loading risk model from %s", abs_path)
        return joblib.load(abs_path)

    logger.warning(
        "Risk model not found at %s – creating a default placeholder model. "
        "Replace it with a trained model for production use.",
        abs_path,
    )
    # Placeholder: a simple regressor trained on synthetic data so that the
    # full pipeline can be demonstrated end-to-end.
    rng = np.random.default_rng(42)
    n_features = len(get_feature_names())
    X_synth = rng.random((200, n_features)) * 100
    # Synthetic target: weighted sum + noise → scale to 0-100
    weights = rng.random(n_features)
    y_synth = np.clip(X_synth @ weights / weights.sum() + rng.normal(0, 5, 200), 0, 100)
    model = GradientBoostingRegressor(n_estimators=50, max_depth=3, random_state=42)
    model.fit(X_synth, y_synth)
    return model


risk_model = _load_or_create_model()

# LIME explainer – uses a small synthetic training set for perturbation
# background.  Replace with real training data when available.
_rng = np.random.default_rng(0)
_n_feat = len(get_feature_names())
_background = _rng.random((300, _n_feat)) * 100

lime_explainer = LimeTabularExplainer(
    training_data=_background,
    feature_names=get_feature_names(),
    mode="regression",
    verbose=False,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def assess_risk(
    country_code: str,
    extra_features: dict[str, float] | None = None,
) -> dict[str, Any]:
    """
    Compute an automation-risk score for a user located in *country_code*.

    Parameters
    ----------
    country_code : str
        ISO-3 country code forwarded to ``Econometrics.fetch_country_indicators``.
    extra_features : dict, optional
        Additional feature overrides (e.g. a user-reported ILO exposure index).

    Returns
    -------
    dict
        - ``risk_score``   : float 0-100
        - ``indicators``   : raw WDI values used
        - ``explanation``  : list of (feature, weight) tuples from LIME
    """
    indicators = fetch_country_indicators(country_code)

    # Allow callers to inject / override individual features.
    if extra_features:
        indicators.update(extra_features)

    feature_vec = np.array([build_feature_vector(indicators)])

    # Predict
    score = float(np.clip(risk_model.predict(feature_vec)[0], 0, 100))

    # Explain with LIME
    explanation = lime_explainer.explain_instance(
        data_row=feature_vec[0],
        predict_fn=risk_model.predict,
        num_features=len(get_feature_names()),
    )

    return {
        "risk_score": round(score, 2),
        "indicators": indicators,
        "explanation": [
            {"feature": feat, "weight": round(w, 4)}
            for feat, w in explanation.as_list()
        ],
    }


def predict_skill_risk(indicators: dict[str, Any], ilo_exposure: float) -> float:
    """
    Fast prediction for a single skill given pre-fetched WBG indicators and its raw ILO exposure.
    Bypasses LIME and network calls for batch processing in SkillAssessor.
    """
    inds = indicators.copy()
    inds["ilo_genai_exposure"] = ilo_exposure
    feature_vec = np.array([build_feature_vector(inds)])
    score = float(np.clip(risk_model.predict(feature_vec)[0], 0, 100))
    return round(score, 2)
