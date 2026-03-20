# HANDOFF.md
> Read this first if you are a new agent or engineer picking up this project.

## Who Is Doing What

| Agent / Person | Responsibility |
|---|---|
| **Claude (Code)** | Architecture, refactoring, bug fixes, writing context docs, reviewing code structure |
| **Codex / GPT** | UI implementation details, HTML/CSS edits, copy refinement in ai.html |
| **Human (Aria)** | Product decisions, design direction, final approval on flow and visual output |

## The Single Most Important Thing to Know
This is a **design prototyping tool**, not a production app. It is meant to be fast to iterate, easy to demo, and usable without a build step. Resist the urge to add frameworks, bundlers, or over-engineer. Keep it simple and visual.

## Current Branch
`refractor-to-2-pages` — This is the active working branch. `main` has the older monolithic version.

## What Just Happened (Last Major Change)
The project was refactored from one large `FluidUI.html` into two focused pages (`index.html` + `ai.html`). Shape definitions were extracted to `src/shapes.js`. Smoke tests were added. The flight booking flow in `ai.html` was refined.

## Files You Will Touch Most
- `ai.html` — Most active. Flight flow, AI integration, shape rendering
- `index.html` — Scenario editor, less active currently
- `src/shapes.js` — If adding or changing a shape
- `server.mjs` — If changing AI provider routing or adding a new endpoint
- `context/TASKS.md` — Update as you complete or discover tasks

## Files to Leave Alone
- `FluidUI.html` — Legacy reference. Do not edit.
- `ref/` — Historical reference only
- `src/shapes.legacy.js` — Only for file:// fallback, do not add logic here

## Hard Rules (from BUILD_RULES.md)
1. Glasses frame (420×420) — content must not overflow. The border is visual-only, not a clip.
2. All ai.html stage UI must stay inside 420×420.
3. Shape transitions must be smooth — no jump cuts.
4. Typography sizes: 12–96px only.
5. Flight flow order is a contract — do not reorder steps.
6. Scenario/stage settings are fully per-scenario isolated.
7. Fallback UI must always render if AI is unavailable.

## How to Get Oriented Quickly
1. Run `npm run start` and open `http://localhost:5173`
2. Open `index.html` — click around the scenario editor
3. Open `ai.html` — type "I want to book a flight" and follow the flow
4. Read `BUILD_RULES.md` before touching any UI code
5. Check `TASKS.md` for what needs doing next

## Environment Setup
```bash
cp .env.example .env
# Set AI_PROVIDER (openai | anthropic | gemini)
# Set AI_API_KEY
npm run start
```
If you don't set up `.env`, the app still runs — AI calls fail gracefully and fallback UI renders.

## Testing
```bash
# Start server first (port 5173 or 5180), then:
node test/smoke.mjs
```
Test clicks the "Send a message to Alice" chip and verifies `currentShape` is set. Exit code 2 = chip not found.

## Key Contact Points in Code

| What you need | Where to look |
|---|---|
| Shape/stage definitions | `src/shapes.js` |
| AI request proxy | `server.mjs` → `handleAiRequest()` |
| Flight flow steps | `ai.html` → search `FLIGHT_FLOW` or `flowStep` |
| Scenario CRUD | `index.html` → search `addScenario` / `deleteScenario` |
| localStorage keys | Either HTML file → search `STORAGE_KEYS` |
| Stage rendering | Either HTML file → search `renderStage` or `applyShape` |
