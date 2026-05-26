import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { bounds } from '../lib/geo.js';

function FitBounds({ pts }) {
  const map = useMap();
  useEffect(() => {
    const b = bounds(pts);
    if (b) map.fitBounds(b, { padding: [24, 24] });
  }, [pts, map]);
  return null;
}

// Mapa estilo papel: tiles atenuados, traza en oklch(--forest) con sombra,
// hitos de inicio/fin en moss/rust.
export default function RouteMap({ points, highlightIndex = null, height }) {
  const positions = useMemo(() => points.map((p) => [p.lat, p.lon]), [points]);
  const center = positions[0] || [-37.99, -57.55];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="map-container"
      style={height ? { height } : undefined}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* halo de sombra */}
      <Polyline
        positions={positions}
        pathOptions={{ color: 'oklch(0.40 0.075 145)', weight: 8, opacity: 0.20, lineCap: 'round', lineJoin: 'round' }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: 'oklch(0.520 0.130 35)', weight: 3, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
      />
      {positions.length > 0 && (
        <CircleMarker
          center={positions[0]}
          radius={6}
          pathOptions={{ color: 'oklch(0.40 0.075 145)', fillColor: 'oklch(0.56 0.080 138)', fillOpacity: 1, weight: 1.5 }}
        />
      )}
      {positions.length > 1 && (
        <CircleMarker
          center={positions[positions.length - 1]}
          radius={6}
          pathOptions={{ color: 'oklch(0.40 0.13 32)', fillColor: 'oklch(0.520 0.130 35)', fillOpacity: 1, weight: 1.5 }}
        />
      )}
      {highlightIndex != null && positions[highlightIndex] && (
        <CircleMarker
          center={positions[highlightIndex]}
          radius={7}
          pathOptions={{ color: 'oklch(0.32 0.10 65)', fillColor: 'oklch(0.690 0.120 75)', fillOpacity: 1, weight: 1.5 }}
        />
      )}
      <FitBounds pts={points} />
    </MapContainer>
  );
}
