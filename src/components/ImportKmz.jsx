import { useRef, useState } from 'react';
import { parseKmzFile, parseKmlString } from '../lib/kmz.js';
import { buildRouteFromParsed, saveRoute } from '../store/useRoutes.js';

export default function ImportKmz({ onImported }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleFiles(files) {
    setError(null);
    setBusy(true);
    try {
      for (const file of files) {
        const isKmz = file.name.toLowerCase().endsWith('.kmz');
        const parsed = isKmz
          ? await parseKmzFile(file)
          : parseKmlString(await file.text(), file.name.replace(/\.kml$/i, ''));
        const route = buildRouteFromParsed(parsed);
        saveRoute(route);
        onImported?.(route);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".kmz,.kml"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      <button className="primary" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Importando…' : 'Importar KMZ/KML'}
      </button>
      {error && <span style={{ color: 'var(--danger)', marginLeft: 12 }}>{error}</span>}
    </>
  );
}
