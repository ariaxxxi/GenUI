# Step 2 Review: What Needs Fixing Before Moving Forward

## Status

Step 2 (Slot-Based Flow Engine) is **partially done**. The generic engine exists, flow definitions are written, and the coffee order flow is fully engine-driven. But message send and flight booking still run on their old hand-authored state machines. The flow definitions for those two exist in `flow-definitions.js` but nothing uses them.

This means Step 2's core promise — "one engine, one renderer, N flow definitions" — is **not yet proven for the hard cases**. Coffee is the simplest flow (two chip selects + confirm). The real test is whether the engine can replace the message and flight state machines without losing any UX behavior.

**This must be finished before moving to Step 3 (Intent Routing) or the agentic patterns spec.** Everything downstream assumes the engine runs all flows.

---

## Part 1: Complete the Migration (Finish Step 2)

### 1a. Migrate Send Message to the Generic Engine

`message-send.js` still has its own state enum (`GS.IDLE`, `GS.THINKING`, `GS.DISAMBIGUATE`, etc.) and manually manages transitions. It needs to be rewritten to use `createFlowEngine()` with `SEND_MESSAGE_FLOW_DEFINITION`, following the same pattern as `coffee-order.js`.

**What to preserve exactly** (the coder should test each of these):
- Disambiguation: 1 contact match → skip to compose. 2+ matches → selection list with arrow nav.
- Compose: contact header + chips + input field. Selecting a chip fills message with a full sentence. Choosing "dictate" switches to dictation mode. Chips disappear when user starts talking.
- 3-second pause → checkmark fades in. Resume talking → checkmark fades out.
- Checkmark tap → confirm screen (no blue glow, 3 action buttons).
- Edit action → back to compose with existing message pre-filled, chips hidden.
- Voice shortcuts at every step ("send", "edit", "cancel", contact names during disambiguate).
- Epoch guards for stale async callbacks — the engine-driven version needs these too.
- Controls positioning (the custom `positionControlsOverlay` + tracking logic).

**What to delete after migration:**
- The `GS` enum and all `flow.state === GS.XXX` branching in `message-send.js`
- The manual state transition logic — engine's `next()`, `back()`, `goToSlot()` replace it
- Do NOT delete `message-send-render.js` or `message-send-voice.js` yet — they can become thin helpers that the engine-driven flow calls

**Flow definition update needed:**
The current `SEND_MESSAGE_FLOW_DEFINITION` is too thin. It only lists slot IDs and primitive names — it doesn't carry the contact data, chip definitions, or any of the compose behavior. Compare it to how `coffee-order.js` hardcodes `DRINKS` and `SIZES` and builds the full spec in `slotSpec()`. The message flow needs the same approach: the flow file owns the data and builds full layout specs per slot, the engine just tracks which slot is active.

### 1b. Migrate Flight Booking to the Generic Engine

`flight-booking.js` has `FLOW_STEPS` (8 steps), a custom `setStep()`/`nextStep()`/`backStep()` system, and a bunch of flight-specific logic (city→airport mapping, route row HTML, Gemini AI calls via `flight-ai.js`).

**What to preserve exactly:**
- Destination step: pill shape, route row with origin pre-filled (SFO), voice/text input for city name.
- Dates step: card-form shape, depart/return input (currently text, later voice).
- Passengers step: selection list (1 adult, 2 adults, family).
- Thinking state: magic shape with animated dots while searching flights.
- Flight options step: selection list with 3 flight options.
- Confirm step: flight summary card.
- Payment step: selection list with payment methods.
- Done step: success state.
- Edit-return behavior: from confirm, user can go back to change dates/destination and return to confirm after.
- `flight-ai.js` Gemini integration for NLU — keep this as a resolver plugin the engine-driven flow calls.

