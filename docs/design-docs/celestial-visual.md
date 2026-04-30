# Celestial Visual

## Purpose

The Celestial visual is the shared selected/highlight/orb treatment for GenUI. It must read as a black glass surface with directional colored refraction, a subtle colored rim, and two white edge glints.

Use it for:

- Prototype stage selected state.
- AI mode thinking/listening orb.
- AI selected contact rows, compose fields, chips, and flight recommendation surfaces.
- Bubble page child-bubble hover/selection.

## Source Of Truth

Reference/tuning tool:

- `celestial-tool.html`

Production implementation:

- `src/shared/celestial-selected-presets.js`
- `src/shared/celestial-selection-chrome.js`
- `src/styles/shared.css` for shared selected chrome and orb-core styling.
- `src/styles/ai-decorative.css` for AI/prototype state behavior only.

Important: in `celestial-tool.html`, the production-compatible stack is the `test-shell-*` stack. The `.celestial-*` caustic classes in that file are experimental/unused and are not the system rule.

Global rule: Celestial visual-core changes are product-wide. Update shared presets, shared chrome JS, and `src/styles/shared.css` so GenUI Tool, AI Mode, Bubble Home, and Celestial Visual Tool inherit the change automatically. Do not add product-specific Celestial overrides unless the user explicitly asks for that exception.

## Mental Model

Celestial is built by stacking transparent visual layers inside a rounded host:

```text
host surface
└─ black content/base surface
   ├─ layer 0: masked refraction blobs
   ├─ layer 1: white inner glow
   ├─ layer 2: colored accent rim
   ├─ layer 3: clipped top-left white highlight
   └─ layer 4: unmasked bottom-right sharp highlight
```

The host owns size and border radius. The chrome reads that geometry, computes scale values, writes CSS variables, and CSS animates the layers from a directional start state into the settled state.

## Production DOM Shape

Reusable selected hosts should use:

```html
<span class="g-selection-chrome" data-stage-direction="bottom" aria-hidden="true">
  <span class="g-stage-selected-refraction">
    <span class="g-stage-selected-blob g-stage-selected-blob--top-left"></span>
    <span class="g-stage-selected-blob g-stage-selected-blob--bottom-right"></span>
  </span>
  <span class="g-stage-selected-sharp-pass">
    <span class="g-stage-selected-sharp-highlight"></span>
  </span>
  <span class="g-stage-selected-accent-rim"></span>
  <span class="g-stage-selected-highlight"></span>
  <span class="g-stage-selected-highlight-mask">
    <span class="g-stage-selected-highlight-mask-image"></span>
  </span>
</span>
```

Prototype stage selection uses `#prototype-stage-selection` as the chrome root instead of `.g-selection-chrome`, but the internal layer names are the same.

Orb hosts use the same internal layer stack plus shared orb-core classes:

```html
<div class="g-celestial-orb-visual g-stage-selected-host selected">
  <div class="g-celestial-orb-sphere" aria-hidden="true"></div>
  <div class="g-celestial-orb-selection g-selection-chrome" data-stage-direction="bottom" aria-hidden="true">
    ...
  </div>
</div>
```

AI/prototype orb DOM should be created from `ensureSharedAiOrb()` in `src/shared/celestial-selection-chrome.js`. Do not duplicate orb markup per page.

## Layer Rules

### Base Surface

- The visible host background is black: `#000`.
- The host must have `border-radius: inherit`, `overflow: hidden`, and `isolation: isolate`.
- The chrome must be pointer-transparent: `pointer-events: none`.
- Do not add extra color fills behind the blobs; the color comes from the refraction blobs and rim.

### Layer 0: Refraction Mask

Production class:

- `.g-stage-selected-refraction`

Behavior:

- Absolute full inset.
- `z-index: 0`.
- `overflow: hidden`.
- Masked by `--g-stage-selected-mask-url`.
- Contains both colored blobs.

Mask generation:

- `buildZeroSpreadMaskUrl(width, height, radius, maskBlur)` builds an inline SVG mask.
- Blur is scaled from host height: `blur = height * maskBlur / 56`.
- SVG blur std deviation is `blur / 2`.
- Spread is scaled from host height: `spread = height * 3 / 56`.

Rule:

- Use the generated zero-spread mask from `src/shared/celestial-selection-chrome.js`.
- Do not replace it with a static border mask unless the host geometry is truly fixed.

### Layer 0 Children: Accent Blobs

Production classes:

- `.g-stage-selected-blob`
- `.g-stage-selected-blob--top-left`
- `.g-stage-selected-blob--bottom-right`

Behavior:

