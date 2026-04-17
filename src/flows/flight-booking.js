import { getPaymentDefaultSources } from "../ai/flow-engine.js";
import { createFlightRender } from "./flight-render.js";
import { createFlightAi } from "./flight-ai.js";
import { apiUrl } from "../utils.js";

const AIRLINE_LOGOS = {
  United: "src/assets/airline-united-ref.webp",
  Delta: "src/assets/airline-delta-ref.png",
  Alaska: "src/assets/airline-alaska-ref.png",
};

const PAYMENT_METHODS = [
  { icon: "", name: "Apple Pay ···· 9421", sub: "Default wallet" },
  { icon: "💳", name: "Visa ···· 9421", sub: "Primary card" },
  { icon: "🏦", name: "Bank transfer", sub: "1-2 business days" },
];
const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0].name;
const DEFAULT_FLIGHT_RECOMMENDATION_INDEX = 1;
const FLIGHT_RECOMMENDATIONS = [
  {
    icon: "🟢",
    avatar: AIRLINE_LOGOS.United,
    avatarKind: "logo",
    airline: "United",
    name: "06:45 → 09:30",
    sub: "United · Non-stop · $842",
    price: "$842",
    stops: "Non-stop",
    outbound: { departTime: "6:45 AM", arriveTime: "9:30 AM" },
    inbound: { departTime: "1:25 PM", arriveTime: "4:10 PM" },
  },
  {
    icon: "🟡",
    avatar: AIRLINE_LOGOS.Delta,
    avatarKind: "logo",
    airline: "Delta",
    name: "07:10 → 10:30",
    sub: "Delta · 1 stop · $631",
    price: "$631",
    stops: "1 stop",
    outbound: { departTime: "7:10 AM", arriveTime: "10:30 AM" },
    inbound: { departTime: "2:10 PM", arriveTime: "11:30 PM" },
  },
  {
    icon: "🟢",
    avatar: AIRLINE_LOGOS.Alaska,
    avatarKind: "logo",
    airline: "Alaska",
    name: "22:00 → 06:15+1",
    sub: "Alaska · Non-stop · $912",
    price: "$912",
    stops: "Non-stop",
    outbound: { departTime: "10:00 PM", arriveTime: "6:15 AM +1" },
    inbound: { departTime: "8:10 AM", arriveTime: "4:25 PM" },
  },
];

const FLOW_STEPS = [
  { type: "destination", shape: "pill", aiGreet: "Where would you like to go?" },
  { type: "dates", shape: "card-form", aiGreet: "When are you departing, and when do you return?" },
  { type: "thinking", shape: "magic", aiGreet: null },
  { type: "recommendation", shape: "card", label: "Recommended flight", key: "flight", aiGreet: "I found a flight I recommend. Want to book it or see alternatives?", options: FLIGHT_RECOMMENDATIONS },
  { type: "payment", shape: "card-list", label: "Payment", key: "payment", aiGreet: "How would you like to pay?", options: PAYMENT_METHODS },
  { type: "confirm", shape: "card", aiGreet: "SFO to your destination, with your default payment. Book it?" },
  { type: "done", shape: "card", aiGreet: null },
];

