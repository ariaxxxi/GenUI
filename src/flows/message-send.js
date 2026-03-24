import { createMessageSendRender } from "./message-send-render.js";
import { createMessageSendVoice } from "./message-send-voice.js";
import { phrase } from "../ai/phrases.js";

const CONTACTS = [
  { id: 1, name: "Hiro Tanaka", initials: "HT", relation: "Colleague · Design", chips: [
    { label: "Design review", message: "Hey, do you have time for a design review sometime?" },
    { label: "Share a file", message: "I have a file to share with you — when's a good time?" },
    { label: "Schedule a sync", message: "Want to schedule a quick sync this week?" },
  ]},
  { id: 2, name: "Hiro Horri", initials: "HH", relation: "Friend", chips: [
    { label: "What's up?", message: "Hey! What's up? Haven't caught up in a while." },
    { label: "Lunch this week?", message: "Hey, want to grab lunch sometime this week?" },
    { label: "Check this out", message: "Hey, I found something cool I wanted to share with you!" },
  ]},
];

export function createMessageSendFlow(ctx) {
  const GS = { IDLE: 0, THINKING: 1, DISAMBIGUATE: 2, COMPOSE: 3, CONFIRM: 4, SENDING: 5, SENT: 6 };
  const flow = { active: false, state: GS.IDLE, sel: 0, contact: null, msg: "", composeText: "", showChips: true, showCheck: false, aiVoice: "", disambiguateContacts: [], interimText: "", _pendingMsg: "" };
  const timers = { pause: null, dots: null, thinking: null, send: null, sent: null, controlsTrack: null, controlsExit: null };
  let controlsMode = "";
  const voice = createMessageSendVoice({ contacts: CONTACTS });
  const controlsGap = 14;
  let flowEpoch = 0;

  function isEpochAlive(epoch) {
    return epoch === flowEpoch && flow.active;
  }

  function clearTimers() {
    Object.keys(timers).forEach((key) => {
      if (!timers[key]) return;
      if (key === "controlsTrack") cancelAnimationFrame(timers[key]);
      else clearTimeout(timers[key]);
      timers[key] = null;
    });
  }

  function speakOutput(text) {
    flow.aiVoice = text;
    ctx.setSimVoice(text);
    ctx.shell.updateOrbLabel();
  }

  function cancelControlsTracking() {
    if (!timers.controlsTrack) return;
    cancelAnimationFrame(timers.controlsTrack);
    timers.controlsTrack = null;
  }

  function positionControlsOverlay() {
    const layer = ctx.C.glassControlsLayer;
    const stage = document.getElementById("stage");
    const main = document.getElementById("drop-main");
    const controls = layer?.querySelector(".g-glass-controls");
    if (!layer || !stage || !main || !controls) return false;
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const centerX = (mainRect.left + (mainRect.width / 2)) - stageRect.left;
    const unclampedTop = (mainRect.bottom - stageRect.top) + controlsGap;
    const maxTop = Math.max(8, stageRect.height - controlsRect.height - 8);
    const topY = Math.min(unclampedTop, maxTop);
    controls.style.left = `${Math.round(centerX)}px`;
    controls.style.top = `${Math.round(topY)}px`;
    return true;
  }

  function trackControlsForTransition(ms) {
    cancelControlsTracking();
    const root = getComputedStyle(document.documentElement);
    const fallbackMs = Number.isFinite(ms) ? ms : (parseFloat(root.getPropertyValue("--anim-t")) || 450) + 120;
    const end = performance.now() + Math.max(120, fallbackMs);
    const tick = () => {
      if (!flow.active || !ctx.C.glassControlsLayer?.classList.contains("visible")) return;
      positionControlsOverlay();
      if (performance.now() < end) timers.controlsTrack = requestAnimationFrame(tick);
      else timers.controlsTrack = null;
    };
    timers.controlsTrack = requestAnimationFrame(tick);
  }

  function renderControls() {
    const layer = ctx.C.glassControlsLayer;
    if (!layer) return;
    if (timers.controlsExit) {
      const pendingMode = flow.active ? (flow.state === GS.COMPOSE ? "compose" : flow.state === GS.CONFIRM ? "confirm" : "") : "";
      if (pendingMode === "confirm") {
        clearTimeout(timers.controlsExit);
        timers.controlsExit = null;
      } else {
        return;
      }
    }
    if (!flow.active) {
      layer.innerHTML = "";
      layer.classList.remove("visible");
      controlsMode = "";
      cancelControlsTracking();
      return;
    }
    let mode = "";
    if (flow.state === GS.COMPOSE) mode = "compose";
    else if (flow.state === GS.CONFIRM) mode = "confirm";
    if (!mode) {
      if (controlsMode === "confirm") {
        const row = layer.querySelector(".g-action-row");
        if (row && !row.classList.contains("exit")) {
          row.classList.add("exit");
          cancelControlsTracking();
          timers.controlsExit = setTimeout(() => {
            timers.controlsExit = null;
            renderControls();
          }, 220);
          return;
        }
      }
      layer.innerHTML = "";
      layer.classList.remove("visible");
      controlsMode = "";
      cancelControlsTracking();
      return;
    }
    if (controlsMode === "confirm" && mode !== "confirm") {
      const row = layer.querySelector(".g-action-row");
      if (row && !row.classList.contains("exit")) {
        row.classList.add("exit");
        cancelControlsTracking();
        timers.controlsExit = setTimeout(() => {
          timers.controlsExit = null;
          controlsMode = "";
          renderControls();
        }, 220);
        return;
      }
    }
    if (controlsMode !== mode) {
      layer.innerHTML = mode === "compose"
        ? `<div class="g-glass-controls"><div class="g-checkmark ${flow.showCheck ? "enter" : "hidden"}"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L9 18l10-14"/></svg></div></div>`
        : `<div class="g-glass-controls"><div class="g-action-row enter">${[
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="2,18 19,10 2,2 2,8 14,10 2,12"/></svg>`,
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg>`,
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>`,
        ].map((icon, i) => `<div class="g-action-btn ${i === flow.sel ? "selected" : ""}">${icon}</div>`).join("")}</div></div>`;
      controlsMode = mode;
    } else if (mode === "compose") {
      const mark = layer.querySelector(".g-checkmark");
      if (mark) mark.classList.toggle("hidden", !flow.showCheck);
    } else {
      layer.querySelectorAll(".g-action-btn").forEach((btn, idx) => btn.classList.toggle("selected", idx === flow.sel));
    }
    layer.classList.add("visible");
    if (!positionControlsOverlay()) {
      layer.classList.remove("visible");
      cancelControlsTracking();
      return;
    }
    if (flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && flow.showCheck)) {
      trackControlsForTransition();
    } else {
      cancelControlsTracking();
    }
  }

  function forceControlsRebuild() {
    controlsMode = "";
  }

  const render = createMessageSendRender({
    document,
    SHAPES: ctx.SHAPES,
    C: ctx.C,
    GS,
    getFlow: () => flow,
    morphTo: ctx.morph.morphTo,
    getCurrentMainGeometry: ctx.morph.getCurrentMainGeometry,
    setIntentHeader: ctx.shell.setIntentHeader,
    hideIntentHeader: ctx.shell.hideIntentHeader,
    positionIntentHeaderAboveMain: ctx.shell.positionIntentHeaderAboveMain,
    trackIntentHeaderForTransition: ctx.shell.trackIntentHeaderForTransition,
    renderControls,
    updateOrbLabel: ctx.shell.updateOrbLabel,
    setSimInputState: ctx.setSimInputState,
    clamp: ctx.clamp,
  });

  function maxSel() {
    if (flow.state === GS.DISAMBIGUATE) return Math.max(0, flow.disambiguateContacts.length - 1);
    if (flow.state === GS.COMPOSE && flow.showChips && !flow.composeText) return Math.max(0, (flow.contact?.chips || []).length - 1);
    if (flow.state === GS.CONFIRM) return 2;
    return 0;
  }

  function applyVoiceMode() {
    const dropMain = document.getElementById("drop-main");
    if (flow.state === GS.IDLE || flow.state === GS.DISAMBIGUATE || flow.state === GS.CONFIRM) {
      ctx.voice.voiceEngine.start("command");
      if (flow.state === GS.DISAMBIGUATE) {
        if (dropMain) dropMain.style.boxShadow = "";
      } else {
        if (dropMain) dropMain.style.boxShadow = "";
      }
    } else if (flow.state === GS.COMPOSE) {
      if (dropMain) dropMain.style.boxShadow = "";
      ctx.voice.voiceEngine.start("dictation");
    } else {
      if (dropMain) dropMain.style.boxShadow = "";
      ctx.voice.voiceEngine.stop();
    }
  }

  function transitionTo(state, voiceText = "") {
    if (timers.dots) clearInterval(timers.dots);
    timers.dots = null;
    if (flow.state === GS.COMPOSE && state !== GS.COMPOSE) {
      const field = ctx.C.rich?.querySelector(".g-listen-field.compose-input");
      if (field) {
        field.classList.remove("compose-input");
        setTimeout(() => {
          flow.state = state;
          flow.sel = 0;
          speakOutput(voiceText);
          render.render(true);
          applyVoiceMode();
          if (state === GS.THINKING) {
            const glow = document.getElementById("home-glow-layer");
            if (glow) {
              glow.style.boxShadow = "";
              glow.style.opacity = "";
            }
            const dropMain = document.getElementById("drop-main");
            if (dropMain) dropMain.style.boxShadow = "";
          }
          if (state === GS.THINKING || state === GS.SENDING) {
            let frame = 0;
            timers.dots = setInterval(() => {
              const dots = document.getElementById("g-thinking-dots");
              if (dots) dots.textContent = ["·", "· ·", "· · ·"][frame++ % 3];
            }, 400);
          }
        }, 380);
        return;
      }
    }
    flow.state = state;
    flow.sel = 0;
    speakOutput(voiceText);
    render.render(true);
    applyVoiceMode();
    if (state === GS.THINKING) {
      const glow = document.getElementById("home-glow-layer");
      if (glow) {
        glow.style.boxShadow = "";
        glow.style.opacity = "";
      }
      const dropMain = document.getElementById("drop-main");
      if (dropMain) dropMain.style.boxShadow = "";
    }
    if (state === GS.THINKING || state === GS.SENDING) {
      let frame = 0;
      timers.dots = setInterval(() => {
        const dots = document.getElementById("g-thinking-dots");
        if (dots) dots.textContent = ["·", "· ·", "· · ·"][frame++ % 3];
      }, 400);
    }
  }

  function reset() {
    flowEpoch += 1;
    clearTimers();
    ctx.voice.voiceEngine.stop();
    flow.active = false;
    flow.state = GS.IDLE;
    flow.sel = 0;
    flow.contact = null;
    flow.msg = "";
    flow.composeText = "";
    flow.showChips = true;
    flow.showCheck = false;
    flow.aiVoice = "";
    flow.interimText = "";
    flow._pendingMsg = "";
    speakOutput("");
    if (ctx.C?.rich) {
      ctx.C.rich.innerHTML = "";
      ctx.C.rich.classList.remove("visible", "glass-active", "glass-sent");
      ctx.C.rich.dataset.glassState = "";
      ctx.C.rich.style.opacity = "";
      ctx.C.rich.style.transform = "";
    }
    document.body.classList.remove("glass-flow-active");
    if (ctx.C?.glassControlsLayer) {
      ctx.C.glassControlsLayer.innerHTML = "";
      ctx.C.glassControlsLayer.classList.remove("visible");
    }
    ctx.shell.hideIntentHeader?.();
    renderControls();
    render.render(false);
    if (typeof ctx.returnToHomeContext === "function") {
      ctx.returnToHomeContext();
    } else {
      ctx.morph.morphTo(ctx.getPreFlowShape() || "circle", { icon: "", primary: "", secondary: "", detail: "" });
      ctx.updateActive(ctx.getPreFlowShape() || "circle");
    }
  }

  function animateToCompose(contact, voiceText) {
    const epoch = flowEpoch;
    const intentHeader = document.getElementById("intent-header");
    if (intentHeader) {
      intentHeader.classList.remove("visible");
      intentHeader.classList.add("exiting");
    }

    const rows = ctx.C.rich.querySelectorAll(".g-contact-row");
    rows.forEach((el, i) => {
      el.style.animationDelay = `${i * 25}ms`;
      el.classList.add("g-row-exit");
    });

    flow.contact = contact;
    flow.composeText = "";
    flow.msg = "";
    flow.showChips = true;
    flow.showCheck = false;
    flow.state = GS.COMPOSE;
    flow.sel = 0;
    render.setManualComposeEntry(true);
    const dropMain = document.getElementById("drop-main");
    if (dropMain) dropMain.style.boxShadow = "";
    ctx.voice.voiceEngine.start("dictation");

    let layer = document.getElementById("glass-measure-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "glass-measure-layer";
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:380px;visibility:hidden;pointer-events:none;z-index:-1;";
      document.body.appendChild(layer);
    }
    layer.innerHTML = render.buildContent();
    const measureBody = layer.querySelector("[data-glass-body]");
    const rawHeight = measureBody
      ? Math.ceil(Math.max(measureBody.getBoundingClientRect().height || 0, measureBody.offsetHeight || 0, measureBody.scrollHeight || 0))
      : 0;
    const contentHeight = rawHeight > 0 ? ctx.clamp(rawHeight, 60, 380) : render.contentHeightPx();
    const shape = render.glassStateShape(GS.COMPOSE);
    const geo = render.dynamicGeo(shape, contentHeight);
    ctx.morph.morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, geo);

    setTimeout(() => {
      if (!isEpochAlive(epoch)) return;
      render.setManualComposeEntry(false);
      ctx.C.rich.innerHTML = render.buildContent();
      ctx.C.rich.classList.add("glass-active", "visible");
      ctx.C.rich.dataset.glassState = String(GS.COMPOSE);
      ctx.C.rich.style.opacity = "1";
      render.markStateCommitted();

      const header = ctx.C.rich.querySelector(".g-card-header");
      if (header) header.style.opacity = "0";
      const chipsWrap = ctx.C.rich.querySelector(".g-chips-wrap");
      if (chipsWrap) chipsWrap.style.opacity = "0";
      const field = ctx.C.rich.querySelector(".g-listen-field");
      if (field) {
        field.style.opacity = "0";
        field.classList.remove("compose-input");
      }

      renderControls();

      setTimeout(() => {
        if (!isEpochAlive(epoch)) return;
        const header2 = ctx.C.rich.querySelector(".g-card-header");
        if (header2) {
          header2.style.opacity = "";
          header2.classList.add("header-enter");
        }
      }, 60);

      setTimeout(() => {
        if (!isEpochAlive(epoch)) return;
        const wrap = ctx.C.rich.querySelector(".g-chips-wrap");
        if (wrap) wrap.style.opacity = "";
        const chips = ctx.C.rich.querySelectorAll(".g-chip");
        chips.forEach((el, i) => {
          el.style.animationDelay = `${i * 70}ms`;
          el.classList.add("chip-enter");
        });
      }, 160);

      setTimeout(() => {
        if (!isEpochAlive(epoch)) return;
        const field1 = ctx.C.rich.querySelector(".g-listen-field");
        if (!field1) return;
        field1.style.opacity = "";
        field1.classList.add("field-enter");

        setTimeout(() => {
          if (!isEpochAlive(epoch)) return;
          const field2 = ctx.C.rich.querySelector(".g-listen-field");
          if (!field2) return;
          field2.classList.remove("compose-input");
          void field2.offsetHeight;
          requestAnimationFrame(() => field2.classList.add("compose-input"));
        }, 100);
      }, 240);
    }, 220);

    speakOutput(voiceText || "");
    setTimeout(() => { if (isEpochAlive(epoch)) ctx.input.focus(); }, 500);
  }

  function beginCompose(contact, voiceText) {
    animateToCompose(contact, voiceText);
  }

  function selectChipWithAnimation(idx) {
    const epoch = flowEpoch;
    const chip = flow.contact?.chips?.[idx];
    if (!chip) return;

    ctx.addSimLog(`Chip: "${chip.label}"`, "action");
    flow.composeText = chip.message;
    flow.msg = chip.message;
    flow.showChips = false;
    flow.showCheck = false;

    const chipEls = ctx.C.rich.querySelectorAll(".g-chip");
    chipEls.forEach((el, i) => {
      const delay = i === idx ? 0 : 40 + Math.abs(i - idx) * 30;
      el.style.animationDelay = `${delay}ms`;
      el.classList.add("g-chip-exit");
    });
    const wrap = ctx.C.rich.querySelector(".g-chips-wrap");
    if (wrap) wrap.classList.add("collapsed");
    const empty = ctx.C.rich.querySelector(".g-listen-empty");
    if (empty) {
      empty.style.transition = "opacity 300ms ease";
      empty.style.opacity = "0";
    }

    const shape = render.glassStateShape(flow.state);
    const geo = render.dynamicGeo(shape, render.contentHeightPx());
    const cur = ctx.morph.getCurrentMainGeometry() || {};
    if (Math.abs(geo.main.h - (Number(cur.h) || 0)) > 1 || Math.abs(geo.main.ty - (Number(cur.ty) || 0)) > 1) {
      ctx.morph.morphTo(shape, { icon: "", primary: "", secondary: "", detail: "" }, geo);
    }

    setTimeout(() => {
      if (!isEpochAlive(epoch)) return;
      const field = ctx.C.rich.querySelector(".g-listen-field");
      if (!field) return;
      field.dataset.pulseLock = "1";
      field.classList.add("has-text");
      const old = field.querySelector(".g-listen-empty");
      const textEl = document.createElement("div");
      textEl.className = "g-listen-text g-text-magic";
      textEl.textContent = chip.message;
      if (old) old.replaceWith(textEl);
      else field.appendChild(textEl);
      field.classList.remove("text-arriving");
      void field.offsetHeight;
      field.classList.add("text-arriving");
      setTimeout(() => {
        if (!isEpochAlive(epoch)) return;
        delete field.dataset.pulseLock;
      }, 920);
    }, 300);

    setTimeout(() => {
      if (!isEpochAlive(epoch)) return;
      flow.showCheck = true;
      forceControlsRebuild();
      renderControls();
      const shape2 = render.glassStateShape(flow.state);
      const geo2 = render.dynamicGeo(shape2, render.contentHeightPx());
      ctx.morph.morphTo(shape2, { icon: "", primary: "", secondary: "", detail: "" }, geo2);
    }, 560);
  }

  function doAction(index) {
    const epoch = flowEpoch;
    if (index === 0) {
      transitionTo(GS.SENDING, "");
      timers.send = setTimeout(() => {
        if (!isEpochAlive(epoch)) return;
        transitionTo(GS.SENT, "");
        if (typeof ctx.playEarcon === "function") ctx.playEarcon("sent");
        ctx.addSimLog(`✓ Delivered to ${flow.contact?.name || "contact"}`, "success");
        timers.sent = setTimeout(() => reset(), 2500);
      }, 900);
      return;
    }
    if (index === 1) {
    flow.showChips = false;
    flow.showCheck = !!String(flow.composeText || "").trim();
    flow.composeText = flow.msg || flow.composeText;
      transitionTo(GS.COMPOSE, phrase("edit_message"));
      setTimeout(() => { if (isEpochAlive(epoch)) ctx.input.focus(); }, 120);
      return;
    }
    reset();
  }

  function confirm() {
    if (flow.state === GS.DISAMBIGUATE) {
      const contact = flow.disambiguateContacts[flow.sel];
      if (!contact) return;
      const pending = flow._pendingMsg || "";
      flow._pendingMsg = "";
      if (pending) {
        flow.contact = contact;
        flow.msg = pending;
        flow.composeText = pending;
        flow.showChips = false;
        flow.showCheck = true;
        transitionTo(GS.CONFIRM, phrase("confirm_message_to", { name: contact.name.split(" ")[0] }));
      } else {
        beginCompose(contact, phrase("compose_prompt"));
      }
      return;
    }
    if (flow.state === GS.COMPOSE && flow.showChips && !flow.composeText) {
      selectChipWithAnimation(flow.sel);
      return;
    }
    if (flow.state === GS.COMPOSE && flow.showCheck) {
      flow.msg = String(flow.composeText || flow.msg || "").trim();
      transitionTo(GS.CONFIRM, phrase("confirm_ready_send"));
      ctx.input.blur();
      return;
    }
    if (flow.state === GS.CONFIRM) doAction(flow.sel);
  }

  function dismiss() {
    const epoch = flowEpoch;
    if (flow.state === GS.CONFIRM) {
      flow.showChips = false;
      flow.showCheck = !!String(flow.composeText || "").trim();
      flow.composeText = flow.msg || flow.composeText;
      transitionTo(GS.COMPOSE, phrase("edit_message"));
      setTimeout(() => { if (isEpochAlive(epoch)) ctx.input.focus(); }, 120);
      return;
    }
    if (flow.state === GS.COMPOSE || flow.state === GS.DISAMBIGUATE) reset();
  }

  function handleInputChange(value) {
    const text = String(value || "");
    flow.composeText = text;
    if (timers.pause) {
      clearTimeout(timers.pause);
      timers.pause = null;
    }
    if (text.trim()) {
      flow.showChips = false;
      flow.showCheck = true;
      flow.msg = text.trim();
    } else {
      flow.showChips = true;
      flow.showCheck = false;
      flow.msg = "";
    }
    render.render(false);
  }

  async function handleInputSubmit(text) {
    const value = String(text || "").trim();
    if (!value) return;
    ctx.addSimLog(value, "user");
    if (flow.state === GS.COMPOSE) {
      flow.composeText = value;
      flow.msg = value;
      flow.showChips = false;
      flow.showCheck = true;
      render.render(false);
      ctx.input.blur();
      return;
    }
    const voiceAction = voice.parseComposeVoice(value, { ...flow, GS });
    if (voiceAction) {
      if (voiceAction.type === "action") doAction(voiceAction.index);
      if (voiceAction.type === "select-contact") { flow.sel = voiceAction.index; confirm(); }
      if (voiceAction.type === "select-chip") { flow.sel = voiceAction.index; confirm(); }
      return;
    }
    if (flow.state === GS.IDLE || flow.state === GS.DISAMBIGUATE) {
      transitionTo(GS.THINKING, "");
      const intent = await voice.parseIntent(value);
      const matches = voice.findContacts(intent.recipient, value);
      timers.thinking = setTimeout(() => {
        const fallback = matches.length ? matches : CONTACTS.filter((contact) => contact.name.toLowerCase().includes("hiro"));
        const msg = intent.messageBody || "";
        if (fallback.length === 1) {
          if (msg) {
            flow.contact = fallback[0];
            flow.msg = msg;
            flow.composeText = msg;
            flow.showChips = false;
            flow.showCheck = true;
            transitionTo(GS.CONFIRM, phrase("confirm_message_to", { name: fallback[0].name.split(" ")[0] }));
          } else {
            beginCompose(fallback[0], phrase("compose_prompt"));
          }
        } else if (fallback.length > 1) {
          flow.disambiguateContacts = fallback;
          flow._pendingMsg = msg;
          transitionTo(GS.DISAMBIGUATE, phrase("disambiguate_found_two"));
        } else {
          speakOutput(phrase("contact_not_found"));
          reset();
        }
      }, 0);
    }
  }

  function onTranscriptUpdate(text, isFinal = false) {
    if (!flow.active) return;
    if (flow.state === GS.IDLE) {
      flow.interimText = isFinal ? "" : text;
      ctx.shell.updateOrbLabel();
      if (isFinal && text) void handleInputSubmit(text);
      return;
    }
    if (flow.state === GS.DISAMBIGUATE && isFinal && text) {
      const idx = voice.parseDisambiguateVoice(text, flow.disambiguateContacts);
      if (idx >= 0) {
        const epoch = flowEpoch;
        flow.sel = idx;
        render.updateSelectionUiOnly();
        setTimeout(() => { if (isEpochAlive(epoch)) confirm(); }, 240);
      }
      return;
    }
    if (flow.state === GS.COMPOSE) {
      handleInputChange(text);
      return;
    }
    if (flow.state === GS.CONFIRM && isFinal && text) {
      const action = voice.parseComposeVoice(text, { ...flow, GS });
      if (action?.type === "action") doAction(action.index);
    }
  }

  function start() {
    flowEpoch += 1;
    const epoch = flowEpoch;
    clearTimers();
    flow.active = true;
    flow.state = GS.IDLE;
    flow.sel = 0;
    flow.contact = null;
    flow.msg = "";
    flow.composeText = "";
    flow.interimText = "";
    flow.showChips = true;
    flow.showCheck = false;
    flow.disambiguateContacts = CONTACTS.filter((contact) => contact.name.toLowerCase().includes("hiro"));
    if (ctx.input) ctx.input.value = "";
    render.render(true);
    setTimeout(() => {
      if (!isEpochAlive(epoch)) return;
      ctx.input.focus();
      ctx.voice.voiceEngine.start("command");
    }, 50);
  }

  return {
    GS,
    contacts: CONTACTS,
    voice,
    flow,
    start,
    reset,
    dismiss,
    confirm,
    isActive: () => flow.active,
    maxSel,
    render: (shouldMorph = true) => render.render(shouldMorph),
    updateSelectionUiOnly: () => render.updateSelectionUiOnly(),
    handleInputChange,
    handleInputSubmit,
    onTranscriptUpdate,
  };
}
