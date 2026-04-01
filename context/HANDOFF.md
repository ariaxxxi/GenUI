# Handoff

## Task title
Prototype Detail Multiline Editing

## Completion status
- Completed

## Summary
- Updated the prototype detail editor in both prototype entry points from a single-line input to a multiline textarea.
- Detail text now supports:
  - spaces
  - explicit line breaks via `Enter`
- Updated the prototype stage preview so detail text preserves newline characters instead of collapsing them into one wrapped paragraph.
- Kept the same per-scenario/per-stage `textByShape[shape].detail` storage contract; only the editor and display behavior changed.

## Files changed
- `index.html`
- `ai.html`
- `src/styles/editor-layout.css`
- `src/styles/ai-drop.css`
- `src/shared/morph-layout.js`
- `src/shared/morph-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/shared/morph-layout.js`
- `node --check src/shared/morph-render.js`
- Browser validation on `http://127.0.0.1:5174/index.html`:
  - confirmed `#scenario-detail` is now a `TEXTAREA`
  - entered `Line 1 with space` + `Enter` + `Line 2`
  - confirmed stored value:
    - `localStorage['genui.scenarios.v1'][0].content.textByShape.card.detail === 'Line 1 with space\\nLine 2'`
  - confirmed rendered detail text preserves the newline
  - confirmed rendered `#c-detail` resolves to `white-space: pre-wrap`
  - confirmed textarea min height is `78px`
  - screenshot: `/tmp/add-visual-detail-multiline.png`

## Remaining issues / caveats
- None for the prototype editor path. The change is scoped to prototype detail editing/rendering only.

## Recommended next step
1. If other editable text layers later need multiline behavior, reuse the same `textarea + pre-wrap` path instead of introducing per-layer newline hacks.

## Task title
Prototype Intent Header Content Field

## Completion status
- Completed

## Summary
- Added a prototype Content-tab edit field for the `intent-header` stage component in both prototype entry points.
- Kept the header text in the same per-scenario/per-stage `textByShape` model as the other text layers by extending each entry to:
  - `primary`
  - `secondary`
  - `detail`
  - `intentHeader`
- Extended the same per-stage typography model so the prototype intent header now has editable:
  - `font size`
  - `color`
- The Content row now includes:
  - header text input
  - size input
  - color input
- The new field only appears when the current stage has the `intent-header` component enabled.
- Prototype preview now renders the intent header label from `textByShape[shape].intentHeader` and falls back to the scenario name when the field is blank.
- Prototype preview applies the header typography from `typographyByShape[shape].intentHeader`.

## Files changed
- `index.html`
- `ai.html`
- `src/shared/scenario-data.js`
- `src/shared/sidebar.js`
- `src/shared/sidebar-render.js`
- `src/shared/sidebar-bindings.js`
- `src/tool/modules/manual-bindings.js`
- `src/tool/index-app.js`
- `src/ai/editor-bindings.js`
- `src/ai/ai-shell.js`
- `src/ai/ai-bindings.js`
- `context/architecture.md`
- `context/handoff.md`

## Validation performed
- `node --check src/shared/scenario-data.js`
- `node --check src/shared/sidebar.js`
- `node --check src/shared/sidebar-render.js`
- `node --check src/shared/sidebar-bindings.js`
- `node --check src/tool/modules/manual-bindings.js`
- `node --check src/tool/index-app.js`
- `node --check src/ai/editor-bindings.js`
- `node --check src/ai/ai-bindings.js`
- Browser validation on `http://127.0.0.1:5174/index.html`:
  - confirmed `#editor-intent-header-field` starts hidden
  - enabled `intent-header` on the `card` stage and confirmed the field becomes visible in the Content tab
  - entered `WEATHER ALERT` and confirmed:
    - rendered header text updated to `WEATHER ALERT`
    - `localStorage['genui.scenarios.v1'][0].content.textByShape.card.intentHeader === 'WEATHER ALERT'`
  - changed the header typography and confirmed:
    - rendered font size updated to `26px`
    - rendered color updated to `rgb(255, 102, 0)`
    - `localStorage['genui.scenarios.v1'][0].content.typographyByShape.card.intentHeader.size === 26`
    - `localStorage['genui.scenarios.v1'][0].content.typographyByShape.card.intentHeader.color === '#ff6600'`
  - screenshot: `/tmp/add-visual-intent-header-content-tab.png`
  - screenshot: `/tmp/add-visual-intent-header-typography.png`

## Remaining issues / caveats
- The prototype header still falls back to the scenario name if `intentHeader` is blank. This is intentional so existing scenarios with the component enabled do not render an empty label.

## Recommended next step
1. If the prototype editor later needs separate typography controls for the intent header, add them as a dedicated header layer instead of reusing primary/detail typography.

## Task title
Prototype Selected Shell Bottom-Right Highlight Rebuild

## Completion status
- Completed

## Summary
- Rebuilt the prototype selected-shell bottom-right highlight to match the mirrored 3-layer Figma structure from node `349:10`.
- Updated both prototype entry points so the right highlight now mounts:
  - `g-stage-selected-accent-right-base`
  - `g-stage-selected-accent-right-white-2`
  - `g-stage-selected-accent-right-white-1`
- Translated the Figma right-side geometry directly into CSS pixel positioning:
  - accent circle: `166px` at `right -51px`, `bottom -139px`
  - white spotlight 2: `59.463px` at `right 2.27px`, `bottom -85.73px`
  - white spotlight 1: `32px` at `right 16px`, `bottom -72px`
- Kept the same selected accent color contract:
  - the accent circle is driven by `--g-stage-selected-rgb` / `--g-stage-selected-secondary-rgb`
  - both white spotlights stay white with `mix-blend-mode: plus-lighter`
- Left the host morph transition stack unchanged.
- Later reduced the bottom inner shadow slightly from `57%` to `48%` while leaving the rest of the inner glow unchanged.

## Files changed
- `index.html`
- `ai.html`
- `src/styles/shared.css`
- `context/HANDOFF.md`

## Validation performed
- Browser validation on `http://127.0.0.1:5174/index.html`:
  - confirmed the selected shell now contains `3` right highlight layers
  - confirmed the right white spotlights stay white while the accent circle is color-driven
  - confirmed `#drop-main` still resolves to:
    - `width, height, border-radius, transform, opacity, background, box-shadow, filter`
- Browser validation on `http://127.0.0.1:5174/ai.html`:
  - confirmed the same `3` right highlight layers are present there as well

## Task title
Prototype Selected Shell Top-Left Highlight Rebuild

## Completion status
- Completed

## Summary
- Rebuilt the prototype selected-shell top-left highlight to match Figma node `349:10` as an explicit 3-layer stack instead of a single blurred gradient.
- Updated both prototype entry points so `#prototype-stage-selection` now mounts a left highlight group with:
  - `g-stage-selected-accent-left-base`
  - `g-stage-selected-accent-left-white-2`
  - `g-stage-selected-accent-left-white-1`
- Translated the Figma layer geometry directly into CSS pixel positioning:
  - accent circle: `166px` at `left -52px`, `top -98px`
  - white spotlight 2: `59.463px` at `left 1.27px`, `top -44.73px`
  - white spotlight 1: `32px` at `left 15px`, `top -31px`
- Kept the existing bottom-right highlight, inner glow, selected-state logic, per-stage accent colors, and color-transition system unchanged.
- Preserved the recent morph regression fix:
  - no new transition was added to `#drop-main`
  - the selected color interpolation remains owned by `#prototype-stage-selection`

## Files changed
- `index.html`
- `ai.html`
- `src/styles/shared.css`
- `context/HANDOFF.md`

## Validation performed
- Browser validation on `http://127.0.0.1:5174/index.html`:
  - confirmed the selected shell now contains the 3 left highlight nodes
  - confirmed the accent color updates only the base accent circle while both white spotlights remain white
  - confirmed `#drop-main` still resolves to the original morph transition stack:
    - `width, height, border-radius, transform, opacity, background, box-shadow, filter`
- Browser validation on `http://127.0.0.1:5174/ai.html`:
  - confirmed the same 3-layer left highlight stack is present there as well

## Remaining issues / caveats
- The rebuilt left highlight is a CSS translation of the Figma frame, not a direct asset import, so any later parity tuning should happen in `src/styles/shared.css`.

## Recommended next step
1. If the top-left stack needs more Figma parity, tune only the three left-layer gradients and blur radii in `src/styles/shared.css`.

## Task title
Prototype Selected Color Stage Transition Smoothing

## Completion status
- Completed

## Summary
- Smoothed prototype selected-shell accent color changes when moving between stages on `add-visual`.
- Converted the two selected-shell accent vars into typed color custom properties so the browser can interpolate them instead of snapping:
  - `--g-stage-selected-rgb`
  - `--g-stage-selected-secondary-rgb`
- Updated the prototype selected-shell gradients and inner glow to consume those vars as colors via `color-mix(...)`, preserving the existing visual while allowing animated color blending.
- Added a `320ms var(--motion-ease)` transition for both selected-shell color vars on `#prototype-stage-selection`, not on `#drop-main`, so the stage geometry morph stack stays intact.
- Updated the morph renderer to write the selected accent values as real CSS colors (`rgb(...)`) instead of raw channel strings, and to mirror them onto `#prototype-stage-selection`, which is required for typed custom-property interpolation without breaking host morphing.

## Files changed
- `src/styles/shared.css`
- `src/shared/morph-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/shared/morph-render.js`
- Browser validation on `http://127.0.0.1:5174/index.html`:
  - confirmed `#drop-main` still resolves to the original geometry transition stack:
    - `width, height, border-radius, transform, opacity, background, box-shadow, filter`
  - confirmed the selected-shell colors still blend during transition on the overlay:
    - start: `rgb(144, 172, 255)` / `rgb(151, 97, 255)`
    - mid at `160ms`: `rgb(29, 202, 149)` / `rgb(31, 98, 255)`
    - end: `rgb(0, 210, 122)` / `rgb(0, 98, 255)`

## Remaining issues / caveats
- The smooth interpolation applies to prototype selected-shell color changes on `#drop-main`. Geometry changes for stage shape/size are unchanged.

## Recommended next step
1. If the color ramp still feels too quick or too slow in-browser, tune only the `320ms` custom-property transition in `src/styles/shared.css`.

## Task title
Prototype Stage Selected Highlight Shell

## Completion status
- Completed

## Summary
- Applied the reusable name-chip highlight treatment to prototype-mode stage containers without replacing each stage's existing base appearance.
- Kept stage-level `selected`, `accentColor`, and `secondaryAccentColor` on normalized stage records only as legacy/default fallback for migration and new-stage seeding.
- Moved prototype selected-shell state out of the shared stage library and into scenario content so it is now independent per scenario and per stage:
  - `content.selectedByShape`
  - `content.accentColorByShape`
  - `content.secondaryAccentColorByShape`
- The right-panel `Selected`, `Accent primary`, and `Accent secondary` controls now edit the active scenario's current stage entry instead of mutating the shared stage definition.
- Added a `Selected` toggle plus `Accent primary` / `Accent secondary` controls to the right-panel Style tab in both prototype entry points:
  - `index.html`
  - `ai.html`
- Implemented a shared overlay inside `#drop-main` that only turns on when the current prototype stage has `selected: true`.
- The selected overlay includes only the requested chip-highlight pieces:
  - top-left accent highlight ball
  - bottom-right accent highlight ball
  - accent-colored inner shadow
- Added the missing white inset outline so prototype selected mode now includes the brighter selected ring used by the AI name chip:
  - `.g-stage-selected-ring`
  - `box-shadow: none`
- Later retuned the bottom-right highlight ball to read softer by increasing its blur from `10px` to `40px`.
- Added a card-only softening pass so rectangular card stages blend the highlight more like the pill:
  - bottom-right highlight moved lower, enlarged slightly, reduced in opacity, and increased to `blur(40px)`
- Later removed the card-only top-left override so card now uses the exact same top-left highlight as pill:
  - same gradient anchor: `58% 176% at 13% -10%`
  - same blur: `5px`
- Later moved the prototype selected-shell highlight geometry to pixel-based values so pill and card keep visual parity instead of drifting with aspect ratio:
  - top-left highlight: `244px 176px at 55px -10px`, `blur(5px)`
  - bottom-right highlight: `width 126px`, `height 88px`, `right -25px`, `bottom -18px`, `blur(40px)`
- This also removed the remaining card-only bottom-right override so both pill and card now use the same highlight geometry.
- Retuned the selected-shell color application to match the AI disambiguation name chip:
  - top-left highlight now uses the same secondary-primary-secondary-primary stop pattern as the AI chip highlight
  - bottom-right highlight stays primary-led
  - inner glow now mixes primary and secondary accent colors with the same split left/right weighting as the AI chip
- Added the second prototype selected-shell color to the live preview contract:
  - `--g-stage-selected-rgb`
  - `--g-stage-selected-secondary-rgb`
- Increased the prototype selected-shell top-left highlight blur from `5px` to `15px` so the left accent reads softer while keeping the same pixel anchor and gradient stops.
- Removed the extra selected-only inset ring so selected mode now reuses the same base container outline as non-selected, with only the accent highlights and inner glow changing.
- When `Selected` is off, the stage keeps its current container look with no added shell effect.

## Files changed
- `index.html`
- `ai.html`
- `src/styles/shared.css`
- `src/shapes.js`
- `src/shared/scenario-data.js`
- `src/shared/sidebar.js`
- `src/shared/sidebar-render.js`
- `src/shared/sidebar-actions.js`
- `src/shared/morph-render.js`
- `src/tool/index-app.js`
- `src/ai/ai-bindings.js`
- `src/ai/editor-bindings.js`
- `src/tool/modules/manual-bindings.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/shapes.js`
- `node --check src/shared/scenario-data.js`
- `node --check src/shared/sidebar.js`
- `node --check src/shared/sidebar-render.js`
- `node --check src/shared/sidebar-actions.js`
- `node --check src/shared/morph-render.js`
- `node --check src/tool/index-app.js`
- `node --check src/ai/ai-bindings.js`
- `node --check src/ai/editor-bindings.js`
- `node --check src/tool/modules/manual-bindings.js`
- Browser validation via Playwright on `add-visual`:
  - opened `http://127.0.0.1:5174/index.html`
  - captured `/tmp/prototype-stage-selected-off.png`
  - toggled `Selected` on for the current stage and captured `/tmp/prototype-stage-selected-on.png`
  - changed the right-panel accent color to `#ff6600` and captured `/tmp/prototype-stage-selected-orange.png`
  - confirmed state transitions:
    - initial: `checked=false`, `selectedClass=false`, overlay opacity `0`
    - selected: `checked=true`, `selectedClass=true`, overlay opacity `1`
    - recolored: CSS var `--g-stage-selected-rgb` resolved from `144 172 255` to `255 102 0`
  - after right-bottom blur retune:
    - captured `/tmp/prototype-stage-selected-blur40.png`
    - confirmed `.g-stage-selected-accent-right` resolves to `filter: blur(40px)`
  - after missing-outline fix:
    - captured `/tmp/prototype-stage-pill-ring.png`
    - captured `/tmp/prototype-stage-card-ring.png`
    - confirmed the prototype selected shell now resolves with the same inset outline on both shapes:
      - pill: `rgba(255, 255, 255, 0.78) 0px 0px 2px 0.5px inset`
      - card: `rgba(255, 255, 255, 0.78) 0px 0px 2px 0.5px inset`
  - after card-only softening pass:
    - switched prototype stage to `Card`
    - captured `/tmp/prototype-stage-card-selected-softened.png`
    - confirmed card-specific selected-shell values:
      - `body[data-current-shape="card"]`
      - right highlight `filter: blur(40px)`
      - right highlight `bottom: -67.4688px`
      - right highlight size `142.797px x 243.953px`
  - after card-left parity retune:
    - captured `/tmp/prototype-stage-pill-left-reference.png`
    - captured `/tmp/prototype-stage-card-left-matched-to-pill.png`
    - confirmed pill and card now resolve to identical top-left highlight values:
      - `filter: blur(5px)`
      - `radial-gradient(58% 176% at 13% -10%, rgb(144, 172, 255) 0%, rgba(144, 172, 255, 0.92) 12%, rgba(144, 172, 255, 0.54) 24%, rgba(144, 172, 255, 0.16) 36%, rgba(144, 172, 255, 0) 50%)`
  - after pixel-based parity retune:
    - captured `/tmp/prototype-stage-pill-pixel-parity.png`
    - captured `/tmp/prototype-stage-card-pixel-parity.png`
    - confirmed pill and card now resolve to identical highlight geometry on both accents:
      - left: `radial-gradient(244px 176px at 55px -10px, rgb(144, 172, 255) 0%, rgba(144, 172, 255, 0.92) 12%, rgba(144, 172, 255, 0.54) 24%, rgba(144, 172, 255, 0.16) 36%, rgba(144, 172, 255, 0) 50%)`, `filter: blur(5px)`
      - right: `width 126px`, `height 88px`, `right -25px`, `bottom -18px`, `filter: blur(40px)`
  - after per-scenario/per-stage state migration:
    - captured `/tmp/prototype-stage-scenario-independent.png`
    - confirmed stage independence inside one scenario:
      - `Weather Snapshot` pill set to `selected=true`, color `#ff6600`
      - switching `Weather Snapshot` to card showed `selected=false`, color `#90acff`
      - after setting `Weather Snapshot` card to `selected=true`, color `#00ff66`, switching back to pill restored the original pill state unchanged
    - confirmed scenario independence for the same stage:
      - `Incoming Message` card started at `selected=false`, color `#90acff`
      - after setting it to `selected=true`, color `#3366ff`, `QR Access Pass` card still remained `selected=false`, color `#90acff`
      - switching back to `Incoming Message` restored its own card state unchanged
  - after two-color selected-shell gradient wiring:
    - captured `/tmp/prototype-stage-two-color-gradient.png`
    - confirmed the live selected-shell CSS vars resolve independently:
      - primary `--g-stage-selected-rgb`: `255 102 0`
      - secondary `--g-stage-selected-secondary-rgb`: `91 46 255`
    - confirmed the prototype left highlight now uses the AI chip stop pattern:
      - `radial-gradient(244px 176px at 55px -10px, rgb(91, 46, 255) 0%, rgba(255, 102, 0, 0.98) 11%, rgba(91, 46, 255, 0.74) 22%, rgba(255, 102, 0, 0.22) 34%, rgba(255, 102, 0, 0) 50%)`
    - confirmed the prototype inner glow now mixes both colors instead of a single accent:
      - `rgba(91, 46, 255, 0.23) 0px 0px 24px 0px inset`
      - `rgba(255, 102, 0, 0.57) 0px -9px 20px 0px inset`
      - `rgba(255, 102, 0, 0.25) -7px 0px 12px 0px inset`
      - `rgba(91, 46, 255, 0.2) 7px 0px 13px 0px inset`

## Remaining issues / caveats
- The selected-shell overlay is currently scoped to `#drop-main`, which matches the current prototype-stage preview architecture. If preview rendering later moves to other stage containers, the same overlay pattern can be mounted there with the same `prototype-stage-selected` class plus the `--g-stage-selected-rgb` and `--g-stage-selected-secondary-rgb` variables.

## Recommended next step
1. If more selected-state polish is needed, tune only the overlay layers in `src/styles/shared.css` so the underlying stage visuals stay untouched.
2. If this selected shell needs to appear in more preview surfaces, reuse the same markup and `--g-stage-selected-rgb` contract rather than creating a second highlight system.

## Task title
Traveling Hotspot And Linked Accent Orbit Retune

## Completion status
- Completed

## Summary
- Consolidated the traveling-spot work into the final selected-chip motion behavior.
- The reusable traveling hotspot layers are currently hidden for now:
  - `g-accent-orbit-middle` remains configured as a `24px x 24px`, `border-radius: 50%`, `filter: blur(15px)` hotspot with the attached accent-colored blurred `::before` layer
  - `g-accent-orbit-left-spot` remains configured as the linked companion aura
  - both moving layers now resolve with `opacity: 0` and `animation: none`, so the selected pill keeps only the static shell treatment
- The shared orbit path is now pushed well outside the capsule with:
  - `--g-accent-hotspot-inset: -28px`
  - `--g-accent-hotspot-corner: 16px`
- Result: the hotspot system is preserved for reuse, but no traveling light is visible on the selected disambiguation pill.
- Fixed the first-load hotspot jump by stopping the `entering -> settled` phase change from rebuilding the disambiguation pill DOM:
  - `renderDisambiguationPills(...)` no longer bakes the phase class into the HTML string
  - `message-send-render.js` now toggles the `entering/settled` class in place on the existing cluster node
  - this preserves hotspot node identity across the `800ms` phase boundary, so the orbit animation no longer restarts

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/flows/message-send-render.js`
- Browser validation via Playwright on `add-visual`:
  - opened `http://127.0.0.1:5174/ai.html`
  - triggered the Hiro disambiguation state through the real quick-chip path
  - captured `/tmp/disambiguation-chip-hotspot-removed.png`
  - confirmed hidden hotspot computed styles:
    - `g-accent-orbit-left-spot`
      - `opacity: 0`
      - `animation-name: none`
      - `animation-duration: 0s`
    - `g-accent-orbit-middle`
      - `opacity: 0`
      - `animation-name: none`
      - `animation-duration: 0s`
  - confirmed final resolved orbit geometry on the selected pill:
    - `--g-accent-hotspot-inset: -28px`
    - `--g-accent-hotspot-corner: 16px`
  - confirmed first-load no-jump fix across the old phase boundary:
    - first sample during entry: `left 20.5781px`, `top -28px`, cluster `g-disambiguation-pills entering`
    - later sample after `950ms`: same hotspot node persisted, `left 107.438px`, `top -28px`, cluster `g-disambiguation-pills settled`
  - confirmed the selected chip now renders with only the static shell treatment and no visible traveling hotspot

## Remaining issues / caveats
- The hotspot system is hidden, not deleted. Re-enabling motion later only requires restoring non-zero opacity and the orbit animation on the existing moving layers.

## Recommended next step
1. Leave the static shell in place unless motion is intentionally reintroduced.
2. If motion comes back later, start by re-enabling only `g-accent-orbit-middle` before bringing back the linked aura.

## Task title
Reduce Left Accent Fill On Selected Disambiguation Pill

## Completion status
- Completed

## Summary
- Tightened the selected pill's left-side accent so the capsule keeps more dark empty space and less of the left half reads as filled color.
- Reduced the accent sweep area in `src/styles/ai-glass.css` by:
  - shrinking the top-left purple/blue `g-accent-orbit-fill` radial
  - shrinking and softening the white/cool `g-accent-orbit-left-spot`
  - easing back the left-biased inset glow inside `g-accent-orbit-inner-glow`
- Left the moving hotspot, inset ring, and overall shell structure unchanged.

## Files changed
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/flows/message-send-render.js`
- Browser validation via Playwright on `add-visual`:
  - opened `http://127.0.0.1:5174/ai.html`
  - triggered Hiro disambiguation through the real quick-chip path
  - captured `/tmp/disambiguation-chip-left-accent-reduced.png`
  - confirmed the selected pill now renders with a narrower left accent region and more dark negative space across the pill body

