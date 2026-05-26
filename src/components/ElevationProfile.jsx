import { useMemo, useRef, useState, useEffect } from 'react';

// Perfil de altura SVG con relleno gradiente, grid punteada, ticks mono.
export default function ElevationProfile({ points, cumDist, onHover }) {
  const ref = useRef(null);
  const [w, setW] = useState(800);
  const h = 200;
  const padL = 40, padR = 14, padT = 12, padB = 28;

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    if (!points || points.length < 2) return null;
    const eles = points.map((p) => p.ele ?? 0);
    const minE = Math.min(...eles);
    const maxE = Math.max(...eles);
    const totalDist = cumDist[cumDist.length - 1] || 1;
    const innerW = Math.max(50, w - padL - padR);
    const innerH = h - padT - padB;

    const pts2d = points.map((p, i) => {
      const x = padL + (cumDist[i] / totalDist) * innerW;
      const y = padT + innerH - ((p.ele - minE) / Math.max(1, maxE - minE)) * innerH;
      return [x, y];
    });

    const linePath = pts2d.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(' ');
    const areaPath = linePath + ` L${pts2d[pts2d.length - 1][0]},${padT + innerH} L${pts2d[0][0]},${padT + innerH} Z`;
    return { minE, maxE, totalDist, innerW, innerH, pts2d, linePath, areaPath };
  }, [points, cumDist, w]);

  function onMove(e) {
    if (!data || !onHover) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - padL) / data.innerW;
    if (ratio < 0 || ratio > 1) { onHover(null); return; }
    const targetD = ratio * data.totalDist;
    let lo = 0, hi = cumDist.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumDist[mid] < targetD) lo = mid + 1; else hi = mid;
    }
    onHover(lo);
  }

  if (!data) {
    return <div className="elev-profile">Datos insuficientes para el perfil.</div>;
  }

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const e = data.minE + (i / yTicks) * (data.maxE - data.minE);
    const y = padT + data.innerH - (i / yTicks) * data.innerH;
    return { y, label: Math.round(e) };
  });
  const totalKm = data.totalDist / 1000;
  const step = totalKm > 50 ? 10 : totalKm > 20 ? 5 : totalKm > 5 ? 1 : 0.5;
  const xLabels = [];
  for (let km = 0; km <= totalKm + 0.001; km += step) {
    const x = padL + ((km * 1000) / data.totalDist) * data.innerW;
    xLabels.push({ x, label: km });
  }

  return (
    <div className="elev-profile" ref={ref} onMouseLeave={() => onHover?.(null)} onMouseMove={onMove}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="eyebrow">Perfil de altura</div>
        <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>
          mín {data.minE.toFixed(0)}m · máx {data.maxE.toFixed(0)}m · Δ {Math.round(data.maxE - data.minE)}m
        </div>
      </div>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--forest)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--forest)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {yLabels.map((t, i) => (
          <g key={'y' + i}>
            <line x1={padL} x2={w - padR} y1={t.y} y2={t.y} stroke="var(--rule)" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.6" />
            <text x={padL - 6} y={t.y + 3} fontSize="10" fontFamily="JetBrains Mono" fill="var(--ink-dim)" textAnchor="end">{t.label}m</text>
          </g>
        ))}
        {xLabels.map((t, i) => (
          <g key={'x' + i}>
            <line x1={t.x} y1={padT} x2={t.x} y2={h - padB} stroke="var(--rule)" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.4" />
            <text x={t.x} y={h - 8} fontSize="10" fontFamily="JetBrains Mono" fill="var(--ink-dim)" textAnchor="middle">{t.label} km</text>
          </g>
        ))}
        <path d={data.areaPath} fill="url(#elev-fill)" />
        <path d={data.linePath} fill="none" stroke="var(--forest)" strokeWidth="1.4" />
        <line x1={padL} y1={padT + data.innerH} x2={w - padR} y2={padT + data.innerH} stroke="var(--ink-dim)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
