import { useState, useEffect } from 'react';
import { CATEGORIES, MAINTENANCE_PRESETS } from '../lib/components.js';
import { buildComponent, saveComponent } from '../store/useComponents.js';

// Modal inline para alta de componente. Si recibe `editing`, edita en lugar de crear.
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

  // Si el usuario cambia la categoría y NO estaba editando, reset al preset.
  useEffect(() => {
    if (editing) return;
    const preset = MAINTENANCE_PRESETS[form.category] || { kmThreshold: null, daysThreshold: null };
    setForm((f) => ({ ...f, maintenance: { kmThreshold: preset.kmThreshold, daysThreshold: preset.daysThreshold } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      saveComponent({ ...editing, ...form });
    } else {
      saveComponent(buildComponent(form));
    }
    onClose?.();
  }

  const preset = MAINTENANCE_PRESETS[form.category] || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 style={{ marginTop: 0 }}>{editing ? 'Editar componente' : 'Agregar componente'}</h3>

        <label>
          <div className="lbl">Categoría</div>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(groupBy(CATEGORIES, 'group')).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          <div className="lbl">Nombre *</div>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cadena KMC X12" required />
        </label>

        <div className="row gap">
          <label style={{ flex: 1 }}>
            <div className="lbl">Marca</div>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </label>
          <label style={{ flex: 1 }}>
            <div className="lbl">Modelo</div>
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </label>
          <label>
            <div className="lbl">Instalado el</div>
            <input type="date" value={form.installedAt} onChange={(e) => setForm({ ...form, installedAt: e.target.value })} />
          </label>
        </div>

        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <legend style={{ color: 'var(--text-dim)', fontSize: 12 }}>Alertas de mantenimiento</legend>
          <div className="row gap">
            <label style={{ flex: 1 }}>
              <div className="lbl">Cada N km (vacío = sin alerta)</div>
              <input type="number" value={form.maintenance.kmThreshold ?? ''} onChange={(e) => setForm({ ...form, maintenance: { ...form.maintenance, kmThreshold: e.target.value === '' ? null : Number(e.target.value) } })} />
            </label>
            <label style={{ flex: 1 }}>
              <div className="lbl">Cada N días (vacío = sin alerta)</div>
              <input type="number" value={form.maintenance.daysThreshold ?? ''} onChange={(e) => setForm({ ...form, maintenance: { ...form.maintenance, daysThreshold: e.target.value === '' ? null : Number(e.target.value) } })} />
            </label>
          </div>
          {preset.hint && <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 8 }}>💡 {preset.hint}</div>}
        </fieldset>

        <label>
          <div className="lbl">Notas</div>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', resize: 'vertical' }} />
        </label>

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
