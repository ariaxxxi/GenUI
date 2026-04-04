# DECISIONS.md
> Key architectural and product decisions, with rationale. Add entries when a non-obvious choice is made.

---

## Two-Page Split (index.html + ai.html)
**Decision:** Separate manual editing and AI interaction into two distinct HTML files instead of one toggled app.

**Why:** The two modes have fundamentally different interaction models — manual mode needs full scenario CRUD with typography controls, AI mode needs a tight linear flow optimized for demo. Sharing one page created UI complexity and mode-bleeding bugs. Separate files = clear separation of concerns, each page optimized for its task.

**Trade-off:** Some rendering and shape logic is duplicated across both files. Mitigated by `src/shapes.js`.

---

## No Framework (Vanilla JS Only)
**Decision:** No React, Vue, Svelte, or any component framework. Vanilla HTML/CSS/JS throughout.

**Why:** This is a design prototyping tool — the output needs to be portable, inspectable, and free of build step complexity. Designers or non-engineers may need to open and modify the HTML directly. A bundler would add friction.

**Trade-off:** Some repetitive DOM manipulation code. Acceptable given the project scope.

---

## Shapes Extracted to `src/shapes.js`
**Decision:** All shape/stage definitions live in one canonical ES module rather than being inlined per-page.

**Why:** Both pages need identical shape math. Before extraction, edits to shape params had to be made twice and would often drift. Single source of truth prevents that.

**When introduced:** Commit `87dca3d` — `refractor-to-2-pages` branch.

**Note:** The app now assumes an HTTP-served environment. The old `file://` fallback was removed because only patching `window.SHAPES` did not make the module boot path work and created drift risk.

---

## Per-Scenario Stage Independence
**Decision:** Each scenario gets its own full copy of all stage configs. Editing Stage X in Scenario A does not affect Scenario B.

**Why:** Early version used shared stage objects. Designers found that tweaking one scenario's card layout would silently break another scenario's layout. Fully isolated copies fix this, at the cost of more localStorage space.

---

## Glasses Frame = Visual Stroke, Not Clip
**Decision:** The 420×420 glasses frame border is a CSS box-shadow/outline, not a clip-path or overflow:hidden.

**Why:** Clipping creates visual artefacts on animated shape transitions (border-radius animations get clipped mid-frame). Visual-only stroke lets animations run cleanly. This means content must self-constrain — the frame will not hide overflow.

**Implication:** Any new shape or content added to ai.html in glasses mode MUST be verified to fit within 420px. See `BUILD_RULES.md`.

---

## Fallback UI Required
**Decision:** ai.html must render a deterministic fallback UI (`localFlightFallback()`) when the AI provider is unavailable or returns an error.

**Why:** This is a demo/design tool. A blank screen during a live demo is unacceptable. Fallback lets the flow be walked through without any backend connection.

**Implication:** Any new flight flow step must have a corresponding fallback branch.

---

## AI Provider Abstraction in server.mjs
**Decision:** All AI calls go through `server.mjs` as a proxy, not directly from the browser.

**Why:** Keeps API keys out of the browser. Allows provider-specific logic (Gemini retry, Anthropic version header) in one place. Clients just POST to `/api/ai` or `/api/gemini`.

---

## Flight Demo as Primary AI Use Case
**Decision:** The flight booking flow is the canonical AI demo baked into ai.html.

**Why:** It covers the full shape progression (circle → dot → pill → card → card-form → card-list → magic → confirm), demonstrates multi-turn AI conversation, and is concrete enough to evaluate UX quality. A scenario designers can relate to and demo to stakeholders.

---

## Typography Constraints (12–96px, #hex only)
**Decision:** Typography sizes clamped to 12–96px range; colors validated as 6-digit hex only.

**Why:** (Inferred) Prevents degenerate layouts from out-of-range inputs. Enforced in `normalizeTypography()` in `src/shapes.js`.
