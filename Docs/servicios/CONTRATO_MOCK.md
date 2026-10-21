# ASESPRO Servicios - contrato del mock local

Fecha: 2026-10-15. Fuente de decisión: instrucciones directas de Fito en este chat.

## Objetivo y alcance

Presentar rápidamente una portada navegable de limpieza para asespro.com.uy, usando como referencia visual el checkout real C:/Users/Fito/Documents/CODEX/ASESPRO/frontend. Conservar tipografía Manrope, proporciones, tarjetas redondeadas, navegación y jerarquía de la familia visual. Cambiar información, logo y verde por los de ASESPRO original. Priorizar reutilización y bajo consumo.

El mock vive en mock-servicios/ y funciona con HTML/CSS/JS locales, sin instalar dependencias. Es una propuesta revisable: no cambia frontend/, no se publica y no conecta bases, administración ni INMOBILEX. Los documentos históricos que describen inmobiliaria y su panel no amplían este encargo.

## Ampliación autorizada: sitio completo de limpieza

Fito, 2026-10-15, pidió completar el sitio desde C:/Users/Fito/Desktop/ig-descargas/asespro, crear las páginas necesarias y mejorar diseño y animaciones con las skills instaladas. También autorizó usar los videos de la dueña. Esta ampliación sustituye la limitación anterior a una sola portada, conservando la implementación estática en mock-servicios/ y la revisión local.

- Páginas: Inicio, Servicios, Nosotros, Cobertura y Contacto. Servicios permite consultar las cuatro categorías y sus tareas; preguntas frecuentes con controles nativos. Navegación real entre páginas y estado actual identificable.
- Fuente nueva: RELEVAMIENTO_LOCAL.md y su inventario de 117 archivos. Las placas aportan datos y mensajes; no se publican como tarjetas, banners ni fondos de la web. La información se reconstruye como texto HTML, componentes y contenido adaptable.
- Usar fotografías sin composición publicitaria. Se permite preparar una fotografía limpia a partir del material aportado mediante imagegen; no alterar personas, logo original ni presentar imágenes ilustrativas como evidencia de un trabajo concreto.
- Incluir el video de la directora disponible en el material, con reproducción manual, controles, carga diferida y sin audio automático. No inventar declaraciones o transcripciones. Los reels publicitarios no sustituyen contenido HTML.
- Presupuesto: formulario estático que prepara una consulta de WhatsApp con el servicio y la ciudad. Etiqueta clara «Preparar consulta» y luego enlace para abrir WhatsApp; correo alternativo. No envía consultas desde el sitio, ni guarda datos personales en almacenamiento del navegador.
- La familia visual del mock se conserva y se pule: Manrope local, neutros claros, verde original y logo íntegro. Se retira la galería de posts anterior. Animaciones con CSS/WAAPI, foco visible y movimiento reducido; sin framework nuevo.
- La entrega es un frontend completo de limpieza para revisión local. DNS, publicación, panel e inmobiliaria permanecen fuera del alcance de esta ampliación.

## Decisiones confirmadas

### Amplificación visual solicitada tras la revisión

Fito, 2026-10-15: «la sigo viendo como una web pobre y estatica». Se autoriza reforzar la composición y la interacción del sitio completo conservando la identidad original, las cinco páginas y todas las funciones acordadas. La aceptación técnica previa no equivale a aceptación estética. La dirección concreta se define en DIRECCION_VISUAL.md: fotografía dominante, servicios desplegables, presencia de dirección desde Inicio y movimiento perceptible ligado a cambios de estado. No cambia información comercial ni autoriza publicación o modificaciones en inmobiliaria.

- Principal: asespro.com.uy, limpieza para empresas/oficinas, hogares, edificios/espacios comunes y fin de obra. Prioridad comercial a empresas.
- Segunda web: inmobiliaria.asespro.com.uy, en una etapa posterior. Enlace en navegación y apartado propio de la principal.
- Solo inmobiliaria se conectará a INMOBILEX; el sitio de limpieza es frontend.
- Cobertura confirmada por Fito: Montevideo, Punta del Este, Durazno, Paso de los Toros y Mercedes.
- WhatsApp: 59898382388; correo: asesprouy@gmail.com; Instagram: https://www.instagram.com/asespro.servicios/.
- Contacto principal por WhatsApp y opción por correo. Abrir una consulta preparada no equivale a enviarla. El correo se resuelve por mailto en el mock.
- Usar logos de clientes del PDF en una sección con movimiento, sencilla de modificar.
- Se autoriza descargar y reutilizar imágenes del Instagram, y editarlas si aporta valor. La ampliación permite preparar una fotografía limpia mediante imagegen, con procedencia documentada en ASSETS_WEB.md.
- Información: decisiones de Fito primero; publicaciones actuales del Instagram y destacados aplicables por encima del PDF cuando difieran. No tratar una placa de hace años como promoción o equipo actual confirmado.
- Corrección explícita de Fito, 2026-10-15: la principal no mezcla el verde esmeralda de inmobiliaria, tampoco en el apartado que enlaza al segundo sitio. Usar el verde original #009335 y sus tonos de contraste, más neutros. Los logos de la principal se muestran desde una variación original existente, como imagen íntegra y proporcionada, sin recomponer el símbolo/palabra ni agregar «Servicios» debajo. Se selecciona la variación horizontal original existente en frontend/assets/LOGO_ASESPRO_transparente_horizontal.png, copiada sin modificaciones al mock.

