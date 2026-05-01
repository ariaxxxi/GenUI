# Title

Bubble Home interrupt set

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/bubble`, keep the third content set named `interrupt` as a compact control set with a stateful `Pause`/`Play` primary control plus `End` and `Add`.

## In scope

- Bubble Home set data and set-aware helper updates in `src/bubble-page.js`
- Bubble Home product-spec updates for the new `interrupt` set
- Execution notes for the landed set behavior

## Out of scope

- AI Mode behavior
- Prototype page behavior
- Bubble Home visual redesign beyond the new set membership and inherited set behavior

## Relevant context

- Bubble Home already supports data-driven named content sets through `BUBBLE_SET_DEFINITIONS`
- The current `agent` set still relies on a single hardcoded sequence for left/right orb cycling and control defaults
- The new `interrupt` set should inherit the same set-level behavior as `agent` instead of adding a one-off runtime path

## Files to inspect

- `src/bubble-page.js`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/completed/handoff.md`

## Files allowed to change

- `src/bubble-page.js`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add a third Bubble Home set definition named `interrupt` alongside `app` and `agent`.
2. Build the `interrupt` set as a 3-bubble config with `Pause`, `End`, and `Add` in the old Claude, ChatGPT, and Gemini positions.
3. Keep the interrupt-specific hover, shell, idle-stream, paused-state, and pause/play stream behavior on the control bubbles.
4. Keep the set-aware control-default and left/right cycle helpers working for the reduced `interrupt` sequence.
5. Update Bubble Home product docs and execution notes.

## Acceptance criteria

- The set switcher shows `Interrupt` alongside `App` and `Agent`.
- Switching to `Interrupt` keeps the same control defaults as `Agent`.
- The `interrupt` set renders `Pause`, `End`, and `Add` in the old Claude, ChatGPT, and Gemini slots.
- Left/right arrow keys cycle the home orb through the reduced 3-bubble `interrupt` sequence using the same shared swipe motion and transient `Switch to …` stream treatment used by the `agent` set.
- At rest, the `interrupt` set home orb loops `Reasoning`, `Thinking`, and `Taking action` only while unpaused, and that stream fades out when the field opens.
- After `Pause` fires, the orb holds `Session paused` and the primary control bubble switches to `Play`; only firing `Play` resumes the looping stream.
- Existing `agent` and `app` set behavior remains unchanged.

## Validation checklist

- `node --check src/bubble-page.js`
- `git diff --check`
- Manual `/bubble` browser pass recommended for final layout and cycle confirmation.

## Risks / notes

- This is a set-layout and keyboard-cycle change, so a browser pass is still needed to confirm the 3-bubble spacing, shell feel, and left/right orb cycle order on `/bubble`.
