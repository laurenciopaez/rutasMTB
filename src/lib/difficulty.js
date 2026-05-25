// Cálculo de dificultad de rutas (planeadas o realizadas).
//
// Idea: armamos un "effort score" objetivo, independiente del ciclista.
// Después lo relativizamos al nivel del ciclista para etiquetar la dificultad
// como "fácil / moderada / dura / muy dura / extrema".
//
// El effort por día se compone de:
//   - distancia (km)
//   - desnivel + (cada 100m suma como ~1.2 km extra de esfuerzo)
//   - carga adicional (penaliza km y desnivel proporcional al peso)
//
// Multi-día: sumamos effort de cada día y aplicamos un multiplicador de fatiga
// acumulada (~5% por día extra).
//
// Tipo de ruta: 'training' (un día, sin carga) vs 'trip' (multi-día con carga).

export function effortPerDay({ distance_km, gain_m, extra_load_kg = 0, body_kg = 75 }) {
  // Carga relativa: cuánto % extra del peso del ciclista representa la carga.
  // 8kg sobre 75 = 10.6% → multiplicador 1.10.
  const loadFactor = 1 + (extra_load_kg / Math.max(40, body_kg)) * 1.0;
  const climbCost = (gain_m / 100) * 1.2;     // 100m+ ≈ 1.2 km de "esfuerzo equivalente"
  return (distance_km + climbCost) * loadFactor;
}

// Para rutas single-day usamos sus stats directos.
// Para rutas multi-día (route.tripMeta = { days, extraLoadKg }), repartimos km y desnivel
// de forma uniforme entre días (a falta de info por etapa).
export function routeEffort(route, { body_kg = 75 } = {}) {
  const totalKm = (route.stats?.distance_m || 0) / 1000;
  const totalGain = route.stats?.gain_m || 0;
  const trip = route.tripMeta;
  const days = trip?.days && trip.days > 1 ? trip.days : 1;
  const extra_load_kg = trip?.extraLoadKg || 0;

  const perDay = effortPerDay({
    distance_km: totalKm / days,
    gain_m: totalGain / days,
    extra_load_kg,
    body_kg,
  });

  // Fatiga acumulada: cada día extra suma 5%.
  const fatigueMult = 1 + 0.05 * (days - 1);
  const total = perDay * days * fatigueMult;
  return { effort: total, effort_per_day: perDay, days };
}

// Etiqueta de dificultad relativa al nivel del ciclista.
// capacity = umbral de esfuerzo "moderado" para este ciclista, en las mismas unidades que effort.
// Sin datos, capacity por defecto = 60 (≈ una salida de 40 km con 500m+).
export function difficultyLabel(effort, capacity = 60) {
  const ratio = effort / capacity;
  if (ratio < 0.5)  return { label: 'muy fácil', tone: 'ok',     ratio };
  if (ratio < 0.85) return { label: 'fácil',     tone: 'ok',     ratio };
  if (ratio < 1.2)  return { label: 'moderada',  tone: 'info',   ratio };
  if (ratio < 1.7)  return { label: 'dura',      tone: 'warn',   ratio };
  if (ratio < 2.5)  return { label: 'muy dura',  tone: 'danger', ratio };
  return                   { label: 'extrema',   tone: 'danger', ratio };
}

// Capacidad estimada a partir del nivel CTL (1-100). Sin nivel asumimos 60.
export function capacityFromLevel(level) {
  if (!level || level < 5) return 50;
  // Mapeo lineal: nivel 10 → 50, nivel 100 → 200.
  return 50 + (level - 10) * (150 / 90);
}
