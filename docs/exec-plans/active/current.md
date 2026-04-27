# Title

Prototype thinking skill state becomes a selected pill

## Status

Planner-authored active task. Ready for implementation.

## Objective

In Prototype Mode, change the thinking debug family's `skill` substate so it no longer reuses the current orb-and-stream setup. Instead, `skill` should render as a normal selected pill with the shared Celestial selected effect, showing:

- leading emoji
- one primary label in the format `Xxx Agent`

Examples:

- `Travel Agent`
- `Fitness Agent`

The skill pill must still morph cleanly into the normal agent circle, listening orb, and other existing shapes without introducing page-local Celestial forks or breaking the current prototype morph pipeline.

## In scope

- Prototype-only thinking debug behavior in `index.html` / `src/tool/*`.
- Replacing the current `skill` substate presentation.
- Making `agent` behave as a normal circle target instead of staying trapped inside the thinking-orb presentation.
- Pill content, copy, theme, and visibility rules for prototype skills.
- Smooth morph choreography between:
  - thinking orb -> skill pill
  - skill pill -> agent circle
  - skill pill -> listening orb
  - skill pill -> standard non-AI shapes
- Sidebar/debug control behavior needed to keep `thinking / skill / agent` usable after the render shape changes.
- Any required doc updates for prototype debug-family behavior or internal render-shape additions.

## Out of scope

- AI Mode behavior changes.
- Bubble Home behavior changes.
- Celestial visual-core value changes in shared presets or shared orb CSS.
- New persistence keys.
- Converting skill mode into a user-authored scenario shape in the normal stage library.
- Reworking the shared listening orb, shared thinking orb, or microphone-reactive listening logic.
- Changing seeded scenario content outside the prototype debug-family data needed for skill labels/themes.

## Relevant context

- The focused product surface is the prototype editor, so AI Mode, Bubble Home, and Celestial Tool should remain unchanged unless shared infrastructure genuinely requires a minimal update.
- Current implementation is prototype-only debug logic, not scenario data:
  - `manualShape('magic')` enters the current thinking state.
  - `src/tool/modules/manual-bindings.js` switches `thinking / skill / agent`.
  - `skill` currently still drives `#siri-orb` plus the floating `#prototype-thinking-stream`.
- Current `magic` geometry is orb-sized. Current prototype skill mode is therefore visually locked into the thinking orb instead of behaving like a normal stage shape.
- The shared orb contract in `docs/design-docs/ai-orb.md` says listening/thinking orb visuals must remain shared and must not be replaced with page-local orb variants. This task should therefore reduce orb usage in prototype skill mode, not fork the orb.
- Current thinking-state row visibility is tied to `currentShape() === 'magic'`. Once `skill` becomes a pill and `agent` becomes a circle, the debug-family controls need their own logical state instead of keying entirely off the render shape.
- Standard pill geometry already exists in the morph system:
  - width `420px`
  - height `100px`
  - radius `60px`
- Standard circle/listening geometry already exists in the morph system:
  - width `80px`
  - height `80px`
  - radius `40px`
- Standard pill layout already has the right content pattern for this request:
  - left icon
  - single primary line
  - shared selected chrome

## Files to inspect

- `src/tool/modules/manual-bindings.js`
- `src/tool/modules/manual-demo.js`
- `src/tool/index-app.js`
- `src/shared/morph.js`
- `src/shared/morph-bridges.js`
- `src/shared/morph-render.js`
- `src/shared/morph-layout.js`
- `src/shapes.js`
- `src/styles/editor-layout.css`
- `src/styles/editor-sidebar.css`
- `src/shared/ai-orb-icon.js`
- `index.html`
- `docs/FRONTEND.md`
- `docs/design-docs/ai-orb.md`
- `ARCHITECTURE.md`

## Files allowed to change

- `src/tool/modules/manual-bindings.js`
- `src/tool/modules/manual-demo.js`
- `src/tool/index-app.js`
- `src/shared/morph.js`
- `src/shared/morph-bridges.js`
- `src/shared/morph-render.js`
- `src/shared/morph-layout.js`
- `src/shapes.js`
- `src/styles/editor-layout.css`
- `src/styles/editor-sidebar.css`
- `index.html`
- `docs/FRONTEND.md`
- `docs/design-docs/ai-orb.md` only if the prototype/orb ownership note needs clarification
- `ARCHITECTURE.md` only if a new internal render shape is introduced into shared shape definitions
- `docs/exec-plans/completed/handoff.md`

