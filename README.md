# RutasMTB

App de escritorio **100% gratuita** para llevar la base central de tus entrenamientos en bici de montaña: rutas, componentes, desarrollos y forma física.

Sin cuentas, sin suscripciones, sin tracking, sin API keys, sin servidores. Todo corre en tu PC y los datos quedan en tu PC.

## Por qué gratuita

La mayoría de las apps de ciclismo (Strava, Garmin Connect, Komoot, TrainingPeaks…) son freemium: lo básico es gratis, pero las funciones útiles — análisis de potencia, planificación, mapas offline, exportación — están detrás de un paywall mensual. RutasMTB nace como alternativa libre y autoalojada en tu propia máquina:

- **Sin pagos** — ni únicos ni recurrentes. Para siempre.
- **Sin cuenta** — no hay registro, no hay email, no hay "iniciar sesión con Google".
- **Sin telemetría** — la app no llama a casa. No hay analytics, ni crash reports, ni pings.
- **Sin API keys** — mapas con OpenStreetMap, sin Mapbox / Google Maps de por medio.
- **Sin nube** — tus rutas, trainings y componentes viven en tu disco. Vos hacés el backup cuando querés.
- **Sin límites artificiales** — importá las rutas que quieras, registrá los entrenamientos que quieras.

## Qué hace

- **Rutas** — importá KMZ / KML, ves el trazado sobre OpenStreetMap, perfil de altura, distancia (haversine) y desnivel +/− con suavizado.
- **Entrenamientos** — asociás cada salida a una ruta (con % parcial opcional), con viento, carga extra y RPE. Calcula kcal/W/velocidad con modelo físico (rodadura + aero + gravedad + headwind proyectado al bearing).
- **Dashboard** — km y desnivel por semana / mes / total, alertas de componentes pendientes.
- **Componentes** — tracking por km y por días con presets editables (suspensión, transmisión, frenos, ruedas, contacto). Service log que resetea contadores. Estados ok / pronto / cambiar ya / vencido.
- **Perfil de ciclista** — peso, edad, sexo, altura, peso bici, FTP opc., coeficientes (CdA, Crr, η) editables.
- **Forma física** — nivel dinámico tipo CTL/ATL/TSB, etiquetas (sin actividad → experto) y estado de forma (descansado / en forma / cargado / sobrecarga).
- **Mi bicicleta** — specs (rodado, ancho de neumático, palanca, plato/s, cassette con presets SRAM/Shimano), override de circunferencia, tabla de desarrollos (matriz plato×piñón), heatmap de marchas y barra ordenada por desarrollo.

## Stack (todo open source)

- Electron 32 + React 18 + Vite 5
- Leaflet + OpenStreetMap (sin API keys, sin límites de tiles)
- JSZip para parsear KMZ (= ZIP + KML)
- Persistencia: `localStorage` del WebView de Electron, namespace `rutasmtb:*`
  (ubicación típica: `%APPDATA%\rutasmtb\Local Storage`)

## Instalación y uso

Requisitos: Node.js 18+.

```bash
npm install                  # instalar deps
npm run electron:dev         # Vite + Electron juntos (modo desarrollo)
npm run build                # build de la web a dist/
npm run electron             # corre electron contra dist/ (production)
npm run dev                  # solo Vite en http://localhost:5173 (sin Electron)
```

## Tus datos son tuyos

Todo se guarda en `localStorage` del perfil de Electron. No hay sincronización con la nube. Para hacer backup, copiá la carpeta `%APPDATA%\rutasmtb\` (o el equivalente en macOS/Linux). Para migrar a otra PC, copiá la misma carpeta.

Si querés borrar todo, borrá la carpeta. Listo.

## Estado por fase

**Fase 1 — hecho**
- Importar rutas desde KMZ / KML
- Lista de rutas + mapa con polyline + perfil de altura SVG
- Cálculo de distancia (haversine), desnivel +/− con suavizado de elevación
- Cargar entrenamientos asociados a una ruta (con porcentaje parcial opcional)
- Dashboard: km y desnivel por semana / mes / total

**Fase 2 — hecho**
- Componentes con categorías: Suspensión, Transmisión, Frenos, Ruedas, Contacto, Otro
- Tracking de km por componente (suma trainings desde fecha de instalación)
- Service log: registrar service resetea contadores
- Alertas por km y por días, con presets editables por categoría
- Estados: ok / pronto (≥80%) / cambiar ya (≥100%) / vencido (≥110%)
- Widget de alertas pendientes en Dashboard
- Retirar / reactivar / eliminar componentes

**Fase 3 — hecho**
- Perfil de ciclista: peso, edad, sexo, altura, peso bici, FTP opc., y coeficientes editables (CdA, Crr, η)
- Cálculo de calorías con modelo físico (rodadura + aerodinámica + gravedad) y headwind proyectado al bearing de la ruta
- Trainings con viento (vel + dirección), carga extra, RPE; preview en vivo de kcal/W/km-h
- Tipo de ruta: entrenamiento vs viaje multi-día (días + carga); dificultad calculada con fatiga acumulada
- Nivel dinámico estilo CTL/ATL/TSB con etiquetas (sin actividad → experto) y forma (descansado / en forma / cargado / sobrecarga)

**Fase 4 — hecho**
- Specs de bici: rodado, ancho de neumático, longitud de palanca, plato/s y cassette (con presets SRAM/Shimano)
- Override de circunferencia para valores empíricos (rodada cargada)
- Tabla de desarrollos: matriz plato×piñón con métricas seleccionables (desarrollo / velocidad@cadencia / ratio / gain ratio)
- Heatmap de marchas + barra ordenada por desarrollo para ver overlap y rango
- Tabs en "Mi bicicleta": Componentes / Desarrollos / Specs

## Estructura

```
electron/main.cjs           # proceso principal de Electron
src/
  main.jsx                  # entry React
  App.jsx                   # router + sidebar
  styles.css                # tema dark
  lib/
    geo.js                  # haversine, desnivel, bounds, formatters
    kmz.js                  # parser KMZ/KML -> { name, points }
  store/
    storage.js              # wrapper localStorage + pub/sub
    useRoutes.js            # CRUD rutas
    useTrainings.js         # CRUD entrenamientos
  components/
    ImportKmz.jsx
    RouteMap.jsx
    ElevationProfile.jsx
  pages/
    Dashboard.jsx
    RoutesPage.jsx
    RouteDetail.jsx
    Trainings.jsx
    Bike.jsx
    Profile.jsx
```

## Licencia

Uso libre, personal y sin restricciones. Si querés modificarla, redistribuirla o aportar, adelante.
