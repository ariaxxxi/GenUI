# PROJECT_STATE.md
> Last updated: 2026-03-20 | Branch: refractor-to-2-pages

## Current Goal
Finish the refactor from a single monolithic HTML prototype into a clean two-page app:
- `index.html` — Manual prototype/editor (designer edits scenarios by hand)
- `ai.html` — AI interaction mode (Alice chat assistant, flight booking demo)

The goal is to get both pages working correctly in isolation, with no shared mutation bugs, and ship this branch to main.

## What Is Working
- `index.html`: Scenario editor fully functional — create, duplicate, delete, rename, shape/icon/text/typography per scenario
- `ai.html`: Flight booking flow wired to AI backend; fallback UI renders if no AI provider
- `src/shapes.js` extracted and shared between pages
- Smoke test (`test/smoke.mjs`) validates ai.html loads and chip exists
- Server (`server.mjs`) routes AI requests to OpenAI / Anthropic / Gemini

## What Is Not Working / Known Issues
- See TASKS.md for open bugs
- `FluidUI.html` is a legacy reference file — not actively maintained, do not modify
- Smoke test currently hardcoded to port 5180 — server default is 5173

## How to Run
```bash
cp .env.example .env   # fill in AI_PROVIDER + AI_API_KEY
npm run start          # serves on http://localhost:5173
# open index.html for manual mode
# open ai.html for AI mode
```

## Repo Layout
```
/
├── index.html          # Manual editor page (6 165 lines)
├── ai.html             # AI interaction page (7 343 lines)
├── FluidUI.html        # Legacy reference — do not edit
├── server.mjs          # Node HTTP server + AI proxy
├── package.json        # type:module, only dep = playwright
├── .env.example        # PORT, AI_PROVIDER, AI_API_KEY, AI_MODEL
├── BUILD_RULES.md      # Hard constraints — READ BEFORE TOUCHING UI
├── src/
│   ├── shapes.js       # Canonical shape/stage definitions (ES module)
│   └── shapes.legacy.js# file:// fallback (no bundler)
├── test/
│   ├── smoke.mjs       # Playwright E2E smoke test
│   └── smoke.js        # CJS copy of same test
├── ref/
│   └── genui-affordance-v3.html  # Earlier design reference
└── context/            # ← you are here (agent handoff docs)
```
