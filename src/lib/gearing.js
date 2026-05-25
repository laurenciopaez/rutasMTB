// Cálculo de desarrollos para una bici.
//
// - Circunferencia de rueda ≈ π · (diámetro_llanta_ISO + 2 · ancho_neumático_mm)
//   Notar que es una aproximación geométrica; la real (cargada) suele ser ~2-3% menor
//   por la deflexión del neumático. Por eso permitimos override empírico.
//
// - Relación (ratio) = dientes_plato / dientes_piñon
// - Desarrollo (m por pedalada) = circunferencia_m · ratio
// - Velocidad a cadencia N (km/h) = desarrollo_m · cadencia_rpm · 60 / 1000
// - Gain ratio (Sheldon Brown) = ratio · (radio_rueda_mm / longitud_palanca_mm)
//   Adimensional. Útil para comparar bicis con distintas geometrías.

// ISO bead diameters (mm) según ETRTO para los rodados usuales de MTB.
const RIM_ISO = {
  '26':   559,
  '27.5': 584,   // también 650b
  '29':   622,   // también 700c
};

export function wheelCircumferenceMm({ wheelSize, tireWidthMm, customCircumferenceMm }) {
  if (customCircumferenceMm) return customCircumferenceMm;
  const rim = RIM_ISO[wheelSize] ?? RIM_ISO['29'];
  return Math.PI * (rim + 2 * (tireWidthMm || 0));
}

export function wheelDiameterMm(spec) {
  return wheelCircumferenceMm(spec) / Math.PI;
}

// Genera matriz de combinaciones plato × piñón con todos los cálculos.
export function gearTable(spec) {
  const circ_mm = wheelCircumferenceMm(spec);
  const circ_m = circ_mm / 1000;
  const wheelRadius_mm = circ_mm / (2 * Math.PI);
  const crank_mm = spec.crankLengthMm || 175;
  const cadence = spec.referenceCadence || 90;

  const rows = [];
  for (const chainring of spec.chainrings) {
    for (const cog of spec.cassette) {
      const ratio = chainring / cog;
      const development_m = circ_m * ratio;
      const speed_kmh = development_m * cadence * 60 / 1000;
      const gainRatio = ratio * (wheelRadius_mm / crank_mm);
      rows.push({
        chainring,
        cog,
        ratio,
        development_m,
        speed_kmh,
        gainRatio,
      });
    }
  }
  return { circ_mm, circ_m, wheelRadius_mm, crank_mm, cadence, rows };
}

// Análisis rápido: rango de gear, gear más bajo (subida), más alto (descenso).
export function gearSummary(table) {
  if (!table.rows.length) return null;
  const sorted = [...table.rows].sort((a, b) => a.development_m - b.development_m);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return {
    minDev: min,
    maxDev: max,
    rangePct: ((max.development_m / min.development_m) - 1) * 100,
  };
}

export function fmtDev(m) {
  return m.toFixed(2) + ' m';
}
export function fmtSpeed(kmh) {
  return kmh.toFixed(1) + ' km/h';
}
