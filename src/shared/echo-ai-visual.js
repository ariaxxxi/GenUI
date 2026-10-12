import { loadAiEchoVisual, persistAiEchoVisual } from '../app-state.js';

const ECHO_SRC = 'vendor/motion-ai/motion-ai-echo.html?embed=1';

export const ECHO_LISTENING_LOOK = Object.freeze({
  METABALL: 'metaball',
  GLOW: 'glow',
});

export const ECHO_PRESET_AUTO = 'auto';

/* Echo draws at a fixed authored size inside a 640px square frame: the form
   itself spans 288px, with the status line below it. The frame is scaled down
   rather than resized so every baked Effects/Metaball value keeps its authored
   proportions.

     authored frame  640px square
     scale           22 / 32 = 0.6875
     rendered        440 x 440 px
     form            288px authored -> 198px drawn
     status line     224px below the form -> 154px at this scale

   Most of the 640 box is transparent margin, so the rendered box is allowed to
   overhang the 380px canvas; it is never clipped. */
const ECHO_FRAME = 640;
const ECHO_TEXT = 22;
const ECHO_TEXT_AUTHORED = 32;
const ECHO_SCALE = ECHO_TEXT / ECHO_TEXT_AUTHORED;

/* Echo and the stage are mutually exclusive surfaces, and every swap between
   them goes through the idle shape: a stage dissolves to idle before Echo fades
   in, and Echo fades out before the stage grows back out of idle. */
export const ECHO_FADE_MS = 340;
export const STAGE_SETTLE_MS = 470;

/* Prototype shape → Echo preset state, for states a flow drives on its own
   rather than through requestState. `idle` is deliberately absent: it is the
   neutral shape both surfaces pass through, so it must not summon Echo. */
const SHAPE_STATE = Object.freeze({
  listening: 'listening',
  magic: 'thinking',
});

/* Prototype AI shapes, and the Echo state each one asks for. */
export const ECHO_SHAPE_STATE = Object.freeze({
  listening: 'listening',
  magic: 'thinking',
  idle: 'idle',
  ai: 'idle',
});

/* The AI Debug "Thinking State" chips refine what the magic shape is doing. */
const THINKING_MODE_STATE = Object.freeze({
  thinking: 'thinking',
  skill: 'planning',
  agent: 'processing',
  app: 'executing',
});

function dropMainState(dropMain) {
  if (!dropMain) return '';
  if (dropMain.classList.contains('sending-surface')) return 'executing';
  if (dropMain.classList.contains('orb-thinking-bridge')) return 'thinking';
  if (dropMain.classList.contains('magic-glow')) return 'thinking';
  if (dropMain.classList.contains('compose-await-orb')) return 'listening';
  if (dropMain.classList.contains('confirm-surface')) return 'listening';
  if (dropMain.classList.contains('listening-orb')) return 'listening';
  return '';
}

