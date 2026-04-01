import { STORAGE_KEYS, RESPONSE_MODE, PAGE_MODE_OVERRIDE, AI_STAGE_OVERRIDE, readStoredJson, loadCanvasSettings, loadResponseMode, loadAiStageOverride, persistToStorage } from '../app-state.js';
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

const DROPS = { main: document.getElementById('drop-main'), left: document.getElementById('drop-left'), right: document.getElementById('drop-right') };
const C = { thumb: document.getElementById('c-thumb'), thumbLabel: document.getElementById('c-thumb-label'), thumbImg: document.getElementById('c-thumb-img'), prim: document.getElementById('c-primary'), sec: document.getElementById('c-secondary'), div: document.getElementById('c-divider'), det: document.getElementById('c-detail'), media: document.getElementById('c-media'), rich: document.getElementById('c-rich') };
const UI = buildUiRefs(document);
const detailMeasureEl = document.createElement('div');
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const createRootCircle = () => ({ icon: '', primary: '', secondary: '', detail: '' });

let canvasSettings = loadCanvasSettings();
let responseMode = loadResponseMode();
let aiStageOverride = loadAiStageOverride();
let stageLibrary = [];
let scenarioLibrary = [];
let selectedScenarioId = '';
let morphApi = null;
let manualDemo = null;
let flight = null;
let actions = null;
let splitAnimStyleBackup = null;

const scenarioData = initScenarioData({ getStageLibrary: () => stageLibrary, getCanvasSettings: () => canvasSettings, clampFn: clamp });
const { SCENARIO_SHAPES, STAGE_COMPONENT_TYPES, SHAPES, defaultTypographyForShape, normalizeTypographyByShape, normalizeStage, normalizeIconByShape, normalizeImagesByShape, stageId, loadStageLibrary, stageById, builtinStageById, renderShapeForStageId, availableScenarioShapes, stageComponentCounts, stageHasComponent, stageVisibleEditorFields, createIcon, normalizeStageTextByShape, normalizeScenarioCanvas, normalizeStageSizeEntry, normalizeStageSizeByShape, scenarioStageSizeOverride, stageMainSize, stageIconTextGap, stageIconLeftPadding, stageTextForShape, stageIconForShape, stageImagesForShape, stageSelectedForShape, stageAccentColorForShape, createScenario, normalizeTriggers, normalizeScenario, defaultScenarioLibrary } = scenarioData;

function loadScenarioLibrary() {
  const stored = readStoredJson(STORAGE_KEYS.scenarios, null);
  const scenarios = Array.isArray(stored) ? stored.map(normalizeScenario).filter(Boolean) : defaultScenarioLibrary();
  scenarios.forEach((scenario) => {
    scenario.content.canvas = normalizeScenarioCanvas(scenario?.content?.canvas, { frameMode: canvasSettings?.frameMode || 'none' });
  });
  return scenarios.length ? scenarios : defaultScenarioLibrary();
}

function persistScenarios() { persistToStorage(STORAGE_KEYS.scenarios, scenarioLibrary, 'scenarios'); }
function persistCanvasSettings() { persistToStorage(STORAGE_KEYS.settings, canvasSettings, 'canvas settings'); }
function persistResponseMode() { if (!PAGE_MODE_OVERRIDE) persistToStorage(STORAGE_KEYS.mode, responseMode, 'response mode'); }
function persistAiStageOverride() { persistToStorage(STORAGE_KEYS.aiStage, aiStageOverride, 'AI stage override'); }

function selectedScenario() {
  return scenarioLibrary.find((item) => item.id === selectedScenarioId) || scenarioLibrary[0] || null;
}

function currentScenarioFrameMode() {
  return normalizeScenarioCanvas(selectedScenario()?.content?.canvas, { frameMode: canvasSettings.frameMode }).frameMode;
}

