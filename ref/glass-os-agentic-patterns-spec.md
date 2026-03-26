# GlassOS: Agentic Flow Design — Confirmation & Selection Patterns

## Context

The current flight booking flow has a confirm screen that shows a detailed receipt-style breakdown (departing flight card, returning flight card, total price) followed by a separate payment selection screen. This feels like a phone UI shrunk to glasses. We need to redesign these steps to feel agentic — the AI recommends, the user confirms, friction is minimized.

This spec covers: (1) how to redesign the flight confirm + payment steps, (2) the general pattern rules that apply to ALL flows, (3) how these rules feed into the slot engine.

Reference the existing project structure in `AI_PAGE_PROJECT_STRUCTURE.md`. Update the flight flow (`flight-booking.js`, `flight-render.js`) and the shared primitives if needed. Apply the same rules to the message flow and any future flows.

---

## Part 1: Flight Confirm Redesign

### Current (remove this)

Two screens:
1. Confirm screen: "CONFIRM FLIGHT" header, departing flight card (label, time, route), returning flight card (label, time, route), total price. Three action buttons.
2. Payment screen: "PAYMENT" header, SelectionList with 3 payment methods (Apple Pay, Visa, Bank transfer).

### New (build this)

One screen. The AI already guided the user through each choice — they remember what they picked. The confirm screen is a "yes or no?", not a review form.

**Voice:** "SFO to LA, Feb 12 to 14, three ninety-five with Apple Pay. Book it?"

**Glass — single card:**

```
SFO → LAX
Feb 12–14 · $395
Apple Pay ···· 9421
```

Three lines inside one InfoCard (or a composed card using existing primitives). Route, dates + price, payment method. All essential info at a glance, nothing repeated from previous steps.

Below the card: two actions only — ✅ (book) and ❌ (cancel).

No "edit" button — if the user wants to change something, they say it: "change the return flight", "use my Visa", "make it business class." The engine re-opens the relevant slot. Edit-by-voice is faster and more natural than an edit button that dumps you back to an ambiguous "which thing do you want to edit?" screen.

**Payment method is auto-selected.** Use the user's default (most recently used or marked as primary). It shows on the confirm card as one line for transparency, but it's not a decision point.

**If no default payment exists** (first-time user), THEN show a payment selection step before the confirm card. This is an exception path, not the standard flow.

**If user explicitly requests a different payment method** ("use my Visa"), the AI swaps it and re-shows the confirm card with the updated line. No separate payment screen.

### Detail on demand

If the user says "show details" or "what are the flight times", expand the card to show the full breakdown (departure time, arrival time, airline, stops). But the default confirm is the summary. Always start minimal, expand on request.

---

## Part 2: General Pattern Rules for All Flows

These rules apply to every flow — message, flight, coffee, shopping, restaurant, anything. They should be baked into the slot engine and the AI's system prompt.

### Rule 1: Confirm screens are "yes or no?", not review forms

A confirm screen should have:
- One card with a 2–4 line summary of what's about to happen
- Maximum 3 action buttons
- The AI's voice reads the summary conversationally

A confirm screen should NOT have:
- Detailed breakdowns repeating every slot the user already filled
- Edit buttons (voice handles edits)
- Multiple cards or sections
- A separate "review your selections" step before the actual confirm

**Pattern:** `InfoCard (summary) + ActionRow (✅ ❌)`

### Rule 2: Use defaults, don't ask

If the system knows the user's preference (payment method, delivery address, coffee order, seat preference), use it automatically. Show it on the confirm card for transparency, but don't make it a decision step.

Only present a selection when:
- There is no default (first time)
- The user explicitly asks to change it ("use a different card")
- The options are meaningfully different and the AI can't pick confidently

**Pattern:** Default → auto-fill slot → show on confirm. Exception → SelectionList only when needed.

### Rule 3: The AI recommends, the user confirms

For any selection from a large set (flights, restaurants, products, hotels):

**Level 1 — One recommendation:**
Show ONE option the AI picked as best. Voice explains why briefly. User can confirm (✅), see alternatives (🔄), or cancel (❌).

`InfoCard (recommendation) + ActionRow (✅ 🔄 ❌)`

**Level 2 — Alternatives (only if user asks):**
Show 2 alternatives that represent DIFFERENT tradeoffs — not the next two in a ranked list. For example:
- Flight: one cheaper option, one more convenient option
- Restaurant: one closer, one better rated
- Product: one cheaper, one higher quality

`SelectionList (2 items) + ActionRow` or voice to refine further.

**Level 3 — Refinement by voice:**
User says a constraint ("something cheaper", "closer to downtown", "with free cancellation"). AI re-recommends ONE option with the constraint applied. Back to Level 1.

**Never show more than 2–3 options at once. Never show a scrollable list. If the user needs to scroll, the AI failed.**

### Rule 4: Edit by voice


- User says "change the date" → engine re-opens the date slot
- User says "use my Visa" → engine swaps payment and re-confirms
- User says "make it a large" → engine updates the size slot

