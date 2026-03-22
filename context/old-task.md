# Task

## Title
GlassOS: Send Message Flow — Integrated into ai.html

## Status
- Ready for implementation

## Objective
Add the GlassOS "Send Message" flow as a second flow inside `ai.html`, activated by the existing "Send a message to Alice" example chip. When active, a 290px left simulator panel replaces the standard chat interface. The 420×420 glasses frame and existing shape morphing system (`morphTo()`) are reused as-is — only the content inside the drop and the left panel are new.

Spec: `ref/glass-os-send-message-spec.md`. Visual reference: `ref/glass-os-simulator.jsx`.

---

## In scope
- All changes in `ai.html` only
- New `#glass-panel` element (290px fixed left simulator panel) — shown only in glass-os flow
- New body class `flow-glass` to toggle between flight and glass-os modes
- `glassUi` state machine object (parallel to `flightUi`) with 7 states: IDLE → THINKING → DISAMBIGUATE → COMPOSE → CONFIRM → SENDING → SENT → IDLE
- GlassOS content rendered into the existing `#c-rich` div (already `position:absolute; inset:0; z-index:5`)
- Use existing `morphTo()` for all shape transitions — do not rewrite it
- Use existing `#home-glow-layer` for the blue glow (already has the exact CSS) — just show/hide it
- All keyboard routing as specified (global nav when input unfocused, input capture when focused)
- 3-second pause timer → checkmark in COMPOSE
- Contacts dataset: 2 contacts (Hiro Tanaka — Colleague, Hiro Horri — Friend) with per-contact chips
- Voice shortcuts: "send"/"edit"/"cancel" in CONFIRM; "send" in COMPOSE+checkmark; name match in DISAMBIGUATE; chip label match in COMPOSE

## Out of scope
- No new files — everything goes in `ai.html`
- No changes to `server.mjs`, `src/shapes.js`, `index.html`
- No real speech-to-text or TTS — text input simulates voice
- No LLM/AI calls — state transitions are rule-based (pattern matching only)
- Do not modify the existing flight flow logic
- Do not modify `morphTo()`, `morphCore()`, or any existing shape rendering functions
- No new smoke tests

---

## How the integration works

### Flow activation
- The existing chip `"Send a message to Alice"` in `#example-chips` is the entry point
- Clicking it calls a new `startGlassFlow()` function
- `startGlassFlow()` adds `flow-glass` to `body.classList`, hides `#chat-panel` and `#input-area`, shows `#glass-panel`, resets `glassUi` state to IDLE, and begins the flow

### Flow deactivation
- `glassReset()` removes `flow-glass`, hides `#glass-panel`, restores `#input-area`, resets `glassUi`
- Called on: SENT auto-dismiss, Cancel in CONFIRM, Esc from IDLE

### Shape mapping (GlassOS state → existing shape)
| GlassOS State | Shape passed to `morphTo()` | Notes |
|---|---|---|
| IDLE | `'circle'` | Pulsing dot; use existing circle shape (100×100). Content via `#c-rich`. |
| THINKING | `'magic'` | 60×60 thinking indicator. Use existing magic shape. Content via `#c-rich`. |
| DISAMBIGUATE | `'card-list'` | 420×360 card. Contact list via `#c-rich`. |
| COMPOSE | `'card-form'` | 420×400 card. Contact header + chips + listening field via `#c-rich`. |
| CONFIRM | `'card'` | 420×260 card. Contact header + message + 3 buttons via `#c-rich`. |
| SENDING | `'pill'` | 420×100 pill. Spinner + "Sending..." via `#c-rich`. |
| SENT | `'pill'` | 420×100 pill. ✅ + "Message sent" via `#c-rich`. |

### Blue glow
`#home-glow-layer` (already in DOM, already has exact blue glow box-shadow) sits inside `#drop-main`. In COMPOSE state: set its opacity to 1. In all other states: set opacity to 0. Do not change its CSS.

### Content rendering
Each state renders into `#c-rich` via `innerHTML`. Call `els.rich.classList.add('visible')` to show it. `els.rich` is already referenced in the existing `els` object at line ~2764.

Hide the standard content elements (`c-primary`, `c-secondary`, `c-thumb`, `c-detail`, `c-divider`) when rendering GlassOS states — set their opacity to 0 or leave them empty.

### `#glass-panel` layout (left simulator panel)
Position: `fixed; left:0; top:0; width:290px; height:100vh`. Hidden by default (`display:none`). Shown when `body.flow-glass`.

