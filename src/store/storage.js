// Wrapper sobre localStorage con namespace y eventos para refrescar componentes.

const PREFIX = 'rutasmtb:';
const listeners = new Set();

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  listeners.forEach((fn) => fn(key));
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
  listeners.forEach((fn) => fn(key));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function uid(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