## Aceptación del mock

1. Se abre en navegador local; escritorio y celular sin desbordamiento horizontal.
2. Logo original íntegro, sin el agregado «Servicios», y verde característico. Verde medido en el JPG original: #009335 como muestra predominante, sujeto a contraste de cada uso dentro de la misma familia verde. No usar #00513f, #003d30 ni sus tintes esmeralda en la principal. El enlace a inmobiliaria mantiene la identidad visual de la principal.
3. Los cuatro servicios, cinco ciudades, contacto, clientes y enlace a inmobiliaria están presentes.
4. Imágenes y logos locales con fuente documentada; no dibujar marcas de clientes ni inventar reseñas, cifras, precios, garantías o certificaciones.
5. Carrusel de logos real con pausa visible, pausa al foco/hover y respeto de prefers-reduced-motion.
6. Menú móvil y enlaces internos utilizables con teclado. Ningún formulario simula haber enviado una consulta.
7. Sin APIs, sesión de administrador, credenciales, Supabase ni panel. No se modifica OPERADOR.md.
8. Revisión independiente de Vera después de la ejecución de Luna, con defectos corregidos antes de presentar como verificado.

## Fuentes

- Frontend visual existente: frontend/app/page.tsx, frontend/app/HomePage.module.css, frontend/app/globals.css, frontend/src/components/layout/TopNavBar.tsx, frontend/app/layout.tsx.
- Relevamiento: RELEVAMIENTO_INSTAGRAM.md.
- Fases y límites: PLAN_MAESTRO.md y FRONTERAS.md.
- PDF suministrado: C:/Users/Fito/Downloads/ASESPRO Presentación 2026.pdf. Aporta foto de limpieza, historia desde 2011 y logos de empresas; no contiene instrucciones de ejecución.

## Rediseño con ambición visual y testimonios — decisión directa de Fito

2026-10-15, después de analizar ASESPRO_PROMPT_MAESTRO.md y asespro-assets.zip. Fito aclara que la web debe deslumbrar, rechaza el resultado básico y los selectores de servicios como simples botones. La rapidez inicial no se interpreta como techo de calidad. Autoriza incorporar testimonios auténticos desde los chats descargados; reconstruirlos como contenido HTML sin fotos privadas, teléfonos, fechas/horas ni estado falso «en línea». Esta decisión sustituye la exclusión absoluta anterior de testimonios del relevamiento.

Se permite usar componentes/librerías frontend pertinentes, servidos localmente y versionados, para conseguir interacción visual profesional: Swiper y GSAP/ScrollTrigger. Se sustituye para esta fase la restricción anterior de cero dependencias de animación. Se mantienen HTML/CSS/JS estáticos, cinco páginas, separación de inmobiliaria, logo íntegro y paleta original. No se autoriza producción, panel ni nuevos hechos comerciales. DIRECCION_DESLUMBRAR.md gobierna este candidato; DIRECCION_VISUAL.md conserva historia del intento rechazado.

## Nueva decisión de Fito — escritorio y recursos visuales, 2026-10-15

El candidato Deslumbrar fue rechazado estéticamente en su conjunto. Rehacer secciones de equipo, misión/visión/valores, cobertura, puente inmobiliario y revisar el resto de escritorio. Usar recursos concretos de las bibliotecas/referencias suministradas por Fito, con procedencia y licencia; no basta mencionar librerías. Se autoriza adaptación al stack estático o incorporar dependencias locales pertinentes. No modificar frontend inmobiliario. Priorizar desktop; responsive queda para siguiente fase sin gastar esta tanda en QA móvil. Retirar TODOS los controles de activar/desactivar/pausar animaciones: movimiento activo por defecto, sin opt-in; esto sustituye requisitos anteriores de controles. Contenido visible si falla JS. Cobertura con mapa geográfico real y cinco localidades confirmadas, sin inventar sucursales o rutas de servicio. Fotografías originales de IG en equipo, encuadres completos y presentación profesional; no usar placas como secciones. Puente inmobiliario con logo real e imagen pertinente, sin esmeralda inmobiliario en principal. Ninguna nueva afirmación comercial ni publicación.

## Componentes enriquecidos — aprobación «bien aplica», 2026-10-15

