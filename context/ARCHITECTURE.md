# ARCHITECTURE.md
> Describes the current system design. Read this before touching any rendering or data code.

## Product Summary
GenUI is a generative UI prototyping tool for designers. It lets designers create interactive UI scenarios and preview how a generative/AI-driven UI would transition between shapes and states.

Two distinct surfaces:
- **Manual editor** (`index.html`) — designer creates and edits scenarios by hand
- **AI interaction** (`ai.html`) — live flight booking chatbot demo powered by Gemini (with deterministic fallback)

---

## Two-Page Split

| Page | Mode key | Role |
|---|---|---|
| `index.html` | `manual` | Designer manually edits scenarios; no AI calls |
| `ai.html` | `ai` | Alice chat assistant; AI drives shape transitions |

Both pages set `data-page-mode` attribute to lock themselves and prevent cross-mode localStorage writes. They share the same schema and shape/stage model.

---

## Shape System (`src/shapes.js`)
Single canonical ES module — do not hardcode shape params in HTML files.

**Supported shapes:** `idle`, `dot`, `pill`, `card`, `card-s`, `image`, `ai`, `circle`, `magic`, `split`, `card-form`, `card-list`

Each shape definition has `main`, `left`, `right` variants:
```js
{ w, h, br, tx, ty, op }  // width, height, borderRadius, x-transform, y-transform, opacity
```

Key exports: `SHAPES`, `defaultTypographyForShape()`, `normalizeTypography()`, `normalizeStage()`, `normalizeIcon()`, `normalizeImagesByShape()`, `configureShapeHelpers()`

Stage components toggled per-scenario per-shape: `icon`, `primary`, `secondary`, `detail`, `image`

`src/shapes.legacy.js` — copy for `file://` loading (no ES module support); keep in sync manually.

---

## Data Models

### Scenario
```js
{
  id: string,
  name: string,
  shape: ShapeName,
  triggers: string[],          // AI trigger phrases
  icon: { kind: 'emoji'|'image'|'none', value: string },
  text: { primary, secondary, detail },
  typography: {
    icon: { size, color },
    primary: { size, color },
    secondary: { size, color },
    detail: { size, color }
  },
  images: { [shape]: string[] },           // per-shape image galleries
  stageOverrides: { [shape]: StageConfig } // per-scenario, fully independent
}
```

### Stage (built-in presets, then copied per-scenario)
```js
{
  id, name,
  preset: boolean,
  renderShape: ShapeName,
  cornerRadius: 0–120,
  widthOverride: null | 40–1400,
  heightOverride: null | 40–1400,
  iconTextGap: null | 0–80,
  iconLeftPadding: null | 0–120,
  phoneBgBlur: boolean,
  components: ['icon','primary','secondary','detail','image']
}
```

**Scenario-stage settings are fully independent** — changing one scenario's stage must never affect another.

---

## LocalStorage Keys
```
STORAGE_KEYS.scenarios   → scenario array
STORAGE_KEYS.stages      → stage definitions
STORAGE_KEYS.settings    → canvas settings (frame mode, etc.)
STORAGE_KEYS.mode        → 'manual' | 'ai'
STORAGE_KEYS.aiStage     → override stage selected in AI mode
```

No error boundary for full or corrupted localStorage — silent failure is a known gap.

---

## Server (`server.mjs`)
Node.js native HTTP, no frameworks, 367 lines.

**Routes:**
- `POST /api/ai` — Main AI proxy. Body: `{userText, systemPrompt, provider, model, maxTokens}`
- `POST /api/gemini` — Gemini-specific with 3-attempt retry backoff [0, 200, 800]ms
- `GET /` or `/prototype` → `index.html`
- `GET /ai` → `ai.html`
- Everything else → static file from repo root

**Provider support:**
| Provider | Default model | Env vars |
|---|---|---|
| `gemini` (default) | `gemini-2.0-flash` | `AI_API_KEY` or `GEMINI_API_KEY` |
| `openai` | `gpt-4.1-mini` | `AI_API_KEY`, optionally `AI_ENDPOINT` |
| `anthropic` | `claude-sonnet-4-20250514` | `AI_API_KEY`, optionally `ANTHROPIC_VERSION` |

`safePath()` prevents directory traversal. CORS enabled for API routes. Fallback port 5174 if 5173 is in use.

---

## Frame Modes
- **Glasses**: 420×420px — UI must stay fully inside, no crop. Border is visual-only (CSS box-shadow), not a clip mask. Content must self-constrain.
- **Phone**: 390×838px — scrollable content area, actual `overflow:hidden` clip. Optional blurred background image.

See `BUILD_RULES.md` for hard constraints on glasses overflow.

---

## AI Interaction Flow (ai.html — Flight Demo)
```
Destination → Dates → Passengers → Thinking (magic) → Choose flight → Confirm → Payment → Booked
```

State tracked in `flightUi` object: `{active, stepIndex, data, editReturnStepIndex, focused}`

AI response format: `{reply, action: "next|update|select|stay|back", data: {}}`

Fallback: `localFlightFallback()` renders deterministic flight UI when AI unavailable. Required — blank screen on live demo is unacceptable.

---

## Coding Conventions
- **No frameworks** — vanilla JS, HTML, CSS only
- **ES modules** everywhere (`type: "module"` in package.json)
- **No bundler** — files served as-is from `server.mjs`
- Typography sizes: 12–96px (hard clamped), colors: `#rrggbb` hex only
- Shape/stage math goes in `src/shapes.js` — never inline in HTML files
- `ref/FluidUI.html` is stale reference — never import from or modify it

---

## Testing
- `test/smoke.mjs` — Playwright E2E; validates `ai.html` loads, chip exists, shape animates on click
- Can self-host `server.mjs` on a free port or target `SMOKE_BASE_URL` env var
- No smoke test for `index.html` yet (known gap)
