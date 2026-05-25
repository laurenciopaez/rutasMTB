# RutasMTB

App de escritorio para llevar la base central de mis entrenamientos en bicicleta.
Datos guardados localmente (localStorage del WebView de Electron — ubicación en
`%APPDATA%\rutasmtb\Local Storage` o similar).

## Stack

- Electron 32 + React 18 + Vite 5
- Leaflet + OpenStreetMap (sin API keys, sin límites)
- JSZip para parsear KMZ (= ZIP + KML)
- Persistencia: `localStorage` con namespace `rutasmtb:*`

## Comandos

```bash
npm install                  # instalar deps
npm run dev                  # dev server Vite (web only) en http://localhost:5173
npm run electron:dev         # Vite + Electron juntos (lo habitual)
npm run build                # build de la web a dist/
npm run electron             # corre electron contra dist/ (production)
```

## Estado por fase

**Fase 1 — MVP (hecho)**
- Importar rutas desde KMZ / KML
- Lista de rutas + mapa con polyline + perfil de altura SVG
- Cálculo de distancia (haversine), desnivel + / − (con suavizado de elevación)
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

**Fase 4 — pendiente**
- Calculadora de desarrollos (relación de cambios)

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
