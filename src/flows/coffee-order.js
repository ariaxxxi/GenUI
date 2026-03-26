import { createFlowEngine } from "../ai/flow-engine.js";
import { ORDER_COFFEE_FLOW_DEFINITION } from "./flow-definitions.js";
import { composeScreen } from "../shared/screen-composer.js";
import { applyFlowChromeVisibility, measureSuccessToastGeometry } from "../shared/flow-toast.js";

const DRINKS = ["Latte", "Cappuccino", "Americano"];
const SIZES = ["Small", "Medium", "Large"];

function coffeeIntent(text) {
  return /\b(coffee|latte|cappuccino|americano)\b/i.test(String(text || ""));
}

function titleCase(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createCoffeeOrderFlow(ctx) {
  const engine = createFlowEngine({ definition: ORDER_COFFEE_FLOW_DEFINITION });
  const state = { active: false, thinkingTimer: null, successTimer: null, controlsTrack: null, epoch: 0 };
  const TOP = 10;
  const BOTTOM = 10;
  const MIN_H = 100;
  const MAX_H = 400;
  const CONTROLS_LIFT = 78;
  const controlsGap = 14;
  let measureLayer = null;

  function clearTimers() {
    if (state.thinkingTimer) clearTimeout(state.thinkingTimer);
    if (state.successTimer) clearTimeout(state.successTimer);
    if (state.controlsTrack) cancelAnimationFrame(state.controlsTrack);
    state.thinkingTimer = null;
    state.successTimer = null;
    state.controlsTrack = null;
  }

  function isEpochAlive(epoch) {
    return epoch === state.epoch && state.active;
  }

  function ensureMeasureLayer() {
    if (measureLayer) return measureLayer;
    measureLayer = document.getElementById("coffee-measure-layer");
    if (measureLayer) return measureLayer;
    const layer = document.createElement("div");
    layer.id = "coffee-measure-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:380px;visibility:hidden;pointer-events:none;z-index:-1;";
    document.body.appendChild(layer);
    measureLayer = layer;
    return layer;
  }

  function contentHeightPx() {
    const richRoot = ctx.C.rich;
    if (!richRoot) return 120;
    const layer = ensureMeasureLayer();
    layer.innerHTML = richRoot.innerHTML;
    const body = layer.querySelector("[data-glass-body]") || layer.firstElementChild;
    const raw = body ? Math.ceil(Math.max(body.getBoundingClientRect().height || 0, body.scrollHeight || 0, body.offsetHeight || 0)) : 0;
    return Math.max(60, Math.min(MAX_H - TOP - BOTTOM, raw || 120));
  }

  function dynamicGeo(shape) {
    const base = ctx.SHAPES[shape] || ctx.SHAPES.card;
    const h = Math.max(MIN_H, Math.min(MAX_H, Math.round(contentHeightPx() + TOP + BOTTOM)));
    const controlsLift = shape === "card" ? CONTROLS_LIFT : 0;
    return { ...base, main: { ...base.main, h, ty: -(h / 2) - controlsLift } };
  }

  function sentGeo() {
    return measureSuccessToastGeometry({
      richRoot: ctx.C.rich,
      pillShape: ctx.SHAPES.pill || ctx.SHAPES.card,
      fallbackLabel: "Coffee ordered",
    });
  }

  function positionControlsOverlay() {
    const layer = ctx.C.glassControlsLayer;
    const stage = document.getElementById("stage");
    const main = document.getElementById("drop-main");
    const controls = layer?.querySelector(".g-glass-controls");
    if (!layer || !stage || !main || !controls) return false;
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const centerX = (mainRect.left + (mainRect.width / 2)) - stageRect.left;
    const unclampedTop = (mainRect.bottom - stageRect.top) + controlsGap;
    const maxTop = Math.max(8, stageRect.height - controlsRect.height - 8);
    const topY = Math.min(unclampedTop, maxTop);
    controls.style.left = `${Math.round(centerX)}px`;
    controls.style.top = `${Math.round(topY)}px`;
    return true;
  }

  function trackControlsForTransition(ms = 600) {
    if (state.controlsTrack) cancelAnimationFrame(state.controlsTrack);
    const end = performance.now() + Math.max(200, ms);
    const tick = () => {
      if (!state.active || !ctx.C.glassControlsLayer?.classList.contains("visible")) return;
      positionControlsOverlay();
      if (performance.now() < end) state.controlsTrack = requestAnimationFrame(tick);
      else state.controlsTrack = null;
    };
    state.controlsTrack = requestAnimationFrame(tick);
  }

  function activeSlot() {
    return engine.currentSlot()?.id || "";
  }

  function summarySpec() {
    const drink = engine.getSlotValue("drink") || "Coffee";
    const size = engine.getSlotValue("size") || "Medium";
    return {
      intentHeader: "Confirm order",
      layout: ["info_card"],
      wrapBody: true,
      bodyClass: "g-flight-content-pad",
      props: {
        info_card: {
          title: `${size} ${drink}`,
          subtitle: "Pickup in 6 min",
          detail: "Tap to order or change",
        },
      },
      actions: [
        { id: "order", emoji: "✅" },
        { id: "change", emoji: "✊" },
        { id: "cancel", emoji: "❌" },
      ],
      actionSelectedIndex: engine.state.selectionIndex,
    };
  }

  function slotSpec() {
    if (!state.active) return { layout: [] };
    if (engine.state.status === "executing") {
      return ORDER_COFFEE_FLOW_DEFINITION.execution.loading;
    }
    if (engine.state.status === "success") {
      return ORDER_COFFEE_FLOW_DEFINITION.execution.success;
    }
    const slotId = activeSlot();
    if (slotId === "drink") {
      return {
        intentHeader: "Drink",
        layout: ["chip_bar"],
        wrapBody: true,
        bodyClass: "g-compose-card",
        props: {
          chip_bar: {
            chips: DRINKS.map((label, index) => ({ id: String(index), label })),
            selectedIndex: engine.state.selectionIndex,
            navigable: true,
            collapsed: false,
          },
        },
      };
    }
    if (slotId === "size") {
      return {
        intentHeader: "Size",
        layout: ["chip_bar"],
        wrapBody: true,
        bodyClass: "g-compose-card",
        props: {
          chip_bar: {
            chips: SIZES.map((label, index) => ({ id: String(index), label })),
            selectedIndex: engine.state.selectionIndex,
            navigable: true,
            collapsed: false,
          },
        },
      };
    }
    if (slotId === "confirm") return summarySpec();
    return { layout: [] };
  }

  function applyVoiceMode() {
    if (!state.active) {
      ctx.voice.voiceEngine.stop();
      return;
    }
    ctx.voice.voiceEngine.start("command");
  }

  function render(shouldMorph = true) {
    const spec = slotSpec();
    const richRoot = ctx.C.rich;
    if (!richRoot) return;
    document.body.classList.toggle("glass-flow-active", state.active);
    composeScreen({
      documentRef: document,
      richRoot,
      controlsRoot: ctx.C.glassControlsLayer,
      setIntentHeader: ctx.shell.setIntentHeader,
      hideIntentHeader: ctx.shell.hideIntentHeader,
      positionIntentHeaderAboveMain: ctx.shell.positionIntentHeaderAboveMain,
      trackIntentHeaderForTransition: ctx.shell.trackIntentHeaderForTransition,
      spec,
    });
    richRoot.classList.toggle("visible", state.active);
    richRoot.classList.toggle("glass-active", state.active);
    richRoot.classList.toggle("glass-sent", engine.state.status === "success");
    richRoot.style.opacity = state.active ? "1" : "";
    richRoot.style.transform = engine.state.status === "success" ? "translateY(-18px)" : "";
    if (shouldMorph) {
      if (engine.state.status === "executing") {
        ctx.morph.morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });
      } else if (engine.state.status === "success") {
        ctx.morph.morphTo("pill", { icon: "", primary: "", secondary: "", detail: "" }, sentGeo());
      } else if (activeSlot() === "confirm") {
        ctx.morph.morphTo("card", { icon: "", primary: "", secondary: "", detail: "" }, dynamicGeo("card"));
      } else {
        ctx.morph.morphTo("card-form", { icon: "", primary: "", secondary: "", detail: "" }, dynamicGeo("card-form"));
      }
    }
    applyFlowChromeVisibility({ C: ctx.C, active: state.active, richSent: engine.state.status === "success" });
    if (spec.actions?.length) {
      if (!positionControlsOverlay()) ctx.C.glassControlsLayer.classList.remove("visible");
      else trackControlsForTransition();
    }
    applyVoiceMode();
  }

  function finishSuccess() {
    engine.state.status = "success";
    render(true);
    const epoch = state.epoch;
    state.successTimer = setTimeout(() => { if (isEpochAlive(epoch)) reset(); }, 2400);
  }

  function executeOrder() {
    engine.state.status = "executing";
    render(true);
    const epoch = state.epoch;
    state.thinkingTimer = setTimeout(() => { if (isEpochAlive(epoch)) finishSuccess(); }, 1200);
  }

  function syncSelectionBounds() {
    const slotId = activeSlot();
    const max = slotId === "drink" ? DRINKS.length - 1 : slotId === "size" ? SIZES.length - 1 : 2;
    engine.setSelectionIndex(Math.max(0, Math.min(max, engine.state.selectionIndex)));
  }

  function advanceFromSelection(value) {
    engine.setSlotValue(activeSlot(), value);
    if (!engine.next()) return executeOrder();
    render(true);
  }

  function confirm() {
    const slotId = activeSlot();
    if (slotId === "drink") return advanceFromSelection(DRINKS[engine.state.selectionIndex]);
    if (slotId === "size") return advanceFromSelection(SIZES[engine.state.selectionIndex]);
    if (slotId === "confirm") {
      if (engine.state.selectionIndex === 0) return executeOrder();
      if (engine.state.selectionIndex === 1) {
        engine.goToSlot("drink");
        render(true);
        return;
      }
      reset();
    }
  }

  function reset() {
    clearTimers();
    state.active = false;
    state.epoch += 1;
    engine.reset();
    document.body.classList.remove("glass-flow-active");
    document.getElementById("stage")?.classList.remove("flow-active");
    document.getElementById("stage-wrap")?.classList.remove("flow-active");
    ctx.C.rich.innerHTML = "";
    ctx.C.rich.classList.remove("visible", "glass-active", "glass-sent");
    ctx.C.rich.style.opacity = "";
    ctx.C.rich.style.transform = "";
    ctx.C.glassControlsLayer.innerHTML = "";
    ctx.C.glassControlsLayer.classList.remove("visible");
    ctx.shell.hideIntentHeader?.();
    ctx.voice.voiceEngine.stop();
    if (typeof ctx.returnToHomeContext === "function") ctx.returnToHomeContext();
  }

  function start(seedText = "") {
    clearTimers();
    state.epoch += 1;
    state.active = true;
    document.getElementById("stage")?.classList.add("flow-active");
    document.getElementById("stage-wrap")?.classList.add("flow-active");
    engine.start({});
    const lower = String(seedText || "").toLowerCase();
    const matchedDrink = DRINKS.find((item) => lower.includes(item.toLowerCase()));
    if (matchedDrink) {
      engine.setSlotValue("drink", matchedDrink);
      engine.goToSlot("size");
    }
    render(true);
  }

  function moveSelection(delta) {
    engine.setSelectionIndex(engine.state.selectionIndex + delta);
    syncSelectionBounds();
    render(false);
  }

  function handleTranscriptUpdate(text, isFinal) {
    if (!state.active || !isFinal) return;
    const lower = String(text || "").toLowerCase();
    const slotId = activeSlot();
    if (slotId === "drink") {
      const index = DRINKS.findIndex((item) => lower.includes(item.toLowerCase()));
      if (index >= 0) {
        engine.setSelectionIndex(index);
        return confirm();
      }
    }
    if (slotId === "size") {
      const index = SIZES.findIndex((item) => lower.includes(item.toLowerCase()));
      if (index >= 0) {
        engine.setSelectionIndex(index);
        return confirm();
      }
    }
    if (slotId === "confirm") {
      if (/\b(order|confirm|yes)\b/.test(lower)) {
        engine.setSelectionIndex(0);
        return confirm();
      }
      if (/\b(change|edit)\b/.test(lower)) {
        engine.setSelectionIndex(1);
        return confirm();
      }
      if (/\b(cancel|never mind|nevermind)\b/.test(lower)) {
        engine.setSelectionIndex(2);
        return confirm();
      }
    }
  }

  function handleInputSubmit(text) {
    handleTranscriptUpdate(titleCase(text), true);
  }

  function handleKeyDown(e) {
    if (!state.active) return false;
    const activeInInput = document.activeElement?.matches?.("input, textarea, select");
    if (e.key === "Escape") {
      e.preventDefault();
      reset();
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
      return true;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
      return true;
    }
    if (e.code === "Space" && !(activeInInput && ctx.input.value.length > 0)) {
      e.preventDefault();
      confirm();
      return true;
    }
    return false;
  }

  function processRequest(text) {
    if (!coffeeIntent(text)) return false;
    start(text);
    return true;
  }

  return {
    definition: ORDER_COFFEE_FLOW_DEFINITION,
    engine,
    isActive: () => state.active,
    start,
    reset,
    handleKeyDown,
    handleTranscriptUpdate,
    handleInputSubmit,
    processRequest,
  };
}
