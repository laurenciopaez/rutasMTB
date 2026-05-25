import { useEffect, useState } from 'react';
import { load, save, subscribe } from './storage.js';

const KEY = 'bikeSpec';

// Specs por defecto: MTB 29" típica, 1x12, palanca 175.
const DEFAULT = {
  // Rueda
  wheelSize: '29',          // '26' | '27.5' | '29' | 'custom'
  tireWidthMm: 58,          // ancho del neumático (mm). MTB 2.3"≈58mm.
  customCircumferenceMm: null,  // si el usuario quiere overridear con un valor empírico

  // Cranks
  crankLengthMm: 175,

  // Transmisión
  chainrings: [32],         // lista de platos (1x = un valor)
  cassette: [10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 51], // SRAM Eagle 10-51 típico

  // Cadencia de referencia para velocidades
  referenceCadence: 90,
};

export function getBikeSpec() {
  const stored = load(KEY, {});
  // Merge robusto: si arrays vienen vacíos, usar default.
  return {
    ...DEFAULT,
    ...stored,
    chainrings: stored.chainrings?.length ? stored.chainrings : DEFAULT.chainrings,
    cassette: stored.cassette?.length ? stored.cassette : DEFAULT.cassette,
  };
}

export function saveBikeSpec(patch) {
  const merged = { ...getBikeSpec(), ...patch };
  save(KEY, merged);
  return merged;
}

export function useBikeSpec() {
  const [s, setS] = useState(() => getBikeSpec());
  useEffect(() => subscribe((k) => { if (k === KEY) setS(getBikeSpec()); }), []);
  return s;
}
