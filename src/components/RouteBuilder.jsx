import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer, TileLayer, Polyline, CircleMarker, useMapEvents, useMap,
} from 'react-leaflet';
import { uid } from '../store/storage.js';
import { saveRoute } from '../store/useRoutes.js';
import { computeRouteStats, haversine, fmtKm } from '../lib/geo.js';
import { buildPointsWithElevation } from '../lib/elevation.js';

// Tiles satelitales gratuitos (sin API key). Esri World Imagery.
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

function ClickCapture({ onClick, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

// Pequeño helper: invalida tamaño cuando el modal se abre (Leaflet a veces
// se renderiza con dimensiones 0 si el contenedor estaba oculto).
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function RouteBuilder({ onClose, onSaved }) {
  const [waypoints, setWaypoints] = useState([]); // [{ lat, lon }]
  const [name, setName] = useState('');
  const [type, setType] = useState('training');
  const [days, setDays] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // distancia rápida (línea recta entre waypoints, sin densificar)
  const distance = useMemo(() => {
    if (waypoints.length < 2) return 0;
    let d = 0;
    for (let i = 1; i < waypoints.length; i++) d += haversine(waypoints[i - 1], waypoints[i]);
    return d;
  }, [waypoints]);

  const positions = useMemo(() => waypoints.map((p) => [p.lat, p.lon]), [waypoints]);

  function addPoint(p) {
    setWaypoints((ws) => [...ws, p]);
  }
  function undo() {
    setWaypoints((ws) => ws.slice(0, -1));
  }
  function clear() {
    setWaypoints([]);
  }

  // ESC cierra
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onClose?.();
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  // Cancelar fetch en unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleSave() {
    setError(null);
    if (waypoints.length < 2) {
      setError('Marcá al menos 2 puntos en el mapa.');
      return;
    }
    if (!name.trim()) {
      setError('Poné un nombre a la ruta.');
      return;
    }
    setSaving(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const points = await buildPointsWithElevation(waypoints, { stepMeters: 60, signal: ctrl.signal });
      const stats = computeRouteStats(points);
      const route = {
        id: uid('rt'),
        name: name.trim(),
        importedAt: new Date().toISOString(),
        points,
        stats,
        notes: '',
        tags: [],
        type,
        tripMeta: type === 'trip' ? { days: Math.max(2, Number(days) || 2), extraLoadKg: 0 } : null,
      };
      saveRoute(route);
      onSaved?.(route);
      onClose?.();
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error(e);
      setError('No se pudo calcular la altimetría. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="route-builder-overlay" role="dialog" aria-modal="true">
      <div className="route-builder">
        <header className="rb-header">
          <div className="rb-header-left">
            <div className="eyebrow">Nueva ruta · constructor manual</div>
            <input
              className="input rb-name"
              placeholder="Nombre de la ruta…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={saving}
            />
          </div>
          <div className="rb-header-right">
            <div className="rb-stats">
              <div>
                <div className="mono rb-stat-label">puntos</div>
                <div className="display tnum rb-stat-value">{waypoints.length}</div>
              </div>
              <div>
                <div className="mono rb-stat-label">distancia</div>
                <div className="display tnum rb-stat-value">{fmtKm(distance)}</div>
              </div>
            </div>
            <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button
              className="btn primary"
              onClick={handleSave}
              disabled={saving || waypoints.length < 2 || !name.trim()}
            >
              {saving ? 'Calculando altimetría…' : 'Guardar ruta'}
            </button>
          </div>
        </header>

        <div className="rb-toolbar">
          <div className="rb-type-toggle">
            <button
              className={'btn sm ' + (type === 'training' ? 'primary' : '')}
              onClick={() => setType('training')}
              disabled={saving}
            >Entrenamiento</button>
            <button
              className={'btn sm ' + (type === 'trip' ? 'primary' : '')}
              onClick={() => setType('trip')}
              disabled={saving}
            >Viaje multi-día</button>
            {type === 'trip' && (
              <input
                className="input sm"
                type="number"
                min={2}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                style={{ width: 64, marginLeft: 8 }}
                title="Días"
                disabled={saving}
              />
            )}
          </div>
          <div className="spacer" />
          <button className="btn sm" onClick={undo} disabled={saving || waypoints.length === 0}>
            ↶ Deshacer
          </button>
          <button className="btn sm" onClick={clear} disabled={saving || waypoints.length === 0}>
            Limpiar
          </button>
        </div>

        <div className="rb-map">
          <MapContainer
            center={[-37.99, -57.55]}
            zoom={5}
            minZoom={2}
            worldCopyJump
            className="rb-map-container"
          >
            <InvalidateOnMount />
            <TileLayer url={SAT_URL} attribution={SAT_ATTR} maxZoom={19} />
            <ClickCapture onClick={addPoint} disabled={saving} />
            {positions.length >= 2 && (
              <>
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#000', weight: 6, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }}
                />
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#ffce4d', weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
                />
              </>
            )}
            {positions.map((pos, i) => (
              <CircleMarker
                key={i}
                center={pos}
                radius={i === 0 || i === positions.length - 1 ? 7 : 5}
                pathOptions={{
                  color: '#000',
                  weight: 1.5,
                  fillColor: i === 0 ? '#5fd35f' : i === positions.length - 1 ? '#ff5a3c' : '#ffce4d',
                  fillOpacity: 1,
                }}
              />
            ))}
          </MapContainer>

          <div className="rb-hint">
            {waypoints.length === 0
              ? 'Hacé click en el mapa para agregar el primer punto.'
              : `Click para agregar el siguiente punto · Ctrl+Z para deshacer · ESC para cerrar`}
          </div>
        </div>

        {error && <div className="rb-error">{error}</div>}
      </div>
    </div>
  );
}
