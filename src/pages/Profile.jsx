import { useState, useMemo } from 'react';
import { useProfile, saveProfile, ageFromBirthDate } from '../store/useProfile.js';
import { useTrainings } from '../store/useTrainings.js';
import { computeFitness, levelLabel, formLabel } from '../lib/fitness.js';

export default function Profile() {
  const profile = useProfile();
  const trainings = useTrainings();
  const [form, setForm] = useState(profile);

  const fitness = useMemo(() => computeFitness(trainings, profile), [trainings, profile]);
  const fLevel = levelLabel(fitness.level);
  const fForm = formLabel(fitness.TSB);
  const age = ageFromBirthDate(form.birthDate);

  function save(e) {
    e.preventDefault();
    saveProfile({
      ...form,
      weightKg: Number(form.weightKg) || 0,
      heightCm: Number(form.heightCm) || 0,
      bikeWeightKg: Number(form.bikeWeightKg) || 0,
      ftpW: form.ftpW ? Number(form.ftpW) : null,
      CdA: Number(form.CdA) || 0.5,
      Crr: Number(form.Crr) || 0.005,
      drivetrainEfficiency: Number(form.drivetrainEfficiency) || 0.95,
      metabolicEfficiency: Number(form.metabolicEfficiency) || 0.24,
    });
  }

  return (
    <>
      <h2>Perfil</h2>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="label">Nivel actual</div>
          <div className="value">{fitness.level} <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>/ 100</span></div>
          <div className="sub">{fLevel}</div>
        </div>
        <div className="card stat">
          <div className="label">Forma (TSB)</div>
          <div className="value">
            <span className={`badge ${fForm.tone}`} style={{ fontSize: 16, padding: '4px 10px' }}>{fForm.label}</span>
          </div>
          <div className="sub">CTL {fitness.CTL.toFixed(1)} · ATL {fitness.ATL.toFixed(1)} · TSB {fitness.TSB.toFixed(1)}</div>
        </div>
        <div className="card stat">
          <div className="label">Tendencia 30 días</div>
          <div className="value"><FitnessSpark series={fitness.series.slice(-30)} /></div>
          <div className="sub">CTL = carga crónica · ATL = aguda</div>
        </div>
      </div>

      <form onSubmit={save} className="card" style={{ display: 'grid', gap: 14 }}>
        <h3 style={{ marginTop: 0 }}>Datos del ciclista</h3>
        <div className="row gap" style={{ flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 200px' }}>
            <div className="lbl">Nombre</div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            <div className="lbl">Fecha nacimiento</div>
            <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            {age != null && <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{age} años</div>}
          </label>
          <label>
            <div className="lbl">Sexo</div>
            <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="X">Otro</option>
            </select>
          </label>
          <label>
            <div className="lbl">Peso (kg)</div>
            <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} style={{ width: 100 }} />
          </label>
          <label>
            <div className="lbl">Altura (cm)</div>
            <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} style={{ width: 100 }} />
          </label>
        </div>

        <h3 style={{ marginBottom: 0 }}>Equipo</h3>
        <div className="row gap" style={{ flexWrap: 'wrap' }}>
          <label>
            <div className="lbl">Peso bici (kg)</div>
            <input type="number" step="0.1" value={form.bikeWeightKg} onChange={(e) => setForm({ ...form, bikeWeightKg: e.target.value })} style={{ width: 120 }} />
          </label>
          <label>
            <div className="lbl">FTP (W, opc.)</div>
            <input type="number" value={form.ftpW ?? ''} onChange={(e) => setForm({ ...form, ftpW: e.target.value })} style={{ width: 120 }} placeholder="si la conocés" />
          </label>
        </div>

        <details>
          <summary style={{ cursor: 'pointer', color: 'var(--text-dim)' }}>Parámetros avanzados (modelo físico)</summary>
          <div className="row gap" style={{ flexWrap: 'wrap', marginTop: 10 }}>
            <label>
              <div className="lbl">CdA (m²)</div>
              <input type="number" step="0.01" value={form.CdA} onChange={(e) => setForm({ ...form, CdA: e.target.value })} style={{ width: 110 }} />
            </label>
            <label>
              <div className="lbl">Crr (rodadura)</div>
              <input type="number" step="0.001" value={form.Crr} onChange={(e) => setForm({ ...form, Crr: e.target.value })} style={{ width: 110 }} />
            </label>
            <label>
              <div className="lbl">η transmisión</div>
              <input type="number" step="0.01" value={form.drivetrainEfficiency} onChange={(e) => setForm({ ...form, drivetrainEfficiency: e.target.value })} style={{ width: 110 }} />
            </label>
            <label>
              <div className="lbl">η metabólica</div>
              <input type="number" step="0.01" value={form.metabolicEfficiency} onChange={(e) => setForm({ ...form, metabolicEfficiency: e.target.value })} style={{ width: 110 }} />
            </label>
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 8 }}>
            Defaults: CdA 0.5 (postura MTB), Crr 0.005 (mixto), η pedal-rueda 0.95, η metabólica 0.24 (22-26% típico).
          </div>
        </details>

        <div>
          <button type="submit" className="primary">Guardar perfil</button>
        </div>
      </form>
    </>
  );
}

// Mini sparkline SVG de CTL en los últimos N días.
function FitnessSpark({ series }) {
  if (!series || series.length < 2) {
    return <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>sin datos</span>;
  }
  const w = 160, h = 50;
  const ctls = series.map((s) => s.CTL);
  const min = Math.min(...ctls), max = Math.max(...ctls);
  const span = Math.max(1, max - min);
  const path = ctls.map((c, i) => {
    const x = (i / (ctls.length - 1)) * w;
    const y = h - ((c - min) / span) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const trend = ctls[ctls.length - 1] - ctls[0];
  return (
    <svg width={w} height={h}>
      <path d={path} stroke={trend >= 0 ? 'var(--accent)' : 'var(--warn)'} strokeWidth="1.6" fill="none" />
    </svg>
  );
}
