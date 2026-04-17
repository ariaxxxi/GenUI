import { STORAGE_KEYS, RESPONSE_MODE, PAGE_MODE_OVERRIDE, AI_STAGE_OVERRIDE, readStoredJson, loadCanvasSettings, loadResponseMode, loadAiStageOverride, loadAiVoiceEnabled, loadDisableTextInput, persistToStorage, persistDurableJson, readDurableJsonRecord } from "../app-state.js";
import { clamp } from "../utils.js";
import { initMorph } from "../shared/morph.js";
import { initScenarioData } from "../shared/scenario-data.js";
import { buildUiRefs, initSidebar } from "../shared/sidebar.js";
import { initAnimControls } from "../shared/anim-controls.js";
import { addSimLog, setSimVoice, setSimInputState, addChatBubble, showTypingBubble, hideTypingBubble, playSimEarcon } from "../sim-panel.js";
import { SHAPES, defaultTypographyForShape } from "../shapes.js";
import { initAiShell } from "./ai-shell.js";
import { initVoiceEngine } from "./voice-engine.js";
import { createMessageSendFlow } from "../flows/message-send.js";
import { createFlightBookingFlow } from "../flows/flight-booking.js";
import { createCoffeeOrderFlow } from "../flows/coffee-order.js";
import { initDemoControls } from "./demo-controls.js";
import { initInputActions } from "./input-actions.js";
import { initEditorBindings } from "./editor-bindings.js";
import { prewarmAiSpeechCache, refreshAiVoice, setAiVoiceEnabled, isAiVoiceEnabled } from "./tts-player.js";
import { initPhrases } from "./phrases.js";
import { copyStagePngToClipboard, exportStageSvg as exportStageSvgFile, getCaptureHotkeyAction, isEditableTarget } from "../shared/stage-capture.js";
import { applyAiCelestialChrome } from "../shared/celestial-selection-chrome.js";

const DROPS = { main: document.getElementById("drop-main"), left: document.getElementById("drop-left"), right: document.getElementById("drop-right") };
const C = { thumb: document.getElementById("c-thumb"), thumbLabel: document.getElementById("c-thumb-label"), thumbImg: document.getElementById("c-thumb-img"), prim: document.getElementById("c-primary"), sec: document.getElementById("c-secondary"), div: document.getElementById("c-divider"), det: document.getElementById("c-detail"), media: document.getElementById("c-media"), rich: document.getElementById("c-rich"), glassControlsLayer: document.getElementById("glass-controls-layer") };
const UI = buildUiRefs(document);
const input = document.getElementById("sim-input");
const detailMeasureEl = document.createElement("div");
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const FULLSCREEN_STAGE_OUTLINE_STORAGE_KEY = "genui_ai_fullscreen_stage_outline_visible";
let canvasSettings = loadCanvasSettings();
let responseMode = loadResponseMode();
let aiStageOverride = loadAiStageOverride();
let disableTextInput = loadDisableTextInput();
let scenarioRevision = Number(readStoredJson(STORAGE_KEYS.scenarioRevision, 0)) || 0;
let stageLibrary = [];
let scenarioLibrary = [];
let selectedScenarioId = "";
let preFlowShape = "circle";
const HOME_STATES = Object.freeze({ SLEEP: "sleep", CONTEXT: "context" });
const WAKE_WORD_RE = /\bhey\s+bixby\b/i;
const HOME_CONTEXTS = [
  { primary: "Design review", secondary: "in 12 min" },
  { primary: "Flight on time", secondary: "SFO • Gate B22" },
  { primary: "Buy milk", secondary: "Grocery list • Today" },
];
let homeState = HOME_STATES.CONTEXT;
let homeContextIndex = 0;
let aiAwake = false;
let sleepToListeningAnimTimer = null;
let listeningPromptText = "";
let coffeeFlow = null;
const isWeatherIntent = (text) => /\b(weather|forecast|temperature|rain|sunny|cloudy|humidity)\b/i.test(String(text || ""));
const stripWakeWord = (text) => String(text || "").replace(/\bhey\s+bixby\b/ig, " ").replace(/\s+/g, " ").trim();

const scenarioData = initScenarioData({ getStageLibrary: () => stageLibrary, getCanvasSettings: () => canvasSettings, clampFn: clamp });
const anim = initAnimControls({ document, clamp });
const { SCENARIO_SHAPES, STAGE_COMPONENT_TYPES, createScenario, createIcon, createDefaultListItem, loadStageLibrary, normalizeScenario, normalizeScenarioCanvas, normalizeTriggers, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeIconByShape, normalizeListChipIconsByShape, normalizeListItemsByShape, normalizeImagesByShape, stageById, builtinStageById, renderShapeForStageId, availableScenarioShapes, visibleScenarioStages, stageComponentCounts, stageHasComponent, stageVisibleEditorFields, stageTextForShape, stageIconForShape, stageListChipIconsForShape, stageListItemsForShape, stageImagesForShape, stageRenderShapeForShape, stageSelectedForShape, stageAccentColorForShape, stageSecondaryAccentColorForShape, stageId, scenarioStageSizeOverride, stageMainSize, stageIconTextGap, stageIconLeftPadding, normalizeStageSizeEntry, defaultScenarioLibrary, normalizeStage } = scenarioData;

