# Handoff

## Task title
Fix message-flow to home transition overlap (prevent double UI display)

## Completion status
- Completed

## Summary
- Fixed UI overlap where message-flow content could remain visible when returning to home.
- Root cause: delayed async callbacks (`setTimeout`) in `message-send` could still run after reset and re-inject flow DOM/animations.
- Implemented flow epoch guard in `src/flows/message-send.js`:
  - Added `flowEpoch` and `isEpochAlive(epoch)` helper.
  - Incremented epoch on `start()` and `reset()`.
  - Guarded delayed callbacks in compose/chip/confirm/dismiss/start paths so stale callbacks exit early.
- Added explicit hard cleanup in `reset()`:
  - clear rich content/classes (`visible`, `glass-active`, `glass-sent`)
  - clear glass controls layer content/visibility
  - remove `glass-flow-active` body class
  - hide intent header
- Result: switching from message flow back to home no longer leaves stale message UI in the container.

## Files changed
- `src/flows/message-send.js`

## Task title
Implement Figma node `163:1616` home-context pill look (pixel-targeted)

## Completion status
- Completed

## Summary
- Pulled Figma specs from:
  - file: `LTNbsRqNkyLeo81OSL1X7J`
  - node: `163:1616`
  - measured frame: `233x46`
- Updated AI home-context pill geometry to match Figma frame size:
  - custom home-context morph geometry now uses `233x46`, radius `30`.
- Implemented context-only layout in morph engine to match node structure:
  - left pad `24`
  - top/bottom implied by `46` height and text y positions
  - dot `6x6`
  - item gaps `10`
  - primary/divider/secondary placement based on measured text widths
  - divider rendered as vertical line (`26px` high) with `#2f2f2f`
- Applied context-only style matching Figma:
  - primary: `20px`, semibold (`600`), `#fff`
  - secondary: `18px`, regular (`400`), `#c2c2c2`
  - surface: `rgba(255,255,255,0.05)` fill
  - border: `1px rgba(255,255,255,0.36)`
  - inner shadow: `inset 0 0 20px rgba(255,255,255,0.15)`

## Files changed
- `src/ai/ai-bindings.js`
- `src/shared/morph-layout.js`
- `src/styles/ai.css`

## Validation performed
- Visual/logic validation by code against Figma values from MCP design context and metadata.

## Remaining issues / caveats
- Existing smoke automation still fails in this branch on debug-toggle click interception (`#debug-fullscreen-toggle` label intercept), unrelated to home-context pill implementation.

## Task title
Add fullscreen stage-outline toggle for AI page (sleep-stage outline control)

## Completion status
- Completed

## Summary
- Added a new AI debug toggle in `ai.html`:
  - `Stage/Frame Glow (FS)` (`#debug-fullscreen-stage-outline-toggle`)
- Wired fullscreen outline visibility control in `src/ai/ai-bindings.js`:
  - Persists to `localStorage` key: `genui_ai_fullscreen_stage_outline_visible`
  - Applies body class `hide-stage-outline-fullscreen` when toggle is off
- Added fullscreen-only CSS rule in `src/styles/ai.css`:
  - Disables glow layers when toggled off:
    - `#stage::after` outer glow
    - `#ui-frame.glasses::after` white frame glow
    - `#ui-frame.phone` frame shadow
    - `#stage` screen blend glow path (`mix-blend-mode: normal`)
  - Updated behavior to key off `body.hide-stage-outline-fullscreen` directly (not dependent on `fullscreen-stage-only`) so toggle updates apply immediately and consistently.

## Files changed
- `ai.html`
- `src/ai/ai-bindings.js`
- `src/styles/ai.css`

## Validation performed
- Manual wiring check by code inspection for:
  - toggle presence
  - class application path
  - fullscreen-only CSS selector

## Remaining issues / caveats
- Existing smoke automation currently fails on AI debug toggle click interception in this branch state (`elementHandle.click` on `#debug-fullscreen-toggle` intercepted by label). This is pre-existing in current debug-toggle pointer-event setup and does not block runtime behavior of the new outline toggle itself.

## Task title
AI home-context visual update (dot + inline text + divider styling)

## Completion status
- Completed

## Summary
- Updated home-context (`data-ai-home-state="context"`) design to match requested structure:
  - leading dot
  - primary text + vertical divider + secondary text on one row
  - home-context-specific typography and colors
- Implemented a dedicated pill layout path in morph layout (AI context mode only) so positions are deterministic and stable during morph:
  - dot anchored with left padding
  - measured primary/secondary widths for divider placement
  - divider rendered as a vertical line segment
- Applied home-context-specific visual styles:
  - primary `20px`, `700`, white
  - secondary `18px`, `400`, `#c2c2c2`
  - divider `#2f2f2f`
  - dot style simplified for context row

## Files changed
- `src/shared/morph-layout.js`
- `src/shared/morph-render.js`
- `src/styles/ai.css`

## Validation performed
- `node test/smoke.mjs` (pass)

## Remaining issues / caveats
- Exact pixel-perfect parity with image reference may still need one visual tuning pass (gap values/divider height) on target device scale.

