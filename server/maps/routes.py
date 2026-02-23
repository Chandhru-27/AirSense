"""Blueprint routes for the maps / air-quality endpoints."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from .services import (
    get_all_air_quality_data,
    get_air_quality_by_node,
    get_latest_per_node,
    get_nearest_air_quality,
    get_forecast_for_all_nodes,
)

maps_bp = Blueprint("maps", __name__, url_prefix="/api/maps")


def _serialize(records: list[dict]) -> list[dict]:
    """Convert non-JSON-serialisable types (UUID, datetime) to strings."""
    import uuid
    from datetime import datetime

    serialized = []
    for record in records:
        row = {}
        for key, value in record.items():
            if isinstance(value, uuid.UUID):
                row[key] = str(value)
            elif isinstance(value, datetime):
                row[key] = value.isoformat()
            else:
                row[key] = value
        serialized.append(row)
    return serialized


@maps_bp.route("/air-quality", methods=["GET"])
@jwt_required()
def get_all_air_quality():
    """
    GET /api/maps/air-quality
    Returns every row in air_quality_data as JSON, ordered by timestamp DESC.
    """
    try:
        data = get_all_air_quality_data()
        return jsonify({"status": "success", "count": len(data), "data": _serialize(data)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@maps_bp.route("/air-quality/node/<int:node_id>", methods=["GET"])
@jwt_required()
def get_air_quality_node(node_id: int):
    """
    GET /api/maps/air-quality/node/<node_id>
    Returns all readings for a specific sensor node, newest first.
    """
    try:
        data = get_air_quality_by_node(node_id)
        if not data:
            return jsonify({"status": "error", "message": f"No data found for node {node_id}"}), 404
        return jsonify({"status": "success", "node_id": node_id, "count": len(data), "data": _serialize(data)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@maps_bp.route("/air-quality/latest", methods=["GET"])
@jwt_required()
def get_latest_air_quality():
    """
    GET /api/maps/air-quality/latest
    Returns the most-recent reading for every node — one pin per sensor on the map.
    """
    try:
        data = get_latest_per_node()
        return jsonify({"status": "success", "count": len(data), "data": _serialize(data)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@maps_bp.route("/air-quality/nearest", methods=["GET"])
@jwt_required()
def get_nearest():
    """
    GET /api/maps/air-quality/nearest?lat=<float>&lon=<float>
    Returns the full air_quality_data row from the sensor node closest to
    the supplied coordinates. Used by the dashboard pollutant chart.
    """
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)

        if lat is None or lon is None:
            return jsonify({"status": "error", "message": "lat and lon query parameters are required"}), 400

        result = get_nearest_air_quality(lat, lon)

        if result is None:
            return jsonify({"status": "error", "message": "No air quality data found"}), 404

        return jsonify({"status": "success", "data": _serialize([result])[0]}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@maps_bp.route("/forecast", methods=["GET"])
@jwt_required()
def get_forecast():
    """
    GET /api/maps/forecast
    Returns current AQI + ML-predicted AQI/risk for +6h, +12h, +24h
    for every sensor node — used to drive the heatmap forecast toggle.
    """
    try:
        data = get_forecast_for_all_nodes()
        return jsonify({"status": "success", "count": len(data), "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
