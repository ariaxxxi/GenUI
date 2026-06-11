import { STORAGE_KEYS, RESPONSE_MODE, PAGE_MODE_OVERRIDE, AI_STAGE_OVERRIDE, readStoredJson, loadCanvasSettings, loadResponseMode, loadAiStageOverride, persistToStorage, persistDurableJson, readDurableJsonRecord, deleteDurableJsonRecord } from '../app-state.js';
import { clamp } from '../utils.js';
import { initMorph } from '../shared/morph.js';
import { initScenarioData } from '../shared/scenario-data.js';
import { buildUiRefs, initSidebar } from '../shared/sidebar.js';
import { initAnimControls } from '../shared/anim-controls.js';
import { initOrbController } from '../shared/orb-controller.js';
import { initManualFlight } from './modules/manual-flight.js';
import { initManualDemo } from './modules/manual-demo.js';
import { initManualActions } from './modules/manual-actions.js';
import { initManualBindings } from './modules/manual-bindings.js';
import { copyStagePngToClipboard, exportStageSvg as exportStageSvgFile, getCaptureHotkeyAction } from '../shared/stage-capture.js';
import { applyAiCelestialChrome } from '../shared/celestial-selection-chrome.js';
import { bindAiOrbIconStorageSync } from '../shared/ai-orb-icon.js';
import { initVoiceEngine } from '../ai/voice-engine.js';
import { playSimEarcon } from '../sim-panel.js';

const DROPS = { main: document.getElementById('drop-main'), left: document.getElementById('drop-left'), right: document.getElementById('drop-right') };
const C = { thumb: document.getElementById('c-thumb'), thumbLabel: document.getElementById('c-thumb-label'), thumbImg: document.getElementById('c-thumb-img'), prim: document.getElementById('c-primary'), sec: document.getElementById('c-secondary'), div: document.getElementById('c-divider'), det: document.getElementById('c-detail'), media: document.getElementById('c-media'), rich: document.getElementById('c-rich'), actionCardActions: document.getElementById('action-card-actions') };
const UI = buildUiRefs(document);
bindAiOrbIconStorageSync(document, window);
const detailMeasureEl = document.createElement('div');
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const createRootCircle = () => ({ icon: '', primary: '', secondary: '', detail: '' });
const PROTOTYPE_BACKGROUND_OPTIONS = [
  'dark',
  'assets/bg/living room.jpg',
  'assets/bg/living room 2.jpg',
  'assets/bg/desk.jpg',
  'assets/bg/work.jpg',
  'assets/bg/park.jpg',
  'assets/bg/street.jpg',
  'assets/bg/grocery store.jpg',
  'assets/bg/kitechen.jpg',
];
const DARK_PROTOTYPE_BACKGROUND = 'dark';
const DEFAULT_PROTOTYPE_BACKGROUND = 'assets/bg/living room.jpg';

function normalizePrototypeBackground(src) {
  const value = String(src || '').trim();
  if (value.startsWith('data:image/') || value.startsWith('blob:')) return value;
  return PROTOTYPE_BACKGROUND_OPTIONS.includes(value) ? value : DEFAULT_PROTOTYPE_BACKGROUND;
}

function isCustomPrototypeBackground(src) {
  const value = String(src || '').trim();
  return value.startsWith('data:image/') || value.startsWith('blob:');
}

let canvasSettings = loadCanvasSettings();
const hadSessionVideoSettings = canvasSettings.backgroundMediaKind === 'video';
if (hadSessionVideoSettings) {
  canvasSettings = {
    ...canvasSettings,
    backgroundMediaKind: 'video',
    backgroundVideo: null,
  };
}
let responseMode = loadResponseMode();
let aiStageOverride = loadAiStageOverride();
let scenarioRevision = Number(readStoredJson(STORAGE_KEYS.scenarioRevision, 0)) || 0;
let stageLibrary = [];
let scenarioLibrary = [];
let selectedScenarioId = '';
let morphApi = null;
let manualDemo = null;
let flight = null;
let actions = null;
let splitAnimStyleBackup = null;
let prototypeIntentHeaderTrackRaf = null;
let prototypeOrbChromeSyncRaf = 0;
let prototypeVoice = null;
let prototypeSelectionOverride = null;
let prototypeListeningPromptText = '';
let prototypeListeningPromptFinalText = '';
let prototypeListeningPromptInterimText = '';
let prototypeListeningPromptDismissTimer = null;
const prototypeAiDebugState = { active: false, mode: 'thinking' };

function isPrototypeNormalRenderShape(shape) {
  return !['magic', 'listening', 'ai', 'idle', 'split'].includes(String(shape || '').trim().toLowerCase());
}

const scenarioData = initScenarioData({ getStageLibrary: () => stageLibrary, getCanvasSettings: () => canvasSettings, clampFn: clamp });
const { SCENARIO_SHAPES, STAGE_COMPONENT_TYPES, SHAPES, defaultTypographyForShape, normalizeTypographyByShape, normalizeStage, normalizeIconByShape, normalizeListChipIconsByShape, normalizeListItemsByShape, normalizeImagesByShape, stageId, loadStageLibrary, stageById, builtinStageById, renderShapeForStageId, availableScenarioShapes, visibleScenarioStages, stageComponentCounts, stageHasComponent, stageVisibleEditorFields, createIcon, createDefaultListItem, normalizeStageTextByShape, normalizeScenarioCanvas, normalizeStageSizeEntry, normalizeStageSizeByShape, scenarioStageSizeOverride, stageCardImagePaddingForShape, stageMainSize, stageIconTextGap, stageIconLeftPadding, stageTextForShape, stageIconForShape, stageListChipIconsForShape, stageListItemsForShape, stageListListeningOrbForShape, stageListSelectableForShape, stageImagesForShape, stageRenderShapeForShape, stageSelectedForShape, stageAccentColorForShape, stageSecondaryAccentColorForShape, stageNudgeDividerColorForShape, stageSelectedBlobTopCoreColorForShape, stageSelectedBlobTopEdgeColorForShape, stageSelectedBlobBottomCoreColorForShape, stageSelectedBlobBottomEdgeColorForShape, createScenario, normalizeTriggers, normalizeScenario, defaultScenarioLibrary } = scenarioData;

function normalizeScenarioLibrarySet(source) {
  const scenarios = Array.isArray(source) ? source.map(normalizeScenario).filter(Boolean) : defaultScenarioLibrary();
  scenarios.forEach((scenario) => {
    scenario.content.canvas = normalizeScenarioCanvas(scenario?.content?.canvas, { frameMode: canvasSettings?.frameMode || 'none' });
  });
  return scenarios.length ? scenarios : defaultScenarioLibrary();
}

function loadScenarioLibrary() {
  return normalizeScenarioLibrarySet(readStoredJson(STORAGE_KEYS.scenarios, null));
}

function persistScenarios() {
  const revision = Date.now();
  const localScenarioOk = persistToStorage(STORAGE_KEYS.scenarios, scenarioLibrary, 'scenarios');
  if (localScenarioOk) persistToStorage(STORAGE_KEYS.scenarioRevision, revision, 'scenario revision');
  scenarioRevision = revision;
  void persistDurableJson(STORAGE_KEYS.scenarios, scenarioLibrary, { revision, label: 'scenarios' });
}
function serializableCanvasSettings() {
  return {
    ...canvasSettings,
    backgroundVideo: canvasSettings?.backgroundVideo
      ? {
          name: canvasSettings.backgroundVideo.name || '',
          type: canvasSettings.backgroundVideo.type || '',
        }
      : null,
  };
}
function persistCanvasSettings() {
  const serializable = serializableCanvasSettings();
  persistToStorage(STORAGE_KEYS.settings, serializable, 'canvas settings');
}
if (hadSessionVideoSettings) persistCanvasSettings();
function persistResponseMode() { if (!PAGE_MODE_OVERRIDE) persistToStorage(STORAGE_KEYS.mode, responseMode, 'response mode'); }
function persistAiStageOverride() { persistToStorage(STORAGE_KEYS.aiStage, aiStageOverride, 'AI stage override'); }

