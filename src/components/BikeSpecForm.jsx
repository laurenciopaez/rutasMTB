import { useState } from 'react';
import { useBikeSpec, saveBikeSpec } from '../store/useBikeSpec.js';
import { wheelCircumferenceMm } from '../lib/gearing.js';

const PRESET_CASSETTES = {
  'SRAM Eagle 10-50 (12v)':       [10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 50],
  'SRAM Eagle 10-52 (12v)':       [10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 52],
  'Shimano XT 10-51 (12v)':       [10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 51],
  'Shimano 11-46 (11v)':          [11, 13, 15, 17, 19, 21, 24, 28, 32, 37, 46],
  '11-42 (11v)':                  [11, 13, 15, 17, 19, 21, 24, 28, 32, 37, 42],
  '11-36 (10v)':                  [11, 13, 15, 17, 19, 21, 24, 28, 32, 36],
  '11-32 (8v)':                   [11, 13, 15, 18, 21, 24, 28, 32],
};

export default function BikeSpecForm() {
  const spec = useBikeSpec();
  const [form, setForm] = useState(spec);
  const [savedAt, setSavedAt] = useState(null);

  function update(patch) { setForm({ ...form, ...patch }); }

  function setChainring(idx, val) {
    const next = [...form.chainrings];
    next[idx] = Number(val) || 0;
    update({ chainrings: next });
  }
  function addChainring() { update({ chainrings: [...form.chainrings, 30] }); }
  function removeChainring(idx) {
    if (form.chainrings.length <= 1) return;
    update({ chainrings: form.chainrings.filter((_, i) => i !== idx) });
  }

  function setCog(idx, val) {
    const next = [...form.cassette];
    next[idx] = Number(val) || 0;
    update({ cassette: next });
  }
  function addCog() { update({ cassette: [...form.cassette, 51] }); }
  function removeCog(idx) {
    if (form.cassette.length <= 2) return;
    update({ cassette: form.cassette.filter((_, i) => i !== idx) });
  }

  function loadPreset(name) {
    if (!PRESET_CASSETTES[name]) return;
    update({ cassette: [...PRESET_CASSETTES[name]] });
  }

  function submit(e) {
    e.preventDefault();
    // Sanear y ordenar cassette ascendente (más chico al más grande).
    const clean = {
      ...form,
      tireWidthMm: Number(form.tireWidthMm) || 0,
      crankLengthMm: Number(form.crankLengthMm) || 175,
      referenceCadence: Number(form.referenceCadence) || 90,
      customCircumferenceMm: form.customCircumferenceMm ? Number(form.customCircumferenceMm) : null,
      chainrings: form.chainrings.filter((n) => n > 0).sort((a, b) => a - b),
      cassette: [...new Set(form.cassette)].filter((n) => n > 0).sort((a, b) => a - b),
    };
    saveBikeSpec(clean);
    setForm(clean);
    setSavedAt(Date.now());
  }

  const computedCirc = Math.round(wheelCircumferenceMm(form));

  return (
    <form onSubmit={submit} className="card" style={{ display: 'grid', gap: 16 }}>
      <h3 style={{ marginTop: 0 }}>Specs de la bicicleta</h3>

      <section>
        <div className="lbl">Rueda</div>
        <div className="row gap" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label>
            <div className="lbl" style={{ fontSize: 11 }}>Rodado</div>
            <select value={form.wheelSize} onChange={(e) => update({ wheelSize: e.target.value })}>
              <option value="26">26"</option>
              <option value="27.5">27.5" (650b)</option>
              <option value="29">29" (700c)</option>
            </select>
          </label>
          <label>
            <div className="lbl" style={{ fontSize: 11 }}>Ancho neumático (mm)</div>
            <input type="number" min="20" max="120" value={form.tireWidthMm} onChange={(e) => update({ tireWidthMm: e.target.value })} style={{ width: 100 }} />
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>2.0"≈51 · 2.3"≈58 · 2.4"≈61</div>
          </label>
          <label>
            <div className="lbl" style={{ fontSize: 11 }}>Override circunferencia (mm, opc.)</div>
            <input type="number" placeholder={`calc: ${computedCirc}`} value={form.customCircumferenceMm ?? ''} onChange={(e) => update({ customCircumferenceMm: e.target.value })} style={{ width: 130 }} />
          </label>
          <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>
            Circunferencia efectiva: <b style={{ color: 'var(--accent)' }}>{Math.round(wheelCircumferenceMm({ ...form, customCircumferenceMm: form.customCircumferenceMm ? Number(form.customCircumferenceMm) : null }))} mm</b>
          </div>
        </div>
      </section>

      <section>
        <div className="lbl">Bielas</div>
        <div className="row gap" style={{ flexWrap: 'wrap' }}>
          <label>
            <div className="lbl" style={{ fontSize: 11 }}>Longitud de palanca (mm)</div>
            <input type="number" min="150" max="200" step="2.5" value={form.crankLengthMm} onChange={(e) => update({ crankLengthMm: e.target.value })} style={{ width: 110 }} />
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>típicas: 165, 170, 172.5, 175</div>
          </label>
          <label>
            <div className="lbl" style={{ fontSize: 11 }}>Cadencia ref. (rpm)</div>
            <input type="number" min="40" max="140" value={form.referenceCadence} onChange={(e) => update({ referenceCadence: e.target.value })} style={{ width: 100 }} />
          </label>
        </div>
      </section>

      <section>
        <div className="lbl">Plato/s</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {form.chainrings.map((c, i) => (
            <span key={i} className="row" style={{ gap: 4, alignItems: 'center' }}>
              <input type="number" value={c} onChange={(e) => setChainring(i, e.target.value)} style={{ width: 70 }} />
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>T</span>
              {form.chainrings.length > 1 && (
                <button type="button" onClick={() => removeChainring(i)} style={{ padding: '2px 8px' }}>×</button>
              )}
            </span>
          ))}
          <button type="button" onClick={addChainring}>+ plato</button>
        </div>
      </section>

      <section>
        <div className="lbl">Cassette</div>
        <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <select onChange={(e) => { loadPreset(e.target.value); e.target.value = ''; }} defaultValue="">
            <option value="">— cargar preset —</option>
            {Object.keys(PRESET_CASSETTES).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{form.cassette.length} piñones</span>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {form.cassette.map((c, i) => (
            <span key={i} className="row" style={{ gap: 2, alignItems: 'center' }}>
              <input type="number" value={c} onChange={(e) => setCog(i, e.target.value)} style={{ width: 60 }} />
              {form.cassette.length > 2 && (
                <button type="button" onClick={() => removeCog(i)} style={{ padding: '2px 6px' }}>×</button>
              )}
            </span>
          ))}
          <button type="button" onClick={addCog}>+</button>
        </div>
      </section>

      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <button type="submit" className="primary">Guardar specs</button>
        {savedAt && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓ guardado</span>}
      </div>
    </form>
  );
}
