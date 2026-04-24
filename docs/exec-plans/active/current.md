# Title

Bubble Home bubble-to-orb capture interaction

## Status

Planner-authored active task. Ready for implementation.

## Objective

Add a Bubble Home interaction where releasing on an eligible hovered bubble sends that bubble’s icon into the center orb, replaces the orb’s current agent image, and preserves the selected bubble’s accent color on the orb.

This is Bubble Home only. Do not change AI Mode, Prototype Mode, or Celestial Tool behavior except through existing shared orb primitives already used by Bubble Home.

## In scope

- Bubble Home hover-release capture behavior in `bubble.html` / `src/bubble-page.js`.
- Eligibility rules for which bubbles can be captured into the orb.
- Motion implementation for the bubble icon traveling into the orb.
- Shared-orb image swap at the end of the travel.
- Temporary magic glow on the orb during the capture.
- Preserving the captured bubble’s accent color on the orb after the capture.
- Keyboard agent cycling behavior must remain intact after this feature.

## Out of scope

- Integrating Bubble Home with AI Mode flows.
- Changing Bubble Home layout, bubble positions, or cluster composition.
- Replacing the orb with arbitrary non-image content.
- Applying this capture interaction to Spotify or the two profile bubbles.
- New storage keys or persistence behavior.
- Reworking the shared AI listening/thinking orb contract.

## Relevant context

- Bubble Home is a separate exploratory surface and must stay separate from AI Mode for now.
- Celestial visual-core changes must flow through shared systems, but Bubble Home page interaction logic still belongs in `src/bubble-page.js`.
- Bubble Home already uses the shared orb center/image system from `src/shared/ai-orb-icon.js`.
- Bubble Home already supports left/right agent switching and per-agent orb accent color.
- The current orb render loop can preserve a page-chosen theme through color overrides passed into `applyBubbleCelestialChrome(...)`.
- This new feature should feel like a deliberate Apple-quality capture motion, not a generic fade or teleport.

## Files to inspect

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `src/styles/shared.css`
- `src/shared/ai-orb-icon.js`
- `docs/product-specs/bubble-home.md`
- `docs/design-docs/ai-orb.md`
- `docs/FRONTEND.md`

## Files allowed to change

- `src/bubble-page.js`
- `src/styles/bubble-page.css`
- `src/styles/shared.css`
- `src/shared/ai-orb-icon.js` only if the existing shared orb center API needs a small extension for Bubble Home capture
- `docs/exec-plans/completed/handoff.md`
- update docs only if implementation changes durable project truth

## Implementation steps

1. Add explicit Bubble Home capture eligibility data.
   - Do not hardcode behavior in a scattered `if bubble.id !== ...` style across event handlers.
   - Add a bubble-level field in `BUBBLES_CONFIG`, for example `orbCaptureEnabled`.
   - Set `orbCaptureEnabled: false` for:
     - Spotify pill bubble
     - both profile/contact bubbles
   - Set `orbCaptureEnabled: true` for the remaining eligible bubbles.
   - Bubble capture must be data-driven so future bubbles can opt in/out by config only.

2. Add Bubble Home capture state.
   - Add a page-local state object for the in-flight capture animation. Suggested fields:
     - `active: boolean`
     - `bubbleId: number | null`
     - `imageSrc: string | null`
     - `theme: object | null`
     - `startedAt: number`
     - `durationMs: number`
   - Keep this in `src/bubble-page.js`. Do not persist it.
   - Preserve `state.orbAgentId` and current orb theme logic; this feature is an additional Bubble Home capture path, not a replacement for the existing agent-cycle path.

3. Add a reusable capture trigger seam.
   - Add a narrow page-local function for starting the motion. Suggested signature:
     - `startBubbleToOrbCapture(bubble, now)`
   - Add a resolver that converts a bubble config into orb capture payload. Suggested signature:
     - `resolveBubbleOrbCapturePayload(bubble) -> { imageSrc, theme } | null`
   - Current behavior:
     - return `null` for ineligible bubbles
     - return the bubble’s icon image source and halo/accent-derived theme for eligible bubbles
   - This seam must make future expansion easy if more bubble types are added.

4. Hook the interaction into Bubble Home release behavior.
   - On release, if the pointer is currently hovering an eligible bubble, trigger the capture.
   - The capture should occur when releasing from the long-press/open state, not on mere hover.
   - If no eligible bubble is hovered on release, keep current close behavior unchanged.
   - If an ineligible bubble is hovered on release, keep current close behavior unchanged.
   - If a capture is already in progress, a new release should not start a second overlapping capture.

5. Build the traveling icon layer.
   - Create one temporary visual layer per capture, positioned above the bubble field and below any debug UI.
   - The moving layer should use the hovered bubble’s displayed icon art, not a blank circle.
   - Do not animate the real bubble DOM node into the orb. Use a cloned/snapshot-style travel layer so layout and bubble field state remain stable.
   - The travel layer should be absolutely positioned relative to the Bubble Home canvas.

