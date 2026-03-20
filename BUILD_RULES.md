# GenUI Build Rules

This document is the canonical build contract for `index.html` (prototype mode) and `ai.html` (AI mode).

## Purpose and Precedence
- All UI/interaction changes `MUST` follow this file.
- If a request conflicts with this file, update this file first, then implement.
- `README.md` is informational. `BUILD_RULES.md` is normative.

## Non-Negotiable Visual Rules
- Glasses frame `MUST NOT` crop a 420px-wide UI.
- Glasses frame outline `MUST` be visual-only (non-intrusive stroke technique), not content-cutting border behavior.
- In AI mode, all stage UI `MUST` stay inside the 420x420 stage and `MUST NOT` overflow.
- Container alignment rules (bottom/center per mode/stage) `MUST` be consistent across transitions.
- No debug/helper instruction text may appear unless explicitly requested (for example: navigation hints, payment hints).

## Non-Negotiable Motion Rules
- Home/Magic transitions `MUST` be smooth and continuous with no jump cuts.
- Thinking replacement (`magic`) behavior `MUST` preserve the home visual base and apply only allowed delta effects.
- Any transition timing request with explicit numbers `MUST` be implemented exactly (no approximation).
- If user asks to remove an effect/delay, it `MUST` be fully removed, not reduced.

## Stage and Layout Contracts
- Stage edits are scenario-independent: each scenario stores its own stage data and overrides.
- Creating/deleting stages in one scenario `MUST NOT` mutate other scenarios.
- Predefined stages `MUST` be present in new scenarios by default; deletion/reset behavior must remain scenario-scoped.
- Stage components obey configured presence rules:
  - `icon`, `primary`, `secondary`, `detail` can be enabled/disabled per stage.
  - Multiple images/details render all instances, not just first item.
- When content is missing, layout `MUST` collapse naturally (no phantom rows/gaps).
- Card/pill/card-s spacing and icon paddings `MUST` honor configured/default values.

## AI Flight Flow Contract
- Entry chip label: `Book a flight`.
- Flow order `MUST` be:
  1. destination
  2. dates
  3. passengers
  4. thinking (magic) hold
  5. choose flight
  6. confirm
  7. payment
  8. booked confirmation
- Destination and date screens `MUST` preserve shared top row layout continuity.
- Date step behavior:
  - After both dates are collected, remain on date UI.
  - Advance only on explicit confirm intent (chat confirm word or Space behavior if enabled).
- Edit behavior:
  - `change date` from confirm routes back to date UI.
  - After date update from confirm-path, route back to confirm directly.
- AI reply rule:
  - Every progression reply `MUST` confirm what was captured and ask the next question.
  - Reply `MUST NOT` end without next-step guidance unless the flow is complete.
- System `MUST` render deterministic fallback UI even if AI provider is unavailable.

## Typography and Spacing Contract
- Global stage typography policy:
  - Core stage text sizes are constrained to allowed sizes configured by product direction.
  - Chips/input/chat sizes are explicitly mode-scoped and `MUST` not leak into stage typography rules.
- Current required defaults (unless changed by explicit request):
  - Pill/Card-S icon left padding: `16px`
  - Pill/Card-S icon right padding: `8px`
  - AI card primary text: `28px`
  - Pill primary-secondary gap: `2px`
- Placeholder/copy defaults `MUST` be meaningful and scenario-consistent (no generic “primary text” placeholders in seeded states).

## Known Mistakes and Preventive Rules
- Do not report completion without verifying the exact selector and numeric values changed.
- Do not implement “close” values when exact values were requested.
- Do not silently keep hidden delays when asked to remove delay.
- Do not leave orphan helper content from previous flows.
- Do not couple scenario state through shared references; clone/normalize per scenario.
- Do not introduce initialization-order regressions (`Cannot access X before initialization` class of bug).

## Pre-Merge Verification Checklist
- Visual
  - Glasses mode does not clip 420px content.
  - Stage content does not overflow 420x420 AI stage.
  - No banned helper instruction text is shown.
- Motion
  - Home/Magic transition has no abrupt jump.
  - Requested delays/durations/easing match exact numbers.
- Flow
  - Flight flow sequence matches contract.
  - Date-step hold/confirm behavior works.
  - Edit-back routes return to correct step.
  - No-AI fallback still renders predefined flight UI.
- Data integrity
  - Scenario/stage settings are fully scenario-independent.
  - Add/delete/reset stage operations do not leak across scenarios.
- Copy
  - Seeded scenarios use meaningful default copy and expected defaults.

## Change Log Template (for future edits)
- Request:
- Exact constraints:
- Files touched:
- Verified selectors/values:
- Validation steps executed:
- Regressions checked:
