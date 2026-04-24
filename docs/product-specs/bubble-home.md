# Bubble Home Spec

## Product Role

Bubble Home is a standalone app-cluster home design for future AI home exploration. It should remain separate from AI Mode for now so the interaction model can be built and tested cleanly.

## Core Capabilities

- Render a central app bubble cluster.
- Highlight child bubbles with the shared Celestial selection system.
- Support directional child-bubble hover/selection motion.
- Support release-on-hover promotion for eligible bubbles:
  - selected bubble blooms into the home orb
  - previous home orb demotes into the selected slot as a normal bubble
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
