import { createFlightRender } from "./flight-render.js";
import { createFlightAi } from "./flight-ai.js";

const FLOW_STEPS = [
  { type: "destination", shape: "pill", aiGreet: "Where would you like to go?" },
  { type: "dates", shape: "card-form", aiGreet: "When are you departing, and when do you return?" },
  { type: "options", shape: "card-list", label: "Passengers", key: "passengers", aiGreet: "How many passengers?", options: [{ icon: "🧑", name: "1 adult", sub: "Just me" }, { icon: "👫", name: "2 adults", sub: "Pair" }, { icon: "👨‍👩‍👧", name: "Family · 2+", sub: "Adults with children" }] },
  { type: "thinking", shape: "magic", aiGreet: null },
  { type: "options", shape: "card-list", label: "Choose your flight", key: "flight", aiGreet: "I found three options — arrow keys to navigate, space to pick.", options: [{ icon: "🟢", name: "06:45 → 09:30", sub: "ANA · Non-stop · $842" }, { icon: "🟡", name: "10:15 → 15:40", sub: "JAL · 1 stop · $631" }, { icon: "🟢", name: "22:00 → 06:15+1", sub: "United · Non-stop · $912" }] },
  { type: "confirm", shape: "card-form", aiGreet: "Here's your flight summary. Space to continue or tell me what to change." },
  { type: "payment", shape: "card-form", aiGreet: "How would you like to pay?", options: [{ icon: "", name: "Apple Pay", sub: "Default wallet" }, { icon: "💳", name: "Visa •••• 9421", sub: "Primary card" }, { icon: "🏦", name: "Bank transfer", sub: "1-2 business days" }] },
  { type: "done", shape: "card", aiGreet: null },
];

