// Atoms reusables: chips, stats, eyebrows, progress, sparklines, mini maps, etc.
// Compartidos por todas las páginas.

export function Chip({ tone = 'neutral', children, dot = false, style = {} }) {
  const cls = ['chip'];
  if (tone === 'ok') cls.push('ok');
  else if (tone === 'warn') cls.push('warn');
  else if (tone === 'danger') cls.push('danger');
  else if (tone === 'info') cls.push('info');
  else if (tone === 'solid') cls.push('solid');
  return (
    <span className={cls.join(' ')} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Tag({ children, style = {} }) {
  return <span className="tag" style={style}>{children}</span>;
}

export function Eyebrow({ children, style = {} }) {
  return <div className="eyebrow-rule" style={style}><span className="eyebrow">{children}</span></div>;
}

export function StatCard({ label, value, unit, sub, delta, deltaDir, corner }) {
  return (
    <div className="card stat">
      {corner && <div className="card-corner">{corner}</div>}
      <div className="label">{label}</div>
      <div className="value tnum">
        {value}{unit && <span className="u">{unit}</span>}
      </div>
      {sub && <div className="sub">{sub}</div>}
      {delta && <div className={`delta ${deltaDir || ''}`}>{delta}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = 'ok', thick = false }) {
  const t = tone === 'ok' ? '' : tone;
  const v = Math.max(0, Math.min(110, value));
  return (
    <div className={'pbar ' + t + (thick ? ' pbar-thick' : '')}>
      <span style={{ width: `${Math.min(100, v)}%` }} />
    </div>
  );
}

export function SectionHead({ kicker, title, action, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {kicker && <div className="eyebrow" style={{ marginBottom: 6 }}>{kicker}</div>}
      <div className="section-head">
        <div className="title">{title}</div>
        {action}
      </div>
    </div>
  );
}

// ---------- Topo background ----------
export function TopoBg({ opacity = 0.05, color = 'currentColor' }) {
  return (
    <svg className="topo-bg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style={{ opacity }}>
      <defs>
        <pattern id="topo-pat" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.6">
            <path d="M -20 200 C 40 140, 120 220, 200 180 S 320 220, 420 160" />
            <path d="M -20 220 C 40 160, 120 240, 200 200 S 320 240, 420 180" />
            <path d="M -20 240 C 40 180, 120 260, 200 220 S 320 260, 420 200" />
            <path d="M -20 260 C 40 200, 120 280, 200 240 S 320 280, 420 220" />
            <path d="M -20 280 C 40 220, 120 300, 200 260 S 320 300, 420 240" />
            <path d="M -20 300 C 40 240, 120 320, 200 280 S 320 320, 420 260" />
            <path d="M -20 100 C 60 60, 140 140, 220 80 S 340 140, 420 60" />
            <path d="M -20 120 C 60 80, 140 160, 220 100 S 340 160, 420 80" />
            <path d="M -20 140 C 60 100, 140 180, 220 120 S 340 180, 420 100" />
          </g>
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#topo-pat)" />
    </svg>
  );
}

// ---------- Sparkline (CTL/ATL fitness chart) ----------
// data: [{ tl, ATL, CTL }] — accessors pluggable.
export function Sparkline({
  data,
  height = 38,
  accent = 'var(--forest)',
  accent2 = 'var(--rust)',
  showBars = false,
  accessor = (d) => d.CTL,
  accessor2 = (d) => d.ATL,
}) {
  if (!data || data.length < 2) return null;
  const w = 100;
  const h = 100;
  const max = Math.max(...data.map(accessor)) * 1.05 || 1;
  const x = (i) => (i / (data.length - 1)) * w;
  const y = (v) => h - (v / max) * h;
  const path1 = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(accessor(d)).toFixed(2)}`).join(' ');
  const path2 = accessor2
    ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(accessor2(d)).toFixed(2)}`).join(' ')
    : null;
  return (
    <svg viewBox={`0 -2 ${w} ${h + 4}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {showBars && data.map((d, i) => (d.tl > 0 ? (
        <rect key={i} x={x(i) - 0.3} y={y(d.tl)} width="0.6" height={h - y(d.tl)} fill="var(--ink-dim)" opacity="0.45" />
      ) : null))}
      {path2 && <path d={path2} fill="none" stroke={accent2} strokeWidth="0.8" opacity="0.7" strokeDasharray="1.5 1.2" />}
      <path d={path1} fill="none" stroke={accent} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Fitness ring (CTL → /100) ----------
export function FitnessRing({ level, size = 120 }) {
  const r = 48;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, level)) / 100;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <pattern id="ring-stripe" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="6" fill="var(--forest)" opacity="0.18" />
        </pattern>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--paper-3)" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#ring-stripe)" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--forest)"
        strokeWidth="10"
        strokeLinecap="butt"
        strokeDasharray={`${C * pct} ${C}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {[0.25, 0.5, 0.75].map((p) => {
        const a = -Math.PI / 2 + p * 2 * Math.PI;
        const x1 = cx + (r - 7) * Math.cos(a);
        const y1 = cy + (r - 7) * Math.sin(a);
        const x2 = cx + (r + 7) * Math.cos(a);
        const y2 = cy + (r + 7) * Math.sin(a);
        return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-dim)" strokeWidth="0.6" />;
      })}
      <text x={cx} y={cy + 5} textAnchor="middle" fontFamily="Newsreader" fontStyle="italic" fontSize="14" fill="var(--ink-dim)">nivel</text>
    </svg>
  );
}

// ---------- Compass (decorative for map overlays) ----------
export function Compass({ size = 44 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} style={{ position: 'absolute', top: 12, right: 12, opacity: 0.85 }}>
      <circle cx="24" cy="24" r="20" fill="rgba(245,240,230,0.92)" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.6">
        <line x1="24" y1="4" x2="24" y2="44" />
        <line x1="4" y1="24" x2="44" y2="24" />
      </g>
      <polygon points="24,6 27,24 24,22 21,24" fill="var(--rust)" />
      <polygon points="24,42 27,24 24,26 21,24" fill="var(--forest)" />
      <text x="24" y="10" textAnchor="middle" fontSize="6.5" fontFamily="JetBrains Mono" fill="currentColor">N</text>
    </svg>
  );
}

