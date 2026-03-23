# Task

## Title
ai.html: Voice input integration — Web Speech API across Send Message flow

## Status
Ready for implementation

## Objective
Wire real voice input into the Send Message flow using the Web Speech API. The three seam stubs (`onTranscriptUpdate`, `speakOutput`, `parseIntent`) are already in place — this task replaces the stub wiring and extends them. After this task, users can:
- Speak commands to start and navigate the flow ("Send a message to Hiro")
- Say a contact name or ordinal at disambiguation ("Hiro Tanaka", "the first one")
- Dictate message content in real time (compose field updates as they speak)
- Say voice shortcuts at confirm ("send", "cancel", "edit")

Typed input (`#sim-input`) must continue to work exactly as before — voice and typing are parallel input channels.

---

## In scope
- All changes in `ai.html` only
- New `voiceEngine` module (SpeechRecognition wrapper) inside `ai.html`
- Extend `onTranscriptUpdate(text, isFinal)` — add `isFinal` param and per-state routing
- Extend `glassTransitionTo()` — call `voiceEngine.start(mode)` / `voiceEngine.stop()` on each state entry
- New `parseDisambiguateVoice(text, contacts)` — ordinal + name matching
- Mic status indicator added to `#sim-panel` HTML + CSS
- Graceful degradation: if Speech API unavailable or permission denied, typed input works unaffected

## Out of scope
- No TTS / `speakOutput` is already wired to `setSimVoice()` — leave as-is
- No changes to `parseIntent` logic (it already accepts the text string)
- No changes to shape morphing, layout, or visual rendering
- No new files
- No smoke test changes

---

## Background: existing seams to wire

These functions already exist in `ai.html` — do not rewrite them, only extend:

```
onTranscriptUpdate(text)        line ~6103  — currently COMPOSE-only; extend to all states
speakOutput(text)               line ~5586  — already wired to setSimVoice(); leave body unchanged
parseIntent(text)               line ~6089  — regex stub; already called by handleGlassInputSubmit()
handleGlassInputSubmit()        line ~6414  — called on Enter; voice final result must call this too
handleGlassInputChange(val)     line ~6393  — updates compose field; called by onTranscriptUpdate
parseGlassVoice(text)           existing   — handles CONFIRM shortcuts ("send"/"edit"/"cancel")
glassTransitionTo(state, voice) line ~6051  — voice start/stop must be called here
```

The `onTranscriptUpdate` + `handleGlassInputSubmit` path is the canonical input channel. Voice final results must flow through the same path as typed Enter — not through a separate code branch.

---

## Step 1: Voice engine module

Add a `voiceEngine` object immediately after the `glassUi` / `GS` declarations.

```js
const voiceEngine = {
  recognition: null,      // SpeechRecognition instance
  supported: false,       // set to true if SpeechRecognition exists in window
  active: false,          // true while recognition is running
  mode: 'off',            // 'command' | 'dictation' | 'off'
  restartOnEnd: false,    // true if we want auto-restart (continuous workaround)
};
```

### Initialization
```js
function initVoiceEngine() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addSimLog('Voice input not supported in this browser', 'system');
    return;
  }
  voiceEngine.supported = true;
  const r = new SR();
  r.lang = 'en-US';
  r.interimResults = true;   // always on — we filter by isFinal flag
  r.maxAlternatives = 1;
  r.continuous = false;      // we restart manually to avoid browser quirks

  r.onresult = (e) => {
    const result = e.results[e.results.length - 1];
    const transcript = result[0].transcript.trim();
    const isFinal = result.isFinal;
    onVoiceResult(transcript, isFinal);
  };

  r.onend = () => {
    voiceEngine.active = false;
    updateMicIndicator();
    if (voiceEngine.restartOnEnd && voiceEngine.mode !== 'off' && glassUi.active) {
      // auto-restart — browser stops recognition after silence; resume seamlessly
      setTimeout(() => {
        if (voiceEngine.restartOnEnd && glassUi.active) voiceEngine.start(voiceEngine.mode);
      }, 120);
    }
  };

  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      voiceEngine.supported = false;
      voiceEngine.restartOnEnd = false;
      addSimLog('Mic access denied — use typed input', 'system');
    } else if (e.error === 'no-speech') {
      // normal — restart will handle it via onend
    } else {
      addSimLog(`Voice error: ${e.error}`, 'system');
    }
    voiceEngine.active = false;
    updateMicIndicator();
  };

  voiceEngine.recognition = r;
}
```

