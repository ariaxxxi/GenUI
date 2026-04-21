# Frontend

This file is the high-level frontend implementation contract for GenUI. Detailed visual rules live under `docs/design-docs/`.

## Scope

- Prototype editor: `index.html`
- AI mode: `ai.html`
- Bubble demo: `bubble.html`
- Shared visual systems in `src/shared/` and `src/styles/`

If this file conflicts with implementation, either update this file first with an explicit decision or change implementation to match it.

## Project-Wide Rules

- Use browser-native HTML, CSS, and ES modules. Do not add a framework or build step unless explicitly requested.
- Keep shared behavior in `src/shared/` and page orchestration in page-specific modules.
- Keep UI content data-driven through stage/scenario/flow data. Avoid hardcoded one-off UI branches for reusable content.
- Do not change storage keys without documenting compatibility and migration behavior.
- Do not revert unrelated dirty files. Inspect existing modifications before editing touched files.

## Celestial Visual Rules

The Celestial visual is the shared selected/highlight/orb treatment. Its detailed reference is `docs/design-docs/celestial-visual.md`.

Source files:

- `celestial-tool.html` for visual reference and tuning.
- `src/shared/celestial-selected-presets.js` for production preset values.
- `src/shared/celestial-selection-chrome.js` for geometry, mask, color, and direction setup.
- `src/styles/shared.css` for selected chrome layers, orb-core styling, and directional animation.
- `src/styles/ai-decorative.css` for AI/prototype state behavior only.

### Celestial Ownership

- Prototype selected stage, AI thinking/listening orb, AI selected rows/options, and bubble child highlights must share the same Celestial layer stack.
- Any Celestial visual-core update must be global across GenUI Tool, AI Mode, Bubble Home, and Celestial Visual Tool.
- Do not create page-specific duplicate orb systems or product-specific Celestial layer styling.
- Do not override listening/thinking visuals locally when a shared preset/class/variable can express the change.
- Product-specific Celestial overrides are disallowed unless the user explicitly asks for a one-off exception.
- The production-compatible stack in `celestial-tool.html` is the `test-shell-*` stack. Do not copy the unused `.celestial-caustic-*` experiment as the system rule.

### Celestial Layer Stack

Every Celestial selected surface is built in this order:

1. Black base surface.
2. Masked refraction layer containing top-left and bottom-right blobs.
3. White inner glow.
4. Colored accent rim.
5. Clipped top-left white highlight.
6. Unmasked bottom-right sharp highlight.

Required production classes:

- `.g-selection-chrome`
- `.g-stage-selected-refraction`
- `.g-stage-selected-blob`
- `.g-stage-selected-blob--top-left`
- `.g-stage-selected-blob--bottom-right`
- `.g-stage-selected-highlight`
- `.g-stage-selected-accent-rim`
- `.g-stage-selected-highlight-mask`
- `.g-stage-selected-highlight-mask-image`
- `.g-stage-selected-sharp-pass`
- `.g-stage-selected-sharp-highlight`

### Celestial Geometry And Values

- Hosts must provide real width, height, and border radius before `applyAiCelestialChrome()` runs.
- `buildZeroSpreadMaskUrl(width, height, radius, maskBlur)` must generate the refraction mask.
- Unit scaling is `Math.max(0.65, Math.min(width, height) / 320)`.
- Blob size is `Math.round(Math.max(height * 1.9, Math.min(width * 0.42, height * 2.4)))`.
- Inner glow blur is `height * preset.innerGlowBlur / 56`.
- Top highlight base size is `84px x 84px`, scaled by `highlightScale / 100`.
- Bottom highlight base size is `96px x 96px`, scaled by `highlightScale / 100`.
- Bottom-right sharp highlight must not be inside the masked refraction layer.

### Celestial Presets

Use `celestialSelectedPresetForRenderShape()` for preset routing.

