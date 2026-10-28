# Publicación web Implementation Plan

**Goal:** cargar desde el panel IG una propiedad a la web sin duplicar trabajo.
**Architecture:** catálogo persistente y API autenticada en Next; puente local Python; controles web separados del editor IG.
**Tech Stack:** Next 14, TypeScript, Leaflet, Python stdlib, Docker volume.
**Spec:** docs/superpowers/specs/2026-10-28-publicacion-web-design.md

## Global Constraints
No alterar publicación IG. No precio, dirección exacta ni coordenadas del inmueble. Solo círculo de zona pública. CTA Coordinar visita. Sin secretos públicos.

## Review Focus
Reintentos no duplican; actualizaciones simultáneas no se pisan; publicación fallida conserva editor; retiro oculta también fotos; falta de configuración se explica sin éxito falso.

## Tasks
- [x] Catálogo: validación por lista permitida, persistencia atómica, control de revisión, API autenticada, fotos JPEG y retiro. Cuatro tests de modelo/persistencia pasan.
- [x] Panel: puente local cifrado, mapa de zona, revisión propia, publicar solo web, cargar existentes, actualizar y retirar; recompilado SISTEMA_VISUAL.html. Scripts, Python, DPAPI y HTTP local pasan.
- [x] Web: catálogo en repository, círculos de zona y CTA sin precio; conserva otros modos. TypeScript y build Next pasan localmente y en Docker Linux.
- [x] Operación: volumen Docker, configuración y guía; smoke test HTTP completo y revisión de diff. Imagen desplegada, home/alquiler/venta/mapa y catálogo autenticado verificados en dominio real. No se publicaron pruebas en producción.

## Ledger
Ejecución autorizada por usuario: «bien, realizalo». Se trabaja en rama codex/publicacion-web-propiedades y se preservan cambios ajenos. No se solicita una segunda aprobación del mismo alcance.

Ruling: publicación web independiente, sin botón que afirme publicación IG confirmada — la extensión solo confirma el envío de archivos, no que el post exista.

Ruling: publicación de fotos sin video — alcance provisional documentado en panel; se conserva íntegro el editor de video para IG.

Ruling: catálogo privado de archivos, una réplica — despliegue actual usa mocks y no comparte credenciales Supabase con la web pública.

Verificación visual bloqueada: CUA deshabilita navegador local y detuvo acceso a Chrome por no poder comprobar la URL. No se usó otro mecanismo de automatización visual. Se comprobaron estructura/script del HTML, TypeScript, build y flujo HTTP real.

Producción: imagen asespro-web:panel-web-20261028, volumen externo asespro-properties. Snapshot anterior /opt/asespro/.release-backups/web-before-panel-catalog-20261028.json. Actualización solo del servicio web vía docker service update; panel Supabase y Servicios intactos. Fuente de build aislada en /opt/asespro/.release-sources/panel-web-20261028/frontend. Clave cifrada y conexión del panel comprobadas desde este equipo. Cloudflare rechaza el User-Agent Python genérico: el puente usa identificación explícita ASESPRO-Panel/1.0.
