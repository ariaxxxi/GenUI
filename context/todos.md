# Todos

## High Priority

- Reconcile current uncommitted source changes with the latest user-facing behavior before adding more interaction code.
- Fix the `/bubble` server route mismatch by serving `bubble.html` or adding the expected `bubble2.html`.
- Update `test/smoke.mjs` for delayed stage single-click behavior introduced by inline double-click rename handling.
- Restore the expected `context/task.md` workflow file or update `AGENTS.md` to use the current `context/task✅.md` file.
- Add a smoke check for prototype list-stage controls, including list item +/- controls and bottom orb toggle/icon settings.

## Visual / Interaction Regression Coverage

- Add a regression check for AI vs prototype thinking/listening orb parity.
- Add a regression check for listening mode at volume `0` so the orb keeps a subtle rim instead of pure black.
- Add a bubble page smoke test for child-bubble hover highlight and directional celestial motion.
- Add coverage for stage-button double-click inline rename.
- Add coverage for scenario-button double-click inline rename.
- Add coverage for list-to-stage transitions so list exits do not incorrectly pass through pill unless intended.

## Product / UX Follow-Up

- Verify all Stage Components controls are visible only when relevant and use consistent image +/- styling.
- Document intended default keyboard behavior for prototype and AI surfaces.
- Make voice unsupported / microphone-denied states explicit in the UI.
- Define whether `celestial-tool.html` is still a supported tuning surface or should be removed.

## Technical Cleanup

- Audit `src/shapes.legacy.js` against canonical `src/shapes.js` and remove or document the legacy copy.
- Remove dead or disabled old orb code after confirming the shared celestial system covers all current states.
- Centralize any remaining page-specific orb overrides into shared celestial presets.
- Align API naming in docs and code around `/api/ai-route`.
- Add package scripts for smoke/regression checks so agents do not need to remember raw commands.
- Consider a storage recovery/export UI for localStorage + IndexedDB data.

## Backlog

- Add automated tests for `src/shared/scenario-data.js` normalization.
- Add automated tests for flow state machines in `src/flows/`.
- Add a small visual fixture page for celestial presets.
- Add a route/page inventory test so server aliases cannot drift from existing HTML files.
- Document `.env` variables used by AI and TTS providers.

## Recently Completed / Landed Direction

- Core morph rendering was split into shared layout, bridge, and render modules.
- Prototype sidebar logic was split into refs, render, actions, and bindings.
- AI flows were separated from the AI page coordinator.
- Celestial selected chrome was moved toward one shared visual system.
- List stage gained bottom orb configuration and list item count controls in the editor path.
- Stage and scenario inline rename behavior is being handled through double-click editing rather than separate rename-only controls.
