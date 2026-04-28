# PROXIMOS_PASOS_FRONT.md

## Objetivo inmediato

Cerrar frontend publico de ASESPRO y desplegarlo hoy en produccion con mapa diferencial y paginas de alquiler/venta funcionales.

---

## Plan recomendado de ejecucion

1. Cerrar UI publica principal
- Home final
- `/alquiler` final
- `/venta` final
- `/propiedad/[id]` final
- responsive completo

2. Terminar mapa diferencial
- lista + mapa sincronizados
- filtros por operacion, tipo, precio y zona
- rendimiento correcto en mobile y desktop

3. Publicacion de ejemplo real
- cargar 1 publicacion completa con:
  - 1 video
  - multiples fotos
  - precio
  - descripcion
  - operacion
  - estado

4. Conexion a datos productivos
- reemplazar uso exclusivo de mock por Supabase
- mantener capa `repository` para no acoplar UI
- asegurar manejo de errores y estados vacios

5. Cerrar conversion
- CTA a WhatsApp en cards, detalle y contacto
- mensaje contextual por propiedad

6. Deploy a produccion
- build de produccion sin errores
- variables de entorno listas
- smoke test en URL productiva

---

## Criterios de aceptacion para hoy

- web publica navegable sin errores
- mapa funcionando como feature principal
- venta y alquiler con contenido real
- detalle de propiedad con media y precio
- CTA WhatsApp funcionando en flujo completo
- deploy productivo online

---

## Dependencia inmediata despues del deploy

Arrancar panel admin minimo para que el operador cargue publicaciones sin tocar codigo.
