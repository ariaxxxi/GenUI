# Task

## Title
Refactor: Extract flows, CSS, and shared modules from `ai.html` and `index.html`

## Status
Ready for implementation

## Objective
Both pages are monolithic files totaling ~15,000 lines. They duplicate CSS, rendering logic, and shape functions. This refactor creates a clean module structure so both pages are thin orchestrators, shared code lives in `src/`, and adding a new flow is one file.

| File | Current lines | Target after refactor |
|---|---|---|
| `ai.html` | 9,227 | ≤ 1,200 |
| `index.html` | 6,165 | ≤ 1,000 |

**Behavior is 100% identical after every step. No new features, no visual changes.**

---

## Constraints
- No framework, no bundler — vanilla JS, ES modules only
- Files served as-is by `server.mjs` (already handles static files)
- `src/shapes.js` is the established pattern for shared ES modules
- `morphTo()` and the core rendering system must not change behavior
- `index.html` currently uses `<script>` (not module) — conversion to module requires explicit `window.*` exports for any function called from inline `onclick` attributes

---

## Final file structure

```
src/
  shapes.js                  (unchanged)
  shapes.legacy.js           (unchanged)
  morph.js                   (new) — morphTo, morphCore, applyGeometry, applyContent, bridges
  sim-panel.js               (new) — addSimLog, setSimVoice, setSimInputState (ai.html only)
  voice-engine.js            (new stub) — Web Speech API wrapper
  sidebar.js                 (new) — scenario/stage editor logic (index.html only)
  styles/
    shared.css               (new) — CSS identical in both pages
    ai.css                   (new) — ai.html-specific styles (sim panel, frame modes, etc.)
    editor.css               (new) — index.html-specific styles (sidebar, input area)
    message-flow.css         (new) — send message flow component styles
    flight-flow.css          (new) — flight booking component styles
  flows/
    message-send.js          (new) — GlassOS send message state machine
    flight-booking.js        (new) — flight booking state machine
```

`ai.html` after refactor: HTML + `<link>` tags + `<script type="module">` importing flows + core rendering + flow registry (~1,200 lines)

`index.html` after refactor: HTML + `<link>` tags + `<script type="module">` importing sidebar + core rendering (~1,000 lines)

---

## Part A — Shared CSS extraction (both pages)

Both pages have identical CSS section headers. Before extracting JS, get the CSS under control. This is the safest first step — pure copy/paste, no logic changes.

### Step A1 — Identify shared CSS blocks

Diff the CSS sections between the two files. Sections with the same comment header that are **byte-for-byte identical or functionally equivalent** move to `src/styles/shared.css`. Sections that differ stay page-specific.

Likely shared (verify before moving):
- `/* ── Drop shell ── */` — `.drop`, `#drop-main`, `#drop-left`, `#drop-right`
- `/* ── Generic content elements ── */` — `#c-primary`, `#c-secondary`, `#c-detail`, `#c-thumb`, `#c-media`, `#c-divider`, `#c-rich`
- `/* ── Stage ── */` — `#stage`, `#stage-wrap`, `#drop-main` sizing
- `/* ── Intent header ── */` — `#intent-header`, `#intent-label`, `#intent-step-dot`
- `/* ── Metaball orb ── */` — `#siri-orb`, `#siri-canvas`
- `/* ── List pills ── */` — `#list-pills`, `.list-pill`
- `/* ── Stars ── */`, `/* ── Wordmark ── */`
- `@keyframes` that exist in both files: `spin`, `pulse`, `float`, `fadeUp`
- Sidebar + editor styles (`/* ── Sidebar ── */`, tab bars, layer rows) — shared if identical

**Do not merge if the values differ** — keep the page-specific version in the page-specific file and note the divergence.

### Step A2 — `src/styles/shared.css`

Create this file with the verified-identical CSS blocks from Step A1.

### Step A3 — `src/styles/ai.css`

