import { clamp } from '../utils.js';
import { DEMO_LIST, clearListPills, collapseListStack, demoListRenderContent, selectListItem } from '../shared/list-demo.js';

export function initDemoControls({
  document,
  SHAPES,
  SCENARIO_SHAPES,
  createScenario,
  selectedScenario,
  previewScenario,
  morph,
  shell,
  voice,
  renderShapeForStageId,
  updateActive,
  getCurrentShape,
  getPreFlowShape,
  setPreFlowShape,
  messageFlow,
  startGlassFlow,
}) {
  const DEMO = { circle: { icon: "", primary: "", secondary: "", detail: "" }, split: { icon: "", primary: "", secondary: "", detail: "" }, ai: { icon: "", primary: "", secondary: "", detail: "" } };
  function morphToList(items = DEMO_LIST) {
    shell.stopSiriOrb();
    morph.hideRich();
    document.getElementById("drop-main").classList.remove("ai-mode");
    shell.setIntentHeader("Demo", "List");
    morph.morphTo("list", demoListRenderContent(items));
    updateActive("list");
  }

  function openCustom() {
    document.getElementById("shape-panel")?.classList.toggle("visible");
    updateActive("custom");
  }

  function applyCustomShape() {
    const w = clamp(parseInt(document.getElementById("sp-w")?.value, 10) || 280, 60, 420);
    const h = clamp(parseInt(document.getElementById("sp-h")?.value, 10) || 140, 60, 360);
    const r = clamp(parseInt(document.getElementById("sp-r")?.value, 10) || 0, 0, Math.floor(Math.min(w, h) / 2));
    morph.hideRich();
    morph.morphTo("custom", null, { main: { w, h, br: `${r}px`, tx: -(w / 2), ty: -(h / 2), op: 1 }, left: { w: 100, h: 100, br: "50px", tx: -(w / 2), ty: -50, op: 0 }, right: { w: 100, h: 100, br: "50px", tx: (w / 2) - 100, ty: -50, op: 0 } });
    morph.applyContentPositions("custom", w, h);
  }

  function manualShape(shape) {
    const nextShape = shape === "ai" ? "magic" : shape;
    if (nextShape !== "listening") {
      voice.voiceEngine.stop();
      if (messageFlow.isActive()) messageFlow.reset();
    }
    document.getElementById("shape-panel")?.classList.remove("visible");
    morph.hideRich();
    shell.hideIntentHeader();
    document.getElementById("stage")?.classList.remove("flow-active");
    document.getElementById("stage-wrap")?.classList.remove("flow-active");
    clearListPills();
    if (nextShape === "list") return void morphToList(DEMO_LIST);
    if (nextShape === "magic") {
      morph.morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });
      updateActive("magic");
      return;
    }
    if (nextShape === "listening") {
      setPreFlowShape(getCurrentShape() || "circle");
      startGlassFlow();
      updateActive("listening");
      return;
    }
    if (nextShape === "idle") {
      morph.morphTo("ai", { icon: "", primary: "", secondary: "", detail: "" });
      shell.showAiIdle();
      updateActive("idle");
      return;
    }
    if (SCENARIO_SHAPES.includes(nextShape)) {
      const scenario = selectedScenario();
      const nextScenario = scenario ? createScenario({ ...scenario, shape: nextShape, content: scenario.content, triggers: scenario.triggers }) : createScenario({ shape: nextShape });
      previewScenario(nextScenario);
      return;
    }
    morph.morphTo(nextShape, DEMO[nextShape] || {});
  }

  return { clearListPills, collapseListStack, selectListItem, morphToList, openCustom, applyCustomShape, manualShape };
}
