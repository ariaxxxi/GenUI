# FluidUI Motion & Visual Rules

Guidelines for building motion and UI in this system. Written from hard-won lessons — follow these to produce the same visual quality and avoid known mistakes.

---

## 1. Core Animation Values

All geometry and content animations must use these exact values. Never introduce a different easing or duration without a documented reason.

```js
let animDur = 600; // ms — container morph duration
const DEFAULT_CUSTOM_BEZIER = [0.35, 0.23, 0.13, 0.98]; // cubic-bezier for all content animations
```

**In CSS:**
```css
/* All chip, header, field, row enter/exit animations: */
animation: ... 500ms cubic-bezier(0.35,0.23,0.13,0.98) both;

/* All transitions matching container: */
transition: ... 600ms cubic-bezier(0.35,0.23,0.13,0.98);
```

The container shell (width, height, border-radius, translate) uses `var(--spring)` — a `linear()` easing defined in `#anim-style`. Content animations do NOT use the spring; they use the cubic-bezier above. This is intentional: spring on the shell, bezier on the content.

---

## 2. The innerHTML Rebuild Problem — The Most Important Rule

`glassRender()` completely rebuilds `C.rich.innerHTML` on every state change. **CSS transitions never fire on elements that were just created.** This is the root cause of every "snap" or "jump" animation bug.

**Rule:** For any transition where you want animation, do NOT let `glassRender` rebuild the DOM during that transition. Instead:

1. Keep the existing DOM alive
2. Directly add/remove CSS classes to trigger transitions
3. Use `setTimeout` to choreograph the sequence
4. Only call `glassRender` after the animation is complete (or suppress it with a flag)

**Examples in this codebase:**
- `glassChipSelect()` — never calls `glassRender`; manipulates live DOM directly
- `glassAnimateToCompose()` — rebuilds HTML only after rows have exited (t=220ms), and hides all new elements with `style.opacity = '0'` before fading them in one by one

---

## 3. Forcing CSS Transitions on Existing Elements (rAF Trick)

When an element already has a class and you want to re-trigger its transition (or trigger it on a freshly inserted element):

```js
el.classList.remove('active-class');
void el.offsetHeight;   // force reflow — CRITICAL, do not skip
requestAnimationFrame(() => el.classList.add('active-class'));
```

Without `void el.offsetHeight`, the browser batches the remove+add and no transition fires. This is used for the blue shadow fade-in on the input field every time compose mode is entered.

---

## 4. CSS Transitions: Same-Layer-Count Rule for box-shadow

**CSS cannot interpolate between `box-shadow: none` and a multi-layer shadow.** It also cannot interpolate between shadows with different numbers of layers.

**Fix:** Define the base state with the same number of layers as the active state, but with `rgba(..., 0)` (fully transparent):

```css
/* Base — transparent but same structure */
.g-listen-field {
  box-shadow:
    inset 0 -6px 6px -2px rgba(35,101,255,0),
    inset 0 -15px 20px -6px rgba(255,255,255,0),
    inset 0 -15px 20px -6px rgba(230,229,247,0),
    inset 0 -70px 60px -30px rgba(19,75,192,0);
}
/* Active — same layers, non-zero alpha */
.g-listen-field.compose-input {
  box-shadow:
    inset 0 -6px 6px -2px rgba(35,101,255,0.15),
    inset 0 -15px 20px -6px rgba(255,255,255,0.5),
    inset 0 -15px 20px -6px rgba(230,229,247,0.5),
    inset 0 -70px 60px -30px rgba(19,75,192,1);
}
```

Same rule applies to `background`: use `linear-gradient` in both states (not `rgba()` in one and `linear-gradient()` in the other) or the browser can't interpolate.

---

## 5. Choreography Timing Template

When building a multi-step entrance animation (content appearing after a container morph), use this timing scaffold relative to the 600ms container morph:

| Time | Action |
|------|--------|
| t=0ms | Start container morph. Begin exit animations on outgoing elements. |
| t=200–250ms | Rebuild DOM (if needed). Hide all incoming elements with `style.opacity = '0'`. |
| t=270–300ms | First content element fades in (header, primary info). |
| t=370–400ms | Second tier fades/staggers in (chips, list items). |
| t=450–480ms | Third tier fades in (input field, secondary content). |
| t=550–580ms | Final detail fades in (blue shadow, controls overlay, checkmark). |

This keeps everything within the container's 600ms morph window. Nothing should appear before the container starts moving, and nothing should appear more than ~150ms after the container finishes.

---

## 6. Staggered List Animations

For lists (chips, contact rows), stagger entrance/exit like this:

**Entrance (chips):**
```js
chips.forEach((el, i) => {
  el.style.animationDelay = `${i * 70}ms`;
  el.classList.add('chip-enter');
});
```

**Exit (contact rows, chips):**
```js
rows.forEach((el, i) => {
  el.style.animationDelay = `${i * 25}ms`;
  el.classList.add('g-row-exit');
});
```

Exit stagger is tighter (25ms) than entrance stagger (70ms). Exits should feel quick and unified; entrances can breathe more.

For chip exit after selection: the selected chip exits first (delay=0), others stagger outward by distance:
```js
const delay = i === idx ? 0 : 40 + Math.abs(i - idx) * 30;
```

---

## 7. Deferred Controls / Overlay Appearance

Never show a floating control (checkmark, action buttons) at the same time the container is morphing — they will visually fight. Always delay the control appearance until the container animation is ~90% complete.

**Checkmark after chip select:** t=560ms (container morph starts at t=0, takes 600ms).

