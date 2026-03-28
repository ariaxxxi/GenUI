# Handoff

## Task title
Message Confirm Action Row Removal

## Completion status
- Completed

## Summary
- Removed the three-button confirm action row from the message flow confirm screen.
- Updated [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) so `GS.CONFIRM` emits no control actions to the external controls layer.
- Updated [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js) so confirm no longer advertises a `0..2` keyboard selection range after the buttons were removed.
- Voice-driven confirm behavior remains unchanged:
  - `send`
  - `edit`
  - `cancel`

## Files changed
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after removing the confirm controls row.

## Recommended next step
1. Open the message flow confirm screen.
2. Verify the three-button row is gone.
3. Verify voice commands still handle `send`, `edit`, and `cancel`.

## Task title
Flight Confirm Container Focus Parity

## Completion status
- Completed

## Summary
- Compared the current `new-msg-motion` flight confirm controller against `origin/main` instead of continuing with the simplified local confirm logic.
- Restored the `main` branch confirm navigation contract in `src/flows/flight-booking.js`:
  - `ArrowUp` from the confirm button row now jumps focus to the confirm container
  - `ArrowDown` from the focused container now returns focus to the first action button
  - `Space` on the focused container expands details
  - `Space` while details are expanded collapses them again
- Kept the previously fixed recommendation handling in sync with the same `main` branch interaction pattern so the confirm-stage behavior is no longer divergent.

## Files changed
- `src/flows/flight-booking.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/flight-booking.js`

## Remaining issues / caveats
- No live browser verification was run after restoring the `main` branch confirm navigation rules.

## Recommended next step
1. Run the flight flow to the confirm step.
2. Press `ArrowUp` from the action row and verify the confirm container highlights.
3. Press `Space` to expand, then `Space` again to collapse.

# Handoff

## Task title
Compose Entry Animation Visibility Fix

## Completion status
- Completed

## Summary
- Found the actual reason the compose contact header and `"Speak your message..."` placeholder still appeared abruptly after the prior timing changes.
- Root cause: during disambiguation -> compose, the renderer was still forcing the entire compose overlay (`#c-rich`) to `opacity: 0`, which hid the child header/placeholder animations until the parent snapped visible.
- Fixed in `src/flows/message-send-render.js` by removing that parent-level opacity gate for the disambiguation -> compose entry path.
- Result: the header and placeholder now rely on their own CSS entry animations instead of being masked by the parent container.

## Files changed
- `src/flows/message-send-render.js`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this render-path fix.

## Recommended next step
1. Trigger the Hiro disambiguation path again.
2. Verify the contact header now fades/floats in visibly over `300ms`.
3. Verify `"Speak your message..."` now starts fading in before the compose shell fully settles.

## Task title
Compose Entry Header + Placeholder Timing

## Completion status
- Completed

## Summary
- Updated the disambiguation -> compose entry so the contact header now fades in and floats up from below over `300ms`.
- Moved the compose overlay content reveal earlier on that same transition so entry content is no longer hidden for the full shell morph.
- Updated the `"Speak your message..."` placeholder entry to start before the container reaches its final shape:
  - delay `180ms`
  - duration `300ms`

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this entry-timing adjustment.

## Recommended next step
1. Trigger the Hiro disambiguation path and verify the compose header now rises/fades in over `300ms`.
2. Verify the placeholder begins appearing before the compose shell fully settles, rather than after the full morph completes.

## Task title
Send Message Flow Timing Update

## Completion status
- Completed

## Summary
- Increased the disambiguation -> compose handoff to `600ms` across the message-send flow so the compose surface waits on the longer transition instead of snapping in after the old short delay.
- Updated the disambiguation pill exit animation to `600ms` to match that handoff timing.
- Set compose chip appear and disappear motion to `1000ms` in both directions, including the stack container fade timing, so the chip open/close reads as one consistent duration.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after these timing adjustments.

## Recommended next step
1. Trigger the send-message flow, go through the Hiro disambiguation path, and verify the compose step now lands after a `600ms` handoff.
2. Hold and release `L` in compose and verify chip open and close both read as `1000ms` motion.

## Task title
Compose Header Transition Root-Cause Fix

## Completion status
- Completed

## Summary
- Found the actual reason the compose contact header still had no fade transition on `L` open: opening the chip menu was doing a full compose rerender.
- That replaced the header DOM node in its final hidden state, so the CSS transition never had a stable before/after frame to animate.
- Fixed in `src/flows/message-send.js` by switching the compose-menu open path to the existing DOM-only update seam:
  - `render.updateComposeMenuUiOnly?.() || render.render(false)`
- Result: the header should now transition on the same DOM node during both open and close instead of popping due to rerender replacement.

## Files changed
- `src/flows/message-send.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after this open-path fix.

## Recommended next step
1. Hold `L` to open chips and verify the header now fades/slides out instead of popping.
2. Release `L` and verify the header fades/slides back in on the same node during close.

# Handoff

## Task title
Compose Chip Close Fade 200ms

## Completion status
- Completed

## Summary
- Shortened the compose chip close fade timing from `300ms` to `200ms` while keeping the overall close movement at `800ms`.
- Implemented by moving the close keyframe opacity cutoff from `37.5%` to `25%` of the `800ms` animation.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this timing update.

## Recommended next step
1. Hold and release `L` and verify chips are visually gone by about `200ms` while the absorb-back movement continues.

## Task title
Compose Chip Close Timing Split

## Completion status
- Completed

## Summary
- Restored the compose chip close movement duration to `800ms`.
- Kept fade-out faster by moving opacity to `0` at the `300ms` point inside the same close keyframe.
- Result: chips still travel back with the longer absorb motion, but visually disappear much earlier instead of staying fully visible through the whole `800ms` path.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this timing split adjustment.

## Recommended next step
1. Hold and release `L` and verify chip movement still lasts `800ms`.
2. Verify chip opacity is effectively gone by about `300ms` into the close animation.

## Task title
Compose Header Smooth Toggle + Faster Chip Close

## Completion status
- Completed

## Summary
- Smoothed the compose contact-header show/hide behavior during the `L`-menu lifecycle by updating the header opacity/translate transition to a `220ms` cubic-bezier motion on the existing class-toggle path.
- Shortened the compose chip dismiss animation from `400ms` to `200ms` so chips fade/absorb back faster when released.
- Also reduced per-chip close staggering so the whole dismiss reads as one tighter close gesture instead of a slow cascade.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this motion timing adjustment.

## Recommended next step
1. Hold and release `L` in compose and verify the header now fades/slides smoothly instead of popping.
2. Verify chip dismiss now completes in roughly `200ms` and still reads as absorption back into the compose field.

## Task title
Compose Empty Height 96px + Bottom Anchor 12px

## Completion status
- Completed

## Summary
- Increased the empty compose placeholder-state shell height to `96px` on both the geometry path and the live compose-field CSS.
- Reduced the compose/confirm field bottom margin to `12px` at all compose-layout states by moving the bottom anchor from `380` to `408` inside the `420px` stage.
- This affects the real shell position, so compose and confirm now sit lower with a consistent `12px` bottom gap.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this sizing/anchor adjustment.

## Recommended next step
1. Verify empty compose now renders at `96px` tall.
2. Verify compose and confirm both sit `12px` above the frame bottom.

## Task title
Compose Placeholder Wrap-Glitch Guard

## Completion status
- Completed

## Summary
- Identified the remaining visual glitch source in empty compose: the placeholder text was still allowed to wrap while the compose shell was animating wider from the orb.
- Updated the live empty placeholder styling so it stays on a single line during the morph:
  - fixed content width inside the field
  - `white-space: nowrap`
  - overflow clipped instead of wrapping to two lines
- This works with the existing `400ms` delayed reveal so the empty compose entry no longer shows the two-line -> one-line placeholder glitch during shell expansion.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; no syntax validation needed

## Remaining issues / caveats
- No live browser verification was run after this placeholder wrap guard.

## Recommended next step
1. Verify disambiguation -> compose no longer shows the placeholder wrapping to two lines before settling.
2. If any residual visual glitch remains, inspect only the shell-width timing versus the `400ms` reveal delay next.

## Task title
Compose Empty-State Height + Placeholder Delay

## Completion status
- Completed

## Summary
- Reduced the empty compose field to a one-line-tall shell on the actual compose geometry path.
- Updated the live compose-field CSS so the empty state now matches that shorter shell instead of keeping the older tall empty-field styling.
- Added a placeholder-only delayed reveal on the disambiguation -> compose transition:
  - `Speak your message...` stays hidden for `400ms`
  - then fades/slides in over `220ms`
- This delay applies only when entering empty compose from disambiguation. It does not affect active text compose or confirm.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser verification was run after this empty-state adjustment.

## Recommended next step
1. Verify disambiguation -> compose now shows the shell first, then the placeholder after `400ms`.
2. Verify the empty compose shell is visually one line tall and still expands upward correctly once dictation text appears.

## Task title
Compose Morph Regression Root-Cause Fix

## Completion status
- Completed

## Summary
- Performed a deeper runtime inspection of the actual compose morph path.
- Root cause found in `/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js`:
  - once compose voice viz was retargeted to the real visible field (`#drop-main.compose-surface`), the dictation path still did `field.style.transition = 'min-height ... box-shadow ...'`
  - when `field` is `#drop-main`, that overwrites the shell’s normal transition property
  - which removes width / height / transform / border-radius transitions from the real morphing shell
  - result: subsequent compose shell geometry changes read as jumps instead of morphs
- Fixed by making the voice engine preserve shell transitions on the real field:
  - if the target is `#drop-main`, do not write `style.transition`
  - still apply live voice viz through `box-shadow`
  - cleanup paths no longer clear `transition` on `#drop-main`
- This preserves the compose shell’s morph animation while keeping the live voice visualization on the real visible field.

## Files changed
- `src/ai/voice-engine.js`
- `context/handoff.md`

## Validation performed
- `node --check src/ai/voice-engine.js`

## Remaining issues / caveats
- No live browser verification was run after this root-cause fix.

## Recommended next step
1. Verify disambiguation -> compose now morphs on the real shell.
2. Start dictation and verify compose growth still morphs while voice viz remains active.
3. If any residual non-morph remains after this, inspect only the compose-entry sequencing path next; the voice-engine transition override bug is now removed.


## Task title
Compose Entry Morph Sequencing Fix

## Completion status
- Completed

## Summary
- Performed a deeper inspection of the compose morph path and found the key sequencing difference from `main`.
- Root cause: current compose entry was rendering the final compose UI immediately, then trying to morph the shell. That visually overrode the orb->field transition, so it read as a jump even though shell geometry was changing.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js` by restoring a shell-first compose entry path:
  - set compose state/data
  - compute compose geometry
  - call the shell morph first
  - only render the compose content after a short delay (`120ms`) once the shell has started morphing
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` by:
  - exposing `composeGeo()` for the compose-entry path
  - tracking the first empty->text boundary (`prevComposeHasText`)
  - briefly delaying rich-content reveal on that boundary as well, so the shell expansion is visible instead of being visually flattened by immediate final content
- Result: both disambiguation -> compose and the first compose growth into active dictation now use a shell-first sequence instead of immediate final-layout replacement.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser verification was run after this sequencing change.

## Recommended next step
1. Verify disambiguation -> compose now visibly morphs from orb to field.
2. Start dictation from empty compose and verify the first expansion now reads as a morph instead of a snap.
3. If any residual snap remains after this, inspect repeated interim transcript updates during active dictation next.


## Task title
Compose Morph Visibility Fix

## Completion status
- Completed

## Summary
- Addressed the compose-shell jump in two places.
- First fix: `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js`
  - `handleInputChange()` now detects the empty <-> non-empty text transition and calls `render.render(true)` for that boundary.
  - This makes the first compose-field expansion use the explicit morph path instead of the lighter update path.
- Second fix: `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js`
  - entering compose from disambiguation now delays the rich-content reveal briefly (`120ms`) while the shell begins morphing.
  - Root cause here was perceptual: the compose content was being swapped to its final layout immediately, which visually overrode the shell morph and made the orb->field change read like a jump.
  - The shell still morphs through the normal geometry path, but the content now fades in after the morph begins so the transition is visible.
