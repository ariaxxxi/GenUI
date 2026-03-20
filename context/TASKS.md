# TASKS.md
> Open tasks, bugs, and next steps. Update this as work progresses.

## In Progress
- [ ] Merge `refractor-to-2-pages` → `main` once smoke test passes cleanly

## Open Bugs
- [ ] Smoke test port mismatch — test hardcoded to 5180, server default is 5173. Either fix smoke test or align env config.
- [ ] `FluidUI.html` is stale but still in repo — decide: archive in `ref/` or delete
- [ ] No error boundary if localStorage is full or corrupted — silent failures

## Next Tasks (Prioritized)
1. Fix smoke test port config
2. Verify glasses frame: AI mode shapes must not overflow 420px at any step in the flight flow
3. Add smoke test coverage for `index.html` (currently only `ai.html` is tested)
4. Decide fate of `FluidUI.html`
5. Document trigger phrases for each scenario in `ai.html` so new devs know what to type

## Backlog / Ideas
- Multi-provider test: run smoke against all three AI providers
- Export scenario as JSON
- Import scenario from JSON
- Drag-to-reorder scenarios in index.html

## Done (Recent)
- [x] Extracted `src/shapes.js` from monolithic HTML
- [x] Smoke test added (Playwright)
- [x] Two-page split: index.html (manual) + ai.html (AI)
- [x] Flight booking flow fully wired
- [x] AI fallback UI renders when no provider configured
- [x] Per-scenario stage isolation (changing one scenario no longer mutates others)
