import {
  renderActionRow,
  renderChipBar,
  renderCompactStatus,
  renderComposeChipStack,
  renderComposeField,
  renderComposeHeader,
  renderContactHeader,
  renderDisambiguationPills,
  renderInputField,
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
  const BOTTOM_ALIGN_STAGE_H = 420;
  let lastContentHeight = 180;
  const DISAMBIGUATION_ENTER_MS = 800;
  const DISAMBIGUATION_ORB_SCALE = 0.8;
  const heightByState = { [GS.COMPOSE]: 240, [GS.CONFIRM]: 180 };
  let measureRaf = null;
  let settleTimer = null;
  let disambiguationTimer = null;
  let renderToken = 0;
  let prevState = GS.IDLE;
  let prevComposeHasText = false;
  let manualComposeEntry = false;
  let disambiguationPhase = "settled";
  let composeRevealTimer = null;
  let composePlaceholderDelayActive = false;

  function glassStateShape(state) {
    if (state === GS.IDLE) return "listening";
    if (state === GS.THINKING || state === GS.SENDING) return "magic";
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
    const hasText = flow.state === GS.CONFIRM
      ? !!String(flow.msg || "").trim()
      : !!String(flow.composeText || "").trim();
    const w = measureComposeFieldWidth(hasText);
    const h = measureComposeFieldHeight(hasText, w);
    const bottom = COMPOSE_FIELD_BOTTOM;
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

  function cancelComposeRevealTimer() {
    if (composeRevealTimer) clearTimeout(composeRevealTimer);
    composeRevealTimer = null;
  }

  function layoutDisambiguationContacts(contacts) {
    const count = Math.max(0, Number(contacts?.length) || 0);
    if (count <= 0) return { items: [] };
    let positions;
    if (count === 1) {
      positions = [{ x: 0, y: -88 }];
    } else if (count === 2) {
      positions = [{ x: 0, y: -136 }, { x: 0, y: -72 }];
    } else if (count === 3) {
      positions = [{ x: 0, y: -144 }, { x: -74, y: -84 }, { x: 74, y: -84 }];
    } else {
      const radiusX = Math.min(122, 84 + Math.max(0, count - 4) * 8);
      const radiusY = Math.min(116, 78 + Math.max(0, count - 4) * 6);
      positions = Array.from({ length: count }, (_, index) => {
        const span = Math.min(160, 88 + (count * 10));
        const start = -90 - (span / 2);
        const angle = (start + ((count === 1 ? 0 : span / (count - 1)) * index)) * (Math.PI / 180);
        return {
          x: Math.round(Math.cos(angle) * radiusX),
          y: Math.round(Math.sin(angle) * radiusY) - 34,
        };
      });
    }
    const items = positions.map((pos, index) => ({
      ...contacts[index],
      x: pos.x,
      y: pos.y,
      rotStart: pos.x >= 0 ? 10 : -10,
      delay: Math.max(0, (index * 42) - (index === getFlow().sel ? 28 : 0)),
    }));
    return { items };
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
    if (flow.state === GS.THINKING || flow.state === GS.SENDING) return renderCompactStatus({ type: "loading", label: "·", dotsId: "g-thinking-dots" });
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
    if (flow.state === GS.CONFIRM) {
      const contact = flow.contact;
      return `<div data-glass-body class="g-compose-stage has-text confirm-mode">${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: true })}<div class="g-compose-field-wrap">${renderComposeField({ text: flow.msg || "", active: true })}</div></div>`;
    }
    if (flow.state === GS.SENT) return renderCompactStatus({ type: "success", label: "Message sent" });
    return "";
  }

  function render(shouldMorph = true) {
    const flow = getFlow();
    renderToken += 1;
    const token = renderToken;
    const shape = glassStateShape(flow.state);
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
        render(false);
      }, DISAMBIGUATION_ENTER_MS);
    } else if (flow.state !== GS.DISAMBIGUATE) {
      disambiguationPhase = "settled";
      cancelDisambiguationTimer();
    }
    C.rich.innerHTML = buildContent();
    prevState = flow.state;
    prevComposeHasText = composeHasText;
    dropMain?.classList.toggle("disambiguation-surface", flow.active && flow.state === GS.DISAMBIGUATE);
    dropMain?.classList.toggle("compose-surface", flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM));
    dropMain?.classList.toggle("confirm-surface", flow.active && flow.state === GS.CONFIRM);
    dropMain?.classList.toggle("compose-text-active", flow.active && composeVoiceVizActive);
    C.rich.classList.toggle("visible", flow.active);
    const isComposeSurface = flow.active && (flow.state === GS.COMPOSE || flow.state === GS.CONFIRM);
    C.rich.classList.toggle("glass-active", flow.active && !isComposeSurface);
    C.rich.classList.toggle("glass-sent", flow.active && flow.state === GS.SENT);
    C.rich.classList.toggle("glass-disambiguation", flow.active && flow.state === GS.DISAMBIGUATE);
    C.rich.classList.toggle("glass-compose", isComposeSurface);
    C.rich.classList.toggle("compose-entering", enteringComposeFromDisambiguation);
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
    C.rich.style.transform = (flow.active && flow.state === GS.SENT) ? "translateY(-18px)" : "";
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
      renderControls(screenSpec);
    } else if (shouldMorph) {
      morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" });
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
      manualComposeEntry = !!flag;
    },
    markStateCommitted() {
      prevState = getFlow().state;
    },
    clearDisambiguationMotion() {
      disambiguationPhase = "settled";
      cancelDisambiguationTimer();
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
