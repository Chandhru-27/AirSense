"""
AirSense — XGBoost AQI Forecasting Pipeline
Trains three separate regressors for +6h, +12h, +24h AQI prediction.
"""

import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")

DATA_PATH = Path(__file__).parent / "air_quality_data_rows.csv"

MODEL_PARAMS = dict(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=1,
)

FEATURE_COLS: list[str] = []  
HORIZONS = {
    "6h":  6,
    "12h": 12,
    "24h": 24,
}


# 1. Data Loading & Preprocessing 

def load_and_preprocess(path: str) -> pd.DataFrame:
    """Load CSV, sort globally by timestamp, and engineer features."""
    df = pd.read_csv(path)

    required = {"lat", "lon", "pm25", "no2", "o3",
                "temperature", "humidity", "wind_speed", "wind_direction", "timestamp"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(
            f"CSV is missing expected columns: {sorted(missing)}\n"
            f"Found: {sorted(df.columns)}"
        )

    print(f"[data]  Raw rows loaded      : {len(df):,}")

    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df = df.dropna(subset=["timestamp"])

    df = df.sort_values("timestamp").reset_index(drop=True)

    # Time features 
    df["hour"]        = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek

    # Global lag features on pm25 
    df["pm25_lag1"] = df["pm25"].shift(1)
    df["pm25_lag3"] = df["pm25"].shift(3)
    df["pm25_lag6"] = df["pm25"].shift(6)

    # Global rolling means 
    df["pm25_roll3"] = df["pm25"].shift(1).rolling(3, min_periods=1).mean()
    df["pm25_roll6"] = df["pm25"].shift(1).rolling(6, min_periods=1).mean()

    # Normalise wind direction
    wd_rad = np.deg2rad(df["wind_direction"].fillna(0))
    df["wind_sin"] = np.sin(wd_rad)
    df["wind_cos"] = np.cos(wd_rad)

    # Drop rows with NaN in core input columns 
    before = len(df)
    df = df.dropna(
        subset=[
            "pm25", "no2", "o3",
            "temperature", "humidity", "wind_speed",
            "pm25_lag1", "pm25_lag3", "pm25_lag6",
            "pm25_roll3", "pm25_roll6",
        ]
    ).reset_index(drop=True)
    print(f"[data]  After lag dropna      : {len(df):,}  (dropped {before - len(df)})")

    if len(df) == 0:
        raise ValueError(
            "DataFrame is empty after lag dropna. "
            "The dataset may have too few rows or all-NaN columns."
        )

    return df


def build_feature_list() -> list[str]:
    return [
        "lat", "lon",
        "pm25", "no2", "o3",
        "temperature", "humidity", "wind_speed",
        "wind_sin", "wind_cos",
        "pm25_lag1", "pm25_lag3", "pm25_lag6",
        "pm25_roll3", "pm25_roll6",
        "hour", "day_of_week",
    ]


# 2. Target Engineering 

def add_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Add global shifted AQI target columns and report row counts."""

    for label, shift in HORIZONS.items():
        df[f"aqi_{label}"] = df["pm25"].shift(-shift)

    before = len(df)
    target_cols = [f"aqi_{h}" for h in HORIZONS]
    df = df.dropna(subset=target_cols).reset_index(drop=True)
    print(f"[data]  After target dropna   : {len(df):,}  (dropped {before - len(df)} tail rows)")

    if len(df) < 10:
        raise ValueError(
            f"Only {len(df)} usable training rows remain after target shifting. "
            "The dataset needs more rows (at minimum ~50 to train meaningfully)."
        )

    return df


# 3. Model Training & Evaluation ─

def _rmse(y_true, y_pred) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def train_model(
    df: pd.DataFrame,
    feature_cols: list[str],
    target_col: str,
    horizon_label: str,
) -> XGBRegressor:
    """Train and evaluate one XGBRegressor; return the fitted model."""
    X = df[feature_cols].values
    y = df[target_col].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=True
    )

    model = XGBRegressor(**MODEL_PARAMS)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    rmse = _rmse(y_test, y_pred)
    mae  = float(mean_absolute_error(y_test, y_pred))

    print(f"[{horizon_label:>3}]  RMSE={rmse:.4f}  MAE={mae:.4f}")
    return model, {"RMSE": rmse, "MAE": mae}


def train_all_models(df: pd.DataFrame, feature_cols: list[str]) -> dict[str, XGBRegressor]:
    """Train one model per forecast horizon and return them in a dict."""
    models: dict[str, XGBRegressor] = {}
    metrics: dict[str, dict] = {}

    print("── Training XGBoost AQI Forecast Models ──")
    for label in HORIZONS:
        model, model_metrics = train_model(df, feature_cols, f"aqi_{label}", label)
        models[label] = model
        metrics[label] = model_metrics
    print("── Training complete ──\n")
    
    metrics_path = Path(__file__).parent / "performance_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved → {metrics_path}")

    return models


# 4. Risk Classification 

def classify_risk(aqi: float) -> str:
    """Map a continuous AQI value to a categorical risk level."""
    if aqi <= 50:
        return "Low"
    elif aqi <= 150:
        return "Medium"
    return "High"


# 5. Prediction Function 

def predict_future_risk(
    lat: float,
    lon: float,
    latest_row: dict,
    models: dict[str, XGBRegressor],
    feature_cols: list[str],
) -> dict:
    """
    Return structured AQI forecast for a single location.

    Parameters
    ----------
    lat         : target latitude
    lon         : target longitude
    latest_row  : dict of the most-recent observed feature values for this location
    models      : trained model dict keyed by horizon label  ("6h", "12h", "24h")
    feature_cols: ordered list of feature names used during training

    Returns
    -------
    dict with keys: lat, lon, aqi_6h, risk_6h, aqi_12h, risk_12h, aqi_24h, risk_24h
    """
    row = {**latest_row, "latitude": lat, "longitude": lon}
    X = np.array([[row.get(c, 0.0) for c in feature_cols]])

    output: dict = {"lat": lat, "lon": lon}
    for label, model in models.items():
        aqi_val = float(np.clip(model.predict(X)[0], 0, None))
        output[f"aqi_{label}"]  = round(aqi_val, 2)
        output[f"risk_{label}"] = classify_risk(aqi_val)

    return output


# 6. Model Persistence 

def save_models(models: dict[str, XGBRegressor], prefix: str = "aqi_model") -> None:
    """Persist each model to disk with joblib."""
    for label, model in models.items():
        path = f"{prefix}_{label}.joblib"
        joblib.dump(model, path)
        print(f"Saved → {path}")


def load_models(prefix: str = "aqi_model") -> dict[str, XGBRegressor]:
    """Load all three models from disk."""
    return {label: joblib.load(f"{prefix}_{label}.joblib") for label in HORIZONS}


# 7. Feature Importance Plot 

def plot_feature_importance(
    models: dict[str, XGBRegressor],
    feature_cols: list[str],
    top_n: int = 15,
) -> None:
    """Side-by-side bar charts of feature importance for all three horizons."""
    fig, axes = plt.subplots(1, len(models), figsize=(6 * len(models), 6))
    fig.suptitle("XGBoost Feature Importances — AQI Forecast", fontsize=14, y=1.02)

    for ax, (label, model) in zip(axes, models.items()):
        importance = pd.Series(
            model.feature_importances_, index=feature_cols
        ).nlargest(top_n).sort_values()

        importance.plot(kind="barh", ax=ax, color="#89B6E3")
        ax.set_title(f"+{label} horizon")
        ax.set_xlabel("Gain")
        ax.tick_params(labelsize=9)

    plt.tight_layout()
    plt.savefig("feature_importance.png", dpi=150, bbox_inches="tight")
    plt.close()
    print("Feature importance chart saved → feature_importance.png")


# Main

def main() -> None:
    # Load & preprocess
    df = load_and_preprocess(DATA_PATH)

    # Add forecast targets
    df = add_targets(df)

    # Define features
    feature_cols = build_feature_list()

    # Train
    models = train_all_models(df, feature_cols)

    # Persist
    save_models(models)

    # Feature importance chart
    plot_feature_importance(models, feature_cols)

    # Example prediction — using the last observed row in the dataset
    sample = df.iloc[-1]
    lat = float(sample["lat"])
    lon = float(sample["lon"])
    latest_row = sample[feature_cols].to_dict()

    predictions = predict_future_risk(lat, lon, latest_row, models, feature_cols)
    print("\n── Example Prediction ──")
    print(json.dumps([predictions], indent=2))


if __name__ == "__main__":
    main()
