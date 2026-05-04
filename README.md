# GenUI

Two-page generative UI tool for designers:
- `index.html` for prototype/editor workflows
- `ai.html` for AI interaction workflows

## Run

```bash
npm run start
```

Open:
- `http://localhost:5173/` (prototype page)
- `http://localhost:5173/ai` (AI page)
- `http://localhost:5173/bubble` (bubble demo)

## Current Workflow

- Create, duplicate, and delete scenarios in the sidebar.
- Edit scenario name, future AI trigger phrases, shape, icon, and text content.
- Tune icon, primary, secondary, and detail text size and color per scenario.
- Upload a PNG to replace the default emoji icon.
- Toggle the blurred background image on or off.
- In AI page, use input + stage override (`Auto`, `Dot`, `Pill`, `Card`) for preview generation.
- Scenario data, canvas settings, mode, and AI stage override persist in browser `localStorage`.

## Customizing Thinking Stream Text

The prototype page (`index.html`) has a thinking/skill debug panel that streams animated text in the orb while in thinking mode. Engineers can customize what text appears for thinking verbs, agent transitions, and skill phrases directly in [`src/tool/modules/manual-bindings.js`](src/tool/modules/manual-bindings.js).

### Thinking verbs (base thinking mode)

When the orb shape is `magic` and mode is `thinking`, the stream cycles through `THINKING_VERBS` — a plain array of single-word present-participle strings. To add or change verbs, edit the array:

```js
const THINKING_VERBS = [
  'Waffling',
  'Spiraling',
  'Overthinking',
  // add your own here
];
```

Each verb is typed in, held for ~2.2 seconds, then deleted before the next one appears.

### Agent mode text

When the orb switches to `agent-circle` shape, a `"Switching to [Agent Name]"` label types in first, then the agent name persists as the stream text. The label comes from the agent's `label` field in `AI_ORB_ICON_OPTIONS` (`src/shared/ai-orb-icon.js`):

```js
export const AI_ORB_ICON_OPTIONS = Object.freeze({
  bixby:  { id: 'bixby',  label: 'Bixby',  ... },
  gemini: { id: 'gemini', label: 'Gemini', ... },
  chatgpt:{ id: 'chatgpt',label: 'ChatGPT',...  },
});
```

To add a new agent, add an entry to `AI_ORB_ICON_OPTIONS` with `id`, `label`, `src` (icon image path), and a `theme` block with four `rgb(...)` color values.

### Domain mode phrases

In the prototype thinking debug UI, the visible mode label is `domain`. Internally, it still uses the `skill` mode key and `skill-pill` render shape.

When the orb shape is `skill-pill`, the stream cycles through that domain agent's `phrases` array. Domain agents are defined in `PROTOTYPE_SKILLS` inside `manual-bindings.js`. Each entry has:

```js
{
  id: 'budget',             // unique identifier
  label: 'Budget Agent',    // shown in the domain chip
  src: 'assets/agents/orange.png', // Bubble Home domain image
  theme: {                  // orb glow colors
    blobTopCore:    'rgb(...)',
    blobTopEdge:    'rgb(...)',
    blobBottomCore: 'rgb(...)',
    blobBottomEdge: 'rgb(...)',
  },
  phrases: [
    'Checking the monthly burn',
    'Looking for hidden subscriptions',
    // add more phrases here — they cycle in order
  ],
}
```

To add a new domain agent, append a new object to `PROTOTYPE_SKILLS` following the same shape. Phrases cycle in order and loop. Each phrase is held for ~2.2 seconds before transitioning to the next.

When switching between domain agents, the stream first shows `"Using [domain] skill"` (held for 3 seconds), then begins the phrase loop for the new selection. When entering domain mode fresh (not a switch), phrases start immediately with no transition label.

### Pause and resume debug playback

The prototype thinking debug panel also includes `Pause` and `Resume` controls for `thinking`, `skill`, `agent`, and `app` states.

- `Pause` cancels the active typing loop, keeps the current debug visual state active, and replaces the stream with a static paused badge such as `Paused thinking` or `Paused · Budget Agent`.
- While paused, agent/app switches and domain rerolls still morph and animate normally, but no transition copy or phrase loop restarts until `Resume`.
- If you hit `Fire` while paused, the custom text is queued instead of typed immediately. That queued text plays once on `Resume`, then the active mode continues its normal behavior.
- Leaving the debug-family shapes clears the paused state and any queued paused custom text.

### Thinking-orb minimize toggle

When the orb shape is `magic` and the prototype debug mode is `thinking`, clicking the orb or pressing `m` toggles a local minimized state.

- Minimized scales the shared orb visual to `0.4` using a bottom-center anchor, so it settles downward instead of shrinking toward the middle.
- The thinking stream stays mounted but fades out during the minimized state, then fades back in when you click the orb again.
- Leaving prototype `thinking` mode clears the minimized state automatically.

### How the stream works internally

All thinking stream animation runs through `runThinkingTextLoop`, which accepts:

| option | type | description |
|---|---|---|
| `initialText` | `string` | typed in first, held 3 s, then deleted before the loop starts |
| `items` | `string[]` | static list to cycle through (alternative to `nextText`) |
| `indexKey` | `string` | key on `thinkingDebugState` used to track the current index |
| `holdMs` | `number` | ms each phrase is held after typing (default 2200) |
| `shouldContinue` | `() => boolean` | loop exits when this returns false |
| `nextText` | `() => string` | function returning the next phrase (alternative to `items`) |

The stream is token-gated — any new call to `runThinkingTextLoop` or `transitionThinkingText` cancels the previous animation immediately by incrementing `thinkingDebugState.streamToken`.

## Architecture Notes

- Rendering is driven by a normalized scenario object with `shape`, `content`, and `triggers`.
- Prototype and AI pages share the same scenario/stage data model and storage keys.
- Each page is mode-locked using `data-page-mode` (`manual` for `index.html`, `ai` for `ai.html`) to avoid cross-mode editing conflicts.
- AI page currently uses a frontend Gauss adapter stub (placeholder for real API integration) and falls back to manual matching on AI errors.
- The Node server remains available for local hosting and future provider integrations.
- Agent context starts in `AGENTS.md`, `ARCHITECTURE.md`, and `docs/PLANS.md`.
- Build and design guardrails are defined in `docs/FRONTEND.md` and `docs/DESIGN.md`.
