import { STORAGE_KEYS, RESPONSE_MODE, PAGE_MODE_OVERRIDE, AI_STAGE_OVERRIDE, readStoredJson, loadCanvasSettings, loadResponseMode, loadAiStageOverride, loadAiVoiceEnabled } from "../app-state.js";
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

const DROPS = { main: document.getElementById("drop-main"), left: document.getElementById("drop-left"), right: document.getElementById("drop-right") };
const C = { thumb: document.getElementById("c-thumb"), thumbLabel: document.getElementById("c-thumb-label"), thumbImg: document.getElementById("c-thumb-img"), prim: document.getElementById("c-primary"), sec: document.getElementById("c-secondary"), div: document.getElementById("c-divider"), det: document.getElementById("c-detail"), media: document.getElementById("c-media"), rich: document.getElementById("c-rich"), glassControlsLayer: document.getElementById("glass-controls-layer") };
const UI = buildUiRefs(document);
const input = document.getElementById("sim-input");
const detailMeasureEl = document.createElement("div");
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
let canvasSettings = loadCanvasSettings();
let responseMode = loadResponseMode();
let aiStageOverride = loadAiStageOverride();
let stageLibrary = [];
let scenarioLibrary = [];
let selectedScenarioId = "";
let preFlowShape = "circle";
const isWeatherIntent = (text) => /\b(weather|forecast|temperature|rain|sunny|cloudy|humidity)\b/i.test(String(text || ""));

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
function updateActive(shape) { window.currentShape = shape; document.querySelectorAll(".sb-shape-btn").forEach((b) => b.classList.toggle("active", b.dataset.shape === shape)); const prompt = document.getElementById("home-start-prompt"); if (!prompt) return; if (shape === "circle" || shape === "listening") prompt.classList.add("visible"); else if (shape === "magic") shell.animateHomePromptToThinking(); else prompt.classList.remove("visible"); }

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
  onTranscriptUpdate: (text, isFinal) => {
    if (isFinal && isWeatherIntent(text)) {
      if (messageFlow?.isActive()) messageFlow.dismiss();
      void actions?.processRequest(String(text || "").trim());
      if (input) input.value = "";
      return;
    }
    if (messageFlow?.isActive()) return messageFlow.onTranscriptUpdate(text, isFinal);
    if (input) input.value = String(text || "");
    if (isFinal && String(text || "").trim()) {
      void actions?.processRequest(String(text || "").trim());
      if (input) input.value = "";
    }
  },
});
const flightFlow = createFlightBookingFlow({ SHAPES, C, morph, shell, input, addChatBubble, hideTypingBubble });
const messageFlow = createMessageSendFlow({ SHAPES, C, morph, shell, voice, input, setSimVoice, setSimInputState, addSimLog, playEarcon: playSimEarcon, clamp, getPreFlowShape: () => preFlowShape, setPreFlowShape: (value) => { preFlowShape = value; }, updateActive });
const demo = initDemoControls({ document, SHAPES, SCENARIO_SHAPES, createScenario, selectedScenario, previewScenario, morph, shell, voice, renderShapeForStageId, updateActive, getCurrentShape: morph.getCurrentShape, getPreFlowShape: () => preFlowShape, setPreFlowShape: (value) => { preFlowShape = value; }, messageFlow, startGlassFlow: () => messageFlow.start() });
actions = initInputActions({ input, responseMode: () => responseMode, RESPONSE_MODE, selectedScenario, scenarioLibrary: () => scenarioLibrary, createScenario, createIcon, renderScenarioUi: sidebar.renderScenarioUi, setSelectedScenarioId: (value) => { selectedScenarioId = value; }, previewScenario, messageFlow, flightFlow, voice, morph });

