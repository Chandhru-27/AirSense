import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface RouteMapProps {
  routeGeometry: [number, number][]; // [lon, lat] array from GeoJSON
  startPoint: [number, number]; // [lat, lon]
  endPoint: [number, number]; // [lat, lon]
  isBest?: boolean;
}

function MapUpdater({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export default function RouteMap({ routeGeometry, startPoint, endPoint, isBest = false }: RouteMapProps) {
  // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
  const positions: [number, number][] = routeGeometry.map((coord) => [coord[1], coord[0]]);
  
  const bounds = L.latLngBounds([startPoint, endPoint]);

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border shadow-sm">
      <MapContainer
        bounds={bounds}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater bounds={bounds} />

        <Marker position={startPoint}>
          <Popup>Start Point</Popup>
        </Marker>
        <Marker position={endPoint}>
          <Popup>Destination</Popup>
        </Marker>

        {positions.length > 0 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: isBest ? "#10b981" : "#3b82f6",
              weight: isBest ? 6 : 4,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
