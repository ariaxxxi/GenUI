# Completed Handoff

## Task title
Bubble Home selected bubble becomes the new home orb

## Completion status
- Completed with static verification
- Browser interaction pass still recommended

## Summary of what was done
- Implemented Bubble Home release-on-hover swap behavior in `src/bubble-page.js`.
- Added runtime slot occupancy so Bubble Home can swap home-orb content with slot content without mutating the base slot geometry config.
- Added promotion eligibility rules:
  - enabled for eligible utility/AI bubbles
  - disabled for Spotify, Tony, and Hiro
- Implemented swap transition state and rendering:
  - selected bubble promotes into the home orb
  - previous home orb demotes into the selected slot as a normal bubble
  - non-selected bubbles scale down and fade out in place with stagger
- Added a floating swap layer for the promoted and demoted orb visuals.
- Added direct-image support to the shared orb-center helper so Bubble Home can show arbitrary bubble imagery inside the shared orb shell without forking orb markup.
- Updated Bubble Home product spec to describe the new promotion interaction.

## Files changed
- `src/bubble-page.js`
- `src/shared/ai-orb-icon.js`
- `src/styles/bubble-page.css`
- `docs/product-specs/bubble-home.md`
- `docs/exec-plans/completed/handoff.md`

## Validation performed
- `node --check src/bubble-page.js`
- `node --check src/shared/ai-orb-icon.js`
- `git diff --check`

## Remaining issues / caveats
- I did not run an interactive browser pass in this turn, so motion feel and exact visual alignment still need human verification in `/bubble`.
- The new swap overlay uses runtime transforms inside the Bubble Home pan layer; if motion polish needs tuning, adjust the swap constants and overlay styling in:
  - `src/bubble-page.js`
  - `src/styles/bubble-page.css`
- The shared orb helper now accepts direct image content in addition to named orb icons and emoji. AI Mode behavior should remain unchanged, but that is still worth a quick sanity pass.

## Recommended next step
1. Run Bubble Home locally in the browser and verify:
   - eligible bubble promotion
   - Spotify/Tony/Hiro ignore behavior
   - shell bloom feel and subtle overshoot
   - old-orb demotion into the selected slot
