# Reliability

Reliability means the prototype has deterministic routes, fallback UI, and recoverable local state.

## Runtime Expectations

- `npm run start` starts `server.mjs`.
- `/` and `/prototype` serve `index.html`.
- `/ai` serves `ai.html`.
- `/bubble` and `/bubble2` serve `bubble.html`.
- Static path resolution must stay inside the repo root.

## API/Fallback Expectations

- Browser code calls local APIs, not provider APIs directly.
- AI provider failures must not leave a blank UI.
- Voice interactions must have typed/click alternatives.
- Phrase config should keep defaults when disk reads fail.

## Known Risks

- SpeechRecognition and microphone analysis are browser-dependent.
- localStorage parse failures are mostly silent.
- Visual regressions are not fully automated.
- Smoke timing may be stale for delayed double-click rename behavior.
