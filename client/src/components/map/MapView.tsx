import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Tooltip as LeafletTooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

const INITIAL_CHENNAI: [number, number] = [13.0827, 80.2707]

interface HeatmapPoint {
    name: string;
    lat: number;
    lng: number;
    risk: string;
    color: string;
    aqi: number;
    // optional forecast fields (present when using useForecast)
    aqi_6h?: number;  risk_6h?: string;
    aqi_12h?: number; risk_12h?: string;
    aqi_24h?: number; risk_24h?: string;
}

interface MapViewProps {
    center?: [number, number];
    zoom?: number;
    onLocationSelect?: (lat: number, lng: number) => void;
    heatmapRequired?: boolean;
    heatmapPoints?: HeatmapPoint[];
    showUserLocation?: boolean;
}

// Controller for smoothing and centering
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), {
                duration: 1.5
            });
        }
    }, [center, zoom, map]);
    return null;
}

// Click events
function MapEvents({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

export default function MapView({
    center,
    zoom = 12,
    onLocationSelect,
    heatmapRequired = false,
    heatmapPoints = [],
    showUserLocation = false
}: MapViewProps) {
    const [mapCenter, setMapCenter] = useState<[number, number]>(center || INITIAL_CHENNAI);

    // Handle initial user location for Dashboard
    useEffect(() => {
        if (showUserLocation && !center) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
                        setMapCenter(newCenter);
                        if (onLocationSelect) onLocationSelect(newCenter[0], newCenter[1]);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        setMapCenter(INITIAL_CHENNAI);
                    }
                );
            }
        }
    }, [showUserLocation, center]);

    // Sync external center changes (e.g. from search)
    useEffect(() => {
        if (center) {
            setMapCenter(center);
        }
    }, [center]);

    return (
        <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={mapCenter} zoom={zoom} />
            <MapEvents onLocationSelect={onLocationSelect} />

            {/* Heatmap/Risk points for Dashboard */}
            {heatmapRequired && heatmapPoints.map((point, idx) => (
                <Circle
                    key={idx}
                    center={[point.lat, point.lng]}
                    radius={400}
                    pathOptions={{
                        color: point.color,
                        fillColor: point.color,
                        fillOpacity: 0.8,
                        stroke: true,
                        weight: 2
                    }}
                >
                    <LeafletTooltip>
                        <div className="bg-white p-3 rounded-xl shadow-lg border min-w-[180px]" style={{ borderColor: '#DCEBFA' }}>
                            <p className="font-bold text-sm mb-2" style={{ color: '#2C3E50' }}>{point.name}</p>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs gap-4">
                                    <span style={{ color: '#8FA6BF' }}>Now</span>
                                    <span className="font-semibold" style={{ color: point.color }}>{point.risk} · {point.aqi} µg/m³</span>
                                </div>
                                {point.aqi_6h != null && (
                                    <div className="flex justify-between items-center text-xs gap-4">
                                        <span style={{ color: '#8FA6BF' }}>+6h</span>
                                        <span className="font-semibold" style={{ color: point.color }}>{point.risk_6h} · {point.aqi_6h} µg/m³</span>
                                    </div>
                                )}
                                {point.aqi_12h != null && (
                                    <div className="flex justify-between items-center text-xs gap-4">
                                        <span style={{ color: '#8FA6BF' }}>+12h</span>
                                        <span className="font-semibold" style={{ color: point.color }}>{point.risk_12h} · {point.aqi_12h} µg/m³</span>
                                    </div>
                                )}
                                {point.aqi_24h != null && (
                                    <div className="flex justify-between items-center text-xs gap-4">
                                        <span style={{ color: '#8FA6BF' }}>+24h</span>
                                        <span className="font-semibold" style={{ color: point.color }}>{point.risk_24h} · {point.aqi_24h} µg/m³</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] mt-2" style={{ color: '#8FA6BF' }}>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                        </div>
                    </LeafletTooltip>
                </Circle>
            ))}

            {/* Selection Marker for Report Pollution or clicked location */}
            {!heatmapRequired && center && (
                <Marker position={center} icon={DefaultIcon} />
            )}

            {/* If it's a dashboard but we want a marker for user location */}
            {showUserLocation && mapCenter !== INITIAL_CHENNAI && (
                <Marker position={mapCenter} icon={DefaultIcon} />
            )}
        </MapContainer>
    )
}