// ---------- Mini route SVG preview (used in cards) ----------
// `points` come from the real route shape: { lat, lon, ele }.
export function MiniRoute({ points, height = 110, width = 280, color = 'var(--forest)' }) {
  if (!points || points.length < 2) {
    return <div style={{ width: '100%', height, background: 'var(--paper-2)' }} />;
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padX = (maxLng - minLng) * 0.10 || 0.005;
  const padY = (maxLat - minLat) * 0.10 || 0.005;
  const lo = { lat: minLat - padY, lng: minLng - padX };
  const hi = { lat: maxLat + padY, lng: maxLng + padX };
  const project = (p) => ({
    x: ((p.lon - lo.lng) / (hi.lng - lo.lng)) * width,
    y: height - ((p.lat - lo.lat) / (hi.lat - lo.lat)) * height,
  });
  const path = points
    .map((p, i) => {
      const xy = project(p);
      return `${i === 0 ? 'M' : 'L'} ${xy.x.toFixed(1)} ${xy.y.toFixed(1)}`;
    })
    .join(' ');
  const id = `mg-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="mini-route" style={{ width: '100%', height }}>
      <defs>
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.80 0.020 70)" strokeWidth="0.4" opacity="0.5" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="oklch(0.92 0.018 75)" />
      <rect width={width} height={height} fill={`url(#${id})`} />
      {[0.2, 0.4, 0.6, 0.8].map((p, i) => (
        <ellipse key={i} cx={width * 0.5} cy={height * 0.5} rx={width * (p * 0.55)} ry={height * (p * 0.45)} fill="none" stroke="oklch(0.62 0.05 100)" strokeWidth="0.3" opacity="0.35" />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Fitness/form helpers (small) ----------
export function levelLabelEs(l) {
  if (l < 10) return 'sin actividad';
  if (l < 25) return 'principiante';
  if (l < 45) return 'recreativo';
  if (l < 65) return 'intermedio';
  if (l < 85) return 'avanzado';
  return 'experto';
}

export function fmtRelDays(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Math.round((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'ayer';
  if (diff < 7) return `hace ${diff}d`;
  if (diff < 30) return `hace ${Math.round(diff / 7)}sem`;
  if (diff < 365) return `hace ${Math.round(diff / 30)}m`;
  return `hace ${Math.round(diff / 365)}a`;
}

export function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
