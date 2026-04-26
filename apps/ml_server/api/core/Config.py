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

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Return a cached singleton of the application settings."""
    return Settings()
