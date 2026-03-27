export function initVoiceEngine({ document, input, addSimLog, getGlassUi, getGlassState, onTranscriptUpdate, shouldKeepCommandListening, shouldShowCommandViz }) {
  const voiceEngine = { recognition:null, supported:false, active:false, mode:'off', restartOnEnd:false, audioCtx:null, analyser:null, micStream:null, vizRaf:null };
  let dictationStart = 0;
  let vizLevel = 0;
  let ttsSpeaking = false;
  let pausedModeForTts = '';
  let ttsCooldownUntil = 0;
  let lastTtsTextNorm = '';

  function normalizeSpeechText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function shouldIgnoreAsTtsEcho(transcript) {
    const now = Date.now();
    const normalized = normalizeSpeechText(transcript);
    if (!normalized) return true;
    if (ttsSpeaking) return true;
    if (now > ttsCooldownUntil) return false;
    if (!lastTtsTextNorm) return true;
    return normalized.includes(lastTtsTextNorm) || lastTtsTextNorm.includes(normalized);
  }
  const glowShadow = (t) => `0 0 ${(t * 12).toFixed(1)}px ${(t * 3).toFixed(1)}px rgba(34,105,245,${(t * 0.45).toFixed(3)})`;
  const shadow = (t) => {
    const lr = (a, b) => (a + (b - a) * t).toFixed(2);
    const lc = (r0,g0,b0,a0, r1,g1,b1,a1) => `rgba(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)},${(a0+(a1-a0)*t).toFixed(3)})`;
    return [`inset 0 ${lr(4,6)}px ${lr(29.8,6)}px -2px ${lc(192,213,255,0.15, 34,105,245,0.15)}`, `inset 0 ${lr(-7,-11)}px 20px -6px ${lc(225,231,255,0.60, 255,255,255,0.40)}`, `inset 0 ${lr(6,-20)}px ${lr(18.4,30)}px ${lr(-10,-8)}px ${lc(255,255,255,0.20, 172,188,247,0.50)}`, `inset 0 ${lr(-3,-56)}px 60px -30px rgba(19,75,192,1)`].join(', ');
  };
  const buttonShadow = (t) => {
    const lr = (a, b) => (a + (b - a) * t).toFixed(2);
    const lc = (r0,g0,b0,a0, r1,g1,b1,a1) => `rgba(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)},${(a0+(a1-a0)*t).toFixed(3)})`;
    return [`inset 0 ${lr(-5,6)}px ${lr(6,6)}px -2px ${lc(70,132,255,0.15, 34,105,245,0.15)}`, `inset 0 ${lr(-6,-11)}px ${lr(7.8,20)}px -8px ${lc(172,188,247,0.50, 255,255,255,0.40)}`, `inset 0 ${lr(-1,10)}px ${lr(14.4,30)}px -6px ${lc(255,255,255,0.40, 172,188,247,0.50)}`, `inset 0 ${lr(-6,-56)}px ${lr(47.4,60)}px -30px rgba(19,75,192,1)`].join(', ');
  };

  async function initVoiceAnalyser() {
    if (voiceEngine.analyser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:false });
      voiceEngine.micStream = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.88;
      ctx.createMediaStreamSource(stream).connect(analyser);
      voiceEngine.audioCtx = ctx;
      voiceEngine.analyser = analyser;
    } catch {}
  }

  function applyVoiceVisualization(level) {
    const glassUi = getGlassUi();
    const GS = getGlassState();
    const state = glassUi?.state;
    const glowEl = document.getElementById('home-glow-layer');
    const dropMain = document.getElementById('drop-main');
    if (voiceEngine.mode === 'command') {
      const allowCommandViz = shouldShowCommandViz?.() !== false;
      if (!allowCommandViz) {
        if (glowEl) glowEl.style.boxShadow = '';
        if (dropMain) dropMain.style.setProperty('box-shadow', '');
        document.querySelectorAll('.g-action-btn').forEach((btn) => { btn.style.transition = ''; btn.style.boxShadow = ''; });
        return;
      }
      const flightContainerViz = document.getElementById('stage')?.classList.contains('flight-voice-viz') === true;
      if (glowEl) glowEl.style.boxShadow = shadow(level);
      if (state === GS.DISAMBIGUATE || flightContainerViz) {
        if (dropMain) dropMain.style.setProperty('box-shadow', shadow(level));
      } else {
        if (dropMain) dropMain.style.setProperty('box-shadow', '');
      }
      if (state === GS.CONFIRM) {
        document.querySelectorAll('.g-action-btn').forEach((btn) => {
          btn.style.transition = 'transform 240ms cubic-bezier(0.22,1,0.36,1), background 240ms cubic-bezier(0.22,1,0.36,1)';
          btn.style.boxShadow = buttonShadow(level);
        });
      } else {
        document.querySelectorAll('.g-action-btn').forEach((btn) => { btn.style.transition = ''; btn.style.boxShadow = ''; });
      }
    }
    if (voiceEngine.mode === 'dictation') {
      if (glowEl) glowEl.style.boxShadow = '';
      if (dropMain) dropMain.style.removeProperty('box-shadow');
      document.querySelectorAll('.g-action-btn').forEach((btn) => { btn.style.transition = ''; btn.style.boxShadow = ''; });
    }
    if (voiceEngine.mode === 'dictation' && Date.now() - dictationStart > 600) {
      const field = document.querySelector('#drop-main.compose-surface:not(.confirm-surface)') || document.querySelector('[data-compose-field]');
      if (field && field.dataset.pulseLock !== '1') {
        field.style.transition = 'min-height 400ms ease, background 400ms ease, border-color 400ms ease, box-shadow 180ms ease';
        field.style.setProperty('box-shadow', shadow(level), 'important');
      }
    }
  }

  function startVoiceViz() {
    if (!voiceEngine.analyser) return;
    if (voiceEngine.vizRaf) cancelAnimationFrame(voiceEngine.vizRaf);
    vizLevel = 0;
    const data = new Uint8Array(voiceEngine.analyser.frequencyBinCount);
    const tick = () => {
      if (!voiceEngine.active || voiceEngine.mode === 'off') { voiceEngine.vizRaf = null; return; }
      voiceEngine.analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      const raw = Math.pow(Math.min(avg / 32, 1), 0.6);
      vizLevel += (raw - vizLevel) * 0.18;
      applyVoiceVisualization(vizLevel);
      voiceEngine.vizRaf = requestAnimationFrame(tick);
    };
    voiceEngine.vizRaf = requestAnimationFrame(tick);
  }

  function stopVoiceViz() {
    if (voiceEngine.vizRaf) { cancelAnimationFrame(voiceEngine.vizRaf); voiceEngine.vizRaf = null; }
    document.getElementById('home-glow-layer')?.style.setProperty('box-shadow', '');
    const field = document.querySelector('#drop-main.compose-surface:not(.confirm-surface)') || document.querySelector('[data-compose-field]');
    if (field) { field.style.transition = ''; field.style.removeProperty('box-shadow'); }
    if (getGlassUi()?.state !== getGlassState().DISAMBIGUATE) document.getElementById('drop-main')?.style.setProperty('box-shadow', '');
    document.querySelectorAll('.g-action-btn').forEach((btn) => { btn.style.transition = ''; btn.style.boxShadow = ''; });
  }

  function clearVoiceVizStyles() {
    document.getElementById('home-glow-layer')?.style.setProperty('box-shadow', '');
    const field = document.querySelector('#drop-main.compose-surface:not(.confirm-surface)') || document.querySelector('[data-compose-field]');
    if (field) { field.style.transition = ''; field.style.removeProperty('box-shadow'); }
    document.getElementById('drop-main')?.style.setProperty('box-shadow', '');
    document.querySelectorAll('.g-action-btn').forEach((btn) => { btn.style.transition = ''; btn.style.boxShadow = ''; });
  }

  function updateMicIndicator() {
    const el = document.getElementById('sim-mic');
    const dot = document.getElementById('sim-mic-dot');
    const lbl = document.getElementById('sim-mic-label');
    if (!el || !dot || !lbl) return;
    if (!voiceEngine.supported || !voiceEngine.active || voiceEngine.mode === 'off') { el.classList.remove('active'); return; }
    el.classList.add('active');
    dot.className = voiceEngine.mode === 'dictation' ? 'dictation' : 'command';
    lbl.textContent = voiceEngine.mode === 'dictation' ? 'Dictating…' : 'Listening…';
  }

  function onVoiceResult(transcript, isFinal) {
    if (shouldIgnoreAsTtsEcho(transcript)) return;
    if (input) input.value = transcript;
    onTranscriptUpdate(transcript, isFinal);
  }

  function handleTtsStateChange(event) {
    const active = event?.detail?.active === true;
    const spokenTextNorm = normalizeSpeechText(event?.detail?.text || '');
    ttsSpeaking = active;
    if (active) {
      lastTtsTextNorm = spokenTextNorm || lastTtsTextNorm;
      ttsCooldownUntil = Date.now() + 2200;
      if (voiceEngine.active && voiceEngine.mode !== 'off') {
        pausedModeForTts = voiceEngine.mode;
        stopVoiceViz();
        voiceEngine.restartOnEnd = false;
        if (voiceEngine.recognition && voiceEngine.active) {
          try { voiceEngine.recognition.stop(); } catch {}
        }
        voiceEngine.active = false;
        updateMicIndicator();
      }
      return;
    }

    ttsCooldownUntil = Date.now() + 1200;
    if (!pausedModeForTts) return;
    const resumeMode = pausedModeForTts;
    pausedModeForTts = '';
    const allowResume = getGlassUi()?.active || shouldKeepCommandListening?.();
    if (!allowResume) return;
    setTimeout(() => {
      if (!ttsSpeaking && (getGlassUi()?.active || shouldKeepCommandListening?.())) voiceEngine.start(resumeMode);
    }, 120);
  }

  function init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return void addSimLog('Voice input not supported in this browser', 'system');
    voiceEngine.supported = true;
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    r.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      onVoiceResult(result[0].transcript.trim(), result.isFinal);
    };
    r.onend = () => {
      voiceEngine.active = false; updateMicIndicator();
      if (voiceEngine.restartOnEnd && voiceEngine.mode !== 'off' && (getGlassUi()?.active || shouldKeepCommandListening?.())) {
        setTimeout(() => {
          if (voiceEngine.restartOnEnd && (getGlassUi()?.active || shouldKeepCommandListening?.())) voiceEngine.start(voiceEngine.mode);
        }, 120);
      }
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { voiceEngine.supported = false; voiceEngine.restartOnEnd = false; addSimLog('Mic access denied — use typed input', 'system'); }
      else if (e.error !== 'no-speech') addSimLog(`Voice error: ${e.error}`, 'system');
      voiceEngine.active = false; updateMicIndicator();
    };
    voiceEngine.recognition = r;
  }

  voiceEngine.start = function(mode) {
    if (!voiceEngine.supported || !voiceEngine.recognition) return;
    voiceEngine.mode = mode;
    if (mode === 'off') return void voiceEngine.stop();
    voiceEngine.restartOnEnd = true;
    if (voiceEngine.active) return;
    try {
      voiceEngine.recognition.start();
      voiceEngine.active = true;
      updateMicIndicator();
      if (mode === 'dictation') dictationStart = Date.now();
      initVoiceAnalyser().then(startVoiceViz);
    } catch {}
  };
  voiceEngine.stop = function() {
    stopVoiceViz();
    voiceEngine.restartOnEnd = false;
    voiceEngine.mode = 'off';
    if (voiceEngine.recognition && voiceEngine.active) { try { voiceEngine.recognition.stop(); } catch {} }
    voiceEngine.active = false;
    updateMicIndicator();
  };

  init();
  window.addEventListener('ai-tts-state', handleTtsStateChange);
  return { voiceEngine, initVoiceAnalyser, updateMicIndicator, clearVoiceVizStyles };
}
