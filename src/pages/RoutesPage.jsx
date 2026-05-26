import { useState } from 'react';
import { Link } from 'react-router-dom';
import ImportKmz from '../components/ImportKmz.jsx';
import RouteBuilder from '../components/RouteBuilder.jsx';
import { useRoutes, deleteRoute, updateRouteMeta } from '../store/useRoutes.js';
import {
  Chip, Tag, MiniRoute, TopoBg, fmtRelDays,
} from '../components/atoms.jsx';

export default function RoutesPage() {
  const { routes } = useRoutes();
  const [filter, setFilter] = useState('todas');
  const [view, setView]     = useState('grid');
  const [q, setQ]           = useState('');
  const [building, setBuilding] = useState(false);

  let rows = routes.slice();
  if (filter === 'training') rows = rows.filter((r) => (r.type || 'training') === 'training');
  if (filter === 'trip')     rows = rows.filter((r) => r.type === 'trip');
  if (filter === 'favoritas') rows = rows.filter((r) => r.favorite);
  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter((r) => (r.name + ' ' + (r.region || '')).toLowerCase().includes(needle));
  }
  rows.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''));

  const totals = routes.reduce((a, r) => ({
    dist: a.dist + (r.stats?.distance_m || 0),
    gain: a.gain + (r.stats?.gain_m || 0),
  }), { dist: 0, gain: 0 });

  return (
    <div className="page-inner">
      <TopoBg />
      <div style={{ position: 'relative' }}>
        <div className="page-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>02 · Rutas guardadas</div>
            <div className="title">Atlas<em> de rutas.</em></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              {routes.length === 0
                ? 'Creá tu primera ruta o importá un KMZ/KML.'
                : <>{routes.length} ruta{routes.length === 1 ? '' : 's'} · {(totals.dist/1000).toFixed(0)} km totales · +{Math.round(totals.gain).toLocaleString('es-AR')} m de desnivel sumado.</>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={() => setBuilding(true)}>
              ＋ Crear ruta
            </button>
            <ImportKmz />
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="empty">
            Todavía no tenés rutas. Hacé click en <b>Crear ruta</b> para armarla a mano sobre el mapa
            satelital, o en <b>Importar KMZ/KML</b> para traer un archivo de Google Earth.
          </div>
        ) : (
          <>
            <div className="toolbar" style={{ flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ width: 260 }}
                placeholder="Buscar por nombre o región…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                {[
                  { id: 'todas', label: 'Todas' },
                  { id: 'training', label: 'Entrenamiento' },
                  { id: 'trip', label: 'Viaje multi-día' },
                  { id: 'favoritas', label: 'Favoritas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    className={'btn sm ' + (filter === f.id ? 'primary' : '')}
                    onClick={() => setFilter(f.id)}
                  >{f.label}</button>
                ))}
              </div>
              <div className="spacer" />
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={'btn sm ' + (view === 'grid' ? 'primary' : '')} onClick={() => setView('grid')}>Cuadrícula</button>
                <button className={'btn sm ' + (view === 'list' ? 'primary' : '')} onClick={() => setView('list')}>Lista</button>
              </div>
            </div>

            {view === 'grid' ? (
              <div className="grid grid-3">
                {rows.map((r, i) => <RouteCard key={r.id} route={r} idx={i + 1} />)}
              </div>
            ) : (
              <RouteListView rows={rows} />
            )}

            {rows.length === 0 && (
              <div className="empty">
                <div className="display-it" style={{ fontSize: 22, color: 'var(--ink-dim)' }}>
                  No se encontraron rutas con esos criterios.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {building && (
        <RouteBuilder onClose={() => setBuilding(false)} />
      )}
    </div>
  );
}

function RouteCard({ route, idx }) {
  const km = (route.stats.distance_m / 1000).toFixed(0);
  const isTrip = route.type === 'trip';
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <Link to={`/rutas/${route.id}`} style={{ display: 'block' }}>
        <div style={{ height: 180, position: 'relative', borderBottom: '1px solid var(--rule)' }}>
          <MiniRoute points={route.points} height={180} />
          <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', gap: 6 }}>
            <Tag>{String(idx).padStart(2, '0')}</Tag>
            {isTrip && <Chip tone="warn">viaje · {route.tripMeta?.days || 2}d</Chip>}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              updateRouteMeta(route.id, { favorite: !route.favorite });
            }}
            title={route.favorite ? 'Quitar favorita' : 'Marcar favorita'}
            style={{
              position: 'absolute', top: 10, right: 12,
              background: 'rgba(245,240,230,0.92)', border: '1px solid var(--rule)',
              width: 28, height: 28, padding: 0, borderRadius: 999,
              color: route.favorite ? 'var(--rust)' : 'var(--ink-dim)',
              fontSize: 14, lineHeight: 1,
            }}
          >♥</button>
        </div>
        <div style={{ padding: 16 }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 500, marginBottom: 2 }}>{route.name}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            {route.region || (isTrip ? 'Multi-día' : 'Entrenamiento')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 12, borderTop: '1px dashed var(--rule)' }}>
            <Mini label="dist." value={`${km} km`} />
            <Mini label="d+"    value={`+${Math.round(route.stats.gain_m)}`} />
            <Mini label="d−"    value={`−${Math.round(route.stats.loss_m)}`} />
          </div>
        </div>
      </Link>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
      <div className="display tnum" style={{ fontSize: 16 }}>{value}</div>
    </div>
  );
}

function RouteListView({ rows }) {
  return (
    <div className="card" style={{ padding: '0 20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto auto auto auto auto auto',
        gap: 16,
        padding: '12px 4px',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div className="eyebrow" style={{ fontSize: 9 }}>Nº</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Ruta</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Tipo</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Distancia</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Desnivel +</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Importada</div>
        <div></div>
        <div></div>
      </div>
      {rows.map((r, i) => (
        <div key={r.id} style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr auto auto auto auto auto auto',
          gap: 16,
          padding: '14px 4px',
          alignItems: 'center',
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--rule-soft)',
        }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{String(i + 1).padStart(2, '0')}</div>
          <div>
            <Link to={`/rutas/${r.id}`} className="display" style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
              {r.name}
            </Link>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.06em', marginTop: 2 }}>
              {(r.region || (r.type === 'trip' ? 'Multi-día' : 'Entrenamiento')).toUpperCase()}
            </div>
          </div>
          <Chip tone={r.type === 'trip' ? 'warn' : 'ok'}>
            {r.type === 'trip' ? `viaje · ${r.tripMeta?.days || 2}d` : 'entrenamiento'}
          </Chip>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}><b style={{ color: 'var(--ink)' }}>{(r.stats.distance_m/1000).toFixed(1)}</b> km</div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}><b style={{ color: 'var(--ink)' }}>+{Math.round(r.stats.gain_m)}</b> m</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{fmtRelDays(r.importedAt)}</div>
          <button
            onClick={() => updateRouteMeta(r.id, { favorite: !r.favorite })}
            style={{ color: r.favorite ? 'var(--rust)' : 'var(--ink-dim)', padding: '4px 10px' }}
            title={r.favorite ? 'Quitar favorita' : 'Favorita'}
          >♥</button>
          <button
            className="danger"
            onClick={() => { if (confirm(`¿Eliminar "${r.name}"?`)) deleteRoute(r.id); }}
            style={{ padding: '4px 10px' }}
          >×</button>
        </div>
      ))}
    </div>
  );
}
