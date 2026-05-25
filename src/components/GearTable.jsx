import { useMemo, useState } from 'react';
import { useBikeSpec } from '../store/useBikeSpec.js';
import { gearTable, gearSummary, fmtDev, fmtSpeed } from '../lib/gearing.js';

// Métricas seleccionables para visualizar en la tabla / barra.
const METRICS = [
  { id: 'development_m', label: 'Desarrollo (m)', fmt: fmtDev },
  { id: 'speed_kmh',     label: `Velocidad (km/h)`, fmt: fmtSpeed },
  { id: 'ratio',         label: 'Ratio',         fmt: (v) => v.toFixed(2) },
  { id: 'gainRatio',     label: 'Gain ratio',    fmt: (v) => v.toFixed(2) },
];

export default function GearTable() {
  const spec = useBikeSpec();
  const [metricId, setMetricId] = useState('development_m');
  const table = useMemo(() => gearTable(spec), [spec]);
  const summary = useMemo(() => gearSummary(table), [table]);

  if (!table.rows.length) {
    return <div className="empty">Cargá los platos y el cassette en Specs para ver desarrollos.</div>;
  }

  const metric = METRICS.find((m) => m.id === metricId);

  // Datos para la barra coloreada (todas las marchas ordenadas por desarrollo).
  const sortedByDev = [...table.rows].sort((a, b) => a.development_m - b.development_m);
  const maxDev = sortedByDev[sortedByDev.length - 1].development_m;

  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="label">Circunferencia</div>
          <div className="value">{Math.round(table.circ_mm)} mm</div>
          <div className="sub">{table.circ_m.toFixed(3)} m por vuelta de rueda</div>
        </div>
        <div className="card stat">
          <div className="label">Desarrollo</div>
          <div className="value">{fmtDev(summary.minDev.development_m)} – {fmtDev(summary.maxDev.development_m)}</div>
          <div className="sub">
            min: {summary.minDev.chainring}×{summary.minDev.cog} ·
            max: {summary.maxDev.chainring}×{summary.maxDev.cog} ·
            rango {summary.rangePct.toFixed(0)}%
          </div>
        </div>
        <div className="card stat">
          <div className="label">Velocidad a {table.cadence} rpm</div>
          <div className="value">{fmtSpeed(summary.minDev.speed_kmh)} – {fmtSpeed(summary.maxDev.speed_kmh)}</div>
          <div className="sub">cambiá la cadencia en Specs para recalcular</div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12, gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Métrica:</span>
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={metricId === m.id ? 'primary' : ''}
            onClick={() => setMetricId(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="gear-table">
          <thead>
            <tr>
              <th>Plato \ Piñón</th>
              {spec.cassette.map((c) => <th key={c}>{c}T</th>)}
            </tr>
          </thead>
          <tbody>
            {spec.chainrings.map((chainring) => (
              <tr key={chainring}>
                <th>{chainring}T</th>
                {spec.cassette.map((cog) => {
                  const row = table.rows.find((r) => r.chainring === chainring && r.cog === cog);
                  const val = row?.[metricId];
                  // Heat color: pequeño = azul, grande = rojo (lerp).
                  const t = row ? row.development_m / maxDev : 0;
                  const bg = heatColor(t);
                  return (
                    <td key={cog} style={{ background: bg }} title={`${chainring}×${cog} · ratio ${row.ratio.toFixed(2)} · ${fmtDev(row.development_m)} · ${fmtSpeed(row.speed_kmh)}`}>
                      {metric.fmt(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="section-title" style={{ marginTop: 24 }}>Distribución de marchas (ordenadas por desarrollo)</h3>
      <div className="card">
        <div className="gear-bar">
          {sortedByDev.map((r, i) => {
            const pct = (r.development_m / maxDev) * 100;
            return (
              <div key={i} className="gear-bar-row" title={`${r.chainring}×${r.cog} · ${fmtDev(r.development_m)} · ${fmtSpeed(r.speed_kmh)}`}>
                <span className="gear-bar-label">{r.chainring}×{r.cog}</span>
                <div className="gear-bar-track">
                  <div className="gear-bar-fill" style={{ width: pct + '%', background: heatColor(r.development_m / maxDev) }} />
                </div>
                <span className="gear-bar-val">{fmtDev(r.development_m)} · {fmtSpeed(r.speed_kmh)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 12 }}>
        💡 <b>Gain ratio</b> (Sheldon Brown): ratio × (radio rueda / longitud palanca). Adimensional, sirve para comparar bicis con
        rodados o palancas distintas. <b>Desarrollo</b> son los metros que avanzás por cada pedalada completa.
      </div>
    </>
  );
}

// Verde → amarillo → naranja → rojo
function heatColor(t) {
  // t en [0..1]; opacidad uniforme baja para que no tape el texto.
  const stops = [
    { t: 0.0, c: [56, 189, 248] },   // sky
    { t: 0.33, c: [74, 222, 128] },  // green
    { t: 0.66, c: [245, 158, 11] },  // amber
    { t: 1.0, c: [239, 68, 68] },    // red
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const lerp = (x, y, k) => Math.round(x + (y - x) * k);
  const k = (t - a.t) / Math.max(0.0001, b.t - a.t);
  const r = lerp(a.c[0], b.c[0], k);
  const g = lerp(a.c[1], b.c[1], k);
  const bl = lerp(a.c[2], b.c[2], k);
  return `rgba(${r}, ${g}, ${bl}, 0.22)`;
}