Fito aprobó el esquema presentado en el chat: portada fotográfica por capas; servicios en acordeón horizontal de cuatro paneles; galería editorial expandible; dirección con video manual; principios como relato por capítulos durante scroll con imagen sticky; testimonios auténticos seleccionables; mapa con marcador y línea visual hacia ficha (conexión de interfaz, no ruta de servicio); puente arquitectónico panorámico; consulta en tres pasos con resumen. Aplicar en desktop, preservar datos comerciales, logo, paleta, destinos y ausencia de envío automático. La ejecución conserva contenido accesible sin JavaScript y no modifica inmobiliaria, panel o producción.

## Ajuste por sección — hero fotográfico, 2026-10-15

Fito pide fotografía ocupando todo el bloque hero, capa de color transparente para legibilidad y texto superpuesto sin fondo propio. Entrada del título por líneas con movimiento. Sustituye la composición anterior con recortes blancos y la propuesta de dos columnas. Conservar copy, contactos, logo y paleta original; no tocar otras secciones en este ajuste.

## Ajuste por sección — empresas, 2026-10-15

Fito pide bajar la sección de logos para presentar primero ASESPRO y los servicios. Ubicarla después de los servicios destacados; título visible con presencia: «Empresas que confían en nuestro trabajo». Conservar la animación de logos aprobada y los mismos recursos. No modificar el hero ni rediseñar otras secciones en esta tanda.

### Segunda corrección de empresas

Fito rechaza el resultado plano y pide enriquecer esta sección con un elemento visual y movimiento al aparecer. Reforzar composición del título, énfasis verde original y trazo animado, con entrada coordinada al entrar en pantalla. Mantener el carrusel continuo, logos originales, ubicación y contenido comercial sin agregar cifras o certificaciones. Solo sección empresas.

### Correcciones posteriores de empresas

Fito simplifica el encabezado a dos renglones: «Empresas que / confían en nosotros», con la segunda línea verde. Retirar trazos SVG y diseño lateral, conservar entrada animada y cinta.

Fito pide pausa temporal al pasar el mouse sobre un logo: detener ambos tracks, mostrar solo el logo señalado negro con zoom sutil y restaurar aspecto/movimiento al salir, continuando desde la misma posición. Este hover sustituye para esta sección la exclusión previa de pausas automáticas; no agrega botones de activar o desactivar animaciones.

El siguiente ajuste de Fito sustituye negro por verde original #009335 durante hover.

## Ajuste de servicios en Inicio, 2026-10-15

Fito pide título explícito «Los servicios que ofrecemos», presentación breve de las categorías y fotografías generadas pertinentes a cada servicio. Tarjetas se expanden al pasar el mouse y reducen las otras, sin flechas de apertura ni numeración. Mantener acceso por teclado y enlace real al detalle. No incluir listas de tareas ni formulario en estas tarjetas: el desarrollo del contenido pertenece a la página Servicios, fuera de este ajuste. Generar imágenes ilustrativas sin textos ni marcas, conservar activos originales y documentar nuevos recursos. Mantener hero, empresas y demás secciones.

## Presentación de ASESPRO y títulos, 2026-10-15

Fito fija como referencia para los títulos de sección futuros el encabezado de empresas: dos renglones, primero oscuro y segundo verde original, igual tamaño y peso. Los medios locales inspiran escenas y estilo; no copiar placas. Agregar entre hero y Servicios una presentación breve que explique qué es ASESPRO, con limpieza, coordinación y supervisión como información confirmada. Aplicar el formato a esta nueva sección y al título de Servicios en Inicio; el trabajo continúa por sección, sin rediseñar las restantes ni alterar el hero aprobado. El detalle institucional queda en Nosotros.

## Componentes y movimiento compartido, 2026-10-15

Fito aclara que la presentación debe enriquecerse mediante componentes e interacción, sin sumar más fotografías. Autoriza estandarizar en las cinco páginas entradas de textos, imágenes, hover, botones y cambios de contenido mediante tiempos y curvas compartidos. Mantener hero y cinta aprobados, pausa y verde en logos, movimiento activo sin controles, contenido sin JS y datos confirmados. La presentación incorporará un componente de etapas Escuchamos / Coordinamos / Supervisamos, navegable por mouse y teclado, con indicador móvil y contenido HTML. Sin cambios comerciales ni backend.


## Isotipo ambiental localizado, 2026-10-15

Fito retira el componente de etapas completo y reemplaza el texto y enlace a la derecha de Somos ASESPRO por el isotipo original sin fondo, verde más tenue y animación ambiental confinada a esa columna. Mantener título y resto del sitio; no agregar fotografías ni alterar geometría del símbolo. Se autoriza tratamiento cromático local como máscara del recurso original transparente. Animación CSS de interfaz, no video ni nueva composición audiovisual.


