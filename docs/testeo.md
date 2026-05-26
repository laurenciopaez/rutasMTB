# Testeo

Estrategia de testing para RutasMTB. Hoy no hay tests. El rediseño es el momento de meterlos sin friction porque vas a tocar todo.

## Filosofía

Esta app es **single-user, sin red, con lógica de cálculo no trivial y mucha UI**. La pirámide ideal es:

```
          ┌──────────────┐
          │   E2E (5%)   │  ← flujos críticos en Electron
          ├──────────────┤
          │ Component    │
          │  (15%)       │  ← UI compleja: ElevationProfile, Map
          ├──────────────┤
          │  Unit (80%)  │  ← cálculos en lib/ — donde está el valor
          └──────────────┘
```

**El 80% del valor está en testear `lib/`**. Es código puro, sin side effects, fácil de testear, y es donde un bug se vuelve invisible (un cálculo de calorías mal no rompe la app, devuelve un número incorrecto).

---

## Stack recomendado

| Capa | Herramienta | Por qué |
|------|-------------|---------|
| **Test runner** | **Vitest** | Ya usás Vite. Config trivial, watch rápido, compatible con la API de Jest |
| **Assertions** | Vitest built-in (`expect`) | Sin libs extra |
| **Component** | `@testing-library/react` + Vitest + `jsdom` | Standard React. Funciona con Vitest sin fricción |
| **E2E Electron** | **Playwright** (`_electron`) | Soporta Electron nativamente, mismo runtime que el resto, screenshots, video |
| **Coverage** | `@vitest/coverage-v8` | Built-in en Vitest |
| **Mocking** | `vi.fn()` / `vi.mock()` | Built-in en Vitest |

Total: 4 dev deps nuevas. Cero servicio externo, cero CI pago.

### Setup

```bash
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

`vite.config.js` (extend):

```js
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/**/*.test.*'],
    },
  },
});
```

`tests/setup.js`:

```js
import '@testing-library/jest-dom/vitest';
```

Scripts en `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:cov": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## Qué testear, archivo por archivo

### lib/ — prioridad máxima, cobertura objetivo 90%+

Cada función es pura y testeable directo. Ejemplos concretos del código actual:

#### [src/lib/geo.js](../src/lib/geo.js) — `haversine`, `computeRouteStats`, `bounds`
**Tests obligatorios**:
- `haversine` entre dos puntos conocidos (ej. Mar del Plata → BA): comparar contra valor conocido (~400 km) con tolerancia de 1%.
- `haversine` con dos puntos iguales → 0.
- `haversine` cruzando antimeridiano (lat=0, lon=179 → lat=0, lon=-179): debería dar ~222 km, no ~40000.
- `computeRouteStats` con `points: []` → todo en 0.
- `computeRouteStats` con `points: [{lat,lon,ele:100}]` (un solo punto) → no debe crashear.
- `computeRouteStats` con elevación con ruido < 2 m → no debe sumar al gain (threshold).
- `computeRouteStats` con elevación monótona ascendente de 100 m → `gain_m` cercano a 100.
- `bounds` con puntos vacíos → `null`.

#### [src/lib/kmz.js](../src/lib/kmz.js) — parser KMZ/KML
**Tests obligatorios** (con fixtures en `tests/fixtures/`):
- Parse de un KML simple con un `LineString` → devuelve N puntos.
- Parse de un KML con `gx:Track` → maneja el namespace y "lon lat alt" en `<gx:coord>`.
- Parse de un KML con múltiples Placemarks → concatena todos los segments.
- KML inválido (XML mal formado) → lanza error con mensaje útil.
- KML sin coordenadas → lanza "No se encontraron rutas".
- KML con coordenadas fuera de rango (lat=1000) → no incluye esos puntos (ver [seguridad.md](seguridad.md)).
- KMZ sin .kml adentro → lanza error claro.

Para los fixtures, tener 4–5 KMLs reales pequeños en `tests/fixtures/kml/`.

#### [src/lib/calories.js](../src/lib/calories.js) — `headwindComponentMps`, `computeRideEnergy`
**Tests obligatorios**:
- `headwindComponentMps(0, 0, 0)` → 0 (sin viento).
- Viento de 20 km/h desde el N (windDir=0), ride bearing N (0) → headwind = +20/3.6 m/s (viento en contra).
- Viento de 20 km/h desde el N, ride bearing S (180) → headwind = -20/3.6 m/s (viento a favor).
- Viento perpendicular → headwind ≈ 0.
- `computeRideEnergy` con duration=0 → devuelve nulls (caso ya manejado).
- `computeRideEnergy` con valores típicos (40 km, 600 m gain, 120 min, 90 kg total) → kcal en rango razonable (1500–2500). No assert exacto, assert rango.
- Edge case: gain_m negativo (no debería pasar pero...) → `Math.max(0, gain_m)` lo maneja.

