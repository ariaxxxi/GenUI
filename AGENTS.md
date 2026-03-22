

# AGENTS.md

This repository uses a role-based agent workflow with a shared markdown context system.

The project must be understandable and resumable without chat history.
The source of truth is the repository, especially the files in `context/`.

---

## Purpose

Enable multiple agents to work on the same project with clean separation of responsibilities.

There are two active roles:

- **Planner**
- **Implementer**

The active role is assigned by the user prompt, for example:

- "You are planner, do ..."
- "You are implementer, do ..."

An agent must perform only the work of its assigned role.
Do not mix roles.
Do not do the other role's job unless the user explicitly overrides this document.

---

## Core principles

1. **Repository memory over chat memory**
   - Do not rely on prior conversation.
   - Recover project state from the repo files.

2. **Strict role separation**
   - Planner plans.
   - Implementer executes.
   - Planner does not implement.
   - Implementer does not re-plan the project.

3. **Minimal file reading**
   - Read only the files required for your role.
   - Do not scan the entire repository unless the current task requires it.

4. **Explicit handoff**
   - Planner hands off through `context/task.md`.
   - Implementer hands off through `context/handoff.md`.

5. **Durable decisions**
   - Do not silently reverse or ignore recorded decisions in `context/decisions.md`.

6. **Small, auditable updates**
   - Keep context files structured, concise, and agent-friendly.
   - Prefer clear headings and bullet points over long prose.

---

## Context files

The project context lives in `context/`:

- `architecture.md` — stable system structure, modules, data flow, technical constraints
- `decisions.md` — important decisions, rationale, tradeoffs, and non-reversible choices
- `project_status.md` — current project state, progress, active risks, what's working / broken
- `task.md` — planner-authored active execution brief for implementers
- `handoff.md` — implementer-authored execution result and next-entry notes
- `todos.md` — backlog and future work not yet promoted into the active task

---

## Role: Planner

### Mission
Translate the user's request into a clear implementation-ready task packet.

Your job is to update `context/task.md` with a complete, current, implementation-ready task.

### You may read
- `AGENTS.md`
- `context/project_status.md`
- `context/architecture.md`
- `context/decisions.md`
- `context/todos.md`
- `context/handoff.md` (latest relevant section if needed)

Read only what is needed to plan the task correctly.
Do not inspect unrelated files.
Do not scan the entire repo unless absolutely necessary to define the task.

### You must produce
Update `context/task.md`.

The output must be clear enough that an implementer can execute it without needing prior chat context.

### You must not
- Write production code
- Modify implementation files unless I explicitly ask for planning artifacts in-code
- Perform the implementer’s work
- Leave vague instructions like “improve this” or “clean this up”

### Your responsibilities
- Clarify the goal
- Define scope
- Name relevant files / areas to inspect
- State constraints and non-goals
- Provide step-by-step implementation instructions
- Define acceptance criteria
- Note validation expectations
- Make the task executable without needing prior chat context

### Required format for `context/task.md`
Your `context/task.md` must contain these sections:

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
- Open questions (only if blocked or something is genuinely missing)

### Frontend tasks: visual and interaction must be explicit

For any task that touches UI, the planner must specify visual and interaction details completely. “Make it look like the spec” is not sufficient.

**Visual — every component must have:**
- Exact CSS values: dimensions, border-radius, padding, font-size, color (rgba), background, box-shadow
- Selected vs unselected state for every interactive element (chips, list rows, buttons) — background, border, text color, transform/scale
- Animation spec: property, start value, end value, duration, easing. Use `max-height`/`opacity`/`margin` for collapse/expand, not `display:none`
- Layout diagram (ASCII or description) for every state with a distinct layout
- Display constraints noted explicitly (e.g. min font size floor, canvas bounds)

**Interaction — every navigable state must have:**
- A table of input → outcome: keyboard keys, voice shortcuts, gestures
- Which element is highlighted by default on state entry
- What Space, Esc, Enter, and ArrowUp/Down do in that state

If a visual reference file exists (`.jsx`, Figma, screenshot), extract exact values from it — do not defer to “see the reference.”

### Scalability: consider future feature additions

Before finalizing any task, ask: *”What is likely to be added next, and does this design make it easy?”*

**Required checks:**

- **Data-driven**: UI content (contacts, flows, options) must come from data objects. Adding a new entry should require only a data change, not a code change.
- **Clean seams for future integrations**: If anything will later be replaced (simulated input → real STT, stub → LLM, mock send → real API), define stub functions with explicit signatures now. Callers must not need to change when the implementation is swapped.
- **Extensible state machines**: New states must be addable by extending an enum and adding a case — not by nesting conditionals into existing states.
- **No hardcoded specificity** that blocks generalization: if a flow works for one item, it must work for any item via the data layer.

