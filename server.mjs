import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';

const ROOT = process.cwd();
const MAX_BODY_BYTES = 256 * 1024;

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
  return String(reqBodyProvider || process.env.AI_PROVIDER || 'openai').toLowerCase();
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

async function handleAiRoute(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    json(res, 400, { error: String(err.message || err) });
    return;
  }

  const provider = pickProvider(body.provider);
  const apiKey = String(process.env.AI_API_KEY || '').trim();
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
    if (provider === 'anthropic') {
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

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function safePath(urlPath) {
  const clean = urlPath.split('?')[0].split('#')[0] || '/';
  const target = clean === '/' ? '/GenUI.html' : clean;
  const rel = normalize(target)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^[/\\]+/, '');
  const full = resolve(ROOT, rel);
  if (!full.startsWith(resolve(ROOT))) return null;
  return full;
}

createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, 'Bad Request');
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/ai-route')) {
    await handleAiRoute(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  const path = safePath(req.url);
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
}).listen(PORT, () => {
  console.log(`GenUI server running at http://localhost:${PORT}`);
});