## Implementation steps

1. Split prototype thinking-family logic from raw render-shape checks.
   - Add a prototype-local state concept for the debug family, for example:
     - `active`
     - `mode: 'thinking' | 'skill' | 'agent'`
   - Stop relying on `currentShape() === 'magic'` as the only signal for whether the prototype thinking-state controls should stay visible.
   - The debug family should remain active while the user is in:
     - thinking orb
     - skill pill
     - agent circle
   - Exiting to an unrelated normal shape should clear the debug-family state.

2. Introduce an internal prototype render state for the skill pill.
   - Add a non-library render shape such as `skill-pill` to shared shape geometry only if that is the cleanest way to use the morph pipeline.
   - Do not expose this as a selectable scenario stage in the regular stage library.
   - Route this internal shape through pill-like layout behavior:
     - width `420px`
     - height `100px`
     - radius `60px`
     - normal pill content positioning
   - If a new internal render shape is added to `src/shapes.js`, document it as internal-only and update docs that enumerate shared shapes.

3. Normalize prototype skill descriptors for pill display.
   - Expand each entry in `PROTOTYPE_SKILLS` to include an explicit display title instead of relying on kebab-case ids.
   - Use title text in the format `Xxx Agent`, for example:
     - `Travel Agent`
     - `Fitness Agent`
     - `Budget Agent`
   - Keep:
     - `id`
     - `emoji`
     - theme colors
   - Skill mode should use stable display copy; it should not construct labels ad hoc inside click handlers.

4. Replace the current skill-state orb/stream presentation with normal pill content.
   - In `skill` mode:
     - hide `#siri-orb`
     - hide `#prototype-thinking-stream`
     - populate normal stage content slots instead
   - Use:
     - thumb = skill emoji
     - primary = skill display title
     - secondary = empty
     - detail = empty
     - divider = hidden
   - Visual values:
     - geometry: `420 x 100`
     - radius: `60`
     - icon area uses standard pill icon slot
     - icon left padding: `16px`
     - icon-to-text gap: `8px`
     - primary text size: `28px`
     - primary weight: existing pill primary weight
   - The selected effect must come from the shared Celestial selected stack already used by normal selected pill surfaces. Do not build a new skill-only highlight treatment.

5. Keep skill mode themeable without touching orb ownership.
   - Reuse each skill's existing four-color theme to tint the selected chrome for the skill pill.
   - Apply those theme colors through the existing selected-surface color path, not through orb-only helpers.
   - Do not call shared orb-center emoji/icon sync in skill mode.
   - Do not keep the orb alive behind the pill.

6. Remove prototype skill-mode phrase looping.
   - The current skill state types phrases in `#prototype-thinking-stream`.
   - That loop is part of the old orb-based thinking setup and should stop running in skill mode.
   - Keep the floating stream only for true `thinking` mode.
   - If the user switches from `thinking` into `skill`, cancel any active stream token immediately and hide the stream before the pill settles.

7. Make `agent` a normal circle presentation.
   - The prototype `agent` substate should render as a normal `circle`, not as the thinking orb with a different center asset.
   - Use the existing agent asset set from `src/shared/ai-orb-icon.js`, but render it through the normal stage/thumb path for circle presentation rather than through the shared orb shell.
   - Skill -> agent must therefore read as:
     - pill narrows and recenters
     - label fades out
     - emoji/icon recenters into the circle
   - Keep arrow-left / arrow-right agent cycling available in this `agent` circle mode.

8. Define mode-switch motion explicitly.
   - Use the shared morph engine rather than a separate overlay animation system.
   - Timing for prototype thinking-family substate switches:
     - total duration: `420ms`
     - easing: shared `var(--motion-ease)` / `cubic-bezier(0.35, 0.23, 0.13, 0.98)`
   - Thinking orb -> skill pill:
     - orb shell begins fading by `0-120ms`
     - width expansion starts immediately
     - pill label fades/slides in during `120-320ms`
     - final state is a stable selected pill with no floating stream
   - Skill pill -> agent circle or listening orb:
     - label fades out during the first `100ms`
     - icon recenters before the geometry fully settles
     - no pop, hard cut, or delayed second-stage teleport
   - Skill pill -> standard non-AI shapes should use the same morph path conventions as any other pill transition.