function normalizeScenarioLibrarySet(source) {
  const scenarios = Array.isArray(source) ? source.map(normalizeScenario).filter(Boolean) : defaultScenarioLibrary();
  scenarios.forEach((scenario) => { scenario.content.canvas = normalizeScenarioCanvas(scenario?.content?.canvas, { frameMode: canvasSettings?.frameMode || "none" }); });
  return scenarios.length ? scenarios : defaultScenarioLibrary();
}
function loadScenarioLibrary() {
  return normalizeScenarioLibrarySet(readStoredJson(STORAGE_KEYS.scenarios, null));
}
function persistScenarios() {
  const revision = Date.now();
  const localScenarioOk = persistToStorage(STORAGE_KEYS.scenarios, scenarioLibrary, "scenarios");
  if (localScenarioOk) persistToStorage(STORAGE_KEYS.scenarioRevision, revision, "scenario revision");
  scenarioRevision = revision;
  void persistDurableJson(STORAGE_KEYS.scenarios, scenarioLibrary, { revision, label: "scenarios" });
}
function persistCanvasSettings() { persistToStorage(STORAGE_KEYS.settings, canvasSettings, "canvas settings"); }
function persistResponseMode() { if (!PAGE_MODE_OVERRIDE) persistToStorage(STORAGE_KEYS.mode, responseMode, "response mode"); }
function persistAiStageOverride() { persistToStorage(STORAGE_KEYS.aiStage, aiStageOverride, "AI stage override"); }
function persistAiVoiceEnabled(enabled) { persistToStorage(STORAGE_KEYS.aiVoiceEnabled, enabled !== false, "AI voice toggle"); }
function persistStageLibrary() { persistToStorage(STORAGE_KEYS.stages, stageLibrary, "stage library"); }
function selectedScenario() { return scenarioLibrary.find((item) => item.id === selectedScenarioId) || scenarioLibrary[0] || null; }
function setScenarioLibraryState(nextLibrary) {
  scenarioLibrary = nextLibrary;
  if (!scenarioLibrary.some((item) => item.id === selectedScenarioId)) {
    selectedScenarioId = scenarioLibrary[0]?.id || "";
  }
}

const shell = initAiShell({
  document,
  C,
  input,
  clearListPills: () => {
    morph?.clearPrototypeListStage?.(true);
    demo?.clearListPills?.();
  },
  morphTo: (...args) => morph.morphTo(...args),
  getAnimDuration: anim.getAnimDuration,
  getGlassState: () => messageFlow?.GS,
  getGlassUi: () => messageFlow?.flow,
  getVoiceMode: () => voice?.voiceEngine?.mode,
});
const homeStateDotEl = document.getElementById("home-state-dot");

function updateHomeDebugButtons() {
  document.querySelectorAll(".ai-legacy-actions [data-home-state]").forEach((btn) => {
    btn.classList.toggle("active-home", btn.dataset.homeState === homeState);
  });
}

function setHomeStateData(nextState) {
  homeState = nextState;
  document.body.dataset.aiHomeState = nextState;
  syncHomeContextTextClasses(window.currentShape || "");
  updateHomeDebugButtons();
}
function syncHomeContextTextClasses(shape) {
  const isContextPill = homeState === HOME_STATES.CONTEXT && shape === "pill";
  C.prim?.classList.toggle("home-context-prim", isContextPill);
  C.sec?.classList.toggle("home-context-second", isContextPill);
}

function homeContextContent(idx = homeContextIndex) {
  const value = HOME_CONTEXTS[idx % HOME_CONTEXTS.length];
  return { icon: createIcon("none", ""), primary: value.primary, secondary: value.secondary, detail: "" };
}
let homeMeasureCtx = null;
function measureHomeTextWidth(text, { size = 18, weight = 400 } = {}) {
  const value = String(text || "").trim();
  if (!value) return 0;
  if (!homeMeasureCtx) {
    const canvas = document.createElement("canvas");
    homeMeasureCtx = canvas.getContext("2d");
  }
  if (!homeMeasureCtx) return value.length * size * 0.6;
  homeMeasureCtx.font = `${weight} ${size}px "DM Sans", sans-serif`;
  return Math.ceil(homeMeasureCtx.measureText(value).width);
}
function homeContextGeo(content = homeContextContent()) {
  const primary = String(content?.primary || "").trim();
  const secondary = String(content?.secondary || "").trim();
  const leftPad = 24;
  const rightPad = 24;
  const dot = 6;
  const dotToPrimary = 10;
  const primaryToDivider = 10;
  const dividerToSecondary = 10;
  const divider = primary && secondary ? 1 : 0;
  const primaryW = measureHomeTextWidth(primary, { size: 20, weight: 600 });
  const secondaryW = measureHomeTextWidth(secondary, { size: 18, weight: 400 });
  const core = dot + dotToPrimary + primaryW + (divider ? (primaryToDivider + divider + dividerToSecondary) : 0) + secondaryW;
  const w = Math.max(140, leftPad + core + rightPad);
  const h = 46;
  const tx = -w / 2;
  const ty = -h / 2 - 18;
  return {
    main: { w, h, br: "30px", tx, ty, op: 1 },
    left: { w: h, h, br: "23px", tx, ty, op: 0 },
    right: { w: h, h, br: "23px", tx, ty, op: 0 },
  };
}
function homeCircleGeo() {
  const w = 14;
  const h = 14;
  const bottomGap = 12;
  const tx = -w / 2;
  const ty = -(h / 2) - bottomGap;
  return {
    main: { w, h, br: "7px", tx, ty, op: 1 },
    left: { w, h, br: "7px", tx, ty, op: 0 },
    right: { w, h, br: "7px", tx, ty, op: 0 },
  };
}

function clearStageFlowFlags() {
  document.getElementById("stage")?.classList.remove("flow-active");
  document.getElementById("stage-wrap")?.classList.remove("flow-active");
}

function clearGlassFlowUiImmediate() {
  document.body.classList.remove("glass-flow-active");
  if (C.rich) {
    C.rich.innerHTML = "";
    C.rich.classList.remove("visible", "glass-active", "glass-sent");
    C.rich.dataset.glassState = "";
    C.rich.style.opacity = "";
    C.rich.style.transform = "";
  }
  if (C.glassControlsLayer) {
    C.glassControlsLayer.innerHTML = "";
    C.glassControlsLayer.classList.remove("visible");
  }
  shell.hideIntentHeader?.();
}

