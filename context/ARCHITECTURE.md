# Architecture

## Purpose

This repository is a browser-native GenUI prototype. It contains:

- A manual prototype/editor page for composing stages and scenarios.
- An AI interaction page that drives the same visual system through voice, typed input, and flow state machines.
- A bubble cluster demo that reuses the shared celestial selection visual.
- A small Node HTTP server for static files and AI/TTS/phrase proxy APIs.

There is no build step, bundler, or frontend framework. Pages load ES modules directly from `src/`.

## Entrypoints

| Page | Route / file | Main module | Role |
| --- | --- | --- | --- |
| Prototype editor | `/`, `/prototype`, `index.html` | `src/tool/index-app.js` | Manual scenario/stage editor and preview canvas. |
| AI mode | `/ai`, `ai.html` | `src/ai-app.js` -> `src/ai/ai-bindings.js` | Voice/text-driven AI shell and flow demos. |
| Bubble demo | `bubble.html` | `src/bubble2-page.js` | App bubble cluster with celestial hover/selection. |
| Celestial tool | `celestial-tool.html` | inline/page-specific scripts | Auxiliary visual tuning page. |

## Runtime Model

- `package.json` uses `"type": "module"`.
- `npm run dev` and `npm start` both run `node server.mjs`.
- The server serves static files and API routes from the same process.
- Browser state is persisted through `localStorage`; selected durable records are mirrored into IndexedDB.
- AI provider calls are proxied through server APIs so browser code does not call provider SDKs directly.

## Core Data Model

### Canonical Shapes

`src/shapes.js` defines the canonical shape and component model:

- Shapes: `idle`, `circle`, `listening`, `magic`, `dot`, `list`, `pill`, `split`, `card`, `card-s`, `image`, `ai`, `card-form`, `card-list`.
- Default editor shapes: `idle`, `dot`, `list`, `pill`, `card`, `card-s`, `image`.
- Components: `icon`, `primary`, `secondary`, `detail`, `image`, `intent-header`.

`normalizeStage()` is the main stage normalizer. It returns stable stage fields such as:

- `id`, `name`, `preset`, `renderShape`
- sizing and layout overrides
- `listListeningOrb`
- `selected`
- `accentColor`, `secondaryAccentColor`
- normalized component settings

### Scenario Content

`src/shared/scenario-data.js` owns the built-in scenarios and converts editor data into renderable content. Scenario content is map-based so each shape/stage can be configured without hardcoding new UI branches:

- `iconByShape`
- `textByShape`
- `listItemsByShape`
- `imagesByShape`
- `typographyByShape`
- `sizeByShape`
- `stageRenderShapeById`
- `hiddenStageIds`
- `selectedByShape`
- `accentColorByShape`
- `secondaryAccentColorByShape`
- selected celestial blob and mask maps
- `listChipIconsByShape`
- `canvas`

The default scenarios include Weather Snapshot, Incoming Message, QR Access Pass, Card-S Promo, and Image Hero.

### Storage Keys

`src/app-state.js` defines browser persistence:

- `genui.scenarios.v1`
- `genui.scenarios-revision.v1`
- `genui.stages.v1`
- `genui.settings.v1`
- `genui.mode.v1`
- `genui.ai-stage.v1`
- `genui.ai-voice-enabled.v1`
- `genui.disable-text-input.v1`

Durable storage uses IndexedDB database `genui-durable.v1`, store `records`.

## Rendering Pipeline

1. Page entrypoint initializes app state, scenario data, sidebar/editor controls, and morph rendering.
2. `src/shared/scenario-data.js` resolves the selected scenario/stage into render content.
3. `src/shared/morph.js` composes the morph system from layout, bridge, and render modules.
4. `src/shared/morph-layout.js` computes target geometry and content positioning.
5. `src/shared/morph-bridges.js` handles intermediate transition paths.
6. `src/shared/morph-render.js` writes DOM/CSS variables for the canvas, list pills, media, intent header, and selected chrome.
7. CSS in `src/styles/` provides the visual system.

## Shared Morph System

`initMorph()` in `src/shared/morph.js` is the shared visual state machine for prototype and AI mode. It tracks:

- current shape
- last geometry
- bridge timers
- list timers
- render content state
- media state
- selection direction

Important behavior:

- `morphTo()` is the primary transition API.
- Some paths use bridge shapes, including list bridges, split bridges, and thinking/home transitions.
- AI and prototype pages share the same morph renderer, but their entrypoint coordinators decide which stage or flow state to request.

## Sidebar / Editor System

The prototype editor is coordinated by `src/tool/index-app.js`.

Editor modules:

- `src/shared/sidebar.js`: composes sidebar refs, actions, render, and bindings.
- `src/shared/sidebar-render.js`: renders scenario buttons, stage buttons, Stage Components controls, and content editors.
- `src/shared/sidebar-actions.js`: mutates scenarios/stages and persists changes.
- `src/shared/sidebar-bindings.js`: wires clicks, tabs, collapsibles, file checks, and preview interactions.
- `src/tool/modules/*`: manual demo controls, animation controls, stage capture, settings, and prototype bindings.

