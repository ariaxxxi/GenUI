export function initAiShell({ document, C, input, clearListPills, morphTo, getAnimDuration, getGlassState, getGlassUi, getVoiceMode }) {
  let intentHeaderTrackRaf = null;
  let aiBridgeTimer = null;
  let aiBreathingTimer = null;
  let homePromptExitTimer = null;
  let siriRaf = null;
  let orbT = 0;
  let orbRamp = 0;
  let orbTarget = 0;
  let orbCY = 0.5;
  let orbCYTarget = 0.5;
  const ORB_SPEED = 1 / 180;
  const USE_THINKING_ORB = false;
  const BLOBS = [
    { r:0.32, speed:0.022, phase:0.00, ax:0.10, ay:0.08, freq:1.00 },
    { r:0.28, speed:0.027, phase:2.10, ax:0.09, ay:0.11, freq:1.31 },
    { r:0.26, speed:0.032, phase:4.20, ax:0.11, ay:0.07, freq:0.77 },
    { r:0.24, speed:0.022, phase:1.05, ax:0.08, ay:0.09, freq:1.61 },
  ];
  const ss = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  function enterAiModeVisual() {
    const main = document.getElementById('drop-main');
    if (!main) return;
    if (aiBreathingTimer) { clearTimeout(aiBreathingTimer); aiBreathingTimer = null; }
    main.classList.add('ai-mode');
    main.classList.remove('ai-breathing');
  }

  function setAiBridgeWindow(durationMs = 900) {
    const main = document.getElementById('drop-main');
    if (!main) return;
    if (aiBridgeTimer) clearTimeout(aiBridgeTimer);
    main.classList.add('ai-bridge');
    aiBridgeTimer = setTimeout(() => { aiBridgeTimer = null; main.classList.remove('ai-bridge'); }, Math.max(220, durationMs));
  }

  function animateHomePromptToThinking() {
    const prompt = document.getElementById('home-start-prompt');
    if (!prompt) return;
    if (homePromptExitTimer) { clearTimeout(homePromptExitTimer); homePromptExitTimer = null; }
    prompt.classList.add('visible');
    prompt.classList.remove('to-thinking');
    void prompt.offsetWidth;
    prompt.classList.add('to-thinking');
  }

  function setIntentHeader(label, step) {
    const hdr = document.getElementById('intent-header');
    const lbl = document.getElementById('intent-label');
    const dot = document.getElementById('intent-step-dot');
    const slbl = document.getElementById('intent-step-lbl');
    if (!hdr || !lbl || !dot || !slbl) return;
    lbl.textContent = label;
    if (step) { slbl.textContent = step; dot.classList.add('visible'); }
    else { slbl.textContent = ''; dot.classList.remove('visible'); }
    hdr.style.display = 'flex';
    hdr.classList.add('visible');
  }

  function cancelIntentHeaderTracking() {
    if (!intentHeaderTrackRaf) return;
    cancelAnimationFrame(intentHeaderTrackRaf);
    intentHeaderTrackRaf = null;
  }

  function positionIntentHeaderAboveMain() {
    const hdr = document.getElementById('intent-header');
    const stage = document.getElementById('stage');
    const main = document.getElementById('drop-main');
    if (!hdr || !stage || !main) return;
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const headerH = Math.ceil(hdr.getBoundingClientRect().height || hdr.offsetHeight || 0);
    const left = Math.round(mainRect.left - stageRect.left + 2);
    const top = Math.max(8, Math.round(mainRect.top - stageRect.top - headerH - 10));
    hdr.style.left = `${left}px`;
    hdr.style.top = `${top}px`;
  }

  function trackIntentHeaderForTransition(ms = getAnimDuration() + 120) {
    cancelIntentHeaderTracking();
    const end = performance.now() + Math.max(120, ms);
    const tick = () => {
      const hdr = document.getElementById('intent-header');
      if (!hdr || !hdr.classList.contains('glass-intent') || !hdr.classList.contains('visible')) return;
      positionIntentHeaderAboveMain();
      if (performance.now() < end) intentHeaderTrackRaf = requestAnimationFrame(tick);
      else intentHeaderTrackRaf = null;
    };
    intentHeaderTrackRaf = requestAnimationFrame(tick);
  }

  function updateOrbLabel() {
    const lbl = document.getElementById('glass-orb-label');
    const stage = document.getElementById('stage');
    const main = document.getElementById('drop-main');
    const glassUi = getGlassUi?.();
    const GS = getGlassState?.();
    if (!lbl || !glassUi || !GS) return;
    const isIdle = glassUi.active && glassUi.state === GS.IDLE;
    const isThinking = glassUi.active && glassUi.state === GS.THINKING;
    const text = isIdle ? (glassUi.interimText || input?.value || '') : (isThinking ? (glassUi.aiVoice || '') : '');
    if (!text || (!isIdle && !isThinking)) {
      lbl.classList.remove('visible');
      lbl.textContent = '';
      return;
    }
    lbl.textContent = text;
    lbl.classList.add('visible');
    if (stage && main) {
      const stageRect = stage.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const lblH = lbl.offsetHeight || 24;
      lbl.style.top = `${Math.max(8, Math.round(mainRect.top - stageRect.top - lblH - 12))}px`;
    }
  }

  function hideIntentHeader() {
    const hdr = document.getElementById('intent-header');
    if (!hdr) return;
    hdr.classList.remove('visible', 'glass-intent');
    hdr.style.display = 'none';
    hdr.style.left = '';
    hdr.style.top = '';
    cancelIntentHeaderTracking();
  }

  function ensureOrbLoop() {
    if (!USE_THINKING_ORB || siriRaf) return;
    const orb = document.getElementById('siri-orb');
    const canvas = document.getElementById('siri-canvas');
    if (!orb || !canvas) return;
    orb.classList.add('visible');
    const ctx = canvas.getContext('2d');
    const draw = () => {
      orbT += 1;
      if (orbRamp < orbTarget) orbRamp = Math.min(orbTarget, orbRamp + ORB_SPEED);
      if (orbRamp > orbTarget) orbRamp = Math.max(orbTarget, orbRamp - ORB_SPEED);
      const dm = document.getElementById('drop-main');
      const W = dm?.offsetWidth || 100;
      const H = dm?.offsetHeight || 100;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      orbCY += (orbCYTarget - orbCY) * 0.03;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const r = ss(orbRamp);
      for (const b of BLOBS) {
        const px = (0.5 + Math.sin(orbT * b.speed + b.phase) * b.ax * r) * W;
        const py = (orbCY + Math.cos(orbT * b.speed * b.freq + b.phase) * b.ay * r) * H;
        const br = b.r * Math.min(W, H) * (1 + 0.06 * Math.sin(orbT * 0.027 + b.phase));
        ctx.save();
        ctx.fillStyle = (b === BLOBS[1] || b === BLOBS[3]) ? 'rgba(210,232,255,1)' : 'rgba(255,255,255,1)';
        ctx.beginPath(); ctx.arc(px, py, br, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      siriRaf = requestAnimationFrame(draw);
    };
    draw();
  }

  function showAiIdle() {
    enterAiModeVisual(false);
    if (!USE_THINKING_ORB) {
      document.getElementById('siri-orb')?.classList.remove('visible');
      orbRamp = 0; orbTarget = 0;
      return;
    }
    orbTarget = 0;
    ensureOrbLoop();
  }

  function startSiriOrb(instant) {
    enterAiModeVisual(true);
    if (!USE_THINKING_ORB) {
      document.getElementById('siri-orb')?.classList.remove('visible');
      orbRamp = 0; orbTarget = 0;
      return;
    }
    if (instant) orbRamp = 1;
    orbTarget = 1;
    ensureOrbLoop();
  }

  function ambientFromAi(shape, contentData, customGeo) {
    stopSiriOrb();
    morphTo(shape, contentData, customGeo);
  }

  function stopSiriOrb(options = {}) {
    const keepAiMode = options?.keepAiMode === true;
    if (aiBreathingTimer) { clearTimeout(aiBreathingTimer); aiBreathingTimer = null; }
    if (aiBridgeTimer) { clearTimeout(aiBridgeTimer); aiBridgeTimer = null; }
    if (siriRaf) { cancelAnimationFrame(siriRaf); siriRaf = null; }
    document.getElementById('siri-orb')?.classList.remove('visible');
    clearListPills();
    const main = document.getElementById('drop-main');
    if (main && !keepAiMode) main.classList.remove('ai-mode', 'ai-breathing', 'ai-bridge');
    C.thumb.style.opacity = '';
    C.thumb.style.fontSize = '';
    orbRamp = 0; orbTarget = 0;
  }

  return {
    setIntentHeader,
    hideIntentHeader,
    cancelIntentHeaderTracking,
    trackIntentHeaderForTransition,
    positionIntentHeaderAboveMain,
    updateOrbLabel,
    enterAiModeVisual,
    setAiBridgeWindow,
    animateHomePromptToThinking,
    showAiIdle,
    startSiriOrb,
    ambientFromAi,
    stopSiriOrb,
  };
}
