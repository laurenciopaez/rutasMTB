import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRoutes, getRoute } from '../store/useRoutes.js';
import { useTrainings, saveTraining, deleteTraining, newTraining } from '../store/useTrainings.js';
import { useProfile } from '../store/useProfile.js';
import { computeTrainingEnergy } from '../lib/calories.js';
import { Chip, Eyebrow, TopoBg } from '../components/atoms.jsx';

const WIND_DIRS = [
  { val: 0,   label: 'N' },  { val: 45,  label: 'NE' },
  { val: 90,  label: 'E' },  { val: 135, label: 'SE' },
  { val: 180, label: 'S' },  { val: 225, label: 'SW' },
  { val: 270, label: 'W' },  { val: 315, label: 'NW' },
];

export default function Trainings() {
  const { routes } = useRoutes();
  const trainings = useTrainings();
  const profile = useProfile();
  const [form, setForm] = useState(emptyForm());

  function submit(e) {
    e.preventDefault();
    if (!form.routeId) return;
    const t = newTraining({
      routeId: form.routeId,
      date: form.date,
      partialKm: form.partialKm ? Number(form.partialKm) : null,
      durationMin: form.durationMin ? Number(form.durationMin) : null,
      windSpeedKmh: form.windSpeedKmh ? Number(form.windSpeedKmh) : null,
      windDirDeg: form.windSpeedKmh ? Number(form.windDirDeg) : null,
      extraLoadKg: form.extraLoadKg ? Number(form.extraLoadKg) : 0,
      perceivedExertion: form.rpe ? Number(form.rpe) : null,
      notes: form.notes,
    });
    saveTraining(t);
    setForm({ ...emptyForm(), routeId: form.routeId });
  }

  // Agrupar por semana (lunes)
  const weeks = useMemo(() => {
    const out = new Map();
    for (const t of trainings) {
      const d = new Date(t.date + 'T12:00:00');
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const k = monday.toISOString().slice(0, 10);
      if (!out.has(k)) out.set(k, { start: monday, items: [] });
      out.get(k).items.push(t);
    }
    // ordenar items dentro de cada semana
    for (const w of out.values()) w.items.sort((a, b) => b.date.localeCompare(a.date));
    return Array.from(out.values()).sort((a, b) => b.start - a.start);
  }, [trainings]);

  // Preview en vivo
  const selectedRoute = form.routeId ? getRoute(form.routeId) : null;
  const previewEnergy = useMemo(() => {
    if (!selectedRoute || !form.durationMin) return null;
    const totalKm = selectedRoute.stats.distance_m / 1000;
    const partialKm = form.partialKm ? Number(form.partialKm) : null;
    const ratio = partialKm && partialKm < totalKm ? partialKm / totalKm : 1;
    const fake = {
      distance_m: selectedRoute.stats.distance_m * ratio,
      gain_m: selectedRoute.stats.gain_m * ratio,
      duration_min: Number(form.durationMin),
      wind_speed_kmh: form.windSpeedKmh ? Number(form.windSpeedKmh) : 0,
      wind_dir_deg: form.windSpeedKmh ? Number(form.windDirDeg) : 0,
      extra_load_kg: form.extraLoadKg ? Number(form.extraLoadKg) : 0,
    };
    return computeTrainingEnergy(fake, selectedRoute, profile);
  }, [selectedRoute, form, profile]);

  return (
    <div className="page-inner">
      <TopoBg />
      <div style={{ position: 'relative' }}>
        <div className="page-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>03 · Registro de salidas</div>
            <div className="title">Entrenamientos<em>.</em></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              {trainings.length === 0
                ? 'Cargá tu primera salida usando una ruta importada.'
                : <>{trainings.length} {trainings.length === 1 ? 'salida registrada' : 'salidas registradas'} · {(trainings.reduce((a, t) => a + t.distance_m, 0) / 1000).toFixed(0)} km acumulados.</>}
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: 28, alignItems: 'flex-start' }}>
          {/* Form */}
          <form className="card" onSubmit={submit} style={{ padding: 22, position: 'sticky', top: 16 }}>
            <div className="eyebrow-rule"><span className="eyebrow">Cargar salida</span></div>

            <div className="field" style={{ marginBottom: 14 }}>
              <span className="lbl">Ruta</span>
              <select
                className="input"
                value={form.routeId}
                onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                required
              >
                <option value="">— elegir —</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} · {(r.stats.distance_m/1000).toFixed(0)} km</option>
                ))}
              </select>
            </div>

            <div className="row gap" style={{ marginBottom: 14 }}>
              <div className="field" style={{ flex: 1 }}>
                <span className="lbl">Fecha</span>
                <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <span className="lbl">Km parciales (opc.)</span>
                <input className="input" type="number" step="0.1" placeholder="si no la hiciste entera"
                  value={form.partialKm} onChange={(e) => setForm({ ...form, partialKm: e.target.value })} />
              </div>
            </div>

            <div className="row gap" style={{ marginBottom: 14 }}>
              <div className="field" style={{ flex: 1 }}>
                <span className="lbl">Duración (min)</span>
                <input className="input" type="number" min="1" placeholder="ej 90"
                  value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <span className="lbl">RPE 1–10</span>
                <input className="input" type="number" min="1" max="10" placeholder="esfuerzo percibido"
                  value={form.rpe} onChange={(e) => setForm({ ...form, rpe: e.target.value })} />
              </div>
            </div>

            <fieldset style={{ marginBottom: 14 }}>
              <legend>Condiciones (opc.)</legend>
              <div className="row gap" style={{ flexWrap: 'wrap' }}>
                <div className="field" style={{ flex: 1, minWidth: 90 }}>
                  <span className="lbl">Viento km/h</span>
                  <input className="input" type="number" min="0" step="1"
                    value={form.windSpeedKmh} onChange={(e) => setForm({ ...form, windSpeedKmh: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 90 }}>
                  <span className="lbl">Desde</span>
                  <select className="input" value={form.windDirDeg} onChange={(e) => setForm({ ...form, windDirDeg: e.target.value })}>
                    {WIND_DIRS.map((d) => <option key={d.val} value={d.val}>{d.label}</option>)}
                  </select>
                </div>
                <div className="field" style={{ flex: 1, minWidth: 90 }}>
                  <span className="lbl">Carga (kg)</span>
                  <input className="input" type="number" min="0" step="0.5" placeholder="alforjas..."
                    value={form.extraLoadKg} onChange={(e) => setForm({ ...form, extraLoadKg: e.target.value })} />
                </div>
              </div>
            </fieldset>

            <div className="field" style={{ marginBottom: 14 }}>
              <span className="lbl">Notas</span>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div style={{ borderTop: '1px dashed var(--rule)', paddingTop: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Estimación en vivo</div>
              {previewEnergy && previewEnergy.kcal != null ? (
                <div className="grid grid-3" style={{ gap: 10 }}>
                  <Preview label="vel. media" value={previewEnergy.avgSpeed_kmh} unit="km/h" />
                  <Preview label="potencia"   value={previewEnergy.avgPower_W} unit="W" color="var(--forest)" />
                  <Preview label="kcal"       value={previewEnergy.kcal.toLocaleString('es-AR')} color="var(--rust)" />
                </div>
              ) : (
                <div className="display-it" style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
                  Elegí ruta + duración para ver la estimación.
                </div>
              )}

              <div className="row" style={{ marginTop: 16, gap: 8, justifyContent: 'flex-end' }}>
                <button type="submit" className="primary">Guardar entrenamiento</button>
              </div>
            </div>
          </form>

          {/* Log */}
          <section>
            {trainings.length === 0 ? (
              <div className="empty">
                Sin entrenamientos cargados. Usá el formulario para registrar tu primera salida.
              </div>
            ) : (
              weeks.map(({ start, items }, idx) => {
                const sumDist = items.reduce((a, t) => a + t.distance_m, 0);
                const sumGain = items.reduce((a, t) => a + t.gain_m, 0);
                const sumMin  = items.reduce((a, t) => a + (t.duration_min || 0), 0);
                return (
                  <div key={idx} style={{ marginBottom: 28 }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                      borderBottom: '1px solid var(--rule)', paddingBottom: 8, marginBottom: 6,
                    }}>
                      <div>
                        <div className="eyebrow" style={{ fontSize: 10 }}>
                          Semana del {start.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="display" style={{ fontSize: 18, marginTop: 2 }}>
                          {items.length} {items.length === 1 ? 'salida' : 'salidas'} · {(sumDist/1000).toFixed(1)} km · +{Math.round(sumGain)} m
                        </div>
                      </div>
                      <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
                        {Math.floor(sumMin/60)}h {sumMin % 60}m
                      </div>
                    </div>
                    <div className="card" style={{ padding: '0 20px' }}>
                      {items.map((t, j) => (
                        <TrainingRow
                          key={t.id}
                          training={t}
                          profile={profile}
                          isLast={j === items.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function TrainingRow({ training, profile, isLast }) {
  const route = getRoute(training.routeId);
  const energy = useMemo(
    () => computeTrainingEnergy(training, route, profile),
    [training, route, profile]
  );
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '54px 1fr auto auto auto auto auto',
      gap: 18,
      padding: '16px 0',
      alignItems: 'center',
      borderBottom: isLast ? 'none' : '1px solid var(--rule-soft)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="display tnum" style={{ fontSize: 24, lineHeight: 1 }}>
          {new Date(training.date + 'T12:00:00').getDate()}
        </div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {new Date(training.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3)}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>
          {route ? <Link to={`/rutas/${route.id}`} style={{ color: 'inherit' }}>{route.name}</Link> : training.routeName}
        </div>
        {training.notes && (
          <div className="display-it" style={{ fontSize: 12.5, color: 'var(--ink-dim)', marginTop: 2 }}>“{training.notes}”</div>
        )}
      </div>
      <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
        <div style={{ color: 'var(--ink)', fontWeight: 600 }}>{(training.distance_m/1000).toFixed(1)}<span style={{ color: 'var(--ink-dim)', marginLeft: 3 }}>km</span></div>
        <div style={{ fontSize: 10, color: 'var(--ink-dim)' }}>+{training.gain_m}m</div>
      </div>
      <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
        <div style={{ color: 'var(--ink)', fontWeight: 600 }}>
          {training.duration_min ? `${Math.floor(training.duration_min/60)}h${(training.duration_min % 60).toString().padStart(2, '0')}` : '—'}
        </div>
        {training.duration_min && (
          <div style={{ fontSize: 10, color: 'var(--ink-dim)' }}>
            {(training.distance_m/1000 / (training.duration_min/60)).toFixed(1)} km/h
          </div>
        )}
      </div>
      <div className="mono tnum" style={{ fontSize: 12, textAlign: 'right' }}>
        {energy.avgPower_W && <div style={{ color: 'var(--forest)', fontWeight: 600 }}>{energy.avgPower_W}<span style={{ color: 'var(--ink-dim)', marginLeft: 2 }}>W</span></div>}
        {energy.kcal && <div style={{ fontSize: 10, color: 'var(--ink-dim)' }}>{energy.kcal.toLocaleString('es-AR')} kcal</div>}
      </div>
      {training.rpe
        ? <Chip tone={training.rpe >= 8 ? 'danger' : training.rpe >= 6 ? 'warn' : 'ok'}>RPE {training.rpe}</Chip>
        : <span />
      }
      <button
        className="danger btn sm"
        onClick={() => { if (confirm('¿Eliminar este entrenamiento?')) deleteTraining(training.id); }}
        title="Eliminar"
      >×</button>
    </div>
  );
}

function Preview({ label, value, unit, color }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
      <div className="display tnum" style={{ fontSize: 22, color: color || 'var(--ink)' }}>
        {value}
        {unit && <span style={{ fontSize: 10, color: 'var(--ink-dim)', fontFamily: 'var(--mono)', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

function emptyForm() {
  return {
    routeId: '',
    date: new Date().toISOString().slice(0, 10),
    partialKm: '',
    durationMin: '',
    windSpeedKmh: '',
    windDirDeg: 0,
    extraLoadKg: '',
    rpe: '',
    notes: '',
  };
}
