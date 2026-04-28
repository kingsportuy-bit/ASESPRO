# ARQUITECTURA DEL SISTEMA

## Recomendacion oficial para salida a produccion

Usar `Next.js` como frontend publico y backoffice en un solo proyecto, con `Supabase` como backend gestionado.

No abrir un backend Node separado en esta etapa: suma tiempo hoy y no agrega valor inmediato para un proyecto chico.

---

## Stack

- Frontend y admin: Next.js 14 + React + TypeScript
- Datos: Supabase PostgreSQL
- Auth: Supabase Auth
- Archivos multimedia: Supabase Storage
- Despliegue: Vercel (app) + Supabase (datos y storage)

---

## Capas

1. `app/` rutas publicas y admin.
2. `src/features` logica de negocio por dominio (publicaciones, inmuebles, alquileres).
3. `src/lib` acceso a datos (repositorios, validaciones, adaptadores).
4. Supabase como capa persistente con RLS y politicas por rol.

---

## Dominios tecnicos

- `public_listings`: consumo para web publica (solo datos visibles)
- `admin_listings`: ABM de publicaciones y media
- `owners`: fichas de propietarios
- `properties`: inventario de inmuebles
- `rentals`: contratos y alquileres activos
- `inquiries`: consultas entrantes

---

## API interna recomendada (Route Handlers)

- `GET /api/public/listings`
- `GET /api/public/listings/:id`
- `GET /api/admin/listings`
- `POST /api/admin/listings`
- `PUT /api/admin/listings/:id`
- `POST /api/admin/listings/:id/media`
- `GET /api/admin/owners`
- `POST /api/admin/owners`
- `GET /api/admin/properties`
- `POST /api/admin/properties`
- `GET /api/admin/rentals/active`

---

## Seguridad

- Login por Supabase Auth
- Roles minimos: `admin`, `operador`
- RLS activa en todas las tablas
- Bucket de media privado con URLs firmadas para admin
- Publico solo consume vistas filtradas de estado `activo`

---

## Escalabilidad realista

- Modelo normalizado (sin campos JSON para relaciones clave)
- Indices en estado, operacion, ubicacion y fechas
- Separacion entre inmueble fisico y publicacion comercial
- Preparado para agregar automatizaciones sin romper contratos
