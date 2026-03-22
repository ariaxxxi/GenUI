# Handoff

## Task title
ai.html: Permanent Sim Panel + GlassOS Send Message Flow (together)

## Completion status
- Partially done

## Summary
- Replaced legacy AI chat/input UI in `ai.html` with permanent left `#sim-panel` (290px) and re-centered `#ui-frame` in the right area.
- Removed all legacy `#chat-panel`, `#input-area`, `#user-input`, `#send-btn`, and `#example-chips` HTML/CSS/JS references.
- Rerouted chat output to simulator panel via `addSimLog()` + `setSimVoice()`.
- Added simulator helpers: `setSimInputState()`, event log, voice output card, keyboard legend, and command input.
- Implemented GlassOS send-message state machine in `ai.html`:
  IDLE → THINKING → DISAMBIGUATE → COMPOSE → CONFIRM → SENDING → SENT.
- Added required seams/stubs:
  `onTranscriptUpdate(text)`, `speakOutput(text)`, `parseIntent(text)`.
- Added GlassOS visual styles and rich-content rendering for contact list, chips, listening field, checkmark, confirm actions, sending, and sent states.
- Updated quick action routing: message chip now calls `startGlassFlow()`.
- Renamed simulator quick chip text to `"Send a message to Hiro"`.
- Fixed typed-intent routing and contact matching for shorthand input (`"send msg to hiro"`), so direct Enter from `#sim-input` now starts GlassOS flow and reaches disambiguation.
- Refactored GlassOS rendering architecture so stage content is shell-rooted:
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
GlassOS: Fix top padding + stable dynamic height (content-measured)

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
GlassOS layout parity fixes: entry sizing, multiline compose growth, external controls, blue glow ownership, disambiguate label spacing

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