- Absolute circular blobs.
- `mix-blend-mode: screen`.
- Blur uses `--g-stage-selected-blob-blur`.
- Size is computed as:

```js
Math.round(Math.max(height * 1.9, Math.min(width * 0.42, height * 2.4)))
```

Gradient stops:

- Top-left blob uses radial center `36% 36%`.
- Bottom-right blob uses radial center `64% 64%`.
- Core color repeats from `0%` to `28%`.
- Edge color repeats from `56%` to `100%`.

### Layer 1: Inner Glow

Production class:

- `.g-stage-selected-highlight`

Behavior:

- Full inset.
- `z-index: 1`.
- `mix-blend-mode: screen`.
- Active shadow:

```css
inset 0 0 var(--g-stage-selected-inner-glow-blur, 6px) 1px rgba(255, 255, 255, 0.8),
inset 0 1px 0 rgba(255, 255, 255, 0.16)
```

The blur is scaled by host height:

```js
innerGlowBlurPx = height * preset.innerGlowBlur / 56
```

### Layer 2: Accent Rim

Production class:

- `.g-stage-selected-accent-rim`

Behavior:

- Full inset.
- `z-index: 2`.
- Colored inner rim derived from:
  - `--g-stage-selected-rgb`
  - `--g-stage-selected-secondary-rgb`
- Active opacity is `0.96`.
- Active rim is symmetric; inactive/entry rim is directional.

Active rim mapping:

```css
left:   inset  13u 0 14u -7u color-mix(primary 78%, white 22%)
right:  inset -13u 0 14u -7u color-mix(secondary 80%, white 20%)
top:    inset 0  9u 11u -7u color-mix(primary 52%, secondary)
bottom: inset 0 -9u 11u -7u color-mix(secondary 56%, primary)
haze:   inset 0 0 14u -5u rgba(255, 255, 255, 0.03)
```

`u` is `--g-stage-selected-unit`, computed as:

```js
Math.max(0.65, Math.min(width, height) / 320)
```

### Layer 3: Top-Left Highlight

Production classes:

- `.g-stage-selected-highlight-mask`
- `.g-stage-selected-highlight-mask-image`

Behavior:

- Mask wrapper is full inset, clipped to host radius, `z-index: 3`.
- Image uses `src/assets/button-highlight-top-left.png`.
- Base size before scale is `84px x 84px`.
- Width and height are `84 * highlightScale / 100`.
- Active anchor is:

```js
x = 10 - width / 2 + highlightTopX
y = 10 - height / 2 + highlightTopY
```

### Layer 4: Bottom-Right Sharp Highlight

Production classes:

- `.g-stage-selected-sharp-pass`
- `.g-stage-selected-sharp-highlight`

Behavior:

- Pass wrapper is anchored bottom-right, not inside the refraction mask.
- `z-index: 4`.
- Image uses `src/assets/figma-proto-button-highlight-bottom-mask.png`.
- Base size before scale is `96px x 96px`.
- Width and height are `96 * highlightScale / 100`.
- Active anchor is:

```js
x = width / 2 + highlightBottomX
y = height / 2 + highlightBottomY
```

Rule:

- The bottom-right highlight must stay outside masked ancestors. Putting it inside the refraction mask dulls the sharp white edge.

## Directional Motion

Directions are set with:

```html
data-stage-direction="bottom|top|left|right"
```

The direction controls the inactive/start position. Active state always settles at the preset end position.

Blob entry offsets:

| Direction | Blob start offset |
| --- | --- |
| `bottom` | `x + 0%`, `y + 92%` |
| `top` | `x + 0%`, `y - 92%` |
| `left` | `x - 92%`, `y + 0%` |
| `right` | `x + 92%`, `y + 0%` |

Highlight entry offsets:

| Direction | Highlight start offset |
| --- | --- |
| `bottom` | `x + 0px`, `y + 22px` |
| `top` | `x + 0px`, `y - 22px` |
| `left` | `x - 22px`, `y + 0px` |
| `right` | `x + 22px`, `y + 0px` |

Directional selection between vertical child items must use `syncDirectionalSelection()`:

- Moving down: outgoing item uses `bottom`, incoming item uses `top`.
- Moving up: outgoing item uses `top`, incoming item uses `bottom`.
- Same/no previous selection: selected item uses default `bottom`.

## Timing

Shared easing:

```css
--motion-ease: cubic-bezier(0.35, 0.23, 0.13, 0.98);
```

Layer timing:

| Layer | Enter/exit duration |
| --- | --- |
| Accent rim | `420ms` |
| Inner glow | `420ms` |
| Top-left highlight | `700ms` |
| Bottom-right highlight | `700ms` |
| Top-left blob | `700ms` |
| Bottom-right blob | `700ms` |
| Blob filter changes | `450ms` |

