# Design System

## Color Glow

A selected/highlighted button effect. Dark base with colored inner rim glow, a soft white top-left highlight, a soft white bottom-right highlight, and a crisp inner-edge white ring. Used to indicate active, selected, or primary action state on any container.

### Where to find it

- **Live example:** `index.html` — `#prototype-figma-button-demo-group` (hidden, `display:none`) contains two instances: a pill button (200×72, `#prototype-figma-button-demo`) and a square button (56×56, `#prototype-figma-square-demo`). The effect is also applied as the stage selected state via `#prototype-stage-selection` inside `#drop-main`, driven by `.prototype-stage-selected` class — CSS in `src/styles/shared.css`, classes prefixed `.g-stage-selected-*`.
- **All CSS:** `src/styles/editor-decorative.css` — everything under `/* ── Prototype Figma button demo ── */`, classes prefixed `.prototype-figma-button-*`.
- **Assets:** `src/assets/` — four files used by this effect:
  - `button-highlight-top-left.png` — soft white glow anchored top-left (420×168px @3x)
  - `figma-proto-button-highlight-bottom-mask.png` — soft white glow anchored bottom-right (420×168px @3x)
  - `figma-proto-button-refraction-mask.svg` — outer mask shape for the refraction layer
  - `figma-proto-button-refraction-center-mask.svg` — inner luminance mask for the refraction fill

---

### Parameters

| Parameter | CSS custom property | Description |
|---|---|---|
| Width | `--color-glow-width` | Container width in px |
| Height | `--color-glow-height` | Container height in px |
| Corner radius | `--color-glow-radius` | Border radius in px. Use `height / 2` for full pill |
| Accent A | `--color-glow-accent-a` | Primary accent color (left/top rim). e.g. `rgb(50 117 246)` |
| Accent B | `--color-glow-accent-b` | Secondary accent color (right/bottom rim). e.g. `rgb(82 34 216)` |

---

### HTML structure

All 6 child divs inside `.color-glow-shell` are required. Do not omit any — each handles a distinct visual layer. Content (label, icon, etc.) goes inside `.color-glow-shell` as an additional child, after `.color-glow-highlight-mask`.

```html
<div
  class="color-glow"
  style="
    --color-glow-width: 200px;
    --color-glow-height: 72px;
    --color-glow-radius: 36px;
    --color-glow-accent-a: rgb(50 117 246);
    --color-glow-accent-b: rgb(82 34 216);
  "
>
  <div class="color-glow-shell">

    <!-- Layer 1: refraction blobs (colored soft light through the edges) -->
    <div class="color-glow-refraction">
      <div class="color-glow-refraction-filled-mask">
        <!-- blur blobs are not rendered in static mode; divs are kept for structure -->
      </div>
    </div>

    <!-- Layer 2: bottom-right white highlight — MUST be direct child of shell, NOT inside refraction -->
    <div class="color-glow-sharp-pass">
      <div class="color-glow-sharp-highlight"></div>
    </div>

    <!-- Layer 3: colored inner rim glow via inset box-shadow -->
    <div class="color-glow-accent-rim"></div>

    <!-- Layer 4: crisp white inner edge ring via inset box-shadow + screen blend -->
    <div class="color-glow-highlight"></div>

    <!-- Your content here (label, icon, etc.) -->
    <div class="color-glow-label">Start</div>

    <!-- Layer 5: top-left white highlight — rendered last so it sits above content -->
    <div class="color-glow-highlight-mask">
      <div class="color-glow-highlight-mask-image" aria-hidden="true"></div>
    </div>

  </div>
</div>
```

---

### CSS

Add this block to your stylesheet. The only things to change per instance are the 5 custom properties set inline on `.color-glow`.

