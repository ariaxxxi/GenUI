# Task

## Title
ai.html: Permanent Sim Panel + GlassOS Send Message Flow (together)

## Status
- Ready for implementation

## Objective
Two changes to `ai.html` in one session, in order:

1. **Structural swap** — replace `#chat-panel` + `#input-area` with a permanent 290px `#sim-panel` (left column, always visible in AI mode). Reroute existing flight flow output to the new panel. Glass display re-centered in remaining right area.

2. **GlassOS Send Message flow** — add `glassUi` state machine (IDLE → THINKING → DISAMBIGUATE → COMPOSE → CONFIRM → SENDING → SENT), activated by the "Send a message to Alice" chip. Uses `morphTo()` and the new permanent panel.

Do Step 1 first, verify flight flow still works, then do Step 2.

Spec: `ref/glass-os-send-message-spec.md`. Visual reference: `ref/glass-os-simulator.jsx`.

---

## In scope
- All changes in `ai.html` only
- Remove `#chat-panel` and `#input-area` HTML + CSS
- Add permanent `#sim-panel` (290px fixed left, `body.mode-ai`)
- Reroute `addChatBubble()` → `addSimLog()` + `setSimVoice()`
- Rename `input` variable → `#sim-input`
- Remove 4 `input-area` classList references
- Reposition `#ui-frame` to center in right area (290px → 100vw)
- `glassUi` state machine + all glass flow functions
- GlassOS content CSS (`.g-card-header`, `.g-chips`, `.g-listen-field`, `.g-checkmark`, etc.)
- COMPOSE dictation mode in panel (blue dot, blue-tinted input, auto-focus)

## Out of scope
- No new files
- No changes to `server.mjs`, `src/shapes.js`, `index.html`
- Do not modify `morphTo()`, `morphCore()`, or any existing shape rendering functions
- Do not modify existing flight flow logic — only its I/O is rerouted
- No real speech-to-text or TTS
- No LLM/AI calls for Send Message flow (rule-based only)
- No new smoke tests

---

## Step 1: Structural swap (panel in, chat out)

### HTML changes
- Remove `<div id="chat-panel" ...>` from `#main-col`
- Remove `<div id="input-area">` and all its children (input wrap, send button, example chips)
- Add `#sim-panel` as a sibling to `#main-col` (before `#main-col` in DOM):

```html
<div id="sim-panel">
  <div id="sim-header">
    <div id="sim-title">GlassOS Simulator</div>
    <div id="sim-key-legend"><kbd>↑↓</kbd> nav · <kbd>Space</kbd> confirm · <kbd>Esc</kbd> back</div>
  </div>
  <div id="sim-input-section">
    <div id="sim-input-label">Voice Command</div>
    <div id="sim-input-wrap">
      <div id="sim-dot"></div>
      <input id="sim-input" type="text" autocomplete="off" spellcheck="false" placeholder="Book a flight, send a message…"/>
    </div>
    <div id="sim-input-hint"></div>
  </div>
  <div id="sim-voice-out">
    <div id="sim-voice-label">🔊 AI</div>
    <div id="sim-voice-text"></div>
  </div>
  <div id="sim-log"></div>
  <div id="sim-kbd">
    <div class="sim-key-badge"><kbd>↑↓</kbd> <span>Nav</span></div>
    <div class="sim-key-badge"><kbd>Space</kbd> <span>OK</span></div>
    <div class="sim-key-badge"><kbd>Esc</kbd> <span>Back</span></div>
    <div class="sim-key-badge"><kbd>Enter</kbd> <span>Send</span></div>
  </div>
</div>
```

### CSS changes

**Remove** all rules for:
- `#chat-panel`, `body.mode-ai #chat-panel`, `#chat-panel::-webkit-scrollbar`
- `.chat-bubble`, `.chat-bubble.user`, `.chat-bubble.ai`, `.chat-bubble.typing`
- `.typing-dot`, `@keyframes bubbleIn`, `@keyframes typingBounce`
- `#input-area`, `body.mode-ai #input-area`, `body.mode-manual #input-area`, `#input-area.hidden`
- `#input-wrap`, `#user-input`, `#send-btn` (all states)
- `#example-chips`, `body.mode-ai #example-chips`, `.ex-chip` (all states)

