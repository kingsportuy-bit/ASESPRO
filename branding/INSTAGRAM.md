# Identidad de ASESPRO para Instagram

La paleta de Servicios es el contrato común de Servicios, Inmobiliaria y futuras piezas de Instagram. Sustituye la separación cromática anterior. Fuente: `mock-servicios/styles.css`; exportación verificable: `branding/palette.json` mediante `python scripts/sync-brand-palette.py --check`.

| Token | Valor | Uso |
|---|---|---|
| green | #009335 | Marca, símbolos y campos gráficos |
| green-dark | #007e2e | Acciones, texto verde y hover |
| green-deep | #006f28 | Fondos oscuros, selección y contraste |
| paper | #f8faf8 | Fondo claro |
| mint | #e8f3ec | Acento claro y apoyo sobre verde profundo |
| ink | #202820 | Texto principal |
| muted | #5f6863 | Texto secundario |
| line | #dbe6dd | Separadores |

Conservar Switzer en Inmobiliaria y su generador, y Manrope en Servicios. Conservar logos, proporciones, contenido y composición; logos monocromos verdes sobre claro o blancos sobre oscuro. Blanco y transparencias son auxiliares permitidos. No usar blanco pequeño sobre green: emplear green-dark o green-deep como fondo. Mantener estados de error, advertencia e información con su significado propio.

Aplicar a nuevas piezas y plantillas activas; no recolorear fotos, publicaciones exportadas ni históricos. Los degradados y velos gráficos pueden usar la paleta con transparencia sin editar la fotografía original. No generar nuevos hechos comerciales.

## Adaptador del generador

`briff-local/` es una copia local preparada dentro del workspace; no sustituye ni modifica la carpeta externa original. Los roles existentes se conservan para mantener el compositor: deep → green-deep; primary → green; mint → mint; paper → paper; accent → mint, que conserva legibilidad sobre fondos profundos. Los logos claros usan green y los oscuros blanco.

`CONFIG_MARCA.json` alimenta `herramientas/marca.py` (brief y SVG) y `herramientas/compilar.py` (HTML autocontenido). La plantilla de brief contiene las reglas para futuras exportaciones. El espacio de almacenamiento nuevo evita recuperar automáticamente ajustes cromáticos anteriores; no borra esos borradores. Mantener las herramientas de publicación y de IA sin ejecutar durante la revisión local.

Para regenerar la copia local: `python branding/briff-local/herramientas/marca.py` y `python branding/briff-local/herramientas/compilar.py`. El iniciador de la copia usa un puerto separado (8767) para no reutilizar un generador original ya abierto. El ejemplo raster adjunto conserva exactamente sus colores y contenido, como exige el contrato del compositor; no es una nueva plantilla de marca. La incorporación a la carpeta externa requiere una tarea cuyo workspace permita escribir allí.