## Remaining issues / caveats
- This pass only reduced the left-side accent footprint. If further tuning is needed, the next safe knobs are the first radial in `g-accent-orbit-fill` and the size of `g-accent-orbit-left-spot`.

## Recommended next step
1. Open the Hiro disambiguation state on `add-visual`.
2. Compare the left third of the pill against the Figma target.
3. If it still feels too full, reduce only the left spotlight width before changing the rest of the shell.

## Task title
Disambiguation Pill Pixel-Parity Layer Rebuild

## Completion status
- Completed

## Summary
- The previous reusable selected-chip shell was missing key Figma layers and the traveling spotlight was too subtle.
- Rebuilt the selected pill highlight stack to match the Figma node more closely using distinct internal layers:
  - `g-accent-orbit-fill`
    - top-left purple/blue sweep split into a separate blurred layer, anchored directly at `13% -10%`, `blur(5px)`, and brightened with stronger leading gradient stops
    - stronger blue accent now split into a separate blurred layer and anchored lower so it reads from the bottom-right edge
    - darker black-right base fill
  - `g-accent-orbit-left-spot`
    - large white/cool spotlight on the left
  - `g-accent-orbit-inner-glow`
    - accent-colored inner glow inside the capsule
  - `g-accent-orbit-ring`
    - white inset ring matching the Figma `Highlight` layer
  - `g-accent-orbit-middle`
    - brighter masked edge hotspot that travels clockwise around the container
- Kept the effect reusable by leaving color and timing controlled through:
  - `--g-accent-rgb`
  - `--g-accent-secondary-rgb`
  - `--g-accent-orbit-ms`
- Reused the same accent-shell treatment on the compose-field suggestion chips:
  - `renderComposeChipStack(...)` now mounts `renderAccentOrbitChrome()` inside each compose chip host
  - compose suggestion chips default their accent vars to white: `--g-accent-rgb: 255 255 255`, `--g-accent-secondary-rgb: 255 255 255`
  - the selected compose chip suppresses the old border/glass highlight so the reusable shell owns the highlighted state
  - a later compose-only retune softened the white shell, then nudged it slightly brighter again with:
    - `.g-accent-orbit-fill::before` opacity `0.70`
    - `.g-accent-orbit-fill::before` `filter: blur(10px)`
    - `.g-accent-orbit-fill::after` opacity `0.40`
    - a reduced compose-only inner glow and ring so the chip stays calmer than the disambiguation pill
- Later visual tuning thinned the highlighted pill edge by reducing the inset ring weight, easing back the inner glow, and softening the selected pill inset shadows so the border reads closer to the thinner reference treatment.
- A later pass increased the reusable inner-shadow alpha values by `0.1` so the selected pill depth reads more clearly without restoring the thicker edge look.

## Files changed
- `src/flows/ui-primitives.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- Figma MCP review:
  - node `288:6`
  - `Middle Highlight` node `288:21`
  - white left spotlight node `288:17`
  - inset ring node `288:35`
- `node --check src/flows/ui-primitives.js`
- `node --check src/flows/message-send-render.js`
- Browser validation via Playwright on `add-visual`:
  - triggered Hiro disambiguation
  - captured updated selected pill still to `/tmp/disambiguation-chip-pixel-pass-2.png`
  - verified the moving highlight is active by sampling `background-position` twice:
    - first sample: `37.3127% 10%`
    - later sample: `95% 64.6617%`
- Browser validation via Playwright after edge-thinning retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-thinner-edge.png`
  - confirmed slimmer edge treatment on the selected pill:
    - ring: `inset 0 0 3px 1px rgba(255,255,255,0.82)`
- Browser validation via Playwright after right-accent position retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-right-accent-bottom-right.png`
  - confirmed the static right-side blue radial now reads from the bottom-right instead of the mid-right edge
- Browser validation via Playwright after lower blurred right-accent retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-right-accent-lower-blur10.png`
  - confirmed the right accent now sits farther down and is softened with a `10px` blur
- Browser validation via Playwright after left-accent alignment retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-left-accent-shifted-level.png`
  - confirmed the top-left accent now sits farther left and lower, reading closer to the same horizontal line as the bottom-right accent
- Browser validation via Playwright after top-left blur retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-top-left-blur10.png`
  - confirmed the top-left accent is now rendered via a separate `::before` layer with `filter: blur(10px)`
- Browser validation via Playwright after top-left position nudge on `add-visual`:
  - captured `/tmp/disambiguation-chip-top-left-up.png`
  - confirmed the isolated top-left accent now resolves higher with `top: -5.59375px` while keeping `filter: blur(10px)`
- Browser validation via Playwright after exact top-left anchor retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-top-left-13-neg10.png`
  - confirmed the isolated top-left accent now resolves from `radial-gradient(58% 176% at 13% -10%, ...)`
- Browser validation via Playwright after top-left blur reduction on `add-visual`:
  - captured `/tmp/disambiguation-chip-top-left-blur5.png`
  - confirmed the isolated top-left accent now resolves with `filter: blur(5px)` while keeping the same `13% -10%` gradient anchor
- Browser validation via Playwright after top-left brightness retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-top-left-brighter.png`
  - confirmed the isolated top-left accent now resolves from `radial-gradient(58% 176% at 13% -10%, rgb(151, 97, 255) 0%, rgba(145, 172, 255, 0.98) 11%, rgba(151, 97, 255, 0.74) 22%, rgba(145, 172, 255, 0.22) 34%, rgba(145, 172, 255, 0) 48%)` with `filter: blur(5px)`
- Browser validation via Playwright after inner-shadow retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-inner-shadow-stronger.png`
  - confirmed slightly stronger inner depth on the live selected pill:
    - orbit glow: `rgba(151, 97, 255, 0.13) 0px 0px 24px 0px inset, rgba(145, 172, 255, 0.47) 0px -9px 20px 0px inset, rgba(145, 172, 255, 0.15) -7px 0px 12px 0px inset, rgba(151, 97, 255, 0.1) 7px 0px 13px 0px inset, rgba(255, 255, 255, 0.06) 0px 1px 9px 0px inset`
    - selected pill inset shadow: `rgba(255, 255, 255, 0.043) 0px 12px 18px 0px inset, rgba(0, 0, 0, 0.52) 0px -18px 24px 0px inset`
- Browser validation via Playwright after `+0.1` inner-shadow alpha retune on `add-visual`:
  - captured `/tmp/disambiguation-chip-inner-shadow-alpha-plus-point1.png`
  - confirmed updated live selected-pill inset values:
    - orbit glow: `rgba(151, 97, 255, 0.23) 0px 0px 24px 0px inset, rgba(145, 172, 255, 0.57) 0px -9px 20px 0px inset, rgba(145, 172, 255, 0.25) -7px 0px 12px 0px inset, rgba(151, 97, 255, 0.2) 7px 0px 13px 0px inset, rgba(255, 255, 255, 0.16) 0px 1px 9px 0px inset`
    - selected pill inset shadow: `rgba(255, 255, 255, 0.145) 0px 12px 18px 0px inset, rgba(0, 0, 0, 0.62) 0px -18px 24px 0px inset`
    - reduced inner glow intensity across `g-accent-orbit-inner-glow`
    - softer selected-pill inset shell shadow
- Browser validation via Playwright after compose-chip shell reuse on `add-visual`:
  - entered compose through the real flow, opened the suggestion-chip hold menu, and captured `/tmp/compose-chip-selected-white-accent.png`
  - confirmed the highlighted visible compose suggestion chip resolves with:
    - classes: `g-compose-chip g-accent-orbit-host is-visible selected`
    - `--g-accent-rgb: 255 255 255`
    - `--g-accent-secondary-rgb: 255 255 255`
    - `.g-accent-orbit` opacity: `1`
- Browser validation via Playwright after compose-chip brightness retune on `add-visual`:
  - captured `/tmp/compose-chip-selected-white-accent-brighter-again.png`
  - confirmed the current highlighted visible compose suggestion chip resolves with:
    - `.g-accent-orbit-fill::before` opacity: `0.7`
    - `.g-accent-orbit-fill::after` opacity: `0.4`
    - compose-only inner glow: `rgba(255, 255, 255, 0.12) 0px 0px 16px 0px inset, rgba(255, 255, 255, 0.22) 0px -7px 14px 0px inset, rgba(255, 255, 255, 0.08) -5px 0px 8px 0px inset, rgba(255, 255, 255, 0.07) 5px 0px 9px 0px inset, rgba(255, 255, 255, 0.06) 0px 1px 6px 0px inset`
    - compose-only ring: `rgba(255, 255, 255, 0.58) 0px 0px 2px 1px inset`
- Browser validation via Playwright after compose-chip top-left blur retune on `add-visual`:
  - captured `/tmp/compose-chip-top-left-blur10.png`
  - confirmed the highlighted visible compose suggestion chip now resolves with:
    - `.g-accent-orbit-fill::before` opacity: `0.7`
    - `.g-accent-orbit-fill::before` filter: `blur(10px)`

## Remaining issues / caveats
- Final sign-off still depends on your eye against the Figma target at presentation scale. If the edge still feels too heavy, the next safe tuning knob is the inset ring strength before changing the shell gradients.

## Recommended next step
1. Open the Hiro disambiguation state in `ai.html` on `add-visual`.
2. Compare the selected chip directly against Figma.
3. If it still needs tuning, only adjust the reusable `g-accent-orbit-*` layer stack in `src/styles/ai-glass.css`.

## Task title
Clip Selected Chip Highlight Inside Container

## Completion status
- Completed

## Summary
- Removed the external glow spill from the reusable disambiguation chip highlight.
- Root cause: the reusable orbit shell was still drawing visual energy outside the capsule through:
  - `.g-accent-orbit-halo` using `inset: -2px` plus blur
  - `.g-accent-orbit-ring` using outer box shadows
- Fixed in `src/styles/ai-glass.css` by:
  - setting `.g-accent-orbit` to `overflow: hidden`
  - moving the halo back to `inset: 0`
  - replacing the ring’s outer blue glows with inset-only lighting
- Result: the selected chip keeps the animated edge treatment, but no shadow or glow escapes outside the container bounds.

## Files changed
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/flows/message-send-render.js`
- Browser validation via Playwright on the `add-visual` worktree:
  - triggered the Hiro disambiguation state
  - captured `/tmp/disambiguation-chip-selected-add-visual-clipped.png`
  - confirmed computed styles:
    - `.g-accent-orbit { overflow: hidden; }`
    - `.g-accent-orbit-halo` inset resolved to `0px`
    - `.g-accent-orbit-ring` uses inset-only shadow values

## Remaining issues / caveats
- The moving highlight remains active, so normal live element screenshots still need `animations: 'disabled'` when captured headlessly.

## Recommended next step
1. Do a quick live visual pass in `ai.html`.
2. Confirm there is no light, blur, or shadow visible outside the selected chip capsule at rest or during the moving edge animation.

## Task title
Disambiguation Selected Chip Figma Highlight Rebuild

## Completion status
- Completed

## Summary
- Rebuilt the selected disambiguation name chip shell to match the Figma treatment more closely: darker capsule fill, bright edge stroke, blue/purple halo, and a moving edge highlight.
- Added a reusable accent-edge effect scaffold in `src/flows/ui-primitives.js`:
  - `renderAccentOrbitChrome()`
  - host class `g-accent-orbit-host`
  - customizable CSS vars:
    - `--g-accent-rgb`
    - `--g-accent-secondary-rgb`
    - `--g-accent-orbit-ms`
- Wired every disambiguation pill to mount that reusable chrome so the selected state can light up without a special one-off DOM path.
- Updated `src/styles/ai-glass.css` so the selected pill now uses:
  - Figma-style dark shell fill
  - reusable accent halo + ring layers
  - looping `g-accent-orbit-middle-loop` animation that moves the middle highlight clockwise around the pill edge
- The effect is now reusable for other containers by mounting `renderAccentOrbitChrome()` inside the container and setting the accent vars on the host.

## Files changed
- `src/flows/ui-primitives.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/flows/message-send-render.js`
- Browser validation via Playwright:
  - woke AI through `window.armAiWakeListening(...)`
  - triggered `Send message to Hiro`
  - waited through the message-flow thinking delay into disambiguation
  - verified `.g-disambiguation-pill.selected` rendered with the new shell classes
  - captured selected pill still to `/tmp/disambiguation-chip-selected.png`
- Observed that a normal element screenshot without disabled animations fails because the selected pill is continuously animating, which confirms the moving edge highlight is active.

## Remaining issues / caveats
- The repo’s existing `test/smoke.mjs` still fails before flow entry because the `ai-legacy-debug` toggle overlay intercepts the quick-chip click. That is unrelated to this selected-chip restyle.
- The reusable effect assumes the host container can contain the injected accent chrome as an absolutely positioned child and that its content sits above that layer.

## Recommended next step
1. Open the Hiro disambiguation state in `ai.html`.
2. Verify the selected chip matches the new shell in motion, especially the clockwise edge-travel highlight.
3. For any future container, mount `renderAccentOrbitChrome()` inside it and set `--g-accent-rgb` / `--g-accent-secondary-rgb` on the host to recolor the effect.

## Task title
Apply Figma Selected Pill Styling To Disambiguation Chip

## Completion status
- Completed

## Summary
- Implemented the selected disambiguation chip container styling from Figma node `288:6` in file `LTNbsRqNkyLeo81OSL1X7J`.
- Kept the existing disambiguation pill layout, avatar, text, and interactions unchanged; only the highlighted chip surface was restyled.
- Added a selected-only dark pill background, layered inset shell glow, and a left-biased purple/blue highlight overlay to match the Figma node’s visual treatment.
- Left the unselected pill styling as-is so only the highlighted contact gets the new design.

## Files changed
- `src/styles/ai-glass.css`

## Validation performed
- Figma MCP:
  - `get_design_context` on file `LTNbsRqNkyLeo81OSL1X7J`, node `288:6`
  - `get_screenshot` on file `LTNbsRqNkyLeo81OSL1X7J`, node `288:6`
- `git diff --check`
- Headless runtime validation on `http://127.0.0.1:5174/ai.html`
- Verified the live disambiguation state after `send message to hiro`:
  - selected pill had the new dark gradient background
  - selected pill had the new inset glow stack
  - selected `::after` highlight overlay was active
  - unselected pill background remained `rgba(255, 255, 255, 0.06)`

## Remaining issues / caveats
- Validation was done in headless Chromium plus Figma screenshot/context review. I did not do a manual fullscreen/device visual pass after the styling change.

## Recommended next step
1. Do a quick visual pass against the Figma screenshot at presentation scale and tune the purple-left highlight intensity if you want even tighter parity.

## Task title
Restore Confirm-Step Listening Orb Voice Reactivity

## Completion status
- Completed

## Summary
- Fixed the confirm-step mini listening orb so it reacts to command listening again.
- Root cause: confirm mode had diverged onto a separate simplified outer-glow path on `#siri-orb`, while disambiguation/listening mode uses the real reactive shell shadow values. The mic loop was still active, but the visible confirm orb was no longer using the same reactive layer, so it appeared static.
- Switched the confirm-await-orb command visualization back to the same `shadow(level)` path used by the listening/disambiguation orb, applied on the confirm orb’s `#home-glow-layer`.
- Kept `drop-main` shell shadow cleared in confirm so only the docked orb reacts.
- Later changed the deepest blue stop inside `shadow(level)` and `buttonShadow(level)` from the old bright blue family to `rgba(0,22,67,1)`, so confirm-step listening and the compose-field voice-viz pulse share the same darker base blue as the listening/magic shell.
- Aligned the confirm-step mini listening orb back to the same shell treatment used by the disambiguation/listening orb:
  - docked orb fill is transparent again, matching the disambiguation/listening orb shell
  - docked orb stroke uses the shared glass-shell gradient
  - docked orb inset lighting uses the same `inset 0 0 20px rgba(255,255,255,0.25)` family instead of the custom spherical treatment
  - shared listening orb geometry now resolves to `50px x 50px` with `25px` radius in both disambiguation and confirm

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send-render.js`
- `src/shapes.js`
- `src/shapes.legacy.js`
- `src/styles/ai-decorative.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/ai/voice-engine.js`
- Headless flow validation on `http://127.0.0.1:5174/ai.html`
- Verified real confirm state after `send message to hiro` -> select Hiro -> dictate message:
  - `state` reached `GS.CONFIRM`
  - `drop-main` had `confirm-await-orb listening-orb home-glow`
  - `sim-mic-label` remained `Listening…`
  - `#home-glow-layer` carried the reactive listening shadow values instead of staying blank
  - `#siri-orb` kept its stable base shell shadow
- Code-level validation after blue-token retune:
  - `node --check src/ai/voice-engine.js`
  - confirmed `shadow(level)` and `buttonShadow(level)` now end with `rgba(0,22,67,1)` instead of the previous brighter blue
- Browser validation after confirm-orb brightness retune on `add-visual`:
  - captured the disambiguation orb reference to `/tmp/disambiguation-orb-50.png`
  - reached confirm via the real message flow and captured `/tmp/confirm-orb-50.png`
  - confirmed the docked confirm orb now resolves with the same shell language as the disambiguation/listening orb:
    - fill: transparent
    - shell shadow: `rgba(255, 255, 255, 0.02) 0px 0px 40px 0px`
    - stroke: shared glass-shell gradient
    - inset lighting: `rgba(255, 255, 255, 0.25) 0px 0px 20px 0px inset`
    - deepest listening glow stop: `rgb(0, 22, 67) 0px -70px 60px -30px inset`
    - measured disambiguation orb size: `50px x 50px`
    - measured confirm orb size: `50px x 50px`

## Remaining issues / caveats
- Validation was done in headless Chromium, so I verified the confirm branch and live style targets but did not synthesize real microphone amplitude in-browser.

## Recommended next step
1. Do a quick manual confirm-step voice pass to confirm the mini orb now visibly reacts while saying `send`, `edit`, or `cancel`.

## Task title
Keep Expanded Long Chips Pinned To Shell During Insert

## Completion status
- Completed

## Summary
- Fixed the remaining double-container glitch on the expanded chip path, specifically `Need your input`.
- Root cause: after the hidden-text reveal began, the live compose field dropped its pending-height lock too early. At intermediate shell widths, `Need your input` temporarily rewrapped to a taller multi-line layout than the shell, so the inner field visibly outgrew the morphing container.
- The pending-height lock now stays on the compose field for the full chip-magic transition instead of being removed at the reveal point.
- The reveal still starts on time, but the field remains pinned to the shell and cropped until the chip-magic beat completes.

## Files changed
- `src/flows/message-send.js`

## Validation performed
- `node --check src/flows/message-send.js`
- Headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real expanded `Need your input` chip path
- Re-ran the full flow 3 times: wake with `L` -> `send message to hiro` -> choose default Hiro -> long-hold stage for expanded chip menu -> release on `Need your input`
- Sampled the transition at `0ms`, `40ms`, `80ms`, `120ms`, `180ms`, `260ms`, `400ms`, `600ms`, and `780ms`
- Confirmed field height matched shell height exactly at every sampled frame on all 3 runs, with the field background remaining transparent throughout the chip-magic beat

## Remaining issues / caveats
- Validation was done in headless Chromium. I did not do a manual fullscreen/device pass after this fix.

## Recommended next step
1. Do one manual fullscreen pass on `Need your input` and `Share a file` to confirm both long-chip variants now read as a single shell at presentation scale.

## Task title
Stabilize Long-Text Chip Insert Shell During Transition

## Completion status
- Completed

## Summary
- Fixed the remaining double-container glitch on long chip inserts such as `Share a file`.
- Root cause: during `composeChipMagicPending`, the live compose field was auto-sizing to the full multi-line text height while the outer shell was still morphing from the smaller `Speak your message...` geometry.
- Added a dedicated pending-field class so the live compose field stays locked to the current shell height while the inserted text is still hidden.
- Updated the compose-height measurement path to ignore that pending-only class, so the outer shell still animates toward the real final long-text height instead of measuring the temporary locked state.
- Removed the pending-field class at reveal time before the text magic animation starts.

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- Headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real `Share a file` chip path
- Re-ran the full flow 3 times: wake with `L` -> `send message to hiro` -> choose default Hiro -> long-press stage -> release on `Share a file`
- Verified the critical first half of the transition stayed aligned on every run:
  - at `0ms`, `40ms`, `80ms`, `120ms`, and `180ms`, compose field height matched shell height exactly
  - while the field/shell mismatch briefly reappears after the reveal starts, the field background remains transparent during that interval, so the second black container no longer renders
  - by `600ms`, shell and field were effectively aligned again at final long-text size

## Remaining issues / caveats
- Validation was done in headless Chromium. I did not do a manual fullscreen/device pass after this fix.
- There is still a small geometry delta right after the text reveal starts (`~5px` at around `260ms` on the sampled runs), but the field remains transparent during that moment, so it does not produce the visible double-container artifact.

## Recommended next step
1. Do one manual fullscreen pass on the `Share a file` chip to confirm the long-text insert now reads as a single shell at presentation scale.

## Task title
Standardize Animation Easing To `0.35, 0.23, 0.13, 0.98`

## Completion status
- Completed

## Summary
- Standardized the shared motion curve across both `ai.html` and `index.html` to `cubic-bezier(0.35, 0.23, 0.13, 0.98)`.
- Added a shared root token `--motion-ease` and made the generated animation style block emit that token instead of the old spring curve.
- Updated the shared morph/render path so shell geometry, content movement, and deformation fallback all use the same easing value.
- Replaced the remaining hardcoded AI and prototype/editor motion easings with the shared token, including shell transitions, orb transitions, chip motion, toast motion, sidebar controls, and mirrored editor motion styles.
- Kept the sidebar easing controls in place, but all presets now resolve to the same shared bezier so the motion system no longer diverges by preset.

## Files changed
- `ai.html`
- `index.html`
- `src/shared/anim-controls.js`
- `src/shared/morph-render.js`
- `src/shared/morph-bridges.js`
- `src/shared/list-demo.js`
- `src/ai/demo-controls.js`
- `src/ai/voice-engine.js`
- `src/styles/ai-layout.css`
- `src/styles/ai-drop.css`
- `src/styles/ai-decorative.css`
- `src/styles/ai-frame.css`
- `src/styles/ai-glass.css`
- `src/styles/ai-sidebar.css`
- `src/styles/ai-stage.css`
- `src/styles/editor-layout.css`
- `src/styles/editor-decorative.css`
- `src/styles/editor-sidebar.css`

## Validation performed
- `node --check src/shared/anim-controls.js`
- `node --check src/shared/morph-render.js`
- `node --check src/shared/morph-bridges.js`
- `node --check src/shared/list-demo.js`
- `node --check src/ai/demo-controls.js`
- `node --check src/ai/voice-engine.js`
- `git diff --check`
- Searched the AI and editor motion styles to confirm the old hardcoded easing values (`0.22,1,0.36,1`, `0.42,0,0.2,1`, `ease`, `ease-in-out`) were removed from the motion stack and replaced by `var(--motion-ease)`

## Remaining issues / caveats
- I did not run a fresh fullscreen/manual browser review after this motion sweep, so this is validated by syntax/diff checks and source audit rather than a new visual pass.
- The sidebar easing dropdown still shows legacy option labels like `Ease` and `Liquid feeling`, but those presets now resolve to the same shared curve.

