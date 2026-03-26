# GlassOS AI-Native System — Build Prompts

Four sequential prompts. Run them in order — each builds on the previous step's output. Refer to `AI_PAGE_PROJECT_STRUCTURE.md` for the full project map.

---

---

# STEP 1: Screen Composer

## Context

The system already has 8 UI primitives in `src/flows/ui-primitives.js` and a morph system in `src/shared/morph-*.js`. Currently, each flow has its own render file (`message-send-render.js`, `flight-render.js`) that manually calls primitives per state. This means every new flow needs a new render file.

Build a generic **Screen Composer** that takes a JSON layout spec and renders the correct primitive stack — so flows describe *what* to show, not *how* to render it.

## What to Build

A `ScreenComposer` module (e.g. `src/shared/screen-composer.js`) that:

1. Accepts a layout spec:
   ```js
   {
     intentHeader: "Which Hiro?",              // → renders in #intent-header
     layout: ["contact_header", "chip_bar", "input_field"],  // → renders in #c-rich
     props: {
       contact_header: { avatar: "HT", name: "Hiro Tanaka", prefix: "To:" },
       chip_bar: { chips: [...], selectedIndex: 0, navigable: true },
       input_field: { text: "", placeholder: "Listening..." },
     },
     actions: [                                 // → renders in #glass-controls-layer
       { id: "send", emoji: "✈️" },
       { id: "edit", emoji: "✊" },
       { id: "cancel", emoji: "❌" },
     ],
     actionSelectedIndex: 0,
   }
   ```
2. Routes content to the correct DOM layers:
   - `intentHeader` → `#intent-header`
   - `layout` + `props` → `#c-rich` (using primitives from `ui-primitives.js`)
   - `actions` → `#glass-controls-layer` (using `renderActionRow`)
3. Calls the existing morph system — the composer provides content, morph handles transitions. Don't rewrite or bypass the morph system.
4. Clears previous content in each layer before rendering new content.

## How to Integrate

- Import and use all render functions from `src/flows/ui-primitives.js`.
- Follow the existing DOM layer conventions documented in `AI_PAGE_PROJECT_STRUCTURE.md` section 3.
- The composer is a pure rendering function — it doesn't own state. Flows or the engine call it with a spec, it renders.

## Test

Rewrite `message-send-render.js` to produce layout specs per state, then pass them to the ScreenComposer instead of calling primitives directly. The Send Message flow must look and behave identically. Do the same for `flight-render.js`.

After this, both `message-send-render.js` and `flight-render.js` become thin mappers: `state → layout spec`. The composer does all actual rendering.

## Do NOT

- Rewrite or bypass the morph system (`src/shared/morph-*.js`).
- Change the primitives in `ui-primitives.js`.
- Change flow behavior in `message-send.js` or `flight-booking.js`.
- Change any visual styling.

---

---

# STEP 2: Slot-Based Flow Engine

## Context

The Screen Composer (Step 1) is done — flows now output layout specs and the composer renders them. But each flow still has a hand-authored state machine (`message-send.js`, `flight-booking.js`). Every new flow needs a new state machine file.

Build a generic **Slot-Based Flow Engine** where flows are data definitions, and the engine walks through them, resolving one slot at a time, producing layout specs for the Screen Composer.

## What to Build

### 2a. Flow Definition Format

A flow is a JSON-like definition with:
- `id`: flow identifier
- `slots`: ordered array of slots to fill
- `action`: what to execute when all slots are filled
- `execution`: loading/success/error UI specs

Each slot has:
- `id`, `type`, `required`
- `ui`: which primitives to show when collecting this slot
- `voice`: what the AI says at this step
- Type-specific config (options for chip_select, resolve rules for entity_select, etc.)

Slot types:
- **`entity_select`**: Look up entities (contacts, etc.). 1 match → auto-fill, skip UI. 2+ → SelectionList. 0 → error.
- **`text_input`**: Free-form voice dictation. Shows InputField + optional ChipBar. 3s pause → shows checkmark ActionRow. Resuming input hides checkmark.
- **`chip_select`**: Pick from predefined options. Shows ChipBar. Can auto-resolve from initial command params.
- **`action_select`**: Pick from action buttons (send/edit/cancel). Shows ActionRow. Options map to engine actions: `execute`, `back` (re-open a slot), `cancel`.
- **`display`**: No input to collect. Shows content (InfoCard, etc.), waits for user to advance (tap). For step-by-step guides.

### 2b. Flow Engine

A `FlowEngine` module (e.g. `src/ai/flow-engine.js`) that:

1. Takes a flow definition + initial params (pre-filled slots from intent parsing).
2. Maintains state: `{ currentSlotIndex, filledSlots, status, selectionIndex }`.
3. Core loop: look at current slot → try auto-resolve → if resolved, advance → if not, generate layout spec + voice output → wait for input.
4. Consumes user input: PUI gestures (↑↓ navigate, tap confirm, double-tap back/cancel) + voice.
5. Outputs: layout spec (for Screen Composer) + voice string (for TTS via `/api/tts`).
6. Handles navigation: back re-opens a previous slot with its value preserved (for edit flows). Cancel aborts.
7. Handles voice shortcuts at any step: saying a name during entity_select fills it, saying "send" during text_input with checkmark showing skips to execute.

