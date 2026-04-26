"""
openbadges.py – Local Pydantic models for the Open Badges 3.0 specification.

Since the ``pyopenbadges`` package is unavailable for Python 3.13+, we
implement the core data models ourselves using Pydantic v2.  This follows
the 1EdTech Open Badges 3.0 / W3C Verifiable Credentials v2.0 schema.

Models included:
    - Profile          (Issuer)
    - Achievement      (Badge definition)
    - AchievementSubject (Credential subject – links earner to achievement)
    - OpenBadgeCredential (Top-level Verifiable Credential envelope)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Profile(BaseModel):
    """
    Represents the issuer of a badge.

    See: https://www.imsglobal.org/spec/ob/v3p0/#profile
    """

    id: str = Field(..., description="Unique URI identifying the issuer")
    type: str = Field(default="Profile", description="JSON-LD type")
    name: str = Field(..., description="Display name of the issuing organization")
    description: str | None = Field(default=None, description="Optional description")
    url: str | None = Field(default=None, description="Issuer homepage URL")
    email: str | None = Field(default=None, description="Contact email")
    image: str | None = Field(default=None, description="Issuer logo URI")


class AlignmentObject(BaseModel):
    """
    Maps an achievement to an external skill framework or standard.

    See: https://www.imsglobal.org/spec/ob/v3p0/#alignment
    """

    type: str = Field(default="Alignment")
    targetName: str = Field(..., description="Name of the alignment target")
    targetUrl: str = Field(..., description="URL of the alignment target")
    targetDescription: str | None = None
    targetFramework: str | None = Field(
        default=None, description="e.g. 'ESCO', 'O*NET'"
    )
    targetCode: str | None = None


class Criteria(BaseModel):
    """
    Describes how the achievement is earned.

    See: https://www.imsglobal.org/spec/ob/v3p0/#criteria
    """

    type: str = Field(default="Criteria")
    id: str | None = Field(default=None, description="URL to criteria page")
    narrative: str | None = Field(
        default=None, description="Free-text description of criteria"
    )


class Achievement(BaseModel):
    """
    Defines a badge / achievement that can be issued to a recipient.

    See: https://www.imsglobal.org/spec/ob/v3p0/#achievement
    """

    id: str = Field(..., description="Unique URI for this achievement definition")
    type: str = Field(default="Achievement", description="JSON-LD type")
    name: str = Field(..., description="Human-readable badge title")
    description: str | None = Field(default=None, description="Longer description")
    issuer: Profile | None = Field(default=None, description="Issuing organization")
    criteria: Criteria | None = Field(default=None, description="Earning criteria")
    alignment: list[AlignmentObject] | None = Field(
        default=None, description="Skill-framework alignments"
    )
    achievementType: str | None = Field(
        default=None, description="e.g. 'Competency', 'Assessment'"
    )
    image: str | None = Field(default=None, description="Badge image URI")
    tags: list[str] | None = Field(default=None, description="Searchable tags")


class AchievementSubject(BaseModel):
    """
    Links a specific earner to a specific achievement.

    See: https://www.imsglobal.org/spec/ob/v3p0/#achievementsubject
    """

    id: str = Field(
        ..., description="Unique identifier for the earner (e.g. DID or email URI)"
    )
    type: str = Field(default="AchievementSubject", description="JSON-LD type")
    achievement: Achievement = Field(..., description="The earned achievement")
    name: str | None = Field(default=None, description="Earner display name")


class OpenBadgeCredential(BaseModel):
    """
    Top-level Verifiable Credential envelope for an Open Badge 3.0.

    See: https://www.imsglobal.org/spec/ob/v3p0/#openbadgecredential
    """

    id: str = Field(..., description="Unique URI for this credential instance")
    type: list[str] = Field(
        default=["VerifiableCredential", "OpenBadgeCredential"],
        description="JSON-LD types",
    )
    issuer: Profile = Field(..., description="Issuing organization")
    issuanceDate: datetime = Field(..., description="When the credential was issued")
    expirationDate: datetime | None = Field(
        default=None, description="Optional expiry"
    )
    credentialSubject: AchievementSubject = Field(
        ..., description="The earner and their achievement"
    )

    # JSON-LD context (optional but spec-recommended)
    context: list[str] = Field(
        default=[
            "https://www.w3.org/2018/credentials/v1",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        ],
        alias="@context",
    )

    model_config = {"populate_by_name": True}
