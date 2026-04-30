# Project Status

Last updated: 2026-04-21  
Branch: `celestial-to-all`

## Current State

The project is a working browser-native GenUI prototype with four product surfaces:

- GenUI Tool in `index.html`.
- AI mode in `ai.html`.
- Bubble demo in `bubble.html`.
- Celestial Visual Tool in `celestial-tool.html`.

The codebase has already been split into shared morph, sidebar, scenario-data, AI, flow, and style modules. Current work is focused on visual parity and interaction fixes around the shared celestial orb/chrome system, prototype stage controls, list-stage controls, inline rename behavior, and harness-style docs upkeep.

## What Is Working

- Static app can run through `node server.mjs` or `npm run dev`.
- Agent context is indexed through `AGENTS.md`, `ARCHITECTURE.md`, and `docs/PLANS.md`.
- Prototype editor renders stage/scenario libraries from normalized data.
- AI mode loads shared morph rendering and independent flow modules.
- Message, flight, and coffee flows are modularized under `src/flows/`.
- Shared celestial selected chrome and orb-core styling are centralized through shared presets, shared chrome JS, and `src/styles/shared.css`.
- Browser persistence exists through localStorage and IndexedDB durable records.
- Phrase config can be loaded/saved through `/api/phrases`.
- Gemini/OpenAI/Anthropic-style provider calls are proxied through local server APIs.

## Active Uncommitted Source Changes

These files were already modified when this context refresh began:

- `docs/exec-plans/completed/handoff.md`
- `src/ai/editor-bindings.js`
- `src/shared/morph-layout.js`
- `src/shared/sidebar-render.js`
- `src/tool/index-app.js`
- `src/tool/modules/manual-bindings.js`

Do not revert these files unless the user explicitly requests it. Inspect them before building on top of them.

## Known Issues / Risks

- `test/smoke.mjs` waits only `100ms` after clicking a prototype stage; recent double-click rename behavior may delay single-click selection longer than that.
- `test/smoke.mjs` can fail on the AI page when `.ai-legacy-debug` intercepts the target chip click before the test reaches Celestial coverage.
- Visual behavior has little automated coverage, especially celestial orb parity and bubble hover highlights.
- AI listening behavior depends on browser SpeechRecognition and microphone permissions.
- `src/shapes.legacy.js` may drift from canonical `src/shapes.js`.
- Storage fallback is mostly silent for read failures; there is no explicit user-facing recovery UI.

## How To Run

- Install dependencies: `npm install`
- Start server: `npm run dev`
- Prototype editor: `http://localhost:5173/`
- AI mode: `http://localhost:5173/ai`
- Bubble demo: `http://localhost:5173/bubble`

## Validation

Current automated smoke:

- `node test/smoke.mjs`

Current limitation:

- The smoke test may need timing updates for stage-button single-click behavior.
- The smoke test may need a stable AI chip selector/click path that is not blocked by legacy debug UI.
- No lint, typecheck, or full regression script is defined in `package.json`.

## Fast Orientation For New Agents

Read these first for implementation work:

- `AGENTS.md`, `ARCHITECTURE.md`, and `docs/PLANS.md` for context navigation and ownership.
- `src/shapes.js` for canonical stage/component data.
- `src/shared/scenario-data.js` for scenario normalization.
- `src/shared/morph.js` plus layout/bridge/render modules for visual transitions.
- `src/shared/sidebar*.js` for prototype editor UI.
- `src/ai/ai-bindings.js` for AI mode orchestration.
- `src/shared/celestial-selection-chrome.js`, `src/shared/celestial-selected-presets.js`, and `src/styles/shared.css` for Celestial orb/chrome behavior.
- `server.mjs` for route and API behavior.