9. Update entry and exit behavior for the debug buttons.
   - Clicking `Thinking` in the AI Debug section should enter the prototype thinking family and render the currently selected substate.
   - Clicking the inner `thinking / skill / agent` buttons should morph between:
     - shared thinking orb
     - skill pill
     - agent circle
   - Clicking `Listening` from the sidebar while the skill pill is visible should morph directly into the shared listening orb.
   - Leaving the debug family for a normal shape such as `pill`, `card`, `card-s`, `image`, or `list` should clear debug-only visibility/state cleanly.

10. Keep shared orb behavior unchanged outside true thinking/listening.
    - Prototype `thinking` continues to use the shared orb.
    - Prototype `listening` continues to use the shared listening orb.
    - AI Mode keeps its current orb behavior.
    - This task should reduce incorrect prototype use of the orb in `skill` and `agent`, not introduce a second orb system.

11. Update durable docs if implementation changes project truth.
    - If an internal render shape such as `skill-pill` is added to `src/shapes.js`, update:
      - `ARCHITECTURE.md`
      - `docs/FRONTEND.md`
    - If orb-ownership wording needs clarification because prototype skill/agent no longer use the shared orb, update `docs/design-docs/ai-orb.md` carefully without weakening the shared listening/thinking contract.
    - Record the implementation result and validation in `docs/exec-plans/completed/handoff.md`.

## Acceptance criteria

- In Prototype Mode, when the user is in the thinking debug family and selects `skill`, the stage becomes a normal selected pill instead of the current orb-and-stream setup.
- The skill pill shows a leading emoji and a single primary label in the format `Xxx Agent`.
- The skill pill uses the shared Celestial selected treatment for pills; it does not keep the orb alive behind it and does not introduce a new page-local highlight style.
- The floating prototype thinking stream is not visible in skill mode.
- Switching from `thinking` to `skill` visibly morphs from orb to pill instead of hard-cutting.
- Switching from `skill` to `agent` visibly morphs from pill to a normal circle.
- Switching from `skill` to `listening` visibly morphs from pill to the shared listening orb.
- Arrow-left / arrow-right still cycle agents in prototype `agent` mode.
- AI Mode listening/thinking visuals remain unchanged.
- No new scenario-library stage or persistence key is added for the prototype skill pill.

## Validation checklist

- Run `git diff --check`.
- Run `node --check` on each changed JS file.
- Manual browser check in Prototype Mode:
  - enter `Thinking`
  - switch to `skill`
  - confirm the result is a selected pill, not an orb
  - confirm there is no floating stream text
  - confirm label examples read like `Travel Agent` / `Fitness Agent`
- Manual browser check:
  - `thinking` -> `skill`
  - `skill` -> `agent`
  - `skill` -> `listening`
  - `skill` -> regular `pill`
  - verify each path morphs cleanly with no pop or flash
- Manual browser check:
  - while in `agent`, use ArrowLeft / ArrowRight
  - verify the circle agent asset cycles correctly
- Manual browser check:
  - return to `thinking`
  - verify the shared orb and thinking stream still work there
- Manual browser check in AI Mode:
  - verify listening/thinking orb visuals are unchanged

## Risks / notes

- The current code couples debug UI visibility to the active render shape. That coupling must be untangled first or the `skill` and `agent` buttons will disappear as soon as the stage stops being `magic`.
- If `skill-pill` is implemented as an internal render shape, shape-routing tables in layout/render/bridge code must treat it as pill-like without leaking it into the normal scenario library.
- Agent assets currently flow through orb helpers. Rendering agent mode as a normal circle may require a clean non-orb asset path for prototype-only use.
- The safest implementation is to preserve the shared orb for true `thinking` and `listening` only, and move prototype `skill` / `agent` onto normal stage content rendering.
- Keep scope tight: this request is about prototype debug-family behavior, not a broader redesign of AI Mode or shared orb styling.

## Open questions

- None. The request is specific enough to plan implementation without further input.
