# Marketing

Análisis de posicionamiento para RutasMTB. La app es de uso personal hoy, pero el rediseño es buena oportunidad para pensar en distribución pública aun si sigue gratis y sin monetización.

## Quiénes son los usuarios objetivo

Tres segmentos, en orden de fit más natural:

### 1. Ciclista MTB recreativo / aficionado serio
- Tiene 1–3 bicis, sale 2–4 veces por semana.
- Usa Garmin/Wahoo/Strava pero le molestan: el paywall de Strava para análisis de potencia, que Garmin Connect es lento y feo, que ninguno trackea bien el mantenimiento de componentes.
- **Por qué le sirve RutasMTB**: tracking de componentes serio (km + días por categoría con presets), cálculo de calorías sin power meter, todo gratis y local.

### 2. Ciclista que arma viajes / bikepacking
- Planifica salidas multi-día con carga extra.
- Hoy mezcla Komoot (paid) + Excel + Google Earth.
- **Por qué le sirve**: el modo `trip` con días + carga, dificultad ajustada por fatiga acumulada, perfil de altura, todo offline.

### 3. Mecánico de bici / taller pequeño
- Lleva control de servicios de varios clientes.
- Hoy usa libreta o Excel.
- **Por qué le sirve**: catálogo de componentes con presets de mantenimiento por categoría, service log, alertas.
- **Limitación actual**: la app es single-user. Para taller habría que permitir múltiples perfiles/bicis. Es una extensión natural del rediseño.

El segmento 1 es el más amplio y el menos servido. Apuntar el mensaje principal ahí.

---

## Posicionamiento

### La promesa en una frase

> **El cuaderno digital del ciclista — gratis, sin cuenta, en tu PC.**

### One-liner alternativo (más técnico)

> Strava + TrainingPeaks + un Excel de mantenimiento, sin suscripción, sin la nube, sin la cuenta.

### Propuesta de valor por capa

| Capa | Mensaje |
|------|---------|
| **Lo emocional** | Tus datos son tuyos. Sin paywall escondido, sin "iniciar sesión con Google" para ver tu propia ruta. |
| **Lo funcional** | Importás KMZ/KML, ves rutas en el mapa, llevás cuenta de km de cada componente, calculás calorías reales con física (no fórmulas de pulso), seguís tu forma física estilo CTL/TSB. |
| **Lo técnico** | Electron + React, OpenStreetMap, todo localStorage. Open source. |

---

## Competencia y diferenciación

| Producto | Fortaleza | Donde RutasMTB gana |
|----------|-----------|---------------------|
| **Strava** | Red social, segmentos | Free real (no freemium), componentes serios, sin cuenta |
| **Komoot** | Planificación, rutas curadas | Free, multi-día con carga, calorías con física |
| **Garmin Connect** | Integración con dispositivos | Mucho más rápido y simple, mantenimiento granular |
| **TrainingPeaks** | CTL/ATL/TSB profesional | Free, no requiere suscripción para análisis |
| **myCockpit / TechMyBike** | Tracking de componentes | Cálculo de fitness, mapas, calorías |
| **Excel / Notion** | Flexibilidad | Especializado, parser KMZ, presets MTB |

**El gap que RutasMTB ocupa**: la intersección de tracking de componentes serio + análisis de fitness CTL/TSB + cálculo físico de calorías, en una sola app gratis y local. Ninguno de los grandes lo hace junto.

---

## Mensajes para distintos canales

### Para Reddit (r/MTB, r/bikepacking, r/Velo)
**Tono**: técnico, anti-suscripción. La comunidad de Reddit valora open source y desconfía del freemium.

> *Cansado de que Strava me cobre $80/año para ver mi propia potencia estimada, armé una app desktop que hace tracking de componentes (km + días por pieza), calcula calorías con modelo físico (CdA, Crr, headwind), y CTL/ATL/TSB sin necesidad de power meter. Todo local, sin cuenta, gratis para siempre. Importa KMZ/KML de Google Earth.*

### Para foros locales en español (Bicicleteros Argentina, Foros MTB España, etc.)
**Tono**: práctico. Resaltar que es 100% en español.

> *Hice una app de escritorio gratis para llevar el control de mis salidas en MTB: importás los KMZ, registrás los entrenamientos, lleva la cuenta de km de cada pieza (pastillas, cadena, suspensión, etc.) y te avisa cuándo cambiar. Sin cuenta, sin suscripción, todo queda en tu PC.*