- Result: disambiguation -> compose should read as an orb morph into the compose field, and the first voice/text expansion should use the morph path rather than snapping.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser pass was run after this fix.

## Recommended next step
1. Verify disambiguation -> compose now visibly morphs before the content fully appears.
2. Start dictation from empty compose and verify the first field expansion uses the morph path.
3. If there is still residual snap after this, the next seam to inspect is repeated interim transcript renders while dictation is active.


## Task title
Compose Field Snap-to-Width Fix

## Completion status
- Completed

## Summary
- Investigated the compose/disambiguation jump where the compose field appeared to snap instead of morphing.
- Root cause: the inner compose wrapper (`.g-compose-field-wrap`) was still using fixed widths (`307px` / `420px`) independent of the morphing outer shell. That let the visible field content snap to its final size immediately while `#drop-main` was still animating.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css` by making `.g-compose-field-wrap` follow the shell directly:
  - `left: 0`
  - `transform: none`
  - `width: 100%`
- Removed the `420px` hardcoded width override in `.g-compose-stage.has-text .g-compose-field-wrap` as well.
- Result: the visible compose field now inherits the morphing shell width/height instead of jumping to a separate fixed-size layout during disambiguation -> compose and empty -> active-text transitions.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only geometry alignment change.

## Remaining issues / caveats
- No live browser pass was run after this fix.

## Recommended next step
1. Verify disambiguation -> compose now morphs instead of snapping.
2. Start dictation and verify compose expansion tracks the shell transition instead of jumping.
3. If there is still residual snap, inspect the timing of `render.render(false)` on dictation interim updates next.


## Task title
Compose Surface Voice Viz Priority Fix

## Completion status
- Completed

## Summary
- Implemented the live voice visualization directly on the real visible compose field: `#drop-main.compose-surface`.
- Root cause: the compose shell CSS already set `box-shadow` with `!important`, so the voice engine’s normal inline `field.style.boxShadow = ...` writes could not win. That made the outer compose surface look static even though the voice engine was trying to update it.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js` by changing the compose-shell dictation path to use `style.setProperty('box-shadow', shadow(level), 'important')`.
- Updated cleanup paths to use `removeProperty('box-shadow')`, so when dictation stops the shell falls back to its normal CSS-defined resting state.
- This keeps the single real compose shell and makes it react live like the old temporary compatibility field did.

## Files changed
- `src/ai/voice-engine.js`
- `context/handoff.md`

## Validation performed
- `node --check src/ai/voice-engine.js`

## Remaining issues / caveats
- No live browser pass was run after this priority fix.

## Recommended next step
1. Enter compose and start dictating.
2. Verify `#drop-main.compose-surface` now visibly reacts to live voice level.
3. Verify confirm still stays static.


## Task title
Compose Duplicate Field Removal + Voice Viz Target Fix

## Completion status
- Completed

## Summary
- Removed the duplicated compose field caused by the temporary compatibility patch.
- Root cause: the real visible compose field is the outer `#drop-main.compose-surface`, but the previous fix reintroduced an inner `.g-listen-field.compose-input` field purely to satisfy the old voice engine selector. That created two visual compose surfaces: one real shell and one inner field.
- Fixed by restoring a single source of truth:
  - `/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js`: `renderComposeField()` now renders only the inner compose content wrapper again (`.g-compose-field`), without the old `g-listen-field compose-input` styling classes.
  - `/Users/ariax/Documents/GitHub/GenUI/src/ai/voice-engine.js`: the live voice visualization path now targets `#drop-main.compose-surface:not(.confirm-surface)` first, with `[data-compose-field]` only as a fallback. This makes the actual compose shell react to voice instead of requiring a duplicate inner field.
  - `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js`: compose exit transition now keys off `[data-compose-field]` instead of the removed old selector.
  - `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js`: removed the obsolete compose-input re-toggle block that belonged to the old inner-field path.
- Result: only one compose field remains visually, and the active voice viz is now applied to the real outer compose shell.

## Files changed
- `src/flows/ui-primitives.js`
- `src/ai/voice-engine.js`
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`
- `node --check src/ai/voice-engine.js`
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser pass was run after removing the duplicate field path.

## Recommended next step
1. Enter compose and confirm only one field is visible.
2. Start dictating and verify the outer compose shell reacts to voice.
3. Verify confirm still remains visually static with no duplicate field.


## Task title
Compose Voice Viz Main-Path Compatibility Fix

## Completion status
- Completed

## Summary
- Investigated why compose no longer reacted to live voice input like the old `main` implementation.
- Root cause: the old voice engine still targets `.g-listen-field.compose-input` for live box-shadow updates, pulse locking, and cleanup. The redesigned compose field had been rendered only as `.g-compose-field`, so it no longer matched the selector the voice engine drives.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js` by rendering the compose field with the old compatibility classes again: `.g-listen-field.compose-input`, plus `.has-text` when populated.
- Also mapped the inner text/placeholder nodes onto `.g-listen-text` / `.g-listen-empty` so the compose field follows the same legacy voice-reactive styling path.
- This restores the old main-branch integration path without undoing the newer compose layout structure.

## Files changed
- `src/flows/ui-primitives.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/ui-primitives.js`

## Remaining issues / caveats
- No live browser pass was run after restoring the old selector contract.

## Recommended next step
1. Enter compose and start dictating.
2. Verify the compose field now reacts to live voice input again.
3. Verify confirm still remains visually static.


## Task title
Compose Header Return + Voice Viz Restore

## Completion status
- Completed

## Summary
- Fixed the compose header so it returns when the chip stack is disappearing.
- Root cause: chip close uses the DOM-only compose menu update path, but that path was only toggling stack classes and never updating the header visibility class. As a result, the header stayed hidden until a later full rerender.
- Updated `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` so compose header visibility is driven by `composeMenuOpen && !composeMenuClosing` in both the full render path and `updateComposeMenuUiOnly()`. This makes the header come back as soon as the chips begin closing.
- Restored the compose voice-viz shell styling to the old `main` compose-input glow values in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css`.
- Tightened the `compose-text-active` trigger so it only applies in compose while text is present and the chip menu is not open.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`
- Compared `compose-text-active` shadow values against `main:src/styles/ai.css` old `g-listen-field.compose-input` styling.

## Remaining issues / caveats
- No live browser pass was run for this change.

## Recommended next step
1. Hold `L`, then release and verify the header returns during chip close.
2. Start speaking in compose and verify the field glow reacts like the older compose-input state.
3. Verify confirm still has no active voice glow.


## Task title
Compose Chip Second-Wave Jump Regression Fix

## Completion status
- Completed

## Summary
- Investigated the regression where the first three compose chips started jumping upward after the gap fix when the second two chips appeared.
- Root cause: the visible movement comes from the stack container growing upward from its bottom anchor, not from individual chip rows changing their own transforms. The earlier FLIP pass was applied to chip items, so it did not correctly animate the actual layout shift.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` by moving the FLIP animation to `.g-compose-chip-stack` itself. The update path now measures the stack rect before and after the visibility change, applies a temporary inverse translate to the stack, then lets it transition back to its resting transform.
- This preserves the new correct gap behavior while restoring a smooth upward push for the first three chips when the extra two appear.

## Files changed
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- Live browser verification is still needed to confirm the second-wave push now matches the earlier feel.

## Recommended next step
1. Hold `L` until the second wave appears.
2. Verify the first three chips now transition upward instead of snapping.
3. If motion still needs tuning, adjust only the stack transform transition timing in `src/styles/ai.css`.


## Task title
Compose Chip Release Timing Update

## Completion status
- Completed

## Summary
- Updated the compose chip release animation timing.
- Changed the chip disappear / absorb-back animation from `240ms` to `400ms` in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css`.
- This affects the release path for visible compose chips while the stack is closing.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only timing change; verified the updated animation rule in `src/styles/ai.css`.

## Remaining issues / caveats
- No live browser pass was run for this timing-only tweak.

## Recommended next step
1. Hold `L`, then release it.
2. Verify the chips now absorb back over `400ms`.
3. If the feel is still off, tune only the `compose-chip-out` duration/easing.


## Task title
Compose Chip Second-Wave Push Animation Fix

## Completion status
- Completed

## Summary
- Investigated the second-wave compose chip reveal where the first three chips jumped upward instead of transitioning.
- Root cause: when visible count changed from 3 to 5, the stack reflow moved the first three chips to their new flex positions immediately. There was no layout-transition logic for already-visible chips, so only the new chips animated while the existing ones snapped upward.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js` by adding a DOM-only FLIP pass in `updateComposeMenuUiOnly()`: capture previous chip rects, apply the new visibility state, measure the new rects, then animate the existing visible chips from their old positions to the new ones.
- Updated `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css` so `.g-compose-chip` includes a transform transition. This gives the first three chips a smooth upward push when the second two appear.

## Files changed
- `src/flows/message-send-render.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- Live browser verification is still needed to tune the exact feel of the upward push against the reference motion.

## Recommended next step
1. Hold `L` until the second wave appears.
2. Verify the first three chips now glide upward instead of snapping.
3. If the push still feels too stiff or too loose, tune only the transform transition timing in `src/styles/ai.css`.


## Task title
Compose Chip Stack Gap Root-Cause Fix

## Completion status
- Completed

## Summary
- Performed a direct spacing audit of the expanded compose chip stack.
- Root cause: hidden chips were still rendered as flex items inside `.g-compose-chip-stack`, so they continued reserving vertical space even before they were visible. That made the stack height larger than the visible chip count implied, which pushed the visible chips too far above the compose field.
- Secondary confirmation: the stack anchor itself is correct now. It is bottom-anchored from inside `.g-compose-field-wrap` using `bottom: calc(100% + 4px)`, so the bad distance was not from wrapper placement anymore.
- Fixed in `/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css` by making non-visible compose chips `display: none` and only visible chips `display: inline-flex`. This makes the stack height match the currently visible chip count, so the bottom visible chip tracks the compose field top edge correctly in both 3-chip and 5-chip states.

## Files changed
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- CSS-only change; root cause verified by inspecting the current compose chip stack DOM/CSS rules.

## Remaining issues / caveats
- Live browser verification is still needed to confirm the 3-chip and 5-chip bottom gap now matches visually.

## Recommended next step
1. Verify the gap with 3 visible chips.
2. Verify the gap again after the second-wave reveal to 5 chips.
3. If any residual offset remains, tune only the `bottom: calc(100% + 4px)` anchor, not the stack transform.


## Task title
Compose Chip Long-Press Interaction + Style Update

## Completion status
- Completed

## Summary
- Follow-up compose stack gap fix: removed the extra upward offset from `.g-compose-chip-stack.expanded`. Once the stack was correctly bottom-anchored to the field wrapper, the expanded transform was double-shifting the 5-chip state upward and creating the large gap.
- Follow-up compose wrapper fix: set `g-compose-field-wrap` to `height: 100%` so the chip stack anchor resolves against the compose shell height instead of an auto-expanded wrapper containing both chips and field. This keeps the chip stack bottom aligned to the field top edge.
- Follow-up compose anchoring fix: the chip stack is now rendered inside `g-compose-field-wrap` instead of as a stage-level sibling. Its `bottom: calc(100% + 4px)` anchor now resolves against the compose field wrapper, so the lowest chip tracks the field's top edge consistently.
- Follow-up compose chip anchoring fix: changed the chip stack from a fixed top offset to `bottom: calc(100% + 4px)`, so the lowest visible chip keeps a consistent gap above the compose field whether 3 or 5 chips are present.
- Follow-up compose chip position tweak: moved the chip stack anchor down (`top: -137px`) so the bottom chip sits much closer to the compose field, targeting roughly a `4px` gap.
- Follow-up compose chip spacing tweak: reduced chip top/bottom padding to `6px` and stack gap to `4px`, with chip minimum height adjusted accordingly.
- Follow-up release-motion fix: the compose chip stack now stays visible during `closing`, and release uses the DOM-only menu update path before teardown. This prevents the stack from disappearing immediately and lets the chip exit animation play as they are absorbed back into the field.
- Follow-up timing change: increased both the disambiguation pill entrance and compose chip entrance durations from `500ms` to `800ms`.
- Follow-up second-wave behavior fix: the extra two compose chips now appear via in-place DOM updates instead of a full re-render. The existing three chips are pushed upward by an `expanded` stack transform while only the newly visible chips animate in.
- Follow-up timing sync: set both the disambiguation pill entrance and compose chip entrance animations to `500ms` so the two reveal systems share the same duration.
- Follow-up compose motion fix: chip enter/exit keyframes now use large per-chip travel offsets so the chips visibly travel from the compose field up into their stack positions, instead of only rotating/fading near the destination.
- Follow-up chip style rollback: compose chips now use the previous `g-chip` state treatment again (unselected muted text + flat glass fill, selected white text + inset glow, no explicit white border), with text size reduced to `18px`.
- Follow-up motion fix: compose chips now use explicit `compose-chip-in` / `compose-chip-out` keyframe animations instead of relying on insertion-time transitions, fixing the jump-cut behavior where chips appeared with no visible entrance motion.
- Updated compose chip styling in [/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css):
  - chip text `24px -> 20px`
  - restored gradient outline treatment on chip shells
  - adjusted chip motion to use a softer rotational spread from the compose field instead of the old straight fade-up
