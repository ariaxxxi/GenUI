export function createFlightRender({
  SHAPES,
  morphTo,
  hideRich,
  showRich,
  stopSiriOrb,
  setIntentHeader,
  hideIntentHeader,
  positionIntentHeaderAboveMain,
  trackIntentHeaderForTransition,
  startCommandListening,
  addChatBubble,
  getFlow,
  buildRouteRowHtml,
}) {
  const THINKING_HOLD_MS = 3000;
  const DATE_SELECTION_STEP_GEO = { ...SHAPES["card-form"], main: { ...SHAPES["card-form"].main, h: 180, ty: -90 } };

  function optionRows(options) {
    const flow = getFlow();
    const step = flow.step();
    return options.map((opt, index) => `
      <div class="rich-flight-row ${index === flow.focused ? "selected" : ""}" data-flight-opt="${index}">
        <div class="rich-flight-left">
          <div class="rich-flight-airline">${opt.icon || ""} ${opt.name}</div>
          <div class="rich-flight-times">${opt.sub || ""}</div>
        </div>
        <div class="rich-flight-right">${step.type === "options" && step.key === "flight" ? `<div class="rich-flight-price">${((String(opt.sub || "").match(/\$\d[\d,]*/) || [""])[0])}</div>` : ""}</div>
      </div>
      ${index < options.length - 1 ? '<div class="rich-divider"></div>' : ""}
    `).join("");
  }

  function buildConfirmRows() {
    const flow = getFlow();
    const departDate = flow.data.depart || "—";
    const returnDate = flow.data.return || "—";
    const fromCode = flow.data.origin || "SFO";
    const toCode = flow.cityToAirport(flow.data.destination || "");
    const outTime = flow.data.flight || "7:10 AM - 10:30 AM";
    const backTime = flow.data.returnFlight || "2:10 PM - 11:30 PM";
    return `<div class="flight-confirm-card"><div class="flight-confirm-head">Departing flight • ${departDate}</div><div class="flight-confirm-time">${outTime}</div><div class="flight-confirm-route">${fromCode} - ${toCode}</div></div><div style="height:14px;"></div><div class="flight-confirm-card"><div class="flight-confirm-head">Returning flight • ${returnDate}</div><div class="flight-confirm-time">${backTime}</div><div class="flight-confirm-route">${toCode} - ${fromCode}</div></div><div class="flight-total-row"><div class="flight-total-lbl">Total</div><div class="flight-total-val">$395</div></div>`;
  }

  function buildPaymentRows() {
    const flow = getFlow();
    const options = flow.step().options || [];
    return options.map((opt, index) => `<div class="rich-flight-row ${index === flow.focused ? "selected" : ""}" data-flight-opt="${index}"><div class="rich-flight-left"><div class="rich-flight-airline">${opt.icon || ""} ${opt.name}</div><div class="rich-flight-times">${opt.sub || ""}</div></div><div class="rich-flight-right"><div class="rich-flight-meta">Space</div></div></div>${index < options.length - 1 ? '<div class="rich-divider"></div>' : ""}`).join("");
  }

  function renderStep(skipGreet = false) {
    const flow = getFlow();
    const step = flow.step();
    const stageEl = document.getElementById("stage");
    const isDestinationStep = step.type === "destination";
    const isDatesStep = step.type === "dates";
    if (stageEl) {
      stageEl.classList.toggle("flight-destination-active", isDestinationStep);
      stageEl.classList.toggle("flight-voice-viz", isDestinationStep || isDatesStep);
    }
    stopSiriOrb();
    hideRich();
    flow.C.thumb.style.opacity = "0";
    if (isDestinationStep || isDatesStep) startCommandListening?.();
    if (isDestinationStep) {
      setIntentHeader?.("Where are you going?", null);
      const hdr = document.getElementById("intent-header");
      if (hdr) hdr.classList.add("glass-intent");
      positionIntentHeaderAboveMain?.();
      trackIntentHeaderForTransition?.();
    } else if (isDatesStep) {
      setIntentHeader?.("When?", null);
      const hdr = document.getElementById("intent-header");
      if (hdr) hdr.classList.add("glass-intent");
      positionIntentHeaderAboveMain?.();
      trackIntentHeaderForTransition?.();
    } else {
      hideIntentHeader?.();
    }
    if (step.shape === "pill") morphTo("pill", step.type === "destination" ? { icon: "", primary: "", secondary: "" } : { icon: "✈", primary: "", secondary: "" });
    else if (step.shape === "card-form") morphTo("card-form", { icon: "", primary: "", secondary: "" }, step.type === "dates" ? DATE_SELECTION_STEP_GEO : null);
    else if (step.shape === "card-list") morphTo("card-list", { icon: "", primary: "", secondary: "" });
    else if (step.shape === "card") morphTo("card", { icon: "", primary: "", secondary: "" });
    else if (step.shape === "magic") morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });

    let html = "";
    if (step.type === "destination") {
      const dest = String(flow.data.destination || "").trim();
      html = `<div class="flight-destination-step">${buildRouteRowHtml(flow.data.origin, dest ? flow.cityToAirport(dest) : "Where to?", !!dest)}</div>`;
    } else if (step.type === "dates") {
      const ready = !!String(flow.data.destination || "").trim();
      html = `<div class="flight-date-step"><div class="flight-date-route-shared">${buildRouteRowHtml(flow.data.origin, ready ? flow.cityToAirport(flow.data.destination || "") : "Where to?", ready)}</div><div class="flight-date-panel"><div class="flight-date-panel-col"><div class="flight-date-panel-lbl">Depart</div><div class="flight-date-panel-val ${flow.data.depart ? "" : "placeholder"}">${flow.data.depart || "Select"}</div></div><div class="flight-date-panel-divider"></div><div class="flight-date-panel-col"><div class="flight-date-panel-lbl">Return</div><div class="flight-date-panel-val ${flow.data.return ? "" : "placeholder"}">${flow.data.return || "Select"}</div></div></div></div>`;
    } else if (step.type === "options") {
      html = `<div class="rich-list-header">${step.label}</div><div class="rich-divider"></div><div style="flex:1;overflow-y:auto;margin:0 -20px;padding:0 20px;">${optionRows(step.options || [])}</div>`;
    } else if (step.type === "thinking") {
      addChatBubble("ai", "Searching flights...");
      flow.setThinkingTimer(setTimeout(() => { flow.setThinkingTimer(null); flow.nextStep(true); }, THINKING_HOLD_MS));
    } else if (step.type === "confirm") {
      html = `<div class="rich-list-header">Confirm flight</div><div style="flex:1;overflow-y:auto;margin:0 -4px;padding:0 4px;">${buildConfirmRows()}</div>`;
    } else if (step.type === "payment") {
      html = `<div class="rich-list-header">Payment</div><div class="rich-divider"></div><div style="flex:1;overflow-y:auto;margin:0 -20px;padding:0 20px;">${buildPaymentRows()}</div>`;
    } else if (step.type === "done") {
      html = `<div class="rich-list-header">Trip booked</div><div class="rich-divider"></div><div class="rich-route-sub" style="padding-top:10px;">${flow.data.flight || "Flight"} to ${flow.data.destination}</div><div class="rich-route-sub">${flow.data.depart || "—"} → ${flow.data.return || "—"} · ${flow.data.paymentMethod || "Paid"}</div>`;
    }
    if (html) setTimeout(() => showRich(html), 180);
    if (!skipGreet && step.aiGreet) addChatBubble("ai", step.aiGreet);
    if (step.type === "done") setTimeout(() => flow.resetToHome(), 2800);
  }

  return { THINKING_HOLD_MS, DATE_SELECTION_STEP_GEO, optionRows, buildConfirmRows, buildPaymentRows, renderStep };
}
