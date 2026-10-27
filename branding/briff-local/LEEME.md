# ASESPRO Inmobiliaria

Copia local de revisión con la identidad verde de Servicios. El iniciador usa un puerto separado para no abrir por accidente otro generador ya activo. La carpeta original no fue modificada. Fuente de paleta y alcance: ../INSTAGRAM.md.

## Para crear con cualquier IA

Compartí BRIEF_MARCA.md y los recursos necesarios de assets. Si partís de una idea del panel, compartí también su paquete ZIP: referencia.png, PROMPT.md, config.json, logo.svg y simbolo.svg. Las ideas son independientes del brief. La composición es opcional; la identidad debe respetarse.

## Abrir el panel

Doble clic en **INICIAR_PANEL.cmd**. Usa Python y abre http://127.0.0.1:8767 en el navegador. Funciona localmente, sin cuentas ni internet. Python debe estar instalado y disponible como `python` (en esta PC ya está).

- **Actualizar brief y guardar versión**: escribe el documento vigente en la carpeta principal. Si hay cambios, archiva el anterior con su configuración y logos en old/vNNN_fecha/. Si no hay cambios, conserva la versión.
- **Exportar brief .md**: actualiza/versiona y descarga una copia en el navegador.
- **Descargar brief vigente**: descarga lo que está guardado, sin aplicar cambios del panel.
- Los cambios del editor se guardan como borrador en el navegador. Al abrir el panel mediante el iniciador se carga la configuración vigente de la carpeta. Usá Exportar ajustes para conservar exploraciones que aún no quieras aplicar al brief.

También podés abrir SISTEMA_VISUAL.html directamente: permite editar y descargar imágenes, prompts, paquetes y brief .md. Por las restricciones del navegador, ese modo no puede escribir ni versionar archivos dentro de la carpeta. Para hacerlo usá el iniciador.

## Composición en vivo

Cada formato tiene **Imagen PNG**, **Prompt .md** y **Idea completa ZIP**. PNG se exporta a 1080 × 1350 o 1080 × 1920, sin las guías de zonas seguras. El paquete incluye lo usado en la idea: imagen, textos, paleta, Switzer, pesos, tamaño, fondo, símbolo y logo. No modifica el brief. Con el iniciador, Idea completa también guarda sus archivos en ideas/.

## Armar publicaciones con dos imágenes

La pestaña **Armar publicaciones** une un fondo y una capa de texto PNG o WebP transparente mediante composición directa en el navegador. No usa IA, no elimina fondos ni reconstruye letras o logos. Los originales no se sobrescriben ni se suben al servidor.

1. Cargá el fondo y la capa de texto, o usá **Cargar ejemplo adjunto**.
2. Elegí Publicación (1080 × 1350), Historia (1080 × 1920) o Tamaño original del fondo.
El lienzo de vista previa cambia de proporción al elegir el formato, igual que el PNG de salida. **Mostrar zona de seguridad** activa una guía orientativa de márgenes por formato, que se puede ocultar y nunca aparece en la descarga.

3. **Ajustar ambas sin recorte** conserva ambas imágenes completas y deja transparente lo que no cubran. **Llenar lienzo con ambas** conserva las proporciones y recorta lo que exceda el formato.
4. Si hace falta, elegí una capa y cambiá su posición, escala o ajuste. Cada formato conserva sus propios ajustes mientras el panel está abierto.
5. **Descargar composición PNG** exporta el mismo lienzo de la vista previa, con transparencia donde no haya imagen. Para evitar reescalado, usá Tamaño original con imágenes del mismo tamaño y escala 100%.

Las imágenes cargadas y los ajustes de este compositor se conservan solo durante la sesión; recargar la página los reinicia. El ejemplo adjunto está incluido tal como fue entregado, sin modificaciones, en assets/compositor-ejemplo/.

## Carpeta

- BRIEF_MARCA.md: documento de identidad vigente.
- CONFIG_MARCA.json: ajustes y versión vigentes.
- assets/logos: vectores recoloreables vigentes con INMOBILIARIA en Switzer Regular. Todos los elementos de cada logo usan un único color: verde principal para fondos claros y blanco para fondos oscuros. Los SVG base también son verdes monocromos. Los PDFs anteriores se conservan en old/.
- assets/iconos: 184 SVG Phosphor, catálogo y licencia MIT.
- assets/fonts: Switzer Complete con sus archivos originales.
- panel: fuentes del panel y bibliotecas de exportación con sus licencias.
- herramientas: servidor local y generadores del documento y panel.
- old: únicamente versiones anteriores guardadas a partir de ahora.
- ideas: referencias de composición, independientes de la identidad.

Para cambiar una regla escrita del documento, editar herramientas/brief.template.md. Para reconstruir el HTML ejecutar `python herramientas/compilar.py`. No usar los antiguos borradores como referencia.

La configuración inicial se tomó de ASESPRO-ajustes-borrador (1).json, entregado el 14/10/2026. Dominio oficial: inmobiliaria.asespro.com.uy. Sin teléfono en las imágenes.

### Márgenes predeterminados

