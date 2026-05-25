// Catálogo de categorías de componentes + presets de mantenimiento.
// Los thresholds son orientativos para MTB de uso recreativo / entrenamiento;
// se pueden editar por componente.

export const CATEGORIES = [
  { id: 'horquilla',        label: 'Suspensión delantera (horquilla)', group: 'Suspensión' },
  { id: 'amortiguador',     label: 'Suspensión trasera (amortiguador)', group: 'Suspensión' },
  { id: 'cadena',           label: 'Cadena',                            group: 'Transmisión' },
  { id: 'cassette',         label: 'Cassette',                          group: 'Transmisión' },
  { id: 'plato',            label: 'Plato',                             group: 'Transmisión' },
  { id: 'desviador_t',      label: 'Descarrilador trasero',             group: 'Transmisión' },
  { id: 'desviador_d',      label: 'Descarrilador delantero',           group: 'Transmisión' },
  { id: 'poleas',           label: 'Poleas (jockey wheels)',            group: 'Transmisión' },
  { id: 'pedalier',         label: 'Pedalier / caja',                   group: 'Transmisión' },
  { id: 'pastillas_d',      label: 'Pastillas freno delantero',         group: 'Frenos' },
  { id: 'pastillas_t',      label: 'Pastillas freno trasero',           group: 'Frenos' },
  { id: 'disco_d',          label: 'Disco freno delantero',             group: 'Frenos' },
  { id: 'disco_t',          label: 'Disco freno trasero',               group: 'Frenos' },
  { id: 'liquido_frenos',   label: 'Líquido de frenos',                 group: 'Frenos' },
  { id: 'cubierta_d',       label: 'Cubierta delantera',                group: 'Ruedas' },
  { id: 'cubierta_t',       label: 'Cubierta trasera',                  group: 'Ruedas' },
  { id: 'rulemanes_d',      label: 'Rulemanes maza delantera',          group: 'Ruedas' },
  { id: 'rulemanes_t',      label: 'Rulemanes maza trasera',            group: 'Ruedas' },
  { id: 'pedales',          label: 'Pedales',                           group: 'Contacto' },
  { id: 'manubrio',         label: 'Manubrio',                          group: 'Contacto' },
  { id: 'tija',             label: 'Tija de sillín',                    group: 'Contacto' },
  { id: 'sillin',           label: 'Sillín',                            group: 'Contacto' },
  { id: 'cables',           label: 'Cables y fundas',                   group: 'Otro' },
  { id: 'otro',             label: 'Otro',                              group: 'Otro' },
];

