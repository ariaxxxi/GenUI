# ARCHITECTURE.md
> Describes the current system design. Read this before touching any rendering or data code.

## Two-Page Split

| Page | Mode key | Role |
|---|---|---|
| `index.html` | `manual` | Designer manually edits scenarios; no AI calls |
| `ai.html` | `ai` | Alice chat assistant; AI drives shape transitions |

Both pages use `data-page-mode` attribute to lock themselves and prevent cross-mode writes. They share the same localStorage schema and the same shape/stage model.

## Shape System (`src/shapes.js`)
All shapes are defined here — do not hardcode shape params in HTML files.

**Supported shapes:** `idle`, `dot`, `pill`, `card`, `card-s`, `image`, `ai`, `circle`, `magic`, `split`, `card-form`, `card-list`

Each shape definition has:
```js
{
  width, height,        // px dimensions
  borderRadius,         // px
  transform,            // CSS transform string
  opacity               // 0–1
}
```

Stage components toggled per-scenario per-shape: `icon`, `primary`, `secondary`, `detail`, `image`

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

Scenario-stage settings are **fully independent** — changing one scenario's stage must never affect another.

## LocalStorage Keys
```
STORAGE_KEYS.scenarios   → scenario array
STORAGE_KEYS.stages      → stage definitions
STORAGE_KEYS.settings    → canvas settings (frame mode, etc.)
STORAGE_KEYS.mode        → 'manual' | 'ai'
STORAGE_KEYS.aiStage     → override stage selected in AI mode
```

## Server (`server.mjs`)
Node.js native HTTP server, no frameworks.

**Routes:**
- `POST /api/ai` — Main AI proxy. Body: `{userText, systemPrompt, provider, model, maxTokens}`
- `POST /api/gemini` — Gemini-specific with 3-attempt retry backoff [0, 200, 800]ms
- Everything else → static file from repo root

**Provider support:**
| Provider | Env vars needed |
|---|---|
| openai | `AI_API_KEY`, optionally `AI_ENDPOINT` (for OpenRouter etc.) |
| anthropic | `AI_API_KEY`, optionally `ANTHROPIC_VERSION` |
| gemini | `AI_API_KEY` |

Default model: `gpt-4.1-mini`. Anthropic default: `claude-sonnet-4-20250514`. Gemini default: `gemini-2.0-flash`.

## Frame Modes
- **Glasses**: 420×420px — UI must stay fully inside, no crop
- **Phone**: 390×838px — scrollable content area

The glasses border is a visual-only stroke (not a clip mask), so all content must self-constrain to 420px width. See `BUILD_RULES.md`.

## AI Interaction Flow (ai.html — Flight Demo)
```
Destination → Dates → Passengers → Thinking (magic) → Choose flight → Confirm → Payment → Booked
```
Each step maps to a specific shape. The AI response drives which step/shape renders next. Fallback UI renders deterministically if the AI provider is unavailable or returns an error.

## Coding Conventions
- **No frameworks** — vanilla JS, HTML, CSS only
- **ES modules** everywhere (`type: "module"` in package.json)
- **No bundler** — files served as-is from server.mjs
- Typography sizes constrained to 12–96px range (hard rule)
- Shapes and stages normalized via `src/shapes.js` — never inline shape math
- `FluidUI.html` is reference only — never import from or copy-paste to it