La única guía para historias es Ampliada: **160 px arriba, 160 px abajo y 80 px a cada lado**, en 1080 × 1920. Área central: 920 × 1600 px. Publicaciones conserva **64 px arriba/abajo y 80 px a cada lado**, en 1080 × 1350. El panel permite mostrar u ocultar las guías; no hay selector de perfiles ni controles para cambiar los márgenes.

Ver GUIA_COMPOSICION.md y BRIEF_MARCA.md. Son referencias orientativas de composición, no medidas oficiales de Instagram; la composición sigue siendo opcional. No se dibujan en el PNG exportado. Los valores se registran en compositionGuides de CONFIG_MARCA.json.

### Controles de capas y sliders

En Ajustar una capa, los radios horizontales **Imagen / Texto** eligen la capa activa. El ajuste inicial y Restablecer esta capa usan **Cubrir · puede recortar**, escala 100%, X=0 y Y=0. También se aplica al cargar archivos o el ejemplo. Los sliders de X e Y están en una misma fila y muestran la posición en píxeles. Todos los sliders del panel tienen imán cerca de su valor inicial al arrastrar y una marca de referencia. Doble clic restablece el valor; las flechas permiten ajuste fino sin imán. Los valores iniciales del sistema visual son los de la configuración vigente.

## Propiedades · carrusel con fotos reales

Nueva pestaña **Propiedades**. Cargá fotos, ordenalas con los botones, elegí portada y ajustá el recorte de cada foto. La portada usa degradado verde inferior, operación, tipo, zona pública y hasta seis iconos. Las demás imágenes llevan el logo. Publicación 1080 × 1350; historia 1080 × 1920 para descarga. No usa IA.

El ejemplo textual es el apartamento equipado en alquiler, zona céntrica, 1 dormitorio, cochera y zona de lavado; agua, Wi-Fi y TV cable incluidos. Baños, superficies y gastos comunes quedan sin informar hasta confirmarlos. No se exportan el texto fuente privado, el precio, la dirección exacta ni el número de unidad. El copy es editable; revisar que lo agregado manualmente tampoco contenga esos datos. Las fotos podrían mostrar datos visibles: revisarlas.

**Publicar con Chrome de ASESPRO** envía las imágenes y el copy a la extensión incluida en extension-chrome/. Debe instalarse en el perfil Chrome ASESPRO; abrir el panel en ese mismo perfil. Leer extension-chrome/LEEME.md. Sin extensión, el editor y las descargas siguen disponibles. Abrir una pestaña o enviar el paquete no confirma publicación. La extensión requiere validación con la interfaz real de Instagram; no fue publicada ninguna propiedad durante el desarrollo.

Las imágenes cargadas en esta pestaña permanecen en memoria hasta cerrar o recargar. Descargá el ZIP para conservar el carrusel y el copy. No se modifica el brief al trabajar con propiedades.

### Portada y repetición en propiedades

El bloque de operación, título, zona e iconos se ubica cerca del borde inferior, conservando el margen seguro y la firma web. Todas las fotos llevan un degradado verde superior suave para sostener el logo blanco. El carrusel comienza con portada informativa y luego la misma foto sin información, con idéntico encuadre y logo; después siguen las otras fotos. La repetición es automática y se actualiza al cambiar de portada. Se admiten 19 originales para obtener hasta 20 imágenes finales. Vista previa, descarga individual, ZIP y envío a la extensión usan ese orden.

## Video en propiedades

El mini editor permite cargar un video de hasta 250 MB y 60 minutos, activar/desactivar el logo blanco (activado por defecto), elegir velocidad entre 0,5× y 4×, marcar inicio y final, y quitar el audio. Recorte temporal, no generación de escenas. El encuadre cubre el formato de la propiedad. El original permanece intacto.

Requiere iniciar el panel con INICIAR_PANEL.cmd; exporta mediante FFmpeg/ffprobe instalados en la PC, a MP4 H.264/AAC. La edición se realiza localmente, sin IA ni servicios externos. Los archivos de trabajo se guardan en .video-trabajos/. La vista previa del navegador muestra el logo y reproduce el intervalo a la velocidad elegida; MP4 exportado incorpora los ajustes.

El video editado puede descargarse por separado o agregarse al final del ZIP y del carrusel enviado a Chrome. Con video, el máximo es 18 fotos originales + repetición de portada + video = 20 archivos. Actualizar la extensión a 0.2.0 desde chrome://extensions si ya estaba instalada. El puente de Chrome admite hasta 50 MB totales serializados; si el paquete supera ese límite, reducir duración o número de fotos y descargar el MP4 para carga manual. La carga real en Instagram sigue pendiente de validación.

## Formato del carrusel de propiedades · 3:4

Las fotos y el video de Publicación en la pestaña Propiedades se exportan a **1080 × 1440 px (3:4)**, con el mismo encuadre de salida. La vista previa del video y el render MP4 comparten esta proporción. Historias mantiene 1080 × 1920. Los módulos de publicaciones generales y composición de dos capas conservan sus formatos anteriores. Para subir el carrusel con la extensión 0.2.5 se elige Original o 3:4; nunca 4:5. Los videos exportados antes de este cambio deben volver a exportarse.