**Flow definition update needed:**
The current `BOOK_FLIGHT_FLOW_DEFINITION` lists 6 slots but the actual flow has 8 steps (it's missing the `thinking` step between passengers and flight_option, and the `done` step). The definition also doesn't capture the step-specific shapes, the edit-return logic, or the Gemini integration points.

### 1c. Flow Engine Gaps

The engine in `flow-engine.js` is minimal — 104 lines. It tracks slot index, filled values, and selection index. That's a good foundation, but it's missing behaviors that the existing flows need:

1. **Auto-resolve / skip logic**: If a slot is pre-filled (e.g., only 1 contact match), the engine should automatically advance past it. Currently each flow file would need to implement this manually after calling `start()`. The engine should handle it in a `start()` or `advance()` method.

2. **Slot-specific voice mode**: The engine doesn't tell the voice system whether to use "command" or "dictation" mode. Each flow handles this manually. The engine should expose `currentSlot().voiceMode` or similar.

3. **Execution phase management**: The engine sets `status = "executing"` when you call `next()` past the last slot, but there's no `loading → success → done` lifecycle. Coffee flow manages this with manual timers. This should be engine-level.

4. **No event/callback system**: When the engine transitions between slots, nothing fires. Each flow polls `engine.currentSlot()` and renders manually. Consider adding an `onSlotChange` callback so flows don't need to manually sync.

These aren't blockers for migration — coffee flow works fine without them — but they'll become pain points when you have 5+ flows all implementing the same boilerplate.

---

## Part 2: Flow Definition Quality

The definitions in `flow-definitions.js` need to be richer to actually drive the flows. Right now they're skeletal:

```js
// Current — too thin
{ id: "recipient", type: "entity_select", required: true, voice: "Which Hiro?", ui: ["selection_list"] }
```

They need to carry enough information that the flow file's `slotSpec()` function can generate a complete layout spec. Compare to how `coffee-order.js` builds full specs with `intentHeader`, `wrapBody`, `bodyClass`, `props` with real data. The definitions should either:

**Option A**: Keep definitions thin, flow files own the spec generation (current coffee pattern). This is fine — just acknowledge that definitions are metadata, not the full spec.

**Option B**: Make definitions richer so they carry all the data needed to generate specs. This would allow a truly generic "run any definition" flow runner without per-flow spec code.

For now, **Option A is pragmatic** — each flow file has enough custom behavior (contacts data, city mapping, Gemini calls) that a generic runner would need lots of plugin hooks anyway. But be explicit about this: the flow definition is a structural skeleton, the flow file is where the real spec generation lives.

---

## Part 3: Input Routing Cleanup

`input-actions.js` has an ad-hoc priority chain:

```
1. flight active? → flight handles it
2. coffee active? → coffee handles it
3. message intent detected? → start message flow
4. chip quick actions (weather, timer, call)
5. flight processRequest
6. coffee processRequest
7. fallback to AI/manual mode
```

**Problems:**
- Message flow is checked by intent regex but doesn't have a `processRequest()` method like flight and coffee do. Inconsistent interface.
- Message flow doesn't have an `isActive()` check at the top like flight and coffee. If message flow is active and user types something, it falls through to step 3 again instead of routing to the active message flow.
- The `handleChipQuickAction` function creates one-off scenarios inline instead of going through any flow system. These should eventually become flows or direct responses, but for now they work.

**Fix for this pass:**
- Add `messageFlow.isActive()` check at the top of `processRequest()`, before the flight/coffee checks. Route to message flow's input handler if active.
- Give message flow a `processRequest(text)` method for consistency.
- Keep chip quick actions as-is — they'll be replaced by Gemini intent routing in Step 3.

---

## Part 4: Coffee Flow Visual Bugs (Fix Immediately)

The coffee flow UI is broken. Screenshots show two critical issues:

### 4a. Container is full-height with massive empty space

Both the drink selection and confirm screens show a card that fills the entire stage vertically, with content pushed to the bottom and a huge black void above. The morph container should **tightly wrap the content** — same as the message flow does. The chip bar screen should be a compact card-form just tall enough for the chips. The confirm screen should be a compact card just tall enough for the info card content.

**Root cause likely**: The spec generated by `slotSpec()` in `coffee-order.js` is either missing sizing hints, or the morph shape chosen (`card-form` / `card`) is not being content-fitted the way the message flow does it. Compare how `message-send-render.js` builds its specs and how the morph system sizes for those — the coffee flow should match.

### 4b. Confirm screen layout is inverted

On the confirm screen:
- Action buttons (✅ ✊ ❌) are positioned at the **top left** of the stage instead of below the card.
- The info card content ("Confirm Order" / "Tap to order or change") is at the very bottom, partially clipped.
- There's no visual relationship between the card and the actions — they look disconnected.

**How it should look**: Same pattern as the message flow's confirm screen — a content-fitted card with the summary inside, action buttons centered below the card with proper gap spacing. Everything anchored to the bottom of the stage.

**Fix**: Look at how the message flow's confirm state positions its action row via `glass-controls-layer` and the `positionControlsOverlay` / `trackControlsForTransition` logic. The coffee flow's `render()` function passes `controlsRoot: ctx.C.glassControlsLayer` to `composeScreen()` but the actions are clearly not being positioned correctly. Either the spec format for actions is wrong, or the controls layer positioning isn't being applied.

### 4c. Reference: How it should work

Look at the message flow's confirm screen as the reference. That flow has:
- A compact card (not full-height) containing contact header + message text bubble
- Action buttons (✈️ ✊ ❌) rendered in `glass-controls-layer`, positioned below the card center
- Controls tracking during morph transitions so buttons follow the card

The coffee flow should produce the same visual pattern: compact info card (drink + size + pickup time) → action buttons below, both bottom-anchored, properly spaced.

---

## Part 5: Minor Issues

1. **No epoch guards on coffee/flight flows**: `message-send.js` has `flowEpoch` to prevent stale callbacks from rendering into a reset flow. Coffee and flight flows don't have this. If the user rapidly starts/cancels flows, stale timers could fire into the wrong state. Add epoch guards to both.

2. **Coffee flow confirm still has 3 buttons (order/change/cancel)**: Per the agentic patterns spec, confirm should be ✅ and ❌ only — no edit button. But don't change this yet. The agentic patterns will be applied as a separate pass after the engine migration is complete.

3. **Flight definition has `confirm` typed as `display` but it's actually an action step**: In `flow-definitions.js`, the flight confirm slot is `type: "display"` but it should be `type: "action_select"` since the user needs to confirm/cancel. The `display` type is for non-interactive content (like step-by-step guides).

4. **Flight definition is missing `thinking` and `done` pseudo-slots**: The current flow has 8 steps but the definition only has 6 slots. The `thinking` step (loading while searching flights) and `done` step (success confirmation) should either be slots or handled by the engine's execution phase. The engine already has `executing` and `success` status — use those instead of making them slots.

---

## Recommended Execution Order

1. **Fix the flow engine** — add auto-advance for pre-filled slots, add epoch guard support.
2. **Migrate message-send.js** — rewrite to use engine. Validate every UX behavior listed in 1a. Keep render and voice files as helpers.
3. **Migrate flight-booking.js** — rewrite to use engine. Keep flight-ai.js as plugin. Validate every step listed in 1b.
4. **Fix input routing** — add `messageFlow.isActive()` check, add `processRequest()` to message flow.
5. **Fix flow definitions** — correct the flight confirm slot type, remove thinking/done as slots (use engine execution states).
6. **Add epoch guards** to coffee and flight flows.
7. **Validate all three flows** end-to-end: coffee, message, flight. Each should look and behave identically to their pre-migration versions.

After this, Step 2 is truly complete. Then we can apply the agentic patterns spec (Part 2 of that doc: confirm redesign, auto-defaults, recommendation slots) and move to Step 3 (intent routing).

---

## Do NOT

- Apply the agentic patterns spec yet (confirm redesign, auto-defaults, recommendation slots). That's a separate pass.
- Touch `ui-primitives.js` or `screen-composer.js`. Step 1 is done and working.
- Change visual styling or morph behavior.
- Delete the old flow files until migration is validated and all UX behavior is confirmed identical.
- Build intent routing (Step 3) or dynamic flows (Step 4). Those depend on a fully working engine.
