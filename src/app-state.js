export const STORAGE_KEYS = {
  scenarios: 'genui.scenarios.v1',
  scenarioRevision: 'genui.scenarios-revision.v1',
  stages: 'genui.stages.v1',
  settings: 'genui.settings.v1',
  mode: 'genui.mode.v1',
  aiStage: 'genui.ai-stage.v1',
  aiOrbIcon: 'genui.ai-orb-icon.v1',
  aiVoiceEnabled: 'genui.ai-voice-enabled.v1',
  disableTextInput: 'genui.disable-text-input.v1',
};

const DURABLE_DB_NAME = 'genui-durable.v1';
const DURABLE_STORE_NAME = 'records';
let durableDbPromise = null;

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
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Unable to persist ${label}`, err);
    return false;
  }
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
    backgroundEnabled: stored?.backgroundEnabled === true,
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

export function loadAiOrbIcon() {
  const stored = readStoredJson(STORAGE_KEYS.aiOrbIcon, null);
  return typeof stored === 'string' ? stored : 'bixby';
}

export function loadDisableTextInput() {
  const stored = readStoredJson(STORAGE_KEYS.disableTextInput, null);
  return stored === true;
}

function openDurableDb() {
  if (durableDbPromise) return durableDbPromise;
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  durableDbPromise = new Promise((resolve) => {
    const finish = (value) => {
      if (value === null) durableDbPromise = null;
      resolve(value);
    };
    try {
      const request = indexedDB.open(DURABLE_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DURABLE_STORE_NAME)) {
          db.createObjectStore(DURABLE_STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = () => {
        console.warn('Unable to open durable storage', request.error);
        finish(null);
      };
      request.onblocked = () => {
        console.warn('Unable to open durable storage: blocked');
        finish(null);
      };
    } catch (err) {
      console.warn('Unable to open durable storage', err);
      finish(null);
    }
  });
  return durableDbPromise;
}

export async function persistDurableJson(key, value, { revision = Date.now(), label = 'data' } = {}) {
  const db = await openDurableDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DURABLE_STORE_NAME, 'readwrite');
      tx.objectStore(DURABLE_STORE_NAME).put({
        key,
        value,
        revision,
        savedAt: Date.now(),
      });
      tx.oncomplete = () => resolve(true);
      tx.onabort = () => {
        console.warn(`Unable to persist durable ${label}`, tx.error);
        resolve(false);
      };
      tx.onerror = () => {
        console.warn(`Unable to persist durable ${label}`, tx.error);
        resolve(false);
      };
    } catch (err) {
      console.warn(`Unable to persist durable ${label}`, err);
      resolve(false);
    }
  });
}

export async function readDurableJsonRecord(key) {
  const db = await openDurableDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DURABLE_STORE_NAME, 'readonly');
      const request = tx.objectStore(DURABLE_STORE_NAME).get(key);
      request.onsuccess = () => {
        const record = request.result;
        resolve(record && typeof record === 'object' ? record : null);
      };
      request.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
      tx.onerror = () => resolve(null);
    } catch (err) {
      console.warn('Unable to read durable data', err);
      resolve(null);
    }
  });
}
