# Seguridad

Análisis específico de RutasMTB. El modelo de amenazas es chico — app local, sin servidor, sin login — pero hay puntos concretos a endurecer antes del rediseño.

## Modelo de amenazas

**Lo que NO está en riesgo**:
- Credenciales (no hay).
- Datos de terceros (la app es uso personal).
- Comunicación cliente-servidor (no hay backend).

**Lo que SÍ está en riesgo**:
1. **Integridad del proceso Electron**: si un atacante logra ejecutar JS arbitrario en el renderer (XSS), con la configuración actual quedaría aislado del FS y del sistema — pero si en el futuro se agregan APIs vía `contextBridge`, el escenario cambia.
2. **Entrada externa**: KMZ/KML vienen de archivos del usuario, pero también pueden venir de internet (descargados de Wikiloc, Strava, etc.). Un KML malicioso podría intentar XXE, XSS al renderizarse, o agotar memoria.
3. **Pérdida de datos**: todo está en `localStorage`, no hay backup. Un bug de la app, una corrupción del perfil, un "limpiar datos del sitio" → todo se pierde sin recuperación.
4. **Privacidad**: las rutas GPS contienen la ubicación exacta de tu casa, trabajo, lugares frecuentes. Si en el futuro se agrega export/share, hay que pensar en sanitización.

---

## Hardening concreto del Electron

### 1. Falta CSP

