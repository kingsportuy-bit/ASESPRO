# INICIAL.md

## Estado del proyecto

Este proyecto ya no esta en fase MVP.

Objetivo actual: dejar ASESPRO en produccion con web publica funcional, panel admin operativo y backend escalable en Supabase.

Fecha de referencia de este corte: 2026-04-28.

---

## Ubicacion de documentos

Todos los archivos de contexto viven en `Docs/`.

Archivos base:

- `INICIAL.md`
- `OPERADOR.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `ENCODING.md`
- `DESIGN.MD`
- `PROXIMOS_PASOS_FRONT.md`
- `ESTADO_PRODUCCION.md`
- `GUIA_GENERAL_DESPLIEGUE_GITHUB_VPS.md`

---

## Lectura obligatoria antes de tocar codigo

Leer completamente:

- `OPERADOR.md`
- `SYSTEM.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `ENCODING.md`
- `DESIGN.MD`
- `PROXIMOS_PASOS_FRONT.md`
- `ESTADO_PRODUCCION.md`

---

## Alcance obligatorio para produccion

1. Frontend publico terminado y desplegado.
2. Mapa funcionando como diferencial real (lista + mapa + filtros coherentes).
3. Paginas `/venta` y `/alquiler` terminadas con al menos 1 publicacion de ejemplo completa.
4. Panel admin para crear y gestionar publicaciones de forma simple.
5. Base operativa para gestion interna (publicaciones, propietarios, inmuebles, alquileres activos).

---

## Modelo minimo de publicacion (no negociable)

Cada publicacion debe soportar:

- 1 video
- muchas fotos
- informacion descriptiva
- precio
- operacion: `alquiler`, `venta` o ambas
- estado: `activo`, `desactivado`, `alquilado`, `vendido`

La carga debe ser simple, rapida y usable por operador no tecnico.

---

## Regla tecnica de escalabilidad

La velocidad de entrega no puede romper la base del sistema.

Se construye con:

- Supabase (PostgreSQL + Auth + Storage + RLS)
- modelo de datos normalizado para crecer sin migraciones traumaticas
- separacion clara entre web publica y backoffice

---

## Forma de trabajo

- Soluciones simples, pero listas para produccion.
- Una recomendacion clara por decision.
- Evitar cambios grandes sin validar impacto.
- Priorizar lo que desbloquea salida a produccion hoy.