function ensurePassiveCommandListening() {
  if (messageFlow?.isActive?.() || flightFlow?.isActive?.() || coffeeFlow?.isActive?.()) return;
  voice?.voiceEngine?.start?.("command");
}

function ensureHomeAwake() {
  if (homeState !== HOME_STATES.SLEEP) return;
  enterHomeContext();
}

function resetActiveFlows() {
  if (messageFlow?.isActive?.()) { messageFlow.reset(); return true; }
  if (flightFlow?.isActive?.()) { flightFlow.reset(); return true; }
  if (coffeeFlow?.isActive?.()) { coffeeFlow.reset(); return true; }
  return false;
}

function teardownAiMode() {
  aiAwake = false;
  listeningPromptText = "";
  voice?.clearVoiceVizStyles?.();
  shell.stopSiriOrb();
  clearGlassFlowUiImmediate();
  morph.hideRich();
  clearStageFlowFlags();
}

function enterSleep(options = {}) {
  if (options?.source !== "flow-reset" && resetActiveFlows()) return;
  teardownAiMode();
  setHomeStateData(HOME_STATES.SLEEP);
  morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" });
  updateActive("circle");
  ensurePassiveCommandListening();
}

function enterHomeContext(options = {}) {
  if (options?.source !== "flow-reset" && resetActiveFlows()) return;
  const cycle = options?.cycle === true;
  const previous = homeState;
  if (cycle) homeContextIndex = (homeContextIndex + 1) % HOME_CONTEXTS.length;
  const fromSleep = previous === HOME_STATES.SLEEP;
  teardownAiMode();
  setHomeStateData(HOME_STATES.CONTEXT);
  if (fromSleep && homeStateDotEl) {
    homeStateDotEl.classList.remove("to-context");
    void homeStateDotEl.offsetWidth;
    homeStateDotEl.classList.add("to-context");
    setTimeout(() => homeStateDotEl.classList.remove("to-context"), 520);
  }
  morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" }, homeCircleGeo());
  preFlowShape = "circle";
  updateActive("circle");
  ensurePassiveCommandListening();
}

function cycleHomeContext() {
  if (homeState !== HOME_STATES.CONTEXT) return enterHomeContext({ cycle: false });
  enterHomeContext({ cycle: true });
}

function setHomeState(nextState) {
  if (nextState === HOME_STATES.SLEEP) return enterSleep();
  if (nextState === HOME_STATES.CONTEXT) {
    if (homeState === HOME_STATES.CONTEXT) return cycleHomeContext();
    return enterHomeContext();
  }
}

function returnToHomeContext() {
  enterHomeContext({ source: "flow-reset" });
}

function syncAiOrbChrome() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applyAiCelestialChrome(document);
    });
  });
}

function armAiWakeListening(options = {}) {
  const source = String(options?.source || "");
  const force = options?.force === true;
  const allowHomeWake =
    force ||
    source === "wake-word" ||
    source === "keyboard-l" ||
    source === "legacy-button";
  const fromHomeOrSleep = homeState === HOME_STATES.SLEEP || (homeState === HOME_STATES.CONTEXT && morph.getCurrentShape() === "circle");
  // Guardrail: only voice wake word can move home/sleep -> listening.
  if (fromHomeOrSleep && !allowHomeWake) return;
  if (force) {
    if (messageFlow?.isActive?.()) messageFlow.reset();
    if (flightFlow?.isActive?.()) flightFlow.reset();
    if (coffeeFlow?.isActive?.()) coffeeFlow.reset();
  }
  aiAwake = true;
  listeningPromptText = "";
  const fromSleep = homeState === HOME_STATES.SLEEP;
  const fromHome = homeState === HOME_STATES.CONTEXT && morph.getCurrentShape() === "circle";
  if (homeState === HOME_STATES.SLEEP) {
    teardownAiMode();
    setHomeStateData(HOME_STATES.CONTEXT);
  }
  if (!messageFlow?.isActive() && !flightFlow?.isActive() && !coffeeFlow?.isActive?.()) {
    voice?.voiceEngine?.start?.("command");
    if (fromSleep || fromHome) {
      document.body.classList.remove("sleep-to-listening");
      document.body.classList.remove("home-to-listening");
      void document.body.offsetWidth;
      if (fromSleep) document.body.classList.add("sleep-to-listening");
      if (fromHome) document.body.classList.add("home-to-listening");
      if (sleepToListeningAnimTimer) clearTimeout(sleepToListeningAnimTimer);
      sleepToListeningAnimTimer = setTimeout(() => {
        document.body.classList.remove("sleep-to-listening");
        document.body.classList.remove("home-to-listening");
        sleepToListeningAnimTimer = null;
      }, 560);
    }
    morph.morphTo("listening", { icon: "", primary: "", secondary: "", detail: "" });
    syncAiOrbChrome();
    updateActive("listening");
  }
}

