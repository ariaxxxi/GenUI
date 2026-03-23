import { createMessageSendRender } from "./message-send-render.js";
import { createMessageSendVoice } from "./message-send-voice.js";

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
  const timers = { pause: null, dots: null, thinking: null, send: null, sent: null, controlsTrack: null };
  let controlsMode = "";
  const voice = createMessageSendVoice({ contacts: CONTACTS });

  function clearTimers() {
    Object.keys(timers).forEach((key) => { if (timers[key]) clearTimeout(timers[key]); timers[key] = null; });
  }

  function speakOutput(text) {
    flow.aiVoice = text;
    ctx.setSimVoice(text);
    ctx.shell.updateOrbLabel();
  }

  function renderControls() {
    const layer = ctx.C.glassControlsLayer;
    if (!layer) return;
    if (!flow.active) {
      layer.innerHTML = "";
      layer.classList.remove("visible");
      controlsMode = "";
      return;
    }
    let mode = "";
    if (flow.state === GS.COMPOSE) mode = "compose";
    else if (flow.state === GS.CONFIRM) mode = "confirm";
    if (!mode) {
      layer.innerHTML = "";
      layer.classList.remove("visible");
      controlsMode = "";
      return;
    }
    if (controlsMode !== mode) {
      layer.innerHTML = mode === "compose"
        ? `<div class="g-glass-controls"><div class="g-checkmark ${flow.showCheck ? "enter" : "hidden"}"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L9 18l10-14"/></svg></div></div>`
        : `<div class="g-glass-controls"><div class="g-action-row enter">${["send", "edit", "cancel"].map((_, i) => `<div class="g-action-btn ${i === flow.sel ? "selected" : ""}">${["✈️", "✊", "❌"][i]}</div>`).join("")}</div></div>`;
      controlsMode = mode;
    } else if (mode === "compose") {
      const mark = layer.querySelector(".g-checkmark");
      if (mark) mark.classList.toggle("hidden", !flow.showCheck);
    } else {
      layer.querySelectorAll(".g-action-btn").forEach((btn, idx) => btn.classList.toggle("selected", idx === flow.sel));
    }
    layer.classList.add("visible");
    const stage = document.getElementById("stage");
    const main = document.getElementById("drop-main");
    const controls = layer.querySelector(".g-glass-controls");
    if (!stage || !main || !controls) return;
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const centerX = (mainRect.left + (mainRect.width / 2)) - stageRect.left;
    const maxTop = Math.max(8, stageRect.height - controlsRect.height - 8);
    const topY = Math.min((mainRect.bottom - stageRect.top) + 14, maxTop);
    controls.style.left = `${Math.round(centerX)}px`;
    controls.style.top = `${Math.round(topY)}px`;
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
    if (flow.state === GS.IDLE || flow.state === GS.DISAMBIGUATE || flow.state === GS.CONFIRM) ctx.voice.voiceEngine.start("command");
    else if (flow.state === GS.COMPOSE) ctx.voice.voiceEngine.start("dictation");
    else ctx.voice.voiceEngine.stop();
  }

  function transitionTo(state, voiceText = "") {
    if (timers.dots) clearInterval(timers.dots);
    timers.dots = null;
    flow.state = state;
    flow.sel = 0;
    speakOutput(voiceText);
    render.render(true);
    applyVoiceMode();
    if (state === GS.THINKING || state === GS.SENDING) {
      let frame = 0;
      timers.dots = setInterval(() => {
        const dots = document.getElementById("g-thinking-dots");
        if (dots) dots.textContent = ["·", "· ·", "· · ·"][frame++ % 3];
      }, 400);
    }
  }

  function reset() {
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
    renderControls();
    render.render(false);
    ctx.morph.morphTo(ctx.getPreFlowShape() || "circle", { icon: "", primary: "", secondary: "", detail: "" });
    ctx.updateActive(ctx.getPreFlowShape() || "circle");
  }

  function beginCompose(contact, voiceText) {
    flow.contact = contact;
    flow.composeText = "";
    flow.msg = "";
    flow.showChips = true;
    flow.showCheck = false;
    transitionTo(GS.COMPOSE, voiceText || "");
    setTimeout(() => ctx.input.focus(), 120);
  }

  function doAction(index) {
    if (index === 0) {
      transitionTo(GS.SENDING, "");
      timers.send = setTimeout(() => {
        transitionTo(GS.SENT, "Sent.");
        ctx.addSimLog(`✓ Delivered to ${flow.contact?.name || "contact"}`, "success");
        timers.sent = setTimeout(() => reset(), 2500);
      }, 900);
      return;
    }
    if (index === 1) {
      flow.showChips = false;
      flow.showCheck = false;
      flow.composeText = flow.msg || flow.composeText;
      transitionTo(GS.COMPOSE, "Edit your message.");
      setTimeout(() => ctx.input.focus(), 120);
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
        transitionTo(GS.CONFIRM, `Confirm message to ${contact.name.split(" ")[0]}.`);
      } else {
        beginCompose(contact, `What would you like to say to ${contact.name.split(" ")[0]}?`);
      }
      return;
    }
    if (flow.state === GS.COMPOSE && flow.showChips && !flow.composeText) {
      const chip = flow.contact?.chips?.[flow.sel];
      if (!chip) return;
      flow.composeText = chip.message;
      flow.msg = chip.message;
      flow.showChips = false;
      flow.showCheck = true;
      render.render(false);
      return;
    }
    if (flow.state === GS.COMPOSE && flow.showCheck) {
      flow.msg = String(flow.composeText || flow.msg || "").trim();
      transitionTo(GS.CONFIRM, `Send to ${flow.contact?.name?.split(" ")[0] || "contact"}?`);
      ctx.input.blur();
      return;
    }
    if (flow.state === GS.CONFIRM) doAction(flow.sel);
  }

  function dismiss() {
    if (flow.state === GS.CONFIRM) {
      flow.showChips = false;
      flow.showCheck = false;
      flow.composeText = flow.msg || flow.composeText;
      transitionTo(GS.COMPOSE, "Edit your message.");
      setTimeout(() => ctx.input.focus(), 120);
      return;
    }
    if (flow.state === GS.COMPOSE || flow.state === GS.DISAMBIGUATE) reset();
  }

  function handleInputChange(value) {
    const text = String(value || "");
    flow.composeText = text;
    if (text.trim()) {
      flow.showChips = false;
      flow.showCheck = false;
      if (timers.pause) clearTimeout(timers.pause);
      timers.pause = setTimeout(() => {
        if (!flow.active || flow.state !== GS.COMPOSE) return;
        flow.showCheck = true;
        flow.msg = flow.composeText.trim();
        render.render(false);
      }, 2000);
    } else {
      flow.showChips = true;
      flow.showCheck = false;
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
            transitionTo(GS.CONFIRM, `Confirm message to ${fallback[0].name.split(" ")[0]}.`);
          } else {
            beginCompose(fallback[0], `Message to ${fallback[0].name.split(" ")[0]}. What would you like to say?`);
          }
        } else if (fallback.length > 1) {
          flow.disambiguateContacts = fallback;
          flow._pendingMsg = msg;
          transitionTo(GS.DISAMBIGUATE, "Which Hiro?");
        } else {
          speakOutput("Contact not found.");
          reset();
        }
      }, 1000);
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
      if (idx >= 0) { flow.sel = idx; render.updateSelectionUiOnly(); setTimeout(() => confirm(), 240); }
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
    clearTimers();
    flow.active = true;
    flow.state = GS.IDLE;
    flow.sel = 0;
    flow.contact = null;
    flow.msg = "";
    flow.composeText = "";
    flow.showChips = true;
    flow.showCheck = false;
    flow.disambiguateContacts = CONTACTS.filter((contact) => contact.name.toLowerCase().includes("hiro"));
    render.render(true);
    setTimeout(() => { ctx.input.focus(); ctx.voice.voiceEngine.start("command"); }, 50);
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
