# Title

Bubble Home agent set remap

## Status

Coder-complete in working tree. Ready for review.

## Objective

On `/bubble`, replace the scaffold `agent` set clone with a distinct agent-focused 7-bubble set and tune the current domain-bubble geometry while preserving shell and interaction behavior.

## In scope

- Bubble Home `agent` set content remap in `src/bubble-page.js`.
- Bubble Home field-bubble rendering support for emoji-centered bubbles.
- Bubble Home hover-pill behavior split so round bubbles can expand into pills without using the existing app pill configuration.
- Bubble Home product-spec and execution-note updates for the new `agent` set behavior.

## Out of scope

- AI Mode behavior changes.
- Bubble Home `app` set content changes.
- Shared Celestial preset value retuning across products.

## Relevant context

- Bubble Home already has scalable named content sets and an `App` / `Agent` switcher.
- The existing `agent` set currently duplicates `app`, including pill/contact/media content and child actions.
- Existing `isPill` behavior was built around the original app-set pill interactions, so the new domain-agent hover behavior requires a separate capability.
- Claude uses the local `assets/agents/` logo, while Travel/Fitness/Budget/Writing use prototype-mode agent labels and keep their shell-plus-emoji bubbles visible in the field.

## Files to inspect

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `docs/product-specs/bubble-home.md`

## Files allowed to change

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/active/current.md`
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Replace the `agent` set clone with an explicit 7-bubble definition that keeps ChatGPT and Gemini, remaps the retained slots to Claude, Travel agent, Fitness agent, Budget agent, and Writing agent, and removes Health and Weather.
2. Give the four domain bubbles their own `80px` diameters and lower their `y` positions so they sit closer to the larger bubbles below.
2. Extend bubble content data so field bubbles can render either image or emoji center content.
3. Add a hover-pill capability separate from the existing app-set pill flag so Travel/Fitness/Budget/Writing keep a non-Celestial shell at rest, then expand that shell into a Celestial hover pill.
4. Allow Claude to promote in the `agent` set even though the Spotify slot with the same id remains non-promotable in `app`.
5. Clear child actions for the entire `agent` set while preserving the existing `app` set behavior unchanged.
6. Record the remapped `agent` set contract in the Bubble Home spec and completed handoff notes.

## Acceptance criteria

- Switching from `app` to `agent` shows 7 bubbles instead of the app clone.
- Health and Weather are absent in the `agent` set.
- Claude renders larger than before and can promote on release in the `agent` set.
- Travel, Fitness, Budget, and Writing render as shell-plus-emoji bubbles at rest, then expand that shell into `XX agent` hover pills with Celestial treatment.
- The four domain bubbles are `80px` and visibly closer to the lower row than before.
- ChatGPT and Gemini stay round in the `agent` set and do not expose child actions.
- The `app` set remains unchanged.

## Validation checklist

- `node --check src/bubble-page.js`
- `git diff --check`
- Manual `/bubble` browser pass recommended for visual behavior and set switching.

## Risks / notes

- This turn adds a second hover interaction path on top of existing Bubble Home pill logic, so a visual pass is still needed to confirm the domain-agent hover feel and emoji sizing.
