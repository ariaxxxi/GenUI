# Title

Bubble Home Claude scale parity with Spotify slot

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/bubble`, keep the requested app-slot mapping in the `agent` set and remove the Claude-only visual scale override so Claude matches the Spotify slot’s apparent size behavior.

## In scope

- Bubble Home Claude content-scale cleanup in `src/bubble-page.js`.
- Execution-note updates for the parity fix.

## Out of scope

- Bubble Home slot layout remapping.
- Bubble Home shell-color, image-mask, or pill-gap changes.
- Bubble Home interaction or promotion behavior changes.
- AI Mode or shared Celestial visual changes.

## Relevant context

- The requested slot mapping is already present in the current `agent` set: ChatGPT->ChatGPT, Spotify->Claude, Profile1->Travel, Maps->Budget, Notes->Writing, and Profile2->Fitness.
- Claude still had a local `imageScale: 0.82` override, while Spotify uses the slot at full image scale.
- That override makes Claude appear smaller even when its slot size and position already match Spotify.

## Files to inspect

- `src/bubble-page.js`

## Files allowed to change

- `src/bubble-page.js`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Remove the Claude-only `imageScale: 0.82` override from the `agent` set.
2. Record the cause and result in the execution notes.

## Acceptance criteria

- Claude still uses the Spotify slot position and size in the `agent` set.
- Claude no longer uses a smaller local image scale than Spotify.
- No Bubble Home layout or interaction behavior changes beyond the Claude scale fix.

## Validation checklist

- `node --check src/bubble-page.js`
- `git diff --check`
- Manual `/bubble` browser pass recommended for final visual confirmation.

## Risks / notes

- If Claude still looks smaller after this change, the remaining cause would be padding baked into the source asset rather than Bubble Home slot geometry.