- Reworked compose chip rendering in [/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js) and [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
  - chip stack now supports `visibleCount` and `closing`
  - first wave shows 3 chips
  - second wave can reveal 2 additional chips
- Reworked message compose state in [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - added long-press state for compose chips
  - `L` hold starts a delayed reveal (`280ms`)
  - after another `3000ms` of holding, 2 more chips appear if available
  - releasing `L` smoothly closes the chip stack back toward the compose field
  - while the key is being held, compose chips do not confirm into the next state
  - compose menu state now tracks `composeMenuHolding`, `composeMenuClosing`, and `composeMenuVisibleCount`
- Updated keyboard wiring in [/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js):
  - `keydown` on `L` in compose starts the hold interaction
  - `keyup` on `L` ends it and triggers the smooth close
  - old tap-to-toggle behavior was removed
- Extended contact chip data to 5 chips per contact so the second-wave reveal has real content instead of placeholder duplicates.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai.css`
- `src/ai/ai-bindings.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send.js`
- `node --check src/flows/message-send-render.js`
- `node --check src/flows/ui-primitives.js`
- `node --check src/ai/ai-bindings.js`
- `node --check src/flows/message-send-voice.js`

## Remaining issues / caveats
- Motion was tuned from the provided screen recording reference at a thumbnail level only; no frame-by-frame live browser validation was run.
- The new extra two chips are data additions in the local contact dataset; if product copy changes later, update the chip arrays in `message-send.js`.

## Recommended next step
1. Hold `L` in compose and verify first-wave 3-chip reveal timing.
2. Keep holding for 3 more seconds and verify 2 more chips appear with the same spread motion.
3. Release `L` and verify the chips absorb smoothly back toward the compose field.
4. If motion still needs tuning, only adjust the compose-chip transform/transition block in [/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css).

## Task title
Compose Surface Placement Fix

## Completion status
- Completed

## Summary
- Follow-up compose sizing fix: increased the active compose/confirm field max width from `351px` to `420px` and updated inner text width to fill that shell width correctly.
- Follow-up confirmation visual fix: added `confirm-surface` on `#drop-main` and removed the compose-shell shadow in confirmation, so the confirm field has no blue glow or shell shadow effect.
- Follow-up disambiguation visual tweak: changed pill border radius from `24px` to `28px` so the `56px`-tall pills read as true capsules instead of rounded rectangles.
- Follow-up disambiguation tweak: changed unselected pill scale from `0.92` to `0.98` in both the primitive output and CSS animation/settled-state rules.
- Follow-up disambiguation tweak: made the unselected pill scale explicit at `0.92` in CSS (`.g-disambiguation-pill:not(.selected)`) so selection updates and animation settle states cannot drift.
- Follow-up state fix: confirmation no longer reuses the compose dictation glow. `compose-text-active` now applies only while in `GS.COMPOSE` with text, so entering `GS.CONFIRM` removes the blue voice-viz from the field shell.
- Follow-up visual fix: restored the old compose voice-viz color stack on `#drop-main.compose-surface.compose-text-active` by removing the pink lower glow and matching the previous blue/white compose-field lighting.
- Follow-up layout rule: compose/confirm shell is now bottom-anchored. Height growth no longer pushes the field downward; the bottom edge stays fixed and multiline growth expands upward.
- Follow-up behavior change: compose/confirm field height now expands with text length. The inner compose field uses auto height with minimum empty/active heights, and the shell in `message-send-render.js` re-measures the rendered compose field and remorphs to match content height.
- Fixed the compose/confirm shell placement bug in [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js).
- Root cause: `composeGeo()` targeted an absolute top-edge position, but the shared morph renderer also applies a bottom-align `yOffset` in AI mode. The compose shell was therefore pushed down twice and rendered below the visible frame.
- Updated compose geometry to compensate for the renderer's bottom-align offset: `ty = top + h - 420`.
- Updated rich-layer class routing so both `GS.COMPOSE` and `GS.CONFIRM` use `glass-compose` and neither inherits the generic bottom-aligned `glass-active` layout. This keeps the compose/confirm header and field on the compose surface instead of a separate card-layout path.

## Files changed
- `src/flows/message-send-render.js`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send-render.js`

## Remaining issues / caveats
- No live browser validation was run after this patch. If vertical position is still slightly off, only the compose top constants (`COMPOSE_FIELD_TOP`, `COMPOSE_FIELD_TOP_ACTIVE`) should need tuning now.
- Follow-up tuning: moved `COMPOSE_FIELD_TOP` and `COMPOSE_FIELD_TOP_ACTIVE` up by `20px` to bring the compose/confirm shell fully inside the visible frame.

## Recommended next step
1. Reload `ai.html`.
2. Verify `drop-main.compose-surface` and `drop-main.compose-surface.compose-text-active` both sit inside the frame.
3. If needed, tune only `COMPOSE_FIELD_TOP` / `COMPOSE_FIELD_TOP_ACTIVE` in [/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js).

## Task title
Message Compose Redesign: Header + Compose Field + Expandable Suggestion Chips

## Completion status
- Completed

## Summary
- Reworked message `COMPOSE` to the field-first Figma layout instead of the old large compose card.
- Added a field-sized compose morph in [src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
  - default compose morphs to `307x83`
  - active text morphs to `351x94`
  - the visible `drop-main` shell is now the source of truth for the compose-field morph
- Added new shared compose primitives in [src/flows/ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js):
  - `renderComposeHeader(...)`
  - `renderComposeChipStack(...)`
  - `renderComposeField(...)`
- Reworked message compose state in [src/flows/message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - added `composeMenuOpen`
  - added `composeVisualChips` for Figma-aligned visual chip order without mutating underlying chip data
  - entering compose now defaults to header + field only
  - dictation/input force-close the chip menu
  - `toggleComposeMenu()` added for compose-owned `L` behavior
- Updated [src/ai/ai-bindings.js](/Users/ariax/Documents/GitHub/GenUI/src/ai/ai-bindings.js):
  - `L` now toggles the compose chip menu when message flow is active in `GS.COMPOSE`
  - non-compose `L` behavior remains unchanged
- Added compose-specific CSS in [src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css):
- Follow-up fix: compose header/chip/field positioning now uses offsets relative to the compose field shell inside `#c-rich`/`#drop-main`, fixing the initial render bug where the field dropped below the frame and the header/chips were off-surface.
- Follow-up fix: compose field chrome now lives on `#drop-main.compose-surface` and the inner compose field is content-only, so the morphing shell and visible field can no longer drift apart. Compose also no longer inherits generic `glass-active` bottom-alignment.
- Follow-up fix: compose shell `ty` now converts Figma top-edge coordinates to stage-center translate coordinates (`top + h/2 - 210`), fixing the incorrect compose surface placement.
  - compact `To:` header row
  - bottom-anchored compose field
  - stacked suggestion chip menu
  - compose-only rich-layer positioning via `#c-rich.glass-compose`

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/flows/message-send-voice.js`
- `src/ai/ai-bindings.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- Figma nodes referenced for implementation:
  - `224:80`
  - `224:121`
  - `224:133`
- Syntax checks passed:
  - `node --check src/flows/ui-primitives.js`
  - `node --check src/flows/message-send-render.js`
  - `node --check src/flows/message-send.js`
  - `node --check src/flows/message-send-voice.js`
  - `node --check src/ai/ai-bindings.js`

- Follow-up change: message `CONFIRM` now reuses the compose-style header + field layout and no longer renders the 3-button controls overlay. Confirm actions are voice-only: send, edit, cancel.

## Remaining issues / caveats
- No live browser validation was run in `ai.html`, so exact vertical placement and motion feel still need visual verification.
- The visual chip order is intentionally Figma-driven for the current 3-chip set; non-matching contact chip labels fall back to original order.
- The old compose helper classes remain in CSS for confirm/static field reuse, but the compose stage no longer uses the old `g-compose-card` layout.

## Recommended next step
1. Run the message flow in `ai.html` through disambiguation -> compose.
2. Verify:
   - compose enters as header + field only
   - `L` opens/closes the stacked chip menu
   - speaking with the menu open auto-dismisses chips and restores the header
   - chip selection and dictation still route to confirm correctly
3. If needed, tune only the absolute `top` values for `.g-compose-header`, `.g-compose-chip-stack`, and `.g-compose-field-wrap` in [src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css).


## Task title
Disambiguation Pills Around Listening Orb

## Completion status
- Completed

## Summary
- Replaced the message disambiguation bubble cluster with a shared pill-based primitive in [src/flows/ui-primitives.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js):
  - added `renderDisambiguationPills(...)`
  - removed bubble-specific rendering from the active message-flow path
- Updated [src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
- Follow-up tweak: 2-contact disambiguation pills now share the same center line (`x: 0` for both items) so the pair is vertically center-aligned above the orb.
- Follow-up tweak: disambiguation now scales the visible listening orb shell to `0.8` via `drop-main` geometry while preserving the original orb center.
  - disambiguation now stays on the normal `listening` shape with no custom orb shrink/recenter geometry
  - removed bubble size / Y-offset / orb-scale hacks
  - added pill-position layouts for `1`, `2`, `3`, and `4+` contacts relative to the listening-orb center
  - disambiguation still uses the `entering -> settled` phase, but now spreads pill chips from the orb instead of circles
- Updated [src/styles/ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css):
  - removed bubble/origin styling
  - added pill-shell, pill-avatar, and pill-text styles based on the Figma node `224:100`
  - retained the disambiguation-specific rich-layer ownership so this state is not bottom-aligned or clipped
- Updated [src/flows/message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - compose handoff now animates `.g-disambiguation-pill` out instead of the old bubble class

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- Figma node inspected via MCP:
  - file `LTNbsRqNkyLeo81OSL1X7J`
  - node `224:100`
- Syntax checks passed:
  - `node --check src/flows/ui-primitives.js`
  - `node --check src/flows/message-send-render.js`
  - `node --check src/flows/message-send.js`
- Searched for stale bubble-path references in active flow files; none remain

## Remaining issues / caveats
- No live browser validation was run in `ai.html`, so the exact final pill offsets and motion feel versus the Figma screenshot/video still need on-screen verification.
- The `4+` contact fan layout is data-driven but not visually tuned beyond keeping pills above the orb.

## Recommended next step
1. Trigger ambiguous Hiro disambiguation in `ai.html`.
2. Verify:
   - the listening orb stays in the normal listening position and size
   - pills fan out above the orb without clipping
   - selected/unselected states read clearly
   - keyboard selection and spoken-name selection still work
3. If needed, tune only the disambiguation pill `x/y` offsets in [src/flows/message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js) without reintroducing orb-geometry hacks.


## Task title
Message Disambiguation Bubble Cluster

## Completion status
- Partially completed

## Summary
- Replaced list-based message disambiguation with a bubble-cluster primitive:
  - added [renderBubbleCluster](/Users/ariax/Documents/GitHub/GenUI/src/flows/ui-primitives.js)
  - disambiguation no longer uses `renderSelectionList(...)`
- Reworked [message-send-render.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send-render.js):
  - `GS.DISAMBIGUATE` now renders a centered contact-bubble cluster instead of `card-list`
  - disambiguation now uses a transient `entering -> settled` motion phase
  - removed the external `Which Hiro?` header for this stage
  - disambiguation morph now uses compact custom geometry on the `listening` shape rather than a card shell
  - added layout rules for `2`, `3`, and `4+` contacts
- Patched the disambiguation surface/origin seam:
  - cluster geometry is now anchored to the origin orb position instead of the cluster midpoint
  - [ai.css](/Users/ariax/Documents/GitHub/GenUI/src/styles/ai.css) makes the disambiguation surface and rich layer overflow-visible so the bubbles are not clipped
  - the origin orb is now intentionally part of the disambiguation cluster instead of being removed during settle
- Updated compose handoff in [message-send.js](/Users/ariax/Documents/GitHub/GenUI/src/flows/message-send.js):
  - disambiguation bubbles now animate out on compose entry
  - old `.g-contact-row` exit assumptions were removed from that path

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

## Validation performed
- Syntax checks passed:
  - `node --check src/flows/ui-primitives.js`
  - `node --check src/flows/message-send-render.js`
  - `node --check src/flows/message-send.js`

## Remaining issues / caveats
- No live browser validation was run in `ai.html`, so these are still unverified:
  - exact motion feel versus the reference video
  - final bubble positioning in the 420×420 stage
  - whether the transient origin artifact feels correct or needs darker styling/timing tuning
  - whether command-voice visualization around disambiguation needs further suppression
- The cluster generalizes to `4+` contacts with a radial layout, but that layout has not been visually tuned in browser yet.

## Recommended next step
1. Trigger ambiguous Hiro disambiguation in `ai.html`.
2. Verify:
   - no list card appears
   - no external header appears
   - only bubbles remain after settle
   - no listening orb lingers behind the cluster
   - keyboard and spoken-name selection still work
3. If the motion still feels off, tune only:
   - bubble offsets
   - stagger timing
   - origin artifact styling
   without reintroducing a card shell.

## Task title
Add stage capture utilities (AI + prototype): Copy PNG + Export SVG

## Completion status
- Completed

## Summary
- Added shared capture utility module for stage-only capture:
  - serialize current `#stage` to SVG using `foreignObject`
  - export SVG download
  - render SVG to canvas and copy PNG to clipboard
  - graceful warning fallback for unsupported/blocked clipboard writes
- Wired feature in both modes:
  - AI mode (`ai.html` + `src/ai/ai-bindings.js`)
  - Prototype mode (`index.html` + `src/tool/index-app.js`)
- Added debug controls in both UIs:
  - `Copy PNG`
  - `Export SVG`
- Added hotkeys in both runtimes:
  - `Cmd/Ctrl + Shift + C` => copy PNG
  - `Cmd/Ctrl + Shift + E` => export SVG
  - ignored when focused in input/textarea/select/contenteditable
- Exposed runtime actions:
  - `window.copyStagePng()`
  - `window.exportStageSvg()`

## Files changed
- `src/shared/stage-capture.js` (new)
- `src/ai/ai-bindings.js`
- `src/tool/index-app.js`
- `ai.html`
- `index.html`

## Validation performed
- Wiring validation by code inspection for:
  - button hooks in both pages
  - window API exposure in both runtimes
  - hotkey routing + editable-target guard
- `node test/smoke.mjs` still fails on pre-existing debug-toggle interception issue unrelated to capture feature.

## Task title
Fix message-flow to home transition overlap (prevent double UI display)

## Completion status
- Completed

## Summary
- Fixed UI overlap where message-flow content could remain visible when returning to home.
- Root cause: delayed async callbacks (`setTimeout`) in `message-send` could still run after reset and re-inject flow DOM/animations.
- Implemented flow epoch guard in `src/flows/message-send.js`:
  - Added `flowEpoch` and `isEpochAlive(epoch)` helper.
  - Incremented epoch on `start()` and `reset()`.
  - Guarded delayed callbacks in compose/chip/confirm/dismiss/start paths so stale callbacks exit early.
- Added explicit hard cleanup in `reset()`:
  - clear rich content/classes (`visible`, `glass-active`, `glass-sent`)
  - clear glass controls layer content/visibility
  - remove `glass-flow-active` body class
  - hide intent header
- Result: switching from message flow back to home no longer leaves stale message UI in the container.

## Files changed
- `src/flows/message-send.js`

## Task title
Implement Figma node `163:1616` home-context pill look (pixel-targeted)

## Completion status
- Completed

## Summary
- Pulled Figma specs from:
  - file: `LTNbsRqNkyLeo81OSL1X7J`
  - node: `163:1616`
  - measured frame: `233x46`
- Updated AI home-context pill geometry to match Figma frame size:
  - custom home-context morph geometry now uses `233x46`, radius `30`.
- Implemented context-only layout in morph engine to match node structure:
  - left pad `24`
  - top/bottom implied by `46` height and text y positions
  - dot `6x6`
  - item gaps `10`
  - primary/divider/secondary placement based on measured text widths
  - divider rendered as vertical line (`26px` high) with `#2f2f2f`
- Applied context-only style matching Figma:
  - primary: `20px`, semibold (`600`), `#fff`
  - secondary: `18px`, regular (`400`), `#c2c2c2`
  - surface: `rgba(255,255,255,0.05)` fill
  - border: `1px rgba(255,255,255,0.36)`
  - inner shadow: `inset 0 0 20px rgba(255,255,255,0.15)`

## Files changed
- `src/ai/ai-bindings.js`
- `src/shared/morph-layout.js`
- `src/styles/ai.css`

## Validation performed
- Visual/logic validation by code against Figma values from MCP design context and metadata.

## Remaining issues / caveats
- Existing smoke automation still fails in this branch on debug-toggle click interception (`#debug-fullscreen-toggle` label intercept), unrelated to home-context pill implementation.

## Task title
Add fullscreen stage-outline toggle for AI page (sleep-stage outline control)

## Completion status
- Completed

## Summary
- Added a new AI debug toggle in `ai.html`:
  - `Stage/Frame Glow (FS)` (`#debug-fullscreen-stage-outline-toggle`)
- Wired fullscreen outline visibility control in `src/ai/ai-bindings.js`:
  - Persists to `localStorage` key: `genui_ai_fullscreen_stage_outline_visible`
  - Applies body class `hide-stage-outline-fullscreen` when toggle is off
- Added fullscreen-only CSS rule in `src/styles/ai.css`:
  - Disables glow layers when toggled off:
    - `#stage::after` outer glow
    - `#ui-frame.glasses::after` white frame glow
    - `#ui-frame.phone` frame shadow
    - `#stage` screen blend glow path (`mix-blend-mode: normal`)
  - Updated behavior to key off `body.hide-stage-outline-fullscreen` directly (not dependent on `fullscreen-stage-only`) so toggle updates apply immediately and consistently.

## Files changed
- `ai.html`
- `src/ai/ai-bindings.js`
- `src/styles/ai.css`

## Validation performed
- Manual wiring check by code inspection for:
  - toggle presence
  - class application path
  - fullscreen-only CSS selector

## Remaining issues / caveats
- Existing smoke automation currently fails on AI debug toggle click interception in this branch state (`elementHandle.click` on `#debug-fullscreen-toggle` intercepted by label). This is pre-existing in current debug-toggle pointer-event setup and does not block runtime behavior of the new outline toggle itself.

## Task title
AI home-context visual update (dot + inline text + divider styling)

## Completion status
- Completed

## Summary
- Updated home-context (`data-ai-home-state="context"`) design to match requested structure:
  - leading dot
  - primary text + vertical divider + secondary text on one row
  - home-context-specific typography and colors
- Implemented a dedicated pill layout path in morph layout (AI context mode only) so positions are deterministic and stable during morph:
  - dot anchored with left padding
  - measured primary/secondary widths for divider placement
  - divider rendered as a vertical line segment
- Applied home-context-specific visual styles:
  - primary `20px`, `700`, white
  - secondary `18px`, `400`, `#c2c2c2`
  - divider `#2f2f2f`
  - dot style simplified for context row

## Files changed
- `src/shared/morph-layout.js`
- `src/shared/morph-render.js`
- `src/styles/ai.css`

## Validation performed
- `node test/smoke.mjs` (pass)

## Remaining issues / caveats
- Exact pixel-perfect parity with image reference may still need one visual tuning pass (gap values/divider height) on target device scale.

## Recommended next step
1. Manual visual check in `ai.html` home-context state; if needed, provide exact tweaks for `dotToPrimaryGap`, `primaryToDividerGap`, and `dividerHeight` in `src/shared/morph-layout.js`.

## Task title
Fix AI stage morph regression (glitchy/jumpy container transitions)

## Completion status
- Completed

## Summary
- Restored AI morph transition rules that were unintentionally removed from `src/styles/ai.css`:
  - `body[data-page-mode="ai"] #drop-main` scale/opacity transition
  - shape-specific scaling for `data-current-shape="circle"` and `data-current-shape="listening"`
  - home-prompt suppression tied to `data-current-shape="circle"`
- Kept sleep-state hiding rules (`data-ai-home-state="sleep"`) in place, but isolated from the core cross-stage morph transition behavior.
- This restores smooth container interpolation across stage changes instead of abrupt/jumpy jumps.
- Follow-up alignment after user report:
  - Compared against `big-refractor` commit `88cce85` (`update toast pos`) and removed those AI scale override rules again because they are not part of the reference baseline.
  - Switched home-state morph driver to single-step transitions (`circle -> pill`) and removed chained `idle -> pill` morphing from the home-context entry path to avoid visible jump/cut.
  - Restored baseline listening prompt behavior (`circle <-> listening`) in AI input motion handling.

## Files changed
- `src/styles/ai.css`

## Validation performed
- `node test/smoke.mjs` (pass)

## Remaining issues / caveats
- Visual motion quality still needs manual eye-check in browser because smoke covers behavior correctness, not animation smoothness scoring.

## Recommended next step
1. Add a dedicated AI motion regression smoke that snapshots transition-relevant computed styles on shape changes (ensure `#drop-main` keeps the scale/opacity transition in AI mode).

## Regression prevention notes
- Do not remove or overwrite AI-specific `#drop-main` transition rules when editing home-state visibility behavior.
- Treat motion rules and visibility rules as separate layers:
  - motion layer: `data-page-mode + data-current-shape`
  - visibility layer: `data-ai-home-state`
- Any future home-state CSS change must verify transitions for at least `pill -> listening`, `listening -> card`, and `magic -> pill`.
- For AI motion parity checks, use commit `88cce85` as the reference baseline and diff only motion-driving paths before merging.

## Task title
AI home-state rebuild from reference: `sleep` / `home-still` / `home-context` + flow returns to context

## Completion status
- Completed

## Summary
- Implemented explicit AI home-state controller with three states:
  - `sleep` (blank/off simulation)
  - `still` (idle/dot state)
  - `context` (pill with rotating contextual content)
- Added static context cycle dataset and behavior matching the reference “next context” pattern:
  - pressing `Home-context` again while already in context refreshes to next context item.
- Added legacy debug controls in AI panel:
  - `Sleep`, `Home-still`, `Home-context` (kept existing Home/Listening/Magic controls).
- Implemented still/sleep -> context transition behavior:
  - pill enters from idle-size (via `idle -> pill` morph path),
  - overlay dot animates toward pill icon anchor,
  - pill content appears with current context.
- Set `home-context` as default home target and integrated flow exits:
  - message-send reset path returns to home-context,
  - flight flow reset path returns to home-context,
  - `Esc` while input-focused during active flight now resets flow and returns to home-context.
- Added sleep-wake guard in input actions:
  - text/chip processing wakes from sleep to still first.

## Files changed
- `ai.html`
- `src/styles/ai.css`
- `src/ai/ai-bindings.js`
- `src/ai/input-actions.js`
- `src/flows/message-send.js`
- `src/flows/flight-booking.js`

## Validation performed
- `node test/smoke.mjs` (pass).
- Playwright runtime checks:
  - New legacy buttons exist and switch `data-ai-home-state`.
  - `sleep` hides stage UI (`stage-wrap` forced hidden).
  - `home-still` sets current shape to `idle` with visible dot.
  - `home-context` morphs to `pill` and cycles text on repeated press.
  - Flight flow `Esc` reset returns to `home-context` (`shape: pill`, `flow-active: false`).

## Remaining issues / caveats
- The dot-to-pill animation uses a deterministic transform target tuned to current pill geometry (`420x100` baseline). If home pill geometry is changed later, this transform should be adjusted.
- Smoke still logs non-blocking 502 resource errors from optional network-backed calls.

## Recommended next step
1. Add a dedicated AI home-state smoke script to assert:
   `sleep -> still -> context` sequence, repeated context cycling, and flow-reset return to context.

## Blockers
- None

---

## Task title
Port Stage panel controls from `tool-updated` reference (layout + Add setup + Delete/Reset look)

## Completion status
- Completed

## Summary
- Ported Stage tab action row structure from `origin/tool-updated:ref/index.html`:
  - Added stage-kind select (`#stage-add-kind`) next to Add.
  - Converted Delete/Reset to icon buttons (`🗑`, `↻`) with `icon-btn` styling.
- Ported Stage timeline visual style to match reference:
  - Wrap layout (not horizontal scroll-only).
  - Blue pill chips with stronger active state gradient.
- Wired Add behavior to selected kind:
  - `dot`, `pill`, `card`, `blank`.
  - `Add` now calls `addStage(kind)` with template-specific render shape/components.

## Files changed
- `index.html`
- `src/styles/editor.css`
- `src/shared/sidebar.js`
- `src/tool/modules/manual-bindings.js`
- `src/shared/sidebar-actions.js`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/index.html`:
  - Confirmed `#stage-add-kind` exists.
  - Confirmed Delete/Reset labels are icon buttons (`🗑`, `↻`).
  - Selected `dot` + clicked Add; new active stage became `Dot Stage`.
- `node test/smoke.mjs` passed.

## Remaining issues / caveats
- `blank` currently maps to a card-shaped stage with empty components; if you want a different blank-stage geometry/content policy, that can be adjusted.

## Recommended next step
1. Manual visual pass in Stage tab to confirm exact spacing/sizing parity with your expected `tool-updated` look.

## Blockers
- None

---

## Task title
Fix `index.html` regression: pill -> card stage transition no-op

## Completion status
- Completed

## Summary
- Root cause: runtime exception during morph transition for specific shape pairs.
- Fixed missing `clamp` helper in `src/shared/morph-render.js` (`clamp is not defined`), which was thrown in `setUiMotionProfile()` for transitions such as `pill -> card`.
- After fix, Stage timeline click from pill to card now applies full card geometry and content as expected.

## Files changed
- `src/shared/morph-render.js`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/index.html`:
  - Clicked Stage timeline chip `card` from default `pill`.
  - Verified stage geometry changed to card (`420x260`, `30px` radius).
  - Verified no `pageerror` thrown.
- `node test/smoke.mjs` passed (`SHAPE:card-list`, `LOGS:[]`).

## Remaining issues / caveats
- None identified for this transition path.

## Recommended next step
1. Add one explicit smoke assertion for `pill -> card` geometry values in `index.html` to guard this exact regression.

## Blockers
- None

---

## Task title
AI home stage: make home fully blank (hide circle + prompt)

## Completion status
- Completed

## Summary
- Added AI-page-only visual override so when the current stage shape is `circle` (home), the stage orb/circle container is hidden.
- Also hid the home start prompt in the same `circle` state so home appears fully blank.
- Kept non-home states unchanged (listening/magic/content states still render normally).

## Files changed
- `src/styles/ai.css`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/ai.html`:
  - Home (`data-current-shape="circle"`): `#drop-main` computed `opacity: 0`, prompt `opacity: 0`.
  - After typing into `#sim-input` (listening): shape becomes `listening`, `#drop-main` opacity returns above `0`.

## Remaining issues / caveats
- This change is intentionally scoped to AI page only (`body[data-page-mode="ai"]`), so prototype/manual page behavior is unchanged.

## Recommended next step
1. Manual visual check on desktop/mobile to confirm the blank home state matches your intended feel.

## Blockers
- None

---

## Task title
Fix `index.html` Stage timeline button no-op + Content tab text edit no-op

## Completion status
- Completed

## Summary
- Fixed sidebar mutation commit logic so in-place mutators persist updates instead of being discarded.
- Added shared draft-apply helper in sidebar actions to normalize both mutation styles:
  - mutator returns updated object
  - mutator mutates draft and returns `undefined`
- Restored expected runtime behavior in `index.html`:
  - Stage timeline chips now activate/switch scenario stage.
  - Content tab text edits now persist after typing.
- Extended smoke coverage to validate both regressions on `/index.html` and updated existing AI chip selector to match current quick-chip copy.

## Files changed
- `src/shared/sidebar-actions.js`
- `test/smoke.mjs`
- `test/smoke.js`

## Validation performed
- `node test/smoke.mjs`
- Result: pass (`SHAPE:card-list`; no thrown assertion failures for new index checks)
- New automated assertions in smoke:
  - Click non-active stage timeline chip in `#scenario-shape-row` and assert it becomes active.
  - Open Content tab, expand Primary row, type into `#scenario-primary`, assert typed value persists after rerender delay.

## Remaining issues / caveats
- Smoke logs still include non-blocking `502` resource errors in AI mode from optional external calls; they do not block the Stage/Content regression checks and do not fail the suite.

## Recommended next step
1. Add a dedicated manual-editor smoke file (`test/index-smoke.mjs`) so `/index.html` regression checks can run independently of AI-mode network noise.

## Blockers
- None

---

## Task title
Refactor: extract page CSS and JS entrypoints from `ai.html` and `index.html`

## Completion status
- Partially completed

## Summary
- Reduced `ai.html` from 9,227 lines to 489 lines by extracting the full inline style block and the full inline module script into external files.
- Reduced `index.html` from 6,165 lines to 419 lines by extracting the full inline style block and the full inline script into external files.
- Extracted shared app-state helpers into `src/app-state.js` and wired both page modules to use the shared constants/loaders instead of carrying duplicate local definitions.
- Extracted simulator panel helpers into `src/sim-panel.js` and wired `src/ai-app.js` to use the shared module.
- Added external page entrypoints:
  - `src/ai-app.js`
  - `src/index-app.js`
- Added external style files:
  - `src/styles/ai.css`
  - `src/styles/editor.css`
  - `src/styles/shared.css`
  - `src/styles/message-flow.css`
  - `src/styles/flight-flow.css`
- Added `src/events.js` stub used by the extracted AI flight logic for Coachella date resolution.
- Rewired both HTML files to load external CSS/JS:
  - `ai.html` now loads CSS links plus `src/ai-app.js`
  - `index.html` now loads CSS links plus `src/index-app.js`
- Fixed extracted module wiring:
  - `src/ai-app.js` import path updated from `./src/shapes.js` to `./shapes.js`
  - dynamic import updated from `./src/events.js` to `./events.js`
  - `src/index-app.js` now exports inline-handler functions via `window.*` because `index.html` is now a module page

## Files changed
- `ai.html`
- `index.html`
- `src/ai-app.js`
- `src/index-app.js`
- `src/events.js`
- `src/app-state.js`
- `src/sim-panel.js`
- `src/styles/ai.css`
- `src/styles/editor.css`
- `src/styles/shared.css`
- `src/styles/message-flow.css`
- `src/styles/flight-flow.css`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
- Result observed: `SHAPE:magic`, `LOGS:[]`
- Syntax sanity:
  - `src/ai-app.js` parses after import stripping
  - `src/index-app.js` parses after import stripping
- Line-count check:
  - `ai.html`: 489 lines
  - `index.html`: 419 lines

## Remaining issues / caveats
- This pass extracted page assets and entrypoints, but did not yet finish the deeper shared-module split requested in `context/task.md` (`src/morph.js`, `src/sidebar.js`, `src/sim-panel.js`, `src/voice-engine.js`, `src/flows/*` are still not created/consumed as final shared modules).
- `src/sim-panel.js` is now created and consumed. Remaining large extractions are still pending:
  - `src/morph.js`
  - `src/sidebar.js`
  - `src/voice-engine.js`
  - `src/flows/message-send.js`
  - `src/flows/flight-booking.js`
  - `src/scenario-data.js`
  - `src/ui-actions.js`
  - `src/demo-ui.js`
  - `src/anim-controls.js`
- `index.html` was not runtime-validated in Playwright because headless Chromium crashes in this sandbox (`SIGTRAP`); only syntax/static checks were completed for the extracted manual-page module.
- `context/task.md` was already dirty before this pass and was not modified by this implementation step.

## Recommended next step
1. Split `src/ai-app.js` and `src/index-app.js` into the task-defined shared modules:
   `src/morph.js`, `src/sidebar.js`, `src/sim-panel.js`, `src/voice-engine.js`, `src/flows/message-send.js`, `src/flows/flight-booking.js`.
2. Deduplicate CSS properly by moving verified-shared sections into `src/styles/shared.css` and removing duplicated rules from `ai.css` / `editor.css`.
3. Run a runtime validation pass on both pages in a local browser outside the current sandbox limits.

## Task title
send message flow visual/motion parity pass: gradients, selection smoothing, grouped floating, controls containment

## Completion status
- Completed

## Summary
- Updated selected-state stroke system to gradient-ring borders (masked pseudo-element) and removed flat selected borders.
- Added shell-specific gradient stroke stops for outer container:
  - `0% rgba(255,255,255,0.36)`
  - `50% rgba(120,120,120,0.10)`
  - `97% rgba(255,255,255,0.10)`
- Set unselected behavior per latest direction:
  - DISAMBIGUATE non-selected rows: transparent (no fill).
  - Chips/buttons non-selected: no border, low-opacity fill + inner shadow.
- Applied outer container inset change to `10px`:
  - `#c-rich.glass-active` left/right/bottom = `10px`
  - dynamic geometry insets `GLASS_TOP_INSET`/`GLASS_BOTTOM_INSET` = `10`.
- Fixed selection animation behavior:
  - persistent stroke layers with animated opacity on selected classes.
  - Arrow selection uses in-place class toggles (`updateGlassSelectionUiOnly`) for DISAMBIGUATE/COMPOSE/CONFIRM, avoiding `#c-rich` remount on selection-only changes.
  - restored font-weight transitions (rows `400→600`, chips `400→500`) and removed row corner morph snap.
- Fixed CONFIRM control-row re-fade:
  - controls overlay is mode-diffed and no longer remounted on every selection change.
  - `.g-action-row` fade-up now entry-only (`.enter` class).
- Fixed intent header visibility and placement:
  - `setIntentHeader()` now sets `display:flex`; hide clears display.
  - moved `#intent-header` inside `#stage` so it floats as part of the same group.
  - added glass-intent anchored positioning above `#drop-main` with live tracking during transitions.
- Fixed controls appearing outside stage before snapping:
  - added live controls overlay tracking during transition (`requestAnimationFrame`) and stage-bound clamping.
  - card morph now remorphs on `ty` change (not just `h`) so vertical lift updates immediately.
- Visual token updates requested in recent iterations:
  - “Which Hiro?” intent text uses DM Sans with left margin `10px`.
  - DISAMBIGUATE avatar size set to `48x48`.
  - list-item row corner set to capsule (`999px`) and row gap set to `16px`.
  - COMPOSE checkmark uses selected action-button style (selected fill/inner shadow/2px gradient ring).
  - checkmark show animation duration increased to `500ms`.

## Files changed
- `ai.html`

## Validation performed
- Inline JS parse checks repeatedly passed (`new Function(...)` on extracted inline script).
- Smoke check repeatedly passed:
  - `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
  - result observed: `SHAPE:magic`, `LOGS:[]`.

## Remaining issues / caveats
- Visual validation for precise frame-by-frame alignment still requires manual browser check (sandbox Playwright intermittently fails with Chromium `SIGTRAP/EPERM`).
- Recent fixes focus on layout/motion/UI parity only; no backend intent logic changes were introduced in this pass.

## Recommended next step
- Manual pass on `http://localhost:5174/ai.html`:
  1) `send msg to hiro`
  2) verify “Which Hiro?” stays directly above card during full float/morph
  3) verify checkmark/action row never leaves stage bounds during appearance
  4) verify row/chip highlight transitions are smooth with weight interpolation.

