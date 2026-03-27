import {
  renderActionRow,
  renderBubbleCluster,
  renderChipBar,
  renderCompactStatus,
  renderContactHeader,
  renderInputField,
  renderTextBubble,
} from "./ui-primitives.js";

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
  clamp,
}) {
  const clampFn = typeof clamp === "function" ? clamp : (value, min, max) => Math.max(min, Math.min(max, value));
  const TOP = 10;
  const BOTTOM = 10;
  const CONTROLS_LIFT = 78;
  const MIN_H = 100;
  const MAX_H = 400;
  let lastContentHeight = 180;
  const DISAMBIGUATION_ENTER_MS = 520;
  const DISAMBIGUATION_BUBBLE_SIZE = 80;
  const DISAMBIGUATION_Y_OFFSET = -160;
  const DISAMBIGUATION_ORB_SCALE = 0.7;
  const heightByState = { [GS.COMPOSE]: 240, [GS.CONFIRM]: 180 };
  let measureRaf = null;
  let settleTimer = null;
  let disambiguationTimer = null;
  let renderToken = 0;
  let prevState = GS.IDLE;
  let manualComposeEntry = false;
  let disambiguationPhase = "settled";

  function glassStateShape(state) {
    if (state === GS.IDLE) return "listening";
    if (state === GS.THINKING || state === GS.SENDING) return "magic";
    if (state === GS.DISAMBIGUATE) return "listening";
    if (state === GS.COMPOSE) return "card-form";
    if (state === GS.CONFIRM) return "card";
    if (state === GS.SENT) return "pill";
    return "circle";
  }

  function isCardState(state = getFlow().state) {
    return state === GS.COMPOSE || state === GS.CONFIRM;
  }

  function dynamicGeo(shape, contentHeightPx) {
    const flow = getFlow();
    const base = SHAPES[shape] || SHAPES.card;
    const shellHeight = clampFn(Math.round(contentHeightPx + TOP + BOTTOM), MIN_H, MAX_H);
    const controlsLift = shape === "card" ? CONTROLS_LIFT : 0;
    return { ...base, main: { ...base.main, h: shellHeight, ty: -(shellHeight / 2) - controlsLift } };
  }

  function sentGeo() {
    const base = SHAPES.pill || SHAPES.card;
    const textEl = C.rich.querySelector("[data-glass-sent]");
    let w = 200;
    let h = 52;
    if (textEl) {
      const rect = textEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        w = clampFn(Math.round(rect.width + 48), 140, 360);
        h = clampFn(Math.round(rect.height + 32), 52, 140);
      }
    }
    return { ...base, main: { ...base.main, w, h, tx: -(w / 2), ty: -(h / 2) - 18 } };
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

  function layoutDisambiguationContacts(contacts) {
    const count = Math.max(0, Number(contacts?.length) || 0);
    if (count <= 0) return { items: [], width: DISAMBIGUATION_BUBBLE_SIZE, height: DISAMBIGUATION_BUBBLE_SIZE };
    let positions;
    if (count === 1) {
      positions = [{ x: 0, y: 0 }];
    } else if (count === 2) {
      positions = [{ x: -20, y: -58 }, { x: 34, y: 20 }];
    } else if (count === 3) {
      positions = [{ x: 0, y: -66 }, { x: -52, y: 18 }, { x: 52, y: 18 }];
    } else {
      const radius = Math.min(92, 62 + Math.max(0, count - 4) * 6);
      positions = Array.from({ length: count }, (_, index) => {
        const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
        return {
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
        };
      });
    }
    const items = positions.map((pos, index) => ({
      ...contacts[index],
      x: pos.x,
      y: pos.y + DISAMBIGUATION_Y_OFFSET,
      rotStart: pos.x >= 0 ? 24 : -24,
      delay: Math.max(0, (index * 42) - (index === getFlow().sel ? 28 : 0)),
    }));
    return { items, width: DISAMBIGUATION_BUBBLE_SIZE, height: DISAMBIGUATION_BUBBLE_SIZE };
  }

  function disambiguationGeo() {
    const base = SHAPES.listening?.main || SHAPES.circle?.main;
    const nextW = Math.round((Number(base?.w) || 80) * DISAMBIGUATION_ORB_SCALE);
    const nextH = Math.round((Number(base?.h) || 80) * DISAMBIGUATION_ORB_SCALE);
    const baseTx = Number(base?.tx) || -40;
    const baseTy = Number(base?.ty) || -60;
    const baseW = Number(base?.w) || 80;
    const baseH = Number(base?.h) || 80;
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
    let layer = document.getElementById("glass-measure-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "glass-measure-layer";
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:380px;visibility:hidden;pointer-events:none;z-index:-1;";
      document.body.appendChild(layer);
    }
    layer.innerHTML = C.rich.innerHTML;
    let raw = measure(layer.querySelector("[data-glass-body]"));
    if (raw <= 0) raw = measure(C.rich.querySelector("[data-glass-body]"));
    const flow = getFlow();
    if (raw > 0) {
      const resolved = clampFn(raw, 60, MAX_H - TOP - BOTTOM);
      lastContentHeight = resolved;
      if (isCardState(flow.state)) heightByState[flow.state] = resolved;
      return resolved;
    }
    if (isCardState(flow.state) && Number.isFinite(heightByState[flow.state])) return clampFn(heightByState[flow.state], 60, MAX_H - TOP - BOTTOM);
    return clampFn(lastContentHeight, 60, MAX_H - TOP - BOTTOM);
  }

  function buildContent() {
    const flow = getFlow();
    if (flow.state === GS.IDLE) return "";
    if (flow.state === GS.THINKING || flow.state === GS.SENDING) return renderCompactStatus({ type: "loading", label: "·", dotsId: "g-thinking-dots" });
    if (flow.state === GS.DISAMBIGUATE) {
      const layout = layoutDisambiguationContacts(flow.disambiguateContacts || []);
      return renderBubbleCluster({
        phase: disambiguationPhase,
        selectedIndex: flow.sel,
        showOrigin: false,
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
      const contact = flow.contact;
      const hasText = !!String(flow.composeText || "").trim();
      const chipsHtml = renderChipBar({
        chips: (contact?.chips || []).map((chip, idx) => ({ id: String(idx), label: chip.label })),
        selectedIndex: flow.sel,
        navigable: true,
        collapsed: !(flow.showChips && !hasText),
      });
      const inputHtml = renderInputField({ text: flow.composeText, placeholder: "Listening...", hasText });
      const maybeCheckRow = flow.showCheck ? renderActionRow({ actions: [{ id: "confirm", emoji: "✅" }], selectedIndex: 0 }) : "";
      return `<div data-glass-body><div class="g-compose-card">${renderContactHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "" })}${chipsHtml}${inputHtml}${maybeCheckRow}</div></div>`;
    }
    if (flow.state === GS.CONFIRM) {
      const contact = flow.contact;
      return `<div data-glass-body><div class="g-compose-card">${renderContactHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "" })}${renderTextBubble({ text: flow.msg || "", mode: "static", hasText: !!String(flow.msg || "").trim() })}</div></div>`;
    }
    if (flow.state === GS.SENT) return renderCompactStatus({ type: "success", label: "Message sent" });
    return "";
  }

  function render(shouldMorph = true) {
    const flow = getFlow();
    renderToken += 1;
    const token = renderToken;
    const shape = glassStateShape(flow.state);
    const dropMain = document.getElementById("drop-main");
    const enteringDisambiguation = flow.state === GS.DISAMBIGUATE && prevState !== GS.DISAMBIGUATE;
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
    const enteringCompose = flow.state === GS.COMPOSE && prevState !== GS.COMPOSE && !manualComposeEntry;
    prevState = flow.state;
    dropMain?.classList.toggle("disambiguation-surface", flow.active && flow.state === GS.DISAMBIGUATE);
    if (enteringCompose) {
      const field = C.rich.querySelector(".g-listen-field");
      if (field) {
        field.classList.remove("compose-input");
        void field.offsetHeight;
        requestAnimationFrame(() => field.classList.add("compose-input"));
      }
    }
    C.rich.classList.toggle("visible", flow.active);
    C.rich.classList.toggle("glass-active", flow.active);
    C.rich.classList.toggle("glass-sent", flow.active && flow.state === GS.SENT);
    C.rich.classList.toggle("glass-disambiguation", flow.active && flow.state === GS.DISAMBIGUATE);
    C.rich.dataset.glassState = flow.active ? String(flow.state) : "";
    C.rich.style.opacity = flow.active ? "1" : "";
    C.rich.style.transform = (flow.active && flow.state === GS.SENT) ? "translateY(-18px)" : "";
    renderControls();
    cancelMeasure();
    cancelSettle();

    if (flow.active && isCardState(flow.state)) {
      void C.rich.offsetHeight;
      const apply = (force = false) => {
        const geo = dynamicGeo(shape, contentHeightPx());
        const currentGeo = getCurrentMainGeometry() || {};
        if (force || Math.abs(geo.main.h - (Number(currentGeo.h) || 0)) > 1 || Math.abs(geo.main.ty - (Number(currentGeo.ty) || 0)) > 1) {
          morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, geo);
        }
        renderControls();
        positionIntentHeaderAboveMain();
      };
      apply(shouldMorph);
      measureRaf = requestAnimationFrame(() => {
        measureRaf = null;
        if (token !== renderToken || !getFlow().active || !isCardState(getFlow().state)) return;
        apply(false);
      });
      if (shouldMorph) {
        settleTimer = setTimeout(() => {
          settleTimer = null;
          if (token !== renderToken || !getFlow().active || !isCardState(getFlow().state)) return;
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
      renderControls();
    } else if (shouldMorph) {
      morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" });
      renderControls();
    }

    C.prim.style.opacity = flow.active ? "0" : "";
    C.sec.style.opacity = flow.active ? "0" : "";
    C.det.style.opacity = flow.active ? "0" : "";
    C.div.style.opacity = flow.active ? "0" : "";
    C.div.style.display = (flow.active && flow.state === GS.SENT) ? "none" : "";
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
      setSimInputState({ label: "🎤 Voice Dictation", placeholder: "Speak (type to simulate)…", hint: "Auto confirm after 2s silence", dictating: true });
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
        const bubbles = C.rich.querySelectorAll(".g-disambiguation-bubble");
        bubbles.forEach((bubble, idx) => bubble.classList.toggle("selected", idx === flow.sel));
        return bubbles.length > 0;
      }
      if (flow.state === GS.COMPOSE && flow.showChips && !String(flow.composeText || "").trim()) {
        const chips = C.rich.querySelectorAll(".g-chip");
        chips.forEach((chip, idx) => chip.classList.toggle("selected", idx === flow.sel));
        return chips.length > 0;
      }
      if (flow.state === GS.CONFIRM) {
        renderControls();
        return true;
      }
      return false;
    },
  };
}
