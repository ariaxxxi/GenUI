# Task

## Title
Flight Confirm Card: Collapsible Rich Confirmation + Step 3 Readiness Validation

## Status
Ready for implementation

## Objective
Do not start Step 3 yet.

This task replaces the prior revision task entirely.

The implementer must complete two things in one pass:

1. finish the current flight confirmation UX so it follows the new collapsible-card pattern
2. verify the current Step 2/revision foundation is safe before any Step 3 work begins

The core deliverable is a flight confirmation page that:

- is collapsed by default
- shows a visible expand/collapse affordance
- expands in place when the user says `show details`
- preserves the currently selected flight data accurately

Then the implementer must run the required manual validation matrix and state clearly in `context/HANDOFF.md` whether the repo is safe to move to Step 3.

This task must also summarize the confirmation pattern clearly enough that future flows can reuse it without re-deciding the interaction model.

## In scope
- Fix any remaining flight runtime state issues required for confirm rendering to be correct
- Implement collapsible confirm-card behavior for flight
- Add the visible arrow affordance on the confirm card
- Keep collapsed summary as the default confirm state
- Expand the same card in place for rich details
- Ensure expanded details reflect the actual selected flight and payment state
- Summarize the reusable rich-confirmation pattern so future flows can follow it
- Run the manual validation matrix for flight, coffee, and message regression
- Record Step 3 readiness in `context/HANDOFF.md`

## Out of scope
- Step 3 implementation
- New intent routing work
- Gemini classifier changes
- Full migration of flight to the generic engine
- Full migration of message to the generic engine
- Visual redesign of unrelated screens
- New primitives unless absolutely required for the confirm-card pattern
- Broad architecture refactors

## Relevant context
- Flight still uses a bespoke runtime state machine.
- Coffee is currently the engine-driven reference flow.
- The user has defined a new universal UX rule:
  - if a confirmation screen has rich supporting detail, the default state is a collapsed summary card
  - the same card can expand to show richer detail
  - the card should visibly communicate that it can expand
- The previous pass fixed most of the Step 2 issues, but readiness for Step 3 is still gated by real browser validation.
- Glasses mode is constrained to a 420×420 visual frame. The confirm experience must stay minimal and in-place. No separate review page should be introduced.

## Files to inspect
- `AGENTS.md`
- `context/ARCHITECTURE.md`
- `context/DECISIONS.md`
- `context/HANDOFF.md`
- `src/flows/flight-booking.js`
- `src/flows/flight-render.js`
- `src/flows/flight-ai.js`
- `src/flows/coffee-order.js`
- `src/flows/message-send.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai.css`

## Files allowed to change
- `src/flows/flight-booking.js`
- `src/flows/flight-render.js`
- `src/flows/flight-ai.js`
- `src/flows/ui-primitives.js`
- `src/styles/ai.css`
- `context/HANDOFF.md`

Only change other files if they are strictly required to complete this task safely, and explain why in `context/HANDOFF.md`.

## Implementation steps
1. Verify and fix the current flight state source if needed.
   - Inspect how flight confirm render and flight AI read runtime state.
   - Ensure confirm render, detail expansion, and voice handling all read current state, not stale aliased state.
   - If there is still a stale-state bug between `flow.data` and exposed runtime accessors, fix it before implementing the UI behavior.

2. Implement the collapsible confirm-card pattern for flight.
   - Keep the current summary-first confirm content as the collapsed default.
   - Add a top-right chevron/arrow affordance inside the card.
   - Expanded detail must open inside the same card, not on a new screen.
   - `show details` must expand the card.
   - If a collapse voice command is easy to support, it may be added, but expansion is the required behavior.

3. Keep the confirm interaction model minimal.
   - Confirm action row remains `✅` and `❌`.
   - Do not add a new action-row button for details in this pass unless strictly necessary.
   - Default highlight on entering confirm remains `✅`.

4. Implement the expanded rich detail layout.
   - When expanded, the flight confirm card must show:
     - departing flight section
     - returning flight section
     - total price row
   - These details must reflect the actual selected flight option and the actual trip dates/payment state.
   - Do not show generic placeholder detail that can drift from the selected option.

5. Treat this as the reusable rule for future rich confirmations.
   - Implement flight in a way that clearly establishes the pattern for future flows like order confirmations and bookings.
   - Document the rule in `context/HANDOFF.md` as a reusable product rule, not as a flight-only hack.
   - Include a short summary section that states:
     - when to use this pattern
     - what collapsed state must contain
     - what expanded state must contain
     - what interaction affordance must always be present
     - what should never happen (for example: separate review screen, scroll-heavy confirm UI, multi-card confirm stack)

6. Run the manual validation matrix in the browser.
   - Use the actual `ai.html` flow.
   - Do not rely on syntax checks alone.
   - Record pass/fail for each item in `context/HANDOFF.md`.

7. State Step 3 readiness explicitly in `context/HANDOFF.md`.
   - If everything required passes: write `Safe to move to Step 3`
   - If anything fails: write `Not safe to move to Step 3` and list the blocker(s)

