import { useEffect, useState, useCallback } from 'react';
import { load, save, subscribe, uid } from './storage.js';
import { computeRouteStats } from '../lib/geo.js';

const KEY = 'routes';

export function getRoutes() {
  return load(KEY, []);
}

export function getRoute(id) {
  return getRoutes().find((r) => r.id === id) || null;
}

export function saveRoute(route) {
  const all = getRoutes();
  const idx = all.findIndex((r) => r.id === route.id);
  if (idx >= 0) all[idx] = route;
  else all.push(route);
  save(KEY, all);
  return route;
}

export function deleteRoute(id) {
  save(KEY, getRoutes().filter((r) => r.id !== id));
}

// Construir un objeto Route a partir del resultado de parseKmz...
export function buildRouteFromParsed(parsed, extras = {}) {
  const stats = computeRouteStats(parsed.points);
  return {
    id: uid('rt'),
    name: extras.name || parsed.name,
    importedAt: new Date().toISOString(),
    points: parsed.points,
    stats,
    notes: extras.notes || '',
    tags: extras.tags || [],
    type: extras.type || 'training',          // 'training' | 'trip'
    tripMeta: extras.tripMeta || null,        // { days, extraLoadKg } cuando type === 'trip'
  };
}

// Actualiza solo metadatos editables (name, type, tripMeta, notes, tags).
export function updateRouteMeta(id, patch) {
  const all = getRoutes();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch };
  save(KEY, all);
  return all[idx];
}

export function useRoutes() {
  const [routes, setRoutes] = useState(() => getRoutes());
  useEffect(() => subscribe((key) => { if (key === KEY) setRoutes(getRoutes()); }), []);
  const refresh = useCallback(() => setRoutes(getRoutes()), []);
  return { routes, refresh };
}