| Render shape | Preset |
| --- | --- |
| `pill` | `pill` |
| `orb`, `listening`, `magic`, `ai` | `orb` |
| `chip`, `list`, `dot`, `circle` | `list` |
| `card`, `card-s`, `image`, `card-form`, `card-list` | `card` |
| unknown | `chip` |

Preset values that must remain aligned with `src/shared/celestial-selected-presets.js`:

| Preset | Colors | Mask blur | Blob blur | Blob positions | Highlight scale | Inner glow blur |
| --- | --- | --- | --- | --- | --- | --- |
| `list` / `chip` | `#8fb2ef`, `#8a72eb`, `#a8bbf0`, `#572fff` | `30` | `37` | top `-26%, -36%`, bottom `45%, 38%` | `100` | `8` |
| `orb` | `#729af1`, `#8a72eb`, `#c5a0f0`, `#572fff` | `30` | `37` | top `-26%, -36%`, bottom `45%, 38%` | `100` | `8` |
| `pill` | `#4f78ee`, `#5d35ee`, `#8ea7f2`, `#572fff` | `24.5` | `52` | top `-30%, -36%`, bottom `62%, 38%` | `157` | `5` |
| `card` | `#6386ef`, `#a086ef`, `#5973ef`, `#43367a` | `10.5` | `80` | top `-27%, -55%`, bottom `27%, 58%` | `100` | `2` |

Color order is:

1. top-left core
2. top-left edge
3. bottom-right core
4. bottom-right edge

Do not collapse this to only `accentColor` and `secondaryAccentColor` unless the four color CSS variables are still resolved.

### Celestial Direction And Motion

Use `data-stage-direction="bottom|top|left|right"` on the chrome root.

Directional start offsets:

- Blobs move from `92%` outside the active direction.
- Highlights move from `22px` outside the active direction.

Moving between vertical children must use `syncDirectionalSelection()`:

- Moving down: old item exits `bottom`, new item enters `top`.
- Moving up: old item exits `top`, new item enters `bottom`.
- No previous item: selected item enters from `bottom`.

Layer timing:

- Rim and inner glow: `420ms var(--motion-ease)`.
- Blobs and white highlights: `700ms var(--motion-ease)`.
- Blob/highlight filter changes: `450ms var(--motion-ease)`.
- Shared ease: `cubic-bezier(0.35, 0.23, 0.13, 0.98)`.

### AI Orb Rules

- Detailed orb ownership and reuse rules live in `docs/design-docs/ai-orb.md`.
- AI thinking and listening must use the same `.g-stage-selected-*` layer stack as Celestial selected chrome.
- Orb core classes live in `src/styles/shared.css` as `.g-celestial-orb-*`, and shared orb DOM is created from `ensureSharedAiOrb()` in `src/shared/celestial-selection-chrome.js`.
- When a task asks to add a listening/thinking orb anywhere in the project, use the shared orb source of truth by default. Do not create a page-local orb variant unless the user explicitly asks for one.
- Thinking keeps the full layer stack visible and breathes at `4.2s`; bridge/thinking acceleration uses `1.5s`.
- Listening hides refraction blobs but keeps rim and inner glow visible.
- Listening uses `--ai-listening-rim-level` from microphone analyser state.
- At volume `0`, listening mode must still show a subtle colored rim. It must not become pure black.
- Prototype mode must not invent separate listening/thinking orb styling; it should reuse the AI/Celestial setup.

## Stage And Layout Rules

- Glasses frame content must fit inside the 420px-wide UI.
- AI mode stage UI must stay inside the 420x420 stage and must not overflow.
- Glasses frame outline must be visual-only and must not clip content.
- Container alignment rules must stay consistent across transitions.
- Stage edits are scenario-independent. Creating, deleting, or editing stages in one scenario must not mutate other scenarios.
- Predefined stages must exist in new scenarios by default.
- Stage component visibility must honor configured presence rules for `icon`, `primary`, `secondary`, `detail`, `image`, and `intent-header`.
- Multiple image/detail/list items must render from data; do not render only the first item unless explicitly requested.
- Missing content must collapse naturally with no phantom rows or gaps.
- Card, pill, and card-s spacing must honor configured/default values.

