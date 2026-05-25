import { useMemo, useRef, useState, useEffect } from 'react';

// Perfil de altura SVG simple, sin librerías. Hover -> callback con el índice del punto.
export default function ElevationProfile({ points, cumDist, onHover }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const h = 180;
  const padL = 40, padR = 12, padT = 12, padB = 24;

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

    const points2d = points.map((p, i) => {
      const x = padL + (cumDist[i] / totalDist) * innerW;
      const y = padT + innerH - ((p.ele - minE) / Math.max(1, maxE - minE)) * innerH;
      return [x, y];
    });

    const linePath = points2d.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(' ');
    const areaPath = linePath + ` L${points2d[points2d.length - 1][0]},${padT + innerH} L${points2d[0][0]},${padT + innerH} Z`;
    return { minE, maxE, totalDist, innerW, innerH, points2d, linePath, areaPath };
  }, [points, cumDist, w]);

  function onMove(e) {
    if (!data || !onHover) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - padL) / data.innerW;
    if (ratio < 0 || ratio > 1) { onHover(null); return; }
    const targetD = ratio * data.totalDist;
    // búsqueda binaria
    let lo = 0, hi = cumDist.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumDist[mid] < targetD) lo = mid + 1; else hi = mid;
    }
    onHover(lo);
  }

  if (!data) return <div className="elev-profile">Datos insuficientes para el perfil.</div>;

  // Ticks Y
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const e = data.minE + (i / yTicks) * (data.maxE - data.minE);
    const y = padT + data.innerH - (i / yTicks) * data.innerH;
    return { y, label: Math.round(e) };
  });
  // Ticks X (km)
  const totalKm = data.totalDist / 1000;
  const step = totalKm > 50 ? 10 : totalKm > 20 ? 5 : totalKm > 5 ? 1 : 0.5;
  const xLabels = [];
  for (let km = 0; km <= totalKm + 0.001; km += step) {
    const x = padL + ((km * 1000) / data.totalDist) * data.innerW;
    xLabels.push({ x, label: km });
  }

  return (
    <div className="elev-profile" ref={ref} onMouseLeave={() => onHover?.(null)} onMouseMove={onMove}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {yLabels.map((t, i) => (
          <g key={'y' + i}>
            <line x1={padL} x2={w - padR} y1={t.y} y2={t.y} stroke="#2a3140" strokeDasharray="2 4" />
            <text x={padL - 6} y={t.y + 3} fontSize="10" fill="#9aa4b2" textAnchor="end">{t.label}</text>
          </g>
        ))}
        {xLabels.map((t, i) => (
          <text key={'x' + i} x={t.x} y={h - 6} fontSize="10" fill="#9aa4b2" textAnchor="middle">
            {t.label}km
          </text>
        ))}
        <path d={data.areaPath} fill="#4ade8033" />
        <path d={data.linePath} fill="none" stroke="#4ade80" strokeWidth="1.8" />
      </svg>
    </div>
  );
}
