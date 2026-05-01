# Title

Prototype debug pause and resume for thinking states

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/prototype`, add debug-only `Pause` and `Resume` controls for the prototype thinking-family states so `thinking`, `skill`, `agent`, and `app` playback can be frozen and resumed without disabling the rest of the debug controls.

## In scope

- Prototype AI debug control markup in `index.html`.
- Prototype thinking debug playback state and stream behavior in `src/tool/modules/manual-bindings.js`.
- Prototype paused-text and paused-orb styling in `src/styles/editor-layout.css`, `src/styles/editor-sidebar.css`, and `src/styles/ai-decorative.css`.
- Prototype behavior docs and execution notes.

## Out of scope

- AI Mode behavior.
- Bubble Home behavior.
- Celestial visual-core presets or shared orb markup.

## Relevant context

- Prototype debug playback is token-gated through `thinkingDebugState.streamToken` in `src/tool/modules/manual-bindings.js`.
- The prototype and AI surfaces share one Celestial orb implementation, so the paused visual must be a state-only treatment layered onto the existing orb selectors.
- The user explicitly wants pause to stop text playback while still allowing skill, agent, and app switching.

## Files to inspect

- `index.html`
- `src/tool/modules/manual-bindings.js`
- `src/styles/ai-decorative.css`
- `src/styles/editor-layout.css`
- `src/styles/editor-sidebar.css`
- `docs/FRONTEND.md`
- `README.md`

## Files allowed to change

- `index.html`
- `src/tool/modules/manual-bindings.js`
- `src/styles/ai-decorative.css`
- `src/styles/editor-layout.css`
- `src/styles/editor-sidebar.css`
- `docs/FRONTEND.md`
- `README.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add `Pause` and `Resume` controls to the prototype AI debug sidebar.
2. Extend the prototype thinking debug state with paused playback and queued custom text.
3. Cancel active text animation on pause, render static paused labels per mode, and let morph/orb-switch behavior continue while paused.
4. Resume by optionally one-shot playing queued custom text, then restarting only the correct mode-specific playback.
5. Add a paused badge treatment for the stream and a paused-state Celestial orb settle treatment without forking the shared orb system.
6. Update prototype behavior docs and execution notes.

## Acceptance criteria

- `thinking`, `skill`, `agent`, and `app` debug states can be paused and resumed on `/prototype`.
- While paused, agent/app switches and skill changes still work, but no stream loop or transition copy types until resume.
- `Fire` while paused queues custom text and plays it once after resume.
- Leaving the debug-family shapes clears the paused state and queued paused custom text.
- The paused orb treatment reuses the existing shared Celestial orb path instead of introducing new orb markup.

## Validation checklist

- `node --check src/tool/modules/manual-bindings.js`
- `git diff --check`
- Manual `/prototype` browser pass recommended for final interaction and motion confirmation.

## Risks / notes

- This is a timing-sensitive debug UX change, so a browser pass is still needed to confirm pause timing, queued custom-text resume, and the paused orb feel across `thinking`, `skill`, `agent`, and `app`.
