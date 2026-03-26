# AI Page Project Structure (Current State)

This file describes how the current `ai.html` page is structured so another agent can onboard quickly and make safe changes.

## 1) Entry Points

- HTML shell: `ai.html`
- JS bootstrap: `src/ai-app.js`
- Runtime initializer: `src/ai/ai-bindings.js`

`src/ai-app.js` only imports `src/ai/ai-bindings.js`; all runtime wiring happens there.

## 2) High-Level Module Layout

### Core AI runtime
- `src/ai/ai-bindings.js`
  - Creates refs to stage DOM (`drop-main`, `c-rich`, etc.)
  - Loads settings/state from localStorage
  - Wires morph engine, shell, voice engine, scenario/sidebar, message flow, flight flow
  - Owns home/sleep/listening wake logic (`hey bixby`, `L`, legacy listening button)
  - Registers keyboard shortcuts + exposes globals for debug buttons

- `src/ai/ai-shell.js`
  - Intent header positioning and visibility
  - Orb label logic above the orb
  - AI visual bridge helpers (thinking/listening transitions)

- `src/ai/voice-engine.js`
  - Speech recognition loop (command/dictation modes)
  - Voice visualization shadows/glow
  - TTS echo suppression logic

- `src/ai/input-actions.js`
  - Quick intent routing from typed/chip text
  - Starts message/flight/weather/manual scenario behavior

### Flows
- Message flow:
  - `src/flows/message-send.js` (state machine + behavior)
  - `src/flows/message-send-render.js` (UI composition per state)
  - `src/flows/message-send-voice.js` (voice parsing helpers)

- Flight flow:
  - `src/flows/flight-booking.js` (state machine + key handling)
  - `src/flows/flight-render.js` (step rendering)
  - `src/flows/flight-ai.js` (Gemini-assisted action parsing)

### Shared UI/motion primitives
- `src/flows/ui-primitives.js`
  - Shared composable HTML render helpers used by flows
  - Current exports include:
    - `renderContactHeader`
    - `renderSelectionList`
    - `renderChipBar`
    - `renderTextBubble`
    - `renderInputField`
    - `renderInfoCard`
    - `renderFlightRouteStep`
    - `renderActionRow`
    - `renderCompactStatus`

- Morph system:
  - `src/shared/morph.js`
  - `src/shared/morph-render.js`
  - `src/shared/morph-layout.js`
  - `src/shared/morph-bridges.js`

### Styles
- Main AI styles: `src/styles/ai.css`
- Message-flow specifics: `src/styles/message-flow.css`
- Flight-flow specifics: `src/styles/flight-flow.css`

## 3) Runtime UI Layers in `ai.html`

Inside `#stage` the main rendering layers are:

- `#drop-main` / `#drop-left` / `#drop-right`: morphing containers
- `#home-glow-layer`: voice glow visuals
- `#c-thumb`, `#c-primary`, `#c-secondary`, `#c-divider`, `#c-detail`: base content layers
- `#c-media`: image layer
- `#c-rich`: flow-rich HTML layer (message/flight content)
- `#intent-header`: external header above container
- `#glass-controls-layer`: external action controls below container

Rule of thumb:
- Rich flow internals go into `#c-rich`
- Intent labels use `#intent-header` (outside container)
- Confirm/action buttons use `#glass-controls-layer` (outside container)

## 4) Home/Wake Model

Owned in `ai-bindings.js`.

- Home states: `sleep`, `context`
- Home visual currently morphs to tiny bottom-aligned circle
- Wake guard:
  - Speech wake word: `hey bixby`
  - Keyboard wake: `L`
  - Legacy button wake: forced listening allowed
- Sleep/home keep passive command listening armed when no active flow

## 5) Flow Ownership (Important)

### Message flow
- Behavior/state transitions/timers: `message-send.js`
- View generation by state: `message-send-render.js` (now primitive-composed)
- Confirm controls are external in `glass-controls-layer`

### Flight flow
- Behavior/state transitions: `flight-booking.js`
- Step UI rendering: `flight-render.js` (primitive-composed)
- NLU/action parsing: `flight-ai.js` (calls `/api/gemini`)

## 6) Server/API Dependencies

Server entry: `server.mjs`

Used endpoints:
- `POST /api/gemini` (flight AI action parsing)
- `POST /api/tts` (AI voice)
- `POST /api/ai-route` (generic route)
- `GET/POST /api/phrases` (AI phrase config)

## 7) Debug/Global Functions

`ai-bindings.js` exports runtime hooks to `window` used by HTML debug buttons.
Common ones:
- `setHomeState(...)`
- `armAiWakeListening(...)`
- `fireChip(...)`
- `copyStagePng()`
- `exportStageSvg()`

If debug buttons stop working, check the final `Object.assign(window, {...})` in `ai-bindings.js`.

## 8) Where to Change Things Safely

- Change flight step visuals: `src/flows/flight-render.js` + `src/flows/ui-primitives.js`
- Change message step visuals: `src/flows/message-send-render.js` + `src/flows/ui-primitives.js`
- Change shared row/card visuals: `src/styles/ai.css` (`g-*` classes)
- Change stage morph behavior: `src/shared/morph-*.js`
- Change wake/listening policy: `src/ai/ai-bindings.js`

## 9) Current Constraints / Conventions

- Keep visual parity with existing `g-*` class system unless explicitly redesigning.
- Prefer primitive composition over inline per-flow HTML.
- Intent headers for list-like screens should live outside container (`#intent-header`).
- For list containers, keep only list items inside when rule requires it.
- Avoid introducing duplicate rendering paths (old inline + new primitive in parallel).

## 10) Quick Onboarding Checklist for Another Agent

1. Read `src/ai/ai-bindings.js` first (runtime wiring map).
2. Identify whether change is behavior (`message-send.js`/`flight-booking.js`) or UI (`*-render.js`/`ui-primitives.js`).
3. Verify if UI should be in-container (`#c-rich`) or external (`#intent-header` / `#glass-controls-layer`).
4. Reuse existing `g-*` classes where possible; add minimal CSS only when needed.
5. Run at least a module parse/import check after edits.
