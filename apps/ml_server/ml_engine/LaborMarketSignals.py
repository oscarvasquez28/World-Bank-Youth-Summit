"""
LaborMarketSignals.py – Calculates real labor market signals for occupations.
"""

from typing import Any

def calculate_occupation_signals(isco_code: str, indicators: dict[str, Any]) -> dict[str, float | None]:
    """
    Returns econometric signals (growth, wage proxy) for a given ISCO code 
    and country-level indicators.
    """
    if not isco_code:
        return {"sector_growth": None, "wage_signal": None}

    major_group = str(isco_code)[0]
    
    # 1. Sectoral Growth Signal
    # Heuristic mapping of ISCO Major Groups to WDI Sectoral Growth
    if major_group in ("1", "2", "3", "4", "5"):
        growth = indicators.get("services_growth")
    elif major_group in ("6", "7", "8"):
        growth = indicators.get("industry_growth")
    else:
        growth = indicators.get("gdp_growth")
        
    # 2. Wage Signal (Monthly Proxy)
    # Using GDP per capita (PPP) / 12 as a baseline labor signal for the user
    gdp_pc = indicators.get("gdp_per_capita_ppp")
    wage_proxy = (gdp_pc / 12.0) if gdp_pc else None
    
    # Adjust wage proxy slightly based on ISCO level (higher for managers/professionals)
    if wage_proxy and major_group in ("1", "2"):
        wage_proxy *= 1.5
    elif wage_proxy and major_group == "9":
        wage_proxy *= 0.7
        
    return {
        "sector_growth": round(growth, 2) if growth is not None else None,
        "wage_signal": round(wage_proxy, 2) if wage_proxy is not None else None
    }
