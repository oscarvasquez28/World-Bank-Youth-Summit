"""
Econometrics.py – Dynamic extraction of World Bank data via wbgapi.

All queries accept a country ISO-3 code as input so the system remains
geographically agnostic (no hardcoded locales).
"""

from __future__ import annotations

import json
import logging
from typing import Any

import pandas as pd
import wbgapi as wb
from pathlib import Path

from api.core.Config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global datasets
# ---------------------------------------------------------------------------
_settings = get_settings()
_BASE_DIR = Path(__file__).parent.parent
DATA_DIR = _BASE_DIR / _settings.TRAINING_DATA_DIR

try:
    WCDE_DATA = pd.read_csv(
        DATA_DIR / _settings.WITTGENSTEIN_CSV,
        skiprows=_settings.WITTGENSTEIN_SKIP_ROWS,
    )
except Exception as e:
    logger.error(f"Failed to load {_settings.WITTGENSTEIN_CSV}: {e}")
    WCDE_DATA = pd.DataFrame()

# ---------------------------------------------------------------------------
# Indicator codes (World Development Indicators – WDI)
# ---------------------------------------------------------------------------
# Loaded from config so deployers can swap indicators via .env.
INDICATOR_MAP: dict[str, str] = json.loads(_settings.WDI_INDICATOR_MAP)

# The most recent years to query (descending so the first non-NaN wins).
_RECENT_YEARS = range(2023, 2009, -1)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def fetch_country_indicators(country_code: str) -> dict[str, Any]:
    """
    Pull the latest available WDI values for *country_code*.

    Parameters
    ----------
    country_code : str
        ISO-3166 alpha-3 country code (e.g. ``"KEN"``, ``"PHL"``, ``"COL"``).

    Returns
    -------
    dict
        Mapping of human-readable indicator names to their latest numeric
        values.  Missing data is represented as ``None``.
    """
    series_ids = list(INDICATOR_MAP.values())

    try:
        df: pd.DataFrame = wb.data.DataFrame(
            series_ids,
            economy=country_code,
            time=_RECENT_YEARS,
        )
    except Exception:
        logger.exception("wbgapi fetch failed for country=%s", country_code)
        # Return an empty shell so the caller can still proceed.
        return {name: None for name in INDICATOR_MAP}

    # df columns look like "YR2022", "YR2021", … and rows are indicator IDs.
    # We want the most-recent non-null value for each indicator.
    result: dict[str, Any] = {}
    for friendly_name, series_id in INDICATOR_MAP.items():
        value = None
        if series_id in df.index:
            row = df.loc[series_id].dropna()
            if not row.empty:
                value = float(row.iloc[0])
        result[friendly_name] = value

    return result


def fetch_education_projections(country_code: str) -> dict[str, Any]:
    """
    Query the projected educational shifts for a given country using the Wittgenstein dataset.
    """
    if WCDE_DATA.empty:
        return {}
        
    try:
        economy_info = wb.economy.get(country_code)
        country_name = economy_info.get("value")
        if not country_name:
            return {}
    except Exception as e:
        logger.error(f"Failed to resolve country code {country_code} for Wittgenstein: {e}")
        return {}
        
    # Filter dataset for the country and focus on projections (e.g. 2025-2035)
    # The dataset contains "Area", "Year", "Age", "Education", "Distribution"
    df = WCDE_DATA[(WCDE_DATA["Area"] == country_name) & (WCDE_DATA["Year"].isin([2025, 2030, 2035]))]
    
    if df.empty:
        return {}
        
    # Summarize distribution across education levels by year
    # We will average over Age groups to give a broad picture
    summary = df.groupby(["Year", "Education"])["Distribution"].mean().reset_index()
    
    # Format as nested dict: {2025: {"Under 15": X, "Upper Secondary": Y}, 2030: ...}
    projections = {}
    for year in sorted(summary["Year"].unique()):
        year_data = summary[summary["Year"] == year]
        projections[str(year)] = dict(zip(year_data["Education"], year_data["Distribution"]))
        
    return {"country": country_name, "projections": projections}


def build_feature_vector(indicators: dict[str, Any]) -> list[float]:
    """
    Convert the indicator dict into a flat numeric vector suitable for the
    scikit-learn risk model.  Missing values are imputed as 0.0.

    The order is deterministic (same as ``INDICATOR_MAP`` insertion order).
    """
    vec = [float(indicators.get(name) or 0.0) for name in INDICATOR_MAP]
    vec.append(float(indicators.get("ilo_genai_exposure") or 0.0))
    return vec


def get_feature_names() -> list[str]:
    """Return ordered feature names matching ``build_feature_vector``."""
    return list(INDICATOR_MAP.keys()) + ["ilo_genai_exposure"]

