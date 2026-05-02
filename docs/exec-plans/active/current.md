# Title

Prototype thinking domain rename and Bubble-aligned imagery

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/prototype`, keep the existing internal thinking debug `skill` mode mechanics, but change the user-facing mode name to `domain` and replace the old emoji-based domain agents with the same four Bubble Home domain agent images.

## In scope

- Prototype debug thinking-state label copy in `index.html`
- Prototype domain-agent data and render content in `src/tool/modules/manual-bindings.js`
- Prototype-facing docs that describe the domain debug mode
- Execution notes for the landed change

## Out of scope

- Bubble Home behavior or assets
- AI Mode behavior
- Prototype debug mode-key renames or morph-shape refactors beyond user-facing copy

## Relevant context

- Prototype debug uses the internal `skill` thinking state and `skill-pill` render shape; those internal names should stay unchanged unless a broader refactor is requested.
- Bubble Home already defines the desired domain imagery through `assets/agents/Blue.png`, `green.png`, `orange.png`, and `yellow.png`.
- The prototype debug row currently exposes a visible `skill` button and emoji-based domain roster that no longer matches Bubble Home.

## Files to inspect

- `index.html`
- `src/tool/modules/manual-bindings.js`
- `README.md`
- `docs/FRONTEND.md`

## Files allowed to change

- `index.html`
- `src/tool/modules/manual-bindings.js`
- `README.md`
- `docs/FRONTEND.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Change the visible prototype thinking-state button label from `skill` to `domain` without changing the underlying mode key.
2. Replace the prototype emoji-based skill/domain list with the four Bubble Home domain agents: `Travel Agent`, `Writing Agent`, `Fitness Agent`, and `Budget Agent`, using the same image assets and aligned theme colors.
3. Update prototype debug domain copy so transition text and fallback labels read `domain` instead of `skill`.
4. Update durable docs to explain that the visible prototype mode is `domain` while the internal `skill` debug path remains in place.
5. Record the completed work in the execution handoff.

## Acceptance criteria

- On `/prototype`, the thinking-state debug row shows `domain` instead of `skill`.
- Entering the prototype domain state renders Bubble Home-style agent images instead of emoji icons.
- The prototype domain roster contains the four Bubble Home domain agents only.
- Domain transition copy reads naturally with `domain` wording instead of `skill`.
- Existing internal `skill` state routing continues to function without a broader refactor.

## Validation checklist

- `node --check src/tool/modules/manual-bindings.js`
- `git diff --check`
- Manual `/prototype` browser pass recommended for final visual confirmation.

## Risks / notes

- This is intentionally a user-facing rename only; internal keys such as `skill` and `skill-pill` remain because they are shared prototype morph/render internals.