**Add** `#sim-panel` CSS (match JSX pixel-for-pixel):
```css
#sim-panel {
  position: fixed; left: 0; top: 0;
  width: 290px; height: 100vh;
  display: none;
  flex-direction: column;
  padding: 22px 18px; gap: 12px;
  border-right: 1px solid rgba(255,255,255,0.04);
  background: #050505;
  font-family: 'DM Sans', sans-serif;
  color: rgba(255,255,255,1);
  z-index: 200;
  box-sizing: border-box;
  overflow: hidden;
}
body.mode-ai #sim-panel { display: flex; }

#sim-title {
  font-size: 10px; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;
  font-family: 'DM Sans', sans-serif;
}
#sim-key-legend {
  font-size: 12px; color: rgba(255,255,255,0.18); line-height: 1.5;
  font-family: 'DM Sans', sans-serif;
}
#sim-key-legend kbd { color: rgba(255,255,255,0.25); font-style: normal; }

#sim-input-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 2px;
  margin-bottom: 5px; color: rgba(255,255,255,0.25);
  transition: color 0.3s; font-family: 'DM Sans', sans-serif;
}
#sim-input-label.dictating { color: rgba(100,150,255,0.7); }

#sim-input-wrap { position: relative; }

#sim-dot {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(100,150,255,0.9);
  box-shadow: 0 0 5px rgba(100,150,255,0.4);
  animation: pulse 1.5s ease infinite;
  display: none; z-index: 1;
}
#sim-input-wrap.dictating #sim-dot { display: block; }

#sim-input {
  width: 100%; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; padding: 8px 11px;
  color: rgba(255,255,255,1);
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  outline: none; transition: all 0.3s;
  user-select: text; -webkit-user-select: text;
}
#sim-input.dictating {
  background: rgba(100,150,255,0.03);
  border-color: rgba(100,150,255,0.12);
  padding-left: 24px;
}
#sim-input::placeholder { color: rgba(255,255,255,0.18); }

#sim-input-hint {
  font-size: 10px; color: rgba(100,150,255,0.30);
  margin-top: 4px; min-height: 14px;
  font-family: 'DM Sans', sans-serif;
}

#sim-voice-out {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px; padding: 7px 10px;
  display: none;
}
#sim-voice-out.visible { display: block; }
#sim-voice-label {
  font-size: 9px; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 2px; margin-bottom: 3px;
  font-family: 'DM Sans', sans-serif;
}
#sim-voice-text { font-size: 12px; color: rgba(255,255,255,0.50); font-family: 'DM Sans', sans-serif; }

#sim-log { flex: 1; overflow-y: auto; }
#sim-log::-webkit-scrollbar { width: 2px; }
#sim-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
.slog { font-size: 10px; line-height: 1.8; font-family: 'DM Sans', sans-serif; }
.slog-user    { color: rgba(255,255,255,1); }
.slog-voice   { color: rgba(130,170,255,0.5); }
.slog-action  { color: rgba(160,255,160,0.45); }
.slog-success { color: rgba(100,255,140,0.6); }
.slog-system  { color: rgba(255,255,255,0.14); }

#sim-kbd {
  display: flex; flex-wrap: wrap; gap: 3px 10px;
  padding: 8px 0 0; border-top: 1px solid rgba(255,255,255,0.03);
}
.sim-key-badge {
  display: flex; align-items: center; gap: 3px;
  font-size: 9px; font-family: 'DM Sans', sans-serif;
}
.sim-key-badge kbd {
  color: rgba(255,255,255,0.50); background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 3px;
  padding: 1px 4px; font-style: normal;
}
.sim-key-badge span { color: rgba(255,255,255,0.25); }
```

**Modify** `#ui-frame` centering:
```css
/* Before */
body.mode-ai #ui-frame {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
}
/* After */
body.mode-ai #ui-frame {
  position: fixed;
  left: calc(290px + (100vw - 290px) / 2);
  top: 50%;
  transform: translate(-50%, -50%);
}
```

Also update `body.mode-ai #chat-panel` positioning rule — delete it (element removed).

### JS changes

**Variable rename** (line ~6205):
```js
// Before
const input = document.getElementById('user-input');
// After
const input = document.getElementById('sim-input');
```

**Remove** `sendBtn` variable and all `sendBtn.classList` calls.

**Replace** `chatPanelEl()` and `addChatBubble()`:
```js
function addChatBubble(role, text) {
  if (!text) return;
  addSimLog(text, role === 'user' ? 'user' : 'voice');
  if (role === 'ai') setSimVoice(text);
}

function showTypingBubble() { setSimVoice('...'); }
function hideTypingBubble() { /* leave last AI voice visible */ }
function chatPanelEl() { return null; }
```

