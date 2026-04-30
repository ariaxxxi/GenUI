export function initAiShell({ document, C, input, clearListPills, morphTo, getAnimDuration, getGlassState, getGlassUi, getVoiceMode }) {
  let intentHeaderTrackRaf = null;
  let intentHeaderShowTimer = null;
  let aiBridgeTimer = null;
  let aiBreathingTimer = null;
  let homePromptExitTimer = null;
  let orbLabelOverride = '';

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
    const normalizedLabel = String(label || '').replace(/^\s*([a-z])/, (m, c) => m.replace(c, c.toUpperCase()));
    lbl.style.fontSize = '';
    lbl.style.color = '';
    lbl.textContent = normalizedLabel;
    if (step) { slbl.textContent = step; dot.classList.add('visible'); }
    else { slbl.textContent = ''; dot.classList.remove('visible'); }
    hdr.style.display = 'flex';
    if (intentHeaderShowTimer) {
      clearTimeout(intentHeaderShowTimer);
      intentHeaderShowTimer = null;
    }
    const fromThinking = document.body?.dataset?.currentShape === 'magic';
    if (fromThinking) {
      hdr.classList.remove('visible');
      intentHeaderShowTimer = setTimeout(() => {
        intentHeaderShowTimer = null;
        hdr.classList.add('visible');
        positionIntentHeaderAboveMain();
        trackIntentHeaderForTransition();
      }, 220);
    } else {
      hdr.classList.add('visible');
      positionIntentHeaderAboveMain();
      trackIntentHeaderForTransition();
    }
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
    const hdrRect = hdr.getBoundingClientRect();
    const headerH = Math.ceil(hdrRect.height || hdr.offsetHeight || 0);
    const centerX = Math.round((mainRect.left + (mainRect.width / 2)) - stageRect.left);
    const top = Math.max(8, Math.round(mainRect.top - stageRect.top - headerH - 12));
    const headerW = Math.ceil(hdrRect.width || hdr.offsetWidth || 0);
    const left = Math.round(centerX - (headerW / 2));
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
    const inHomeContext = document.body?.dataset?.aiHomeState === 'context';
    const inHomeCircle = document.body?.dataset?.currentShape === 'circle';
    const overrideText = String(orbLabelOverride || '').trim();
    const glassUi = getGlassUi?.();
    const GS = getGlassState?.();
    if (!lbl) return;
    if (inHomeContext && inHomeCircle) {
      lbl.classList.remove('visible');
      lbl.textContent = '';
      return;
    }
    let text = '';
    if (overrideText) {
      text = overrideText;
    } else if (glassUi && GS) {
      const isIdle = glassUi.active && glassUi.state === GS.IDLE;
      const isThinking = glassUi.active && glassUi.state === GS.THINKING;
      const isSending = glassUi.active && glassUi.state === GS.SENDING;
      text = isIdle ? (glassUi.interimText || input?.value || '') : ((isThinking || isSending) ? (glassUi.aiVoice || '') : '');
      if (!text || (!isIdle && !isThinking && !isSending)) text = '';
    }
    const needsEntryDelay = glassUi && GS && glassUi.active &&
      (glassUi.state === GS.THINKING || glassUi.state === GS.SENDING) &&
      !lbl.classList.contains('visible');
    if (!text) {
      lbl.classList.remove('visible', 'orb-entry-delay');
      lbl.textContent = '';
      return;
    }
    lbl.classList.toggle('orb-entry-delay', !!needsEntryDelay);
    lbl.textContent = text;
    lbl.classList.add('visible');
    if (stage && main) {
      const stageRect = stage.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const lblH = lbl.offsetHeight || 24;
      lbl.style.top = `${Math.max(8, Math.round(mainRect.top - stageRect.top - lblH - 20))}px`;
    }
  }

  function setOrbLabel(text) {
    orbLabelOverride = String(text || '');
    updateOrbLabel();
  }

  function clearOrbLabel() {
    orbLabelOverride = '';
    updateOrbLabel();
  }

  function hideIntentHeader() {
    const hdr = document.getElementById('intent-header');
    if (!hdr) return;
    hdr.classList.remove('visible', 'glass-intent');
    hdr.style.display = 'none';
    hdr.style.left = '';
    hdr.style.top = '';
    const lbl = document.getElementById('intent-label');
    if (lbl) {
      lbl.style.fontSize = '';
      lbl.style.color = '';
    }
    if (intentHeaderShowTimer) {
      clearTimeout(intentHeaderShowTimer);
      intentHeaderShowTimer = null;
    }
    cancelIntentHeaderTracking();
  }

  function showAiIdle() {
    enterAiModeVisual(false);
    document.getElementById('siri-orb')?.classList.remove('visible');
  }

  function startSiriOrb() {
    enterAiModeVisual(true);
    document.getElementById('siri-orb')?.classList.remove('visible');
  }

  function ambientFromAi(shape, contentData, customGeo) {
    stopSiriOrb();
    morphTo(shape, contentData, customGeo);
  }

  function stopSiriOrb(options = {}) {
    const keepAiMode = options?.keepAiMode === true;
    if (aiBreathingTimer) { clearTimeout(aiBreathingTimer); aiBreathingTimer = null; }
    if (aiBridgeTimer) { clearTimeout(aiBridgeTimer); aiBridgeTimer = null; }
    document.getElementById('siri-orb')?.classList.remove('visible');
    clearListPills();
    const main = document.getElementById('drop-main');
    if (main && !keepAiMode) main.classList.remove('ai-mode', 'ai-breathing', 'ai-bridge');
    C.thumb.style.opacity = '';
    C.thumb.style.fontSize = '';
  }

  return {
    setIntentHeader,
    hideIntentHeader,
    cancelIntentHeaderTracking,
    trackIntentHeaderForTransition,
    positionIntentHeaderAboveMain,
    updateOrbLabel,
    setOrbLabel,
    clearOrbLabel,
    enterAiModeVisual,
    setAiBridgeWindow,
    animateHomePromptToThinking,
    showAiIdle,
    startSiriOrb,
    ambientFromAi,
    stopSiriOrb,
  };
}
