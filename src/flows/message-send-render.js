import { composeScreen, renderScreenMarkup } from "../shared/screen-composer.js";

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
  const heightByState = { [GS.DISAMBIGUATE]: 160, [GS.COMPOSE]: 240, [GS.CONFIRM]: 180 };
  let measureRaf = null;
  let settleTimer = null;
  let renderToken = 0;
  let prevState = GS.IDLE;
  let manualComposeEntry = false;

  function glassStateShape(state) {
    if (state === GS.IDLE) return "listening";
    if (state === GS.THINKING || state === GS.SENDING) return "magic";
    if (state === GS.DISAMBIGUATE) return "card-list";
    if (state === GS.COMPOSE) return "card-form";
    if (state === GS.CONFIRM) return "card";
    if (state === GS.SENT) return "pill";
    return "circle";
  }

  function isCardState(state = getFlow().state) {
    return state === GS.DISAMBIGUATE || state === GS.COMPOSE || state === GS.CONFIRM;
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

  function buildScreenSpec() {
    const flow = getFlow();
    if (flow.state === GS.IDLE) return { layout: [] };
    if (flow.state === GS.THINKING || flow.state === GS.SENDING) {
      return {
        layout: ["compact_status"],
        props: {
          compact_status: { type: "loading", label: "·", dotsId: "g-thinking-dots" },
        },
      };
    }
    if (flow.state === GS.DISAMBIGUATE) {
      return {
        intentHeader: "Which Hiro?",
        layout: ["selection_list"],
        wrapBody: true,
        props: {
          selection_list: {
            selectedIndex: flow.sel,
            items: flow.disambiguateContacts.map((contact) => ({
              title: contact.name,
              initials: contact.initials,
              avatar: contact.avatar,
            })),
          },
        },
        actions: [],
      };
    }
    if (flow.state === GS.COMPOSE) {
      const contact = flow.contact;
      const hasText = !!String(flow.composeText || "").trim();
      const layout = ["contact_header"];
      if (flow.showChips && !hasText) layout.push("chip_bar");
      layout.push("input_field");
      return {
        layout,
        wrapBody: true,
        bodyClass: "g-compose-card",
        props: {
          contact_header: {
            avatar: contact?.avatar,
            initials: contact?.initials,
            name: contact?.name || "",
          },
          chip_bar: {
            chips: (contact?.chips || []).map((chip, idx) => ({ id: String(idx), label: chip.label })),
            selectedIndex: flow.sel,
            navigable: true,
            collapsed: false,
          },
          input_field: {
            text: flow.composeText,
            placeholder: "Listening...",
            hasText,
          },
        },
        actions: flow.showCheck ? [{ id: "confirm", emoji: "✅" }] : [],
        actionSelectedIndex: 0,
      };
    }
    if (flow.state === GS.CONFIRM) {
      const contact = flow.contact;
      return {
        layout: ["contact_header", "text_bubble"],
        wrapBody: true,
        bodyClass: "g-compose-card",
        props: {
          contact_header: {
            avatar: contact?.avatar,
            initials: contact?.initials,
            name: contact?.name || "",
          },
          text_bubble: {
            text: flow.msg || "",
            mode: "static",
            hasText: !!String(flow.msg || "").trim(),
          },
        },
        actions: [
          { id: "send", iconHtml: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="2,18 19,10 2,2 2,8 14,10 2,12"/></svg>` },
          { id: "edit", iconHtml: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg>` },
          { id: "cancel", iconHtml: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>` },
        ],
        actionSelectedIndex: flow.sel,
      };
    }
    if (flow.state === GS.SENT) {
      return {
        layout: ["compact_status"],
        props: {
          compact_status: { type: "success", label: "Message sent" },
        },
      };
    }
    return { layout: [] };
  }

  function buildContent() {
    return renderScreenMarkup(buildScreenSpec());
  }

  function render(shouldMorph = true) {
    const flow = getFlow();
    renderToken += 1;
    const token = renderToken;
    const shape = glassStateShape(flow.state);
    document.body.classList.toggle("glass-flow-active", flow.active);
    const screenSpec = buildScreenSpec();
    composeScreen({
      documentRef: document,
      richRoot: C.rich,
      setIntentHeader,
      hideIntentHeader,
      positionIntentHeaderAboveMain,
      trackIntentHeaderForTransition,
      spec: screenSpec,
    });
    const enteringCompose = flow.state === GS.COMPOSE && prevState !== GS.COMPOSE && !manualComposeEntry;
    prevState = flow.state;
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
    C.rich.dataset.glassState = flow.active ? String(flow.state) : "";
    C.rich.style.opacity = flow.active ? "1" : "";
    C.rich.style.transform = (flow.active && flow.state === GS.SENT) ? "translateY(-18px)" : "";
    renderControls(screenSpec);
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
        renderControls(screenSpec);
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

    C.prim.style.opacity = flow.active ? "0" : "";
    C.sec.style.opacity = flow.active ? "0" : "";
    C.det.style.opacity = flow.active ? "0" : "";
    C.div.style.opacity = flow.active ? "0" : "";
    C.div.style.display = (flow.active && flow.state === GS.SENT) ? "none" : "";
    const glow = document.getElementById("home-glow-layer");
    if (glow) glow.style.opacity = "";
    updateOrbLabel();

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
    buildScreenSpec,
    buildContent,
    render,
    setManualComposeEntry(flag) {
      manualComposeEntry = !!flag;
    },
    markStateCommitted() {
      prevState = getFlow().state;
    },
    updateSelectionUiOnly() {
      const flow = getFlow();
      if (!flow.active) return false;
      if (flow.state === GS.DISAMBIGUATE) {
        const rows = C.rich.querySelectorAll(".g-contact-row");
        rows.forEach((row, idx) => row.classList.toggle("selected", idx === flow.sel));
        return rows.length > 0;
      }
      if (flow.state === GS.COMPOSE && flow.showChips && !String(flow.composeText || "").trim()) {
        const chips = C.rich.querySelectorAll(".g-chip");
        chips.forEach((chip, idx) => chip.classList.toggle("selected", idx === flow.sel));
        return chips.length > 0;
      }
      if (flow.state === GS.CONFIRM) {
        renderControls(buildScreenSpec());
        return true;
      }
      return false;
    },
  };
}