## Recommended next step
1. Do one quick visual sweep of the AI message flow and prototype page to make sure the unified easing feels correct in motion at presentation scale.

## Task title
Stabilize Chip Insert Listening Orb Appearance

## Completion status
- Completed

## Summary
- Fixed the mini listening orb during chip insert so it no longer flashes through multiple visual looks.
- Root cause: the orb was borrowing `#home-glow-layer` as its fill while that same layer was also being animated for the chip shell pulse, and later the confirm voice visualization reused that layer again. That made the orb appear as a bright flat circle first, then shift to a different blue fill, then darken again.
- The mini orb now carries its own shell background and shell shadow using the same base values as the listening shell, so its fill is stable throughout the transition.
- The chip shell pulse no longer animates the docked orb glow layer, and confirm command-mode voice visualization now reacts on the orb’s own outer glow instead of recoloring the orb fill.

## Files changed
- `src/styles/ai-decorative.css`
- `src/ai/voice-engine.js`

## Validation performed
- `node --check src/ai/voice-engine.js`
- Headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real `Share a file` chip path
- Sampled the real chip-insert timeline at `60ms`, `180ms`, `360ms`, `720ms`, `880ms`, and `1040ms`
- Confirmed the orb styling stayed consistent across the transition:
  - orb background stayed `rgba(255, 255, 255, 0.05)`
  - orb box shadow stayed `0 0 40px rgba(255,255,255,0.02)`
  - the docked glow layer no longer changed to a separate bright pulse behind the orb
- Saved and inspected a headless screenshot showing a single consistent orb treatment during the chip-insert beat

## Remaining issues / caveats
- Validation was done in headless Chromium. I did not do a manual fullscreen/device pass after this fix.

## Recommended next step
1. Recheck the chip-insert transition in the fullscreen review setup to confirm the orb no longer flashes through multiple looks at presentation scale.

## Task title
Restore Chip Insert Shell Blink While Orb Is Docked

## Completion status
- Completed

## Summary
- Restored the visible blue blink/glow on the compose field after a chip is selected.
- Root cause: during chip insert, `confirm-await-orb` is active immediately, which relocates `#home-glow-layer` down to the mini listening orb. The old chip-magic animation was still targeting that layer, so the orb glowed but the compose shell no longer did.
- The chip-magic glow on `#home-glow-layer` is now aligned to `800ms`, and the compose shell itself now gets a dedicated `::after` inset-pulse animation during `compose-chip-magic`.

## Files changed
- `src/styles/ai-drop.css`

## Validation performed
- Headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real `Share a file` chip path
- Confirmed `drop-main` had `compose-chip-magic` active during the chip insert beat
- Confirmed the compose shell `::after` pseudo-element was animating a strong inset blue/white pulse while the orb glow animation was also active
- Saved and inspected a headless screenshot showing the compose shell visibly blue during the chip-insert blink

## Remaining issues / caveats
- Validation was done in headless Chromium. I did not do a manual fullscreen/device pass after this fix.

## Recommended next step
1. Recheck one real chip flow in the fullscreen review setup to confirm the restored compose-field blink reads correctly at presentation scale.

## Task title
Stretch Chip Shell Morph And Orb Entry To 800ms

## Completion status
- Completed

## Summary
- Updated the chip-hit transition so both the compose shell morph and the listening orb appearance now take `800ms`.
- The chip transition clock in the message flow is now `800ms`, the chip-specific shell geometry transition is `800ms`, and the chip-specific confirm-await orb entry transition is also `800ms`.

## Files changed
- `src/flows/message-send.js`
- `src/styles/ai-decorative.css`

## Validation performed
- `node --check src/flows/message-send.js`
- Headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real `Share a file` chip path
- Confirmed the shell and orb are still mid-transition well past the halfway point:
  - `t=120ms`: shell about `368x104`, orb opacity about `0.10`
  - `t=240ms`: shell about `400x108`, orb opacity about `0.35`
  - `t=400ms`: shell about `416x110`, orb opacity about `0.74`
  - `t=620ms`: shell about `420x111`, orb opacity about `0.95`
  - `t=780ms`: shell settled near `420x111`, orb opacity about `1.00`

## Remaining issues / caveats
- Validation was done in headless Chromium. I did not do a manual fullscreen/device pass after this timing update.

## Recommended next step
1. Recheck one real chip flow in the fullscreen review setup to confirm the `800ms` shell/orb beat feels right at presentation scale.

## Task title
Restore Smooth Placeholder-To-Chip Shell Morph

## Completion status
- Completed

## Summary
- Fixed the chip-insert transition so the compose shell now grows from the small `Speak your message...` placeholder state instead of visually jumping into the larger chip-filled state.
- Root cause: the chip-insert path had regressed to a normal text-active compose layout. During `composeChipMagicPending`, the render logic was no longer using the confirm-await orb geometry, and `syncDropMainOrbClasses()` was stripping the orb/lift classes back off after the morph call.
- The compose geometry now treats chip-magic pending as the same lifted/orb-aware layout used by the confirm-await beat, and the orb-class sync keeps `confirm-await-orb`, `listening-orb`, and `home-glow` active throughout the chip-insert morph.
- The `compose-chip-magic` shell class is now applied on the same synchronous beat as the chip insert instead of one frame later, so the outer shell is the only visible container from the first frame of the transition.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- Repeated headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real `Share a file` chip path
- Confirmed `Share a file` was the selected chip before release
- Across 3 repeated runs, first-frame chip-insert geometry stayed at the small placeholder shell size and then smoothly expanded:
  - `t=0ms`: shell about `307x96`
  - `t=30ms`: shell about `338x100`
  - `t=60ms`: shell about `381x106`
  - `t=120ms`: shell about `413x110`
  - `t=240ms`: shell about `420x111`
- Confirmed the lift/orb path now starts on the same beat:
  - `confirm-await-orb`, `listening-orb`, and `home-glow` classes were present from `t=0ms`
  - orb opacity rose from `0` to about `0.62` by `240ms` and about `0.96` by `420ms`
- Saved and inspected a headless screenshot on the real `Share a file` path showing the shell still small while growing, with the orb already entering below it

## Remaining issues / caveats
- Validation was done in headless Chromium and with saved screenshots. I did not do a manual fullscreen/device pass after this patch.

## Recommended next step
1. Recheck `Share a file` once in the fullscreen review setup to confirm the small-shell-to-large-shell morph feels correct at presentation scale.

## Task title
Pre-Expand Long Chip Insert Geometry Before Magic Pulse

## Completion status
- Completed

## Summary
- Fixed the remaining long-chip transition glitch on `Share a file`.
- Root cause: the inserted long sentence made the compose field reflow to its final multi-line size immediately, but the outer shell was still animating from the short empty-compose geometry. That created a brief oversized inner field during the chip-magic beat.
- The compose render path now snaps shell geometry with transitions disabled whenever chip-magic pending content is being inserted, so the container is already at the final long-message size before the glow/text sequence starts.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- Repeated headless runtime validation on `http://127.0.0.1:5174/ai.html` using the real `Share a file` chip path
- Before fix, first-frame chip-magic geometry was approximately:
  - shell: `307x97`
  - field: `420x143`
- After fix, first-frame chip-magic geometry is approximately:
  - shell: `420x112`
  - field: `420x112`
- Confirmed the fixed geometry holds through the chip-magic timeline and into confirm

## Remaining issues / caveats
- Validation was repeated in headless Chromium and with saved screenshots. I did not do a manual headset/fullscreen check after this pass.

## Recommended next step
1. Recheck the `Share a file` chip once in the exact fullscreen review setup to confirm the long-string transition now reads cleanly end-to-end.

## Task title
Remove Duplicate Shell During Chip-Select Transition

## Completion status
- Completed

## Summary
- Fixed the first-run chip-selection glitch where the outgoing disambiguation layer could stay mounted while the compose chip menu was being updated in place.
- Added a guard so the compose-menu UI-only update path falls back to a full re-render whenever the disambiguation-to-compose handoff is still active or multiple glass-body layers are present.
- Removed the inner compose field fill during the chip magic pulse so the outer shell remains the only visible container during the blue transition.
- Added a separate delayed chip-select orb/lift path in `message-send.js` / `message-send-render.js`:
  - compose-chip text/magic state still starts immediately on selection
  - the listening orb and compose-field upward shift now wait `300ms` before activating

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`
- Headless runtime validation on `http://127.0.0.1:5174/ai.html`
- Fast first-run chip selection path:
  - during chip-menu hold, `#c-rich [data-glass-body]` count stayed at `1`
  - outgoing disambiguation layer was absent
  - during chip magic, compose field background resolved to `rgba(0, 0, 0, 0)` with no box shadow
- Later timing retune:
  - chip-select orb/lift delay reduced from `400ms` to `300ms`
- Settled chip selection path:
  - same single-layer result
  - same transparent inner field during chip magic

## Remaining issues / caveats
- Validation was done in headless Chromium against the real page flow. I did not do a manual visual pass on-device after this patch.

## Recommended next step
1. Recheck the chip-select transition in the full-screen stage view to confirm the duplicate-shell artifact is gone in the exact presentation mode used for review.

## Task title
Center Message Sent Toast Vertically In Message Flow

## Completion status
- Completed

## Summary
- Fixed the message-flow sent toast so the row is vertically centered inside the sent pill instead of sitting slightly low.
- Removed the message-flow-only upward translate on the sent state and centered the message-flow `glass-sent` layout directly in CSS.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`

## Validation performed
- `node --check src/flows/message-send-render.js`
- Headless runtime measurement on `http://127.0.0.1:5174/ai.html` in the sent state:
  - toast center offset from pill center: about `-0.008px`
  - text center offset from pill center: about `0.036px`

## Remaining issues / caveats
- This alignment fix is scoped to the message flow sent state only.

## Recommended next step
1. If needed, review coffee/flight success toasts separately; they still keep their own previous sent positioning.

## Task title
Mute Thinking And Sending AI Speech

## Completion status
- Completed

## Summary
- Stopped the message flow from announcing AI copy during `GS.THINKING` and `GS.SENDING`.
- Kept the interim text available for the orb label by still updating `flow.aiVoice`, but suppressed the sim voice/TTS path for those states.

## Files changed
- `src/flows/message-send.js`

## Validation performed
- `node --check src/flows/message-send.js`
- Headless runtime check on `http://127.0.0.1:5174/ai.html` after starting the message flow:
  - `glassState === "1"` (`GS.THINKING`)
  - sim voice output not visible
  - sim voice text empty
  - orb label still showed `Searching contact...`

## Remaining issues / caveats
- This change is scoped to the message flow only.

## Recommended next step
1. If you want the same behavior in other flows, apply the same silent-announce pattern there instead of changing global TTS behavior.

## Task title
Sending Stage Holds For 1s With Label Above Orb

## Completion status
- Completed

## Summary
- Kept the confirm -> magic transition at `600ms`, then added a separate `1000ms` pure sending/magic hold before the final sent toast.
- Added a dedicated `sending...` status label for `GS.SENDING`, positioned above the orb instead of using the generic centered loading row.
- Restored the `sentTransitionActive` cutoff timer so the confirm overlay drops away after `600ms` while the shell remains in the real magic state.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai-glass.css`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/ui-primitives.js`
- Headless runtime check on `http://127.0.0.1:5174/ai.html` through the real send-message flow:
  - `320ms`: `magic`, confirm-exit overlay still active, `sending...` present
  - `700ms`: `magic`, confirm-exit overlay gone, `sending...` still present
  - `1450ms`: still `magic` with `sending...`
  - `1750ms`: final `pill` sent toast visible, `sending...` removed

## Remaining issues / caveats
- Validation was done in headless Chromium only.

## Recommended next step
1. Manual visual pass if you want to tune the vertical offset of the `sending...` label relative to the orb.

## Task title
Confirm To Thinking Duration Reduced To 600ms

## Completion status
- Completed

## Summary
- Reduced the confirm -> thinking/send handoff from `1000ms` to `600ms`.
- Kept the timing aligned across the flow timer, the `card-form -> magic` morph bridge, and the confirm-exit CSS so the shell and fading confirm content still resolve together.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/shared/morph-bridges.js`
- `src/styles/ai-glass.css`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/shared/morph-bridges.js`
- Headless runtime check on `http://127.0.0.1:5174/ai.html` through the real send-message flow:
  - `80ms`, `320ms`, and `560ms` after `send`: still in `magic` / `GS.SENDING`
  - `760ms` after `send`: already in `pill` / `GS.SENT` with the sent toast visible

## Remaining issues / caveats
- Validation was done in headless Chromium only.

## Recommended next step
1. Manual visual pass if you want to tune the split between the `magic` hold and the final toast further.

## Task title
Confirm To Send Uses Real Thinking Stage Before Toast

## Completion status
- Completed

## Summary
- Changed the confirm -> send handoff so it no longer forces a sent-pill shell during the transition window.
- The send flow now stays in the real `GS.SENDING` / `magic` stage for the full `1000ms` beat, with the loading state rendered underneath the fading confirm overlay.
- The flow only switches to `GS.SENT` after that beat completes, so the final `Message sent` toast becomes a second phase instead of replacing a fake blue sent shell mid-transition.
- Removed the confirm-await orb/sent-shell override during the sending beat so the transition uses the normal thinking-stage styling instead of the previous over-blue intermediate shell.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/shared/morph-bridges.js`
- `src/styles/ai-glass.css`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/shared/morph-bridges.js`
- Headless runtime check on `http://127.0.0.1:5174/ai.html` through the real send-message flow:
  - `80ms`, `520ms`, and `920ms` after `send`: `currentShape === "magic"`, `state === "5"` (`GS.SENDING`), loading UI present, no sent toast present
  - `1200ms` after `send`: `currentShape === "pill"`, `state === "6"` (`GS.SENT`), single settled sent toast visible

## Remaining issues / caveats
- Validation was done in headless Chromium. Live mic-driven orb behavior was not exercised in this pass.

## Recommended next step
1. Manual visual pass on-device to confirm the `magic -> sent toast` handoff feels right with real voice input timing.

## Task title
Confirm To Send Text Freeze And Fast Fade

## Completion status
- Completed

## Summary
- Adjusted the confirm-to-send text exit so the message no longer rewraps while the container shrinks.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) to inject a frozen confirm-text width for the transition layer using the pre-shrink compose width.
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) so the transition text block keeps that fixed width, gets cropped by the shrinking field, and fades out over the first `400ms` of the `1000ms` send transition instead of staying visible long enough to reflow.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- Headless Playwright run on `http://127.0.0.1:5174/ai.html` through the real message send path.
- Measured transition values after `send`:
  - `80ms`: text width `392px`, field width about `398.6px`, text opacity about `0.235`
  - `260ms`: text width `392px`, field width about `287.1px`, text opacity about `0.0017`
  - `520ms`: text width `392px`, field width about `217.4px`, text opacity `0`
- Visual frame review of `/tmp/genui-send-t080.png`, `/tmp/genui-send-t260.png`, `/tmp/genui-send-t520.png` confirmed the text is cropped by the shrinking field rather than reflowing into new line breaks.

## Remaining issues / caveats
- None for this specific text-exit behavior.

## Recommended next step
1. Check one manual send in `ai.html`.
2. If needed, tune only the fade timing, not the text layout behavior.

## Task title
Confirm To Send Transition Fix On Real Sending Path

## Completion status
- Completed

## Summary
- Corrected the message send handoff so the animation starts on `CONFIRM -> SENDING`, not only after `SENT`, which was the real reason the contact header and orb appeared to jump away.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) to treat `SENDING` and `SENT` as one shared confirm-to-send transition window while `flow.sentTransitionActive` is true.
- During that window, the outer shell now morphs immediately to the sent pill while the confirm layer stays mounted, so the contact header can fade/float down, the orb can fade out, and the compose text can remain visible inside the shrinking field.
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) so:
  - the contact header exits downward with opacity fade
  - the compose text stays visible until late in the transition
  - the inner blue field glow ramps in progressively instead of appearing in one frame
  - the sent toast only takes over after the transition has substantially finished
- Updated [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) so the confirm orb now fades/scales out in place instead of lifting away.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`
- `src/styles/ai-decorative.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/shared/morph-bridges.js`
- Headless Playwright run on `http://127.0.0.1:5174/ai.html` through the real message path:
  - wake via `window.armAiWakeListening({ source: "keyboard-l" })`
  - start flow with `send message to hiro`
  - disambiguate with `Tanaka`
  - compose `Hey, do you have time for a design review sometime?`
  - issue `send`
- Captured transition frames at `80ms`, `260ms`, `520ms`, and `920ms` after `send`:
  - `80ms`: shape already `pill`, header opacity about `0.60`, orb opacity about `0.60`, text opacity `1`, blue inset shadow already partially ramped in
  - `260ms`: header opacity about `0.15`, orb opacity about `0.15`, text opacity still `1`, blue inset shadow stronger
  - `520ms`: header effectively gone, text still visible inside the shrinking field, blue inset glow near full
  - `920ms`: toast visible as `Message sent`, orb gone
- Visual frame review of `/tmp/genui-send-before.png`, `/tmp/genui-send-t080.png`, `/tmp/genui-send-t260.png`, `/tmp/genui-send-t520.png`, `/tmp/genui-send-t920.png`

## Remaining issues / caveats
- This validation used the real browser flow and screenshots, but it still does not synthesize live microphone amplitude during the confirm orb fade. The orb fade itself is verified; live-volume behavior still needs an on-device mic glance if that matters.

## Recommended next step
1. Run one manual send in `ai.html`.
2. Check whether you want the text to hold even longer before fading, now that the jump itself is gone.

## Task title
Confirm To Sent Transition Smoothing

## Completion status
- Completed

## Summary
- Smoothed the message flow handoff from confirm to the sent toast by giving the shell morph, confirm content exit, sent toast entry, and confirm orb fade a shared `1000ms` transition window.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) to track a dedicated confirm-to-sent transition state for `1000ms` before dropping the confirm orb classes.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so the sent state can temporarily render both layers at once: the confirm card exits while the sent toast enters, instead of replacing the DOM in one frame.
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) with `1000ms` confirm-header, confirm-field, and sent-toast animations.
- Updated [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) so the confirm listening orb and glow animate out over the same `1000ms` window.
- Updated [morph-bridges.js](/Users/ariax/Documents/GitHub/GenUI/src/shared/morph-bridges.js) so the confirm card-form to sent pill shell morph also uses `1000ms` during this specific message-flow handoff.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`
- `src/styles/ai-decorative.css`
- `src/shared/morph-bridges.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/shared/morph-bridges.js`
- Source verification:
  - confirm-to-sent transition constant set to `1000ms`
  - confirm header, field, toast, orb, and glow all use `1000ms` transition/animation rules
  - confirm-to-sent shell morph override set to `1000ms`

## Remaining issues / caveats
- I attempted a headless end-to-end browser check on `ai.html`, but the side-panel input path did not reliably advance into the auto-confirm/send path in that environment, so this change was validated by syntax checks plus direct source verification rather than a full recorded browser send sequence.

## Recommended next step
1. Run the real confirm -> sent flow on-device.
2. Verify the contact header, compose field, orb, and shell all hand off together over about one second with no visible pop.

## Task title
Confirm Orb Inner Highlight Blur Reduction

## Completion status
- Completed

## Summary
- Reduced the confirm-stage mini listening orb’s inner inset highlight blur by `10px`.
- Updated [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) so the confirm-specific `#siri-orb::after` inset shadow now uses `10px` blur instead of `20px`, tightening the inner glow without changing the rest of the copied disambiguation-shell treatment.

## Files changed
- `src/styles/ai-decorative.css`
- `context/HANDOFF.md`

## Validation performed
- Source verification:
  - confirmed [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) now sets `box-shadow: inset 0 0 10px rgba(255,255,255,0.25)` for the confirm-stage mini orb highlight

## Remaining issues / caveats
- This was a targeted visual adjustment only. I did not rerun a live browser flow for this single-value change.

## Recommended next step
1. Check the confirm stage visually.
2. Verify the mini orb’s center highlight feels tighter and less washed out.

## Task title
Confirm Orb Exact Disambiguation Shell Match

## Completion status
- Completed

## Summary
- Removed the remaining confirm-only orb substitute styling that was causing the mini orb to read like a dark disk instead of the disambiguation orb.
- Updated [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) so the confirm mini orb now reuses the same shell recipe as the disambiguation orb: transparent orb body, the exact shell stroke gradient, and the same inset shell highlight copied from the base `.drop` treatment.
- Kept the confirm glow on [voice-engine.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js) aligned with the same blue listening-family shadow path instead of introducing a separate confirm-only tint.

## Files changed
- `src/styles/ai-decorative.css`
- `src/ai/voice-engine.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/ai/voice-engine.js`
- Headless browser screenshot comparison in `ai.html`:
  - captured the disambiguation orb as the reference baseline
  - captured the confirm-stage orb after the exact shell-layer copy
  - verified the confirm orb no longer renders as a black/dark disk and now matches the same blue glass orb family as disambiguation

## Remaining issues / caveats
- The headless check verifies the settled confirm render path and the copied shell values. It does not synthesize real microphone amplitude, so live-volume response still needs an on-device mic check.

## Recommended next step
1. Check the confirm stage on-device while command listening is active.
2. Verify the mini orb stays visually aligned with the disambiguation orb while the outer glow reacts to voice volume.

## Task title
Prototype Background Toggle Restore

## Completion status
- Completed

## Summary
- Fixed the prototype-mode startup crash that prevented sidebar bindings from registering, which is why the `Background image` toggle appeared to do nothing.
- Updated [manual-demo.js](/Users/ariax/Documents/GitHub/GenUI/src/tool/modules/manual-demo.js) to import `selectListItem` from the shared list-demo module before returning it from `initManualDemo()`.
- With that runtime error removed, the existing prototype canvas-setting bindings now run correctly again, so toggling `Background image` updates `canvasSettings.backgroundEnabled`, persists the setting, and applies `body.bg-off` as intended.

## Files changed
- `src/tool/modules/manual-demo.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/tool/modules/manual-demo.js`
- Headless browser check on `index.html`:
  - verified no page-load `ReferenceError`
  - toggled `#bg-toggle`
  - confirmed `body` class changed to include/exclude `bg-off`
  - confirmed `.bg-blur-image` opacity changed with the toggle
  - confirmed `genui.settings.v1` persisted `backgroundEnabled`

## Remaining issues / caveats
- Existing stored settings still override the new default-off behavior on subsequent loads, by design.

## Recommended next step
1. Toggle `Background image` on and off in prototype mode.
2. Verify the blurred background visibly hides/shows and the setting persists across refresh.

## Task title
Background Image Default Off

## Completion status
- Completed

## Summary
- Changed the global canvas-settings default so the stage background image is off unless it has been explicitly enabled and persisted by the user.
- Updated [app-state.js](/Users/ariax/Documents/GitHub/GenUI/src/app-state.js) so `loadCanvasSettings()` now defaults `backgroundEnabled` to `false` on a fresh load.
- Removed the static `checked` attribute from the `Background image` toggle in [ai.html](/Users/ariax/Documents/GitHub/GenUI/ai.html) and [index.html](/Users/ariax/Documents/GitHub/GenUI/index.html) so the initial checkbox markup matches the runtime default.

