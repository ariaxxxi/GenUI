import { speakAiText, stopAiSpeech } from './ai/tts-player.js';

export function addSimLog(text, type = 'system') {
  const log = document.getElementById('sim-log');
  if (!log || !text) return;
  const entries = log.querySelectorAll('.slog');
  if (entries.length >= 24) entries[0].remove();
  const el = document.createElement('div');
  el.className = `slog slog-${type}`;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

export function setSimVoice(text) {
  const out = document.getElementById('sim-voice-out');
  const txt = document.getElementById('sim-voice-text');
  if (!out || !txt) return;
  if (text) {
    txt.textContent = `"${text}"`;
    out.classList.add('visible');
    void speakAiText(text);
  } else {
    out.classList.remove('visible');
    txt.textContent = '';
    stopAiSpeech();
  }
}

export function setSimInputState({ label, placeholder, hint = '', dictating = false }) {
  const lbl = document.getElementById('sim-input-label');
  const inp = document.getElementById('sim-input');
  const wrap = document.getElementById('sim-input-wrap');
  const hnt = document.getElementById('sim-input-hint');
  if (lbl) {
    lbl.textContent = dictating ? '🎤 Voice Dictation' : label;
    lbl.classList.toggle('dictating', dictating);
  }
  if (inp) {
    inp.placeholder = placeholder;
    inp.classList.toggle('dictating', dictating);
  }
  if (wrap) wrap.classList.toggle('dictating', dictating);
  if (hnt) hnt.textContent = hint;
}

export function addChatBubble(role, text) {
  if (!text) return;
  addSimLog(text, role === 'user' ? 'user' : 'voice');
  if (role === 'ai') setSimVoice(text);
}

export function showTypingBubble() {
  setSimVoice('...');
}

export function hideTypingBubble() {}

let earconCtx = null;

function getEarconCtx() {
  if (!earconCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    earconCtx = new AC();
  }
  return earconCtx;
}

export function playSimEarcon(type = 'sent') {
  if (type !== 'sent') return;
  const ctx = getEarconCtx();
  if (!ctx) return;
  const now = ctx.currentTime + 0.01;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  master.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(784, now);
  osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
  osc1.connect(master);
  osc1.start(now);
  osc1.stop(now + 0.14);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1174.66, now + 0.12);
  osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.26);
  osc2.connect(master);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.3);
}