**Add** new panel helpers:
```js
function addSimLog(text, type = 'system') {
  const log = document.getElementById('sim-log');
  if (!log) return;
  const entries = log.querySelectorAll('.slog');
  if (entries.length >= 24) entries[0].remove();
  const el = document.createElement('div');
  el.className = `slog slog-${type}`;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function setSimVoice(text) {
  const out = document.getElementById('sim-voice-out');
  const txt = document.getElementById('sim-voice-text');
  if (!out || !txt) return;
  if (text) { txt.textContent = `"${text}"`; out.classList.add('visible'); }
  else { out.classList.remove('visible'); txt.textContent = ''; }
}

function setSimInputState({ label, placeholder, hint = '', dictating = false }) {
  const lbl = document.getElementById('sim-input-label');
  const inp = document.getElementById('sim-input');
  const wrap = document.getElementById('sim-input-wrap');
  const hnt = document.getElementById('sim-input-hint');
  if (lbl) { lbl.textContent = dictating ? '🎤 Voice Dictation' : label; lbl.classList.toggle('dictating', dictating); }
  if (inp) { inp.placeholder = placeholder; inp.classList.toggle('dictating', dictating); }
  if (wrap) wrap.classList.toggle('dictating', dictating);
  if (hnt) hnt.textContent = hint;
}
```

**Remove/no-op** all 4 `document.getElementById('input-area').classList` calls — just delete those lines.

**Update** `handleSend()` — remove `sendBtn.classList.remove('active')` line; the rest reads from `input` which now points to `#sim-input`.

**Update** `fireChip()` — remove `sendBtn.classList.add/remove('active')` lines; keep the logic that calls `handleChipQuickAction()` / `processRequest()`.

**Add** `#sim-input` event listeners (replace the old `#user-input` listeners):
```js
input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });
// (existing input event listeners that set sendBtn active → remove)
```

---

## Step 2: GlassOS Send Message flow

### Contacts + state machine
```js
const GLASS_CONTACTS = [
  { id:1, name:'Hiro Tanaka', initials:'HT', relation:'Colleague · Design',
    chips:[
      { label:'Design review', message:'Hey, do you have time for a design review sometime?' },
      { label:'Share a file', message:'I have a file to share with you — when\'s a good time?' },
      { label:'Schedule a sync', message:'Want to schedule a quick sync this week?' },
    ]},
  { id:2, name:'Hiro Horri', initials:'HH', relation:'Friend',
    chips:[
      { label:'What\'s up?', message:'Hey! What\'s up? Haven\'t caught up in a while.' },
      { label:'Lunch this week?', message:'Hey, want to grab lunch sometime this week?' },
      { label:'Check this out', message:'Hey, I found something cool I wanted to share with you!' },
    ]},
];
const GS = { IDLE:0, THINKING:1, DISAMBIGUATE:2, COMPOSE:3, CONFIRM:4, SENDING:5, SENT:6 };
const glassUi = {
  active:false, state:GS.IDLE, sel:0,
  contact:null, msg:'', composeText:'',
  showChips:true, showCheck:false, aiVoice:'',
};
let glassPauseTimer = null;
let glassDotsTimer = null;
```

### Shape mapping (GlassOS state → existing shape)
| GlassOS State | Shape passed to `morphTo()` | Dimensions | Notes |
|---|---|---|---|
| IDLE | `'circle'` | 100×100px | Pulsing dot. Minimal `#c-rich` content (centered "Listening" label). |
| THINKING | `'magic'` | 60×60px | Small thinking indicator. Spinner + animated dots in `#c-rich`. See note below. |
| DISAMBIGUATE | `'card-list'` | 420×360px | Full-width tall card. Contact list in `#c-rich`. |
| COMPOSE | `'card-form'` | 420×400px | Full-width tall card. Header + chips + listening field in `#c-rich`. |
| CONFIRM | `'card'` | 420×260px | Full-width card. Header + message + 3 buttons in `#c-rich`. |
| SENDING | `'pill'` | 420×100px | Wide pill. Spinner + "Sending…" in `#c-rich`. |
| SENT | `'pill'` | 420×100px | Wide pill. ✅ + "Message sent" in `#c-rich`. |

> **THINKING shape note**: The spec calls for a "compact pill-shaped card" for THINKING, but `'magic'` (60×60) is used to stay consistent with the flight flow's thinking indicator. If the spinner + dots content overflows visually, switch THINKING to `'pill'` instead.

---

### Visual & Interaction Spec per State

All content inside `#c-rich` is a flex column, bottom-aligned within the card. All glass display fonts ≥ 20px. Card background: `rgba(255,255,255,0.03)`. Card border: `1px solid rgba(255,255,255,0.10)`. TopGlow on every card (see CSS section).