## Acceptance criteria
- Flight confirm is a collapsible card.
- Flight confirm is collapsed by default.
- Flight confirm shows a visible top-right expand/collapse affordance.
- Saying `show details` expands the same card instead of navigating to a different screen.
- Expanded confirm shows:
  - departing flight detail block
  - returning flight detail block
  - total price row
- Expanded details reflect the actual selected flight and current trip state.
- Collapsed summary still shows:
  - route
  - dates + total price
  - payment method
- Confirm action row remains `✅` and `❌`.
- Coffee flow still passes regression checks.
- Message send flow still passes regression checks.
- `context/HANDOFF.md` states clearly whether Step 3 is safe or blocked.
- `context/HANDOFF.md` includes a short reusable summary of the rich-confirmation pattern for future flows.

## Validation checklist
- Manual test: flight flow using default recommendation
- Manual test: flight flow selecting cheaper alternative
- Manual test: flight flow selecting nonstop alternative
- Manual test: flight `show details`
- Manual test: flight collapsed confirm loads with visible expand arrow
- Manual test: flight expanded confirm stays in the same card/screen
- Manual test: flight flow with no default payment available
- Manual test: coffee flow with default payment available
- Manual test: coffee flow with no default payment available
- Manual test: coffee confirm voice edit for drink
- Manual test: coffee confirm voice edit for size
- Manual test: message send regression

For payment-default simulation, use the existing localStorage seam documented in `context/HANDOFF.md`.

## Risks / notes
- This task is intentionally a gate. Do not begin Step 3 work during this pass.
- Do not convert the flight flow into a separate review screen.
- Do not introduce scrolling long-form review UI for the glasses confirm experience.
- Keep the change narrow: implement the collapsible detail pattern within the existing confirm experience.
- If browser validation exposes additional bugs, do not silently broaden scope. Document them clearly in `context/HANDOFF.md`.

## Open questions
- None. Complete the implementation and report readiness status in `context/HANDOFF.md`.

## Rich Confirmation Rule
This task establishes the reusable confirmation rule for future rich confirmations.

### Default state
- One confirmation card
- Collapsed summary by default
- Visible top-right chevron/arrow affordance whenever rich detail exists
- This summary format is the default for future rich confirmations such as flights, food orders, shopping orders, reservations, and bookings

### Expanded state
- The same card expands internally
- Rich detail appears below the summary content
- No screen replacement
- No separate review page

### Pattern summary for future flows
Use this pattern whenever a confirmation involves rich supporting detail but the user should make a simple yes/no decision.

Future flows should follow this summary:

- Start collapsed
- Show one summary card only
- Include a visible expand/collapse affordance
- Keep confirm actions minimal
- Expand within the same card when the user asks for details
- Show only the detail that supports confidence in the action

Future flows should not:

- open a separate review screen
- stack multiple review cards by default
- require scrolling to confirm
- repeat every prior choice in verbose form when the summary already covers the decision

### Flight expanded layout
Use this structure inside the expanded card:

```text
[summary header row .................................. chevron]
SFO → JFK
Feb 21–26 · $395
Apple Pay ···· 9421

[detail section 1]
Departing flight · Feb 21
7:10 AM - 10:30 AM
SFO - JFK

[detail section 2]
Returning flight · Feb 26
2:10 PM - 11:30 PM
JFK - SFO

[total row]
Total                                         $395
```

### Visual spec
- Card container:
  - reuse the existing glass confirm card shell
  - no new outer screen wrapper
- Chevron affordance:
  - position: top-right inside the card
  - color: `rgba(255,255,255,0.72)`
  - collapsed state: points toward expand direction
  - expanded state: rotates upward
- Summary text:
  - primary text: `rgba(255,255,255,0.96)`
  - secondary text: `rgba(255,255,255,0.72)`
- Expanded section labels:
  - `rgba(255,255,255,0.6)`
- Expanded route/meta text:
  - `rgba(255,255,255,0.56)`
- Total row:
  - label: `rgba(255,255,255,0.72)`
  - value: preserve current positive/price emphasis if already present; otherwise `rgba(80,255,180,1)`

### Animation spec
- Expand/collapse happens in place within the same card.
- Do not use `display: none` for the animated reveal.
- Animate using:
  - `max-height`
  - `opacity`
  - `margin-top`
- Duration: `240ms`
- Easing: `ease`
- Collapsed detail state:
  - `max-height: 0`
  - `opacity: 0`
  - `margin-top: 0`
- Expanded detail state:
  - `max-height`: large enough for full detail content
  - `opacity: 1`
  - `margin-top: 16px`

### Interaction rule
- On entering confirm: collapsed card, `✅` highlighted by default
- Voice:
  - `show details` expands the card
  - optional: `hide details` collapses
- Keyboard:
  - keep existing confirm navigation behavior
  - do not add a required new key path for details in this task unless strictly necessary
