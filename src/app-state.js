export const STORAGE_KEYS = {
  scenarios: 'genui.scenarios.v1',
  stages: 'genui.stages.v1',
  settings: 'genui.settings.v1',
  mode: 'genui.mode.v1',
  aiStage: 'genui.ai-stage.v1',
  aiVoiceEnabled: 'genui.ai-voice-enabled.v1',
  disableTextInput: 'genui.disable-text-input.v1',
};

export const RESPONSE_MODE = Object.freeze({
  MANUAL: 'manual',
  AI: 'ai',
});

export const PAGE_MODE_OVERRIDE = (() => {
  const raw = String(document.body?.dataset?.pageMode || '').trim().toLowerCase();
  if (raw === 'ai') return RESPONSE_MODE.AI;
  if (raw === 'manual' || raw === 'prototype') return RESPONSE_MODE.MANUAL;
  return null;
})();

export const AI_STAGE_OVERRIDE = Object.freeze({
  AUTO: 'auto',
  DOT: 'dot',
  PILL: 'pill',
  CARD: 'card',
});

export function persistToStorage(key, value, label) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.warn(`Unable to persist ${label}`, err); }
}

export function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

export function loadCanvasSettings() {
  const stored = readStoredJson(STORAGE_KEYS.settings, null);
  return {
    backgroundEnabled: stored?.backgroundEnabled !== false,
    floatingEnabled: stored?.floatingEnabled !== false,
    bottomAlign: stored?.bottomAlign !== false,
    frameMode: ['none', 'glasses', 'phone'].includes(stored?.frameMode) ? stored.frameMode : 'none',
    phoneBgEnabled: stored?.phoneBgEnabled !== false,
    phoneFrameWidth: Math.max(240, Math.min(600, parseInt(stored?.phoneFrameWidth, 10) || 390)),
    phoneFrameHeight: Math.max(420, Math.min(1200, parseInt(stored?.phoneFrameHeight, 10) || 838)),
    frameCornerRadius: Math.max(0, Math.min(120, parseInt(stored?.frameCornerRadius, 10) || 48)),
    phoneFrameBackground: stored?.phoneFrameBackground || null,
  };
}

export function loadResponseMode() {
  if (PAGE_MODE_OVERRIDE) return PAGE_MODE_OVERRIDE;
  const stored = readStoredJson(STORAGE_KEYS.mode, null);
  return stored === RESPONSE_MODE.AI ? RESPONSE_MODE.AI : RESPONSE_MODE.MANUAL;
}

export function loadAiStageOverride() {
  const stored = readStoredJson(STORAGE_KEYS.aiStage, null);
  return Object.values(AI_STAGE_OVERRIDE).includes(stored) ? stored : AI_STAGE_OVERRIDE.AUTO;
}

export function loadAiVoiceEnabled() {
  const stored = readStoredJson(STORAGE_KEYS.aiVoiceEnabled, null);
  return stored !== false;
}

export function loadDisableTextInput() {
  const stored = readStoredJson(STORAGE_KEYS.disableTextInput, null);
  return stored === true;
}
