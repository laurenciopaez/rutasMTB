// Sistema de "nivel" dinámico inspirado en CTL/ATL/TSB de TrainingPeaks.
//
// Cada entrenamiento aporta un Training Load (TL) en función del effort
// (mismo unidad que difficulty: km + climbCost + carga). Pero como TL diario,
// dividimos: TL_day = effort * intensityMult.
// intensityMult depende de velocidad media vs FTP si la tenemos; sin eso usamos 1.0.
//
// Después armamos:
//   ATL (Acute  Training Load) = media móvil exponencial 7 días
//   CTL (Chronic Training Load) = media móvil exponencial 42 días
//   TSB (Training Stress Balance / "forma") = CTL - ATL
//
// El "nivel" mostrado al usuario = CTL escalado.

import { effortPerDay } from './difficulty.js';

// Convierte un training a un TL diario (asignado a la fecha del entrenamiento).
export function trainingLoad(training, profile) {
  const effort = effortPerDay({
    distance_km: (training.distance_m || 0) / 1000,
    gain_m: training.gain_m || 0,
    extra_load_kg: training.extra_load_kg || 0,
    body_kg: profile?.weightKg || 75,
  });

  // Multiplicador de intensidad: si tenemos duración y velocidad razonable, ajustamos.
  // Sin más datos, base = 1.0.
  let intensity = 1.0;
  if (training.duration_min) {
    const v_kmh = ((training.distance_m || 0) / 1000) / (training.duration_min / 60);
    // 20 km/h como referencia "moderada"; cada +5 km/h aumenta intensidad 0.15.
    intensity = Math.max(0.6, Math.min(1.6, 1 + (v_kmh - 20) * 0.03));
  }

  return effort * intensity;
}

// Calcula serie diaria de TL desde el primer training hasta hoy,
// luego computa ATL/CTL con EMA exponencial.
export function computeFitness(trainings, profile, asOfDate = new Date()) {
  if (!trainings || trainings.length === 0) {
    return { ATL: 0, CTL: 0, TSB: 0, level: 0, series: [] };
  }

  // Mapa fecha -> sumatoria TL del día.
  const tlByDay = new Map();
  for (const t of trainings) {
    const tl = trainingLoad(t, profile);
    tlByDay.set(t.date, (tlByDay.get(t.date) || 0) + tl);
  }

  // Rango de fechas: desde el primer training hasta asOfDate.
  const firstDate = trainings
    .map((t) => t.date)
    .sort()[0];
  const start = new Date(firstDate);
  const end = new Date(asOfDate);
  end.setHours(0, 0, 0, 0);

  // Iteramos día por día.
  const series = [];
  let ATL = 0, CTL = 0;
  const kATL = 2 / (7 + 1);     // EMA 7d
  const kCTL = 2 / (42 + 1);    // EMA 42d
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const tl = tlByDay.get(key) || 0;
    ATL = ATL + kATL * (tl - ATL);
    CTL = CTL + kCTL * (tl - CTL);
    series.push({ date: key, tl, ATL, CTL, TSB: CTL - ATL });
  }

  const level = ctlToLevel(CTL);
  return { ATL, CTL, TSB: CTL - ATL, level, series };
}

// CTL típico:
//   0-15  → principiante  (1-25)
//   15-35 → recreativo    (25-45)
//   35-55 → intermedio    (45-65)
//   55-75 → avanzado      (65-85)
//   75+   → experto       (85-100)
export function ctlToLevel(ctl) {
  if (ctl <= 0) return 0;
  // Mapeo logarítmico-ish: nivel = clamp(round(ctl * 1.3), 0, 100)
  return Math.max(0, Math.min(100, Math.round(ctl * 1.3)));
}

export function levelLabel(level) {
  if (level < 10) return 'sin actividad';
  if (level < 25) return 'principiante';
  if (level < 45) return 'recreativo';
  if (level < 65) return 'intermedio';
  if (level < 85) return 'avanzado';
  return 'experto';
}

// Estado de forma según TSB (cuán "frescos" estás):
//   TSB > +10  → muy descansado (riesgo de des-adaptación si pasa mucho)
//   +10..-10   → óptimo / forma
//   -10..-30   → cargado (entrenando en serio)
//   < -30      → sobrecarga (descansar)
export function formLabel(TSB) {
  if (TSB > 10) return { label: 'descansado', tone: 'info' };
  if (TSB > -10) return { label: 'en forma', tone: 'ok' };
  if (TSB > -30) return { label: 'cargado', tone: 'warn' };
  return { label: 'sobrecarga', tone: 'danger' };
}
