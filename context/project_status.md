# PROJECT_STATUS.md
> Last updated: 2026-04-03 | Branch: ai-to-app

## Current Phase
**Refactor stabilization after the list/render cleanup.** The shared list path, shared scenario session state, and message-send renderer split are landed. Current work is mostly reliability and remaining debt reduction, not large structural moves.

---

## What Is Working
- `index.html` is functional as the manual editor:
  - scenario selection
  - stage switching
  - content editing
  - per-scenario stage independence
- `ai.html` is functional as the AI/demo surface:
  - home state
  - message send flow
  - flight flow
  - coffee flow
- The prototype `list` stage now uses the shared AI disambiguation-pill renderer instead of a separate legacy implementation.
- Shared scenario/bootstrap persistence is centralized in `src/shared/scenario-session.js`.
- Message-send rendering is split by concern:
  - `src/flows/message-send-render.js`
  - `src/flows/message-send-render-layout.js`
  - `src/flows/message-send-render-content.js`
- The app now assumes an HTTP-served environment only. The dead `file://` shapes fallback was removed.
- `test/smoke.mjs` passes and now covers:
  - `ai.html` load
  - quick-chip entry into the Hiro message flow
  - keyboard confirmation from recipient disambiguation into compose
  - `index.html` stage switch
  - `index.html` content edit persistence
- `server.mjs` still self-hosts static files and AI proxy routes for OpenAI / Anthropic / Gemini.

---

## What Is Incomplete / Known Issues
- No user-visible localStorage error boundary yet. Storage failures still degrade silently.
- Automated coverage is still shallow for the flight and coffee flows. Only the Hiro message path plus one manual-editor path are covered by smoke.
- Figma export is structurally editable now, but pixel-perfect parity for blur-heavy/glass effects is still iterative and requires manual visual validation.
- `ref/FluidUI.html` is still stale and kept only as a reference file.
- The AI/demo surface still contains a visible legacy/debug panel in `ai.html`.

---

## Active Risks
- **UI regression risk in `ai.html`**: the AI surface still has dense interaction/state logic across message, flight, and coffee flows.
- **Glasses-frame fit risk**: dynamic surfaces must continue to self-constrain inside the `420x420` glasses frame because the frame is visual-only, not a clip.
- **Storage reliability risk**: corrupted or quota-limited localStorage/IndexedDB can still cause silent failure.
- **Backend-noise risk in smoke**: the smoke can pass while still logging expected AI-provider `502`/TTS fallback noise, so visual/app-state checks matter more than a clean console.

---

## Repo Layout
```
/
├── index.html
├── ai.html
├── server.mjs
├── src/
│   ├── ai-app.js
│   ├── app-state.js
│   ├── shapes.js
│   ├── sim-panel.js
│   ├── ai/
│   ├── flows/
│   ├── shared/
│   ├── styles/
│   └── tool/
├── test/
│   └── smoke.mjs
├── ref/
└── context/
```

---

## How to Run
```bash
npm run start
# Manual mode: http://localhost:5173/
# AI mode:     http://localhost:5173/ai.html
```

## How to Test
```bash
node test/smoke.mjs
```

---

## Likely Next Priorities
1. Add a user-visible storage failure boundary for localStorage / IndexedDB errors.
2. Expand automated coverage for flight and coffee flows, not just the Hiro message path.
3. Decide whether the AI legacy/debug panel should stay, move behind a dev-only gate, or be removed.
4. Continue trimming stale reference/debt files such as `ref/FluidUI.html` if they are no longer used.
