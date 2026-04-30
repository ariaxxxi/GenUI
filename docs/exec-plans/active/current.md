# Title

Bubble Home agent-tab control defaults

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/bubble`, make the `agent` tab default both control toggles to on, while keeping the `app` tab defaults off.

## In scope

- Bubble Home set-specific control defaults in `src/bubble-page.js`.
- Bubble Home product-spec and execution-note updates for the revised defaults.

## Out of scope

- Bubble Home control markup or styling changes.
- Bubble Home layout or visual changes beyond the default toggle state.
- AI Mode or shared Celestial visual changes.

## Relevant context

- Bubble Home now has two control toggles: viewport press scope and canvas removal.
- The requested behavior is set-specific: `agent` should default both on, `app` should keep both off.
- The cleanest hook is the Bubble Home set-switch path, which already centralizes per-set UI updates.

## Files to inspect

- `src/bubble-page.js`
- `docs/product-specs/bubble-home.md`

## Files allowed to change

- `src/bubble-page.js`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add a small Bubble Home helper for per-set control defaults.
2. Initialize the control state from the active set defaults.
3. Apply those defaults when switching between `app` and `agent`.
4. Update docs and execution notes to reflect the new default behavior.

## Acceptance criteria

- Switching to `agent` turns both toggles on by default.
- Switching to `app` restores both toggles off by default.
- Existing Bubble Home control behavior remains unchanged apart from those defaults.

## Validation checklist

- `node --check src/bubble-page.js`
- `git diff --check`
- Manual `/bubble` browser pass recommended for final visual confirmation.

## Risks / notes

- This is a state-default change, so a browser pass is still needed to confirm the set-switch feel and toggle sync on `/bubble`.
