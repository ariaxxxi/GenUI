import { STORAGE_KEYS, RESPONSE_MODE, PAGE_MODE_OVERRIDE, AI_STAGE_OVERRIDE, readStoredJson, loadCanvasSettings, loadResponseMode, loadAiStageOverride, loadAiVoiceEnabled, loadDisableTextInput } from "../app-state.js";
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
import { initDemoControls } from "./demo-controls.js";
import { initInputActions } from "./input-actions.js";
import { initEditorBindings } from "./editor-bindings.js";
import { prewarmAiSpeechCache, refreshAiVoice, setAiVoiceEnabled, isAiVoiceEnabled } from "./tts-player.js";
import { initPhrases } from "./phrases.js";
import { copyStagePngToClipboard, exportStageSvg as exportStageSvgFile, getCaptureHotkeyAction } from "../shared/stage-capture.js";

const DROPS = { main: document.getElementById("drop-main"), left: document.getElementById("drop-left"), right: document.getElementById("drop-right") };
const C = { thumb: document.getElementById("c-thumb"), thumbLabel: document.getElementById("c-thumb-label"), thumbImg: document.getElementById("c-thumb-img"), prim: document.getElementById("c-primary"), sec: document.getElementById("c-secondary"), div: document.getElementById("c-divider"), det: document.getElementById("c-detail"), media: document.getElementById("c-media"), rich: document.getElementById("c-rich"), glassControlsLayer: document.getElementById("glass-controls-layer") };
const UI = buildUiRefs(document);
const input = document.getElementById("sim-input");
const detailMeasureEl = document.createElement("div");
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const FULLSCREEN_STAGE_OUTLINE_STORAGE_KEY = "genui_ai_fullscreen_stage_outline_visible";
let canvasSettings = loadCanvasSettings();
let responseMode = loadResponseMode();
let aiStageOverride = loadAiStageOverride();
let disableTextInput = loadDisableTextInput();
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
const isWeatherIntent = (text) => /\b(weather|forecast|temperature|rain|sunny|cloudy|humidity)\b/i.test(String(text || ""));
const stripWakeWord = (text) => String(text || "").replace(/\bhey\s+bixby\b/ig, " ").replace(/\s+/g, " ").trim();

const scenarioData = initScenarioData({ getStageLibrary: () => stageLibrary, getCanvasSettings: () => canvasSettings, clampFn: clamp });
const anim = initAnimControls({ document, clamp });
const { SCENARIO_SHAPES, STAGE_COMPONENT_TYPES, createScenario, createIcon, loadStageLibrary, normalizeScenario, normalizeScenarioCanvas, normalizeTriggers, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeIconByShape, normalizeImagesByShape, stageById, builtinStageById, renderShapeForStageId, availableScenarioShapes, stageComponentCounts, stageHasComponent, stageVisibleEditorFields, stageTextForShape, stageIconForShape, stageImagesForShape, stageId, scenarioStageSizeOverride, stageMainSize, stageIconTextGap, stageIconLeftPadding, normalizeStageSizeEntry, defaultScenarioLibrary, normalizeStage } = scenarioData;

function loadScenarioLibrary() {
  const stored = readStoredJson(STORAGE_KEYS.scenarios, null);
  const scenarios = Array.isArray(stored) ? stored.map(normalizeScenario).filter(Boolean) : defaultScenarioLibrary();
  scenarios.forEach((scenario) => { scenario.content.canvas = normalizeScenarioCanvas(scenario?.content?.canvas, { frameMode: canvasSettings?.frameMode || "none" }); });
  return scenarios.length ? scenarios : defaultScenarioLibrary();
}
function persistScenarios() { try { localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(scenarioLibrary)); } catch (err) { console.warn("Unable to persist scenarios", err); } }
function persistCanvasSettings() { try { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(canvasSettings)); } catch (err) { console.warn("Unable to persist canvas settings", err); } }
function persistResponseMode() { if (!PAGE_MODE_OVERRIDE) localStorage.setItem(STORAGE_KEYS.mode, JSON.stringify(responseMode)); }
function persistAiStageOverride() { try { localStorage.setItem(STORAGE_KEYS.aiStage, JSON.stringify(aiStageOverride)); } catch (err) { console.warn("Unable to persist AI stage override", err); } }
function persistAiVoiceEnabled(enabled) { try { localStorage.setItem(STORAGE_KEYS.aiVoiceEnabled, JSON.stringify(enabled !== false)); } catch (err) { console.warn("Unable to persist AI voice toggle", err); } }
function persistStageLibrary() { try { localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(stageLibrary)); } catch (err) { console.warn("Unable to persist stage library", err); } }
function selectedScenario() { return scenarioLibrary.find((item) => item.id === selectedScenarioId) || scenarioLibrary[0] || null; }