### 2c. Voice Integration

Wire the engine into the existing `voice-engine.js`:
- **Command mode** for entity_select, chip_select, action_select (engine parses recognized phrases)
- **Dictation mode** for text_input (streaming transcription into the InputField)
- The engine tells the voice system which mode to use per slot type
- Use existing TTS (`/api/tts`) for voice output strings

### 2d. Input Routing

Wire into the existing input pipeline in `ai-bindings.js`:
- Keyboard shortcuts and PUI gesture handlers feed into the engine's input handler
- The engine replaces the per-flow key handlers currently in `message-send.js` and `flight-booking.js`

## Three Test Flows

### Flow 1: Send Message
Extract from `message-send.js` + `message-send-render.js` + `message-send-voice.js`. Convert the existing state machine into a slot definition. The engine-driven version must match the current UX exactly — same screens, same transitions, same voice lines, same edit/back behavior.

### Flow 2: Book Flight
Extract from `flight-booking.js` + `flight-render.js` + `flight-ai.js`. Convert the existing multi-step flow into a slot definition. This is the complexity test — slot dependencies, more steps, Gemini-assisted parsing. Keep `flight-ai.js`'s Gemini integration for NLU within this flow (it becomes a custom resolver for certain slots).

### Flow 3: Order Coffee
New flow. Zero new UI code. Define it as slots using only existing primitives:
- `drink`: chip_select (Latte, Cappuccino, Americano)
- `size`: chip_select (Small, Medium, Large)
- `confirm`: action_select (✅ order, ✊ change, ❌ cancel) with InfoCard summary
- Execution: loading → success

## After This

Delete the old state machine files (`message-send.js`, `message-send-render.js`, `message-send-voice.js`, `flight-booking.js`, `flight-render.js`). Their logic now lives in flow definitions + the generic engine. `flight-ai.js` may stay as a resolver plugin.

One engine, one renderer, three (or any number of) flow definitions.

## Do NOT

- Change `ui-primitives.js` or the Screen Composer.
- Change the morph system.
- Change visual styling.
- Build an AI intent parser — flows are still triggered by the existing `input-actions.js` routing for now.

---

---

# STEP 3: Generalize Intent Routing

## Context

The flow engine (Step 2) is done — flows are slot definitions driven by a generic engine. But `src/ai/input-actions.js` still has hardcoded keyword routing (if text includes "send" → message flow, if "flight" → flight flow, etc.). And the system can only handle requests that have a predefined flow.

Generalize intent routing so: (a) any utterance can be classified, (b) extracted params pre-fill slots, and (c) simple Q&A requests get a direct response without needing a flow.

## What to Build

### 3a. AI Intent Classifier

Upgrade `input-actions.js` to:

1. **Fast path**: Known keywords still trigger flows immediately for speed. "Send message to Hiro" → message flow. "Book a flight" → flight flow. Keep these.
2. **AI fallback**: Anything unmatched goes to the existing `/api/gemini` endpoint (already used by `flight-ai.js`) for intent classification.
3. The AI returns structured data:
   ```json
   {
     "type": "flow",
     "flowId": "send_message",
     "params": { "recipient": "hiro", "message_body": null },
     "confidence": 0.95
   }
   ```
   or for simple Q&A:
   ```json
   {
     "type": "direct_response",
     "voice": "It's 72 degrees and sunny in San Francisco.",
     "ui": {
       "layout": ["info_card"],
       "props": {
         "info_card": { "icon": "☀️", "title": "72° Sunny", "subtitle": "San Francisco" }
       }
     }
   }
   ```
4. For `type: "flow"` → start the flow engine with `params` as pre-filled slots (skips resolved slots automatically).
5. For `type: "direct_response"` → render the layout spec via Screen Composer + speak voice output via TTS. No flow engine needed.

### 3b. System Prompt for Gemini

Craft a system prompt that tells Gemini:
- The available flows (send_message, book_flight, order_coffee) and their slot schemas
- The available primitives for direct responses (info_card, text_bubble, etc.)
- To return structured JSON in the format above
- To use direct_response for simple Q&A (weather, prices, factual questions, how-to)
- To use flow for multi-step actions (messaging, booking, ordering)

### 3c. Direct Response Rendering

For `direct_response` results:
- Pass the layout spec to the Screen Composer
- Speak the voice string via `/api/tts`
- Show for a duration then return to idle, or stay until dismissed (configurable per response)
- The system is listening for follow-up — user can ask another question or start a flow

## Test