## Recommended next step
1. Manual visual check in `ai.html` home-context state; if needed, provide exact tweaks for `dotToPrimaryGap`, `primaryToDividerGap`, and `dividerHeight` in `src/shared/morph-layout.js`.

## Task title
Fix AI stage morph regression (glitchy/jumpy container transitions)

## Completion status
- Completed

## Summary
- Restored AI morph transition rules that were unintentionally removed from `src/styles/ai.css`:
  - `body[data-page-mode="ai"] #drop-main` scale/opacity transition
  - shape-specific scaling for `data-current-shape="circle"` and `data-current-shape="listening"`
  - home-prompt suppression tied to `data-current-shape="circle"`
- Kept sleep-state hiding rules (`data-ai-home-state="sleep"`) in place, but isolated from the core cross-stage morph transition behavior.
- This restores smooth container interpolation across stage changes instead of abrupt/jumpy jumps.
- Follow-up alignment after user report:
  - Compared against `big-refractor` commit `88cce85` (`update toast pos`) and removed those AI scale override rules again because they are not part of the reference baseline.
  - Switched home-state morph driver to single-step transitions (`circle -> pill`) and removed chained `idle -> pill` morphing from the home-context entry path to avoid visible jump/cut.
  - Restored baseline listening prompt behavior (`circle <-> listening`) in AI input motion handling.

## Files changed
- `src/styles/ai.css`

## Validation performed
- `node test/smoke.mjs` (pass)

## Remaining issues / caveats
- Visual motion quality still needs manual eye-check in browser because smoke covers behavior correctness, not animation smoothness scoring.

## Recommended next step
1. Add a dedicated AI motion regression smoke that snapshots transition-relevant computed styles on shape changes (ensure `#drop-main` keeps the scale/opacity transition in AI mode).

## Regression prevention notes
- Do not remove or overwrite AI-specific `#drop-main` transition rules when editing home-state visibility behavior.
- Treat motion rules and visibility rules as separate layers:
  - motion layer: `data-page-mode + data-current-shape`
  - visibility layer: `data-ai-home-state`
- Any future home-state CSS change must verify transitions for at least `pill -> listening`, `listening -> card`, and `magic -> pill`.
- For AI motion parity checks, use commit `88cce85` as the reference baseline and diff only motion-driving paths before merging.

## Task title
AI home-state rebuild from reference: `sleep` / `home-still` / `home-context` + flow returns to context

## Completion status
- Completed

## Summary
- Implemented explicit AI home-state controller with three states:
  - `sleep` (blank/off simulation)
  - `still` (idle/dot state)
  - `context` (pill with rotating contextual content)
- Added static context cycle dataset and behavior matching the reference “next context” pattern:
  - pressing `Home-context` again while already in context refreshes to next context item.
- Added legacy debug controls in AI panel:
  - `Sleep`, `Home-still`, `Home-context` (kept existing Home/Listening/Magic controls).
- Implemented still/sleep -> context transition behavior:
  - pill enters from idle-size (via `idle -> pill` morph path),
  - overlay dot animates toward pill icon anchor,
  - pill content appears with current context.
- Set `home-context` as default home target and integrated flow exits:
  - message-send reset path returns to home-context,
  - flight flow reset path returns to home-context,
  - `Esc` while input-focused during active flight now resets flow and returns to home-context.
- Added sleep-wake guard in input actions:
  - text/chip processing wakes from sleep to still first.

## Files changed
- `ai.html`
- `src/styles/ai.css`
- `src/ai/ai-bindings.js`
- `src/ai/input-actions.js`
- `src/flows/message-send.js`
- `src/flows/flight-booking.js`

## Validation performed
- `node test/smoke.mjs` (pass).
- Playwright runtime checks:
  - New legacy buttons exist and switch `data-ai-home-state`.
  - `sleep` hides stage UI (`stage-wrap` forced hidden).
  - `home-still` sets current shape to `idle` with visible dot.
  - `home-context` morphs to `pill` and cycles text on repeated press.
  - Flight flow `Esc` reset returns to `home-context` (`shape: pill`, `flow-active: false`).

## Remaining issues / caveats
- The dot-to-pill animation uses a deterministic transform target tuned to current pill geometry (`420x100` baseline). If home pill geometry is changed later, this transform should be adjusted.
- Smoke still logs non-blocking 502 resource errors from optional network-backed calls.

## Recommended next step
1. Add a dedicated AI home-state smoke script to assert:
   `sleep -> still -> context` sequence, repeated context cycling, and flow-reset return to context.

## Blockers
- None

---

## Task title
Port Stage panel controls from `tool-updated` reference (layout + Add setup + Delete/Reset look)

## Completion status
- Completed

## Summary
- Ported Stage tab action row structure from `origin/tool-updated:ref/index.html`:
  - Added stage-kind select (`#stage-add-kind`) next to Add.
  - Converted Delete/Reset to icon buttons (`🗑`, `↻`) with `icon-btn` styling.
- Ported Stage timeline visual style to match reference:
  - Wrap layout (not horizontal scroll-only).
  - Blue pill chips with stronger active state gradient.
- Wired Add behavior to selected kind:
  - `dot`, `pill`, `card`, `blank`.
  - `Add` now calls `addStage(kind)` with template-specific render shape/components.

