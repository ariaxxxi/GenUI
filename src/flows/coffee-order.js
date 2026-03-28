import { createFlowEngine, getPaymentDefaultSources } from "../ai/flow-engine.js";
import { ORDER_COFFEE_FLOW_DEFINITION } from "./flow-definitions.js";
import { composeScreen } from "../shared/screen-composer.js";
import { applyFlowChromeVisibility, measureSuccessToastGeometry, ensureMeasureLayer, positionControlsOverlay } from "../shared/flow-toast.js";

const DRINKS = ["Latte", "Cappuccino", "Americano"];
const SIZES = ["Small", "Medium", "Large"];
const PAYMENT_METHODS = ["Apple Pay ···· 9421", "Visa ···· 9421"];
const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0];
const PRICES = {
  Latte: { Small: "$4.50", Medium: "$5.50", Large: "$6.50" },
  Cappuccino: { Small: "$4.00", Medium: "$5.00", Large: "$6.00" },
  Americano: { Small: "$3.50", Medium: "$4.50", Large: "$5.50" },
};

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

  function contentHeightPx() {
    const richRoot = ctx.C.rich;
    if (!richRoot) return 120;
    const layer = ensureMeasureLayer("coffee-measure-layer");
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

  function trackControlsForTransition(ms = 600) {
    if (state.controlsTrack) cancelAnimationFrame(state.controlsTrack);
    const layer = ctx.C.glassControlsLayer;
    const end = performance.now() + Math.max(200, ms);
    const tick = () => {
      if (!state.active || !layer?.classList.contains("visible")) return;
      positionControlsOverlay(layer);
      if (performance.now() < end) state.controlsTrack = requestAnimationFrame(tick);
      else state.controlsTrack = null;
    };
    state.controlsTrack = requestAnimationFrame(tick);
  }

  function activeSlot() {
    return engine.currentSlot()?.id || "";
  }

  function currentPrice() {
    const drink = engine.getSlotValue("drink") || "Latte";
    const size = engine.getSlotValue("size") || "Medium";
    return PRICES[drink]?.[size] || "$5.50";
  }

  function currentPaymentMethod() {
    return engine.getSlotValue("payment_method") || DEFAULT_PAYMENT_METHOD;
  }

  function cyclePaymentMethod() {
    const current = currentPaymentMethod();
    const index = PAYMENT_METHODS.indexOf(current);
    const next = PAYMENT_METHODS[(index + 1) % PAYMENT_METHODS.length] || DEFAULT_PAYMENT_METHOD;
    engine.setSlotValue("payment_method", next);
    return next;
  }

  function summarySpec() {
    const drink = engine.getSlotValue("drink") || "Coffee";
    const size = engine.getSlotValue("size") || "Medium";
    const summary = engine.resolveConfirmTemplate({
      drink,
      size,
      price: currentPrice(),
      payment_method: currentPaymentMethod(),
    });
    return {
      intentHeader: "Confirm order",
      layout: ["info_card"],
      wrapBody: true,
      bodyClass: "g-flight-content-pad",
      props: {
        info_card: summary,
      },
      actions: [
        { id: "order", emoji: "✅" },
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
    if (slotId === "payment_method") {
      return {
        intentHeader: "Payment",
        layout: ["selection_list"],
        wrapBody: true,
        bodyClass: "g-flight-content-pad",
        props: {
          selection_list: {
            selectedIndex: engine.state.selectionIndex,
            rowDataAttr: "data-coffee-payment",
            items: PAYMENT_METHODS.map((label) => ({
              title: label,
              subtitle: label.includes("Apple Pay") ? "Default wallet" : "Primary card",
            })),
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
    const max = slotId === "drink"
      ? DRINKS.length - 1
      : slotId === "size"
        ? SIZES.length - 1
        : slotId === "payment_method"
          ? PAYMENT_METHODS.length - 1
          : 1;
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
    if (slotId === "payment_method") return advanceFromSelection(PAYMENT_METHODS[engine.state.selectionIndex]);
    if (slotId === "confirm") {
      if (engine.state.selectionIndex === 0) return executeOrder();
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
    engine.start({}, getPaymentDefaultSources({ fallback: DEFAULT_PAYMENT_METHOD }));
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
    if (slotId === "payment_method") {
      if (/\bapple pay\b/.test(lower)) {
        engine.setSelectionIndex(0);
        return confirm();
      }
      if (/\bvisa\b/.test(lower)) {
        engine.setSelectionIndex(1);
        return confirm();
      }
    }
    if (slotId === "confirm") {
      if (/\b(change drink|different drink|edit drink)\b/.test(lower)) {
        engine.goToSlot("drink");
        render(true);
        return;
      }
      if (/\b(change size|different size|edit size)\b/.test(lower)) {
        engine.goToSlot("size");
        render(true);
        return;
      }
      if (/\b(large|medium|small)\b/.test(lower)) {
        const size = SIZES.find((item) => lower.includes(item.toLowerCase()));
        if (size) {
          engine.setSlotValue("size", size);
          engine.setSelectionIndex(0);
          render(true);
          return;
        }
      }
      if (/\b(latte|cappuccino|americano)\b/.test(lower)) {
        const drink = DRINKS.find((item) => lower.includes(item.toLowerCase()));
        if (drink) {
          engine.setSlotValue("drink", drink);
          engine.setSelectionIndex(0);
          render(true);
          return;
        }
      }
      if (/\b(visa|apple pay|different card|payment)\b/.test(lower)) {
        engine.goToSlot("payment_method");
        if (lower.includes("visa")) engine.setSelectionIndex(1);
        else engine.setSelectionIndex(0);
        render(true);
        return;
      }
      if (/\b(order|confirm|yes)\b/.test(lower)) {
        engine.setSelectionIndex(0);
        return confirm();
      }
      if (/\b(cancel|never mind|nevermind)\b/.test(lower)) {
        engine.setSelectionIndex(1);
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
