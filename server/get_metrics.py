import json
import warnings
from pathlib import Path
import pandas as pd
import joblib
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from ML.aqi_forecast import load_and_preprocess, add_targets, build_feature_list, HORIZONS, _rmse
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

def evaluate_existing_models():
    data_path = Path("ML/air_quality_data_rows.csv")
    df = load_and_preprocess(data_path)
    df = add_targets(df)
    feature_cols = build_feature_list()
    
    metrics = {}
    
    for label in HORIZONS:
        model_path = Path(f"aqi_model_{label}.joblib")
        if not model_path.exists():
            print(f"Model not found: {model_path}")
            continue
            
        model = joblib.load(model_path)
        
        target_col = f"aqi_{label}"
        X = df[feature_cols].values
        y = df[target_col].values
        
        # Must match the split in aqi_forecast.py exactly to eval on test set
        _, X_test, _, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=True
        )
        
        y_pred = model.predict(X_test)
        rmse = _rmse(y_test, y_pred)
        mae = float(mean_absolute_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        
        metrics[label] = {
            "RMSE": round(rmse, 4),
            "MAE": round(mae, 4), 
            "R2_Score": round(r2, 4)
        }
        print(f"[{label:>3}] Evaluated: RMSE={rmse:.4f}, MAE={mae:.4f}, R2={r2:.4f}")
        
    out_path = Path("performance_metrics.json")
    with open(out_path, "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"\nExported metrics to {out_path.absolute()}")

if __name__ == "__main__":
    evaluate_existing_models()
