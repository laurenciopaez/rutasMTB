import { useEffect, useState } from 'react';
import { load, save, subscribe, uid } from './storage.js';
import { MAINTENANCE_PRESETS } from '../lib/components.js';

const KEY = 'components';

export function getComponents() { return load(KEY, []); }

export function saveComponent(c) {
  const all = getComponents();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  save(KEY, all);
  return c;
}

export function deleteComponent(id) {
  save(KEY, getComponents().filter((c) => c.id !== id));
}

export function buildComponent({ category, name, brand = '', model = '', installedAt, notes = '', maintenance }) {
  const preset = MAINTENANCE_PRESETS[category] || { kmThreshold: null, daysThreshold: null };
  return {
    id: uid('cp'),
    category,
    name,
    brand,
    model,
    installedAt: installedAt || new Date().toISOString().slice(0, 10),
    active: true,
    retiredAt: null,
    notes,
    maintenance: maintenance || { kmThreshold: preset.kmThreshold, daysThreshold: preset.daysThreshold },
    serviceLog: [],
  };
}

export function addService(componentId, { date, notes = '' }) {
  const all = getComponents();
  const c = all.find((x) => x.id === componentId);
  if (!c) return;
  c.serviceLog = c.serviceLog || [];
  c.serviceLog.push({ date: date || new Date().toISOString().slice(0, 10), notes });
  save(KEY, all);
}

export function retireComponent(componentId) {
  const all = getComponents();
  const c = all.find((x) => x.id === componentId);
  if (!c) return;
  c.active = false;
  c.retiredAt = new Date().toISOString().slice(0, 10);
  save(KEY, all);
}

export function reactivateComponent(componentId) {
  const all = getComponents();
  const c = all.find((x) => x.id === componentId);
  if (!c) return;
  c.active = true;
  c.retiredAt = null;
  save(KEY, all);
}

export function useComponents() {
  const [list, setList] = useState(() => getComponents());
  useEffect(() => subscribe((k) => { if (k === KEY) setList(getComponents()); }), []);
  return list;
}