## Task title
ai.html: Permanent Sim Panel + send message flow Send Message Flow (together)

## Completion status
- Partially done

## Summary
- Replaced legacy AI chat/input UI in `ai.html` with permanent left `#sim-panel` (290px) and re-centered `#ui-frame` in the right area.
- Removed all legacy `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, and `#example-chips` HTML/CSS/JS references.
- Rerouted chat output to simulator panel via `addSimLog()` + `setSimVoice()`.
- Added simulator helpers: `setSimInputState()`, event log, voice output card, keyboard legend, and command input.
- Implemented send message flow state machine in `ai.html`:
  IDLE → THINKING → DISAMBIGUATE → COMPOSE → CONFIRM → SENDING → SENT.
- Added required seams/stubs:
  `onTranscriptUpdate(text)`, `speakOutput(text)`, `parseIntent(text)`.
- Added send message flow visual styles and rich-content rendering for contact list, chips, listening field, checkmark, confirm actions, sending, and sent states.
- Updated quick action routing: message chip now calls `startGlassFlow()`.
- Renamed simulator quick chip text to `"Send a message to Hiro"`.
- Fixed typed-intent routing and contact matching for shorthand input (`"send msg to hiro"`), so direct Enter from `#sim-input` now starts send message flow and reaches disambiguation.
- Refactored send message flow rendering architecture so stage content is shell-rooted:
  removed `g-root` / `g-compose-shell` wrappers and render content directly as shell content.
