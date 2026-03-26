# Task

## Title
Validation Gate: Fix remaining flight state bug and complete manual acceptance checks before Step 3

## Status
Ready for implementation

## Objective
Do not begin Step 3 yet.

This task is a validation gate for the Step 2 / revision work. The implementer must:

1. fix the remaining flight runtime state bug
2. run the manual validation matrix that was required by the previous task but not completed
3. record whether the codebase is actually safe to move to Step 3

The goal is to make the current Step 2 foundation trustworthy before adding more routing and AI behavior on top.

## In scope
- Fix the flight flow state aliasing bug between `flow.data` and `api.data`
- Verify that render and AI logic read the current flight state after resets and updates
- Run the manual validation matrix for coffee, flight, and message regression
- Add the new universal confirmation-card rule for rich confirmations:
  - collapsed summary by default
  - expandable detail view on demand
  - visible expand/collapse affordance
- Update `context/HANDOFF.md` with exact validation results and a clear Step 3 readiness recommendation

## Out of scope
- Step 3 implementation
- New intent routing work
- Gemini classifier changes
- Architecture refactor beyond what is required to fix the flight state bug
- Full migration of flight or message onto the generic engine
- New UI design work

Do not redesign unrelated screens. Only update confirmation-card behavior where needed to satisfy this task and document the universal rule for future rich confirmations.

## Relevant context
- The previous revision task was marked completed in `context/HANDOFF.md`, but the required manual validation was not performed.
- There is still a concrete flight runtime bug: `resetData()` replaces `flow.data`, while `api.data` is assigned only once and can become stale.
- `flight-render.js` and `flight-ai.js` both read `getFlow().data`, so stale references can make the confirm card, prompts, and flow transitions inconsistent.
- Step 3 should not start on top of an unverified or internally inconsistent Step 2 foundation.
- New UX rule from the user:
  - rich confirmation pages must be collapsible cards
  - collapsed is the default state
  - expanded state is available by voice (`show details`) or by the system's expand interaction
  - this rule should generalize beyond flight to future rich confirmations such as orders and bookings

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

Only touch other files if required to complete validation safely, and document why in `context/HANDOFF.md`.

## Implementation steps
1. Fix the flight state aliasing bug.
   - Inspect how `flow.data` and `api.data` are wired in `src/flows/flight-booking.js`.
   - Ensure all runtime readers see the current state after `resetData()` and after later mutations.
   - Acceptable approaches:
     - keep one stable object and mutate it in place
     - or expose `data` as a getter that always returns the current `flow.data`
   - Do not leave any code path where render or AI logic can read stale state.

2. Verify all current flight readers use the corrected state source.
   - Check `src/flows/flight-render.js`
   - Check `src/flows/flight-ai.js`
   - Confirm selected flight, payment method, dates, and destination are read from current runtime state.

3. Update the flight confirmation page to follow the new collapsible rich-confirmation rule.
   - The flight confirm card must be collapsed by default.
   - In collapsed state, keep the current summary-first behavior:
     - route
     - dates + total price
     - payment method
   - Add a visible arrow affordance at the top-right of the card to indicate expand/collapse.
   - When expanded, the card should reveal rich detail content in the spirit of the provided reference:
     - departing flight section
     - returning flight section
     - total price row
   - Use one confirmation card container that expands internally. Do not create a separate review screen.
   - `show details` must expand the card.
   - If there is an existing hide/collapse phrase path, it may collapse the card back, but expansion is the required behavior for this task.

4. Treat this as a universal rule for future rich confirmations.
   - Add the flight implementation in a way that clearly establishes the reusable pattern.
   - The future rule is:
     - if a confirmation has rich supporting detail, the default view is collapsed summary
     - expanded detail stays in the same card
     - the card shows an expand/collapse affordance
   - Document this in `context/HANDOFF.md` so the next planner/implementer can apply it to future flows.

5. Run the manual validation matrix in the browser.
   - Use the actual `ai.html` flow, not code inspection only.
   - Record pass/fail for each case.

