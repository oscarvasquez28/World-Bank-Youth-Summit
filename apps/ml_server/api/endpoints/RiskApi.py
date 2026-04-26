"""
RiskApi.py – Returns the automation-risk assessment with LIME explanation.

POST /api/risk/assess
POST /api/risk/lens
POST /api/risk/occupations
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
    locale: str = Field(
        default="USA",
        description="Country code for language (USA=English, MEX=Spanish). "
        "Input skills must be in this language; response will be in this language.",
    )


class SkillRiskItem(BaseModel):
    skill: str
    risk_score: float


class ResiliencePathwayItem(SkillRiskItem):
    opportunity_type: str = Field(
        ...,
        description="Categorization of the opportunity: Formal Employment, Self-Employment, Gig, or Training"
    )


class LensResponse(BaseModel):
    skills_at_risk: list[SkillRiskItem]
    durable_skills: list[SkillRiskItem]
    resilience_pathways: list[ResiliencePathwayItem]
    market_context: dict[str, Any]


class OccupationsRequest(BaseModel):
    country_code: str = Field(
        ..., min_length=3, max_length=3, description="ISO-3166 alpha-3 country code"
    )
    skills: list[str] = Field(
        ..., min_length=1, description="List of ESCO skill labels"
    )
    locale: str = Field(
        default="USA",
        description="Country code for language (USA=English, MEX=Spanish). "
        "Input skills and response will be in this language.",
    )
    top_n: int = Field(
        default=10, ge=1, le=50, description="Max number of occupations to return"
    )


class OccupationDetail(BaseModel):
    matching_skills: list[str] = Field(..., description="Skills from user input that match this occupation")
    description: str = Field(..., description="Job description from ESCO")
    matching_percentage: float = Field(..., description="Percentage of occupation skills matched")
    opportunity_type: str = Field(..., description="Categorization: Formal Employment, Self-Employment, Gig")
    isced_level: int = Field(..., description="Expected ISCED education level (0-8)")
    missing_essential_skills: list[str] = Field(..., description="List of essential skills the user is missing for this role")
    sector_growth: float | None = Field(None, description="Annual % growth of the associated sector")
    wage_signal: float | None = Field(None, description="Estimated monthly wage floor proxy (USD)")



# ---------------------------------------------------------------------------
# Endpoints
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


def _process_lens(country_code: str, skills_profile: list[str], locale: str) -> dict:
    from ml_engine.SkillAssessor import (
        evaluate_skills_risk,
        recommend_adjacent_skills,
        resolve_locale,
    )
    from ml_engine.Econometrics import fetch_education_projections, fetch_country_indicators

    lang = resolve_locale(locale)
    indicators = fetch_country_indicators(country_code)

    at_risk, durable = evaluate_skills_risk(
        indicators, skills_profile, input_lang=lang, output_lang=lang
    )
    resilience_pathways = recommend_adjacent_skills(
        indicators, durable, output_lang=lang
    )
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
    description=(
        "Analyzes individual skills for automation risk and recommends "
        "resilient adjacent skills, along with educational projections. "
        "Set locale to MEX for Spanish or USA for English."
    ),
)
async def lens(payload: LensRequest) -> LensResponse:
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            _process_lens,
            payload.country_code,
            payload.skills_profile,
            payload.locale,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Lens assessment failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return LensResponse(**result)


def _process_occupations(country_code: str, skills: list[str], locale: str, top_n: int) -> dict[str, Any]:
    from ml_engine.SkillAssessor import match_occupations, resolve_locale
    from ml_engine.Econometrics import fetch_country_indicators
    from ml_engine.LaborMarketSignals import calculate_occupation_signals
    
    lang = resolve_locale(locale)
    indicators = fetch_country_indicators(country_code)
    occupations_list = match_occupations(skills, lang=lang, top_n=top_n)

    # Convert list to the requested dictionary format: { occupation_name: { details } }
    results = {}
    for item in occupations_list:
        occ_name = item["occupation"]
        isco_code = item.get("isco_group") or ""
        
        signals = calculate_occupation_signals(isco_code, indicators)
        
        results[occ_name] = {
            "matching_skills": item["matching_skills"],
            "missing_essential_skills": item["missing_essential_skills"],
            "description": item["description"],
            "matching_percentage": item["matching_percentage"],
            "opportunity_type": item["opportunity_type"],
            "isced_level": item["isced_level"],
            "sector_growth": signals["sector_growth"],
            "wage_signal": signals["wage_signal"]
        }

    return results


@router.post(
    "/occupations",
    response_model=dict[str, OccupationDetail],
    summary="Match skills to occupations with econometric signals",
    description=(
        "Given a set of ESCO skills, returns a dictionary of the occupations that best match, "
        "including sector growth and wage signals for the given country. "
        "Set locale to MEX for Spanish or USA for English."
    ),
)
async def occupations(payload: OccupationsRequest) -> dict[str, Any]:
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            _process_occupations,
            payload.country_code,
            payload.skills,
            payload.locale,
            payload.top_n,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Occupation matching failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return result

