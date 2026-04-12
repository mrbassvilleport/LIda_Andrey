# Design System Specification: The Artisanal Curator

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** We are not building a standard booking engine; we are crafting a digital manuscript of Portuguese discovery. The experience must feel like leafing through a high-end travel editorial—tactile, historical, and deeply intentional.

To break the "template" look, this system rejects rigid, symmetrical grids in favor of **intentional asymmetry**. Images should overlap container boundaries, and typography should utilize dramatic scale shifts to create a sense of rhythm and "saudade"—a nostalgic beauty. We lean into the high contrast between the deep Azulejo blue and the sun-drenched ivory to guide the traveler’s eye through a curated journey.

---

## 2. Colors & Tonal Depth
The palette is rooted in the soul of Portugal: the sea, the clay, and the light.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through:
1.  **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
2.  **Tonal Transitions:** Using subtle shifts between Ivory (`surface`) and slightly weathered variants to define content blocks.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of hand-pressed paper.
*   **Base:** `surface` (#fcf9f1) is our canvas.
*   **Nesting:** Use `surface-container-low` for secondary content areas. Place `surface-container-lowest` (Pure White) cards on top of these sections to create a soft, natural lift.

### The "Glass & Gradient" Rule
To prevent the design from feeling flat or "dated," incorporate **Modern Portuguese Glassmorphism**. Floating navigation or overlay cards should use `surface` colors at 80% opacity with a `24px` backdrop blur. This allows the vibrant Azulejo patterns beneath to bleed through, softening the interface.

### Signature Textures
Main CTAs and Hero sections should not use flat colors. Apply a subtle linear gradient from `primary` (#002068) to `primary_container` (#003399) at a 135-degree angle to mimic the depth of glazed ceramic tiles.

---

## 3. Typography: The Editorial Voice
Our typography scale bridges the gap between the 18th-century Manueline style and modern accessibility.

*   **Display & Headlines (Noto Serif):** These are our "hero" elements. Use `display-lg` for evocative, short phrases. Use tight letter-spacing (-2%) to make the serif feel more contemporary and authoritative.
*   **Body & Titles (Manrope):** The sans-serif provides a functional counterpoint. It must remain clean and airy. 
*   **The Hierarchy of Discovery:** Headlines tell the story; body text provides the map. Always ensure a significant size jump between `headline-md` and `body-lg` to maintain an editorial, magazine-like feel.

---

## 4. Elevation & Depth
In this system, depth is organic, not synthetic.

*   **Tonal Layering:** Avoid shadows where possible. Achieve hierarchy by stacking `surface-container-highest` elements over `surface-dim` backgrounds.
*   **Ambient Shadows:** If an element must float (like a booking FAB), use an **Azulejo Tinted Shadow**. 
    *   *Recipe:* Blur: 40px, Spread: -5px, Color: `on_surface` at 6% opacity. This mimics natural light hitting a matte wall.
*   **The "Ghost Border" Fallback:** If a divider is functionally required for accessibility, use the `outline_variant` token at **15% opacity**. A 100% opaque line is considered a failure of the design system.

---

## 5. Components

### Buttons: The Artisanal Touch
*   **Primary:** `primary` background, `on_primary` text. Use `md` (0.75rem) corner radius. Add a subtle inner-glow (1px white at 10% opacity) on the top edge to simulate a glazed tile edge.
*   **Secondary (Terracotta):** Use `secondary` (#9f402d). These are for "Action" and "Heat" (e.g., Book Now, Explore Map).
*   **Tertiary:** No background. Use `primary` text with a `tertiary_fixed_dim` (Sun Yellow) 2px underline that only spans 60% of the text width.

### Cards & Lists
*   **Card Style:** Never use dividers. Use `xl` (1.5rem) rounded corners. Separate content using `surface-container-high` backgrounds for the "footer" of the card and `surface-container-lowest` for the main body.
*   **Imagery:** Images within cards should have a subtle "weathered" mask or a very slight `1px` inner-stroke of `outline_variant` at 10% to prevent them from bleeding into the ivory background.

### Input Fields
*   **Text Inputs:** Use a "soft-well" approach. Background should be `surface_container_low` with a bottom-only border of `primary` at 40% opacity. Upon focus, the border expands to 2px and becomes `primary` 100%.

### Unique Component: The Pattern Overlay
*   **Azulejo Motif:** Use SVG tile patterns in `primary_container` at 5% opacity as background watermarks for `surface_container` sections. This reinforces the historical context without distracting from readability.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use whitespace as a structural element. If a section feels crowded, increase the vertical margin rather than adding a line.
*   **DO** mix the Sun Yellow (`tertiary`) sparingly as a "highlight" color for icons or small labels to draw the eye to "hidden gems."
*   **DO** allow images of architecture and landscapes to break the container—let a church spire or a wine glass overlap the text container above it.

### Don't:
*   **DON'T** use pure black (#000000). Use `on_surface` (#1c1c17) for all text to keep the "warmth."
*   **DON'T** use sharp 90-degree corners. Everything in Portugal is softened by time; our UI should reflect that with the `DEFAULT` (0.5rem) or `lg` (1rem) radii.
*   **DON'T** use standard "drop shadows" on cards. Stick to tonal layering and background shifts.