## Fondo de Servicios Inicio, 2026-10-15

Fito pide fondo verde claro sutil para la sección Los servicios que ofrecemos. Aplicar #edf6ef a toda la franja, conservando el ancho interior, tarjetas, títulos y movimiento existentes. Cambio exclusivamente visual en Inicio.


## Servicios: imágenes nuevas y acceso único, 2026-10-15

Fito retira la frase Elegí el espacio que querés cuidar y conocé el servicio y todos los enlaces Conocer el servicio dentro de las tarjetas. Incorporar debajo un único botón Ir a servicios hacia servicios.html. Generar nuevas escenas para Hogares y Empresas inspiradas en las referencias IG adjuntas (ambientes cuidados, sin copiar composición ni simplemente borrar textos) y generar fotografía pertinente de limpieza de final de obra. Mantener Edificios, hover expansivo, título y fondo verde suave. Ningún cambio al detalle de Servicios.


## Personas limpiando en empresas y hogares, 2026-10-15

Fito pide agregar personas limpiando a las dos primeras imágenes de Servicios Inicio. Editar las escenas de empresas y hogares actuales conservando los ambientes, luz y proporción, sin marcas ni textos. Mantener edificios, finales de obra y resto de interfaz.


## Título con verbo rotativo, 2026-10-15

Fito pide en presentación: Somos oscuro y ASESPRO verde; segunda línea verbo en mayúsculas verde alternando CUIDAMOS / ORDENAMOS / LIMPIAMOS, seguido por tus espacios. oscuro. Animación vertical suave automática, ancho reservado al verbo mayor para evitar desplazamientos; conservar isotipo ambiental, fondo y dos líneas desktop. Texto legible sin JS y lectura accesible estable sin anunciar cada cambio. Sin nuevos servicios ni claims.


## Corrección del verbo y revelado por capa, 2026-10-15

Fito retira CUIDAMOS y pide una alternativa de nueve letras, igual que ORDENAMOS y LIMPIAMOS. Usar RENOVAMOS como expresión de puesta a punto por limpieza, sin agregar servicios de reformas. Sustituir el desplazamiento vertical por capa de ocultación y revelado horizontal de la palabra: texto fijo, cubierta del mismo color del fondo, cambio mientras está cubierto y descubrimiento suave. Mantener ancho estable, lectura accesible, isotipo y resto del sitio.


### Ajuste de separación del verbo

Fito aclara que ORDENAMOS es la palabra que obliga a reservar demasiado ancho y deja tus espacios lejos de las otras dos. Sustituir el ancho máximo fijo por ancho medido de la palabra activa, animado suavemente, para conservar una separación corta consistente. Esta corrección sustituye el ancho fijo previo; mantener el revelado por capa solicitado y RENOVAMOS en lugar de CUIDAMOS conforme al pedido anterior.


Fito propone MANTENEMOS: sustituye RENOVAMOS en el conjunto final MANTENEMOS / ORDENAMOS / LIMPIAMOS. Su elección explícita prevalece sobre la cantidad de letras previa. Conservar capa de revelado y separación dinámica corta.


## Experiencia sobre isotipo, 2026-10-15

Fito pide superponer al isotipo ambiental un 15 grande y debajo años de experiencia, con zoom mínimo al pasar el mouse. Usar la cifra explícita proporcionada por Fito, coherente con actividad desde 2011. Mantener isotipo tenue como fondo local animado y encabezado rotativo. El texto nuevo debe ser accesible; la máscara decorativa conserva aria-hidden por separado. Hover fino con escala 1.035 y token compartido, sin enlace falso ni botón decorativo.


## Experiencia en línea y contador, 2026-10-15

Fito pide número 15 grande verde y al lado años de / experiencia en dos renglones. Contar visualmente de 0 a 15 una vez al entrar en pantalla, con texto accesible estable y 15 visible sin JS. Conservar isotipo tenue detrás y mini zoom existente, resto del sitio sin cambios.


## Verificación del servidor local, 2026-10-15

Fito pide comprobar que el servidor local siga andando después de cada cambio. Verificar HTTP en http://127.0.0.1:8917/index.html y levantar el servidor del directorio mock-servicios si está detenido antes de entregar el ajuste.


## Refinamiento de experiencia tras captura rechazada, 2026-10-15

Fito rechaza la composición del contador sobre isotipo: refinar exclusivamente ese bloque, aumentar jerarquía de 15 y legibilidad de la leyenda lateral con más aire; isotipo ambiental más tenue y desplazado detrás para no competir. Mantener contador, zoom, cifra, texto en dos renglones e identidad. Puede ampliarse ligeramente la columna derecha preservando encaje del título. Verificar servidor HTTP al terminar.


## Refinamiento de experiencia aprobado, 2026-10-15

