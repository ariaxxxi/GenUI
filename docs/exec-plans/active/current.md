# Title

Prototype listening transcript prompt

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/prototype`, surface the same live dictated transcript text used in AI Mode while the shared listening orb is active.

## In scope

- Prototype listening transcript state and prompt rendering
- Prototype listening prompt DOM/CSS placement
- Prototype/frontend docs and execution notes for the new interaction

## Out of scope

- Prototype `thinking`, `domain`, `agent`, or `app` debug-mode behavior
- AI Mode behavior
- Bubble Home behavior
- Shared Celestial visual-core preset changes

## Relevant context

- Prototype `listening` mode already starts the shared voice engine in command mode and already reuses the shared listening orb.
- AI Mode’s live transcript appears in a dedicated top-centered prompt above the orb; prototype should mirror that pattern without changing AI Mode itself.
- Leaving prototype `listening` should clear the stored transcript so stale dictated text does not reappear on later entries.

## Files to inspect

- `index.html`
- `src/tool/index-app.js`
- `src/styles/editor-layout.css`
- `README.md`
- `docs/FRONTEND.md`

## Files allowed to change

- `index.html`
- `src/tool/index-app.js`
- `src/styles/editor-layout.css`
- `README.md`
- `docs/FRONTEND.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add a prototype listening-prompt node and local transcript state for the `/prototype` listening shape.
2. Feed prototype voice-engine transcript updates into that prompt while keeping the existing shared listening orb path intact.
3. Position and style the prompt above the orb using the same top-centered listening placement pattern AI Mode uses.
4. Clear the prompt automatically when leaving prototype `listening`.
5. Update durable docs and execution notes.

## Acceptance criteria

- On `/prototype`, while the current shape is `listening`, live speech transcript text appears above the orb.
- The prompt follows the same top-centered placement pattern as AI Mode’s listening transcript.
- Leaving prototype `listening` clears the visible transcript.
- No new listening-orb visual fork is introduced.

## Validation checklist

- `node --check src/tool/index-app.js`
- `git diff --check`
- Manual `/prototype` browser pass recommended for final transcript/placement confirmation.

## Risks / notes

- Prototype still uses command-mode recognition for the listening stage, so the final transcript lifecycle is intentionally simpler than AI Mode’s wake-word/request-processing path.
