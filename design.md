# Design System

## Celestial Selected State

The Celestial selected state is now the system reference for both visual treatment and timing. The source of truth is [celestial-tool.html](/Users/ariax/Documents/GitHub/GenUI/celestial-tool.html).

This selected state is the rule for:

- Prototype mode stage selection
- AI mode message flow selected rows, chips, compose fields, and flight recommendation surfaces
- Bubble Home highlighted child surfaces and orb selection layers

### Reference files

- Golden reference: `celestial-tool.html`
- Shared prototype and AI chrome: `src/styles/shared.css`
- Shared selected chrome markup: `src/flows/ui-primitives.js`
- AI flow surfaces: `src/styles/ai-glass.css`
- AI orb overrides: `src/styles/ai-decorative.css`
- Bubble Home custom chrome: `src/styles/bubble2-page.css`
- Bubble Home custom selection DOM: `src/bubble2-page.js`

### Layer stack

Base surface:

- fill: `#000`
- outline: `inset 0 0 0 1px rgba(129, 129, 129, 0.5)`

Selected chrome inside the host, bottom to top:

1. `inner glow`
2. `accent rim`
3. `top-left highlight`
4. `bottom-right highlight`

The tool also includes a refraction-mask + blob layer for tuning. Shared product surfaces without that mask still follow the same upper chrome stack and timing.

### Exact shared values

Inner glow:

```css
mix-blend-mode: screen;
box-shadow:
  inset 0 0 6px 1px rgba(255, 255, 255, 0.8),
  inset 0 1px 0 rgba(255, 255, 255, 0.16);
```

Accent rim:

```css
box-shadow:
  inset 13px 0 14px -7px color-mix(in srgb, var(--g-stage-selected-rgb) 78%, white 22%),
  inset -13px 0 14px -7px color-mix(in srgb, var(--g-stage-selected-secondary-rgb) 80%, white 20%),
  inset 0 9px 11px -7px color-mix(in srgb, var(--g-stage-selected-rgb) 52%, var(--g-stage-selected-secondary-rgb)),
  inset 0 -9px 11px -7px color-mix(in srgb, var(--g-stage-selected-secondary-rgb) 56%, var(--g-stage-selected-rgb)),
  inset 0 0 14px -5px rgba(255, 255, 255, 0.03);
```

Highlight assets:

- top-left: `src/assets/button-highlight-top-left.png`
- bottom-right: `src/assets/figma-proto-button-highlight-bottom-mask.png`

Highlight sizing:

```css
width: calc(112px + var(--g-stage-h, 56px) * 1);
height: calc(39px + var(--g-stage-h, 56px) * 0.5);
filter: blur(calc((var(--g-stage-h, 56px) - 56px) * 0.0328));
```

Default accent variables:

- `--g-stage-selected-rgb: rgb(144 172 255)`
- `--g-stage-selected-secondary-rgb: rgb(151 97 255)`

### Motion

Use the prototype stage curve:

```css
cubic-bezier(0.35, 0.23, 0.13, 0.98)
```

Shared timing:

- shell geometry changes: `600ms`
- chrome wrapper fade: `420ms`
- inner glow fade / box-shadow settle: `420ms`
- accent rim fade / box-shadow settle: `420ms`
- top-left and bottom-right highlight opacity: `700ms`
- highlight blur resize settle: `450ms`

For the Celestial tool itself, directional motion is driven by the refraction blobs plus directional shadow bias on the inner glow and rim. Product surfaces that do not carry directional entry data still use the same durations and final visual stack.

### DOM contract

Shared selected chrome markup is returned by `renderSelectedChrome()`:

```html
<span class="g-selection-chrome" aria-hidden="true">
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

Visual order is enforced with `z-index`, not DOM order:

- inner glow: `z-index: 1`
- accent rim: `z-index: 2`
- top-left highlight mask: `z-index: 3`
- bottom-right highlight pass: `z-index: 4`

### Implementation notes

- The selected base should stay black. Do not reintroduce the older gray-to-black fill gradient on selected hosts.
- The selected outline should stay a thin neutral gray. Do not tint the base outline with the accent colors.
- The rim is a separate overlay above the inner glow.
- The white highlight PNGs should animate to full visibility. Do not heavily dim them in active state.
- Bubble Home uses custom DOM but should mirror the same layer values and timings.
- AI orb states may still layer orb-specific breathing behavior on top of the same rim and inner-glow values.