Sections (top to bottom):
1. Header: "GLASSOS SIMULATOR" label + key legend `↑↓ nav · Space confirm · Esc back`
2. Context-aware input: label + text input + pulsing blue dot when COMPOSE + helper text line below
3. AI voice output card: only visible when `glassUi.aiVoice` is non-empty
4. Event log: `flex:1; overflow:auto`; last 24 entries, color-coded; auto-scroll to bottom
5. Keyboard legend (pinned bottom): key badges for ↑↓ / Space / Esc / Enter

When `#glass-panel` is visible, `#main-col` (which holds `#ui-frame`) should still be centered in the remaining viewport. Add CSS: `body.flow-glass #main-col { padding-left: 290px; }` or equivalent.

### Keyboard routing
- Add a single global `keydown` listener (on `window`) for GlassOS; active only when `body.classList.contains('flow-glass')`
- When `#glass-input` is focused: all keys go to input. Arrow keys, Space, Esc do NOT navigate glass.
- When `#glass-input` is NOT focused: ArrowUp/ArrowDown → adjust `glassUi.sel` (clamped 0–maxSel); Space → `glassConfirm()`; Escape → `glassDismiss()`
- Auto-focus `#glass-input` when entering COMPOSE (200ms delay)
- Blur `#glass-input` after submitting a command

---

## Files to inspect
- `ref/glass-os-simulator.jsx` — exact visual layout, CSS values, component structure, state machine logic
- `ref/glass-os-send-message-spec.md` — full interaction spec (all timing values, voice shortcuts, sub-phase behavior table)
- `ai.html` lines 474–483 — `#c-rich` CSS (position:absolute, inset:0, padding:20px)
- `ai.html` lines 396–408 — `#home-glow-layer` CSS (already has exact blue glow box-shadow)
- `ai.html` lines 1865–1879 — DOM structure of `#stage`, `.drop#drop-main`, `#c-rich`
- `ai.html` lines 1885–1898 — `#input-area` and `#example-chips` (entry chip is already there)
- `ai.html` lines 2760–2770 — `els` object (references to DOM elements; `els.rich` = `#c-rich`)
- `ai.html` lines 4755–4795 — `morphTo()` function signature and dispatch logic
- `ai.html` lines 4993–5007 — `flightUi` object (model for `glassUi`)
- `ai.html` lines 309–345 — `.drop` CSS (the existing shape morph system)

## Files allowed to change
- `ai.html` only

---

## Implementation steps

### 1. Add `#glass-panel` HTML
Insert before `</body>` (or as a sibling to `#main-col`):
```html
<div id="glass-panel">
  <div id="glass-header">
    <div id="glass-sim-label">GlassOS Simulator</div>
    <div id="glass-key-legend">↑↓ nav · Space confirm · Esc back</div>
  </div>
  <div id="glass-input-section">
    <div id="glass-input-label">Voice Command</div>
    <div id="glass-input-wrap">
      <div id="glass-dot"></div>
      <input id="glass-input" type="text" autocomplete="off" spellcheck="false"/>
    </div>
    <div id="glass-input-hint"></div>
  </div>
  <div id="glass-voice-out"></div>
  <div id="glass-log"></div>
  <div id="glass-kbd">
    <!-- key badges: ↑↓ Nav, Space OK, Esc Back, Enter Send -->
  </div>
</div>
```

### 2. Add CSS for `#glass-panel` and GlassOS content elements
Add to the `<style>` block (before `</style>`). Key rules:
- `#glass-panel`: `position:fixed; left:0; top:0; width:290px; height:100vh; display:none; flex-direction:column; padding:22px 18px; gap:12px; border-right:1px solid rgba(255,255,255,0.04); background:#050505; font-family:'DM Sans',sans-serif; color:rgba(255,255,255,1); z-index:200`
- `body.flow-glass #glass-panel`: `display:flex`
- `body.flow-glass #chat-panel`: `display:none !important`
- `body.flow-glass #input-area`: `display:none !important`
- `body.flow-glass #main-col`: adjust centering to account for 290px panel (e.g., `padding-left:290px`)
- `#glass-dot`: 6px circle, `rgba(100,150,255,0.9)`, pulse animation, `position:absolute; left:11px; top:50%; transform:translateY(-50%); display:none`
- `#glass-input`: full-width, dark bg, subtle border; when COMPOSE → blue-tinted border + left padding for dot
- `#glass-log`: `flex:1; overflow:auto; font-size:10px; line-height:1.8`
- `.glog-user`: `color:rgba(255,255,255,1)`; `.glog-voice`: `color:rgba(130,170,255,0.5)`; `.glog-action`: `color:rgba(160,255,160,0.45)`; `.glog-success`: `color:rgba(100,255,140,0.6)`; `.glog-system`: `color:rgba(255,255,255,0.14)`
- `#glass-voice-out`: hidden when empty; small card with 🔊 label + quoted text
- GlassOS content inside `#c-rich`:
  - `.g-card-header`: avatar (40px circle, `rgba(255,255,255,0.12)`) + "To: [Name]" row
  - `.g-chips`: flex row of pill chips (`padding:8px 16px; border-radius:50px; font-size:20px`) — min 20px enforced
  - `.g-listen-field`: inner text bubble (`border-radius:22px; padding:14px 16px; min-height:44px; font-size:24px`) — blue glow from `#home-glow-layer`, not inline
  - `.g-contacts`: list of contact rows inside card-list
  - `.g-action-row`: flex row of 3 × 48px circle action buttons
  - `.g-checkmark`: 48px circle below card; animated opacity+transform+height
  - All glass display font sizes ≥ 20px (enforce in CSS)

