import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { getRoute, updateRouteMeta } from '../store/useRoutes.js';
import { useProfile } from '../store/useProfile.js';
import { useTrainings } from '../store/useTrainings.js';
import { computeFitness } from '../lib/fitness.js';
import { routeEffort, difficultyLabel, capacityFromLevel } from '../lib/difficulty.js';
import RouteMap from '../components/RouteMap.jsx';
import ElevationProfile from '../components/ElevationProfile.jsx';
import { fmtKm, fmtM } from '../lib/geo.js';

export default function RouteDetail() {
  const { id } = useParams();
  const profile = useProfile();
  const trainings = useTrainings();
  // Re-render on save: usar key triggered por timestamp.
  const [tick, setTick] = useState(0);
  const route = useMemo(() => getRoute(id), [id, tick]);
  const [hover, setHover] = useState(null);
  const [editingMeta, setEditingMeta] = useState(false);

  const fitness = useMemo(() => computeFitness(trainings, profile), [trainings, profile]);
  const capacity = capacityFromLevel(fitness.level);
  const effortInfo = useMemo(() => route ? routeEffort(route, { body_kg: profile.weightKg }) : null, [route, profile]);
  const difficulty = effortInfo ? difficultyLabel(effortInfo.effort, capacity) : null;

  if (!route) {
    return (
      <div>
        <Link to="/rutas">← Volver</Link>
        <div className="empty" style={{ marginTop: 20 }}>Ruta no encontrada.</div>
      </div>
    );
  }

  const s = route.stats;
  const isTrip = route.type === 'trip';

  return (
    <>
      <div className="toolbar">
        <Link to="/rutas">← Rutas</Link>
        <h2 style={{ margin: 0, marginLeft: 12 }}>{route.name}</h2>
        <span className={`badge ${isTrip ? 'warn' : ''}`} style={{ marginLeft: 12 }}>
          {isTrip ? `viaje multi-día (${route.tripMeta?.days || 2}d)` : 'entrenamiento'}
        </span>
        <div className="spacer" />
        <button onClick={() => setEditingMeta(true)}>Editar tipo / multi-día</button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><div className="label">Distancia</div><div className="value">{fmtKm(s.distance_m)}</div></div>
        <div className="card stat"><div className="label">Desnivel +</div><div className="value">+{fmtM(s.gain_m)}</div></div>
        <div className="card stat"><div className="label">Desnivel −</div><div className="value">−{fmtM(s.loss_m)}</div></div>
        <div className="card stat">
          <div className="label">Dificultad</div>
          <div className="value">
            <span className={`badge ${difficulty?.tone}`} style={{ fontSize: 16, padding: '4px 10px' }}>
              {difficulty?.label || '—'}
            </span>
          </div>
          <div className="sub">
            effort {effortInfo?.effort?.toFixed(0)} · capacidad {capacity.toFixed(0)} (nivel {fitness.level})
            {isTrip && ` · ${effortInfo?.effort_per_day?.toFixed(0)}/día`}
          </div>
        </div>
      </div>

      <RouteMap points={route.points} highlightIndex={hover} />
      <ElevationProfile points={route.points} cumDist={s.cumDist} onHover={setHover} />

      {editingMeta && (
        <TripMetaForm
          route={route}
          onClose={() => setEditingMeta(false)}
          onSaved={() => { setEditingMeta(false); setTick(tick + 1); }}
        />
      )}
    </>
  );
}

function TripMetaForm({ route, onClose, onSaved }) {
  const [type, setType] = useState(route.type || 'training');
  const [days, setDays] = useState(route.tripMeta?.days || 2);
  const [extraLoadKg, setExtraLoadKg] = useState(route.tripMeta?.extraLoadKg || 0);

  function submit(e) {
    e.preventDefault();
    const patch = { type };
    if (type === 'trip') patch.tripMeta = { days: Number(days), extraLoadKg: Number(extraLoadKg) };
    else patch.tripMeta = null;
    updateRouteMeta(route.id, patch);
    onSaved?.();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ maxWidth: 520 }}>
        <h3 style={{ marginTop: 0 }}>Tipo de ruta</h3>
        <label>
          <div className="lbl">Tipo</div>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="training">Entrenamiento (un día, sin carga)</option>
            <option value="trip">Viaje multi-día (con carga adicional)</option>
          </select>
        </label>
        {type === 'trip' && (
          <div className="row gap">
            <label style={{ flex: 1 }}>
              <div className="lbl">Días</div>
              <input type="number" min="2" max="30" value={days} onChange={(e) => setDays(e.target.value)} />
            </label>
            <label style={{ flex: 1 }}>
              <div className="lbl">Carga extra (kg)</div>
              <input type="number" min="0" step="0.5" value={extraLoadKg} onChange={(e) => setExtraLoadKg(e.target.value)} placeholder="alforjas, ropa, comida..." />
            </label>
          </div>
        )}
        <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>
          💡 La distancia y desnivel totales se reparten uniformemente entre los días. La dificultad se recalcula
          considerando la fatiga acumulada y la carga.
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary">Guardar</button>
        </div>
      </form>
    </div>
  );
}
