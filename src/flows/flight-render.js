import { composeScreen, renderScreenMarkup } from "../shared/screen-composer.js";

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
    const textEl = document.getElementById("c-rich")?.querySelector("[data-glass-sent]");
    let w = 200;
    let h = 52;
    if (textEl) {
      const rect = textEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        w = clamp(Math.round(rect.width + 48), 140, 360);
        h = clamp(Math.round(rect.height + 32), 52, 140);
      } else {
        const text = String(labelText || "").trim();
        w = clamp(Math.round(text.length * 11 + 96), 160, 360);
      }
    } else {
      const text = String(labelText || "").trim();
      w = clamp(Math.round(text.length * 11 + 96), 160, 360);
    }
    return { ...base, main: { ...base.main, w, h, tx: -(w / 2), ty: -(h / 2) - 18 } };
  }

  function optionRows(options) {
    const flow = getFlow();
    return {
      selectedIndex: flow.focused,
      rowDataAttr: "data-flight-opt",
      items: options.map((opt) => ({
        icon: opt.icon || "✈️",
        title: opt.name || "",
        subtitle: String(opt.sub || "").replace(/\s*·\s*\$\d[\d,]*/g, "").trim(),
        detail: ((String(opt.sub || "").match(/\$\d[\d,]*/) || [""])[0]) || "",
      })),
    };
  }

  function buildConfirmRows() {
    const flow = getFlow();
    const departDate = flow.data.depart || "—";
    const returnDate = flow.data.return || "—";
    const fromCode = flow.data.origin || "SFO";
    const toCode = flow.cityToAirport(flow.data.destination || "");
    const outTime = flow.data.flight || "7:10 AM - 10:30 AM";
    const backTime = flow.data.returnFlight || "2:10 PM - 11:30 PM";
    return {
      sections: [
        { eyebrow: `Departing flight • ${departDate}`, title: outTime, subtitle: `${fromCode} - ${toCode}` },
        { eyebrow: `Returning flight • ${returnDate}`, title: backTime, subtitle: `${toCode} - ${fromCode}` },
      ],
      footerLabel: "Total",
      footerValue: "$395",
    };
  }

  function buildPaymentRows() {
    const flow = getFlow();
    const options = flow.step().options || [];
    return {
      selectedIndex: flow.focused,
      rowDataAttr: "data-flight-opt",
      items: options.map((opt) => ({
        icon: opt.icon || "💳",
        title: opt.name || "",
        subtitle: opt.sub || "",
        detail: "",
      })),
    };
  }

  function buildScreenSpec(step) {
    const flow = getFlow();
    if (step.type === "destination") {
      const dest = String(flow.data.destination || "").trim();
      return {
        intentHeader: "Where to?",
        layout: ["flight_route_step"],
        props: {
          flight_route_step: {
            mode: "destination",
            routeRowHtml: buildRouteRowHtml(
              flow.data.origin || "SFO",
              dest ? flow.cityToAirport(dest) : "Destination",
              { originReady: true, destinationReady: !!dest }
            ),
          },
        },
      };
    }
    if (step.type === "dates") {
      const destination = String(flow.data.destination || "").trim();
      return {
        intentHeader: "When?",
        layout: ["flight_route_step"],
        props: {
          flight_route_step: {
            mode: "dates",
            routeRowHtml: buildRouteRowHtml(
              flow.data.origin,
              destination ? flow.cityToAirport(flow.data.destination || "") : "Where to?",
              { originReady: true, destinationReady: !!destination }
            ),
            depart: flow.data.depart || "",
            ret: flow.data.return || "",
          },
        },
      };
    }
    if (step.type === "options") {
      return {
        intentHeader: step.label || "",
        layout: ["selection_list"],
        wrapBody: true,
        bodyClass: "g-flight-content-pad",
        props: {
          selection_list: optionRows(step.options || []),
        },
      };
    }
    if (step.type === "thinking") {
      return {
        layout: ["compact_status"],
        props: {
          compact_status: { type: "loading", label: "Searching flights...", dotsId: "g-thinking-dots" },
        },
      };
    }
    if (step.type === "confirm") {
      return {
        intentHeader: "Confirm flight",
        layout: ["info_card"],
        wrapBody: true,
        bodyClass: "g-flight-content-pad",
        props: {
          info_card: buildConfirmRows(),
        },
      };
    }
    if (step.type === "payment") {
      return {
        intentHeader: "Payment",
        layout: ["selection_list"],
        wrapBody: true,
        bodyClass: "g-flight-content-pad",
        props: {
          selection_list: buildPaymentRows(),
        },
      };
    }
    if (step.type === "done") {
      return {
        layout: ["compact_status"],
        props: {
          compact_status: { type: "success", label: "Trip booked" },
        },
      };
    }
    return { layout: [] };
  }

  function renderStep(skipGreet = false) {
    const flow = getFlow();
    const step = flow.step();
    const screenSpec = buildScreenSpec(step);
    const stageEl = document.getElementById("stage");
    const isDestinationStep = step.type === "destination";
    const isDatesStep = step.type === "dates";
    if (stageEl) {
      stageEl.classList.toggle("flight-destination-active", isDestinationStep);
      stageEl.classList.toggle("flight-voice-viz", isDestinationStep || isDatesStep);
    }
    stopSiriOrb();
    hideRich();
    document.body.classList.add("glass-flow-active");
    flow.C.thumb.style.opacity = "0";
    if (isDestinationStep || isDatesStep) startCommandListening?.();
    const html = renderScreenMarkup(screenSpec);
    if (step.type === "thinking") {
      addChatBubble("ai", "Searching flights...");
      flow.setThinkingTimer(setTimeout(() => { flow.setThinkingTimer(null); flow.nextStep(true); }, THINKING_HOLD_MS));
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
    if (html) {
      setTimeout(() => {
        const richRoot = document.getElementById("c-rich");
        if (!richRoot) return;
        richRoot.style.opacity = "0";
        composeScreen({
          documentRef: document,
          richRoot,
          setIntentHeader,
          hideIntentHeader,
          positionIntentHeaderAboveMain,
          trackIntentHeaderForTransition,
          spec: screenSpec,
        });
        richRoot.classList.add("visible");
        requestAnimationFrame(() => requestAnimationFrame(() => { richRoot.style.opacity = "1"; }));
        if (step.type === "done") {
          requestAnimationFrame(() => {
            morphTo("pill", { icon: "", primary: "", secondary: "", detail: "" }, toastGeo("Trip booked"));
          });
        }
      }, 180);
    } else {
      hideIntentHeader?.();
    }
    if (!skipGreet && step.aiGreet) addChatBubble("ai", step.aiGreet);
    if (step.type === "done") setTimeout(() => flow.resetToHome(), 2800);
  }

  return { THINKING_HOLD_MS, DATE_SELECTION_STEP_GEO, optionRows, buildConfirmRows, buildPaymentRows, buildScreenSpec, renderStep };
}