### 3. Add `glassUi` state object and contacts data
```js
const GLASS_CONTACTS = [
  { id: 1, name: "Hiro Tanaka", initials: "HT", relation: "Colleague · Design",
    chips: [
      { label: "Design review", message: "Hey, do you have time for a design review sometime?" },
      { label: "Share a file", message: "I have a file to share with you — when's a good time?" },
      { label: "Schedule a sync", message: "Want to schedule a quick sync this week?" },
    ]
  },
  { id: 2, name: "Hiro Horri", initials: "HH", relation: "Friend",
    chips: [
      { label: "What's up?", message: "Hey! What's up? Haven't caught up in a while." },
      { label: "Lunch this week?", message: "Hey, want to grab lunch sometime this week?" },
      { label: "Check this out", message: "Hey, I found something cool I wanted to share with you!" },
    ]
  },
];

const GS = { IDLE:0, THINKING:1, DISAMBIGUATE:2, COMPOSE:3, CONFIRM:4, SENDING:5, SENT:6 };

const glassUi = {
  active: false,
  state: GS.IDLE,
  sel: 0,
  contact: null,
  msg: '',
  composeText: '',
  showChips: true,
  showCheck: false,
  aiVoice: '',
  log: [],
};
let glassPauseTimer = null;
let glassThinkingTimer = null;
let glassDotsTimer = null; // for animated · / · · / · · · in THINKING
```

### 4. Implement `glassTransitionTo(newState)`
- Sets `glassUi.state = newState`
- Resets `glassUi.sel = 0`
- Calls `glassRender()` (shape morph + content + panel update)

### 5. Implement `glassRender()`
Single function called after every state change:

**Shape morph** — call `morphTo(shape, {icon:'', primary:'', secondary:'', detail:''}, null)` with the mapped shape:
- IDLE → `'circle'`; THINKING → `'magic'`; DISAMBIGUATE → `'card-list'`; COMPOSE → `'card-form'`; CONFIRM → `'card'`; SENDING/SENT → `'pill'`

**Blue glow** — `document.getElementById('home-glow-layer').style.opacity = glassUi.state === GS.COMPOSE ? '1' : '0'`

**Rich content** — set `els.rich.innerHTML = buildGlassContent()` and toggle `els.rich.classList.toggle('visible', glassUi.state !== GS.IDLE)`

Hide standard content elements when glass is active: set `els.primary.style.opacity = '0'`, same for `els.secondary`, `els.thumb`, `els.detail`, `els.divider`

**Left panel** — update `#glass-input-label`, `#glass-input`'s placeholder and styling, `#glass-dot` visibility, `#glass-input-hint` text, `#glass-voice-out` visibility/text

### 6. Implement `buildGlassContent()` → HTML string
Returns HTML for `#c-rich` based on `glassUi.state`. Use JSX as pixel-level reference for layout and CSS values. All content is positioned inside a flex-column that fills the card. Content anchored to bottom of card using `margin-top:auto` or `justify-content:flex-end`.

Key per-state content:
- **IDLE**: empty string (no rich content; circle shape shows pulsing dot via existing circle behavior)
- **THINKING**: spinner div (`border-radius:50%; border:2px solid rgba(255,255,255,0.10); border-top-color:rgba(255,255,255,0.6); animation:spin 0.8s linear infinite; width:24px; height:24px`) + animated dots span
- **DISAMBIGUATE**: label "Which Hiro?" above card interior; two contact rows with avatar initials circle + name; selected row highlighted
- **COMPOSE**: contact header row (avatar + "To: Name"); chip row (animated collapse when text present); listening field (text or "Listening..." italic); checkmark button below (animated in/out)
- **CONFIRM**: contact header row; message text field (no blue glow — glow is on `#home-glow-layer` which is off); 3 action buttons (✈️ ✊ ❌) with selected state
- **SENDING**: spinner + "Sending..." centered in pill
- **SENT**: ✅ emoji + "Message sent" centered in pill