El `BrowserWindow` ([electron/main.cjs:7-16](../electron/main.cjs#L7-L16)) no define Content Security Policy. En dev cargás desde `http://localhost:5173` y en prod desde `file://`. Sin CSP, cualquier script inyectado puede:
- Llamar a `fetch()` a cualquier host (exfiltrar tus rutas).
- Cargar imágenes/scripts remotos.

**Acción**: agregar meta CSP en [index.html](../index.html) o, mejor, vía `session.defaultSession.webRequest.onHeadersReceived` en `main.cjs`. Política mínima razonable:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';   // styled-components/inline styles
img-src 'self' data: https://*.tile.openstreetmap.org;
connect-src 'self' https://*.tile.openstreetmap.org;
font-src 'self';
```

Nota: `img-src` y `connect-src` deben permitir tiles OSM o el mapa no carga.

### 2. `webSecurity` no está explícitamente seteado

Default es `true`, OK. Pero conviene declararlo explícito en [electron/main.cjs:11-14](../electron/main.cjs#L11-L14) para que un cambio futuro no lo afloje sin que se note en code review:

```js
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  webSecurity: true,
  sandbox: true,                  // ← agregar
  allowRunningInsecureContent: false,
}
```

`sandbox: true` corre el renderer en un sandbox de Chromium — es la defensa más fuerte contra exploit del renderer. Es compatible con tu setup actual porque no usás Node APIs en el renderer.

### 3. Bloquear navegación y nuevas ventanas

Si un link en el contenido importado (KML puede tener `<a href>`) abre `window.location = 'evil.com'`, el BrowserWindow navega y pierde el contexto de la app.

**Acción** en [electron/main.cjs](../electron/main.cjs):

```js
win.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url);                  // abre en el browser del sistema
  return { action: 'deny' };
});
win.webContents.on('will-navigate', (e, url) => {
  if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
    e.preventDefault();
    shell.openExternal(url);
  }
});
```

### 4. DevTools abiertos en dev — OK; en prod, deshabilitar

[electron/main.cjs:20](../electron/main.cjs#L20) abre DevTools solo en dev, perfecto. Para prod, bloquear el atajo `Ctrl+Shift+I` no es necesario para una app de uso personal, pero si en algún momento se distribuye, conviene cerrar `webContents.on('devtools-opened', ...)` o setear `devTools: false` en `webPreferences`.

---

## Parsing de entrada externa (KMZ/KML)

### 5. `DOMParser` con `application/xml`

[src/lib/kmz.js:28](../src/lib/kmz.js#L28) usa el `DOMParser` del browser. Este parser **no resuelve entidades externas** (no es vulnerable a XXE) y **no ejecuta scripts** (parseado declarativo). OK por defecto.

**Pero**: si en algún momento agregás `dangerouslySetInnerHTML` con contenido del KML (ej. mostrar `<description>` que puede contener HTML), tenés XSS. Hoy no lo hacés — verificado: el código solo lee `textContent` de elementos puntuales ([kmz.js:32-57](../src/lib/kmz.js#L32-L57)).

**Regla a documentar**: nunca renderizar HTML del KML con `dangerouslySetInnerHTML`. Si en el rediseño se quiere mostrar la descripción de la ruta, pasarla por `DOMPurify` o renderizar solo `textContent`.

### 6. Tamaño de archivo sin límite

[src/components/ImportKmz.jsx:14](../src/components/ImportKmz.jsx#L14) acepta cualquier archivo. Un KMZ de 500 MB (real, los hay si alguien comprime tracks de meses) congela el proceso al hacer `arrayBuffer()` + `JSZip.loadAsync()`.

**Acción**: validar `file.size < 50 MB` (o similar) antes de leer. Mensaje claro al usuario.

### 7. Zip bomb

`JSZip` descomprime sin límite. Un KMZ malicioso de 1 MB puede expandir a varios GB.

**Acción**: tras `loadAsync`, iterar `zip.files` y sumar `_data.uncompressedSize`. Rechazar si supera 100 MB. Ejemplo:

```js
const total = Object.values(zip.files).reduce((a, f) => a + (f._data?.uncompressedSize || 0), 0);
if (total > 100 * 1024 * 1024) throw new Error('KMZ demasiado grande al descomprimir');
```

### 8. Coordenadas inválidas pasan filtros débiles

[src/lib/kmz.js:53-55](../src/lib/kmz.js#L53-L55) filtra con `Number.isFinite(lat)` pero no valida rangos. Un KML con `lat = 1000` revienta el cálculo de `haversine` (devuelve NaN), que después se propaga a `distance_m`, a `computeRouteStats`, y queda guardado con stats inválidas.

**Acción**: en el filtro, validar `Math.abs(lat) <= 90 && Math.abs(lon) <= 180` y `Math.abs(ele) < 9000` (Everest + margen).

---

## Persistencia y backup

### 9. No hay export/backup automático

Todo vive en `%APPDATA%\rutasmtb\Local Storage\`. Si el usuario hace "Limpiar datos del sitio" en Electron (improbable, pero existe vía DevTools), pierde todo.

**Acción**:
- **Botón "Exportar todo"** en Perfil que descargue un JSON con `{ routes, trainings, components, profile, bikeSpec, exportedAt, schemaVersion }`.
- **Auto-backup** en disco: al cerrar la app, escribir el JSON a `%APPDATA%\rutasmtb\backups\backup-YYYY-MM-DD.json` y mantener los últimos 7. Esto requiere usar `ipcMain`/`ipcRenderer` o `app.getPath('userData')` desde el main.
- **Importar backup** con validación de schema y merge no-destructivo (no sobrescribir si el ID ya existe sin preguntar).

### 10. Versionado de schema

No hay `schemaVersion` en ningún campo. El día que cambien la forma de `route` o `training`, no hay forma de migrar.

**Acción**: agregar `schemaVersion: 1` al objeto raíz de cada `load()` y hacer una capa de migraciones (funciones `migrate_1_to_2(data)`) en [src/store/storage.js](../src/store/storage.js).

---

## Privacidad

### 11. Las rutas son datos sensibles

Una ruta MTB exportada de tu reloj sale típicamente desde tu casa. Si compartís el JSON exportado, estás compartiendo tu dirección con precisión de ±5 m.

**Acción** (cuando se agregue export/share):
- Toggle "Eliminar primeros/últimos 500 m" (truncate). Lo hace Strava con "privacy zones".
- Toggle "Eliminar timestamps" (para no revelar horarios habituales).
- Warning explícito antes de exportar: "Este archivo contiene tu ubicación GPS exacta".

### 12. Sin telemetría — mantenerlo así

El README dice "sin tracking". Verificado: no hay `fetch` ni `XMLHttpRequest` a hosts externos en el código. **Mantener esto como regla de proyecto** — si en el futuro alguien quiere agregar analytics, debe ser opt-in explícito y enviar solo conteos agregados, nunca contenido de rutas.

---

## Cadena de dependencias

### 13. Leaflet CSS desde unpkg.com

[index.html:7](../index.html#L7) carga CSS desde un CDN público sin SRI hash. unpkg podría servir contenido malicioso (improbable, pero el vector existe) y se aplicaría a tu app.

**Acción**: como dice [rendimiento.md](rendimiento.md), inlinear con `import 'leaflet/dist/leaflet.css'` desde el bundle. Cierra este vector y mejora el arranque.

### 14. Auditar dependencias

`react-leaflet` y `jszip` son maduras pero conviene tener un `npm audit` en el flujo. Antes de cada release: `npm audit --production` y resolver `high` / `critical`.

**Acción**: agregar en CI (o como pre-commit) un check de `npm audit --audit-level=high`.

---

## Checklist de release de seguridad

Antes de empaquetar una versión distribuible:

- [ ] CSP configurada y testeada (no romper tiles OSM)
- [ ] `sandbox: true` en `webPreferences`
- [ ] `setWindowOpenHandler` + `will-navigate` bloqueando navegación externa
- [ ] `devTools: false` en webPreferences de producción (opcional)
- [ ] Validación de tamaño + zip-bomb en import KMZ
- [ ] Validación de rangos lat/lon/ele
- [ ] Export/backup funcionando
- [ ] `schemaVersion` en todos los stores
- [ ] CSS de Leaflet inlinedo (sin CDN)
- [ ] `npm audit --audit-level=high` sin findings
- [ ] Sourcemaps `'hidden'` o no shippeados (ver [rendimiento.md](rendimiento.md))
