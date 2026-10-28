# Design System Document: The Editorial Estate

## Catálogo provisional de propiedades · 28/10/2026

En el modo `panel`, solo se publican propiedades reales enviadas desde el editor local. Se conservan diseño y navegación existentes. Tarjetas y detalle no muestran precio; mapa con círculos de zona aproximada de radio 300–3000 m, seleccionada explícitamente en el panel. Sin coordenadas del inmueble en datos públicos. El círculo funciona con clic, toque y teclado; su popup enlaza al detalle. CTA único del detalle: **Coordinar visita**, con referencia y enlace al WhatsApp configurado del operador. El listado vacío se explica sin recurrir a ejemplos. Los otros orígenes de datos mantienen sus contratos.
 
## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Curator"**
 
This design system is not a template; it is a digital gallery. For a premium Uruguayan real estate agency like ASESPRO, the interface must feel as intentional and permanent as the properties it showcases. We move away from the "busy" nature of traditional real estate portals toward an **Editorial High-End** experience. 
 
The system utilizes **Asymmetric Sophistication**—using generous white space and off-grid imagery placement to create a sense of luxury. By prioritizing "The Architectural Curator" ethos, we treat every property listing as a feature story, utilizing high-contrast typography and tonal layering to guide the user’s eye without the need for cluttered UI elements.
 
---
 
## 2. Colors & Surface Philosophy
 
La identidad pública usa la paleta real de ASESPRO Servicios. Fuente canónica: `mock-servicios/styles.css`; `scripts/sync-brand-palette.py` genera `frontend/app/brand-tokens.css` y `branding/palette.json`. El verde de marca es #009335; primary usa #007e2e y primary-container #006f28 para contraste con texto blanco. Los alias conectan componentes públicos con esa única fuente; no editar las exportaciones manualmente.
 
### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning. 
Boundaries must be defined through:
- **Background Color Shifts:** Use `surface-container-low` (#e8f3ec) against a `surface` (#f8faf8) background.
- **Tonal Transitions:** Define zones by nesting different surface levels rather than drawing lines.
 
### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
- **Level 0 (Base):** `surface` (#f8faf8) - The canvas.
- **Level 1 (Sections):** `surface-container-low` (#e8f3ec) - For secondary content areas.
- **Level 2 (Interaction):** `surface-container-highest` (#dbe6dd) - For interactive cards or hover states.
 
### The "Glass & Gradient" Rule
To elevate the "Modern" persona:
- **Glassmorphism:** Use for navigation bars and floating filters. Apply `surface` at 70% opacity with a `20px` backdrop-blur. This keeps the rich real estate imagery visible even when navigating.
- **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#007e2e) to `primary_container` (#006f28) at a 135-degree angle. This adds "soul" and depth that prevents the UI from feeling flat or "SaaS-like."
 
---
 
## 3. Typography: The Editorial Voice
 
Se conservan las familias actuales: **Switzer** local en Inmobiliaria y su generador; **Manrope** en Servicios. Esta unificación cambia la paleta, no la tipografía.
 
- **Display (display-lg/md):** Used for hero property titles. These should feel like magazine headlines. Set with tight letter-spacing (-0.02em) to feel authoritative.
- **Headlines (headline-lg/md):** Used for section titles. Always in `on_surface` (#202820).
- **Body (body-lg/md):** High-readability scales. Ensure `body-lg` is used for property descriptions to maintain a premium, easy-to-read feel.
- **Labels (label-md/sm):** Always uppercase with +0.05em tracking when used for metadata (e.g., "M²", "BEDROOMS").
 
---
 
## 4. Elevation & Depth
 
### The Layering Principle
Depth is achieved through **Tonal Layering**. Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#e8f3ec) background. This creates a natural, soft "lift" that mimics high-end stationery.
 
### Ambient Shadows
Shadows are rarely used. When necessary (e.g., a floating "Contact" button), use:
- **Color:** `on_surface` (#202820) at 6% opacity.
- **Blur:** 32px to 48px.
- **Spread:** -4px.
This creates an "Ambient Bloom" rather than a harsh drop shadow.
 
### The "Ghost Border" Fallback
If a divider is essential for accessibility, use the "Ghost Border": `outline-variant` (#dbe6dd) at **15% opacity**. Never use 100% opaque lines.
 
---
 
## 5. Components
 
### Buttons (The "Tactile" Scale)
- **Primary:** `primary` (#007e2e) background with `on_primary` (#ffffff) text. Corner radius: `xl` (1.5rem). Large padding (16px top/bottom, 32px left/right).
- **Secondary:** `secondary_container` (#e8f3ec) with `on_secondary_fixed_variant` (#5f6863).
- **Interaction:** On hover, primary buttons should shift to `primary_container` (#006f28) with a subtle scale-up (1.02x).
 
### Cards (The "Property Showcase")
- **Rule:** Forbid divider lines. 
- **Style:** Use a `surface-container-lowest` (#ffffff) base. Use vertical white space (32px) to separate the image from the text. The image should have a `md` (0.75rem) corner radius, while the card itself remains `none` (0px) or `lg` (1rem) depending on the layout's "edge" density.
 
### Input Fields
- **Style:** Minimalist. Only a bottom "Ghost Border" or a subtle `surface-container-high` (#e8f3ec) background.
- **Focus State:** Transition the bottom border to `primary` (#007e2e) at 2px thickness.
 
### Signature Component: The "Floating Glass Nav"
A fixed header using a `surface` tint at 80% opacity, `backdrop-filter: blur(12px)`, and a subtle `outline-variant` (10% opacity) bottom stroke. This ensures the Uruguayan coastline or cityscapes are always bleeding through the UI.
 
---
 
## 6. Do's and Don'ts
 
### Do:
- **Do** use asymmetric layouts. If an image is on the left, let the text on the right have a larger left-margin than the page container to create "editorial breathing room."
- **Do** use the `primary_fixed` (#e8f3ec) color for subtle highlights or "New Listing" chips.
- **Do** prioritize mobile touch targets. Every interactive element must be at least 48dp in height.
 
### Don't:
- **Don't** use black (#000000). Use `on_surface` (#202820) for text to maintain a sophisticated, soft-zinc contrast.
- **Don't** use standard "Shadow" presets. Always use the Tonal Layering method first.
- **Don't** crowd the "Hero" section. Let the property photography do the heavy lifting; the UI should merely be the frame.

## Alcance de identidad unificada

La web pública consume los alias solo cuando el documento no contiene `data-admin-shell="true"`. El panel mantiene los tokens heredados originales de globals.css y sus estilos propios; no se migran estados operativos ni acciones destructivas. Fotos, HTML históricos de frontend y publicaciones anteriores se conservan. Los SVG verdes públicos activos se adaptan sin modificar sus trazados.

Mapa de roles: surface → paper; surface-container-low y primary-fixed → mint; surface-container-highest y outline-variant → line; on-surface → ink; on-surface-variant y on-secondary-fixed-variant → muted; secondary-container → mint; brand → green; primary → green-dark; primary-container → green-deep. Verde principal #009335, oscuro #007e2e, profundo #006f28, papel #f8faf8, menta #e8f3ec, tinta #202820, secundario #5f6863, línea #dbe6dd. Reglas de Instagram y adaptador local del generador: branding/INSTAGRAM.md.