## Files changed
- `src/app-state.js`
- `ai.html`
- `index.html`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/app-state.js`
- Source verification:
  - `bg-toggle` is no longer statically checked in `ai.html`
  - `bg-toggle` is no longer statically checked in `index.html`

## Remaining issues / caveats
- Existing localStorage settings still win. If this browser already has `genui.settings.v1.backgroundEnabled: true`, the toggle will still come up enabled until that stored setting is changed or cleared.

## Recommended next step
1. Load the page in a fresh browser profile or clear `genui.settings.v1`.
2. Verify the background image starts off and the toggle appears unchecked on first load.

## Task title
Confirm Stage Orb Outside Recolor And Downsize

## Completion status
- Completed

## Summary
- Kept the real listening orb in confirm mode, but moved it fully outside the compose card again and reduced it from `52px` to `44px` so it reads like the reference rather than a second container element.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so confirm mode lifts the compose card by a smaller `60px` offset (`44px` orb + `16px` gap), leaving the orb below the card while still inside the overall stage bounds.
- Updated [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) so the confirm orb and glow dock below the shell at the smaller size and the confirm-specific glow layer uses a soft outer aura instead of the large shell’s inset blue-white fill.
- Updated [voice-engine.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js) so confirm mode no longer stacks both the glow-layer shadow and the orb shadow at once; confirm now drives the live command-volume response through the orb itself, which keeps the orb color much closer to the listening reference.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai-decorative.css`
- `src/ai/voice-engine.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/ai/voice-engine.js`
- Headless Playwright UI check on `ai.html` using the real message flow path:
  - woke listening
  - started `Send message to Hiro`
  - selected Hiro
  - typed `Hello there`
  - waited for confirm to settle
  - verified `#drop-main` carried `confirm-await-orb listening-orb home-glow`
  - verified the compose card stayed above the orb
  - verified the orb settled outside the card with a positive gap
  - verified the orb measured about `44px x 44px`

## Remaining issues / caveats
- The headless pass verifies geometry and styling hooks. It does not synthesize real microphone amplitude, so the confirm orb’s live volume response is validated by sharing the same orb-driven visualization path rather than by fake audio input.

## Recommended next step
1. Check confirm mode on-device with normal room noise and a spoken follow-up command.
2. Verify the orb now reads darker/bluer like the listening reference and no longer looks like a pale container badge.

## Task title
Confirm Stage Real Listening Orb Dock

## Completion status
- Completed

## Summary
- Replaced the fake confirm-stage orb badge with the real listening-orb surface used by the disambiguation stage.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so confirm mode now reserves an internal orb dock in the shell, removes the fake `.g-confirm-await-orb` markup, and keeps `#drop-main` synchronized with `confirm-await-orb`, `listening-orb`, and `home-glow` classes even through the post-render geometry settle pass.
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) so confirm mode shortens the field wrap by `96px`, leaving room for the orb inside the confirm shell.
- Updated [ai-decorative.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-decorative.css) so the real `#siri-orb` and `#home-glow-layer` dock at the bottom-center of confirm mode as a `64px` orb, matching the disambiguation orb size and glass treatment.
- Updated [voice-engine.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js) so command-mode voice visualization now targets the docked confirm orb using the same live shadow/glow path as disambiguation instead of trying to pulse confirm buttons.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`
- `src/styles/ai-decorative.css`
- `src/ai/voice-engine.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/ai/voice-engine.js`
- Headless Playwright UI check on `ai.html` using the real message flow path:
  - woke listening
  - started `Send message to Hiro`
  - selected the default Hiro contact
  - typed `Hello there`
  - waited for confirm to fully settle
  - verified `#drop-main` carried `confirm-await-orb listening-orb home-glow`
  - verified the fake confirm orb markup was gone
  - verified the confirm shell settled at `190px` height
  - verified the real orb settled at about `64.26px x 64.26px`
  - verified the orb sat inside the confirm shell below the field with a positive gap of about `13.25px`

## Remaining issues / caveats
- The headless pass verified the real orb dock, size, and settled geometry. It did not simulate real microphone amplitude, so the exact live volume response was verified by wiring confirm to the same voice-visualization path as disambiguation rather than by synthetic audio input.

## Recommended next step
1. Speak a confirm-stage command on-device.
2. Verify the orb responds to live mic volume exactly like disambiguation while staying docked inside the confirm shell.

## Task title
Confirm Stage Mini Listening Orb

## Completion status
- Completed

## Summary
- Added a mini listening-style orb to the confirm stage to indicate the system is waiting for the user’s next command.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so confirm mode renders a dedicated `.g-confirm-await-orb` below the compose field.
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) with a `32px` orb treatment that matches the listening orb language at `0.4x` scale, including a short entry animation and a subtle ambient breathe.
- Kept the confirm shell at its stable compose height and positioned the mini orb just below the shell with `overflow: visible`, which proved more reliable than trying to grow the confirm shell itself.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- Headless Playwright UI check on `ai.html` using the real message flow path:
  - woke the listening orb
  - started `Send message to Hiro`
  - selected the default Hiro contact
  - typed `Hello there` and waited for auto-confirm
  - verified the confirm-stage mini orb rendered at about `32.15px x 32.15px`
  - verified the orb sat below the compose field with a positive measured gap of about `13.21px`

## Remaining issues / caveats
- The confirm shell itself does not currently grow to contain the orb; the orb is intentionally rendered just below the shell instead. This matches the requested visual while avoiding overlap.

## Recommended next step
1. Check the confirm stage with a longer wrapped message.
2. Verify the mini orb still reads clearly below the field on-device and does not compete with any future confirm controls.

## Task title
Thinking Orb Inner Spinner Removal

## Completion status
- Completed

## Summary
- Removed the rotating inner spinner from the thinking/loading visual.
- Updated [ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js) so `renderCompactStatus({ type: "loading" })` now renders only the loading text/dots and no spinner element.
- Removed the unused `.g-spinner` style and `spin` keyframes from [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css).

## Files changed
- `src/flows/ui-primitives.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- Searched source for removed spinner hooks:
  - no remaining `g-spinner`
  - no remaining `@keyframes spin`

## Remaining issues / caveats
- I did not run a fresh browser pass after removing the spinner, but the loading primitive no longer emits any rotating element.

## Recommended next step
1. Trigger a listening -> thinking transition.
2. Verify the orb/loading state now shows only the orb plus loading text, with no rotating inner spinner.

## Task title
Listening To Thinking Orb Bridge Fix

## Completion status
- Completed

## Summary
- Fixed the listening -> thinking handoff so it no longer jumps straight into the magic visual.
- Updated [morph.js](/Users/ariax/Documents/GitHub/GenUI/src/shared/morph.js) so `circle/listening -> magic/ai/idle` now routes through the home-to-thinking bridge instead of going directly through `morphCore`.
- Updated [morph-bridges.js](/Users/ariax/Documents/GitHub/GenUI/src/shared/morph-bridges.js) so the bridge can carry real target content/geometry and, for `magic`, hold the listening orb briefly before handing off into the thinking shell.
- Updated [morph-render.js](/Users/ariax/Documents/GitHub/GenUI/src/shared/morph-render.js) so home-like shapes (`circle`, `listening`) and thinking-like shapes (`magic`, `ai`) use the softer motion profile.

## Files changed
- `src/shared/morph.js`
- `src/shared/morph-bridges.js`
- `src/shared/morph-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/shared/morph-bridges.js`
- `node --check src/shared/morph.js`
- `node --check src/shared/morph-render.js`
- Headless Playwright UI check on `ai.html` using the real wake -> quick chip -> message flow path:
  - before fix: at `120ms` after request start, shape was already `magic` and orb opacity had dropped to `0`
  - after fix: at `120ms`, shape remained `listening` with orb opacity ~`1`
  - at `360ms`, shape had transitioned into `magic` while orb opacity was still mid-fade (~`0.42`), confirming a continuous handoff instead of an instant switch

## Remaining issues / caveats
- Validation was targeted to the listening -> message thinking path. Other thinking entries should now use the same bridge route, but I did not run separate UI passes for every flow.

## Recommended next step
1. Trigger a fresh request from the listening orb.
2. Verify the orb lingers briefly and fades into the thinking shell instead of snapping directly to the magic state.
3. Spot-check flight and coffee request starts, since they share the same listening/circle -> thinking bridge path.

## Task title
Fresh Compose Chip First-Run Double Layer Fix

## Completion status
- Completed

## Summary
- Fixed the first-run message-compose glitch where selecting a prompted chip during the initial disambiguation-to-compose handoff could leave an extra outgoing layer active and produce a duplicate-container look.
- Root cause: fresh compose entry temporarily rendered the outgoing disambiguation stage alongside the compose stage, and that overlay was still allowed even after chip interaction or compose text started.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so the outgoing disambiguation layer is now shown only while compose is still passive and empty.
- As soon as compose text exists, chip magic is pending, or the chip menu is being held/opened/closed, the renderer falls back to a single compose stage.

## Files changed
- `src/flows/message-send-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after tightening the fresh-entry overlay gate.

## Recommended next step
1. Start a brand-new message flow.
2. Immediately choose `Share a file` or `Design review`.
3. Verify the chip magic now stays on a single compose shell even on the first selection of a fresh flow.

## Task title
Disambiguation To Compose Inner Timing Retune

## Completion status
- Completed

## Summary
- Retimed the inner disambiguation-to-compose animations in [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css).
- Increased disambiguation pill exit duration from `400ms` to `600ms`.
- Increased compose header enter duration from `300ms` to `600ms` and moved its delay from `200ms` to `400ms`.
- Moved the empty compose placeholder enter delay from `100ms` to `400ms`.

## Files changed
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- CSS timing values updated in source

## Remaining issues / caveats
- No live browser verification was run after retiming the inner transition elements.

## Recommended next step
1. Trigger the Hiro disambiguation flow.
2. Verify the pills linger longer on exit and the compose header/placeholder enter later.
3. Confirm the slower overlap still feels clean inside the existing `1000ms` handoff window.

## Task title
Chip Magic Text Reveal Width Sync Fix

## Completion status
- Completed

## Summary
- Fixed the prompted-chip magic case where the inserted sentence became visible before the compose shell had widened enough to contain it.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) so chip commit now enters a short pending phase:
  - the target sentence is rendered immediately for sizing
  - the text stays hidden for the first `260ms`
  - the shell glow starts right away
  - the text then reveals with the existing magic animation after the shell has had time to expand
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) and [ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js) to pass through a `magicPending` render state for the compose field text.
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) with a hidden pending-text class so layout still measures against the real sentence while the early reveal is suppressed.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/ui-primitives.js`

## Remaining issues / caveats
- No live browser verification was run after delaying the text reveal.

## Recommended next step
1. Commit a prompted chip with a longer sentence.
2. Verify the shell widens first, then the text reveals inside bounds.
3. Verify the magic glow timing still feels correct and the flow still auto-advances to confirm.

## Task title
Chip Magic Slower + Stronger Glow

## Completion status
- Completed

## Summary
- Slowed the prompted-chip magic beat slightly so the one-shot insert effect has more time to read before confirm.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) to increase `COMPOSE_CHIP_MAGIC_MS` from `760ms` to `920ms`.
- Strengthened the peak shell glow in [ai-drop.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-drop.css) by increasing the inset blue/white highlight intensity and spread during the pulse.
- Kept the effect on the outer shell glow layer, so this retime does not reintroduce the duplicate-container glitch.

## Files changed
- `src/flows/message-send.js`
- `src/styles/ai-drop.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after retiming and strengthening the chip magic glow.

## Recommended next step
1. Commit a prompted chip in the message flow.
2. Verify the shell glow lingers a bit longer and reads more clearly.
3. Verify the effect still stays on a single shell with no duplicate-container artifact.

## Task title
Chip Magic Duplicate Container Fix

## Completion status
- Completed

## Summary
- Fixed the duplicate-container glitch during the prompted-chip magic effect.
- Root cause: the one-shot glow was being applied to the inner compose field, which rendered like a second glowing pill inside the outer compose shell.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) so chip insertion now triggers the one-shot magic class on `#drop-main` instead of the inner field.
- Updated [ai-drop.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-drop.css) with a shell-level `#home-glow-layer` animation for that one-shot pulse.
- Removed the inner compose-field pulse hook so the effect no longer produces a stacked shell look.

## Files changed
- `src/flows/message-send.js`
- `src/styles/ai-drop.css`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after moving the effect to the shell glow layer.

## Recommended next step
1. Trigger the chip picker and commit a prompted chip.
2. Verify the inserted sentence still gets the one-shot magic treatment.
3. Verify the glow now stays on a single shell with no duplicate container underneath.

## Task title
Prompted Chip Magic Glow Restore

## Completion status
- Completed

## Summary
- Restored the one-shot “magic” insert effect when a prompted chip is committed in the message compose flow.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) so chip commit now:
  - writes the predefined sentence into the compose field
  - renders one beat in compose
  - applies a one-shot field glow and text-magic animation
  - then auto-advances to confirm after the effect
- Updated [ai-glass.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai-glass.css) so the compose field can reuse the existing `g-field-pulse` animation via `.g-compose-field.magic-arriving`.

## Files changed
- `src/flows/message-send.js`
- `src/styles/ai-glass.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after restoring the chip-insert animation.

## Recommended next step
1. Open the message compose flow.
2. Trigger the chip picker and commit a prompted chip.
3. Verify the sentence appears in the compose field, the field glows once, and the flow then advances to confirm automatically.

## Task title
Compose Chip Release Commit Fix

## Completion status
- Completed

## Summary
- Fixed the mouse-release commit bug in [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js).
- Root cause: the release path checked for a selected chip while `flow.composeMenuHolding` was still `true`, so a highlighted chip was not being committed on mouse-up.
- Updated the release path to clear the holding state before checking the selected chip.
- Result: releasing the mouse with a highlighted chip now commits that chip’s predefined sentence and advances to confirm as intended.

## Files changed
- `src/flows/message-send.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after this fix.

## Recommended next step
1. Enter the message compose screen.
2. Long press anywhere on the stage to open the chip stack.
3. Highlight a chip, release, and verify the predefined sentence is committed and the flow advances to confirm.

## Task title
Compose Chip Gesture Full-Screen Trigger

## Completion status
- Completed

## Summary
- Expanded the compose chip long-press trigger from the compose shell to the full screen outside the left-side panels in [ai-bindings.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js).
- The gesture can now start anywhere except inside `#left-sidebar` or `#sim-panel` while the message flow is in compose.
- No change was needed to the chip commit path:
  - selecting a chip still writes its predefined `chip.message` into the compose field
  - the flow still advances immediately to confirm after selection

## Files changed
- `src/ai/ai-bindings.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/ai/ai-bindings.js`

## Remaining issues / caveats
- No live browser verification was run after widening the pointer hit area.

## Recommended next step
1. Enter the message compose screen.
2. Long press in empty screen space outside the left-side panels.
3. Verify the chip stack still opens, scrubs, and commits exactly the same way as pressing on the shell itself.

## Task title
Compose Chip Mouse Hold + Vertical Scrub

## Completion status
- Completed

## Summary
- Replaced the compose-state chip picker trigger with a pointer gesture:
  - long press on the compose surface opens the chip stack
  - vertical drag while holding scrubs the highlight
  - release commits the highlighted chip only if one is selected
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) so the compose chip stack now supports a true `no selection` state (`sel = -1`) while open.
- Implemented bottom-up scrub mapping:
  - no upward drag: nothing highlighted
  - first upward step: bottom visible chip
  - further upward steps: chips above it
  - dragging back down steps the highlight back toward none