Everything in `ai.html`'s `<style>` block that is NOT in `shared.css`:
- `#sim-panel`, `#sim-input`, `#sim-dot`, `#sim-voice-out`, `#sim-log`, `#sim-kbd`, `#sim-mic` (all sim panel)
- `body.mode-ai` layout rules
- `#home-glow-layer`
- Any rules that ai.html modified vs the shared version

### Step A4 — `src/styles/editor.css`

Everything in `index.html`'s `<style>` block that is NOT in `shared.css`:
- `/* ── Input area ── */` — `#input-area`, `#input-wrap`, `#user-input`, etc.
- Any sidebar rules that differ from ai.html's sidebar
- Any editor-specific rules

### Step A5 — `src/styles/message-flow.css`

All send message flow component styles from `ai.html`:
- `.g-*` classes (`.g-contacts`, `.g-contact-row`, `.g-avatar`, `.g-chip`, `.g-chips`, `.g-listen-field`, `.g-compose-card`, `.g-action-row`, `.g-action-btn`, `.g-checkmark`, `.g-pill-content`, `.g-header-row`, `.g-pill-state`)
- `.compose-input` and pseudo-elements
- `#glass-controls-layer` and children
- `@keyframes` specific to message flow

### Step A6 — `src/styles/flight-flow.css`

All flight booking component styles from `ai.html` (if any dedicated CSS exists). Can be empty if flight flow uses only generic component styles.

### Replace `<style>` blocks

**`ai.html`** — replace entire `<style>` block with:
```html
<link rel="stylesheet" href="src/styles/shared.css"/>
<link rel="stylesheet" href="src/styles/ai.css"/>
<link rel="stylesheet" href="src/styles/message-flow.css"/>
<link rel="stylesheet" href="src/styles/flight-flow.css"/>
```

**`index.html`** — replace entire `<style>` block with:
```html
<link rel="stylesheet" href="src/styles/shared.css"/>
<link rel="stylesheet" href="src/styles/editor.css"/>
```

### Validate Step A
- Both pages load without visual regression
- `node test/smoke.mjs` passes
- Manual check: shapes morph, sidebar renders, send message flow styles intact

---

## Part B — Shared JS: morph system + convert index.html to module

### Step B1 — Extract `src/morph.js` (shared morphing system)

Both pages contain `morphTo()` and the full bridge/transition system. This is the highest-value shared extraction. Move to `src/morph.js`.

**Move from both pages to `src/morph.js`:**
- `morphTo(shape, content, geo, stageId)`
- `morphCore(geo, durationMs, easingFn)`
- `applyGeometry(geo, els)`
- `applyContent(content, els, shape)`
- `applyContentPositions(shape, w, h)`
- `resolveGeometryForContent(shape, content, stageId)`
- `getCardLayoutMetrics(...)`, `getCardSLayoutMetrics(...)`
- All bridge functions: `bridgeFromSplitToTarget`, `bridgeToSplitViaDot`, `bridgeFromListToTarget`, `bridgeHomeToThinking`, `bridgeThinkingToHome`, `bridgeFromThinkingToTarget`
- `runMainDeformation()`, `deformationIntensity()`, `shouldUseStrongDeform()`
- `applyGeometryWithDelay()`, `clearUiFadeTimers()`
- `applyCardDetailLayout()`, `applyTypographyStyles()`
- `applyCardMediaLayout()`, `applyOutgoingCardMediaLayout()`
- `applyThumbVisualMode()`, `isIconOnlyThumb()`
- `setOpacityWithDelay()`
- `clearSplitTimers()`, `scheduleSplitTimer()`, `clearSplitAnimationOverlays()`
- `ensureStageMediaEls()`, `hideAllStageMedia()`
- Timer/easing helpers: `transitionAnimMs()`, `cardHeightForTransition()`, `cardDurationBonusMs()`, `splitBridgeMs()`, `listBridgeMs()`, `thinkingBridgeMs()`, `getActiveEasing()`

