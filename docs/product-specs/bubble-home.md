# Bubble Home Spec

## Product Role

Bubble Home is a standalone app-cluster home design for future AI home exploration. It should remain separate from AI Mode for now so the interaction model can be built and tested cleanly.

## Core Capabilities

- Render a central app bubble cluster.
- Round top-level app bubbles use an orb-shell hover treatment: visible bubble content shrinks to `0.8` with a slower scale-down transition while a shared-Celestial outer shell grows from `0.8` to full size.
- Pill-shaped top-level bubbles shrink their leading bubble-plus-badge group to `0.8` on hover over `420ms`, using the combined group center as the scale anchor while leaving the pill text expansion behavior intact.
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
  - Spotify and the two profile bubbles are excluded from promotion
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
