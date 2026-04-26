"""
NlpExtractor.py – Wrapper for ojd-daps-skills interaction.

Provides a thin, async-friendly interface around the SkillsExtractor.
The extractor is loaded ONCE at import time (via the global singleton)
and then reused across all requests.
"""

from __future__ import annotations

import logging
from typing import Any

from ojd_daps_skills.extract_skills.extract_skills import SkillsExtractor

from api.core.Config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global singleton – loaded once when this module is first imported.
# Per the project rules the model takes ~1 min to load, so we MUST NOT
# instantiate it inside an endpoint function.
# ---------------------------------------------------------------------------
_settings = get_settings()

logger.info("Loading SkillsExtractor with taxonomy '%s' …", _settings.TAXONOMY_NAME)
skills_extractor = SkillsExtractor(taxonomy_name=_settings.TAXONOMY_NAME)
logger.info("SkillsExtractor ready.")


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def extract_skills(texts: list[str]) -> list[dict[str, Any]]:
    """
    Extract and map skills from one or more free-text descriptions.

    Parameters
    ----------
    texts : list[str]
        A list of informal text passages (e.g. a CV paragraph, job ad, or
        self-description) from which skills should be extracted.

    Returns
    -------
    list[dict]
        One dict per input text, each containing:
        - ``text``        : the original input string
        - ``skills``      : list of dicts with ``raw`` (surface form) and
                            ``mapped`` (ESCO taxonomy label) keys
    """
    docs = skills_extractor(texts)

    results: list[dict[str, Any]] = []
    for original_text, doc in zip(texts, docs):
        skills_found: list[dict[str, str]] = []
        for ent in doc.ents:
            mapped = getattr(ent._, "mapped_skill", None)
            skills_found.append(
                {
                    "raw": ent.text,
                    "mapped": mapped if mapped else ent.text,
                }
            )
        results.append({"text": original_text, "skills": skills_found})

    return results
