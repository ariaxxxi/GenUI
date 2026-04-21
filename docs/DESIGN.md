# Design

This is the high-level design-system entry point. Use detailed docs only when needed.

## Read Next

- `docs/design-docs/index.md` for design-doc map.
- `docs/design-docs/core-beliefs.md` for design principles.
- `docs/design-docs/celestial-visual.md` for the full Celestial visual system.
- `docs/design-docs/ai-orb.md` for the shared listening/thinking orb contract.
- `docs/references/design-system-reference-llms.txt` for LLM-readable design tokens and rules.

## Design Rules

- Celestial is the shared selected/highlight/orb visual language.
- GenUI Tool, AI Mode, Bubble Home, and Celestial Visual Tool must reuse the same Celestial layer stack.
- Updating any Celestial visual-core value must update all product surfaces automatically through shared presets, shared chrome JS, and `src/styles/shared.css`.
- AI listening and thinking orbs are one shared reusable component. When a task says "add a listening orb" or "add a thinking orb", use the existing shared source of truth by default instead of creating a new page-local orb style.
- Do not fork page-specific orb styles or product-specific Celestial overrides unless the user explicitly requests a one-off exception.
- Use intentional typography, motion, and spatial rhythm; avoid generic placeholder UI.
- Preserve existing visual language unless the task explicitly asks for a redesign.

## Ownership

- High-level design decisions belong here.
- Detailed layer values and implementation setup belong in `docs/design-docs/celestial-visual.md`.
- Frontend implementation constraints belong in `docs/FRONTEND.md`.
