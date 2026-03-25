import { apiUrl } from '../utils.js';

let audioCtx = null;
let currentSource = null;
let currentUtterance = null;
let requestSeq = 0;
let lastSpokenText = '';
let lastSpokenAt = 0;
let ttsSpeaking = false;
let aiVoiceEnabled = true;
const ttsCache = new Map();
const ttsPrefetching = new Set();
const ttsInFlight = new Map();

const DEFAULT_TTS_VOICE = 'Kore';
const DEFAULT_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const DEFAULT_PLAYBACK_RATE = 1;

const MIN_REPEAT_GAP_MS = 1500;
const TTS_CACHE_STORAGE_KEY = 'genui.ai-tts-cache.v1';
const TTS_CACHE_MAX_ENTRIES = 80;

function normalizeText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed === '...') return '';
  return trimmed.replace(/^["']|["']$/g, '').trim();
}

function shouldMuteTtsForText(text) {
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedToken = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!normalized) return true;
  if (normalizedToken === 'edit_message') return true;
  if (normalizedToken === 'confirm_message_to') return true;
  if (normalized === 'edit your message') return true;
  if (/^confirm message to\s+[a-z0-9]+\s*$/.test(normalized)) return true;
  return false;
}

function playbackRateForText(text) {
  void text;
  return DEFAULT_PLAYBACK_RATE;
}

function loadPersistentCache() {
  try {
    const raw = localStorage.getItem(TTS_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    entries.forEach((entry) => {
      const key = String(entry?.key || '');
      const audioBase64 = String(entry?.audioBase64 || '');
      if (!key || !audioBase64) return;
      ttsCache.set(key, {
        audioBase64,
        mimeType: entry?.mimeType || 'audio/pcm;rate=24000',
        sampleRate: Number(entry?.sampleRate) || 24000,
        touchedAt: Number(entry?.touchedAt) || Date.now(),
      });
    });
  } catch {
    // best effort cache hydration
  }
}

function persistCache() {
  try {
    const entries = Array.from(ttsCache.entries())
      .map(([key, value]) => ({
        key,
        audioBase64: String(value?.audioBase64 || ''),
        mimeType: value?.mimeType || 'audio/pcm;rate=24000',
        sampleRate: Number(value?.sampleRate) || 24000,
        touchedAt: Number(value?.touchedAt) || Date.now(),
      }))
      .filter((entry) => entry.key && entry.audioBase64)
      .sort((a, b) => b.touchedAt - a.touchedAt)
      .slice(0, TTS_CACHE_MAX_ENTRIES);
    localStorage.setItem(TTS_CACHE_STORAGE_KEY, JSON.stringify({ entries }));
  } catch {
    // best effort cache persistence
  }
}

function pruneCache(maxEntries = TTS_CACHE_MAX_ENTRIES) {
  if (ttsCache.size <= maxEntries) return;
  const entriesByAge = Array.from(ttsCache.entries())
    .sort((a, b) => (Number(a[1]?.touchedAt) || 0) - (Number(b[1]?.touchedAt) || 0));
  const toDelete = entriesByAge.slice(0, Math.max(0, ttsCache.size - maxEntries));
  toDelete.forEach(([key]) => ttsCache.delete(key));
}

function setCacheEntry(key, value) {
  if (!key || !value?.audioBase64) return;
  ttsCache.set(key, {
    audioBase64: String(value.audioBase64),
    mimeType: value?.mimeType || 'audio/pcm;rate=24000',
    sampleRate: Number(value?.sampleRate) || 24000,
    touchedAt: Date.now(),
  });
  pruneCache();
  persistCache();
}

function deleteCacheEntry(key) {
  if (!key) return;
  if (ttsCache.delete(key)) persistCache();
}

function getCacheEntry(key) {
  const entry = ttsCache.get(key);
  if (!entry?.audioBase64) return null;
  entry.touchedAt = Date.now();
  ttsCache.set(key, entry);
  return entry;
}

function ensureAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function cacheKey({ text, voiceName = DEFAULT_TTS_VOICE, model = DEFAULT_TTS_MODEL }) {
  return `${model}::${voiceName}::${String(text || '').trim()}`;
}

async function fetchTtsData(text, { forceRefresh = false } = {}) {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  const key = cacheKey({ text: normalized });

  if (!forceRefresh) {
    const cached = getCacheEntry(key);
    if (cached) return cached;
    const inFlight = ttsInFlight.get(key);
    if (inFlight) return inFlight;
  }

  const requestPromise = (async () => {
    const res = await fetch(apiUrl('api/tts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: normalized,
        voiceName: DEFAULT_TTS_VOICE,
        model: DEFAULT_TTS_MODEL,
        ...(forceRefresh ? { forceRefresh: true } : {}),
      }),
    });
    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    const base64 = String(data.audioBase64 || '');
    if (!base64) throw new Error('Empty TTS audio payload');
    const entry = {
      audioBase64: base64,
      mimeType: data.mimeType || 'audio/pcm;rate=24000',
      sampleRate: Number(data.sampleRate) || 24000,
    };
    setCacheEntry(key, entry);
    return getCacheEntry(key) || entry;
  })();

  if (!forceRefresh) ttsInFlight.set(key, requestPromise);
  try {
    return await requestPromise;
  } finally {
    if (!forceRefresh) ttsInFlight.delete(key);
  }
}

