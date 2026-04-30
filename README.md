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

### Skill mode phrases

When the orb shape is `skill-pill`, the stream cycles through that skill's `phrases` array. Skills are defined in `PROTOTYPE_SKILLS` inside `manual-bindings.js`. Each skill entry has:

```js
{
  id: 'budget',             // unique identifier
  label: 'Budget Agent',    // shown as "Switching to Budget Agent" on skill switch
  emoji: '💸',              // displayed in the skill chip
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

To add a new skill, append a new object to `PROTOTYPE_SKILLS` following the same shape. Phrases cycle in order and loop. Each phrase is held for ~2.2 seconds before transitioning to the next.

When switching between skills, the stream first shows `"Switching to [skill.label]"` (held for 3 seconds), then begins the phrase loop for the new skill. When entering skill mode fresh (not a switch), phrases start immediately with no transition label.

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