function persistBackgroundImageStorage(image = {}) {
  if (!image?.src && !canvasSettings.backgroundImage) return;
  void (async () => {
    const record = await readDurableJsonRecord(STORAGE_KEYS.backgroundImage);
    const stored = record?.value && typeof record.value === 'object' ? record.value : null;
    const src = String(image?.src || '').startsWith('data:') ? image.src : (stored?.src || '');
    if (!src) return;
    await persistDurableJson(STORAGE_KEYS.backgroundImage, {
      src,
      name: image.name || stored?.name || 'uploaded image',
      alpha: Math.max(0, Math.min(1, Number(image?.alpha ?? canvasSettings.backgroundImageAlpha ?? 0.9))),
    }, { label: 'background image' });
  })();
}

async function readStoredBackgroundVideoValue() {
  const record = await readDurableJsonRecord(STORAGE_KEYS.backgroundVideo);
  return record?.value && typeof record.value === 'object' ? record.value : null;
}

function persistBackgroundVideoStorage(video) {
  if (!video?.src && !canvasSettings.backgroundVideo?.src) return;
  void (async () => {
    const stored = await readStoredBackgroundVideoValue();
    const src = String(video?.src || '').startsWith('data:') ? video.src : (stored?.src || '');
    if (!src) return;
    await persistDurableJson(STORAGE_KEYS.backgroundVideo, {
      src,
      name: video?.name || canvasSettings.backgroundVideo?.name || stored?.name || 'uploaded video',
      type: video?.type || canvasSettings.backgroundVideo?.type || stored?.type || '',
      paused: video?.paused === true,
      progress: Math.max(0, Math.min(1, Number(video?.progress ?? canvasSettings.backgroundVideoProgress) || 0)),
      alpha: Math.max(0, Math.min(1, Number(video?.alpha ?? canvasSettings.backgroundVideoAlpha ?? 0.8))),
      y: Math.max(-500, Math.min(500, Number(video?.y ?? canvasSettings.backgroundVideoY) || 0)),
    }, { label: 'background video' });
  })();
}

function selectedScenario() {
  return scenarioLibrary.find((item) => item.id === selectedScenarioId) || scenarioLibrary[0] || null;
}

function setScenarioLibraryState(nextLibrary) {
  scenarioLibrary = nextLibrary;
  if (!scenarioLibrary.some((item) => item.id === selectedScenarioId)) {
    selectedScenarioId = scenarioLibrary[0]?.id || '';
  }
}

function currentScenarioFrameMode() {
  return normalizeScenarioCanvas(selectedScenario()?.content?.canvas, { frameMode: canvasSettings.frameMode }).frameMode;
}

function syncRangeProgress(input) {
  if (!input || input.type !== 'range') return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const progress = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
  input.style.setProperty('--range-progress', `${progress}%`);
}

function applyCanvasSettings() {
  const frame = document.getElementById('ui-frame');
  const frameBg = document.getElementById('ui-frame-bg');
  const blurBg = document.querySelector('.bg-blur-image');
  const blurVideo = document.querySelector('.bg-blur-video');
  const frameMode = currentScenarioFrameMode();
  const isPhone = frameMode === 'phone';
  const isGlasses = frameMode === 'glasses';
  const backgroundImage = normalizePrototypeBackground(canvasSettings.backgroundImage);
  const backgroundEnabled = canvasSettings.backgroundEnabled !== false;
  const isDarkBackground = backgroundImage === DARK_PROTOTYPE_BACKGROUND;
  const backgroundVideo = canvasSettings.backgroundVideo?.src ? canvasSettings.backgroundVideo : null;
  const backgroundMediaKind = backgroundVideo && canvasSettings.backgroundMediaKind === 'video' ? 'video' : 'image';
  document.body.classList.toggle('bg-off', !backgroundEnabled);
  document.body.classList.toggle('bg-image-on', backgroundEnabled && backgroundMediaKind === 'image');
  document.body.classList.toggle('bg-video-on', backgroundEnabled && backgroundMediaKind === 'video');
  document.body.classList.toggle('float-off', !canvasSettings.floatingEnabled);
  document.body.classList.toggle('stage-bottom-align', !!canvasSettings.bottomAlign);
  document.body.style.backgroundImage = 'none';
  document.body.style.backgroundPosition = '';
  document.body.style.backgroundSize = '';
  document.body.style.backgroundRepeat = '';
  if (blurBg) {
    blurBg.style.backgroundImage = backgroundEnabled && backgroundMediaKind === 'image' && !isDarkBackground
      ? `url("${encodeURI(backgroundImage)}")`
      : 'none';
    blurBg.style.opacity = backgroundEnabled && backgroundMediaKind === 'image' && !isDarkBackground
      ? String(Math.max(0, Math.min(1, Number(canvasSettings.backgroundImageAlpha ?? 0.9))))
      : '0';
  }
  if (blurVideo) {
    const nextSrc = backgroundEnabled && backgroundMediaKind === 'video' && backgroundVideo?.src ? backgroundVideo.src : '';
    if (nextSrc) {
      const srcChanged = blurVideo.src !== nextSrc;
      if (srcChanged) {
        blurVideo.pause();
        blurVideo.src = nextSrc;
        blurVideo.load();
      }
      blurVideo.style.opacity = String(Math.max(0, Math.min(1, Number(canvasSettings.backgroundVideoAlpha ?? 0.8))));
      blurVideo.style.setProperty('--prototype-bg-video-y', `${Math.max(-500, Math.min(500, Number(canvasSettings.backgroundVideoY) || 0))}px`);
      const desiredTime = Math.max(0, Math.min(1, Number(canvasSettings.backgroundVideoProgress) || 0));
      const syncVideoTime = () => {
        if (!Number.isFinite(blurVideo.duration) || blurVideo.duration <= 0) return;
        const targetTime = desiredTime * blurVideo.duration;
        if (Math.abs(blurVideo.currentTime - targetTime) > 0.1) blurVideo.currentTime = targetTime;
      };
      blurVideo.onloadedmetadata = syncVideoTime;
      if (blurVideo.readyState >= 1) syncVideoTime();
      if (canvasSettings.backgroundVideoPaused) {
        blurVideo.pause();
      } else {
        const playPromise = blurVideo.play();
        if (playPromise?.catch) playPromise.catch(() => {});
      }
    } else {
      blurVideo.pause();
      blurVideo.removeAttribute('src');
      blurVideo.load?.();
      blurVideo.style.opacity = '0';
      blurVideo.style.setProperty('--prototype-bg-video-y', '0px');
    }
  }
  if (frame) {
    frame.classList.toggle('phone', isPhone);
    frame.classList.toggle('glasses', isGlasses);
    frame.classList.remove('stage-blur');
    frame.classList.toggle('phone-scene-off', isPhone && !canvasSettings.phoneBgEnabled);
    frame.style.setProperty('--phone-frame-w', `${canvasSettings.phoneFrameWidth}px`);
    frame.style.setProperty('--phone-frame-h', `${canvasSettings.phoneFrameHeight}px`);
    frame.style.setProperty('--frame-corner-radius', `${canvasSettings.frameCornerRadius}px`);
    frame.classList.toggle('has-bg', isPhone && !!canvasSettings.phoneBgEnabled && !!canvasSettings.phoneFrameBackground?.src);
  }
  if (frameBg) frameBg.style.backgroundImage = canvasSettings.phoneFrameBackground?.src ? `url("${canvasSettings.phoneFrameBackground.src}")` : '';
  if (UI.bgToggle) UI.bgToggle.checked = !!backgroundEnabled;
  if (UI.bgImageSelect) UI.bgImageSelect.value = backgroundImage;
  if (UI.bgImageState) UI.bgImageState.textContent = isCustomPrototypeBackground(backgroundImage) ? 'uploaded' : 'preset';
  if (UI.bgImageAlpha) {
    UI.bgImageAlpha.value = String(Math.round(Math.max(0, Math.min(1, Number(canvasSettings.backgroundImageAlpha ?? 0.9))) * 100));
    syncRangeProgress(UI.bgImageAlpha);
  }
  if (UI.bgVideoState) UI.bgVideoState.textContent = backgroundVideo ? 'loaded' : 'empty';
  if (UI.bgVideoControls) UI.bgVideoControls.classList.toggle('hidden', !backgroundVideo);
  if (UI.bgVideoPlayToggle) {
    UI.bgVideoPlayToggle.textContent = canvasSettings.backgroundVideoPaused ? 'Play' : 'Pause';
    UI.bgVideoPlayToggle.disabled = !backgroundVideo;
  }
  if (UI.bgVideoProgress) {
    UI.bgVideoProgress.value = String(Math.round((Math.max(0, Math.min(1, Number(canvasSettings.backgroundVideoProgress) || 0))) * 1000));
    syncRangeProgress(UI.bgVideoProgress);
    UI.bgVideoProgress.disabled = !backgroundVideo;
  }
  if (UI.bgVideoAlpha) {
    UI.bgVideoAlpha.value = String(Math.round(Math.max(0, Math.min(1, Number(canvasSettings.backgroundVideoAlpha ?? 0.8))) * 100));
    syncRangeProgress(UI.bgVideoAlpha);
    UI.bgVideoAlpha.disabled = !backgroundVideo;
  }
  if (UI.bgVideoY) {
    UI.bgVideoY.value = String(Math.round(Math.max(-500, Math.min(500, Number(canvasSettings.backgroundVideoY) || 0))));
    syncRangeProgress(UI.bgVideoY);
    UI.bgVideoY.disabled = !backgroundVideo;
  }
  if (UI.floatToggle) UI.floatToggle.checked = !!canvasSettings.floatingEnabled;
  if (UI.alignBottomToggle) UI.alignBottomToggle.checked = !!canvasSettings.bottomAlign;
  if (UI.framePhoneToggle) UI.framePhoneToggle.checked = isPhone;
  if (UI.frameGlassesToggle) UI.frameGlassesToggle.checked = isGlasses;
  if (UI.phoneFrameControls) UI.phoneFrameControls.classList.toggle('hidden', !isPhone);
  if (UI.phoneFrameWidth) UI.phoneFrameWidth.value = String(canvasSettings.phoneFrameWidth);
  if (UI.phoneFrameHeight) UI.phoneFrameHeight.value = String(canvasSettings.phoneFrameHeight);
  if (UI.frameCornerRadius) UI.frameCornerRadius.value = String(canvasSettings.frameCornerRadius);
  if (UI.phoneBgState) UI.phoneBgState.textContent = canvasSettings.phoneFrameBackground?.src ? 'loaded' : 'empty';
  if (UI.phoneBgVisibleToggle) {
    UI.phoneBgVisibleToggle.checked = !!canvasSettings.phoneBgEnabled;
    UI.phoneBgVisibleToggle.disabled = !isPhone;
  }
  if (UI.phoneSceneVisibleRow) UI.phoneSceneVisibleRow.classList.toggle('hidden', !isPhone);
}

