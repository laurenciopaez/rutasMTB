import { useState, useMemo } from 'react';
import { useProfile, saveProfile, ageFromBirthDate } from '../store/useProfile.js';
import { useTrainings } from '../store/useTrainings.js';
import { computeFitness, levelLabel, formLabel } from '../lib/fitness.js';
import {
  Chip, Sparkline, TopoBg, SectionHead, ProgressBar,
} from '../components/atoms.jsx';

export default function Profile() {
  const profile = useProfile();
  const trainings = useTrainings();
  const [form, setForm] = useState(profile);
  const [savedAt, setSavedAt] = useState(null);

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
    setSavedAt(Date.now());
  }

  return (
    <div className="page-inner">
      <TopoBg />
      <div style={{ position: 'relative' }}>
        <div className="page-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>05 · Datos del ciclista</div>
            <div className="title">Perfil<em>.</em></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              Estos datos alimentan el modelo de calorías y la estimación de dificultad de cada ruta.
            </div>
          </div>
          <button type="submit" form="profile-form" className="primary">Guardar perfil</button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
          <div className="card" style={{ padding: 26 }}>
            <div className="eyebrow-rule"><span className="eyebrow">Carnet del ciclista</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 22, alignItems: 'center' }}>
              <Portrait />
              <div>
                <div className="display" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                  {profile.name || '—'}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                  {age != null ? `${age} años` : 'edad sin cargar'}
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip tone="ok" dot>{fLevel}</Chip>
                  <Chip tone="info">Nivel {fitness.level}/100</Chip>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Chip tone={fForm.tone}>Forma: {fForm.label}</Chip>
                </div>
              </div>
            </div>

            <hr className="dash" />

            <form id="profile-form" onSubmit={save} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Nombre">
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Fecha de nacimiento">
                  <input className="input" type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                </Field>
                <Field label="Sexo">
                  <select className="input" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="X">Otro</option>
                  </select>
                </Field>
                <Field label="Peso del ciclista (kg)">
                  <input className="input" type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
                </Field>
                <Field label="Altura (cm)">
                  <input className="input" type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
                </Field>
                <Field label="Peso de la bici (kg)">
                  <input className="input" type="number" step="0.1" value={form.bikeWeightKg} onChange={(e) => setForm({ ...form, bikeWeightKg: e.target.value })} />
                </Field>
                <Field label="FTP (W, opc.)">
                  <input className="input" type="number" value={form.ftpW ?? ''} placeholder="si la conocés" onChange={(e) => setForm({ ...form, ftpW: e.target.value })} />
                </Field>
              </div>
              {savedAt && (
                <div className="mono" style={{ color: 'var(--forest)', fontSize: 12, letterSpacing: '0.06em' }}>
                  ✓ guardado
                </div>
              )}
            </form>
          </div>

          <div className="card flat" style={{ padding: 26 }}>
            <div className="eyebrow-rule"><span className="eyebrow">Modelo físico · coeficientes</span></div>
            <div className="display-it" style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 18, maxWidth: 480 }}>
              Estos coeficientes se usan en el cálculo de calorías: rodadura + aerodinámica + gravedad + viento proyectado al bearing de la ruta.
            </div>

            <Coef
              label="CdA · coef. aerodinámico × área frontal"
              value={form.CdA} unit="m²" step="0.01"
              hint="típico MTB: 0.40 – 0.55"
              onChange={(v) => setForm({ ...form, CdA: v })}
              form="profile-form"
            />
            <Coef
              label="Crr · coef. de rodadura"
              value={form.Crr} unit="" step="0.001"
              hint="típico ripio: 0.008 – 0.018"
              onChange={(v) => setForm({ ...form, Crr: v })}
              form="profile-form"
            />
            <Coef
              label="η drivetrain"
              value={form.drivetrainEfficiency} unit="" step="0.01"
              hint="0.94 – 0.98"
              onChange={(v) => setForm({ ...form, drivetrainEfficiency: v })}
              form="profile-form"
            />
            <Coef
              label="η metabólica"
              value={form.metabolicEfficiency} unit="" step="0.01"
              hint="0.22 – 0.26"
              onChange={(v) => setForm({ ...form, metabolicEfficiency: v })}
              form="profile-form"
            />

            <hr className="dash" />

            <div className="eyebrow" style={{ marginBottom: 10 }}>Tendencia CTL · últimos 30 días</div>
            {fitness.series.length >= 2 ? (
              <div style={{ height: 60 }}>
                <Sparkline data={fitness.series.slice(-30)} height={60} />
              </div>
            ) : (
              <div className="display-it" style={{ color: 'var(--ink-dim)', fontSize: 13 }}>
                Cargá algunos entrenamientos para ver tu evolución.
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 26, gridColumn: '1 / -1' }}>
            <div className="eyebrow-rule"><span className="eyebrow">Bitácora · resumen mensual</span></div>
            <ActivityLedger trainings={trainings} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