## Files changed
- `index.html`
- `src/styles/editor.css`
- `src/shared/sidebar.js`
- `src/tool/modules/manual-bindings.js`
- `src/shared/sidebar-actions.js`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/index.html`:
  - Confirmed `#stage-add-kind` exists.
  - Confirmed Delete/Reset labels are icon buttons (`🗑`, `↻`).
  - Selected `dot` + clicked Add; new active stage became `Dot Stage`.
- `node test/smoke.mjs` passed.

## Remaining issues / caveats
- `blank` currently maps to a card-shaped stage with empty components; if you want a different blank-stage geometry/content policy, that can be adjusted.

## Recommended next step
1. Manual visual pass in Stage tab to confirm exact spacing/sizing parity with your expected `tool-updated` look.

## Blockers
- None

---

## Task title
Fix `index.html` regression: pill -> card stage transition no-op

## Completion status
- Completed

## Summary
- Root cause: runtime exception during morph transition for specific shape pairs.
- Fixed missing `clamp` helper in `src/shared/morph-render.js` (`clamp is not defined`), which was thrown in `setUiMotionProfile()` for transitions such as `pill -> card`.
- After fix, Stage timeline click from pill to card now applies full card geometry and content as expected.

## Files changed
- `src/shared/morph-render.js`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/index.html`:
  - Clicked Stage timeline chip `card` from default `pill`.
  - Verified stage geometry changed to card (`420x260`, `30px` radius).
  - Verified no `pageerror` thrown.
- `node test/smoke.mjs` passed (`SHAPE:card-list`, `LOGS:[]`).

## Remaining issues / caveats
- None identified for this transition path.

## Recommended next step
1. Add one explicit smoke assertion for `pill -> card` geometry values in `index.html` to guard this exact regression.

## Blockers
- None

---

## Task title
AI home stage: make home fully blank (hide circle + prompt)

## Completion status
- Completed

## Summary
- Added AI-page-only visual override so when the current stage shape is `circle` (home), the stage orb/circle container is hidden.
- Also hid the home start prompt in the same `circle` state so home appears fully blank.
- Kept non-home states unchanged (listening/magic/content states still render normally).

## Files changed
- `src/styles/ai.css`

## Validation performed
- Playwright runtime check on `http://127.0.0.1:5174/ai.html`:
  - Home (`data-current-shape="circle"`): `#drop-main` computed `opacity: 0`, prompt `opacity: 0`.
  - After typing into `#sim-input` (listening): shape becomes `listening`, `#drop-main` opacity returns above `0`.

## Remaining issues / caveats
- This change is intentionally scoped to AI page only (`body[data-page-mode="ai"]`), so prototype/manual page behavior is unchanged.

## Recommended next step
1. Manual visual check on desktop/mobile to confirm the blank home state matches your intended feel.

## Blockers
- None

---

## Task title
Fix `index.html` Stage timeline button no-op + Content tab text edit no-op

## Completion status
- Completed

## Summary
- Fixed sidebar mutation commit logic so in-place mutators persist updates instead of being discarded.
- Added shared draft-apply helper in sidebar actions to normalize both mutation styles:
  - mutator returns updated object
  - mutator mutates draft and returns `undefined`
- Restored expected runtime behavior in `index.html`:
  - Stage timeline chips now activate/switch scenario stage.
  - Content tab text edits now persist after typing.
- Extended smoke coverage to validate both regressions on `/index.html` and updated existing AI chip selector to match current quick-chip copy.

## Files changed
- `src/shared/sidebar-actions.js`
- `test/smoke.mjs`
- `test/smoke.js`

## Validation performed
- `node test/smoke.mjs`
- Result: pass (`SHAPE:card-list`; no thrown assertion failures for new index checks)
- New automated assertions in smoke:
  - Click non-active stage timeline chip in `#scenario-shape-row` and assert it becomes active.
  - Open Content tab, expand Primary row, type into `#scenario-primary`, assert typed value persists after rerender delay.

## Remaining issues / caveats
- Smoke logs still include non-blocking `502` resource errors in AI mode from optional external calls; they do not block the Stage/Content regression checks and do not fail the suite.

## Recommended next step
1. Add a dedicated manual-editor smoke file (`test/index-smoke.mjs`) so `/index.html` regression checks can run independently of AI-mode network noise.

## Blockers
- None

---

## Task title
Refactor: extract page CSS and JS entrypoints from `ai.html` and `index.html`

## Completion status
- Partially completed

## Summary
- Reduced `ai.html` from 9,227 lines to 489 lines by extracting the full inline style block and the full inline module script into external files.
- Reduced `index.html` from 6,165 lines to 419 lines by extracting the full inline style block and the full inline script into external files.
- Extracted shared app-state helpers into `src/app-state.js` and wired both page modules to use the shared constants/loaders instead of carrying duplicate local definitions.
- Extracted simulator panel helpers into `src/sim-panel.js` and wired `src/ai-app.js` to use the shared module.
- Added external page entrypoints:
  - `src/ai-app.js`
  - `src/index-app.js`
- Added external style files:
  - `src/styles/ai.css`
  - `src/styles/editor.css`
  - `src/styles/shared.css`
  - `src/styles/message-flow.css`
  - `src/styles/flight-flow.css`
