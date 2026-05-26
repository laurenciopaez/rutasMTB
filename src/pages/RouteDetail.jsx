import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { getRoute, updateRouteMeta, deleteRoute } from '../store/useRoutes.js';
import { useProfile } from '../store/useProfile.js';
import { useTrainings } from '../store/useTrainings.js';
import { computeFitness } from '../lib/fitness.js';
import { routeEffort, difficultyLabel, capacityFromLevel } from '../lib/difficulty.js';
import RouteMap from '../components/RouteMap.jsx';
import ElevationProfile from '../components/ElevationProfile.jsx';
import {
  Chip, Tag, ProgressBar, StatCard, SectionHead, TopoBg,
} from '../components/atoms.jsx';
import { useNavigate } from 'react-router-dom';

export default function RouteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = useProfile();
  const trainings = useTrainings();
  const [tick, setTick] = useState(0);
  const route = useMemo(() => getRoute(id), [id, tick]);
  const [hover, setHover] = useState(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const fitness = useMemo(() => computeFitness(trainings, profile), [trainings, profile]);
  const capacity = capacityFromLevel(fitness.level);
  const effortInfo = useMemo(() => (route ? routeEffort(route, { body_kg: profile.weightKg }) : null), [route, profile]);
  const difficulty = effortInfo ? difficultyLabel(effortInfo.effort, capacity) : null;

  if (!route) {
    return (
      <div className="page-inner">
        <Link to="/rutas" className="btn ghost sm">← Rutas</Link>
        <div className="empty" style={{ marginTop: 20 }}>Ruta no encontrada.</div>
      </div>
    );
  }

  const s = route.stats;
  const isTrip = route.type === 'trip';
  const onRouteTrainings = trainings
    .filter((t) => t.routeId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-inner">
      <TopoBg />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link to="/rutas" className="btn ghost sm">← Rutas</Link>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>
            RUTA · {route.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="page-header" style={{ alignItems: 'flex-start', marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip tone={isTrip ? 'warn' : 'ok'}>
                {isTrip ? `viaje multi-día · ${route.tripMeta?.days || 2}d` : 'entrenamiento'}
              </Chip>
              {route.favorite && <Chip tone="solid">♥ favorita</Chip>}
              {route.region && <Tag>{route.region}</Tag>}
            </div>
            <div className="title" style={{ fontSize: 36 }}>{route.name}<em>.</em></div>
            {route.notes && (
              <div className="muted" style={{ marginTop: 8, fontSize: 13, maxWidth: 600 }}>{route.notes}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn sm"
              onClick={() => updateRouteMeta(route.id, { favorite: !route.favorite })}
              title={route.favorite ? 'Quitar favorita' : 'Marcar favorita'}
              style={{ color: route.favorite ? 'var(--rust)' : undefined }}
            >♥</button>
            <button className="btn" onClick={() => setEditingNotes(true)}>Editar metadata</button>
            <button className="btn" onClick={() => setEditingMeta(true)}>Tipo / multi-día</button>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 22 }}>
          <StatCard label="Distancia"  value={(s.distance_m/1000).toFixed(1)} unit="km" corner="01" sub={isTrip ? `${((s.distance_m/1000)/(route.tripMeta?.days || 1)).toFixed(1)} km/día` : null} />
          <StatCard label="Desnivel +" value={`+${Math.round(s.gain_m).toLocaleString('es-AR')}`} unit="m" corner="02" sub={s.distance_m ? `${(s.gain_m / (s.distance_m/1000)).toFixed(0)} m/km` : null} />
          <StatCard label="Desnivel −" value={`−${Math.round(s.loss_m).toLocaleString('es-AR')}`} unit="m" corner="03" />
          <div className="card stat">
            <div className="card-corner">04</div>
            <div className="label">Dificultad estimada</div>
            <div style={{ marginTop: 6 }}>
              <Chip tone={difficulty?.tone} style={{ fontSize: 13, padding: '5px 12px' }} dot>{difficulty?.label || '—'}</Chip>
            </div>
            <div className="sub" style={{ marginTop: 10 }}>
              esfuerzo <b className="mono tnum" style={{ color: 'var(--ink)' }}>{effortInfo?.effort.toFixed(0)}</b>
              {' · '}capacidad <b className="mono tnum" style={{ color: 'var(--ink)' }}>{capacity.toFixed(0)}</b>
              {isTrip && <> · <b className="mono tnum" style={{ color: 'var(--ink)' }}>{effortInfo?.effort_per_day?.toFixed(0)}</b>/día</>}
            </div>
            <div style={{ marginTop: 10 }}>
              <ProgressBar value={Math.min(100, (difficulty?.ratio || 0) * 50)} tone={difficulty?.tone || 'ok'} />
            </div>
          </div>
        </div>

        <RouteMap points={route.points} highlightIndex={hover} height={420} />
        <ElevationProfile points={route.points} cumDist={s.cumDist} onHover={setHover} />

        {isTrip && (
          <div className="card flat" style={{ marginTop: 22, padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Plan multi-día · bikepacking</div>
            <div className="display" style={{ fontSize: 22, marginBottom: 14 }}>
              {route.tripMeta.days} días · {route.tripMeta.extraLoadKg || 0} kg de carga extra
            </div>
            <div className="grid grid-4">
              {Array.from({ length: route.tripMeta.days }).map((_, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>Día {i + 1}</div>
                  <div className="display tnum" style={{ fontSize: 22, marginTop: 4 }}>
                    {((s.distance_m / 1000) / route.tripMeta.days).toFixed(0)} km
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 4, letterSpacing: '0.04em' }}>
                    +{(s.gain_m / route.tripMeta.days).toFixed(0)} m · fatiga ×{(1 + 0.05 * i).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onRouteTrainings.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <SectionHead
              kicker={`Hiciste esta ruta ${onRouteTrainings.length} ${onRouteTrainings.length === 1 ? 'vez' : 'veces'}`}
              title="Histórico"
            />
            <div className="card" style={{ padding: '0 20px' }}>
              {onRouteTrainings.map((t, i) => (
                <div key={t.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr auto auto auto',
                  gap: 16,
                  padding: '14px 0',
                  alignItems: 'center',
                  borderBottom: i === onRouteTrainings.length - 1 ? 'none' : '1px solid var(--rule-soft)',
                }}>
                  <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>
                    {new Date(t.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div>
                    <div className="mono tnum" style={{ fontSize: 12 }}>{(t.distance_m/1000).toFixed(1)} km · +{t.gain_m} m</div>
                    {t.notes && <div className="display-it" style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2 }}>“{t.notes}”</div>}
                  </div>
                  <div className="mono tnum" style={{ fontSize: 12, textAlign: 'right' }}>
                    {t.duration_min ? `${Math.floor(t.duration_min/60)}h ${t.duration_min % 60}m` : '—'}
                  </div>
                  <div className="mono tnum" style={{ fontSize: 12, textAlign: 'right' }}>
                    {t.duration_min ? `${(t.distance_m/1000 / (t.duration_min/60)).toFixed(1)} km/h` : ''}
                  </div>
                  {t.rpe && <Chip tone={t.rpe >= 8 ? 'danger' : t.rpe >= 6 ? 'warn' : 'ok'}>RPE {t.rpe}</Chip>}
                  {!t.rpe && <span />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px dashed var(--rule)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="danger btn sm"
            onClick={() => {
              if (confirm(`¿Eliminar "${route.name}" y todo su rastro?`)) {
                deleteRoute(route.id);
                navigate('/rutas');
              }
            }}
          >Eliminar ruta</button>
        </div>

        {editingMeta && (
          <TripMetaForm
            route={route}
            onClose={() => setEditingMeta(false)}
            onSaved={() => { setEditingMeta(false); setTick(tick + 1); }}
          />
        )}
        {editingNotes && (
          <NotesForm
            route={route}
            onClose={() => setEditingNotes(false)}
            onSaved={() => { setEditingNotes(false); setTick(tick + 1); }}
          />
        )}
      </div>
    </div>
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
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Tipo de ruta</h3>
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
        <div className="display-it" style={{ color: 'var(--ink-dim)', fontSize: 12 }}>
          La distancia y desnivel totales se reparten uniformemente entre los días. La dificultad se recalcula
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

function NotesForm({ route, onClose, onSaved }) {
  const [name, setName] = useState(route.name);
  const [region, setRegion] = useState(route.region || '');
  const [notes, setNotes] = useState(route.notes || '');

  function submit(e) {
    e.preventDefault();
    updateRouteMeta(route.id, { name: name.trim() || route.name, region: region.trim() || null, notes });
    onSaved?.();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Editar metadata</h3>
        <label>
          <div className="lbl">Nombre</div>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <div className="lbl">Región (opc.)</div>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Tandil, Sierra de la Ventana, ..." />
        </label>
        <label>
          <div className="lbl">Notas</div>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary">Guardar</button>
        </div>
      </form>
    </div>
  );
}