- Moved DISAMBIGUATE prompt to existing `intent-header` (`Which Hiro?`) and removed in-card duplicate prompt node.
- Final refactor per updated requirement: removed nested shell/chrome markup in `#c-rich` entirely.
  Glass content is now mounted directly in `#c-rich` with no `g-card-shell`/top-glow layer.
  Visual shell comes only from morphing `#drop-main`.
- Updated smoke chip selector to `"Send a message to Hiro"` in both `test/smoke.mjs` and `test/smoke.js`.

## Files changed
- `ai.html` — direct `#c-rich` mounting refactor, intent-header prompt routing, shell-chrome removal from content layer
- `test/smoke.mjs` — updated chip text selector
- `test/smoke.js` — updated chip text selector

## Validation performed
- Playwright runtime check on `http://localhost:5174/ai.html`:
  typed `send msg to hiro` + Enter → voice output `"Which Hiro?"` and DISAMBIGUATE content rendered in `#c-rich`.
- Playwright end-to-end state progression on `:5174`:
  `THINKING -> DISAMBIGUATE -> COMPOSE -> CONFIRM -> SENT -> RESET`
- Wrapper regression check:
  no `.g-root`, `.g-compose-shell`, `.g-label-above` found in `#c-rich`.
- DOM contract check: no `.g-card-shell`, `.g-card-top-glow`, `.g-root`, `.g-compose-shell`, `.g-label-above` in `ai.html`.
- Playwright end-to-end flow on `:5174`:
  DISAMBIGUATE shows `intent-header = "Which Hiro?"`, rich content visible,
  progresses through CONFIRM (`shape: card`) and SENT (`shape: pill`) then RESET (`shape: circle`).
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
- Result: pass (`SHAPE:circle`, `LOGS:[]`).
- Verified no remaining references to removed legacy selectors/IDs:
  `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, `#example-chips`

