# Title

Bubble Home agent-set arrow cycling and transition text

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/bubble`, make left/right arrow keys cycle the home orb through the `agent` set bubbles when the `agent` tab is active, using the same swipe motion as the prototype listening-stage agent switch and streaming a transient `Switch to {agent name}` message with the same text treatment used in prototype mode.

## In scope

- Bubble Home keyboard routing and transient transition-text updates in `src/bubble-page.js`.
- Bubble Home orb-adjacent stream styling in `src/styles/bubble-page.css`.
- Bubble Home product-spec and execution-note updates for the new agent-set arrow behavior.

## Out of scope

- Bubble Home control-panel changes.
- Bubble Home layout changes beyond the keyboard-driven orb switch and its transient text label.
- AI Mode or shared Celestial visual changes.

## Relevant context

- Bubble Home already uses left/right keys to cycle the home orb through a small icon sequence.
- The requested set-aware behavior applies when the `agent` tab is active, while existing non-`agent` arrow behavior should remain intact.
- The shared orb-center animation path already supports swipe motion for image/icon content, so the Bubble Home change should reuse that path rather than inventing a new animation.
- Prototype mode already has a chunked type/delete transition-text treatment; Bubble Home should mirror that behavior for keyboard agent switching rather than introducing a different notification style.

## Files to inspect

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `src/tool/modules/manual-bindings.js`
- `docs/product-specs/bubble-home.md`

## Files allowed to change

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Keep Bubble Home left/right key handling routed through the existing set-aware cycle function.
2. Preserve the ordered `agent`-set bubble cycling and shared orb swipe motion path.
3. Add a Bubble Home-local stream label above the orb that reuses the prototype chunked type/delete text treatment.
4. Trigger that transient `Switch to {agent name}` label on keyboard-driven orb switches without changing unrelated Bubble Home interactions.
5. Update docs and execution notes to reflect the new behavior.

## Acceptance criteria

- In the `agent` set, left/right arrow keys cycle the home orb through the `agent` set bubbles.
- The keyboard switch uses the same swipe motion path as the prototype listening-stage agent switch.
- Each keyboard-driven switch streams `Switch to {agent name}` above the orb, then clears itself.
- The Bubble Home stream uses the same chunked type/delete feel as the prototype transition text.
- Existing non-`agent` Bubble Home left/right behavior remains unchanged.

## Validation checklist

- `node --check src/bubble-page.js`
- `git diff --check`
- Manual `/bubble` browser pass recommended for final visual confirmation.

## Risks / notes

- This is a keyboard interaction change, so a browser pass is still needed to confirm the sequence order, swipe feel, and stream-label timing on `/bubble`.
