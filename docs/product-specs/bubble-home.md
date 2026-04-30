# Bubble Home Spec

## Product Role

Bubble Home is a standalone app-cluster home design for future AI home exploration. It should remain separate from AI Mode for now so the interaction model can be built and tested cleanly.

## Core Capabilities

- Render a left-side content-set switcher for Bubble Home.
- On desktop, that switcher is docked to the left side of the viewport rather than centered with the canvas row.
- Support scalable named content sets so Bubble Home can swap between different bubble collections without rewriting page logic.
- Current scaffold sets:
  - `app`
  - `agent`
  - `agent` is a distinct 7-bubble set: `Claude`, `Travel agent`, `ChatGPT`, `Gemini`, `Fitness agent`, `Budget agent`, and `Writing agent`
  - `agent` removes `Health` and `Weather`
  - `agent` keeps no child actions on any bubble
- Render a central app bubble cluster.
- Round top-level app bubbles use an orb-shell hover treatment: the outer shell stays at the bubble’s full size while the visible bubble content shrinks to `0.75`, and the shell still grows in from `0.8` to full size.
- In the `agent` set, `Travel agent`, `Fitness agent`, `Budget agent`, and `Writing agent` keep their shell-plus-emoji bubble content at rest, then expand into text pills on hover.
- Those expanded pills size from the shared text-width formula for their title/subtitle copy plus pill paddings, so width stays consistent across sets.
- Those shell-plus-emoji bubbles size their emoji content to `0.6` of the bubble diameter.
- Those domain-agent bubbles keep a quiet glass shell at rest with no Celestial treatment, then that shell expands into the full hover pill and gains the Celestial treatment only while hovered.
- In the current `agent` layout, the four domain bubbles use a shared `80px` base size and field-size cap so they stay visually smaller than Claude, ChatGPT, and Gemini.
- In the `agent` set, `Travel agent`, `Fitness agent`, `Budget agent`, and `Writing agent` are promotable on hover-and-release.
- `Claude` is promotable in the `agent` set, unlike the non-promotable Spotify slot in `app`.
- Releasing a promotable round top-level bubble keeps that full bubble-sized shell visible while the bubble content scales down toward `0.45` during the promotion motion into home.
- Promoted home-orb image content is not circularly masked by default; the Claude promoted image keeps a circular crop as a special-case visual treatment.
- Pill-shaped top-level bubbles shrink their leading bubble-plus-badge group to `0.8` on hover over `420ms`, using the combined group center as the scale anchor while leaving the pill text expansion behavior intact.
- While panning the open field, top-level bubbles keep a clearance gap from the home orb instead of being allowed to overlap it.
- While a top-level pill is expanded in the field, the home orb is pushed away by that same pill geometry with extra clearance so the orb shell does not overlap the pill body.
- When a promotable domain-agent pill is released, that same shell collapses back from pill width to a circle while the emoji group scales continuously from the hovered `0.8` state down to the `0.45` home-orb target.
- When the current home orb demotes back into the field, it returns as a plain round bubble with no inherited pill text from the destination slot.
- Pill text sits `8px` closer to the thumbnail bubble than the previous spacing baseline.
- Highlight child bubbles with the shared Celestial selection system.
- Support directional child-bubble hover/selection motion.
- Support release-on-hover promotion for eligible bubbles:
  - selected bubble keeps its hovered shell and app graphic continuously visible as it scales/moves into the home orb
  - once the selected bubble reaches home position, the home orb snaps to that final size with no extra shrink/grow rebound
  - the committed home orb keeps the promoted bubble’s static shell feel and rounded center-image mask so no brightness or icon-shape blink occurs on handoff
  - orb shells keep a stable circular geometry during swap motion instead of dropping and reappearing from transform-driven remeasurement
  - previous home orb demotes by shrinking/fading out in place from its current pressed size instead of briefly sizing up or flying across the field
  - after promotion commits, field bubbles snap hidden immediately so no stale second pass or late fly-in appears
  - non-selected bubbles disappear in place with stagger during the swap
  - Spotify, health, and the two profile bubbles are excluded from promotion
- Preserve independent bubble-home styling and interaction tests while the design is still exploratory.

## Future Integration Direction

- Bubble Home is the intended future design direction for AI home.
- Integration with AI Mode should happen only through an explicit plan.
- Future integration should preserve AI Mode flows while replacing or augmenting the home surface.

## Current Separation Rules

- Do not couple Bubble Home state directly into AI Mode yet.
- Do not move AI flow logic into Bubble Home.
- Shared visual logic should stay in shared Celestial files, not in product-specific bubble code.

## Non-Goals

- Production launcher behavior.
- Full AI flow orchestration.
- Replacing AI Mode in the current build.