Fito acepta ampliar el 15, dar aire y tamaño al texto lateral, desplazar el isotipo detrás y hacerlo mucho más grande y tenue. Mantener conteo y zoom, sin cajas ni bordes. Permitir a la columna ambiental algo más de ancho conservando el título desktop y sin invadir secciones vecinas. Comprobar servidor local después del cambio.


## Llamado previo a los servicios, 2026-10-15

Fito pide agregar antes de las tarjetas de servicios con hover una sección de contacto inspirada en la captura proporcionada. Adaptar el texto a ASESPRO, usar la tipografía y el verde de la identidad propia y el botón ya definido para el sitio. La sección debe conducir a la página de contacto y mantener la composición abierta y centrada de la referencia, sin copiar la identidad naranja ni mencionar a otra empresa. Verificar el servidor local después del cambio.

Fito corrige la ubicación de esa sección: debe ir al final del contenido de la página principal, inmediatamente antes del footer, y no antes de las tarjetas de servicios. Conservar contenido, diseño, animación y enlace; verificar el servidor local tras moverla.


## Proceso en tres pasos, 2026-10-15

Fito pide rehacer en la página principal la sección «Del primer mensaje a un espacio listo» según la referencia adjunta: título dominante y tres pasos horizontales conectados por una línea, con números de gran tamaño, encabezados y descripciones breves. Adaptar a la línea visual propia de ASESPRO con fondo verde original, tipografía Manrope y contrastes claros, sin tomar el azul de la referencia ni el verde de Inmobiliaria. Cada paso debe responder al hover con una animación perceptible y sobria; la información permanece legible sin interacción. Respetar la preferencia de movimiento reducido, sin introducir un botón para activar o desactivar animaciones. Mantener el flujo real de contacto, propuesta y coordinación/supervisión sin afirmar gratuidad no confirmada. Verificar el servidor local después del cambio.

Fito ajusta la interacción: quitar la línea ubicada arriba de los pasos y dejar una sola barra de progreso que se llene al pasar el mouse por cada paso, con un degradado corto en el extremo de avance. Al salir, volver al estado inicial. Los números reciben un mini zoom en hover. Mantener el fondo verde, el contenido, la lectura sin hover y una alternativa de movimiento reducido. El ajuste sustituye el progreso de línea ligado al scroll.


## Cobertura y mapa interactivo, 2026-10-15

Fito pide mejorar la sección de cobertura mostrada en las capturas: mantener el mapa verde de ASESPRO, colocar la tarjeta «Conversamos la posibilidad» debajo del bloque de mapa y quitar los botones de consulta de las fichas de ciudades. Los puntos del mapa deben seguir seleccionando ciudades y actualizar una ficha informativa, sin acción de consulta dentro de esa ficha. La acción de contacto se concentra en la tarjeta inferior. Mejorar las animaciones del mapa y agregar movimientos/mini zooms sutiles en elementos de esta sección; el contenido sigue legible sin interacción, con movimiento reducido para quien lo solicita en su sistema y sin control manual de animaciones. La ubicación adicional del bloque en Inicio se consulta a Fito; mientras tanto, aplicar este cambio a la página Cobertura de las capturas. Verificar el servidor local tras el cambio.

La grilla separada de ciudades duplicaba los cinco nombres ya visibles y seleccionables en el mapa. Para que la tarjeta de contacto quede inmediatamente debajo del mapa y cierre la página, se retira esa grilla repetida; las cinco coberturas permanecen en el mapa. Esta es una decisión de composición reversible dentro del alcance visual, sin cambio de cobertura comercial.

Fito aclara la ubicación definitiva: eliminar Cobertura como página independiente del recorrido y dejar el bloque completo de mapa interactivo, con la tarjeta «Conversamos la posibilidad» inmediatamente debajo, únicamente en Inicio. Sustituye allí el adelanto actual de cobertura. El menú y el pie llevan al ancla de esa sección en Inicio; la ruta antigua puede redirigir a esa ancla para conservar enlaces existentes. Se mantienen las cinco ciudades, la selección informativa sin botón en la ficha, el CTA inferior, las animaciones y mini zooms, con movimiento reducido del sistema. Verificar el servidor tras el cambio.

Fito redefine la interacción del bloque de Inicio: reemplazar la ficha individual de ciudad por una lista dinámica de ciudades a la izquierda del mapa. Orden: Paso de los Toros, Montevideo, Punta del Este, Durazno y Mercedes. Paso de los Toros lleva la leyenda tenue «Casa central». Al seleccionar una ciudad desde la lista o desde el mapa, se destaca el elemento de la lista y se agranda su pin. Eliminar por completo la línea conectora entre lista y mapa. Cambiar el título a «Estamos en varias ciudades del país». La sección inferior «Conversamos la posibilidad» conserva su contenido pero su fondo ocupa todo el ancho de la pantalla, con contenido alineado a la grilla general. Mantener identidad verde, interacciones de teclado y movimiento reducido; verificar servidor tras el cambio.

