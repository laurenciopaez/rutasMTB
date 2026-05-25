import { useState } from 'react';
import { addService } from '../store/useComponents.js';

// Mini modal para registrar un service (resetea contadores).
export default function ServiceForm({ component, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  function submit(e) {
    e.preventDefault();
    addService(component.id, { date, notes });
    onClose?.();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ maxWidth: 480 }}>
        <h3 style={{ marginTop: 0 }}>Registrar service</h3>
        <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 12 }}>
          {component.name} · resetea los contadores de mantenimiento
        </div>
        <label>
          <div className="lbl">Fecha</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <div className="lbl">Notas (qué se hizo)</div>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
        </label>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary">Registrar</button>
        </div>
      </form>
    </div>
  );
}