function currentScenarioFrameMode() { return normalizeScenarioCanvas(selectedScenario()?.content?.canvas, { frameMode: canvasSettings.frameMode }).frameMode; }
function applyCanvasSettings() { const frame = document.getElementById("ui-frame"); const frameBg = document.getElementById("ui-frame-bg"); const frameMode = currentScenarioFrameMode(); const isPhone = frameMode === "phone"; const isGlasses = frameMode === "glasses"; document.body.classList.toggle("bg-off", !canvasSettings.backgroundEnabled); document.body.classList.toggle("float-off", !canvasSettings.floatingEnabled); document.body.classList.toggle("stage-bottom-align", !!canvasSettings.bottomAlign); if (frame) { frame.classList.toggle("phone", isPhone); frame.classList.toggle("glasses", isGlasses); frame.classList.remove("stage-blur"); frame.classList.toggle("phone-scene-off", isPhone && !canvasSettings.phoneBgEnabled); frame.style.setProperty("--phone-frame-w", `${canvasSettings.phoneFrameWidth}px`); frame.style.setProperty("--phone-frame-h", `${canvasSettings.phoneFrameHeight}px`); frame.style.setProperty("--frame-corner-radius", `${canvasSettings.frameCornerRadius}px`); frame.classList.toggle("has-bg", isPhone && !!canvasSettings.phoneBgEnabled && !!canvasSettings.phoneFrameBackground?.src); } if (frameBg) frameBg.style.backgroundImage = canvasSettings.phoneFrameBackground?.src ? `url("${canvasSettings.phoneFrameBackground.src}")` : ""; if (UI.bgToggle) UI.bgToggle.checked = !!canvasSettings.backgroundEnabled; if (UI.floatToggle) UI.floatToggle.checked = !!canvasSettings.floatingEnabled; if (UI.alignBottomToggle) UI.alignBottomToggle.checked = !!canvasSettings.bottomAlign; if (UI.framePhoneToggle) UI.framePhoneToggle.checked = isPhone; if (UI.frameGlassesToggle) UI.frameGlassesToggle.checked = isGlasses; if (UI.phoneFrameControls) UI.phoneFrameControls.classList.toggle("hidden", !isPhone); if (UI.phoneFrameWidth) UI.phoneFrameWidth.value = String(canvasSettings.phoneFrameWidth); if (UI.phoneFrameHeight) UI.phoneFrameHeight.value = String(canvasSettings.phoneFrameHeight); if (UI.frameCornerRadius) UI.frameCornerRadius.value = String(canvasSettings.frameCornerRadius); }
function applyStagePhoneBlur(shape) { const frame = document.getElementById("ui-frame"); if (!frame) return; const stage = stageById(shape); const shouldBlur = currentScenarioFrameMode() === "phone" && !!canvasSettings.phoneFrameBackground?.src && !!stage?.phoneBgBlur; frame.classList.toggle("stage-blur", shouldBlur); }
function applyResponseModeUi() { const isAi = responseMode === RESPONSE_MODE.AI; document.body.classList.toggle("mode-ai", isAi); document.body.classList.toggle("mode-manual", !isAi); if (UI.modeToggle) UI.modeToggle.checked = isAi; }
function previewScenario(scenario) { if (!scenario) return; if (flightFlow.isActive()) flightFlow.reset(); shell.stopSiriOrb(); morph.hideRich(); shell.hideIntentHeader(); document.getElementById("stage").classList.remove("flow-active"); document.getElementById("stage-wrap")?.classList.remove("flow-active"); updateActive(""); applyStagePhoneBlur(scenario.shape); morph.morphTo(renderShapeForStageId(scenario.shape), morph.scenarioToRenderContent(scenario), null, scenario.shape); }
function previewAiStageOverride() { if (responseMode !== RESPONSE_MODE.AI) return; const scenario = selectedScenario(); if (!scenario) return; if (aiStageOverride === AI_STAGE_OVERRIDE.AUTO) return previewScenario(scenario); const overrideShape = availableScenarioShapes().includes(aiStageOverride) ? aiStageOverride : scenario.shape; previewScenario(createScenario({ ...scenario, shape: overrideShape, content: scenario.content, triggers: scenario.triggers })); }

