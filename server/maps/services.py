"""DB service functions for the air_quality_data table."""

from db.db_setup import get_db_connection


# All columns in air_quality_data, in schema order
AIR_QUALITY_COLUMNS = [
    "id",
    "node_id",
    "timestamp",
    "lat",
    "lon",
    "pm25",
    "no2",
    "o3",
    "wind_speed",
    "wind_direction",
    "temperature",
    "humidity",
    "traffic_density",
    "traffic_current_speed",
    "traffic_free_flow_speed",
    "traffic_confidence",
    "risk_score",
    "risk_level",
]



def _row_to_dict(row: tuple) -> dict:
    """Map a raw psycopg2 row tuple to a labelled dict using the column order."""
    return dict(zip(AIR_QUALITY_COLUMNS, row))


def get_all_air_quality_data() -> list[dict]:
    """Fetch every row from air_quality_data and return as a list of dicts."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT
                    id, node_id, timestamp,
                    lat, lon,
                    pm25, no2, o3,
                    wind_speed, wind_direction,
                    temperature, humidity,
                    traffic_density, traffic_current_speed,
                    traffic_free_flow_speed, traffic_confidence,
                    risk_score, risk_level
                FROM air_quality_data
                ORDER BY timestamp DESC;
                """
            )
            rows = cur.fetchall()
            return [_row_to_dict(row) for row in rows]
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()


def get_air_quality_by_node(node_id: int) -> list[dict]:
    """Fetch all readings for a specific sensor node, newest first."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT
                    id, node_id, timestamp,
                    lat, lon,
                    pm25, no2, o3,
                    wind_speed, wind_direction,
                    temperature, humidity,
                    traffic_density, traffic_current_speed,
                    traffic_free_flow_speed, traffic_confidence,
                    risk_score, risk_level
                FROM air_quality_data
                WHERE node_id = %s
                ORDER BY timestamp DESC;
                """,
                (node_id,),
            )
            rows = cur.fetchall()
            return [_row_to_dict(row) for row in rows]
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()


def get_latest_per_node() -> list[dict]:
    """Return the single most-recent reading for every node (useful for map pins)."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT DISTINCT ON (node_id)
                    id, node_id, timestamp,
                    lat, lon,
                    pm25, no2, o3,
                    wind_speed, wind_direction,
                    temperature, humidity,
                    traffic_density, traffic_current_speed,
                    traffic_free_flow_speed, traffic_confidence,
                    risk_score, risk_level
                FROM air_quality_data
                ORDER BY node_id, timestamp DESC;
                """
            )
            rows = cur.fetchall()
            return [_row_to_dict(row) for row in rows]
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()