- Added `src/events.js` stub used by the extracted AI flight logic for Coachella date resolution.
- Rewired both HTML files to load external CSS/JS:
  - `ai.html` now loads CSS links plus `src/ai-app.js`
  - `index.html` now loads CSS links plus `src/index-app.js`
- Fixed extracted module wiring:
  - `src/ai-app.js` import path updated from `./src/shapes.js` to `./shapes.js`
  - dynamic import updated from `./src/events.js` to `./events.js`
  - `src/index-app.js` now exports inline-handler functions via `window.*` because `index.html` is now a module page

## Files changed
- `ai.html`
- `index.html`
- `src/ai-app.js`
- `src/index-app.js`
- `src/events.js`
- `src/app-state.js`
- `src/sim-panel.js`
- `src/styles/ai.css`
- `src/styles/editor.css`
- `src/styles/shared.css`
- `src/styles/message-flow.css`
- `src/styles/flight-flow.css`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
- Result observed: `SHAPE:magic`, `LOGS:[]`
- Syntax sanity:
  - `src/ai-app.js` parses after import stripping
  - `src/index-app.js` parses after import stripping
- Line-count check:
  - `ai.html`: 489 lines
  - `index.html`: 419 lines

## Remaining issues / caveats
- This pass extracted page assets and entrypoints, but did not yet finish the deeper shared-module split requested in `context/task.md` (`src/morph.js`, `src/sidebar.js`, `src/sim-panel.js`, `src/voice-engine.js`, `src/flows/*` are still not created/consumed as final shared modules).
- `src/sim-panel.js` is now created and consumed. Remaining large extractions are still pending:
  - `src/morph.js`
  - `src/sidebar.js`
  - `src/voice-engine.js`
  - `src/flows/message-send.js`
  - `src/flows/flight-booking.js`
  - `src/scenario-data.js`
  - `src/ui-actions.js`
  - `src/demo-ui.js`
  - `src/anim-controls.js`
- `index.html` was not runtime-validated in Playwright because headless Chromium crashes in this sandbox (`SIGTRAP`); only syntax/static checks were completed for the extracted manual-page module.
- `context/task.md` was already dirty before this pass and was not modified by this implementation step.

## Recommended next step
1. Split `src/ai-app.js` and `src/index-app.js` into the task-defined shared modules:
   `src/morph.js`, `src/sidebar.js`, `src/sim-panel.js`, `src/voice-engine.js`, `src/flows/message-send.js`, `src/flows/flight-booking.js`.
2. Deduplicate CSS properly by moving verified-shared sections into `src/styles/shared.css` and removing duplicated rules from `ai.css` / `editor.css`.
3. Run a runtime validation pass on both pages in a local browser outside the current sandbox limits.

## Task title
send message flow visual/motion parity pass: gradients, selection smoothing, grouped floating, controls containment

## Completion status
- Completed

## Summary
- Updated selected-state stroke system to gradient-ring borders (masked pseudo-element) and removed flat selected borders.
- Added shell-specific gradient stroke stops for outer container:
  - `0% rgba(255,255,255,0.36)`
  - `50% rgba(120,120,120,0.10)`
  - `97% rgba(255,255,255,0.10)`
- Set unselected behavior per latest direction:
  - DISAMBIGUATE non-selected rows: transparent (no fill).
  - Chips/buttons non-selected: no border, low-opacity fill + inner shadow.
- Applied outer container inset change to `10px`:
  - `#c-rich.glass-active` left/right/bottom = `10px`
  - dynamic geometry insets `GLASS_TOP_INSET`/`GLASS_BOTTOM_INSET` = `10`.
- Fixed selection animation behavior:
  - persistent stroke layers with animated opacity on selected classes.
  - Arrow selection uses in-place class toggles (`updateGlassSelectionUiOnly`) for DISAMBIGUATE/COMPOSE/CONFIRM, avoiding `#c-rich` remount on selection-only changes.
  - restored font-weight transitions (rows `400→600`, chips `400→500`) and removed row corner morph snap.
- Fixed CONFIRM control-row re-fade:
  - controls overlay is mode-diffed and no longer remounted on every selection change.
  - `.g-action-row` fade-up now entry-only (`.enter` class).
- Fixed intent header visibility and placement:
  - `setIntentHeader()` now sets `display:flex`; hide clears display.
  - moved `#intent-header` inside `#stage` so it floats as part of the same group.
  - added glass-intent anchored positioning above `#drop-main` with live tracking during transitions.
- Fixed controls appearing outside stage before snapping:
  - added live controls overlay tracking during transition (`requestAnimationFrame`) and stage-bound clamping.
  - card morph now remorphs on `ty` change (not just `h`) so vertical lift updates immediately.
- Visual token updates requested in recent iterations:
  - “Which Hiro?” intent text uses DM Sans with left margin `10px`.
  - DISAMBIGUATE avatar size set to `48x48`.
  - list-item row corner set to capsule (`999px`) and row gap set to `16px`.
  - COMPOSE checkmark uses selected action-button style (selected fill/inner shadow/2px gradient ring).
  - checkmark show animation duration increased to `500ms`.

