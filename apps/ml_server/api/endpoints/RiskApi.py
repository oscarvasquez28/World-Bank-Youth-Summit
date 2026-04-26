"""
RiskApi.py – Returns the automation-risk assessment with LIME explanation.

POST /api/risk/assess
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml_engine.RiskModel import assess_risk

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/risk", tags=["Risk"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class RiskRequest(BaseModel):
    """Input for the automation-risk assessment."""

    country_code: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description="ISO-3166 alpha-3 country code (e.g. KEN, PHL, COL)",
        json_schema_extra={"example": "KEN"},
    )
    extra_features: dict[str, float] | None = Field(
        default=None,
        description="Optional overrides for individual indicators (e.g. ILO task-exposure index)",
    )


class ExplanationItem(BaseModel):
    feature: str
    weight: float


class RiskResponse(BaseModel):
    risk_score: float = Field(..., description="Automation risk score (0-100)")
    indicators: dict[str, float | None] = Field(
        ..., description="World Bank indicators used for the prediction"
    )
    explanation: list[ExplanationItem] = Field(
        ..., description="LIME feature-importance breakdown"
    )


class LensRequest(BaseModel):
    country_code: str = Field(
        ..., min_length=3, max_length=3, description="ISO-3166 alpha-3 country code"
    )
    skills_profile: list[str] = Field(
        ..., description="List of ESCO skills (labels or URIs) possessed by the user"
    )


class SkillRiskItem(BaseModel):
    skill: str
    risk_score: float


class LensResponse(BaseModel):
    skills_at_risk: list[SkillRiskItem]
    durable_skills: list[SkillRiskItem]
    resilience_pathways: list[SkillRiskItem]
    market_context: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/assess",
    response_model=RiskResponse,
    summary="Compute automation-risk score",
    description=(
        "Pulls the latest World Bank indicators for the given country, feeds "
        "them through the risk model, and returns a 0-100 score accompanied "
        "by a LIME explanation."
    ),
)
async def assess(payload: RiskRequest) -> RiskResponse:
    """
    Offloads the heavy computation (wbgapi network call + model inference +
    LIME perturbations) to a thread-pool so the async loop stays responsive.
    """
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            assess_risk,
            payload.country_code,
            payload.extra_features,
        )
    except Exception as exc:
        logger.exception("Risk assessment failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RiskResponse(**result)


def _process_lens(country_code: str, skills_profile: list[str]) -> dict:
    from ml_engine.SkillAssessor import evaluate_skills_risk, recommend_adjacent_skills
    from ml_engine.Econometrics import fetch_education_projections, fetch_country_indicators

    indicators = fetch_country_indicators(country_code)

    at_risk, durable = evaluate_skills_risk(indicators, skills_profile)
    resilience_pathways = recommend_adjacent_skills(indicators, durable)
    market_context = fetch_education_projections(country_code)

    return {
        "skills_at_risk": at_risk,
        "durable_skills": durable,
        "resilience_pathways": resilience_pathways,
        "market_context": market_context,
    }


@router.post(
    "/lens",
    response_model=LensResponse,
    summary="AI Readiness & Displacement Risk Lens",
    description="Analyzes individual skills for automation risk and recommends resilient adjacent skills, along with educational projections.",
)
async def lens(payload: LensRequest) -> LensResponse:
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            _process_lens,
            payload.country_code,
            payload.skills_profile,
        )
    except Exception as exc:
        logger.exception("Lens assessment failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return LensResponse(**result)
