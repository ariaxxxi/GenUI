# Title

Bubble Home press-scope toggle

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/bubble`, add a control-panel toggle that switches Bubble Home between canvas-only press/pan start and viewport-anywhere press/pan start, while keeping the control panel excluded from viewport-start behavior.

## In scope

- Bubble Home control-panel markup updates in `bubble.html`.
- Bubble Home toggle styling updates in `src/styles/bubble-page.css`.
- Bubble Home press-scope state and pointer-start gating in `src/bubble-page.js`.
- Bubble Home product-spec and execution-note updates for the new control.

## Out of scope

- Bubble Home layout remapping.
- Bubble Home bubble visual changes.
- Bubble Home promotion or child-bubble behavior changes.
- AI Mode or shared Celestial visual changes.

## Relevant context

- Bubble Home currently starts press/pan only from pointerdown events on the canvas shell.
- The new behavior needs to preserve current canvas behavior when off, and allow press/pan start from anywhere in the Bubble Home viewport except the control panel when on.
- The existing pointer move and release path already runs on `window`, so only the press-start gate needs to change.

## Files to inspect

- `bubble.html`
- `src/styles/bubble-page.css`
- `src/bubble-page.js`
- `docs/product-specs/bubble-home.md`

## Files allowed to change

- `bubble.html`
- `src/styles/bubble-page.css`
- `src/bubble-page.js`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add a press-scope toggle control to the Bubble Home sidebar card.
2. Add Bubble Home state and UI sync for the toggle.
3. Move pointerdown binding to the stage and gate press start based on the selected scope, excluding the control panel in viewport mode.
4. Update Bubble Home docs and execution notes to reflect the new control path.

## Acceptance criteria

- Bubble Home exposes a control-panel toggle for press scope.
- With the toggle off, press/pan starts only from inside the canvas.
- With the toggle on, press/pan can start anywhere in the Bubble Home viewport except the control panel.
- Existing Bubble Home pan, hover, and promotion behavior remains unchanged after press start.

## Validation checklist

- `node --check src/bubble-page.js`
- `git diff --check`
- Manual `/bubble` browser pass recommended for final visual confirmation.

## Risks / notes

- This change alters the press-start event boundary, so a browser pass is still needed to confirm control-panel exclusion and mobile layout feel.
