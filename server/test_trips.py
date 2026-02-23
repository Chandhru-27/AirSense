import requests
import json

url = "http://localhost:5000/api/trips/plan-safe-route"
payload = {
    "start_lat": 13.0827,
    "start_lon": 80.2707,
    "end_lat": 12.9716,
    "end_lon": 80.0435, # Example coordinates from Chennai to somewhere in Tamil Nadu
    "horizon": "6h",
    "health_profile": {
        "asthma": True,
        "elderly": False,
        "child": False
    }
}
headers = {'Content-Type': 'application/json'}

print(f"Sending request to {url}")
response = requests.post(url, data=json.dumps(payload), headers=headers)

if response.status_code == 200:
    data = response.json().get('data', {})
    print("Best Route ID:", data.get('best_route_id'))
    print("Total Routes:", len(data.get('routes', [])))
    if data.get('routes'):
        print("\nBest Route Summary:")
        best = data['routes'][0]
        for k, v in best.items():
            if k != 'original_geometry':
                print(f"  {k}: {v}")
else:
    print(f"Error {response.status_code}: {response.text}")