### start / stop
```js
voiceEngine.start = function(mode) {
  if (!voiceEngine.supported || !voiceEngine.recognition) return;
  voiceEngine.mode = mode;
  if (mode === 'off') { voiceEngine.stop(); return; }
  voiceEngine.restartOnEnd = true;
  if (voiceEngine.active) return;         // already running
  try {
    voiceEngine.recognition.start();
    voiceEngine.active = true;
    updateMicIndicator();
  } catch(e) {
    // recognition.start() throws if already started — safe to ignore
  }
};

voiceEngine.stop = function() {
  voiceEngine.restartOnEnd = false;
  voiceEngine.mode = 'off';
  if (voiceEngine.recognition && voiceEngine.active) {
    try { voiceEngine.recognition.stop(); } catch(e) {}
  }
  voiceEngine.active = false;
  updateMicIndicator();
};
```

Call `initVoiceEngine()` once at page load, after the DOM is ready (end of the existing init block).

---

## Step 2: Central voice result router

`onVoiceResult` is the single entry point for all voice output. It routes based on current glass state.

```js
function onVoiceResult(transcript, isFinal) {
  // Always mirror transcript to #sim-input for visual feedback (interim + final)
  if (input) { input.value = transcript; }

  onTranscriptUpdate(transcript, isFinal);
}
```

### Extend `onTranscriptUpdate(text, isFinal = false)`

Replace the existing stub with:

```js
function onTranscriptUpdate(text, isFinal = false) {
  if (!glassUi.active) return;

  switch (glassUi.state) {

    case GS.IDLE:
      // interim: show in input (done by onVoiceResult above)
      // final: submit as command → same path as typed Enter
      if (isFinal && text) {
        input.value = text;
        void handleGlassInputSubmit();
      }
      break;

    case GS.DISAMBIGUATE:
      if (isFinal && text) {
        const contacts = GLASS_CONTACTS.filter(c =>
          c.name.toLowerCase().includes(glassUi.recipientQuery || '')
        );
        const idx = parseDisambiguateVoice(text, contacts);
        if (idx >= 0) {
          glassUi.sel = idx;
          input.value = '';
          glassConfirm();
        } else {
          addGlassLog(`No match for "${text}" — try a name or "the first one"`, 'system');
        }
      }
      break;

    case GS.COMPOSE:
      // interim + final: update compose field in real time
      handleGlassInputChange(text);
      if (isFinal && text.trim()) {
        // finalize: update #sim-input to match, show checkmark
        if (input) input.value = text;
      }
      break;

    case GS.CONFIRM:
      if (isFinal && text) {
        input.value = text;
        if (parseGlassVoice(text)) {
          input.value = '';
        }
      }
      break;

    default:
      break;
  }
}
```

---

## Step 3: Disambiguation voice parser

Add `parseDisambiguateVoice` — called by `onTranscriptUpdate` when state is DISAMBIGUATE.

```js
function parseDisambiguateVoice(text, contacts) {
  const lower = text.toLowerCase().trim();

  // Ordinal patterns → index
  if (/\b(first|one|1|number\s*one|option\s*one|the\s*first)\b/.test(lower)) return 0;
  if (/\b(second|two|2|number\s*two|option\s*two|the\s*second)\b/.test(lower)) return 1;
  if (/\b(third|three|3|number\s*three|option\s*three|the\s*third)\b/.test(lower)) return 2;

  // Name matching — any word in spoken text matches any word in a contact's name
  for (let i = 0; i < contacts.length; i++) {
    const nameParts = contacts[i].name.toLowerCase().split(' ');
    if (nameParts.some(part => part.length > 2 && lower.includes(part))) return i;
  }

  return -1; // no match
}
```

---

## Step 4: Wire voice start/stop to glass state transitions

Modify `glassTransitionTo(state, voiceOutput)` to call `voiceEngine.start()` / `voiceEngine.stop()` based on the new state. Add the voice mode call **after** the existing state assignment and `speakOutput` call:

| State entered | Voice mode |
|---|---|
| `GS.IDLE` | `voiceEngine.start('command')` |
| `GS.THINKING` | `voiceEngine.stop()` |
| `GS.DISAMBIGUATE` | `voiceEngine.start('command')` |
| `GS.COMPOSE` | `voiceEngine.start('dictation')` |
| `GS.CONFIRM` | `voiceEngine.start('command')` |
| `GS.SENDING` | `voiceEngine.stop()` |
| `GS.SENT` | `voiceEngine.stop()` |