`src/morph.js` imports from `src/shapes.js` (already an ES module). Both pages import from `src/morph.js`.

**Export pattern:**
```js
// src/morph.js
import { SHAPES, configureShapeHelpers } from './shapes.js';

export function morphTo(shape, content, geo, stageId) { ... }
export function morphCore(geo, durationMs, easingFn) { ... }
// ... all bridge and geometry functions ...
```

**Risk:** `morphTo` and bridges reference DOM elements (`els` object, `#drop-main`, etc.) that are defined in the calling page. These must be passed in as parameters or injected via an `init(els)` call. Choose one approach and apply consistently:

**Recommended approach — init injection:**
```js
// src/morph.js
let _els = null;
export function initMorph(els) { _els = els; }
// All morph functions use _els instead of accessing DOM directly
```

Both pages call `initMorph(els)` once after DOM is ready.

### Step B2 — Convert `index.html` to ES module

Change `<script>` to `<script type="module">` and add imports:
```html
<script type="module">
  import { SHAPES, normalizeTypography, defaultTypographyForShape, ... } from './src/shapes.js';
  import { initMorph, morphTo, ... } from './src/morph.js';
```

**Remove all functions from `index.html` that are already in `src/shapes.js`:**
- `normalizeTypography()`, `normalizeTypographyByShape()`, `defaultTypographyForShape()`
- `normalizeStage()`, `normalizeIcon()`, `normalizeImagesByShape()`
- `configureShapeHelpers()` and any other exports from `src/shapes.js`

Verify the function signatures match before deleting — if `index.html` has a modified version, note the difference in `context/decisions.md` before merging.

**Critical: inline `onclick` handlers.** Converting to `type="module"` removes functions from global scope. Any function called via `onclick="foo()"` must be explicitly exposed:
```js
// At the end of the module, expose all functions used in inline HTML handlers:
Object.assign(window, {
  addScenario, deleteScenario, duplicateScenario,
  addStage, deleteCurrentStage, resetCurrentStageToDefault,
  fireChip, handleSend, openCustom, applyCustomShape,
  commitScenarioChange, selectListItem,
  // ... audit every onclick in index.html HTML and add here
});
```

Audit step: grep index.html HTML for `onclick=`, `onchange=`, `oninput=`, `onblur=` — every referenced function must be in the `window.*` block.

### Step B3 — Extract `src/sim-panel.js` (ai.html only)

Move from `ai.html` to `src/sim-panel.js`:
- `addSimLog(text, type)`
- `setSimVoice(text)`
- `setSimInputState({ label, placeholder, hint, dictating })`
- `updateMicIndicator(voiceEngine)`

```js
// src/sim-panel.js
export function addSimLog(text, type = 'system') { ... }
export function setSimVoice(text) { ... }
export function setSimInputState(opts) { ... }
export function updateMicIndicator(voiceEngine) { ... }
```

### Step B4 — Create `src/voice-engine.js` stub

Stub module — wire-compatible interface for future voice input implementation.

```js
// src/voice-engine.js
// Stub — no-op until voice input task is implemented. See context/todos.md.
export const voiceEngine = {
  recognition: null, supported: false, active: false, mode: 'off', restartOnEnd: false,
  start(mode) { this.mode = mode; },
  stop() { this.mode = 'off'; this.active = false; },
};
export function initVoiceEngine() { /* stub */ }
```

### Validate Part B
- Both pages load and render correctly
- `morphTo()` transitions work (smoke test + manual)
- `index.html` scenario add/edit/delete still works
- `node test/smoke.mjs` passes

---

## Part C — `ai.html` flow extraction

### Flow interface contract

Every flow module exports a default object:

```js
export default {
  id: 'message-send',
  chipLabel: 'Send a message to Hiro',

  start(context) {},   // begin flow; context = FlowContext (see below)
  reset() {},          // stop flow, clean up timers, restore panel defaults
  handleKey(e) { return false; },  // return true if key consumed
  handleInput(text, isFinal) {},   // text input (typed or voice)
};
```

