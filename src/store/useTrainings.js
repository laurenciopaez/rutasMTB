// Entrenamientos: una entrada es un día/sesión donde se hizo (parte de) una ruta.
// Por ahora solo guarda { id, date, routeId, distance_m, gain_m, loss_m, duration_min, notes }.
// En Fase 3 le agregamos viento, calorías y nivel.

import { useEffect, useState } from 'react';
import { load, save, subscribe, uid } from './storage.js';
import { getRoute } from './useRoutes.js';

const KEY = 'trainings';

export function getTrainings() { return load(KEY, []); }
export function saveTraining(t) {
  const all = getTrainings();
  const idx = all.findIndex((x) => x.id === t.id);
  if (idx >= 0) all[idx] = t; else all.push(t);
  save(KEY, all);
}
export function deleteTraining(id) { save(KEY, getTrainings().filter((t) => t.id !== id)); }

export function newTraining({
  routeId, date, partialKm, durationMin, notes,
  windSpeedKmh = null, windDirDeg = null, extraLoadKg = 0, perceivedExertion = null,
}) {
  const route = getRoute(routeId);
  if (!route) throw new Error('Ruta no encontrada');
  const totalKm = route.stats.distance_m / 1000;
  const ratio = partialKm && partialKm < totalKm ? partialKm / totalKm : 1;
  return {
    id: uid('tr'),
    date: date || new Date().toISOString().slice(0, 10),
    routeId,
    routeName: route.name,
    distance_m: Math.round(route.stats.distance_m * ratio),
    gain_m: Math.round(route.stats.gain_m * ratio),
    loss_m: Math.round(route.stats.loss_m * ratio),
    duration_min: durationMin || null,
    wind_speed_kmh: windSpeedKmh,
    wind_dir_deg: windDirDeg,
    extra_load_kg: extraLoadKg || 0,
    rpe: perceivedExertion,        // 1-10
    notes: notes || '',
  };
}

export function useTrainings() {
  const [list, setList] = useState(() => getTrainings());
  useEffect(() => subscribe((k) => { if (k === KEY) setList(getTrainings()); }), []);
  return list;
}