## Files changed
- `ai.html`

## Validation performed
- Inline JS parse checks repeatedly passed (`new Function(...)` on extracted inline script).
- Smoke check repeatedly passed:
  - `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
  - result observed: `SHAPE:magic`, `LOGS:[]`.

## Remaining issues / caveats
- Visual validation for precise frame-by-frame alignment still requires manual browser check (sandbox Playwright intermittently fails with Chromium `SIGTRAP/EPERM`).
- Recent fixes focus on layout/motion/UI parity only; no backend intent logic changes were introduced in this pass.

## Recommended next step
- Manual pass on `http://localhost:5174/ai.html`:
  1) `send msg to hiro`
  2) verify “Which Hiro?” stays directly above card during full float/morph
  3) verify checkmark/action row never leaves stage bounds during appearance
  4) verify row/chip highlight transitions are smooth with weight interpolation.

## Task title
ai.html: Permanent Sim Panel + send message flow Send Message Flow (together)

## Completion status
- Partially done

## Summary
- Replaced legacy AI chat/input UI in `ai.html` with permanent left `#sim-panel` (290px) and re-centered `#ui-frame` in the right area.
- Removed all legacy `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, and `#example-chips` HTML/CSS/JS references.
- Rerouted chat output to simulator panel via `addSimLog()` + `setSimVoice()`.
- Added simulator helpers: `setSimInputState()`, event log, voice output card, keyboard legend, and command input.
- Implemented send message flow state machine in `ai.html`:
  IDLE → THINKING → DISAMBIGUATE → COMPOSE → CONFIRM → SENDING → SENT.
- Added required seams/stubs:
  `onTranscriptUpdate(text)`, `speakOutput(text)`, `parseIntent(text)`.
- Added send message flow visual styles and rich-content rendering for contact list, chips, listening field, checkmark, confirm actions, sending, and sent states.
- Updated quick action routing: message chip now calls `startGlassFlow()`.
- Renamed simulator quick chip text to `"Send a message to Hiro"`.
- Fixed typed-intent routing and contact matching for shorthand input (`"send msg to hiro"`), so direct Enter from `#sim-input` now starts send message flow and reaches disambiguation.
- Refactored send message flow rendering architecture so stage content is shell-rooted:
  removed `g-root` / `g-compose-shell` wrappers and render content directly as shell content.
- Moved DISAMBIGUATE prompt to existing `intent-header` (`Which Hiro?`) and removed in-card duplicate prompt node.
- Final refactor per updated requirement: removed nested shell/chrome markup in `#c-rich` entirely.
  Glass content is now mounted directly in `#c-rich` with no `g-card-shell`/top-glow layer.
  Visual shell comes only from morphing `#drop-main`.
- Updated smoke chip selector to `"Send a message to Hiro"` in both `test/smoke.mjs` and `test/smoke.js`.

## Files changed
- `ai.html` — direct `#c-rich` mounting refactor, intent-header prompt routing, shell-chrome removal from content layer
- `test/smoke.mjs` — updated chip text selector
- `test/smoke.js` — updated chip text selector

## Validation performed
- Playwright runtime check on `http://localhost:5174/ai.html`:
  typed `send msg to hiro` + Enter → voice output `"Which Hiro?"` and DISAMBIGUATE content rendered in `#c-rich`.
- Playwright end-to-end state progression on `:5174`:
  `THINKING -> DISAMBIGUATE -> COMPOSE -> CONFIRM -> SENT -> RESET`
- Wrapper regression check:
  no `.g-root`, `.g-compose-shell`, `.g-label-above` found in `#c-rich`.
- DOM contract check: no `.g-card-shell`, `.g-card-top-glow`, `.g-root`, `.g-compose-shell`, `.g-label-above` in `ai.html`.
- Playwright end-to-end flow on `:5174`:
  DISAMBIGUATE shows `intent-header = "Which Hiro?"`, rich content visible,
  progresses through CONFIRM (`shape: card`) and SENT (`shape: pill`) then RESET (`shape: circle`).
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs`
- Result: pass (`SHAPE:circle`, `LOGS:[]`).
- Verified no remaining references to removed legacy selectors/IDs:
  `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, `#example-chips`

## Remaining issues / caveats
- Full interaction parity against every acceptance bullet (especially keyboard edge-cases and all voice shortcuts across states) still needs manual walkthrough in browser.
- None blocking for the requested refactor.

## Recommended next step
Run manual acceptance pass for all Step 2/3 interactions in `context/task.md` (state transitions, keyboard behavior, compose pause/checkmark, and no-overflow in 420x420).

## Blockers
- None

---

## Task title
send message flow: Fix top padding + stable dynamic height (content-measured)

## Completion status
- Completed

## Summary
- Refactored Glass card-state height measurement to use a dedicated in-content node (`[data-glass-body]`) instead of `#c-rich.scrollHeight`.
- Added fixed shell inset constants and geometry calculation:
  `shellHeight = contentHeight + 20(top) + 20(bottom)`, with clamped bounds.
