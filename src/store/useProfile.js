import { useEffect, useState } from 'react';
import { load, save, subscribe } from './storage.js';

const KEY = 'profile';

const DEFAULT = {
  // Datos personales
  name: '',
  birthDate: '',          // yyyy-mm-dd
  sex: 'M',               // 'M' | 'F' | 'X'
  weightKg: 75,
  heightCm: 175,
  // Equipo
  bikeWeightKg: 14,       // bici sola
  // Performance
  ftpW: null,             // potencia umbral funcional (opcional, mejora cálculos)
  // Rendimiento percibido / coeficientes ajustables
  CdA: 0.5,               // área de arrastre (m²) — postura típica MTB
  Crr: 0.005,             // coef de rodadura — MTB en mixto
  drivetrainEfficiency: 0.95,
  metabolicEfficiency: 0.24, // 22-26% típico en ciclismo
};

export function getProfile() {
  return { ...DEFAULT, ...load(KEY, {}) };
}

export function saveProfile(patch) {
  const merged = { ...getProfile(), ...patch };
  save(KEY, merged);
  return merged;
}

export function useProfile() {
  const [p, setP] = useState(() => getProfile());
  useEffect(() => subscribe((k) => { if (k === KEY) setP(getProfile()); }), []);
  return p;
}

export function ageFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
