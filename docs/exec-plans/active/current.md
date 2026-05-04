# Title

Prototype thinking minimize toggle

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/prototype`, add a click-to-minimize interaction for the debug `thinking` mode so the shared orb shrinks smoothly to `0.4` from a bottom-center anchor and the thinking stream fades out until the orb is clicked again.

## In scope

- Prototype debug thinking-mode minimize state and toggle handling
- Prototype thinking orb motion and stream fade styling
- Prototype/frontend docs and execution notes for the new interaction

## Out of scope

- `domain`, `agent`, or `app` debug-mode behavior
- AI Mode orb behavior
- Bubble Home behavior
- Shared Celestial visual-core preset changes

## Relevant context

- Prototype thinking mode already reuses the shared Celestial orb and should keep doing so; this task is a state-behavior change only.
- The minimize interaction is local to prototype `thinking` mode and should clear automatically when the user leaves that mode.
- The thinking stream should remain mounted so unminimizing restores the current text state instead of restarting the loop.

## Files to inspect

- `src/tool/modules/manual-bindings.js`
- `src/styles/ai-decorative.css`
- `src/styles/editor-layout.css`
- `README.md`
- `docs/FRONTEND.md`

## Files allowed to change

- `src/tool/modules/manual-bindings.js`
- `src/styles/ai-decorative.css`
- `src/styles/editor-layout.css`
- `README.md`
- `docs/FRONTEND.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add prototype-local thinking minimize state and click/keyboard handling on the shared orb host, scoped to `thinking` mode only.
2. Apply a minimized orb treatment through existing prototype/AI CSS seams so the orb scales to `0.4` from a bottom-center anchor with smooth motion.
3. Fade the thinking stream out while minimized without unmounting or restarting the underlying loop.
4. Clear minimized state automatically when leaving prototype `thinking` mode.
5. Update durable docs and execution notes.

## Acceptance criteria

- On `/prototype`, while the debug mode is `thinking`, clicking the orb or pressing `m` toggles minimized state on and off.
- In minimized state, the orb appears at `0.4` of normal size and scales from its bottom center.
- In minimized state, the thinking stream fades out smoothly and returns when restored.
- Leaving prototype `thinking` mode clears minimized state automatically.
- No new shared-orb visual fork is introduced.

## Validation checklist

- `node --check src/tool/modules/manual-bindings.js`
- `git diff --check`
- Manual `/prototype` browser pass recommended for final motion/feel confirmation.

## Risks / notes

- The minimized treatment layers on top of existing paused-thinking styling, so a browser pass is still needed to confirm the combined paused+minimized feel.
