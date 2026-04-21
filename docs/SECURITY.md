# Security

GenUI is a local prototype, but server/API boundaries still matter.

## Secrets

- Provider API keys must remain server-side.
- Browser modules must call local API routes instead of provider endpoints directly.
- `.env` is loaded by `server.mjs`; do not expose it through static routes.

## Static Serving

- `safePath()` must prevent directory traversal.
- Route aliases should resolve only to known HTML files.
- Do not add arbitrary filesystem read routes.

## API Boundaries

- Request bodies are capped by `MAX_BODY_BYTES`.
- CORS is limited to `/api/*`.
- Provider-specific request formats belong in `server.mjs`.

## Follow-Up

- Document exact `.env` variables in `docs/references/`.
- Add route inventory checks so aliases cannot drift from existing files.