6. Motion spec for the bubble-to-orb travel.
   - Source:
     - from the hovered bubble’s current rendered icon center
   - Destination:
     - orb center point
   - Duration:
     - `560ms`
   - Easing:
     - `cubic-bezier(0.22, 1, 0.36, 1)`
   - Scale:
     - start `1`
     - peak `1.08` around `24%`
     - end `0.9`
   - Opacity:
     - start `1`
     - stay `1` until about `82%`
     - end `0`
   - Blur:
     - start `0px`
     - end `2px`
   - Path:
     - primarily direct center-to-center travel
     - allow a subtle upward arc of `-10px` at mid-flight so it feels guided rather than mechanical
   - The motion must feel smooth and continuous, with no snap at the end.

7. Orb response during capture.
   - The orb body should stay in place. Do not move the orb to meet the bubble.
   - Add a temporary magic glow during capture:
     - begin within `0-40ms` of capture start
     - peak at about `40%`
     - fade by `100%`
   - Glow spec:
     - use the incoming bubble’s theme colors, not a generic blue/purple fallback
     - outer glow should remain subtle
     - inner glow/rim pulse should be the primary read
   - Orb scale response:
     - `1 -> 1.035 -> 1`
     - duration `560ms`
     - same easing `cubic-bezier(0.22, 1, 0.36, 1)`
   - Do not squash the orb during this interaction.

8. Replace the orb center image at the correct timing.
   - The orb should keep the previous center image until the incoming bubble icon is almost inside the orb.
   - Swap timing:
     - around `76%` of the capture motion
   - The final orb center image should become the captured bubble image, not the previous Bixby/Gemini/ChatGPT asset.
   - Do not route this through the shared agent-cycle semantics if that forces the wrong icon set or wrong swipe motion.
   - If needed, extend `src/shared/ai-orb-icon.js` with a small generic “set center image src directly” helper, but do not fork the orb DOM structure.

9. Preserve the captured accent color after release.
   - The orb accent rim/blob colors should switch to the captured bubble’s theme and remain there after the animation completes.
   - Long press after capture must keep that captured theme.
   - Left/right arrow agent switching after capture may replace the orb image/theme again; that is allowed.
   - The theme source should come from Bubble Home’s existing orb render override path, not page-local CSS hacks.

10. Bubble type mapping rules.
   - Spotify bubble:
     - no capture
   - Two profile/contact bubbles:
     - no capture
   - Image/icon bubbles such as note/map/health/weather:
     - capture their own visible image asset
   - ChatGPT bubble:
     - capture `src/assets/figma-chatgpt.png`
   - Gemini bubble:
     - capture `src/assets/figma-gemini.png`
   - The captured theme should come from the bubble’s own visual accent:
     - use existing `haloColor` where available
     - if a richer two-color mapping is needed, derive it in a single Bubble Home resolver function

11. Keep the implementation cleanly separated.
   - Page orchestration and interaction logic stay in `src/bubble-page.js`.
   - Shared orb-core DOM/CSS remain in `src/shared/ai-orb-icon.js` and `src/styles/shared.css`.
   - Bubble Home-specific capture staging and path visuals belong in `src/styles/bubble-page.css`.
   - Do not create a Bubble Home-specific orb system.

## Acceptance criteria

- Releasing on an eligible hovered bubble starts a visible icon-to-orb capture animation.
- Spotify and the two profile/contact bubbles do not trigger capture.
- The moving icon clearly originates from the hovered bubble and ends at the orb center.
- The orb does not jump or squash during the capture.
- The orb shows a temporary magic glow using the incoming bubble’s theme.
- Near the end of the motion, the orb center image changes to the captured bubble image.
- After capture completes, the orb keeps the new image and its matching accent color.
- Long pressing again does not reset the orb color back to the old purple default.
- Left/right arrow agent switching still works after this feature.
- Existing child bubble hover/highlight behavior remains unchanged.

## Validation checklist

- Run Bubble Home locally and verify release-on-hover capture for at least:
  - ChatGPT bubble
  - Gemini bubble
  - one non-AI utility bubble such as note or map
- Verify Spotify bubble does not capture.
- Verify both profile/contact bubbles do not capture.
- Verify the orb keeps the captured theme during the next long press.
- Verify left/right arrow switching still changes the orb after a capture.
- Verify no duplicate moving layer remains in the DOM after animation completes.
- Verify `node --check src/bubble-page.js`
- Verify `git diff --check`

## Risks / notes

- The orb center system currently assumes agent-like image ownership. If the shared helper is too agent-specific, extend it minimally instead of bypassing the shared orb structure.
- Keep the capture state page-local; this is exploratory Bubble Home behavior, not a new global orb contract.
- Use one clear Bubble Home resolver for capture image/theme mapping so future bubbles do not require scattered edits.
- Preserve the other three product surfaces unchanged unless a tiny shared helper extension is strictly necessary.

## Open questions

- None. Current repo context is sufficient for implementation.