## Prototype Editor Rules

- The prototype editor is coordinated by `src/tool/index-app.js`.
- Sidebar rendering and editing belong in `src/shared/sidebar*.js`.
- Stage data normalization belongs in `src/shapes.js` and `src/shared/scenario-data.js`.
- Stage buttons support double-click inline rename; single-click selection must still work after the double-click guard delay.
- Scenario buttons support the same double-click inline rename pattern.
- List stage controls must include list item +/- controls and bottom orb toggle/icon settings in the Stage Components tab.
- List-to-other-stage transitions must go to the correct target stage and must not always route through pill.

## AI Flow Rules

- AI mode orchestration belongs in `src/ai/ai-bindings.js`.
- Flow state machines belong in `src/flows/`.
- Flow rendering must use shared UI primitives where possible.
- Browser code must call server APIs instead of provider APIs directly.
- Critical AI interactions must have typed/click fallback paths because SpeechRecognition and microphone permissions are browser-dependent.
- No debug/helper instruction text may appear unless explicitly requested.

### Flight Flow Contract

- Entry chip label: `Book a flight`.
- Required order:
  1. destination
  2. dates
  3. passengers
  4. thinking hold
  5. choose flight
  6. confirm
  7. payment
  8. booked confirmation
- Destination and date screens must preserve shared top-row layout continuity.
- After both dates are collected, remain on date UI until explicit confirm intent.
- `change date` from confirm routes back to date UI.
- After date update from confirm-path, route back to confirm directly.
- Every progression reply must confirm captured data and ask the next question.
- Deterministic fallback UI must render when the AI provider is unavailable.

## Typography And Spacing Rules

- Stage typography must be constrained through the stage/scenario typography model.
- Chips, input, chat, and flow text sizes are mode-scoped and must not leak into stage typography defaults.
- Current defaults unless explicitly changed:
  - Pill/Card-S icon left padding: `16px`
  - Pill/Card-S icon right padding: `8px`
  - AI card primary text: `28px`
  - Pill primary-secondary gap: `2px`
- Seeded scenarios must use meaningful copy. Do not seed generic labels like `Primary text`.

## Server And Route Rules

- `server.mjs` is the static server and API proxy.
- Keep route names aligned between client, server, and docs.
- Provider-routed AI calls use `POST /api/ai-route`.
- Gemini JSON calls use `POST /api/gemini`.
- TTS calls use `POST /api/tts`.
- Phrase config uses `GET /api/phrases` and `POST /api/phrases`.
- Bubble aliases `/bubble` and `/bubble2` must serve the existing `bubble.html`.

## Known Mistakes To Avoid

- Do not report completion without verifying the exact selector and numeric values changed.
- Do not implement “close” values when exact values were requested.
- Do not silently keep hidden delays when asked to remove a delay.
- Do not leave orphan helper copy from old flows.
- Do not couple scenario state through shared references; clone and normalize per scenario.
- Do not introduce initialization-order regressions such as `Cannot access X before initialization`.
- Do not fork Celestial visuals per page.
- Do not put the bottom-right Celestial highlight under the refraction mask.
- Do not hide the listening orb rim at zero volume.

## Pre-Merge Verification Checklist

- Prototype editor stage switching, double-click rename, scenario rename, list item +/- controls, and list bottom orb controls still work.
- AI thinking and listening orbs visually match the shared Celestial rule.
- Listening mode at volume `0` still shows a subtle rim.
- Bubble child hover/selection uses directional Celestial motion.
- Glasses mode does not clip 420px content.
- AI stage content does not overflow 420x420.
- Flight flow order and edit-back behavior still match the contract.
- No-AI fallback still renders predefined flow UI.
- Scenario/stage changes remain scenario-independent.
- Server route aliases resolve to existing HTML files.

## Change Log Template

- Request:
- Exact constraints:
- Files touched:
- Verified selectors/values:
- Validation steps executed:
- Regressions checked:
