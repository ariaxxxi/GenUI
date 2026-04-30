# Generated Data Schema

This project does not use a relational database.

## Browser Storage

Primary state lives in browser storage through `src/app-state.js`.

LocalStorage keys:

- `genui.scenarios.v1`
- `genui.scenarios-revision.v1`
- `genui.stages.v1`
- `genui.settings.v1`
- `genui.mode.v1`
- `genui.ai-stage.v1`
- `genui.ai-voice-enabled.v1`
- `genui.disable-text-input.v1`

IndexedDB durable mirror:

- Database: `genui-durable.v1`
- Store: `records`

## Server State

- Phrase config is read/written at `ref/ai-phrases.json`.
- TTS cache is in-memory only.
