// Cálculo de calorías y potencia promedio aproximada para una salida en bici,
// SIN power meter, basado en física básica:
//
//   P_total = P_rodadura + P_aerodinamica + P_gravedad
//
//   P_rodadura  = Crr · m · g · v
//   P_aerodin.  = 0.5 · ρ · CdA · v_rel² · v        (v_rel = v + headwind)
//   P_gravedad  ≈ m · g · (gain_m / tiempo_seg)     (promedio sobre la salida)
//
// donde:
//   m = peso (ciclista + bici + carga) en kg
//   g = 9.81 m/s²
//   ρ = 1.225 kg/m³ (aire al nivel del mar)
//   v = velocidad promedio (m/s)
//
// Energía mecánica total (kJ) = P_avg · t_seg / 1000
// Calorías quemadas ≈ Energía_mech / efficiency_drivetrain / metabolic_efficiency
//                   ≈ (P · t) / (0.95 · 0.24)  → factor ~4.4 vs energía mecánica.

const G = 9.81;
const RHO = 1.225;

// Devuelve componente headwind en m/s. Convención meteorológica:
//   windDirDeg = dirección DE DONDE viene el viento (0=N, 90=E, ...).
//   rideBearingDeg = dirección HACIA donde se mueve el ciclista (0=N, ...).
// Headwind > 0 = el viento sopla en contra del avance.
export function headwindComponentMps(windSpeedKmh, windDirDeg, rideBearingDeg) {
  if (!windSpeedKmh) return 0;
  const v = windSpeedKmh / 3.6;
  // Vector del viento: hacia donde sopla = windDirDeg + 180.
  // El "headwind" es la componente del vector del viento OPUESTA al avance.
  // Equivalente: headwind = -dot(windVel, rideDir) = v * cos(windDir - rideDir).
  const diff = ((windDirDeg - rideBearingDeg) % 360 + 360) % 360;
  return v * Math.cos((diff * Math.PI) / 180);
}

// Bearing promedio (start → end). En el futuro lo podemos hacer pesado por segmento.
import { haversine } from './geo.js';
export function routeBearing(points) {
  if (!points || points.length < 2) return 0;
  const a = points[0];
  const b = points[points.length - 1];
  return bearing(a, b);
}

function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const λ1 = toRad(a.lon), λ2 = toRad(b.lon);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Calcula potencia promedio (W) y calorías para una salida.
// Args:
//   { distance_m, gain_m, duration_min, mass_total_kg, CdA, Crr, drivetrainEff, metabolicEff, headwind_mps }
// Si duration_min es null/0, no podemos estimar; devolvemos null en kcal.
export function computeRideEnergy({
  distance_m,
  gain_m,
  duration_min,
  mass_total_kg,
  CdA = 0.5,
  Crr = 0.005,
  drivetrainEff = 0.95,
  metabolicEff = 0.24,
  headwind_mps = 0,
}) {
  if (!distance_m || !duration_min || duration_min <= 0) {
    return { kcal: null, avgPower_W: null, avgSpeed_kmh: null };
  }
  const t_s = duration_min * 60;
  const v = distance_m / t_s; // m/s
  const vRel = Math.max(0.1, v + headwind_mps);

  const P_roll = Crr * mass_total_kg * G * v;
  const P_air  = 0.5 * RHO * CdA * vRel * vRel * v;
  const P_grav = mass_total_kg * G * (Math.max(0, gain_m) / t_s);

  const P_mech = P_roll + P_air + P_grav;          // W (potencia que llega a la rueda)
  const P_at_pedals = P_mech / drivetrainEff;      // W (pedales)
  const E_kJ = (P_at_pedals * t_s) / 1000;         // energía mecánica en pedales
  // 1 kcal = 4.184 kJ; energía metabólica = E_mech / metabolicEff.
  const kcal = (E_kJ / metabolicEff) / 4.184;

  return {
    kcal: Math.round(kcal),
    avgPower_W: Math.round(P_at_pedals),
    avgSpeed_kmh: +(v * 3.6).toFixed(1),
  };
}

// Helper: calcula calorías de un training combinando con perfil + ruta.
export function computeTrainingEnergy(training, route, profile) {
  const mass = (profile.weightKg || 75) + (profile.bikeWeightKg || 14) + (training.extra_load_kg || 0);
  const headwind = headwindComponentMps(
    training.wind_speed_kmh || 0,
    training.wind_dir_deg || 0,
    route ? routeBearing(route.points) : 0,
  );
  return computeRideEnergy({
    distance_m: training.distance_m,
    gain_m: training.gain_m,
    duration_min: training.duration_min,
    mass_total_kg: mass,
    CdA: profile.CdA,
    Crr: profile.Crr,
    drivetrainEff: profile.drivetrainEfficiency,
    metabolicEff: profile.metabolicEfficiency,
    headwind_mps: headwind,
  });
}
