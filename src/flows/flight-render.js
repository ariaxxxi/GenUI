import {
  renderCompactStatus,
  renderFlightRouteStep,
  renderInfoCard,
  renderSelectionList,
} from "./ui-primitives.js";

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
  const TOP = 10;
  const BOTTOM = 10;
  const MIN_H = 100;
  const MAX_H = 400;
  const DATE_SELECTION_STEP_GEO = { ...SHAPES["card-form"], main: { ...SHAPES["card-form"].main, h: 180, ty: -90 } };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let measureLayer = null;

  function ensureMeasureLayer() {
    if (measureLayer) return measureLayer;
    measureLayer = document.getElementById("flight-measure-layer");
    if (measureLayer) return measureLayer;
    const layer = document.createElement("div");
    layer.id = "flight-measure-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:380px;visibility:hidden;pointer-events:none;z-index:-1;";
    document.body.appendChild(layer);
    measureLayer = layer;
    return layer;
  }

  function contentHeightPx(html) {
    const layer = ensureMeasureLayer();
    if (!layer) return 180;
    layer.innerHTML = `<div data-flight-measure-body>${html}</div>`;
    const body = layer.querySelector("[data-flight-measure-body]");
    const raw = body ? Math.ceil(Math.max(body.getBoundingClientRect().height || 0, body.offsetHeight || 0, body.scrollHeight || 0)) : 0;
    return raw > 0 ? clamp(raw, 60, MAX_H - TOP - BOTTOM) : 180;
  }

  function dynamicGeo(shape, html) {
    const base = SHAPES[shape] || SHAPES.card;
    const h = clamp(Math.round(contentHeightPx(html) + TOP + BOTTOM), MIN_H, MAX_H);
    return { ...base, main: { ...base.main, h, ty: -(h / 2) } };
  }

  function toastGeo(labelText = "Trip booked") {
    const base = SHAPES.pill || SHAPES.card;
    const text = String(labelText || "").trim();
    const estW = clamp(Math.round(text.length * 11 + 96), 160, 360);
    const h = 52;
    return { ...base, main: { ...base.main, w: estW, h, tx: -(estW / 2), ty: -(h / 2) - 18 } };
  }

  function optionRows(options) {
    const flow = getFlow();
    return renderSelectionList({
      selectedIndex: flow.focused,
      rowDataAttr: "data-flight-opt",
      items: options.map((opt) => ({
        icon: opt.icon || "✈️",
        title: opt.name || "",
        subtitle: String(opt.sub || "").replace(/\s*·\s*\$\d[\d,]*/g, "").trim(),
        detail: ((String(opt.sub || "").match(/\$\d[\d,]*/) || [""])[0]) || "",
      })),
    });
  }

  function buildConfirmRows() {
    const flow = getFlow();
    const departDate = flow.data.depart || "—";
    const returnDate = flow.data.return || "—";
    const fromCode = flow.data.origin || "SFO";
    const toCode = flow.cityToAirport(flow.data.destination || "");
    const outTime = flow.data.flight || "7:10 AM - 10:30 AM";
    const backTime = flow.data.returnFlight || "2:10 PM - 11:30 PM";
    return renderInfoCard({
      sections: [
        { eyebrow: `Departing flight • ${departDate}`, title: outTime, subtitle: `${fromCode} - ${toCode}` },
        { eyebrow: `Returning flight • ${returnDate}`, title: backTime, subtitle: `${toCode} - ${fromCode}` },
      ],
      footerLabel: "Total",
      footerValue: "$395",
    });
  }

  function buildPaymentRows() {
    const flow = getFlow();
    const options = flow.step().options || [];
    return renderSelectionList({
      selectedIndex: flow.focused,
      rowDataAttr: "data-flight-opt",
      items: options.map((opt) => ({
        icon: opt.icon || "💳",
        title: opt.name || "",
        subtitle: opt.sub || "",
        detail: "Space",
      })),
    });
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
    const showHeader = (label) => {
      setIntentHeader?.(label, null);
      const hdr = document.getElementById("intent-header");
      if (hdr) hdr.classList.add("glass-intent");
      positionIntentHeaderAboveMain?.();
      trackIntentHeaderForTransition?.();
    };
    let headerLabel = "";
    if (isDestinationStep) headerLabel = "Where to?";
    else if (isDatesStep) headerLabel = "When?";
    else if (step.type === "options") headerLabel = step.label || "";
    else if (step.type === "confirm") headerLabel = "Confirm flight";
    else if (step.type === "payment") headerLabel = "Payment";
    if (headerLabel) showHeader(headerLabel);
    else hideIntentHeader?.();
    let html = "";
    if (step.type === "destination") {
      const dest = String(flow.data.destination || "").trim();
      html = renderFlightRouteStep({
        mode: "destination",
        routeRowHtml: buildRouteRowHtml(
          flow.data.origin || "SFO",
          dest ? flow.cityToAirport(dest) : "Destination",
          { originReady: true, destinationReady: !!dest }
        ),
      });
    } else if (step.type === "dates") {
      const destination = String(flow.data.destination || "").trim();
      html = renderFlightRouteStep({
        mode: "dates",
        routeRowHtml: buildRouteRowHtml(
          flow.data.origin,
          destination ? flow.cityToAirport(flow.data.destination || "") : "Where to?",
          { originReady: true, destinationReady: !!destination }
        ),
        depart: flow.data.depart || "",
        ret: flow.data.return || "",
      });
    } else if (step.type === "options") {
      html = `<div class="g-flight-content-pad">${optionRows(step.options || [])}</div>`;
    } else if (step.type === "thinking") {
      addChatBubble("ai", "Searching flights...");
      html = renderCompactStatus({ type: "loading", label: "Searching flights...", dotsId: "g-thinking-dots" });
      flow.setThinkingTimer(setTimeout(() => { flow.setThinkingTimer(null); flow.nextStep(true); }, THINKING_HOLD_MS));
    } else if (step.type === "confirm") {
      html = `<div class="g-flight-content-pad">${buildConfirmRows()}</div>`;
    } else if (step.type === "payment") {
      html = `<div class="g-flight-content-pad">${buildPaymentRows()}</div>`;
    } else if (step.type === "done") {
      html = renderCompactStatus({ type: "success", label: "Trip booked", icon: "✅" });
    }

    if (step.type === "destination") {
      morphTo("pill", { icon: "", primary: "", secondary: "" });
    } else if (step.type === "dates") {
      morphTo("card-form", { icon: "", primary: "", secondary: "" }, DATE_SELECTION_STEP_GEO);
    } else if (step.type === "options") {
      morphTo("card-list", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-list", html));
    } else if (step.type === "confirm") {
      morphTo("card-form", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-form", html));
    } else if (step.type === "payment") {
      morphTo("card-form", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-form", html));
    } else if (step.type === "done") {
      morphTo("pill", { icon: "", primary: "", secondary: "" }, toastGeo("Trip booked"));
    } else if (step.shape === "magic") {
      morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });
    }
    if (html) setTimeout(() => showRich(html), 180);
    if (!skipGreet && step.aiGreet) addChatBubble("ai", step.aiGreet);
    if (step.type === "done") setTimeout(() => flow.resetToHome(), 2800);
  }

  return { THINKING_HOLD_MS, DATE_SELECTION_STEP_GEO, optionRows, buildConfirmRows, buildPaymentRows, renderStep };
}
