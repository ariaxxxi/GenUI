# Title

Bubble Home selected-bubble becomes the new home orb

## Status

Planner-authored active task. Ready for implementation.

## Objective

Change Bubble Home selection so releasing over a hovered top-level bubble performs a true role swap:

- the hovered bubble grows an orb shell behind itself
- that promoted orb travels to the home-orb position at the bottom center
- its icon scales down to the shared orb-center image size
- the previous home orb demotes into a normal bubble and takes the selected bubble's former slot
- all other bubbles disappear in place by scaling down and fading out with stagger

This plan applies only to Bubble Home. Do not integrate Bubble Home into AI Mode or change the other three product surfaces except for a minimal shared orb-center helper extension if Bubble Home needs it.

## In scope

- Bubble Home hover-and-release selection behavior in `bubble.html` / `src/bubble-page.js`.
- Runtime swap between the selected bubble content and the current home-orb content.
- Motion choreography for:
  - promoted selected bubble -> new orb
  - demoted old orb -> normal bubble
  - sibling bubbles disappearing in place with stagger
- Preserving Bubble Home use of the shared Celestial orb shell and shared orb-center DOM.
- Bubble content/theme resolution needed so eligible top-level bubbles can become the home orb.
- Keyboard behavior after a swap.

## Out of scope

- AI Mode integration.
- New persistence keys.
- Child-action selection redesign.
- Reworking the global Celestial visual recipe.
- Replacing the shared orb DOM with a Bubble-only orb implementation.
- Changing Bubble Home layout coordinates, viewport size, or overall cluster composition.
- Turning Spotify or the two profile bubbles into selectable home-orb promotions.

## Relevant context

- Bubble Home is a separate exploratory surface and must stay separate from AI Mode.
- `src/bubble-page.js` currently treats `BUBBLES_CONFIG` as both geometry and content, and on release every bubble collapses back toward the bottom-orb origin by returning to `targetX = 0`, `targetY = 0`, `targetScale = 0.2`.
- The new interaction is not a simple icon-capture overlay. It is a content swap between:
  - the selected bubble slot in the field
  - the current home-orb content at bottom center
- Bubble Home already uses the shared Celestial orb shell and shared orb-center markup through:
  - `src/shared/ai-orb-icon.js`
  - `src/styles/shared.css`
- The shared orb-center image size is `36px x 36px`. The new selection motion must resolve the promoted bubble icon to that exact size.
- Bubble Home hover logic is derived from the drag center probe while pressed. Selection should therefore trigger only from a pressed/open field followed by release over a hovered top-level bubble.
- Spotify and the two profile bubbles are excluded from this selection-swap interaction. Releasing over them should behave like a normal close, not a promotion.
- Motion should read as a physical swap, not a fade, teleport, or generic icon replacement.

## Files to inspect

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `src/shared/ai-orb-icon.js`
- `src/styles/shared.css`
- `docs/product-specs/bubble-home.md`
- `docs/FRONTEND.md`
- `docs/design-docs/ai-orb.md`

## Files allowed to change

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `src/shared/ai-orb-icon.js` only for a minimal shared orb-center image API extension
- `src/styles/shared.css` only if the shared orb-center helper needs shared animation/state hooks
- `docs/design-docs/ai-orb.md` only if the shared orb-center contract is broadened
- `docs/FRONTEND.md` only if implementation changes durable frontend truth
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Add a Bubble Home runtime occupancy layer instead of mutating `BUBBLES_CONFIG` directly.
   - Keep `BUBBLES_CONFIG` as the stable slot geometry source: `id`, `x`, `y`, `zIndex`, layout metrics.
   - Add a page-local content assignment layer so each slot can render a current occupant.
   - Model two separate concepts:
     - `homeOrbContent`
     - `slotContentById`
   - A successful selection swaps:
     - `homeOrbContent <- selected slot content`
     - `slotContentById[selectedId] <- previous homeOrbContent demoted as a normal bubble`
   - Do not rewrite this as persistence. Keep it runtime-only in Bubble Home state.

2. Normalize top-level bubble content into swappable descriptors.
   - Add one resolver that returns Bubble Home content for a slot occupant:
     - `kind: 'bubble-content' | 'orb-content'`
     - `imageSrc`
     - `fill`
     - `halo/orb theme`
     - optional `isPill`, `pillTitle`, `pillSubtitle`, `subIcon`, `childActions`
     - `orbPromotionEnabled`
   - Add an explicit descriptor for the demoted home orb:
     - image-only
     - circular
     - no orb chrome
     - no pill copy
     - no child submenu
      - `orbPromotionEnabled: false`
   - Mark these existing bubbles as `orbPromotionEnabled: false`:
     - Spotify
     - Tony
     - Hiro
   - Do not scatter special-case swap logic across render branches.