The slot engine already supports `back` actions that re-open specific slots. Voice shortcuts can target any slot by name. This is faster and more natural than navigating back through screens.


### Rule 5: One card, not multiple cards

The glasses display is 420×420. Every card takes visual space and cognitive load. Prefer one card with multiple lines over multiple cards with one line each.

**Instead of:**
```
[Departing flight card]
[Returning flight card]
[Price card]
```

**Do:**
```
[Single card]
  SFO → LAX
  Feb 12–14 · $395
  Apple Pay ···· 9421
```

Compose information within a single InfoCard using its title/subtitle/body/detail fields. Only use multiple cards when the items are truly independent and selectable (like a SelectionList).

### Rule 6: Transient states don't need a screen

"Processing payment...", "Searching for flights...", "Sending..." — these are CompactStatus pills that show briefly and auto-dismiss. Don't make them a "step" the user has to wait on with a full screen. Keep them compact and at the bottom.

---

## Part 3: Slot Engine Rules

Add these as engine-level behaviors so they apply to all flows automatically:

### Confirm slot pattern

When a flow has a `confirm` slot (type: `action_select` with an `execute` action):
- The engine auto-composes the confirm UI by summarizing all filled slots into a single InfoCard
- The summary format is defined per flow in a `confirmTemplate` field:
  ```js
  confirmTemplate: {
    title: "{origin} → {destination}",
    subtitle: "{dates} · {price}",
    detail: "{paymentMethod}"
  }
  ```
- The engine resolves the template by substituting filled slot values
- Actions are always ✅ (execute) and ❌ (cancel) — no edit button
- Voice output is the template read conversationally

### Auto-default slots

A slot can be marked as `autoDefault: true`:
```js
{
  id: "payment_method",
  type: "entity_select",
  autoDefault: true,        // use default if available
  defaultSource: "user.primaryPaymentMethod",
  ui: { ... },              // only shown if no default exists
}
```

The engine checks the default source first. If a value exists, the slot is auto-filled and its UI is never shown. The value appears on the confirm card for transparency. If no default, the slot renders its UI as a normal selection step.

### Recommendation slots

A new slot behavior for large-set selections:

```js
{
  id: "flight",
  type: "recommendation",
  source: "flight_search",         // data source
  levels: {
    recommend: {                   // Level 1: single recommendation
      layout: ["info_card"],
      actions: ["confirm", "alternatives", "cancel"]
    },
    alternatives: {                // Level 2: show 2 alternatives
      layout: ["selection_list"],
      maxItems: 2,
      diversityStrategy: "tradeoff",  // pick options that differ meaningfully
    },
    refine: {                      // Level 3: voice refinement
      // returns to recommend with constraint applied
    }
  }
}
```

The engine manages the levels internally: starts at `recommend`, moves to `alternatives` if user taps 🔄, moves to `refine` if user adds a voice constraint. Refinement always returns to `recommend` with one updated result.

### Voice-edit routing

When the user speaks during a confirm slot, the engine should check if the utterance matches any previously filled slot's domain:
- "Change the date" / "February 20th" → re-opens the date slot
- "Use my Visa" / "different card" → re-opens payment slot (or swaps default)
- "Business class" → re-opens class slot

This means the engine needs a lightweight matcher: for each filled slot, register the keywords/phrases that would indicate the user wants to change it. This can be simple pattern matching for now and AI-powered matching later.

---

## Part 4: Apply to Existing Flows

### Flight Booking

- Remove the separate payment selection screen entirely
- Collapse the confirm screen to a single-card summary with payment as one line
- Add `autoDefault: true` to the payment slot
- Update `confirmTemplate` for the summary format
- Flight selection steps should use the `recommendation` slot pattern (one best flight, alternatives on request) — this is a larger change to the existing step rendering, implement when ready

### Send Message

Already close to correct. The confirm shows recipient + message + 3 action buttons. Adjustments:
- Remove the edit (✊) button from the action row. Keep ✅ (send) and ❌ (cancel) only.
- Edit by voice: "change the message" re-opens the compose slot.

### Order Coffee

- `drink` and `size` are chip_select (already correct)
- `confirm` uses the single-card summary: "Medium Latte · $5.50 · Apple Pay"
- Payment auto-defaults

### Future Flows (restaurant, shopping, etc.)

- Restaurant: `recommendation` slot for the restaurant pick. Confirm: "Raku, 7pm tonight, party of 2. Book it?"
- Shopping: `recommendation` slot for the product. Confirm: "AirPods Pro, $249, Apple Pay. Order?"
- All follow the same pattern. No new primitives needed.

---

## Summary of Changes

1. **Flight flow**: collapse confirm + payment into one screen, single card, two buttons.
2. **Slot engine**: add `autoDefault`, `confirmTemplate`, `recommendation` slot type, voice-edit routing.
3. **All flows**: confirm = "yes or no?", defaults used automatically, edit by voice not button.
4. **Primitives**: no changes needed. InfoCard + ActionRow already handle the new confirm pattern.
5. **Design rule**: if the user needs to scroll or review, the AI failed. Summarize, recommend, confirm.