const shell = initAiShell({ document, C, input, clearListPills: () => demo?.clearListPills?.(), morphTo: (...args) => morph.morphTo(...args), getAnimDuration: anim.getAnimDuration, getGlassState: () => messageFlow?.GS, getGlassUi: () => messageFlow?.flow, getVoiceMode: () => voice?.voiceEngine?.mode });
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
  if (messageFlow?.isActive?.() || flightFlow?.isActive?.()) return;
  voice?.voiceEngine?.start?.("command");
}

function ensureHomeAwake() {
  if (homeState !== HOME_STATES.SLEEP) return;
  enterHomeContext();
}

function enterSleep(options = {}) {
  const source = options?.source || "";
  if (source !== "flow-reset") {
    if (messageFlow?.isActive?.()) { messageFlow.reset(); return; }
    if (flightFlow?.isActive?.()) { flightFlow.reset(); return; }
  }
  aiAwake = false;
  listeningPromptText = "";
  voice?.clearVoiceVizStyles?.();
  shell.stopSiriOrb();
  clearGlassFlowUiImmediate();
  morph.hideRich();
  clearStageFlowFlags();
  setHomeStateData(HOME_STATES.SLEEP);
  morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" });
  updateActive("circle");
  ensurePassiveCommandListening();
}

function enterHomeContext(options = {}) {
  const source = options?.source || "";
  if (source !== "flow-reset") {
    if (messageFlow?.isActive?.()) { messageFlow.reset(); return; }
    if (flightFlow?.isActive?.()) { flightFlow.reset(); return; }
  }
  const cycle = options?.cycle === true;
  const previous = homeState;
  if (cycle) homeContextIndex = (homeContextIndex + 1) % HOME_CONTEXTS.length;
  const fromSleep = previous === HOME_STATES.SLEEP;
  aiAwake = false;
  listeningPromptText = "";
  voice?.clearVoiceVizStyles?.();
  shell.stopSiriOrb();
  clearGlassFlowUiImmediate();
  morph.hideRich();
  clearStageFlowFlags();
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

function armAiWakeListening(options = {}) {
  const source = String(options?.source || "");
  const fromHomeOrSleep = homeState === HOME_STATES.SLEEP || (homeState === HOME_STATES.CONTEXT && morph.getCurrentShape() === "circle");
  // Guardrail: only voice wake word can move home/sleep -> listening.
  if (fromHomeOrSleep && source !== "wake-word") return;
  aiAwake = true;
  listeningPromptText = "";
  const fromSleep = homeState === HOME_STATES.SLEEP;
  const fromHome = homeState === HOME_STATES.CONTEXT && morph.getCurrentShape() === "circle";
  if (homeState === HOME_STATES.SLEEP) {
    voice?.clearVoiceVizStyles?.();
    shell.stopSiriOrb();
    clearGlassFlowUiImmediate();
    morph.hideRich();
    clearStageFlowFlags();
    setHomeStateData(HOME_STATES.CONTEXT);
  }
  if (!messageFlow?.isActive() && !flightFlow?.isActive()) {
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
    clamp, selectedScenario, stageById, updateActive,
    stopSiriOrb: (...args) => shell.stopSiriOrb(...args),
    startSiriOrb: (...args) => shell.startSiriOrb(...args),
    showAiIdle: (...args) => shell.showAiIdle(...args),
    collapseListStack: (...args) => demo?.collapseListStack?.(...args),
    animateSplitMetaball: () => {},
    normalizeStageSizeEntry, scenarioStageSizeOverride, stageMainSize, stageIconTextGap, stageIconLeftPadding, renderShapeForStageId,
    getCanvasSettings: () => canvasSettings, stageComponentCounts, stageTextForShape, stageIconForShape, stageImagesForShape, createIcon,
    getAnimDuration: anim.getAnimDuration, getEasingFns: anim.getEasingFns, shouldPreserveRich: () => document.body.classList.contains("glass-flow-active"), getBottomAlignRefHeight: () => 420,
  },
});
const sidebar = initSidebar({
  UI, RESPONSE_MODE, AI_STAGE_OVERRIDE, clamp, selectedScenario, stageById, availableScenarioShapes, persistScenarios, persistStageLibrary, persistCanvasSettings, persistResponseMode, persistAiStageOverride, previewScenario, applyCanvasSettings, applyStagePhoneBlur, applyResponseModeUi, hideRich: morph.hideRich, hideIntentHeader: shell.hideIntentHeader, getScenarioTypography: morph.getScenarioTypography, createScenario, stageComponentCounts, STAGE_COMPONENT_TYPES, builtinStageById, scenarioStageSizeOverride, stageVisibleEditorFields, stageHasComponent, stageTextForShape, stageIconForShape, stageImagesForShape, normalizeTriggers, normalizeIconByShape, createIcon, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeImagesByShape, normalizeScenario, normalizeStage, stageId, getScenarioLibrary: () => scenarioLibrary, setScenarioLibrary: (value) => { scenarioLibrary = value; }, getStageLibrary: () => stageLibrary, setStageLibrary: (value) => { stageLibrary = value; }, getSelectedScenarioId: () => selectedScenarioId, setSelectedScenarioId: (value) => { selectedScenarioId = value; }, getResponseMode: () => responseMode, getAiStageOverride: () => aiStageOverride,
});
let actions = null;
const voice = initVoiceEngine({
  document,
  input,
  addSimLog,
  getGlassUi: () => messageFlow?.flow,
  getGlassState: () => messageFlow?.GS,
  shouldKeepCommandListening: () => true,
  shouldShowCommandViz: () => aiAwake || messageFlow?.isActive?.() || flightFlow?.isActive?.(),
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
const flightFlow = createFlightBookingFlow({ SHAPES, C, morph, shell, voice, input, addChatBubble, hideTypingBubble, returnToHomeContext });
const messageFlow = createMessageSendFlow({ SHAPES, C, morph, shell, voice, input, setSimVoice, setSimInputState, addSimLog, playEarcon: playSimEarcon, clamp, getPreFlowShape: () => preFlowShape, setPreFlowShape: (value) => { preFlowShape = value; }, updateActive, returnToHomeContext });
const demo = initDemoControls({ document, SHAPES, SCENARIO_SHAPES, createScenario, selectedScenario, previewScenario, morph, shell, voice, renderShapeForStageId, updateActive, getCurrentShape: morph.getCurrentShape, getPreFlowShape: () => preFlowShape, setPreFlowShape: (value) => { preFlowShape = value; }, messageFlow, startGlassFlow: () => messageFlow.start() });
actions = initInputActions({ input, ensureHomeAwake, canProcessRequest: () => aiAwake || messageFlow?.isActive?.() || flightFlow?.isActive?.(), responseMode: () => responseMode, RESPONSE_MODE, selectedScenario, scenarioLibrary: () => scenarioLibrary, createScenario, createIcon, renderScenarioUi: sidebar.renderScenarioUi, setSelectedScenarioId: (value) => { selectedScenarioId = value; }, previewScenario, messageFlow, flightFlow, voice, morph });

function currentScenarioFrameMode() { return normalizeScenarioCanvas(selectedScenario()?.content?.canvas, { frameMode: canvasSettings.frameMode }).frameMode; }
function applyCanvasSettings() { const frame = document.getElementById("ui-frame"); const frameBg = document.getElementById("ui-frame-bg"); const frameMode = currentScenarioFrameMode(); const isPhone = frameMode === "phone"; const isGlasses = frameMode === "glasses"; document.body.classList.toggle("bg-off", !canvasSettings.backgroundEnabled); document.body.classList.toggle("float-off", !canvasSettings.floatingEnabled); document.body.classList.add("stage-bottom-align"); if (frame) { frame.classList.toggle("phone", isPhone); frame.classList.toggle("glasses", isGlasses); frame.classList.remove("stage-blur"); frame.classList.toggle("phone-scene-off", isPhone && !canvasSettings.phoneBgEnabled); frame.style.setProperty("--phone-frame-w", `${canvasSettings.phoneFrameWidth}px`); frame.style.setProperty("--phone-frame-h", `${canvasSettings.phoneFrameHeight}px`); frame.style.setProperty("--frame-corner-radius", `${canvasSettings.frameCornerRadius}px`); frame.classList.toggle("has-bg", isPhone && !!canvasSettings.phoneBgEnabled && !!canvasSettings.phoneFrameBackground?.src); } if (frameBg) frameBg.style.backgroundImage = canvasSettings.phoneFrameBackground?.src ? `url("${canvasSettings.phoneFrameBackground.src}")` : ""; if (UI.bgToggle) UI.bgToggle.checked = !!canvasSettings.backgroundEnabled; if (UI.floatToggle) UI.floatToggle.checked = !!canvasSettings.floatingEnabled; if (UI.alignBottomToggle) UI.alignBottomToggle.checked = true; if (UI.framePhoneToggle) UI.framePhoneToggle.checked = isPhone; if (UI.frameGlassesToggle) UI.frameGlassesToggle.checked = isGlasses; if (UI.phoneFrameControls) UI.phoneFrameControls.classList.toggle("hidden", !isPhone); if (UI.phoneFrameWidth) UI.phoneFrameWidth.value = String(canvasSettings.phoneFrameWidth); if (UI.phoneFrameHeight) UI.phoneFrameHeight.value = String(canvasSettings.phoneFrameHeight); if (UI.frameCornerRadius) UI.frameCornerRadius.value = String(canvasSettings.frameCornerRadius); }
function applyStagePhoneBlur(shape) { const frame = document.getElementById("ui-frame"); if (!frame) return; const stage = stageById(shape); const shouldBlur = currentScenarioFrameMode() === "phone" && !!canvasSettings.phoneFrameBackground?.src && !!stage?.phoneBgBlur; frame.classList.toggle("stage-blur", shouldBlur); }
function applyResponseModeUi() { const isAi = responseMode === RESPONSE_MODE.AI; document.body.classList.toggle("mode-ai", isAi); document.body.classList.toggle("mode-manual", !isAi); if (UI.modeToggle) UI.modeToggle.checked = isAi; }
function previewScenario(scenario) { if (!scenario) return; if (flightFlow.isActive()) flightFlow.reset(); shell.stopSiriOrb(); morph.hideRich(); shell.hideIntentHeader(); document.getElementById("stage").classList.remove("flow-active"); document.getElementById("stage-wrap")?.classList.remove("flow-active"); updateActive(""); applyStagePhoneBlur(scenario.shape); morph.morphTo(renderShapeForStageId(scenario.shape), morph.scenarioToRenderContent(scenario), null, scenario.shape); }
function previewAiStageOverride() { if (responseMode !== RESPONSE_MODE.AI) return; const scenario = selectedScenario(); if (!scenario) return; if (aiStageOverride === AI_STAGE_OVERRIDE.AUTO) return previewScenario(scenario); const overrideShape = availableScenarioShapes().includes(aiStageOverride) ? aiStageOverride : scenario.shape; previewScenario(createScenario({ ...scenario, shape: overrideShape, content: scenario.content, triggers: scenario.triggers })); }

initEditorBindings({ document, UI, PAGE_MODE_OVERRIDE, RESPONSE_MODE, AI_STAGE_OVERRIDE, availableScenarioShapes, selectedScenario, stageById, normalizeScenarioCanvas, normalizeTriggers, normalizeIconByShape, createIcon, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeImagesByShape, scenarioStageSizeOverride, STAGE_COMPONENT_TYPES, clamp, canvasSettings: () => canvasSettings, setCanvasSettings: (value) => { canvasSettings = value; }, persistCanvasSettings, persistScenarios, responseMode: () => responseMode, setResponseMode: (value) => { responseMode = value; }, persistResponseMode, aiStageOverride: () => aiStageOverride, setAiStageOverride: (value) => { aiStageOverride = value; }, persistAiStageOverride, sidebar, applyCanvasSettings, applyStagePhoneBlur, applyResponseModeUi, previewScenario, previewAiStageOverride });
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
    updateActive("listening");
    return;
  }
  if (!hasText && currentShape === "listening") {
    morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" });
    updateActive("circle");
  }
});
document.addEventListener("keydown", (e) => { const captureAction = getCaptureHotkeyAction(e); if (captureAction) { e.preventDefault(); if (captureAction === "copy-png") void copyStagePng(); else void exportStageSvg(); return; } const focusedInTextInput = document.activeElement === input; if (e.key === "L" || e.key === "l") { e.preventDefault(); const currentShape = morph.getCurrentShape(); if (currentShape === "listening" && aiAwake) { setHomeState("context"); aiAwake = false; return; } if (messageFlow.isActive()) { if (input) input.focus(); return; } armAiWakeListening(); return; } if (messageFlow.isActive()) { if (e.key === "Escape") { e.preventDefault(); messageFlow.dismiss(); return; } if (!focusedInTextInput && (e.key === "ArrowUp" || e.key === "F" || e.key === "f")) { e.preventDefault(); messageFlow.flow.sel = Math.max(0, messageFlow.flow.sel - 1); if (!messageFlow.updateSelectionUiOnly()) messageFlow.render(false); return; } if (!focusedInTextInput && (e.key === "ArrowDown" || e.key === "B" || e.key === "b")) { e.preventDefault(); messageFlow.flow.sel = Math.min(messageFlow.maxSel(), messageFlow.flow.sel + 1); if (!messageFlow.updateSelectionUiOnly()) messageFlow.render(false); return; } if (!focusedInTextInput && (e.code === "Space" || e.key === "1")) { e.preventDefault(); messageFlow.confirm(); return; } } if (flightFlow.handleKeyDown(e)) return; if (document.activeElement?.matches?.("input, textarea, select")) return; if (e.key === "1") { e.preventDefault(); setHomeState("context"); return; } if (e.key === "9") demo.manualShape("magic"); if (e.key === "5") demo.manualShape("list"); if (e.key === "6") demo.manualShape("split"); if (e.key === "0") armAiWakeListening(); if (e.key === "Escape") { morph.hideRich(); shell.hideIntentHeader(); if (responseMode === RESPONSE_MODE.AI) returnToHomeContext(); else previewScenario(selectedScenario()); } });
document.querySelectorAll(".bz-inp, .sp-inp, .sb-input, .sb-textarea, .typo-color").forEach((el) => el.addEventListener("keydown", (e) => e.stopPropagation()));

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
    const ok = await copyStagePngToClipboard({ root: document.getElementById("stage"), documentRef: document });
    if (!ok) console.warn("[stage-capture] PNG copy did not complete.");
  } catch (err) {
    console.warn("[stage-capture] PNG copy failed:", err);
  }
}

async function exportStageSvg() {
  const ok = await exportStageSvgFile({ root: document.getElementById("stage"), filenamePrefix: "genui-ai-stage", documentRef: document });
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