Fito pide retirar de Inicio las secciones «Una forma cercana de hacer el trabajo» (adelanto del equipo) y «Escuchar, cuidar y revisar» (adelanto del mensaje de la dirección). La indicación solo afecta Inicio; las páginas de detalle Nosotros y su contenido quedan fuera de este cambio. Conservar el resto del orden de Inicio y verificar que no queden huecos, enlaces rotos ni errores de animación. Comprobar servidor local después de editar.

Fito pide tres cambios en Inicio: agregar «ORGANIZAMOS» al ciclo de palabras de «Somos ASESPRO» conservando el efecto de capa reveladora y la distancia de «tus espacios»; mover «Empresas que confían en nosotros» inmediatamente debajo de «Conversamos la posibilidad» con la marquesina de logos intacta; y reemplazar el bloque puente actual hacia Inmobiliaria por una recreación del hero real de `frontend/app/page.tsx`, usando su imagen `frontend/public/HERO_ASESPRO.png` (también provista por Fito), su título «Propiedades en Paso de los Toros y Pueblo Centenario», su texto de casas/apartamentos/terrenos y su composición de imagen completa con capa oscura. En el mock de limpieza, el hero inmobiliario tiene un único CTA «Ir a Inmobiliaria» hacia `https://inmobiliaria.asespro.com.uy/`, sin botones de alquiler/venta ni lógica de panel. No rasterizar texto ni usar la captura como sección. Preservar las demás secciones, identidad de ASESPRO Servicios fuera de este bloque, navegación accesible y movimiento reducido. Verificar servidor tras los cambios.

Fito pide que «El cuidado también se escucha» muestre las calificaciones de Google. La ficha pública localizada es `https://www.google.com/maps/?cid=15634903825423010938`, nombre «Asespro», en Florencio Sanchez 722, Paso de los Toros. Al 15/10/2026 muestra 3,7/5 con 29 valoraciones: 13 de cinco estrellas, 4 de cuatro, 6 de tres, 2 de dos y 4 de una. Google la clasifica como agencia inmobiliaria y el contenido incluye comentarios sobre distintos servicios. Mostrar únicamente el resumen de calificaciones verificables con fuente y aclaración de alcance; no atribuir los chats de WhatsApp o comentarios de Instagram a Google, ni presentar estas valoraciones generales como reseñas específicas del servicio de limpieza. Si Fito aporta una ficha diferente de limpieza, sustituir estos datos y la fuente después de verificarla. Conservar diseño y movimiento sobrio del bloque.

Fito ajusta esta sección: sustituir únicamente las barras de distribución dentro de la misma tarjeta por un slider de reseñas de cinco estrellas de esa ficha de Google; conservar el resumen superior y el enlace/fuente. Mostrar citas, autores y estrellas reales, sin inventar comentarios ni convertir reseñas sobre una plaza o sobre asesoramiento contable en testimonios de limpieza. La ficha consultada el 15/10/2026 contiene tres comentarios de cinco estrellas pertinentes al trato general: «Atención muy buena!¡!» (leonor Martínez), «Excelente atención» (Malena Olivera) y «Excelente atención!!!» (Wilmar Ramos). Otras calificaciones de cinco estrellas no tienen texto. La solicitud orientativa de cinco o seis comentarios queda limitada por las fuentes verificables disponibles; si se reciben más comentarios de Google relacionados con limpieza, se podrán agregar al mismo slider. El slider avanza automáticamente para cumplir «que vayan pasando», permite navegación manual y pausa al interactuar. La preferencia de movimiento reducido quita la transición visual; no detiene el avance de contenido pedido por Fito.

Fito observa que la lista de ciudades en Inicio se sobrepone al pasar el mouse. Aumentar separación y altura de filas, reservar espacio fijo para el texto, leyenda y marcador activo, y mantener el hover dentro de cada fila sin cambiar el ancho o desplazar filas vecinas. Conservar selección lista/mapa, mapa, cinco ciudades y CTA inferior. Comprobar el estado activo y el hover en navegador de escritorio.

Fito pide que el fondo verde claro de «Conversamos la posibilidad» cubra el espacio en blanco que tenía debajo, para que llegue pegado visualmente a «Empresas que confían en nosotros». Eliminar el margen inferior responsable del hueco; no desplazar ni rediseñar el contenido de los bloques. Verificar unión visual en escritorio y servidor local.

Fito reemplaza la sección independiente «Conversamos la posibilidad»: mover su mensaje «Contanos dónde está tu espacio y revisamos el próximo paso» y el botón «Consultar ubicación» debajo de la lista de ciudades, dentro de la sección de ubicaciones verde. Adaptar el bloque y el botón al contraste verde de la sección. Eliminar el bloque independiente para que Ubicaciones vaya seguida directamente por «Empresas que confían en nosotros». Preservar URL y consulta con city=Otra zona, ciudades y mapa; verificar orden en DOM, vista escritorio y servidor local.