6. Document Step 3 readiness explicitly in `context/HANDOFF.md`.
   - If all required checks pass, say Step 3 is safe to start.
   - If any check fails, say Step 3 is blocked and list the exact blocker.

## Acceptance criteria
- Flight render and AI logic no longer read stale `data` after reset or later updates.
- Flight confirm is a collapsible card with a visible arrow affordance in the top-right.
- Flight confirm loads collapsed by default.
- Saying `show details` expands the same confirmation card instead of navigating to a different screen.
- Expanded flight confirm shows:
  - departing flight block
  - returning flight block
  - total price row
- Expanded content reflects the currently selected flight and trip details.
- Coffee flow still works with:
  - default payment available
  - no default payment available
- Coffee confirm voice edits still work for:
  - `change drink`
  - `change size`
- Flight flow still works for:
  - default recommendation path
  - cheaper alternative path
  - nonstop alternative path
  - `show details`
  - no-default-payment path
- Message flow still works as a regression check.
- `context/HANDOFF.md` clearly states one of:
  - `Safe to move to Step 3`
  - `Not safe to move to Step 3`

## Validation checklist
- Manual test: coffee flow with default payment available
- Manual test: coffee flow with no default payment available
- Manual test: coffee confirm voice edit for drink
- Manual test: coffee confirm voice edit for size
- Manual test: flight flow using default recommendation
- Manual test: flight flow selecting cheaper alternative
- Manual test: flight flow selecting nonstop alternative
- Manual test: flight `show details`
- Manual test: flight collapsed confirm loads with visible expand arrow
- Manual test: flight expanded confirm stays inside the same card/screen
- Manual test: flight flow with no default payment available
- Manual test: message send regression

For payment-default simulation, use the same localStorage seam documented in `context/HANDOFF.md`.

## Risks / notes
- This task is intentionally narrow. Do not start Step 3 work while fixing or validating.
- Do not claim readiness from syntax checks alone.
- If the manual validation exposes new bugs, stop expanding scope and document them clearly in `context/HANDOFF.md`.
- The key question for this task is readiness, not feature progress.
- The expand/collapse interaction must preserve the glasses constraint:
  - one card
  - no extra review screen
  - no scrollable long review surface

## Rich Confirmation Rule
This task establishes a reusable confirmation rule for future flows that have rich supporting detail.

### Default state
- One confirmation card
- Summary-first, collapsed by default
- Top-right arrow affordance is always visible when detail exists

### Expanded state
- The same card expands internally
- Rich detail is revealed below the summary content
- Use animated expansion, not screen replacement

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
  - reuse existing glass confirm card shell
  - no new outer screen container
- Chevron affordance:
  - position: top-right inside the card
  - collapsed: points down or indicates expandable state
  - expanded: rotates upward
  - color: `rgba(255,255,255,0.72)`
  - hit target is not required for mouse interaction; it is a visual affordance
- Expanded sections:
  - each section remains inside the same card
  - section label color: `rgba(255,255,255,0.6)`
  - primary detail text color: `rgba(255,255,255,0.96)`
  - route/meta text color: `rgba(255,255,255,0.56)`
- Total row:
  - label color: `rgba(255,255,255,0.72)`
  - value color should preserve the existing success/price emphasis if already present; otherwise use `rgba(80,255,180,1)`

### Animation spec
- Expand/collapse must happen in place within the same card.
- Do not use `display: none` for the animated reveal.
- Use:
  - `max-height`
  - `opacity`
  - `margin-top`
- Timing:
  - duration: `240ms`
  - easing: `ease`
- Collapsed:
  - detail container `max-height: 0`
  - `opacity: 0`
  - `margin-top: 0`
- Expanded:
  - detail container `max-height` large enough for full detail content
  - `opacity: 1`
  - `margin-top: 16px`

### Interaction rule
- Default on entering confirm: collapsed card, `✅` highlighted by default
- Voice:
  - `show details` expands
  - if implemented, `hide details` collapses
- Keyboard:
  - existing confirm navigation must remain unchanged
  - expand/collapse should not introduce a new action-row button in this task unless strictly necessary

## Open questions
- None. The implementer should complete the validation gate and report readiness status in `context/HANDOFF.md`.
