# GenUI

Two-page generative UI tool for designers:
- `index.html` for prototype/editor workflows
- `ai.html` for AI interaction workflows

## Run

```bash
npm run start
```

Open:
- `http://localhost:5173/` (prototype page)
- `http://localhost:5173/ai` (AI page)
- `http://localhost:5173/bubble` (bubble demo)

## Current Workflow

- Create, duplicate, and delete scenarios in the sidebar.
- Edit scenario name, future AI trigger phrases, shape, icon, and text content.
- Tune icon, primary, secondary, and detail text size and color per scenario.
- Upload a PNG to replace the default emoji icon.
- Toggle the blurred background image on or off.
- In AI page, use input + stage override (`Auto`, `Dot`, `Pill`, `Card`) for preview generation.
- Scenario data, canvas settings, mode, and AI stage override persist in browser `localStorage`.

## Architecture Notes

- Rendering is driven by a normalized scenario object with `shape`, `content`, and `triggers`.
- Prototype and AI pages share the same scenario/stage data model and storage keys.
- Each page is mode-locked using `data-page-mode` (`manual` for `index.html`, `ai` for `ai.html`) to avoid cross-mode editing conflicts.
- AI page currently uses a frontend Gauss adapter stub (placeholder for real API integration) and falls back to manual matching on AI errors.
- The Node server remains available for local hosting and future provider integrations.
- Agent context starts in `AGENTS.md`, `ARCHITECTURE.md`, and `docs/PLANS.md`.
- Build and design guardrails are defined in `docs/FRONTEND.md` and `docs/DESIGN.md`.
