import { composeScreen, renderScreenMarkup } from "../shared/screen-composer.js";
import { applyFlowChromeVisibility, measureSuccessToastGeometry, ensureMeasureLayer } from "../shared/flow-toast.js";
import { normalizeFlightDateValue } from "./flight-ai.js";
import { clamp } from "../utils.js";

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
  let controlsTrack = null;
  let confirmHeaderTrack = null;

  function contentHeightPx(html) {
    const layer = ensureMeasureLayer("flight-measure-layer");
    if (!layer) return 180;
    layer.innerHTML = `<div data-flight-measure-body>${html}</div>`;
    const body = layer.querySelector("[data-flight-measure-body]");
    const raw = body ? Math.ceil(Math.max(body.getBoundingClientRect().height || 0, body.offsetHeight || 0, body.scrollHeight || 0)) : 0;
    return raw > 0 ? clamp(raw, 60, MAX_H - TOP - BOTTOM) : 180;
  }

  function dynamicGeo(shape, html, options = {}) {
    const base = SHAPES[shape] || SHAPES.card;
    const controlsLift = options.controlsLift ?? (shape === "card" ? 78 : 0);
    const maxHeight = options.maxHeight ?? MAX_H;
    const h = clamp(Math.round(contentHeightPx(html) + TOP + BOTTOM), MIN_H, maxHeight);
    return { ...base, main: { ...base.main, h, ty: -(h / 2) - controlsLift } };
  }

  function confirmSafeMaxHeight() {
    const stage = document.getElementById("stage");
    const stageHeight = stage?.clientHeight || 420;
    return Math.max(180, stageHeight - 64);
  }

  function positionConfirmIntentHeader() {
    const hdr = document.getElementById("intent-header");
    const stage = document.getElementById("stage");
    const shell = document.querySelector("[data-confirm-shell]");
    if (!hdr || !stage || !shell) return;
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const hdrRect = hdr.getBoundingClientRect();
    const headerH = Math.ceil(hdrRect.height || hdr.offsetHeight || 0);
    const headerW = Math.ceil(hdrRect.width || hdr.offsetWidth || 0);
    const centerX = Math.round((shellRect.left + (shellRect.width / 2)) - stageRect.left);
    const top = Math.max(8, Math.round(shellRect.top - stageRect.top - headerH - 12));
    hdr.style.left = `${Math.round(centerX - (headerW / 2))}px`;
    hdr.style.top = `${top}px`;
  }

  function trackConfirmIntentHeader(ms = 360) {
    if (confirmHeaderTrack) cancelAnimationFrame(confirmHeaderTrack);
    const end = performance.now() + ms;
    const tick = () => {
      positionConfirmIntentHeader();
      if (performance.now() < end) confirmHeaderTrack = requestAnimationFrame(tick);
      else confirmHeaderTrack = null;
    };
    confirmHeaderTrack = requestAnimationFrame(tick);
  }

  function applyConfirmExpandMetrics(richRoot) {
    const shell = richRoot?.querySelector?.("[data-confirm-shell]");
    const summary = richRoot?.querySelector?.(".g-info-summary-head");
    const region = richRoot?.querySelector?.("[data-confirm-scroll]");
    if (!shell || !summary || !region) return;
    const safeCardHeight = confirmSafeMaxHeight();
    const summaryHeight = Math.ceil(summary.getBoundingClientRect().height || summary.offsetHeight || 0);
    const available = Math.max(96, safeCardHeight - summaryHeight - 36);
    shell.style.setProperty("--g-info-expand-max-h", `${available}px`);
  }

  function toastGeo(labelText = "Trip booked") {
    return measureSuccessToastGeometry({
      richRoot: document.getElementById("c-rich"),
      pillShape: SHAPES.pill || SHAPES.card,
      fallbackLabel: labelText,
    });
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
    const departDate = normalizeFlightDateValue(flow.data.depart) || "—";
    const returnDate = normalizeFlightDateValue(flow.data.return) || "—";
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
      focused: flow.showConfirmDetails || flow.focused === 2,
      scrollableExpand: true,
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
            depart: normalizeFlightDateValue(flow.data.depart) || "",
            ret: normalizeFlightDateValue(flow.data.return) || "",
          },
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
        actions: flow.showConfirmDetails ? [] : [
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
    const shouldRenderInsideShell = step.shape !== "magic";
    const html = shouldRenderInsideShell ? renderScreenMarkup(screenSpec) : "";
    if (step.type === "thinking") {
      addChatBubble("ai", "Searching flights...");
      flow.setThinkingTimer(setTimeout(() => { flow.setThinkingTimer(null); flow.nextStep(true); }, THINKING_HOLD_MS));
    }

    if (step.type === "destination") {
      morphTo("pill", { icon: "", primary: "", secondary: "" });
    } else if (step.type === "dates") {
      morphTo("card-form", { icon: "", primary: "", secondary: "" }, DATE_SELECTION_STEP_GEO);
    } else if (step.type === "payment") {
      morphTo("card-list", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-list", html));
    } else if (step.type === "recommendation" && flow.recommendationMode === "alternatives") {
      morphTo("card-list", { icon: "", primary: "", secondary: "" }, dynamicGeo("card-list", html));
    } else if (step.type === "recommendation") {
      morphTo("card", { icon: "", primary: "", secondary: "" }, dynamicGeo("card", html));
    } else if (step.type === "confirm") {
      morphTo("card", { icon: "", primary: "", secondary: "" }, dynamicGeo("card", html, { controlsLift: flow.showConfirmDetails ? 0 : 78, maxHeight: confirmSafeMaxHeight() }));
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
        if (step.type === "confirm") {
          applyConfirmExpandMetrics(richRoot);
          positionConfirmIntentHeader();
          trackConfirmIntentHeader();
          syncConfirmFocusUi(flow.focused);
        }
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
              flowState.focused = 2;
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

  function syncConfirmFocusUi(focused) {
    const shell = document.querySelector("[data-confirm-shell]");
    if (shell) shell.classList.toggle("focused", getFlow().showConfirmDetails || focused === 2);
    document.querySelectorAll("#glass-controls-layer .g-action-btn").forEach((btn, idx) => btn.classList.toggle("selected", idx === focused));
  }

  function getConfirmScrollContainer() {
    return document.querySelector("[data-confirm-scroll]");
  }

  function scrollConfirmDetails(delta) {
    const node = getConfirmScrollContainer();
    if (!node) return;
    node.scrollTop += delta;
  }

  function resetConfirmScroll() {
    const node = getConfirmScrollContainer();
    if (node) node.scrollTop = 0;
  }

  return { THINKING_HOLD_MS, DATE_SELECTION_STEP_GEO, optionRows, buildConfirmRows, buildRecommendationAlternatives, buildScreenSpec, renderStep, syncConfirmFocusUi, getConfirmScrollContainer, scrollConfirmDetails, resetConfirmScroll };
}
