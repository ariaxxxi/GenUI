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
let _hoverClickBuffer = null;
let _hoverClickLoading = false;

function getEarconCtx() {
  if (!earconCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    earconCtx = new AC();
  }
  return earconCtx;
}

async function loadHoverClickBuffer() {
  if (_hoverClickBuffer || _hoverClickLoading) return;
  _hoverClickLoading = true;
  const ctx = getEarconCtx();
  if (!ctx) return;
  try {
    const res = await fetch('src/assets/click.mp3');
    const arrayBuffer = await res.arrayBuffer();
    _hoverClickBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch (e) {}
}

export function playSimEarcon(type = 'sent') {
  const ctx = getEarconCtx();
  if (!ctx) return;

  if (type === 'hover') {
    // Apple-like scroll tick — ultra-short sine tap, crisp and neutral
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    osc.connect(master);
    osc.start(t);
    osc.stop(t + 0.05);

    // Subtle noise transient for click body
    const noiseLen = Math.floor(ctx.sampleRate * 0.008);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.09, t + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.007);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(t);
    return;
  }

  const now = ctx.currentTime + 0.01;

  if (type === 'sent') {
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
    return;
  }

  if (type === 'chip-reveal') {
    // Magical reveal — pure tonal chord bloom, no noise
    const t = ctx.currentTime;

    // Three harmonically related sine tones rising together
    const notes = [
      { freq: 392, targetFreq: 523, delay: 0.00 },   // G4 → C5
      { freq: 523, targetFreq: 698, delay: 0.06 },   // C5 → F5
      { freq: 659, targetFreq: 880, delay: 0.12 },   // E5 → A5
    ];

    notes.forEach(({ freq, targetFreq, delay }) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.09, t + delay + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.55);
      g.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t + delay + 0.45);
      osc.connect(g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.6);
    });

    // Subtle breath — very quiet, narrow bandpass for air texture only
    const noiseLen = Math.floor(ctx.sampleRate * 0.6);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(1200, t + 0.5);
    bp.Q.value = 3.0;
    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.0001, t);
    breathGain.gain.exponentialRampToValueAtTime(0.04, t + 0.1);
    breathGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    const breathSrc = ctx.createBufferSource();
    breathSrc.buffer = noiseBuf;
    breathSrc.connect(bp);
    bp.connect(breathGain);
    breathGain.connect(ctx.destination);
    breathSrc.start(t);
    return;
  }

  if (type === 'chip-reveal-2') {
    // Same as chip-reveal but a perfect fourth higher
    const t = ctx.currentTime;
    const notes = [
      { freq: 523, targetFreq: 698, delay: 0.00 },   // C5 → F5
      { freq: 698, targetFreq: 932, delay: 0.06 },   // F5 → Bb5
      { freq: 880, targetFreq: 1175, delay: 0.12 },  // A5 → D6
    ];
    notes.forEach(({ freq, targetFreq, delay }) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.07, t + delay + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.55);
      g.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t + delay + 0.45);
      osc.connect(g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.6);
    });
    const noiseLen = Math.floor(ctx.sampleRate * 0.6);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(800, t);
    bp.frequency.exponentialRampToValueAtTime(1600, t + 0.5);
    bp.Q.value = 3.0;
    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.0001, t);
    breathGain.gain.exponentialRampToValueAtTime(0.03, t + 0.1);
    breathGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    const breathSrc = ctx.createBufferSource();
    breathSrc.buffer = noiseBuf;
    breathSrc.connect(bp);
    bp.connect(breathGain);
    breathGain.connect(ctx.destination);
    breathSrc.start(t);
    return;
  }

  if (type === 'chip') {
    // Apple-style selection tap — clean sine fundamental + soft harmonic, glassy decay
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.004);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    master.connect(ctx.destination);

    // Fundamental — warm pure tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1047, now);
    osc1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Soft octave above for glass shimmer
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.07, now + 0.004);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    shimmerGain.connect(ctx.destination);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2093, now);
    osc2.connect(shimmerGain);
    osc2.start(now);
    osc2.stop(now + 0.15);
    return;
  }

  if (type === 'button') {
    // Confident two-tone confirm click
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    master.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1108, now + 0.09);
    osc1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.1);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
    osc2.connect(master);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);
    return;
  }
}
