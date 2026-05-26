import { useState, useEffect } from 'react';
import { CATEGORIES, MAINTENANCE_PRESETS } from '../lib/components.js';
import { buildComponent, saveComponent } from '../store/useComponents.js';

export default function ComponentForm({ onClose, editing = null }) {
  const initial = editing || {
    category: 'cadena',
    name: '',
    brand: '',
    model: '',
    installedAt: new Date().toISOString().slice(0, 10),
    notes: '',
    maintenance: { ...MAINTENANCE_PRESETS.cadena },
  };
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (editing) return;
    const preset = MAINTENANCE_PRESETS[form.category] || { kmThreshold: null, daysThreshold: null };
    setForm((f) => ({ ...f, maintenance: { kmThreshold: preset.kmThreshold, daysThreshold: preset.daysThreshold } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) saveComponent({ ...editing, ...form });
    else saveComponent(buildComponent(form));
    onClose?.();
  }

  const preset = MAINTENANCE_PRESETS[form.category] || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{editing ? 'Editar componente' : 'Agregar componente'}</h3>

        <div className="field">
          <span className="lbl">Categoría</span>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(groupBy(CATEGORIES, 'group')).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="lbl">Nombre *</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ej: Cadena KMC X12" required />
        </div>

        <div className="row gap" style={{ flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <span className="lbl">Marca</span>
            <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <span className="lbl">Modelo</span>
            <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <span className="lbl">Instalado el</span>
            <input className="input" type="date" value={form.installedAt} onChange={(e) => setForm({ ...form, installedAt: e.target.value })} />
          </div>
        </div>

        <fieldset>
          <legend>Alertas de mantenimiento</legend>
          <div className="row gap">
            <div className="field" style={{ flex: 1 }}>
              <span className="lbl">Cada N km (vacío = sin alerta)</span>
              <input
                className="input"
                type="number"
                value={form.maintenance.kmThreshold ?? ''}
                onChange={(e) => setForm({ ...form, maintenance: { ...form.maintenance, kmThreshold: e.target.value === '' ? null : Number(e.target.value) } })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <span className="lbl">Cada N días (vacío = sin alerta)</span>
              <input
                className="input"
                type="number"
                value={form.maintenance.daysThreshold ?? ''}
                onChange={(e) => setForm({ ...form, maintenance: { ...form.maintenance, daysThreshold: e.target.value === '' ? null : Number(e.target.value) } })}
              />
            </div>
          </div>
          {preset.hint && (
            <div className="display-it" style={{ color: 'var(--ink-dim)', fontSize: 12, marginTop: 8 }}>{preset.hint}</div>
          )}
        </fieldset>

        <div className="field">
          <span className="lbl">Notas</span>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary">{editing ? 'Guardar cambios' : 'Agregar'}</button>
        </div>
      </form>
    </div>
  );
}

function groupBy(arr, key) {
  return arr.reduce((acc, x) => {
    (acc[x[key]] ||= []).push(x);
    return acc;
  }, {});
}