export function createFlightBookingFlow(ctx) {
  const FLOW_START_THINK_MS = 1600;
  const CONFIRM_CONTAINER_INDEX = 2;
  const CONFIRM_SCROLL_STEP = 72;
  const RECOMMENDATION_HOLD_MS = 280;
  const flow = { active: false, stepIndex: 0, focused: 0, editReturnStepIndex: null, recommendationMode: "recommend", recommendationMenuOpen: false, recommendationMenuHolding: false, showConfirmDetails: false, selectedFlightOption: null, data: { origin: "SFO", destination: "", depart: "", return: "", passengers: "", flight: "", returnFlight: "", paymentMethod: "" }, thinkingTimer: null, startupTimer: null, recommendationHoldTimer: null, recommendationExitTimer: null, C: ctx.C };
  let flowEpoch = 0;

  function isEpochAlive(epoch) {
    return epoch === flowEpoch && flow.active;
  }

  function step() { return FLOW_STEPS[flow.stepIndex] || FLOW_STEPS[0]; }
  function setStep(nextStep, highlight = 0) { flow.stepIndex = typeof nextStep === "number" ? Math.max(0, Math.min(FLOW_STEPS.length - 1, nextStep)) : Math.max(0, FLOW_STEPS.findIndex((entry) => entry.type === nextStep)); flow.focused = Math.max(0, Number(highlight) || 0); }
  function resetData() {
    const paymentSources = getPaymentDefaultSources({ fallback: DEFAULT_PAYMENT_METHOD });
    flow.data = {
      origin: "SFO",
      destination: "",
      depart: "",
      return: "",
      passengers: "",
      flight: "",
      returnFlight: "",
      paymentMethod: paymentSources.user.primaryPaymentMethod || "",
    };
    flow.selectedFlightOption = null;
    flow.editReturnStepIndex = null;
    flow.recommendationMode = "recommend";
    flow.recommendationMenuOpen = false;
    flow.recommendationMenuHolding = false;
    flow.showConfirmDetails = false;
  }
  function normalizeCity(input) { return String(input || "").trim().split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" "); }
  function cityToAirport(city) { const key = String(city || "").toLowerCase(); const map = { tokyo: "NRT", paris: "CDG", london: "LHR", "new york": "JFK", ny: "JFK", nyc: "JFK", manhattan: "JFK", sydney: "SYD", dubai: "DXB", seoul: "ICN", amsterdam: "AMS", singapore: "SIN", berlin: "BER" }; const found = Object.keys(map).find((entry) => key.includes(entry)); return found ? map[found] : (city ? city.toUpperCase().slice(0, 3) : "---"); }
  function clearRecommendationHoldTimer() {
    if (!flow.recommendationHoldTimer) return;
    clearTimeout(flow.recommendationHoldTimer);
    flow.recommendationHoldTimer = null;
  }
  function clearRecommendationExitTimer() {
    if (!flow.recommendationExitTimer) return;
    clearTimeout(flow.recommendationExitTimer);
    flow.recommendationExitTimer = null;
  }
  function clearRecommendationPointerGesture() {
    return;
  }
  function closeRecommendationMenu() {
    clearRecommendationHoldTimer();
    clearRecommendationExitTimer();
    flow.recommendationMenuHolding = false;
    flow.recommendationMenuOpen = false;
    clearRecommendationPointerGesture();
    render.updateRecommendationMenuUi?.(false, flow.focused);
  }
  function resetConfirmState() {
    flow.showConfirmDetails = false;
    flow.focused = 0;
    render.resetConfirmScroll?.();
  }
  function renderAnimatedFlightValue(text, { baseClass, filled, placeholderFixed = false, animate = true } = {}) {
    const classes = [baseClass, filled ? "filled" : "placeholder"];
    if (!filled && placeholderFixed) classes.push("destination-placeholder-fixed");
    const textClasses = ["flight-field-text", filled ? "is-filled" : "is-placeholder"];
    if (animate) textClasses.push("animate-enter");
    return `<div class="${classes.join(" ")}"><span class="${textClasses.join(" ")}">${text || ""}</span></div>`;
  }
  function buildRouteRowHtml(originText, destinationText, options = {}) {
    const originReady = options?.originReady !== false;
    const destinationReady = options?.destinationReady === true;
    return `<div class="flight-route-row-core">${renderAnimatedFlightValue(originText, { baseClass: "flight-destination-origin", filled: originReady, animate: options?.animateOrigin !== false })}<div class="flight-destination-swap" aria-hidden="true"><svg viewBox="0 0 26 24.7279" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.8"><path d="M11 6.36396C10.4477 6.36396 10 6.81168 10 7.36396C10 7.91624 10.4477 8.36396 11 8.36396L11 7.36396L11 6.36396ZM25.7071 8.07107C26.0976 7.68054 26.0976 7.04738 25.7071 6.65685L19.3431 0.292893C18.9526 -0.0976311 18.3195 -0.0976312 17.9289 0.292893C17.5384 0.683418 17.5384 1.31658 17.9289 1.70711L23.5858 7.36396L17.9289 13.0208C17.5384 13.4113 17.5384 14.0445 17.9289 14.435C18.3195 14.8256 18.9526 14.8256 19.3431 14.435L25.7071 8.07107ZM11 7.36396L11 8.36396L25 8.36396L25 7.36396L25 6.36396L11 6.36396L11 7.36396Z" fill="white"/><path d="M0.292893 16.6569C-0.0976311 17.0474 -0.0976311 17.6805 0.292893 18.0711L6.65685 24.435C7.04738 24.8256 7.68054 24.8256 8.07107 24.435C8.46159 24.0445 8.46159 23.4113 8.07107 23.0208L2.41421 17.364L8.07107 11.7071C8.46159 11.3166 8.46159 10.6834 8.07107 10.2929C7.68054 9.90237 7.04738 9.90237 6.65685 10.2929L0.292893 16.6569ZM15 18.364C15.5523 18.364 16 17.9162 16 17.364C16 16.8117 15.5523 16.364 15 16.364L15 17.364L15 18.364ZM1 17.364L1 18.364L15 18.364L15 17.364L15 16.364L1 16.364L1 17.364Z" fill="white"/></g></svg></div>${renderAnimatedFlightValue(destinationText, { baseClass: "flight-destination-target", filled: destinationReady, placeholderFixed: true, animate: options?.animateDestination !== false })}</div>`;
  }

  const render = createFlightRender({
    SHAPES: ctx.SHAPES,
    morphTo: ctx.morph.morphTo,
    hideRich: ctx.morph.hideRich,
    showRich: ctx.morph.showRich,
    stopSiriOrb: ctx.shell.stopSiriOrb,
    setIntentHeader: ctx.shell.setIntentHeader,
    hideIntentHeader: ctx.shell.hideIntentHeader,
    positionIntentHeaderAboveMain: ctx.shell.positionIntentHeaderAboveMain,
    trackIntentHeaderForTransition: ctx.shell.trackIntentHeaderForTransition,
    startCommandListening: () => ctx.voice?.voiceEngine?.start?.("command"),
    addChatBubble: ctx.addChatBubble,
    getFlow: () => api,
    buildRouteRowHtml,
  });
  const ai = createFlightAi({ apiUrl, getFlow: () => api, addChatBubble: ctx.addChatBubble });

  const api = {
    C: ctx.C,
    get data() { return flow.data; },
    get active() { return flow.active; },
    get focused() { return flow.focused; },
    set focused(value) { flow.focused = value; },
    get editReturnStepIndex() { return flow.editReturnStepIndex; },
    set editReturnStepIndex(value) { flow.editReturnStepIndex = value; },
    get recommendationMode() { return flow.recommendationMode; },
    set recommendationMode(value) { flow.recommendationMode = value; },
    get recommendationMenuOpen() { return flow.recommendationMenuOpen; },
    set recommendationMenuOpen(value) { flow.recommendationMenuOpen = !!value; },
    get recommendationMenuHolding() { return flow.recommendationMenuHolding; },
    set recommendationMenuHolding(value) { flow.recommendationMenuHolding = !!value; },
    get showConfirmDetails() { return flow.showConfirmDetails; },
    set showConfirmDetails(value) { flow.showConfirmDetails = !!value; },
    setThinkingTimer(timer) { flow.thinkingTimer = timer; },
    step,
    paymentMethods: PAYMENT_METHODS,
    defaultPaymentMethod: DEFAULT_PAYMENT_METHOD,
    get selectedFlightOption() { return flow.selectedFlightOption; },
    setSelectedFlightOption(option) {
      flow.selectedFlightOption = option ? { ...option } : null;
      flow.data.flight = option ? `${option.outbound?.departTime || ""} - ${option.outbound?.arriveTime || ""}`.trim() : "";
      flow.data.returnFlight = option ? `${option.inbound?.departTime || ""} - ${option.inbound?.arriveTime || ""}`.trim() : "";
    },
    currentFlightOptions() { return FLOW_STEPS.find((entry) => entry.type === "recommendation")?.options || []; },
    recommendedFlightIndex(mode = flow.recommendationMode) {
      const options = api.currentFlightOptions();
      if (mode === "alternatives") return 0;
      return DEFAULT_FLIGHT_RECOMMENDATION_INDEX;
    },
    currentRecommendedFlight() {
      if (flow.recommendationMode === "recommend" && flow.selectedFlightOption) return flow.selectedFlightOption;
      return api.currentFlightOptions()[api.recommendedFlightIndex()] || api.currentFlightOptions()[0] || null;
    },
    recommendationOptionsForUi() {
      const recommended = api.currentRecommendedFlight();
      const options = api.currentFlightOptions();
      if (!recommended) return options.slice();
      const recommendedName = String(recommended.name || "");
      return [recommended, ...options.filter((option) => String(option?.name || "") !== recommendedName)];
    },
    selectRecommendationOptionByUiIndex(index, { advance = true } = {}) {
      const options = api.recommendationOptionsForUi();
      const selected = options[Math.max(0, Math.min(options.length - 1, Number(index) || 0))];
      if (!selected) return false;
      api.setSelectedFlightOption(selected);
      flow.recommendationMode = "recommend";
      flow.recommendationMenuOpen = false;
      flow.recommendationMenuHolding = false;
      flow.focused = 0;
      clearRecommendationPointerGesture();
      if (advance) {
        api.nextStep();
      } else {
        render.renderStep(true);
      }
      return true;
    },
    animateRecommendationSelection(index, { advance = true } = {}) {
      if (flow.recommendationExitTimer) return true;
      const options = api.recommendationOptionsForUi();
      const selectedIndex = Math.max(0, Math.min(options.length - 1, Number(index) || 0));
      const selected = options[selectedIndex];
      if (!selected) return false;
      const visibleIndex = flow.recommendationMenuOpen ? selectedIndex : 0;
      clearRecommendationHoldTimer();
      flow.recommendationMenuHolding = false;
      flow.recommendationMenuOpen = false;
      clearRecommendationPointerGesture();
      const started = render.animateRecommendationExit?.(visibleIndex);
      const finishSelection = () => {
        flow.recommendationExitTimer = null;
        api.setSelectedFlightOption(selected);
        flow.recommendationMode = "recommend";
        flow.recommendationMenuOpen = false;
        flow.recommendationMenuHolding = false;
        flow.focused = 0;
        if (advance) {
          api.nextStep();
        } else {
          render.renderStep(true);
        }
      };
      if (!started) {
        finishSelection();
        return true;
      }
      flow.recommendationExitTimer = setTimeout(() => {
        if (!flow.active) {
          flow.recommendationExitTimer = null;
          return;
        }
        finishSelection();
      }, render.DISAMBIGUATION_EXIT_MS || 600);
      return true;
    },
    renderStep: render.renderStep,
    nextStep(skipGreet = false) {
      if (flow.stepIndex >= FLOW_STEPS.length - 1) return;
      closeRecommendationMenu();
      let nextIndex = flow.stepIndex + 1;
      while (nextIndex < FLOW_STEPS.length && FLOW_STEPS[nextIndex]?.type === "payment" && flow.data.paymentMethod) nextIndex += 1;
      if (nextIndex >= FLOW_STEPS.length) return;
      if (FLOW_STEPS[nextIndex]?.type === "confirm") resetConfirmState();
      flow.stepIndex = nextIndex;
      if (FLOW_STEPS[nextIndex]?.type !== "confirm") flow.focused = 0;
      render.renderStep(skipGreet);
    },
    backStep() { if (!flow.active) return; closeRecommendationMenu(); if (flow.stepIndex > 0) { flow.stepIndex -= 1; flow.focused = 0; render.renderStep(true); } else api.resetToHome(); },
    stepIndexBy(type, key = null) { return FLOW_STEPS.findIndex((entry) => entry.type === type && (key == null || entry.key === key)); },
    nextStepFor(currentStep) {
      if (flow.editReturnStepIndex != null && currentStep?.type === "dates") return FLOW_STEPS[flow.editReturnStepIndex] || null;
      const index = FLOW_STEPS.findIndex((entry) => entry.type === currentStep?.type && entry.key === currentStep?.key && entry.shape === currentStep?.shape);
      let nextIndex = index + 1;
      while (nextIndex < FLOW_STEPS.length && FLOW_STEPS[nextIndex]?.type === "payment" && flow.data.paymentMethod) nextIndex += 1;
      return FLOW_STEPS[nextIndex] || null;
    },
    jumpToStep(target) { const idx = api.stepIndexBy(target.type, target.key || null); if (idx < 0) return false; closeRecommendationMenu(); if (FLOW_STEPS[idx]?.type === "confirm") resetConfirmState(); flow.stepIndex = idx; if (FLOW_STEPS[idx]?.type !== "confirm") flow.focused = 0; render.renderStep(true); return true; },
    normalizeCity,
    cityToAirport,
    advanceAfterDatesConfirm() { if (flow.editReturnStepIndex != null) { const idx = flow.editReturnStepIndex; flow.editReturnStepIndex = null; flow.stepIndex = idx; flow.focused = 0; render.renderStep(true); } else api.nextStep(true); },
    selectByIndex(index) {
      const current = step();
      const selected = current.options?.[Math.max(0, Math.min((current.options || []).length - 1, index))];
      if (!selected) return;
      flow.focused = index;
      ctx.addChatBubble("user", selected.name);
      if (current.type === "recommendation") {
        return api.animateRecommendationSelection(index);
      }
      if (current.type === "payment") {
        flow.data.paymentMethod = selected.name;
        return api.nextStep();
      }
      flow.data[current.key] = selected.name;
      api.nextStep();
    },
    resetToHome() { flowEpoch += 1; closeRecommendationMenu(); if (flow.thinkingTimer) clearTimeout(flow.thinkingTimer); if (flow.startupTimer) clearTimeout(flow.startupTimer); flow.thinkingTimer = null; flow.startupTimer = null; flow.active = false; flow.stepIndex = 0; flow.focused = 0; flow.editReturnStepIndex = null; ctx.hideTypingBubble(); document.body.classList.remove("glass-flow-active"); ctx.morph.hideRich(); ctx.shell.stopSiriOrb(); ctx.shell.clearOrbLabel?.(); ctx.shell.hideIntentHeader?.(); if (typeof ctx.returnToHomeContext === "function") ctx.returnToHomeContext(); else ctx.morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" }); const stageEl = document.getElementById("stage"); stageEl?.classList.remove("flow-active", "flight-destination-active", "flight-voice-viz"); document.getElementById("stage-wrap")?.classList.remove("flow-active"); },
    syncDestinationFromText(userText) { const match = String(userText || "").match(/to\s+([a-zA-Z\s]+)/i); if (match) flow.data.destination = normalizeCity(match[1].trim()); },
    isFlightIntent(userText) { return /(?:\bflight\b|\bfly\b|book\s+(?:a\s+)?flight|\bticket\b)/i.test(String(userText || "")); },
  };

  function moveHighlight(dir) {
    const current = step();
    if (!flow.active) return;
    if (flow.recommendationExitTimer) return;
    if (current.type === "payment" || (current.type === "recommendation" && flow.recommendationMode === "alternatives")) {
      const recommendationCount = current.type === "recommendation" ? api.recommendationOptionsForUi().length : (current.options || []).length;
      const nextFocused = Math.max(0, Math.min(recommendationCount - 1, flow.focused + dir));
      if (nextFocused !== flow.focused) { flow.focused = nextFocused; if (typeof ctx.playEarcon === "function") ctx.playEarcon("hover"); }
      document.querySelectorAll("[data-flight-opt]").forEach((el, idx) => el.classList.toggle("selected", idx === flow.focused));
      return;
    }
    if (current.type === "recommendation") {
      if (!flow.recommendationMenuOpen) return;
      const recommendationCount = api.recommendationOptionsForUi().length;
      const nextFocused = Math.max(0, Math.min(recommendationCount - 1, flow.focused + dir));
      if (nextFocused !== flow.focused) { flow.focused = nextFocused; if (typeof ctx.playEarcon === "function") ctx.playEarcon("hover"); }
      render.updateRecommendationSelectionUi?.(flow.focused);
      return;
    }
    if (current.type === "confirm") {
      if (flow.showConfirmDetails) {
        render.scrollConfirmDetails?.(dir * CONFIRM_SCROLL_STEP);
        return;
      }
      if (dir < 0) {
        flow.focused = CONFIRM_CONTAINER_INDEX;
      } else if (flow.focused === CONFIRM_CONTAINER_INDEX) {
        flow.focused = 0;
      } else {
        flow.focused = Math.max(0, Math.min(1, flow.focused + dir));
      }
      render.syncConfirmFocusUi?.(flow.focused);
    }
  }

  function updateRecommendationSelectionFromPointer() {
    return false;
  }

  function startRecommendationHold(options = {}) {
    const current = step();
    if (!flow.active || current.type !== "recommendation" || flow.recommendationMode !== "recommend" || flow.recommendationMenuOpen || flow.recommendationExitTimer) return false;
    closeRecommendationMenu();
    flow.recommendationMenuHolding = true;
    flow.focused = 0;
    flow.recommendationHoldTimer = setTimeout(() => {
      flow.recommendationHoldTimer = null;
      if (!flow.active || step().type !== "recommendation" || !flow.recommendationMenuHolding) return;
      flow.recommendationMenuOpen = true;
      if (!render.updateRecommendationMenuUi?.(true, flow.focused)) {
        render.renderStep(true);
      }
    }, RECOMMENDATION_HOLD_MS);
    return true;
  }

  function updateRecommendationPointerGesture(pointerY) {
    return false;
  }

  function endRecommendationHold(options = {}) {
    const current = step();
    if (!flow.active || current.type !== "recommendation" || flow.recommendationMode !== "recommend") return false;
    if (flow.recommendationHoldTimer) {
      clearRecommendationHoldTimer();
      flow.recommendationMenuHolding = false;
      clearRecommendationPointerGesture();
      return true;
    }
    if (flow.recommendationMenuOpen) {
      flow.recommendationMenuHolding = false;
      clearRecommendationPointerGesture();
      return true;
    }
    return false;
  }

  function confirmStep() {
    const current = step();
    if (flow.recommendationExitTimer) return true;
    if (current.type === "recommendation") {
      if (flow.recommendationMode === "alternatives") {
        return api.animateRecommendationSelection(flow.focused);
      }
      if (flow.recommendationMenuOpen) {
        return api.animateRecommendationSelection(flow.focused);
      }
      return api.animateRecommendationSelection(0);
    }
    if (current.type === "payment") return api.selectByIndex(flow.focused);
    if (current.type === "confirm") {
      if (flow.showConfirmDetails) {
        flow.showConfirmDetails = false;
        render.renderStep(true);
        return;
      }
      if (flow.focused === CONFIRM_CONTAINER_INDEX) {
        flow.showConfirmDetails = true;
        render.renderStep(true);
        return;
      }
      if (flow.focused === 0) return api.nextStep(true);
      return api.resetToHome();
    }
    if (current.type === "dates") return api.advanceAfterDatesConfirm();
    if (current.type === "done") return api.resetToHome();
  }

  async function handleUserInput(userText) { if (!flow.active) return; await ai.handleUserInput(userText); }
  function start(seedText = "") {
    flowEpoch += 1;
    const epoch = flowEpoch;
    resetData();
    if (flow.thinkingTimer) clearTimeout(flow.thinkingTimer);
    if (flow.startupTimer) clearTimeout(flow.startupTimer);
    flow.thinkingTimer = null;
    flow.startupTimer = null;
    if (seedText) api.syncDestinationFromText(seedText);
    flow.active = true;
    setStep(0, 0);
    document.getElementById("stage").classList.add("flow-active");
    document.getElementById("stage-wrap")?.classList.add("flow-active");
    ctx.shell.hideIntentHeader?.();
    ctx.shell.stopSiriOrb();
    ctx.morph.hideRich();
    ctx.shell.setOrbLabel?.("Initiating...");
    ctx.morph.morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });
    flow.startupTimer = setTimeout(() => {
      flow.startupTimer = null;
      if (!isEpochAlive(epoch)) return;
      ctx.shell.clearOrbLabel?.();
      setStep(0, 0);
      render.renderStep(false);
      if (seedText && /\bto\s+[a-zA-Z]/i.test(seedText)) {
        ctx.addChatBubble("user", seedText);
        ctx.addChatBubble("ai", `Got it. Flying to ${flow.data.destination || "your destination"}.`);
        api.nextStep(true);
      }
    }, FLOW_START_THINK_MS);
  }

  return { isActive: () => flow.active, start, cancel: api.resetToHome, reset: api.resetToHome, handleUserInput, handleKeyDown(e) { const activeInInput = document.activeElement?.matches?.("input, textarea, select"); if (!flow.active) return false; if (e.key === "Escape") { e.preventDefault(); api.resetToHome(); return true; } if ((e.key === "x" || e.key === "X") && !(activeInInput && ctx.input.value.trim().length > 0)) { e.preventDefault(); api.backStep(); return true; } if (e.key === "ArrowUp") { e.preventDefault(); moveHighlight(-1); return true; } if (e.key === "ArrowDown") { e.preventDefault(); moveHighlight(1); return true; } if (((e.code === "Space" && !(activeInInput && ctx.input.value.length > 0)) || (e.key === "Enter" && !activeInInput))) { e.preventDefault(); confirmStep(); return true; } return false; }, moveHighlight, confirmStep, startRecommendationHold, updateRecommendationPointerGesture, endRecommendationHold, syncDestinationFromText: api.syncDestinationFromText, processRequest(userText) { if (api.isFlightIntent(userText)) { api.syncDestinationFromText(userText); start(userText); return true; } return false; } };
}
