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
  } else {
    out.classList.remove('visible');
    txt.textContent = '';
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
