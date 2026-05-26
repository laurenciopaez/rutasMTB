# Distribución

Cómo pasar de "lo corro con `npm run electron:dev`" a "un usuario hace doble click y la app se abre", sin gastar plata.

## Estado actual

[package.json](../package.json) no tiene config de empaquetado. No hay `electron-builder` ni `electron-forge`. No hay iconos. No hay CI. Hay que armar todo el pipeline desde cero.

---

## Decisión 1: empaquetador

| Opción | Pro | Contra | Recomendación |
|--------|-----|--------|---------------|
| **electron-builder** | Standard de facto, multi-target, auto-update built-in, NSIS/DMG/AppImage out-of-the-box | Config en YAML/JSON puede ser densa | ✅ Esta |
| **electron-forge** | Mantenido por Electron team, plugins, integración con Vite | Auto-update menos pulido, ecosistema más chico | Alternativa válida |
| **electron-packager** | Simple, sin opinions | No genera instaladores, hay que hacerlo aparte | No |

Ir con **electron-builder**. Es el path más probado para apps Electron pequeñas distribuidas en GitHub Releases.

### Setup mínimo

```bash
npm install --save-dev electron-builder
```

Agregar a `package.json`:

```json
{
  "build": {
    "appId": "com.rutasmtb.app",
    "productName": "RutasMTB",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "electron/**/*", "package.json"],
    "win": {
      "target": [{ "target": "nsis", "arch": ["x64"] }],
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }],
      "icon": "build/icon.icns",
      "category": "public.app-category.healthcare-fitness"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icon.png",
      "category": "Sports"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  },
  "scripts": {
    "pack": "vite build && electron-builder --dir",
    "dist": "vite build && electron-builder",
    "dist:win": "vite build && electron-builder --win",
    "dist:mac": "vite build && electron-builder --mac",
    "dist:linux": "vite build && electron-builder --linux"
  }
}
```

---

## Decisión 2: targets

| Plataforma | Target | Tamaño aprox | Notas |
|-----------|--------|--------------|-------|
| **Windows** | NSIS installer (.exe) | ~80 MB | El 80% de usuarios MTB en LATAM están en Windows. Prioridad 1. |
| **macOS Intel** | DMG | ~90 MB | Necesita firma + notarización (ver abajo). Sin eso, el usuario tiene que click derecho → abrir. |
| **macOS Apple Silicon** | DMG arm64 | ~90 MB | Ídem. |
| **Linux** | AppImage + .deb | ~85 MB | AppImage = single-file portable. .deb para Ubuntu/Debian/Mint. |

**Para v1**: arrancar solo con Windows y AppImage Linux. Sumar macOS cuando sea necesario (la firma cuesta plata).

---

## Decisión 3: firma de código

Esto es el verdadero pain point de distribuir Electron.

### Windows
- **Sin firma**: SmartScreen muestra "Windows protegió su PC — editor desconocido". El usuario tiene que click "Más info → Ejecutar de todas formas". Es feo pero funciona.
- **Con firma EV**: 3 segundos en pasar. **$200–400/año** (Sectigo, DigiCert).
- **Con firma normal OV**: tarda semanas en ganar reputación, $80–150/año.

**Recomendación**: lanzar sin firmar. Agregar en el README y en el sitio una sección "primera vez en Windows" explicando el click. Si la app crece, comprar EV.

### macOS
- **Sin firma**: gatekeeper bloquea. El usuario hace click derecho → Abrir → confirmar. Muchos usuarios no saben hacer esto y abandonan.
- **Con firma + notarización**: requiere Apple Developer Program ($99/año) + setup de keys + paso de notarización (electron-builder lo automatiza).

**Recomendación**: si vas a publicar en macOS, asumí los $99/año o no lo publiques. Sin firma, la experiencia es mala.

### Linux
- No hay concepto de firma para AppImage / .deb. Solo querés tener un GPG signature opcional en el repo de releases.

---

## Decisión 4: distribución

### GitHub Releases (recomendado para empezar)

- **Costo**: $0.
- **Hosting**: bandwidth ilimitado para repos públicos.
- **Auto-update**: electron-builder + `electron-updater` se integran nativamente con GitHub Releases. El usuario instala v0.1 y la app se actualiza sola a v0.2 cuando publiques.

Workflow:
1. Bump version en `package.json`.
2. `git tag v0.1.0 && git push --tags`.
3. GitHub Action (ver abajo) corre electron-builder y sube los binarios al release.
4. Las instalaciones existentes detectan el release vía `electron-updater` y prompt al usuario.

