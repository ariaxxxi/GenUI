# Architecture

This document is the stable map of GenUI. It follows the same spirit as architecture docs such as rust-analyzer’s: explain the shape of the system, name the main seams, and tell agents where to make changes.

## Bird's Eye View

GenUI is a browser-native generative UI prototype. It has no frontend framework and no build step. HTML files load ES modules directly from `src/`, while `server.mjs` serves static files and local API proxy routes.

Main surfaces:

- Prototype editor: `index.html`, coordinated by `src/tool/index-app.js`.
- AI mode: `ai.html`, coordinated by `src/ai-app.js` and `src/ai/ai-bindings.js`.
- Bubble demo: `bubble.html`, coordinated by `src/bubble2-page.js`.
- Celestial tuning tool: `celestial-tool.html`.

## Code Map

| Area | Files | Responsibility |
| --- | --- | --- |
| Shape/data model | `src/shapes.js`, `src/shared/scenario-data.js` | Canonical shapes, stage normalization, scenario content maps. |
| Morph rendering | `src/shared/morph*.js` | Geometry, bridge transitions, DOM/CSS rendering. |
| Prototype editor | `src/tool/*`, `src/shared/sidebar*.js` | Manual scenario/stage editing and canvas preview. |
| AI shell | `src/ai/*` | AI home/listening/thinking shell, voice, TTS, input routing. |
| AI flows | `src/flows/*` | Message, flight, coffee, shared flow engine, UI primitives. |
| Celestial visual | `src/shared/celestial-*.js`, `src/styles/shared.css` | Shared selected/orb visual values, geometry, layer stack, and orb-core styling. |
| Styles | `src/styles/*` | Shared, AI, editor, flow, and bubble presentation. |
| Server | `server.mjs` | Static serving plus AI/TTS/phrases APIs. |

## Runtime Entrypoints

- `/` and `/prototype` serve `index.html`.
- `/ai` serves `ai.html`.
- `/bubble` and `/bubble2` serve `bubble.html`.
- Static assets are served from repo root through `safePath()`.

API routes:

- `POST /api/ai-route`
- `POST /api/gemini`
- `POST /api/tts`
- `GET /api/phrases`
- `POST /api/phrases`

## Data Model

`src/shapes.js` owns canonical stage/shape normalization.

Core shapes include `idle`, `circle`, `listening`, `magic`, `dot`, `list`, `pill`, `split`, `card`, `card-s`, `image`, `ai`, `card-form`, and `card-list`.

`src/shared/scenario-data.js` maps scenarios into renderable content through per-shape maps:

- text, typography, icons, images, list items
- render-shape overrides and hidden stage IDs
- selected state and Celestial colors/mask values
- canvas settings

The model is intentionally data-driven. Adding a new entry should normally be a data change plus one rendering case, not a hardcoded flow branch.

## Persistence

Browser state is centralized in `src/app-state.js`.

Storage keys:

- `genui.scenarios.v1`
- `genui.scenarios-revision.v1`
- `genui.stages.v1`
- `genui.settings.v1`
- `genui.mode.v1`
- `genui.ai-stage.v1`
- `genui.ai-voice-enabled.v1`
- `genui.disable-text-input.v1`

Durable mirror storage uses IndexedDB database `genui-durable.v1`, store `records`.

## Architectural Invariants

- Keep browser code as direct ES modules unless the user explicitly asks for a build system.
- Keep shared behavior in `src/shared/`; keep page orchestration in `src/tool/`, `src/ai/`, or page modules.
- Keep scenario/stage changes scenario-scoped. Do not mutate shared stage definitions accidentally.
- Keep Celestial as one shared visual system. Core visual changes must flow through shared presets/chrome/style files, not separate product overrides.
- Browser code calls local API routes; provider details stay in `server.mjs`.
- Voice features must have typed/click fallback paths.

## Where To Change Things

- Change visual rules in `docs/DESIGN.md` and detailed Celestial values in `docs/design-docs/celestial-visual.md`.
- Change UI/flow implementation constraints in `docs/FRONTEND.md`.
- Change product intent in `docs/PRODUCT_SENSE.md` and specs under `docs/product-specs/`.
- Change reliability, fallback, or route expectations in `docs/RELIABILITY.md`.
- Change key/server/security assumptions in `docs/SECURITY.md`.
- Record durable choices in `docs/references/decisions.md`.
- Record active and completed execution work under `docs/exec-plans/`.