function syncBackgroundVideoProgressUi() {
  const blurVideo = document.querySelector('.bg-blur-video');
  if (!UI.bgVideoProgress || !blurVideo || !Number.isFinite(blurVideo.duration) || blurVideo.duration <= 0) return;
  if (document.activeElement === UI.bgVideoProgress) return;
  const ratio = Math.max(0, Math.min(1, blurVideo.currentTime / blurVideo.duration));
  UI.bgVideoProgress.value = String(Math.round(ratio * 1000));
}

const prototypeBackgroundVideoEl = document.querySelector('.bg-blur-video');
prototypeBackgroundVideoEl?.addEventListener('timeupdate', syncBackgroundVideoProgressUi);
prototypeBackgroundVideoEl?.addEventListener('loadedmetadata', syncBackgroundVideoProgressUi);
prototypeBackgroundVideoEl?.addEventListener('error', () => {
  if (UI.bgVideoState) UI.bgVideoState.textContent = 'unsupported';
});

function applyStagePhoneBlur(shape) {
  const frame = document.getElementById('ui-frame');
  if (!frame) return;
  frame.classList.remove('stage-blur');
}

function applyResponseModeUi() {
  const isAi = responseMode === RESPONSE_MODE.AI;
  document.body.classList.toggle('mode-ai', isAi);
  document.body.classList.toggle('mode-manual', !isAi);
  if (UI.modeToggle) UI.modeToggle.checked = isAi;
}

function setIntentHeader(label, step) {
  const hdr = document.getElementById('intent-header');
  const lbl = document.getElementById('intent-label');
  const dot = document.getElementById('intent-step-dot');
  const slbl = document.getElementById('intent-step-lbl');
  if (!hdr || !lbl || !dot || !slbl) return;
  cancelPrototypeIntentHeaderTracking();
  hdr.classList.remove('glass-intent');
  hdr.style.display = 'flex';
  hdr.style.left = '';
  hdr.style.top = '';
  lbl.style.fontSize = '';
  lbl.style.color = '';
  lbl.textContent = label;
  if (step) {
    slbl.textContent = step;
    dot.classList.add('visible');
  } else {
    slbl.textContent = '';
    dot.classList.remove('visible');
  }
  hdr.classList.add('visible');
}

function hideIntentHeader() {
  const hdr = document.getElementById('intent-header');
  if (!hdr) return;
  cancelPrototypeIntentHeaderTracking();
  hdr.classList.remove('visible', 'glass-intent');
  hdr.style.display = 'none';
  hdr.style.left = '';
  hdr.style.top = '';
  const lbl = document.getElementById('intent-label');
  if (lbl) {
    lbl.style.fontSize = '';
    lbl.style.color = '';
  }
}

function cancelPrototypeIntentHeaderTracking() {
  if (!prototypeIntentHeaderTrackRaf) return;
  cancelAnimationFrame(prototypeIntentHeaderTrackRaf);
  prototypeIntentHeaderTrackRaf = null;
}

function positionPrototypeIntentHeaderAboveMain() {
  const hdr = document.getElementById('intent-header');
  const wrap = document.getElementById('stage-wrap');
  const main = document.getElementById('drop-main');
  if (!hdr || !wrap || !main) return;
  const wrapRect = wrap.getBoundingClientRect();
  const activeShape = String(selectedScenario()?.shape || '').trim().toLowerCase();
  let anchorRect = main.getBoundingClientRect();
  if (activeShape === 'list' || activeShape === 'list-pill') {
    const listRoot = document.getElementById('list-pills');
    const listPills = Array.from(listRoot?.querySelectorAll?.('[data-prototype-list-pill]') || []);
    if (listPills.length) {
      const bounds = listPills
        .map((pill) => pill.getBoundingClientRect())
        .filter((rect) => Number.isFinite(rect.width) && Number.isFinite(rect.height) && rect.width > 0 && rect.height > 0);
      if (bounds.length) {
        const left = Math.min(...bounds.map((rect) => rect.left));
        const right = Math.max(...bounds.map((rect) => rect.right));
        const top = Math.min(...bounds.map((rect) => rect.top));
        const bottom = Math.max(...bounds.map((rect) => rect.bottom));
        anchorRect = {
          left,
          right,
          top,
          bottom,
          width: right - left,
          height: bottom - top,
        };
      }
    }
  }
  const hdrRect = hdr.getBoundingClientRect();
  const headerH = Math.ceil(hdrRect.height || hdr.offsetHeight || 0);
  const centerX = Math.round((anchorRect.left + (anchorRect.width / 2)) - wrapRect.left);
  const top = Math.max(8, Math.round(anchorRect.top - wrapRect.top - headerH - 12));
  const headerW = Math.ceil(hdrRect.width || hdr.offsetWidth || 0);
  const left = Math.round(centerX - (headerW / 2));
  hdr.style.left = `${left}px`;
  hdr.style.top = `${top}px`;
}