export function initEchoAiVisual({ document, window, goIdle, getShape }) {
  /* The visual sits dead-centre of the canvas itself, the way the phone screen
     hosts it, rather than tracking the morphing drop. */
  const host = document.getElementById('stage');
  if (!host) return null;

  const stored = loadAiEchoVisual();
  let enabled = stored.enabled;
  let listeningLook = stored.listeningLook;
  let presetId = stored.presetId || ECHO_PRESET_AUTO;

  let overlay = null;
  let frame = null;
  let api = null;
  let presets = [];
  let speaking = false;
  let voiceLevel = 0;
  let appliedPresetId = '';
  let refreshRaf = 0;
  /* The Echo state the user asked for, held across the forced trip to idle. */
  let override = '';
  /* True while the stage owns the canvas, so Echo stays down even if the live
     shape would otherwise resolve to a preset. */
  let withheld = false;
  let revealTimer = 0;
  const listeners = new Set();

  const currentShape = () => String(
    (typeof getShape === 'function' ? getShape() : document.body?.dataset?.currentShape) || '',
  ).trim().toLowerCase();

  function emit() {
    listeners.forEach((fn) => { try { fn(); } catch (err) { console.warn('echo visual listener failed', err); } });
  }

  function persist() {
    persistAiEchoVisual({ enabled, listeningLook, presetId });
  }

  function presetFor(state) {
    if (!presets.length) return null;
    if (state === 'listening') {
      const wantMetaball = listeningLook === ECHO_LISTENING_LOOK.METABALL;
      const match = presets.find((p) => p.state === 'listening' && /metaball/i.test(p.label) === wantMetaball);
      if (match) return match;
    }
    return presets.find((p) => p.state === state) || null;
  }

  /* The AI Debug "Thinking State" chips narrow a plain thinking look down to
     one of the authored planning / processing / executing presets. */
  function refineThinking(state) {
    if (state !== 'thinking') return state;
    const body = document.body;
    const family = body?.dataset?.thinkingDebugFamilyActive === 'true';
    const mode = String(body?.dataset?.thinkingDebugMode || '').trim().toLowerCase();
    return (family && THINKING_MODE_STATE[mode]) || 'thinking';
  }

  /* Resolves the preset the prototype's live state asks for, or null when the
     prototype is not showing an AI surface at all. */
  function resolveAuto() {
    const body = document.body;
    const dropMain = document.getElementById('drop-main');
    const shape = String(body?.dataset?.currentShape || '').trim().toLowerCase();

    let state = '';
    if (shape === 'magic') {
      state = refineThinking('thinking');
    } else if (SHAPE_STATE[shape]) {
      state = SHAPE_STATE[shape];
    } else {
      state = dropMainState(dropMain);
    }
    if (!state) return null;
    if (dropMain?.classList.contains('flow-orb-muted')) return null;
    /* Speech overrides the resting state, but only while the prototype is
       already showing an AI surface - never on top of a card or list. */
    return presetFor(speaking ? 'speaking' : state);
  }

  function resolvePreset() {
    if (withheld) return null;
    if (presetId !== ECHO_PRESET_AUTO) {
      return presets.find((p) => p.id === presetId) || null;
    }
    if (override) return presetFor(speaking ? 'speaking' : refineThinking(override));
    return resolveAuto();
  }

  function scheduleReveal(delayMs) {
    window.clearTimeout(revealTimer);
    revealTimer = window.setTimeout(() => {
      revealTimer = 0;
      withheld = false;
      render();
    }, Math.max(0, delayMs));
  }

  /* Line up a look without showing it yet. Echo stays down while the stage it
     is replacing dissolves; the caller calls revealNow() once that is done.
     Swapping looks while Echo already owns the canvas is an in-place preset
     change, so there is no fade out and back. */
  function prepareState(nextOverride, nextPresetId) {
    const alreadyCovering = instance.isCovering();
    window.clearTimeout(revealTimer);
    revealTimer = 0;
    override = nextOverride;
    presetId = nextPresetId;
    withheld = !alreadyCovering;
    persist();
    render();
    return alreadyCovering;
  }

  function revealNow() {
    window.clearTimeout(revealTimer);
    revealTimer = 0;
    withheld = false;
    render();
  }

  /* Hand the canvas back to the stage. Echo fades out and stays down; the
     caller morphs idle -> stage once the fade has run. */
  function yieldCanvas() {
    window.clearTimeout(revealTimer);
    revealTimer = 0;
    override = '';
    presetId = ECHO_PRESET_AUTO;
    withheld = true;
    persist();
    render();
    /* Released only after the stage morph has started, so the pass through the
       idle shape cannot flash Echo back on. */
    window.setTimeout(() => {
      withheld = false;
      render();
    }, ECHO_FADE_MS + STAGE_SETTLE_MS);
  }

  function pushVoiceLevel() {
    if (!api) return;
    try { api.setVoiceLevel(voiceLevel); } catch (err) { console.warn('echo setVoiceLevel failed', err); }
  }

  function applyPreset(preset) {
    if (!api || !preset || preset.id === appliedPresetId) return;
    try {
      api.setPreset(preset.id);
      appliedPresetId = preset.id;
    } catch (err) {
      console.warn('echo setPreset failed', err);
    }
  }

  function render() {
    const preset = enabled ? resolvePreset() : null;
    const covering = !!(enabled && preset);
    document.body.classList.toggle('ai-echo-visual', enabled);
    document.body.classList.toggle('ai-echo-active', covering);
    if (overlay) {
      overlay.classList.toggle('visible', covering);
      overlay.setAttribute('aria-hidden', covering ? 'false' : 'true');
    }
    if (covering) {
      applyPreset(preset);
      pushVoiceLevel();
    }
    emit();
  }

  function scheduleRender() {
    if (refreshRaf) return;
    refreshRaf = window.requestAnimationFrame(() => {
      refreshRaf = 0;
      render();
    });
  }

  function onFrameLoad() {
    const win = frame?.contentWindow;
    const motionAi = win?.MotionAI;
    if (!motionAi) {
      console.warn('MotionAI API unavailable in the Echo iframe');
      return;
    }
    api = motionAi;
    presets = motionAi.presets.map((p) => ({ id: p.id, state: p.state, label: p.label }));
    appliedPresetId = motionAi.options?.presetId || '';
    /* Echo paints an opaque canvas by default; the prototype needs it to float
       over the stage background. Same-origin, so the stylesheet can be injected. */
    try {
      const doc = win.document;
      const style = doc.createElement('style');
      style.textContent = 'html,body,#root{background:transparent !important}';
      doc.head.appendChild(style);
    } catch (err) {
      console.warn('Unable to make the Echo iframe transparent', err);
    }
    render();
  }

  function ensureFrame() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'ai-echo-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.setProperty('--echo-frame', `${ECHO_FRAME}px`);
    overlay.style.setProperty('--echo-scale', String(ECHO_SCALE));
    frame = document.createElement('iframe');
    frame.id = 'ai-echo-frame';
    frame.title = 'AI assistant';
    frame.setAttribute('scrolling', 'no');
    frame.addEventListener('load', onFrameLoad);
    frame.src = ECHO_SRC;
    overlay.appendChild(frame);
    host.appendChild(overlay);
  }

  const observer = new MutationObserver(scheduleRender);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-current-shape', 'data-thinking-debug-mode', 'data-thinking-debug-family-active'] });
  const dropMain = document.getElementById('drop-main');
  if (dropMain) observer.observe(dropMain, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('ai-tts-state', (event) => {
    speaking = event?.detail?.active === true;
    if (!speaking) {
      voiceLevel = 0;
      pushVoiceLevel();
    }
    scheduleRender();
  });

  window.addEventListener('ai-tts-level', (event) => {
    const level = Number(event?.detail?.level);
    if (!Number.isFinite(level)) return;
    voiceLevel = Math.max(0, Math.min(1, level));
    pushVoiceLevel();
  });

  const instance = {
    isEnabled: () => enabled,
    setEnabled(next) {
      const value = next === true;
      if (value === enabled) return;
      enabled = value;
      if (!enabled) {
        window.clearTimeout(revealTimer);
        revealTimer = 0;
        override = '';
        withheld = false;
      }
      persist();
      if (enabled) ensureFrame();
      render();
    },
    getListeningLook: () => listeningLook,
    setListeningLook(look) {
      const value = look === ECHO_LISTENING_LOOK.GLOW ? ECHO_LISTENING_LOOK.GLOW : ECHO_LISTENING_LOOK.METABALL;
      if (value === listeningLook) return;
      listeningLook = value;
      persist();
      render();
    },
    getPresetId: () => presetId,
    setPresetId(id) {
      const value = id === ECHO_PRESET_AUTO || presets.some((p) => p.id === id) ? id : ECHO_PRESET_AUTO;
      if (value === presetId) return;
      if (value === ECHO_PRESET_AUTO) {
        window.clearTimeout(revealTimer);
        revealTimer = 0;
        presetId = value;
        override = '';
        withheld = false;
        persist();
        render();
        return;
      }
      /* A preset pick is a request for the canvas, same as an AI shape: park
         the stage on idle first, then fade the chosen look in. */
      if (prepareState('', value)) return void revealNow();
      goIdle?.();
      scheduleReveal(STAGE_SETTLE_MS);
    },
    /* Line up the look an AI shape asks for; the caller reveals it once the
       outgoing stage has dissolved. Returns true if Echo already had the
       canvas, in which case nothing needs to dissolve. */
    prepareState(state) {
      return prepareState(String(state || '').trim().toLowerCase() || 'idle', ECHO_PRESET_AUTO);
    },
    revealNow,
    getOverride: () => override,
    yieldToStage: yieldCanvas,
    getPresets: () => presets.slice(),
    getActivePresetId: () => appliedPresetId,
    isCovering: () => document.body.classList.contains('ai-echo-active'),
    setVoiceLevel(level) {
      const value = Number(level);
      if (!Number.isFinite(value)) return;
      voiceLevel = Math.max(0, Math.min(1, value));
      pushVoiceLevel();
    },
    refresh: scheduleRender,
    onChange(fn) {
      if (typeof fn === 'function') listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  if (enabled) ensureFrame();
  render();

  /* The voice engine and TTS player reach the visual through the window so the
     echo layer stays an optional add-on rather than a hard dependency. */
  window.GenUiEchoAi = instance;
  return instance;
}