- "Send a message to Hiro" → keyword fast-path → message flow (unchanged behavior)
- "Text Hiro about the design review" → Gemini → message flow with recipient + message pre-filled
- "What's the weather?" → Gemini → direct_response → InfoCard + voice
- "How much is this?" (with camera context) → Gemini → direct_response → InfoCard with price
- "Order my usual coffee" → Gemini → coffee flow with drink + size pre-filled → straight to confirm
- "How do I take care of a snake plant?" → Gemini → direct_response → InfoCard with care tips (or multi-step display flow if AI decides content warrants it)
- Nonsense / low confidence → Gemini → "I didn't quite get that" voice + no UI

## Do NOT

- Remove keyword fast-paths. They're faster than an API call for common intents.
- Change the flow engine or Screen Composer.
- Change visual styling.
- Build a new API endpoint — use the existing `/api/gemini`.

---

---

# STEP 4: AI-Driven Dynamic Flows

## Context

The system now has: primitives → Screen Composer → flow engine → intent routing with Gemini. Pre-defined flows (message, flight, coffee) work great. Simple Q&A gets direct responses.

The gap: requests that need a multi-step flow but don't have a predefined definition. "Help me plan a dinner party", "Walk me through changing a tire", "Compare these two products." The AI should generate flow definitions on the fly.

## What to Build

### 4a. Dynamic Flow Generation

Upgrade the Gemini system prompt so the AI can return a third response type:

```json
{
  "type": "dynamic_flow",
  "voice": "Let me walk you through caring for a fiddle leaf fig.",
  "flow": {
    "id": "dynamic_plant_care_123",
    "slots": [
      {
        "id": "step_1",
        "type": "display",
        "ui": { "layout": ["info_card"], "props": { "info_card": { "icon": "☀️", "title": "Step 1: Light", "body": "Place in bright, indirect sunlight. Avoid direct afternoon sun." }}},
        "voice": { "prompt": "First, about lighting." }
      },
      {
        "id": "step_2",
        "type": "display",
        "ui": { "layout": ["info_card"], "props": { "info_card": { "icon": "💧", "title": "Step 2: Water", "body": "Water when top inch of soil is dry, about every 7-10 days." }}},
        "voice": { "prompt": "Next, watering." }
      },
      {
        "id": "step_3",
        "type": "display",
        "ui": { "layout": ["info_card"], "props": { "info_card": { "icon": "🌱", "title": "Step 3: Soil", "body": "Use well-draining potting mix. Repot every 1-2 years." }}},
        "voice": { "prompt": "And finally, soil." }
      }
    ]
  }
}
```

The flow engine already supports `display` slots — so the engine runs this definition exactly like a predefined flow. No new engine code needed.

### 4b. Gemini System Prompt (Full Version)

The system prompt now includes:
- All available slot types and their schemas
- All available primitives and their prop interfaces
- Composition grammar (which primitives can stack, max 3 per screen)
- Examples of predefined flows for reference (so AI understands the pattern)
- Instructions: use `direct_response` for 1-screen answers, `flow` for known patterns, `dynamic_flow` for multi-step content that doesn't match a predefined flow
- The AI should prefer brevity — glasses display is small, voice carries the detail, UI is for glanceable confirmation

### 4c. Dynamic Flow Lifecycle

- Dynamic flows are ephemeral — generated per request, not saved.
- They use the same engine, same composer, same primitives as predefined flows.
- User navigates with same PUI: swipe forward/back between steps, double-tap to dismiss.
- At any point, voice can interrupt: "skip to the last step", "go back", "that's enough" → engine handles via voice parsing.

### 4d. Hybrid: AI Overrides on Predefined Flows

Allow the AI to modify predefined flows per request:
- "Send Hiro a message about the design review" → AI triggers `send_message` flow BUT pre-fills `message_body` with a suggested sentence AND skips `recipient` slot (resolved from params). The flow starts at the confirm step.
- "Book a flight to Tokyo, business class" → AI triggers `book_flight` with destination + class pre-filled, flow starts at the date selection step.
- This is just the AI returning `type: "flow"` with more `params` pre-filled. No new mechanism needed — the engine already auto-resolves pre-filled slots.

## Test

- "How do I take care of a fiddle leaf fig?" → AI generates 3-step display flow → user swipes through steps
- "Walk me through making pasta carbonara" → AI generates recipe steps as display flow
- "Compare the iPhone and Pixel" → AI generates 2-3 InfoCard steps (design, camera, price)
- "Send Hiro a note saying I'll be late" → predefined message flow, but recipient + message pre-filled → starts at confirm
- "Set a timer for 10 minutes" → direct_response (no flow needed, just voice + CompactStatus)
- "Help me draft a presentation outline" → AI generates a multi-step flow with text_input slots for each section

## Do NOT

- Add new primitives. If the AI can't express something with the existing 8, simplify the response.
- Change the flow engine. Dynamic flows use the same engine as predefined ones.
- Save or cache dynamic flows. They're one-shot.
- Change existing predefined flow definitions. They stay as they are — the AI can pre-fill their slots but doesn't modify the definitions.

## After This

The system is complete. Any user request → AI classifies → either direct response (1 screen), predefined flow (known pattern), or dynamic flow (AI-generated steps). All rendered by the same primitives, the same composer, the same engine. The designer maintains 8 components. The AI handles everything else.