# SISTEMA - ASESPRO INMOBILIARIA

## Vision general

ASESPRO se compone de dos productos conectados:

1. Web publica para captar consultas calificadas.
2. Panel interno para operar publicaciones y gestion inmobiliaria.

La web no cierra operaciones; convierte a WhatsApp.

---

## Objetivo de produccion

Entregar un sistema usable hoy por el operador, con base tecnica escalable para crecer sin rehacer todo.

---

## Modulos publicos

- Home (`/`)
- Listado alquiler (`/alquiler`)
- Listado venta (`/venta`)
- Detalle de propiedad/publicacion (`/propiedad/[id]`)
- Contacto (`/contacto`)
- Integracion WhatsApp en puntos clave
- Mapa como vista principal de exploracion

---

## Modulos internos (admin)

- Publicaciones: alta, edicion, activacion/desactivacion, cambio de estado
- Propietarios: ficha base y vinculacion con inmuebles
- Inmuebles: ficha tecnica, ubicacion, estado operativo
- Alquileres activos: contrato, monto, fechas, estado
- Consultas: trazabilidad cliente-publicacion

---

## Modelo funcional de publicacion

Una publicacion puede:

- tener 1 video
- tener multiples fotos
- tener precio y descripcion
- publicarse en alquiler, venta o ambas operaciones
- cambiar entre estados `activo`, `desactivado`, `alquilado`, `vendido`

---

## Principios de implementacion

- Prioridad: funcionalidad real + simplicidad operativa.
- No duplicar logica entre frontend y admin.
- Mantener contratos de datos estables.
- Diseñar para crecimiento (sin sobre-ingenieria).

---

## Hito inmediato

Cerrar frontend publico + deploy y dejar publicada al menos 1 ficha ejemplo conectada al modelo final.
