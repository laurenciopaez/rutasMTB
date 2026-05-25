import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { bounds } from '../lib/geo.js';

// Workaround: leaflet espera assets en /images, en bundlers fallan los íconos por default.
// Como no usamos Marker, no hace falta arreglarlos.

function FitBounds({ pts }) {
  const map = useMap();
  useEffect(() => {
    const b = bounds(pts);
    if (b) map.fitBounds(b, { padding: [24, 24] });
  }, [pts, map]);
  return null;
}

export default function RouteMap({ points, highlightIndex = null }) {
  const positions = useMemo(() => points.map((p) => [p.lat, p.lon]), [points]);
  const center = positions[0] || [-37.99, -57.55]; // Mar del Plata por default
  return (
    <MapContainer center={center} zoom={13} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} pathOptions={{ color: '#4ade80', weight: 4, opacity: 0.9 }} />
      {positions.length > 0 && (
        <CircleMarker center={positions[0]} radius={6} pathOptions={{ color: '#16a34a', fillColor: '#4ade80', fillOpacity: 1 }} />
      )}
      {positions.length > 1 && (
        <CircleMarker center={positions[positions.length - 1]} radius={6} pathOptions={{ color: '#7f1d1d', fillColor: '#ef4444', fillOpacity: 1 }} />
      )}
      {highlightIndex != null && positions[highlightIndex] && (
        <CircleMarker center={positions[highlightIndex]} radius={7} pathOptions={{ color: '#fef08a', fillColor: '#facc15', fillOpacity: 1 }} />
      )}
      <FitBounds pts={points} />
    </MapContainer>
  );
}