### Sitio propio + Cloudflare R2 / Pages
Para una landing más cuidada (ver [marketing.md](marketing.md)), con descargas que enlazan al GitHub Release. R2 es gratis para egress hasta cierto límite si en algún momento querés alojar fuera de GitHub.

### App stores
- **Microsoft Store**: requiere cuenta de developer (~$20 una vez). Útil para discoverability. Las apps Electron pueden subirse como `.appx`. Considerable a futuro.
- **Mac App Store**: requiere $99/año + sandboxing estricto que probablemente rompa cosas. No vale la pena.
- **Snap Store / Flathub** (Linux): bueno pero requiere mantenimiento extra. No prioridad.
- **Winget**: el package manager de Windows. Es muy fácil agregar la app a winget una vez que tenés un release público — solo es un PR a `microsoft/winget-pkgs` con el manifest YAML. Alta visibilidad para usuarios power.

---

## Decisión 5: CI/CD

GitHub Actions, gratis para repos públicos.

`.github/workflows/release.yml`:

```yaml
name: release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest]   # agregar macos-latest si firmás
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run dist
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}   # para subir al release
```

Tiempo total por release: ~5–8 minutos en GitHub-hosted runners.

---

## Decisión 6: auto-update

`electron-updater` (parte de la familia electron-builder).

```bash
npm install electron-updater
```

En [electron/main.cjs](../electron/main.cjs):

```js
const { autoUpdater } = require('electron-updater');
app.whenReady().then(() => {
  createWindow();
  if (!isDev) autoUpdater.checkForUpdatesAndNotify();
});
```

Comportamiento default: cada vez que arranca la app, hace fetch al `latest.yml` de GitHub Releases. Si hay versión nueva, descarga en background y prompt al usuario al cerrar. **Una sola línea, gratis**.

**Cuidado con la promesa "sin servidor"**: técnicamente esto es un fetch a `github.com` en cada arranque. Es razonable y se puede mencionar en docs como "única conexión externa para chequear actualizaciones — apagable en Settings".

---

## Decisión 7: iconos y assets

Tarea concreta antes de empaquetar:

- **icon.ico** (Windows): 256×256 con multiple sizes (16, 32, 48, 64, 128, 256).
- **icon.icns** (macOS): generado con `iconutil` desde un `.iconset` con varios tamaños.
- **icon.png** (Linux): 512×512.

Herramientas:
- **electron-icon-builder** o `iconutil` (mac) para generar todos los formatos desde un PNG/SVG fuente.
- Si todavía no tenés logo, un placeholder simple alcanza para el primer release. Reemplazable después sin breaking changes.

---

## Tamaño del binario

Electron base es pesado (~60–80 MB descomprimido). Para minimizar:

- `npm prune --production` antes del empaquetado (electron-builder lo hace por default).
- `asar: true` en config (default) comprime el bundle.
- No incluir `dist/.map` files (ver [rendimiento.md](rendimiento.md)).
- Considerar **Tauri** como alternativa a largo plazo: instalador de ~5 MB vs ~80 MB. Reescritura grande, no para v1, pero sí para pensar v2.

---

## Roadmap de distribución

### Sprint 1 — empaquetar
- electron-builder configurado en `package.json`.
- Iconos placeholder.
- `npm run pack` genera un .exe que abre la app en Windows.

### Sprint 2 — primer release público
- Crear repo GitHub público (si no está ya).
- Configurar GitHub Actions con el workflow de arriba.
- Tag v0.1.0 → release con binarios Windows + AppImage Linux.
- Sección "Descargar" en el README enlazando al release.

### Sprint 3 — auto-update
- Integrar `electron-updater`.
- Toggle "buscar actualizaciones al iniciar" en Perfil (opt-out).
- Test: instalar v0.1.0, publicar v0.1.1, verificar que actualiza.

### Sprint 4 — visibilidad
- Sitio web simple en GitHub Pages.
- Submit a winget.
- Posts en r/MTB / foros locales (ver [marketing.md](marketing.md)).

### Sprint 5 (opcional) — macOS
- Apple Developer account.
- Firma + notarización automatizadas en CI.
- Release dual Intel + ARM.

---

## Checklist de release

Para cada versión nueva:

- [ ] `package.json` version bumped (semver)
- [ ] CHANGELOG.md actualizado
- [ ] `npm run dist` localmente sin errores
- [ ] App empaquetada testeada manualmente: import, save, restart, persist
- [ ] Tag `vX.Y.Z` pusheado
- [ ] CI verde, binarios en GitHub Release
- [ ] Release notes en GitHub con bullets de features/fixes
- [ ] (Si aplica) PR a winget-pkgs con nueva versión