function applyCanvasSettings() {
  const frame = document.getElementById('ui-frame');
  const frameBg = document.getElementById('ui-frame-bg');
  const frameMode = currentScenarioFrameMode();
  const isPhone = frameMode === 'phone';
  const isGlasses = frameMode === 'glasses';
  document.body.classList.toggle('bg-off', !canvasSettings.backgroundEnabled);
  document.body.classList.toggle('float-off', !canvasSettings.floatingEnabled);
  document.body.classList.toggle('stage-bottom-align', !!canvasSettings.bottomAlign);
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
  if (UI.bgToggle) UI.bgToggle.checked = !!canvasSettings.backgroundEnabled;
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

function applyStagePhoneBlur(shape) {
  const frame = document.getElementById('ui-frame');
  if (!frame) return;
  const stage = stageById(shape);
  const shouldBlur = currentScenarioFrameMode() === 'phone' && !!canvasSettings.phoneFrameBackground?.src && !!stage?.phoneBgBlur;
  frame.classList.toggle('stage-blur', shouldBlur);
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
  document.getElementById('intent-header').classList.remove('visible');
}

function updateActive(shape) {
  document.querySelectorAll('.sb-shape-btn').forEach((b) => b.classList.toggle('active', b.dataset.shape === shape));
}

const anim = initAnimControls({ document, clamp });
stageLibrary = loadStageLibrary();
scenarioLibrary = loadScenarioLibrary();
selectedScenarioId = scenarioLibrary[0]?.id || '';

const orb = initOrbController({
  document,
  C,
  clearListPills: () => manualDemo?.clearListPills?.(),
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
  morphApi.morphTo(renderShapeForStageId(scenario.shape), morphApi.scenarioToRenderContent(scenario), null, scenario.shape);
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
  const shape = renderShapeForStageId(scenario.shape);
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
  morphApi.applyContent(content);
  morphApi.applyContentPositions(shape, geo.main.w, geo.main.h, 0, 0, shape, geo.main.w, geo.main.h, null, null);
  morphApi.setLastMainGeo({ ...geo.main });
  updateActive(shape);
  morphApi.setSuppressDeformation(false);
  ['--anim-w','--anim-h','--anim-br','--anim-tx','--anim-t','--content-fade-ms','--detail-fade-ms','--media-fade-ms','--content-move-t','--primary-size-anim-ms','--text-size-anim-ms'].forEach((key) => root.style.removeProperty(key));
}

morphApi = initMorph({
  DROPS,
  C,
  detailMeasureEl,
  callbacks: {
    clamp,
    selectedScenario,
    stageById,
    updateActive,
    stopSiriOrb: (...args) => orb.stopSiriOrb(...args),
    startSiriOrb: (...args) => orb.startSiriOrb(...args),
    showAiIdle: (...args) => orb.showAiIdle(...args),
    collapseListStack: (...args) => manualDemo?.collapseListStack?.(...args),
    animateSplitMetaball: (...args) => manualDemo?.animateSplitMetaball?.(...args),
    normalizeStageSizeEntry,
    scenarioStageSizeOverride,
    stageMainSize,
    stageIconTextGap,
    stageIconLeftPadding,
    renderShapeForStageId,
    getCanvasSettings: () => canvasSettings,
    stageComponentCounts,
    stageTextForShape,
    stageIconForShape,
    stageImagesForShape,
    stageSelectedForShape,
    stageAccentColorForShape,
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
  persistScenarios,
  persistStageLibrary: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.stageLibrary, JSON.stringify(stageLibrary));
    } catch (err) {
      console.warn('Unable to persist stage library', err);
    }
  },
  persistCanvasSettings,
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
  stageImagesForShape,
  stageSelectedForShape,
  stageAccentColorForShape,
  normalizeTriggers,
  normalizeIconByShape,
  createIcon,
  normalizeStageTextByShape,
  normalizeTypographyByShape,
  normalizeStageSizeByShape,
  normalizeImagesByShape,
  normalizeScenario,
  normalizeStage,
  stageId,
  getScenarioLibrary: () => scenarioLibrary,
  setScenarioLibrary: (value) => { scenarioLibrary = value; },
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

const { renderAiStageOverrideUi, previewAiStageOverride, renderScenarioUi, updateLayerPreviews, initSidebarTabs, initLayerRowToggles, initSidebarCollapsibleSections, bindTypographyInputs, isSupportedAssetFile, commitScenarioChange, commitStageChange, addStage, deleteCurrentStage, resetCurrentStageToDefault, addScenario, duplicateScenario, deleteScenario, getScenarioImagesForStage } = sidebar;

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

async function copyStagePng() {
  try {
    const ok = await copyStagePngToClipboard({ root: document.getElementById('stage'), documentRef: document });
    if (!ok) console.warn('[stage-capture] PNG copy did not complete.');
  } catch (err) {
    console.warn('[stage-capture] PNG copy failed:', err);
  }
}

async function exportStageSvg() {
  const ok = await exportStageSvgFile({ root: document.getElementById('stage'), filenamePrefix: 'genui-prototype-stage', documentRef: document });
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
  createIcon,
  normalizeStageTextByShape,
  normalizeTypographyByShape,
  normalizeStageSizeByShape,
  normalizeImagesByShape,
  scenarioStageSizeOverride,
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
  hideRich: morphApi.hideRich,
  hideIntentHeader,
  handleSend: actions.handleSend,
  manualShape: manualDemo.manualShape,
  openCustom: manualDemo.openCustom,
  flight,
  rebuildAnim: anim.rebuildAnim,
  initStarfield: anim.initStarfield,
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
