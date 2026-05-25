import { useState, useMemo } from 'react';
import { useRoutes, getRoute } from '../store/useRoutes.js';
import { useTrainings, saveTraining, deleteTraining, newTraining } from '../store/useTrainings.js';
import { useProfile } from '../store/useProfile.js';
import { computeTrainingEnergy } from '../lib/calories.js';
import { fmtKm, fmtM } from '../lib/geo.js';

const WIND_DIRS = [
  { val: 0,   label: 'N' },
  { val: 45,  label: 'NE' },
  { val: 90,  label: 'E' },
  { val: 135, label: 'SE' },
  { val: 180, label: 'S' },
  { val: 225, label: 'SW' },
  { val: 270, label: 'W' },
  { val: 315, label: 'NW' },
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

  return (
    <>
      <h2>Entrenamientos</h2>

      <form className="card" onSubmit={submit} style={{ marginBottom: 24, display: 'grid', gap: 12 }}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label style={{ minWidth: 240 }}>
            <div className="lbl">Ruta</div>
            <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} required>
              <option value="">— elegir —</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({fmtKm(r.stats.distance_m)})</option>
              ))}
            </select>
          </label>
          <label>
            <div className="lbl">Fecha</div>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            <div className="lbl">Duración (min)</div>
            <input type="number" min="1" placeholder="ej 90" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
          </label>
          <label>
            <div className="lbl">Km parciales (opc.)</div>
            <input type="number" step="0.1" placeholder="si no la hiciste entera" value={form.partialKm} onChange={(e) => setForm({ ...form, partialKm: e.target.value })} />
          </label>
        </div>

        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <legend style={{ color: 'var(--text-dim)', fontSize: 12 }}>Condiciones (opcionales — mejoran cálculo de calorías)</legend>
          <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
            <label>
              <div className="lbl">Viento (km/h)</div>
              <input type="number" min="0" step="1" value={form.windSpeedKmh} onChange={(e) => setForm({ ...form, windSpeedKmh: e.target.value })} style={{ width: 110 }} />
            </label>
            <label>
              <div className="lbl">Viento (dirección desde)</div>
              <select value={form.windDirDeg} onChange={(e) => setForm({ ...form, windDirDeg: e.target.value })} style={{ width: 120 }}>
                {WIND_DIRS.map((d) => <option key={d.val} value={d.val}>{d.label}</option>)}
              </select>
            </label>
            <label>
              <div className="lbl">Carga extra (kg)</div>
              <input type="number" min="0" step="0.5" placeholder="alforjas, ropa..." value={form.extraLoadKg} onChange={(e) => setForm({ ...form, extraLoadKg: e.target.value })} style={{ width: 130 }} />
            </label>
            <label>
              <div className="lbl">RPE (1-10)</div>
              <input type="number" min="1" max="10" placeholder="esfuerzo percibido" value={form.rpe} onChange={(e) => setForm({ ...form, rpe: e.target.value })} style={{ width: 100 }} />
            </label>
          </div>
        </fieldset>

        <label>
          <div className="lbl">Notas</div>
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%' }} />
        </label>

        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <button className="primary" type="submit">Guardar entrenamiento</button>
          <PreviewCalories form={form} profile={profile} />
        </div>
      </form>

      {trainings.length === 0 ? (
        <div className="empty">Sin entrenamientos cargados.</div>
      ) : (
        <div className="route-list">
          {trainings.slice().sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
            <TrainingRow key={t.id} training={t} profile={profile} />
          ))}
        </div>
      )}
    </>
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

function PreviewCalories({ form, profile }) {
  if (!form.routeId || !form.durationMin) return null;
  const route = getRoute(form.routeId);
  if (!route) return null;
  const totalKm = route.stats.distance_m / 1000;
  const partialKm = form.partialKm ? Number(form.partialKm) : null;
  const ratio = partialKm && partialKm < totalKm ? partialKm / totalKm : 1;
  const fakeTraining = {
    distance_m: route.stats.distance_m * ratio,
    gain_m: route.stats.gain_m * ratio,
    duration_min: Number(form.durationMin),
    wind_speed_kmh: form.windSpeedKmh ? Number(form.windSpeedKmh) : 0,
    wind_dir_deg: form.windSpeedKmh ? Number(form.windDirDeg) : 0,
    extra_load_kg: form.extraLoadKg ? Number(form.extraLoadKg) : 0,
  };
  const e = computeTrainingEnergy(fakeTraining, route, profile);
  if (!e.kcal) return null;
  return (
    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
      ≈ {e.kcal} kcal · {e.avgSpeed_kmh} km/h prom · {e.avgPower_W} W
    </span>
  );
}

function TrainingRow({ training, profile }) {
  const route = getRoute(training.routeId);
  const energy = useMemo(() => computeTrainingEnergy(training, route, profile), [training, route, profile]);

  return (
    <div className="route-row" style={{ gridTemplateColumns: '1fr auto auto auto auto auto' }}>
      <div>
        <div className="name">{training.routeName}</div>
        <div className="meta">
          {training.date}
          {training.notes ? ' — ' + training.notes : ''}
          {training.extra_load_kg ? ` · +${training.extra_load_kg}kg carga` : ''}
          {training.wind_speed_kmh ? ` · viento ${training.wind_speed_kmh} km/h` : ''}
          {training.rpe ? ` · RPE ${training.rpe}` : ''}
        </div>
      </div>
      <div className="meta">{fmtKm(training.distance_m)}</div>
      <div className="meta">+{fmtM(training.gain_m)}</div>
      <div className="meta">{training.duration_min ? training.duration_min + ' min' : '—'}</div>
      <div className="meta" title={energy.avgPower_W ? `${energy.avgPower_W} W prom · ${energy.avgSpeed_kmh} km/h` : ''}>
        {energy.kcal ? energy.kcal + ' kcal' : '—'}
      </div>
      <button className="danger" onClick={() => deleteTraining(training.id)}>Eliminar</button>
    </div>
  );
}