- Updated [ai-bindings.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js) to drive the interaction from `pointerdown` / `pointermove` / `pointerup` instead of compose-state `L` hold.
- Updated the compose simulator hint in [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so the gesture is discoverable.

## Files changed
- `src/flows/message-send.js`
- `src/ai/ai-bindings.js`
- `src/flows/message-send-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/ai/ai-bindings.js`
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after the new pointer gesture was added.
- Keyboard arrow navigation still exists as a fallback path; this change only replaced the compose-state `L` hold gesture.

## Recommended next step
1. Enter the message compose screen.
2. Long press on the compose surface until the chip stack opens.
3. Drag upward and confirm the first highlight lands on the bottom visible chip.
4. Drag back down and confirm the highlight clears before release.
5. Release once with a highlighted chip and once with no highlight to verify the commit/no-op behavior.

## Task title
Compose Handoff 1000ms Retiming

## Completion status
- Completed

## Summary
- Increased the message-flow disambiguation -> compose handoff duration from `600ms` to `1000ms`.
- Updated the single source-of-truth constant in [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js#L26), which controls when the manual compose-entry overlap ends and when input focus is restored.
- Kept the narrower child animation timings unchanged in this pass.

## Files changed
- `src/flows/message-send.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after this retime.
- The inner pill/header/placeholder animation durations were not changed, so only the overall handoff timing is now `1000ms`.

## Recommended next step
1. Trigger the Hiro disambiguation path.
2. Select a contact.
3. Verify the compose handoff now holds for about `1000ms` before fully settling.

## Task title
Compose Dictation Oversized Shell Fix

## Completion status
- Completed

## Summary
- Fixed the compose-screen geometry bug that could show a second dark container behind the dictated message after speech finished.
- Root cause was in [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js): compose height was measured from the current DOM field width before the shell finished widening, so long wrapped text could produce an oversized outer shell for a frame and make the compose field appear pushed upward inside it.
- Updated compose measurement so height is now measured against the target compose width before morphing.
- Result: the shell height and final wrapped text layout are derived from the same width, which removes the transient double-container state.

## Files changed
- `src/flows/message-send-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this layout-measurement fix.

## Recommended next step
1. Trigger the Hiro disambiguation path.
2. Dictate a long multi-line message.
3. Verify the compose shell no longer grows taller than the text field during or after the final dictation update.

## Task title
Compose Entry Single Blue Shadow Fix

## Completion status
- Completed

## Summary
- Fixed the disambiguation -> compose transition so the message compose entry keeps a single blue dictation glow instead of briefly showing both the outer shell glow and the inner compose-field glow.
- Root cause was in [voice-engine.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js): switching from command listening to dictation while speech recognition was already active changed `voiceEngine.mode`, but it did not reset the active visualization state or restart the dictation delay clock.
- Updated the voice engine so active mode switches now:
  - clear the previous visualization immediately
  - reset `dictationStart` when entering dictation mid-session
  - apply dictation glow only to the real compose field, not the fallback outer shell

## Files changed
- `src/ai/voice-engine.js`
- `context/handoff.md`

## Validation performed
- `node --check src/ai/voice-engine.js`

## Remaining issues / caveats
- No live browser verification was run after this voice-visualization fix, so the final visual result is based on code-path inspection plus JS syntax validation.

## Recommended next step
1. Trigger the Hiro disambiguation path.
2. Choose a contact and watch the disambiguation -> compose transition.
3. Verify the blue glow appears on only one layer throughout the handoff and after the compose field settles.

## Task title
Message Confirm Action Row Removal

## Completion status
- Completed

## Summary
- Removed the three-button confirm action row from the message flow confirm screen.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so `GS.CONFIRM` emits no control actions to the external controls layer.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) so confirm no longer advertises a `0..2` keyboard selection range after the buttons were removed.
- Voice-driven confirm behavior remains unchanged:
  - `send`
  - `edit`
  - `cancel`

## Files changed
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after removing the confirm controls row.

## Recommended next step
1. Open the message flow confirm screen.
2. Verify the three-button row is gone.
3. Verify voice commands still handle `send`, `edit`, and `cancel`.

## Task title
Flight Confirm Container Focus Parity

## Completion status
- Completed

## Summary
- Compared the current `new-msg-motion` flight confirm controller against `origin/main` instead of continuing with the simplified local confirm logic.
- Restored the `main` branch confirm navigation contract in `src/flows/flight-booking.js`:
  - `ArrowUp` from the confirm button row now jumps focus to the confirm container
  - `ArrowDown` from the focused container now returns focus to the first action button
  - `Space` on the focused container expands details
  - `Space` while details are expanded collapses them again
- Kept the previously fixed recommendation handling in sync with the same `main` branch interaction pattern so the confirm-stage behavior is no longer divergent.

## Files changed
- `src/flows/flight-booking.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/flight-booking.js`

## Remaining issues / caveats
- No live browser verification was run after restoring the `main` branch confirm navigation rules.

## Recommended next step
1. Run the flight flow to the confirm step.
2. Press `ArrowUp` from the action row and verify the confirm container highlights.
3. Press `Space` to expand, then `Space` again to collapse.

# Handoff

## Task title
Compose Entry Animation Visibility Fix

## Completion status
- Completed

## Summary
- Found the actual reason the compose contact header and `"Speak your message..."` placeholder still appeared abruptly after the prior timing changes.
- Root cause: during disambiguation -> compose, the renderer was still forcing the entire compose overlay (`#c-rich`) to `opacity: 0`, which hid the child header/placeholder animations until the parent snapped visible.
- Fixed in `src/flows/message-send-render.js` by removing that parent-level opacity gate for the disambiguation -> compose entry path.
- Result: the header and placeholder now rely on their own CSS entry animations instead of being masked by the parent container.

## Files changed
- `src/flows/message-send-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this render-path fix.

## Recommended next step
1. Trigger the Hiro disambiguation path again.
2. Verify the contact header now fades/floats in visibly over `300ms`.
3. Verify `"Speak your message..."` now starts fading in before the compose shell fully settles.

## Task title
Compose Entry Header + Placeholder Timing

## Completion status
- Completed

## Summary
- Updated the disambiguation -> compose entry so the contact header now fades in and floats up from below over `300ms`.
- Moved the compose overlay content reveal earlier on that same transition so entry content is no longer hidden for the full shell morph.
- Updated the `"Speak your message..."` placeholder entry to start before the container reaches its final shape:
  - delay `180ms`
  - duration `300ms`

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this entry-timing adjustment.

## Recommended next step
1. Trigger the Hiro disambiguation path and verify the compose header now rises/fades in over `300ms`.
2. Verify the placeholder begins appearing before the compose shell fully settles, rather than after the full morph completes.

## Task title
Send Message Flow Timing Update

## Completion status
- Completed

## Summary
- Increased the disambiguation -> compose handoff to `600ms` across the message-send flow so the compose surface waits on the longer transition instead of snapping in after the old short delay.
- Updated the disambiguation pill exit animation to `600ms` to match that handoff timing.
- Set compose chip appear and disappear motion to `1000ms` in both directions, including the stack container fade timing, so the chip open/close reads as one consistent duration.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after these timing adjustments.

## Recommended next step
1. Trigger the send-message flow, go through the Hiro disambiguation path, and verify the compose step now lands after a `600ms` handoff.
2. Hold and release `L` in compose and verify chip open and close both read as `1000ms` motion.

## Task title
Compose Header Transition Root-Cause Fix

## Completion status
- Completed

## Summary
- Found the actual reason the compose contact header still had no fade transition on `L` open: opening the chip menu was doing a full compose rerender.
- That replaced the header DOM node in its final hidden state, so the CSS transition never had a stable before/after frame to animate.
- Fixed in `src/flows/message-send.js` by switching the compose-menu open path to the existing DOM-only update seam:
  - `render.updateComposeMenuUiOnly?.() || render.render(false)`
- Result: the header should now transition on the same DOM node during both open and close instead of popping due to rerender replacement.

## Files changed
- `src/flows/message-send.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after this open-path fix.

## Recommended next step
1. Hold `L` to open chips and verify the header now fades/slides out instead of popping.
2. Release `L` and verify the header fades/slides back in on the same node during close.

# Handoff

## Task title
Compose Chip Close Fade 200ms

## Completion status
- Completed

## Summary
- Shortened the compose chip close fade timing from `300ms` to `200ms` while keeping the overall close movement at `800ms`.
- Implemented by moving the close keyframe opacity cutoff from `37.5%` to `25%` of the `800ms` animation.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this timing update.

## Recommended next step
1. Hold and release `L` and verify chips are visually gone by about `200ms` while the absorb-back movement continues.

## Task title
Compose Chip Close Timing Split

## Completion status
- Completed

## Summary
- Restored the compose chip close movement duration to `800ms`.
- Kept fade-out faster by moving opacity to `0` at the `300ms` point inside the same close keyframe.
- Result: chips still travel back with the longer absorb motion, but visually disappear much earlier instead of staying fully visible through the whole `800ms` path.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this timing split adjustment.

## Recommended next step
1. Hold and release `L` and verify chip movement still lasts `800ms`.
2. Verify chip opacity is effectively gone by about `300ms` into the close animation.

## Task title
Compose Header Smooth Toggle + Faster Chip Close

## Completion status
- Completed

## Summary
- Smoothed the compose contact-header show/hide behavior during the `L`-menu lifecycle by updating the header opacity/translate transition to a `220ms` cubic-bezier motion on the existing class-toggle path.
- Shortened the compose chip dismiss animation from `400ms` to `200ms` so chips fade/absorb back faster when released.
- Also reduced per-chip close staggering so the whole dismiss reads as one tighter close gesture instead of a slow cascade.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this motion timing adjustment.

## Recommended next step
1. Hold and release `L` in compose and verify the header now fades/slides smoothly instead of popping.
2. Verify chip dismiss now completes in roughly `200ms` and still reads as absorption back into the compose field.

## Task title
Compose Empty Height 96px + Bottom Anchor 12px

## Completion status
- Completed

## Summary
- Increased the empty compose placeholder-state shell height to `96px` on both the geometry path and the live compose-field CSS.
- Reduced the compose/confirm field bottom margin to `12px` at all compose-layout states by moving the bottom anchor from `380` to `408` inside the `420px` stage.
- This affects the real shell position, so compose and confirm now sit lower with a consistent `12px` bottom gap.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this sizing/anchor adjustment.

## Recommended next step
1. Verify empty compose now renders at `96px` tall.
2. Verify compose and confirm both sit `12px` above the frame bottom.

## Task title
Compose Placeholder Wrap-Glitch Guard

## Completion status
- Completed

## Summary
- Identified the remaining visual glitch source in empty compose: the placeholder text was still allowed to wrap while the compose shell was animating wider from the orb.
- Updated the live empty placeholder styling so it stays on a single line during the morph:
  - fixed content width inside the field
  - `white-space: nowrap`
  - overflow clipped instead of wrapping to two lines
- This works with the existing `400ms` delayed reveal so the empty compose entry no longer shows the two-line -> one-line placeholder glitch during shell expansion.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this placeholder wrap guard.

## Recommended next step
1. Verify disambiguation -> compose no longer shows the placeholder wrapping to two lines before settling.
2. If any residual visual glitch remains, inspect only the shell-width timing versus the `400ms` reveal delay next.

## Task title
Compose Empty-State Height + Placeholder Delay

## Completion status
- Completed

## Summary
- Reduced the empty compose field to a one-line-tall shell on the actual compose geometry path.
- Updated the live compose-field CSS so the empty state now matches that shorter shell instead of keeping the older tall empty-field styling.
- Added a placeholder-only delayed reveal on the disambiguation -> compose transition:
  - `Speak your message...` stays hidden for `400ms`
  - then fades/slides in over `220ms`
- This delay applies only when entering empty compose from disambiguation. It does not affect active text compose or confirm.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this empty-state adjustment.

## Recommended next step
1. Verify disambiguation -> compose now shows the shell first, then the placeholder after `400ms`.
2. Verify the empty compose shell is visually one line tall and still expands upward correctly once dictation text appears.

## Task title
Compose Morph Regression Root-Cause Fix

## Completion status
- Completed

## Summary
- Performed a deeper runtime inspection of the actual compose morph path.
- Root cause found in `/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js`:
  - once compose voice viz was retargeted to the real visible field (`#drop-main.compose-surface`), the dictation path still did `field.style.transition = 'min-height ... box-shadow ...'`
  - when `field` is `#drop-main`, that overwrites the shell’s normal transition property
  - which removes width / height / transform / border-radius transitions from the real morphing shell
  - result: subsequent compose shell geometry changes read as jumps instead of morphs
- Fixed by making the voice engine preserve shell transitions on the real field:
  - if the target is `#drop-main`, do not write `style.transition`
  - still apply live voice viz through `box-shadow`
  - cleanup paths no longer clear `transition` on `#drop-main`
- This preserves the compose shell’s morph animation while keeping the live voice visualization on the real visible field.

## Files changed
- `src/ai/voice-engine.js`
- `context/handoff.md`

## Validation performed
- `node --check src/ai/voice-engine.js`

## Remaining issues / caveats
- No live browser verification was run after this root-cause fix.

## Recommended next step
1. Verify disambiguation -> compose now morphs on the real shell.
2. Start dictation and verify compose growth still morphs while voice viz remains active.
3. If any residual non-morph remains after this, inspect only the compose-entry sequencing path next; the voice-engine transition override bug is now removed.


## Task title
Compose Entry Morph Sequencing Fix

## Completion status
- Completed

## Summary
- Performed a deeper inspection of the compose morph path and found the key sequencing difference from `main`.
- Root cause: current compose entry was rendering the final compose UI immediately, then trying to morph the shell. That visually overrode the orb->field transition, so it read as a jump even though shell geometry was changing.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js` by restoring a shell-first compose entry path:
  - set compose state/data
  - compute compose geometry
  - call the shell morph first
  - only render the compose content after a short delay (`120ms`) once the shell has started morphing
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` by:
  - exposing `composeGeo()` for the compose-entry path
  - tracking the first empty->text boundary (`prevComposeHasText`)
  - briefly delaying rich-content reveal on that boundary as well, so the shell expansion is visible instead of being visually flattened by immediate final content
- Result: both disambiguation -> compose and the first compose growth into active dictation now use a shell-first sequence instead of immediate final-layout replacement.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after this sequencing change.

## Recommended next step
1. Verify disambiguation -> compose now visibly morphs from orb to field.
2. Start dictation from empty compose and verify the first expansion now reads as a morph instead of a snap.
3. If any residual snap remains after this, inspect repeated interim transcript updates during active dictation next.


## Task title
Compose Morph Visibility Fix

## Completion status
- Completed

## Summary
- Addressed the compose-shell jump in two places.
- First fix: `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js`
  - `handleInputChange()` now detects the empty <-> non-empty text transition and calls `render.render(true)` for that boundary.
  - This makes the first compose-field expansion use the explicit morph path instead of the lighter update path.
- Second fix: `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js`
  - entering compose from disambiguation now delays the rich-content reveal briefly (`120ms`) while the shell begins morphing.
  - Root cause here was perceptual: the compose content was being swapped to its final layout immediately, which visually overrode the shell morph and made the orb->field change read like a jump.
  - The shell still morphs through the normal geometry path, but the content now fades in after the morph begins so the transition is visible.
- Result: disambiguation -> compose should read as an orb morph into the compose field, and the first voice/text expansion should use the morph path rather than snapping.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser pass was run after this fix.

## Recommended next step
1. Verify disambiguation -> compose now visibly morphs before the content fully appears.
2. Start dictation from empty compose and verify the first field expansion uses the morph path.
3. If there is still residual snap after this, the next seam to inspect is repeated interim transcript renders while dictation is active.


## Task title
Compose Field Snap-to-Width Fix

## Completion status
- Completed

## Summary
- Investigated the compose/disambiguation jump where the compose field appeared to snap instead of morphing.
- Root cause: the inner compose wrapper (`.g-compose-field-wrap`) was still using fixed widths (`307px` / `420px`) independent of the morphing outer shell. That let the visible field content snap to its final size immediately while `#drop-main` was still animating.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css` by making `.g-compose-field-wrap` follow the shell directly:
  - `left: 0`
  - `transform: none`
  - `width: 100%`
- Removed the `420px` hardcoded width override in `.g-compose-stage.has-text .g-compose-field-wrap` as well.
- Result: the visible compose field now inherits the morphing shell width/height instead of jumping to a separate fixed-size layout during disambiguation -> compose and empty -> active-text transitions.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only geometry alignment change.

## Remaining issues / caveats
- No live browser pass was run after this fix.

## Recommended next step
1. Verify disambiguation -> compose now morphs instead of snapping.
2. Start dictation and verify compose expansion tracks the shell transition instead of jumping.
3. If there is still residual snap, inspect the timing of `render.render(false)` on dictation interim updates next.


## Task title
Compose Surface Voice Viz Priority Fix

## Completion status
- Completed

## Summary
- Implemented the live voice visualization directly on the real visible compose field: `#drop-main.compose-surface`.
- Root cause: the compose shell CSS already set `box-shadow` with `!important`, so the voice engine’s normal inline `field.style.boxShadow = ...` writes could not win. That made the outer compose surface look static even though the voice engine was trying to update it.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js` by changing the compose-shell dictation path to use `style.setProperty('box-shadow', shadow(level), 'important')`.
- Updated cleanup paths to use `removeProperty('box-shadow')`, so when dictation stops the shell falls back to its normal CSS-defined resting state.
- This keeps the single real compose shell and makes it react live like the old temporary compatibility field did.

## Files changed
- `src/ai/voice-engine.js`
- `context/handoff.md`

## Validation performed
- `node --check src/ai/voice-engine.js`

## Remaining issues / caveats
- No live browser pass was run after this priority fix.

## Recommended next step
1. Enter compose and start dictating.
2. Verify `#drop-main.compose-surface` now visibly reacts to live voice level.
3. Verify confirm still stays static.


## Task title
Compose Duplicate Field Removal + Voice Viz Target Fix

## Completion status
- Completed

## Summary
- Removed the duplicated compose field caused by the temporary compatibility patch.
- Root cause: the real visible compose field is the outer `#drop-main.compose-surface`, but the previous fix reintroduced an inner `.g-listen-field.compose-input` field purely to satisfy the old voice engine selector. That created two visual compose surfaces: one real shell and one inner field.
- Fixed by restoring a single source of truth:
  - `/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js`: `renderComposeField()` now renders only the inner compose content wrapper again (`.g-compose-field`), without the old `g-listen-field compose-input` styling classes.
  - `/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js`: the live voice visualization path now targets `#drop-main.compose-surface:not(.confirm-surface)` first, with `[data-compose-field]` only as a fallback. This makes the actual compose shell react to voice instead of requiring a duplicate inner field.
  - `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js`: compose exit transition now keys off `[data-compose-field]` instead of the removed old selector.
  - `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js`: removed the obsolete compose-input re-toggle block that belonged to the old inner-field path.
- Result: only one compose field remains visually, and the active voice viz is now applied to the real outer compose shell.

## Files changed
- `src/flows/ui-primitives.js`
- `src/ai/voice-engine.js`
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/ai/voice-engine.js`
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser pass was run after removing the duplicate field path.

## Recommended next step
1. Enter compose and confirm only one field is visible.
2. Start dictating and verify the outer compose shell reacts to voice.
3. Verify confirm still remains visually static with no duplicate field.


## Task title
Compose Voice Viz Main-Path Compatibility Fix

## Completion status
- Completed

## Summary
- Investigated why compose no longer reacted to live voice input like the old `main` implementation.
- Root cause: the old voice engine still targets `.g-listen-field.compose-input` for live box-shadow updates, pulse locking, and cleanup. The redesigned compose field had been rendered only as `.g-compose-field`, so it no longer matched the selector the voice engine drives.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js` by rendering the compose field with the old compatibility classes again: `.g-listen-field.compose-input`, plus `.has-text` when populated.
- Also mapped the inner text/placeholder nodes onto `.g-listen-text` / `.g-listen-empty` so the compose field follows the same legacy voice-reactive styling path.
- This restores the old main-branch integration path without undoing the newer compose layout structure.

## Files changed
- `src/flows/ui-primitives.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`

## Remaining issues / caveats
- No live browser pass was run after restoring the old selector contract.

## Recommended next step
1. Enter compose and start dictating.
2. Verify the compose field now reacts to live voice input again.
3. Verify confirm still remains visually static.


## Task title
Compose Header Return + Voice Viz Restore

## Completion status
- Completed

## Summary
- Fixed the compose header so it returns when the chip stack is disappearing.
- Root cause: chip close uses the DOM-only compose menu update path, but that path was only toggling stack classes and never updating the header visibility class. As a result, the header stayed hidden until a later full rerender.
- Updated `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` so compose header visibility is driven by `composeMenuOpen && !composeMenuClosing` in both the full render path and `updateComposeMenuUiOnly()`. This makes the header come back as soon as the chips begin closing.
- Restored the compose voice-viz shell styling to the old `main` compose-input glow values in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css`.
- Tightened the `compose-text-active` trigger so it only applies in compose while text is present and the chip menu is not open.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- Compared `compose-text-active` shadow values against `main:src/styles/ai.css` old `g-listen-field.compose-input` styling.

## Remaining issues / caveats
- No live browser pass was run for this change.

## Recommended next step
1. Hold `L`, then release and verify the header returns during chip close.
2. Start speaking in compose and verify the field glow reacts like the older compose-input state.
3. Verify confirm still has no active voice glow.


## Task title
Compose Chip Second-Wave Jump Regression Fix

## Completion status
- Completed

## Summary
- Investigated the regression where the first three compose chips started jumping upward after the gap fix when the second two chips appeared.
- Root cause: the visible movement comes from the stack container growing upward from its bottom anchor, not from individual chip rows changing their own transforms. The earlier FLIP pass was applied to chip items, so it did not correctly animate the actual layout shift.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` by moving the FLIP animation to `.g-compose-chip-stack` itself. The update path now measures the stack rect before and after the visibility change, applies a temporary inverse translate to the stack, then lets it transition back to its resting transform.
- This preserves the new correct gap behavior while restoring a smooth upward push for the first three chips when the extra two appear.

## Files changed
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- Live browser verification is still needed to confirm the second-wave push now matches the earlier feel.

## Recommended next step
1. Hold `L` until the second wave appears.
2. Verify the first three chips now transition upward instead of snapping.
3. If motion still needs tuning, adjust only the stack transform transition timing in `src/styles/ai.css`.


## Task title
Compose Chip Release Timing Update

## Completion status
- Completed

## Summary
- Updated the compose chip release animation timing.
- Changed the chip disappear / absorb-back animation from `240ms` to `400ms` in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css`.
- This affects the release path for visible compose chips while the stack is closing.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only timing change; verified the updated animation rule in `src/styles/ai.css`.

## Remaining issues / caveats
- No live browser pass was run for this timing-only tweak.

## Recommended next step
1. Hold `L`, then release it.
2. Verify the chips now absorb back over `400ms`.
3. If the feel is still off, tune only the `compose-chip-out` duration/easing.


## Task title
Compose Chip Second-Wave Push Animation Fix

## Completion status
- Completed

## Summary
- Investigated the second-wave compose chip reveal where the first three chips jumped upward instead of transitioning.
- Root cause: when visible count changed from 3 to 5, the stack reflow moved the first three chips to their new flex positions immediately. There was no layout-transition logic for already-visible chips, so only the new chips animated while the existing ones snapped upward.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` by adding a DOM-only FLIP pass in `updateComposeMenuUiOnly()`: capture previous chip rects, apply the new visibility state, measure the new rects, then animate the existing visible chips from their old positions to the new ones.
- Updated `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css` so `.g-compose-chip` includes a transform transition. This gives the first three chips a smooth upward push when the second two appear.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- Live browser verification is still needed to tune the exact feel of the upward push against the reference motion.

## Recommended next step
1. Hold `L` until the second wave appears.
2. Verify the first three chips now glide upward instead of snapping.
3. If the push still feels too stiff or too loose, tune only the transform transition timing in `src/styles/ai.css`.


## Task title
Compose Chip Stack Gap Root-Cause Fix

## Completion status
- Completed

## Summary
- Performed a direct spacing audit of the expanded compose chip stack.
- Root cause: hidden chips were still rendered as flex items inside `.g-compose-chip-stack`, so they continued reserving vertical space even before they were visible. That made the stack height larger than the visible chip count implied, which pushed the visible chips too far above the compose field.
- Secondary confirmation: the stack anchor itself is correct now. It is bottom-anchored from inside `.g-compose-field-wrap` using `bottom: calc(100% + 4px)`, so the bad distance was not from wrapper placement anymore.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css` by making non-visible compose chips `display: none` and only visible chips `display: inline-flex`. This makes the stack height match the currently visible chip count, so the bottom visible chip tracks the compose field top edge correctly in both 3-chip and 5-chip states.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; root cause verified by inspecting the current compose chip stack DOM/CSS rules.

## Remaining issues / caveats
- Live browser verification is still needed to confirm the 3-chip and 5-chip bottom gap now matches visually.

## Recommended next step
1. Verify the gap with 3 visible chips.
2. Verify the gap again after the second-wave reveal to 5 chips.
3. If any residual offset remains, tune only the `bottom: calc(100% + 4px)` anchor, not the stack transform.


## Task title
Compose Chip Long-Press Interaction + Style Update

## Completion status
- Completed

## Summary
- Follow-up compose stack gap fix: removed the extra upward offset from `.g-compose-chip-stack.expanded`. Once the stack was correctly bottom-anchored to the field wrapper, the expanded transform was double-shifting the 5-chip state upward and creating the large gap.
- Follow-up compose wrapper fix: set `g-compose-field-wrap` to `height: 100%` so the chip stack anchor resolves against the compose shell height instead of an auto-expanded wrapper containing both chips and field. This keeps the chip stack bottom aligned to the field top edge.
- Follow-up compose anchoring fix: the chip stack is now rendered inside `g-compose-field-wrap` instead of as a stage-level sibling. Its `bottom: calc(100% + 4px)` anchor now resolves against the compose field wrapper, so the lowest chip tracks the field's top edge consistently.
- Follow-up compose chip anchoring fix: changed the chip stack from a fixed top offset to `bottom: calc(100% + 4px)`, so the lowest visible chip keeps a consistent gap above the compose field whether 3 or 5 chips are present.
- Follow-up compose chip position tweak: moved the chip stack anchor down (`top: -137px`) so the bottom chip sits much closer to the compose field, targeting roughly a `4px` gap.
- Follow-up compose chip spacing tweak: reduced chip top/bottom padding to `6px` and stack gap to `4px`, with chip minimum height adjusted accordingly.
- Follow-up release-motion fix: the compose chip stack now stays visible during `closing`, and release uses the DOM-only menu update path before teardown. This prevents the stack from disappearing immediately and lets the chip exit animation play as they are absorbed back into the field.
- Follow-up timing change: increased both the disambiguation pill entrance and compose chip entrance durations from `500ms` to `800ms`.
- Follow-up second-wave behavior fix: the extra two compose chips now appear via in-place DOM updates instead of a full re-render. The existing three chips are pushed upward by an `expanded` stack transform while only the newly visible chips animate in.
- Follow-up timing sync: set both the disambiguation pill entrance and compose chip entrance animations to `500ms` so the two reveal systems share the same duration.
- Follow-up compose motion fix: chip enter/exit keyframes now use large per-chip travel offsets so the chips visibly travel from the compose field up into their stack positions, instead of only rotating/fading near the destination.
- Follow-up chip style rollback: compose chips now use the previous `g-chip` state treatment again (unselected muted text + flat glass fill, selected white text + inset glow, no explicit white border), with text size reduced to `18px`.
- Follow-up motion fix: compose chips now use explicit `compose-chip-in` / `compose-chip-out` keyframe animations instead of relying on insertion-time transitions, fixing the jump-cut behavior where chips appeared with no visible entrance motion.
- Updated compose chip styling in [/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css):
  - chip text `24px -> 20px`
  - restored gradient outline treatment on chip shells
  - adjusted chip motion to use a softer rotational spread from the compose field instead of the old straight fade-up
- Reworked compose chip rendering in [/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js) and [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
  - chip stack now supports `visibleCount` and `closing`
  - first wave shows 3 chips
  - second wave can reveal 2 additional chips
- Reworked message compose state in [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - added long-press state for compose chips
  - `L` hold starts a delayed reveal (`280ms`)
  - after another `3000ms` of holding, 2 more chips appear if available
  - releasing `L` smoothly closes the chip stack back toward the compose field
  - while the key is being held, compose chips do not confirm into the next state
  - compose menu state now tracks `composeMenuHolding`, `composeMenuClosing`, and `composeMenuVisibleCount`
- Updated keyboard wiring in [/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js):
  - `keydown` on `L` in compose starts the hold interaction
  - `keyup` on `L` ends it and triggers the smooth close
  - old tap-to-toggle behavior was removed
- Extended contact chip data to 5 chips per contact so the second-wave reveal has real content instead of placeholder duplicates.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai.css`
- `src/ai/ai-bindings.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/ui-primitives.js`
- `node --check src/ai/ai-bindings.js`
- `node --check src/flows/message-send-voice.js`

## Remaining issues / caveats
- Motion was tuned from the provided screen recording reference at a thumbnail level only; no frame-by-frame live browser validation was run.
- The new extra two chips are data additions in the local contact dataset; if product copy changes later, update the chip arrays in `message-send.js`.

## Recommended next step
1. Hold `L` in compose and verify first-wave 3-chip reveal timing.
2. Keep holding for 3 more seconds and verify 2 more chips appear with the same spread motion.
3. Release `L` and verify the chips absorb smoothly back toward the compose field.
4. If motion still needs tuning, only adjust the compose-chip transform/transition block in [/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css).

## Task title
Compose Surface Placement Fix

## Completion status
- Completed

## Summary
- Follow-up compose sizing fix: increased the active compose/confirm field max width from `351px` to `420px` and updated inner text width to fill that shell width correctly.
- Follow-up confirmation visual fix: added `confirm-surface` on `#drop-main` and removed the compose-shell shadow in confirmation, so the confirm field has no blue glow or shell shadow effect.
- Follow-up disambiguation visual tweak: changed pill border radius from `24px` to `28px` so the `56px`-tall pills read as true capsules instead of rounded rectangles.
- Follow-up disambiguation tweak: changed unselected pill scale from `0.92` to `0.98` in both the primitive output and CSS animation/settled-state rules.
- Follow-up disambiguation tweak: made the unselected pill scale explicit at `0.92` in CSS (`.g-disambiguation-pill:not(.selected)`) so selection updates and animation settle states cannot drift.
- Follow-up state fix: confirmation no longer reuses the compose dictation glow. `compose-text-active` now applies only while in `GS.COMPOSE` with text, so entering `GS.CONFIRM` removes the blue voice-viz from the field shell.
- Follow-up visual fix: restored the old compose voice-viz color stack on `#drop-main.compose-surface.compose-text-active` by removing the pink lower glow and matching the previous blue/white compose-field lighting.
- Follow-up layout rule: compose/confirm shell is now bottom-anchored. Height growth no longer pushes the field downward; the bottom edge stays fixed and multiline growth expands upward.
- Follow-up behavior change: compose/confirm field height now expands with text length. The inner compose field uses auto height with minimum empty/active heights, and the shell in `message-send-render.js` re-measures the rendered compose field and remorphs to match content height.
- Fixed the compose/confirm shell placement bug in [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js).
- Root cause: `composeGeo()` targeted an absolute top-edge position, but the shared morph renderer also applies a bottom-align `yOffset` in AI mode. The compose shell was therefore pushed down twice and rendered below the visible frame.
- Updated compose geometry to compensate for the renderer's bottom-align offset: `ty = top + h - 420`.
- Updated rich-layer class routing so both `GS.COMPOSE` and `GS.CONFIRM` use `glass-compose` and neither inherits the generic bottom-aligned `glass-active` layout. This keeps the compose/confirm header and field on the compose surface instead of a separate card-layout path.

## Files changed
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser validation was run after this patch. If vertical position is still slightly off, only the compose top constants (`COMPOSE_FIELD_TOP`, `COMPOSE_FIELD_TOP_ACTIVE`) should need tuning now.
- Follow-up tuning: moved `COMPOSE_FIELD_TOP` and `COMPOSE_FIELD_TOP_ACTIVE` up by `20px` to bring the compose/confirm shell fully inside the visible frame.

## Recommended next step
1. Reload `ai.html`.
2. Verify `drop-main.compose-surface` and `drop-main.compose-surface.compose-text-active` both sit inside the frame.
3. If needed, tune only `COMPOSE_FIELD_TOP` / `COMPOSE_FIELD_TOP_ACTIVE` in [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js).

## Task title
Message Compose Redesign: Header + Compose Field + Expandable Suggestion Chips

## Completion status
- Completed

## Summary
- Reworked message `COMPOSE` to the field-first Figma layout instead of the old large compose card.
- Added a field-sized compose morph in [src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
  - default compose morphs to `307x83`
  - active text morphs to `351x94`
  - the visible `drop-main` shell is now the source of truth for the compose-field morph
- Added new shared compose primitives in [src/flows/ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js):
  - `renderComposeHeader(...)`
  - `renderComposeChipStack(...)`
  - `renderComposeField(...)`
- Reworked message compose state in [src/flows/message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - added `composeMenuOpen`
  - added `composeVisualChips` for Figma-aligned visual chip order without mutating underlying chip data
  - entering compose now defaults to header + field only
  - dictation/input force-close the chip menu
  - `toggleComposeMenu()` added for compose-owned `L` behavior
- Updated [src/ai/ai-bindings.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js):
  - `L` now toggles the compose chip menu when message flow is active in `GS.COMPOSE`
  - non-compose `L` behavior remains unchanged
- Added compose-specific CSS in [src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css):
- Follow-up fix: compose header/chip/field positioning now uses offsets relative to the compose field shell inside `#c-rich`/`#drop-main`, fixing the initial render bug where the field dropped below the frame and the header/chips were off-surface.
- Follow-up fix: compose field chrome now lives on `#drop-main.compose-surface` and the inner compose field is content-only, so the morphing shell and visible field can no longer drift apart. Compose also no longer inherits generic `glass-active` bottom-alignment.
- Follow-up fix: compose shell `ty` now converts Figma top-edge coordinates to stage-center translate coordinates (`top + h/2 - 210`), fixing the incorrect compose surface placement.
  - compact `To:` header row
  - bottom-anchored compose field
  - stacked suggestion chip menu
  - compose-only rich-layer positioning via `#c-rich.glass-compose`

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/flows/message-send-voice.js`
- `src/ai/ai-bindings.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- Figma nodes referenced for implementation:
  - `224:80`
  - `224:121`
  - `224:133`
- Syntax checks passed:
  - `node --check src/flows/ui-primitives.js`
  - `node --check src/flows/message-send-render.js`
  - `node --check src/flows/message-send.js`
  - `node --check src/flows/message-send-voice.js`
  - `node --check src/ai/ai-bindings.js`

- Follow-up change: message `CONFIRM` now reuses the compose-style header + field layout and no longer renders the 3-button controls overlay. Confirm actions are voice-only: send, edit, cancel.

## Remaining issues / caveats
- No live browser validation was run in `ai.html`, so exact vertical placement and motion feel still need visual verification.
- The visual chip order is intentionally Figma-driven for the current 3-chip set; non-matching contact chip labels fall back to original order.
- The old compose helper classes remain in CSS for confirm/static field reuse, but the compose stage no longer uses the old `g-compose-card` layout.

## Recommended next step
1. Run the message flow in `ai.html` through disambiguation -> compose.
2. Verify:
   - compose enters as header + field only
   - `L` opens/closes the stacked chip menu
   - speaking with the menu open auto-dismisses chips and restores the header
   - chip selection and dictation still route to confirm correctly
3. If needed, tune only the absolute `top` values for `.g-compose-header`, `.g-compose-chip-stack`, and `.g-compose-field-wrap` in [src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css).


## Task title
Disambiguation Pills Around Listening Orb

## Completion status
- Completed

## Summary
- Replaced the message disambiguation bubble cluster with a shared pill-based primitive in [src/flows/ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js):
  - added `renderDisambiguationPills(...)`
  - removed bubble-specific rendering from the active message-flow path
- Updated [src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
- Follow-up tweak: 2-contact disambiguation pills now share the same center line (`x: 0` for both items) so the pair is vertically center-aligned above the orb.
- Follow-up tweak: disambiguation now scales the visible listening orb shell to `0.8` via `drop-main` geometry while preserving the original orb center.
  - disambiguation now stays on the normal `listening` shape with no custom orb shrink/recenter geometry
  - removed bubble size / Y-offset / orb-scale hacks
  - added pill-position layouts for `1`, `2`, `3`, and `4+` contacts relative to the listening-orb center
  - disambiguation still uses the `entering -> settled` phase, but now spreads pill chips from the orb instead of circles
- Updated [src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css):
  - removed bubble/origin styling
  - added pill-shell, pill-avatar, and pill-text styles based on the Figma node `224:100`
  - retained the disambiguation-specific rich-layer ownership so this state is not bottom-aligned or clipped
- Updated [src/flows/message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - compose handoff now animates `.g-disambiguation-pill` out instead of the old bubble class

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- Figma node inspected via MCP:
  - file `LTNbsRqNkyLeo81OSL1X7J`
  - node `224:100`
- Syntax checks passed:
  - `node --check src/flows/ui-primitives.js`
  - `node --check src/flows/message-send-render.js`
  - `node --check src/flows/message-send.js`
- Searched for stale bubble-path references in active flow files; none remain

## Remaining issues / caveats
- No live browser validation was run in `ai.html`, so the exact final pill offsets and motion feel versus the Figma screenshot/video still need on-screen verification.
- The `4+` contact fan layout is data-driven but not visually tuned beyond keeping pills above the orb.

## Recommended next step
1. Trigger ambiguous Hiro disambiguation in `ai.html`.
2. Verify:
   - the listening orb stays in the normal listening position and size
   - pills fan out above the orb without clipping
   - selected/unselected states read clearly
   - keyboard selection and spoken-name selection still work
3. If needed, tune only the disambiguation pill `x/y` offsets in [src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) without reintroducing orb-geometry hacks.


## Task title
Message Disambiguation Bubble Cluster

## Completion status
- Partially completed

## Summary
- Replaced list-based message disambiguation with a bubble-cluster primitive:
  - added [renderBubbleCluster](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js)
  - disambiguation no longer uses `renderSelectionList(...)`
- Reworked [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
  - `GS.DISAMBIGUATE` now renders a centered contact-bubble cluster instead of `card-list`
  - disambiguation now uses a transient `entering -> settled` motion phase
  - removed the external `Which Hiro?` header for this stage
  - disambiguation morph now uses compact custom geometry on the `listening` shape rather than a card shell
  - added layout rules for `2`, `3`, and `4+` contacts
- Patched the disambiguation surface/origin seam:
  - cluster geometry is now anchored to the origin orb position instead of the cluster midpoint
  - [ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css) makes the disambiguation surface and rich layer overflow-visible so the bubbles are not clipped
  - the origin orb is now intentionally part of the disambiguation cluster instead of being removed during settle
- Updated compose handoff in [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - disambiguation bubbles now animate out on compose entry
  - old `.g-contact-row` exit assumptions were removed from that path

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- Syntax checks passed:
  - `node --check src/flows/ui-primitives.js`
  - `node --check src/flows/message-send-render.js`
  - `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser validation was run in `ai.html`, so these are still unverified:
  - exact motion feel versus the reference video
  - final bubble positioning in the 420×420 stage
  - whether the transient origin artifact feels correct or needs darker styling/timing tuning
  - whether command-voice visualization around disambiguation needs further suppression
- The cluster generalizes to `4+` contacts with a radial layout, but that layout has not been visually tuned in browser yet.

## Recommended next step
1. Trigger ambiguous Hiro disambiguation in `ai.html`.
2. Verify:
   - no list card appears
   - no external header appears
   - only bubbles remain after settle
   - no listening orb lingers behind the cluster
   - keyboard and spoken-name selection still work
3. If the motion still feels off, tune only:
   - bubble offsets
   - stagger timing
   - origin artifact styling
   without reintroducing a card shell.

## Task title
Add stage capture utilities (AI + prototype): Copy PNG + Export SVG

## Completion status
- Completed

## Summary
- Added shared capture utility module for stage-only capture:
  - serialize current `#stage` to SVG using `foreignObject`
  - export SVG download
  - render SVG to canvas and copy PNG to clipboard
  - graceful warning fallback for unsupported/blocked clipboard writes
- Wired feature in both modes:
  - AI mode (`ai.html` + `src/ai/ai-bindings.js`)
  - Prototype mode (`index.html` + `src/tool/index-app.js`)
- Added debug controls in both UIs:
  - `Copy PNG`
  - `Export SVG`
- Added hotkeys in both runtimes:
  - `Cmd/Ctrl + Shift + C` => copy PNG
  - `Cmd/Ctrl + Shift + E` => export SVG
  - ignored when focused in input/textarea/select/contenteditable
- Exposed runtime actions:
  - `window.copyStagePng()`
  - `window.exportStageSvg()`

## Files changed
- `src/shared/stage-capture.js` (new)
- `src/ai/ai-bindings.js`
- `src/tool/index-app.js`
- `ai.html`
- `index.html`

## Validation performed
- Wiring validation by code inspection for:
  - button hooks in both pages
  - window API exposure in both runtimes
  - hotkey routing + editable-target guard
- `node test/smoke.mjs` still fails on pre-existing debug-toggle interception issue unrelated to capture feature.

## Task title
Fix message-flow to home transition overlap (prevent double UI display)

## Completion status
- Completed

## Summary
- Fixed UI overlap where message-flow content could remain visible when returning to home.
- Root cause: delayed async callbacks (`setTimeout`) in `message-send` could still run after reset and re-inject flow DOM/animations.
- Implemented flow epoch guard in `src/flows/message-send.js`:
  - Added `flowEpoch` and `isEpochAlive(epoch)` helper.
  - Incremented epoch on `start()` and `reset()`.
  - Guarded delayed callbacks in compose/chip/confirm/dismiss/start paths so stale callbacks exit early.
- Added explicit hard cleanup in `reset()`:
  - clear rich content/classes (`visible`, `glass-active`, `glass-sent`)
  - clear glass controls layer content/visibility
  - remove `glass-flow-active` body class
  - hide intent header
- Result: switching from message flow back to home no longer leaves stale message UI in the container.

## Files changed
- `src/flows/message-send.js`

## Task title
Implement Figma node `163:1616` home-context pill look (pixel-targeted)

## Completion status
- Completed

## Summary
- Pulled Figma specs from:
  - file: `LTNbsRqNkyLeo81OSL1X7J`
  - node: `163:1616`
  - measured frame: `233x46`
- Updated AI home-context pill geometry to match Figma frame size:
  - custom home-context morph geometry now uses `233x46`, radius `30`.
- Implemented context-only layout in morph engine to match node structure:
  - left pad `24`
  - top/bottom implied by `46` height and text y positions
  - dot `6x6`
  - item gaps `10`
  - primary/divider/secondary placement based on measured text widths
  - divider rendered as vertical line (`26px` high) with `#2f2f2f`
- Applied context-only style matching Figma:
  - primary: `20px`, semibold (`600`), `#fff`
  - secondary: `18px`, regular (`400`), `#c2c2c2`
  - surface: `rgba(255,255,255,0.05)` fill
  - border: `1px rgba(255,255,255,0.36)`
  - inner shadow: `inset 0 0 20px rgba(255,255,255,0.15)`

## Files changed
- `src/ai/ai-bindings.js`
- `src/shared/morph-layout.js`
- `src/styles/ai.css`

## Validation performed
- Visual/logic validation by code against Figma values from MCP design context and metadata.

## Remaining issues / caveats
- Existing smoke automation still fails in this branch on debug-toggle click interception (`#debug-fullscreen-toggle` label intercept), unrelated to home-context pill implementation.

## Task title
Add fullscreen stage-outline toggle for AI page (sleep-stage outline control)

## Completion status
- Completed

## Summary
- Added a new AI debug toggle in `ai.html`:
  - `Stage/Frame Glow (FS)` (`#debug-fullscreen-stage-outline-toggle`)
- Wired fullscreen outline visibility control in `src/ai/ai-bindings.js`:
  - Persists to `localStorage` key: `genui_ai_fullscreen_stage_outline_visible`
  - Applies body class `hide-stage-outline-fullscreen` when toggle is off
- Added fullscreen-only CSS rule in `src/styles/ai.css`:
  - Disables glow layers when toggled off:
    - `#stage::after` outer glow
    - `#ui-frame.glasses::after` white frame glow
    - `#ui-frame.phone` frame shadow
    - `#stage` screen blend glow path (`mix-blend-mode: normal`)
  - Updated behavior to key off `body.hide-stage-outline-fullscreen` directly (not dependent on `fullscreen-stage-only`) so toggle updates apply immediately and consistently.

## Files changed
- `ai.html`
- `src/ai/ai-bindings.js`
- `src/styles/ai.css`

## Validation performed
- Manual wiring check by code inspection for:
  - toggle presence
  - class application path
  - fullscreen-only CSS selector

## Remaining issues / caveats
- Existing smoke automation currently fails on AI debug toggle click interception in this branch state (`elementHandle.click` on `#debug-fullscreen-toggle` intercepted by label). This is pre-existing in current debug-toggle pointer-event setup and does not block runtime behavior of the new outline toggle itself.

## Task title
AI home-context visual update (dot + inline text + divider styling)

## Completion status
- Completed

## Summary
- Updated home-context (`data-ai-home-state="context"`) design to match requested structure:
  - leading dot
  - primary text + vertical divider + secondary text on one row
  - home-context-specific typography and colors
- Implemented a dedicated pill layout path in morph layout (AI context mode only) so positions are deterministic and stable during morph:
  - dot anchored with left padding
  - measured primary/secondary widths for divider placement
  - divider rendered as a vertical line segment
- Applied home-context-specific visual styles:
  - primary `20px`, `700`, white
  - secondary `18px`, `400`, `#c2c2c2`
  - divider `#2f2f2f`
  - dot style simplified for context row

## Files changed
- `src/shared/morph-layout.js`
- `src/shared/morph-render.js`
- `src/styles/ai.css`

## Validation performed
- `node test/smoke.mjs` (pass)

## Remaining issues / caveats
- Exact pixel-perfect parity with image reference may still need one visual tuning pass (gap values/divider height) on target device scale.

## Recommended next step
1. Manual visual check in `ai.html` home-context state; if needed, provide exact tweaks for `dotToPrimaryGap`, `primaryToDividerGap`, and `dividerHeight` in `src/shared/morph-layout.js`.

## Task title
Fix AI stage morph regression (glitchy/jumpy container transitions)

## Completion status
- Completed

## Summary
- Restored AI morph transition rules that were unintentionally removed from `src/styles/ai.css`:
  - `body[data-page-mode="ai"] #drop-main` scale/opacity transition
  - shape-specific scaling for `data-current-shape="circle"` and `data-current-shape="listening"`
  - home-prompt suppression tied to `data-current-shape="circle"`
- Kept sleep-state hiding rules (`data-ai-home-state="sleep"`) in place, but isolated from the core cross-stage morph transition behavior.
- This restores smooth container interpolation across stage changes instead of abrupt/jumpy jumps.
- Follow-up alignment after user report:
  - Compared against `big-refractor` commit `88cce85` (`update toast pos`) and removed those AI scale override rules again because they are not part of the reference baseline.
  - Switched home-state morph driver to single-step transitions (`circle -> pill`) and removed chained `idle -> pill` morphing from the home-context entry path to avoid visible jump/cut.
  - Restored baseline listening prompt behavior (`circle <-> listening`) in AI input motion handling.

## Files changed
- `src/styles/ai.css`

## Validation performed
- `node test/smoke.mjs` (pass)

## Remaining issues / caveats
- Visual motion quality still needs manual eye-check in browser because smoke covers behavior correctness, not animation smoothness scoring.

## Recommended next step
1. Add a dedicated AI motion regression smoke that snapshots transition-relevant computed styles on shape changes (ensure `#drop-main` keeps the scale/opacity transition in AI mode).

## Regression prevention notes
- Do not remove or overwrite AI-specific `#drop-main` transition rules when editing home-state visibility behavior.
- Treat motion rules and visibility rules as separate layers:
  - motion layer: `data-page-mode + data-current-shape`
  - visibility layer: `data-ai-home-state`
- Any future home-state CSS change must verify transitions for at least `pill -> listening`, `listening -> card`, and `magic -> pill`.
- For AI motion parity checks, use commit `88cce85` as the reference baseline and diff only motion-driving paths before merging.

## Task title
AI home-state rebuild from reference: `sleep` / `home-still` / `home-context` + flow returns to context

## Completion status
- Completed

## Summary
- Implemented explicit AI home-state controller with three states:
  - `sleep` (blank/off simulation)
  - `still` (idle/dot state)
  - `context` (pill with rotating contextual content)
- Added static context cycle dataset and behavior matching the reference “next context” pattern:
  - pressing `Home-context` again while already in context refreshes to next context item.
- Added legacy debug controls in AI panel:
  - `Sleep`, `Home-still`, `Home-context` (kept existing Home/Listening/Magic controls).
- Implemented still/sleep -> context transition behavior:
  - pill enters from idle-size (via `idle -> pill` morph path),
  - overlay dot animates toward pill icon anchor,
  - pill content appears with current context.
- Set `home-context` as default home target and integrated flow exits:
  - message-send reset path returns to home-context,
  - flight flow reset path returns to home-context,
  - `Esc` while input-focused during active flight now resets flow and returns to home-context.
- Added sleep-wake guard in input actions:
  - text/chip processing wakes from sleep to still first.

## Files changed
- `ai.html`
- `src/styles/ai.css`
- `src/ai/ai-bindings.js`
- `src/ai/input-actions.js`
- `src/flows/message-send.js`
- `src/flows/flight-booking.js`

## Validation performed
- `node test/smoke.mjs` (pass).
- Playwright runtime checks:
  - New legacy buttons exist and switch `data-ai-home-state`.
  - `sleep` hides stage UI (`stage-wrap` forced hidden).
  - `home-still` sets current shape to `idle` with visible dot.
  - `home-context` morphs to `pill` and cycles text on repeated press.
  - Flight flow `Esc` reset returns to `home-context` (`shape: pill`, `flow-active: false`).

## Remaining issues / caveats
- The dot-to-pill animation uses a deterministic transform target tuned to current pill geometry (`420x100` baseline). If home pill geometry is changed later, this transform should be adjusted.
- Smoke still logs non-blocking 502 resource errors from optional network-backed calls.

## Recommended next step
1. Add a dedicated AI home-state smoke script to assert:
   `sleep -> still -> context` sequence, repeated context cycling, and flow-reset return to context.

## Blockers
- None

## Task title
Confirm To Send Single Shell And Single Toast

## Completion status
- Completed

## Summary
- Fixed the confirm -> send transition so the transition layer stays stable through the full `1000ms` handoff instead of remounting at the `SENDING -> SENT` boundary.
- Removed the transition-layer sent toast; the final settled `Message sent` toast now enters once after the transition window ends.
- Removed the inner compose field shell during the transition and moved the blue send fill onto the outer `#drop-main::after` shell, which eliminates the nested/double-container look.
- Prevented the confirm header and message text from reappearing after the blue fade by preserving identical transition markup until the handoff completes.
- Hard-froze the transition DOM after the first send frame so later renders during `sentTransitionActive` cannot remount the confirm layer.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai-glass.css`
- `src/styles/ai-decorative.css`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/ui-primitives.js`
- Headless runtime check on `http://127.0.0.1:5174/ai.html` through the real send-message flow:
  - The confirm transition DOM stayed identity-stable through `920ms` (`sameHeader: true`, `sameText: true`, `sameLayer: true`).
  - At `80ms`, `260ms`, `520ms`, and `920ms` after `send`, the confirm header/text only continued fading out and did not reappear.
  - During the transition window, no sent toast node was present.
  - After the `1000ms` handoff, a single settled `Message sent` toast appeared and remained visible.

## Remaining issues / caveats
- Validation covered the actual send flow path in Chromium, but not live microphone amplitude during the orb fade.

## Recommended next step
1. Manual visual pass on-device for confirm -> send with real speech input, mainly to confirm the orb fade still feels correct under live volume changes.

---

## Task title
Port Stage panel controls from `tool-updated` reference (layout + Add setup + Delete/Reset look)

## Completion status
- Completed

## Summary
- Ported Stage tab action row structure from `origin/tool-updated:ref/index.html`:
  - Added stage-kind select (`#stage-add-kind`) next to Add.
  - Converted Delete/Reset to icon buttons (`🗑`, `↻`) with `icon-btn` styling.
- Ported Stage timeline visual style to match reference:
  - Wrap layout (not horizontal scroll-only).
  - Blue pill chips with stronger active state gradient.
- Wired Add behavior to selected kind:
  - `dot`, `pill`, `card`, `blank`.
  - `Add` now calls `addStage(kind)` with template-specific render shape/components.

## Files changed
- `index.html`
- `src/styles/editor.css`
- `src/shared/sidebar.js`
- `src/tool/modules/manual-bindings.js`
- `src/shared/sidebar-actions.js`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/index.html`:
  - Confirmed `#stage-add-kind` exists.
  - Confirmed Delete/Reset labels are icon buttons (`🗑`, `↻`).
  - Selected `dot` + clicked Add; new active stage became `Dot Stage`.
- `node test/smoke.mjs` passed.

## Remaining issues / caveats
- `blank` currently maps to a card-shaped stage with empty components; if you want a different blank-stage geometry/content policy, that can be adjusted.

## Recommended next step
1. Manual visual pass in Stage tab to confirm exact spacing/sizing parity with your expected `tool-updated` look.

## Blockers
- None

---

## Task title
Fix `index.html` regression: pill -> card stage transition no-op

## Completion status
- Completed

## Summary
- Root cause: runtime exception during morph transition for specific shape pairs.
- Fixed missing `clamp` helper in `src/shared/morph-render.js` (`clamp is not defined`), which was thrown in `setUiMotionProfile()` for transitions such as `pill -> card`.
- After fix, Stage timeline click from pill to card now applies full card geometry and content as expected.

## Files changed
- `src/shared/morph-render.js`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/index.html`:
  - Clicked Stage timeline chip `card` from default `pill`.
  - Verified stage geometry changed to card (`420x260`, `30px` radius).
  - Verified no `pageerror` thrown.
- `node test/smoke.mjs` passed (`SHAPE:card-list`, `LOGS:[]`).

## Remaining issues / caveats
- None identified for this transition path.

## Recommended next step
1. Add one explicit smoke assertion for `pill -> card` geometry values in `index.html` to guard this exact regression.

## Blockers
- None

---

## Task title
AI home stage: make home fully blank (hide circle + prompt)

## Completion status
- Completed

## Summary
- Added AI-page-only visual override so when the current stage shape is `circle` (home), the stage orb/circle container is hidden.
- Also hid the home start prompt in the same `circle` state so home appears fully blank.
- Kept non-home states unchanged (listening/magic/content states still render normally).

## Files changed
- `src/styles/ai.css`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/ai.html`:
  - Home (`data-current-shape="circle"`): `#drop-main` computed `opacity: 0`, prompt `opacity: 0`.
  - After typing into `#sim-input` (listening): shape becomes `listening`, `#drop-main` opacity returns above `0`.

## Remaining issues / caveats
- This change is intentionally scoped to AI page only (`body[data-page-mode="ai"]`), so prototype/manual page behavior is unchanged.

## Recommended next step
1. Manual visual check on desktop/mobile to confirm the blank home state matches your intended feel.

## Blockers
- None

---

## Task title
Fix `index.html` Stage timeline button no-op + Content tab text edit no-op

## Completion status
- Completed

## Summary
- Fixed sidebar mutation commit logic so in-place mutators persist updates instead of being discarded.
- Added shared draft-apply helper in sidebar actions to normalize both mutation styles:
  - mutator returns updated object
  - mutator mutates draft and returns `undefined`
- Restored expected runtime behavior in `index.html`:
  - Stage timeline chips now activate/switch scenario stage.
  - Content tab text edits now persist after typing.
- Extended smoke coverage to validate both regressions on `/index.html` and updated existing AI chip selector to match current quick-chip copy.

## Files changed
- `src/shared/sidebar-actions.js`
- `test/smoke.mjs`
- `test/smoke.js`

## Validation performed
- `node test/smoke.mjs`
- Result: pass (`SHAPE:card-list`; no thrown assertion failures for new index checks)
- New automated assertions in smoke:
  - Click non-active stage timeline chip in `#scenario-shape-row` and assert it becomes active.
  - Open Content tab, expand Primary row, type into `#scenario-primary`, assert typed value persists after rerender delay.

## Remaining issues / caveats
- Smoke logs still include non-blocking `502` resource errors in AI mode from optional external calls; they do not block the Stage/Content regression checks and do not fail the suite.

## Recommended next step
1. Add a dedicated manual-editor smoke file (`test/index-smoke.mjs`) so `/index.html` regression checks can run independently of AI-mode network noise.

## Blockers
- None

---

## Task title
Refactor: extract page CSS and JS entrypoints from `ai.html` and `index.html`

## Completion status
- Partially completed

## Summary
- Reduced `ai.html` from 9,227 lines to 489 lines by extracting the full inline style block and the full inline module script into external files.
- Reduced `index.html` from 6,165 lines to 419 lines by extracting the full inline style block and the full inline script into external files.
- Extracted shared app-state helpers into `src/app-state.js` and wired both page modules to use the shared constants/loaders instead of carrying duplicate local definitions.
- Extracted simulator panel helpers into `src/sim-panel.js` and wired `src/ai-app.js` to use the shared module.
- Added external page entrypoints:
  - `src/ai-app.js`
  - `src/index-app.js`
- Added external style files:
  - `src/styles/ai.css`
  - `src/styles/editor.css`
  - `src/styles/shared.css`
  - `src/styles/message-flow.css`
  - `src/styles/flight-flow.css`
- Added `src/events.js` stub used by the extracted AI flight logic for Coachella date resolution.
- Rewired both HTML files to load external CSS/JS:
  - `ai.html` now loads CSS links plus `src/ai-app.js`
  - `index.html` now loads CSS links plus `src/index-app.js`
- Fixed extracted module wiring:
  - `src/ai-app.js` import path updated from `./src/shapes.js` to `./shapes.js`
  - dynamic import updated from `./src/events.js` to `./events.js`
  - `src/index-app.js` now exports inline-handler functions via `window.*` because `index.html` is now a module page

## Files changed
- `ai.html`
- `index.html`
- `src/ai-app.js`
- `src/index-app.js`
- `src/events.js`
- `src/app-state.js`
- `src/sim-panel.js`
- `src/styles/ai.css`
- `src/styles/editor.css`
- `src/styles/shared.css`
- `src/styles/message-flow.css`
- `src/styles/flight-flow.css`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
- Result observed: `SHAPE:magic`, `LOGS:[]`
- Syntax sanity:
  - `src/ai-app.js` parses after import stripping
  - `src/index-app.js` parses after import stripping
- Line-count check:
  - `ai.html`: 489 lines
  - `index.html`: 419 lines

## Remaining issues / caveats
- This pass extracted page assets and entrypoints, but did not yet finish the deeper shared-module split requested in `context/task.md` (`src/morph.js`, `src/sidebar.js`, `src/sim-panel.js`, `src/voice-engine.js`, `src/flows/*` are still not created/consumed as final shared modules).
- `src/sim-panel.js` is now created and consumed. Remaining large extractions are still pending:
  - `src/morph.js`
  - `src/sidebar.js`
  - `src/voice-engine.js`
  - `src/flows/message-send.js`
  - `src/flows/flight-booking.js`
  - `src/scenario-data.js`
  - `src/ui-actions.js`
  - `src/demo-ui.js`
  - `src/anim-controls.js`
- `index.html` was not runtime-validated in Playwright because headless Chromium crashes in this sandbox (`SIGTRAP`); only syntax/static checks were completed for the extracted manual-page module.
- `context/task.md` was already dirty before this pass and was not modified by this implementation step.

## Recommended next step
1. Split `src/ai-app.js` and `src/index-app.js` into the task-defined shared modules:
   `src/morph.js`, `src/sidebar.js`, `src/sim-panel.js`, `src/voice-engine.js`, `src/flows/message-send.js`, `src/flows/flight-booking.js`.
2. Deduplicate CSS properly by moving verified-shared sections into `src/styles/shared.css` and removing duplicated rules from `ai.css` / `editor.css`.
3. Run a runtime validation pass on both pages in a local browser outside the current sandbox limits.

## Task title
send message flow visual/motion parity pass: gradients, selection smoothing, grouped floating, controls containment

## Completion status
- Completed

## Summary
- Updated selected-state stroke system to gradient-ring borders (masked pseudo-element) and removed flat selected borders.
- Added shell-specific gradient stroke stops for outer container:
  - `0% rgba(255,255,255,0.36)`
  - `50% rgba(120,120,120,0.10)`
  - `97% rgba(255,255,255,0.10)`
- Set unselected behavior per latest direction:
  - DISAMBIGUATE non-selected rows: transparent (no fill).
  - Chips/buttons non-selected: no border, low-opacity fill + inner shadow.
- Applied outer container inset change to `10px`:
  - `#c-rich.glass-active` left/right/bottom = `10px`
  - dynamic geometry insets `GLASS_TOP_INSET`/`GLASS_BOTTOM_INSET` = `10`.
- Fixed selection animation behavior:
  - persistent stroke layers with animated opacity on selected classes.
  - Arrow selection uses in-place class toggles (`updateGlassSelectionUiOnly`) for DISAMBIGUATE/COMPOSE/CONFIRM, avoiding `#c-rich` remount on selection-only changes.
  - restored font-weight transitions (rows `400→600`, chips `400→500`) and removed row corner morph snap.
- Fixed CONFIRM control-row re-fade:
  - controls overlay is mode-diffed and no longer remounted on every selection change.
  - `.g-action-row` fade-up now entry-only (`.enter` class).
- Fixed intent header visibility and placement:
  - `setIntentHeader()` now sets `display:flex`; hide clears display.
  - moved `#intent-header` inside `#stage` so it floats as part of the same group.
  - added glass-intent anchored positioning above `#drop-main` with live tracking during transitions.
- Fixed controls appearing outside stage before snapping:
  - added live controls overlay tracking during transition (`requestAnimationFrame`) and stage-bound clamping.
  - card morph now remorphs on `ty` change (not just `h`) so vertical lift updates immediately.
- Visual token updates requested in recent iterations:
  - “Which Hiro?” intent text uses DM Sans with left margin `10px`.
  - DISAMBIGUATE avatar size set to `48x48`.
  - list-item row corner set to capsule (`999px`) and row gap set to `16px`.
  - COMPOSE checkmark uses selected action-button style (selected fill/inner shadow/2px gradient ring).
  - checkmark show animation duration increased to `500ms`.

## Files changed
- `ai.html`

## Validation performed
- Inline JS parse checks repeatedly passed (`new Function(...)` on extracted inline script).
- Smoke check repeatedly passed:
  - `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
  - result observed: `SHAPE:magic`, `LOGS:[]`.

## Remaining issues / caveats
- Visual validation for precise frame-by-frame alignment still requires manual browser check (sandbox Playwright intermittently fails with Chromium `SIGTRAP/EPERM`).
- Recent fixes focus on layout/motion/UI parity only; no backend intent logic changes were introduced in this pass.

## Recommended next step
- Manual pass on `http://localhost:5174/ai.html`:
  1) `send msg to hiro`
  2) verify “Which Hiro?” stays directly above card during full float/morph
  3) verify checkmark/action row never leaves stage bounds during appearance
  4) verify row/chip highlight transitions are smooth with weight interpolation.

## Task title
ai.html: Permanent Sim Panel + send message flow Send Message Flow (together)

## Completion status
- Partially done

## Summary
- Replaced legacy AI chat/input UI in `ai.html` with permanent left `#sim-panel` (290px) and re-centered `#ui-frame` in the right area.
- Removed all legacy `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, and `#example-chips` HTML/CSS/JS references.
- Rerouted chat output to simulator panel via `addSimLog()` + `setSimVoice()`.
- Added simulator helpers: `setSimInputState()`, event log, voice output card, keyboard legend, and command input.
- Implemented send message flow state machine in `ai.html`:
  IDLE → THINKING → DISAMBIGUATE → COMPOSE → CONFIRM → SENDING → SENT.
- Added required seams/stubs:
  `onTranscriptUpdate(text)`, `speakOutput(text)`, `parseIntent(text)`.
- Added send message flow visual styles and rich-content rendering for contact list, chips, listening field, checkmark, confirm actions, sending, and sent states.
- Updated quick action routing: message chip now calls `startGlassFlow()`.
- Renamed simulator quick chip text to `"Send a message to Hiro"`.
- Fixed typed-intent routing and contact matching for shorthand input (`"send msg to hiro"`), so direct Enter from `#sim-input` now starts send message flow and reaches disambiguation.
- Refactored send message flow rendering architecture so stage content is shell-rooted:
  removed `g-root` / `g-compose-shell` wrappers and render content directly as shell content.
- Moved DISAMBIGUATE prompt to existing `intent-header` (`Which Hiro?`) and removed in-card duplicate prompt node.
- Final refactor per updated requirement: removed nested shell/chrome markup in `#c-rich` entirely.
  Glass content is now mounted directly in `#c-rich` with no `g-card-shell`/top-glow layer.
  Visual shell comes only from morphing `#drop-main`.
- Updated smoke chip selector to `"Send a message to Hiro"` in both `test/smoke.mjs` and `test/smoke.js`.

## Files changed
- `ai.html` — direct `#c-rich` mounting refactor, intent-header prompt routing, shell-chrome removal from content layer
- `test/smoke.mjs` — updated chip text selector
- `test/smoke.js` — updated chip text selector

## Validation performed
- Playwright runtime check on `http://localhost:5174/ai.html`:
  typed `send msg to hiro` + Enter → voice output `"Which Hiro?"` and DISAMBIGUATE content rendered in `#c-rich`.
- Playwright end-to-end state progression on `:5174`:
  `THINKING -> DISAMBIGUATE -> COMPOSE -> CONFIRM -> SENT -> RESET`
- Wrapper regression check:
  no `.g-root`, `.g-compose-shell`, `.g-label-above` found in `#c-rich`.
- DOM contract check: no `.g-card-shell`, `.g-card-top-glow`, `.g-root`, `.g-compose-shell`, `.g-label-above` in `ai.html`.
- Playwright end-to-end flow on `:5174`:
  DISAMBIGUATE shows `intent-header = "Which Hiro?"`, rich content visible,
  progresses through CONFIRM (`shape: card`) and SENT (`shape: pill`) then RESET (`shape: circle`).
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
- Result: pass (`SHAPE:circle`, `LOGS:[]`).
- Verified no remaining references to removed legacy selectors/IDs:
  `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, `#example-chips`

## Remaining issues / caveats
- Full interaction parity against every acceptance bullet (especially keyboard edge-cases and all voice shortcuts across states) still needs manual walkthrough in browser.
- None blocking for the requested refactor.

## Recommended next step
Run manual acceptance pass for all Step 2/3 interactions in `context/task.md` (state transitions, keyboard behavior, compose pause/checkmark, and no-overflow in 420x420).

## Blockers
- None

---

## Task title
send message flow: Fix top padding + stable dynamic height (content-measured)

## Completion status
- Completed

## Summary
- Refactored Glass card-state height measurement to use a dedicated in-content node (`[data-glass-body]`) instead of `#c-rich.scrollHeight`.
- Added fixed shell inset constants and geometry calculation:
  `shellHeight = contentHeight + 20(top) + 20(bottom)`, with clamped bounds.
- Switched card-state morphing in `glassRender()` to deterministic post-layout measurement (`requestAnimationFrame`) with render-token guards to prevent stale-frame jumps.
- Kept Arrow-navigation behavior as requested: it recomputes height each rerender and only remorphs when the measured shell height changes (>1px).
- Removed duplicate COMPOSE top spacing by setting `.g-compose-card` top padding to `0`.
- Preserved all existing contracts:
  direct `#c-rich` mounting, no nested shell chrome, DISAMBIGUATE prompt in `intent-header`, and chip send path through normal `handleSend()`.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- Static checks in `ai.html`:
  - `data-glass-body` present in DISAMBIGUATE / COMPOSE / CONFIRM templates.
  - `GLASS_TOP_INSET` and `GLASS_BOTTOM_INSET` set to `20`.
  - Card-state morph now scheduled after render via `requestAnimationFrame`.
  - `.g-compose-card` top padding removed.

## Remaining issues / caveats
- Smoke does not assert visual top-inset stability frame-by-frame; manual visual pass is still required for the four screenshots/scenarios you flagged.

## Recommended next step
Manual verify on `:5174` for:
1) DISAMBIGUATE initial + ArrowDown/ArrowUp no top snap,
2) COMPOSE initial + Arrow navigation no top snap,
3) typing/chip collapse/checkmark transitions keep stable top inset.