function Coef({ label, value, unit, step = '0.01', hint, onChange, form }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--rule)' }}>
      <div>
        <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div className="display-it" style={{ fontSize: 11.5, color: 'var(--ink-dim)' }}>{hint}</div>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          form={form}
          className="input"
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingRight: unit ? 36 : 12 }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: 10, top: 9, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-dim)', pointerEvents: 'none' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityLedger({ trainings }) {
  if (trainings.length === 0) {
    return <div className="display-it" style={{ color: 'var(--ink-dim)', fontSize: 13 }}>Sin entrenamientos aún.</div>;
  }
  const byMonth = new Map();
  for (const t of trainings) {
    const k = t.date.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, { dist: 0, gain: 0, count: 0, mins: 0 });
    const m = byMonth.get(k);
    m.dist += t.distance_m;
    m.gain += t.gain_m;
    m.count++;
    m.mins += t.duration_min || 0;
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const maxDist = Math.max(...months.map(([, v]) => v.dist), 1);

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px 80px 110px 110px 1fr 100px',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div className="eyebrow" style={{ fontSize: 9 }}>Mes</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Salidas</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Distancia</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Desnivel +</div>
        <div className="eyebrow" style={{ fontSize: 9 }}>Volumen relativo</div>
        <div className="eyebrow" style={{ fontSize: 9, textAlign: 'right' }}>Tiempo</div>
      </div>
      {months.map(([k, v]) => {
        const w = (v.dist / maxDist) * 100;
        const date = new Date(k + '-01T12:00:00');
        return (
          <div key={k} style={{
            display: 'grid',
            gridTemplateColumns: '140px 80px 110px 110px 1fr 100px',
            gap: 16,
            padding: '14px 0',
            alignItems: 'center',
            borderBottom: '1px dashed var(--rule)',
          }}>
            <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>
              {date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </div>
            <div className="mono tnum" style={{ fontSize: 13 }}>{v.count}</div>
            <div className="mono tnum" style={{ fontSize: 13 }}>
              {(v.dist/1000).toFixed(0)}<span style={{ color: 'var(--ink-dim)', marginLeft: 4 }}>km</span>
            </div>
            <div className="mono tnum" style={{ fontSize: 13 }}>
              +{Math.round(v.gain)}<span style={{ color: 'var(--ink-dim)', marginLeft: 4 }}>m</span>
            </div>
            <ProgressBar value={w} />
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-dim)', textAlign: 'right' }}>
              {Math.floor(v.mins/60)}h {v.mins % 60}m
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Portrait() {
  return (
    <svg viewBox="0 0 110 130" width="110" height="130">
      <rect x="2" y="2" width="106" height="126" fill="oklch(0.91 0.018 75)" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 2" />
      <rect x="6" y="6" width="98" height="118" fill="oklch(0.94 0.012 80)" stroke="var(--rule)" strokeWidth="0.6" />
      <g stroke="var(--forest)" strokeWidth="1.4" fill="none">
        <path d="M 18 88 L 36 56 L 50 78 L 62 60 L 84 88 Z" />
        <path d="M 36 56 L 42 64 L 48 60" />
      </g>
      <text x="55" y="112" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill="var(--ink-2)" letterSpacing="0.2em">
        RutasMTB
      </text>
    </svg>
  );
}