def get_nearest_air_quality(lat: float, lon: float) -> dict | None:
    """
    Return the single most-recent reading from the sensor node that is
    geographically closest to the supplied lat / lon coordinates.

    Distance is computed using a simple Euclidean approximation directly
    in PostgreSQL — sufficient for the scale of a city dashboard.
    """
    with get_db_connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                SELECT DISTINCT ON (node_id)
                    id, node_id, timestamp,
                    lat, lon,
                    pm25, no2, o3,
                    wind_speed, wind_direction,
                    temperature, humidity,
                    traffic_density, traffic_current_speed,
                    traffic_free_flow_speed, traffic_confidence,
                    risk_score, risk_level,
                    SQRT(POWER(lat - %s, 2) + POWER(lon - %s, 2)) AS distance
                FROM air_quality_data
                ORDER BY node_id, timestamp DESC
                """,
                (lat, lon),
            )
            rows = cur.fetchall()
            if not rows:
                return None

            # Pick the node with the smallest Euclidean distance.
            # The SELECT returns 18 data columns (indices 0-17) + distance at index 18.
            best = min(rows, key=lambda r: r[18])
            # Slice off the appended distance before mapping to dict.
            return _row_to_dict(best[:18])
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()


def get_forecast_for_all_nodes() -> list[dict]:
    """
    Load trained XGBoost models from disk, fetch the latest reading for every
    sensor node, and return AQI predictions for +6h, +12h, +24h alongside the
    current AQI risk level.

    Returns a list of dicts ready to be serialised to JSON:
      { node_id, lat, lon, risk_score, risk_level,
        aqi_6h, risk_6h, aqi_12h, risk_12h, aqi_24h, risk_24h }
    """
    import math
    from pathlib import Path

    try:
        import joblib
        import numpy as np
    except ImportError:
        raise RuntimeError("joblib and numpy are required. Run: pip install joblib numpy")

    MODEL_DIR = Path(__file__).parent.parent / "ML"
    HORIZONS = ["6h", "12h", "24h"]

    # ── Load models (fail gracefully if not trained yet) ──────────────────────
    models = {}
    for h in HORIZONS:
        model_path = MODEL_DIR / f"aqi_model_{h}.joblib"
        if model_path.exists():
            models[h] = joblib.load(str(model_path))

    FEATURE_COLS = [
        "lat", "lon",
        "pm25", "no2", "o3",
        "temperature", "humidity", "wind_speed",
        "wind_sin", "wind_cos",
        "pm25_lag1", "pm25_lag3", "pm25_lag6",
        "pm25_roll3", "pm25_roll6",
        "hour", "day_of_week",
    ]

    def classify_risk(aqi: float) -> str:
        if aqi <= 50:
            return "Low"
        elif aqi <= 150:
            return "Medium"
        return "High"

    def risk_color(level: str) -> str:
        return {"Low": "#10b981", "Medium": "#f97316", "High": "#ef4444"}.get(level, "#94a3b8")

    # ── Fetch latest data per node ────────────────────────────────────────────
    nodes = get_latest_per_node()

    results = []
    for node in nodes:
        lat = node.get("lat") or 0.0
        lon = node.get("lon") or 0.0
        pm25 = node.get("pm25") or 0.0
        no2 = node.get("no2") or 0.0
        o3 = node.get("o3") or 0.0
        wind_speed = node.get("wind_speed") or 0.0
        wind_dir = node.get("wind_direction") or 0.0
        temperature = node.get("temperature") or 0.0
        humidity = node.get("humidity") or 0.0

        # Derive engineered features from the single latest row
        wd_rad = math.radians(wind_dir)
        feature_row = {
            "lat": lat, "lon": lon,
            "pm25": pm25, "no2": no2, "o3": o3,
            "temperature": temperature, "humidity": humidity, "wind_speed": wind_speed,
            "wind_sin": math.sin(wd_rad), "wind_cos": math.cos(wd_rad),
            # Lag features unavailable from a single row — use current pm25 as proxy
            "pm25_lag1": pm25, "pm25_lag3": pm25, "pm25_lag6": pm25,
            "pm25_roll3": pm25, "pm25_roll6": pm25,
            "hour": 0, "day_of_week": 0,
        }

        X = np.array([[feature_row.get(c, 0.0) for c in FEATURE_COLS]])

        current_risk = node.get("risk_level") or classify_risk(pm25)
        out = {
            "node_id": node.get("node_id"),
            "lat": lat,
            "lon": lon,
            "aqi_now": round(pm25, 1),
            "risk_now": current_risk,
            "color_now": risk_color(current_risk),
        }

        for h, model in models.items():
            aqi_pred = float(max(0, model.predict(X)[0]))
            risk = classify_risk(aqi_pred)
            out[f"aqi_{h}"] = round(aqi_pred, 1)
            out[f"risk_{h}"] = risk
            out[f"color_{h}"] = risk_color(risk)

        # If models aren't trained yet, fill with current values
        for h in HORIZONS:
            if f"aqi_{h}" not in out:
                out[f"aqi_{h}"] = out["aqi_now"]
                out[f"risk_{h}"] = current_risk
                out[f"color_{h}"] = risk_color(current_risk)

        results.append(out)

    return results