function updateActive(shape) {
  window.currentShape = shape;
  syncHomeContextTextClasses(shape);
  document.querySelectorAll(".sb-shape-btn").forEach((b) => {
    if (b.dataset.shape) b.classList.toggle("active", b.dataset.shape === shape);
  });
  const prompt = document.getElementById("home-start-prompt");
  if (!prompt) return;
  const positionListeningPrompt = (hasText) => {
    if (shape !== "listening" || !hasText) {
      prompt.style.top = "";
      prompt.style.bottom = "";
      return;
    }
    const stage = document.getElementById("stage");
    const main = document.getElementById("drop-main");
    if (!stage || !main) return;
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const promptH = prompt.offsetHeight || 24;
    prompt.style.top = `${Math.max(8, Math.round(mainRect.top - stageRect.top - promptH - 12))}px`;
    prompt.style.bottom = "auto";
  };
  const updatePromptText = () => {
    prompt.textContent = shape === "listening" ? String(listeningPromptText || "").trim() : "";
    positionListeningPrompt(!!prompt.textContent);
  };
  if (homeState === HOME_STATES.SLEEP) {
    updatePromptText();
    prompt.classList.remove("visible", "to-thinking");
    return;
  }
  if (shape === "circle" || shape === "listening") {
    updatePromptText();
    prompt.classList.remove("to-thinking");
    prompt.classList.toggle("visible", shape !== "listening" || !!prompt.textContent);
  } else if (shape === "magic") {
    updatePromptText();
    shell.animateHomePromptToThinking();
  } else {
    updatePromptText();
    prompt.classList.remove("visible");
  }
}

stageLibrary = loadStageLibrary();
scenarioLibrary = loadScenarioLibrary();
selectedScenarioId = scenarioLibrary[0]?.id || "";

