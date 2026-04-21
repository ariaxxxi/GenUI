# Product Specs Index

Product specs describe intended behavior, not implementation details.

## Product Surfaces

This repo currently contains four product surfaces:

- `genui-tool.md`: manual tool/editor for composing scenarios and stages.
- `ai-mode.md`: AI interaction surface for voice/text-driven generative UI flows.
- `celestial-visual-tool.md`: visual tuning tool for the shared Celestial selected/orb system.
- `bubble-home.md`: standalone Bubble Home design for a future AI home experience.

## Specs

- `genui-tool.md`
- `ai-mode.md`
- `celestial-visual-tool.md`
- `bubble-home.md`

## Product Relationship

- AI mode and Bubble Home are intentionally separate for now.
- Bubble Home is the future design direction for AI home, but should remain separately built and tested until integration is explicitly planned.
- Celestial visual rules are shared across all four products.

## Default Scoping Rule

Humans usually specify only `Role` and `Goal`. Agents must infer the focused product from the goal and read the corresponding spec.

When a task targets one product, the other three products must remain behaviorally unchanged by default:

- GenUI Tool tasks should not change AI Mode, Bubble Home, or Celestial Visual Tool unless shared architecture requires it.
- AI Mode tasks should not integrate Bubble Home unless explicitly requested.
- Celestial Visual Tool tasks may update shared Celestial rules, but must not change product flow behavior unless explicitly requested.
- Bubble Home tasks should keep Bubble Home standalone and must not move AI flow logic into it.

## Product Source Of Truth

- High-level product principles: `docs/PRODUCT_SENSE.md`.
- Technical architecture: `ARCHITECTURE.md`.
- Active implementation work: `docs/exec-plans/active/current.md`.
