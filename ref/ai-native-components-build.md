# GlassOS: Refactor to Composable UI Primitives

## Context

You are **refactoring** the existing Send Message flow in our AI smart glasses OS (monocular, 420×420 canvas) — not building a new system alongside it. The current flow has inline, screen-specific UI code. Your job is to extract the repeating UI patterns into **8 reusable, data-driven primitive components**, then **rewrite the existing Send Message flow to use those components.**

When you're done, there should be **one set of components** — not a static flow with its own rendering AND a separate component library. The Send Message flow becomes the first consumer of the primitives. Future flows (weather, flight booking, shopping, etc.) will use the exact same components.

**Do not create new visual styles.** Extract all styling from the existing implementation — it's the design source of truth. The refactored flow should look and behave identically to the current one.

**The bigger picture** (not for now, but why we're doing this): Eventually an AI orchestrator will dynamically compose these primitives at runtime via JSON specs like this:

```json
{
  "voice": "Which Hiro?",
  "ui": {
    "layout": ["header", "selection_list"],
    "header": { "title": "Which Hiro?" },
    "selection_list": {
      "items": [
        { "id": "1", "title": "Hiro Tanaka", "subtitle": "Colleague · Design", "avatar": "HT" },
        { "id": "2", "title": "Hiro Horri", "subtitle": "Friend", "avatar": "HH" }
      ]
    }
  },
  "listening": false,
  "defaultSelection": 0
}
```

You are NOT building the AI orchestrator yet. You are **refactoring the existing flow** — extracting its inline UI into primitive components, then rewriting the flow to consume them. After this refactor, the Send Message flow should work exactly as before, but assembled from composable parts.

---

## The 8 Primitives

Build each as an independent, data-driven component. **Extract all visual styling from the existing flow implementation** — card styles, text styles, avatar styles, chip styles, action button styles, the blue glow effect, spacing, transitions, everything. Do not hardcode new values.

### 1. ContactHeader

A compact row showing who the current action is directed at.

**Props:**
```ts
{
  avatar: string       // 1–2 letter initials
  name: string         // "Hiro Tanaka"
  prefix?: string      // "To:" — displayed before name
  subtitle?: string    // "Colleague · Design" — optional
}
```

**Extract from:** The "To: Hiro Tanaka" row at the top of the compose and confirm screens in the existing flow.

**Used in:** Send Message, and future: Reply, Call, Share with...

---

### 2. SelectionList

A grouped list of options inside a single card. One item always highlighted. Navigable via ↑↓.

**Props:**
```ts
{
  items: Array<{
    id: string
    title: string
    subtitle?: string
    avatar?: string    // initials — shows circle if provided
    icon?: string      // emoji — shows if no avatar
  }>
  selectedIndex: number
}
```

**Extract from:** The "Which Hiro?" disambiguation screen — grouped list inside one card, highlight style on selected row.

**Constraints:** Max 4 visible items for V1.

**Used in:** Contact disambiguation, and future: flight options, coffee menu, restaurant list, settings.

---

### 3. ChipBar

Pill-shaped quick-action chips. One chip highlighted via ↑↓. Wraps to second row if needed.

**Props:**
```ts
{
  chips: Array<{
    id: string
    label: string
  }>
  selectedIndex: number
  navigable: boolean   // if false, chips are display-only
}
```

**Extract from:** The quick reply chips ("Design review", "Share a file", "Schedule a sync") in the compose screen.

**Constraints:** Max 3–4 chips. Labels should be short (2–4 words).

**Used in:** Quick replies, and future: suggested dates, size options, filter tags.

---

### 4. TextBubble

A text display area with two modes: **listening** (blue glow, actively receiving voice) and **static** (no glow, finalized text).

**Props:**
```ts
{
  text: string
  placeholder?: string  // shown when text is empty, e.g. "Listening..."
  mode: "listening" | "static"
}
```

**Extract from:**
- **Listening mode**: The blue-glow text field in the compose screen (extract the exact box-shadow value from existing CSS).
- **Static mode**: The message preview in the confirm screen (no blue glow, standard card shadow).

**Used in:** Message composition (listening), message confirm (static), and future: AI text responses, price results.

---

### 5. InfoCard

General-purpose information display for AI responses not part of an action flow.

**Props:**
```ts
{
  icon?: string         // emoji or icon
  title: string         // primary info, e.g. "21° Sunny"
  subtitle?: string     // e.g. "San Francisco"
  body?: string         // longer text block
  detail?: string       // tertiary detail line
}
```

**Extract from:** The existing glass card style (same card treatment, radius, border, shadow). This component doesn't exist in the Send Message flow yet — build it using the same card styling patterns as other screens.

**Constraints:** Body text max ~4 lines, truncate if longer. AI should use voice for full answers and show condensed version on screen.

**Used in:** Weather, product price, plant care tip, recipe step, general Q&A.

---

### 6. ActionRow

Horizontal row of circular emoji action buttons. One highlighted, navigable via ↑↓.

**Props:**
```ts
{
  actions: Array<{
    id: string
    emoji: string       // "✈️", "✊", "❌", "✅"
  }>
  selectedIndex: number
}
```

**Extract from:** The send/edit/cancel button row and the single checkmark button in the existing confirm and pause-check states.

**Constraints:** 1–3 buttons max.

**Common patterns:**
- 1 button: ✅ (done/confirm)
- 2 buttons: ✅ ❌ (yes/no)
- 3 buttons: ✈️ ✊ ❌ (send/edit/cancel)

**Used in:** Message confirm, and future: order confirm, booking confirm, any decision point.

---

### 7. InputField

The active listening indicator — blue-glow text area with real-time voice transcription.

**Props:**
```ts
{
  text: string
  placeholder?: string  // default: "Listening..."
}
```

This is functionally `TextBubble` in `listening` mode, but separated because it has unique behavioral contract:
- Paired with active speech-to-text stream.
- Text updates in real-time.
- When user pauses 3 seconds, parent shows a checkmark `ActionRow(1)` below.
- When user resumes speaking, checkmark disappears.

**Extract from:** The listening field in the compose screen.

**Used in:** Message dictation, and future: search input, any free-form voice input.

---

### 8. CompactStatus

Minimal pill-shaped feedback card for transient states.

**Props:**
```ts
{
  type: "loading" | "success" | "error"
  label: string         // "Sending...", "Message sent", "Failed to send"
  icon?: string         // override default icon
}
```

**Extract from:** The "Sending..." (spinner + label) and "Message sent" (✅ + label) pill cards in the existing flow. Match the exact pill shape, sizing, and animation.

**Behavior:** Success and error auto-dismiss after ~2.5s. Loading persists until state changes.

**Used in:** Message sending/sent, and future: payment processing, booking confirmed, any async feedback.

---

## Composition Rules

Any screen is a **vertical stack of 1–3 primitives** inside the morphing container.

### Grammar:

```
Screen = [ContactHeader?] + [Content] + [ActionRow?]

Content = SelectionList
        | ChipBar + InputField
        | TextBubble
        | InfoCard
        | InputField
        | CompactStatus
```

**Max 3 primitives per screen.** One focus at a time.

### Spatial rules:
- ContactHeader + Content live **inside** the same glass card container.
- ActionRow sits **below** the container card, not inside it.
- Extract spacing between primitives from the existing flow.

### How Send Message maps to compositions:

| Screen | Composition |
|---|---|
| Disambiguate | `SelectionList` (with header text above) |
| Compose (chips showing) | `ContactHeader` + `ChipBar` + `InputField` |
| Compose (typing) | `ContactHeader` + `InputField` (chips animated out) |
| Compose (paused, checkmark) | `ContactHeader` + `InputField` + `ActionRow(1: ✅)` |
| Confirm | `ContactHeader` + `TextBubble(static)` + `ActionRow(3: ✈️✊❌)` |
| Sending | `CompactStatus(loading)` |
| Sent | `CompactStatus(success)` |

### Future screens (same primitives):

| Screen | Composition |
|---|---|
| Weather answer | `InfoCard` |
| Product price | `InfoCard` |
| Flight options | `SelectionList` |
| Flight confirm | `InfoCard` + `ActionRow(2: ✅❌)` |
| Order coffee (size) | `ChipBar` + `ActionRow(1: ✅)` |
| Plant care | `InfoCard` |
| Error | `CompactStatus(error)` |

---

## Transitions

**Extract all animation values (duration, easing, transform) from the existing flow.** Each primitive needs:
- **Enter animation**: how it appears when the screen transitions in.
- **Exit animation**: how it leaves when the screen transitions out.
- **ChipBar** needs a collapse animation (smooth fold-up when user starts talking).
- **ActionRow** needs a delayed enter (appears after the container settles).
- **CompactStatus(success)** needs its existing overshoot spring animation.

**Do not implement container morphing** — the existing system handles that. Primitives render at natural height and animate their own content.

---

## Implementation Notes

1. **This is a refactor, not a rebuild.** Extract components from the existing code, then rewrite the existing flow to use them. Do NOT create a parallel component system. When done, the old inline rendering code should be gone — replaced by primitive component calls.
2. **The Send Message flow is your test case.** After refactoring, it must look and behave identically to the current implementation. If it doesn't match, the refactor is wrong.
3. **Each primitive is standalone**, accepts props, renders. No internal flow logic — the flow's state machine passes props down.
4. **Selection state is a prop**, not internal state. The parent flow controls navigation.
5. **All text is data-driven** — no hardcoded strings inside primitives.
6. **Stay inside the existing codebase.** Follow the existing file structure, patterns, and conventions. Add component files where they naturally belong in the current project.
7. **Verify by rendering the Send Message flow** using only the new primitives — every screen should reproduce the current design exactly.

---

## Why This Matters

This refactor turns a one-off flow into a **reusable system**. After this:
- The Send Message flow works exactly as before, but is built from composable parts.
- Adding a new flow (weather, flight booking, shopping) means composing the same primitives with different data — no new UI code.
- Eventually, an AI orchestrator will assemble these primitives dynamically at runtime. But that's next phase. Right now: refactor, extract, reuse.