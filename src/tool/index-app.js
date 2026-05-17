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

const DROPS = { main: document.getElementById('drop-main'), left: document.getElementById('drop-left'), right: document.getElementById('drop-right') };
const C = { thumb: document.getElementById('c-thumb'), thumbLabel: document.getElementById('c-thumb-label'), thumbImg: document.getElementById('c-thumb-img'), prim: document.getElementById('c-primary'), sec: document.getElementById('c-secondary'), div: document.getElementById('c-divider'), det: document.getElementById('c-detail'), media: document.getElementById('c-media'), rich: document.getElementById('c-rich') };
const UI = buildUiRefs(document);
bindAiOrbIconStorageSync(document, window);
const detailMeasureEl = document.createElement('div');
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const createRootCircle = () => ({ icon: '', primary: '', secondary: '', detail: '' });
const PROTOTYPE_BACKGROUND_OPTIONS = [
  'assets/bg/living room.jpg',
  'assets/bg/living room 2.jpg',
  'assets/bg/desk.jpg',
  'assets/bg/work.jpg',
  'assets/bg/park.jpg',
  'assets/bg/street.jpg',
  'assets/bg/grocery store.jpg',
  'assets/bg/kitechen.jpg',
];
const DEFAULT_PROTOTYPE_BACKGROUND = PROTOTYPE_BACKGROUND_OPTIONS[0];

function normalizePrototypeBackground(src) {
  const value = String(src || '').trim();
  return PROTOTYPE_BACKGROUND_OPTIONS.includes(value) ? value : DEFAULT_PROTOTYPE_BACKGROUND;
}

