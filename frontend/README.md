# FRONT ASESPRO

Base web publica en Next.js para ASESPRO.

## Estado actual

- Proyecto productivo desplegable con Docker.
- Dominio web: `https://asespro.codexa.uy`
- Dominio panel (routing listo): `https://panelasespro.codexa.uy`
- El panel admin funcional aun esta en implementacion.

---

## Estructura principal

- `app/` (App Router)
- `src/components/map/` (mapa reusable)
- `src/features/property-explorer/` (lista + mapa + filtros)
- `src/lib/propertyRepository.ts` (capa de acceso a datos)

---

## Desarrollo local

```powershell
cd C:\Users\Fito\Documents\CODEX\ASESPRO\frontend
npm install
npm run dev
```

URL local: `http://localhost:3000`

---

## Variables de entorno

Configurar en `.env.local`:

- `NEXT_PUBLIC_WHATSAPP_PHONE`
- `NEXT_PUBLIC_SITE_URL`
- `PROPERTY_DATA_SOURCE=mock|api`
- `PROPERTIES_API_BASE_URL` (si `PROPERTY_DATA_SOURCE=api`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Build de produccion

```powershell
cd C:\Users\Fito\Documents\CODEX\ASESPRO\frontend
npm run build
npm run start
```

---

## Despliegue en VPS (resumen)

Pipeline operativo:

1. Push a GitHub (`main`).
2. En VPS (`/opt/asespro`): `git pull`.
3. Build Docker de `frontend`.
4. `docker stack deploy -c deploy.stack.yml asespro`.

Guia completa:

- `Docs/GUIA_GENERAL_DESPLIEGUE_GITHUB_VPS.md`
