# ASESPRO · Contexto del panel

## Publicación web provisional · 28/10/2026

La sección 7 reutiliza datos y fotos del editor con un adaptador explícito. Publicar solo en la web es independiente de la extensión y del estado IG. Revisión web propia, círculo de zona pública de 50–3000 m, WhatsApp editable, catálogo para cargar/actualizar/retirar. Conservar paleta oscura, Switzer y controles existentes. No fotos duplicadas ni portada informativa en web; JPEG derivados sin EXIF. Sin video web en esta primera versión. Credencial cifrada con DPAPI, nunca en navegador ni exportaciones. No anunciar éxito hasta recibir confirmación del servidor. Ante conflicto de versión o timeout, refrescar catálogo y cargar la versión vigente. Retiro reversible conservado en disco, no eliminación definitiva.

Herramienta local en español para preparar piezas inmobiliarias. Fuente de identidad: BRIEF_MARCA.md y CONFIG_MARCA.json. Paleta y Switzer son compartidas; no copiar la distribución de la web. UI de controles blanca, verde profundo y bordes discretos; vista previa protagonista.

## Componentes y responsabilidades

- panel/panel.css: estilo común y Switzer embebida por herramientas/compilar.py.
- panel/navegacion.js: pestañas, foco, navegación por teclado y selección inicial.
- panel/compositor.*: composición de dos capas, independiente de propiedades.
- panel/propiedades.*: datos, fotos y vista previa de carrusel de propiedades.
- panel/propiedades-modelo.js: extracción conservadora, características y copy por plantilla.
- panel/sliders.js: sliders con imán y teclado preciso.
- herramientas/servidor.py: documentos y paquetes locales; nunca publica por su cuenta.

## Contratos

Preservar las fotos originales. Solo recorte, escala y superposición deterministas. Toda característica debe estar informada o confirmada; desconocido no equivale a cero. Precio, dirección exacta y número de unidad excluidos de las piezas y del copy públicos de propiedades. Ubicación pública genérica, editable y explícita. Revisión de datos antes de exportar. Copy editable, sin sobrescribir una edición sin aviso.

Publicación externa: distinguir preparar archivos, abrir Instagram y publicar. No anunciar éxito sin verificación de publicación. No leer cookies ni credenciales; no almacenar secretos en HTML o localStorage. Conexión Chrome pendiente de elegir extensión; el botón no debe fingir una conexión.

Foto faltante: lienzo de posición marcado como vista previa, sin exportación. Error de carga: conservar fotos válidas, indicar cuáles fallaron. Reordenar con botones accesibles además de cualquier arrastre futuro. Feedback mediante regiones de estado. Layout responsive en una columna en pantallas pequeñas.

## Portadas de propiedades

Información compacta en el tercio inferior con margen seguro; logo blanco arriba sobre degradado verde suave. Orden final: portada informativa, misma foto con idéntico encuadre sin datos y con logo, luego el resto con logo. Duplicado derivado, no una segunda carga; comparte ajustes de encuadre con portada. Máximo 19 fotos originales y 20 finales.

Decisión del usuario: la extensión usa directamente la sesión abierta del perfil Chrome ASESPRO, sin verificar el nombre de cuenta mediante controles de la página.

Formato actualizado de propiedades: Publicación usa 1080 × 1440 (3:4) tanto en fotos como en MP4. Historias mantiene 1080 × 1920. Los formatos generales de marca no cambian.


## Asistente OpenAI de propiedades

Configuración plegable junto a la carga de descripción; campo de contraseña y estado de clave sin devolverla al navegador. Mismo Switzer y controles verdes existentes. Detección y copy son acciones explícitas, sin llamadas automáticas. Las respuestas se presentan en una propuesta independiente con Usar, Otra versión y Descartar. Aplicar invalida la casilla de revisión. Cambiar datos mientras se genera invalida esa propuesta. Las fotos y videos permanecen en el flujo de composición sin IA.

La clave está cifrada con DPAPI por usuario en LOCALAPPDATA, fuera del pack público. El servidor local usa Responses y salidas estructuradas; nunca incorpora la clave a brief, HTML, exports ni extensión. Los errores no muestran el cuerpo de las respuestas de autenticación. El estado «guardada» no afirma que OpenAI haya aceptado la clave.


## Actualización de interfaz · 21/10/2026

Interfaz oscura por defecto, usando panel/oscuro.css al final de los estilos compilados: fondo #101a17, superficies #18251f, texto #e9f1ec y acciones principales #65e3b6. El tema afecta controles y paneles; no modifica paleta de marca, logos ni colores de los lienzos exportados.

Propiedades comienza vacía, sin ejemplos precargados. Reiniciar propiedad está arriba junto a la cuenta; pide confirmar, recarga el editor y elimina datos temporales, fotos, video, copy y propuestas. Conserva ajustes de marca y clave de OpenAI cifrada. No permite reiniciar mientras se prepara un carrusel o se solicita IA.

Gastos comunes usa exclusivamente vacío/yes/none/included. No incluir ese campo en la lista booleana de características (garage hasta cable).


## Recorrido de propiedades por secciones

Cabecera: Reiniciar propiedad y OpenAI desplegable con disponibilidad comprobada mediante acceso al modelo (no implica saldo ni cuota de generación). Secciones consecutivas: 1 Cargar datos con IA, 2 Opciones editables y características de portada, 3 Fotos y formato, 4 Video y recorte, 5 Vista previa del carrusel con fotos/video/copy, 6 Revisión y publicar. Flujo vertical en lugar de columna de controles larga y vista fija paralela.

Estufa a leña es una característica independiente de parrillero. Valor desconocido/vacío, Sí o No; se detecta desde estufa a leña, estufa de leña o salamandra. Icono propio wood-stove dentro de assets/iconos, integrado en portada y copy. El video de la sección 5 comparte el reproductor con el editor, muestra el original y sus ajustes; el MP4 exportado sigue disponible para comprobar el render final.


### Vista previa del carrusel tipo publicación

La sección 5 muestra una única publicación con medio y copy juntos. Flechas anterior/siguiente, contador y puntos recorren el mismo orden exportado: portada, misma foto sin información, restantes fotos y video opcional al final. La navegación admite teclado cuando el carrusel tiene foco. El copy se refleja desde el editor, incluida la detección con IA. Los ajustes de encuadre y el organizador de fotos son desplegables secundarios debajo de la publicación. La vista previa del video usa el reproductor con logo, velocidad y recorte; el aviso distingue esta vista del MP4 exportado.


## Identidad unificada de Servicios

CONFIG_MARCA.json adapta la paleta de Servicios: deep → green-deep; primary → green; mint/accent → mint; paper → paper. El acento claro conserva legibilidad sobre verde profundo. Controles con texto blanco usan green-dark. Se conserva Switzer, la interfaz oscura, las fotos y la estructura del compositor. El almacenamiento de identidad usa un espacio nuevo para no recuperar automáticamente la paleta anterior; los borradores anteriores permanecen intactos.