## Footer del sitio de limpieza, 2026-10-15

Fito pide adaptar el footer de Inmobiliaria a la web de ASESPRO Servicios: conservar la estructura de tres zonas con navegación a la izquierda, logo original de esta web centrado y contacto a la derecha; una banda inferior verde de ancho completo con derechos reservados y la leyenda exacta «power by Codebix.com». Usar la paleta #009335 y neutros propios de Servicios, tipografía Manrope y los destinos actuales de Inicio, Servicios, Nosotros, Cobertura, Contacto, WhatsApp, correo e Instagram. Aplicar en todas las páginas del mock que muestran footer, sin modificar el sitio inmobiliario ni su panel. Mantener diseño legible en escritorio y móvil. Verificar enlaces, imagen y respuesta del servidor local.

### Corrección del proveedor del footer, 2026-10-15

Fito precisa la grafía del proveedor: reemplazar «Codebix.com» por «Kodebix.com» y enlazar a `https://kodebix.com` en todos los footers del mock.

## Ampliación de categorías comerciales, 2026-10-15

Fito agrega «Comercios» a la presentación de servicios. Incorporar una quinta tarjeta en el explorador de Inicio y una categoría equivalente en la página Servicios, con acceso directo desde el enlace/fragmento y una descripción de limpieza para locales y áreas de atención sin agregar promesas no confirmadas. Generar una fotografía ilustrativa propia, sin texto ni marcas, pertinente a limpieza de un comercio. Mantener las cuatro categorías existentes, interacción expansiva, navegación por teclado, enlaces a consulta y diseño de desktop/móvil. Documentar el recurso y comprobar las dos páginas en el servidor local.

## Ajustes de las dos webs públicas, 2026-10-15

Fito amplía el alcance a cambios locales de interfaz y contenido en `mock-servicios/` (ASESPRO Servicios) y `frontend/` (la web pública inmobiliaria existente). Esta autorización no incluye publicar, configurar DNS, ejecutar despliegues, modificar la base de datos ni trabajar en el proyecto documental INMOBILEX. Las rutas y enlaces entre sitios usan temporalmente `https://asespro.kodebix.com/` y `https://inmobiliaria.asespro.kodebix.com/`; serán reemplazables al habilitar los dominios .com.uy.

En ASESPRO Servicios: retirar del hero «Coordinación y supervisión desde 2011»; retirar la página/enlaces de Cobertura; rehacer Nosotros con presentación factual de Paso de los Toros, 15 años, servicios y zonas ya confirmadas, foto aportada del equipo directivo, eliminar el bloque «Un equipo que se encuentra», y expresar misión, visión y valores con el contenido actualizado de las tres placas adjuntas. La foto adjunta del equipo también sustituye la imagen de «Escuchar, cuidar y revisar», sin borde. El cierre «Hablemos de tu espacio» ocupa todo el ancho. En Contacto se evita la superposición del título con la bajada, se reutilizan las fotografías del inicio en las opciones de servicio y se simplifica el recorrido para abrir WhatsApp con la consulta compuesta, quitando la vista previa/copia/correo de la tarjeta; el correo queda como alternativa simple. En Servicios se actualiza el texto del hero, se sustituye «Cinco maneras de cuidar» por dos secciones basadas visualmente en las referencias adjuntas: cómo funciona (tres bloques) y qué servicios ofrecemos (lista de tipos), cambiando Consorcios por Comercios. No atribuir disponibilidad de reservas/administración en línea ni garantías operativas si no constan en el sistema.

En la web inmobiliaria: usar +598 99 715 662 como único número de contacto y WhatsApp; eliminar la página de limpieza y redirigir su ruta al sitio de Servicios; dejar «Servicios» como última opción del menú y dirigirlo al dominio temporal de ASESPRO Servicios. Renovar las fotografías editoriales y demostrativas para representar casas y espacios residenciales de ciudades pequeñas, manteniendo intacta la media real de publicaciones cuando provenga de anuncios; usar la foto aportada de la sede en Contacto. Los enlaces recíprocos entre las dos webs usan los dominios temporales anteriores. Conservar fuera de alcance cualquier operación de deploy, producción, datos y panel administrativo.

## Tipografía local de Inmobiliaria — decisión directa de Fito

2026-10-15. Para la web pública de Inmobiliaria, usar la familia Switzer_Complete entregada en `C:/Users/Fito/Downloads/Switzer_Complete.zip`, alojando localmente su fuente web variable WOFF2. La fuente se aplica a toda la experiencia pública, sin dependencia de Google Fonts. Mantener fuera de alcance el panel administrativo.