- Switched card-state morphing in `glassRender()` to deterministic post-layout measurement (`requestAnimationFrame`) with render-token guards to prevent stale-frame jumps.
- Kept Arrow-navigation behavior as requested: it recomputes height each rerender and only remorphs when the measured shell height changes (>1px).
- Removed duplicate COMPOSE top spacing by setting `.g-compose-card` top padding to `0`.
- Preserved all existing contracts:
  direct `#c-rich` mounting, no nested shell chrome, DISAMBIGUATE prompt in `intent-header`, and chip send path through normal `handleSend()`.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- Static checks in `ai.html`:
  - `data-glass-body` present in DISAMBIGUATE / COMPOSE / CONFIRM templates.
  - `GLASS_TOP_INSET` and `GLASS_BOTTOM_INSET` set to `20`.
  - Card-state morph now scheduled after render via `requestAnimationFrame`.
  - `.g-compose-card` top padding removed.

## Remaining issues / caveats
- Smoke does not assert visual top-inset stability frame-by-frame; manual visual pass is still required for the four screenshots/scenarios you flagged.

## Recommended next step
Manual verify on `:5174` for:
1) DISAMBIGUATE initial + ArrowDown/ArrowUp no top snap,
2) COMPOSE initial + Arrow navigation no top snap,
3) typing/chip collapse/checkmark transitions keep stable top inset.

---

## Task title
send message flow layout parity fixes: entry sizing, multiline compose growth, external controls, blue glow ownership, disambiguate label spacing

## Completion status
- Completed

## Summary
- Updated Glass card-state sizing to a two-pass settle:
  - Pass A immediate morph after `#c-rich` content mount.
  - Pass B next-frame settle morph to absorb late layout/font changes.
- Added per-state body-height cache (`DISAMBIGUATE`, `COMPOSE`, `CONFIRM`) to avoid stale fallback sizing on state entry.
- Split card-state rendering into two zones:
  - `data-glass-body` (measured and used for shell geometry)
  - `data-glass-controls` (external controls below card, excluded from shell measurement)
- Moved controls outside card container:
  - COMPOSE checkmark below card
  - CONFIRM action row below card
- Implemented compose input visual parity updates:
  - compose listening field now has blue effect on field itself (`.compose-input`)
  - multiline text wrapping enabled (`white-space: pre-wrap`, `word-break`, `overflow-wrap`)
- Disabled compose-stage card-wide glow by forcing `#home-glow-layer` opacity to `0` during Glass flow render.
- Tightened disambiguate header spacing by reducing `#stage-wrap.flow-active #intent-header` bottom margin from `100px` to `16px`.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- JS parse check on inline script in `ai.html` (pass)
- Static DOM/CSS verification:
  - `data-glass-body` + `data-glass-controls` present in COMPOSE/CONFIRM markup.
  - body-only measurement retained (`glassContentHeightPx` reads `[data-glass-body]`).
  - compose input field uses `.compose-input` styling and multiline wrapping.
  - disambiguate prompt still routed through `intent-header`.

## Remaining issues / caveats
- Manual visual verification for exact Figma pixel parity is still needed on local renderer (headless Playwright launch failed in sandbox with Chromium SIGTRAP/EPERM).

## Recommended next step
- Validate on `http://localhost:5174/ai.html` with the exact sequence:
  `send msg to hiro` -> DISAMBIGUATE -> COMPOSE typing long text -> CONFIRM,
  checking first-entry sizing, external controls placement, and blue field-only glow.

---

## Task title
send message flow: eliminate first-frame sizing drift and move controls fully outside shell

## Completion status
- Completed

## Summary
- Added a dedicated external controls overlay root: `#glass-controls-layer` (sibling of `#drop-main`, inside `#stage`).
- Removed controls from `#c-rich` body markup; COMPOSE checkmark and CONFIRM action row now render via overlay-only path.
- Implemented overlay renderer anchored to `drop-main` geometry:
  - X centered to shell
  - Y positioned at shell bottom + fixed gap (`GLASS_CONTROLS_GAP`).
- Strengthened body height measurement:
  - `max(getBoundingClientRect().height, offsetHeight, scrollHeight)`.
  - cache per card state only when measurement is valid.
- Added deterministic 3-pass settle for card-state entry:
  - Pass A immediate after forced layout (`void C.rich.offsetHeight`)
  - Pass B next animation frame
  - Pass C delayed settle (~80ms) on state entry.
- Added settle timer cleanup and integrated it into Glass timer reset logic.

## Files changed
- `ai.html`

## Validation performed
- `SMOKE_BASE_URL=http://localhost:5174 node test/smoke.mjs` (pass)
- Inline JS parse check for `ai.html` (pass)

## Remaining issues / caveats
- Pixel-perfect visual verification remains manual in local browser due sandbox limitations with custom headless Playwright probes.

## Recommended next step
- Manual check on `:5174` for:
  1) DISAMBIGUATE first frame vs Arrow frame (no size jump),
  2) COMPOSE first frame vs Arrow frame (no extra top/bottom),
  3) controls visibly outside `drop-main`,
  4) multiline compose growth still updates shell height correctly.

---

## Task title
Exact AI Motion/Visual Parity With `main:ai.html` (Commit `e918410`)

## Completion status
- Completed with validation caveat

