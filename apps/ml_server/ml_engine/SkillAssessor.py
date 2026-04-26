"""
SkillAssessor.py - Evaluates the automation risk of individual skills and recommends adjacent skills.

Uses ESCO taxonomy mappings and ILO automation risk data.
"""

import logging
import pandas as pd
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "local_models" / "training_data"

def _load_data():
    try:
        # 1. Load skill relations
        df_relations = pd.read_csv(DATA_DIR / "occupationSkillRelations_en.csv", usecols=["occupationUri", "skillUri"])
        
        # 2. Load occupations
        df_occupations = pd.read_csv(DATA_DIR / "occupations_en.csv", usecols=["conceptUri", "iscoGroup"])
        
        # 3. Load ILO risk
        df_ilo = pd.read_csv(DATA_DIR / "tableA1Data.csv", usecols=["4-digit code", "Mean"])
        df_ilo["Mean"] = pd.to_numeric(df_ilo["Mean"], errors="coerce")
        
        # 4. Load Skills
        df_skills = pd.read_csv(DATA_DIR / "skills_en.csv", usecols=["conceptUri", "preferredLabel", "altLabels"])
        
        # Calculate average risk per skill
        # Merge relations with occupations to get iscoGroup for each skill
        df_skill_occ = df_relations.merge(
            df_occupations, left_on="occupationUri", right_on="conceptUri", how="inner"
        )
        
        # Merge with ILO risk
        df_skill_risk = df_skill_occ.merge(
            df_ilo, left_on="iscoGroup", right_on="4-digit code", how="inner"
        )
        
        # Group by skillUri and calculate average risk
        skill_risk_map = df_skill_risk.groupby("skillUri")["Mean"].mean().to_dict()
        
        # Maps for quick lookups
        uri_to_label = dict(zip(df_skills["conceptUri"], df_skills["preferredLabel"]))
        label_to_uri = dict(zip(df_skills["preferredLabel"], df_skills["conceptUri"]))
        
        alt_label_to_uri = {}
        for idx, row in df_skills.iterrows():
            uri = row["conceptUri"]
            alts = row["altLabels"]
            if pd.notna(alts):
                for alt in str(alts).split('\n'):
                    alt = alt.strip()
                    if alt and alt not in label_to_uri:
                        alt_label_to_uri[alt] = uri
        
        return skill_risk_map, uri_to_label, label_to_uri, alt_label_to_uri, df_relations
        
    except Exception as e:
        logger.error(f"Failed to load datasets: {e}")
        return {}, {}, {}, {}, pd.DataFrame()

# Global initialization
SKILL_RISK_MAP, URI_TO_LABEL, LABEL_TO_URI, ALT_LABEL_TO_URI, DF_RELATIONS = _load_data()

from ml_engine.RiskModel import predict_skill_risk

# Risk threshold based on calibrated 0-100 scale (e.g. 55)
CALIBRATED_RISK_THRESHOLD = 55.0

def evaluate_skills_risk(indicators: dict, skills: list[str]) -> tuple[list[dict], list[dict]]:
    """
    Evaluates the risk of a list of skills using country indicators for calibration.
    Accepts a list of skill labels or URIs.
    """
    at_risk = []
    durable = []
    
    for skill_input in skills:
        # Determine if input is URI or label
        if skill_input in URI_TO_LABEL:
            uri = skill_input
            label = URI_TO_LABEL[uri]
        else:
            uri = LABEL_TO_URI.get(skill_input)
            if not uri:
                uri = ALT_LABEL_TO_URI.get(skill_input)
            label = skill_input
            
        if not uri:
            logger.warning(f"Skill '{skill_input}' not found in ESCO taxonomy (preferred or alt).")
            continue
            
        raw_risk = SKILL_RISK_MAP.get(uri)
        if raw_risk is None:
            continue
            
        calibrated_risk = predict_skill_risk(indicators, float(raw_risk))
            
        skill_info = {
            "skill": label,
            "risk_score": calibrated_risk
        }
        
        if calibrated_risk > CALIBRATED_RISK_THRESHOLD:
            at_risk.append(skill_info)
        else:
            durable.append(skill_info)
            
    return at_risk, durable

def recommend_adjacent_skills(indicators: dict, durable_skills: list[dict], top_n: int = 5) -> list[dict]:
    """
    Recommends resilient adjacent skills based on the user's durable skills.
    Uses ESCO occupation-skill relations to find co-occurring skills with low automation risk.
    """
    if DF_RELATIONS.empty or not durable_skills:
        return []
        
    # Get URIs of the user's durable skills
    user_durable_uris = []
    for skill_info in durable_skills:
        label = skill_info.get("skill")
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
    for skill_uri in adjacent_skills:
        if skill_uri in user_durable_uris:
            continue
            
        raw_risk = SKILL_RISK_MAP.get(skill_uri)
        if raw_risk is not None:
            calibrated_risk = predict_skill_risk(indicators, float(raw_risk))
            if calibrated_risk <= CALIBRATED_RISK_THRESHOLD:
                label = URI_TO_LABEL.get(skill_uri)
                if label:
                    candidates.append({
                        "skill": label,
                        "risk_score": calibrated_risk
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
