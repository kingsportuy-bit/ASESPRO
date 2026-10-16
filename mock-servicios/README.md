# ASESPRO Servicios — mock local

Sitio estático navegable de ASESPRO Servicios para revisión local. Está construido con HTML, CSS y JavaScript locales: no consume APIs ni conecta bases, paneles o sesiones.

## Páginas

- `index.html` — hero fotográfico, escenas de servicio, proceso, testimonios verificados, equipo, ciudades e Inmobiliaria.
- `servicios.html` — cinco alcances fotográficos expansibles por hash, tareas verificadas y preguntas frecuentes.
- `nosotros.html` — galería de equipo con dialog nativo, principios visuales y video manual de dirección.
- `cobertura.html` — mapa geográfico local de Uruguay con cinco ciudades y consulta contextual.
- `contacto.html` — formulario de dos pasos que prepara WhatsApp, con correo alternativo.

## Abrir

Abrí `index.html` en un navegador moderno. Para revisar el responsive, probá escritorio y una ventana de 390 px. El movimiento editorial se sirve desde GSAP/ScrollTrigger locales y el contenido permanece visible si JavaScript falla.

Las imágenes, logos, video y vendors (`GSAP`, `ScrollTrigger`) se sirven desde `assets/`. La procedencia del mapa, fotografías y componentes adaptados está en `../Docs/servicios/RECURSOS_DESKTOP.md`. El formulario prepara una consulta con los datos ingresados; la página no simula envíos ni guarda información. Los testimonios son citas verificadas en `output/asespro-servicios-20261015/deslumbrar/testimonios-verificados.json`.
