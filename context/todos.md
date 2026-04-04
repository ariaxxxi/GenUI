# TODOS.md
> Backlog of likely next work. Update as tasks are completed or discovered.

---

## High Priority

- [ ] **Verify glasses frame overflow** — run flight flow end-to-end in glasses mode and confirm no shape overflows 420×420px; check `card-form` (h:400) and `card-list` (h:360) specifically
- [ ] **Merge `refractor-to-2-pages` → `main`** — smoke test must pass cleanly first
- [ ] **Add localStorage error boundary** — wrap reads/writes in try-catch; show user-visible warning on quota or parse error; prevents silent data loss

---

## Medium Priority

- [ ] **Expand `index.html` smoke coverage** — current smoke covers stage switch + one content edit; add scenario create/duplicate/delete and typography edits
- [ ] **Document AI trigger phrases** — add comments or a section in `context/` listing what user text maps to each flight flow step; critical for new developers
- [ ] **Decide fate of `ref/FluidUI.html`** — 6,426-line stale reference; options: delete, keep in `ref/` with clear warning header, or archive outside repo

---

## Cleanup / Debt / Polish

- [ ] Audit `ai.html` for any leftover console.log or debug code before main merge
- [ ] Review `server.mjs` route `/api/ai` vs `/api/gemini` — clarify to devs which endpoint is preferred and when

---

## Backlog / Future Ideas

- [ ] Multi-provider smoke test — run test against all three AI providers (OpenAI, Anthropic, Gemini)
- [ ] Export scenario as JSON
- [ ] Import scenario from JSON (restore backup or share between browsers)
- [ ] Drag-to-reorder scenarios in `index.html` sidebar
- [ ] Stage library UI improvements — currently stage editing UX is basic

---

## Done (Recent)
- [x] Extracted `src/shapes.js` from monolithic HTML
- [x] Smoke test added (Playwright, self-hosting)
- [x] Two-page split: `index.html` (manual) + `ai.html` (AI)
- [x] Flight booking flow fully wired to AI backend
- [x] Fallback UI (`localFlightFallback`) renders when no AI provider configured
- [x] Per-scenario stage isolation — changing one scenario no longer mutates others
- [x] Server port alignment — default 5173, env-configurable, fallback 5174
- [x] `FluidUI.html` moved to `ref/` (no longer at repo root)
