export function initVoiceEngine({ document, input, addSimLog, getGlassUi, getGlassState, onTranscriptUpdate, shouldKeepCommandListening, shouldShowCommandViz }) {
  const voiceEngine = { recognition:null, supported:false, active:false, mode:'off', restartOnEnd:false, audioCtx:null, analyser:null, micStream:null, vizRaf:null };
  const VIZ_FADE_IN_MS = 320;
  let dictationStart = 0;
  let vizVisibleSince = 0;
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
  const shadow = (t) => {
    const lr = (a, b) => (a + (b - a) * t).toFixed(2);
    const lc = (r0,g0,b0,a0, r1,g1,b1,a1) => `rgba(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)},${(a0+(a1-a0)*t).toFixed(3)})`;
    return [`inset 0 ${lr(-22,6)}px ${lr(29.8,6)}px -2px ${lc(192,213,255,0.15, 34,105,245,0.15)}`, `inset 0 ${lr(-7,-11)}px 20px -6px ${lc(225,231,255,0.60, 255,255,255,0.40)}`, `inset 0 ${lr(6,-20)}px ${lr(18.4,30)}px ${lr(-10,-8)}px ${lc(255,255,255,0.20, 172,188,247,0.50)}`, `inset 0 ${lr(-3,-56)}px 60px -30px rgba(0,22,67,1)`].join(', ');
  };
  const buttonShadow = (t) => {
    const lr = (a, b) => (a + (b - a) * t).toFixed(2);
    const lc = (r0,g0,b0,a0, r1,g1,b1,a1) => `rgba(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)},${(a0+(a1-a0)*t).toFixed(3)})`;
    return [`inset 0 ${lr(-5,6)}px ${lr(6,6)}px -2px ${lc(70,132,255,0.15, 34,105,245,0.15)}`, `inset 0 ${lr(-6,-11)}px ${lr(7.8,20)}px -8px ${lc(172,188,247,0.50, 255,255,255,0.40)}`, `inset 0 ${lr(-1,10)}px ${lr(14.4,30)}px -6px ${lc(255,255,255,0.40, 172,188,247,0.50)}`, `inset 0 ${lr(-6,-56)}px ${lr(47.4,60)}px -30px rgba(0,22,67,1)`].join(', ');
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

  function getComposePulseField() {
    return document.querySelector('[data-compose-field]');
  }

  function composeFieldAccent(level) {
    const mix = (from, to) => Math.round(from + ((to - from) * level));
    const primary = `rgb(${mix(144, 102)} ${mix(172, 208)} ${mix(255, 255)})`;
    const secondary = `rgb(${mix(151, 255)} ${mix(97, 173)} ${mix(255, 244)})`;
    return { primary, secondary };
  }

  function dictationVizFade() {
    if (!vizVisibleSince) return 0;
    const progress = Math.max(0, Math.min((Date.now() - vizVisibleSince) / VIZ_FADE_IN_MS, 1));
    return 1 - Math.pow(1 - progress, 2);
  }

  function applyVoiceVisualization(level, actionBtns) {
    const field = getComposePulseField();
    const state = getGlassUi?.()?.state;
    const composeState = getGlassState?.()?.COMPOSE;
    if (voiceEngine.mode !== 'dictation' || !field || (composeState != null && state !== composeState)) {
      vizVisibleSince = 0;
      void actionBtns;
      resetVizStyles({ clearDropMain: true });
      return;
    }
    if (!vizVisibleSince) vizVisibleSince = Date.now();
    const accent = composeFieldAccent(level);
    field.style.transition = 'background 220ms var(--motion-ease), box-shadow 180ms var(--motion-ease), --g-stage-selected-rgb 180ms var(--motion-ease), --g-stage-selected-secondary-rgb 180ms var(--motion-ease)';
    field.style.setProperty('--g-stage-selected-rgb', accent.primary);
    field.style.setProperty('--g-stage-selected-secondary-rgb', accent.secondary);
    field.style.setProperty('--g-compose-field-voice-shadow', shadow(level));
  }

  function startVoiceViz() {
    if (!voiceEngine.analyser) return;
    if (voiceEngine.vizRaf) cancelAnimationFrame(voiceEngine.vizRaf);
    vizLevel = 0;
    vizVisibleSince = 0;
    const data = new Uint8Array(voiceEngine.analyser.frequencyBinCount);
    const tick = () => {
      if (!voiceEngine.active || voiceEngine.mode === 'off') { voiceEngine.vizRaf = null; return; }
      voiceEngine.analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
      const raw = Math.pow(Math.min(avg / 32, 1), 0.6);
      const target = raw * dictationVizFade();
      vizLevel += (target - vizLevel) * 0.18;
      applyVoiceVisualization(vizLevel, []);
      voiceEngine.vizRaf = requestAnimationFrame(tick);
    };
    voiceEngine.vizRaf = requestAnimationFrame(tick);
  }

  function resetVizStyles({ clearDropMain = true } = {}) {
    document.getElementById('home-glow-layer')?.style.setProperty('box-shadow', '');
    document.getElementById('siri-orb')?.style.setProperty('box-shadow', '');
    const field = getComposePulseField();
    if (field) {
      field.style.transition = '';
      field.style.removeProperty('box-shadow');
      field.style.removeProperty('--g-compose-field-voice-shadow');
      field.style.removeProperty('--g-stage-selected-rgb');
      field.style.removeProperty('--g-stage-selected-secondary-rgb');
    }
    if (clearDropMain) document.getElementById('drop-main')?.style.removeProperty('box-shadow');
    document.querySelectorAll('.g-action-btn').forEach((btn) => { btn.style.transition = ''; btn.style.boxShadow = ''; });
  }

  function stopVoiceViz() {
    if (voiceEngine.vizRaf) { cancelAnimationFrame(voiceEngine.vizRaf); voiceEngine.vizRaf = null; }
    vizVisibleSince = 0;
    resetVizStyles({ clearDropMain: true });
  }

  function clearVoiceVizStyles() {
    vizVisibleSince = 0;
    resetVizStyles({ clearDropMain: true });
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
    const previousMode = voiceEngine.mode;
    voiceEngine.mode = mode;
    if (mode === 'off') return void voiceEngine.stop();
    voiceEngine.restartOnEnd = true;
    if (voiceEngine.active) {
      if (previousMode !== mode) {
        if (mode === 'dictation') dictationStart = Date.now();
        resetVizStyles({ clearDropMain: true });
        if (mode === 'dictation') {
          initVoiceAnalyser().then(startVoiceViz);
        } else {
          stopVoiceViz();
        }
      }
      updateMicIndicator();
      return;
    }
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
