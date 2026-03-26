import { composeScreen, renderScreenMarkup } from "../shared/screen-composer.js";
import { applyFlowChromeVisibility, measureSuccessToastGeometry } from "../shared/flow-toast.js";

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
  const MONTHS = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const THINKING_HOLD_MS = 3000;
  const TOP = 10;
  const BOTTOM = 10;
  const MIN_H = 100;
  const MAX_H = 400;
  const DATE_SELECTION_STEP_GEO = { ...SHAPES["card-form"], main: { ...SHAPES["card-form"].main, h: 180, ty: -90 } };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let measureLayer = null;
  let controlsTrack = null;

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
    const controlsLift = shape === "card" ? 78 : 0;
    const h = clamp(Math.round(contentHeightPx(html) + TOP + BOTTOM), MIN_H, MAX_H);
    return { ...base, main: { ...base.main, h, ty: -(h / 2) - controlsLift } };
  }

  function toastGeo(labelText = "Trip booked") {
    return measureSuccessToastGeometry({
      richRoot: document.getElementById("c-rich"),
      pillShape: SHAPES.pill || SHAPES.card,
      fallbackLabel: labelText,
      clamp,
    });
  }

  function formatDisplayDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^[A-Z][a-z]{2},\s+[A-Z][a-z]{2}\s+\d{1,2}$/.test(raw)) return raw;
    const match = raw.match(/\b(?:[A-Z][a-z]{2},\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b[\s,]+(\d{1,2})\b/i);
    if (!match) return raw;
    const monthIndex = MONTHS[match[1].slice(0, 3).toLowerCase()];
    const day = Number(match[2]);
    if (!Number.isInteger(monthIndex) || !Number.isFinite(day)) return raw;
    const now = new Date();
    let year = now.getFullYear();
    let date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) return raw;
    if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      year += 1;
      date = new Date(year, monthIndex, day);
    }
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${weekday}, ${month} ${date.getDate()}`;
  }

  function optionRows(options) {
    const flow = getFlow();
    return {
      selectedIndex: flow.focused,
      rowDataAttr: "data-flight-opt",
      items: options.map((opt) => ({
        avatar: opt.avatar || "",
        avatarKind: opt.avatarKind || "",
        icon: opt.avatar ? "" : (opt.icon || "✈️"),
        title: opt.name || "",
        subtitle: String(opt.sub || "").replace(/\s*·\s*\$\d[\d,]*/g, "").trim(),
        detail: ((String(opt.sub || "").match(/\$\d[\d,]*/) || [""])[0]) || "",
      })),
    };
  }

  function recommendationReason(option) {
    const text = String(option?.sub || "").toLowerCase();
    if (/\$\d/.test(text)) {
      if (text.includes("$631")) return "Best price for this trip.";
      if (text.includes("non-stop")) return "Fastest nonstop option.";
    }
    return "Good balance of time and price.";
  }

  function buildRecommendationAlternatives() {
    const options = getFlow().currentFlightOptions?.() || [];
    const cheapest = options.find((opt) => String(opt.sub || "").includes("$631"));
    const nonstop = options.find((opt) => String(opt.sub || "").toLowerCase().includes("non-stop") && opt !== cheapest);
    return [cheapest, nonstop].filter(Boolean);
  }

  function buildRecommendationCard() {
    const flow = getFlow();
    const option = flow.currentRecommendedFlight?.();
    return {
      avatar: option?.avatar || "",
      initials: option?.avatar ? "" : (option?.icon || "✈️"),
      title: option?.name || "Recommended flight",
      subtitle: option?.sub || "",
      detail: recommendationReason(option),
    };
  }

  function buildConfirmRows() {
    const flow = getFlow();
    const selected = flow.selectedFlightOption || flow.currentRecommendedFlight?.() || null;
    const departDate = formatDisplayDate(flow.data.depart) || "—";
    const returnDate = formatDisplayDate(flow.data.return) || "—";
    const fromCode = flow.data.origin || "SFO";
    const toCode = flow.cityToAirport(flow.data.destination || "");
    const priceMatch = String(selected?.sub || "").match(/\$\d[\d,]*/);
    const price = selected?.price || priceMatch?.[0] || "$395";
    const outboundRange = selected?.outbound ? `${selected.outbound.departTime} - ${selected.outbound.arriveTime}` : (flow.data.flight || "7:10 AM - 10:30 AM");
    const returnRange = selected?.inbound ? `${selected.inbound.departTime} - ${selected.inbound.arriveTime}` : (flow.data.returnFlight || "2:10 PM - 11:30 PM");
    return {
      title: `${fromCode} → ${toCode}`,
      subtitle: `${departDate} - ${returnDate} · ${price}`,
      detail: `${flow.data.paymentMethod || flow.defaultPaymentMethod || "Apple Pay ···· 9421"}`,
      expandable: true,
      expanded: !!flow.showConfirmDetails,
      sections: [
        {
          avatar: selected?.avatar || "",
          avatarKind: selected?.avatarKind || "logo",
          eyebrow: `Departing flight • ${departDate}`,
          title: outboundRange,
          subtitle: `${fromCode} - ${toCode}`,
        },
        {
          avatar: selected?.avatar || "",
          avatarKind: selected?.avatarKind || "logo",
          eyebrow: `Returning flight • ${returnDate}`,
          title: returnRange,
          subtitle: `${toCode} - ${fromCode}`,
        },
      ],
      footerLabel: "Total",
      footerValue: price,
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
            depart: formatDisplayDate(flow.data.depart) || "",
            ret: formatDisplayDate(flow.data.return) || "",
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
    if (step.type === "payment") {
      return {
        intentHeader: "Payment",
        layout: ["selection_list"],
        wrapBody: true,
        bodyClass: "g-flight-content-pad",
        props: {
          selection_list: optionRows(step.options || []),
        },
      };
    }
    if (step.type === "recommendation") {
      if (flow.recommendationMode === "alternatives") {
        return {
          intentHeader: "Alternatives",
          layout: ["selection_list"],
          wrapBody: true,
          bodyClass: "g-flight-content-pad",
          props: {
            selection_list: optionRows(buildRecommendationAlternatives()),
          },
        };
      }
      return {
        intentHeader: "Recommended flight",
        layout: ["info_card"],
        wrapBody: true,
        bodyClass: "g-flight-content-pad",
        props: {
          info_card: buildRecommendationCard(),
        },
        actions: [
          { id: "confirm", emoji: "✅" },
          { id: "alternatives", emoji: "🔄" },
          { id: "cancel", emoji: "❌" },
        ],
        actionSelectedIndex: flow.focused,
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
        actions: [
          { id: "book", emoji: "✅" },
          { id: "cancel", emoji: "❌" },
        ],
        actionSelectedIndex: flow.focused,
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
    } else if (step.type === "options" || step.type === "payment") {
      morphTo("card-list", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-list", html));
    } else if (step.type === "recommendation" && flow.recommendationMode === "alternatives") {
      morphTo("card-list", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-list", html));
    } else if (step.type === "recommendation") {
      morphTo("card", { icon: "", primary: "", secondary: "" }, dynamicGeo("card", html));
    } else if (step.type === "confirm") {
      morphTo("card", { icon: "", primary: "", secondary: "" }, dynamicGeo("card", html));
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
          controlsRoot: document.getElementById("glass-controls-layer"),
          setIntentHeader,
          hideIntentHeader,
          positionIntentHeaderAboveMain,
          trackIntentHeaderForTransition,
          spec: screenSpec,
        });
        richRoot.classList.add("visible");
        richRoot.classList.toggle("glass-sent", step.type === "done");
        richRoot.style.transform = step.type === "done" ? "translateY(-18px)" : "";
        applyFlowChromeVisibility({
          C: getFlow()?.C,
          active: true,
          richSent: step.type === "done",
        });
        requestAnimationFrame(() => requestAnimationFrame(() => { richRoot.style.opacity = "1"; }));
        const controlsRoot = document.getElementById("glass-controls-layer");
        const controls = controlsRoot?.querySelector(".g-glass-controls");
        if (controls) {
          const stage = document.getElementById("stage");
          const main = document.getElementById("drop-main");
          const positionControls = () => {
            if (!stage || !main || !controls || !controlsRoot?.classList.contains("visible")) return;
            const stageRect = stage.getBoundingClientRect();
            const mainRect = main.getBoundingClientRect();
            const controlsRect = controls.getBoundingClientRect();
            controls.style.left = `${Math.round((mainRect.left + mainRect.width / 2) - stageRect.left)}px`;
            controls.style.top = `${Math.round(Math.min((mainRect.bottom - stageRect.top) + 14, stageRect.height - controlsRect.height - 8))}px`;
          };
          positionControls();
          if (controlsTrack) cancelAnimationFrame(controlsTrack);
          const end = performance.now() + 600;
          const tick = () => {
            positionControls();
            if (performance.now() < end) controlsTrack = requestAnimationFrame(tick);
            else controlsTrack = null;
          };
          controlsTrack = requestAnimationFrame(tick);
        }
        if (step.type === "done") {
          requestAnimationFrame(() => {
            morphTo("pill", { icon: "", primary: "", secondary: "", detail: "" }, toastGeo("Trip booked"));
            requestAnimationFrame(() => {
              applyFlowChromeVisibility({
                C: getFlow()?.C,
                active: true,
                richSent: true,
              });
            });
          });
        }
        if (step.type === "confirm") {
          const toggle = richRoot.querySelector(".g-info-chevron");
          if (toggle) {
            toggle.onclick = () => {
              const flowState = getFlow();
              flowState.showConfirmDetails = !flowState.showConfirmDetails;
              renderStep(true);
            };
          }
        }
      }, 180);
    } else {
      hideIntentHeader?.();
    }
    if (!skipGreet && step.aiGreet) addChatBubble("ai", step.aiGreet);
    if (step.type === "done") setTimeout(() => flow.resetToHome(), 2800);
  }

  return { THINKING_HOLD_MS, DATE_SELECTION_STEP_GEO, optionRows, buildConfirmRows, buildRecommendationAlternatives, buildScreenSpec, renderStep };
}