const morph = initMorph({
  DROPS,
  C,
  detailMeasureEl,
  callbacks: {
    clamp, selectedScenario, stageById: (id, scenario = selectedScenario()) => stageById(id, scenario), updateActive,
    stopSiriOrb: (...args) => shell.stopSiriOrb(...args),
    startSiriOrb: (...args) => shell.startSiriOrb(...args),
    showAiIdle: (...args) => shell.showAiIdle(...args),
    collapseListStack: (...args) => {
      if (morph?.collapsePrototypeListStack) return morph.collapsePrototypeListStack(...args);
      return demo?.collapseListStack?.(...args);
    },
    animateSplitMetaball: () => {},
    normalizeStageSizeEntry, scenarioStageSizeOverride, stageMainSize, stageIconTextGap, stageIconLeftPadding, renderShapeForStageId: (id) => renderShapeForStageId(id, selectedScenario()),
    getCanvasSettings: () => canvasSettings, stageComponentCounts, stageTextForShape, stageIconForShape, stageListChipIconsForShape, stageListItemsForShape, stageImagesForShape, stageSelectedForShape, stageAccentColorForShape, stageSecondaryAccentColorForShape, createIcon,
    getAnimDuration: anim.getAnimDuration, getEasingFns: anim.getEasingFns, shouldPreserveRich: () => document.body.classList.contains("glass-flow-active"), getBottomAlignRefHeight: () => 420,
  },
});
const sidebar = initSidebar({
  UI, RESPONSE_MODE, AI_STAGE_OVERRIDE, clamp, selectedScenario, stageById, availableScenarioShapes, visibleScenarioStages, persistScenarios, persistStageLibrary, persistCanvasSettings, persistResponseMode, persistAiStageOverride, previewScenario, applyCanvasSettings, applyStagePhoneBlur, applyResponseModeUi, hideRich: morph.hideRich, hideIntentHeader: shell.hideIntentHeader, getScenarioTypography: morph.getScenarioTypography, createScenario, stageComponentCounts, STAGE_COMPONENT_TYPES, builtinStageById, scenarioStageSizeOverride, stageVisibleEditorFields, stageHasComponent, stageTextForShape, stageIconForShape, stageListChipIconsForShape, stageListItemsForShape, stageImagesForShape, stageRenderShapeForShape, stageSelectedForShape, stageAccentColorForShape, stageSecondaryAccentColorForShape, normalizeTriggers, normalizeIconByShape, normalizeListChipIconsByShape, normalizeListItemsByShape, createIcon, createDefaultListItem, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeImagesByShape, normalizeScenario, normalizeStage, stageId, getScenarioLibrary: () => scenarioLibrary, setScenarioLibrary: (value) => { setScenarioLibraryState(value); }, getStageLibrary: () => stageLibrary, setStageLibrary: (value) => { stageLibrary = value; }, getSelectedScenarioId: () => selectedScenarioId, setSelectedScenarioId: (value) => { selectedScenarioId = value; }, getResponseMode: () => responseMode, getAiStageOverride: () => aiStageOverride,
});
let actions = null;
const voice = initVoiceEngine({
  document,
  input,
  addSimLog,
  getGlassUi: () => messageFlow?.flow,
  getGlassState: () => messageFlow?.GS,
  shouldKeepCommandListening: () => true,
  shouldShowCommandViz: () => (
    aiAwake ||
    morph.getCurrentShape() === "listening" ||
    document.getElementById("drop-main")?.classList.contains("listening-orb") ||
    messageFlow?.isActive?.() ||
    flightFlow?.isActive?.()
  ),
  onTranscriptUpdate: (text, isFinal) => {
    if (messageFlow?.isActive()) return messageFlow.onTranscriptUpdate(text, isFinal);
    const transcript = String(text || "");
    listeningPromptText = transcript;
    if (input) {
      input.value = transcript;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (morph.getCurrentShape() === "listening") updateActive("listening");
    if (!isFinal) return;
    const finalText = transcript.trim();
    if (!finalText) {
      listeningPromptText = "";
      if (morph.getCurrentShape() === "listening") updateActive("listening");
      return;
    }
    const hasWakeWord = WAKE_WORD_RE.test(finalText);
    if (!aiAwake) {
      if (!hasWakeWord) {
        if (input) input.value = "";
        return;
      }
      armAiWakeListening({ source: "wake-word" });
    }
    const requestText = hasWakeWord ? stripWakeWord(finalText) : finalText;
    if (!requestText) {
      listeningPromptText = "";
      if (input) input.value = "";
      if (morph.getCurrentShape() === "listening") updateActive("listening");
      return;
    }
    if (isWeatherIntent(requestText)) {
      void actions?.processRequest(requestText);
      listeningPromptText = "";
      if (input) input.value = "";
      if (morph.getCurrentShape() === "listening") updateActive("listening");
      return;
    }
    void actions?.processRequest(requestText);
    listeningPromptText = "";
    if (input) input.value = "";
    if (morph.getCurrentShape() === "listening") updateActive("listening");
  },
});
const flightFlow = createFlightBookingFlow({ SHAPES, C, morph, shell, voice, input, addChatBubble, hideTypingBubble, returnToHomeContext, playEarcon: playSimEarcon });
const messageFlow = createMessageSendFlow({ SHAPES, C, morph, shell, voice, input, setSimVoice, setSimInputState, addSimLog, playEarcon: playSimEarcon, clamp, getPreFlowShape: () => preFlowShape, setPreFlowShape: (value) => { preFlowShape = value; }, updateActive, returnToHomeContext });
coffeeFlow = createCoffeeOrderFlow({ SHAPES, C, morph, shell, voice, input, returnToHomeContext });
const demo = initDemoControls({ document, SHAPES, SCENARIO_SHAPES, createScenario, selectedScenario, previewScenario, morph, shell, voice, renderShapeForStageId, updateActive, getCurrentShape: morph.getCurrentShape, getPreFlowShape: () => preFlowShape, setPreFlowShape: (value) => { preFlowShape = value; }, messageFlow, startGlassFlow: () => messageFlow.start() });
actions = initInputActions({ input, ensureHomeAwake, canProcessRequest: () => aiAwake || messageFlow?.isActive?.() || flightFlow?.isActive?.() || coffeeFlow?.isActive?.(), responseMode: () => responseMode, RESPONSE_MODE, selectedScenario, scenarioLibrary: () => scenarioLibrary, createScenario, createIcon, renderScenarioUi: sidebar.renderScenarioUi, setSelectedScenarioId: (value) => { selectedScenarioId = value; }, previewScenario, messageFlow, flightFlow, coffeeFlow, voice, morph });

function currentScenarioFrameMode() { return normalizeScenarioCanvas(selectedScenario()?.content?.canvas, { frameMode: canvasSettings.frameMode }).frameMode; }
function applyCanvasSettings() { const frame = document.getElementById("ui-frame"); const frameBg = document.getElementById("ui-frame-bg"); const frameMode = currentScenarioFrameMode(); const isPhone = frameMode === "phone"; const isGlasses = frameMode === "glasses"; document.body.classList.toggle("bg-off", !canvasSettings.backgroundEnabled); document.body.classList.toggle("float-off", !canvasSettings.floatingEnabled); document.body.classList.add("stage-bottom-align"); if (frame) { frame.classList.toggle("phone", isPhone); frame.classList.toggle("glasses", isGlasses); frame.classList.remove("stage-blur"); frame.classList.toggle("phone-scene-off", isPhone && !canvasSettings.phoneBgEnabled); frame.style.setProperty("--phone-frame-w", `${canvasSettings.phoneFrameWidth}px`); frame.style.setProperty("--phone-frame-h", `${canvasSettings.phoneFrameHeight}px`); frame.style.setProperty("--frame-corner-radius", `${canvasSettings.frameCornerRadius}px`); frame.classList.toggle("has-bg", isPhone && !!canvasSettings.phoneBgEnabled && !!canvasSettings.phoneFrameBackground?.src); } if (frameBg) frameBg.style.backgroundImage = canvasSettings.phoneFrameBackground?.src ? `url("${canvasSettings.phoneFrameBackground.src}")` : ""; if (UI.bgToggle) UI.bgToggle.checked = !!canvasSettings.backgroundEnabled; if (UI.floatToggle) UI.floatToggle.checked = !!canvasSettings.floatingEnabled; if (UI.alignBottomToggle) UI.alignBottomToggle.checked = true; if (UI.framePhoneToggle) UI.framePhoneToggle.checked = isPhone; if (UI.frameGlassesToggle) UI.frameGlassesToggle.checked = isGlasses; if (UI.phoneFrameControls) UI.phoneFrameControls.classList.toggle("hidden", !isPhone); if (UI.phoneFrameWidth) UI.phoneFrameWidth.value = String(canvasSettings.phoneFrameWidth); if (UI.phoneFrameHeight) UI.phoneFrameHeight.value = String(canvasSettings.phoneFrameHeight); if (UI.frameCornerRadius) UI.frameCornerRadius.value = String(canvasSettings.frameCornerRadius); }
function applyStagePhoneBlur(shape) { const frame = document.getElementById("ui-frame"); if (!frame) return; const stage = stageById(shape, selectedScenario()); const shouldBlur = currentScenarioFrameMode() === "phone" && !!canvasSettings.phoneFrameBackground?.src && !!stage?.phoneBgBlur; frame.classList.toggle("stage-blur", shouldBlur); }
function applyResponseModeUi() { const isAi = responseMode === RESPONSE_MODE.AI; document.body.classList.toggle("mode-ai", isAi); document.body.classList.toggle("mode-manual", !isAi); if (UI.modeToggle) UI.modeToggle.checked = isAi; }
function syncPrototypeIntentHeader(scenario) { const stage = stageById(scenario?.shape, scenario); if (!scenario || !stageHasComponent(stage, "intent-header")) { shell.hideIntentHeader(); return; } const stageText = stageTextForShape(scenario, scenario.shape); const typography = morph.getScenarioTypography(scenario, scenario.shape); const label = String(stageText.intentHeader || scenario.name || "").trim(); document.getElementById("intent-header")?.classList.add("glass-intent"); shell.setIntentHeader(label, ""); const intentLabel = document.getElementById("intent-label"); if (intentLabel) { intentLabel.style.fontSize = `${typography.intentHeader.size}px`; intentLabel.style.color = typography.intentHeader.color; } shell.positionIntentHeaderAboveMain(); shell.trackIntentHeaderForTransition(); }
function previewScenario(scenario) { if (!scenario) return; if (flightFlow.isActive()) flightFlow.reset(); if (coffeeFlow?.isActive?.()) coffeeFlow.reset(); shell.stopSiriOrb(); morph.hideRich(); shell.hideIntentHeader(); document.getElementById("stage").classList.remove("flow-active"); document.getElementById("stage-wrap")?.classList.remove("flow-active"); updateActive(""); applyStagePhoneBlur(scenario.shape); morph.morphTo(renderShapeForStageId(scenario.shape, scenario), morph.scenarioToRenderContent(scenario), null, scenario.shape); syncPrototypeIntentHeader(scenario); }
function previewAiStageOverride() { if (responseMode !== RESPONSE_MODE.AI) return; const scenario = selectedScenario(); if (!scenario) return; if (aiStageOverride === AI_STAGE_OVERRIDE.AUTO) return previewScenario(scenario); const overrideShape = availableScenarioShapes().includes(aiStageOverride) ? aiStageOverride : scenario.shape; previewScenario(createScenario({ ...scenario, shape: overrideShape, content: scenario.content, triggers: scenario.triggers })); }

async function hydrateDurableScenarios() {
  const record = await readDurableJsonRecord(STORAGE_KEYS.scenarios);
  if (!Array.isArray(record?.value)) return;
  const durableRevision = Number(record.revision) || 0;
  if (durableRevision <= scenarioRevision) return;
  setScenarioLibraryState(normalizeScenarioLibrarySet(record.value));
  scenarioRevision = durableRevision;
  persistToStorage(STORAGE_KEYS.scenarioRevision, durableRevision, "scenario revision");
  sidebar.renderScenarioUi();
  applyCanvasSettings();
  if (responseMode !== RESPONSE_MODE.AI && !document.getElementById("stage")?.classList.contains("flow-active")) {
    previewScenario(selectedScenario());
  }
}

initEditorBindings({ document, UI, PAGE_MODE_OVERRIDE, RESPONSE_MODE, AI_STAGE_OVERRIDE, availableScenarioShapes, selectedScenario, stageById, normalizeScenarioCanvas, normalizeTriggers, normalizeIconByShape, normalizeListChipIconsByShape, createIcon, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeImagesByShape, scenarioStageSizeOverride, STAGE_COMPONENT_TYPES, clamp, canvasSettings: () => canvasSettings, setCanvasSettings: (value) => { canvasSettings = value; }, persistCanvasSettings, persistScenarios, responseMode: () => responseMode, setResponseMode: (value) => { responseMode = value; }, persistResponseMode, aiStageOverride: () => aiStageOverride, setAiStageOverride: (value) => { aiStageOverride = value; }, persistAiStageOverride, sidebar, applyCanvasSettings, applyStagePhoneBlur, applyResponseModeUi, previewScenario, previewAiStageOverride });
input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (messageFlow.isActive()) void messageFlow.handleInputSubmit(input.value);
    else actions.handleSend();
  }
  if (e.key === "Escape" && messageFlow.isActive()) {
    e.preventDefault();
    messageFlow.dismiss();
    input.blur();
  } else if (e.key === "Escape" && flightFlow.isActive()) {
    e.preventDefault();
    flightFlow.reset();
    input.blur();
  }
  e.stopPropagation();
});
input?.addEventListener("input", (e) => {
  if (messageFlow.isActive() && messageFlow.flow.state === messageFlow.GS.COMPOSE) return void messageFlow.handleInputChange(e.target.value);
  if (messageFlow.isActive() || flightFlow.isActive()) return;
  if (homeState === HOME_STATES.SLEEP && !aiAwake) return;
  const hasText = String(e.target.value || "").trim().length > 0;
  const currentShape = morph.getCurrentShape();
  if (hasText && currentShape === "circle" && aiAwake) {
    morph.morphTo("listening", { icon: "", primary: "", secondary: "", detail: "" });
    syncAiOrbChrome();
    updateActive("listening");
    return;
  }
  if (!hasText && currentShape === "listening") {
    morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" });
    updateActive("circle");
  }
});
let composeMenuPointerActive = false;
let composeMenuPointerId = null;
let composeMenuPointerTargetEl = null;
let flightRecommendationPointerActive = false;
let flightRecommendationPointerId = null;
let flightRecommendationPointerTargetEl = null;
const isComposeMenuPointerTarget = (target) => {
  const leftSidebar = document.getElementById("left-sidebar");
  const simPanel = document.getElementById("sim-panel");
  if (leftSidebar && target && leftSidebar.contains(target)) return false;
  if (simPanel && target && simPanel.contains(target)) return false;
  return true;
};
const isFlightRecommendationOrbTarget = (target) => {
  const leftSidebar = document.getElementById("left-sidebar");
  const simPanel = document.getElementById("sim-panel");
  const stageWrap = document.getElementById("stage-wrap");
  if (leftSidebar && target && leftSidebar.contains(target)) return false;
  if (simPanel && target && simPanel.contains(target)) return false;
  return !!(stageWrap && target && stageWrap.contains(target));
};
const shouldCaptureEditableShortcut = (target) => isEditableTarget(target) && target !== input;
document.addEventListener("keydown", (e) => {
  if (shouldCaptureEditableShortcut(e.target)) e.stopImmediatePropagation();
}, true);
document.addEventListener("keypress", (e) => {
  if (shouldCaptureEditableShortcut(e.target)) e.stopImmediatePropagation();
}, true);
document.addEventListener("keydown", (e) => {
  const captureAction = getCaptureHotkeyAction(e);
  if (captureAction) {
    e.preventDefault();
    if (captureAction === "copy-png") void copyStagePng();
    else void exportStageSvg();
    return;
  }
  const activeEl = document.activeElement;
  const focusedInTextInput = isEditableTarget(e.target) || activeEl?.matches?.("input, textarea, select") || activeEl?.isContentEditable;
  const focusedInMainInput = activeEl === input;
  const composeMenuActive = messageFlow.isActive() && messageFlow.flow.state === messageFlow.GS.COMPOSE && (messageFlow.flow.composeMenuOpen || messageFlow.flow.composeMenuHolding || messageFlow.flow.composeMenuClosing);
  if (focusedInTextInput && !focusedInMainInput) return;
  if (e.key === "L" || e.key === "l") {
    e.preventDefault();
    const currentShape = morph.getCurrentShape();
    if (currentShape === "listening" && aiAwake) {
      setHomeState("context");
      aiAwake = false;
      return;
    }
    if (messageFlow.isActive()) {
      if (input) input.focus();
      return;
    }
    armAiWakeListening({ source: "keyboard-l" });
    return;
  }
  if (messageFlow.isActive()) {
    if (e.key === "Escape") {
      e.preventDefault();
      messageFlow.dismiss();
      return;
    }
    if ((!focusedInMainInput || composeMenuActive) && (e.key === "ArrowUp" || e.key === "F" || e.key === "f")) {
      e.preventDefault();
      const prevSel = messageFlow.flow.sel;
      messageFlow.flow.sel = composeMenuActive ? Math.max(-1, messageFlow.flow.sel - 1) : Math.max(0, messageFlow.flow.sel - 1);
      if (messageFlow.flow.sel !== prevSel) playSimEarcon("hover");
      if (!messageFlow.updateSelectionUiOnly()) messageFlow.render(false);
      return;
    }
    if ((!focusedInMainInput || composeMenuActive) && (e.key === "ArrowDown" || e.key === "B" || e.key === "b")) {
      e.preventDefault();
      const prevSel = messageFlow.flow.sel;
      messageFlow.flow.sel = Math.min(messageFlow.maxSel(), messageFlow.flow.sel + 1);
      if (messageFlow.flow.sel !== prevSel) playSimEarcon("hover");
      if (!messageFlow.updateSelectionUiOnly()) messageFlow.render(false);
      return;
    }
    if ((!focusedInMainInput || composeMenuActive) && (e.code === "Space" || e.key === "1")) {
      e.preventDefault();
      messageFlow.confirm();
      return;
    }
  }
  if (flightFlow.handleKeyDown(e)) return;
  if (coffeeFlow?.handleKeyDown?.(e)) return;
  if (focusedInTextInput) return;
  if (e.key === "1") {
    e.preventDefault();
    setHomeState("context");
    return;
  }
  if (e.key === "9") demo.manualShape("magic");
  if (e.key === "5") demo.manualShape("list");
  if (e.key === "6") demo.manualShape("split");
  if (e.key === "0") armAiWakeListening();
  if (e.key === "Escape") {
    morph.hideRich();
    shell.hideIntentHeader();
    if (responseMode === RESPONSE_MODE.AI) returnToHomeContext();
    else previewScenario(selectedScenario());
  }
});
document.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  if (!messageFlow.isActive() || messageFlow.flow.state !== messageFlow.GS.COMPOSE) return;
  if (!isComposeMenuPointerTarget(e.target)) return;
  if (!messageFlow.startComposeMenuHold({ pointerOriginY: e.clientY })) return;
  composeMenuPointerActive = true;
  composeMenuPointerId = e.pointerId;
  composeMenuPointerTargetEl = e.target instanceof Element ? e.target : null;
  if (composeMenuPointerTargetEl?.setPointerCapture) {
    try { composeMenuPointerTargetEl.setPointerCapture(e.pointerId); } catch {}
  }
  if (document.activeElement === input) input?.blur();
  e.preventDefault();
}, true);
document.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  if (!flightFlow.isActive()) return;
  if (!isFlightRecommendationOrbTarget(e.target)) return;
  if (!flightFlow.startRecommendationHold?.({ pointerOriginY: e.clientY })) return;
  flightRecommendationPointerActive = true;
  flightRecommendationPointerId = e.pointerId;
  flightRecommendationPointerTargetEl = e.target instanceof Element ? e.target : null;
  if (flightRecommendationPointerTargetEl?.setPointerCapture) {
    try { flightRecommendationPointerTargetEl.setPointerCapture(e.pointerId); } catch {}
  }
  if (document.activeElement === input) input?.blur();
  e.preventDefault();
}, true);
document.addEventListener("pointermove", (e) => {
  if (!composeMenuPointerActive || e.pointerId !== composeMenuPointerId) return;
  if (messageFlow.updateComposeMenuPointerGesture(e.clientY)) e.preventDefault();
}, true);
document.addEventListener("pointermove", (e) => {
  if (!messageFlow.isActive() || messageFlow.flow.state !== messageFlow.GS.DISAMBIGUATE) return;
  const pill = e.target?.closest?.("[data-g-contact]");
  if (!pill) return;
  const idx = parseInt(pill.getAttribute("data-g-contact"), 10);
  if (!Number.isFinite(idx) || idx === messageFlow.flow.sel) return;
  messageFlow.flow.sel = idx;
  messageFlow.updateSelectionUiOnly();
  playSimEarcon("hover");
}, true);
document.addEventListener("pointermove", (e) => {
  if (!flightRecommendationPointerActive || e.pointerId !== flightRecommendationPointerId) return;
  if (flightFlow.updateRecommendationPointerGesture?.(e.clientY)) e.preventDefault();
}, true);
const releaseComposeMenuPointer = (e) => {
  if (!composeMenuPointerActive || e.pointerId !== composeMenuPointerId) return;
  if (composeMenuPointerTargetEl?.releasePointerCapture) {
    try { composeMenuPointerTargetEl.releasePointerCapture(e.pointerId); } catch {}
  }
  composeMenuPointerActive = false;
  composeMenuPointerId = null;
  composeMenuPointerTargetEl = null;
  messageFlow.endComposeMenuHold({ commitSelection: true });
  e.preventDefault();
};
document.addEventListener("pointerup", releaseComposeMenuPointer, true);
document.addEventListener("pointercancel", releaseComposeMenuPointer, true);
const releaseFlightRecommendationPointer = (e) => {
  if (!flightRecommendationPointerActive || e.pointerId !== flightRecommendationPointerId) return;
  if (flightRecommendationPointerTargetEl?.releasePointerCapture) {
    try { flightRecommendationPointerTargetEl.releasePointerCapture(e.pointerId); } catch {}
  }
  flightRecommendationPointerActive = false;
  flightRecommendationPointerId = null;
  flightRecommendationPointerTargetEl = null;
  flightFlow.endRecommendationHold?.({ commitSelection: false });
  e.preventDefault();
};
document.addEventListener("pointerup", releaseFlightRecommendationPointer, true);
document.addEventListener("pointercancel", releaseFlightRecommendationPointer, true);
document.querySelectorAll(".bz-inp, .sp-inp, .sb-input, .sb-textarea, .typo-color").forEach((el) => {
  el.addEventListener("keydown", (e) => e.stopImmediatePropagation());
  el.addEventListener("keypress", (e) => e.stopImmediatePropagation());
});

