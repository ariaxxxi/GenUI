let audioCtx = null;
let currentSource = null;
let currentUtterance = null;
let requestSeq = 0;
let lastSpokenText = '';
let lastSpokenAt = 0;
let ttsSpeaking = false;

const MIN_REPEAT_GAP_MS = 1500;

function normalizeText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed === '...') return '';
  return trimmed.replace(/^["']|["']$/g, '').trim();
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
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onend = () => setTtsSpeaking(false);
  utterance.onerror = () => setTtsSpeaking(false);
  currentUtterance = utterance;
  setTtsSpeaking(true, text);
  window.speechSynthesis.speak(utterance);
}

async function speakWithGemini(text, seq) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voiceName: 'Kore',
    }),
  });
  if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const base64 = String(data.audioBase64 || '');
  if (!base64) throw new Error('Empty TTS audio payload');
  if (seq !== requestSeq) return;
  const sampleRate = Number(data.sampleRate) || 24000;
  const buffer = pcm16MonoToAudioBuffer(base64, sampleRate);
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
  source.connect(ctx.destination);
  source.start();
  source.onended = () => {
    if (currentSource === source) currentSource = null;
    setTtsSpeaking(false);
  };
  currentSource = source;
  setTtsSpeaking(true, text);
}

export async function speakAiText(text) {
  const normalized = normalizeText(text);
  if (!normalized) return;
  const now = Date.now();
  if (normalized === lastSpokenText && (now - lastSpokenAt) < MIN_REPEAT_GAP_MS) return;
  lastSpokenText = normalized;
  lastSpokenAt = now;
  requestSeq += 1;
  const seq = requestSeq;
  setTtsSpeaking(true, normalized);
  try {
    await speakWithGemini(normalized, seq);
  } catch {
    if (seq !== requestSeq) return;
    speakWithBrowserVoice(normalized);
    return;
  }
}

export function stopAiSpeech() {
  requestSeq += 1;
  stopCurrentAudio();
  stopSpeechSynthesis();
  setTtsSpeaking(false);
}
