import { useMemo, useState } from 'react';
import { useBikeSpec } from '../store/useBikeSpec.js';
import { gearTable, gearSummary, fmtDev, fmtSpeed } from '../lib/gearing.js';
import { StatCard, SectionHead } from './atoms.jsx';

const METRICS = [
  { id: 'development_m', label: 'Desarrollo (m)', fmt: (v) => v.toFixed(2), unit: 'm' },
  { id: 'speed_kmh',     label: 'Velocidad',      fmt: (v) => v.toFixed(1), unit: 'km/h' },
  { id: 'ratio',         label: 'Ratio',          fmt: (v) => v.toFixed(2), unit: '' },
  { id: 'gainRatio',     label: 'Gain ratio',     fmt: (v) => v.toFixed(2), unit: '' },
];

export default function GearTable() {
  const spec = useBikeSpec();
  const [metricId, setMetricId] = useState('development_m');
  const table = useMemo(() => gearTable(spec), [spec]);
  const summary = useMemo(() => gearSummary(table), [table]);

  if (!table.rows.length) {
    return <div className="empty">Cargá platos y cassette en Specs para ver desarrollos.</div>;
  }

  const metric = METRICS.find((m) => m.id === metricId);
  const sortedByDev = [...table.rows].sort((a, b) => a.development_m - b.development_m);
  const maxDev = sortedByDev[sortedByDev.length - 1].development_m;

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          label="Configuración"
          value={`${spec.chainrings.length}×${spec.cassette.length}`}
          corner="A"
          sub={`${spec.chainrings.join(' · ')} t plato`}
        />
        <StatCard
          label="Cassette"
          value={`${spec.cassette[0]}–${spec.cassette[spec.cassette.length - 1]}t`}
          corner="B"
          sub={`${spec.cassette.length} piñones`}
        />
        <StatCard
          label="Más corto"
          value={fmtDev(summary.minDev.development_m).replace(' m', '')}
          unit="m"
          corner="C"
          sub={`${summary.minDev.chainring}×${summary.minDev.cog} · ${fmtSpeed(summary.minDev.speed_kmh)} @ ${table.cadence}rpm`}
        />
        <StatCard
          label="Más largo"
          value={fmtDev(summary.maxDev.development_m).replace(' m', '')}
          unit="m"
          corner="D"
          sub={`${summary.maxDev.chainring}×${summary.maxDev.cog} · ${fmtSpeed(summary.maxDev.speed_kmh)} · rango ${summary.rangePct.toFixed(0)}%`}
        />
      </div>

      <div className="row" style={{ marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <div className="eyebrow">Métrica</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {METRICS.map((m) => (
            <button
              key={m.id}
              className={'btn sm ' + (metricId === m.id ? 'primary' : '')}
              onClick={() => setMetricId(m.id)}
            >{m.label}</button>
          ))}
        </div>
        <div className="spacer" />
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>
          circunferencia {Math.round(table.circ_mm)} mm · palanca {table.crank_mm} mm · ref {table.cadence} rpm
        </span>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 28, overflowX: 'auto' }}>
        <table className="gear-table">
          <thead>
            <tr>
              <th>plato \ piñón</th>
              {spec.cassette.map((cog) => <th key={cog}>{cog}t</th>)}
            </tr>
          </thead>
          <tbody>
            {spec.chainrings.map((chainring) => (
              <tr key={chainring}>
                <th>{chainring}t</th>
                {spec.cassette.map((cog) => {
                  const row = table.rows.find((r) => r.chainring === chainring && r.cog === cog);
                  if (!row) return <td key={cog} />;
                  const val = row[metricId];
                  const bg = heat(row.development_m / maxDev);
                  return (
                    <td
                      key={cog}
                      className="cell"
                      style={{ background: bg }}
                      title={`${chainring}×${cog} · ratio ${row.ratio.toFixed(2)} · ${fmtDev(row.development_m)} · ${fmtSpeed(row.speed_kmh)}`}
                    >
                      <div className="v">
                        {metric.fmt(val)}
                        {metric.unit && <span style={{ color: 'var(--ink-dim)', fontSize: 9, marginLeft: 3 }}>{metric.unit}</span>}
                      </div>
                      <div className="ratio">{row.ratio.toFixed(2)}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHead kicker={`${sortedByDev.length} marchas ordenadas por desarrollo`} title="Rango y overlap" />
      <div className="card" style={{ padding: 22 }}>
        <div className="gear-bar">
          {sortedByDev.map((r, i) => {
            const pct = (r.development_m / maxDev) * 100;
            return (
              <div key={i} className="gear-bar-row" title={`${r.chainring}×${r.cog}`}>
                <span className="gear-bar-label">{r.chainring}×{r.cog}t</span>
                <div className="gear-bar-track">
                  <div className="gear-bar-fill" style={{ width: `${pct}%`, background: heat(r.development_m / maxDev) }} />
                </div>
                <span className="gear-bar-val">{r.development_m.toFixed(2)} m · {r.speed_kmh.toFixed(1)} km/h</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="display-it" style={{ color: 'var(--ink-dim)', fontSize: 12, marginTop: 12 }}>
        Gain ratio (Sheldon Brown): ratio × (radio rueda / palanca). Adimensional — sirve para comparar bicis con rodados o palancas distintas.
      </div>
    </>
  );
}

// Heat oklch: verde grave → ochre → rust agudo, opacidad baja para no tapar texto.
function heat(t) {
  const tt = Math.max(0, Math.min(1, t));
  return `oklch(${0.86 - tt * 0.06} ${0.04 + tt * 0.10} ${145 - tt * 110} / 0.35)`;
}