**FlowContext** — what `ai.html` passes to every flow:
```js
{
  morphTo,              // from src/morph.js
  els,                  // DOM ref object
  setIntentHeader,      // (text) → void
  hideIntentHeader,     // () → void
  hideRich,             // () → void
  addSimLog,            // from src/sim-panel.js
  setSimVoice,          // from src/sim-panel.js
  setSimInputState,     // from src/sim-panel.js
  voice: voiceEngine,   // from src/voice-engine.js
  simInput,             // #sim-input DOM element
}
```

Flows only use `context.*` — never global variables from `ai.html`.

### Step C1 — Extract `src/flows/message-send.js`

Move from `ai.html` into `src/flows/message-send.js`:

**Data (module-private):**
- `GLASS_CONTACTS` array
- `GS` enum
- `glassUi` state object
- `glassPauseTimer`, `glassDotsTimer`
- `GLASS_TOP_INSET`, `GLASS_BOTTOM_INSET`, `GLASS_CONTROLS_GAP`

**All functions prefixed or related to glass/send message flow:**
- `startGlassFlow` → `start(context)`
- `glassReset` → `reset()`
- `glassTransitionTo`, `glassRender`, `glassConfirm`, `glassDismiss`, `doGlassAction`
- `parseGlassVoice`, `handleGlassInputSubmit`, `handleGlassInputChange`
- `onTranscriptUpdate`, `parseIntent`, `parseDisambiguateVoice`, `speakOutput`
- `findContacts`, `maxGlassSel`, `addGlassLog`, `clearGlassTimers`, `cancelGlassMeasure`
- All `buildGlass*` content builder functions
- `renderGlassControlsOverlay`, `glassContentHeightPx`, `updateGlassSelectionUiOnly`

Global-to-context mapping (all references inside the module must use `_ctx`):

| Current global | `_ctx` equivalent |
|---|---|
| `morphTo(...)` | `_ctx.morphTo(...)` |
| `els.rich` | `_ctx.els.rich` |
| `els.glowLayer` | `_ctx.els.glowLayer` |
| `setIntentHeader(t)` | `_ctx.setIntentHeader(t)` |
| `hideIntentHeader()` | `_ctx.hideIntentHeader()` |
| `addSimLog(t, type)` | `_ctx.addSimLog(t, type)` |
| `setSimVoice(t)` | `_ctx.setSimVoice(t)` |
| `setSimInputState(o)` | `_ctx.setSimInputState(o)` |
| `input` | `_ctx.simInput` |
| `voiceEngine` | `_ctx.voice` |
| `hideRich()` | `_ctx.hideRich()` |
| `document.getElementById('glass-controls-layer')` | `_ctx.els.glassControlsLayer` |

### Step C2 — Extract `src/flows/flight-booking.js`

Move from `ai.html` into `src/flows/flight-booking.js`:

**Data (module-private):**
- `FLIGHT_FLOW_STEPS` array
- `flightUi` state object
- City/airport lookup tables

**All functions:**
- `startFlightFlow` → `start(context)`
- `resetFlightFlowToHome` → `reset()`
- `flightStep`, `setFlightStep`, `resetFlightData`
- `renderFlightStep`, `flightNextStep`, `flightBackStep`, `confirmFlightStep`
- `moveFlightHighlight`, `syncFlightDestinationFromText`
- `callGeminiFlightAction`, `handleFlightUserInput`, `localFlightFallback`
- `normalizeCity`, `cityToAirport`
- All `buildFlight*` / `renderFlight*` content builder functions

### Step C3 — Flow registry in `ai.html`

