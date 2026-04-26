"""
Config.py – Environment variables and application settings.

Uses pydantic-settings so every value can be overridden via a .env file
or system environment variables without touching source code.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Global application settings loaded from environment / .env file."""

    # ── Server ────────────────────────────────────────
    APP_NAME: str = "UNMAPPED Skills API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # ── NLP ───────────────────────────────────────────
    TAXONOMY_NAME: str = "esco"  # "esco", "lightcast", or "toy"

    # ── Badges Issuer Identity ────────────────────────
    ISSUER_ID: str = "https://unmapped.worldbank.org/issuers/1"
    ISSUER_NAME: str = "UNMAPPED – World Bank Youth Summit"
    ISSUER_URL: str = "https://unmapped.worldbank.org"

    # ── Risk Model ────────────────────────────────────
    RISK_MODEL_PATH: str = "local_models/RiskRegressor.pkl"
    CALIBRATED_RISK_THRESHOLD: float = 55.0

    # ── Training Data Sources ─────────────────────────
    # Relative to the ml_server root (apps/ml_server/)
    TRAINING_DATA_DIR: str = "local_models/training_data"
    SKILLS_CSV: str = "skills_en.csv"
    OCCUPATIONS_CSV: str = "occupations_en.csv"
    OCCUPATION_SKILL_RELATIONS_CSV: str = "occupationSkillRelations_en.csv"
    ILO_RISK_CSV: str = "tableA1Data.csv"
    WITTGENSTEIN_CSV: str = "wcde_data.csv"

    # ── World Bank Indicator Codes (WDI) ──────────────
    # JSON-encoded mapping of human-readable names → WDI series codes.
    # Override via .env to swap to different labor-market indicators.
    WDI_INDICATOR_MAP: str = (
        '{"broadband_penetration":"IT.NET.BBND.P2",'
        '"internet_users_pct":"IT.NET.USER.ZS",'
        '"mobile_cellular_subs":"IT.CEL.SETS.P2",'
        '"gdp_per_capita_ppp":"NY.GDP.PCAP.PP.CD",'
        '"unemployment_youth":"SL.UEM.1524.ZS",'
        '"labor_force_participation":"SL.TLF.CACT.ZS",'
        '"school_enrollment_tertiary":"SE.TER.ENRR"}'
    )

    # ── Wittgenstein Projections ───────────────────────
    WITTGENSTEIN_SKIP_ROWS: int = 8

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Return a cached singleton of the application settings."""
    return Settings()
