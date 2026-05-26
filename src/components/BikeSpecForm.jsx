import { useState } from 'react';
import { useBikeSpec, saveBikeSpec } from '../store/useBikeSpec.js';
import { wheelCircumferenceMm } from '../lib/gearing.js';
import { SectionHead } from './atoms.jsx';

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
  const addChainring    = () => update({ chainrings: [...form.chainrings, 30] });
  const removeChainring = (i) => form.chainrings.length > 1 && update({ chainrings: form.chainrings.filter((_, k) => k !== i) });

  function setCog(idx, val) {
    const next = [...form.cassette];
    next[idx] = Number(val) || 0;
    update({ cassette: next });
  }
  const addCog    = () => update({ cassette: [...form.cassette, 51] });
  const removeCog = (i) => form.cassette.length > 2 && update({ cassette: form.cassette.filter((_, k) => k !== i) });

  function loadPreset(name) {
    if (!PRESET_CASSETTES[name]) return;
    update({ cassette: [...PRESET_CASSETTES[name]] });
  }

  function submit(e) {
    e.preventDefault();
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

  const computedCirc = Math.round(wheelCircumferenceMm({ ...form, customCircumferenceMm: form.customCircumferenceMm ? Number(form.customCircumferenceMm) : null }));

  return (
    <form onSubmit={submit} className="card" style={{ padding: 26, display: 'grid', gap: 22 }}>
      <SectionHead kicker="Ficha técnica" title="Specs de la bicicleta" />

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Rueda</div>
        <div className="row gap" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field">
            <span className="lbl">Rodado</span>
            <select className="input" value={form.wheelSize} onChange={(e) => update({ wheelSize: e.target.value })}>
              <option value="26">26"</option>
              <option value="27.5">27.5" (650b)</option>
              <option value="29">29" (700c)</option>
            </select>
          </div>
          <div className="field">
            <span className="lbl">Ancho neumático (mm)</span>
            <input className="input" type="number" min="20" max="120" value={form.tireWidthMm}
              onChange={(e) => update({ tireWidthMm: e.target.value })} style={{ width: 110 }} />
          </div>
          <div className="field">
            <span className="lbl">Override circunf. (mm)</span>
            <input className="input" type="number" placeholder={`calc: ${computedCirc}`}
              value={form.customCircumferenceMm ?? ''}
              onChange={(e) => update({ customCircumferenceMm: e.target.value })} style={{ width: 140 }} />
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-dim)' }}>
            efectiva: <b style={{ color: 'var(--forest)' }}>{computedCirc} mm</b>
          </div>
        </div>
      </section>

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Bielas</div>
        <div className="row gap" style={{ flexWrap: 'wrap' }}>
          <div className="field">
            <span className="lbl">Palanca (mm)</span>
            <input className="input" type="number" min="150" max="200" step="2.5" value={form.crankLengthMm}
              onChange={(e) => update({ crankLengthMm: e.target.value })} style={{ width: 110 }} />
          </div>
          <div className="field">
            <span className="lbl">Cadencia ref. (rpm)</span>
            <input className="input" type="number" min="40" max="140" value={form.referenceCadence}
              onChange={(e) => update({ referenceCadence: e.target.value })} style={{ width: 110 }} />
          </div>
        </div>
      </section>

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Plato/s</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {form.chainrings.map((c, i) => (
            <span key={i} className="row" style={{ gap: 4 }}>
              <input className="input" type="number" value={c} onChange={(e) => setChainring(i, e.target.value)} style={{ width: 80 }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>t</span>
              {form.chainrings.length > 1 && <button type="button" className="btn sm" onClick={() => removeChainring(i)}>×</button>}
            </span>
          ))}
          <button type="button" className="btn sm" onClick={addChainring}>+ plato</button>
        </div>
      </section>

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Cassette</div>
        <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <select className="input" onChange={(e) => { loadPreset(e.target.value); e.target.value = ''; }} defaultValue="" style={{ maxWidth: 260 }}>
            <option value="">— cargar preset —</option>
            {Object.keys(PRESET_CASSETTES).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{form.cassette.length} piñones</span>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {form.cassette.map((c, i) => (
            <span key={i} className="row" style={{ gap: 2 }}>
              <input className="input" type="number" value={c} onChange={(e) => setCog(i, e.target.value)} style={{ width: 64 }} />
              {form.cassette.length > 2 && <button type="button" className="btn sm" onClick={() => removeCog(i)} style={{ padding: '2px 6px' }}>×</button>}
            </span>
          ))}
          <button type="button" className="btn sm" onClick={addCog}>+ piñón</button>
        </div>
      </section>

      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <button type="submit" className="primary">Guardar specs</button>
        {savedAt && <span className="mono" style={{ color: 'var(--forest)', fontSize: 12, letterSpacing: '0.06em' }}>✓ guardado</span>}
      </div>
    </form>
  );
}