```js
import messageSend from './src/flows/message-send.js';
import flightBooking from './src/flows/flight-booking.js';

const FLOWS = [messageSend, flightBooking];
let activeFlow = null;

function flowContext() {
  return { morphTo, els, setIntentHeader, hideIntentHeader, hideRich,
           addSimLog, setSimVoice, setSimInputState,
           voice: voiceEngine, simInput: input };
}

function activateFlow(flow) {
  if (activeFlow && activeFlow !== flow) activeFlow.reset();
  activeFlow = flow;
  flow.start(flowContext());
}
```

Replace `handleChipQuickAction` to use registry:
```js
function handleChipQuickAction(text) {
  const t = text.trim().toLowerCase();
  const flow = FLOWS.find(f => t.includes(f.chipLabel.toLowerCase()));
  if (flow) { activateFlow(flow); return true; }
  // weather / timer / call remain inline (no flow module needed)
  ...
}
```

Replace global keydown and `#sim-input` listeners to delegate to `activeFlow`.

### Validate Part C
- `send msg to hiro` chip → full message flow works
- `book a flight` chip → full flight flow works
- Esc resets active flow
- `node test/smoke.mjs` passes

---

## Part D — `index.html` editor extraction

### Step D1 — Extract `src/sidebar.js`

The sidebar is `index.html`'s equivalent of a flow — it is the primary interactive system unique to that page.

Move from `index.html` to `src/sidebar.js`:
- `renderScenarioList()`, `renderScenarioEditor()`, `renderScenarioUi()`
- `renderScenarioStageChips()`, `renderScenarioMediaEditor()`
- `commitScenarioChange()`, `commitStageChange()`
- `addScenario()`, `duplicateScenario()`, `deleteScenario()`
- `addStage()`, `deleteCurrentStage()`, `resetCurrentStageToDefault()`
- `bindTypographyInputs()`, `updateLayerPreviews()`
- `initSidebarTabs()`, `initLayerRowToggles()`, `initSidebarCollapsibleSections()`
- `renderAiStageOverrideUi()`, `previewAiStageOverride()`
- `isSupportedAssetFile()`
- All `commitPhone*`, `commitStage*` event handlers

```js
// src/sidebar.js
// Depends on: src/morph.js (for previewScenario), src/shapes.js
export function initSidebar(context) { ... }
// context: { previewScenario, scenarios, stages, persistScenarios, ... }
```

### Step D2 — What stays in `index.html`

After extraction, `index.html`'s module contains:
- `loadScenarioLibrary()`, `persistScenarios()` (storage layer)
- `selectedScenario()`, `previewScenario()`
- `handleSend()`, `fireChip()`, `handleManualRequest()`
- `manualShape()`, `openCustom()`, `applyCustomShape()`
- Canvas settings: `applyCanvasSettings()`, `loadCanvasSettings()`, `persistCanvasSettings()`
- Orb/intent header: `showAiIdle()`, `startSiriOrb()`, `stopSiriOrb()`, `setIntentHeader()`, `hideIntentHeader()`
- List pills: `morphToList()`, `buildListPill()`, `clearListPills()`, `selectListItem()`
- Animation/easing controls: `parseBezierInput()`, `rebuildAnim()`, `setAnimDuration()`
- Init code and event binding

### Validate Part D
- `index.html` loads and renders correctly
- Scenario create/duplicate/delete works
- Stage add/delete/reset works
- Typography and style editing works
- Shape morphs on scenario selection
- No JS errors in console

---

## Implementation order

Do parts in order — each part is independently validatable:

1. **Part A** (CSS) — zero logic risk, validate visually
2. **Part B** (shared JS + index.html module conversion) — validate both pages
3. **Part C** (ai.html flows) — validate ai.html flows
4. **Part D** (index.html sidebar) — validate index.html editor

Do NOT attempt multiple parts at once. Each part ends with a smoke test pass.

---

## Files to inspect

