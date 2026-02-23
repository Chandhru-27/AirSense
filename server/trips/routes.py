from flask import Blueprint, jsonify, request
from .services import analyze_safe_route
from . import trips_bp

@trips_bp.route("/plan-safe-route", methods=["POST"])
def plan_safe_route():
    try:
        data = request.json
        
        start_lat = data.get("start_lat")
        start_lon = data.get("start_lon")
        end_lat = data.get("end_lat")
        end_lon = data.get("end_lon")
        horizon = data.get("horizon", "6h")
        health_profile = data.get("health_profile", {})
        
        if not all([start_lat, start_lon, end_lat, end_lon]):
            return jsonify({"status": "error", "message": "Missing required coordinate bounds"}), 400
            
        result = analyze_safe_route(
            start_lon=start_lon,
            start_lat=start_lat,
            end_lon=end_lon,
            end_lat=end_lat,
            horizon=horizon,
            health_profile=health_profile
        )
        
        return jsonify({"status": "success", "data": result}), 200
        
    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