3. Separate displayed home-orb content from agent-cycle memory.
   - The current `state.orbAgentId` is not sufficient once Bubble Home can show arbitrary bubble imagery such as Note, Map, Weather, Spotify, or profile photos in the home orb.
   - Add:
     - `state.homeOrbContent`
     - `state.lastAgentOrbId`
   - Rule:
     - `homeOrbContent` drives what the bottom orb currently shows.
     - `lastAgentOrbId` preserves the ArrowLeft/ArrowRight cycle position for agent-only keyboard switching.
   - If the user presses ArrowLeft/ArrowRight while the home orb currently shows a non-agent bubble image, switch immediately back into the agent sequence using `lastAgentOrbId` as the sequence anchor.

4. Extend the shared orb-center helper only if needed for direct image sources.
   - Bubble Home must keep using the shared orb shell and center DOM.
   - If `src/shared/ai-orb-icon.js` only supports named icon IDs, extend it minimally so Bubble Home can render:
     - `kind: 'image'`
     - `src`
     - `alt`
     - `theme`
   - Preserve current named-icon persistence behavior for AI Mode and Prototype Mode.
   - Do not create a Bubble-only orb markup fork.

5. Add explicit selection trigger rules.
   - A swap can start only when all conditions are true:
     - the field is currently open (`state.isPressed`)
     - an eligible top-level bubble is hovered on release
     - no child bubble is hovered
     - no swap animation is already in progress
   - Releasing with no hovered top-level bubble keeps the current close behavior.
   - Releasing over Spotify, Tony, or Hiro keeps the current close behavior.
   - Releasing over a child chip/action must not trigger the top-level swap.
   - The hovered bubble highlight should freeze for the first `120ms` of the swap so the promotion reads as continuous.

6. Add a page-local swap transition state object.
   - Suggested shape:
     - `active`
     - `selectedBubbleId`
     - `selectedReleaseCenter`
     - `bottomOrbCenter`
     - `promotedContent`
     - `demotedContent`
     - `startedAt`
     - `durationMs`
     - `collapseDurationMs`
   - Use:
     - `durationMs = 720`
     - `collapseDurationMs = 300`
     - sibling stagger remains `35ms`
   - Keep this state in `src/bubble-page.js`. Do not persist it.

7. Build the promoted selected-bubble motion as a true migrating orb.
   - On release, create a transition layer anchored at the selected bubble's live icon center.
   - For standard circular/image bubbles:
     - source icon is the currently displayed bubble image
   - For pill bubbles:
     - source icon is only the leading circular image region, not the full pill copy width
   - Orb-shell bloom:
     - begins at `0ms`
     - starts behind the selected icon at the selected bubble center
     - resolves to the fixed home-orb diameter of `80px` by `180ms`
     - should feel soft and a bit liquid, not rigid or mechanical
     - use a two-phase scale shape:
       - fast bloom to about `1.04` of final shell size by `150ms`
       - settle back to final `1.00` by `220ms`
     - overshoot must stay very subtle; it should read as pressure release, not bounce
     - preferred easing:
       - bloom phase `cubic-bezier(0.2, 0.9, 0.22, 1.12)`
       - settle phase `cubic-bezier(0.32, 0.0, 0.2, 1)`
     - add a slight organic rim/refraction drift during the bloom:
       - no more than `2px` of apparent shape breathing
       - no wobble or jello effect
     - the shell should visually feel like it is forming from fluid glass around the bubble icon, with Apple-like restraint
   - Promoted icon scale:
     - animate from the live selected icon size to `36px`
     - reach `36px` by about `55%` of the total motion
   - Travel:
     - source: selected bubble center at release
     - destination: `(210, 356)`
     - duration: `720ms`
     - easing: `cubic-bezier(0.22, 1, 0.36, 1)`
     - path: mostly direct, with a subtle `-8px` lift at about `24%` so the motion feels guided rather than robotic
   - The promoted orb must carry the selected bubble's orb theme from frame one of the bloom, not switch late.

8. Build the demoted old-orb motion as the matching counter-move.
   - At the same release moment, the existing bottom orb demotes into a normal bubble.
   - Demotion motion:
     - start at bottom orb center `(210, 356)`
     - destination: selected bubble's release center
     - duration: `720ms`
     - easing: `cubic-bezier(0.22, 1, 0.36, 1)`
   - Visual rules:
     - shared orb shell/rim/refraction fade out within the first `120ms`
     - the old home-orb center image grows from `36px` to the selected slot's live bubble icon diameter
     - once settled in the slot, it renders as a normal Bubble Home image bubble with no orb container
   - This demoted bubble becomes the new slot occupant after the swap completes.

