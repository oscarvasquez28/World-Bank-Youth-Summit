import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor

# Add the current directory to sys.path so we can import ml_engine
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml_engine.Econometrics import INDICATOR_MAP, fetch_country_indicators, get_feature_names

def main():
    csv_path = os.path.join(
        os.path.dirname(__file__), "local_models", "training_data", "tableA1Data.csv"
    )
    if not os.path.exists(csv_path):
        print(f"Error: Could not find dataset at {csv_path}")
        return

    print("Loading ILO exposure data...")
    
    exposure_scores = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if i == 0 or not line.strip():
                continue
            parts = line.strip().split(',')
            # The second to last column is the Mean score.
            if len(parts) >= 5:
                try:
                    mean_val = float(parts[-2])
                    exposure_scores.append(mean_val)
                except ValueError:
                    pass
    exposure_scores = np.array(exposure_scores)
    
    # Select a diverse set of LMIC and HIC countries for the background
    countries = [
        "KEN", "PHL", "COL", "IND", "ZAF", "NGA", "USA", "DEU", 
        "GBR", "VNM", "MEX", "BRA", "ARG", "CHL", "PER", "EGY", 
        "ZMB", "UGA", "RWA"
    ]
    
    print(f"Fetching WBG indicators for {len(countries)} countries...")
    
    X_train = []
    y_train = []
    
    for country in countries:
        try:
            indicators = fetch_country_indicators(country)
            
            wbg_features = []
            for name in INDICATOR_MAP.keys():
                wbg_features.append(float(indicators.get(name) or 0.0))
                
            # Heuristic infrastructure factor (range approx 0-1)
            # broadband_penetration maxes around 40-50 per 100 in decent LMICs/HICs
            broadband = float(indicators.get("broadband_penetration") or 0.0)
            internet = float(indicators.get("internet_users_pct") or 0.0)
            
            infra_factor = ((broadband / 40.0) + (internet / 100.0)) / 2.0
            infra_factor = max(0.0, min(1.0, infra_factor))
            
            # Create a sample for each occupation
            for exposure in exposure_scores:
                feat = list(wbg_features)
                feat.append(exposure)
                
                # Synthetic Risk Formulation:
                # Risk = ILO_Exposure * 100 * (0.3 + 0.7 * infra_factor)
                # Meaning risk relies on exposure, scaled by digital readiness.
                risk = exposure * 100.0 * (0.3 + 0.7 * infra_factor)
                
                # Add a little noise
                risk += np.random.normal(0, 2.0)
                risk = max(0.0, min(100.0, risk))
                
                X_train.append(feat)
                y_train.append(risk)
                
        except Exception as e:
            print(f"Failed to fetch data for {country}: {e}")

    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    print(f"Dataset created: {X_train.shape[0]} samples with {X_train.shape[1]} features.")
    print("Features:", get_feature_names())
    
    print("Training GradientBoostingRegressor...")
    model = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_train, y_train)
    print(f"Training R^2 Score: {score:.4f}")
    
    model_path = os.path.join(
        os.path.dirname(__file__), "local_models", "RiskRegressor.pkl"
    )
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
        
    print(f"Model successfully saved to {model_path}!")

if __name__ == "__main__":
    main()
