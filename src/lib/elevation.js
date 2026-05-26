// Elevation helpers: densify a chain of waypoints and fetch ground elevation
// from Open-Meteo (free, no API key, CORS-friendly).
//
// Open-Meteo Elevation API:
//   https://api.open-meteo.com/v1/elevation?latitude=a,b&longitude=x,y
//   -> { elevation: [m1, m2, ...] }
// Tope práctico por request: 100 puntos.

import { haversine } from './geo.js';

const BATCH = 100;

// Densifica un polyline (waypoints) interpolando puntos cada `stepMeters`.
// Devuelve [{ lat, lon }] incluyendo siempre el primer y último vértice de cada tramo.
export function densify(waypoints, stepMeters = 60) {
  if (!waypoints || waypoints.length < 2) return waypoints?.slice() || [];
  const out = [{ lat: waypoints[0].lat, lon: waypoints[0].lon }];
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const dist = haversine(a, b);
    const n = Math.max(1, Math.ceil(dist / stepMeters));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lon: a.lon + (b.lon - a.lon) * t,
      });
    }
  }
  return out;
}

// Pide elevación a Open-Meteo en lotes. Devuelve un array paralelo de números (en metros).
// Si la API falla, devuelve null y deja que el caller decida (e.g. ele=0).
export async function fetchElevations(points, { signal } = {}) {
  if (!points || points.length === 0) return [];
  const out = new Array(points.length);
  for (let i = 0; i < points.length; i += BATCH) {
    const slice = points.slice(i, i + BATCH);
    const lats = slice.map((p) => p.lat.toFixed(5)).join(',');
    const lons = slice.map((p) => p.lon.toFixed(5)).join(',');
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Open-Meteo elevation HTTP ${res.status}`);
    const json = await res.json();
    const eles = Array.isArray(json.elevation) ? json.elevation : [];
    for (let k = 0; k < slice.length; k++) {
      out[i + k] = Number.isFinite(eles[k]) ? eles[k] : 0;
    }
  }
  return out;
}

// Helper combinado: dado waypoints (clicks), devuelve points densificados con ele.
export async function buildPointsWithElevation(waypoints, opts = {}) {
  const dense = densify(waypoints, opts.stepMeters || 60);
  const eles = await fetchElevations(dense, { signal: opts.signal });
  return dense.map((p, i) => ({ lat: p.lat, lon: p.lon, ele: eles[i] || 0 }));
}
