# Carga provisional de propiedades desde el panel

## Uso

1. Panel en uso del operador: `C:/Users/Fito/Documents/CONTENIDO_MONTEIZADO/asespro inmobiliaria/INICIAR_PANEL.cmd`, que abre `http://127.0.0.1:8765`. La fuente del proyecto está en `branding/briff-local` y abre el puerto 8767; actualizar esa fuente no actualiza automáticamente la copia del operador. Toda entrega del panel debe sincronizar también los archivos modificados a la carpeta de uso, preservando CONFIG_MARCA.json, el puerto 8765, la extensión y los datos locales, y recompilar allí con herramientas/compilar.py.
2. Cargar los datos y las fotos en las secciones existentes. Para propiedades ya publicadas en IG, cargar aquí sus fotos y datos; no es necesario volver a publicarlas en IG.
3. Abrir **7. Publicar en la web**. Seleccionar el centro de la zona pública en el mapa y ajustar radio (300–3000 metros). También se puede mover el mapa con teclado y usar su centro.
4. Revisar WhatsApp, datos, fotos y círculo; marcar la revisión web y pulsar **Publicar solo en la web**.
5. Usar **Ver propiedad en la web**. El botón público **Coordinar visita** abre WhatsApp con referencia y enlace. El visitante envía el mensaje.

No se envía el texto fuente original ni el copy IG. Se transfieren campos públicos permitidos, fotos JPEG limpias sin EXIF y centro/radio elegidos de la zona. Precio y dirección no forman parte del modelo web. El texto público se valida y requiere revisión humana, especialmente si se editó a mano. Los videos permanecen en IG en esta versión.

## Actualizar y retirar

El catálogo permite **Cargar para editar**, **Actualizar en la web** y **Retirar de la web**. Cargar reemplaza datos y fotos del editor; se solicita confirmación. La versión evita pisar cambios de otro operador. Reintentar conserva la referencia; si hubo timeout, refrescar catálogo y cargar la versión existente. Retirar oculta detalle y fotos públicas, conservando la copia privada para respaldo. Para otra propiedad, reiniciar el editor o preparar una nueva publicación web y reemplazar datos/fotos; esto crea una referencia distinta.

## Configuración y despliegue

El servicio web debe usar `PROPERTY_DATA_SOURCE=panel`, `PANEL_WEB_DATA_DIR=/app/property-data` y un secreto aleatorio `PANEL_WEB_PUBLISH_KEY` de 32–128 caracteres (letras, números, guion y guion bajo). Guardar la clave en `/opt/asespro/.env.web-catalog` con permisos 600, fuera de Git. `deploy.stack.yml` referencia ese archivo y el volumen externo `asespro-properties`; crear el volumen antes del primer despliegue. Una sola réplica del servicio escribe este catálogo. Respaldar el volumen junto con su configuración; no reemplazarlo por la carpeta efímera del contenedor.

En **Configurar conexión web** se comprueba el dominio y clave y se guarda cifrada con DPAPI en `%LOCALAPPDATA%/ASESPRO/web-publicacion.dpapi`. No poner claves en HTML, código, localStorage o exports. El servidor local no sigue redirecciones con credenciales. Solo acepta solicitudes desde el origen local y token vigente. El catálogo responde únicamente con Bearer válido; las fotos públicas se sirven solo mientras la propiedad está activa y la versión vigente coincide.

Modo panel muestra exclusivamente las propiedades reales cargadas; no hace fallback a los ejemplos. Los modos mock/api/supabase se conservan para otros despliegues. No se modifica la sesión, extensión ni proceso de publicación IG.

## Verificación

- `node frontend/scripts/test-panel-web.cjs`: validación, privacidad, tipos, persistencia, conflictos y retiro.
- Desde `frontend`: `npm run build` y `node scripts/test-panel-web-http.cjs`. La prueba HTTP usa servidor y carpeta temporal locales, sin publicar datos en producción.
- `python branding/briff-local/herramientas/compilar.py`: recompila el panel distribuible con Leaflet 1.9.4 local y licencia incluida.

Limitaciones: catálogo de archivos provisional para una réplica; no sustituye Sportex. Las fotos de versiones previas se conservan en respaldo privado, sin endpoint público. Verificar visualmente el panel en el Chrome del operador antes de la primera carga real.
