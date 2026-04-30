# Plans

This is the planning index. Use it to find active work, completed work, and known tech debt.

## Read Order

Planner:

1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `docs/PLANS.md`
4. `docs/exec-plans/project-status.md`
5. `docs/references/decisions.md`
6. `docs/exec-plans/tech-debt-tracker.md`
7. `docs/exec-plans/completed/handoff.md` when recent execution history matters

Coder:

1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `docs/PLANS.md`
4. `docs/exec-plans/active/current.md`
5. Relevant high-level docs under `docs/*.md`
6. Relevant detailed docs under `docs/design-docs/`, `docs/product-specs/`, or `docs/references/`

## Execution Files

- `docs/exec-plans/active/current.md`: only active implementation plan.
- `docs/exec-plans/completed/handoff.md`: implementation result log and next-entry notes.
- `docs/exec-plans/project-status.md`: current working/broken state, risks, and run commands.
- `docs/exec-plans/tech-debt-tracker.md`: unresolved backlog and follow-up work.

## Planning Rules

- Humans can usually give only `Role` and `Goal`; agents must discover the rest from this harness.
- Infer the focused product surface from the goal and read its spec in `docs/product-specs/`.
- If one product surface is focused, preserve the other three unless integration is explicitly requested.
- Keep active plans decision-complete.
- Do not use the tech-debt tracker as the active task.
- Do not use completed handoff notes as backlog.
- Move completed work out of active plans and into completed notes.
- Update high-level docs when implementation changes project truth.

## Product Surface Defaults

| Goal mentions                                             | Product spec to read                          | Default boundary                                                                                       |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| prototype, editor, stage, scenario, tool                  | `docs/product-specs/genui-tool.md`            | Do not change AI Mode, Bubble Home, or Celestial Tool behavior except shared rules already require it. |
| AI mode, voice, listening, thinking, flows                | `docs/product-specs/ai-mode.md`               | Do not integrate Bubble Home unless explicitly requested.                                              |
| Celestial tool, visual tuning, mask/blob/highlight values | `docs/product-specs/celestial-visual-tool.md` | Do not alter product flows except shared Celestial contracts.                                          |
| bubble, bubble home, child bubbles, app cluster           | `docs/product-specs/bubble-home.md`           | Keep Bubble Home separate from AI Mode unless explicitly planning integration.                         |

## Freshness Checks

Before ending planning or coding work:

- `AGENTS.md` remains short and points to this structure.
- Active work is represented in `docs/exec-plans/active/current.md`.
- Completed work is recorded in `docs/exec-plans/completed/handoff.md`.
- Tech debt is current and not mixed with execution logs.
- Route aliases in docs match existing HTML files.
