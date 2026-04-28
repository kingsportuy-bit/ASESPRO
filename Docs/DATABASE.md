# BASE DE DATOS - ESTRUCTURA DE PRODUCCION

Todas las tablas usan prefijo `asespro_`.

---

## Enums

- `asespro_operation`: `alquiler`, `venta`
- `asespro_listing_status`: `activo`, `desactivado`, `alquilado`, `vendido`
- `asespro_media_type`: `photo`, `video`
- `asespro_rental_status`: `activo`, `finalizado`, `mora`
- `asespro_payment_status`: `pago`, `pendiente`, `atrasado`

---

## Tablas nucleares

### `asespro_properties` (inmueble fisico)

- `id` (uuid, pk)
- `code` (text, unico)
- `title` (text)
- `description` (text)
- `property_type` (text: casa, apartamento, terreno, etc)
- `location_text` (text)
- `latitude` (numeric)
- `longitude` (numeric)
- `bedrooms` (int)
- `bathrooms` (int)
- `area_m2` (numeric)
- `is_active` (bool)
- `created_at`, `updated_at`

Indices:

- `(is_active)`
- `(latitude, longitude)`
- `(property_type)`

### `asespro_owners` (propietarios)

- `id` (uuid, pk)
- `full_name` (text)
- `phone` (text)
- `email` (text)
- `notes` (text)
- `created_at`, `updated_at`

### `asespro_property_owners` (relacion N:N)

- `property_id` (fk -> asespro_properties)
- `owner_id` (fk -> asespro_owners)
- `ownership_share` (numeric opcional)
- pk compuesta `(property_id, owner_id)`

### `asespro_listings` (publicacion comercial)

- `id` (uuid, pk)
- `property_id` (fk -> asespro_properties)
- `title` (text)
- `description` (text)
- `price_amount` (numeric)
- `price_currency` (text default `USD`)
- `status` (asespro_listing_status)
- `published_at` (timestamptz)
- `created_at`, `updated_at`

Indices:

- `(status)`
- `(property_id)`
- `(created_at desc)`

### `asespro_listing_operations` (permite alquiler, venta o ambas)

- `listing_id` (fk -> asespro_listings)
- `operation` (asespro_operation)
- pk compuesta `(listing_id, operation)`

### `asespro_listing_media` (video y fotos)

- `id` (uuid, pk)
- `listing_id` (fk -> asespro_listings)
- `media_type` (asespro_media_type)
- `storage_path` (text)
- `public_url` (text)
- `sort_order` (int)
- `is_cover` (bool)
- `created_at`

Reglas:

- una publicacion puede tener muchas `photo`
- una publicacion puede tener solo una `video`

Indice/constraint recomendado:

- unique parcial por `listing_id` cuando `media_type = 'video'`

---

## CRM y operacion

### `asespro_clients`

- `id`, `full_name`, `phone`, `email`, `notes`, `created_at`

### `asespro_inquiries`

- `id`
- `client_id` (fk)
- `listing_id` (fk)
- `message`
- `source` (web, whatsapp, telefono)
- `created_at`

### `asespro_rentals`

- `id`
- `property_id` (fk)
- `client_id` (fk)
- `monthly_price`
- `start_date`
- `end_date`
- `status` (asespro_rental_status)
- `created_at`, `updated_at`

### `asespro_payments`

- `id`
- `rental_id` (fk)
- `due_date`
- `paid_date`
- `amount`
- `status` (asespro_payment_status)
- `created_at`

---

## Vistas para planillas internas

- `asespro_vw_publicaciones_admin`
- `asespro_vw_fichas_propietarios`
- `asespro_vw_fichas_inmuebles`
- `asespro_vw_alquileres_activos`

Estas vistas simplifican la gestion diaria del operador sin romper normalizacion.

---

## Reglas de seguridad y crecimiento

- RLS activa en todas las tablas
- politicas por rol (`admin`, `operador`)
- auditoria minima con `created_at/updated_at`
- migraciones versionadas para cambios de estructura