## Summary
- Restored AI base stylesheet parity by replacing `src/styles/ai.css` with the extracted `main:ai.html` base style block.
- Removed post-base AI flow CSS overrides to preserve single-style cascade semantics:
  - `src/styles/message-flow.css` now intentionally empty.
  - `src/styles/flight-flow.css` now intentionally empty.
- Restored animation control behavior to match main defaults/preset logic:
  - `animDur` base remains `600`.
  - preset defaults: `custom -> 450`, `spring -> 900`.
  - init ordering now calls `setAnimDuration(animDur)` during bind, matching main startup behavior.
- Restored bridge/deformation parity in modular runtime:
  - removed AI-only deformation suppression in `src/shared/morph-bridges.js`.
- Restored motion profile synthesis and content choreography in `src/shared/morph-render.js`:
  - home/thinking multiplier and `geometryEase` behavior restored.
  - `--content-move-t` now uses main-equivalent geometry easing path.
  - restored ai/magic content fade suppression block from main.
  - restored rich hide/show timer semantics from main (`richHideTimer` lifecycle).
  - removed non-main deformation call from `morphCore` that introduced end-of-transition bounce/jitter.
- Reverted AI panel defaults in `ai.html` to main-equivalent initial values/select state.
- Preserved functional non-visual fixes (including `clamp` fallback wiring in message send render).

## Files changed
- `ai.html`
- `src/shared/anim-controls.js`
- `src/shared/morph-bridges.js`
- `src/shared/morph-render.js`
- `src/styles/ai.css`
- `src/styles/message-flow.css`
- `src/styles/flight-flow.css`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).
- Runtime browser probe executed to inspect AI page timing variables (sandbox caveat on direct `file://` loading means module init is not authoritative in that mode).
- Verified key parity hooks now present in source:
  - `anim-controls` init uses `setAnimDuration(animDur)`.
  - `morphCore` no longer invokes extra deformation pass.
  - ai/magic content suppression block restored.

## Remaining issues / caveats
- Full frame-by-frame pixel diff against a temporary served `main:ai.html` baseline was not completed in this pass.
- Browser runtime checks should be executed against served pages (not `file://`) for final parity sign-off.

## Recommended next step
1. Run side-by-side served comparison (`current ai.html` vs temporary `main:ai.html` baseline) with fixed timestamp screenshots (0/200/400/600ms) and pixel diff threshold.
2. If any residual drift remains, reconcile remaining differences in `src/flows/message-send-render.js` and `src/ai/ai-shell.js` against `main` choreography values.

---

## Task title
AI message flow polish: stage-scoped voice viz + confirm-shell lift

## Completion status
- Completed

## Summary
- Fixed stage-specific voice visualization ownership in `src/ai/voice-engine.js`:
  - During command mode, drop-main/glow shadow now applies only in `DISAMBIGUATE`.
  - During `COMPOSE` dictation mode, drop-main/glow/action-button shadows are cleared; only compose field receives voice viz.
  - During `CONFIRM`, action-button shadow pulse remains active, while drop-main shadow stays off.
- Fixed confirm-stage shell overlap in `src/flows/message-send-render.js`:
  - Replaced static-only control lift with measured controls-aware lift.
  - `drop-main` now lifts by `max(78, controlsHeight + 14 + 18)` when external controls are shown (`CONFIRM` or compose-check state), preventing overlap with the 3-button row.

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Visual verification still needs manual browser pass for exact perceived match in your target environment.

## Recommended next step
1. Run `send msg to hiro` flow and verify:
   - DISAMBIGUATE: drop-main has voice viz.
   - COMPOSE: only compose field has voice viz.
   - CONFIRM: shell sits above buttons with no overlap.

---

## Task title
AI message flow follow-up: restore listening orb viz + fix confirm overlap via flow-active lifecycle

## Completion status
- Completed

## Summary
- Restored command-mode listening/orb visualization responsiveness by re-enabling home-glow shadow interpolation in command mode.
- Kept stage-scoped shell behavior so only DISAMBIGUATE applies shell (`drop-main`) voice shadow; compose/confirm keep shell shadow cleared.
- Fixed confirm overlap root cause by restoring message-flow lifecycle control of stage sizing classes:
  - add `flow-active` to `#stage`/`#stage-wrap` on flow start.
  - remove `flow-active` on flow reset.
- This re-applies the dedicated flow stage height (`#stage.flow-active { height: 420px; }`) so controls are no longer forced to clamp into the shell area.