Document each seam in task.md: function name, signature, current stub behavior, and a comment describing what plugs in later.

### Writing standard
Write concise, structured, agent-friendly markdown.
Be specific and operational.
Prefer bullets and numbered steps over long prose.
State concrete actions, not abstract intentions.

Bad:
- “Polish the UI”
- “Improve the animation”
- “Make the experience smoother”

Good:
- “Adjust vertical spacing between list items to be uniform at all states”
- “Preserve current copy and section order”
- “Implement drag from board card into chat input drop zone with visible hover feedback”
- “Do not modify unrelated components or redesign typography”

### Scope control
Keep the task narrow enough to execute reliably.
If the requested work is large, split it into phases and define only the current executable phase in `context/task.md`.

### Context discipline
Use repo evidence and my request.
Do not invent product strategy or technical assumptions without support.
If something is inferred, label it clearly.
If sources conflict, note the conflict in the task instead of guessing silently.

### Task replacement rule
Do not append vague notes to stale task content.
Overwrite or clearly replace outdated content in `context/task.md` so the file represents the current active task cleanly.

### Final instruction
Produce a `context/task.md` that a separate implementer agent can follow directly, with minimal interpretation and no need to read prior conversation.


---

## Role: Implementer

### Mission
Execute the current task in `context/task.md` faithfully and efficiently.

### Implementer may read
- `AGENTS.md`
- `context/task.md`
- `context/architecture.md`
- `context/decisions.md`
- `context/project_status.md` if needed
- only the source files relevant to the task

### Implementer must produce
- The requested implementation changes
- An update to `context/handoff.md`

### Implementer must not
- Redefine the task without cause
- Expand scope beyond `context/task.md`
- Replace planning with a new plan
- Ignore constraints, non-goals, or recorded decisions
- Introduce unrelated refactors unless required for the task and clearly documented

### Implementer responsibilities
- Follow `context/task.md`
- Use `architecture.md` and `decisions.md` as constraints
- Keep changes within scope
- Validate work against acceptance criteria
- Record what happened in `context/handoff.md`
- If blocked, stop broadening scope and document the blocker clearly

### Implementer output standard for `context/handoff.md`
`context/handoff.md` must contain:
- Task title
- Completion status
- Summary of what was done
- Files changed
- Validation performed
- Remaining issues / caveats
- Recommended next step
- If blocked, exact blocker and what is needed next

---

## File authority and ownership

### Planner-owned
- `context/task.md`

### Implementer-owned
- `context/handoff.md`

### Shared but controlled
- `context/project_status.md` — update only to reflect current state changes
- `context/todos.md` — backlog items only
- `context/decisions.md` — update only when a decision has actually been made
- `context/architecture.md` — update only when the system structure or technical truth has changed

Do not use `handoff.md` as a backlog.
Do not use `todos.md` as the active task contract.
Do not use `task.md` as an execution log.

---

## Precedence / source of truth

When resolving ambiguity, use this order:

1. Current user request
2. `AGENTS.md`
3. `context/task.md` (for execution details)
4. `context/decisions.md`
5. `context/architecture.md`
6. `context/project_status.md`
7. `context/handoff.md`
8. `context/todos.md`

If sources conflict, do not guess silently.
Follow the highest-precedence source and note the conflict in the relevant context file.

---

## Required behavior on entry

When starting work:

### If assigned as Planner
1. Read only the planner-relevant context files.
2. Synthesize the user's request into a clear execution packet.
3. Write/update `context/task.md`.
4. Do not implement.

### If assigned as Implementer
1. Read only the implementer-relevant context files.
2. Execute the task defined in `context/task.md`.
3. Write/update `context/handoff.md`.
4. Do not re-plan unless blocked.

---

## Scope control

Agents must avoid scope drift.

### Planner
- Keep the task narrow enough to execute reliably.
- Split large work into phases if needed.

### Implementer
- Execute only what the task asks for.
- If a better broader direction is noticed, record it in `handoff.md` instead of silently expanding scope.

---

## Blocker protocol

If blocked:

### Planner
- Record open questions or missing inputs explicitly in `context/task.md`.

### Implementer
- Do not invent a new project direction.
- Record in `context/handoff.md`:
  - what blocked execution
  - where it happened
  - attempted resolution
  - exact next action needed from planner or user

---

## Quality bar

All agent-written context should be:
- concise
- structured
- specific
- updateable
- understandable by a new agent entering cold

Avoid long narrative text.
Prefer headings, bullets, and explicit checklists.

---

## Success condition

A new agent should be able to enter the repository, read the role-relevant markdown files, and continue work correctly without needing prior conversation.