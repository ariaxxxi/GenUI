# Title

Prototype custom thinking text fire control

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/prototype`, add a custom thinking-text control to the AI Debug panel so the user can enter text and press `Fire` to stream that exact text with the existing type-on motion while staying in the current prototype debug visual state.

## In scope

- Prototype editor AI Debug sidebar controls in `index.html`.
- One-shot custom text streaming for prototype debug `thinking`, `skill`, `agent`, and `app` states.
- Reuse of the existing prototype thinking-stream animation behavior rather than a new stream effect.
- Frontend and execution docs updates for the new debug control.

## Out of scope

- AI Mode behavior changes.
- Bubble Home changes.
- New persistent storage for custom debug text.
- Any Celestial visual-core changes.

## Relevant context

- Prototype editor behavior is coordinated by `src/tool/index-app.js` and `src/tool/modules/manual-bindings.js`.
- The prototype debug stream already supports looped verbs, looped skill phrases, and one-shot transition labels through the same typing animation path.
- Prototype thinking/listening visuals must continue to reuse the shared orb/Celestial system; this task only changes debug controls and text behavior.

## Files to inspect

- `index.html`
- `src/tool/modules/manual-bindings.js`
- `src/styles/editor-sidebar.css`
- `docs/FRONTEND.md`

## Files allowed to change

- `index.html`
- `src/tool/modules/manual-bindings.js`
- `src/styles/editor-sidebar.css`
- `docs/FRONTEND.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add a hidden-by-default `Custom Text` row under the prototype `Thinking State` controls with one text input and one `Fire` button.
2. Reveal that row whenever the current prototype shape is in the thinking debug family: `magic`, `skill-pill`, or `agent-circle`.
3. Reuse the existing typing/deleting stream helpers so `Fire` interrupts any running debug loop and types the user text once with the same cursor motion.
4. Keep the active debug visual state unchanged while only swapping the stream text content.
5. Update the prototype frontend contract and completed handoff notes.

## Acceptance criteria

- In prototype AI Debug, a `Custom Text` input and `Fire` button appear for `thinking`, `skill`, `agent`, and `app` visual states.
- Pressing `Fire` or `Enter` with non-empty input streams the entered text with the existing typing motion.
- Triggering custom text interrupts the current debug text loop instead of competing with it.
- The active debug visual state stays on the current `thinking`, `skill`, `agent`, or `app` stage while the custom text streams.
- The control stays non-persistent and does not alter unrelated product surfaces.

## Validation checklist

- `node --check src/tool/modules/manual-bindings.js`
- `git diff --check`
- Manual `/prototype` browser pass recommended for `thinking`, `skill`, `agent`, and `app` states.

## Risks / notes

- This is a debug-surface interaction change with no automated browser coverage.
- The custom fire action is intentionally one-shot; changing mode or re-triggering a debug state can resume its normal loop behavior.
