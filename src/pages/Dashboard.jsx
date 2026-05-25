import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTrainings } from '../store/useTrainings.js';
import { useRoutes, getRoute } from '../store/useRoutes.js';
import { useComponents } from '../store/useComponents.js';
import { useProfile } from '../store/useProfile.js';
import { computeComponentStatus, categoryLabel } from '../lib/components.js';
import { computeTrainingEnergy } from '../lib/calories.js';
import { computeFitness, levelLabel, formLabel } from '../lib/fitness.js';
import { fmtKm, fmtM } from '../lib/geo.js';

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}

export default function Dashboard() {
  const trainings = useTrainings();
  const { routes } = useRoutes();
  const components = useComponents();
  const profile = useProfile();

  // Enriquecer trainings con calorías una sola vez.
  const enriched = useMemo(() => trainings.map((t) => ({
    ...t,
    kcal: computeTrainingEnergy(t, getRoute(t.routeId), profile).kcal || 0,
  })), [trainings, profile]);

  const fitness = useMemo(() => computeFitness(trainings, profile), [trainings, profile]);

  const alerts = useMemo(() => components
    .filter((c) => c.active)
    .map((c) => ({ c, status: computeComponentStatus(c, trainings) }))
    .filter(({ status }) => status.state !== 'ok')
    .sort((a, b) => b.status.ratio - a.status.ratio), [components, trainings]);

  const stats = useMemo(() => {
    const now = new Date();
    const sow = startOfWeek(now).getTime();
    const som = startOfMonth(now).getTime();
    const sum = (filter) => enriched
      .filter(filter)
      .reduce((a, t) => ({
        dist: a.dist + t.distance_m,
        gain: a.gain + t.gain_m,
        loss: a.loss + t.loss_m,
        kcal: a.kcal + t.kcal,
        count: a.count + 1,
      }), { dist: 0, gain: 0, loss: 0, kcal: 0, count: 0 });

    return {
      week: sum((t) => new Date(t.date).getTime() >= sow),
      month: sum((t) => new Date(t.date).getTime() >= som),
      total: sum(() => true),
    };
  }, [enriched]);

  const fLevel = levelLabel(fitness.level);
  const fForm = formLabel(fitness.TSB);

  return (
    <>
      <h2>Dashboard</h2>

      {/* Nivel + forma */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="label">Nivel</div>
          <div className="value">{fitness.level} <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>/100</span></div>
          <div className="sub">{fLevel}</div>
        </div>
        <div className="card stat">
          <div className="label">Forma</div>
          <div className="value"><span className={`badge ${fForm.tone}`} style={{ fontSize: 15, padding: '4px 10px' }}>{fForm.label}</span></div>
          <div className="sub">CTL {fitness.CTL.toFixed(1)} · TSB {fitness.TSB.toFixed(1)}</div>
        </div>
        <div className="card stat">
          <div className="label">Acumulado</div>
          <div className="value">{fmtKm(stats.total.dist)}</div>
          <div className="sub">{stats.total.count} entrenamientos · {routes.length} rutas guardadas</div>
        </div>
      </div>

      <h3 className="section-title">Esta semana</h3>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Distancia" value={fmtKm(stats.week.dist)} sub={`${stats.week.count} salidas`} />
        <Stat label="Desnivel +" value={`+${fmtM(stats.week.gain)}`} />
        <Stat label="Desnivel −" value={`−${fmtM(stats.week.loss)}`} />
        <Stat label="Calorías" value={stats.week.kcal ? `${stats.week.kcal.toLocaleString()} kcal` : '—'} />
      </div>

      <h3 className="section-title">Este mes</h3>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Distancia" value={fmtKm(stats.month.dist)} sub={`${stats.month.count} salidas`} />
        <Stat label="Desnivel +" value={`+${fmtM(stats.month.gain)}`} />
        <Stat label="Desnivel −" value={`−${fmtM(stats.month.loss)}`} />
        <Stat label="Calorías" value={stats.month.kcal ? `${stats.month.kcal.toLocaleString()} kcal` : '—'} />
      </div>

      {alerts.length > 0 && (
        <>
          <h3 className="section-title">Alertas de mantenimiento ({alerts.length})</h3>
          <div className="card">
            <div className="alert-list">
              {alerts.slice(0, 8).map(({ c, status }) => {
                const stateClass = status.state === 'overdue' || status.state === 'danger' ? 'danger' : 'warn';
                const stateLabel = status.state === 'overdue' ? 'vencido' : status.state === 'danger' ? 'cambiar ya' : 'pronto';
                return (
                  <div className="alert-row" key={c.id}>
                    <span className={`badge ${stateClass}`}>{stateLabel}</span>
                    <div>
                      <b>{c.name}</b> <span style={{ color: 'var(--text-dim)' }}>· {categoryLabel(c.category)}</span>
                      <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                        {fmtKm(status.km_since_service_m)} desde service · {status.days_since_service}d
                        {status.kmRemaining != null && ` · faltan ${status.kmRemaining}km`}
                        {status.daysRemaining != null && ` · faltan ${status.daysRemaining}d`}
                      </div>
                    </div>
                    <Link to="/bici">ver</Link>
                  </div>
                );
              })}
              {alerts.length > 8 && (
                <Link to="/bici" style={{ color: 'var(--text-dim)', fontSize: 12 }}>+{alerts.length - 8} más</Link>
              )}
            </div>
          </div>
        </>
      )}

      {trainings.length === 0 && (
        <div className="empty" style={{ marginTop: 24 }}>
          Todavía no cargaste ningún entrenamiento. Andá a <b>Entrenamientos</b> y cargá una salida usando una de tus rutas.
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
