# FRONT ASESPRO

Esta carpeta ahora tiene dos capas:

1. HTML estatico basado en Stitch (referencia visual inicial).
2. Base React/Next.js para construir la web productiva y reutilizable.

## 1) Referencia estatica

Archivos:

- `index.html`
- `alquiler.html`
- `venta.html`
- `detalle-propiedad.html`
- `detalle-penthouse.html`
- `servicio-limpieza.html`
- `contacto.html`

Levantar rapido:

```powershell
cd C:\Users\Fito\Documents\CODEX\ASESPRO\frontend
.\run-local.ps1
```

URL: `http://localhost:4173`

## 2) Base React/Next.js

Estructura principal:

- `app/` (App Router)
- `src/components/map/` (componente de mapa reusable)
- `src/features/property-explorer/` (pantalla base lista + mapa + filtros)

### Preparar entorno

```powershell
cd C:\Users\Fito\Documents\CODEX\ASESPRO\frontend
```

No requiere token para arrancar usando OpenStreetMap (Leaflet).

### Instalar y correr

```powershell
npm install
npm run dev
```

URL: `http://localhost:3000`

### Variables de entorno

Usar `.env.local` (copiando `.env.example`) para configurar:

- `NEXT_PUBLIC_WHATSAPP_PHONE` (telefono destino para CTAs)
- `NEXT_PUBLIC_SITE_URL` (base URL para metadata/sitemap/robots)
- `PROPERTY_DATA_SOURCE=mock|api`
- `PROPERTIES_API_BASE_URL` (solo si `PROPERTY_DATA_SOURCE=api`)

### Build de produccion

```powershell
npm run build
npm run start
```

## Estado actual

- Ya existe una base Next lista para iterar.
- El mapa reusable esta desacoplado (sin fetch interno) y usa Leaflet + OpenStreetMap.
- El padre controla filtros y bounds para busqueda de propiedades.
- Rutas activas: `/`, `/alquiler`, `/venta`, `/propiedad/[id]`, `/contacto`, `/servicio-limpieza`.
- Capa de datos preparada para swap `mock/api` via `PROPERTY_DATA_SOURCE`.
- Formularios de conversion listos para WhatsApp en contacto y limpieza.
- SEO base listo: metadata por ruta, `robots.txt`, `sitemap.xml`, `not-found` y `loading`.
- Mejora de accesibilidad/responsive: skip-link, foco visible, labels ARIA y validacion accesible de formularios.