### Para X / Twitter
**Tono**: punchy.

> *Construí RutasMTB: el cuaderno digital del ciclista. Free, sin cuenta, local. Hace lo que Strava te cobra + tracking de componentes que Strava no hace. Open source. [link]*

### Para Hacker News
**Tono**: "Show HN" + énfasis técnico.

> *Show HN: RutasMTB — local-first MTB training log with physics-based calorie model and component lifecycle tracking*
>
> Built this because I was tired of three subscriptions to track one hobby. Electron + React, all data in localStorage (moving to IndexedDB next), uses OpenStreetMap (no API keys), parses KMZ/KML, implements CTL/ATL/TSB from TrainingPeaks methodology, and tracks component wear by km + days with editable presets per category. Zero analytics, zero accounts.

### Para YouTube (canal de un ciclista influencer)
- Reach out a canales medianos (10–100k subs) de ciclismo en español.
- Ángulo: "App gratis para llevar el control de tu bici sin pagar Strava Premium".
- Ofrecer demo + invitar a sugerir features.

---

## Pricing y monetización

**Decisión clara**: gratis para siempre, sin freemium, sin donaciones intrusivas.

Si en algún momento se quiere sustentabilidad sin romper la promesa:
- **Donaciones opcionales** (Ko-fi / Buy Me a Coffee) con link en el footer, nunca un modal.
- **Sponsorship de fabricantes de componentes** para que sus presets de durabilidad estén en el catálogo oficial (con disclosure visible). Riesgo: corrompe la neutralidad. Probablemente no vale la pena.
- **Versión "Pro" jamás** — rompería la promesa.

---

## Naming y branding

### Nombre
**RutasMTB** funciona pero limita: deja afuera implícitamente al ciclista de ruta/gravel/bikepacking puro, y al usuario de habla no-hispana.

Opciones para el rediseño:
- **Mantenerlo** y posicionar como "MTB-first, sirve para todo".
- **Renombrar a algo neutral**: `Trazo`, `Velocímetro`, `Mochila` (todos breves, en español, libres en npm probablemente).
- **Bilingüe corto**: `RideLog`, `BikeKit`, `Pedalt`.

Recomendación: mantener RutasMTB para v1.0 pública (es lo que ya conocés, y el mercado hispanohablante de MTB es grande), y reservar el cambio de nombre para un eventual v2 con sync.

### Logo / identidad
Hoy no hay logo. Para una v1 pública:
- Icono simple: una corona dentada estilizada (chainring) + el contorno de un trazo de ruta.
- Paleta: verde lima (`#4ade80` ya está en el código) + dark base. Coherente con lo que ya tenés.
- Tipografía: una sans monoespaciada para los números (Inter / JetBrains Mono).

---

## Sitio web

Una landing simple alcanza. Una sola página con:

1. **Hero**: la promesa de una frase + screenshot del Dashboard.
2. **3 features visuales**: tracking de componentes, dashboard de fitness, mapa + perfil.
3. **Por qué es gratis** (la sección que ya está en el README — es el diferencial principal).
4. **Descargar**: links a los binarios de GitHub Releases (Windows / macOS / Linux).
5. **FAQ corta**: "¿necesito cuenta?", "¿se conecta a Strava?", "¿se sube a la nube?", "¿es código abierto?".

Hospedaje: GitHub Pages o Cloudflare Pages, ambos gratis. Dominio: `rutasmtb.com` o `.app` (~$10/año), o subdominio en GitHub si querés cero gasto.

---

## Comunidad

Si la app crece de "uso personal" a "uso público":

- **GitHub Issues como único canal de soporte**: simple, público, indexable.
- **GitHub Discussions** para feature requests y compartir builds personalizados.
- **Sin Discord propio** hasta tener masa crítica (un canal vacío hace mala imagen). Mejor sumar un thread fijo en r/MTB o en un foro existente.

---

## Métricas de éxito (sin telemetría)

Como la app no manda telemetría, los KPI son indirectos:
- **GitHub stars** — vanity pero útil para validar interés.
- **Downloads en GitHub Releases** por versión.
- **Issues abiertos / cerrados** — engagement real.
- **Menciones en Reddit / foros** — manualmente, una vez por mes.

Definir target conservador para los primeros 6 meses post-rediseño: 500 stars, 50 downloads/release, 10 issues activos. Si supera eso, considerar invertir más en distribución (ver [distribucion.md](distribucion.md)).
