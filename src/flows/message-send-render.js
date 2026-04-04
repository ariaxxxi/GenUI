import { applyFlowChromeVisibility } from "../shared/flow-toast.js";
import { createMessageSendRenderContent } from "./message-send-render-content.js";
import { createMessageSendRenderLayout } from "./message-send-render-layout.js";

export function createMessageSendRender({
  document,
  SHAPES,
  C,
  GS,
  getFlow,
  morphTo,
  getCurrentMainGeometry,
  hideIntentHeader,
  trackIntentHeaderForTransition,
  renderControls,
  updateOrbLabel,
  setSimInputState,
}) {
  const EMPTY_STAGE_CONTENT = { icon: "", primary: "", secondary: "", detail: "" };
  const EMPTY_SCREEN_SPEC = { actions: [], actionSelectedIndex: 0 };
  const layout = createMessageSendRenderLayout({ document, SHAPES, C, GS, getFlow });
  let measureRaf = null;
  let settleTimer = null;
  let disambiguationTimer = null;
  let renderToken = 0;
  let prevState = GS.IDLE;
  let prevComposeHasText = false;
  let prevSendTransitionActive = false;
  let manualComposeEntry = false;
  let disambiguationPhase = "settled";
  let composeRevealTimer = null;
  let composePlaceholderDelayActive = false;
  let confirmTransitionFrozenTextWidth = null;

  function measureConfirmTransitionTextWidthPx() {
    const liveText = C.rich.querySelector("[data-compose-field-text]");
    const liveTextWidth = Math.round(liveText?.getBoundingClientRect?.().width || 0);
    if (liveTextWidth > 0) return liveTextWidth;
    const liveField = C.rich.querySelector("[data-compose-field]");
    const liveFieldWidth = Math.round(liveField?.getBoundingClientRect?.().width || 0);
    if (liveFieldWidth > 28) return Math.max(0, liveFieldWidth - 28);
    const value = String(getFlow().msg || getFlow().composeText || "").trim();
    if (!value) return Math.max(0, layout.COMPOSE_FIELD_W - 28);
    const fieldWidth = layout.measureComposeFieldWidth(true);
    return Math.max(0, Math.round(fieldWidth - 28));
  }

  function confirmTransitionTextWidthPx() {
    return confirmTransitionFrozenTextWidth ?? measureConfirmTransitionTextWidthPx();
  }

  const content = createMessageSendRenderContent({
    C,
    GS,
    getFlow,
    getConfirmTransitionTextWidthPx: confirmTransitionTextWidthPx,
    isConfirmToSendTransition: layout.isConfirmToSendTransition,
  });

  function buildContent() {
    return content.buildContent({
      composePlaceholderDelayActive,
      disambiguationPhase,
      manualComposeEntry,
    });
  }

  function syncDropMainOrbClasses(shape) {
    const flow = getFlow();
    const dropMain = document.getElementById("drop-main");
    if (!dropMain) return;
    const confirmAwaitOrb = flow.active && (flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive));
    const showListeningOrb = flow.active && (shape === "listening" || confirmAwaitOrb);
    const showHomeGlow = flow.active && (shape === "listening" || shape === "magic" || confirmAwaitOrb);
    dropMain.classList.toggle("confirm-await-orb", confirmAwaitOrb);
    dropMain.classList.remove("sent-transition");
    dropMain.classList.toggle("listening-orb", showListeningOrb);
    dropMain.classList.toggle("home-glow", showHomeGlow);
  }

  function cancelMeasure() {
    if (measureRaf) cancelAnimationFrame(measureRaf);
    measureRaf = null;
  }

  function cancelSettle() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = null;
  }

  function cancelDisambiguationTimer() {
    if (disambiguationTimer) clearTimeout(disambiguationTimer);
    disambiguationTimer = null;
  }

  function syncDisambiguationPhaseUi() {
    const cluster = C.rich.querySelector(".g-disambiguation-pills:not(.exiting-to-compose)");
    if (!cluster) return false;
    cluster.classList.toggle("entering", disambiguationPhase === "entering");
    cluster.classList.toggle("settled", disambiguationPhase !== "entering");
    return true;
  }

  function cancelComposeRevealTimer() {
    if (composeRevealTimer) clearTimeout(composeRevealTimer);
    composeRevealTimer = null;
  }

  function render(shouldMorph = true) {
    const flow = getFlow();
    renderToken += 1;
    const token = renderToken;
    const sendTransitionActive = layout.isConfirmToSendTransition(flow);
    if (sendTransitionActive && !prevSendTransitionActive) confirmTransitionFrozenTextWidth = measureConfirmTransitionTextWidthPx();
    else if (!sendTransitionActive) confirmTransitionFrozenTextWidth = null;
    const shape = sendTransitionActive ? "magic" : layout.glassStateShape(flow.state);
    const confirmAwaitOrbActive = flow.active && (flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive));
    const shouldShowListeningOrb = flow.active && (shape === "listening" || confirmAwaitOrbActive);
    const shouldShowHomeGlow = flow.active && (shape === "listening" || shape === "magic" || confirmAwaitOrbActive);
    const screenSpec = EMPTY_SCREEN_SPEC;
    const dropMain = document.getElementById("drop-main");
    const composeHasText = (flow.state === GS.COMPOSE && !!String(flow.composeText || "").trim()) || (flow.state === GS.CONFIRM && !!String(flow.msg || "").trim());
    const composeVoiceVizActive = flow.state === GS.COMPOSE && !!String(flow.composeText || "").trim() && !flow.composeMenuOpen;
    const enteringDisambiguation = flow.state === GS.DISAMBIGUATE && prevState !== GS.DISAMBIGUATE;
    const enteringComposeFromDisambiguation = flow.state === GS.COMPOSE && prevState === GS.DISAMBIGUATE;
    const enteringComposeText = flow.state === GS.COMPOSE && composeHasText && !prevComposeHasText;
    composePlaceholderDelayActive = enteringComposeFromDisambiguation && !composeHasText;
    document.body.classList.toggle("glass-flow-active", flow.active);
    if (enteringDisambiguation) {
      disambiguationPhase = "entering";
      cancelDisambiguationTimer();
      disambiguationTimer = setTimeout(() => {
        disambiguationTimer = null;
        if (!getFlow().active || getFlow().state !== GS.DISAMBIGUATE) return;
        disambiguationPhase = "settled";
        syncDisambiguationPhaseUi();
      }, layout.DISAMBIGUATION_ENTER_MS);
    } else if (flow.state !== GS.DISAMBIGUATE) {
      disambiguationPhase = "settled";
      cancelDisambiguationTimer();
    }
    const preserveSentTransitionLayer = sendTransitionActive && prevSendTransitionActive;
    if (!preserveSentTransitionLayer) {
      const nextContent = buildContent();
      if (C.rich.innerHTML !== nextContent) C.rich.innerHTML = nextContent;
    }
    if (flow.state === GS.DISAMBIGUATE) syncDisambiguationPhaseUi();
    if (flow.sentToastEnterPending && flow.state === GS.SENT && !sendTransitionActive) flow.sentToastEnterPending = false;
    prevState = flow.state;
    prevComposeHasText = composeHasText;
    dropMain?.classList.toggle("disambiguation-surface", flow.active && flow.state === GS.DISAMBIGUATE);
    dropMain?.classList.toggle("compose-surface", flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM));
    dropMain?.classList.toggle("confirm-surface", flow.active && flow.state === GS.CONFIRM && !sendTransitionActive);
    dropMain?.classList.toggle("compose-text-active", flow.active && composeVoiceVizActive);
    dropMain?.classList.toggle("compose-chip-sizing", flow.active && flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive);
    dropMain?.classList.toggle("confirm-await-orb", confirmAwaitOrbActive);
    dropMain?.classList.toggle("listening-orb", shouldShowListeningOrb);
    dropMain?.classList.toggle("home-glow", shouldShowHomeGlow);
    C.rich.classList.toggle("visible", flow.active);
    const isComposeSurface = flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM || sendTransitionActive);
    C.rich.classList.toggle("glass-active", flow.active && !isComposeSurface);
    C.rich.classList.toggle("glass-sent", flow.active && flow.state === GS.SENT && !sendTransitionActive);
    C.rich.classList.toggle("glass-disambiguation", flow.active && flow.state === GS.DISAMBIGUATE);
    C.rich.classList.toggle("glass-compose", isComposeSurface);
    C.rich.classList.toggle("sent-transition", sendTransitionActive);
    C.rich.classList.toggle("compose-entering", enteringComposeFromDisambiguation);
    C.rich.dataset.glassState = flow.active ? String(flow.state) : "";
    document.body.classList.toggle("message-confirm-to-sent", sendTransitionActive);
    cancelComposeRevealTimer();
    if (enteringComposeText) {
      C.rich.style.opacity = "0";
      composeRevealTimer = setTimeout(() => {
        composeRevealTimer = null;
        const nextFlow = getFlow();
        if (!nextFlow.active || nextFlow.state !== GS.COMPOSE) return;
        C.rich.style.opacity = "1";
      }, 90);
    } else {
      C.rich.style.opacity = flow.active ? "1" : "";
    }
    C.rich.style.transform = "";
    renderControls(screenSpec);
    cancelMeasure();
    cancelSettle();

    if (flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM) && !sendTransitionActive) {
      const apply = (force = false) => {
        const geo = layout.composeGeo();
        const currentGeo = getCurrentMainGeometry() || {};
        if (
          force
          || Math.abs(geo.main.w - (Number(currentGeo.w) || 0)) > 1
          || Math.abs(geo.main.h - (Number(currentGeo.h) || 0)) > 1
          || Math.abs(geo.main.ty - (Number(currentGeo.ty) || 0)) > 1
        ) {
          morphTo(shape, EMPTY_STAGE_CONTENT, geo);
        }
        syncDropMainOrbClasses(shape);
        renderControls(screenSpec);
      };
      apply(shouldMorph);
      void C.rich.offsetHeight;
      measureRaf = requestAnimationFrame(() => {
        measureRaf = null;
        const nextFlow = getFlow();
        if (token !== renderToken || !nextFlow.active || (nextFlow.state !== GS.COMPOSE && nextFlow.state !== GS.CONFIRM)) return;
        apply(false);
      });
      if (shouldMorph) {
        settleTimer = setTimeout(() => {
          settleTimer = null;
          const nextFlow = getFlow();
          if (token !== renderToken || !nextFlow.active || (nextFlow.state !== GS.COMPOSE && nextFlow.state !== GS.CONFIRM)) return;
          apply(false);
        }, 80);
      }
    } else if (flow.active && sendTransitionActive) {
      const geo = SHAPES[shape] || SHAPES.magic;
      const current = getCurrentMainGeometry() || {};
      if (
        shouldMorph
        || Math.abs(geo.main.w - (current.w || 0)) > 1
        || Math.abs(geo.main.h - (current.h || 0)) > 1
        || Math.abs(geo.main.ty - (current.ty || 0)) > 1
      ) {
        morphTo(shape, EMPTY_STAGE_CONTENT);
      }
      trackIntentHeaderForTransition(layout.CONFIRM_TO_SENDING_MS);
      syncDropMainOrbClasses(shape);
      renderControls(screenSpec);
    } else if (flow.active && flow.state === GS.DISAMBIGUATE) {
      if (shouldMorph || enteringDisambiguation) {
        morphTo(shape, EMPTY_STAGE_CONTENT, layout.disambiguationGeo());
      }
      syncDropMainOrbClasses(shape);
    } else if (flow.active) {
      if (flow.state === GS.SENT) {
        const geo = layout.sentGeo();
        const current = getCurrentMainGeometry() || {};
        if (
          shouldMorph
          || Math.abs(geo.main.w - (current.w || 0)) > 1
          || Math.abs(geo.main.h - (current.h || 0)) > 1
          || Math.abs(geo.main.ty - (current.ty || 0)) > 1
        ) {
          morphTo(shape, EMPTY_STAGE_CONTENT, geo);
        }
      } else if (shouldMorph) {
        morphTo(shape, EMPTY_STAGE_CONTENT);
      }
      syncDropMainOrbClasses(shape);
      renderControls(screenSpec);
    } else if (shouldMorph) {
      morphTo(shape, EMPTY_STAGE_CONTENT);
      syncDropMainOrbClasses(shape);
      renderControls(screenSpec);
    }
    applyFlowChromeVisibility({ C, active: flow.active, richSent: flow.state === GS.SENT });
    const glow = document.getElementById("home-glow-layer");
    if (glow) glow.style.opacity = "";
    updateOrbLabel();
    prevSendTransitionActive = sendTransitionActive;

    hideIntentHeader();

    if (!flow.active || flow.state === GS.IDLE) {
      setSimInputState({ label: "Voice Command", placeholder: "Send a message to Hiro…", hint: "", dictating: false });
    } else if (flow.state === GS.THINKING || flow.state === GS.SENDING) {
      setSimInputState({ label: "Voice Command", placeholder: "", hint: "", dictating: false });
    } else if (flow.state === GS.DISAMBIGUATE) {
      setSimInputState({ label: "Voice Command", placeholder: 'Say a name, e.g. "Tanaka"', hint: "", dictating: false });
    } else if (flow.state === GS.COMPOSE) {
      setSimInputState({ label: "🎤 Voice Dictation", placeholder: "Speak (type to simulate)…", hint: "Hold click + drag to browse chips · Auto confirm after 2s silence", dictating: true });
    } else if (flow.state === GS.CONFIRM) {
      setSimInputState({ label: "Voice Command", placeholder: '"send", "edit", or "cancel"', hint: "", dictating: false });
    }
  }

  return {
    GS,
    glassStateShape: layout.glassStateShape,
    dynamicGeo: layout.dynamicGeo,
    sentGeo: layout.sentGeo,
    contentHeightPx: layout.contentHeightPx,
    composeGeo: layout.composeGeo,
    buildContent,
    render,
    setManualComposeEntry(flag) {
      manualComposeEntry = !!flag;
    },
    markStateCommitted() {
      prevState = getFlow().state;
    },
    clearDisambiguationMotion() {
      disambiguationPhase = "settled";
      cancelDisambiguationTimer();
      syncDisambiguationPhaseUi();
    },
    updateSelectionUiOnly() {
      const flow = getFlow();
      if (!flow.active) return false;
      if (flow.state === GS.DISAMBIGUATE) {
        const pills = C.rich.querySelectorAll(".g-disambiguation-pill");
        pills.forEach((pill, idx) => pill.classList.toggle("selected", idx === flow.sel));
        return pills.length > 0;
      }
      if (flow.state === GS.COMPOSE && flow.composeMenuOpen) {
        const chips = C.rich.querySelectorAll(".g-compose-chip");
        chips.forEach((chip, idx) => chip.classList.toggle("selected", idx === flow.sel));
        return chips.length > 0;
      }
      if (flow.state === GS.CONFIRM) {
        renderControls(EMPTY_SCREEN_SPEC);
        return true;
      }
      return false;
    },
    updateComposeMenuUiOnly() {
      const flow = getFlow();
      if (!flow.active || flow.state !== GS.COMPOSE) return false;
      const glassBodies = C.rich.querySelectorAll("[data-glass-body]");
      const hasOutgoingDisambiguationLayer = glassBodies.length > 1 || !!C.rich.querySelector(".g-disambiguation-pills.exiting-to-compose");
      if (manualComposeEntry || hasOutgoingDisambiguationLayer) return false;
      const stack = C.rich.querySelector(".g-compose-chip-stack");
      if (!stack) return false;
      const previousStackRect = stack.getBoundingClientRect();
      const chips = Array.from(stack.querySelectorAll(".g-compose-chip"));
      const visibleCount = Math.max(0, Math.min(Number(flow.composeMenuVisibleCount) || 0, (flow.composeVisualChips || []).length));
      stack.classList.toggle("open", !!flow.composeMenuOpen);
      stack.classList.toggle("closing", !!flow.composeMenuClosing);
      stack.classList.toggle("expanded", visibleCount > 3);
      stack.dataset.visibleCount = String(visibleCount);
      const header = C.rich.querySelector(".g-compose-header");
      if (header) header.classList.toggle("is-hidden", !!flow.composeMenuOpen && !flow.composeMenuClosing);
      chips.forEach((chip, idx) => {
        chip.classList.toggle("is-visible", idx < visibleCount);
        chip.classList.toggle("selected", idx === flow.sel);
      });
      const nextStackRect = stack.getBoundingClientRect();
      const deltaY = previousStackRect.top - nextStackRect.top;
      if (Math.abs(deltaY) >= 1) {
        stack.style.transition = "none";
        stack.style.transform = `translate(-50%, ${deltaY}px)`;
        stack.getBoundingClientRect();
        stack.style.transition = "";
        stack.style.transform = "";
      }
      return chips.length > 0;
    },
  };
}
