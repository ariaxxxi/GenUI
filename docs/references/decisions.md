# Decisions

## Current Architectural Decisions

### Browser-native implementation

The project stays as plain HTML, CSS, and ES modules. There is no bundler, framework, or compile step.

Rationale:

- Keeps prototype iteration fast.
- Makes generated UI behavior easy to inspect in the browser.
- Avoids framework structure while the interaction model is still changing.

Implication:

- New modules must be imported directly from page entrypoints.
- Shared code must remain browser-compatible ES modules.

### Separate pages share core systems

Prototype editor, AI mode, and bubble demo remain separate pages, but they share reusable rendering and visual primitives.

Rationale:

- The pages have different control surfaces.
- The morph/celestial systems should not diverge visually.

Implication:

- Put reusable visual behavior in `src/shared/` and shared CSS.
- Page coordinators decide when to use shared behavior, not how it is implemented.

### Stage and scenario data are map-driven

Stage definitions and scenario content use normalized maps keyed by shape/stage instead of hardcoded per-screen branches.

Rationale:

- New stages, list items, icons, images, and selected states should be data changes where possible.
- Prototype and AI mode need to render the same conceptual content in different control contexts.

Implication:

- Extend `src/shapes.js` and `src/shared/scenario-data.js` first when adding data fields.
- Do not add one-off DOM branches for content that belongs in the scenario model.

### Shared morph pipeline

The morph visual state machine is split into layout, bridge, and render modules.

Rationale:

- Geometry calculation, transition paths, and DOM writes are different concerns.
- The same morph behavior is needed by prototype and AI mode.

Implication:

- `src/shared/morph-layout.js` should own measurements and geometry.
- `src/shared/morph-bridges.js` should own intermediate transition rules.
- `src/shared/morph-render.js` should own DOM/CSS updates.
- `src/shared/morph.js` should remain the coordinator.

### One celestial visual system

Thinking/listening orbs, selected stage chrome, AI selected rows/options, and bubble hover highlights should use the shared celestial visual values and helpers.

Rationale:

- Page-specific orb overrides caused visual drift.
- Recent user direction explicitly requires AI mode and prototype mode to share the same celestial visual.

Implication:

- Prefer `src/shared/celestial-selection-chrome.js`, `src/shared/celestial-selected-presets.js`, and `src/styles/shared.css`.
- Use `src/styles/ai-decorative.css` only for AI/prototype state behavior, not Celestial core values.
- Remove or avoid page-local overrides that recreate orb/chrome behavior.
- Keep listening/thinking logic intact when only visual values need to change.

### List stage bottom orb is part of stage data

The list stage can show a bottom listening orb controlled by the stage data field `listListeningOrb`.

Rationale:

- The list-stage orb must be configurable from the Stage Components tab.
- Icon behavior should use the same component data path as other stage icons.

Implication:

- Keep bottom orb toggles and icon settings in the stage editor path.
- Do not implement list orb visibility as unrelated page state.

### AI flows own their own state machines

Message sending, flight booking, and coffee ordering live in `src/flows/` and expose coordinator-friendly APIs.

Rationale:

- Flow state should be testable and replaceable without modifying the AI shell.
- Future LLM/STT integrations should plug into flow boundaries.

Implication:

- Keep flow-specific rendering and state transitions inside each flow module.
- Route commands through `src/ai/input-actions.js` or a narrow flow API rather than directly manipulating flow internals.

### Server proxies provider APIs

Browser code calls local API routes, not provider APIs directly.

Rationale:

- API keys and provider-specific request formats belong on the server side.
- The UI should be able to switch provider behavior without changing page modules.

Implication:

- Use `POST /api/ai-route` for provider-routed AI requests.
- Use `POST /api/gemini` for Gemini JSON extraction behavior.
- Use `POST /api/tts` for Gemini TTS.

### Voice uses browser SpeechRecognition and analyser APIs

The voice engine uses browser-native recognition and microphone analysis.

Rationale:

- This keeps voice interaction lightweight for the prototype.
- The analyser drives listening orb rim reactivity.

Implication:

- AI voice behavior depends on browser support and microphone permission.
- Always provide typed/click fallback paths for critical interactions.

### Durable backup mirrors localStorage

Some state is persisted through both localStorage and IndexedDB durable records.

Rationale:

- localStorage is convenient for the prototype.
- IndexedDB records provide a recovery-friendly persistence layer.

Implication:

- Keep storage reads/writes centralized in `src/app-state.js`.
- Do not add new storage keys without documenting them in architecture/status.

### Harness-style docs structure

The repository uses a short `AGENTS.md`, a root `ARCHITECTURE.md`, and progressive-disclosure documentation under `docs/`.

Rationale:

- The repository memory should be discoverable without chat history.
- `AGENTS.md` should be a map and role contract, not the full project manual.
- High-level uppercase docs provide stable instruction entry points.
- Detailed docs live in subfolders so agents can choose only the context they need.

Implication:

- Active work lives in `docs/exec-plans/active/current.md`.
- Execution results live in `docs/exec-plans/completed/handoff.md`.
- Celestial visual rules live in `docs/design-docs/celestial-visual.md`.
- Context freshness is checked from `docs/QUALITY_SCORE.md`.

### Celestial visual core is global

Celestial selected/highlight/orb visuals must be changed through shared presets, shared chrome JS, and `src/styles/shared.css`.

Rationale:

- GenUI Tool, AI Mode, Bubble Home, and Celestial Visual Tool should inherit visual-core updates automatically.
- Product-by-product orb overrides caused visual drift and repeated fixes.

Implication:

- Do not add product-specific Celestial CSS or value overrides unless the user explicitly requests a one-off exception.
- Page-specific files may control state and layout, but not redefine Celestial layer values, mask math, orb core styling, or directional motion.

## Corrections From Older Docs

- The prototype entrypoint is `src/tool/index-app.js`, not `src/index-app.js`.
- The AI entrypoint is `src/ai-app.js`, which imports `src/ai/ai-bindings.js`.
- The provider route is `POST /api/ai-route`, not `POST /api/ai`.
- `/bubble` and `/bubble2` serve the existing `bubble.html`.
- The active task slot is `docs/exec-plans/active/current.md`.