The editor owns the stage library and scenario library, then passes normalized data into the shared render pipeline.

## Celestial Visual System

The selected/orb visual system is shared instead of duplicated:

- `src/shared/celestial-selected-presets.js`: preset values for selected celestial chrome.
- `src/shared/celestial-selection-chrome.js`: computes CSS variables, masks, directional offsets, and applies chrome to targets.
- `src/styles/shared.css`: shared selected chrome variables and animations.
- `src/styles/ai-decorative.css`: AI/prototype celestial orb, listening/thinking visuals, and decorative page effects.

Known consumers:

- Prototype selected stage chrome.
- AI mode thinking/listening orb.
- AI contact rows, compose fields, and flight options.
- Bubble page child hover/selection chrome.

Directional selection motion is provided by `syncDirectionalSelection()`.

## AI Mode

`src/ai-app.js` only imports `src/ai/ai-bindings.js`, which is the AI mode coordinator.

AI mode composes:

- shared app state, morph, sidebar, and animation controls
- `src/ai/ai-shell.js` for home/sleep/AI visual shell behavior
- `src/ai/voice-engine.js` for SpeechRecognition and microphone analyser input
- `src/ai/input-actions.js` for command routing
- `src/ai/editor-bindings.js` for AI-page editor controls
- `src/ai/tts-player.js` for Gemini TTS playback
- flow modules in `src/flows/`

The passive command listener starts through `voice.voiceEngine.start("command")`.

### AI Flows

`src/flows/` contains independent, data-driven flow modules:

- `message-send.js`: send-message flow with states `IDLE`, `THINKING`, `DISAMBIGUATE`, `COMPOSE`, `CONFIRM`, `SENDING`, `SENT`.
- `flight-booking.js`: destination/date/recommendation/payment/confirmation flow.
- `coffee-order.js`: slot-based order flow using the shared flow engine.
- `flow-engine.js`: reusable flow state helper.
- `flow-definitions.js`: data definitions for send-message and coffee flows.
- `ui-primitives.js`: reusable flow HTML helpers.

Flow modules should own their state and expose narrow init/action APIs to the AI coordinator.

## Bubble Page

The bubble page is implemented by:

- `bubble.html`
- `src/bubble2-page.js`
- `src/styles/bubble2-page.css`

It renders a draggable/interactive app cluster and applies the same celestial selection chrome to child bubbles. It also uses directional hover motion and click audio.

Important current mismatch: `server.mjs` routes `/bubble` and `/bubble2` to `bubble2.html`, but the repo contains `bubble.html`. Fix the route or add the expected file before relying on server aliases.

## Server/API

`server.mjs` is a native Node HTTP server.

Static routes:

- `/` and `/prototype` -> `index.html`
- `/ai` -> `ai.html`
- `/bubble` and `/bubble2` currently attempt `bubble2.html`

API routes:

- `POST /api/ai-route`: provider abstraction for Gemini/OpenAI/Anthropic-style chat completion routing.
- `POST /api/gemini`: Gemini JSON extraction endpoint with retry/backoff.
- `POST /api/tts`: Gemini TTS endpoint with in-memory cache.
- `GET /api/phrases`: load phrase config.
- `POST /api/phrases`: save phrase config.

Server safeguards:

- static path safety through `safePath()`
- CORS for `/api/*`
- request body max size of 256 KB
- `.env` loading
- default port `5173`, with fallback to `5174` if the default is in use and the port was not explicitly configured

## Styles

Primary style files:

- `src/styles/shared.css`: global variables, shared canvas/stage primitives, selected chrome.
- `src/styles/ai-decorative.css`: shared celestial orb and decorative effects.
- `src/styles/ai-glass.css`: glass UI primitives.
- `src/styles/ai-layout.css`, `ai-frame.css`, `ai-drop.css`, `ai-stage.css`, `ai-sidebar.css`: AI page layout.
- `src/styles/editor-layout.css`, `editor-sidebar.css`, `editor-decorative.css`: prototype editor.
- `src/styles/message-flow.css`, `flight-flow.css`: flow-specific presentation.
- `src/styles/bubble2-page.css`: bubble demo.

When changing the orb/selected visual, prefer the shared celestial files and shared CSS variables over page-specific overrides.

## Testing

Current automated coverage is minimal:

- `test/smoke.mjs` uses Playwright.
- It can self-host the server or use `SMOKE_BASE_URL`.
- It checks basic AI page interaction and prototype stage switching.

Known testing gaps:

- No visual regression coverage for celestial orb states.
- No bubble page smoke test.
- No dedicated flow tests for message, flight, or coffee.
- Current smoke timing may be stale because recent stage-button single-click behavior is delayed to distinguish double-click rename.

## Future-Agent Rules

- Read `src/shapes.js`, `src/shared/scenario-data.js`, and the relevant page coordinator before changing data behavior.
- Keep UI content data-driven through stage/scenario maps.
- Reuse the shared celestial visual system; do not fork new orb styles per page.
- Do not silently change storage keys; add migrations or compatibility code.
- Keep server API route names aligned with client calls and docs.
- Be careful with existing uncommitted source changes; do not revert work you did not make.