9. Change sibling close motion to an in-place staggered disappear.
   - Every non-selected top-level bubble must stay anchored at its own release position.
   - Each sibling should only:
     - scale down
     - fade out
   - Keep the existing close timing shape unless a small adjustment is required:
     - duration `300ms`
     - stagger `35ms`
     - exit ease `cubic-bezier(0.42, -0.14, 0.7, 0.68)`
   - Suggested end state:
     - opacity `0`
     - scale `0.2`
   - No sibling bubble should translate toward either:
     - the selected bubble slot
     - the old bottom orb
   - The selected bubble itself does not use this generic disappear motion; it is removed from sibling handling and managed by the promoted-orb transition layer.
   - The demoted old-orb bubble is also removed from sibling handling and managed by the counter-move above.

10. Commit the swap only after the choreography finishes.
   - Do not mutate `homeOrbContent` and `slotContentById[selectedId]` at release start.
   - Keep the live field rendered from the pre-swap state during motion layers.
   - At `720ms`, atomically commit:
     - `homeOrbContent = promoted selected content`
     - `slotContentById[selectedId] = demoted previous orb content`
   - Then clear transition layers and return Bubble Home to the normal closed state.
   - On the next open, the newly selected app must already be the home orb, and the previous orb must already appear in the selected slot as a normal bubble.

11. Define theme mapping and visual fallback rules explicitly.
   - Every eligible top-level bubble that can become the home orb needs a stable orb theme.
   - Reuse existing theme data when present:
     - AI orb themes from `src/shared/ai-orb-icon.js`
     - bubble `haloColor` where already defined
   - Add explicit Bubble Home theme mappings for eligible slots that do not yet have one, including:
     - Health
     - Map
     - Note
     - Weather
   - Do not derive theme values ad hoc inside render loops.

12. Preserve current hover, child-menu, and keyboard outcomes.
   - Hover while pressed should still use the current top-level bubble highlight system.
   - Long-hold child-menu behavior should stay unchanged for bubbles that still own child actions.
   - The demoted old-orb bubble has no child actions by default.
   - ArrowLeft/ArrowRight behavior:
     - ignored while the `720ms` swap animation is in flight
     - after the swap, arrow cycling still works
     - agent cycling may replace the currently selected bubble orb with an AI agent orb again, which is acceptable
   - No new keyboard shortcut is introduced in this task.

## Acceptance criteria

- While the field is open, releasing over an eligible hovered top-level bubble starts a visible role-swap animation.
- The selected bubble blooms an orb shell behind itself before traveling to the bottom-center home-orb position.
- That shell growth feels soft, slightly liquid, and restrained, with only a very subtle overshoot.
- The promoted bubble icon scales down to the shared orb-center size of `36px`.
- The old bottom orb visibly demotes into a normal bubble and lands in the selected bubble's former slot.
- Other bubbles scale down and fade out at their own positions with stagger; they do not travel toward the selected slot or the old bottom orb.
- The selected bubble becomes the new closed-state home orb after the motion completes.
- On the next open, the previous home orb appears in the selected slot as a normal bubble.
- No page-local orb fork is introduced; the home orb still uses the shared Celestial orb shell and shared orb-center DOM.
- Releasing over Spotify, Tony, or Hiro does not trigger the role swap.
- Releasing over a child action does not trigger the top-level bubble swap.
- ArrowLeft/ArrowRight still work after the swap completes.

## Validation checklist

- Run Bubble Home locally and verify the swap for at least:
  - one AI bubble (`ChatGPT` or `Gemini`)
  - one utility bubble (`Note`, `Map`, or `Weather`)
  - one eligible pill bubble (`Health`)
- Verify the selected bubble becomes the new bottom home orb after the animation.
- Verify the previous home orb appears in the selected slot as a plain bubble on the next open.
- Verify all non-selected bubbles disappear in place with stagger and do not translate toward the selected slot or the old bottom orb.
- Verify releasing over Spotify does not start the swap.
- Verify releasing over Tony does not start the swap.
- Verify releasing over Hiro does not start the swap.
- Verify releasing over a child action does not start the swap.
- Verify ArrowLeft/ArrowRight are ignored during the `720ms` swap and still work afterward.
- Verify a second swap from a different bubble works after the first swap completes.
- Verify no orphan transition layers remain in the DOM after the animation completes.
- Verify `node --check src/bubble-page.js`
- Verify `git diff --check`

## Risks / notes

- The current Bubble Home file mixes slot geometry and content. The cleanest implementation is a narrow runtime occupancy layer, not a full rewrite.
- Shared orb-center helpers may need a small generic-image extension. If that extension is added, document it because it changes durable shared orb truth.
- Pill bubbles need explicit handling so only the lead circular icon promotes into the orb; the full pill width must not animate to bottom.
- Because the home orb can now show arbitrary bubble imagery, keyboard agent-cycle state and displayed home-orb content must be tracked separately.

## Open questions

- None. Current repository context is sufficient for implementation.
