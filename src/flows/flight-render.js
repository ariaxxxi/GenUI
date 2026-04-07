import { composeScreen, renderScreenMarkup } from "../shared/screen-composer.js";
import { applyFlowChromeVisibility, measureSuccessToastGeometry, ensureMeasureLayer } from "../shared/flow-toast.js";
import { normalizeFlightDateValue } from "./flight-ai.js";
import { layoutDisambiguationPillItems, renderDisambiguationPills } from "./ui-primitives.js";
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
  const DISAMBIGUATION_ENTER_MS = 800;
  const DISAMBIGUATION_EXIT_MS = 600;
  const DISAMBIGUATION_ORB_SCALE = 0.625;
  const TOP = 10;
  const BOTTOM = 10;
  const MIN_H = 100;
  const MAX_H = 400;
  const DATE_SELECTION_STEP_GEO = { ...SHAPES["card-form"], main: { ...SHAPES["card-form"].main, h: 180, ty: -90 } };
  let controlsTrack = null;
  let confirmHeaderTrack = null;
  let recommendationHeaderTrack = null;
  let recommendationTimer = null;
  let recommendationPhase = "settled";
  let richStageToken = 0;
  let previousStepType = "";
  let previousRecommendationMenuOpen = false;
  let previousVisualState = {
    stepType: "",
    originCode: "",
    destinationCode: "",
    depart: "",
    ret: "",
  };

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

  function cancelRecommendationIntentHeaderTracking() {
    if (!recommendationHeaderTrack) return;
    cancelAnimationFrame(recommendationHeaderTrack);
    recommendationHeaderTrack = null;
  }

  function positionRecommendationIntentHeader() {
    const hdr = document.getElementById("intent-header");
    const stage = document.getElementById("stage");
    const firstPill = document.querySelector('#c-rich [data-flight-rec-opt="0"]');
    if (!hdr || !stage || !firstPill) {
      positionIntentHeaderAboveMain?.();
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const pillRect = firstPill.getBoundingClientRect();
    const hdrRect = hdr.getBoundingClientRect();
    const headerH = Math.ceil(hdrRect.height || hdr.offsetHeight || 0);
    const headerW = Math.ceil(hdrRect.width || hdr.offsetWidth || 0);
    const centerX = Math.round((pillRect.left + (pillRect.width / 2)) - stageRect.left);
    const top = Math.max(8, Math.round(pillRect.top - stageRect.top - headerH - 14));
    hdr.style.left = `${Math.round(centerX - (headerW / 2))}px`;
    hdr.style.top = `${top}px`;
  }

  function trackRecommendationIntentHeader(ms = 420) {
    cancelRecommendationIntentHeaderTracking();
    const end = performance.now() + Math.max(180, ms);
    const tick = () => {
      const hdr = document.getElementById("intent-header");
      if (!hdr || !hdr.classList.contains("glass-intent") || !hdr.classList.contains("visible")) return;
      positionRecommendationIntentHeader();
      if (performance.now() < end) recommendationHeaderTrack = requestAnimationFrame(tick);
      else recommendationHeaderTrack = null;
    };
    recommendationHeaderTrack = requestAnimationFrame(tick);
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

  function cancelRecommendationTimer() {
    if (!recommendationTimer) return;
    clearTimeout(recommendationTimer);
    recommendationTimer = null;
  }

  function recommendationDisambiguationGeo() {
    const base = SHAPES.listening?.main || SHAPES.circle?.main || {};
    const baseW = Number(base.w) || 80;
    const baseH = Number(base.h) || 80;
    const nextW = Math.round(baseW * DISAMBIGUATION_ORB_SCALE);
    const nextH = Math.round(baseH * DISAMBIGUATION_ORB_SCALE);
    const baseTx = Number(base.tx) || -(baseW / 2);
    const baseTy = Number(base.ty) || -(baseH / 2);
    return {
      ...SHAPES.listening,
      main: {
        ...(SHAPES.listening?.main || {}),
        w: nextW,
        h: nextH,
        br: `${Math.round(nextW / 2)}px`,
        tx: Math.round(baseTx + ((baseW - nextW) / 2)),
        ty: Math.round(baseTy + ((baseH - nextH) / 2)),
        op: 1,
      },
      left: { ...(SHAPES.listening?.left || {}), op: 0 },
      right: { ...(SHAPES.listening?.right || {}), op: 0 },
    };
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

  function buildRecommendationVisualOptions() {
    const flow = getFlow();
    return flow.recommendationOptionsForUi?.() || [];
  }

  function buildRecommendationAlternatives() {
    return buildRecommendationVisualOptions();
  }

  function buildRecommendationDisambiguationItems(open = false) {
    const flow = getFlow();
    const options = flow.recommendationOptionsForUi?.() || [];
    const visibleOptions = open ? options : options.slice(0, 1);
    const selectedIndex = open ? flow.focused : 0;
    return layoutDisambiguationPillItems(
      visibleOptions.map((option) => ({
        avatar: option?.avatar || "",
        initials: option?.avatar ? "" : (option?.icon || "✈️"),
        name: option?.name || "",
        subtitle: String(option?.sub || "").replace(/Non-stop/gi, "Nonstop").trim(),
        mediaClass: "g-disambiguation-pill-media g-disambiguation-pill-media--large",
      })),
      selectedIndex,
      open ? "stack" : "fan",
      open ? { bottomY: -82, gap: 14, itemHeight: 86 } : undefined,
    );
  }

  function clearFlightRichStage(immediate = false) {
    const richRoot = document.getElementById("c-rich");
    if (!richRoot) return;
    cancelRecommendationIntentHeaderTracking();
    richRoot.style.opacity = "0";
    richRoot.classList.remove("glass-recommendation-open");
    richRoot.classList.remove("glass-disambiguation");
    if (immediate) {
      richRoot.classList.remove("visible", "glass-sent");
      richRoot.innerHTML = "";
    }
  }

  function syncRecommendationOrbChrome(step) {
    const dropMain = document.getElementById("drop-main");
    if (!dropMain) return;
    const showRecommendationOrb = step?.type === "recommendation" && getFlow().recommendationMode === "recommend";
    dropMain.classList.toggle("confirm-await-orb", false);
    dropMain.classList.toggle("disambiguation-surface", showRecommendationOrb);
    dropMain.classList.toggle("listening-orb", showRecommendationOrb);
    dropMain.classList.toggle("home-glow", showRecommendationOrb);
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
      const destinationCode = dest ? flow.cityToAirport(dest) : "Destination";
      const animateOrigin = previousVisualState.stepType !== "destination" || previousVisualState.originCode !== (flow.data.origin || "SFO");
      const animateDestination = previousVisualState.stepType !== "destination" || previousVisualState.destinationCode !== destinationCode;
      return {
        intentHeader: "Where to?",
        layout: ["flight_route_step"],
        props: {
          flight_route_step: {
            mode: "destination",
            routeRowHtml: buildRouteRowHtml(
              flow.data.origin || "SFO",
              destinationCode,
              {
                originReady: true,
                destinationReady: !!dest,
                animateOrigin,
                animateDestination: !!dest && animateDestination,
              }
            ),
          },
        },
      };
    }
    if (step.type === "dates") {
      const destination = String(flow.data.destination || "").trim();
      const destinationCode = destination ? flow.cityToAirport(flow.data.destination || "") : "Where to?";
      const depart = normalizeFlightDateValue(flow.data.depart) || "";
      const ret = normalizeFlightDateValue(flow.data.return) || "";
      const animateRouteOrigin = previousVisualState.stepType !== "dates" || previousVisualState.originCode !== (flow.data.origin || "SFO");
      const animateRouteDestination = previousVisualState.stepType !== "dates" || previousVisualState.destinationCode !== destinationCode;
      const animateDepart = previousVisualState.stepType !== "dates" || previousVisualState.depart !== depart;
      const animateReturn = previousVisualState.stepType !== "dates" || previousVisualState.ret !== ret;
      return {
        intentHeader: "When?",
        layout: ["flight_route_step"],
        props: {
          flight_route_step: {
            mode: "dates",
            routeRowHtml: buildRouteRowHtml(
              flow.data.origin,
              destinationCode,
              {
                originReady: true,
                destinationReady: !!destination,
                animateOrigin: animateRouteOrigin,
                animateDestination: !!destination && animateRouteDestination,
              }
            ),
            depart,
            ret,
            animateDepart: !!depart && animateDepart,
            animateReturn: !!ret && animateReturn,
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
            selection_list: optionRows(buildRecommendationVisualOptions()),
          },
        };
      }
      return {
        intentHeader: flow.recommendationMenuOpen ? "" : "Recommended flight",
        layout: [],
        props: {},
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
    const stageToken = ++richStageToken;
    const enteringFromThinking = previousStepType === "thinking" && step.type !== "thinking";
    const enteringRecommendation = step.type === "recommendation" && previousStepType !== "recommendation";
    const openingRecommendationMenu = step.type === "recommendation" && !!flow.recommendationMenuOpen && !previousRecommendationMenuOpen;
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
    const customRecommendationHtml = step.type === "recommendation" && flow.recommendationMode === "recommend"
      ? renderDisambiguationPills({
        phase: openingRecommendationMenu || enteringRecommendation ? recommendationPhase : "settled",
        selectedIndex: openingRecommendationMenu ? flow.focused : 0,
        items: buildRecommendationDisambiguationItems(!!flow.recommendationMenuOpen),
        rowDataAttr: "data-flight-rec-opt",
        clusterClass: "g-disambiguation-pills g-flight-recommendation-pills",
      })
      : "";
    const html = customRecommendationHtml || (shouldRenderInsideShell ? renderScreenMarkup(screenSpec) : "");
    if (step.type === "recommendation" && flow.recommendationMode === "recommend") {
      if (openingRecommendationMenu || enteringRecommendation) {
        recommendationPhase = "entering";
        cancelRecommendationTimer();
        recommendationTimer = setTimeout(() => {
          recommendationTimer = null;
          if (getFlow().step().type !== "recommendation" || !getFlow().active) return;
          recommendationPhase = "settled";
          renderStep(true);
        }, DISAMBIGUATION_ENTER_MS);
      } else {
        recommendationPhase = "settled";
      }
    } else {
      recommendationPhase = "settled";
      cancelRecommendationTimer();
    }
    if (step.type === "thinking") {
      clearFlightRichStage(false);
      setTimeout(() => {
        if (stageToken !== richStageToken) return;
        clearFlightRichStage(true);
      }, 200);
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
      morphTo("listening", { icon: "", primary: "", secondary: "", detail: "" }, recommendationDisambiguationGeo());
    } else if (step.type === "confirm") {
      morphTo("card", { icon: "", primary: "", secondary: "" }, dynamicGeo("card", html, { controlsLift: flow.showConfirmDetails ? 0 : 78, maxHeight: confirmSafeMaxHeight() }));
    } else if (step.type === "done") {
      morphTo("pill", { icon: "", primary: "", secondary: "" }, toastGeo("Trip booked"));
    } else if (step.shape === "magic") {
      morphTo("magic", { icon: "", primary: "", secondary: "", detail: "" });
    }
    syncRecommendationOrbChrome(step);
    if (html) {
      const richRevealDelayMs = enteringFromThinking ? 300 : (previousStepType === step.type ? 0 : 180);
      setTimeout(() => {
        if (stageToken !== richStageToken) return;
        const richRoot = document.getElementById("c-rich");
        if (!richRoot) return;
        richRoot.style.opacity = "0";
        richRoot.classList.toggle("glass-recommendation-open", step.type === "recommendation" && !!flow.recommendationMenuOpen);
        richRoot.classList.toggle("glass-disambiguation", step.type === "recommendation" && flow.recommendationMode === "recommend");
        if (customRecommendationHtml) {
          richRoot.innerHTML = customRecommendationHtml;
          richRoot.classList.add("visible");
          richRoot.classList.remove("glass-sent");
          if (screenSpec.intentHeader) {
            setIntentHeader?.(screenSpec.intentHeader, null);
            document.getElementById("intent-header")?.classList.add("glass-intent");
            if (step.type === "recommendation" && !flow.recommendationMenuOpen) {
              positionRecommendationIntentHeader();
              trackRecommendationIntentHeader(DISAMBIGUATION_ENTER_MS);
            } else {
              positionIntentHeaderAboveMain?.();
              trackIntentHeaderForTransition?.();
            }
          } else {
            hideIntentHeader?.();
            const headerEl = document.getElementById("intent-header");
            if (headerEl) headerEl.textContent = "";
          }
          const controlsRoot = document.getElementById("glass-controls-layer");
          if (controlsRoot) {
            controlsRoot.innerHTML = "";
            controlsRoot.classList.remove("visible");
          }
        } else {
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
        }
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
      }, richRevealDelayMs);
    } else {
      hideIntentHeader?.();
    }
    if (!skipGreet && step.aiGreet) addChatBubble("ai", step.aiGreet);
    if (step.type === "done") setTimeout(() => flow.resetToHome(), 2800);
    previousVisualState = {
      stepType: step.type,
      originCode: flow.data.origin || "SFO",
      destinationCode: flow.data.destination ? flow.cityToAirport(flow.data.destination || "") : (step.type === "destination" ? "Destination" : "Where to?"),
      depart: normalizeFlightDateValue(flow.data.depart) || "",
      ret: normalizeFlightDateValue(flow.data.return) || "",
    };
    previousRecommendationMenuOpen = step.type === "recommendation" && !!flow.recommendationMenuOpen;
    previousStepType = step.type;
  }

  function syncConfirmFocusUi(focused) {
    const shell = document.querySelector("[data-confirm-shell]");
    if (shell) shell.classList.toggle("focused", getFlow().showConfirmDetails || focused === 2);
    document.querySelectorAll("#glass-controls-layer .g-action-btn").forEach((btn, idx) => btn.classList.toggle("selected", idx === focused));
  }

  function updateRecommendationSelectionUi(focused) {
    document.querySelectorAll("#c-rich [data-flight-rec-opt]").forEach((row, idx) => row.classList.toggle("selected", idx === focused));
  }

  function updateRecommendationMenuUi(open = false, focused = getFlow().focused) {
    const richRoot = document.getElementById("c-rich");
    if (!richRoot) return false;
    richRoot?.classList.toggle("glass-recommendation-open", !!open);
    richRoot?.classList.toggle("glass-disambiguation", !!open);
    updateRecommendationSelectionUi(focused);
    return true;
  }

  function animateRecommendationExit(selectedIndex = 0) {
    cancelRecommendationTimer();
    recommendationPhase = "settled";
    const richRoot = document.getElementById("c-rich");
    if (!richRoot) return false;
    const cluster = richRoot.querySelector(".g-disambiguation-pills:not(.exiting-to-compose)");
    if (!cluster) return false;
    updateRecommendationSelectionUi(selectedIndex);
    cluster.classList.remove("entering", "settled");
    cluster.classList.add("exiting-to-compose");
    richRoot.classList.add("visible");
    richRoot.classList.add("glass-disambiguation");
    richRoot.classList.add("glass-recommendation-open");
    return true;
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

  return { THINKING_HOLD_MS, DATE_SELECTION_STEP_GEO, DISAMBIGUATION_EXIT_MS, optionRows, buildConfirmRows, buildRecommendationAlternatives, buildRecommendationVisualOptions, buildScreenSpec, renderStep, syncConfirmFocusUi, updateRecommendationSelectionUi, updateRecommendationMenuUi, animateRecommendationExit, getConfirmScrollContainer, scrollConfirmDetails, resetConfirmScroll };
}