#### IDLE — `circle` (100×100)
**Visual:**
- The existing `circle` shape renders a 100×100 dot — no additional morph needed
- `#c-rich` content (optional): centered "Listening" label at 20px, `color:rgba(255,255,255,0.25)`
- OR: leave `#c-rich` empty and rely on the circle shape's own visual (pulsing behavior if supported by existing GenUI circle)

**Interaction:**
- Passive — no navigation, no Space action
- User types "Send a message to Hiro" in `#sim-input` + Enter → THINKING

---

#### THINKING — `magic` (60×60)
**Visual:**
```
[ spinner ]  ·  (dots animate: · → · · → · · ·)
```
- Spinner: `width:24px; height:24px; border-radius:50%; border:2px solid rgba(255,255,255,0.10); border-top-color:rgba(255,255,255,0.6); animation:spin 0.8s linear infinite`
- Dots span: `font-size:24px; color:rgba(255,255,255,0.50); letter-spacing:3px`
- Container: `display:flex; align-items:center; gap:14px`
- Dots cycle every 400ms via `glassDotsTimer`

**Interaction:**
- No user input accepted during THINKING (keyboard listener no-ops)
- Auto-advances: after ~1000ms → check contact matches → DISAMBIGUATE or COMPOSE or IDLE

---

#### DISAMBIGUATE — `card-list` (420×360)
**Visual:**
```
Which Hiro?                          ← label above card, NOT inside it
┌─────────────────────────────────┐  ← card, borderRadius:30px
│ ░░ HT  Hiro Tanaka              │  ← row 0 (highlighted if sel=0)
│ ░░ HH  Hiro Horri               │  ← row 1
└─────────────────────────────────┘
```

- **Label above card**: `"Which Hiro?"` — `font-size:24px; color:rgba(255,255,255,0.50); margin-bottom:10px; padding:0 2px`
- **Card**: `border-radius:30px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.03); padding:6px; position:relative; overflow:hidden` + TopGlow
- **Contact row**: `display:flex; align-items:center; gap:14px; padding:12px 14px; border-radius:24px`
  - Unselected: `background:transparent`
  - Selected (`sel === i`): `background:rgba(255,255,255,0.05)`
  - Transition: `background 0.2s`
- **Avatar** (initials circle): `width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; font-size:15px (42×0.36); font-weight:600; color:rgba(255,255,255,0.50)`
- **Name text**: `font-size:24px; font-family:DM Sans`
  - Unselected: `font-weight:400; color:rgba(255,255,255,0.50)`
  - Selected: `font-weight:600; color:rgba(255,255,255,1)`
  - Transition: `all 0.2s`

**Interaction:**
- `↑↓` → moves `sel` between 0 and 1; re-renders highlighted row
- `Space` → `glassConfirm()` → picks `GLASS_CONTACTS[sel]` → brief THINKING (700ms) → COMPOSE
- Voice: typing a name substring (e.g. "tanaka") + Enter → selects matching contact → COMPOSE
- Esc → `glassReset()`

---

#### COMPOSE — `card-form` (420×400)
**Visual (4 layers, top to bottom inside card):**
```
┌─────────────────────────────────┐  ← card, borderRadius:30px, padding:20px
│ ░░ HT   To: Hiro Tanaka        │  ← contact header row
│                                 │
│ [Design review] [Share a file]  │  ← chips (animate OUT when text starts)
│ [Schedule a sync]               │
│                                 │
│ ┌─────────────────────────────┐ │  ← listening field (blue glow from #home-glow-layer)
│ │ Listening...                │ │  ← italic placeholder, or live text
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
           [ ✅ ]                    ← checkmark button (appears below card after 3s pause)
```

**Card**: `border-radius:30px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.03); padding:20px; position:relative; overflow:hidden` + TopGlow

**Contact header row**: `display:flex; align-items:center; gap:12px; margin-bottom:14px`
- Avatar: `width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.12)`; initials centered, `font-size:14px; font-weight:600; color:rgba(255,255,255,0.50)`
- "To: " text: `font-size:24px; color:rgba(255,255,255,0.50)`
- Contact name: `font-weight:600; color:rgba(255,255,255,1)` (inline in same span)

**Chips row**: `display:flex; flex-wrap:wrap; gap:8px`
- Visible when: `showChips && !composeText`
- Collapse animation (NOT `display:none`): `max-height` 120→0; `opacity` 1→0; `margin-bottom` 14→0; `overflow:hidden; transition:all 400ms cubic-bezier(0.35,0.23,0.13,0.98)`
- Each chip: `padding:8px 16px; border-radius:50px; font-size:20px; white-space:nowrap; transition:all 0.2s ease`
  - Unselected: `background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.10); color:rgba(255,255,255,0.50); font-weight:400`
  - Selected (`sel === i`): `background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.28); color:rgba(255,255,255,1); font-weight:500`