function trackPrototypeIntentHeader(ms = anim.getAnimDuration() + 120) {
  cancelPrototypeIntentHeaderTracking();
  const end = performance.now() + Math.max(120, ms);
  const tick = () => {
    const hdr = document.getElementById('intent-header');
    if (!hdr || !hdr.classList.contains('glass-intent') || !hdr.classList.contains('visible')) return;
    positionPrototypeIntentHeaderAboveMain();
    if (performance.now() < end) prototypeIntentHeaderTrackRaf = requestAnimationFrame(tick);
    else prototypeIntentHeaderTrackRaf = null;
  };
  prototypeIntentHeaderTrackRaf = requestAnimationFrame(tick);
}

function syncPrototypeIntentHeader(scenario) {
  const stage = stageById(scenario?.shape, scenario);
  if (!scenario || !stageHasComponent(stage, 'intent-header')) {
    hideIntentHeader();
    return;
  }
  const stageText = stageTextForShape(scenario, scenario.shape);
  const typography = morphApi.getScenarioTypography(scenario, scenario.shape);
  const label = String(stageText.intentHeader || scenario.name || '').trim();
  const hdr = document.getElementById('intent-header');
  const lbl = document.getElementById('intent-label');
  const dot = document.getElementById('intent-step-dot');
  const slbl = document.getElementById('intent-step-lbl');
  if (!hdr || !lbl || !dot || !slbl) return;
  cancelPrototypeIntentHeaderTracking();
  lbl.textContent = label;
  lbl.style.fontSize = `${typography.intentHeader.size}px`;
  lbl.style.color = typography.intentHeader.color;
  slbl.textContent = '';
  dot.classList.remove('visible');
  hdr.style.display = 'flex';
  hdr.classList.add('glass-intent', 'visible');
  positionPrototypeIntentHeaderAboveMain();
  trackPrototypeIntentHeader();
}

function syncManualShapeButtonStates(shape = document.body?.dataset?.currentShape || '') {
  const actualShape = String(shape || '').trim();
  const displayShape = prototypeAiDebugState.active && actualShape === 'magic'
    ? 'magic'
    : actualShape;
  document.querySelectorAll('.sb-shape-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.shape === displayShape);
  });
}

function updateActive(shape) {
  syncManualShapeButtonStates(shape);
  syncPrototypeOrbChrome();
  syncPrototypeListeningPrompt(shape);
  syncPrototypeListeningOrb(shape);
}

function syncPrototypeOrbChrome() {
  if (prototypeOrbChromeSyncRaf) cancelAnimationFrame(prototypeOrbChromeSyncRaf);
  prototypeOrbChromeSyncRaf = requestAnimationFrame(() => {
    prototypeOrbChromeSyncRaf = requestAnimationFrame(() => {
      prototypeOrbChromeSyncRaf = 0;
      applyAiCelestialChrome(document);
    });
  });
}

function positionPrototypeListeningPrompt(hasText) {
  const prompt = document.getElementById('prototype-listening-prompt');
  if (!prompt) return;
  if (!isPrototypeListeningActive() || !hasText) {
    prompt.style.top = '';
    prompt.style.bottom = '';
    return;
  }
  const stage = document.getElementById('stage');
  const main = document.getElementById('drop-main');
  if (!stage || !main) return;
  const stageRect = stage.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const promptH = prompt.offsetHeight || 24;
  prompt.style.top = `${Math.max(8, Math.round(mainRect.top - stageRect.top - promptH - 12))}px`;
  prompt.style.bottom = 'auto';
}

function isPrototypeListeningActive() {
  return String(document.body?.dataset?.currentShape || '').trim().toLowerCase() === 'listening'
    || document.getElementById('drop-main')?.classList.contains('listening-orb');
}

