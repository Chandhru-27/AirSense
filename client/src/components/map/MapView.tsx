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
                        <div className="bg-white p-2 rounded shadow-lg border border-slate-200">
                            <p className="font-bold text-slate-800">{point.name}</p>
                            <p className="text-sm text-slate-500">Risk: <span style={{ color: point.color }}>{point.risk}</span></p>
                            <p className="text-xs text-slate-400">AQI: {point.aqi}</p>
                            <p className="text-[10px] text-slate-300 mt-1">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
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
