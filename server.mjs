import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';

const ROOT = process.cwd();
const MAX_BODY_BYTES = 256 * 1024;
const TTS_CACHE = new Map();
const TTS_IN_FLIGHT = new Map();
const PHRASES_PATH = join(ROOT, 'ref', 'ai-phrases.json');

async function loadEnvFile() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) continue;
    const i = clean.indexOf('=');
    if (i <= 0) continue;
    const k = clean.slice(0, i).trim();
    let v = clean.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

await loadEnvFile();
const PORT = Number(process.env.PORT || 5173);
const BASE_URL = String(process.env.BASE_URL || '');

function stripBaseUrl(path) {
  if (!BASE_URL || !path.startsWith(BASE_URL)) return path;
  return path.slice(BASE_URL.length);
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function pickProvider(reqBodyProvider) {
  return String(reqBodyProvider || process.env.AI_PROVIDER || 'gemini').toLowerCase();
}

const DEFAULT_PHRASES = {
  disambiguate_found_two: 'I found 2 hiro in your contact list, which one do you mean?',
  compose_prompt: 'What would you like to say?',
  confirm_message_to: 'Confirm message to {{name}}.',
  confirm_ready_send: 'Ready to send?',
  edit_message: 'Edit your message.',
  contact_not_found: 'Contact not found.',
};

async function loadPhrasesFromDisk() {
  if (!existsSync(PHRASES_PATH)) return { ...DEFAULT_PHRASES };
  try {
    const raw = await readFile(PHRASES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PHRASES };
    return { ...DEFAULT_PHRASES, ...parsed };
  } catch {
    return { ...DEFAULT_PHRASES };
  }
}

async function savePhrasesToDisk(nextPhrases) {
  const normalized = { ...DEFAULT_PHRASES, ...(nextPhrases || {}) };
  await writeFile(PHRASES_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function callAnthropic({ apiKey, model, maxTokens, systemPrompt, userText, anthropicVersion }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error?.type || `Anthropic ${res.status}`);
  }
  return data?.content?.find((b) => b.type === 'text')?.text || '{}';
}

async function callOpenAI({ endpoint, apiKey, model, maxTokens, systemPrompt, userText }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error?.type || `OpenAI ${res.status}`);
  }
  return data?.choices?.[0]?.message?.content || '{}';
}