function normalizePrototypeDictationChunk(text = '') {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function joinPrototypeDictationText(baseText = '', nextText = '') {
  const base = normalizePrototypeDictationChunk(baseText);
  const next = normalizePrototypeDictationChunk(nextText);
  if (!next) return base;
  if (!base) return next;
  if (base.toLowerCase().endsWith(next.toLowerCase())) return base;
  const baseWords = base.split(' ');
  const nextWords = next.split(' ');
  const maxOverlap = Math.min(baseWords.length, nextWords.length);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const baseSlice = baseWords.slice(-overlap).join(' ').toLowerCase();
    const nextSlice = nextWords.slice(0, overlap).join(' ').toLowerCase();
    if (baseSlice !== nextSlice) continue;
    const remainder = nextWords.slice(overlap).join(' ');
    return remainder ? `${base} ${remainder}` : base;
  }
  if (/[([{/"'`-]$/.test(base)) return `${base}${next}`;
  if (/[.?!,:;]$/.test(base)) return `${base} ${next}`;
  return `${base} ${next}`;
}

function ensurePrototypeListeningPromptStructure(prompt) {
  if (!prompt) return {};
  let finalEl = prompt.querySelector('[data-listening-prompt-final]');
  let interimEl = prompt.querySelector('[data-listening-prompt-interim]');
  if (!finalEl || !interimEl) {
    prompt.innerHTML = '<span class="prototype-listening-prompt-final" data-listening-prompt-final></span><span class="prototype-listening-prompt-interim" data-listening-prompt-interim></span>';
    finalEl = prompt.querySelector('[data-listening-prompt-final]');
    interimEl = prompt.querySelector('[data-listening-prompt-interim]');
  }
  return { finalEl, interimEl };
}

function syncPrototypeListeningPromptWidth(prompt) {
  if (!prompt) return;
  const frame = document.getElementById('ui-frame') || document.getElementById('stage');
  const frameWidth = Math.round(frame?.getBoundingClientRect?.().width || window.innerWidth || 0);
  const maxWidth = Math.max(280, Math.min(720, frameWidth - 24));
  prompt.style.maxWidth = `${maxWidth}px`;
  if (!prompt.classList.contains('visible') && !String(prototypeListeningPromptText || '').trim()) {
    prompt.style.width = '';
    return;
  }
  const previousWidth = prompt.style.width;
  prompt.style.width = 'auto';
  const measuredWidth = Math.ceil(prompt.scrollWidth);
  prompt.style.width = previousWidth;
  const nextWidth = Math.max(80, Math.min(maxWidth, measuredWidth));
  prompt.style.width = `${nextWidth}px`;
}

function syncPrototypeListeningPrompt(shape = document.body?.dataset?.currentShape || '') {
  const prompt = document.getElementById('prototype-listening-prompt');
  if (!prompt) return;
  const listeningShape = String(shape || '').trim().toLowerCase() === 'listening' || isPrototypeListeningActive();
  const finalText = listeningShape ? normalizePrototypeDictationChunk(prototypeListeningPromptFinalText) : '';
  const interimText = listeningShape ? normalizePrototypeDictationChunk(prototypeListeningPromptInterimText) : '';
  const text = listeningShape ? String(prototypeListeningPromptText || '').trim() : '';
  const { finalEl, interimEl } = ensurePrototypeListeningPromptStructure(prompt);
  if (finalEl) finalEl.textContent = finalText;
  if (interimEl) interimEl.textContent = interimText ? ` ${interimText}` : '';
  prompt.dataset.dictationState = interimText ? 'live' : (finalText ? 'settled' : '');
  prompt.classList.toggle('has-final', !!finalText);
  prompt.classList.toggle('has-interim', !!interimText);
  prompt.classList.toggle('is-settling-out', prompt.dataset.dismissing === 'true');
  syncPrototypeListeningPromptWidth(prompt);
  positionPrototypeListeningPrompt(!!text);
  prompt.classList.toggle('visible', listeningShape && !!text);
}

function setPrototypeListeningPromptText(text = '') {
  prototypeListeningPromptText = String(text || '');
  syncPrototypeListeningPrompt();
}

function clearPrototypeListeningPromptDismissTimer() {
  if (!prototypeListeningPromptDismissTimer) return;
  clearTimeout(prototypeListeningPromptDismissTimer);
  prototypeListeningPromptDismissTimer = null;
}

function schedulePrototypeListeningPromptDismiss() {
  clearPrototypeListeningPromptDismissTimer();
  const prompt = document.getElementById('prototype-listening-prompt');
  if (prompt) {
    prompt.dataset.dismissing = 'false';
    syncPrototypeListeningPrompt();
  }
  prototypeListeningPromptDismissTimer = setTimeout(() => {
    prototypeListeningPromptDismissTimer = null;
    const activePrompt = document.getElementById('prototype-listening-prompt');
    if (activePrompt) {
      activePrompt.dataset.dismissing = 'true';
      syncPrototypeListeningPrompt();
    }
    window.setTimeout(() => {
      if (prototypeListeningPromptInterimText) return;
      prototypeListeningPromptFinalText = '';
      prototypeListeningPromptText = '';
      if (activePrompt) activePrompt.dataset.dismissing = 'false';
      syncPrototypeListeningPrompt();
    }, 260);
  }, 1000);
}

function resetPrototypeListeningPromptText() {
  clearPrototypeListeningPromptDismissTimer();
  prototypeListeningPromptFinalText = '';
  prototypeListeningPromptInterimText = '';
  const prompt = document.getElementById('prototype-listening-prompt');
  if (prompt) prompt.dataset.dismissing = 'false';
  setPrototypeListeningPromptText('');
}

function setPrototypeListeningTranscript(text = '', isFinal = false) {
  const nextText = normalizePrototypeDictationChunk(text);
  if (!nextText) {
    if (!isFinal) {
      clearPrototypeListeningPromptDismissTimer();
      prototypeListeningPromptInterimText = '';
      setPrototypeListeningPromptText(prototypeListeningPromptFinalText);
    }
    return;
  }
  if (isFinal) {
    prototypeListeningPromptFinalText = joinPrototypeDictationText(prototypeListeningPromptFinalText, nextText);
    prototypeListeningPromptInterimText = '';
    setPrototypeListeningPromptText(prototypeListeningPromptFinalText);
    schedulePrototypeListeningPromptDismiss();
    return;
  }
  clearPrototypeListeningPromptDismissTimer();
  const prompt = document.getElementById('prototype-listening-prompt');
  if (prompt) prompt.dataset.dismissing = 'false';
  prototypeListeningPromptInterimText = nextText;
  setPrototypeListeningPromptText(joinPrototypeDictationText(prototypeListeningPromptFinalText, nextText));
}

function syncPrototypeListeningOrb(shape) {
  if (!prototypeVoice?.voiceEngine) return;
  if (shape === 'listening') {
    if (prototypeVoice.voiceEngine.supported === false || !prototypeVoice.voiceEngine.recognition) {
      prototypeListeningPromptFinalText = 'Voice input unavailable in this browser';
      setPrototypeListeningPromptText(prototypeListeningPromptFinalText);
      return;
    }
    prototypeVoice.voiceEngine.start('dictation');
    return;
  }
  resetPrototypeListeningPromptText();
  const dropMain = document.getElementById('drop-main');
  const preservingThinkingBridge = shape === 'magic' || shape === 'ai' || dropMain?.classList.contains('orb-thinking-bridge');
  prototypeVoice.voiceEngine.stop({ preserveOrbStyles: preservingThinkingBridge });
}

function enterPrototypeListening() {
  resetPrototypeListeningPromptText();
  syncPrototypeListeningPrompt('listening');
  if (prototypeVoice?.voiceEngine?.supported === false || !prototypeVoice?.voiceEngine?.recognition) {
    prototypeListeningPromptFinalText = 'Voice input unavailable in this browser';
    setPrototypeListeningPromptText(prototypeListeningPromptFinalText);
    return;
  }
  prototypeVoice?.voiceEngine?.start('dictation');
}

function exitPrototypeListening(nextShape = '') {
  if (String(nextShape || '').trim().toLowerCase() === 'listening') return;
  syncPrototypeListeningOrb(nextShape);
}

const anim = initAnimControls({ document, clamp });
prototypeVoice = initVoiceEngine({
  document,
  input: null,
  addSimLog: () => {},
  getGlassUi: () => null,
  getGlassState: () => null,
  shouldKeepCommandListening: () => morphApi?.getCurrentShape?.() === 'listening',
  shouldShowCommandViz: () => (
    isPrototypeListeningActive()
  ),
  shouldFilterTtsEcho: () => false,
  onTranscriptUpdate: (text, isFinal = false) => {
    if (isPrototypeListeningActive()) {
      setPrototypeListeningTranscript(text, isFinal);
    }
    const transcript = String(text || '');
    const prototypeInput = document.getElementById('user-input');
    if (!prototypeInput) return;
    prototypeInput.value = isPrototypeListeningActive()
      ? String(prototypeListeningPromptText || '')
      : transcript;
    prototypeInput.dispatchEvent(new Event('input', { bubbles: true }));
  },
});
stageLibrary = loadStageLibrary();
scenarioLibrary = loadScenarioLibrary();
selectedScenarioId = scenarioLibrary[0]?.id || '';

const orb = initOrbController({
  document,
  C,
  clearListPills: () => {
    morphApi?.clearPrototypeListStage?.(true);
    manualDemo?.clearListPills?.();
  },
  morphTo: (...args) => morphApi.morphTo(...args),
});

const prototypeTimer = {
  stageId: '',
  remainingSeconds: 180,
  elapsedSeconds: 0,
  mode: '',
  running: false,
  intervalId: null,
};

function isEditableKeyTarget(event) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const tagName = target.tagName.toLowerCase();
  return ['input', 'textarea', 'select', 'button'].includes(tagName) || Boolean(target.closest('[contenteditable="true"]'));
}

function formatPrototypeTimer(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function formatPrototypeRecorder(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function parsePrototypeTimer(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return 180;
  return (Number(match[1]) * 60) + Number(match[2]);
}

function isPrototypeRecorderStage(stageIdValue, scenario) {
  const stage = stageById(stageIdValue, scenario);
  const id = String(stageIdValue || '').trim().toLowerCase();
  const name = String(stage?.name || '').trim().toLowerCase();
  return id === 'recorder' || id.startsWith('recorder-') || name.includes('recorder');
}

function stopPrototypeTimer() {
  prototypeTimer.running = false;
  if (prototypeTimer.intervalId) {
    window.clearInterval(prototypeTimer.intervalId);
    prototypeTimer.intervalId = null;
  }
}

function renderPrototypeTimer() {
  if (!C.prim) return;
  C.prim.textContent = prototypeTimer.mode === 'recorder'
    ? formatPrototypeRecorder(prototypeTimer.elapsedSeconds)
    : formatPrototypeTimer(prototypeTimer.remainingSeconds);
}

function syncPrototypeTimerForScenario(scenario) {
  const stageIdValue = String(scenario?.shape || '');
  const renderShape = String(renderShapeForStageId(stageIdValue, scenario) || '');
  if (renderShape !== 'timer') {
    stopPrototypeTimer();
    prototypeTimer.stageId = '';
    return;
  }
  if (prototypeTimer.stageId !== stageIdValue) {
    stopPrototypeTimer();
    prototypeTimer.stageId = stageIdValue;
    prototypeTimer.mode = isPrototypeRecorderStage(stageIdValue, scenario) ? 'recorder' : 'timer';
    prototypeTimer.remainingSeconds = parsePrototypeTimer(stageTextForShape(scenario, stageIdValue).primary || '03:00');
    prototypeTimer.elapsedSeconds = 0;
  }
  renderPrototypeTimer();
}

function togglePrototypeTimer() {
  const scenario = selectedScenario();
  const stageIdValue = String(scenario?.shape || '');
  if (String(renderShapeForStageId(stageIdValue, scenario) || '') !== 'timer') return false;
  if (prototypeTimer.stageId !== stageIdValue) syncPrototypeTimerForScenario(scenario);
  if (prototypeTimer.running) {
    stopPrototypeTimer();
    return true;
  }
  prototypeTimer.running = true;
  prototypeTimer.intervalId = window.setInterval(() => {
    if (prototypeTimer.mode === 'recorder') {
      prototypeTimer.elapsedSeconds += 1;
    } else {
      prototypeTimer.remainingSeconds = Math.max(0, prototypeTimer.remainingSeconds - 1);
    }
    renderPrototypeTimer();
    if (prototypeTimer.mode !== 'recorder' && prototypeTimer.remainingSeconds <= 0) stopPrototypeTimer();
  }, 1000);
  return true;
}

function previewScenario(scenario) {
  if (!scenario) return;
  const currentShape = String(morphApi?.getCurrentShape?.() || '').trim().toLowerCase();
  const nextShape = String(renderShapeForStageId(scenario.shape, scenario) || '').trim().toLowerCase();
  if (currentShape === 'magic' && isPrototypeNormalRenderShape(nextShape)) {
    playSimEarcon('spread');
  }
  if (flight?.isActive()) flight.cancelFlightFlow();
  orb.stopSiriOrb();
  morphApi.hideRich();
  hideIntentHeader();
  document.getElementById('stage').classList.remove('flow-active');
  updateActive('');
  applyStagePhoneBlur(scenario.shape);
  morphApi.morphTo(renderShapeForStageId(scenario.shape, scenario), morphApi.scenarioToRenderContent(scenario), null, scenario.shape);
  syncPrototypeIntentHeader(scenario);
  syncPrototypeTimerForScenario(scenario);
}

function previewScenarioInstant(scenario) {
  if (!scenario) return;
  if (flight?.isActive()) flight.cancelFlightFlow();
  orb.stopSiriOrb();
  morphApi.hideRich();
  hideIntentHeader();
  document.getElementById('stage').classList.remove('flow-active');
  updateActive('');
  applyStagePhoneBlur(scenario.shape);
  const shape = renderShapeForStageId(scenario.shape, scenario);
  const content = morphApi.scenarioToRenderContent(scenario);
  const geo = morphApi.resolveGeometryForContent(shape, content, null, scenario.shape);
  const root = document.documentElement;
  root.style.setProperty('--anim-w', '0ms linear');
  root.style.setProperty('--anim-h', '0ms linear');
  root.style.setProperty('--anim-br', '0ms linear');
  root.style.setProperty('--anim-tx', '0ms linear');
  root.style.setProperty('--anim-t', '0ms linear');
  root.style.setProperty('--content-fade-ms', '0ms');
  root.style.setProperty('--detail-fade-ms', '0ms');
  root.style.setProperty('--media-fade-ms', '0ms');
  root.style.setProperty('--content-move-t', '0ms linear');
  root.style.setProperty('--primary-size-anim-ms', '0ms');
  root.style.setProperty('--text-size-anim-ms', '0ms');
  morphApi.clearUiFadeTimers();
  morphApi.setSuppressDeformation(true);
  morphApi.setCurrentShape(shape);
  morphApi.applyGeometry(shape, geo, scenario.shape, scenario);
  DROPS.main.style.setProperty('--home-glow-delay', '0ms');
  DROPS.main.classList.toggle('home-glow', shape === 'listening' || shape === 'magic');
  DROPS.main.classList.toggle('magic-glow', shape === 'magic');
  DROPS.main.classList.toggle('listening-orb', shape === 'listening');
  morphApi.applyContent(content);
  morphApi.applyContentPositions(shape, geo.main.w, geo.main.h, 0, 0, shape, geo.main.w, geo.main.h, null, null);
  if (shape === 'list') morphApi.showPrototypeListStage?.(content, { entering: false });
  else morphApi.clearPrototypeListStage?.(true);
  morphApi.setLastMainGeo({ ...geo.main });
  updateActive(shape);
  morphApi.setSuppressDeformation(false);
  syncPrototypeIntentHeader(scenario);
  syncPrototypeTimerForScenario(scenario);
  ['--anim-w','--anim-h','--anim-br','--anim-tx','--anim-t','--content-fade-ms','--detail-fade-ms','--media-fade-ms','--content-move-t','--primary-size-anim-ms','--text-size-anim-ms'].forEach((key) => root.style.removeProperty(key));
}

morphApi = initMorph({
  DROPS,
  C,
  detailMeasureEl,
  callbacks: {
    clamp,
    selectedScenario,
    stageById: (id, scenario = selectedScenario()) => stageById(id, scenario),
    updateActive,
    stopSiriOrb: (...args) => orb.stopSiriOrb(...args),
    startSiriOrb: (...args) => orb.startSiriOrb(...args),
    showAiIdle: (...args) => orb.showAiIdle(...args),
    collapseListStack: (...args) => {
      if (morphApi?.collapsePrototypeListStack) return morphApi.collapsePrototypeListStack(...args);
      return manualDemo?.collapseListStack?.(...args);
    },
    animateSplitMetaball: (...args) => manualDemo?.animateSplitMetaball?.(...args),
    normalizeStageSizeEntry,
    scenarioStageSizeOverride,
    stageCardImagePaddingForShape,
    stageMainSize,
    stageIconTextGap,
    stageIconLeftPadding,
    renderShapeForStageId: (id) => renderShapeForStageId(id, selectedScenario()),
    getCanvasSettings: () => canvasSettings,
    stageComponentCounts,
    stageHasComponent,
    stageTextForShape,
    stageIconForShape,
    stageListChipIconsForShape,
    stageListItemsForShape,
    stageListListeningOrbForShape,
    stageListSelectableForShape,
    stageImagesForShape,
    stageSelectedForShape,
    stageAccentColorForShape,
    stageSecondaryAccentColorForShape,
    stageNudgeDividerColorForShape,
    stageSelectedBlobTopCoreColorForShape,
    stageSelectedBlobTopEdgeColorForShape,
    stageSelectedBlobBottomCoreColorForShape,
    stageSelectedBlobBottomEdgeColorForShape,
    getPrototypeSelectionOverride: () => prototypeSelectionOverride,
    createIcon,
    getAnimDuration: anim.getAnimDuration,
    getEasingFns: anim.getEasingFns,
  },
});

const sidebar = initSidebar({
  UI,
  RESPONSE_MODE,
  AI_STAGE_OVERRIDE,
  clamp,
  selectedScenario,
  stageById,
  availableScenarioShapes,
  visibleScenarioStages,
  persistScenarios,
  persistStageLibrary: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(stageLibrary));
    } catch (err) {
      console.warn('Unable to persist stage library', err);
    }
  },
  persistCanvasSettings,
  persistBackgroundImageStorage,
  persistBackgroundVideoStorage,
  clearBackgroundImageStorage: () => deleteDurableJsonRecord(STORAGE_KEYS.backgroundImage, { label: 'background image' }),
  clearBackgroundVideoStorage: () => deleteDurableJsonRecord(STORAGE_KEYS.backgroundVideo, { label: 'background video' }),
  persistResponseMode,
  persistAiStageOverride,
  previewScenario,
  applyCanvasSettings,
  applyStagePhoneBlur,
  applyResponseModeUi,
  hideRich: morphApi.hideRich,
  hideIntentHeader,
  getScenarioTypography: morphApi.getScenarioTypography,
  createScenario,
  stageComponentCounts,
  STAGE_COMPONENT_TYPES,
  builtinStageById,
  scenarioStageSizeOverride,
  stageCardImagePaddingForShape,
  stageMainSize,
  stageIconTextGap,
  stageIconLeftPadding,
  stageVisibleEditorFields,
  stageHasComponent,
  stageTextForShape,
  stageIconForShape,
  stageListChipIconsForShape,
  stageListItemsForShape,
  stageListListeningOrbForShape,
  stageImagesForShape,
  stageRenderShapeForShape,
  stageSelectedForShape,
  stageAccentColorForShape,
  stageSecondaryAccentColorForShape,
  stageNudgeDividerColorForShape,
  stageSelectedBlobTopCoreColorForShape,
  stageSelectedBlobTopEdgeColorForShape,
  stageSelectedBlobBottomCoreColorForShape,
  stageSelectedBlobBottomEdgeColorForShape,
  normalizeTriggers,
  normalizeIconByShape,
  normalizeListChipIconsByShape,
  normalizeListItemsByShape,
  createIcon,
  createDefaultListItem,
  normalizeStageTextByShape,
  normalizeTypographyByShape,
  normalizeStageSizeByShape,
  normalizeImagesByShape,
  normalizeScenario,
  normalizeStage,
  stageId,
  getScenarioLibrary: () => scenarioLibrary,
  setScenarioLibrary: (value) => { setScenarioLibraryState(value); },
  getStageLibrary: () => stageLibrary,
  setStageLibrary: (value) => { stageLibrary = value; },
  getSelectedScenarioId: () => selectedScenarioId,
  setSelectedScenarioId: (value) => { selectedScenarioId = value; },
  getResponseMode: () => responseMode,
  getAiStageOverride: () => aiStageOverride,
});

manualDemo = initManualDemo({
  document,
  SHAPES,
  SCENARIO_SHAPES,
  createScenario,
  selectedScenario,
  previewScenario,
  morphTo: morphApi.morphTo,
  applyContentPositions: morphApi.applyContentPositions,
  hideRich: morphApi.hideRich,
  hideIntentHeader,
  stopSiriOrb: orb.stopSiriOrb,
  startSiriOrb: orb.startSiriOrb,
  showAiIdle: orb.showAiIdle,
  enterPrototypeListening,
  exitPrototypeListening,
  renderShapeForStageId,
  clearSplitTimers: morphApi.clearSplitTimers,
  scheduleSplitTimer: morphApi.scheduleSplitTimer,
  splitBridgeMs: morphApi.splitBridgeMs,
  getActiveEasing: morphApi.getActiveEasing,
  updateActive,
  morphApi,
  getCurrentShape: morphApi.getCurrentShape,
  setCurrentShape: morphApi.setCurrentShape,
  getLastMainGeo: morphApi.getLastMainGeo,
  setLastMainGeo: morphApi.setLastMainGeo,
  getSplitAnimStyleBackup: () => splitAnimStyleBackup,
  setSplitAnimStyleBackup: (value) => { splitAnimStyleBackup = value; },
  getSuppressDeformation: morphApi.getSuppressDeformation,
  setSuppressDeformation: morphApi.setSuppressDeformation,
  DROPS,
  C,
});

const { renderAiStageOverrideUi, previewAiStageOverride, renderScenarioUi, updateLayerPreviews, initSidebarTabs, initLayerRowToggles, initSidebarCollapsibleSections, bindTypographyInputs, isSupportedAssetFile, commitScenarioChange, commitStageChange, addStage, duplicateCurrentStage, deleteCurrentStage, resetCurrentStageToDefault, addScenario, duplicateScenario, deleteScenario, getScenarioImagesForStage } = sidebar;

const scenarioMatchesText = (scenario, text) => {
  const haystack = String(text || '').toLowerCase();
  return !!haystack && (scenario.name.toLowerCase().includes(haystack) || scenario.triggers.some((trigger) => haystack.includes(trigger.toLowerCase())));
};
const resolveScenario = (inputText) => scenarioLibrary.find((item) => scenarioMatchesText(item, inputText)) || selectedScenario();

flight = initManualFlight({
  hideRich: morphApi.hideRich,
  showRich: morphApi.showRich,
  morphTo: morphApi.morphTo,
  startSiriOrb: orb.startSiriOrb,
  stopSiriOrb: orb.stopSiriOrb,
  setIntentHeader,
  hideIntentHeader,
  createIcon,
  scenarioMatchesText,
  scenarioLibrary: () => scenarioLibrary,
  selectedScenario,
  renderScenarioUi,
  previewScenario,
  createScenario,
  scenarioToRenderContent: morphApi.scenarioToRenderContent,
  defaultTypographyForShape,
  SCENARIO_SHAPES,
  AI_STAGE_OVERRIDE,
  RESPONSE_MODE,
  getResponseMode: () => responseMode,
  getAiStageOverride: () => aiStageOverride,
  setSelectedScenarioId: (value) => { selectedScenarioId = value; },
  C,
  createRootCircle,
});

const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
actions = initManualActions({ input, sendBtn, flight, resolveScenario, previewScenario, renderScenarioUi, setSelectedScenarioId: (value) => { selectedScenarioId = value; } });

async function hydrateDurableScenarios() {
  const record = await readDurableJsonRecord(STORAGE_KEYS.scenarios);
  if (!Array.isArray(record?.value)) return;
  const durableRevision = Number(record.revision) || 0;
  if (durableRevision <= scenarioRevision) return;
  setScenarioLibraryState(normalizeScenarioLibrarySet(record.value));
  scenarioRevision = durableRevision;
  persistToStorage(STORAGE_KEYS.scenarioRevision, durableRevision, 'scenario revision');
  renderScenarioUi();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
  if (document.getElementById('stage')?.classList.contains('flow-active')) return;
  if (responseMode === RESPONSE_MODE.AI) previewAiStageOverride();
  else previewScenario(selectedScenario());
}

async function hydrateDurableBackgroundMedia() {
  const [imageRecord, videoRecord] = await Promise.all([
    readDurableJsonRecord(STORAGE_KEYS.backgroundImage),
    readDurableJsonRecord(STORAGE_KEYS.backgroundVideo),
  ]);
  const image = imageRecord?.value;
  if (typeof image?.src === 'string' && image.src) {
    canvasSettings = {
      ...canvasSettings,
      backgroundImage: image.src,
      backgroundImageAlpha: Math.max(0, Math.min(1, Number(image.alpha ?? canvasSettings.backgroundImageAlpha ?? 0.9))),
      backgroundEnabled: true,
      backgroundMediaKind: canvasSettings.backgroundMediaKind === 'video' ? 'video' : 'image',
    };
  }
  const video = videoRecord?.value;
  if (typeof video?.src === 'string' && video.src) {
    canvasSettings = {
      ...canvasSettings,
      backgroundEnabled: true,
      backgroundMediaKind: 'video',
      backgroundVideoPaused: video.paused === true,
      backgroundVideoProgress: Math.max(0, Math.min(1, Number(video.progress) || 0)),
      backgroundVideoAlpha: Math.max(0, Math.min(1, Number(video.alpha ?? 0.8))),
      backgroundVideoY: Math.max(-500, Math.min(500, Number(video.y) || 0)),
      backgroundVideo: {
        src: video.src,
        objectUrl: '',
        name: String(video.name || 'uploaded video'),
        type: String(video.type || ''),
      },
    };
  }
  persistCanvasSettings();
  applyCanvasSettings();
}

async function copyStagePng() {
  try {
    const ok = await copyStagePngToClipboard({ root: document.getElementById('stage-wrap'), documentRef: document });
    if (!ok) console.warn('[stage-capture] PNG copy did not complete.');
  } catch (err) {
    console.warn('[stage-capture] PNG copy failed:', err);
  }
}

async function exportStageSvg() {
  const ok = await exportStageSvgFile({ root: document.getElementById('stage-wrap'), filenamePrefix: 'genui-tool-stage', documentRef: document });
  if (!ok) console.warn('[stage-capture] SVG export did not complete.');
}

function fileSafeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function normalizeImportedStages(value) {
  if (!Array.isArray(value)) return null;
  const normalized = value.map((stage) => normalizeStage(stage, builtinStageById(stage?.id))).filter(Boolean);
  return normalized.length ? normalized : null;
}

async function exportPrototypeSetup() {
  const [backgroundImageRecord, backgroundVideoRecord] = await Promise.all([
    readDurableJsonRecord(STORAGE_KEYS.backgroundImage),
    readDurableJsonRecord(STORAGE_KEYS.backgroundVideo),
  ]);
  downloadJsonFile(`genui-prototype-setup-${fileSafeTimestamp()}.json`, {
    app: 'genui-prototype',
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedScenarioId,
    responseMode,
    aiStageOverride,
    aiOrbIcon: readStoredJson(STORAGE_KEYS.aiOrbIcon, null),
    scenarios: scenarioLibrary,
    stages: stageLibrary,
    settings: serializableCanvasSettings(),
    backgroundImage: backgroundImageRecord?.value || null,
    backgroundVideo: backgroundVideoRecord?.value || null,
  });
}

async function importPrototypeSetup(file) {
  if (!file) return;
  const text = await readFileText(file);
  const payload = JSON.parse(text);
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.scenarios)) {
    throw new Error('This is not a GenUI prototype setup file.');
  }
  const importedStages = normalizeImportedStages(payload.stages);
  if (importedStages) {
    localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(importedStages));
    stageLibrary = loadStageLibrary();
  }
  if (payload.settings && typeof payload.settings === 'object') {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload.settings));
    canvasSettings = loadCanvasSettings();
  }
  if (!PAGE_MODE_OVERRIDE && [RESPONSE_MODE.MANUAL, RESPONSE_MODE.AI].includes(payload.responseMode)) {
    responseMode = payload.responseMode;
    persistResponseMode();
  }
  if (Object.values(AI_STAGE_OVERRIDE).includes(payload.aiStageOverride)) {
    aiStageOverride = payload.aiStageOverride;
    persistAiStageOverride();
  }
  if (typeof payload.aiOrbIcon === 'string') {
    persistToStorage(STORAGE_KEYS.aiOrbIcon, payload.aiOrbIcon, 'AI orb icon');
  }
  setScenarioLibraryState(normalizeScenarioLibrarySet(payload.scenarios));
  if (scenarioLibrary.some((scenario) => scenario.id === payload.selectedScenarioId)) {
    selectedScenarioId = payload.selectedScenarioId;
  }
  persistScenarios();
  if (payload.backgroundImage && typeof payload.backgroundImage === 'object' && payload.backgroundImage.src) {
    await persistDurableJson(STORAGE_KEYS.backgroundImage, payload.backgroundImage, { label: 'background image' });
  } else {
    await deleteDurableJsonRecord(STORAGE_KEYS.backgroundImage, { label: 'background image' });
  }
  if (payload.backgroundVideo && typeof payload.backgroundVideo === 'object' && payload.backgroundVideo.src) {
    await persistDurableJson(STORAGE_KEYS.backgroundVideo, payload.backgroundVideo, { label: 'background video' });
  } else {
    await deleteDurableJsonRecord(STORAGE_KEYS.backgroundVideo, { label: 'background video' });
  }
  renderScenarioUi();
  applyResponseModeUi();
  renderAiStageOverrideUi();
  await hydrateDurableBackgroundMedia();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
  if (document.getElementById('stage')?.classList.contains('flow-active')) return;
  if (responseMode === RESPONSE_MODE.AI) previewAiStageOverride();
  else previewScenario(selectedScenario());
}

