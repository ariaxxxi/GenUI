# PROJECT_STATUS.md
> Last updated: 2026-03-21 | Branch: refractor-to-2-pages

## Current Phase
**Near-complete refactor.** Two-page split is implemented and functional. Branch is clean (no uncommitted changes). Ready for final verification and merge to main.

---

## What Is Working
- `index.html`: Scenario editor fully functional — create, duplicate, delete, rename, shape/icon/text/typography/stage per scenario
- `ai.html`: Flight booking flow fully wired to AI backend; fallback UI (`localFlightFallback`) renders if no AI provider
- `src/shapes.js` extracted and shared between both pages
- Smoke test (`test/smoke.mjs`) validates `ai.html` loads, chip exists, and shape animates on click
- Smoke test can self-host `server.mjs` on a free local port or target `SMOKE_BASE_URL` env var
- `server.mjs` routes AI requests to OpenAI / Anthropic / Gemini with per-provider retry and auth logic
- Per-scenario stage independence: editing Stage X in Scenario A does not affect Scenario B

---

## What Is Incomplete / Known Issues
- No smoke test coverage for `index.html` (manual mode); only `ai.html` is tested
- No error boundary for full or corrupted localStorage — silent failures
- Glasses frame overflow not formally verified across all flight flow steps (card-form at 400px, card-list at 360px need attention)
- AI trigger phrases in `ai.html` not documented — new devs must read code to know what to type
- `ref/FluidUI.html` is stale (6,426 lines); decision on archive vs delete pending

---

## Active Risks
- **Glasses overflow**: shapes `card-form` (400px height) and `card-list` (360px height) are close to the 420px glasses frame limit — need explicit verification that all content stays inside
- **localStorage silent failure**: corruption or quota exceeded will cause data loss with no user feedback

---

## Repo Layout
```
/
├── index.html          # Manual editor page (6,165 lines)
├── ai.html             # AI interaction page (7,343 lines)
├── server.mjs          # Node HTTP server + AI proxy (367 lines)
├── package.json        # type:module; only runtime dep = playwright
├── .env.example        # PORT, AI_PROVIDER, AI_API_KEY, AI_MODEL
├── BUILD_RULES.md      # Hard constraints — READ BEFORE TOUCHING UI
├── AGENTS.md           # Planner/Implementer agent workflow
├── src/
│   ├── shapes.js       # Canonical shape/stage definitions (ES module)
│   └── shapes.legacy.js# file:// fallback — keep in sync with shapes.js
├── test/
│   ├── smoke.mjs       # Playwright E2E smoke test (primary)
│   └── smoke.js        # CJS copy of smoke test
├── ref/
│   ├── FluidUI.html    # Stale legacy reference — do not edit or import
│   └── genui-affordance-v3.html  # Earlier design reference
└── context/            # Agent handoff docs (you are here)
```

---

## How to Run
```bash
cp .env.example .env    # fill in AI_PROVIDER + AI_API_KEY (Gemini configured in current .env)
npm run start           # serves on http://localhost:5173
# Manual mode: http://localhost:5173/
# AI mode:     http://localhost:5173/ai.html
```

## How to Test
```bash
node test/smoke.mjs     # requires server running, or smoke.mjs self-hosts
```

---

## Likely Next Priorities
1. Verify glasses frame: all flight flow shapes must fit within 420×420px
2. Merge `refractor-to-2-pages` → `main`
3. Add smoke test for `index.html`
4. Add localStorage error boundary
5. Decide fate of `ref/FluidUI.html`