AI thinking orb breathes continuously at `4.2s`. In `magic-glow` or `orb-thinking-bridge`, breath duration is `1.5s`.

## Presets

Production preset source:

- `src/shared/celestial-selected-presets.js`

| Preset | Used for | Blob colors | Mask blur | Blob blur | Blob end positions | Highlight scale | Inner glow blur |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `list` | list, chip-like, dot, circle | top core `#8fb2ef`, top edge `#8a72eb`, bottom core `#a8bbf0`, bottom edge `#572fff` | `30` | `37` | top `-26%, -36%`, bottom `45%, 38%` | `100` | `8` |
| `orb` | thinking/listening orb and Bubble Home orb | top core `#729af1`, top edge `#8a72eb`, bottom core `#c5a0f0`, bottom edge `#572fff` | `30` | `37` | top `-26%, -36%`, bottom `45%, 38%` | `100` | `8` |
| `pill` | pill-like selected rows/fields | top core `#4f78ee`, top edge `#5d35ee`, bottom core `#8ea7f2`, bottom edge `#572fff` | `24.5` | `52` | top `-30%, -36%`, bottom `62%, 38%` | `157` | `5` |
| `card` | card, card-s, image, card-form, card-list | top core `#6386ef`, top edge `#a086ef`, bottom core `#5973ef`, bottom edge `#43367a` | `10.5` | `80` | top `-27%, -55%`, bottom `27%, 58%` | `100` | `2` |
| `chip` | fallback | top core `#8fb2ef`, top edge `#8a72eb`, bottom core `#a8bbf0`, bottom edge `#572fff` | `30` | `37` | top `-26%, -36%`, bottom `45%, 38%` | `100` | `8` |

Preset routing:

- `pill` -> `pill`
- `orb`, `listening`, `magic`, `ai` -> `orb`
- `chip`, `list`, `dot`, `circle` -> `list`
- `card`, `card-s`, `image`, `card-form`, `card-list` -> `card`
- unknown -> `chip`

## AI Thinking And Listening Orb

The AI orb uses the same `.g-stage-selected-*` layer stack inside:

- `#siri-orb`
- `.g-celestial-orb-visual`
- `.g-celestial-orb-sphere`
- `.g-celestial-orb-selection`
- `.g-celestial-orb-disambiguation-icon`

Default orb colors come from the shared `orb` preset, not from page-level CSS overrides.

Thinking mode:

- Keeps the full celestial layer stack visible.
- Uses continuous breathe animations for sphere scale, rim, and highlight.
- Does not add a separate magic/orb styling system.

Listening mode:

- Keeps the accent rim and inner glow visible.
- Hides refraction blobs while listening:
  - `.g-stage-selected-refraction`
  - `.g-stage-selected-blob--top-left`
  - `.g-stage-selected-blob--bottom-right`
- Uses `--ai-listening-rim-level` from `src/ai/voice-engine.js`.
- At volume `0`, the rim must still be subtly visible; it must not become pure black.
- Rim and inner glow update with `48ms linear` transitions for analyser responsiveness.

Rule:

- Do not invent prototype-specific listening/thinking overrides. Prototype and AI mode should share this orb layer stack and only differ by state classes and geometry.
- Do not invent Bubble Home orb or child-highlight overrides. Bubble should consume the same shared preset/chrome/style path.

## Required Setup For New Consumers

1. Add a host element with `position: relative`, `border-radius`, `overflow: hidden`, and `isolation: isolate`.
2. Add the `.g-selection-chrome` markup as the first or last non-interactive child.
3. Add `.g-stage-selected-host` to the host if it should use the standard selected/focused CSS.
4. Toggle `.selected` or `.focused` for active state.
5. Toggle `.deselecting` for exit animation when moving between items.
6. Set `data-stage-direction` on `.g-selection-chrome`.
7. Call `applyAiCelestialChrome()` after rendering or changing host geometry.

## Do Not

- Do not fork separate orb CSS for prototype, AI, and bubble pages.
- Do not add product-specific Celestial visual overrides unless the user explicitly requests them.
- Do not put the bottom-right sharp highlight inside the masked refraction layer.
- Do not replace the four blob colors with only two accent colors unless routed through the preset/color override logic.
- Do not remove the zero-spread mask unless the visual is intentionally no longer Celestial.
- Do not hide both rim and glow in listening mode; the zero-volume state still needs a subtle colored rim.
- Do not use the unused `.celestial-caustic-*` experiment from `celestial-tool.html` as production guidance.