#### [src/lib/fitness.js](../src/lib/fitness.js) — `computeFitness`, `ctlToLevel`, `levelLabel`, `formLabel`
**Tests obligatorios**:
- `computeFitness([], profile)` → todos 0.
- `computeFitness` con un solo training reciente → CTL pequeño, ATL más alto (porque la ventana es más corta), TSB negativo.
- `computeFitness` con 60 días de entrenamiento constante → ATL ≈ CTL (steady state), TSB ≈ 0.
- `computeFitness` con entrenamiento que paró hace 30 días → ATL → 0, CTL todavía positivo, TSB > 0.
- `ctlToLevel(0)` → 0. `ctlToLevel(80)` → 100 (cap).
- `levelLabel` y `formLabel` con valores en cada bucket.

Test importante: **determinismo**. Para una misma entrada de trainings, `computeFitness` debe ser totalmente determinista. Hacé un snapshot test con 10 trainings reales.

#### [src/lib/components.js](../src/lib/components.js) — `computeComponentStatus`
**Tests obligatorios**:
- Componente nuevo instalado hoy, sin trainings → state=`ok`, ratio=0.
- Componente con kmThreshold=1000 y trainings que suman 1100 km → state=`overdue`, ratio>1.1.
- Componente con daysThreshold=180 y `installedAt` hace 200 días → state=`overdue`.
- Componente con service registrado ayer → `km_since_service_m=0`.
- Componente con maintenance.kmThreshold=null y daysThreshold=null → state siempre `ok` (no aplica).

#### [src/lib/difficulty.js](../src/lib/difficulty.js) y [src/lib/gearing.js](../src/lib/gearing.js)
Aplicar la misma lógica: una decena de tests por archivo cubriendo casos típicos + edge cases.

---

### store/ — cobertura 60%+

Estos módulos hacen I/O con `localStorage`. En tests con jsdom, `localStorage` está mockeado por default.

**Tests por store** ([useRoutes.js](../src/store/useRoutes.js), [useTrainings.js](../src/store/useTrainings.js), [useComponents.js](../src/store/useComponents.js), etc.):
- `getX()` en localStorage vacío → `[]`.
- `saveX(item)` + `getX()` → contiene el item.
- `saveX(item)` con id existente → upsert, no duplica.
- `deleteX(id)` → ya no aparece.
- `subscribe(fn)` recibe notificación al `save()`.
- JSON corrupto en localStorage → no crashea, devuelve fallback.

`beforeEach` con `localStorage.clear()` para aislar tests.

---

### components/ — cobertura 40%+

UI standard se testea con `@testing-library/react`. **No testear todo**: testear los componentes con lógica condicional o estado interno complejo.

**Vale la pena testear**:
- [ImportKmz.jsx](../src/components/ImportKmz.jsx) — flujo de selección de archivo, manejo de error, estado busy.
- [ElevationProfile.jsx](../src/components/ElevationProfile.jsx) — render con datos vacíos / con datos / hover.
- [GearTable.jsx](../src/components/GearTable.jsx) — render correcto de la matriz.
- [ComponentForm.jsx](../src/components/ComponentForm.jsx) — validación de campos.

**No vale la pena (mucho)**: la sidebar, las páginas wrapper que solo renderean componentes hijos.

**No testear** [RouteMap.jsx](../src/components/RouteMap.jsx) con component tests — Leaflet necesita DOM real con tamaños calculados; jsdom no lo soporta bien. Lo testeás en E2E.

---

### pages/ — cobertura 20%+

Las pages son orquestadores. Testealas con tests de integración chiquitos:
- Dashboard con trainings → muestra stats correctas.
- Trainings → submit del form crea entry en localStorage.
- RouteDetail con id inexistente → muestra mensaje "ruta no encontrada".

No buscar coverage alta acá. Buscar **smoke tests** que detecten regresiones obvias.

---

## E2E con Playwright + Electron

Para los flujos críticos. Pocos tests, alta confianza.

### Setup
`playwright.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: { trace: 'on-first-retry' },
});
```

`tests/e2e/smoke.spec.js`:

```js
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test('arranca y muestra Dashboard', async () => {
  const app = await electron.launch({ args: [path.join(__dirname, '../../electron/main.cjs')] });
  const window = await app.firstWindow();
  await expect(window.locator('h2')).toContainText('Dashboard');
  await app.close();
});

test('importa KMZ y aparece en Rutas', async () => {
  const app = await electron.launch({ args: [path.join(__dirname, '../../electron/main.cjs')] });
  const window = await app.firstWindow();
  await window.click('text=Rutas');
  // playwright file chooser
  const [chooser] = await Promise.all([
    window.waitForEvent('filechooser'),
    window.click('text=Importar'),
  ]);
  await chooser.setFiles(path.join(__dirname, '../fixtures/sample.kmz'));
  await expect(window.locator('.route-row')).toHaveCount(1);
  await app.close();
});
```