## Correcciones de Servicios y Nosotros — decisión directa de Fito

2026-10-15. En Servicios, reemplazar las tres tarjetas de proceso por el contenido literal de la referencia enviada por Fito: «Plan de limpieza», «Administración en línea» y «Servicio puntual garantizado», con sus descripciones completas. Esta decisión expresa de Fito actualiza para esas tarjetas la restricción previa de no atribuir reservas, administración en línea o garantías. Usar íconos verdes de la identidad en lugar de números. El cierre debe decir «Contanos qué espacio necesitás limpiar» y llevar el CTA «Contactanos por WhatsApp»; quitar la frase «Prepará una consulta con servicio y ciudad. La web no envía ni guarda tus datos.»

En Nosotros, mantener «Una empresa local. 15 años cuidando espacios.» como encabezado a un lado y el texto descriptivo al otro. Debajo, crear una sección verde propia con la fotografía recortada de las fundadoras y los nombres/cargos tal como están en la imagen: Virginia Ramirez, Licenciada en Economía; Leticia Acosta Leites, Contadora; «Socias Fundadoras y Directoras de ASESPRO». La imagen es fotografía, no una placa rasterizada; nombres y cargos son HTML. En «Escuchar, cuidar y revisar», usar la foto del equipo de cuatro integrantes (`team-supervision-reunion.jpg`), con la forma asimétrica de la referencia y sin bordes verdes. En Misión, Visión y Valores conservar el texto de las placas actualizadas que Fito adjuntó y sustituir las imágenes por fotos coherentes con sus temas; retirar `team-playa.jpg` de la secuencia porque rompe su armonía visual.

2026-10-16. Reducir el ancho visual de la fotografía de las socias fundadoras en su sección y quitar por completo su movimiento/zoom al pasar el mouse. Conservar el recorte asimétrico, el fondo verde y los nombres/cargos.


2026-10-16. Actualizar la imagen de las socias fundadoras con la foto de mayor calidad entregada por Fito (Gemini_Generated_Image_c6eqtnc6eqtnc6eq.jfif), aplicando la misma máscara asimétrica de la sección. Reducir más el conjunto de foto, nombres, cargos y leyenda; mantenerlo centrado y sin movimiento. En Misión, Visión y Valores, respetar literalmente los tres textos de las placas reales reenviadas el 2026-10-16 y quitar titulares o etiquetas que agreguen conceptos no incluidos en ellas.


2026-10-16. En Nosotros, centrar «¿Quiénes somos?» encima del bloque «Una empresa local. 15 años cuidando espacios.» y su descripción. En la historia visual Misión/Visión/Valores, ajustar la imagen de Valores con el mismo encuadre responsive que las otras; en móvil, hacer que las tres imágenes funcionen como slider navegable con botones y gesto táctil, manteniendo las transiciones por capítulo en escritorio.


2026-10-16. Alinear «¿Quiénes somos?» a la izquierda sobre el bloque institucional. En móvil, el slider de las imágenes de Misión/Visión/Valores debe avanzar automáticamente y no mostrar flechas ni numeración.

## Separación temporal del sitio inmobiliario y el panel

2026-10-16. Fito autoriza separar el sitio público inmobiliario del panel administrativo y desplegar la web de servicios, el frontend inmobiliario y el panel temporal en el VPS. El frontend inmobiliario se sirve en `inmobiliaria.asespro.kodebix.com`; el panel temporal en `panel.inmobiliaria.asespro.kodebix.com`; ASESPRO Servicios en `asespro.kodebix.com`. El panel conserva su funcionamiento actual (Next.js, autenticación Supabase y almacenamiento/configuración existentes) hasta que INMOBILEX esté listo. La web pública se ejecuta como frontend independiente, sin credenciales ni acceso a las rutas administrativas; mientras no exista la API de INMOBILEX, el catálogo público usa los datos de muestra ya incluidos. El panel y la web pública se aíslan por host y servicio, y los hosts actuales `asespro.codexa.uy` y `panelasespro.codexa.uy` se conservan como alias temporales. Esta autorización no incluye crear/modificar registros DNS ni migrar la base de datos.

2026-10-21. Fito informa que el administrador DNS ya agregó `@`, `inmobiliaria` y `panel.inmobiliaria` como registros A hacia `31.97.28.4`, y `www` como CNAME de `asespro.com.uy`; autoriza continuar la conexión de los sitios a esos dominios. ASESPRO Servicios usa `asespro.com.uy` y `www.asespro.com.uy`; el sitio público inmobiliario usa `inmobiliaria.asespro.com.uy`; el panel usa `panel.inmobiliaria.asespro.com.uy`. Mantener los hosts Kodebix y Codexa como alias durante la transición. Actualizar enlaces, canonicals y sitemap a los dominios propios.
