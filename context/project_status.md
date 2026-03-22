# PROJECT_STATUS.md
> Last updated: 2026-03-22 | Branch: refractor-to-2-pages

## Current Phase
**Active UI polish / send message flow parity.** Two-page split is in place and functional. Current worktree is dirty with ongoing send message flow refinements in `ai.html` and handoff docs updates.

---

## What Is Working
- `index.html`: Scenario editor fully functional — create, duplicate, delete, rename, shape/icon/text/typography/stage per scenario
- `ai.html`: send message flow is wired and operational:
  - `THINKING -> DISAMBIGUATE -> COMPOSE -> CONFIRM -> SENDING -> SENT -> RESET`
  - phrase `send msg to hiro` and chip `Send a message to Hiro` both trigger flow
- `src/shapes.js` extracted and shared between both pages
- Smoke test (`test/smoke.mjs`) validates `ai.html` loads, chip exists, and shape animates on click
- Smoke test can self-host `server.mjs` on a free local port or target `SMOKE_BASE_URL` env var
- `server.mjs` routes AI requests to OpenAI / Anthropic / Gemini with per-provider retry and auth logic
- Per-scenario stage independence: editing Stage X in Scenario A does not affect Scenario B
- send message flow overlay architecture now uses:
  - direct content mount in `#c-rich` (no nested shell chrome wrapper)
  - external controls layer `#glass-controls-layer` for checkmark / action row
- Visual/motion updates landed in `ai.html`:
  - gradient strokes for selected controls and shell
  - dynamic card sizing from measured body content
  - in-place selection updates (no remount on Arrow) to smooth highlight transitions
  - DISAMBIGUATE `Which Hiro?` intent header anchored above container
  - controls tracking/clamping to remain inside stage during transitions

---

## What Is Incomplete / Known Issues
- No smoke test coverage for `index.html` (manual mode); only `ai.html` is tested
- No error boundary for full or corrupted localStorage — silent failures
- Pixel-perfect visual parity to Figma is still iterative (manual visual checks required for animation timing/placement nuances)
- AI trigger phrases in `ai.html` are still implicit in code (not documented for new devs)
- `ref/FluidUI.html` is stale (6,426 lines); decision on archive vs delete pending

---

## Active Risks
- **Visual regression risk in `ai.html`**: ongoing CSS/animation iteration can reintroduce spacing/stacking issues across states
- **Glasses overflow edge cases**: dynamic height + external controls must keep all visible content inside 420×420 stage under all transitions
- **localStorage silent failure**: corruption or quota exceeded will cause data loss with no user feedback

---

## Repo Layout
```
/
├── index.html          # Manual editor page (6,165 lines)
├── ai.html             # AI interaction page (actively iterated for send message flow parity)
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
npm run start           # serves on http://localhost:5173 (or configured PORT)
# Manual mode: http://localhost:5173/
# AI mode:     http://localhost:5173/ai.html
```

## How to Test
```bash
node test/smoke.mjs     # requires server running, or smoke.mjs self-hosts
```

---

## Likely Next Priorities
1. Complete manual parity pass for send message flow visuals/motion (header grouping, controls containment, selection animation consistency)
2. Add targeted UI regression checks for `ai.html` (beyond current smoke shape check)
3. Add smoke test for `index.html`
4. Add localStorage error boundary
5. Decide fate of `ref/FluidUI.html`