Note: the `@keyframes spin` and `@keyframes pulse` animations are already defined in `ai.html`. Reuse them.

### 7. Implement animated dots for THINKING
Use `glassDotsTimer` (`setInterval`) cycling `["·", "· ·", "· · ·"]` at 400ms. Clear timer when leaving THINKING state. Update `#glass-dots-span` in place (querySelector into `#c-rich`).

### 8. Implement 3-second pause timer
`glassPauseTimer`: `setTimeout` set on every keystroke in COMPOSE when `composeText` is non-empty. On fire: `glassUi.showCheck = true; glassRender()`. Clear + restart on resume. Clear on state exit.

### 9. Implement `glassConfirm()` (Space key or Enter on checkmark)
```
DISAMBIGUATE → select contact → brief THINKING (700ms) → COMPOSE
COMPOSE + showChips + no text → chip selected → fill text, showCheck=true, re-render
COMPOSE + showCheck → go to CONFIRM
CONFIRM → doGlassAction(glassUi.sel)
```

### 10. Implement `doGlassAction(index)`
```
0 (Send) → SENDING → (900ms) → SENT → (2500ms) → glassReset()
1 (Edit) → back to COMPOSE with msg pre-filled, showChips=false, showCheck=false, focus input
2 (Cancel) → glassReset()
```

### 11. Implement `glassDismiss()` (Esc key)
```
CONFIRM → back to COMPOSE with msg pre-filled, focus input
COMPOSE/DISAMBIGUATE → glassReset()
IDLE/THINKING/SENDING → no-op
```

### 12. Implement `parseGlassVoice(text)` → boolean
```
CONFIRM: "send"/"yes"/"confirm" → doGlassAction(0); "edit"/"change" → doGlassAction(1); "cancel"/"nevermind" → doGlassAction(2)
COMPOSE + showCheck: "send"/"yes" → skip to SENDING
DISAMBIGUATE: name substring match → setSel(match); glassConfirm()
COMPOSE + showChips + no text: chip label match → setSel(chipIndex); glassConfirm()
```

### 13. Implement `handleGlassInputSubmit()`
- In COMPOSE: finalize text (`glassUi.composeText = inputValue; glassUi.msg = inputValue; glassUi.showCheck = true; glassUi.showChips = false`), re-render, blur input
- Otherwise: try `parseGlassVoice(text)` first; if not consumed, run intent parse:
  - Text contains "send" or "message" → THINKING → extract name after "to" → match GLASS_CONTACTS → 1 match → COMPOSE; 2+ → DISAMBIGUATE; 0 → log "not found", return to IDLE after 2s

### 14. Implement `handleGlassInputChange(e)` (in COMPOSE)
- `glassUi.composeText = e.target.value`
- If non-empty: `glassUi.showChips = false; glassUi.showCheck = false`; clear + restart `glassPauseTimer`
- If empty: `glassUi.showChips = true`; clear `glassPauseTimer`
- Call `glassRender()`

### 15. Wire up entry point
Modify the `fireChip()` function (or the onclick of the "Send a message to Alice" chip) to call `startGlassFlow()` instead of the standard chat flow when the chip text matches.

### 16. Implement global keyboard listener (glass-specific)
Add to existing `document`/`window` keydown handler OR add a new one gated on `body.classList.contains('flow-glass')`:
```
if (!body.classList.contains('flow-glass')) return;
if (activeElement === glassInputEl) return; // input captures its own keys
ArrowUp/ArrowLeft → glassUi.sel = Math.max(0, glassUi.sel - 1); glassRender()
ArrowDown/ArrowRight → glassUi.sel = Math.min(maxGlassSel(), glassUi.sel + 1); glassRender()
Space → glassConfirm()
Escape → glassDismiss()
```

`maxGlassSel()`: returns `GLASS_CONTACTS.length - 1` in DISAMBIGUATE; `contact.chips.length - 1` in COMPOSE+showChips+noText; `2` in CONFIRM; `0` otherwise.

### 17. Add `glassAddLog(text, type)` helper
Appends to `glassUi.log` (trim to last 24). Updates `#glass-log` innerHTML. Auto-scrolls to bottom. Types: `'user'`, `'voice'`, `'action'`, `'success'`, `'system'`.

---

