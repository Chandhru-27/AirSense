import requests
from typing import Dict, Any, List
import math
from maps.services import get_forecast_for_all_nodes

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"

def get_osrm_routes(start_lon: float, start_lat: float, end_lon: float, end_lat: float) -> List[Dict[str, Any]]:
    """
    Fetch up to 3 alternate routes from OSRM.
    Returns geometries as GeoJSON.
    """
    url = f"{OSRM_BASE_URL}/{start_lon},{start_lat};{end_lon},{end_lat}"
    params = {
        "alternatives": "true",
        "overview": "full",
        "geometries": "geojson"
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    if data.get("code") != "Ok":
        raise ValueError(f"OSRM Error: {data.get('message', 'Unknown error')}")
        
    return data.get("routes", [])

def _haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate distance between two points in meters"""
    R = 6371000 # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c

def sample_route_points(coordinates: List[List[float]], interval_meters: float = 500) -> List[Dict[str, float]]:
    """
    Given a list of [lon, lat] coordinates (from GeoJSON LineString),
    interpolate and return sampled points roughly every `interval_meters`.
    """
    sampled_points = []
    if not coordinates:
        return sampled_points
        
    # Always include start point
    sampled_points.append({"lon": coordinates[0][0], "lat": coordinates[0][1]})
    
    accumulated_dist = 0.0
    
    for i in range(len(coordinates) - 1):
        p1 = coordinates[i]
        p2 = coordinates[i+1]
        
        segment_dist = _haversine(p1[0], p1[1], p2[0], p2[1])
        
        # How many points to place here?
        # A simple approach is just keeping track of accumulated distance
        accumulated_dist += segment_dist
        
        if accumulated_dist >= interval_meters:
            # Drop a point roughly at p2. 
            # (Note: simpler than perfect linear interpolation for the sake of speed / readability)
            sampled_points.append({"lon": p2[0], "lat": p2[1]})
            accumulated_dist = 0.0
            
    # Always include end point
    end_pt = {"lon": coordinates[-1][0], "lat": coordinates[-1][1]}
    sampled_points.append(end_pt)
        
    return sampled_points
    
def calculate_bearing(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate forward azimuth (bearing) between two points in degrees."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dLon = lon2 - lon1
    
    y = math.sin(dLon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon)
    
    brng = math.atan2(y, x)
    brng = math.degrees(brng)
    return (brng + 360) % 360

def _get_health_weight(modifiers: Dict[str, bool]) -> float:
    weight = 1.0
    if modifiers.get("asthma"): weight = max(weight, 1.5)
    elif modifiers.get("child"): weight = max(weight, 1.4)
    elif modifiers.get("elderly"): weight = max(weight, 1.3)
    return weight

def _get_wind_adjustment(route_bearing: float, wind_direction: float) -> float:
    """
    If wind aligns with route direction -> increase exposure.
    If wind opposes route direction -> reduce exposure.
    Diff goes from 0 (aligned) to 180 (opposing).
    """
    diff = abs((route_bearing - wind_direction + 180) % 360 - 180)
    # 0 diff   -> tailwind (follows you) -> exposure multiplier > 1 (e.g. 1.2)
    # 180 diff -> headwind (blows past you) -> exposure multiplier < 1 (e.g. 0.8)
    
    # Simple linear scaling: 0 diff = 1.2x, 180 diff = 0.8x
    return 1.2 - (diff / 180.0) * 0.4

def analyze_safe_route(start_lon: float, start_lat: float, end_lon: float, end_lat: float, horizon: str, health_profile: Dict[str, bool]) -> Dict[str, Any]:
    """
    Main orchestrator for route planning.
    """
    # 1. Fetch routes from OSRM
    osrm_routes = get_osrm_routes(start_lon, start_lat, end_lon, end_lat)
    
    # 2. Pre-fetch AQI/forecast for ALL nodes to avoid N+1 queries
    all_nodes_data = get_forecast_for_all_nodes()
    
    # Select the correct AQI key based on horizon
    aqi_key = f"aqi_{horizon}" if horizon in ["6h", "12h", "24h"] else "aqi_now"
        
    health_weight = _get_health_weight(health_profile)
    
    analyzed_routes = []
    
    for idx, r in enumerate(osrm_routes):
        geometry = r.get("geometry", {}).get("coordinates", [])
        distance_meters = r.get("distance", 0)
        duration_seconds = r.get("duration", 0)
        
        # 3. Sample points
        # Every ~500m
        sampled = sample_route_points(geometry, interval_meters=500)
        
        total_exposure = 0.0
        total_aqi = 0.0
        
        insights = []
        high_aqi_detected = False
        bad_wind_detected = False
        
        # 4. Score each point
        for i in range(len(sampled) - 1):
            p1 = sampled[i]
            p2 = sampled[i+1]
            
            segment_length = _haversine(p1["lon"], p1["lat"], p2["lon"], p2["lat"])
            bearing = calculate_bearing(p1["lon"], p1["lat"], p2["lon"], p2["lat"])
            
            # Find nearest sensor node for p1
            # Simple euclidean since it's local city scale
            best_node = None
            min_dist = float('inf')
            
            for node in all_nodes_data:
                dist = _haversine(p1["lon"], p1["lat"], node["lon"], node["lat"])
                if dist < min_dist:
                    min_dist = dist
                    best_node = node
            
            if not best_node: continue
            
            # Extract point info
            aqi_val = best_node.get(aqi_key, best_node.get("aqi_now", 0))
            
            # The node data currently returned by get_forecast_for_all_nodes only returns AQI, risk and color.
            # So wind direction mapping will just be a fallback to 0 unless we attach wind to it.
            # Let's attach wind in the query or use 0 as fallback.
            wind_dir = best_node.get("wind_direction", 0.0) # Assume 0 if not present for now
            
            wind_adj = _get_wind_adjustment(bearing, wind_dir)
            
            # Exposure calculation
            # segment_length is in meters. / 1000 for km to keep numbers sane.
            segment_exposure = aqi_val * (segment_length / 1000.0) * wind_adj * health_weight
            
            total_exposure += segment_exposure
            total_aqi += aqi_val
            
            # Insight Triggers
            if aqi_val > 150 and not high_aqi_detected:
                insights.append(f"High PM2.5 cluster near {round(p1['lat'],4)}, {round(p1['lon'],4)}.")
                high_aqi_detected = True
                
            if wind_adj > 1.15 and not bad_wind_detected:
                insights.append("Wind predominantly aligned with travel direction (increases exposure).")
                bad_wind_detected = True
                
        # Post-process route stats
        num_segments = max(1, len(sampled) - 1)
        avg_aqi = total_aqi / num_segments
        
        # Normalize exposure (score per km)
        distance_km = max(0.1, distance_meters / 1000.0)
        normalized_exposure = total_exposure / distance_km
        
        risk_level = "Low"
        if avg_aqi > 150: risk_level = "High"
        elif avg_aqi > 50: risk_level = "Medium"
        
        analyzed_routes.append({
            "route_id": idx + 1,
            "distance_km": round(distance_km, 2),
            "duration_min": round(duration_seconds / 60.0, 1),
            "avg_aqi": round(avg_aqi, 1),
            "exposure_score": round(normalized_exposure, 2), # Using this for ranking
            "risk": risk_level,
            "insights": insights,
            "original_geometry": geometry
        })
        
    # 5. Ranking Logic
    # Final Score = (0.5 * normalized_exposure) + (0.3 * duration) + (0.2 * risk_weight)
    
    # We need to normalize duration and exposure across routes to combine them meaningfully.
    max_exposure = max([r["exposure_score"] for r in analyzed_routes] + [0.1])
    max_duration = max([r["duration_min"] for r in analyzed_routes] + [0.1])
    
    def get_risk_weight(r_level):
        return {"Low": 1, "Medium": 2, "High": 3}.get(r_level, 1)
        
    for r in analyzed_routes:
        norm_exp = r["exposure_score"] / max_exposure
        norm_dur = r["duration_min"] / max_duration
        risk_w = get_risk_weight(r["risk"]) / 3.0 # max risk is 3
        
        r["ranking_score"] = (0.5 * norm_exp) + (0.3 * norm_dur) + (0.2 * risk_w)
        
    # Sort: lowest score = best (least exposure + least time)
    analyzed_routes.sort(key=lambda x: x["ranking_score"])
    
    best_route_id = analyzed_routes[0]["route_id"] if analyzed_routes else None
    
    return {
        "best_route_id": best_route_id,
        "routes": analyzed_routes
    }