## Remaining issues / caveats
- Full interaction parity against every acceptance bullet (especially keyboard edge-cases and all voice shortcuts across states) still needs manual walkthrough in browser.
- None blocking for the requested refactor.

## Recommended next step
Run manual acceptance pass for all Step 2/3 interactions in `context/task.md` (state transitions, keyboard behavior, compose pause/checkmark, and no-overflow in 420x420).

## Blockers
- None

---

## Task title
send message flow: Fix top padding + stable dynamic height (content-measured)

## Completion status
- Completed

## Summary
- Refactored Glass card-state height measurement to use a dedicated in-content node (`[data-glass-body]`) instead of `#c-rich.scrollHeight`.
- Added fixed shell inset constants and geometry calculation:
  `shellHeight = contentHeight + 20(top) + 20(bottom)`, with clamped bounds.
- Switched card-state morphing in `glassRender()` to deterministic post-layout measurement (`requestAnimationFrame`) with render-token guards to prevent stale-frame jumps.
- Kept Arrow-navigation behavior as requested: it recomputes height each rerender and only remorphs when the measured shell height changes (>1px).
- Removed duplicate COMPOSE top spacing by setting `.g-compose-card` top padding to `0`.
- Preserved all existing contracts:
  direct `#c-rich` mounting, no nested shell chrome, DISAMBIGUATE prompt in `intent-header`, and chip send path through normal `handleSend()`.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- Static checks in `ai.html`:
  - `data-glass-body` present in DISAMBIGUATE / COMPOSE / CONFIRM templates.
  - `GLASS_TOP_INSET` and `GLASS_BOTTOM_INSET` set to `20`.
  - Card-state morph now scheduled after render via `requestAnimationFrame`.
  - `.g-compose-card` top padding removed.

## Remaining issues / caveats
- Smoke does not assert visual top-inset stability frame-by-frame; manual visual pass is still required for the four screenshots/scenarios you flagged.

## Recommended next step
Manual verify on `:5174` for:
1) DISAMBIGUATE initial + ArrowDown/ArrowUp no top snap,
2) COMPOSE initial + Arrow navigation no top snap,
3) typing/chip collapse/checkmark transitions keep stable top inset.

---

## Task title
send message flow layout parity fixes: entry sizing, multiline compose growth, external controls, blue glow ownership, disambiguate label spacing

## Completion status
- Completed

## Summary
- Updated Glass card-state sizing to a two-pass settle:
  - Pass A immediate morph after `#c-rich` content mount.
  - Pass B next-frame settle morph to absorb late layout/font changes.
- Added per-state body-height cache (`DISAMBIGUATE`, `COMPOSE`, `CONFIRM`) to avoid stale fallback sizing on state entry.
- Split card-state rendering into two zones:
  - `data-glass-body` (measured and used for shell geometry)
  - `data-glass-controls` (external controls below card, excluded from shell measurement)
- Moved controls outside card container:
  - COMPOSE checkmark below card
  - CONFIRM action row below card
- Implemented compose input visual parity updates:
  - compose listening field now has blue effect on field itself (`.compose-input`)
  - multiline text wrapping enabled (`white-space: pre-wrap`, `word-break`, `overflow-wrap`)
- Disabled compose-stage card-wide glow by forcing `#home-glow-layer` opacity to `0` during Glass flow render.
- Tightened disambiguate header spacing by reducing `#stage-wrap.flow-active #intent-header` bottom margin from `100px` to `16px`.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- JS parse check on inline script in `ai.html` (pass)
- Static DOM/CSS verification:
  - `data-glass-body` + `data-glass-controls` present in COMPOSE/CONFIRM markup.
  - body-only measurement retained (`glassContentHeightPx` reads `[data-glass-body]`).
  - compose input field uses `.compose-input` styling and multiline wrapping.
  - disambiguate prompt still routed through `intent-header`.

## Remaining issues / caveats
- Manual visual verification for exact Figma pixel parity is still needed on local renderer (headless Playwright launch failed in sandbox with Chromium SIGTRAP/EPERM).

## Recommended next step
- Validate on `http://localhost:5174/ai.html` with the exact sequence:
  `send msg to hiro` -> DISAMBIGUATE -> COMPOSE typing long text -> CONFIRM,
  checking first-entry sizing, external controls placement, and blue field-only glow.

---

## Task title
send message flow: eliminate first-frame sizing drift and move controls fully outside shell

## Completion status
- Completed

## Summary
- Added a dedicated external controls overlay root: `#glass-controls-layer` (sibling of `#drop-main`, inside `#stage`).
- Removed controls from `#c-rich` body markup; COMPOSE checkmark and CONFIRM action row now render via overlay-only path.
- Implemented overlay renderer anchored to `drop-main` geometry:
  - X centered to shell
  - Y positioned at shell bottom + fixed gap (`GLASS_CONTROLS_GAP`).
- Strengthened body height measurement:
  - `max(getBoundingClientRect().height, offsetHeight, scrollHeight)`.
  - cache per card state only when measurement is valid.
- Added deterministic 3-pass settle for card-state entry:
  - Pass A immediate after forced layout (`void C.rich.offsetHeight`)
  - Pass B next animation frame
  - Pass C delayed settle (~80ms) on state entry.
- Added settle timer cleanup and integrated it into Glass timer reset logic.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- Inline JS parse check for `ai.html` (pass)

## Remaining issues / caveats
- Pixel-perfect visual verification remains manual in local browser due sandbox limitations with custom headless Playwright probes.

## Recommended next step
- Manual check on `:5174` for:
  1) DISAMBIGUATE first frame vs Arrow frame (no size jump),
  2) COMPOSE first frame vs Arrow frame (no extra top/bottom),
  3) controls visibly outside `drop-main`,
  4) multiline compose growth still updates shell height correctly.

---

## Task title
Exact AI Motion/Visual Parity With `main:ai.html` (Commit `e918410`)

## Completion status
- Completed with validation caveat

## Summary
- Restored AI base stylesheet parity by replacing `src/styles/ai.css` with the extracted `main:ai.html` base style block.
- Removed post-base AI flow CSS overrides to preserve single-style cascade semantics:
  - `src/styles/message-flow.css` now intentionally empty.
  - `src/styles/flight-flow.css` now intentionally empty.
- Restored animation control behavior to match main defaults/preset logic:
  - `animDur` base remains `600`.
  - preset defaults: `custom -> 450`, `spring -> 900`.
  - init ordering now calls `setAnimDuration(animDur)` during bind, matching main startup behavior.
- Restored bridge/deformation parity in modular runtime:
  - removed AI-only deformation suppression in `src/shared/morph-bridges.js`.
- Restored motion profile synthesis and content choreography in `src/shared/morph-render.js`:
  - home/thinking multiplier and `geometryEase` behavior restored.
  - `--content-move-t` now uses main-equivalent geometry easing path.
  - restored ai/magic content fade suppression block from main.
  - restored rich hide/show timer semantics from main (`richHideTimer` lifecycle).
  - removed non-main deformation call from `morphCore` that introduced end-of-transition bounce/jitter.
- Reverted AI panel defaults in `ai.html` to main-equivalent initial values/select state.
- Preserved functional non-visual fixes (including `clamp` fallback wiring in message send render).

## Files changed
- `ai.html`
- `src/shared/anim-controls.js`
- `src/shared/morph-bridges.js`
- `src/shared/morph-render.js`
- `src/styles/ai.css`
- `src/styles/message-flow.css`
- `src/styles/flight-flow.css`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).
- Runtime browser probe executed to inspect AI page timing variables (sandbox caveat on direct `file://` loading means module init is not authoritative in that mode).
- Verified key parity hooks now present in source:
  - `anim-controls` init uses `setAnimDuration(animDur)`.
  - `morphCore` no longer invokes extra deformation pass.
  - ai/magic content suppression block restored.

## Remaining issues / caveats
- Full frame-by-frame pixel diff against a temporary served `main:ai.html` baseline was not completed in this pass.
- Browser runtime checks should be executed against served pages (not `file://`) for final parity sign-off.

## Recommended next step
1. Run side-by-side served comparison (`current ai.html` vs temporary `main:ai.html` baseline) with fixed timestamp screenshots (0/200/400/600ms) and pixel diff threshold.
2. If any residual drift remains, reconcile remaining differences in `src/flows/message-send-render.js` and `src/ai/ai-shell.js` against `main` choreography values.

---

## Task title
AI message flow polish: stage-scoped voice viz + confirm-shell lift

## Completion status
- Completed