**Listening field**: `border-radius:22px; padding:14px 16px; min-height:44px (56px when hasText); background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); transition:min-height 400ms ease`
- Blue glow comes from `#home-glow-layer` opacity:1 — NOT inline box-shadow
- Empty: `font-size:24px; color:rgba(255,255,255,0.50); font-style:italic` → "Listening..."
- With text: `font-size:24px; color:rgba(255,255,255,1); line-height:1.45` → live transcription

**Checkmark** (outside/below card, centered):
- Container: `display:flex; flex-direction:column; align-items:center; gap:14px` wraps the card AND checkmark
- Checkmark button: 48px circle — same `.g-action-btn` style as CONFIRM buttons but always selected appearance: `background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.22); transform:scale(1.12)`; emoji ✅ at 20px
- Animate IN: `opacity` 0→1; `transform` translateY(4px)scale(0.85)→translateY(0)scale(1); `height` 0→48px; transition 350ms ease
- Animate OUT (on resume typing): reverse

**Interaction:**
- `↑↓` → navigates chips when `showChips && !composeText` (clamped to `contact.chips.length - 1`)
- `Space` when chips visible + no text → selects chip: fills `composeText` + `msg` with chip's full message, collapses chips (`showChips=false`), shows checkmark immediately (`showCheck=true`)
- Typing in `#sim-input` → mirrors to listening field character-by-character; chips collapse; 3s pause timer restarts
- 3s pause → `showCheck=true`; checkmark animates in
- Resume typing → `showCheck=false`; checkmark animates out; timer resets
- `Space` when `showCheck=true` → `glassConfirm()` → CONFIRM
- Enter in `#sim-input` → finalize text, show checkmark, blur input
- Voice: "send" when checkmark visible → skip to SENDING
- Esc → `glassReset()`
- Panel input: dictation mode active (blue dot, blue border, left padding, auto-focused)

---

#### CONFIRM — `card` (420×260)
**Visual:**
```
┌─────────────────────────────────┐  ← card, borderRadius:30px, padding:20px
│ ░░ HT   To: Hiro Tanaka        │  ← same contact header
│                                 │
│ ┌─────────────────────────────┐ │  ← message bubble (NO blue glow)
│ │ Hey, do you have time for   │ │
│ │ a design review sometime?   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
     [ ✈️ ]  [ ✊ ]  [ ❌ ]         ← action buttons (fadeUp animation)
```

**Card**: same as COMPOSE card style. `#home-glow-layer` opacity is `0` — no blue glow.

**Contact header row**: identical to COMPOSE header.

**Message text field** (NOT a listening field): `border-radius:22px; padding:14px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); box-shadow:inset 0 1px 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.02)` (cardBase shadow, not blue glow)
- Message text: `font-size:24px; color:rgba(255,255,255,1); line-height:1.45`

**Action buttons row** (below card, outside): `display:flex; gap:14px; justify-content:center; animation:fadeUp 400ms ease both`
- Each button: 48px circle, emoji at `font-size:20px`; `transition:all 300ms cubic-bezier(0.35,0.23,0.13,0.98)`
  - Unselected: `background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); transform:scale(1)`
  - Selected: `background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.22); transform:scale(1.12)`
- Button 0: ✈️ Send (default `sel=0`)
- Button 1: ✊ Edit
- Button 2: ❌ Cancel

**Interaction:**
- `↑↓` → moves `sel` between 0, 1, 2
- `Space` → `doGlassAction(sel)`
  - 0 (✈️) → SENDING
  - 1 (✊) → back to COMPOSE with `msg` pre-filled in listening field; chips hidden; blue glow on; input focused
  - 2 (❌) → `glassReset()`
- Voice: "send"/"yes"/"confirm" → action 0; "edit"/"change" → action 1; "cancel"/"nevermind" → action 2
- Esc → back to COMPOSE (same as Edit, text preserved)
- Panel input: standard "Voice Command" mode, placeholder `'"send", "edit", or "cancel"'`

---

#### SENDING — `pill` (420×100)
**Visual:**
```
[ spinner ]  Sending...
```
- Pill container: `border-radius:50px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.03); padding:14px 20px; position:relative; overflow:hidden` + TopGlow
- Inner: `display:flex; align-items:center; gap:12px; justify-content:center`
- Spinner: `width:20px; height:20px; border-radius:50%; border:2px solid rgba(255,255,255,0.10); border-top-color:rgba(255,255,255,0.6); animation:spin 0.7s linear infinite`
- "Sending…" text: `font-size:20px; color:rgba(255,255,255,0.50); font-family:DM Sans`

