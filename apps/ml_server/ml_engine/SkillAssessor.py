"""
SkillAssessor.py - Evaluates the automation risk of individual skills and recommends adjacent skills.

Uses ESCO taxonomy mappings and ILO automation risk data.
Supports multilingual output (en/es) by loading both language variants of ESCO data.
"""

import logging
import pandas as pd
from pathlib import Path
from api.core.Config import get_settings

logger = logging.getLogger(__name__)

_settings = get_settings()
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / _settings.TRAINING_DATA_DIR

# ---------------------------------------------------------------------------
# Country → language mapping
# ---------------------------------------------------------------------------
COUNTRY_LANG_MAP: dict[str, str] = {
    "MEX": "es",
    "USA": "en",
}

def resolve_locale(country_code: str) -> str:
    """Map a supported country code to its ESCO language suffix."""
    lang = COUNTRY_LANG_MAP.get(country_code.upper())
    if not lang:
        raise ValueError(
            f"Unsupported country code '{country_code}'. "
            f"Supported: {', '.join(COUNTRY_LANG_MAP.keys())}"
        )
    return lang

# ---------------------------------------------------------------------------
# Data loading (both languages)
# ---------------------------------------------------------------------------

def _load_lang_data(lang: str):
    """Load ESCO skill/occupation data for a specific language."""
    suffix = f"_{lang}.csv"
    try:
        skills_file = _settings.SKILLS_CSV.replace("_en.csv", suffix)
        occupations_file = _settings.OCCUPATIONS_CSV.replace("_en.csv", suffix)
        relations_file = _settings.OCCUPATION_SKILL_RELATIONS_CSV.replace("_en.csv", suffix)

        df_skills = pd.read_csv(DATA_DIR / skills_file, usecols=["conceptUri", "preferredLabel", "altLabels", "skillType"])
        df_occupations = pd.read_csv(DATA_DIR / occupations_file, usecols=["conceptUri", "preferredLabel", "iscoGroup", "description"])
        df_relations = pd.read_csv(DATA_DIR / relations_file, usecols=["occupationUri", "skillUri"])

        uri_to_skill_label = dict(zip(df_skills["conceptUri"], df_skills["preferredLabel"]))
        skill_label_to_uri = dict(zip(df_skills["preferredLabel"], df_skills["conceptUri"]))
        uri_to_occ_label = dict(zip(df_occupations["conceptUri"], df_occupations["preferredLabel"]))
        uri_to_description = dict(zip(df_occupations["conceptUri"], df_occupations["description"]))
        uri_to_skill_type = dict(zip(df_skills["conceptUri"], df_skills["skillType"]))
        uri_to_isco_group = dict(zip(df_occupations["conceptUri"], df_occupations["iscoGroup"]))

        # Pre-calculate total skills per occupation for percentage calculation
        occ_total_skill_counts = df_relations.groupby("occupationUri")["skillUri"].count().to_dict()

        alt_label_to_uri = {}
        for _, row in df_skills.iterrows():
            uri = row["conceptUri"]
            alts = row["altLabels"]
            if pd.notna(alts):
                for alt in str(alts).split('\n'):
                    alt = alt.strip()
                    if alt and alt not in skill_label_to_uri:
                        alt_label_to_uri[alt] = uri

        return {
            "uri_to_skill_label": uri_to_skill_label,
            "skill_label_to_uri": skill_label_to_uri,
            "alt_label_to_uri": alt_label_to_uri,
            "uri_to_occ_label": uri_to_occ_label,
            "uri_to_description": uri_to_description,
            "uri_to_skill_type": uri_to_skill_type,
            "uri_to_isco_group": uri_to_isco_group,
            "occ_total_skill_counts": occ_total_skill_counts,
            "df_relations": df_relations,
            "df_occupations": df_occupations,
        }
    except Exception as e:
        logger.error(f"Failed to load {lang} datasets: {e}")
        return {
            "uri_to_skill_label": {},
            "skill_label_to_uri": {},
            "alt_label_to_uri": {},
            "uri_to_occ_label": {},
            "uri_to_description": {},
            "uri_to_skill_type": {},
            "uri_to_isco_group": {},
            "occ_total_skill_counts": {},
            "df_relations": pd.DataFrame(),
            "df_occupations": pd.DataFrame(),
        }


