import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTrainings } from '../store/useTrainings.js';
import { useRoutes, getRoute } from '../store/useRoutes.js';
import { useComponents } from '../store/useComponents.js';
import { useProfile } from '../store/useProfile.js';
import { computeComponentStatus, categoryGroup } from '../lib/components.js';
import { computeTrainingEnergy } from '../lib/calories.js';
import { computeFitness, levelLabel, formLabel } from '../lib/fitness.js';
import {
  Chip, Eyebrow, StatCard, ProgressBar, Sparkline, TopoBg, SectionHead,
  FitnessRing, MiniRoute,
} from '../components/atoms.jsx';

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

  const enriched = useMemo(() => trainings.map((t) => ({
    ...t,
    kcal: computeTrainingEnergy(t, getRoute(t.routeId), profile).kcal || 0,
    avgW: computeTrainingEnergy(t, getRoute(t.routeId), profile).avgPower_W || 0,
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
        mins: a.mins + (t.duration_min || 0),
        count: a.count + 1,
      }), { dist: 0, gain: 0, loss: 0, kcal: 0, mins: 0, count: 0 });

    return {
      week: sum((t) => new Date(t.date).getTime() >= sow),
      month: sum((t) => new Date(t.date).getTime() >= som),
      total: sum(() => true),
    };
  }, [enriched]);

  const fLevelLabel = levelLabel(fitness.level);
  const fForm = formLabel(fitness.TSB);
  const series = fitness.series.slice(-90);
  const recent = enriched.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const favorites = routes.filter((r) => r.favorite);
  const showcaseRoutes = favorites.length > 0
    ? favorites.slice(0, 3)
    : routes.slice(0, 3);
  const formColor =
    fForm.tone === 'ok' ? 'var(--forest)'
    : fForm.tone === 'warn' ? 'var(--ochre)'
    : fForm.tone === 'danger' ? 'var(--rust)'
    : 'var(--sky)';

  const noData = trainings.length === 0;

  return (
    <div className="page-inner">
      <TopoBg />
      <div style={{ position: 'relative' }}>
        <div className="page-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>01 · Resumen general</div>
            <div className="title">Dashboard<em>.</em></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              {profile.name
                ? <>Hola, <b style={{ color: 'var(--ink)' }}>{profile.name}</b>. Acá tenés tu forma, los últimos kilómetros y lo que necesita atención.</>
                : <>Cargá tu perfil y empezá a registrar entrenamientos para ver tu evolución.</>}
            </div>
          </div>
          <div className="meta">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
        </div>

        {/* HERO */}
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', marginBottom: 28 }}>
          <div className="card" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div className="card-corner">FORMA · CTL · TSB</div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Nivel del ciclista</div>
            <div className="ring-wrap">
              <FitnessRing level={fitness.level} />
              <div style={{ minWidth: 0 }}>
                <div className="display-xl">
                  {fitness.level}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-dim)', marginLeft: 4 }}>/100</span>
                </div>
                <div className="display-it" style={{ fontSize: 18, color: 'var(--forest)', marginTop: 2 }}>
                  {fLevelLabel}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>CTL · crónico 42d</div>
                    <div className="mono tnum" style={{ fontSize: 18 }}>{fitness.CTL.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>ATL · agudo 7d</div>
                    <div className="mono tnum" style={{ fontSize: 18 }}>{fitness.ATL.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>TSB · forma</div>
                    <div className="mono tnum" style={{ fontSize: 18, color: formColor }}>
                      {fitness.TSB > 0 ? '+' : ''}{fitness.TSB.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Chip tone={fForm.tone} dot>{fForm.label}</Chip>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="eyebrow">Carga de entrenamiento</div>
                <div className="display" style={{ fontSize: 18, marginTop: 4 }}>Últimos 90 días</div>
              </div>
              <div className="row" style={{ gap: 14 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--forest)', verticalAlign: 'middle', marginRight: 6 }} />CTL
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--rust)', verticalAlign: 'middle', marginRight: 6, borderTop: '1px dashed var(--rust)' }} />ATL
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
                  <span style={{ display: 'inline-block', width: 4, height: 8, background: 'var(--ink-dim)', verticalAlign: 'middle', marginRight: 6 }} />sesión
                </span>
              </div>
            </div>
            <div style={{ height: 168, marginTop: 8 }}>
              {series.length >= 2 ? (
                <Sparkline data={series} height={168} showBars />
              ) : (
                <div className="empty" style={{ padding: 30, fontSize: 13 }}>
                  Cargá entrenamientos para ver tu curva de forma.
                </div>
              )}
            </div>
            {series.length >= 2 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.08em' }}>
                <span>{new Date(series[0].date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                <span>{new Date(series[Math.floor(series.length / 2)].date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                <span>HOY</span>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        {!noData && (
          <>
            <Eyebrow>Esta semana</Eyebrow>
            <div className="grid grid-4" style={{ marginBottom: 28 }}>
              <StatCard label="Distancia"  value={(stats.week.dist / 1000).toFixed(1)} unit="km" sub={`${stats.week.count} salidas`} corner="01" />
              <StatCard label="Desnivel +" value={`+${Math.round(stats.week.gain).toLocaleString('es-AR')}`} unit="m" corner="02" sub={stats.week.dist ? `${(stats.week.gain / (stats.week.dist/1000)).toFixed(0)} m/km` : null} />
              <StatCard label="Tiempo en bici" value={`${Math.floor(stats.week.mins / 60)}`} unit={`h ${stats.week.mins % 60}m`} corner="03" sub={stats.week.mins ? `${Math.round(stats.week.dist / 1000 / (stats.week.mins/60))} km/h prom.` : null} />
              <StatCard label="Calorías" value={stats.week.kcal ? Math.round(stats.week.kcal).toLocaleString('es-AR') : '—'} unit={stats.week.kcal ? 'kcal' : ''} corner="04" sub={stats.week.count ? `${Math.round(stats.week.kcal / Math.max(1, stats.week.count))} por salida` : null} />
            </div>

            <Eyebrow>Este mes · {new Date().toLocaleDateString('es-AR', { month: 'long' })}</Eyebrow>
            <div className="grid grid-4" style={{ marginBottom: 32 }}>
              <StatCard label="Distancia"  value={(stats.month.dist / 1000).toFixed(0)} unit="km" sub={`${stats.month.count} salidas`} corner="05" />
              <StatCard label="Desnivel +" value={`+${Math.round(stats.month.gain).toLocaleString('es-AR')}`} unit="m" corner="06" />
              <StatCard label="Tiempo en bici" value={`${Math.floor(stats.month.mins / 60)}`} unit={`h ${stats.month.mins % 60}m`} corner="07" />
              <StatCard label="Acumulado total" value={(stats.total.dist / 1000).toFixed(0)} unit="km" sub={`${stats.total.count} salidas · ${routes.length} rutas`} corner="08" />
            </div>
          </>
        )}

        {/* Alerts + recent */}
        <div className="grid" style={{ gridTemplateColumns: alerts.length > 0 && recent.length > 0 ? '1.4fr 1fr' : '1fr', gap: 24 }}>
          {alerts.length > 0 && (
            <section>
              <SectionHead
                kicker={`Mantenimiento · ${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'}`}
                title="Necesita atención"
                action={<Link to="/bici" className="btn ghost sm">Ver todo →</Link>}
              />
              <div className="card" style={{ padding: '4px 20px' }}>
                {alerts.slice(0, 6).map(({ c, status }) => {
                  const stateTone = status.state === 'overdue' || status.state === 'danger' ? 'danger' : 'warn';
                  const stateText = status.state === 'overdue' ? 'vencido' : status.state === 'danger' ? 'cambiar ya' : 'pronto';
                  return (
                    <div className="alert-row" key={c.id}>
                      <Chip tone={stateTone} dot>{stateText}</Chip>
                      <div>
                        <div className="a-name">{c.name}</div>
                        <div className="a-meta">
                          {categoryGroup(c.category).toUpperCase()} · {(status.km_since_service_m/1000).toFixed(0)} km desde service · {status.days_since_service}d
                        </div>
                      </div>
                      <div className="a-bar">
                        <ProgressBar value={status.ratio * 100} tone={stateTone} />
                      </div>
                      <Link to="/bici" className="btn sm">Service</Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <SectionHead
                kicker="Última actividad"
                title="Diario"
                action={<Link to="/entrenamientos" className="btn ghost sm">Ver todo →</Link>}
              />
              <div className="card" style={{ padding: 0 }}>
                {recent.map((t, i) => {
                  const r = getRoute(t.routeId);
                  return (
                    <div key={t.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '54px 1fr auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 18px',
                      borderBottom: i === recent.length - 1 ? 'none' : '1px solid var(--rule-soft)',
                    }}>
                      <div style={{ textAlign: 'center', borderRight: '1px solid var(--rule)', paddingRight: 12 }}>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {new Date(t.date + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                        </div>
                        <div className="display" style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>
                          {new Date(t.date + 'T12:00:00').getDate()}
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>
                          {r ? <Link to={`/rutas/${r.id}`} style={{ color: 'inherit' }}>{r.name}</Link> : t.routeName}
                        </div>
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.06em', marginTop: 2 }}>
                          {(t.distance_m/1000).toFixed(1)}km · +{t.gain_m}m
                          {t.duration_min ? ` · ${Math.floor(t.duration_min/60)}h${t.duration_min % 60}m` : ''}
                          {t.rpe ? ` · RPE ${t.rpe}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {t.avgW > 0 && <div className="mono tnum" style={{ fontSize: 13, color: 'var(--forest)' }}>{t.avgW}W</div>}
                        {t.kcal > 0 && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>{Math.round(t.kcal).toLocaleString('es-AR')} kcal</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Favorites strip */}
        {showcaseRoutes.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <SectionHead
              kicker={favorites.length > 0 ? 'Favoritas' : 'Rutas guardadas'}
              title={favorites.length > 0 ? 'Rutas para volver' : 'Atlas'}
              action={<Link to="/rutas" className="btn ghost sm">Ver todas →</Link>}
            />
            <div className="grid grid-3">
              {showcaseRoutes.map((r) => (
                <Link key={r.id} to={`/rutas/${r.id}`} className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', display: 'block' }}>
                  <div style={{ height: 110, position: 'relative', borderBottom: '1px solid var(--rule-soft)' }}>
                    <MiniRoute points={r.points} height={110} />
                    {r.favorite && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Chip tone="solid" style={{ fontSize: 9 }}>♥ favorita</Chip>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div className="display" style={{ fontSize: 17, fontWeight: 500, marginBottom: 4 }}>{r.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
                      {(r.stats.distance_m/1000).toFixed(0)} km · +{Math.round(r.stats.gain_m)} m
                      {r.region ? ` · ${r.region}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {noData && routes.length === 0 && components.length === 0 && (
          <div className="empty" style={{ marginTop: 24 }}>
            Empezá importando una ruta (KMZ/KML) desde <b>Rutas</b>, registrá tu primer entrenamiento, y cargá los componentes de tu bici para hacer seguimiento.
          </div>
        )}
      </div>
    </div>
  );
}
