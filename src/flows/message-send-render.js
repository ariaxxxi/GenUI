import {
  layoutDisambiguationPillItems,
  renderActionRow,
  renderChipBar,
  renderCompactStatus,
  renderComposeChipStack,
  renderComposeField,
  renderComposeHeader,
  renderContactHeader,
  renderDisambiguationPills,
  renderInputField,
  renderSendingStatus,
  renderTextBubble,
} from "./ui-primitives.js";
import { applyFlowChromeVisibility, measureSuccessToastGeometry, ensureMeasureLayer } from "../shared/flow-toast.js";
import { clamp } from "../utils.js";

export function createMessageSendRender({
  document,
  SHAPES,
  C,
  GS,
  getFlow,
  morphTo,
  applyGeometry,
  getCurrentMainGeometry,
  setIntentHeader,
  hideIntentHeader,
  positionIntentHeaderAboveMain,
  trackIntentHeaderForTransition,
  renderControls,
  updateOrbLabel,
  setSimInputState,
}) {
  const TOP = 10;
  const BOTTOM = 10;
  const CONTROLS_LIFT = 78;
  const MIN_H = 100;
  const MAX_H = 400;
  const COMPOSE_FIELD_BOTTOM = 408;
  const COMPOSE_FIELD_W = 307;
  const COMPOSE_FIELD_H = 96;
  const COMPOSE_FIELD_MAX_W = 420;
  const COMPOSE_FIELD_ACTIVE_H = 94;
  const COMPOSE_FIELD_MAX_H = 220;
  const COMPOSE_FIELD_SIDE_PADDING = 28;
  const CONFIRM_TO_SENDING_MS = 600;
  const CONFIRM_AWAIT_ORB_SIZE = 44;
  const CONFIRM_AWAIT_ORB_GAP = 16;
  const CONFIRM_AWAIT_ORB_SHIFT = CONFIRM_AWAIT_ORB_SIZE + CONFIRM_AWAIT_ORB_GAP;
  const BOTTOM_ALIGN_STAGE_H = 420;
  let lastContentHeight = 180;
  const DISAMBIGUATION_ENTER_MS = 800;
  const DISAMBIGUATION_ORB_SCALE = 0.625;
  const heightByState = { [GS.COMPOSE]: 240, [GS.CONFIRM]: 180 };
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

  function glassStateShape(state) {
    if (state === GS.IDLE) return "listening";
    if (state === GS.THINKING || state === GS.SENDING) return "magic";
    if (state === GS.DISAMBIGUATE) return "listening";
    if (state === GS.COMPOSE) return "card-form";
    if (state === GS.CONFIRM) return "card-form";
    if (state === GS.SENT) return "pill";
    return "circle";
  }

  function isConfirmToSendTransition(flow = getFlow()) {
    return !!(flow?.active && flow.sentTransitionActive && flow.state === GS.SENDING);
  }

  function isCardState(state = getFlow().state) {
    return state === GS.CONFIRM;
  }

  function dynamicGeo(shape, contentHeightPx) {
    const flow = getFlow();
    const base = SHAPES[shape] || SHAPES.card;
    const shellHeight = clamp(Math.round(contentHeightPx + TOP + BOTTOM), MIN_H, MAX_H);
    const controlsLift = shape === "card" ? CONTROLS_LIFT : 0;
    return { ...base, main: { ...base.main, h: shellHeight, ty: -(shellHeight / 2) - controlsLift } };
  }

  function composeGeo() {
    const flow = getFlow();
    const showAwaitOrb = flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive);
    const hasText = flow.state === GS.CONFIRM
      ? !!String(flow.msg || "").trim()
      : !!String(flow.composeText || "").trim();
    const w = measureComposeFieldWidth(hasText);
    const h = measureComposeFieldHeight(hasText, w);
    const bottom = COMPOSE_FIELD_BOTTOM - (showAwaitOrb ? CONFIRM_AWAIT_ORB_SHIFT : 0);
    return {
      ...SHAPES["card-form"],
      main: {
        ...(SHAPES["card-form"]?.main || {}),
        w,
        h,
        br: "30px",
        tx: -Math.round(w / 2),
        // Keep the compose field bottom edge locked and let extra height grow upward.
        // applyGeometry() adds a bottom-align yOffset in AI mode, so compensate here.
        ty: Math.round(bottom - BOTTOM_ALIGN_STAGE_H - (h / 2)),
        op: 1,
      },
      left: { ...(SHAPES["card-form"]?.left || {}), op: 0 },
      right: { ...(SHAPES["card-form"]?.right || {}), op: 0 },
    };
  }

  function measureComposeFieldWidth(hasText) {
    const flow = getFlow();
    const value = flow.state === GS.CONFIRM
      ? String(flow.msg || "").trim()
      : String(flow.composeText || "").trim();
    if (!hasText) return COMPOSE_FIELD_W;

    const sample = value || "Speak your message...";
    const lines = sample.split(/\r?\n/).filter(Boolean);
    if (!measureComposeFieldWidth._ctx) {
      const canvas = document.createElement("canvas");
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return COMPOSE_FIELD_W;
      ctx2d.font = "500 24px 'DM Sans'";
      measureComposeFieldWidth._canvas = canvas;
      measureComposeFieldWidth._ctx = ctx2d;
    }
    const ctx2d = measureComposeFieldWidth._ctx;
    const widestLine = Math.max(
      ...lines.map((line) => Math.ceil(ctx2d.measureText(line).width)),
      0,
    );
    return clamp(
      Math.ceil(widestLine + COMPOSE_FIELD_SIDE_PADDING),
      COMPOSE_FIELD_W,
      COMPOSE_FIELD_MAX_W,
    );
  }

  function measureComposeFieldHeight(hasText, targetWidth = COMPOSE_FIELD_W) {
    const baseMin = hasText ? COMPOSE_FIELD_ACTIVE_H : COMPOSE_FIELD_H;
    const field = C.rich.querySelector("[data-compose-field]");
    if (!field) return baseMin;
    const measure = (node) => Math.ceil(Math.max(
      node?.getBoundingClientRect?.().height || 0,
      node?.offsetHeight || 0,
      node?.scrollHeight || 0,
    ));
    const measureWidth = clamp(Math.round(targetWidth || COMPOSE_FIELD_W), COMPOSE_FIELD_W, COMPOSE_FIELD_MAX_W);
    const layer = ensureMeasureLayer("glass-compose-field-measure");
    layer.style.width = `${measureWidth}px`;
    layer.innerHTML = field.outerHTML;
    const probe = layer.querySelector("[data-compose-field]");
    probe?.classList.remove("g-compose-field-magic-pending");
    const measured = measure(probe) || measure(field);
    if (!measured) return baseMin;
    return clamp(measured, baseMin, COMPOSE_FIELD_MAX_H);
  }

  function sentGeo() {
    return measureSuccessToastGeometry({
      richRoot: C.rich,
      pillShape: SHAPES.pill || SHAPES.card,
      fallbackLabel: "Message sent",
    });
  }

  function measureConfirmTransitionTextWidthPx() {
    const liveText = C.rich.querySelector("[data-compose-field-text]");
    const liveTextWidth = Math.round(liveText?.getBoundingClientRect?.().width || 0);
    if (liveTextWidth > 0) return liveTextWidth;
    const liveField = C.rich.querySelector("[data-compose-field]");
    const liveFieldWidth = Math.round(liveField?.getBoundingClientRect?.().width || 0);
    if (liveFieldWidth > 28) return Math.max(0, liveFieldWidth - 28);
    const value = String(getFlow().msg || getFlow().composeText || "").trim();
    if (!value) return Math.max(0, COMPOSE_FIELD_W - 28);
    const fieldWidth = measureComposeFieldWidth(true);
    return Math.max(0, Math.round(fieldWidth - 28));
  }

  function confirmTransitionTextWidthPx() {
    return confirmTransitionFrozenTextWidth ?? measureConfirmTransitionTextWidthPx();
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

  function layoutDisambiguationContacts(contacts) {
    return { items: layoutDisambiguationPillItems(contacts, getFlow().sel) };
  }

  function disambiguationGeo() {
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

  function contentHeightPx() {
    const measure = (node) => node ? Math.ceil(Math.max(node.getBoundingClientRect().height || 0, node.offsetHeight || 0, node.scrollHeight || 0)) : 0;
    const layer = ensureMeasureLayer("glass-measure-layer");
    layer.innerHTML = C.rich.innerHTML;
    let raw = measure(layer.querySelector("[data-glass-body]"));
    if (raw <= 0) raw = measure(C.rich.querySelector("[data-glass-body]"));
    const flow = getFlow();
    if (raw > 0) {
      const resolved = clamp(raw, 60, MAX_H - TOP - BOTTOM);
      lastContentHeight = resolved;
      if (isCardState(flow.state)) heightByState[flow.state] = resolved;
      return resolved;
    }
    if (isCardState(flow.state) && Number.isFinite(heightByState[flow.state])) return clamp(heightByState[flow.state], 60, MAX_H - TOP - BOTTOM);
    return clamp(lastContentHeight, 60, MAX_H - TOP - BOTTOM);
  }

  const EMPTY_SCREEN_SPEC = { actions: [], actionSelectedIndex: 0 };
  function buildScreenSpec() { return EMPTY_SCREEN_SPEC; }

  function buildContent() {
    const flow = getFlow();
    const sendTransitionActive = isConfirmToSendTransition(flow);
    const buildConfirmStage = (extraClass = "") => {
      const contact = flow.contact;
      const classes = ["g-compose-stage", "has-text", "confirm-mode", extraClass].filter(Boolean).join(" ");
      const styleAttr = extraClass === "confirm-exit-to-sent"
        ? ` style="--g-confirm-text-freeze-w:${confirmTransitionTextWidthPx()}px;"`
        : "";
      return `<div data-glass-body class="${classes}"${styleAttr}>${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: true })}<div class="g-compose-field-wrap">${renderComposeField({ text: flow.msg || "", active: true })}</div></div>`;
    };
    const buildComposeStage = () => {
      const contact = flow.contact;
      const hasText = !!String(flow.composeText || "").trim();
      const chipsHtml = renderComposeChipStack({
        chips: (flow.composeVisualChips || []).map((chip, idx) => ({ id: String(chip.originalIndex ?? idx), label: chip.label })),
        selectedIndex: flow.sel,
        open: !!flow.composeMenuOpen,
        closing: !!flow.composeMenuClosing,
        visibleCount: Number.isFinite(flow.composeMenuVisibleCount) ? flow.composeMenuVisibleCount : 0,
      });
      const inputHtml = renderComposeField({ text: flow.composeText, placeholder: "Speak your message...", active: hasText, magicPending: !!flow.composeChipMagicPending });
      const maybeCheckRow = flow.showCheck ? renderActionRow({ actions: [{ id: "confirm", emoji: "✅" }], selectedIndex: 0 }) : "";
      return `<div data-glass-body class="g-compose-stage ${flow.composeMenuOpen ? "menu-open" : ""} ${hasText ? "has-text" : ""} ${composePlaceholderDelayActive ? "placeholder-delayed" : ""}">${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: !(flow.composeMenuOpen && !flow.composeMenuClosing) })}<div class="g-compose-field-wrap">${chipsHtml}${inputHtml}</div>${maybeCheckRow}</div>`;
    };
    const buildOutgoingDisambiguationStage = () => {
      const layout = layoutDisambiguationContacts(flow.disambiguateContacts || []);
      return renderDisambiguationPills({
        phase: "settled",
        selectedIndex: flow.sel,
        items: layout.items.map((contact) => ({
          avatar: contact.avatar,
          initials: contact.initials,
          name: contact.name,
          x: contact.x,
          y: contact.y,
          rotStart: contact.rotStart,
          delay: contact.delay,
        })),
        rowDataAttr: "data-g-contact",
        clusterClass: "g-disambiguation-pills exiting-to-compose",
      });
    };
    if (flow.state === GS.IDLE) return "";
    if (sendTransitionActive) return `${renderSendingStatus({ label: "sending..." })}<div class="g-confirm-to-sent-layer">${buildConfirmStage("confirm-exit-to-sent")}</div>`;
    if (flow.state === GS.THINKING) return renderCompactStatus({ type: "loading", label: "·", dotsId: "g-thinking-dots" });
    if (flow.state === GS.SENDING) return renderSendingStatus({ label: "sending..." });
    if (flow.state === GS.DISAMBIGUATE) {
      const layout = layoutDisambiguationContacts(flow.disambiguateContacts || []);
      return renderDisambiguationPills({
        phase: disambiguationPhase,
        selectedIndex: flow.sel,
        items: layout.items.map((contact) => ({
          avatar: contact.avatar,
          initials: contact.initials,
          name: contact.name,
          x: contact.x,
          y: contact.y,
          rotStart: contact.rotStart,
          delay: contact.delay,
        })),
        rowDataAttr: "data-g-contact",
      });
    }
    if (flow.state === GS.COMPOSE) {
      const hasComposeText = !!String(flow.composeText || "").trim();
      const shouldShowOutgoingDisambiguation = manualComposeEntry
        && !hasComposeText
        && !flow.composeChipMagicPending
        && !flow.composeMenuOpen
        && !flow.composeMenuHolding
        && !flow.composeMenuClosing;
      if (shouldShowOutgoingDisambiguation) return `${buildOutgoingDisambiguationStage()}${buildComposeStage()}`;
      return buildComposeStage();
    }
    if (flow.state === GS.CONFIRM) return buildConfirmStage();
    if (flow.state === GS.SENT) return renderCompactStatus({ type: "success", label: "Message sent", enter: !!flow.sentToastEnterPending });
    return "";
  }

  function render(shouldMorph = true) {
    const flow = getFlow();
    renderToken += 1;
    const token = renderToken;
    const sendTransitionActive = isConfirmToSendTransition(flow);
    if (sendTransitionActive && !prevSendTransitionActive) confirmTransitionFrozenTextWidth = measureConfirmTransitionTextWidthPx();
    else if (!sendTransitionActive) confirmTransitionFrozenTextWidth = null;
    const shape = sendTransitionActive ? "magic" : glassStateShape(flow.state);
    const confirmAwaitOrbActive = flow.active && (flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive));
    const shouldShowListeningOrb = flow.active && (shape === "listening" || confirmAwaitOrbActive);
    const shouldShowHomeGlow = flow.active && (shape === "listening" || shape === "magic" || confirmAwaitOrbActive);
    const screenSpec = buildScreenSpec();
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
      }, DISAMBIGUATION_ENTER_MS);
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
        const geo = composeGeo();
        const currentGeo = getCurrentMainGeometry() || {};
        if (
          force
          || Math.abs(geo.main.w - (Number(currentGeo.w) || 0)) > 1
          || Math.abs(geo.main.h - (Number(currentGeo.h) || 0)) > 1
          || Math.abs(geo.main.ty - (Number(currentGeo.ty) || 0)) > 1
        ) {
          morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, geo);
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
        morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" });
      }
      trackIntentHeaderForTransition(CONFIRM_TO_SENDING_MS);
      syncDropMainOrbClasses(shape);
      renderControls(screenSpec);
    } else if (flow.active && flow.state === GS.DISAMBIGUATE) {
      if (shouldMorph || enteringDisambiguation) {
        morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, disambiguationGeo());
      }
      syncDropMainOrbClasses(shape);
    } else if (flow.active) {
      if (flow.state === GS.SENT) {
        const geo = sentGeo();
        const current = getCurrentMainGeometry() || {};
        if (
          shouldMorph
          || Math.abs(geo.main.w - (current.w || 0)) > 1
          || Math.abs(geo.main.h - (current.h || 0)) > 1
          || Math.abs(geo.main.ty - (current.ty || 0)) > 1
        ) {
          morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, geo);
        }
      } else if (shouldMorph) {
        morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" });
      }
      syncDropMainOrbClasses(shape);
      renderControls(screenSpec);
    } else if (shouldMorph) {
      morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" });
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
    glassStateShape,
    dynamicGeo,
    sentGeo,
    contentHeightPx,
    composeGeo,
    buildScreenSpec,
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
        renderControls(buildScreenSpec());
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