## Acceptance criteria
- [ ] Clicking "Send a message to Alice" chip activates glass-os mode: `#glass-panel` appears, `#chat-panel` and `#input-area` disappear, glass display shows `circle` shape
- [ ] Typing "Send a message to Hiro" + Enter → THINKING (magic shape) → DISAMBIGUATE (card-list with 2 contacts)
- [ ] ↑↓ navigates contact highlight; Space selects → brief THINKING → COMPOSE (card-form, blue glow on, chips visible)
- [ ] Typing in `#glass-input` mirrors to compose text in card; chips animate out; 3s pause → checkmark appears
- [ ] Resuming typing → checkmark disappears, timer resets
- [ ] Chip navigation with ↑↓ when no text; Space selects chip → message fills field, checkmark appears
- [ ] Space on checkmark → CONFIRM (card shape, no blue glow, 3 action buttons)
- [ ] ↑↓ moves between 3 buttons; Space on ✈️ → SENDING → SENT → IDLE (auto, 2.5s)
- [ ] Space on ✊ → back to COMPOSE with text pre-filled, input focused, blue glow on
- [ ] Space on ❌ → `glassReset()`, standard ai.html restored
- [ ] Esc from CONFIRM → back to COMPOSE; Esc from COMPOSE → `glassReset()`
- [ ] "send" shortcut in COMPOSE+checkmark → SENDING (skips CONFIRM)
- [ ] Voice shortcuts in CONFIRM: "send", "edit", "cancel" all work
- [ ] Left panel log shows color-coded entries for all transitions
- [ ] AI voice output section appears/disappears correctly per state
- [ ] Input label/placeholder/styling updates correctly per state
- [ ] All glass display content stays within 420×420 (no visible overflow outside glasses stroke)
- [ ] Minimum font size on glass display: 20px (nothing smaller)
- [ ] `test/smoke.mjs` still passes (ai.html unbroken for normal flight flow)
- [ ] Flight flow ("Book a flight" chip) still works normally after glass flow is reset

---

## Validation checklist
- [ ] No changes to `morphTo()` or any existing shape rendering functions
- [ ] `#home-glow-layer` CSS not modified — only its `opacity` toggled in JS
- [ ] `#c-rich` CSS not modified — only its content and `.visible` class toggled
- [ ] Existing `flightUi` and flight flow untouched
- [ ] `test/smoke.mjs` passes
- [ ] No framework imports added
- [ ] `glassUi.active` set to true on `startGlassFlow()`, false on `glassReset()` (guards against concurrent flows)
- [ ] Only one keyboard listener active at a time (glass listener no-ops when `!flow-glass`)

---

## Risks / notes
- **`morphTo()` with empty content**: pass `{icon:'', primary:'', secondary:'', detail:''}` to avoid rendering stale text from prior flight state. Clear `els.rich.innerHTML` before setting new content.
- **`#home-glow-layer` opacity vs transition**: it already has `transition: opacity 500ms ease`. Just set `.style.opacity`. Don't fight the existing transition.
- **Dots animation interval**: must be cleared on every state exit, not just on THINKING exit. Guard: `if (glassDotsTimer) { clearInterval(glassDotsTimer); glassDotsTimer = null; }`
- **Checkmark height collapse**: animate `height` 48→0 and `opacity` 1→0 so the card doesn't jump. In CSS: `.g-checkmark { transition: opacity 350ms ease, height 350ms ease, transform 350ms ease; overflow:hidden; }`. Height values: `48px` (visible) / `0` (hidden).
- **Chip collapse animation**: use `max-height` + `opacity` + `margin-bottom` transition, not `display:none`, so the collapse animates. Match JSX approach.
- **`glassRender()` call frequency**: called on every keystroke in COMPOSE (for real-time compose text update). Keep it lightweight — update `#c-rich` innerHTML and panel state only, don't re-call `morphTo()` unless state actually changed.
- **Concurrent flow guard**: if `flightUi.active` is true when "Send a message to Alice" is clicked, call the existing flight reset before starting glass flow.
- **`sel` bounds on re-render**: always clamp `glassUi.sel` to `[0, maxGlassSel()]` before using it as an array index.

## Open questions
- Should `startGlassFlow()` immediately call `morphTo('circle', ...)` to reset to idle dot before the user types a command, or leave the glass display in its current state? (Recommendation: yes, morph to `circle` immediately on activation to give the pulsing idle visual.)
- The `#ui-frame` is currently centered in `#main-col` which fills 100% width. When `#glass-panel` appears (290px left), should the glass display shift right to center in the remaining space, or stay centered in the full viewport? (Recommendation: center in remaining space — `body.flow-glass #main-col { padding-left: 290px }` is the simplest approach.)
