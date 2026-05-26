import { useEffect, useState } from 'react';
import { load, save, subscribe } from './storage.js';

const KEY = 'preferences';

const DEFAULT = {
  accent: 'moss',         // moss | rust | cobalt | ink
  density: 'comfortable', // comfortable | compact
  showTopo: true,
};

const ACCENT_MAP = {
  moss:   { forest: 'oklch(0.395 0.075 145)', forest2: 'oklch(0.560 0.080 138)' },
  rust:   { forest: 'oklch(0.490 0.130 35)',  forest2: 'oklch(0.620 0.130 40)'  },
  cobalt: { forest: 'oklch(0.460 0.110 240)', forest2: 'oklch(0.600 0.110 240)' },
  ink:    { forest: 'oklch(0.225 0.018 60)',  forest2: 'oklch(0.400 0.020 60)'  },
};

export function getPreferences() {
  return { ...DEFAULT, ...load(KEY, {}) };
}

export function savePreferences(patch) {
  const merged = { ...getPreferences(), ...patch };
  save(KEY, merged);
  return merged;
}

export function usePreferences() {
  const [p, setP] = useState(() => getPreferences());
  useEffect(() => subscribe((k) => { if (k === KEY) setP(getPreferences()); }), []);
  return p;
}

// Aplica las preferencias al :root del documento. Llamar desde App.
export function applyPreferences(prefs) {
  const root = document.documentElement.style;
  const a = ACCENT_MAP[prefs.accent] || ACCENT_MAP.moss;
  root.setProperty('--forest',   a.forest);
  root.setProperty('--forest-2', a.forest2);

  if (prefs.density === 'compact') {
    root.setProperty('--pad-page', '22px');
    root.setProperty('--pad-card', '16px');
  } else {
    root.setProperty('--pad-page', '32px');
    root.setProperty('--pad-card', '20px');
  }

  root.setProperty('--topo-opacity', prefs.showTopo ? '0.05' : '0');
}
