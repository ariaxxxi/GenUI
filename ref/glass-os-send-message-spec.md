# GlassOS: Send Message Flow — Integration Spec

## Context

You are integrating a **Send Message** flow into an existing GenUI system for AI smart glasses (monocular, 420×420 canvas). The existing system already handles container morphing, glass card styling, and transition animations. **Do not rewrite or replace the existing morphing/transition logic** — it works. Your job is to populate the correct UI content and manage the state machine for this flow.

Reference the attached `glass-os-simulator.jsx` for the exact UI layout and component structure at each stage. Use its visual composition as your spec — but **ignore its container morphing implementation** (it doesn't work properly, height jumps between stages). Rely on the existing GenUI morphing system instead.

---

## System Overview

### Input Model
- **Primary input**: Voice (real-time speech-to-text). Not yet integrated — build the flow so voice input can plug in as next phase.
- **Secondary input (PUI gestures mapped to keys for now)**:
  - Swipe forward/backward (↑↓) → navigate lists/selections
  - Single tap (Space) → confirm/select
  - Double tap (Esc) → dismiss/cancel/back
- **No touch targets on the glass display.** Users cannot tap anything on screen. All selection is done via PUI gesture or voice. One item in any list is always pre-highlighted.

### AI Behavior (dual output)
At every step, the AI responds with **both**:
1. **Voice output** — spoken response (e.g., "Which Hiro?", "What would you like to say?"). This is heard through the glasses speaker.
2. **Visual UI** — rendered on the glass display for glanceable clarity and guidance.

Voice and UI serve different roles: voice gives conversational context, UI gives visual confirmation of state (names, text, selections).

---

## State Machine

```
IDLE → THINKING → DISAMBIGUATE (if needed) → COMPOSE → CONFIRM → SENDING → SENT → IDLE
```

### States in detail:

#### 1. IDLE
- **Glass**: Minimal — small pulsing dot + "Listening" label, bottom-aligned.
- **AI voice**: Silent, passively listening for wake command.
- **Trigger**: User says "Send a message to Hiro" (or similar intent).

#### 2. THINKING
- **Glass**: Compact pill-shaped card with spinner + animated dots (`· → · · → · · ·`), bottom-aligned.
- **AI voice**: Silent.
- **Duration**: ~800–1200ms simulated processing.
- **AI logic**: Parse intent → extract recipient name → check contacts database.
  - 1 match → skip to COMPOSE
  - 2+ matches → go to DISAMBIGUATE
  - 0 matches → voice "Contact not found", return to IDLE

#### 3. DISAMBIGUATE
- **Glass**: Question label ("Which Hiro?") above a single glass card containing a grouped list of matching contacts. Each row: avatar (initials circle) + full name. First item pre-highlighted. Bottom-aligned.
- **AI voice**: "Which Hiro?"
- **Navigation**: ↑↓ to move highlight, Space to confirm selection.
- **Voice shortcut**: User can say the name (e.g., "Tanaka") to select directly.
- **On select**: → THINKING briefly (700ms) → COMPOSE.

#### 4. COMPOSE (the core screen — most time spent here)

This is **one continuous state** with sub-phases, NOT separate states. The system is **always actively listening** throughout COMPOSE. The blue glow on the text field stays on the entire time.

**Layout** (all inside one glass card container, bottom-aligned):
1. **Contact header row**: Avatar + "To: [Name]" (e.g., "To: Hiro Tanaka")
2. **Smart chips** (contextual quick replies): 2–3 pill-shaped chips based on relationship.
   - Colleague → "Design review", "Share a file", "Schedule a sync"
   - Friend → "What's up?", "Lunch this week?", "Check this out"
   - First chip pre-highlighted. ↑↓ to navigate, Space to select.
   - Selecting a chip fills the text field with a full sentence (e.g., "Design review" → "Hey, do you have time for a design review sometime?")
3. **Listening/text field**: Rounded card with blue glow effect at the bottom:
   ```css
   box-shadow:
     inset 0 -6px 6px -2px rgba(35,101,255,0.15),
     inset 0 -15px 20px -6px rgba(255,255,255,0.5),
     inset 0 -15px 20px -6px rgba(230,229,247,0.5),
     inset 0 -70px 60px -30px rgba(19,75,192,1);
   ```
   Shows "Listening..." in italic when empty. Shows real-time transcription when user speaks.

**Sub-phase behavior:**

| Condition | Chips visible | Text field | Checkmark below card |
|-----------|:---:|:---:|:---:|
| No text yet | ✅ Visible, navigable | "Listening..." | Hidden |
| User starts speaking | ❌ Fade out (animate) | Live transcription | Hidden |
| User pauses 3 seconds | ❌ Hidden | Frozen text | ✅ Fade in |
| User resumes speaking | ❌ Hidden | Live transcription (updated) | ❌ Fade out, timer resets |
| User selects a chip | ❌ Hidden | Full sentence appears | ✅ Fade in |

**Checkmark button** (✅ emoji in a 48px circle): Appears below the card when user pauses. This is a "I'm done talking" signal. Tapping it (Space) → transitions to CONFIRM. If user starts talking again, checkmark disappears, timer resets.

**Voice shortcuts during COMPOSE:**
- Saying "send" when checkmark is visible → skip straight to SENDING (bypass CONFIRM).
- Saying a chip label (e.g., "design review") → selects that chip.

#### 5. CONFIRM
- **System stops listening.** Blue glow removed from text field.
- **Glass**: Same card structure (contact header + message text), but text field uses standard card shadow instead of blue glow. Below the card: 3 action buttons in a row (48px emoji circles):
  - ✈️ Send (index 0, default highlighted)
  - ✊ Edit (index 1)
  - ❌ Cancel (index 2)
- **AI voice**: "Send to [first name]?"
- **Navigation**: ↑↓ moves highlight between 3 buttons, Space confirms.
- **Voice shortcuts**: "send" → send, "edit" → back to COMPOSE with text preserved, "cancel" → reset to IDLE.
- **Edit behavior**: Returns to COMPOSE state with the message text pre-filled in the listening field (chips hidden, blue glow on). User can modify by speaking more.

#### 6. SENDING
- **Glass**: Compact pill card with spinner + "Sending...", bottom-aligned.
- **AI voice**: Silent.
- **Duration**: ~900ms.

#### 7. SENT
- **Glass**: Compact pill card with ✅ + "Message sent", bottom-aligned.
- **AI voice**: "Sent."
- **Auto-dismiss**: Returns to IDLE after ~2.5s.

---

## Visual Spec (reference the .jsx file for exact layout)

- **Font**: DM Sans. 20px secondary, 24px body/primary.
- **Min text size**: 20px. Nothing smaller on the glass display.
- **Colors**: White text on transparent/dark background. Primary `rgba(255,255,255,1)`, secondary `rgba(255,255,255,0.50)`, tertiary `rgba(255,255,255,0.25)`.
- **Corner radius**: 30px for cards, 50px for pill/compact cards, 22px for inner text bubble.
- **Card style**: Subtle gradient outline, white inner shadow, near-transparent fill. Top edge has a 1px gradient glow highlight.
- **Avatar**: Initials in a 40–42px circle, `rgba(255,255,255,0.12)` fill.
- **Chips**: Pill-shaped, 50px radius, `8px 16px` padding, 20px font. Selected state: brighter border + text.
- **Action buttons**: 48px circle, emoji centered, selected state scales to 1.12x with brighter border.
- **Everything bottom-aligned** within the 420×420 canvas with 20px padding.

---

## Contacts Data Structure

```js
{
  id: 1,
  name: "Hiro Tanaka",
  initials: "HT",
  relation: "Colleague · Design",
  chips: [
    { label: "Design review", message: "Hey, do you have time for a design review sometime?" },
    { label: "Share a file", message: "I have a file to share with you — when's a good time?" },
    { label: "Schedule a sync", message: "Want to schedule a quick sync this week?" },
  ],
}
```

Chips are contextual per contact. The `label` is what displays on the chip. The `message` is the full sentence that populates the text field when selected.

---

## Simulator Control Panel (Left Panel)

Build a debug/simulator panel to the left of the 420×420 glass display. This panel sits **outside** the glass frame — it represents the developer tools, not what the user sees on the glasses. The glass display is centered in the remaining space to the right.

### Layout
- **Width**: ~290px, full viewport height.
- **Separated** from the glass display by a subtle vertical border (`1px solid rgba(255,255,255,0.04)`).
- **Dark background** matching the page (`#050505`).
- **Font**: DM Sans throughout, small sizes (9–13px) to stay unobtrusive.

### Sections (top to bottom):

#### 1. Header
- Label: "GLASSOS SIMULATOR" (uppercase, 10px, tertiary color, letter-spacing 2px).
- Below: brief key legend inline — "↑↓ nav · Space confirm · Esc back".

#### 2. Voice Command / Dictation Input
A single text input field that is **context-aware** — its role changes based on the current state:

| Glass State | Input Label | Placeholder | Behavior |
|---|---|---|---|
| IDLE | "Voice Command" | `"Send a message to Hiro"` | Enter submits as a spoken command to the AI |
| DISAMBIGUATE | "Voice Command" | `Say a name, e.g. "Tanaka"` | Enter submits as voice (parsed for name match) |
| COMPOSE | "🎤 Voice Dictation" | `Speak (type to simulate)...` | Keystroke-by-keystroke mirrors to the glass listening field in real-time. Enter = finalize text + show checkmark. |
| COMPOSE (checkmark showing) | "🎤 Voice Dictation" | same | Typing resumes dictation — checkmark disappears, text updates, 3s timer resets. Typing "send" + Enter = skip to SENDING. |
| CONFIRM | "Voice Command" | `"send", "edit", or "cancel"` | Enter submits as voice shortcut |

**Visual states for the input:**
- In COMPOSE/dictation mode: left-side pulsing blue dot (6px, `rgba(100,150,255,0.9)`, pulse animation), blue-tinted border (`rgba(100,150,255,0.12)`), left padding to clear the dot.
- In command mode: standard subtle styling, no dot.
- Below the input: a small helper text line that updates per state (e.g., "Type → glass · 3s pause = ✅ · Enter = done").

#### 3. AI Voice Output
- Only visible when the AI has something to say.
- Small card with "🔊 AI" label and the quoted voice text (e.g., `"Which Hiro?"`).
- Disappears when voice string is empty.

#### 4. Event Log
- Scrollable list of system events, color-coded:
  - **User commands** (`> Send a message to Hiro`): white/primary.
  - **AI voice** (`🔊 "Which Hiro?"`): soft blue (`rgba(130,170,255,0.5)`).
  - **User actions** (`Selected: Hiro Tanaka`, `Chip: "Design review"`): soft green (`rgba(160,255,160,0.45)`).
  - **Success** (`✓ Delivered to Hiro Tanaka`): brighter green (`rgba(100,255,140,0.6)`).
  - **System** (state transitions, errors): dim (`rgba(255,255,255,0.14)`).
- Keep last ~24 entries, auto-scroll to bottom.

#### 5. Keyboard Legend (bottom, pinned)
- Grid of key badges: `↑↓` Nav, `Space` OK, `Esc` Back, `Enter` Send.
- Tiny key badges (9px) with subtle border, pinned above bottom edge with a top border separator.

### Keyboard Routing
- **When the input field is focused**: all keystrokes go to the input. Arrow keys, Space, Esc do NOT trigger glass navigation.
- **When the input field is NOT focused**: arrow keys navigate the glass selection, Space confirms, Esc dismisses. These are global listeners.
- The input field loses focus (`blur()`) after submitting a command. Glass navigation keys then work immediately.
- Entering COMPOSE mode auto-focuses the input field so the user can start "dictating" immediately.

### Purpose
This panel simulates what will later be real voice input + AI voice output. The architecture should make it easy to:
- Replace the text input with a speech-to-text stream (`onTranscriptUpdate(text)`).
- Replace the AI voice display with a TTS call (`speak(voiceString)`).
- Replace command parsing with LLM intent recognition.

---

## Integration Notes

1. **Use the existing GenUI container morphing system.** Do not implement your own height transitions. Just provide the correct content at each state and let the existing system handle the morph.
2. **All content anchors to the bottom** of the 420×420 canvas. The container grows upward as content changes.
3. **One item always highlighted** in any navigable list (chips, contacts, action buttons). Default to index 0.
4. **Selection index resets to 0** on every state transition.
5. The flow should be **data-driven** — contact data, chip data, and messages come from a contacts database. The UI components should be reusable for different contacts.

---

## Next Phase (prepare for, don't build yet)

- **Real-time voice input**: Speech-to-text streaming that feeds into the COMPOSE text field character by character. The system should have a clean input interface (e.g., `onTranscriptUpdate(text)`) that can be wired to a speech recognition API.
- **AI voice output**: Text-to-speech for AI responses at each step. The system should expose voice output strings per state transition (e.g., `voiceOutput: "Which Hiro?"`) so a TTS engine can consume them.
- **Intent parsing**: Currently hardcoded pattern matching. Will be replaced with LLM-based intent recognition that returns structured data: `{ intent: "send_message", recipient: "hiro", confidence: 0.95 }`.

Design the state management so these can plug in without restructuring the flow.
