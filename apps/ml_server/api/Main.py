"""
Main.py – FastAPI application entrypoint.

Initializes the application, registers all endpoint routers, and triggers
the global loading of heavy ML models at startup.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.core.Config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: pre-load expensive models before the server accepts requests
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Heavy models are loaded eagerly at import time (see NlpExtractor.py and
    RiskModel.py).  We import them here inside the lifespan so the loading
    happens exactly once during startup and any import-time errors surface
    immediately.
    """
    logger.info("Starting UNMAPPED ML server …")

    # These imports trigger the global singletons to load.
    from ml_engine import NlpExtractor as _nlp  # noqa: F401
    from ml_engine import RiskModel as _risk  # noqa: F401

    logger.info("All models loaded – server is ready.")
    yield
    logger.info("Shutting down UNMAPPED ML server.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

_settings = get_settings()

app = FastAPI(
    title=_settings.APP_NAME,
    version=_settings.APP_VERSION,
    description=(
        "UNMAPPED Skills Protocol – Extracts skills from informal text, "
        "calibrates automation risk with explainable AI, and issues "
        "Open Badges 3.0 verifiable credentials."
    ),
    lifespan=lifespan,
)

# CORS – allow the frontend dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------
from api.endpoints.SkillsApi import router as skills_router  # noqa: E402
from api.endpoints.RiskApi import router as risk_router  # noqa: E402
from api.endpoints.BadgesApi import router as badges_router  # noqa: E402

app.include_router(skills_router)
app.include_router(risk_router)
app.include_router(badges_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Meta"])
async def health():
    """Simple liveness probe."""
    return {"status": "ok", "version": _settings.APP_VERSION}
