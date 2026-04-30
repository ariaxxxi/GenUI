# AGENTS.md

This file is the stable entry point for agents. Keep it short. Repository knowledge lives in `ARCHITECTURE.md` and `docs/` so agents can progressively disclose only the context they need.

## First Reads

1. `ARCHITECTURE.md` for the system map and code ownership.
2. `docs/PLANS.md` for active/completed execution plans and planning rules.
3. The specific high-level doc for the task:
   - `docs/DESIGN.md` for visual/design-system work.
   - `docs/FRONTEND.md` for UI, flow, and browser implementation rules.
   - `docs/PRODUCT_SENSE.md` for product intent.
   - `docs/QUALITY_SCORE.md` for validation and freshness checks.
   - `docs/RELIABILITY.md` for runtime/API/fallback behavior.
   - `docs/SECURITY.md` for keys, server boundaries, and safe file handling.

## Roles

- **Planner**: writes the active implementation packet in `docs/exec-plans/active/current.md`.
- **Coder**: executes that active plan, validates the work, and records the result in `docs/exec-plans/completed/handoff.md`.

Do not mix roles unless the user explicitly overrides this file.

## Human Prompt Contract

Humans usually only need to provide:

```text
Role: planner or coder
Goal: one clear outcome
```

Agents must infer the rest from repository docs whenever possible. Do not require humans to repeat scope, constraints, or validation if the relevant product spec and harness docs already define them.

If the goal mentions one product surface, keep the other three product surfaces unchanged unless the user explicitly asks for cross-product integration.

Product specs:

- `docs/product-specs/genui-tool.md`
- `docs/product-specs/ai-mode.md`
- `docs/product-specs/celestial-visual-tool.md`
- `docs/product-specs/bubble-home.md`

## Core Rules

- Do not rely on prior chat when repository docs can answer the question.
- Do not revert unrelated dirty worktree changes.
- Keep `AGENTS.md` as a map, not a manual.
- Put detailed rules and durable knowledge in `docs/`.
- Infer the relevant product spec from the user goal and preserve unrelated products by default.
- Update docs when implementation changes architecture, routes, APIs, storage keys, visual contracts, product behavior, reliability, security, or known tech debt.
- Use `docs/design-docs/celestial-visual.md` as the detailed Celestial visual source.

## Planner Contract

Planner may read the repository docs needed to produce a complete plan. Planner must write `docs/exec-plans/active/current.md` with:

- Title
- Status
- Objective
- In scope
- Out of scope
- Relevant context
- Files to inspect
- Files allowed to change
- Implementation steps
- Acceptance criteria
- Validation checklist
- Risks / notes
- Open questions only when genuinely blocked

For UI work, include exact visual values, interaction behavior, default highlights, keyboard outcomes, and animation timing.

## Coder Contract

Coder must:

- Follow `docs/exec-plans/active/current.md`.
- Use `ARCHITECTURE.md` and relevant `docs/*.md` files as constraints.
- Keep changes within scope.
- Validate work against acceptance criteria.
- Update `docs/exec-plans/completed/handoff.md`.
- Update any affected high-level docs, detailed docs, references, or tech-debt entries.

Coder must not:

- Redefine the active plan without cause.
- Expand scope silently.
- Ignore durable decisions in `docs/references/decisions.md`.
- Leave docs stale after changing project truth.

## Success Condition

A new agent can read this file, then `ARCHITECTURE.md` and `docs/PLANS.md`, and continue correctly without prior conversation.