const fullscreenToggle = document.getElementById("debug-fullscreen-toggle");
const fullscreenStageOutlineToggle = document.getElementById("debug-fullscreen-stage-outline-toggle");
const loadFullscreenStageOutlineVisible = () => {
  try {
    const raw = localStorage.getItem(FULLSCREEN_STAGE_OUTLINE_STORAGE_KEY);
    if (raw == null) return true;
    return JSON.parse(raw) !== false;
  } catch {
    return true;
  }
};
const setFullscreenStageOutlineVisible = (visible) => {
  document.body.classList.toggle("hide-stage-outline-fullscreen", !visible);
  if (fullscreenStageOutlineToggle) fullscreenStageOutlineToggle.checked = !!visible;
  try { localStorage.setItem(FULLSCREEN_STAGE_OUTLINE_STORAGE_KEY, JSON.stringify(visible !== false)); } catch {}
};
if (fullscreenToggle) {
  setFullscreenStageOutlineVisible(loadFullscreenStageOutlineVisible());
  const syncFullscreenToggle = () => {
    const isFullscreen = !!document.fullscreenElement;
    fullscreenToggle.checked = isFullscreen;
    document.body.classList.toggle("fullscreen-stage-only", isFullscreen);
  };
  fullscreenToggle.checked = !!document.fullscreenElement;
  fullscreenToggle.addEventListener("change", async () => {
    try {
      if (fullscreenToggle.checked) {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Unable to toggle fullscreen", err);
      syncFullscreenToggle();
    }
  });
  document.addEventListener("fullscreenchange", syncFullscreenToggle);
}
if (fullscreenStageOutlineToggle) {
  fullscreenStageOutlineToggle.checked = loadFullscreenStageOutlineVisible();
  fullscreenStageOutlineToggle.addEventListener("change", () => {
    setFullscreenStageOutlineVisible(fullscreenStageOutlineToggle.checked);
  });
}

async function copyStagePng() {
  try {
    const ok = await copyStagePngToClipboard({ root: document.getElementById("stage-wrap"), documentRef: document });
    if (!ok) console.warn("[stage-capture] PNG copy did not complete.");
  } catch (err) {
    console.warn("[stage-capture] PNG copy failed:", err);
  }
}

async function exportStageSvg() {
  const ok = await exportStageSvgFile({ root: document.getElementById("stage-wrap"), filenamePrefix: "genui-ai-stage", documentRef: document });
  if (!ok) console.warn("[stage-capture] SVG export did not complete.");
}

const aiVoiceToggle = document.getElementById("debug-ai-voice-toggle");
const disableTextInputToggle = document.getElementById("debug-disable-text-input-toggle");

if (aiVoiceToggle) {
  setAiVoiceEnabled(loadAiVoiceEnabled());
  aiVoiceToggle.checked = isAiVoiceEnabled();
  aiVoiceToggle.addEventListener("change", () => {
    setAiVoiceEnabled(aiVoiceToggle.checked);
    persistAiVoiceEnabled(aiVoiceToggle.checked);
  });
}

if (disableTextInputToggle) {
  disableTextInputToggle.checked = disableTextInput;
  input.readOnly = disableTextInput;
  disableTextInputToggle.addEventListener("change", () => {
    disableTextInput = disableTextInputToggle.checked;
    input.readOnly = disableTextInput;
    try { localStorage.setItem(STORAGE_KEYS.disableTextInput, JSON.stringify(disableTextInput)); } catch (err) { console.warn("Unable to persist disable text input toggle", err); }
  });
}

applyCanvasSettings();
applyResponseModeUi();
sidebar.renderScenarioUi();
if (responseMode === RESPONSE_MODE.AI) enterHomeContext(); else previewScenario(selectedScenario());
anim.rebuildAnim();
anim.initStarfield();
prewarmAiSpeechCache();
void initPhrases();
voice.voiceEngine.start("command");

Object.assign(window, {
  applyCustomShape: demo.applyCustomShape,
  fireChip: actions.fireChip,
  handleSend: actions.handleSend,
  manualShape: demo.manualShape,
  armAiWakeListening,
  setHomeState,
  cycleHomeContext,
  returnToHomeContext,
  openCustom: demo.openCustom,
  selectListItem: demo.selectListItem,
  refreshAiVoiceText: (text) => refreshAiVoice(text),
  copyStagePng,
  exportStageSvg,
});

void hydrateDurableScenarios();
