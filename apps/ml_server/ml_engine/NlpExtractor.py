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
    from ml_engine.SkillAssessor import LABEL_TO_URI
    
    # Pre-compute lowercase labels for fast exact matching
    lowercase_to_label = {
        label.lower(): label 
        for label in LABEL_TO_URI.keys() 
        if isinstance(label, str)
    }

    docs = skills_extractor(texts)

    results: list[dict[str, Any]] = []
    for original_text, doc in zip(texts, docs):
        skills_found: list[dict[str, str]] = []
        
        # 1. Exact String Match Augmentation
        text_lower = original_text.lower()
        for lower_label, exact_label in lowercase_to_label.items():
            if len(lower_label) > 4 and lower_label in text_lower:
                skills_found.append({
                    "raw": exact_label,
                    "mapped": exact_label
                })
                
        # 2. NLP Model Extraction and Mapping
        spans = getattr(doc._, "skill_spans", [])
        mapped_skills = getattr(doc._, "mapped_skills", [])
        
        for s, m in zip(spans, mapped_skills):
            span_text = s if isinstance(s, str) else getattr(s, "text", str(s))
            
            # The mapper returns a dict with 'match_skill' if semantic mapping succeeded
            mapped_label = span_text
            if isinstance(m, dict) and "match_skill" in m:
                mapped_label = m["match_skill"]
                
            skills_found.append(
                {
                    "raw": span_text,
                    "mapped": mapped_label,
                }
            )
            
        # Deduplicate results (exact matches might overlap with NLP matches)
        unique_skills = []
        seen_mapped = set()
        for sf in skills_found:
            if sf["mapped"] not in seen_mapped:
                seen_mapped.add(sf["mapped"])
                unique_skills.append(sf)

        results.append({"text": original_text, "skills": unique_skills})

    return results
