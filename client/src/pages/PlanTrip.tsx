import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Navigation, Compass, Search, Route as RouteIcon, Info, Loader2 } from "lucide-react";
import LocationSearch from "@/components/map/LocationSearch";
import { usePlanTrip } from "@/lib/tripsService";
import RouteMap from "@/components/map/RouteMap";

export default function PlanTrip() {
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [activeMapRouteId, setActiveMapRouteId] = useState<number | null>(null);

  const { mutate: planTrip, isPending, data, error } = usePlanTrip();

  const handleAnalyze = () => {
    if (!startPoint || !endPoint) return;
    planTrip({
      start_lat: startPoint.lat,
      start_lon: startPoint.lon,
      end_lat: endPoint.lat,
      end_lon: endPoint.lon,
      horizon: "6h",
      health_profile: {
        asthma: false, // Defaulting for now, could be dynamic later
      },
    });
    setActiveMapRouteId(null); // Reset map view on new search
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Medium":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-10" style={{ backgroundColor: "#F4F9FF" }}>
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3" style={{ color: "#2C3E50" }}>
            <Map className="size-8" style={{ color: "#5F9EC0" }} />
            Plan a Safe Trip
          </h1>
          <p className="mt-2 text-lg" style={{ color: "#5F7A94" }}>
            Evaluate air quality along your route before you travel.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Content: Search */}
          <Card className="border-0 shadow-lg rounded-xs overflow-visible">
            <div className="p-8 text-white relative overflow-hidden rounded-t-xs" style={{ background: "linear-gradient(135deg, #5F9EC0, #89B6E3)" }}>
              <div className="absolute right-0 top-0 opacity-10">
                <Compass className="size-48 -mr-12 -mt-12" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Where are you going?</h2>
                <p style={{ color: "#E0F0FF" }}>Enter your route to see a personalized air quality forecast.</p>
              </div>
            </div>
            
            <CardContent className="p-8 space-y-6 overflow-visible">
              <div className="relative">
                <LocationSearch
                  placeholder="Starting point (e.g., Guindy)"
                  onLocationSelect={(lat, lon, label) => setStartPoint({ lat, lon, label: label || "" })}
                />
              </div>

              <div className="relative flex justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: "#DCEBFA" }} />
                </div>
                <div className="relative px-4" style={{ color: "#5F7A94", backgroundColor: "white" }}>
                  <Navigation className="size-5 transform rotate-180" />
                </div>
              </div>

              <div className="relative">
                <LocationSearch
                  placeholder="Destination (e.g., T Nagar)"
                  onLocationSelect={(lat, lon, label) => setEndPoint({ lat, lon, label: label || "" })}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!startPoint || !endPoint || isPending}
                  className="flex-1 h-14 text-white rounded-xs shadow-md text-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: "#5F9EC0",
                    boxShadow: "0 4px 12px rgba(95, 158, 192, 0.3)",
                  }}
                >
                  {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                  {isPending ? "Analyzing..." : "Analyze Route"}
                </Button>
              </div>
              
              {error && <p className="text-red-500 font-medium">Failed to analyze route. Please try again.</p>}
            </CardContent>
          </Card>

          {/* Route Results */}
          {data?.data?.routes && data.data.routes.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <RouteIcon className="text-teal-500" /> Suggested Routes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.data.routes.map((route: any) => {
                  const isBest = route.route_id === data.data.best_route_id;
                  
                  return (
                    <Card
                      key={route.route_id}
                      className={`relative border-2 rounded-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                        isBest ? "border-emerald-400" : "border-slate-100"
                      }`}
                    >
                      {isBest && (
                        <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 text-center uppercase tracking-wide">
                          Safest Route
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-slate-500 font-medium">Route {route.route_id}</p>
                            <p className="text-2xl font-bold text-slate-800">{route.duration_min} min</p>
                            <p className="text-sm text-slate-500">{route.distance_km} km</p>
                          </div>
                          <span className={`px-3 py-1 rounded-xs text-xs font-bold border ${getRiskColor(route.risk)}`}>
                            {route.risk} Risk
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Exposure Score</span>
                              <span className="font-semibold text-slate-800">{route.exposure_score}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-xs overflow-hidden">
                              <div
                                className={`h-full ${route.risk === "High" ? "bg-red-400" : route.risk === "Medium" ? "bg-orange-400" : "bg-emerald-400"}`}
                                style={{ width: `${Math.min(100, (route.exposure_score / 15) * 100)}%` }} // Rough scaling
                              />
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xs border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Avg AQI Focus</p>
                            <p className="text-lg font-bold text-slate-700">{route.avg_aqi}</p>
                          </div>

                          {route.insights && route.insights.length > 0 && (
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-xs border border-blue-100 text-sm flex items-start gap-2">
                              <Info className="size-4 shrink-0 mt-0.5 text-blue-500" />
                              <ul className="list-disc pl-4 space-y-1">
                                {route.insights.map((insight: string, idx: number) => (
                                  <li key={idx} className="leading-tight text-xs">{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            className="w-full mt-2" 
                            onClick={() => setActiveMapRouteId(activeMapRouteId === route.route_id ? null : route.route_id)}
                          >
                            <MapPin className="mr-2 size-4" />
                            {activeMapRouteId === route.route_id ? "Hide Map" : "Open Map"}
                          </Button>
                        </div>
                      </CardContent>
                      
                      {activeMapRouteId === route.route_id && (
                        <div className="border-t border-slate-100 p-1 bg-slate-50">
                          <RouteMap 
                            routeGeometry={route.original_geometry}
                            startPoint={[startPoint!.lat, startPoint!.lon]}
                            endPoint={[endPoint!.lat, endPoint!.lon]}
                            isBest={isBest}
                          />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="border-0 shadow-sm rounded-xs bg-white/50 backdrop-blur-sm" style={{ borderColor: "#DCEBFA" }}>
              <CardContent className="p-12 text-center flex flex-col items-center justify-center" style={{ color: "#5F7A94" }}>
                <div className="size-20 rounded-xs flex items-center justify-center mb-4 border-4 border-white shadow-sm" style={{ backgroundColor: "#EAF4FF" }}>
                  <Map className="size-8" style={{ color: "#89B6E3" }} />
                </div>
                <h3 className="text-lg font-semibold w-full mb-1" style={{ color: "#2C3E50" }}>No active route</h3>
                <p>Enter a destination above to generate your health-aware travel plan.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