def _load_risk_data():
    """Load ILO risk data and compute per-skill risk map (language-agnostic, uses URIs)."""
    try:
        df_relations = pd.read_csv(
            DATA_DIR / _settings.OCCUPATION_SKILL_RELATIONS_CSV,
            usecols=["occupationUri", "skillUri"],
        )
        df_occupations = pd.read_csv(
            DATA_DIR / _settings.OCCUPATIONS_CSV,
            usecols=["conceptUri", "iscoGroup"],
        )
        df_ilo = pd.read_csv(
            DATA_DIR / _settings.ILO_RISK_CSV,
            usecols=["4-digit code", "Mean"],
        )
        df_ilo["Mean"] = pd.to_numeric(df_ilo["Mean"], errors="coerce")

        df_skill_occ = df_relations.merge(
            df_occupations, left_on="occupationUri", right_on="conceptUri", how="inner"
        )
        df_skill_risk = df_skill_occ.merge(
            df_ilo, left_on="iscoGroup", right_on="4-digit code", how="inner"
        )
        skill_risk_map = df_skill_risk.groupby("skillUri")["Mean"].mean().to_dict()
        return skill_risk_map
    except Exception as e:
        logger.error(f"Failed to load risk datasets: {e}")
        return {}


# ---------------------------------------------------------------------------
# Global initialization
# ---------------------------------------------------------------------------
LANG_DATA: dict[str, dict] = {
    "en": _load_lang_data("en"),
    "es": _load_lang_data("es"),
}
SKILL_RISK_MAP = _load_risk_data()

# Backwards-compatible aliases (English defaults used by NlpExtractor)
URI_TO_LABEL = LANG_DATA["en"]["uri_to_skill_label"]
LABEL_TO_URI = LANG_DATA["en"]["skill_label_to_uri"]
ALT_LABEL_TO_URI = LANG_DATA["en"]["alt_label_to_uri"]
DF_RELATIONS = LANG_DATA["en"]["df_relations"]

from ml_engine.RiskModel import predict_skill_risk

# Risk threshold from config (configurable via .env)
CALIBRATED_RISK_THRESHOLD = _settings.CALIBRATED_RISK_THRESHOLD


# ---------------------------------------------------------------------------
# Skill resolution helpers
# ---------------------------------------------------------------------------

def _resolve_skill_uri(skill_input: str, lang: str) -> str | None:
    """Resolve a skill label (in any supported language) to its concept URI."""
    data = LANG_DATA.get(lang, LANG_DATA["en"])
    uri = data["skill_label_to_uri"].get(skill_input)
    if not uri:
        uri = data["alt_label_to_uri"].get(skill_input)
    if not uri and skill_input in URI_TO_LABEL:
        uri = skill_input  # already a URI
    return uri


def _translate_skill(uri: str, target_lang: str) -> str:
    """Return the preferredLabel for a skill URI in the target language."""
    data = LANG_DATA.get(target_lang, LANG_DATA["en"])
    return data["uri_to_skill_label"].get(uri, uri)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def evaluate_skills_risk(
    indicators: dict,
    skills: list[str],
    input_lang: str = "en",
    output_lang: str = "en",
) -> tuple[list[dict], list[dict]]:
    """
    Evaluates the risk of a list of skills using country indicators for calibration.
    Accepts skill labels in the specified input language and returns labels in the output language.
    """
    at_risk = []
    durable = []

    for skill_input in skills:
        uri = _resolve_skill_uri(skill_input, input_lang)

        if not uri:
            logger.warning(f"Skill '{skill_input}' not found in ESCO taxonomy ({input_lang}).")
            continue

        raw_risk = SKILL_RISK_MAP.get(uri)
        if raw_risk is None:
            continue

        calibrated_risk = predict_skill_risk(indicators, float(raw_risk))
        label = _translate_skill(uri, output_lang)

        skill_info = {
            "skill": label,
            "risk_score": calibrated_risk,
        }

        if calibrated_risk > CALIBRATED_RISK_THRESHOLD:
            at_risk.append(skill_info)
        else:
            durable.append(skill_info)

    return at_risk, durable