initEditorBindings({ document, UI, PAGE_MODE_OVERRIDE, RESPONSE_MODE, AI_STAGE_OVERRIDE, availableScenarioShapes, selectedScenario, stageById, normalizeScenarioCanvas, normalizeTriggers, normalizeIconByShape, createIcon, normalizeStageTextByShape, normalizeTypographyByShape, normalizeStageSizeByShape, normalizeImagesByShape, scenarioStageSizeOverride, STAGE_COMPONENT_TYPES, clamp, canvasSettings: () => canvasSettings, setCanvasSettings: (value) => { canvasSettings = value; }, persistCanvasSettings, persistScenarios, responseMode: () => responseMode, setResponseMode: (value) => { responseMode = value; }, persistResponseMode, aiStageOverride: () => aiStageOverride, setAiStageOverride: (value) => { aiStageOverride = value; }, persistAiStageOverride, sidebar, applyCanvasSettings, applyStagePhoneBlur, applyResponseModeUi, previewScenario, previewAiStageOverride });
input?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (messageFlow.isActive()) void messageFlow.handleInputSubmit(input.value); else actions.handleSend(); } if (e.key === "Escape" && messageFlow.isActive()) { e.preventDefault(); messageFlow.dismiss(); input.blur(); } e.stopPropagation(); });
input?.addEventListener("input", (e) => { if (messageFlow.isActive() && messageFlow.flow.state === messageFlow.GS.COMPOSE) return void messageFlow.handleInputChange(e.target.value); if (messageFlow.isActive() || flightFlow.isActive()) return; const hasText = String(e.target.value || "").trim().length > 0; if (hasText && morph.getCurrentShape() === "circle") morph.morphTo("listening", { icon: "", primary: "", secondary: "", detail: "" }); if (!hasText && morph.getCurrentShape() === "listening") morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" }); });
document.addEventListener("keydown", (e) => { const focusedInTextInput = document.activeElement === input; if (messageFlow.isActive()) { if (e.key === "Escape") { e.preventDefault(); messageFlow.dismiss(); return; } if (!focusedInTextInput && e.key === "ArrowUp") { e.preventDefault(); messageFlow.flow.sel = Math.max(0, messageFlow.flow.sel - 1); if (!messageFlow.updateSelectionUiOnly()) messageFlow.render(false); return; } if (!focusedInTextInput && e.key === "ArrowDown") { e.preventDefault(); messageFlow.flow.sel = Math.min(messageFlow.maxSel(), messageFlow.flow.sel + 1); if (!messageFlow.updateSelectionUiOnly()) messageFlow.render(false); return; } if (!focusedInTextInput && e.code === "Space") { e.preventDefault(); messageFlow.confirm(); return; } } if (flightFlow.handleKeyDown(e)) return; if (document.activeElement?.matches?.("input, textarea, select")) return; if (e.key === "1") demo.manualShape("circle"); if (e.key === "9") demo.manualShape("magic"); if (e.key === "5") demo.manualShape("list"); if (e.key === "6") demo.manualShape("split"); if (e.key === "0") demo.manualShape("listening"); if (e.key === "Escape") { morph.hideRich(); shell.hideIntentHeader(); if (responseMode === RESPONSE_MODE.AI) demo.manualShape("circle"); else previewScenario(selectedScenario()); } });
document.querySelectorAll(".bz-inp, .sp-inp, .sb-input, .sb-textarea, .typo-color").forEach((el) => el.addEventListener("keydown", (e) => e.stopPropagation()));

const fullscreenToggle = document.getElementById("debug-fullscreen-toggle");
if (fullscreenToggle) {
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

const aiVoiceToggle = document.getElementById("debug-ai-voice-toggle");
if (aiVoiceToggle) {
  setAiVoiceEnabled(loadAiVoiceEnabled());
  aiVoiceToggle.checked = isAiVoiceEnabled();
  aiVoiceToggle.addEventListener("change", () => {
    setAiVoiceEnabled(aiVoiceToggle.checked);
    persistAiVoiceEnabled(aiVoiceToggle.checked);
  });
}

applyCanvasSettings();
applyResponseModeUi();
sidebar.renderScenarioUi();
if (responseMode === RESPONSE_MODE.AI) demo.manualShape("circle"); else previewScenario(selectedScenario());
anim.rebuildAnim();
anim.initStarfield();
prewarmAiSpeechCache();
void initPhrases();

Object.assign(window, {
  applyCustomShape: demo.applyCustomShape,
  fireChip: actions.fireChip,
  handleSend: actions.handleSend,
  manualShape: demo.manualShape,
  openCustom: demo.openCustom,
  selectListItem: demo.selectListItem,
  refreshAiVoiceText: (text) => refreshAiVoice(text),
});