```css
/* ── Color Glow ── */

.color-glow {
  position: relative;
  width: var(--color-glow-width);
  height: var(--color-glow-height);
  flex: 0 0 auto;
  /* defaults — override via inline style */
  --color-glow-width: 200px;
  --color-glow-height: 72px;
  --color-glow-radius: 36px;
  --color-glow-accent-a: rgb(50 117 246);
  --color-glow-accent-b: rgb(82 34 216);
}

/* Shell: clips everything to the rounded rectangle */
.color-glow .color-glow-shell {
  position: absolute;
  inset: 0;
  border-radius: var(--color-glow-radius);
  overflow: hidden;
  isolation: isolate;
  background: #1f1f1f;
  border: 1px solid rgba(129, 129, 129, 0.5);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.02),
    0 10px 30px rgba(0, 0, 0, 0.16);
}

/* Refraction layer: masked by outer shape SVG */
.color-glow .color-glow-refraction {
  position: absolute;
  inset: 0;
  -webkit-mask-image: url('src/assets/figma-proto-button-refraction-mask.svg');
  mask-image: url('src/assets/figma-proto-button-refraction-mask.svg');
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: var(--color-glow-width) var(--color-glow-height);
  mask-size: var(--color-glow-width) var(--color-glow-height);
  -webkit-mask-position: center;
  mask-position: center;
  overflow: visible;
  opacity: 0.68;
}

.color-glow .color-glow-refraction-filled-mask {
  position: absolute;
  inset: 0;
  -webkit-mask-image: url('src/assets/figma-proto-button-refraction-center-mask.svg');
  mask-image: url('src/assets/figma-proto-button-refraction-center-mask.svg');
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: var(--color-glow-width) var(--color-glow-height);
  mask-size: var(--color-glow-width) var(--color-glow-height);
  -webkit-mask-position: center;
  mask-position: center;
}

/*
  Bottom-right white highlight.
  CRITICAL: this must be a direct child of .color-glow-shell,
  NOT nested inside .color-glow-refraction.
  If placed inside refraction, the SVG mask will hide it entirely.

  Sizing: anchored to bottom-right at a fixed natural size derived from the
  PNG asset ratio (140×56 = 2.5:1). Width and height grow with container
  height using a base+fraction formula so the highlight stays proportionate
  without flooding large containers. Blur also scales with height.

  At h=56:  width≈168px, height≈67px, blur=0px
  At h=300: width≈412px, height≈189px, blur≈8px
*/
.color-glow .color-glow-sharp-pass {
  position: absolute;
  bottom: 0;
  right: 0;
  width: calc(112px + var(--color-glow-height) * 1.0);
  height: calc(39px + var(--color-glow-height) * 0.5);
  overflow: visible;
}

.color-glow .color-glow-sharp-highlight {
  position: absolute;
  bottom: 0;
  right: 0;
  width: calc(112px + var(--color-glow-height) * 1.0);
  height: calc(39px + var(--color-glow-height) * 0.5);
  background-image: url('src/assets/figma-proto-button-highlight-bottom-mask.png');
  background-repeat: no-repeat;
  background-size: calc(112px + var(--color-glow-height) * 1.0) calc(39px + var(--color-glow-height) * 0.5);
  background-position: bottom right;
  mix-blend-mode: screen;
  filter: blur(calc((var(--color-glow-height) - 56px) * 0.0328));
}

/*
  Colored inner rim: 4 directional inset shadows using the two accent colors.
  Uses fixed px values so the rim thickness stays constant regardless of
  container size — it does not scale with height.
  Values tuned at h=56px and locked there.
*/
.color-glow .color-glow-accent-rim {
  position: absolute;
  inset: 0;
  border-radius: var(--color-glow-radius);
  box-shadow:
    inset 13px 0 14px -7px
      color-mix(in srgb, var(--color-glow-accent-a) 78%, white 22%),
    inset -13px 0 14px -7px
      color-mix(in srgb, var(--color-glow-accent-b) 80%, white 20%),
    inset 0 9px 11px -7px
      color-mix(in srgb, var(--color-glow-accent-a) 52%, var(--color-glow-accent-b)),
    inset 0 -9px 11px -7px
      color-mix(in srgb, var(--color-glow-accent-b) 56%, var(--color-glow-accent-a)),
    inset 0 0 14px -5px
      rgba(255, 255, 255, 0.03);
  opacity: 0.96;
}

/* Crisp white inner edge ring */
.color-glow .color-glow-highlight {
  position: absolute;
  inset: 0;
  border-radius: var(--color-glow-radius);
  mix-blend-mode: screen;
  box-shadow:
    inset 0 0 6px 1px rgba(255, 255, 255, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

/*
  Top-left white highlight.
  Rendered after content so it sits on top visually.
  The mask wrapper clips to the rounded rect boundary.
  The image div is pinned top: 0; left: 0 and sized with the same
  base+fraction formula as the bottom-right highlight.
  overflow: hidden on the mask clips the PNG to the rounded rect —
  any part outside the container is invisible, so large glows are safe.

  At h=56:  width≈168px, height≈67px, blur=0px
  At h=300: width≈412px, height≈189px, blur≈8px
*/
.color-glow .color-glow-highlight-mask {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--color-glow-radius);
}

.color-glow .color-glow-highlight-mask-image {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(112px + var(--color-glow-height) * 1.0);
  height: calc(39px + var(--color-glow-height) * 0.5);
  background-image: url('src/assets/button-highlight-top-left.png');
  background-repeat: no-repeat;
  background-position: left top;
  background-size: calc(112px + var(--color-glow-height) * 1.0) calc(39px + var(--color-glow-height) * 0.5);
  mix-blend-mode: screen;
  filter: blur(calc((var(--color-glow-height) - 56px) * 0.0328));
}
```