Also call `voiceEngine.start('command')` at the end of `startGlassFlow()` (IDLE entry), and `voiceEngine.stop()` at the start of `glassReset()`.

`'command'` and `'dictation'` are identical at the recognition level (both use the same SpeechRecognition instance) — the distinction is only in how `onTranscriptUpdate` handles the results. The mode label is stored in `voiceEngine.mode` for display in the mic indicator.

---

## Step 5: Mic indicator in `#sim-panel`

### HTML — add after `#sim-input-section`, before `#sim-voice-out`

```html
<div id="sim-mic">
  <div id="sim-mic-dot"></div>
  <span id="sim-mic-label">Listening…</span>
</div>
```

### CSS

```css
#sim-mic {
  display: none;
  align-items: center;
  gap: 7px;
}
#sim-mic.active { display: flex; }

#sim-mic-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(100,150,255,0.9);
  box-shadow: 0 0 6px rgba(100,150,255,0.5);
  animation: pulse 1.2s ease infinite;
  flex-shrink: 0;
}
#sim-mic-dot.command { background: rgba(100,150,255,0.9); }
#sim-mic-dot.dictation {
  background: rgba(100,220,140,0.9);
  box-shadow: 0 0 6px rgba(100,220,140,0.5);
}

#sim-mic-label {
  font-size: 10px;
  color: rgba(255,255,255,0.30);
  font-family: 'DM Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
```

Color coding:
- **Blue dot** (`command` mode): IDLE, DISAMBIGUATE, CONFIRM — waiting for a command
- **Green dot** (`dictation` mode): COMPOSE — actively transcribing speech to text

### `updateMicIndicator()` function

```js
function updateMicIndicator() {
  const el = document.getElementById('sim-mic');
  const dot = document.getElementById('sim-mic-dot');
  const lbl = document.getElementById('sim-mic-label');
  if (!el) return;
  if (!voiceEngine.supported || !voiceEngine.active || voiceEngine.mode === 'off') {
    el.classList.remove('active');
    return;
  }
  el.classList.add('active');
  dot.className = voiceEngine.mode === 'dictation' ? 'dictation' : 'command';
  lbl.textContent = voiceEngine.mode === 'dictation' ? 'Dictating…' : 'Listening…';
}
```

Call `updateMicIndicator()` in `voiceEngine.start`, `voiceEngine.stop`, and `r.onend`.

---

## Step 6: Degrade gracefully when voice is unavailable

- `initVoiceEngine()` sets `voiceEngine.supported = false` if `SpeechRecognition` not in `window`
- All `voiceEngine.start()` / `.stop()` calls check `voiceEngine.supported` first — no-ops if false
- `#sim-mic` never shows `active` class when unsupported
- Typed input (`#sim-input`) works exactly as before in all cases — nothing in this task changes the typed input path

If permission is denied at runtime (`onerror: 'not-allowed'`):
- Set `voiceEngine.supported = false`, call `updateMicIndicator()` to hide indicator
- Add log entry: `addSimLog('Mic access denied — use typed input', 'system')`
- No crash, no broken state — user continues with typed input

---

## Visual spec: mic indicator states

| State | `#sim-mic` | Dot color | Label |
|---|---|---|---|
| Voice unsupported | `display:none` | — | — |
| Voice supported, inactive | `display:none` | — | — |
| IDLE listening | `display:flex` | Blue `rgba(100,150,255,0.9)` | "Listening…" |
| DISAMBIGUATE listening | `display:flex` | Blue | "Listening…" |
| COMPOSE dictating | `display:flex` | Green `rgba(100,220,140,0.9)` | "Dictating…" |
| CONFIRM listening | `display:flex` | Blue | "Listening…" |
| THINKING / SENDING / SENT | `display:none` | — | — |

Dot pulses at `1.2s ease infinite` (reuses existing `@keyframes pulse`).

---

## Interaction spec per state

| State | Voice input | Interim behavior | Final behavior |
|---|---|---|---|
| IDLE | Free-form command | Updates `#sim-input` value | → `handleGlassInputSubmit()` → `parseIntent()` → THINKING |
| THINKING | Silent | — | — |
| DISAMBIGUATE | Name or ordinal | Updates `#sim-input` value | `parseDisambiguateVoice()` → select contact → THINKING → COMPOSE |
| COMPOSE | Free dictation | Updates compose field + `#sim-input` in real time | Finalizes text, resets 3s pause timer |
| COMPOSE + "send" | "send" shortcut | — | Skip to SENDING (via `parseGlassVoice`) |
| CONFIRM | "send" / "edit" / "cancel" | Updates `#sim-input` value | `parseGlassVoice()` → action |
| SENDING | Silent | — | — |
| SENT | Silent | — | — |

