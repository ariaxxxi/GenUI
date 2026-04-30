# Quality Score

Quality means the repo is easy for agents and humans to resume without chat history.

## Current Quality Bar

- Architecture is indexed from `ARCHITECTURE.md`.
- Stable instructions are high-level uppercase docs in `docs/`.
- Detailed references live in subfolders.
- Active, completed, and tech-debt work are separated under `docs/exec-plans/`.
- Browser validation is still light and should be expanded.

## Required Context Checks

```bash
find docs -maxdepth 3 -type f -print | sort
rg -n "<stale context-folder or old filename references>" AGENTS.md README.md ARCHITECTURE.md docs
```

Expected:

- The first command shows the harness-style `docs/` tree.
- The stale-reference search returns no old context-folder or old filename references.

## Implementation Quality Checks

- Use `git diff --check` before finishing.
- Run targeted `node --check` on changed JavaScript files.
- Run browser smoke checks when changing routes, rendering, or interactions.
- Keep tests and checks non-destructive unless the user explicitly asks to update snapshots or generated files.

## Known Gaps

- No automated visual regression coverage for Celestial orb states.
- No bubble page smoke test.
- `test/smoke.mjs` timing may be stale for delayed stage single-click behavior.
- No package script wraps all validation commands.
