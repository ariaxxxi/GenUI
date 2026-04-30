# AI Orb

## Purpose

This document defines the shared listening/thinking orb contract for GenUI.

The AI listening orb and AI thinking orb are not page-specific effects. They are one reusable Celestial orb component that must stay visually consistent anywhere it appears in the project.

This rule currently applies at minimum to:

- GenUI Tool
- AI Mode

If the orb is added anywhere else later, the same rule still applies by default.

## Default Interpretation Rule

When a human says:

- "add a listening orb here"
- "use the thinking orb here"
- "show the AI orb in this step"

agents should interpret that as:

- use the shared Celestial orb component
- use the existing listening/thinking orb source of truth
- do not invent a new orb style or ask the user to restate the orb design unless they explicitly request a new visual variant

The default orb is already defined. The user should not need to re-specify its style every time.

## Source Of Truth

Listening and thinking orb visuals must be controlled from one shared implementation, not per-page forks.

Shared source of truth:

- `src/shared/celestial-selected-presets.js`
- `src/shared/celestial-selection-chrome.js`
- `src/styles/shared.css`
- `src/shared/ai-orb-icon.js`
- shared orb DOM is created from `ensureSharedAiOrb()` in `src/shared/celestial-selection-chrome.js`

State-only behavior:

- `src/styles/ai-decorative.css`
- `src/ai/voice-engine.js`

Rule:

- `src/styles/ai-decorative.css` may control listening/thinking state behavior and transitions.
- `src/ai/voice-engine.js` may control microphone analysis, reactive signal smoothing, and the runtime value written into the orb.
- It must not redefine the orb's visual-core values, layer recipe, or create an independent orb design system.

## Center Asset

The shared AI orb includes a centered app/assistant image layer.

Rules:

- The image size is `36px x 36px`.
- This image layer is part of the shared orb component and must appear in all products that use the AI orb, except the Celestial Visual Tool.
- Default asset: `assets/Bixby.png`
- Current switchable options live in `src/shared/ai-orb-icon.js`:
  - `bixby`
  - `gemini`
  - `chatgpt`
- The icon choice is persisted through `genui.ai-orb-icon.v1`.

Do not hardcode different orb-center images per page. Add or change options through the shared orb icon module.

## Relationship To `voice-engine.js`

`src/ai/voice-engine.js` is the runtime bridge between microphone input and the listening orb reaction.

Its role is:

- read analyser data from the microphone
- smooth the incoming signal
- convert that signal into the orb reaction level
- write the reactive value into `--ai-listening-rim-level`

This means `voice-engine.js` controls how the listening orb responds over time, but it does not own the orb's visual design.

Responsibility split:

- visual core, layer stack, preset values, and shared orb component shape:
  - `src/shared/ai-orb-icon.js`
  - `src/shared/celestial-selected-presets.js`
  - `src/shared/celestial-selection-chrome.js`
  - `src/styles/shared.css`
- listening/thinking state presentation:
  - `src/styles/ai-decorative.css`
- microphone-driven reaction signal:
  - `src/ai/voice-engine.js`

When a task asks to make the listening reaction smoother, more responsive, less jittery, or more stable, inspect `src/ai/voice-engine.js` first. Do not solve that by forking the orb visual in page-local CSS.

## Reusable Component Contract

The reusable orb uses one shared DOM/component shape and the shared Celestial orb classes:

- `.g-celestial-orb-visual`
- `.g-celestial-orb-sphere`
- `.g-celestial-orb-selection`
- `.g-celestial-orb-disambiguation-icon`

Any new listening/thinking orb should be built from the shared orb structure and shared Celestial layer stack, not from new page-local markup and CSS.

## Visual Consistency Rules

- Thinking and listening must match across GenUI Tool and AI Mode.
- A listening orb added to any flow step must use the same shared source of truth.
- A thinking orb added to any flow step must use the same shared source of truth.
- Do not create separate "prototype orb", "AI orb", or "flow orb" visual recipes.
- Do not fork Celestial values per page.
- Do not require product-by-product orb updates when the user changes the core orb visual.

## Behavior Distinction

The component is shared, but state behavior differs:

- Thinking: full Celestial orb stack is visible.
- Listening: same orb component, but listening-state behavior can suppress some layers while keeping the shared rim/highlight logic.

This means logic may differ by state, but the visual source of truth remains shared.

## Change Policy

If the user updates the visual core of the listening/thinking orb, update the shared source files so every orb instance inherits the change.

Do not solve orb changes by:

- adding page-local overrides
- copying CSS into another page file
- creating a second orb preset system
- making GenUI Tool and AI Mode drift apart

## Review Checklist

When touching listening/thinking orb UI, verify:

- GenUI Tool orb matches AI Mode orb.
- Listening at zero volume still shows a subtle colored rim.
- Thinking still uses the shared Celestial orb visual.
- No new independent orb CSS/value fork was introduced.