---

## Files to inspect
- `ai.html` lines ~5542–5555 — `GS`, `glassUi` (add `voiceEngine` after these)
- `ai.html` lines ~6051–6070 — `glassTransitionTo()` (add voice mode calls)
- `ai.html` lines ~6072–6087 — `glassReset()` (add `voiceEngine.stop()`)
- `ai.html` lines ~6089–6097 — `parseIntent()` (read only — no change needed)
- `ai.html` lines ~6103–6107 — `onTranscriptUpdate()` (replace with extended version)
- `ai.html` lines ~6109–6123 — `startGlassFlow()` (add `voiceEngine.start('command')`)
- `ai.html` lines ~6393–6412 — `handleGlassInputChange()` (read only — no change needed)
- `ai.html` lines ~6414–6434 — `handleGlassInputSubmit()` (read only — no change needed)
- `ai.html` lines ~7725–7756 — `#sim-input` event listeners (read only — no change needed)
- `ai.html` — `#sim-panel` HTML (add `#sim-mic` after `#sim-input-section`)
- `ai.html` — `<style>` block (add `#sim-mic`, `#sim-mic-dot`, `#sim-mic-label` CSS)
- `ai.html` — init block at end of file (add `initVoiceEngine()` call)

## Files allowed to change
- `ai.html` only

---

## Acceptance criteria

- [ ] Saying "Send a message to Hiro" (when in IDLE) → flow proceeds to THINKING → DISAMBIGUATE
- [ ] At DISAMBIGUATE, saying "Hiro Tanaka" → selects first contact → COMPOSE
- [ ] At DISAMBIGUATE, saying "the first one" or "first" → selects index 0 → COMPOSE
- [ ] At DISAMBIGUATE, saying "the second one" → selects index 1 → COMPOSE
- [ ] At COMPOSE, speaking dictates into the compose field in real time (interim results visible)
- [ ] At COMPOSE, pausing 3 seconds after speaking → checkmark appears
- [ ] At COMPOSE, saying "send" when checkmark visible → goes directly to SENDING
- [ ] At CONFIRM, saying "send" → action 0 (send)
- [ ] At CONFIRM, saying "edit" → returns to COMPOSE
- [ ] At CONFIRM, saying "cancel" → glassReset()
- [ ] Typed input still works identically in all states when voice is not used
- [ ] Mic indicator shows blue dot (Listening…) during IDLE, DISAMBIGUATE, CONFIRM
- [ ] Mic indicator shows green dot (Dictating…) during COMPOSE
- [ ] Mic indicator hidden during THINKING, SENDING, SENT, and when flow is inactive
- [ ] If SpeechRecognition not supported: no errors thrown, typed input works, mic never shows
- [ ] If mic permission denied: sim log shows error, typed input continues to work
- [ ] `node test/smoke.mjs` passes

---

## Risks / notes

- **`recognition.start()` throws if already running** — wrap all `.start()` calls in try/catch; the `voiceEngine.active` guard handles most cases but race conditions can still occur
- **Chrome stops recognition after ~60s silence** — `restartOnEnd = true` + the `onend` auto-restart handles this; test with a long pause in COMPOSE
- **`continuous: false` is deliberate** — `continuous: true` causes browser to accumulate all interim text into one long string, which breaks real-time compose updates. Manual restart is cleaner.
- **Interim results overwrite, not append** — the Speech API returns the full transcript so far each time, not a delta. `handleGlassInputChange(text)` already handles this correctly (it sets `composeText = text` not `+=`).
- **`input.value = transcript` in `onVoiceResult`** — this mirrors voice to `#sim-input` for visual feedback but does NOT trigger the `input` event listener (DOM `value` assignment doesn't fire `oninput`). The `onTranscriptUpdate` call handles the actual logic separately. This is intentional.
- **`parseDisambiguateVoice` contact array** — the `contacts` array passed to it should be the same filtered subset that was shown to the user in DISAMBIGUATE (not all of `GLASS_CONTACTS`). Store this in `glassUi.disambiguateContacts` when entering DISAMBIGUATE state.
- **COMPOSE: voice + typed are additive** — if user types then speaks, last write wins. Both call `handleGlassInputChange(text)` with the full current value. No conflict.
- **No changes to `parseGlassVoice()`** — it already handles CONFIRM shortcuts; voice final result just feeds it the same way typed Enter does.