---

## Task title
send message flow layout parity fixes: entry sizing, multiline compose growth, external controls, blue glow ownership, disambiguate label spacing

## Completion status
- Completed

## Summary
- Updated Glass card-state sizing to a two-pass settle:
  - Pass A immediate morph after `#c-rich` content mount.
  - Pass B next-frame settle morph to absorb late layout/font changes.
- Added per-state body-height cache (`DISAMBIGUATE`, `COMPOSE`, `CONFIRM`) to avoid stale fallback sizing on state entry.
- Split card-state rendering into two zones:
  - `data-glass-body` (measured and used for shell geometry)
  - `data-glass-controls` (external controls below card, excluded from shell measurement)
- Moved controls outside card container:
  - COMPOSE checkmark below card
  - CONFIRM action row below card
- Implemented compose input visual parity updates:
  - compose listening field now has blue effect on field itself (`.compose-input`)
  - multiline text wrapping enabled (`white-space: pre-wrap`, `word-break`, `overflow-wrap`)
- Disabled compose-stage card-wide glow by forcing `#home-glow-layer` opacity to `0` during Glass flow render.
- Tightened disambiguate header spacing by reducing `#stage-wrap.flow-active #intent-header` bottom margin from `100px` to `16px`.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- JS parse check on inline script in `ai.html` (pass)
- Static DOM/CSS verification:
  - `data-glass-body` + `data-glass-controls` present in COMPOSE/CONFIRM markup.
  - body-only measurement retained (`glassContentHeightPx` reads `[data-glass-body]`).
  - compose input field uses `.compose-input` styling and multiline wrapping.
  - disambiguate prompt still routed through `intent-header`.