def recommend_adjacent_skills(
    indicators: dict,
    durable_skills: list[dict],
    output_lang: str = "en",
    top_n: int = 5,
) -> list[dict]:
    """
    Recommends resilient adjacent skills based on the user's durable skills.
    Uses ESCO occupation-skill relations to find co-occurring skills with low automation risk.
    Returns labels in the specified output language.
    """
    if DF_RELATIONS.empty or not durable_skills:
        return []

    # Get URIs of the user's durable skills (try both languages to find the URI)
    user_durable_uris = []
    for skill_info in durable_skills:
        label = skill_info.get("skill")
        # The label is already in output_lang from evaluate_skills_risk
        uri = LANG_DATA.get(output_lang, LANG_DATA["en"])["skill_label_to_uri"].get(label)
        if not uri:
            uri = LABEL_TO_URI.get(label)
        if uri:
            user_durable_uris.append(uri)

    if not user_durable_uris:
        return []

    # Find occupations that require these durable skills
    related_occs = DF_RELATIONS[DF_RELATIONS["skillUri"].isin(user_durable_uris)]["occupationUri"].unique()

    # Find all other skills associated with these occupations
    adjacent_skills = DF_RELATIONS[DF_RELATIONS["occupationUri"].isin(related_occs)]["skillUri"].unique()

    candidates = []
    data_lang = LANG_DATA.get(output_lang, LANG_DATA["en"])
    uri_to_skill_type = data_lang["uri_to_skill_type"]
    uri_to_isco_group = data_lang["uri_to_isco_group"]
    
    for skill_uri in adjacent_skills:
        if skill_uri in user_durable_uris:
            continue

        raw_risk = SKILL_RISK_MAP.get(skill_uri)
        if raw_risk is not None:
            calibrated_risk = predict_skill_risk(indicators, float(raw_risk))
            if calibrated_risk <= CALIBRATED_RISK_THRESHOLD:
                label = _translate_skill(skill_uri, output_lang)
                if label:
                    skill_type = uri_to_skill_type.get(skill_uri, "")
                    opportunity_type = "Formal Employment"
                    
                    if skill_type == "knowledge":
                        opportunity_type = "Training"
                    else:
                        occ_uris = DF_RELATIONS[DF_RELATIONS["skillUri"] == skill_uri]["occupationUri"].tolist()
                        isco_prefixes = []
                        for o_uri in occ_uris:
                            isco_val = uri_to_isco_group.get(o_uri)
                            if pd.notna(isco_val):
                                isco_prefixes.append(str(isco_val)[0])
                        
                        if isco_prefixes:
                            from collections import Counter
                            most_common_prefix = Counter(isco_prefixes).most_common(1)[0][0]
                            if most_common_prefix in ("1", "2", "3", "4", "8"):
                                opportunity_type = "Formal Employment"
                            elif most_common_prefix in ("5", "6", "7"):
                                opportunity_type = "Self-Employment"
                            elif most_common_prefix == "9":
                                opportunity_type = "Gig"

                    candidates.append({
                        "skill": label,
                        "risk_score": calibrated_risk,
                        "opportunity_type": opportunity_type,
                    })

    # Sort candidates by risk score ascending (lowest risk first)
    candidates.sort(key=lambda x: x["risk_score"])

    # Return top N unique candidates
    seen = set()
    unique_candidates = []
    for c in candidates:
        if c["skill"] not in seen:
            seen.add(c["skill"])
            unique_candidates.append(c)
            if len(unique_candidates) >= top_n:
                break

    return unique_candidates


def match_occupations(
    skills: list[str],
    lang: str = "en",
    top_n: int = 10,
) -> list[dict]:
    """
    Given a list of skill labels, find the occupations that best match.
    Ranks occupations by how many of the provided skills they require.
    Returns occupation labels in the specified language.
    """
    data = LANG_DATA.get(lang, LANG_DATA["en"])
    df_relations = data["df_relations"]
    uri_to_occ_label = data["uri_to_occ_label"]
    uri_to_description = data["uri_to_description"]
    occ_total_skill_counts = data["occ_total_skill_counts"]
    uri_to_skill_label = data["uri_to_skill_label"]

    if df_relations.empty:
        return []

    # Resolve each skill input to a URI
    skill_uris = set()
    for skill_input in skills:
        uri = _resolve_skill_uri(skill_input, lang)
        if uri:
            skill_uris.add(uri)

    if not skill_uris:
        return []

    # Find all occupations that require at least one of these skills
    matched_relations = df_relations[df_relations["skillUri"].isin(skill_uris)]

    # Group by occupationUri to get the list of matching skill URIs for each occupation
    occ_matches = matched_relations.groupby("occupationUri")["skillUri"].apply(list).reset_index()
    occ_matches["matched_count"] = occ_matches["skillUri"].apply(len)
    
    # Sort and take top N
    occ_matches = occ_matches.sort_values("matched_count", ascending=False).head(top_n)

    results = []
    for _, row in occ_matches.iterrows():
        occ_uri = row["occupationUri"]
        matched_skill_uris = row["skillUri"]
        
        label = uri_to_occ_label.get(occ_uri, occ_uri)
        description = uri_to_description.get(occ_uri, "")
        total_skills_count = occ_total_skill_counts.get(occ_uri, 1) # Avoid div by zero
        
        matching_percentage = (len(matched_skill_uris) / total_skills_count) * 100
        
        # Translate matching skill URIs to labels
        matching_skill_labels = [uri_to_skill_label.get(s_uri, s_uri) for s_uri in matched_skill_uris]

        results.append({
            "occupation": label,
            "occupation_uri": occ_uri,
            "matching_skills": matching_skill_labels,
            "description": description,
            "matching_percentage": round(float(matching_percentage), 2),
        })

    return results