// Presets de mantenimiento por categoría: km y días entre services.
// Si un valor es null => no aplica esa dimensión.
export const MAINTENANCE_PRESETS = {
  horquilla:      { kmThreshold: 2000, daysThreshold: 180, hint: 'Cambio de aceite lower legs / retenes' },
  amortiguador:   { kmThreshold: 2000, daysThreshold: 180, hint: 'Service de aire/aceite' },
  cadena:         { kmThreshold: 1500, daysThreshold: 365, hint: 'Medí el desgaste con calibre 0.5/0.75' },
  cassette:       { kmThreshold: 4500, daysThreshold: 730, hint: '~3 cadenas por cassette' },
  plato:          { kmThreshold: 9000, daysThreshold: 1095, hint: 'Reemplazo cuando los dientes se vean "tiburón"' },
  desviador_t:    { kmThreshold: 8000, daysThreshold: 730, hint: 'Limpieza y lubricación periódica' },
  desviador_d:    { kmThreshold: 8000, daysThreshold: 730, hint: '' },
  poleas:         { kmThreshold: 3000, daysThreshold: 365, hint: 'Cambiar cuando tengan juego o ruido' },
  pedalier:       { kmThreshold: 8000, daysThreshold: 1095, hint: 'Cambiar cuando tenga juego o suene' },
  pastillas_d:    { kmThreshold: 1500, daysThreshold: 365, hint: 'Cambiar antes de los 1mm de material' },
  pastillas_t:    { kmThreshold: 1500, daysThreshold: 365, hint: 'Suelen durar menos que las delanteras' },
  disco_d:        { kmThreshold: 6000, daysThreshold: 1095, hint: 'Espesor mínimo grabado en el rotor' },
  disco_t:        { kmThreshold: 6000, daysThreshold: 1095, hint: 'Idem delantero' },
  liquido_frenos: { kmThreshold: null, daysThreshold: 365, hint: 'DOT 1 año / mineral 1-2 años' },
  cubierta_d:     { kmThreshold: 3000, daysThreshold: 730, hint: 'Depende del compuesto y terreno' },
  cubierta_t:     { kmThreshold: 2500, daysThreshold: 730, hint: 'La trasera dura menos' },
  rulemanes_d:    { kmThreshold: 6000, daysThreshold: 730, hint: 'Cambiar al primer signo de juego' },
  rulemanes_t:    { kmThreshold: 6000, daysThreshold: 730, hint: '' },
  pedales:        { kmThreshold: 8000, daysThreshold: 1095, hint: 'Servicear cuando tenga juego' },
  manubrio:       { kmThreshold: null, daysThreshold: 1825, hint: 'Reemplazo por seguridad cada ~5 años o golpe fuerte' },
  tija:           { kmThreshold: null, daysThreshold: 1825, hint: 'Si es dropper: service cada 1 año' },
  sillin:         { kmThreshold: null, daysThreshold: null, hint: 'Reemplazar por desgaste / confort' },
  cables:         { kmThreshold: null, daysThreshold: 365, hint: 'Cambiar si están duros o con fricción' },
  otro:           { kmThreshold: null, daysThreshold: null, hint: '' },
};

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}
export function categoryGroup(id) {
  return CATEGORIES.find((c) => c.id === id)?.group || 'Otro';
}

// Dado un componente y la lista de trainings, calcula:
//   { km_total_m, km_since_service_m, days_since_install, days_since_service, lastServiceDate, state }
// state: 'ok' | 'warn' (≥80% del umbral) | 'danger' (≥100%) | 'overdue' (≥110%)
export function computeComponentStatus(component, trainings) {
  const installedAt = component.installedAt;
  const lastService = component.serviceLog?.length
    ? component.serviceLog[component.serviceLog.length - 1]
    : null;
  const lastServiceDate = lastService?.date || installedAt;

  const sumDistSince = (dateStr) => trainings
    .filter((t) => t.date >= dateStr)
    .reduce((acc, t) => acc + t.distance_m, 0);

  const km_total_m = sumDistSince(installedAt);
  const km_since_service_m = sumDistSince(lastServiceDate);

  const today = new Date();
  const days_since_install = daysBetween(new Date(installedAt), today);
  const days_since_service = daysBetween(new Date(lastServiceDate), today);

  const { kmThreshold, daysThreshold } = component.maintenance || {};
  let ratio = 0;
  if (kmThreshold) ratio = Math.max(ratio, km_since_service_m / 1000 / kmThreshold);
  if (daysThreshold) ratio = Math.max(ratio, days_since_service / daysThreshold);

  let state = 'ok';
  if (ratio >= 1.1) state = 'overdue';
  else if (ratio >= 1.0) state = 'danger';
  else if (ratio >= 0.8) state = 'warn';

  // Cuánto falta (para mostrar "faltan X km" o "venció hace X días")
  let kmRemaining = kmThreshold ? Math.round(kmThreshold - km_since_service_m / 1000) : null;
  let daysRemaining = daysThreshold ? daysThreshold - days_since_service : null;

  return {
    km_total_m,
    km_since_service_m,
    days_since_install,
    days_since_service,
    lastServiceDate,
    state,
    ratio,
    kmRemaining,
    daysRemaining,
  };
}

function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
