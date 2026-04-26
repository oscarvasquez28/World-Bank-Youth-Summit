"""
RiskApi.py – Returns the automation-risk assessment with LIME explanation.

POST /api/risk/assess
"""

from __future__ import annotations

import asyncio
import logging

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
