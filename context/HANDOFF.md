# Handoff

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