**Interaction:** No input accepted. Auto-advances to SENT after 900ms.

---

#### SENT — `pill` (420×100)
**Visual:**
```
✅  Message sent
```
- Same pill container as SENDING
- ✅ emoji: `font-size:20px`
- "Message sent" text: `font-size:24px; font-weight:500; color:rgba(255,255,255,1); font-family:DM Sans`
- Inner: `display:flex; align-items:center; gap:12px; justify-content:center`

**Interaction:** No input. Auto-calls `glassReset()` after 2500ms → returns to standard ai.html state.

---

### Key functions
- `startGlassFlow()` — sets `glassUi.active=true`, morphs to `'circle'`, resets panel input to IDLE state, calls `setTimeout(() => input.focus(), 50)` so user can type command immediately
- `glassReset()` — sets `glassUi.active=false`, morphs to `'circle'`, calls `setSimVoice('')`, calls `setSimInputState({ label: 'Voice Command', placeholder: 'Book a flight, send a message…', hint: '', dictating: false })`
- `glassTransitionTo(state)` — sets `glassUi.state`, resets `sel=0`, calls `glassRender()`
- `glassRender()` — calls `morphTo()` with mapped shape, sets `els.rich.innerHTML = buildGlassContent()`, toggles `els.rich.classList`, hides standard content els (`els.primary/secondary/thumb/detail/divider` opacity=0), sets `#home-glow-layer` opacity (1 in COMPOSE, 0 otherwise), updates panel via `setSimInputState()`
- `buildGlassContent()` → HTML string per state (see JSX for exact CSS values)
- `glassConfirm()` — Space handler; dispatches per state
- `glassDismiss()` — Esc handler
- `doGlassAction(index)` — 0=send, 1=edit, 2=cancel
- `parseGlassVoice(text)` → boolean; voice shortcuts per state
- `handleGlassInputSubmit()` — called on Enter from `#sim-input` when `glassUi.active`; in COMPOSE finalizes text; otherwise tries `parseGlassVoice` then intent parse
- `handleGlassInputChange(val)` — called on input change when `glassUi.active && state===COMPOSE`; updates `composeText`, manages `glassPauseTimer`, calls `glassRender()`
- `maxGlassSel()` — returns nav bounds per state
- `addGlassLog(text, type)` — wrapper around `addSimLog()` for glass-specific entries