## Summary
- Fixed stage-specific voice visualization ownership in `src/ai/voice-engine.js`:
  - During command mode, drop-main/glow shadow now applies only in `DISAMBIGUATE`.
  - During `COMPOSE` dictation mode, drop-main/glow/action-button shadows are cleared; only compose field receives voice viz.
  - During `CONFIRM`, action-button shadow pulse remains active, while drop-main shadow stays off.
- Fixed confirm-stage shell overlap in `src/flows/message-send-render.js`:
  - Replaced static-only control lift with measured controls-aware lift.
  - `drop-main` now lifts by `max(78, controlsHeight + 14 + 18)` when external controls are shown (`CONFIRM` or compose-check state), preventing overlap with the 3-button row.

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Visual verification still needs manual browser pass for exact perceived match in your target environment.

## Recommended next step
1. Run `send msg to hiro` flow and verify:
   - DISAMBIGUATE: drop-main has voice viz.
   - COMPOSE: only compose field has voice viz.
   - CONFIRM: shell sits above buttons with no overlap.

---

## Task title
AI message flow follow-up: restore listening orb viz + fix confirm overlap via flow-active lifecycle

## Completion status
- Completed

## Summary
- Restored command-mode listening/orb visualization responsiveness by re-enabling home-glow shadow interpolation in command mode.
- Kept stage-scoped shell behavior so only DISAMBIGUATE applies shell (`drop-main`) voice shadow; compose/confirm keep shell shadow cleared.
- Fixed confirm overlap root cause by restoring message-flow lifecycle control of stage sizing classes:
  - add `flow-active` to `#stage`/`#stage-wrap` on flow start.
  - remove `flow-active` on flow reset.
- This re-applies the dedicated flow stage height (`#stage.flow-active { height: 420px; }`) so controls are no longer forced to clamp into the shell area.

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Manual visual verification still needed for exact overlap clearance and live mic-reactivity in your browser/hardware environment.

## Recommended next step
1. Re-test `send msg to hiro` flow in browser:
   - listening/orb reacts to mic level.
   - compose: only field pulses.
   - confirm: shell sits above the 3 buttons with no overlap.

---

## Task title
AI parity pass: disambiguate→compose choreography + chip-select motion + listening/thinking glow class parity

## Completion status
- Completed

## Summary
- Restored `main`-style disambiguate→compose choreography in `src/flows/message-send.js`:
  - Added `animateToCompose(...)` sequence with `main` timing/cascade points:
    - `t=0`: intent header exit + contact row staggered exits, COMPOSE state setup, immediate morph to measured compose height.
    - `t=220ms`: rebuild compose DOM with hidden targets.
    - `t=280ms`: header fade-up (`header-enter`).
    - `t=380ms`: chip stagger-in (`chip-enter`, 70ms stagger).
    - `t=460ms`: field fade-in (`field-enter`).
    - `t=560ms`: compose blue-shadow activation (`compose-input` re-apply).
- Restored `main`-style chip-select choreography in `src/flows/message-send.js` via `selectChipWithAnimation(...)`:
  - `t=0`: staggered chip exits + chip-wrap collapse + empty-text fade + immediate container re-morph.
  - `t=300ms`: swap in selected chip message with text magic + field pulse.
  - `t=560ms`: show checkmark, force controls overlay rebuild, re-morph with controls lift.
- Restored compose-entry render semantics in `src/flows/message-send-render.js`:
  - Added `manualComposeEntry` suppression hook (`setManualComposeEntry`) to match `main` behavior during choreographed compose transition.
  - Kept normal auto compose-input re-trigger for non-manual compose entries.
- Added `home-glow-layer` opacity reset in message flow render parity path.
- Fixed startup home/thinking glow class parity regression in `src/tool/index-app.js`:
  - Changed `home-glow` toggle from `shape === 'circle'` to `shape === 'listening' || shape === 'magic'`.
  - Added `magic-glow` toggle for `shape === 'magic'`.
  - This aligns with `main` class behavior and restores vivid listening/thinking blue-layer glow visibility.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/tool/index-app.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).
- Source parity checks against `main:ai.html` for:
  - `glassAnimateToCompose` timing path
  - `glassChipSelect` timing path
  - compose-entry suppression behavior
  - home/thinking glow class toggles

## Remaining issues / caveats
- Exact frame-by-frame browser pixel diff against served `main:ai.html` baseline not run in this pass.
- Final perceptual parity still requires manual A/B run on your machine for the specific transition steps.

## Recommended next step
1. A/B test only these flows side-by-side with `main:ai.html` baseline:
   - DISAMBIGUATE -> COMPOSE transition
   - chip select in COMPOSE
   - listening/thinking glow intensity response
2. If any residual drift remains, I will patch the last mismatched selectors/timers to exact baseline values.

---

## Task title
Compose step UX tweak: single confirm button always visible

## Completion status
- Completed

## Summary
- Removed the 2s no-input gate for compose confirmation.
- In compose step, the single check/confirm button now remains visible immediately and continuously.
- Updated compose input hint text to remove the old "2s pause" behavior reference.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- None identified in this scoped change.

## Recommended next step
1. Manual verify in AI page compose step:
   - check button is present immediately on entry
   - check button does not wait for pause
   - check button remains visible while typing/clearing text

---

## Task title
AI flow parity follow-up: compose->confirm transition, thinking glow reset, line-icon confirm actions

## Completion status
- Completed

## Summary
- Restored `main` compose->non-compose transition handoff in `transitionTo(...)`:
  - when leaving COMPOSE and field has `.compose-input`, remove class and delay state switch/render by `380ms` before transitioning.
  - this restores missing header/field handoff motion when entering CONFIRM.
- Updated confirm action buttons to `main` line-SVG icons (send/edit/cancel), replacing emoji glyphs.
- Added thinking-entry glow normalization:
  - on THINKING transition, clear inline `#home-glow-layer`/`#drop-main` box-shadow overrides so base vivid layered glow style is restored.

## Files changed
- `src/flows/message-send.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Final visual sign-off still needs manual browser verification for perceived glow intensity.

## Recommended next step
1. Re-test:
   - COMPOSE -> CONFIRM: header + field handoff should animate smoothly.
   - THINKING: vivid multi-layer blue glow should no longer appear dim.
   - CONFIRM: buttons should render as line SVG icons.

---

## Task title
AI spoken responses via Gemini TTS

## Completion status
- Completed

## Summary
- Added server-side Gemini TTS endpoint `POST /api/tts` that uses `GEMINI_API_KEY` from `.env` and returns generated audio payload.
- Added client TTS player module to:
  - request Gemini TTS audio,
  - decode PCM audio and play it in browser,
  - dedupe repeated speech,
  - stop current speech on clear,
  - fallback to browser `speechSynthesis` if Gemini TTS fails.
- Wired spoken output to existing `setSimVoice(...)` path so AI responses are automatically read aloud.
- Updated `.env.example` with Gemini TTS config keys.

## Files changed
- `server.mjs`
- `src/ai/tts-player.js` (new)
- `src/sim-panel.js`
- `.env.example`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Gemini TTS model availability depends on API project access/preview entitlement.
- If upstream TTS fails, browser voice fallback is used.

## Recommended next step
1. Start server and run AI flow; confirm spoken output for AI responses.
2. If desired, tune voice via `GEMINI_TTS_VOICE` and model via `GEMINI_TTS_MODEL` in `.env`.

---

## Task title
Stage capture follow-up: fix PNG decode failures + move controls into Export section

## Completion status
- Completed

## Summary
- Hardened PNG capture pipeline in `src/shared/stage-capture.js` to reduce `EncodingError: The source image cannot be decoded` failures:
  - added XML declaration to serialized SVG
  - set `foreignObject` `x/y` explicitly
  - added rasterization fallback chain: `createImageBitmap(svgBlob)` -> `Image(blob URL)` -> `Image(data URL)`
  - retained graceful warning-only behavior on capture/clipboard failure
- Wrapped `copyStagePng()` in both runtimes with local `try/catch` so no uncaught promise errors bubble to console.
- Moved capture controls out of Legacy actions into dedicated **Export** section:
  - `ai.html`: separate `Export` block in floating debug panel
  - `index.html`: separate collapsible `Export` section in Config tab

## Files changed
- `src/shared/stage-capture.js`
- `src/ai/ai-bindings.js`
- `src/tool/index-app.js`
- `ai.html`
- `index.html`

## Validation performed
- Verified module imports for `stage-capture.js`.
- Verified button placement by direct HTML inspection in both pages.
- Ran smoke script: `node test/smoke.mjs` (fails with existing `MISSING_CHIP` in current branch state; not introduced by this change).

## Remaining issues / caveats
- Browser extensions (e.g. Zotero/inject scripts) may still emit console errors unrelated to app runtime.
- If stage contains browser-restricted/unsupported subcontent, capture can still fail gracefully and log warning.

## Recommended next step
1. Manual browser check in `ai.html` and `index.html`:
   - click `Copy PNG` and paste into Notes/Slack
   - click `Export SVG` and open downloaded file
   - verify shortcuts `Cmd/Ctrl+Shift+C` and `Cmd/Ctrl+Shift+E` still work

---

## Task title
Clear voice visualization shadow when returning to home stage

## Completion status
- Completed

## Summary
- Fixed lingering voice-viz container shadow on home re-entry.
- Added explicit visual cleanup in AI home entry paths:
  - `enterSleep(...)`
  - `enterHomeContext(...)`
- Added command-viz gating in voice engine so command-mode shadow/glow is not applied while AI is in home (not awake), preventing immediate reapplication after cleanup.

## Files changed
- `src/ai/ai-bindings.js`
- `src/ai/voice-engine.js`

## Validation performed
- Verified new hooks and gating paths by code inspection:
  - `voice?.clearVoiceVizStyles?.()` called on home entry
  - `shouldShowCommandViz` callback wired from AI bindings
- `node test/smoke.mjs` still fails on existing fullscreen-toggle click interception (pre-existing issue in this branch).

## Remaining issues / caveats
- Smoke suite failure is unrelated to this fix and remains in debug-toggle hit-testing path.

## Recommended next step
1. Manual check in `ai.html`: run message/weather flow, return to home, confirm no residual container voice shadow remains.

---

## Task title
Fix index components toggles so they actually add/remove stage components

## Completion status
- Completed

## Summary
- Fixed stage component toggles in `index.html` flow so checkbox state now drives actual UI behavior.
- Root cause: component mutations were applied to stage data, but render paths did not consume component flags for content visibility.
- Implemented two runtime fixes:
  - Editor visibility now follows stage components (`icon`, `primary`, `secondary`, `detail`, `image`).
  - Stage render content now respects component presence; removed components render as empty/absent.

## Files changed
- `src/shared/sidebar.js`
- `src/shared/sidebar-render.js`
- `src/shared/morph-layout.js`

## Validation performed
- Manual headless repro on `index.html` (`http://localhost:5211`):
  - Unchecked `primary` component toggle.
  - Confirmed checkbox state persisted (`true -> false`).
  - Confirmed `#editor-primary-field` became hidden.
  - Confirmed `#c-primary` stage text became empty.

## Remaining issues / caveats
- None found for this scoped fix.

## Recommended next step
1. Quick visual pass in browser for other component toggles (`icon`, `secondary`, `detail`, `image`) to confirm expected behavior parity.

---

## Task title
Fix prototype Legacy shape buttons (Split) no-op

## Completion status
- Completed

## Summary
- Fixed `manualShape(...)` runtime crash that prevented Legacy shape buttons from working.
- Root cause: `manualShape` unconditionally accessed optional elements (`#shape-panel`, `#input-area`) and threw when they were absent in current prototype layout.
- Added null-safe guards so Split (and other manualShape buttons) execute without throwing.

## Files changed
- `src/tool/modules/manual-demo.js`

## Validation performed
- Headless browser check on `index.html`:
  - opened Config -> Legacy / Debug
  - clicked `Split`
  - confirmed stage width changed from `420px` to `100px` (split geometry applied)

## Remaining issues / caveats
- None for this scoped fix.

## Recommended next step
1. If needed, we can re-add `#shape-panel` UI for Custom shape editing to fully restore previous Legacy custom workflow.