**ai.html:**
- Lines 8–2142 — CSS to split (Part A)
- Lines 2619–9225 — JS module to split (Parts B, C)
- Lines ~5542–5555 — `GS`, `glassUi`, `GLASS_CONTACTS`
- Lines ~4993–5010 — `flightUi`, `FLIGHT_FLOW_STEPS`
- Lines ~7725–7756 — `#sim-input` event listeners
- Lines ~6222–6281 — `handleChipQuickAction`
- Lines ~6296–6351 — global `keydown` listener

**index.html:**
- Lines 8–1311 — CSS to split (Part A)
- Lines 1700–6163 — `<script>` block to convert (Parts B, D)
- All `onclick=`, `onchange=`, `oninput=`, `onblur=` attributes in HTML — audit for `window.*` exposure

**Both:**
- `src/shapes.js` — reference for module pattern; functions here must not be duplicated in either page

## Files allowed to change
- `ai.html`
- `index.html`
- `src/` (new files created here)
- `context/architecture.md` (update after completion)

## Files must not change
- `server.mjs`
- `test/smoke.mjs`
- `src/shapes.js`
- `src/shapes.legacy.js`

---

## Acceptance criteria

- [ ] `ai.html` is ≤ 1,200 lines
- [ ] `index.html` is ≤ 1,000 lines
- [ ] No CSS `<style>` blocks in either page — only `<link>` tags
- [ ] `src/styles/shared.css` exists; no CSS duplicated between `ai.css` and `editor.css`
- [ ] `src/morph.js` exists; `morphTo()` not defined in either HTML file
- [ ] `src/flows/message-send.js` exists; no glass/send message functions in `ai.html`
- [ ] `src/flows/flight-booking.js` exists; no flight functions in `ai.html`
- [ ] `src/sidebar.js` exists; no scenario editor render functions in `index.html`
- [ ] `src/sim-panel.js` exported and imported correctly in `ai.html`
- [ ] `src/voice-engine.js` stub exists with correct interface
- [ ] Flow modules use only `_ctx.*` — no direct global access
- [ ] `index.html` uses `<script type="module">` with `window.*` exports for all inline handlers
- [ ] Adding a new flow to `ai.html` requires: one new file in `src/flows/`, one line in `FLOWS` array
- [ ] `index.html` full editor works: create/duplicate/delete scenario, edit stage, typography
- [ ] `ai.html` full flight flow works end-to-end
- [ ] `ai.html` full send message flow works end-to-end
- [ ] `node test/smoke.mjs` passes
- [ ] `context/architecture.md` updated to reflect new module structure

---

## Risks / notes

- **CSS diff before merge** — do not assume shared CSS sections are identical. Open both files side by side and diff each section. If values differ by even one property, keep them separate.
- **`index.html` inline handlers** — this is the highest-risk step. Missing one `window.*` export will silently break a UI interaction. Grep for every `onclick`, `onchange`, `oninput`, `onblur` before and after conversion.
- **`morphTo` DOM dependency** — the morph system reads `els` (the DOM ref object). Use the `initMorph(els)` injection pattern so `src/morph.js` doesn't import from the page. Both pages call `initMorph(els)` once after DOM is ready.
- **`src/shapes.legacy.js`** — not affected. It is the `file://` fallback for index.html before module conversion. After index.html is converted to a module, `file://` loading will no longer work anyway (ES modules require HTTP). Document this in `decisions.md`.
- **Voice task ordering** — voice input implementation (in `context/todos.md`) must run AFTER this refactor. The voice engine should land in `src/voice-engine.js` (stub created in Step B4) and `onTranscriptUpdate` in `src/flows/message-send.js`. Do not implement voice into the current monolithic file.
- **`flightUi.active` / `glassUi.active` references** — after extraction, `ai.html` cannot read these directly. The `activeFlow` variable replaces both: `activeFlow?.id === 'flight-booking'` instead of `flightUi.active`. Audit before deleting originals.
- **`resetFlightFlowToHome()` called from glass flow** — `activateFlow(messageSend)` handles this automatically via `activeFlow.reset()` on the previous flow. No explicit cross-flow call needed.
