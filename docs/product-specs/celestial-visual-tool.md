# Celestial Visual Tool Spec

## Product Role

The Celestial Visual Tool is the tuning and reference surface for the shared selected/orb visual language.

## Core Capabilities

- Preview Celestial layer composition on multiple host geometries.
- Tune mask blur, blob blur, blob positions, highlight scale, inner glow blur, and four blob colors.
- Inspect directional motion for selected states.
- Provide the visual reference that production CSS and presets should match.

## Source Relationship

- Detailed visual rules live in `docs/design-docs/celestial-visual.md`.
- Production presets live in `src/shared/celestial-selected-presets.js`.
- Production application logic lives in `src/shared/celestial-selection-chrome.js`.

## Non-Goals

- Owning product flow behavior.
- Replacing shared production CSS.
- Introducing page-specific Celestial variants.