---

## Task title
Compose stage: remove confirm check button and auto-confirm after 2s silence

## Completion status
- Completed

## Summary
- Removed compose-stage confirm check button overlay behavior.
- Updated compose flow to auto-transition to Confirm after 2 seconds of no new dictation/input.
- Kept confirm stage actions (`send`, `edit`, `cancel`) unchanged.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- Verified compose overlay controls now render only for Confirm state (no compose checkmark rendered).
- Verified compose input handler maintains a 2s auto-confirm timer and transitions to Confirm when timer elapses.
- Updated compose hint copy to: `Auto confirm after 2s silence`.

## Remaining issues / caveats
- Existing unrelated smoke/UI flakiness in this branch remains (debug-toggle interception); not introduced by this change.

## Recommended next step
1. Manual browser pass in `ai.html`: dictate message in Compose, stop for ~2s, confirm it auto-navigates to Confirm without a compose check button.

---

## Task title
Prototype mode: add Home Context preset + AI-like Listening/Thinking legacy buttons

## Completion status
- Completed

## Summary
- Added a new built-in stage preset `home-context` (rendered as pill) for prototype mode stage library.
- Added prototype runtime style sync for `home-context` stage so primary/secondary use home-context typography treatment.
- Updated prototype Legacy / Debug section to include AI-equivalent:
  - `Listening` -> `manualShape('listening')`
  - `Thinking` -> `manualShape('magic')`
- Kept existing `Home`, `List`, `Split`, `Custom` controls.

## Files changed
- `src/shared/scenario-data.js`
- `src/tool/index-app.js`
- `src/styles/editor.css`
- `index.html`

## Validation performed
- Headless browser check on `index.html`:
  - Stage chips include `Home Context` preset.
  - Legacy `Listening` and `Thinking` buttons are clickable and morph stage geometry.

## Remaining issues / caveats
- Home-context stage uses stage content/icon from current scenario; if exact AI home-context copy/icon is required for prototype preset defaults, that should be added as a separate content-default pass.

## Recommended next step
1. If desired, I can set deterministic default content/icon for `home-context` preset (e.g., dot icon + split primary/secondary copy) so new scenarios match AI home look out of the box.

---

## Task title
Sleep -> Listening direct wake (button + wake-word), disable auto-home wake from text input

## Completion status
- Completed

## Summary
- Updated AI wake flow so sleep can transition directly to listening without going through home context morph.
- Listening trigger paths now use direct wake-listening behavior:
  - Legacy `Listening` button now calls `armAiWakeListening()`.
  - Keyboard `L` and `0` paths use `armAiWakeListening()`.
- Removed auto-home wake behavior from typed input while sleeping:
  - typing into `#sim-input` in sleep no longer calls `ensureHomeAwake()` or morphs to home/listening.
- Gated request processing so typed/chip actions don’t execute while AI is asleep unless already awake/flow-active.

## Files changed
- `src/ai/ai-bindings.js`
- `src/ai/input-actions.js`
- `ai.html`

## Validation performed
- Headless browser check on `ai.html`:
  - In sleep, typing text keeps state as `sleep` + shape `circle`.
  - Clicking `Listening` in sleep transitions to `homeState=context` and shape `listening` directly.

## Remaining issues / caveats
- Wake-word validation in automated headless run is limited by SpeechRecognition availability; path uses same `armAiWakeListening()` function as the verified button trigger.

## Recommended next step
1. Manual run with microphone: from sleep, say “hey bixby” and verify direct transition to listening without interim home-context display.

---

## Task title
Flight destination/date header + command voice visualization

## Completion status
- Completed

## Summary
- Added step-specific glass intent headers in flight flow:
  - Destination step: `where are you going?`
  - Dates step: `when?`
- Headers use the same intent-header styling/placement behavior as the existing `Which Hiro?` treatment (`glass-intent` + tracked positioning above main container).
- Enabled command-mode listening on destination and dates steps to ensure live voice-viz behavior is active.
- Added a stage class (`flight-voice-viz`) on destination/dates steps so voice visualization also applies glow/shadow to the stage container itself during those steps.
- Preserved/extended cleanup on flow reset:
  - hide intent header
  - remove `flight-destination-active` and `flight-voice-viz` classes

## Files changed
- `src/ai/ai-bindings.js`
- `src/flows/flight-booking.js`
- `src/flows/flight-render.js`
- `src/ai/voice-engine.js`

## Validation performed
- Static verification of flow wiring:
  - Flight render receives shell header callbacks and command-listening callback.
  - Destination/dates steps toggle expected stage classes and header text.
  - Voice engine now applies drop container shadow when `#stage.flight-voice-viz` is present.

## Remaining issues / caveats
- No browser run executed in this patch step; behavior should be validated in interactive AI mode for exact visual intensity/timing.

## Recommended next step
1. Manual check in `ai.html`: start flight flow and verify headers and voice glow on destination/date steps, then confirm header/extra classes clear on subsequent steps and on reset to home.

---

## Task title
Flow startup thinking hold + orb-top thinking copy

## Completion status
- Completed

## Summary
- Added a mandatory startup thinking phase for both flows (`1600ms`) before entering their first actionable step.
- Message flow startup now enters `THINKING` first and shows orb-top text `Searching contact...`.
- Flight flow startup now morphs to magic/thinking first and shows orb-top text `Initiating...`.
- Added shell-level orb-label override APIs so non-message flows can show centered text above orb:
  - `setOrbLabel(text)`
  - `clearOrbLabel()`
- Updated message flow seeded-start callers to pass seed text into `messageFlow.start(seedText)` so seeded requests respect the startup hold instead of bypassing it.

## Files changed
- `src/ai/ai-shell.js`
- `src/flows/message-send.js`
- `src/ai/input-actions.js`
- `src/flows/flight-booking.js`

## Validation performed
- Static code-path validation only:
  - both flow start paths now include `1600ms` startup timers
  - required startup copy strings are wired
  - orb-label override API is integrated into flight startup/reset

## Remaining issues / caveats
- No browser runtime test executed in this step.

## Recommended next step
1. Manual verify in `ai.html`: start send-message and book-flight flows; confirm they both show startup thinking for ~1.6s with correct copy above orb before continuing.

---

## Task title
Post-flow listening reliability + header/label polish + flight header transition fix

## Completion status
- Completed

## Summary
- Fixed a regression where re-entering listening after completing a flow sometimes looked active but did not actually listen:
  - Added passive command-listening re-arm when returning to sleep/home states.
  - Ensured `armAiWakeListening()` explicitly starts command recognition before morphing to listening.
- Tuned top labels/headers for spacing and readability:
  - Thinking/orb-top label font size reduced (20px -> 18px).
  - Orb-top label vertical offset increased upward for more gap.
  - Intent header vertical offset increased upward for more gap from container.
- Fixed flight flow header glitch during transition from startup thinking (magic) to destination:
  - Destination header is now delayed slightly after morph settles when entering from thinking.
  - Added timer cleanup to avoid stale/double header flashes.

## Files changed
- `src/ai/ai-bindings.js`
- `src/ai/ai-shell.js`
- `src/styles/ai.css`
- `src/flows/flight-render.js`

## Validation performed
- Static verification of code paths and timing logic.
- No full interactive browser pass executed in this update.

## Remaining issues / caveats
- Final motion quality should be verified manually at runtime for exact visual feel/timing.

## Recommended next step
1. Manual regression pass in `ai.html`:
   - complete message/flight flow -> re-enter listening and verify speech is captured.
   - confirm orb-top thinking text and intent headers have the new spacing.
   - confirm no header jump on flight thinking -> destination transition.

---

## Task title
GlassOS primitive refactor + broader migration (message full, flight subset)

## Completion status
- Completed

## Summary
- Added a shared primitive renderer module for glass flow UI:
  - `renderContactHeader`
  - `renderSelectionList`
  - `renderChipBar`
  - `renderTextBubble`
  - `renderInfoCard`
  - `renderActionRow`
  - `renderInputField`
  - `renderCompactStatus`
- Refactored message flow rendering to compose primitives instead of inline screen templates while keeping existing state/timer logic and CSS classes.
- Switched confirm action controls markup to the shared `renderActionRow` primitive (same visuals/icons, parent still controls selection state).
- Migrated flight flow subset to primitives:
  - options/payment rows -> `renderSelectionList` (flight variant)
  - confirm summary cards -> `renderInfoCard` (flight-confirm variant)
  - done summary -> `renderInfoCard`
- Preserved existing class-based styling and transition behavior; no visual token redesign introduced.

## Files changed
- `src/flows/ui-primitives.js` (new)
- `src/flows/message-send-render.js`
- `src/flows/message-send.js`
- `src/flows/flight-render.js`

## Validation performed
- Module import/parse validation:
  - `node -e "import('./src/flows/message-send-render.js'); import('./src/flows/message-send.js'); import('./src/flows/flight-render.js'); import('./src/flows/ui-primitives.js'); console.log('ok')"`
- No browser runtime smoke run executed in this pass.

## Remaining issues / caveats
- `flow.showCheck` remains parent-driven but is currently never set to `true` by existing runtime logic; compose paused-check visual path is implemented at primitive level but not newly activated in flow logic.
- Full visual parity should be confirmed interactively in `ai.html` for edge transitions.

## Recommended next step
1. Manual smoke in `ai.html`:
   - send-message full path (disambiguate -> compose -> confirm -> sending -> sent)
   - flight options/payment selection highlighting and confirm/done cards
2. If needed, wire the compose pause-check timing to set `showCheck=true` when required by product behavior.

---

## Task title
Flight full primitive migration + message-style list unification

## Completion status
- Completed

## Summary
- Migrated flight flow rendering to primitive-only output for all step content:
  - destination -> `renderInfoCard`
  - dates -> `renderInfoCard`
  - options -> `renderSelectionList` (message-style rows)
  - thinking -> `renderCompactStatus(loading)`
  - confirm -> `renderInfoCard` stacked sections + footer
  - payment -> `renderSelectionList` (message-style rows)
  - done -> `renderInfoCard`
- Removed remaining flight-specific list renderer usage (`rich-flight-row` path) from flight render logic.
- Extended shared primitives:
  - `renderSelectionList` now supports canonical message-style rows with `title/subtitle/detail`, icon/avatar/initials mapping, and configurable row data attribute.
  - `renderInfoCard` now supports section stacks and optional footer summary.
- Added minimal CSS for new primitive data slots (`g-contact-body`, `g-contact-subtitle`, `g-contact-detail`, `g-info-*`) while preserving existing visual language.

## Files changed
- `src/flows/ui-primitives.js`
- `src/flows/flight-render.js`
- `src/styles/ai.css`

## Validation performed
- Module parse/import check:
  - `node -e "import('./src/flows/ui-primitives.js'); import('./src/flows/flight-render.js'); import('./src/flows/flight-booking.js'); import('./src/flows/message-send-render.js'); console.log('ok')"`

## Remaining issues / caveats
- Flight-specific legacy CSS selectors (`.rich-flight-row`, destination/date legacy blocks) remain in stylesheet but are no longer used by the updated flight renderer output.
- No browser runtime smoke test executed in this pass.

## Recommended next step
1. Manual `ai.html` flight run-through to verify:
   - list rows now match message-style selection visuals
   - destination/date/confirm/done screens render correctly with primitive cards
   - keyboard focus and selection transitions remain stable.
# Handoff

## Task title
Message Compose Timing Update

## Completion status
- Completed

## Summary
- Updated the disambiguation -> compose transition timing so the compose content reveal now waits `600ms`.
- Updated compose chip open and close animation durations from `800ms` to `1000ms`.

## Files changed
- `src/flows/message-send.js`
- `src/styles/ai.css`
- `context/handoff.md`

## Validation performed
- `node --check src/flows/message-send.js`
- Verified `compose-chip-in 1000ms` and `compose-chip-out 1000ms` are present in `src/styles/ai.css`

## Remaining issues / caveats
- No live browser verification was run after changing these timings.

## Recommended next step
1. Verify disambiguation -> compose now visually resolves over `600ms`.
2. Verify both chip appear and dismiss motions now run for `1000ms`.