let canvasSettings = loadCanvasSettings();
const hadSessionVideoSettings = canvasSettings.backgroundMediaKind === 'video';
if (hadSessionVideoSettings) {
  canvasSettings = {
    ...canvasSettings,
    backgroundMediaKind: 'image',
    backgroundVideoPaused: false,
    backgroundVideoProgress: 0,
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
const prototypeAiDebugState = { active: false, mode: 'thinking' };

const scenarioData = initScenarioData({ getStageLibrary: () => stageLibrary, getCanvasSettings: () => canvasSettings, clampFn: clamp });
const { SCENARIO_SHAPES, STAGE_COMPONENT_TYPES, SHAPES, defaultTypographyForShape, normalizeTypographyByShape, normalizeStage, normalizeIconByShape, normalizeListChipIconsByShape, normalizeListItemsByShape, normalizeImagesByShape, stageId, loadStageLibrary, stageById, builtinStageById, renderShapeForStageId, availableScenarioShapes, visibleScenarioStages, stageComponentCounts, stageHasComponent, stageVisibleEditorFields, createIcon, createDefaultListItem, normalizeStageTextByShape, normalizeScenarioCanvas, normalizeStageSizeEntry, normalizeStageSizeByShape, scenarioStageSizeOverride, stageMainSize, stageIconTextGap, stageIconLeftPadding, stageTextForShape, stageIconForShape, stageListChipIconsForShape, stageListItemsForShape, stageListListeningOrbForShape, stageListSelectableForShape, stageImagesForShape, stageRenderShapeForShape, stageSelectedForShape, stageAccentColorForShape, stageSecondaryAccentColorForShape, stageSelectedBlobTopCoreColorForShape, stageSelectedBlobTopEdgeColorForShape, stageSelectedBlobBottomCoreColorForShape, stageSelectedBlobBottomEdgeColorForShape, createScenario, normalizeTriggers, normalizeScenario, defaultScenarioLibrary } = scenarioData;

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
function persistCanvasSettings() {
  const serializable = {
    ...canvasSettings,
    backgroundVideo: canvasSettings?.backgroundVideo
      ? {
          name: canvasSettings.backgroundVideo.name || '',
          type: canvasSettings.backgroundVideo.type || '',
        }
      : null,
  };
  persistToStorage(STORAGE_KEYS.settings, serializable, 'canvas settings');
}
if (hadSessionVideoSettings) persistCanvasSettings();
function persistResponseMode() { if (!PAGE_MODE_OVERRIDE) persistToStorage(STORAGE_KEYS.mode, responseMode, 'response mode'); }
function persistAiStageOverride() { persistToStorage(STORAGE_KEYS.aiStage, aiStageOverride, 'AI stage override'); }

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
  const backgroundVideo = canvasSettings.backgroundVideo?.src ? canvasSettings.backgroundVideo : null;
  const backgroundMediaKind = backgroundVideo && canvasSettings.backgroundMediaKind === 'video' ? 'video' : 'image';
  document.body.classList.toggle('bg-off', !backgroundEnabled);
  document.body.classList.toggle('float-off', !canvasSettings.floatingEnabled);
  document.body.classList.toggle('stage-bottom-align', !!canvasSettings.bottomAlign);
  document.body.style.backgroundImage = 'none';
  document.body.style.backgroundPosition = '';
  document.body.style.backgroundSize = '';
  document.body.style.backgroundRepeat = '';
  if (blurBg) {
    blurBg.style.backgroundImage = backgroundEnabled && backgroundMediaKind === 'image' ? `url("${encodeURI(backgroundImage)}")` : 'none';
    blurBg.style.opacity = backgroundEnabled && backgroundMediaKind === 'image' ? '0.8' : '0';
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
      blurVideo.style.opacity = '0.8';
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
  if (UI.bgVideoState) UI.bgVideoState.textContent = backgroundVideo ? 'loaded' : 'empty';
  if (UI.bgVideoControls) UI.bgVideoControls.classList.toggle('hidden', !backgroundVideo);
  if (UI.bgVideoPlayToggle) {
    UI.bgVideoPlayToggle.textContent = canvasSettings.backgroundVideoPaused ? 'Play' : 'Pause';
    UI.bgVideoPlayToggle.disabled = !backgroundVideo;
  }
  if (UI.bgVideoProgress) {
    UI.bgVideoProgress.value = String(Math.round((Math.max(0, Math.min(1, Number(canvasSettings.backgroundVideoProgress) || 0))) * 1000));
    UI.bgVideoProgress.disabled = !backgroundVideo;
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
  const mainRect = main.getBoundingClientRect();
  const hdrRect = hdr.getBoundingClientRect();
  const headerH = Math.ceil(hdrRect.height || hdr.offsetHeight || 0);
  const centerX = Math.round((mainRect.left + (mainRect.width / 2)) - wrapRect.left);
  const top = Math.max(8, Math.round(mainRect.top - wrapRect.top - headerH - 12));
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
  if (document.body?.dataset?.currentShape !== 'listening' || !hasText) {
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

function syncPrototypeListeningPrompt(shape = document.body?.dataset?.currentShape || '') {
  const prompt = document.getElementById('prototype-listening-prompt');
  if (!prompt) return;
  const listeningShape = String(shape || '').trim().toLowerCase() === 'listening';
  const text = listeningShape ? String(prototypeListeningPromptText || '').trim() : '';
  prompt.textContent = text;
  positionPrototypeListeningPrompt(!!text);
  prompt.classList.toggle('visible', listeningShape && !!text);
}

function setPrototypeListeningPromptText(text = '') {
  prototypeListeningPromptText = String(text || '');
  syncPrototypeListeningPrompt();
}

function syncPrototypeListeningOrb(shape) {
  if (!prototypeVoice?.voiceEngine) return;
  if (shape === 'listening') {
    prototypeVoice.voiceEngine.start('command');
    return;
  }
  setPrototypeListeningPromptText('');
  const dropMain = document.getElementById('drop-main');
  const preservingThinkingBridge = shape === 'magic' || shape === 'ai' || dropMain?.classList.contains('orb-thinking-bridge');
  prototypeVoice.voiceEngine.stop({ preserveOrbStyles: preservingThinkingBridge });
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
    document.body?.dataset?.currentShape === 'listening' ||
    document.getElementById('drop-main')?.classList.contains('listening-orb')
  ),
  onTranscriptUpdate: (text) => {
    const transcript = String(text || '');
    setPrototypeListeningPromptText(transcript);
    const prototypeInput = document.getElementById('user-input');
    if (!prototypeInput) return;
    prototypeInput.value = transcript;
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

function previewScenario(scenario) {
  if (!scenario) return;
  if (flight?.isActive()) flight.cancelFlightFlow();
  orb.stopSiriOrb();
  morphApi.hideRich();
  hideIntentHeader();
  document.getElementById('stage').classList.remove('flow-active');
  updateActive('');
  applyStagePhoneBlur(scenario.shape);
  morphApi.morphTo(renderShapeForStageId(scenario.shape, scenario), morphApi.scenarioToRenderContent(scenario), null, scenario.shape);
  syncPrototypeIntentHeader(scenario);
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
    stageMainSize,
    stageIconTextGap,
    stageIconLeftPadding,
    renderShapeForStageId: (id) => renderShapeForStageId(id, selectedScenario()),
    getCanvasSettings: () => canvasSettings,
    stageComponentCounts,
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
});

void hydrateDurableScenarios();
void deleteDurableJsonRecord(STORAGE_KEYS.backgroundVideo, { label: 'background video' });