### `#sim-input` routing
Use ONE merged listener per event type (not separate glass/non-glass listeners — they'd double-fire):

```js
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (glassUi.active) handleGlassInputSubmit();
    else handleSend();
  }
  if (e.key === 'Escape' && glassUi.active) { glassDismiss(); input.blur(); }
});
input.addEventListener('input', e => {
  if (glassUi.active && glassUi.state === GS.COMPOSE) onTranscriptUpdate(e.target.value);
});
```

Replace the old `#user-input` keydown listener entirely with the merged version above.

### Global keyboard listener
Gate on `glassUi.active`. Skip if `document.activeElement === input`. ArrowUp/Down → adjust `glassUi.sel`; Space → `glassConfirm()`; Escape → `glassDismiss()`.

### Entry point
In `handleChipQuickAction()`, the `/\bmessage\b|\btext\b/` branch currently calls `handleManualRequest('send a message to alice')`. Change it to call `startGlassFlow()`.

### GlassOS content CSS (add to `<style>`)
Use JSX as pixel-level reference. Key rules:
- `.g-card-header`: flex row, avatar (40px circle `rgba(255,255,255,0.12)`, initials 36% font-size), "To: Name" text (24px)
- `.g-chips`: flex wrap, gap 8px; chip: `padding:8px 16px; border-radius:50px; font-size:20px` — min 20px on glass
- `.g-listen-field`: `border-radius:22px; padding:14px 16px; min-height:44px; font-size:24px`
- `.g-contacts`: contact rows inside card; row: avatar + name (24px), selected row `background:rgba(255,255,255,0.05)`
- `.g-action-row`: flex row of 3 × 48px circles; selected: `scale(1.12)`, brighter border
- `.g-checkmark`: 48px circle; `transition: opacity 350ms, height 350ms, transform 350ms; overflow:hidden`; height `48px` → `0` when hidden
- Chip selected state: `border:1px solid rgba(255,255,255,0.28); color:rgba(255,255,255,1); background:rgba(255,255,255,0.10)`
- TopGlow (reuse across states): `position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.12) 70%, transparent 100%)`
- All glass display font sizes ≥ 20px

### Timings (from spec)
- THINKING duration: 800–1200ms (use ~1000ms)
- Post-disambiguate THINKING: 700ms
- Pause timer: 3000ms
- SENDING duration: 900ms
- SENT auto-dismiss: 2500ms

---

### Future-proofing: voice & AI seams

The spec requires the state machine to support real voice input, TTS output, and LLM intent parsing **without restructuring the flow**. Build three clean seams now even though they're backed by stubs.

#### Seam 1 — Transcript input: `onTranscriptUpdate(text)`
```js
// Call this whenever new transcription arrives (character by character or phrase by phrase).
// Currently wired to #sim-input oninput. Future: wire to Web Speech API or streaming STT.
function onTranscriptUpdate(text) {
  if (glassUi.state === GS.COMPOSE) {
    handleGlassInputChange(text);
  }
}
```
- `handleGlassInputChange()` must only read from its `text` argument, NOT from `input.value` directly
- This way the real `#sim-input` oninput handler just calls `onTranscriptUpdate(e.target.value)` — and a speech API can call the same function

#### Seam 2 — Voice output: `speakOutput(text)`
```js
// Called at every state transition with the AI's spoken response.
// Currently just updates #sim-voice-out. Future: replace body with a TTS call.
function speakOutput(text) {
  glassUi.aiVoice = text;
  setSimVoice(text);                 // updates panel display now
  // future: window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
```

**Call `speakOutput()` at every state transition** with the correct string:
| Transition | `speakOutput()` argument |
|---|---|
| → DISAMBIGUATE | `"Which Hiro?"` |
| → COMPOSE (1 match) | `"Message to ${contact.name.split(' ')[0]}. What would you like to say?"` |
| → COMPOSE (after disambiguate) | `"What would you like to say to ${contact.name.split(' ')[0]}?"` |
| → CONFIRM | `"Send to ${contact.name.split(' ')[0]}?"` |
| → COMPOSE (edit) | `"Edit your message."` |
| → SENT | `"Sent."` |
| 0 matches | `"Contact not found."` |
| All other transitions | `""` (clears voice output) |

`glassTransitionTo()` should call `speakOutput('')` by default, then the caller overrides with the right string. Or: include `voiceOutput` in a transition config object.

#### Seam 3 — Intent parsing: `parseIntent(text)` → structured result
```js
// Currently regex-based. Future: replace body with LLM call returning structured JSON.
// The caller never sees the implementation — only the returned shape matters.
async function parseIntent(text) {
  const lower = text.toLowerCase().trim();
  // Current stub — regex pattern matching
  if (/\b(send|message|text)\b/.test(lower)) {
    const match = lower.match(/\bto\s+(\w+)/i);
    const recipient = match ? match[1] : '';
    return { intent: 'send_message', recipient, confidence: 1.0 };
  }
  return { intent: 'unknown', recipient: '', confidence: 0 };
  // Future LLM version:
  // const res = await fetch('/api/ai', { method:'POST', body: JSON.stringify({ userText: text, ... }) });
  // return await res.json(); // { intent, recipient, confidence }
}
```

`handleGlassInputSubmit()` in IDLE state calls `await parseIntent(text)` and dispatches based on `result.intent`. This makes swapping to LLM a one-function change.

#### How the three seams connect
```
[#sim-input oninput] ──→ onTranscriptUpdate(text)  ──→ handleGlassInputChange()
[#sim-input Enter]   ──→ handleGlassInputSubmit()   ──→ parseIntent(text) ──→ glassTransitionTo()
[glassTransitionTo]  ──→ speakOutput(voiceString)   ──→ setSimVoice() [+ future TTS]

Future:
[Web Speech API]     ──→ onTranscriptUpdate(text)   (same function, no other change)
[LLM endpoint]       ──→ parseIntent(text)          (same caller, new body)
[TTS engine]         ──→ speakOutput(text)          (same call sites, new body)
```

---

## Step 3: COMPOSE dictation mode in panel

`setSimInputState()` calls per glass state:
- IDLE: `{ label: 'Voice Command', placeholder: 'Send a message to Hiro…' }`
- THINKING: `{ label: 'Voice Command', placeholder: '' }`
- DISAMBIGUATE: `{ label: 'Voice Command', placeholder: 'Say a name, e.g. "Tanaka"' }`
- COMPOSE: `{ label: '🎤 Voice Dictation', placeholder: 'Speak (type to simulate)…', hint: 'Type → glass · 3s pause = ✅ · Enter = done', dictating: true }`
- COMPOSE + showCheck: hint: `'Keep talking to edit · Space = confirm · say "send"'`
- CONFIRM: `{ label: 'Voice Command', placeholder: '"send", "edit", or "cancel"' }`

Auto-focus `input` on COMPOSE entry: `setTimeout(() => input.focus(), 200)`.
Blur `input` after command submit: `input.blur()`.

---

## Files to inspect
- `ref/glass-os-simulator.jsx` — pixel-level CSS reference
- `ref/glass-os-send-message-spec.md` — full interaction spec
- `ai.html` lines 231–307 — chat panel CSS to remove
- `ai.html` lines 853–927 — input area CSS to remove
- `ai.html` lines 1854–1899 — HTML to restructure
- `ai.html` lines 258–263 — `#ui-frame` centering to update
- `ai.html` lines 396–408 — `#home-glow-layer` (reuse, no CSS change)
- `ai.html` lines 474–483 — `#c-rich` CSS (reuse, no change)
- `ai.html` lines 1865–1879 — `#stage` / `#drop-main` / `#c-rich` DOM
- `ai.html` lines 2760–2770 — `els` object (add sim panel refs)
- `ai.html` lines 4755–4795 — `morphTo()` (do not modify)
- `ai.html` lines 4993–5007 — `flightUi` model
- `ai.html` lines 5016–5044 — `addChatBubble`, `showTypingBubble` (to replace)
- `ai.html` lines 6205–6295 — `handleSend`, `fireChip`, `handleChipQuickAction` (to update)

## Files allowed to change
- `ai.html` only

---

## Acceptance criteria

### Step 1
- [ ] `#chat-panel` and `#input-area` gone from HTML and CSS
- [ ] `#sim-panel` always visible in ai.html (290px left column)
- [ ] Glass display centered in right area (visually correct)
- [ ] Flight flow ("Book a flight") works: shapes morph, AI replies appear in sim panel log + voice-out

### Step 2 + 3
- [ ] "Send a message to Alice" chip → glass flow activates, circle shape, IDLE state
- [ ] Typing "Send a message to Hiro" + Enter → THINKING → DISAMBIGUATE (2 contacts listed)
- [ ] ↑↓ navigates contacts; Space selects → brief THINKING → COMPOSE (blue glow on, chips visible)
- [ ] Typing in `#sim-input` mirrors to glass card in real time; chips animate out; 3s pause → checkmark
- [ ] Chip nav with ↑↓ when no text; Space → chip selected, message fills field, checkmark appears
- [ ] Space on checkmark → CONFIRM (no blue glow, 3 action buttons)
- [ ] Space on ✈️ → SENDING → SENT → IDLE auto-reset
- [ ] Space on ✊ → back to COMPOSE, text preserved, dictation mode on
- [ ] Space on ❌ → glassReset(), panel returns to default
- [ ] Esc from CONFIRM → COMPOSE; Esc from COMPOSE → glassReset()
- [ ] "send" shortcut in COMPOSE+checkmark skips CONFIRM
- [ ] Voice shortcuts in CONFIRM work
- [ ] Panel input switches to dictation mode in COMPOSE (blue dot, blue border, left padding)
- [ ] All glass display fonts ≥ 20px
- [ ] All content within 420×420 (no overflow outside glasses stroke)
- [ ] `test/smoke.mjs` passes

---

## Risks / notes
- **`input` variable** is referenced ~12 times — search `input.value`, `input.focus()`, `input.blur()` to catch all before renaming
- **`sendBtn`** has multiple call sites in `fireChip()` and event listeners — remove cleanly, guard with `if (sendBtn)` or delete the lines
- **`els` object** (~line 2764) — add `simInput`, `simLog`, `simVoiceOut` references there if other code needs them
- **`glassRender()` in COMPOSE** is called on every keystroke — only update `#c-rich` innerHTML and panel state; do NOT call `morphTo()` on every keystroke (only on state change)
- **`#home-glow-layer`** already has `transition: opacity 500ms ease` — just set `.style.opacity`, don't fight it
- **Dots animation**: use `setInterval` stored in `glassDotsTimer`; clear in `glassTransitionTo()` before setting new state
- **Checkmark collapse**: animate `height` 48→0 + `opacity` 1→0 simultaneously so card doesn't jump
- **Chip collapse**: use `max-height` + `opacity` + `margin-bottom` CSS transition, not `display:none`
- **Concurrent flows**: if `flightUi.active` when glass chip clicked, call `resetFlightFlowToHome()` first

## Open questions
- None — proceed with implementation