async function callGemini({ apiKey, model, maxTokens, systemPrompt, userText }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const prompt = `${systemPrompt ? `${systemPrompt}\n\n` : ''}${userText}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `Gemini ${res.status}`;
    throw new Error(message);
  }
  return data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') || '{}';
}

async function callGeminiTTS({ apiKey, model, text, voiceName }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
      model,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `Gemini TTS ${res.status}`;
    throw new Error(message);
  }
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data);
  const audioBase64 = part?.inlineData?.data || '';
  const mimeType = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';
  if (!audioBase64) throw new Error('Gemini TTS returned no audio');
  return { audioBase64, mimeType };
}

function ttsCacheKey({ model, voiceName, text }) {
  return `${String(model || '')}::${String(voiceName || '')}::${String(text || '').trim()}`;
}

async function getGeminiTtsCached({ apiKey, model, voiceName, text, forceRefresh = false }) {
  const key = ttsCacheKey({ model, voiceName, text });
  if (!forceRefresh) {
    const cached = TTS_CACHE.get(key);
    if (cached) return cached;
  }
  if (forceRefresh) TTS_CACHE.delete(key);
  const inFlight = TTS_IN_FLIGHT.get(key);
  if (inFlight) return inFlight;
  const task = callGeminiTTS({ apiKey, model, text, voiceName })
    .then((payload) => {
      TTS_CACHE.set(key, payload);
      return payload;
    })
    .finally(() => {
      TTS_IN_FLIGHT.delete(key);
    });
  TTS_IN_FLIGHT.set(key, task);
  return task;
}

async function handleAiRoute(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    json(res, 400, { error: String(err.message || err) });
    return;
  }

  const provider = pickProvider(body.provider);
  const apiKey = String(process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    json(res, 500, { error: 'Missing AI_API_KEY on server' });
    return;
  }

  const userText = String(body.userText || '').trim();
  const systemPrompt = String(body.systemPrompt || '').trim();
  const maxTokens = Math.max(32, Math.min(2000, Number(body.maxTokens || 300)));

  if (!userText) {
    json(res, 400, { error: 'Missing userText' });
    return;
  }

  try {
    let text;
    if (provider === 'gemini') {
      text = await callGemini({
        apiKey,
        model: String(body.model || process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-2.0-flash'),
        maxTokens,
        systemPrompt,
        userText,
      });
    } else if (provider === 'anthropic') {
      text = await callAnthropic({
        apiKey,
        model: String(body.model || process.env.AI_MODEL || 'claude-sonnet-4-20250514'),
        maxTokens,
        systemPrompt,
        userText,
        anthropicVersion: String(process.env.ANTHROPIC_VERSION || '2023-06-01'),
      });
    } else if (provider === 'openai' || provider === 'openai-compatible') {
      const endpoint = String(
        process.env.AI_ENDPOINT ||
          'https://api.openai.com/v1/chat/completions'
      );
      text = await callOpenAI({
        endpoint,
        apiKey,
        model: String(body.model || process.env.AI_MODEL || 'gpt-4.1-mini'),
        maxTokens,
        systemPrompt,
        userText,
      });
    } else {
      json(res, 400, { error: `Unsupported provider: ${provider}` });
      return;
    }

    json(res, 200, { text, provider });
  } catch (err) {
    json(res, 502, { error: String(err.message || err) });
  }
}

async function handleGeminiRoute(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    json(res, 400, { error: String(err.message || err), code: 'INVALID_REQUEST' });
    return;
  }
  const apiKey = String(process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
  if (!apiKey) {
    json(res, 500, { error: 'Missing GEMINI_API_KEY on server', code: 'MISSING_CONFIG' });
    return;
  }
  const userText = String(body.userText || '').trim();
  const systemPrompt = String(body.systemPrompt || '').trim();
  if (!userText) {
    json(res, 400, { error: 'Missing userText', code: 'INVALID_REQUEST' });
    return;
  }

  // retry for transient errors
  const maxAttempts = 3; // initial + 2 retries
  const backoffs = [0, 200, 800];
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const text = await callGemini({
        apiKey,
        model: String(body.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'),
        maxTokens: Math.max(32, Math.min(2000, Number(body.maxTokens || 300))),
        systemPrompt,
        userText,
      });

      // try to extract inner JSON object from text
      const raw = String(text || '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        // return normalized envelope indicating parse failure
        json(res, 200, { text: raw, provider: 'gemini', parse_ok: false });
        return;
      }
      // return the inner JSON text as the canonical 'text' field
      json(res, 200, { text: match[0], provider: 'gemini', parse_ok: true });
      return;
    } catch (err) {
      attempt += 1;
      const msg = String(err?.message || err || 'Unknown');
      // transient statuses/messages heuristic: 429, 502, 503, 504 in message
      if (/(429|502|503|504)/.test(msg) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoffs[attempt] || 400));
        continue; // retry
      }
      // map some known messages to codes
      const code = msg.includes('quota') ? 'QUOTA_EXCEEDED' : (/(429|502|503|504)/.test(msg) ? 'GEMINI_RETRY_FAILED' : 'GEMINI_ERROR');
      json(res, 502, { error: msg, code });
      return;
    }
  }
  json(res, 502, { error: 'Upstream retries exhausted', code: 'GEMINI_RETRY_FAILED' });
}

async function handleTtsRoute(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    json(res, 400, { error: String(err.message || err), code: 'INVALID_REQUEST' });
    return;
  }

  const apiKey = String(process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
  if (!apiKey) {
    json(res, 500, { error: 'Missing GEMINI_API_KEY on server', code: 'MISSING_CONFIG' });
    return;
  }

  const text = String(body.text || '').trim();
  if (!text) {
    json(res, 400, { error: 'Missing text', code: 'INVALID_REQUEST' });
    return;
  }
  if (text.length > 1200) {
    json(res, 400, { error: 'Text too long for TTS request', code: 'INVALID_REQUEST' });
    return;
  }

  try {
    const model = String(body.model || process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts');
    const voiceName = String(body.voiceName || process.env.GEMINI_TTS_VOICE || 'Kore');
    const forceRefresh = body.forceRefresh === true;
    const { audioBase64, mimeType } = await getGeminiTtsCached({ apiKey, model, text, voiceName, forceRefresh });
    json(res, 200, {
      audioBase64,
      mimeType,
      sampleRate: 24000,
      provider: 'gemini-tts',
      model,
      voiceName,
    });
  } catch (err) {
    json(res, 502, { error: String(err.message || err), code: 'TTS_ERROR' });
  }
}

async function handlePhrasesGet(_req, res) {
  const phrases = await loadPhrasesFromDisk();
  json(res, 200, { phrases });
}

async function handlePhrasesSave(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    json(res, 400, { error: String(err.message || err), code: 'INVALID_REQUEST' });
    return;
  }
  const updates = body?.phrases;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    json(res, 400, { error: 'Missing phrases object', code: 'INVALID_REQUEST' });
    return;
  }
  const current = await loadPhrasesFromDisk();
  const merged = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    if (typeof key !== 'string' || !key.trim()) continue;
    if (typeof value !== 'string') continue;
    merged[key] = value;
  }
  try {
    const saved = await savePhrasesToDisk(merged);
    json(res, 200, { phrases: saved });
  } catch (err) {
    json(res, 500, { error: String(err.message || err), code: 'SAVE_FAILED' });
  }
}

async function prewarmTtsCache() {
  const apiKey = String(process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
  if (!apiKey) return;
  const model = String(process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts');
  const voiceName = String(process.env.GEMINI_TTS_VOICE || 'Kore');
  const phrases = [
    'I found 2 hiro in your contact list, which one do you mean?',
    'What would you like to say?',
  ];
  await Promise.allSettled(
    phrases.map((text) => getGeminiTtsCached({ apiKey, model, voiceName, text }))
  );
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

function safePath(urlPath) {
  const clean = urlPath.split('?')[0].split('#')[0] || '/';
  const target = clean === '/'
    ? '/index.html'
    : (clean === '/prototype'
      ? '/index.html'
      : (clean === '/ai'
        ? '/ai.html'
        : (clean === '/bubble'
          ? '/bubble2.html'
          : (clean === '/bubble2' ? '/bubble2.html' : clean))));
  const rel = normalize(target)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^[/\\]+/, '');
  const full = resolve(ROOT, rel);
  if (!full.startsWith(resolve(ROOT))) return null;
  return full;
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, 'Bad Request');
    return;
  }

  // Strip BASE_URL prefix for Serval deployment
  const urlPath = stripBaseUrl(req.url);

  const isApiRoute = urlPath.startsWith('/api/');
  if (isApiRoute) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (isApiRoute && req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes - handle both bare and prefixed paths
  if (req.method === 'POST' && urlPath.startsWith('/api/ai-route')) {
    await handleAiRoute(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath.startsWith('/api/gemini')) {
    await handleGeminiRoute(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath.startsWith('/api/tts')) {
    await handleTtsRoute(req, res);
    return;
  }
  if (req.method === 'GET' && urlPath.startsWith('/api/phrases')) {
    await handlePhrasesGet(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath.startsWith('/api/phrases')) {
    await handlePhrasesSave(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  // SPA fallback for Serval deployment - scoped to BASE_URL
  if (BASE_URL && req.url.startsWith(BASE_URL) && !urlPath.includes('.')) {
    const spaPath = urlPath === '/' || urlPath === '' ? '/index.html' : urlPath;
    const targetFile = spaPath === '/ai'
      ? '/ai.html'
      : (spaPath === '/prototype'
        ? '/index.html'
        : (spaPath === '/bubble'
          ? '/bubble2.html'
          : (spaPath === '/bubble2' ? '/bubble2.html' : spaPath)));
    const filePath = safePath(targetFile);
    if (filePath && existsSync(filePath)) {
      try {
        const buf = await readFile(filePath);
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        res.end(buf);
        return;
      } catch {
        sendText(res, 500, 'Internal Server Error');
        return;
      }
    }
  }

  const path = safePath(urlPath);
  if (!path || !existsSync(path)) {
    sendText(res, 404, 'Not Found');
    return;
  }

  try {
    const buf = await readFile(path);
    const ext = path.slice(path.lastIndexOf('.'));
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(buf);
  } catch {
    sendText(res, 500, 'Internal Server Error');
  }
});

function listen(port) {
  server.listen(port, () => {
    console.log(`GenUI server running at http://localhost:${port}`);
  });
}

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE' && !process.env.PORT && PORT === 5173) {
    const fallbackPort = 5174;
    console.warn(`Port 5173 is in use. Falling back to http://localhost:${fallbackPort}`);
    server.removeAllListeners('error');
    listen(fallbackPort);
    return;
  }
  console.error(`Server failed to start on port ${PORT}: ${err?.message || err}`);
  process.exit(1);
});

listen(PORT);
void prewarmTtsCache();
