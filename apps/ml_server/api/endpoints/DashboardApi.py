"""
DashboardApi.py – Aggregate econometric signals for policymakers.
"""

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml_engine.Econometrics import fetch_country_indicators, fetch_education_projections

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

class DashboardRequest(BaseModel):
    country_code: str = Field(..., min_length=3, max_length=3, description="ISO-3166 alpha-3 country code")

class DashboardResponse(BaseModel):
    country_name: str
    macro_indicators: dict[str, float | None]
    education_landscape: dict[str, Any]
    resilience_index: float = Field(..., description="Calculated resilience score (0-100)")

def _calculate_dashboard_data(country_code: str) -> dict[str, Any]:
    indicators = fetch_country_indicators(country_code)
    edu_projections = fetch_education_projections(country_code)
    
    # Calculate a mock "Resilience Index" based on growth vs unemployment
    growth = indicators.get("gdp_growth") or 0
    unemployment = indicators.get("unemployment_youth") or 20
    participation = indicators.get("labor_force_participation") or 50
    
    resilience = (growth * 5) + (participation / 2) - (unemployment / 2)
    resilience = max(0, min(100, 50 + resilience)) # Normalize to 0-100 range around 50
    
    return {
        "country_name": edu_projections.get("country", country_code),
        "macro_indicators": indicators,
        "education_landscape": edu_projections.get("projections", {}),
        "resilience_index": round(resilience, 2)
    }

@router.post(
    "/aggregate",
    response_model=DashboardResponse,
    summary="Get aggregate signals for policymakers",
    description="Returns country-level labor market signals, educational projections, and a resilience index."
)
async def get_aggregate(payload: DashboardRequest) -> DashboardResponse:
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            _calculate_dashboard_data,
            payload.country_code,
        )
    except Exception as exc:
        logger.exception("Dashboard aggregation failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
        
    return DashboardResponse(**result)
