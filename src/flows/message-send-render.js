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
import { applyAiCelestialChrome, clearDirectionalSelectionTimers, syncDirectionalSelection } from "../shared/celestial-selection-chrome.js";
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
  const COMPOSE_AWAIT_ORB_SIZE = 48;
  const COMPOSE_AWAIT_ORB_GAP = 16;
  const COMPOSE_AWAIT_ORB_SHIFT = COMPOSE_AWAIT_ORB_SIZE + COMPOSE_AWAIT_ORB_GAP;
  const CONFIRM_LISTENING_ORB_SIZE = 48;
  const CONFIRM_LISTENING_ORB_GAP = 16;
  const CONFIRM_LISTENING_ORB_SHIFT = CONFIRM_LISTENING_ORB_SIZE + CONFIRM_LISTENING_ORB_GAP;
  const BOTTOM_ALIGN_STAGE_H = 420;
  let lastContentHeight = 180;
  const DISAMBIGUATION_ENTER_MS = 800;
  const DISAMBIGUATION_EXIT_MS = 600;
  const heightByState = { [GS.COMPOSE]: 240, [GS.CONFIRM]: 180 };
  let measureRaf = null;
  let settleTimer = null;
  let disambiguationTimer = null;
  let renderToken = 0;
  let prevState = GS.IDLE;
  let prevComposeHasText = false;
  let disambiguationPhase = "settled";
  let composeRevealTimer = null;
  let composePlaceholderDelayActive = false;
  let outgoingDisambiguationHtml = "";
  let outgoingDisambiguationTimer = null;
  let composeEntryLockRaf = null;
  let composeEntryLockUntil = 0;
  const selectionMotionTimers = new Map();

  function glassStateShape(state) {
    if (state === GS.IDLE) return "listening";
    if (state === GS.THINKING) return "magic";
    if (state === GS.SENDING) return "magic";
    if (state === GS.DISAMBIGUATE) return "listening";
    if (state === GS.COMPOSE) return "card-form";
    if (state === GS.CONFIRM) return "card-form";
    if (state === GS.SENT) return "pill";
    return "circle";
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
    const showConfirmListeningOrb = flow.state === GS.CONFIRM;
    const showComposeAwaitOrb = flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive;
    const hasText = flow.state === GS.CONFIRM
      ? !!String(flow.msg || "").trim()
      : !!String(flow.composeText || "").trim();
    const w = measureComposeFieldWidth(hasText);
    const h = measureComposeFieldHeight(hasText, w);
    const orbShift = showConfirmListeningOrb
      ? CONFIRM_LISTENING_ORB_SHIFT
      : (showComposeAwaitOrb ? COMPOSE_AWAIT_ORB_SHIFT : 0);
    const bottom = COMPOSE_FIELD_BOTTOM - orbShift;
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

  function disambiguationGeo() {
    const base = SHAPES.listening?.main || SHAPES.circle?.main || {};
    const baseW = Number(base.w) || 80;
    const baseH = Number(base.h) || 80;
    const nextW = COMPOSE_AWAIT_ORB_SIZE;
    const nextH = COMPOSE_AWAIT_ORB_SIZE;
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

  function syncDropMainOrbClasses(shape) {
    const flow = getFlow();
    const dropMain = document.getElementById("drop-main");
    if (!dropMain) return;
    const showComposeAwaitOrb = flow.active && (flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive));
    const showListeningOrb = flow.active && ((shape === "listening" && flow.state !== GS.DISAMBIGUATE) || showComposeAwaitOrb);
    const showHomeGlow = flow.active && shape === "magic";
    dropMain.classList.toggle("compose-await-orb", showComposeAwaitOrb);
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

  function cancelOutgoingDisambiguationTimer() {
    if (outgoingDisambiguationTimer) clearTimeout(outgoingDisambiguationTimer);
    outgoingDisambiguationTimer = null;
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

  function cancelComposeEntryLock() {
    if (composeEntryLockRaf) cancelAnimationFrame(composeEntryLockRaf);
    composeEntryLockRaf = null;
    composeEntryLockUntil = 0;
  }

  function releaseComposeEntryLock() {
    const field = C.rich.querySelector("[data-compose-field]");
    if (!field) return;
    field.style.removeProperty("height");
    field.style.removeProperty("min-height");
    field.style.removeProperty("border-radius");
  }

  function syncComposeFieldEntryLock() {
    const field = C.rich.querySelector("[data-compose-field]");
    const dropMain = document.getElementById("drop-main");
    if (!field || !dropMain) return false;
    const mainRect = dropMain.getBoundingClientRect();
    const mainHeight = Math.ceil(mainRect.height || 0);
    if (mainHeight <= 0) return false;
    const mainStyle = getComputedStyle(dropMain);
    field.style.setProperty("--g-stage-h", `${mainHeight}px`);
    field.style.minHeight = `${mainHeight}px`;
    field.style.height = `${mainHeight}px`;
    field.style.borderRadius = mainStyle.borderRadius;
    return true;
  }

  function queueComposeEntryLock() {
    cancelComposeEntryLock();
    composeEntryLockUntil = performance.now() + 520;
    const tick = () => {
      composeEntryLockRaf = null;
      const flow = getFlow();
      if (!flow.active || flow.state !== GS.COMPOSE) {
        releaseComposeEntryLock();
        return;
      }
      syncComposeFieldEntryLock();
      if (performance.now() < composeEntryLockUntil) {
        composeEntryLockRaf = requestAnimationFrame(tick);
        return;
      }
      releaseComposeEntryLock();
      C.rich.classList.remove("compose-entering");
      syncComposeFieldSelectionMetrics();
    };
    tick();
  }

  function syncComposeFieldSelectionMetrics() {
    const field = C.rich.querySelector("[data-compose-field]");
    if (!field) return false;
    const height = Math.ceil(Math.max(
      field.getBoundingClientRect?.().height || 0,
      field.offsetHeight || 0,
      field.scrollHeight || 0,
    ));
    if (height > 0) field.style.setProperty("--g-stage-h", `${height}px`);
    return true;
  }

  function updateComposeFieldTextOnly(text, options = {}) {
    const flow = getFlow();
    if (!flow.active || flow.state !== GS.COMPOSE) return false;
    const field = C.rich.querySelector("[data-compose-field]");
    const textNode = field?.querySelector("[data-compose-field-text]");
    if (!field || !textNode) return false;
    const value = String(text || "");
    const magicPending = options?.magicPending === true;
    textNode.textContent = value;
    textNode.classList.toggle("g-compose-text-pending", magicPending);
    field.classList.toggle("active", !!value.trim());
    field.classList.toggle("has-text", !!value.trim());
    field.classList.toggle("g-compose-field-magic-pending", magicPending);
    syncComposeFieldSelectionMetrics();

    const shape = glassStateShape(flow.state);
    const geo = composeGeo();
    const currentGeo = getCurrentMainGeometry() || {};
    if (
      Math.abs(geo.main.w - (Number(currentGeo.w) || 0)) > 1
      || Math.abs(geo.main.h - (Number(currentGeo.h) || 0)) > 1
      || Math.abs(geo.main.ty - (Number(currentGeo.ty) || 0)) > 1
    ) {
      morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, geo);
    }
    syncDropMainOrbClasses(shape);
    applyAiCelestialChrome(document);
    return true;
  }

  function syncDirectionalSelectionUi(selector, nextIndex) {
    const nodes = Array.from(C.rich.querySelectorAll(selector));
    if (!nodes.length) return false;
    return syncDirectionalSelection(nodes, nextIndex, selectionMotionTimers, { durationMs: 700 });
  }

  function clearComposeChipSelection(chips) {
    const nodes = Array.from(chips || []);
    if (!nodes.length) return false;
    clearDirectionalSelectionTimers(selectionMotionTimers);
    nodes.forEach((chip) => {
      chip.classList.remove("selected", "deselecting");
      const chrome = chip.querySelector(".g-selection-chrome");
      if (chrome) chrome.dataset.stageDirection = "bottom";
    });
    return true;
  }

  function layoutDisambiguationContacts(contacts) {
    return { items: layoutDisambiguationPillItems(contacts, getFlow().sel) };
  }

  function syncRichMarkup(nextContent) {
    const existingExitLayer = C.rich.querySelector(".g-disambiguation-pills.exiting-to-compose");
    const existingExitMarkup = existingExitLayer?.outerHTML || "";
    const currentMainMarkup = existingExitLayer
      ? C.rich.innerHTML.replace(existingExitMarkup, "")
      : C.rich.innerHTML;

    if (currentMainMarkup !== nextContent) {
      C.rich.innerHTML = existingExitMarkup ? `${nextContent}${existingExitMarkup}` : nextContent;
    }

    const liveExitLayer = C.rich.querySelector(".g-disambiguation-pills.exiting-to-compose");
    if (outgoingDisambiguationHtml) {
      if (!liveExitLayer || liveExitLayer.outerHTML !== outgoingDisambiguationHtml) {
        liveExitLayer?.remove();
        C.rich.insertAdjacentHTML("beforeend", outgoingDisambiguationHtml);
      }
      return;
    }
    liveExitLayer?.remove();
  }

  function primeDisambiguationExitLayer() {
    const flow = getFlow();
    const contacts = Array.isArray(flow.disambiguateContacts) ? flow.disambiguateContacts : [];
    if (!contacts.length) {
      outgoingDisambiguationHtml = "";
      cancelOutgoingDisambiguationTimer();
      return false;
    }
    const layout = layoutDisambiguationContacts(contacts);
    const maxY = layout.items.reduce((acc, item) => Math.max(acc, Math.round(Number(item?.y) || 0)), -72);
    const items = layout.items.map((contact, index) => ({
      avatar: contact.avatar,
      initials: contact.initials,
      name: contact.name,
      x: contact.x,
      y: contact.y,
      xStart: Math.round(Number(contact?.x) || 0),
      yStart: maxY + 84 + (index * 18),
      rotStart: contact.rotStart,
      delay: contact.delay,
    }));
    outgoingDisambiguationHtml = renderDisambiguationPills({
      phase: "settled",
      selectedIndex: flow.sel,
      items,
      rowDataAttr: "data-g-contact",
      clusterClass: "g-disambiguation-pills prototype-disambiguation-pills exiting-to-compose",
    });
    cancelOutgoingDisambiguationTimer();
    outgoingDisambiguationTimer = setTimeout(() => {
      outgoingDisambiguationTimer = null;
      outgoingDisambiguationHtml = "";
      if (getFlow().active) render(false);
    }, DISAMBIGUATION_EXIT_MS);
    return true;
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
    const buildConfirmStage = () => {
      const contact = flow.contact;
      return `<div data-glass-body class="g-compose-stage has-text confirm-mode">${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: true })}<div class="g-compose-field-wrap">${renderComposeField({ text: flow.msg || "", active: true, selected: false, stageHeight: COMPOSE_FIELD_ACTIVE_H })}</div></div>`;
    };
    const buildComposeStage = () => {
      const contact = flow.contact;
      const hasText = !!String(flow.composeText || "").trim();
      const enteringFromDisambiguation = flow.state === GS.COMPOSE && prevState === GS.DISAMBIGUATE;
      const deferComposeReveal = enteringFromDisambiguation && !!outgoingDisambiguationHtml;
      const currentMainHeight = Math.max(
        1,
        Math.round(
          Number(getCurrentMainGeometry()?.h)
          || Number(document.getElementById("drop-main")?.getBoundingClientRect?.().height)
          || COMPOSE_FIELD_H,
        ),
      );
      const hideHeader = (flow.composeMenuOpen && !flow.composeMenuClosing) || !!flow.composeChipMagicPending;
      const shouldRenderChipStack = !!flow.composeMenuOpen || !!flow.composeMenuClosing || (Number(flow.composeMenuVisibleCount) || 0) > 0;
      const chipsHtml = shouldRenderChipStack
        ? renderComposeChipStack({
            chips: (flow.composeVisualChips || []).map((chip, idx) => ({ id: String(chip.originalIndex ?? idx), label: chip.label })),
            selectedIndex: flow.sel,
            open: !!flow.composeMenuOpen,
            closing: !!flow.composeMenuClosing,
            visibleCount: Number.isFinite(flow.composeMenuVisibleCount) ? flow.composeMenuVisibleCount : 0,
          })
        : "";
      const inputHtml = renderComposeField({
        text: flow.composeText,
        placeholder: "Speak your message...",
        active: hasText,
        magicPending: !!flow.composeChipMagicPending,
        selected: true,
        entering: enteringFromDisambiguation,
        stageHeight: enteringFromDisambiguation ? currentMainHeight : (hasText ? COMPOSE_FIELD_ACTIVE_H : COMPOSE_FIELD_H),
      });
      const maybeCheckRow = flow.showCheck ? renderActionRow({ actions: [{ id: "confirm", emoji: "✅" }], selectedIndex: 0 }) : "";
      return `<div data-glass-body class="g-compose-stage ${flow.composeMenuOpen ? "menu-open" : ""} ${hasText ? "has-text" : ""} ${composePlaceholderDelayActive ? "placeholder-delayed" : ""} ${deferComposeReveal ? "defer-disambiguation-exit" : ""}">${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: !hideHeader && !deferComposeReveal })}<div class="g-compose-field-wrap">${chipsHtml}${inputHtml}</div>${maybeCheckRow}</div>`;
    };
    if (flow.state === GS.IDLE) return "";
    if (flow.state === GS.THINKING) return "";
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
    const shape = glassStateShape(flow.state);
    const showComposeAwaitOrb = flow.active && (flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive));
    const shouldShowListeningOrb = flow.active && ((shape === "listening" && flow.state !== GS.DISAMBIGUATE) || showComposeAwaitOrb);
    const shouldShowHomeGlow = flow.active && shape === "magic";
    const screenSpec = buildScreenSpec();
    const dropMain = document.getElementById("drop-main");
    const composeHasText = (flow.state === GS.COMPOSE && !!String(flow.composeText || "").trim()) || (flow.state === GS.CONFIRM && !!String(flow.msg || "").trim());
    const enteringDisambiguation = flow.state === GS.DISAMBIGUATE && prevState !== GS.DISAMBIGUATE;
    const enteringComposeFromDisambiguation = flow.state === GS.COMPOSE && prevState === GS.DISAMBIGUATE;
    const enteringSendingFromConfirm = flow.state === GS.SENDING && prevState === GS.CONFIRM;
    const enteringComposeText = flow.state === GS.COMPOSE && composeHasText && !prevComposeHasText;
    const muteOrbChrome = false;
    composePlaceholderDelayActive = enteringComposeFromDisambiguation && !composeHasText;
    if (flow.state !== GS.DISAMBIGUATE && flow.state !== GS.COMPOSE) {
      clearDirectionalSelectionTimers(selectionMotionTimers);
    }
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
    const nextContent = buildContent();
    syncRichMarkup(nextContent);
    syncComposeFieldSelectionMetrics();
    applyAiCelestialChrome(document);
    if (flow.state === GS.DISAMBIGUATE) syncDisambiguationPhaseUi();
    if (flow.sentToastEnterPending && flow.state === GS.SENT) flow.sentToastEnterPending = false;
    prevState = flow.state;
    prevComposeHasText = composeHasText;
    dropMain?.classList.toggle("disambiguation-surface", flow.active && flow.state === GS.DISAMBIGUATE);
    dropMain?.classList.toggle("compose-surface", flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM));
    dropMain?.classList.toggle("confirm-surface", flow.active && flow.state === GS.CONFIRM);
    dropMain?.classList.toggle("sending-surface", flow.active && flow.state === GS.SENDING);
    dropMain?.classList.toggle("compose-await-orb", showComposeAwaitOrb);
    dropMain?.classList.toggle("listening-orb", shouldShowListeningOrb);
    dropMain?.classList.toggle("home-glow", shouldShowHomeGlow);
    dropMain?.classList.toggle("flow-orb-muted", muteOrbChrome);
    dropMain?.classList.toggle("sending-orb-fade-in", enteringSendingFromConfirm);
    if (dropMain) {
      if (showComposeAwaitOrb) {
        const bottomOrbSize = flow.state === GS.CONFIRM ? CONFIRM_LISTENING_ORB_SIZE : COMPOSE_AWAIT_ORB_SIZE;
        dropMain.style.setProperty("--g-compose-await-orb-size", `${bottomOrbSize}px`);
        dropMain.style.setProperty("--g-compose-await-orb-radius", `${Math.round(bottomOrbSize / 2)}px`);
      } else {
        dropMain.style.removeProperty("--g-compose-await-orb-size");
        dropMain.style.removeProperty("--g-compose-await-orb-radius");
      }
    }
    applyAiCelestialChrome(document);
    C.rich.classList.toggle("visible", flow.active);
    const isComposeSurface = flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM);
    C.rich.classList.toggle("glass-active", flow.active && !isComposeSurface);
    C.rich.classList.toggle("glass-sent", flow.active && flow.state === GS.SENT);
    C.rich.classList.toggle("glass-disambiguation", flow.active && flow.state === GS.DISAMBIGUATE);
    C.rich.classList.toggle("glass-compose", isComposeSurface);
    C.rich.classList.remove("sent-transition");
    C.rich.classList.toggle("compose-entering", enteringComposeFromDisambiguation);
    if (enteringComposeFromDisambiguation) queueComposeEntryLock();
    else {
      cancelComposeEntryLock();
      releaseComposeEntryLock();
    }
    C.rich.dataset.glassState = flow.active ? String(flow.state) : "";
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

    if (flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM)) {
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
      void flag;
    },
    markStateCommitted() {
      prevState = getFlow().state;
    },
    clearDisambiguationMotion() {
      disambiguationPhase = "settled";
      cancelDisambiguationTimer();
      cancelOutgoingDisambiguationTimer();
      outgoingDisambiguationHtml = "";
      syncDisambiguationPhaseUi();
    },
    primeDisambiguationExitLayer,
    updateSelectionUiOnly() {
      const flow = getFlow();
      if (!flow.active) return false;
      if (flow.state === GS.DISAMBIGUATE) {
        return syncDirectionalSelectionUi(".g-disambiguation-pill", flow.sel);
      }
      if (flow.state === GS.COMPOSE && flow.composeMenuOpen) {
        return syncDirectionalSelectionUi(".g-compose-chip", flow.sel);
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
      if (hasOutgoingDisambiguationLayer) return false;
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
      if (header) header.classList.toggle("is-hidden", (!!flow.composeMenuOpen && !flow.composeMenuClosing) || !!flow.composeChipMagicPending);
      syncComposeFieldSelectionMetrics();
      chips.forEach((chip, idx) => {
        chip.classList.toggle("is-visible", idx < visibleCount);
      });
      if (flow.sel < 0) clearComposeChipSelection(chips);
      else syncDirectionalSelection(chips, flow.sel, selectionMotionTimers, { durationMs: 700 });
      applyAiCelestialChrome(document);
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
    updateComposeFieldTextOnly,
  };
}
