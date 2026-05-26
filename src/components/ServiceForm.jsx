import { useState } from 'react';
import { addService } from '../store/useComponents.js';

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
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ maxWidth: 480 }}>
        <h3>Registrar service</h3>
        <div className="display-it" style={{ color: 'var(--ink-dim)', fontSize: 13 }}>
          {component.name} — resetea los contadores de mantenimiento.
        </div>
        <div className="field">
          <span className="lbl">Fecha</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <span className="lbl">Notas (qué se hizo)</span>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary">Registrar</button>
        </div>
      </form>
    </div>
  );
}