## Remaining issues / caveats
- Manual visual verification for exact Figma pixel parity is still needed on local renderer (headless Playwright launch failed in sandbox with Chromium SIGTRAP/EPERM).

## Recommended next step
- Validate on `http://localhost:5174/ai.html` with the exact sequence:
  `send msg to hiro` -> DISAMBIGUATE -> COMPOSE typing long text -> CONFIRM,
  checking first-entry sizing, external controls placement, and blue field-only glow.

---

## Task title
send message flow: eliminate first-frame sizing drift and move controls fully outside shell

## Completion status
- Completed

## Summary
- Added a dedicated external controls overlay root: `#glass-controls-layer` (sibling of `#drop-main`, inside `#stage`).
- Removed controls from `#c-rich` body markup; COMPOSE checkmark and CONFIRM action row now render via overlay-only path.
- Implemented overlay renderer anchored to `drop-main` geometry:
  - X centered to shell
  - Y positioned at shell bottom + fixed gap (`GLASS_CONTROLS_GAP`).
- Strengthened body height measurement:
  - `max(getBoundingClientRect().height, offsetHeight, scrollHeight)`.
  - cache per card state only when measurement is valid.
- Added deterministic 3-pass settle for card-state entry:
  - Pass A immediate after forced layout (`void C.rich.offsetHeight`)
  - Pass B next animation frame
  - Pass C delayed settle (~80ms) on state entry.
- Added settle timer cleanup and integrated it into Glass timer reset logic.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- Inline JS parse check for `ai.html` (pass)

## Remaining issues / caveats
- Pixel-perfect visual verification remains manual in local browser due sandbox limitations with custom headless Playwright probes.

## Recommended next step
- Manual check on `:5174` for:
  1) DISAMBIGUATE first frame vs Arrow frame (no size jump),
  2) COMPOSE first frame vs Arrow frame (no extra top/bottom),
  3) controls visibly outside `drop-main`,
  4) multiline compose growth still updates shell height correctly.

---

## Task title
Exact AI Motion/Visual Parity With `main:ai.html` (Commit `e918410`)

## Completion status
- Completed with validation caveat

## Summary
- Restored AI base stylesheet parity by replacing `src/styles/ai.css` with the extracted `main:ai.html` base style block.
- Removed post-base AI flow CSS overrides to preserve single-style cascade semantics:
  - `src/styles/message-flow.css` now intentionally empty.
  - `src/styles/flight-flow.css` now intentionally empty.
- Restored animation control behavior to match main defaults/preset logic:
  - `animDur` base remains `600`.
  - preset defaults: `custom -> 450`, `spring -> 900`.
  - init ordering now calls `setAnimDuration(animDur)` during bind, matching main startup behavior.
- Restored bridge/deformation parity in modular runtime:
  - removed AI-only deformation suppression in `src/shared/morph-bridges.js`.
- Restored motion profile synthesis and content choreography in `src/shared/morph-render.js`:
  - home/thinking multiplier and `geometryEase` behavior restored.
  - `--content-move-t` now uses main-equivalent geometry easing path.
  - restored ai/magic content fade suppression block from main.
  - restored rich hide/show timer semantics from main (`richHideTimer` lifecycle).
  - removed non-main deformation call from `morphCore` that introduced end-of-transition bounce/jitter.
- Reverted AI panel defaults in `ai.html` to main-equivalent initial values/select state.
- Preserved functional non-visual fixes (including `clamp` fallback wiring in message send render).

## Files changed
- `ai.html`
- `src/shared/anim-controls.js`
- `src/shared/morph-bridges.js`
- `src/shared/morph-render.js`
- `src/styles/ai.css`
- `src/styles/message-flow.css`
- `src/styles/flight-flow.css`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).
- Runtime browser probe executed to inspect AI page timing variables (sandbox caveat on direct `file://` loading means module init is not authoritative in that mode).
- Verified key parity hooks now present in source:
  - `anim-controls` init uses `setAnimDuration(animDur)`.
  - `morphCore` no longer invokes extra deformation pass.
  - ai/magic content suppression block restored.

## Remaining issues / caveats
- Full frame-by-frame pixel diff against a temporary served `main:ai.html` baseline was not completed in this pass.
- Browser runtime checks should be executed against served pages (not `file://`) for final parity sign-off.

## Recommended next step
1. Run side-by-side served comparison (`current ai.html` vs temporary `main:ai.html` baseline) with fixed timestamp screenshots (0/200/400/600ms) and pixel diff threshold.
2. If any residual drift remains, reconcile remaining differences in `src/flows/message-send-render.js` and `src/ai/ai-shell.js` against `main` choreography values.

---

## Task title
AI message flow polish: stage-scoped voice viz + confirm-shell lift

## Completion status
- Completed

## Summary
- Fixed stage-specific voice visualization ownership in `src/ai/voice-engine.js`:
  - During command mode, drop-main/glow shadow now applies only in `DISAMBIGUATE`.
  - During `COMPOSE` dictation mode, drop-main/glow/action-button shadows are cleared; only compose field receives voice viz.
  - During `CONFIRM`, action-button shadow pulse remains active, while drop-main shadow stays off.
- Fixed confirm-stage shell overlap in `src/flows/message-send-render.js`:
  - Replaced static-only control lift with measured controls-aware lift.
  - `drop-main` now lifts by `max(78, controlsHeight + 14 + 18)` when external controls are shown (`CONFIRM` or compose-check state), preventing overlap with the 3-button row.

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Visual verification still needs manual browser pass for exact perceived match in your target environment.

## Recommended next step
1. Run `send msg to hiro` flow and verify:
   - DISAMBIGUATE: drop-main has voice viz.
   - COMPOSE: only compose field has voice viz.
   - CONFIRM: shell sits above buttons with no overlap.

---

## Task title
AI message flow follow-up: restore listening orb viz + fix confirm overlap via flow-active lifecycle

## Completion status
- Completed