initManualBindings({
  document,
  UI,
  PAGE_MODE_OVERRIDE,
  RESPONSE_MODE,
  AI_STAGE_OVERRIDE,
  availableScenarioShapes,
  selectedScenario,
  stageById,
  normalizeScenarioCanvas,
  normalizeTriggers,
  normalizeIconByShape,
  normalizeListChipIconsByShape,
  normalizeListItemsByShape,
  createIcon,
  createDefaultListItem,
  normalizeStageTextByShape,
  normalizeTypographyByShape,
  normalizeStageSizeByShape,
  normalizeImagesByShape,
  scenarioStageSizeOverride,
  stageCardImagePaddingForShape,
  stageListItemsForShape,
  STAGE_COMPONENT_TYPES,
  clamp,
  canvasSettings: () => canvasSettings,
  setCanvasSettings: (value) => { canvasSettings = value; },
  persistCanvasSettings,
  persistScenarios,
  responseMode: () => responseMode,
  setResponseMode: (value) => { responseMode = value; },
  persistResponseMode,
  aiStageOverride: () => aiStageOverride,
  setAiStageOverride: (value) => { aiStageOverride = value; },
  persistAiStageOverride,
  renderAiStageOverrideUi,
  previewAiStageOverride,
  renderScenarioUi,
  addScenario,
  duplicateScenario,
  deleteScenario,
  commitScenarioChange,
  addStage,
  duplicateCurrentStage,
  deleteCurrentStage,
  resetCurrentStageToDefault,
  commitStageChange,
  getScenarioImagesForStage,
  isSupportedAssetFile,
  bindTypographyInputs,
  updateLayerPreviews,
  initSidebarTabs,
  initLayerRowToggles,
  initSidebarCollapsibleSections,
  applyCanvasSettings,
  applyStagePhoneBlur,
  applyResponseModeUi,
  previewScenarioInstant,
  previewScenario,
  morphTo: morphApi.morphTo,
  hideRich: morphApi.hideRich,
  hideIntentHeader,
  handleSend: actions.handleSend,
  manualShape: manualDemo.manualShape,
  openCustom: manualDemo.openCustom,
  movePrototypeListSelection: morphApi.movePrototypeListSelection,
  flight,
  rebuildAnim: anim.rebuildAnim,
  initStarfield: anim.initStarfield,
  setPrototypeSelectionOverride: (value) => {
    prototypeSelectionOverride = value ? { ...value } : null;
    syncPrototypeOrbChrome();
  },
  setPrototypeAiDebugState: (value = {}) => {
    prototypeAiDebugState.active = value.active === true;
    prototypeAiDebugState.mode = value.mode || prototypeAiDebugState.mode || 'thinking';
    syncManualShapeButtonStates();
  },
  getPrototypeAiDebugState: () => ({ ...prototypeAiDebugState }),
});

