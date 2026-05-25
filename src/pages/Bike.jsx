import { useMemo, useState } from 'react';
import { useComponents, deleteComponent, retireComponent, reactivateComponent } from '../store/useComponents.js';
import { useTrainings } from '../store/useTrainings.js';
import { CATEGORIES, categoryLabel, categoryGroup, computeComponentStatus } from '../lib/components.js';
import ComponentForm from '../components/ComponentForm.jsx';
import ServiceForm from '../components/ServiceForm.jsx';
import { fmtKm } from '../lib/geo.js';

export default function Bike() {
  const components = useComponents();
  const trainings = useTrainings();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [servicing, setServicing] = useState(null);
  const [showRetired, setShowRetired] = useState(false);

  const enriched = useMemo(() => {
    return components.map((c) => ({ c, status: computeComponentStatus(c, trainings) }));
  }, [components, trainings]);

  // Group by group, only active (unless showRetired)
  const grouped = useMemo(() => {
    const filtered = enriched.filter(({ c }) => showRetired || c.active);
    const map = {};
    for (const item of filtered) {
      const g = categoryGroup(item.c.category);
      (map[g] ||= []).push(item);
    }
    // Sort each group by state severity desc
    const order = { overdue: 0, danger: 1, warn: 2, ok: 3 };
    Object.values(map).forEach((arr) => arr.sort((a, b) => order[a.status.state] - order[b.status.state]));
    return map;
  }, [enriched, showRetired]);

  // Ordered groups (use CATEGORIES order, dedup)
  const groupOrder = [...new Set(CATEGORIES.map((c) => c.group))];

  return (
    <>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>Mi bicicleta</h2>
        <div className="spacer" />
        <label style={{ color: 'var(--text-dim)', fontSize: 12, marginRight: 12 }}>
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} style={{ marginRight: 6 }} />
          mostrar retirados
        </label>
        <button className="primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ Agregar componente</button>
      </div>

      {components.length === 0 ? (
        <div className="empty">
          Todavía no cargaste componentes. Hacé click en <b>+ Agregar componente</b> para empezar a trackear los km y mantenimientos.
        </div>
      ) : (
        groupOrder.map((g) => {
          const items = grouped[g];
          if (!items || items.length === 0) return null;
          return (
            <section key={g} style={{ marginBottom: 24 }}>
              <h3 style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{g}</h3>
              <div className="route-list">
                {items.map(({ c, status }) => (
                  <ComponentRow
                    key={c.id}
                    component={c}
                    status={status}
                    onEdit={() => { setEditing(c); setShowForm(true); }}
                    onService={() => setServicing(c)}
                    onDelete={() => { if (confirm(`¿Eliminar "${c.name}" y su historial?`)) deleteComponent(c.id); }}
                    onRetire={() => retireComponent(c.id)}
                    onReactivate={() => reactivateComponent(c.id)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {showForm && <ComponentForm editing={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
      {servicing && <ServiceForm component={servicing} onClose={() => setServicing(null)} />}
    </>
  );
}

function ComponentRow({ component, status, onEdit, onService, onDelete, onRetire, onReactivate }) {
  const { state, km_total_m, km_since_service_m, days_since_service, kmRemaining, daysRemaining } = status;
  const stateLabel = state === 'overdue' ? 'vencido' : state === 'danger' ? 'cambiar ya' : state === 'warn' ? 'pronto' : 'ok';
  const stateClass = state === 'overdue' || state === 'danger' ? 'danger' : state === 'warn' ? 'warn' : 'ok';

  return (
    <div className="route-row" style={{ gridTemplateColumns: '1fr auto auto auto auto auto', opacity: component.active ? 1 : 0.55 }}>
      <div>
        <div className="name">
          {component.name}
          {!component.active && <span className="badge" style={{ marginLeft: 8 }}>retirado</span>}
        </div>
        <div className="meta">
          {categoryLabel(component.category)}{component.brand ? ' · ' + component.brand : ''}{component.model ? ' ' + component.model : ''} · instalado {component.installedAt}
        </div>
      </div>
      <div className="meta" title="Km desde que se instaló">
        Total {fmtKm(km_total_m)}
      </div>
      <div className="meta" title="Km desde el último service">
        Desde service {fmtKm(km_since_service_m)} · {days_since_service}d
      </div>
      <div>
        {component.active && (
          <span className={`badge ${stateClass}`} title={remainingTooltip(kmRemaining, daysRemaining)}>
            {stateLabel}
          </span>
        )}
        <div className="meta" style={{ marginTop: 4, fontSize: 11 }}>{remainingText(state, kmRemaining, daysRemaining)}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {component.active && <button onClick={onService}>Service</button>}
        <button onClick={onEdit}>Editar</button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {component.active
          ? <button onClick={onRetire}>Retirar</button>
          : <button onClick={onReactivate}>Reactivar</button>}
        <button className="danger" onClick={onDelete}>Eliminar</button>
      </div>
    </div>
  );
}

function remainingText(state, kmRemaining, daysRemaining) {
  const parts = [];
  if (kmRemaining != null) parts.push(kmRemaining >= 0 ? `faltan ${kmRemaining} km` : `vencido ${-kmRemaining} km`);
  if (daysRemaining != null) parts.push(daysRemaining >= 0 ? `${daysRemaining}d` : `vencido ${-daysRemaining}d`);
  if (parts.length === 0) return 'sin alertas';
  return parts.join(' · ');
}
function remainingTooltip(km, days) {
  return `${km ?? '—'} km · ${days ?? '—'} días`;
}