## Summary
- Restored command-mode listening/orb visualization responsiveness by re-enabling home-glow shadow interpolation in command mode.
- Kept stage-scoped shell behavior so only DISAMBIGUATE applies shell (`drop-main`) voice shadow; compose/confirm keep shell shadow cleared.
- Fixed confirm overlap root cause by restoring message-flow lifecycle control of stage sizing classes:
  - add `flow-active` to `#stage`/`#stage-wrap` on flow start.
  - remove `flow-active` on flow reset.
- This re-applies the dedicated flow stage height (`#stage.flow-active { height: 420px; }`) so controls are no longer forced to clamp into the shell area.

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Manual visual verification still needed for exact overlap clearance and live mic-reactivity in your browser/hardware environment.

## Recommended next step
1. Re-test `send msg to hiro` flow in browser:
   - listening/orb reacts to mic level.
   - compose: only field pulses.
   - confirm: shell sits above the 3 buttons with no overlap.

---

## Task title
AI parity pass: disambiguate→compose choreography + chip-select motion + listening/thinking glow class parity

## Completion status
- Completed

## Summary
- Restored `main`-style disambiguate→compose choreography in `src/flows/message-send.js`:
  - Added `animateToCompose(...)` sequence with `main` timing/cascade points:
    - `t=0`: intent header exit + contact row staggered exits, COMPOSE state setup, immediate morph to measured compose height.
    - `t=220ms`: rebuild compose DOM with hidden targets.
    - `t=280ms`: header fade-up (`header-enter`).
    - `t=380ms`: chip stagger-in (`chip-enter`, 70ms stagger).
    - `t=460ms`: field fade-in (`field-enter`).
    - `t=560ms`: compose blue-shadow activation (`compose-input` re-apply).
- Restored `main`-style chip-select choreography in `src/flows/message-send.js` via `selectChipWithAnimation(...)`:
  - `t=0`: staggered chip exits + chip-wrap collapse + empty-text fade + immediate container re-morph.
  - `t=300ms`: swap in selected chip message with text magic + field pulse.
  - `t=560ms`: show checkmark, force controls overlay rebuild, re-morph with controls lift.
- Restored compose-entry render semantics in `src/flows/message-send-render.js`:
  - Added `manualComposeEntry` suppression hook (`setManualComposeEntry`) to match `main` behavior during choreographed compose transition.
  - Kept normal auto compose-input re-trigger for non-manual compose entries.
- Added `home-glow-layer` opacity reset in message flow render parity path.
- Fixed startup home/thinking glow class parity regression in `src/tool/index-app.js`:
  - Changed `home-glow` toggle from `shape === 'circle'` to `shape === 'listening' || shape === 'magic'`.
  - Added `magic-glow` toggle for `shape === 'magic'`.
  - This aligns with `main` class behavior and restores vivid listening/thinking blue-layer glow visibility.
- Later retuned the deepest shared blue stop used by the listening/magic shell glow from `#0042CB` to `#001643` in the base home-glow stack so both states carry the darker blue in their bottom inset bloom.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/tool/index-app.js`
- `src/styles/ai-drop.css`
- `src/styles/ai-decorative.css`
- `context/HANDOFF.md`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).
- Source parity checks against `main:ai.html` for:
  - `glassAnimateToCompose` timing path
  - `glassChipSelect` timing path
  - compose-entry suppression behavior
  - home/thinking glow class toggles
- Browser validation after listening/magic blue-token retune on `add-visual`:
  - listening capture: `/tmp/orb-listening-001643.png`
  - magic capture: `/tmp/orb-magic-001643.png`
  - confirmed both listening and magic `#home-glow-layer` shadows now end with `rgb(0, 22, 67) 0px -70px 60px -30px inset`

## Remaining issues / caveats
- Exact frame-by-frame browser pixel diff against served `main:ai.html` baseline not run in this pass.
- Final perceptual parity still requires manual A/B run on your machine for the specific transition steps.

## Recommended next step
1. A/B test only these flows side-by-side with `main:ai.html` baseline:
   - DISAMBIGUATE -> COMPOSE transition
   - chip select in COMPOSE
   - listening/thinking glow intensity response
2. If any residual drift remains, I will patch the last mismatched selectors/timers to exact baseline values.

---

## Task title
Compose step UX tweak: single confirm button always visible

## Completion status
- Completed

## Summary
- Removed the 2s no-input gate for compose confirmation.
- In compose step, the single check/confirm button now remains visible immediately and continuously.
- Updated compose input hint text to remove the old "2s pause" behavior reference.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- None identified in this scoped change.

## Recommended next step
1. Manual verify in AI page compose step:
   - check button is present immediately on entry
   - check button does not wait for pause
   - check button remains visible while typing/clearing text

---

## Task title
AI flow parity follow-up: compose->confirm transition, thinking glow reset, line-icon confirm actions

## Completion status
- Completed

## Summary
- Restored `main` compose->non-compose transition handoff in `transitionTo(...)`:
  - when leaving COMPOSE and field has `.compose-input`, remove class and delay state switch/render by `380ms` before transitioning.
  - this restores missing header/field handoff motion when entering CONFIRM.
- Updated confirm action buttons to `main` line-SVG icons (send/edit/cancel), replacing emoji glyphs.
- Added thinking-entry glow normalization:
  - on THINKING transition, clear inline `#home-glow-layer`/`#drop-main` box-shadow overrides so base vivid layered glow style is restored.

## Files changed
- `src/flows/message-send.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Final visual sign-off still needs manual browser verification for perceived glow intensity.

## Recommended next step
1. Re-test:
   - COMPOSE -> CONFIRM: header + field handoff should animate smoothly.
   - THINKING: vivid multi-layer blue glow should no longer appear dim.
   - CONFIRM: buttons should render as line SVG icons.

---

## Task title
AI spoken responses via Gemini TTS

## Completion status
- Completed

## Summary
- Added server-side Gemini TTS endpoint `POST /api/tts` that uses `GEMINI_API_KEY` from `.env` and returns generated audio payload.
- Added client TTS player module to:
  - request Gemini TTS audio,
  - decode PCM audio and play it in browser,
  - dedupe repeated speech,
  - stop current speech on clear,
  - fallback to browser `speechSynthesis` if Gemini TTS fails.
- Wired spoken output to existing `setSimVoice(...)` path so AI responses are automatically read aloud.
- Updated `.env.example` with Gemini TTS config keys.

## Files changed
- `server.mjs`
- `src/ai/tts-player.js` (new)
- `src/sim-panel.js`
- `.env.example`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Gemini TTS model availability depends on API project access/preview entitlement.
- If upstream TTS fails, browser voice fallback is used.

## Recommended next step
1. Start server and run AI flow; confirm spoken output for AI responses.
2. If desired, tune voice via `GEMINI_TTS_VOICE` and model via `GEMINI_TTS_MODEL` in `.env`.

---

## Task title
Stage capture follow-up: fix PNG decode failures + move controls into Export section

## Completion status
- Completed

## Summary
- Hardened PNG capture pipeline in `src/shared/stage-capture.js` to reduce `EncodingError: The source image cannot be decoded` failures:
  - added XML declaration to serialized SVG
  - set `foreignObject` `x/y` explicitly
  - added rasterization fallback chain: `createImageBitmap(svgBlob)` -> `Image(blob URL)` -> `Image(data URL)`
  - retained graceful warning-only behavior on capture/clipboard failure
- Wrapped `copyStagePng()` in both runtimes with local `try/catch` so no uncaught promise errors bubble to console.
- Moved capture controls out of Legacy actions into dedicated **Export** section:
  - `ai.html`: separate `Export` block in floating debug panel
  - `index.html`: separate collapsible `Export` section in Config tab

## Files changed
- `src/shared/stage-capture.js`
- `src/ai/ai-bindings.js`
- `src/tool/index-app.js`
- `ai.html`
- `index.html`

## Validation performed
- Verified module imports for `stage-capture.js`.
- Verified button placement by direct HTML inspection in both pages.
- Ran smoke script: `node test/smoke.mjs` (fails with existing `MISSING_CHIP` in current branch state; not introduced by this change).

## Remaining issues / caveats
- Browser extensions (e.g. Zotero/inject scripts) may still emit console errors unrelated to app runtime.
- If stage contains browser-restricted/unsupported subcontent, capture can still fail gracefully and log warning.

## Recommended next step
1. Manual browser check in `ai.html` and `index.html`:
   - click `Copy PNG` and paste into Notes/Slack
   - click `Export SVG` and open downloaded file
   - verify shortcuts `Cmd/Ctrl+Shift+C` and `Cmd/Ctrl+Shift+E` still work

---

## Task title
Clear voice visualization shadow when returning to home stage

## Completion status
- Completed

## Summary
- Fixed lingering voice-viz container shadow on home re-entry.
- Added explicit visual cleanup in AI home entry paths:
  - `enterSleep(...)`
  - `enterHomeContext(...)`
- Added command-viz gating in voice engine so command-mode shadow/glow is not applied while AI is in home (not awake), preventing immediate reapplication after cleanup.

## Files changed
- `src/ai/ai-bindings.js`
- `src/ai/voice-engine.js`

## Validation performed
- Verified new hooks and gating paths by code inspection:
  - `voice?.clearVoiceVizStyles?.()` called on home entry
  - `shouldShowCommandViz` callback wired from AI bindings
- `node test/smoke.mjs` still fails on existing fullscreen-toggle click interception (pre-existing issue in this branch).

## Remaining issues / caveats
- Smoke suite failure is unrelated to this fix and remains in debug-toggle hit-testing path.

## Recommended next step
1. Manual check in `ai.html`: run message/weather flow, return to home, confirm no residual container voice shadow remains.

---

## Task title
Fix index components toggles so they actually add/remove stage components

## Completion status
- Completed

## Summary
- Fixed stage component toggles in `index.html` flow so checkbox state now drives actual UI behavior.
- Root cause: component mutations were applied to stage data, but render paths did not consume component flags for content visibility.
- Implemented two runtime fixes:
  - Editor visibility now follows stage components (`icon`, `primary`, `secondary`, `detail`, `image`).
  - Stage render content now respects component presence; removed components render as empty/absent.

## Files changed
- `src/shared/sidebar.js`
- `src/shared/sidebar-render.js`
- `src/shared/morph-layout.js`

## Validation performed
- Manual headless repro on `index.html` (`http://localhost:5211`):
  - Unchecked `primary` component toggle.
  - Confirmed checkbox state persisted (`true -> false`).
  - Confirmed `#editor-primary-field` became hidden.
  - Confirmed `#c-primary` stage text became empty.

## Remaining issues / caveats
- None found for this scoped fix.

## Recommended next step
1. Quick visual pass in browser for other component toggles (`icon`, `secondary`, `detail`, `image`) to confirm expected behavior parity.

---

## Task title
Fix prototype Legacy shape buttons (Split) no-op

## Completion status
- Completed

## Summary
- Fixed `manualShape(...)` runtime crash that prevented Legacy shape buttons from working.
- Root cause: `manualShape` unconditionally accessed optional elements (`#shape-panel`, `#input-area`) and threw when they were absent in current prototype layout.
- Added null-safe guards so Split (and other manualShape buttons) execute without throwing.

## Files changed
- `src/tool/modules/manual-demo.js`

## Validation performed
- Headless browser check on `index.html`:
  - opened Config -> Legacy / Debug
  - clicked `Split`
  - confirmed stage width changed from `420px` to `100px` (split geometry applied)

## Remaining issues / caveats
- None for this scoped fix.

## Recommended next step
1. If needed, we can re-add `#shape-panel` UI for Custom shape editing to fully restore previous Legacy custom workflow.

---

## Task title
Compose stage: remove confirm check button and auto-confirm after 2s silence

## Completion status
- Completed

## Summary
- Removed compose-stage confirm check button overlay behavior.
- Updated compose flow to auto-transition to Confirm after 2 seconds of no new dictation/input.
- Kept confirm stage actions (`send`, `edit`, `cancel`) unchanged.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- Verified compose overlay controls now render only for Confirm state (no compose checkmark rendered).
- Verified compose input handler maintains a 2s auto-confirm timer and transitions to Confirm when timer elapses.
- Updated compose hint copy to: `Auto confirm after 2s silence`.

## Remaining issues / caveats
- Existing unrelated smoke/UI flakiness in this branch remains (debug-toggle interception); not introduced by this change.

## Recommended next step
1. Manual browser pass in `ai.html`: dictate message in Compose, stop for ~2s, confirm it auto-navigates to Confirm without a compose check button.

---

## Task title
Prototype mode: add Home Context preset + AI-like Listening/Thinking legacy buttons

## Completion status
- Completed

## Summary
- Added a new built-in stage preset `home-context` (rendered as pill) for prototype mode stage library.
- Added prototype runtime style sync for `home-context` stage so primary/secondary use home-context typography treatment.
- Updated prototype Legacy / Debug section to include AI-equivalent:
  - `Listening` -> `manualShape('listening')`
  - `Thinking` -> `manualShape('magic')`
- Kept existing `Home`, `List`, `Split`, `Custom` controls.

## Files changed
- `src/shared/scenario-data.js`
- `src/tool/index-app.js`
- `src/styles/editor.css`
- `index.html`

## Validation performed
- Headless browser check on `index.html`:
  - Stage chips include `Home Context` preset.
  - Legacy `Listening` and `Thinking` buttons are clickable and morph stage geometry.

## Remaining issues / caveats
- Home-context stage uses stage content/icon from current scenario; if exact AI home-context copy/icon is required for prototype preset defaults, that should be added as a separate content-default pass.

## Recommended next step
1. If desired, I can set deterministic default content/icon for `home-context` preset (e.g., dot icon + split primary/secondary copy) so new scenarios match AI home look out of the box.

---

## Task title
Sleep -> Listening direct wake (button + wake-word), disable auto-home wake from text input

## Completion status
- Completed

## Summary
- Updated AI wake flow so sleep can transition directly to listening without going through home context morph.
- Listening trigger paths now use direct wake-listening behavior:
  - Legacy `Listening` button now calls `armAiWakeListening()`.
  - Keyboard `L` and `0` paths use `armAiWakeListening()`.
- Removed auto-home wake behavior from typed input while sleeping:
  - typing into `#sim-input` in sleep no longer calls `ensureHomeAwake()` or morphs to home/listening.
- Gated request processing so typed/chip actions don’t execute while AI is asleep unless already awake/flow-active.

## Files changed
- `src/ai/ai-bindings.js`
- `src/ai/input-actions.js`
- `ai.html`

## Validation performed
- Headless browser check on `ai.html`:
  - In sleep, typing text keeps state as `sleep` + shape `circle`.
  - Clicking `Listening` in sleep transitions to `homeState=context` and shape `listening` directly.

## Remaining issues / caveats
- Wake-word validation in automated headless run is limited by SpeechRecognition availability; path uses same `armAiWakeListening()` function as the verified button trigger.

## Recommended next step
1. Manual run with microphone: from sleep, say “hey bixby” and verify direct transition to listening without interim home-context display.

---

## Task title
Flight destination/date header + command voice visualization

## Completion status
- Completed

## Summary
- Added step-specific glass intent headers in flight flow:
  - Destination step: `where are you going?`
  - Dates step: `when?`
- Headers use the same intent-header styling/placement behavior as the existing `Which Hiro?` treatment (`glass-intent` + tracked positioning above main container).
- Enabled command-mode listening on destination and dates steps to ensure live voice-viz behavior is active.
- Added a stage class (`flight-voice-viz`) on destination/dates steps so voice visualization also applies glow/shadow to the stage container itself during those steps.
- Preserved/extended cleanup on flow reset:
  - hide intent header
  - remove `flight-destination-active` and `flight-voice-viz` classes

## Files changed
- `src/ai/ai-bindings.js`
- `src/flows/flight-booking.js`
- `src/flows/flight-render.js`
- `src/ai/voice-engine.js`

## Validation performed
- Static verification of flow wiring:
  - Flight render receives shell header callbacks and command-listening callback.
  - Destination/dates steps toggle expected stage classes and header text.
  - Voice engine now applies drop container shadow when `#stage.flight-voice-viz` is present.

## Remaining issues / caveats
- No browser run executed in this patch step; behavior should be validated in interactive AI mode for exact visual intensity/timing.

## Recommended next step
1. Manual check in `ai.html`: start flight flow and verify headers and voice glow on destination/date steps, then confirm header/extra classes clear on subsequent steps and on reset to home.

---

## Task title
Flow startup thinking hold + orb-top thinking copy

## Completion status
- Completed

## Summary
- Added a mandatory startup thinking phase for both flows (`1600ms`) before entering their first actionable step.
- Message flow startup now enters `THINKING` first and shows orb-top text `Searching contact...`.
- Flight flow startup now morphs to magic/thinking first and shows orb-top text `Initiating...`.
- Added shell-level orb-label override APIs so non-message flows can show centered text above orb:
  - `setOrbLabel(text)`
  - `clearOrbLabel()`
- Updated message flow seeded-start callers to pass seed text into `messageFlow.start(seedText)` so seeded requests respect the startup hold instead of bypassing it.

## Files changed
- `src/ai/ai-shell.js`
- `src/flows/message-send.js`
- `src/ai/input-actions.js`
- `src/flows/flight-booking.js`

## Validation performed
- Static code-path validation only:
  - both flow start paths now include `1600ms` startup timers
  - required startup copy strings are wired
  - orb-label override API is integrated into flight startup/reset

## Remaining issues / caveats
- No browser runtime test executed in this step.

## Recommended next step
1. Manual verify in `ai.html`: start send-message and book-flight flows; confirm they both show startup thinking for ~1.6s with correct copy above orb before continuing.

---

## Task title
Post-flow listening reliability + header/label polish + flight header transition fix

## Completion status
- Completed

## Summary
- Fixed a regression where re-entering listening after completing a flow sometimes looked active but did not actually listen:
  - Added passive command-listening re-arm when returning to sleep/home states.
  - Ensured `armAiWakeListening()` explicitly starts command recognition before morphing to listening.
- Tuned top labels/headers for spacing and readability:
  - Thinking/orb-top label font size reduced (20px -> 18px).
  - Orb-top label vertical offset increased upward for more gap.
  - Intent header vertical offset increased upward for more gap from container.
- Fixed flight flow header glitch during transition from startup thinking (magic) to destination:
  - Destination header is now delayed slightly after morph settles when entering from thinking.
  - Added timer cleanup to avoid stale/double header flashes.

## Files changed
- `src/ai/ai-bindings.js`
- `src/ai/ai-shell.js`
- `src/styles/ai.css`
- `src/flows/flight-render.js`

## Validation performed
- Static verification of code paths and timing logic.
- No full interactive browser pass executed in this update.

## Remaining issues / caveats
- Final motion quality should be verified manually at runtime for exact visual feel/timing.

## Recommended next step
1. Manual regression pass in `ai.html`:
   - complete message/flight flow -> re-enter listening and verify speech is captured.
   - confirm orb-top thinking text and intent headers have the new spacing.
   - confirm no header jump on flight thinking -> destination transition.

---

## Task title
GlassOS primitive refactor + broader migration (message full, flight subset)

## Completion status
- Completed

## Summary
- Added a shared primitive renderer module for glass flow UI:
  - `renderContactHeader`
  - `renderSelectionList`
  - `renderChipBar`
  - `renderTextBubble`
  - `renderInfoCard`
  - `renderActionRow`
  - `renderInputField`
  - `renderCompactStatus`
- Refactored message flow rendering to compose primitives instead of inline screen templates while keeping existing state/timer logic and CSS classes.
- Switched confirm action controls markup to the shared `renderActionRow` primitive (same visuals/icons, parent still controls selection state).
- Migrated flight flow subset to primitives:
  - options/payment rows -> `renderSelectionList` (flight variant)
  - confirm summary cards -> `renderInfoCard` (flight-confirm variant)
  - done summary -> `renderInfoCard`
- Preserved existing class-based styling and transition behavior; no visual token redesign introduced.

## Files changed
- `src/flows/ui-primitives.js` (new)
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/flows/flight-render.js`

## Validation performed
- Module import/parse validation:
  - `node -e "import('./src/flows/message-send-render.js'); import('./src/flows/message-send.js'); import('./src/flows/flight-render.js'); import('./src/flows/ui-primitives.js'); console.log('ok')"`
- No browser runtime smoke run executed in this pass.

## Remaining issues / caveats
- `flow.showCheck` remains parent-driven but is currently never set to `true` by existing runtime logic; compose paused-check visual path is implemented at primitive level but not newly activated in flow logic.
- Full visual parity should be confirmed interactively in `ai.html` for edge transitions.

## Recommended next step
1. Manual smoke in `ai.html`:
   - send-message full path (disambiguate -> compose -> confirm -> sending -> sent)
   - flight options/payment selection highlighting and confirm/done cards
2. If needed, wire the compose pause-check timing to set `showCheck=true` when required by product behavior.

---

## Task title
Flight full primitive migration + message-style list unification

## Completion status
- Completed

## Summary
- Migrated flight flow rendering to primitive-only output for all step content:
  - destination -> `renderInfoCard`
  - dates -> `renderInfoCard`
  - options -> `renderSelectionList` (message-style rows)
  - thinking -> `renderCompactStatus(loading)`
  - confirm -> `renderInfoCard` stacked sections + footer
  - payment -> `renderSelectionList` (message-style rows)
  - done -> `renderInfoCard`
- Removed remaining flight-specific list renderer usage (`rich-flight-row` path) from flight render logic.
- Extended shared primitives:
  - `renderSelectionList` now supports canonical message-style rows with `title/subtitle/detail`, icon/avatar/initials mapping, and configurable row data attribute.
  - `renderInfoCard` now supports section stacks and optional footer summary.
- Added minimal CSS for new primitive data slots (`g-contact-body`, `g-contact-subtitle`, `g-contact-detail`, `g-info-*`) while preserving existing visual language.

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/flight-render.js`
- `src/styles/ai.css`

## Validation performed
- Module parse/import check:
  - `node -e "import('./src/flows/ui-primitives.js'); import('./src/flows/flight-render.js'); import('./src/flows/flight-booking.js'); import('./src/flows/message-send-render.js'); console.log('ok')"`

## Remaining issues / caveats
- Flight-specific legacy CSS selectors (`.rich-flight-row`, destination/date legacy blocks) remain in stylesheet but are no longer used by the updated flight renderer output.
- No browser runtime smoke test executed in this pass.

## Recommended next step
1. Manual `ai.html` flight run-through to verify:
   - list rows now match message-style selection visuals
   - destination/date/confirm/done screens render correctly with primitive cards
   - keyboard focus and selection transitions remain stable.
# Handoff

## Task title
Message Compose Timing Update

## Completion status
- Completed

## Summary
- Updated the disambiguation -> compose transition timing so the compose content reveal now waits `600ms`.
- Updated compose chip open and close animation durations from `800ms` to `1000ms`.

## Files changed
- `src/flows/message-send.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send.js`
- Verified `compose-chip-in 1000ms` and `compose-chip-out 1000ms` are present in `src/styles/ai.css`

## Remaining issues / caveats
- No live browser verification was run after changing these timings.

## Recommended next step
1. Verify disambiguation -> compose now visually resolves over `600ms`.
2. Verify both chip appear and dismiss motions now run for `1000ms`.
