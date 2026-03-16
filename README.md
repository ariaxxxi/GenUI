# GenUI

Single-file UI with a small backend proxy for AI API calls.

## Run

1. Copy env template:

```bash
cp .env.example .env
```

2. Set your key/provider in `.env`.

3. Start server:

```bash
npm run start
```

4. Open:

```text
http://localhost:5173
```

## Environment Variables

- `PORT` server port (default `5173`)
- `AI_PROVIDER` one of `openai`, `anthropic`, `openai-compatible`
- `AI_API_KEY` your provider key (required)
- `AI_MODEL` model name (provider-specific)
- `AI_ENDPOINT` optional custom endpoint for `openai-compatible`
- `ANTHROPIC_VERSION` optional Anthropic version (default `2023-06-01`)

## Frontend Provider Config

Frontend defaults to OpenAI via local proxy:

- `provider: openai`
- `useProxy: true`
- `endpoint: /api/ai-route`

You can override at runtime in the browser console:

```js
window.GENUI_AI_CONFIG = {
  provider: 'openai-compatible',
  model: 'gpt-4.1-mini',
  endpoint: '/api/ai-route',
  useProxy: true
};
```

## Notes

- API keys stay on the server in environment variables.
- Do not put production keys into frontend JavaScript.