To force a CSS `@keyframes` animation on a freshly built element (instead of a transition), reset the controls mode so HTML is rebuilt fresh:
```js
glassControlsMode = ''; // force fresh build so animation fires
renderGlassControlsOverlay();
```

The `#glass-controls-layer` has `opacity: 0 → 1` on `.visible` class (250ms transition) so controls always fade in, never snap.

---

## 8. Enter vs Exit Animation Speeds

Exits are faster than entrances. This is a core motion principle.

| Event | Duration |
|-------|----------|
| Element exit (row, chip) | 200–320ms |
| Intent header exit | 200ms |
| Container morph | 600ms |
| Element entrance | 500ms |
| Blue shadow fade-in | 400ms |
| Controls overlay fade | 250ms |

**Intent header specifically:** enters at 600ms (slow, intentional), exits at 200ms (snappy, gets out of the way). Use an `.exiting` class to override the transition:
```css
#intent-header.exiting {
  opacity: 0;
  transform: translateY(-12px);  /* float UP on exit */
  transition: opacity 200ms cubic-bezier(0.35,0.23,0.13,0.98),
              transform 200ms cubic-bezier(0.35,0.23,0.13,0.98);
}
```
Remove `.visible` AND add `.exiting` — both are needed. `.visible` sets `opacity: 1` via a later CSS rule; without removing it, `.exiting` won't win the cascade.

---

## 9. Exit Direction Convention

- Elements that are being **replaced** or **superseded**: exit upward (`translateY(-6px)` to `-12px`)
- Elements that are **collapsing** (chips wrap, accordion): collapse in-place via `max-height → 0`
- Elements that are **dismissed**: exit downward or fade only
- Selected items: scale down (`scale(0.82)`) + fade — signals "consumed"

---

## 10. Selection State: Selected = Brighter, Not Darker

A selected item must be **more visible** than unselected. Common mistake: making selected state have lower opacity/brightness than the default hover state.

```css
/* WRONG */
.g-chip { background: rgba(255,255,255,0.085); }
.g-chip.selected { background: rgba(255,255,255,0.05); } /* dimmer — wrong */

/* CORRECT */
.g-chip { background: rgba(255,255,255,0.04); }
.g-chip.selected {
  background: rgba(255,255,255,0.10);
  box-shadow: inset 0 0 20px rgba(255,255,255,0.15);
}
```

---

## 11. Font Weight Transitions

`font-weight` only transitions smoothly if the font is loaded as a **variable font** with a weight range axis.

```html
<!-- Variable font — smooth weight transition -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet"/>
```

Without the range syntax (`wght@0,9..40,100..1000`), the browser loads discrete weights and `transition: font-weight` snaps instead of interpolating.

---

## 12. Vertical Centering in Absolutely Positioned Containers

When a container uses `position: absolute` with `bottom: Xpx; height: auto; top: auto` (like `#c-rich.glass-active`), `justify-content: center` has no effect — the container height equals content height, leaving no space to center within.

To make content truly center inside such a container, override to full inset:
```css
#c-rich.glass-sent {
  top: 0; bottom: 0; left: 0; right: 0;
  height: auto;
  justify-content: center;
  align-items: center;
}
```

This restores the container to full-height mode so centering works.

---

## 13. Measuring Content Height Before DOM Rebuild

When you need to morph the container to the correct size for new content *before* the new content is in the live DOM:

1. Use the off-screen measure layer (`#glass-measure-layer`, `width: 380px`, `position: fixed`, off-screen)
2. Set `layer.innerHTML = buildGlassContent()` with state already updated
3. Measure `[data-glass-body]` using `Math.ceil(Math.max(getBoundingClientRect().height, offsetHeight, scrollHeight))`
4. Pass to `glassDynamicGeo(shape, contentH)` → `morphTo(..., geo)`

This lets you start the container morph at t=0 while the live DOM still shows the old content, avoiding a frame where the container jumps to the new size with no content inside.

---

## 14. Suppressing Automatic Animations During Manual Choreography

When manually choreographing a transition (bypassing `glassRender`), suppress auto-triggered animations with a flag:

```js
let glassManualComposeEntry = false;

// In glassRender:
const _enteringCompose = glassUi.state === GS.COMPOSE
  && glassPrevState !== GS.COMPOSE
  && !glassManualComposeEntry;  // ← guard
```

Also set `glassPrevState = GS.COMPOSE` before starting the manual sequence to prevent the normal enter animation from firing if `glassRender` is called mid-sequence.

---

## 15. CSS Cascade Gotcha: Class Order Matters

When two classes set the same property, the one **declared later in the stylesheet** wins (assuming equal specificity). Always check order when overriding:

```css
/* If .visible comes AFTER .exiting in the file, .visible wins — wrong */
#intent-header.exiting { opacity: 0; }   /* line 212 */
#intent-header.visible { opacity: 1; }   /* line 238 — wins, breaks the exit */
```

Fix: remove the dominant class from the element in JS before adding the override class.

---

## 16. All New Content Animations Must Match the Container

Any element that animates in/out as part of a container morph must use the same `600ms cubic-bezier(0.35,0.23,0.13,0.98)` as the container transitions. Mismatched easing/duration makes content feel detached from its shell.

Checklist when adding a new animated element:
- [ ] Duration: 500–600ms (entrance), 200–320ms (exit)
- [ ] Easing: `cubic-bezier(0.35,0.23,0.13,0.98)`
- [ ] Does not appear before the container starts moving
- [ ] Does not appear more than ~150ms after the container finishes
- [ ] Does not fight a concurrent morph (defer controls by ~560ms)
