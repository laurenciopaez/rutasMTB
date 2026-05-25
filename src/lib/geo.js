// Geo utilities: haversine, elevation gain/loss, smoothing.

const R = 6371000; // meters

export function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// points: [{ lat, lon, ele }]  → returns { distance_m, gain_m, loss_m, ele_min, ele_max, cumDist[] }
export function computeRouteStats(points, opts = {}) {
  const { elevationThreshold = 2 } = opts; // ignore noise <2m
  if (!points || points.length < 2) {
    return { distance_m: 0, gain_m: 0, loss_m: 0, ele_min: 0, ele_max: 0, cumDist: [] };
  }
  let distance = 0;
  const cumDist = [0];
  for (let i = 1; i < points.length; i++) {
    distance += haversine(points[i - 1], points[i]);
    cumDist.push(distance);
  }

  // Smooth elevation with simple moving average, then accumulate gain/loss with threshold.
  const eles = points.map((p) => p.ele ?? 0);
  const smoothed = movingAverage(eles, 5);

  let gain = 0;
  let loss = 0;
  let ref = smoothed[0];
  for (let i = 1; i < smoothed.length; i++) {
    const diff = smoothed[i] - ref;
    if (Math.abs(diff) >= elevationThreshold) {
      if (diff > 0) gain += diff;
      else loss += -diff;
      ref = smoothed[i];
    }
  }

  return {
    distance_m: distance,
    gain_m: Math.round(gain),
    loss_m: Math.round(loss),
    ele_min: Math.round(Math.min(...eles)),
    ele_max: Math.round(Math.max(...eles)),
    cumDist,
  };
}

function movingAverage(arr, window) {
  if (window < 2) return arr.slice();
  const half = Math.floor(window / 2);
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let cnt = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      sum += arr[j];
      cnt += 1;
    }
    out[i] = sum / cnt;
  }
  return out;
}

export function bounds(points) {
  if (!points || points.length === 0) return null;
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  return [[minLat, minLon], [maxLat, maxLon]];
}

export function fmtKm(meters) {
  return (meters / 1000).toFixed(2) + ' km';
}
export function fmtM(meters) {
  return Math.round(meters) + ' m';
}
