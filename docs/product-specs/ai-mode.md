# AI Mode Spec

## Product Role

AI Mode is the voice/text-driven interaction surface for generative UI flows. It demonstrates how the shared morph and Celestial visual systems behave when driven by AI-style state transitions.

## Core Capabilities

- Start from an AI home/sleep/listening shell.
- Accept typed and voice input when browser support allows.
- Route user intent into message, flight, and coffee flows.
- Render flow states through the shared morph system.
- Use deterministic fallback UI when provider calls are unavailable.
- Reuse the shared Celestial thinking/listening orb.

## Current Separation From Bubble Home

- AI Mode owns current AI flows and shell behavior.
- Bubble Home is a separate product surface for future AI home design exploration.
- Do not integrate Bubble Home into AI Mode until an explicit active plan exists.

## Non-Goals

- Production assistant backend.
- Full natural-language understanding coverage.
- Replacing Bubble Home as the future home-design exploration surface.
