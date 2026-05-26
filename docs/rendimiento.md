# Rendimiento

Análisis específico para RutasMTB. Cuellos de botella reales del código actual y prioridades para el rediseño.

## Modelo mental

La app maneja **3 tipos de carga** muy distintos:

1. **Datos por ruta** — arrays de `{ lat, lon, ele }`. Una salida MTB de 60 km con GPS a 1 Hz son ~5–20k puntos. Se guardan en `localStorage` como JSON.
2. **Renderizado de mapa** — Leaflet pinta una `Polyline` con todos los puntos + tiles OSM.
3. **Recálculo derivado** — `computeRouteStats`, `computeFitness` (CTL/ATL por día desde el primer training) y `computeComponentStatus` (suma trainings por componente). Todo se recalcula en cada render.

El cuello de botella va a aparecer con **>50 rutas, >300 trainings, o rutas individuales >20k puntos** — antes el límite real es `localStorage` (5–10 MB total).

---

## Problemas concretos del código actual

### 1. `localStorage` como base — techo duro a ~5 MB

[src/store/storage.js](../src/store/storage.js) serializa todo a JSON. Cada ruta guarda los puntos crudos en `route.points` ([useRoutes.js:30-42](../src/store/useRoutes.js#L30-L42)).

**Costo real**: una ruta de 10k puntos con `lat/lon/ele` en JSON pesa ~350 KB. Con 20–30 rutas + trainings ya estás en 7–10 MB → el navegador empieza a tirar `QuotaExceededError` y todo deja de guardar **silenciosamente** (no hay try/catch en `save()`).

**Acción rediseño**:
- Migrar a **IndexedDB** (vía `idb` o Dexie). El budget pasa a cientos de MB y soporta blobs.
- Separar `route.meta` (id, nombre, stats, tags) de `route.points` (track crudo). Cargar los puntos solo cuando se abre el detalle, no en listados.
- Si querés mantener `localStorage` por simplicidad: comprimir `points` con codificación delta + varint, o usar el formato **Google Polyline Encoding** (factor ~5–10× menos espacio).
- Hookear `save()` con `try/catch` y avisar al usuario cuando se acerca al límite.

### 2. Polyline con todos los puntos sin simplificación

[src/components/RouteMap.jsx:19](../src/components/RouteMap.jsx#L19) hace `points.map((p) => [p.lat, p.lon])` y se lo pasa entero a `<Polyline>`. En zoom alejado, Leaflet pinta los 10k puntos aunque ocupen 200 px en pantalla.

**Acción**:
- Aplicar **Ramer–Douglas–Peucker** (RDP) al cargar la ruta: guardar dos versiones — `pointsFull` (KMZ original, para perfil de altura) y `pointsSimplified` (para mapa). Tolerancia ~3–5 m da reducción 10–50× sin pérdida visible.
- Idealmente: pre-calcular pirámide de simplificaciones por zoom (Mapbox-style). Para tu escala, una sola versión simplificada alcanza.

### 3. `ElevationProfile` recalcula `Math.min/max(...eles)` con spread

[src/components/ElevationProfile.jsx:19-20](../src/components/ElevationProfile.jsx#L19-L20) hace `Math.min(...eles)`. Con 30k puntos, el spread arg-list explota el stack en algunos motores y siempre es O(n) doble (uno por `min`, otro por `max`).

**Acción**: un solo loop `for` que calcula min y max en una pasada, en O(n) sin spread. Misma corrección en [ElevationProfile.jsx:18-19](../src/components/ElevationProfile.jsx#L18-L19) y en [geo.js:48-49](../src/lib/geo.js#L48-L49).

### 4. `computeRouteStats` se llama en cada render del detalle

[src/pages/RouteDetail.jsx:18](../src/pages/RouteDetail.jsx#L18) ya cachea con `useMemo`, pero `route.stats` ya se calcula al importar ([useRoutes.js:30](../src/store/useRoutes.js#L30)) — perfecto. **Pero** `cumDist` se devuelve dentro de `stats` y es un array de longitud N que se serializa a localStorage **junto con la ruta**. Para 10k puntos son ~80 KB extra por ruta solo en cumDist.

**Acción**: no persistir `cumDist`. Reconstruirlo on-demand cuando se abre el detalle (es O(n) trivial), o guardarlo en una caché separada.

### 5. `Dashboard` itera todo en cada render

[src/pages/Dashboard.jsx:33-45](../src/pages/Dashboard.jsx#L33-L45) hace:
- `trainings.map(...computeTrainingEnergy)` → recorre cada training, busca su ruta con `getRoute()` (que lee localStorage entero cada vez vía `load(KEY)`).
- `components.map(...computeComponentStatus)` → cada componente hace otro pase entero por trainings ([components.js:78-79](../src/lib/components.js#L78-L79)).

Con 200 trainings + 30 componentes = 6000 iteraciones por render, cada una releyendo localStorage. Es **N×M con I/O sincrónico**.

**Acción**:
- Crear un **store en memoria** (Zustand / Jotai / un context simple) que cargue una vez al inicio y mantenga `routes`, `trainings`, `components` en RAM. Persistir en IndexedDB en background.
- Reemplazar `getRoute(t.routeId)` por un `Map<routeId, route>` precomputado.
- Memoizar `computeFitness` por hash de `(trainings.length, lastTrainingDate, profile.weightKg)` — hoy se recalcula entero (42 días de EMA × series) en cada render del Dashboard y del Profile.

### 6. `computeFitness` itera día por día desde el primer training hasta hoy

[src/lib/fitness.js:65-72](../src/lib/fitness.js#L65-L72) hace un loop diario desde `firstDate`. Si tu primer training fue hace 3 años, son 1100 iteraciones por render. Tolerable, pero recordá que se llama en Dashboard **y** en Profile **y** en cada Route Detail.

**Acción**: cachear el resultado por `(trainings.lastModified, profile.weightKg)` en un módulo singleton, invalidar en escritura.

### 7. `routeBearing` usa solo start→end

[src/lib/calories.js:38-44](../src/lib/calories.js#L38-L44). Para calcular headwind se promedia un **único** bearing entre primer y último punto. Una ruta circular en MTB tiene bearing ≈ 0° y el headwind queda ≈ 0 siempre.

**Acción**: calcular bearing por segmento, ponderar por distancia, y devolver el promedio de la componente headwind (no del ángulo). Es un loop O(n) extra, hacelo una vez al importar y guardalo en `route.stats.headwindFactors` o calcularlo on-demand al guardar el training.

### 8. Leaflet CSS desde unpkg.com

[index.html:7](../index.html#L7) carga `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`. En Electron, sin internet en el primer arranque → mapa roto. Y agrega 1 RTT al arranque.

**Acción**: instalar leaflet en deps (ya está) y `import 'leaflet/dist/leaflet.css'` desde `main.jsx`. Vite lo inlinea.

### 9. Source maps en producción

[vite.config.js:8](../vite.config.js#L8) `sourcemap: true`. Bien para devtools pero infla el bundle distribuido. En el ASAR del build de Electron se filtra todo tu código fuente.

**Acción**: `sourcemap: 'hidden'` para mantener stack traces útiles sin shippear los `.map` (o no shippearlos en el instalador).

### 10. Sin code splitting

Todo el árbol de pages se carga en el bundle inicial. `react-leaflet` + `leaflet` + `jszip` suman ~200 KB gzipped que se cargan aunque el usuario solo abra el Dashboard.

**Acción**:
- `lazy()` para las pages: el Dashboard no necesita Leaflet hasta que abrís una ruta.
- `JSZip` se puede importar dinámicamente dentro de `parseKmzFile` (solo se usa al importar).

---

## Métricas objetivo para el rediseño

| Escenario | Hoy (estimado) | Target |
|-----------|---------------|--------|
| Arranque cold (Dashboard vacío) | ~600 ms | <250 ms |
| Importar KMZ de 15k puntos | ~800 ms | <300 ms |
| Abrir ruta de 15k puntos (map + perfil) | ~1.2 s | <400 ms |
| Re-render Dashboard con 200 trainings | ~80 ms | <16 ms (1 frame) |
| Capacidad total | ~5 MB localStorage | >500 MB IndexedDB |

## Herramientas de medición

- **React DevTools Profiler** — grabar un escenario y mirar qué componente re-renderiza inútilmente.
- **Performance tab de Chromium** (`Ctrl+Shift+I` en Electron) — captura main thread, scripting vs rendering.
- **`window.performance.measure()`** rodeando `parseKmzFile`, `computeFitness`, `computeRouteStats` para tener números concretos antes/después.
- En producción: log opcional a un archivo local (no telemetría) con duración de operaciones lentas, solo si el usuario activa "modo diagnóstico".

## Priorización para el rediseño

1. **IndexedDB + separación meta/points** — desbloquea todo lo demás y elimina el techo de 5 MB.
2. **Simplificación de polyline** — el cambio con mayor mejora visible.
3. **Store en memoria + memoización de `computeFitness`** — elimina el N×M del Dashboard.
4. **Sin spread en `Math.min/max`** — fix de 5 minutos, mejora rutas grandes.
5. **Code splitting por page** — arranque más rápido.
6. **`routeBearing` ponderado** — mejora *exactitud*, no rendimiento, pero entra acá porque toca el mismo flujo de import.