export function createFlightBookingFlow(ctx) {
  const FLOW_START_THINK_MS = 1600;
  const flow = { active: false, stepIndex: 0, focused: 0, editReturnStepIndex: null, data: { origin: "SFO", destination: "", depart: "", return: "", passengers: "", flight: "", paymentMethod: "" }, thinkingTimer: null, startupTimer: null, C: ctx.C };
  const apiUrl = (path) => `${location.protocol === "file:" ? "http://localhost:5180" : ""}${path}`;

  function step() { return FLOW_STEPS[flow.stepIndex] || FLOW_STEPS[0]; }
  function resetData() { flow.data = { origin: "SFO", destination: "", depart: "", return: "", passengers: "", flight: "", paymentMethod: "" }; flow.editReturnStepIndex = null; }
  function normalizeCity(input) { return String(input || "").trim().split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" "); }
  function cityToAirport(city) { const key = String(city || "").toLowerCase(); const map = { tokyo: "NRT", paris: "CDG", london: "LHR", "new york": "JFK", ny: "JFK", nyc: "JFK", manhattan: "JFK", sydney: "SYD", dubai: "DXB", seoul: "ICN", amsterdam: "AMS", singapore: "SIN", berlin: "BER" }; const found = Object.keys(map).find((entry) => key.includes(entry)); return found ? map[found] : (city ? city.toUpperCase().slice(0, 3) : "---"); }
  function buildRouteRowHtml(originText, destinationText, options = {}) {
    const originReady = options?.originReady !== false;
    const destinationReady = options?.destinationReady === true;
    const destinationInlineStyle = destinationReady
      ? ""
      : ' style="font-family:Inter,DM Sans,sans-serif;font-size:20px;font-weight:400;color:rgba(255,255,255,0.24);"';
    return `<div class="flight-route-row-core"><div class="flight-destination-origin ${originReady ? "filled" : "placeholder"}">${originText}</div><div class="flight-destination-swap" aria-hidden="true"><svg viewBox="0 0 26 24.7279" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.8"><path d="M11 6.36396C10.4477 6.36396 10 6.81168 10 7.36396C10 7.91624 10.4477 8.36396 11 8.36396L11 7.36396L11 6.36396ZM25.7071 8.07107C26.0976 7.68054 26.0976 7.04738 25.7071 6.65685L19.3431 0.292893C18.9526 -0.0976311 18.3195 -0.0976312 17.9289 0.292893C17.5384 0.683418 17.5384 1.31658 17.9289 1.70711L23.5858 7.36396L17.9289 13.0208C17.5384 13.4113 17.5384 14.0445 17.9289 14.435C18.3195 14.8256 18.9526 14.8256 19.3431 14.435L25.7071 8.07107ZM11 7.36396L11 8.36396L25 8.36396L25 7.36396L25 6.36396L11 6.36396L11 7.36396Z" fill="white"/><path d="M0.292893 16.6569C-0.0976311 17.0474 -0.0976311 17.6805 0.292893 18.0711L6.65685 24.435C7.04738 24.8256 7.68054 24.8256 8.07107 24.435C8.46159 24.0445 8.46159 23.4113 8.07107 23.0208L2.41421 17.364L8.07107 11.7071C8.46159 11.3166 8.46159 10.6834 8.07107 10.2929C7.68054 9.90237 7.04738 9.90237 6.65685 10.2929L0.292893 16.6569ZM15 18.364C15.5523 18.364 16 17.9162 16 17.364C16 16.8117 15.5523 16.364 15 16.364L15 17.364L15 18.364ZM1 17.364L1 18.364L15 18.364L15 17.364L15 16.364L1 16.364L1 17.364Z" fill="white"/></g></svg></div><div class="flight-destination-target ${destinationReady ? "filled" : "placeholder"} ${destinationReady ? "" : "destination-placeholder-fixed"}"${destinationInlineStyle}>${destinationText}</div></div>`;
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
    data: flow.data,
    get active() { return flow.active; },
    get focused() { return flow.focused; },
    set focused(value) { flow.focused = value; },
    get editReturnStepIndex() { return flow.editReturnStepIndex; },
    set editReturnStepIndex(value) { flow.editReturnStepIndex = value; },
    setThinkingTimer(timer) { flow.thinkingTimer = timer; },
    step,
    renderStep: render.renderStep,
    nextStep(skipGreet = false) { if (flow.stepIndex >= FLOW_STEPS.length - 1) return; flow.stepIndex += 1; flow.focused = 0; render.renderStep(skipGreet); },
    backStep() { if (!flow.active) return; if (flow.stepIndex > 0) { flow.stepIndex -= 1; flow.focused = 0; render.renderStep(true); } else api.resetToHome(); },
    stepIndexBy(type, key = null) { return FLOW_STEPS.findIndex((entry) => entry.type === type && (key == null || entry.key === key)); },
    nextStepFor(currentStep) { if (flow.editReturnStepIndex != null && currentStep?.type === "dates") return FLOW_STEPS[flow.editReturnStepIndex] || null; const index = FLOW_STEPS.findIndex((entry) => entry.type === currentStep?.type && entry.key === currentStep?.key && entry.shape === currentStep?.shape); return FLOW_STEPS[index + 1] || null; },
    jumpToStep(target) { const idx = api.stepIndexBy(target.type, target.key || null); if (idx < 0) return false; flow.stepIndex = idx; flow.focused = 0; render.renderStep(true); return true; },
    normalizeCity,
    cityToAirport,
    advanceAfterDatesConfirm() { if (flow.editReturnStepIndex != null) { const idx = flow.editReturnStepIndex; flow.editReturnStepIndex = null; flow.stepIndex = idx; flow.focused = 0; render.renderStep(true); } else api.nextStep(true); },
    selectByIndex(index) { const current = step(); const selected = current.options?.[Math.max(0, Math.min((current.options || []).length - 1, index))]; if (!selected) return; flow.focused = index; ctx.addChatBubble("user", selected.name); if (current.type === "payment") flow.data.paymentMethod = selected.name; else { flow.data[current.key] = selected.name; if (current.key === "flight") flow.data.returnFlight = selected.sub?.split("·")?.[0]?.trim() || "2:10 PM - 11:30 PM"; } api.nextStep(); },
    resetToHome() { if (flow.thinkingTimer) clearTimeout(flow.thinkingTimer); if (flow.startupTimer) clearTimeout(flow.startupTimer); flow.thinkingTimer = null; flow.startupTimer = null; flow.active = false; flow.stepIndex = 0; flow.focused = 0; flow.editReturnStepIndex = null; ctx.hideTypingBubble(); ctx.morph.hideRich(); ctx.shell.stopSiriOrb(); ctx.shell.clearOrbLabel?.(); ctx.shell.hideIntentHeader?.(); if (typeof ctx.returnToHomeContext === "function") ctx.returnToHomeContext(); else ctx.morph.morphTo("circle", { icon: "", primary: "", secondary: "", detail: "" }); const stageEl = document.getElementById("stage"); stageEl?.classList.remove("flow-active", "flight-destination-active", "flight-voice-viz"); document.getElementById("stage-wrap")?.classList.remove("flow-active"); },
    syncDestinationFromText(userText) { const match = String(userText || "").match(/to\s+([a-zA-Z\s]+)/i); if (match) flow.data.destination = normalizeCity(match[1].trim()); },
    isFlightIntent(userText) { return /(?:\bflight\b|\bfly\b|book\s+(?:a\s+)?flight|\bticket\b)/i.test(String(userText || "")); },
  };

  function moveHighlight(dir) {
    const current = step();
    if (!flow.active || (current.type !== "options" && current.type !== "payment")) return;
    flow.focused = Math.max(0, Math.min((current.options || []).length - 1, flow.focused + dir));
    document.querySelectorAll("[data-flight-opt]").forEach((el, idx) => el.classList.toggle("selected", idx === flow.focused));
  }

  function confirmStep() {
    const current = step();
    if (current.type === "options" || current.type === "payment") return api.selectByIndex(flow.focused);
    if (current.type === "confirm" || current.type === "dates") return api.advanceAfterDatesConfirm();
    if (current.type === "done") return api.resetToHome();
  }

  async function handleUserInput(userText) { if (!flow.active) return; await ai.handleUserInput(userText); }
  function start(seedText = "") {
    resetData();
    if (flow.thinkingTimer) clearTimeout(flow.thinkingTimer);
    if (flow.startupTimer) clearTimeout(flow.startupTimer);
    flow.thinkingTimer = null;
    flow.startupTimer = null;
    if (seedText) api.syncDestinationFromText(seedText);
    flow.active = true;
    flow.stepIndex = 0;
    flow.focused = 0;
    document.getElementById("stage").classList.add("flow-active");
    document.getElementById("stage-wrap")?.classList.add("flow-active");
    ctx.shell.hideIntentHeader?.();
    ctx.shell.stopSiriOrb();
    ctx.morph.hideRich();
    ctx.shell.setOrbLabel?.("Initiating...");
    ctx.morph.morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });
    flow.startupTimer = setTimeout(() => {
      flow.startupTimer = null;
      if (!flow.active) return;
      ctx.shell.clearOrbLabel?.();
      flow.stepIndex = 0;
      flow.focused = 0;
      render.renderStep(false);
      if (seedText && /\bto\s+[a-zA-Z]/i.test(seedText)) {
        ctx.addChatBubble("user", seedText);
        ctx.addChatBubble("ai", `Got it. Flying to ${flow.data.destination || "your destination"}.`);
        api.nextStep(true);
      }
    }, FLOW_START_THINK_MS);
  }
  function cancel() { if (flow.active) api.backStep(); }

  return { isActive: () => flow.active, start, cancel, reset: api.resetToHome, handleUserInput, handleKeyDown(e) { const activeInInput = document.activeElement?.matches?.("input, textarea, select"); if (!flow.active) return false; if (e.key === "Escape") { e.preventDefault(); api.resetToHome(); return true; } if ((e.key === "x" || e.key === "X") && !(activeInInput && ctx.input.value.trim().length > 0)) { e.preventDefault(); api.backStep(); return true; } if (e.key === "ArrowUp") { e.preventDefault(); moveHighlight(-1); return true; } if (e.key === "ArrowDown") { e.preventDefault(); moveHighlight(1); return true; } if (e.code === "Space" && !(activeInInput && ctx.input.value.length > 0)) { e.preventDefault(); confirmStep(); return true; } return false; }, moveHighlight, confirmStep, syncDestinationFromText: api.syncDestinationFromText, processRequest(userText) { if (api.isFlightIntent(userText)) { api.syncDestinationFromText(userText); start(userText); return true; } return false; } };
}