---

### Layer order (bottom to top inside `.color-glow-shell`)

| Order | Element | What it does |
|---|---|---|
| 1 | `.color-glow-refraction` | Soft colored light blobs along left/right edges, masked to button shape |
| 2 | `.color-glow-sharp-pass` | Bottom-right white glow — must be outside refraction or SVG mask hides it |
| 3 | `.color-glow-accent-rim` | Colored inner glow rim from the two accent colors |
| 4 | `.color-glow-highlight` | Crisp white inner edge ring |
| 5 | *(your content)* | Label, icon, etc. |
| 6 | `.color-glow-highlight-mask` | Top-left white highlight — rendered above content |

---

### Common mistakes

**Bottom-right highlight invisible** — `.color-glow-sharp-pass` was placed inside `.color-glow-refraction`. The refraction div has an SVG `mask-image` applied to it; anything inside gets clipped by that mask shape, which excludes the corners. Always keep `.color-glow-sharp-pass` as a direct child of `.color-glow-shell`.

**Highlights stretching on large containers** — Do not use `background-size: 100% 100%`. The PNG assets are 420×168px @3x (140×56 CSS px natural size). Stretching them to fill a large container distorts the glow shape and creates visible banding. Instead use the `base + h * fraction` formula so the highlight grows slowly and clips naturally at the edges via `overflow: hidden`.

**Highlight clipping** — `.color-glow-highlight-mask` has `overflow: hidden` and `border-radius` to clip the PNG to the rounded rect. If you remove it, the PNG corners bleed outside the button boundary. The bottom-right highlight has no mask wrapper — it relies on the shell's `overflow: hidden`.

**Accent rim flooding large containers** — the rim box-shadow values are fixed px, not scaled by height. Do not make them proportional to height — they will flood the center on tall containers. The fixed values (13px offset, 14px blur, -7px spread) are tuned to always look like a thin edge glow regardless of container size.

**Accent rim not visible** — if `--color-glow-accent-a` or `--color-glow-accent-b` are missing or fully transparent, the rim disappears. Always set both accent vars.

**Asset paths** — the SVG mask assets use relative paths from the CSS file location (`src/styles/`), so they reference `../assets/…`. If you move the CSS, update those paths. If you use inline `style` attributes or a different stylesheet location, use paths relative to your HTML root instead (e.g. `src/assets/…`).