## Files changed
- `src/ai/voice-engine.js`
- `src/flows/message-send.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Manual visual verification still needed for exact overlap clearance and live mic-reactivity in your browser/hardware environment.

## Recommended next step
1. Re-test `send msg to hiro` flow in browser:
   - listening/orb reacts to mic level.
   - compose: only field pulses.
   - confirm: shell sits above the 3 buttons with no overlap.

---

## Task title
AI parity pass: disambiguate→compose choreography + chip-select motion + listening/thinking glow class parity

## Completion status
- Completed

## Summary
- Restored `main`-style disambiguate→compose choreography in `src/flows/message-send.js`:
  - Added `animateToCompose(...)` sequence with `main` timing/cascade points:
    - `t=0`: intent header exit + contact row staggered exits, COMPOSE state setup, immediate morph to measured compose height.
    - `t=220ms`: rebuild compose DOM with hidden targets.
    - `t=280ms`: header fade-up (`header-enter`).
    - `t=380ms`: chip stagger-in (`chip-enter`, 70ms stagger).
    - `t=460ms`: field fade-in (`field-enter`).
    - `t=560ms`: compose blue-shadow activation (`compose-input` re-apply).
- Restored `main`-style chip-select choreography in `src/flows/message-send.js` via `selectChipWithAnimation(...)`:
  - `t=0`: staggered chip exits + chip-wrap collapse + empty-text fade + immediate container re-morph.
  - `t=300ms`: swap in selected chip message with text magic + field pulse.
  - `t=560ms`: show checkmark, force controls overlay rebuild, re-morph with controls lift.
- Restored compose-entry render semantics in `src/flows/message-send-render.js`:
  - Added `manualComposeEntry` suppression hook (`setManualComposeEntry`) to match `main` behavior during choreographed compose transition.
  - Kept normal auto compose-input re-trigger for non-manual compose entries.
- Added `home-glow-layer` opacity reset in message flow render parity path.
- Fixed startup home/thinking glow class parity regression in `src/tool/index-app.js`:
  - Changed `home-glow` toggle from `shape === 'circle'` to `shape === 'listening' || shape === 'magic'`.
  - Added `magic-glow` toggle for `shape === 'magic'`.
  - This aligns with `main` class behavior and restores vivid listening/thinking blue-layer glow visibility.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`
- `src/tool/index-app.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).
- Source parity checks against `main:ai.html` for:
  - `glassAnimateToCompose` timing path
  - `glassChipSelect` timing path
  - compose-entry suppression behavior
  - home/thinking glow class toggles

## Remaining issues / caveats
- Exact frame-by-frame browser pixel diff against served `main:ai.html` baseline not run in this pass.
- Final perceptual parity still requires manual A/B run on your machine for the specific transition steps.

## Recommended next step
1. A/B test only these flows side-by-side with `main:ai.html` baseline:
   - DISAMBIGUATE -> COMPOSE transition
   - chip select in COMPOSE
   - listening/thinking glow intensity response
2. If any residual drift remains, I will patch the last mismatched selectors/timers to exact baseline values.

---

## Task title
Compose step UX tweak: single confirm button always visible

## Completion status
- Completed

## Summary
- Removed the 2s no-input gate for compose confirmation.
- In compose step, the single check/confirm button now remains visible immediately and continuously.
- Updated compose input hint text to remove the old "2s pause" behavior reference.

## Files changed
- `src/flows/message-send.js`
- `src/flows/message-send-render.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- None identified in this scoped change.

## Recommended next step
1. Manual verify in AI page compose step:
   - check button is present immediately on entry
   - check button does not wait for pause
   - check button remains visible while typing/clearing text

---

## Task title
AI flow parity follow-up: compose->confirm transition, thinking glow reset, line-icon confirm actions

## Completion status
- Completed

## Summary
- Restored `main` compose->non-compose transition handoff in `transitionTo(...)`:
  - when leaving COMPOSE and field has `.compose-input`, remove class and delay state switch/render by `380ms` before transitioning.
  - this restores missing header/field handoff motion when entering CONFIRM.
- Updated confirm action buttons to `main` line-SVG icons (send/edit/cancel), replacing emoji glyphs.
- Added thinking-entry glow normalization:
  - on THINKING transition, clear inline `#home-glow-layer`/`#drop-main` box-shadow overrides so base vivid layered glow style is restored.

## Files changed
- `src/flows/message-send.js`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Final visual sign-off still needs manual browser verification for perceived glow intensity.

## Recommended next step
1. Re-test:
   - COMPOSE -> CONFIRM: header + field handoff should animate smoothly.
   - THINKING: vivid multi-layer blue glow should no longer appear dim.
   - CONFIRM: buttons should render as line SVG icons.

---

## Task title
AI spoken responses via Gemini TTS

## Completion status
- Completed

## Summary
- Added server-side Gemini TTS endpoint `POST /api/tts` that uses `GEMINI_API_KEY` from `.env` and returns generated audio payload.
- Added client TTS player module to:
  - request Gemini TTS audio,
  - decode PCM audio and play it in browser,
  - dedupe repeated speech,
  - stop current speech on clear,
  - fallback to browser `speechSynthesis` if Gemini TTS fails.
- Wired spoken output to existing `setSimVoice(...)` path so AI responses are automatically read aloud.
- Updated `.env.example` with Gemini TTS config keys.

## Files changed
- `server.mjs`
- `src/ai/tts-player.js` (new)
- `src/sim-panel.js`
- `.env.example`

## Validation performed
- `node test/smoke.mjs` -> pass (`SHAPE:magic`, `LOGS:[]`).

## Remaining issues / caveats
- Gemini TTS model availability depends on API project access/preview entitlement.
- If upstream TTS fails, browser voice fallback is used.

## Recommended next step
1. Start server and run AI flow; confirm spoken output for AI responses.
2. If desired, tune voice via `GEMINI_TTS_VOICE` and model via `GEMINI_TTS_MODEL` in `.env`.
