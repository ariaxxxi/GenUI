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
    const controlsLift = (shape === "card" || (shape === "card-form" && flow.showCheck)) ? CONTROLS_LIFT : 0;
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

  function buildContent() {
    const flow = getFlow();
    if (flow.state === GS.IDLE) return "";
    if (flow.state === GS.THINKING || flow.state === GS.SENDING) return '<div class="g-center-row"><div class="g-spinner"></div><span id="g-thinking-dots">·</span></div>';
    if (flow.state === GS.DISAMBIGUATE) {
      const rows = flow.disambiguateContacts.map((contact, i) => `<div class="g-contact-row ${i === flow.sel ? "selected" : ""}" data-g-contact="${i}"><div class="g-ava">${contact.avatar ? `<img src="${contact.avatar}" alt="${contact.name}" class="g-ava-img"/>` : contact.initials}</div><div class="g-contact-name">${contact.name}</div></div>`).join("");
      return `<div data-glass-body><div class="g-card-list">${rows}</div></div>`;
    }
    if (flow.state === GS.COMPOSE) {
      const contact = flow.contact;
      const chips = (contact?.chips || []).map((chip, i) => `<div class="g-chip ${i === flow.sel ? "selected" : ""}">${chip.label}</div>`).join("");
      const hasText = !!String(flow.composeText || "").trim();
      const avaContent = contact?.avatar ? `<img src="${contact.avatar}" alt="${contact.name}" class="g-ava-img"/>` : (contact?.initials || "");
      return `<div data-glass-body><div class="g-compose-card"><div class="g-card-header"><div class="g-ava">${avaContent}</div><div class="g-to-text">To: <span class="g-to-name">${contact.name}</span></div></div><div class="g-chips-wrap ${flow.showChips && !hasText ? "" : "collapsed"}"><div class="g-chips">${chips}</div></div><div class="g-listen-field compose-input ${hasText ? "has-text" : ""}">${hasText ? `<div class="g-listen-text">${flow.composeText}</div>` : '<div class="g-listen-empty">Listening...</div>'}</div></div></div>`;
    }
    if (flow.state === GS.CONFIRM) {
      const contact = flow.contact;
      const avaContent = contact?.avatar ? `<img src="${contact.avatar}" alt="${contact.name}" class="g-ava-img"/>` : (contact?.initials || "");
      return `<div data-glass-body><div class="g-compose-card"><div class="g-card-header"><div class="g-ava">${avaContent}</div><div class="g-to-text">To: <span class="g-to-name">${contact.name}</span></div></div><div class="g-listen-field" style="box-shadow:inset 0 1px 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.02);"><div class="g-listen-text">${flow.msg || ""}</div></div></div></div>`;
    }
    if (flow.state === GS.SENT) return '<div data-glass-sent class="g-sent-toast"><span class="g-sent-emoji">✅</span><span>Message sent</span></div>';
    return "";
  }

  function render(shouldMorph = true) {
    const flow = getFlow();
    renderToken += 1;
    const token = renderToken;
    const shape = glassStateShape(flow.state);
    document.body.classList.toggle("glass-flow-active", flow.active);
    C.rich.innerHTML = buildContent();
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

    if (flow.active && flow.state === GS.DISAMBIGUATE) {
      setIntentHeader("Which Hiro?", null);
      const hdr = document.getElementById("intent-header");
      if (hdr) hdr.classList.add("glass-intent");
      positionIntentHeaderAboveMain();
      trackIntentHeaderForTransition();
    } else {
      hideIntentHeader();
    }

    if (!flow.active || flow.state === GS.IDLE) {
      setSimInputState({ label: "Voice Command", placeholder: "Send a message to Hiro…", hint: "", dictating: false });
    } else if (flow.state === GS.THINKING || flow.state === GS.SENDING) {
      setSimInputState({ label: "Voice Command", placeholder: "", hint: "", dictating: false });
    } else if (flow.state === GS.DISAMBIGUATE) {
      setSimInputState({ label: "Voice Command", placeholder: 'Say a name, e.g. "Tanaka"', hint: "", dictating: false });
    } else if (flow.state === GS.COMPOSE) {
      setSimInputState({ label: "🎤 Voice Dictation", placeholder: "Speak (type to simulate)…", hint: 'Keep talking to edit · say "send"', dictating: true });
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
        renderControls();
        return true;
      }
      return false;
    },
  };
}