UI.prototypeSetupExport?.addEventListener('click', () => {
  void exportPrototypeSetup().catch((err) => console.warn('[prototype-setup] Export failed:', err));
});
UI.prototypeSetupImport?.addEventListener('click', (event) => { event.target.value = ''; });
UI.prototypeSetupImport?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!window.confirm('Import this setup and replace the current prototype stages?')) {
    event.target.value = '';
    return;
  }
  void importPrototypeSetup(file)
    .catch((err) => {
      console.warn('[prototype-setup] Import failed:', err);
      window.alert(err?.message || 'Import failed.');
    })
    .finally(() => { event.target.value = ''; });
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.altKey && !event.ctrlKey && !event.metaKey && !isEditableKeyTarget(event)) {
    if (togglePrototypeTimer()) {
      event.preventDefault();
      return;
    }
  }
});

document.addEventListener('keydown', (event) => {
  const action = getCaptureHotkeyAction(event);
  if (!action) return;
  event.preventDefault();
  if (action === 'copy-png') void copyStagePng();
  else void exportStageSvg();
});

Object.assign(window, {
  applyCustomShape: manualDemo.applyCustomShape,
  fireChip: actions.fireChip,
  handleSend: actions.handleSend,
  manualShape: manualDemo.manualShape,
  openCustom: manualDemo.openCustom,
  selectListItem: manualDemo.selectListItem,
  copyStagePng,
  exportStageSvg,
  exportPrototypeSetup,
  importPrototypeSetup,
});

void hydrateDurableScenarios();
void hydrateDurableBackgroundMedia();
