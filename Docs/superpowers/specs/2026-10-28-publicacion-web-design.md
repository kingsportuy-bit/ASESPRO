# Publicación web desde el panel de Instagram

Alcance aprobado en conversación: conservar el flujo de IG y acoplar una carga web independiente, reutilizando datos y fotos. La web muestra zona aproximada elegida con círculo ajustable, nunca precio ni dirección exacta. CTA: Coordinar visita, con referencia y enlace al WhatsApp del operador. Permitir cargar solo a la web propiedades ya publicadas en IG, actualizar y retirar.

Arquitectura elegida: catálogo provisional de archivos JSON y JPEG en volumen persistente del servicio Next, separado de Supabase/Sportex y de la extensión IG. API autenticada con secreto de publicación; el servidor local actúa como puente y guarda la configuración cifrada con DPAPI. Solo transmite campos públicos permitidos; fotos reexportadas por canvas sin EXIF. Referencia estable por borrador y control de versión evita duplicados y sobrescrituras simultáneas.

Alternativas: conectar con el admin Supabase exigiría resolver su despliegue y migraciones; esperar a Sportex impide operar ahora. El catálogo de archivos es adecuado para una sola réplica y se respaldará junto al volumen. No se publica ninguna propiedad de prueba en producción.

Decisiones del implementador: radio 300–3000 m; selección de centro de zona, sin geocodificar direcciones. La web provisional usa solo catálogo real cuando PROPERTY_DATA_SOURCE=panel; otros modos se conservan. Catálogo vacío se muestra como vacío. Fotos web limpias en orden del panel, sin portada duplicada; videos siguen en IG en esta versión. Secretos fuera de HTML, localStorage y repositorio.
