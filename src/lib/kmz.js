// KMZ / KML parser.
// KMZ = zip que contiene un doc.kml (a veces otros assets).
// Extraemos coordenadas de LineStrings y Tracks (gx:Track) y armamos puntos { lat, lon, ele }.

import JSZip from 'jszip';

export async function parseKmzFile(file) {
  const buf = await file.arrayBuffer();
  return parseKmzBuffer(buf, file.name);
}

export async function parseKmzBuffer(buf, fallbackName = 'ruta') {
  const zip = await JSZip.loadAsync(buf);
  // Buscar el primer .kml dentro del zip.
  let kmlText = null;
  for (const fname of Object.keys(zip.files)) {
    if (fname.toLowerCase().endsWith('.kml')) {
      kmlText = await zip.files[fname].async('string');
      break;
    }
  }
  if (!kmlText) throw new Error('El KMZ no contiene un archivo .kml');
  return parseKmlString(kmlText, stripExt(fallbackName));
}

export function parseKmlString(kmlText, fallbackName = 'ruta') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, 'application/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) throw new Error('KML inválido: ' + parseErr.textContent.slice(0, 120));

  const docName = doc.querySelector('Document > name, kml > Document > name, kml > name')?.textContent?.trim();
  const placemarks = Array.from(doc.getElementsByTagName('Placemark'));

  const segments = [];
  for (const pm of placemarks) {
    const name = pm.querySelector(':scope > name')?.textContent?.trim() || null;

    // LineString clásico.
    const lineStrings = Array.from(pm.getElementsByTagName('LineString'));
    for (const ls of lineStrings) {
      const coordsText = ls.getElementsByTagName('coordinates')[0]?.textContent;
      if (!coordsText) continue;
      const points = coordsTextToPoints(coordsText);
      if (points.length >= 2) segments.push({ name, points });
    }

    // gx:Track (KML extendido — usa <gx:coord> "lon lat alt").
    const tracks = Array.from(pm.getElementsByTagNameNS('*', 'Track'));
    for (const tr of tracks) {
      const coords = Array.from(tr.getElementsByTagNameNS('*', 'coord'));
      const points = coords.map((c) => {
        const [lon, lat, ele] = c.textContent.trim().split(/\s+/).map(Number);
        return { lat, lon, ele: ele || 0 };
      }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
      if (points.length >= 2) segments.push({ name, points });
    }
  }

  if (segments.length === 0) {
    throw new Error('No se encontraron rutas (LineString / Track) en el KML.');
  }

  // Si hay un solo segmento -> esa es la ruta. Si hay varios, los concatenamos
  // pero preservamos el nombre del primero / del Document.
  const all = segments.flatMap((s) => s.points);
  return {
    name: docName || segments[0].name || fallbackName,
    points: all,
    segments: segments.length,
  };
}

function coordsTextToPoints(text) {
  // KML coords: "lon,lat,alt lon,lat,alt ..." (alt opcional). Pueden estar separadas por espacios o saltos de línea.
  return text
    .trim()
    .split(/\s+/)
    .map((tuple) => {
      const parts = tuple.split(',').map(Number);
      const [lon, lat, ele] = parts;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { lat, lon, ele: Number.isFinite(ele) ? ele : 0 };
    })
    .filter(Boolean);
}

function stripExt(name) {
  return name.replace(/\.(kmz|kml)$/i, '');
}
