"""
SkillsApi.py – Receives text and returns standardized skills.

POST /api/skills/extract
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml_engine.NlpExtractor import extract_skills

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/skills", tags=["Skills"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class SkillsRequest(BaseModel):
    """One or more text passages from which to extract skills."""

    texts: list[str] = Field(
        ...,
        min_length=1,
        description="List of free-text descriptions (CV excerpts, self-descriptions, etc.)",
        json_schema_extra={"example": ["I am good at communication, teamwork, and data analysis"]},
    )
    locale: str = Field(
        default="USA",
        description="Country code for output language (USA=English, MEX=Spanish). "
        "Input text is expected in English; output labels will be in this language.",
    )


class MappedSkill(BaseModel):
    raw: str = Field(..., description="Surface-form text as found in the input")
    mapped: str = Field(..., description="Canonical ESCO taxonomy label")


class SkillsResultItem(BaseModel):
    text: str
    skills: list[MappedSkill]


class SkillsResponse(BaseModel):
    results: list[SkillsResultItem]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/extract",
    response_model=SkillsResponse,
    summary="Extract & map skills from free text",
    description=(
        "Accepts one or more passages of informal text (in English) and returns the "
        "skills detected, each mapped to the ESCO taxonomy and translated to the target locale."
    ),
)
async def extract(payload: SkillsRequest) -> SkillsResponse:
    """
    Run the NLP skills-extraction pipeline.

    Heavy NLP work is offloaded to a thread-pool so it does not block the
    async event loop (per project anti-pattern rules).
    """
    from ml_engine.SkillAssessor import resolve_locale
    
    try:
        lang = resolve_locale(payload.locale)
        loop = asyncio.get_running_loop()
        results: list[dict[str, Any]] = await loop.run_in_executor(
            None, extract_skills, payload.texts, lang
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Skills extraction failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return SkillsResponse(results=results)