function pcm16MonoToAudioBuffer(base64, sampleRate = 24000) {
  const ctx = ensureAudioContext();
  if (!ctx) return null;
  const bytes = base64ToUint8Array(base64);
  const sampleCount = Math.floor(bytes.length / 2);
  const buffer = ctx.createBuffer(1, sampleCount, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    const lo = bytes[i * 2];
    const hi = bytes[(i * 2) + 1];
    const int16 = (hi << 8) | lo;
    const signed = int16 >= 0x8000 ? int16 - 0x10000 : int16;
    channel[i] = signed / 32768;
  }
  return buffer;
}

function stopCurrentAudio() {
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    try { currentSource.disconnect(); } catch {}
    currentSource = null;
  }
}

function stopSpeechSynthesis() {
  if (window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
  currentUtterance = null;
}

function setTtsSpeaking(active, text = '') {
  if (ttsSpeaking === active) return;
  ttsSpeaking = active;
  window.dispatchEvent(new CustomEvent('ai-tts-state', { detail: { active, text } }));
}

function bestBrowserVoice() {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices() || [];
  if (!voices.length) return null;
  return voices.find((v) => /en-US/i.test(v.lang) && /natural|neural|premium|enhanced/i.test(v.name))
    || voices.find((v) => /en-US/i.test(v.lang))
    || voices[0];
}

function speakWithBrowserVoice(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    setTtsSpeaking(false);
    return;
  }
  stopCurrentAudio();
  stopSpeechSynthesis();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = bestBrowserVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = playbackRateForText(text);
  utterance.pitch = 1;
  utterance.onend = () => setTtsSpeaking(false);
  utterance.onerror = () => setTtsSpeaking(false);
  currentUtterance = utterance;
  setTtsSpeaking(true, text);
  window.speechSynthesis.speak(utterance);
}

async function speakWithGemini(text, seq) {
  const key = cacheKey({ text });
  const cached = getCacheEntry(key);
  if (cached?.audioBase64) {
    if (seq !== requestSeq) return;
    const sampleRate = Number(cached.sampleRate) || 24000;
    const buffer = pcm16MonoToAudioBuffer(cached.audioBase64, sampleRate);
    const ctx = ensureAudioContext();
    if (!buffer || !ctx) throw new Error('Unable to decode cached TTS audio');
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    stopCurrentAudio();
    stopSpeechSynthesis();
    if (seq !== requestSeq) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRateForText(text);
    source.connect(ctx.destination);
    source.start();
    source.onended = () => {
      if (currentSource === source) currentSource = null;
      setTtsSpeaking(false);
    };
    currentSource = source;
    setTtsSpeaking(true, text);
    return;
  }

  const fetched = await fetchTtsData(text);
  if (!fetched?.audioBase64) throw new Error('Unable to fetch TTS audio');
  if (seq !== requestSeq) return;
  const sampleRate = Number(fetched.sampleRate) || 24000;
  const buffer = pcm16MonoToAudioBuffer(fetched.audioBase64, sampleRate);
  const ctx = ensureAudioContext();
  if (!buffer || !ctx) throw new Error('Unable to decode TTS audio');
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }
  stopCurrentAudio();
  stopSpeechSynthesis();
  if (seq !== requestSeq) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRateForText(text);
  source.connect(ctx.destination);
  source.start();
  source.onended = () => {
    if (currentSource === source) currentSource = null;
    setTtsSpeaking(false);
  };
  currentSource = source;
  setTtsSpeaking(true, text);
}

async function regenerateOne(text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const key = cacheKey({ text: normalized });
  deleteCacheEntry(key);
  try {
    const refreshed = await fetchTtsData(normalized, { forceRefresh: true });
    return !!refreshed?.audioBase64;
  } catch {
    return false;
  }
}

async function prefetchOne(text) {
  const normalized = normalizeText(text);
  if (!normalized) return;
  const key = cacheKey({ text: normalized });
  if (getCacheEntry(key) || ttsPrefetching.has(key)) return;
  ttsPrefetching.add(key);
  try {
    await fetchTtsData(normalized);
  } catch {
    // best effort prefetch
  } finally {
    ttsPrefetching.delete(key);
  }
}

export async function speakAiText(text) {
  if (!aiVoiceEnabled) return;
  const normalized = normalizeText(text);
  if (!normalized) return;
  if (shouldMuteTtsForText(normalized)) return;
  const now = Date.now();
  if (normalized === lastSpokenText && (now - lastSpokenAt) < MIN_REPEAT_GAP_MS) return;
  lastSpokenText = normalized;
  lastSpokenAt = now;
  requestSeq += 1;
  const seq = requestSeq;
  setTtsSpeaking(true, normalized);
  try {
    await speakWithGemini(normalized, seq);
  } catch (err) {
    if (seq !== requestSeq) return;
    console.warn('Gemini TTS failed, falling back to browser voice:', err?.message || err);
    speakWithBrowserVoice(normalized);
  }
}

export function stopAiSpeech() {
  requestSeq += 1;
  stopCurrentAudio();
  stopSpeechSynthesis();
  setTtsSpeaking(false);
}

export function isAiVoiceEnabled() {
  return aiVoiceEnabled;
}

export function setAiVoiceEnabled(enabled) {
  const next = enabled !== false;
  if (aiVoiceEnabled === next) return;
  aiVoiceEnabled = next;
  if (!aiVoiceEnabled) stopAiSpeech();
}

export function prewarmAiSpeechCache() {
  const phrases = [
    'I found 2 hiro in your contact list, which one do you mean?',
    'What would you like to say?',
  ];
  phrases.forEach((phrase) => { void prefetchOne(phrase); });
}

export async function refreshAiVoice(text) {
  return regenerateOne(text);
}

loadPersistentCache();
