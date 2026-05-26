import { useMemo, useState } from 'react';
import {
  useComponents, deleteComponent, retireComponent, reactivateComponent,
} from '../store/useComponents.js';
import { useTrainings } from '../store/useTrainings.js';
import {
  CATEGORIES, categoryLabel, categoryGroup, computeComponentStatus,
} from '../lib/components.js';
import ComponentForm from './ComponentForm.jsx';
import ServiceForm from './ServiceForm.jsx';
import {
  Chip, ProgressBar, SectionHead, StatCard,
} from './atoms.jsx';

export default function ComponentsList() {
  const components = useComponents();
  const trainings = useTrainings();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [servicing, setServicing] = useState(null);
  const [showRetired, setShowRetired] = useState(false);

  const enriched = useMemo(
    () => components.map((c) => ({ c, status: computeComponentStatus(c, trainings) })),
    [components, trainings]
  );

  const grouped = useMemo(() => {
    const filtered = enriched.filter(({ c }) => showRetired || c.active);
    const map = {};
    for (const item of filtered) {
      const g = categoryGroup(item.c.category);
      (map[g] ||= []).push(item);
    }
    const order = { overdue: 0, danger: 1, warn: 2, ok: 3 };
    Object.values(map).forEach((arr) => arr.sort((a, b) => order[a.status.state] - order[b.status.state]));
    return map;
  }, [enriched, showRetired]);

  const groupOrder = [...new Set(CATEGORIES.map((c) => c.group))];
  const activeCount = enriched.filter(({ c }) => c.active).length;
  const overdueCount = enriched.filter(({ c, status }) => c.active && status.state === 'overdue').length;
  const dangerCount  = enriched.filter(({ c, status }) => c.active && status.state === 'danger').length;
  const warnCount    = enriched.filter(({ c, status }) => c.active && status.state === 'warn').length;
  const alertsTotal  = overdueCount + dangerCount + warnCount;

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Componentes activos" value={activeCount} corner="A" />
        <StatCard
          label="Alertas pendientes"
          value={alertsTotal}
          corner="B"
          sub={`${overdueCount} vencidos · ${dangerCount} cambiar ya · ${warnCount} pronto`}
        />
        <StatCard
          label="Sin alertas"
          value={activeCount - alertsTotal}
          corner="C"
          sub="al día"
        />
        <StatCard
          label="Historial de service"
          value={enriched.reduce((a, { c }) => a + (c.serviceLog?.length || 0), 0)}
          unit="entradas"
          corner="D"
        />
      </div>

      <div className="toolbar">
        <label style={{ color: 'var(--ink-dim)', fontSize: 12, marginRight: 12, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
          mostrar retirados
        </label>
        <div className="spacer" />
        <button className="primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ Componente</button>
      </div>

      {components.length === 0 ? (
        <div className="empty">
          Todavía no cargaste componentes. Hacé click en <b>+ Componente</b> para empezar a trackear km y mantenimientos.
        </div>
      ) : (
        groupOrder.map((g) => {
          const items = grouped[g];
          if (!items || items.length === 0) return null;
          return (
            <div key={g} style={{ marginBottom: 26 }}>
              <SectionHead kicker={`${items.length} componente${items.length === 1 ? '' : 's'}`} title={g} />
              <div className="card" style={{ padding: '0 22px' }}>
                {items.map(({ c, status }, i) => (
                  <CompRow
                    key={c.id}
                    component={c}
                    status={status}
                    last={i === items.length - 1}
                    onEdit={() => { setEditing(c); setShowForm(true); }}
                    onService={() => setServicing(c)}
                    onDelete={() => { if (confirm(`¿Eliminar "${c.name}" y su historial?`)) deleteComponent(c.id); }}
                    onRetire={() => retireComponent(c.id)}
                    onReactivate={() => reactivateComponent(c.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {showForm && <ComponentForm editing={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
      {servicing && <ServiceForm component={servicing} onClose={() => setServicing(null)} />}
    </>
  );
}

function CompRow({ component, status, onEdit, onService, onDelete, onRetire, onReactivate, last }) {
  const { state, km_since_service_m, days_since_service, kmRemaining, ratio } = status;
  const tone = state === 'ok' ? 'ok' : state === 'warn' ? 'warn' : 'danger';
  const stateText = state === 'overdue' ? 'vencido' : state === 'danger' ? 'cambiar ya' : state === 'warn' ? 'pronto' : 'ok';
  const { kmThreshold, daysThreshold } = component.maintenance || {};

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr 240px 140px 140px',
      gap: 18,
      padding: '18px 0',
      alignItems: 'center',
      borderBottom: last ? 'none' : '1px solid var(--rule-soft)',
      opacity: component.active ? 1 : 0.55,
    }}>
      <Chip tone={tone} dot>{stateText}</Chip>
      <div style={{ minWidth: 0 }}>
        <div className="display" style={{ fontSize: 17, fontWeight: 500 }}>
          {component.name}
          {!component.active && <Chip style={{ marginLeft: 8 }}>retirado</Chip>}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.06em', marginTop: 2 }}>
          {categoryLabel(component.category).toUpperCase()}
          {component.brand ? ` · ${component.brand.toUpperCase()}` : ''}
          {component.model ? ` ${component.model}` : ''}
          {' · '}instalado {component.installedAt}
        </div>
      </div>
      <div>
        {kmThreshold ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
                {(km_since_service_m/1000).toFixed(0)} / {kmThreshold} km
              </span>
              <span className="mono tnum" style={{ fontSize: 10, color: tone === 'ok' ? 'var(--forest)' : tone === 'warn' ? 'var(--ochre)' : 'var(--rust)' }}>
                {Math.round(ratio * 100)}%
              </span>
            </div>
            <ProgressBar value={ratio * 100} tone={tone} thick />
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.06em', marginTop: 4 }}>
              {days_since_service}d{daysThreshold ? ` / ${daysThreshold}d` : ''}
            </div>
          </>
        ) : (
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>
            {(km_since_service_m/1000).toFixed(0)} km · {days_since_service}d
            {daysThreshold && (
              <ProgressBar value={(days_since_service / daysThreshold) * 100} tone={tone} thick />
            )}
          </div>
        )}
      </div>
      <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
        {kmThreshold && (
          kmRemaining >= 0
            ? <>faltan <b style={{ color: 'var(--ink)' }}>{kmRemaining}</b> km</>
            : <span style={{ color: 'var(--rust)' }}>excedido <b>{-kmRemaining}</b> km</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {component.active && <button className="btn sm" onClick={onService}>Service</button>}
        <button className="btn sm" onClick={onEdit}>Editar</button>
        {component.active
          ? <button className="btn sm" onClick={onRetire}>Retirar</button>
          : <button className="btn sm" onClick={onReactivate}>Reactivar</button>}
        <button className="danger btn sm" onClick={onDelete}>×</button>
      </div>
    </div>
  );
}
