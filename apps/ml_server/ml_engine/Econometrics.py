"""
Econometrics.py – Dynamic extraction of World Bank data via wbgapi.

All queries accept a country ISO-3 code as input so the system remains
geographically agnostic (no hardcoded locales).
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
import wbgapi as wb

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Indicator codes (World Development Indicators – WDI)
# ---------------------------------------------------------------------------
# These are representative WDI series used for the risk-calibration model.
# Additional indicators can be appended here without changing downstream code.
INDICATOR_MAP: dict[str, str] = {
    "broadband_penetration": "IT.NET.BBND.P2",       # Fixed broadband subs per 100 people
    "internet_users_pct": "IT.NET.USER.ZS",           # Individuals using the Internet (%)
    "mobile_cellular_subs": "IT.CEL.SETS.P2",          # Mobile cellular subs per 100 people
    "gdp_per_capita_ppp": "NY.GDP.PCAP.PP.CD",         # GDP per capita, PPP (current intl $)
    "unemployment_youth": "SL.UEM.1524.ZS",            # Unemployment, youth total (% 15-24)
    "labor_force_participation": "SL.TLF.CACT.ZS",     # Labor force participation rate (%)
    "school_enrollment_tertiary": "SE.TER.ENRR",       # School enrollment, tertiary (% gross)
}

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

