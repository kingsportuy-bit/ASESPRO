# Design System Document: The Editorial Estate
 
## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Curator"**
 
This design system is not a template; it is a digital gallery. For a premium Uruguayan real estate agency like ASESPRO, the interface must feel as intentional and permanent as the properties it showcases. We move away from the "busy" nature of traditional real estate portals toward an **Editorial High-End** experience. 
 
The system utilizes **Asymmetric Sophistication**—using generous white space and off-grid imagery placement to create a sense of luxury. By prioritizing "The Architectural Curator" ethos, we treat every property listing as a feature story, utilizing high-contrast typography and tonal layering to guide the user’s eye without the need for cluttered UI elements.
 
---
 
## 2. Colors & Surface Philosophy
 
The palette is anchored in a deep, intellectual Emerald Green (`primary: #00513f`), representing the lush landscapes of Uruguay and the stability of a trusted firm.
 
### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning. 
Boundaries must be defined through:
- **Background Color Shifts:** Use `surface-container-low` (#f0f4f3) against a `surface` (#f6faf9) background.
- **Tonal Transitions:** Define zones by nesting different surface levels rather than drawing lines.
 
### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
- **Level 0 (Base):** `surface` (#f6faf9) - The canvas.
- **Level 1 (Sections):** `surface-container-low` (#f0f4f3) - For secondary content areas.
- **Level 2 (Interaction):** `surface-container-highest` (#dfe3e2) - For interactive cards or hover states.
 
### The "Glass & Gradient" Rule
To elevate the "Modern" persona:
- **Glassmorphism:** Use for navigation bars and floating filters. Apply `surface` at 70% opacity with a `20px` backdrop-blur. This keeps the rich real estate imagery visible even when navigating.
- **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#00513f) to `primary_container` (#006b54) at a 135-degree angle. This adds "soul" and depth that prevents the UI from feeling flat or "SaaS-like."
 
---
 
## 3. Typography: The Editorial Voice
 
We use **Manrope** for its geometric clarity and modern Uruguayan flair. It bridges the gap between professional "Trust" and modern "Accessibility."
 
- **Display (display-lg/md):** Used for hero property titles. These should feel like magazine headlines. Set with tight letter-spacing (-0.02em) to feel authoritative.
- **Headlines (headline-lg/md):** Used for section titles. Always in `on_surface` (#181c1c).
- **Body (body-lg/md):** High-readability scales. Ensure `body-lg` is used for property descriptions to maintain a premium, easy-to-read feel.
- **Labels (label-md/sm):** Always uppercase with +0.05em tracking when used for metadata (e.g., "M²", "BEDROOMS").
 
---
 
## 4. Elevation & Depth
 
### The Layering Principle
Depth is achieved through **Tonal Layering**. Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f0f4f3) background. This creates a natural, soft "lift" that mimics high-end stationery.
 
### Ambient Shadows
Shadows are rarely used. When necessary (e.g., a floating "Contact" button), use:
- **Color:** `on_surface` (#181c1c) at 6% opacity.
- **Blur:** 32px to 48px.
- **Spread:** -4px.
This creates an "Ambient Bloom" rather than a harsh drop shadow.
 
### The "Ghost Border" Fallback
If a divider is essential for accessibility, use the "Ghost Border": `outline-variant` (#bec9c3) at **15% opacity**. Never use 100% opaque lines.
 
---
 
## 5. Components
 
### Buttons (The "Tactile" Scale)
- **Primary:** `primary` (#00513f) background with `on_primary` (#ffffff) text. Corner radius: `xl` (1.5rem). Large padding (16px top/bottom, 32px left/right).
- **Secondary:** `secondary_container` (#e1e3e1) with `on_secondary_fixed_variant` (#444746). 
- **Interaction:** On hover, primary buttons should shift to `primary_container` (#006b54) with a subtle scale-up (1.02x).
 
### Cards (The "Property Showcase")
- **Rule:** Forbid divider lines. 
- **Style:** Use a `surface-container-lowest` (#ffffff) base. Use vertical white space (32px) to separate the image from the text. The image should have a `md` (0.75rem) corner radius, while the card itself remains `none` (0px) or `lg` (1rem) depending on the layout's "edge" density.
 
### Input Fields
- **Style:** Minimalist. Only a bottom "Ghost Border" or a subtle `surface-container-high` (#e5e9e8) background. 
- **Focus State:** Transition the bottom border to `primary` (#00513f) at 2px thickness.
 
### Signature Component: The "Floating Glass Nav"
A fixed header using a `surface` tint at 80% opacity, `backdrop-filter: blur(12px)`, and a subtle `outline-variant` (10% opacity) bottom stroke. This ensures the Uruguayan coastline or cityscapes are always bleeding through the UI.
 
---
 
## 6. Do's and Don'ts
 
### Do:
- **Do** use asymmetric layouts. If an image is on the left, let the text on the right have a larger left-margin than the page container to create "editorial breathing room."
- **Do** use the `primary_fixed` (#9ef3d6) color for subtle highlights or "New Listing" chips.
- **Do** prioritize mobile touch targets. Every interactive element must be at least 48dp in height.
 
### Don't:
- **Don't** use black (#000000). Use `on_surface` (#181c1c) for text to maintain a sophisticated, soft-zinc contrast.
- **Don't** use standard "Shadow" presets. Always use the Tonal Layering method first.
- **Don't** crowd the "Hero" section. Let the property photography do the heavy lifting; the UI should merely be the frame.