### Escenarios E2E críticos (5–8 tests máximo)

1. **Arranque** → Dashboard se renderiza.
2. **Importar KMZ** → ruta aparece en lista.
3. **Crear training** → suma a stats del Dashboard.
4. **Crear componente y registrar service** → estado cambia.
5. **Editar perfil** → persiste tras restart de la app.
6. **Eliminar ruta** → desaparece y trainings asociados quedan huérfanos (verificar comportamiento esperado).
7. **Cambiar tab en Mi bici** → renderiza el tab correcto.

Si en algún momento se agregan: import de backup, export, multi-perfil — agregar 1 test E2E por feature crítica.

---

## Testing del modelo físico — caso especial

Los cálculos de calorías y fitness son la "joya de la corona" funcional de la app. Un bug acá no es visible pero arruina la utilidad del producto. Estrategia extra:

### Property-based testing (opcional pero alto valor)

Con `fast-check`:

```js
import fc from 'fast-check';
import { computeRideEnergy } from '../src/lib/calories.js';

test('avgPower siempre positivo para inputs razonables', () => {
  fc.assert(fc.property(
    fc.integer({ min: 1000, max: 200000 }),    // distance_m
    fc.integer({ min: 0, max: 5000 }),         // gain_m
    fc.integer({ min: 10, max: 600 }),         // duration_min
    fc.integer({ min: 50, max: 150 }),         // mass_kg
    (d, g, t, m) => {
      const r = computeRideEnergy({
        distance_m: d, gain_m: g, duration_min: t, mass_total_kg: m,
      });
      expect(r.avgPower_W).toBeGreaterThan(0);
      expect(r.kcal).toBeGreaterThan(0);
    }
  ));
});
```

Esto encuentra edge cases que tests manuales nunca pensarían. Para los cálculos de física vale mucho la pena.

### Snapshots con datos reales

Guardar 3–4 trainings reales tuyos en `tests/fixtures/trainings.json`. Test que asegura que `computeFitness` con ese dataset devuelve siempre el mismo CTL/ATL/TSB. Si un día cambiás la fórmula y el snapshot cambia, sabés exactamente qué se modificó.

---

## CI

GitHub Actions, junto al workflow de release de [distribucion.md](distribucion.md):

`.github/workflows/test.yml`:

```yaml
name: test
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:cov
      - uses: codecov/codecov-action@v4   # opcional

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: xvfb-run npm run test:e2e   # Electron necesita display en Linux
```

Tiempo total: ~3 min unit + ~5 min E2E. Aceptable para correr en cada PR.

---

## Métricas de cobertura objetivo

| Carpeta | Coverage % | Notas |
|---------|-----------|-------|
| `src/lib/` | **90%+** | Crítico, código puro, fácil |
| `src/store/` | **60%+** | I/O simple con localStorage |
| `src/components/` | **40%+** | Solo los con lógica |
| `src/pages/` | **20%+** | Smoke tests |
| `electron/` | **0%** | Cubierto por E2E |
| **Total** | **~60%** | Target realista |

No perseguir 100%. La cobertura no es el objetivo; **es un indicador de qué quedó sin testear de lo que importa**.

---

## Roadmap de testing para el rediseño

### Antes de empezar el rediseño
1. Instalar Vitest + setup mínimo.
2. Tests para `lib/geo.js`, `lib/calories.js`, `lib/fitness.js`, `lib/components.js` con el código **actual**. Sin esto, no hay red de seguridad para refactorizar.
3. Snapshot de `computeFitness` con datos reales.

### Durante el rediseño
4. Test-first para cualquier función nueva en `lib/`.
5. Tests de migración: cargar localStorage v1, asegurar que se migra correctamente a v2 (cuando se mueva a IndexedDB — ver [rendimiento.md](rendimiento.md)).

### Post-rediseño
6. Component tests para los componentes nuevos críticos.
7. E2E suite de 5–8 escenarios.
8. CI workflow corriendo todo en cada PR.
9. Badge de coverage en el README.

---

## Lo que NO hacer

- **No mockear `lib/`**. Es código puro, mockearlo es mockear lo que querés testear.
- **No tests visuales con snapshots de DOM completo**. Se rompen con cada cambio cosmético y nadie los actualiza con criterio.
- **No buscar coverage 100%**. Las últimas 20% son las menos valiosas y las más caras.
- **No testear Leaflet en jsdom**. Es perder tiempo, ya está testeado por su equipo.
- **No tests con `setTimeout` largos**. Si dependés del tiempo, usá `vi.useFakeTimers()`.
