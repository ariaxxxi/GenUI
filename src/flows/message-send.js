import { createMessageSendRender } from "./message-send-render.js";
import { createMessageSendVoice } from "./message-send-voice.js";
import { composeScreen } from "../shared/screen-composer.js";
import { phrase } from "../ai/phrases.js";
import { positionControlsOverlay } from "../shared/flow-toast.js";

const CONTACTS = [
  { id: 1, name: "Hiro Tanaka", initials: "HT", relation: "Colleague · Design", avatar: "src/assets/avatar1.png", chips: [
    { label: "Design review", message: "Hey, do you have time for a design review sometime?" },
    { label: "Share a file", message: "I have a file to share with you — when's a good time?" },
    { label: "Schedule a sync", message: "Want to schedule a quick sync this week?" },
    { label: "Need your input", message: "I need your input on something when you have a moment." },
    { label: "Check in tomorrow", message: "Can we check in tomorrow for a few minutes?" },
  ]},
  { id: 2, name: "Hiro Horii", initials: "HH", relation: "Friend", avatar: "src/assets/avatar2.png", chips: [
    { label: "What's up?", message: "Hey! What's up? Haven't caught up in a while." },
    { label: "Lunch this week?", message: "Hey, want to grab lunch sometime this week?" },
    { label: "Check this out", message: "Hey, I found something cool I wanted to share with you!" },
    { label: "Call tonight?", message: "Want to do a quick call tonight?" },
    { label: "See you soon?", message: "Are you around soon? Would be good to see you." },
  ]},
];

export function createMessageSendFlow(ctx) {
  const FLOW_START_THINK_MS = 1600;
  const DISAMBIGUATION_TO_COMPOSE_MS = 1000;
  const CONFIRM_TO_SENDING_MS = 600;
  const SENDING_HOLD_MS = 1000;
  const COMPOSE_MENU_HOLD_MS = 280;
  const COMPOSE_MENU_EXPAND_MS = 3000;
  const COMPOSE_MENU_CLOSE_MS = 260;
  const COMPOSE_MENU_BASE_COUNT = 3;
  const COMPOSE_MENU_POINTER_STEP_PX = 48;
  const COMPOSE_CHIP_MAGIC_MS = 800;
  const COMPOSE_CHIP_MAGIC_REVEAL_MS = 260;
  const COMPOSE_CHIP_ORB_DELAY_MS = 300;
  const GS = { IDLE: 0, THINKING: 1, DISAMBIGUATE: 2, COMPOSE: 3, CONFIRM: 4, SENDING: 5, SENT: 6 };
  const flow = { active: false, state: GS.IDLE, sel: 0, contact: null, msg: "", composeText: "", composeChipMagicPending: false, composeChipMagicOrbActive: false, composeMenuOpen: false, composeMenuClosing: false, composeMenuHolding: false, composeMenuVisibleCount: 0, composeVisualChips: [], showCheck: false, aiVoice: "", disambiguateContacts: [], interimText: "", _pendingMsg: "", replaceComposeOnNextDictation: false, dictationInterimActive: false, dictationBaseText: "", sentTransitionActive: false, sentToastEnterPending: false };
  const timers = { pause: null, dots: null, thinking: null, send: null, sent: null, sentTransition: null, composeExit: null, controlsTrack: null, controlsExit: null, autoConfirm: null, startup: null, composeMenuHold: null, composeMenuExpand: null, composeMenuClose: null, composeChipOrbDelay: null };
  let controlsMode = "";
  const voice = createMessageSendVoice({ contacts: CONTACTS });
  let flowEpoch = 0;
  let composeMenuPointerOriginY = 0;
  let composeMenuPointerCurrentY = 0;

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

  function speakOutput(text, options = {}) {
    const announce = options.announce !== false;
    flow.aiVoice = text;
    ctx.setSimVoice(announce ? text : "");
    ctx.shell.updateOrbLabel();
  }

  function cancelControlsTracking() {
    if (!timers.controlsTrack) return;
    cancelAnimationFrame(timers.controlsTrack);
    timers.controlsTrack = null;
  }

  function trackControlsForTransition(ms) {
    cancelControlsTracking();
    const layer = ctx.C.glassControlsLayer;
    const root = getComputedStyle(document.documentElement);
    const fallbackMs = Number.isFinite(ms) ? ms : (parseFloat(root.getPropertyValue("--anim-t")) || 450) + 120;
    const end = performance.now() + Math.max(120, fallbackMs);
    const tick = () => {
      if (!flow.active || !layer?.classList.contains("visible")) return;
      positionControlsOverlay(layer);
      if (performance.now() < end) timers.controlsTrack = requestAnimationFrame(tick);
      else timers.controlsTrack = null;
    };
    timers.controlsTrack = requestAnimationFrame(tick);
  }

  function renderControls(screenSpec = null) {
    const layer = ctx.C.glassControlsLayer;
    if (!layer) return;
    const nextActions = Array.isArray(screenSpec?.actions) ? screenSpec.actions : [];
    const nextSelectedIndex = Number.isFinite(screenSpec?.actionSelectedIndex) ? screenSpec.actionSelectedIndex : 0;
    const nextMode = nextActions.length ? nextActions.map((action) => action.id || "").join("|") : "";
    if (timers.controlsExit) {
      if (nextMode) {
        clearTimeout(timers.controlsExit);
        timers.controlsExit = null;
      } else {
        return;
      }
    }
    if (!flow.active || !nextActions.length) {
      if (controlsMode) {
        const row = layer.querySelector(".g-action-row");
        if (row && !row.classList.contains("exit")) {
          row.classList.add("exit");
          cancelControlsTracking();
          timers.controlsExit = setTimeout(() => {
            timers.controlsExit = null;
            controlsMode = "";
            renderControls(screenSpec);
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
    if (controlsMode && controlsMode !== nextMode) {
      const row = layer.querySelector(".g-action-row");
      if (row && !row.classList.contains("exit")) {
        row.classList.add("exit");
        cancelControlsTracking();
        timers.controlsExit = setTimeout(() => {
          timers.controlsExit = null;
          controlsMode = "";
          renderControls(screenSpec);
        }, 220);
        return;
      }
    }
    if (controlsMode !== nextMode) {
      composeControls(nextActions, nextSelectedIndex);
      controlsMode = nextMode;
    } else {
      layer.querySelectorAll(".g-action-btn").forEach((btn, idx) => btn.classList.toggle("selected", idx === nextSelectedIndex));
    }
    layer.classList.add("visible");
    if (!positionControlsOverlay()) {
      layer.classList.remove("visible");
      cancelControlsTracking();
      return;
    }
    trackControlsForTransition();
  }

  function composeControls(actions, selectedIndex) {
    const layer = ctx.C.glassControlsLayer;
    if (!layer) return;
    layer.innerHTML = "";
    composeScreen({
      documentRef: document,
      richRoot: document.createElement("div"),
      controlsRoot: layer,
      spec: {
        actions,
        actionSelectedIndex: selectedIndex,
      },
    });
  }

  function forceControlsRebuild() {
    controlsMode = "";
  }

  function buildComposeVisualChips(contact) {
    const chips = Array.isArray(contact?.chips) ? contact.chips : [];
    const priority = new Map([
      ["Schedule a sync", 0],
      ["Design review", 1],
      ["Share a file", 2],
    ]);
    return chips
      .map((chip, originalIndex) => ({ ...chip, originalIndex, sortKey: priority.has(chip?.label) ? priority.get(chip.label) : (100 + originalIndex) }))
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  function ensureComposeVisualChips(contact = flow.contact) {
    if (contact === flow.contact && flow.composeVisualChips.length > 0) return flow.composeVisualChips;
    flow.composeVisualChips = buildComposeVisualChips(contact);
    return flow.composeVisualChips;
  }


  function startDotsAnimation() {
    const dots = document.getElementById("g-thinking-dots");
    if (!dots) return;
    let frame = 0;
    timers.dots = setInterval(() => { dots.textContent = ["·", "· ·", "· · ·"][frame++ % 3]; }, 400);
  }

  function clearComposeMenuTimers() {
    ["composeMenuHold", "composeMenuExpand", "composeMenuClose"].forEach((key) => {
      if (!timers[key]) return;
      clearTimeout(timers[key]);
      timers[key] = null;
    });
  }

  function getComposeMenuVisibleCount() {
    const chips = ensureComposeVisualChips();
    return Math.max(0, Math.min(flow.composeMenuVisibleCount || 0, chips.length));
  }

  function clearComposeMenuPointerGesture() {
    composeMenuPointerOriginY = 0;
    composeMenuPointerCurrentY = 0;
  }

  function setComposeMenuSelection(index) {
    const visibleCount = getComposeMenuVisibleCount();
    const nextIndex = index < 0 || visibleCount <= 0
      ? -1
      : Math.max(0, Math.min(index, visibleCount - 1));
    if (flow.sel === nextIndex) return false;
    flow.sel = nextIndex;
    return !!(render.updateComposeMenuUiOnly?.() || render.render(false));
  }

  function updateComposeMenuSelectionFromPointer() {
    if (!flow.active || flow.state !== GS.COMPOSE || !flow.composeMenuOpen) return false;
    const visibleCount = getComposeMenuVisibleCount();
    if (visibleCount <= 0) return setComposeMenuSelection(-1);
    const deltaUp = Math.max(0, composeMenuPointerOriginY - composeMenuPointerCurrentY);
    const steps = Math.min(visibleCount, Math.floor(deltaUp / COMPOSE_MENU_POINTER_STEP_PX));
    const nextIndex = steps <= 0 ? -1 : (visibleCount - steps);
    return setComposeMenuSelection(nextIndex);
  }

  function cancelComposeMenu(options = {}) {
    clearComposeMenuTimers();
    flow.composeMenuHolding = false;
    flow.composeMenuOpen = false;
    clearComposeMenuPointerGesture();
    if (options.immediate) {
      flow.composeMenuClosing = false;
      flow.composeMenuVisibleCount = 0;
      return;
    }
    if (flow.composeMenuVisibleCount > 0) {
      flow.composeMenuClosing = true;
      if (flow.active && flow.state === GS.COMPOSE) render.updateComposeMenuUiOnly?.();
      timers.composeMenuClose = setTimeout(() => {
        timers.composeMenuClose = null;
        flow.composeMenuClosing = false;
        flow.composeMenuVisibleCount = 0;
        if (flow.active && flow.state === GS.COMPOSE) render.updateComposeMenuUiOnly?.() || render.render(false);
      }, COMPOSE_MENU_CLOSE_MS);
      return;
    }
    flow.composeMenuClosing = false;
    flow.composeMenuVisibleCount = 0;
  }

  function startComposeMenuHold(options = {}) {
    if (!flow.active || flow.state !== GS.COMPOSE) return false;
    ensureComposeVisualChips();
    clearComposeMenuTimers();
    if (Number.isFinite(options.pointerOriginY)) {
      composeMenuPointerOriginY = Number(options.pointerOriginY);
      composeMenuPointerCurrentY = Number(options.pointerOriginY);
    } else {
      clearComposeMenuPointerGesture();
    }
    flow.composeMenuHolding = true;
    flow.composeMenuClosing = false;
    if (timers.autoConfirm) {
      clearTimeout(timers.autoConfirm);
      timers.autoConfirm = null;
    }
    timers.composeMenuHold = setTimeout(() => {
      timers.composeMenuHold = null;
      if (!flow.active || flow.state !== GS.COMPOSE || !flow.composeMenuHolding) return;
      flow.composeMenuOpen = true;
      flow.composeMenuVisibleCount = Math.min(COMPOSE_MENU_BASE_COUNT, ensureComposeVisualChips().length);
      flow.sel = -1;
      render.updateComposeMenuUiOnly?.() || render.render(false);
      updateComposeMenuSelectionFromPointer();
      timers.composeMenuExpand = setTimeout(() => {
        timers.composeMenuExpand = null;
        if (!flow.active || flow.state !== GS.COMPOSE || !flow.composeMenuHolding || !flow.composeMenuOpen) return;
        flow.composeMenuVisibleCount = ensureComposeVisualChips().length;
        if (!render.updateComposeMenuUiOnly?.()) render.render(false);
        updateComposeMenuSelectionFromPointer();
      }, COMPOSE_MENU_EXPAND_MS);
    }, COMPOSE_MENU_HOLD_MS);
    return true;
  }

  function updateComposeMenuPointerGesture(pointerY) {
    if (!Number.isFinite(pointerY)) return false;
    composeMenuPointerCurrentY = Number(pointerY);
    return updateComposeMenuSelectionFromPointer();
  }

  function endComposeMenuHold(options = {}) {
    if (!flow.active || flow.state !== GS.COMPOSE) return false;
    const commitSelection = options.commitSelection === true;
    if (timers.composeMenuHold) {
      clearTimeout(timers.composeMenuHold);
      timers.composeMenuHold = null;
      flow.composeMenuHolding = false;
      clearComposeMenuPointerGesture();
      return true;
    }
    if (flow.composeMenuOpen || flow.composeMenuClosing) {
      flow.composeMenuHolding = false;
      const chip = commitSelection ? getSelectedVisualChip() : null;
      if (chip) {
        clearComposeMenuPointerGesture();
        selectChipWithAnimation(chip.originalIndex);
        return true;
      }
      cancelComposeMenu();
      render.updateComposeMenuUiOnly?.() || render.render(false);
      return true;
    }
    flow.composeMenuHolding = false;
    clearComposeMenuPointerGesture();
    return true;
  }

  function getSelectedVisualChip() {
    const chips = ensureComposeVisualChips();
    return flow.sel >= 0 ? (chips[flow.sel] || null) : null;
  }

  function findVisualChipIndexByOriginalIndex(originalIndex) {
    return ensureComposeVisualChips().findIndex((chip) => chip.originalIndex === originalIndex);
  }

  const render = createMessageSendRender({
    document,
    SHAPES: ctx.SHAPES,
    C: ctx.C,
    GS,
    getFlow: () => flow,
    morphTo: ctx.morph.morphTo,
    applyGeometry: ctx.morph.applyGeometry,
    getCurrentMainGeometry: ctx.morph.getCurrentMainGeometry,
    setIntentHeader: ctx.shell.setIntentHeader,
    hideIntentHeader: ctx.shell.hideIntentHeader,
    positionIntentHeaderAboveMain: ctx.shell.positionIntentHeaderAboveMain,
    trackIntentHeaderForTransition: ctx.shell.trackIntentHeaderForTransition,
    renderControls,
    updateOrbLabel: ctx.shell.updateOrbLabel,
    setSimInputState: ctx.setSimInputState,
  });

  function maxSel() {
    if (flow.state === GS.DISAMBIGUATE) return Math.max(0, flow.disambiguateContacts.length - 1);
    if (flow.state === GS.COMPOSE && flow.composeMenuOpen) return Math.max(0, getComposeMenuVisibleCount() - 1);
    return 0;
  }

  function applyVoiceMode() {
    const dropMain = document.getElementById("drop-main");
    if (dropMain) dropMain.style.boxShadow = "";
    if (flow.state === GS.IDLE || flow.state === GS.DISAMBIGUATE || flow.state === GS.CONFIRM) {
      ctx.voice.voiceEngine.start("command");
    } else if (flow.state === GS.COMPOSE) {
      ctx.voice.voiceEngine.start("dictation");
    } else {
      ctx.voice.voiceEngine.stop();
    }
  }

  function transitionTo(state, voiceText = "") {
    const epoch = flowEpoch;
    const confirmToSend = flow.state === GS.CONFIRM && state === GS.SENDING;
    if (timers.composeExit) {
      clearTimeout(timers.composeExit);
      timers.composeExit = null;
    }
    if (state !== GS.COMPOSE && timers.autoConfirm) {
      clearTimeout(timers.autoConfirm);
      timers.autoConfirm = null;
    }
    if (state !== GS.SENDING && state !== GS.SENT && timers.sentTransition) {
      clearTimeout(timers.sentTransition);
      timers.sentTransition = null;
    }
    if (state !== GS.SENDING && state !== GS.SENT) flow.sentTransitionActive = false;
    if (state !== GS.SENT) flow.sentToastEnterPending = false;
    if (state !== GS.COMPOSE) {
      flow.composeChipMagicPending = false;
      flow.composeChipMagicOrbActive = false;
    }
    if (timers.dots) clearInterval(timers.dots);
    timers.dots = null;
    if (flow.state === GS.COMPOSE && state !== GS.COMPOSE) {
      const field = ctx.C.rich?.querySelector("[data-compose-field]");
      if (field) {
        timers.composeExit = setTimeout(() => {
          timers.composeExit = null;
          if (!isEpochAlive(epoch) || flow.state !== GS.COMPOSE) return;
          flow.state = state;
          flow.sel = 0;
          speakOutput(voiceText, { announce: state !== GS.THINKING && state !== GS.SENDING });
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
          if (state === GS.THINKING || state === GS.SENDING) startDotsAnimation();
        }, 380);
        return;
      }
    }
    flow.state = state;
    flow.sel = 0;
    if (confirmToSend) flow.sentTransitionActive = true;
    else if (state !== GS.SENT) flow.sentTransitionActive = false;
    speakOutput(voiceText, { announce: state !== GS.THINKING && state !== GS.SENDING });
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
    if (state === GS.THINKING || state === GS.SENDING) startDotsAnimation();
    if (confirmToSend) {
      timers.sentTransition = setTimeout(() => {
        timers.sentTransition = null;
        if (!flow.active || flow.state !== GS.SENDING) return;
        flow.sentTransitionActive = false;
        render.render(false);
      }, CONFIRM_TO_SENDING_MS);
    }
  }

  function reset() {
    flowEpoch += 1;
    clearTimers();
    render.clearDisambiguationMotion?.();
    ctx.voice.voiceEngine.stop();
    flow.active = false;
    flow.state = GS.IDLE;
    flow.sel = 0;
    flow.contact = null;
    flow.msg = "";
    flow.composeText = "";
    flow.composeChipMagicPending = false;
    flow.composeChipMagicOrbActive = false;
    flow.composeMenuOpen = false;
    flow.composeMenuClosing = false;
    flow.composeMenuHolding = false;
    flow.composeMenuVisibleCount = 0;
    flow.composeVisualChips = [];
    flow.showCheck = false;
    flow.aiVoice = "";
    flow.interimText = "";
    flow._pendingMsg = "";
    flow.replaceComposeOnNextDictation = false;
    flow.dictationInterimActive = false;
    flow.dictationBaseText = "";
    flow.sentTransitionActive = false;
    flow.sentToastEnterPending = false;
    speakOutput("");
    if (ctx.C?.rich) {
      ctx.C.rich.innerHTML = "";
      ctx.C.rich.classList.remove("visible", "glass-active", "glass-sent", "glass-disambiguation", "glass-compose");
      ctx.C.rich.dataset.glassState = "";
      ctx.C.rich.style.opacity = "";
      ctx.C.rich.style.transform = "";
    }
    document.body.classList.remove("glass-flow-active", "message-confirm-to-sent");
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
    render.clearDisambiguationMotion?.();
    const intentHeader = document.getElementById("intent-header");
    if (intentHeader) {
      intentHeader.classList.remove("visible");
      intentHeader.classList.add("exiting");
    }

    document.getElementById("drop-main")?.classList.remove("disambiguation-surface", "listening-orb");
    document.getElementById("siri-orb")?.classList.remove("visible");

    const pills = ctx.C.rich.querySelectorAll(".g-disambiguation-pill");
    pills.forEach((el, i) => {
      el.style.animationDelay = `${i * 25}ms`;
      el.classList.add("g-disambiguation-pill-exit");
    });

    flow.contact = contact;
    flow.composeText = "";
    flow.msg = "";
    flow.composeChipMagicPending = false;
    flow.composeChipMagicOrbActive = false;
    flow.showCheck = false;
    cancelComposeMenu({ immediate: true });
    ensureComposeVisualChips(contact);
    flow.state = GS.COMPOSE;
    flow.sel = 0;
    const dropMain = document.getElementById("drop-main");
    if (dropMain) dropMain.style.boxShadow = "";
    ctx.voice.voiceEngine.start("dictation");
    dropMain?.classList.remove("disambiguation-surface", "confirm-surface");
    dropMain?.classList.add("compose-surface");
    render.setManualComposeEntry(true);
    const geo = render.composeGeo();
    ctx.morph.morphTo(render.glassStateShape(GS.COMPOSE), { icon: "", primary: "", secondary: "", detail: "" }, geo);
    ctx.updateActive?.(render.glassStateShape(GS.COMPOSE));
    render.render(false);
    setTimeout(() => {
      if (!isEpochAlive(epoch) || flow.state !== GS.COMPOSE) return;
      render.setManualComposeEntry(false);
      render.render(false);
    }, DISAMBIGUATION_TO_COMPOSE_MS);
    render.markStateCommitted();

    speakOutput(voiceText || "");
    setTimeout(() => { if (isEpochAlive(epoch)) ctx.input.focus(); }, DISAMBIGUATION_TO_COMPOSE_MS);
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
    flow.composeChipMagicPending = true;
    flow.composeChipMagicOrbActive = false;
    flow.showCheck = false;
    cancelComposeMenu({ immediate: true });
    ctx.input.blur();
    render.render(true);

    timers.composeChipOrbDelay = setTimeout(() => {
      timers.composeChipOrbDelay = null;
      if (!isEpochAlive(epoch) || flow.state !== GS.COMPOSE || !flow.composeChipMagicPending) return;
      flow.composeChipMagicOrbActive = true;
      render.render(true);
    }, COMPOSE_CHIP_ORB_DELAY_MS);

    if (!isEpochAlive(epoch) || flow.state !== GS.COMPOSE) return;
    const dropMain = document.getElementById("drop-main");
    const text = ctx.C.rich?.querySelector("[data-compose-field-text]");
    if (dropMain) {
      dropMain.classList.remove("compose-chip-magic");
      void dropMain.offsetHeight;
      dropMain.classList.add("compose-chip-magic");
    }
    if (text) {
      text.classList.remove("g-text-magic");
    }

    setTimeout(() => {
      if (!isEpochAlive(epoch) || flow.state !== GS.COMPOSE) return;
      flow.composeChipMagicPending = false;
      flow.composeChipMagicOrbActive = false;
      const text = ctx.C.rich?.querySelector("[data-compose-field-text]");
      if (!text) {
        render.render(false);
        return;
      }
      text.classList.remove("g-compose-text-pending", "g-text-magic");
      void text.offsetHeight;
      text.classList.add("g-text-magic");
    }, COMPOSE_CHIP_MAGIC_REVEAL_MS);

    setTimeout(() => {
      if (!isEpochAlive(epoch) || flow.state !== GS.COMPOSE) return;
      document.getElementById("drop-main")?.classList.remove("compose-chip-magic");
      ctx.C.rich?.querySelector("[data-compose-field]")?.classList.remove("g-compose-field-magic-pending");
      flow.msg = String(flow.composeText || flow.msg || "").trim();
      transitionTo(GS.CONFIRM, phrase("confirm_ready_send"));
    }, COMPOSE_CHIP_MAGIC_MS);
  }

  function doAction(index) {
    const epoch = flowEpoch;
    if (index === 0) {
      transitionTo(GS.SENDING, "");
      timers.send = setTimeout(() => {
        if (!isEpochAlive(epoch)) return;
        flow.sentTransitionActive = false;
        flow.sentToastEnterPending = true;
        transitionTo(GS.SENT, "");
        if (typeof ctx.playEarcon === "function") ctx.playEarcon("sent");
        ctx.addSimLog(`✓ Delivered to ${flow.contact?.name || "contact"}`, "success");
        timers.sent = setTimeout(() => reset(), 2500);
      }, CONFIRM_TO_SENDING_MS + SENDING_HOLD_MS);
      return;
    }
    if (index === 1) {
      reopenComposeFromConfirm();
      return;
    }
    reset();
  }

  function reopenComposeFromConfirm() {
    const epoch = flowEpoch;
    cancelComposeMenu({ immediate: true });
    flow.showCheck = false;
    flow.composeText = flow.msg || flow.composeText;
    flow.composeChipMagicPending = false;
    flow.composeChipMagicOrbActive = false;
    flow.replaceComposeOnNextDictation = true;
    flow.dictationInterimActive = false;
    flow.dictationBaseText = "";
    transitionTo(GS.COMPOSE, phrase("edit_message"));
    scheduleComposeIdleReturn(3500);
    setTimeout(() => { if (isEpochAlive(epoch)) ctx.input.focus(); }, 120);
  }

  function reopenRecipientSelection() {
    flow.disambiguateContacts = CONTACTS.filter((contact) => contact.name.toLowerCase().includes("hiro"));
    flow._pendingMsg = flow.msg || flow.composeText || "";
    transitionTo(GS.DISAMBIGUATE, phrase("disambiguate_found_two"));
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
        flow.showCheck = false;
        cancelComposeMenu({ immediate: true });
        ensureComposeVisualChips(contact);
        transitionTo(GS.CONFIRM, phrase("confirm_message_to", { name: contact.name.split(" ")[0] }));
      } else {
        beginCompose(contact, phrase("compose_prompt"));
      }
      return;
    }
    if (flow.state === GS.COMPOSE && flow.composeMenuOpen) {
      if (flow.composeMenuHolding) return;
      const chip = getSelectedVisualChip();
      if (!chip) return;
      selectChipWithAnimation(chip.originalIndex);
      return;
    }
    if (flow.state === GS.COMPOSE && !flow.composeMenuOpen && String(flow.composeText || "").trim()) {
      flow.msg = String(flow.composeText || flow.msg || "").trim();
      transitionTo(GS.CONFIRM, phrase("confirm_ready_send"));
      ctx.input.blur();
      return;
    }
    if (flow.state === GS.CONFIRM) {
      doAction(flow.sel);
    }
  }

  function dismiss() {
    if (flow.state === GS.CONFIRM) {
      reopenComposeFromConfirm();
      return;
    }
    if (flow.state === GS.COMPOSE || flow.state === GS.DISAMBIGUATE) reset();
  }

  function scheduleComposeIdleReturn(ms = 3500) {
    if (timers.autoConfirm) {
      clearTimeout(timers.autoConfirm);
      timers.autoConfirm = null;
    }
    timers.autoConfirm = setTimeout(() => {
      if (flow.state !== GS.COMPOSE || !flow.active) return;
      const msg = String(flow.composeText || flow.msg || "").trim();
      if (!msg) return;
      flow.msg = msg;
      transitionTo(GS.CONFIRM, phrase("confirm_ready_send"));
      ctx.input.blur();
    }, ms);
  }

  function normalizeChipCopyText(value) {
    return String(value || "")
      .trim()
      .replace(/[.,!?;:，。！？；：'"`“”‘’()[\]{}]/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }
  function capitalizeFirstCharacter(value) {
    const text = String(value || "");
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  function isQuestionLike(text) {
    const value = String(text || "").trim();
    if (!value) return false;
    if (/[?？]\s*$/.test(value)) return true;
    if (/[吗麼么呢]\s*$/.test(value)) return true;
    if (/^(what|when|where|who|why|how|which|can|could|would|should|do|does|did|is|are|am|will|won't|isn't|aren't|don't|doesn't|didn't)\b/i.test(value)) return true;
    return /\b(how are you|how is|how do|what do you|would you|could you|can you)\b/i.test(value);
  }
  function autoPunctuateByStructure(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const match = raw.match(/^(.*?)(["'”’)\]]*)$/);
    const core = (match?.[1] || raw).trim();
    const closers = match?.[2] || "";
    if (!core) return raw;
    if (/[.!?。！？]$/.test(core)) return `${core}${closers}`;
    const hasHan = /[\u3400-\u9FFF]/.test(core);
    const terminal = isQuestionLike(core) ? (hasHan ? "？" : "?") : (hasHan ? "。" : ".");
    return `${core}${terminal}${closers}`;
  }
  function mergeFinalDictation(existing, incoming) {
    const prev = String(existing || "").trim();
    const next = String(incoming || "").trim();
    if (!next) return prev;
    if (!prev) return next;
    const prevNorm = normalizeChipCopyText(prev);
    const nextNorm = normalizeChipCopyText(next);
    if (!nextNorm) return prev;
    if (prevNorm === nextNorm || prevNorm.endsWith(nextNorm)) return prev;
    if (nextNorm.startsWith(prevNorm)) return next;
    const needsSpace = !/[“"(\[]$/.test(prev);
    return `${prev}${needsSpace ? " " : ""}${next}`;
  }

  function findExactChipMessageIndex(text) {
    const target = normalizeChipCopyText(text);
    if (!target) return -1;
    const chips = flow.contact?.chips || [];
    return chips.findIndex((chip) => normalizeChipCopyText(chip?.message || "") === target);
  }

  function handleInputChange(value, options = {}) {
    const text = String(value || "");
    const allowChipMatch = options?.allowChipMatch === true;
    const fromDictation = options?.fromDictation === true;
    const hadText = !!String(flow.composeText || "").trim();
    const willHaveText = !!text.trim();
    if (!fromDictation && text.trim()) flow.replaceComposeOnNextDictation = false;
    flow.composeText = text;
    cancelComposeMenu({ immediate: true });

    if (timers.autoConfirm) {
      clearTimeout(timers.autoConfirm);
      timers.autoConfirm = null;
    }

    if (timers.pause) {
      clearTimeout(timers.pause);
      timers.pause = null;
    }

    if (text.trim()) {
      if (allowChipMatch) {
        const exactChipIndex = findExactChipMessageIndex(text);
        if (exactChipIndex >= 0) {
          selectChipWithAnimation(exactChipIndex);
          return;
        }
      }
      flow.showCheck = false;
      flow.msg = text.trim();

      timers.autoConfirm = setTimeout(() => {
        if (flow.state === GS.COMPOSE && flow.active) {
          flow.msg = String(flow.composeText || flow.msg || "").trim();
          transitionTo(GS.CONFIRM, phrase("confirm_ready_send"));
          ctx.input.blur();
        }
      }, 2000);
    } else {
      flow.showCheck = false;
      flow.msg = "";
    }
    render.render(hadText !== willHaveText);
  }

  async function handleInputSubmit(text, options = {}) {
    const skipThinking = options?.skipThinking === true;
    const value = String(text || "").trim();
    if (!value) return;
    ctx.addSimLog(value, "user");
    if (flow.state === GS.COMPOSE) {
      handleInputChange(value);
      return;
    }
    const voiceAction = voice.parseComposeVoice(value, { ...flow, GS });
    if (voiceAction) {
      if (voiceAction.type === "action") doAction(voiceAction.index);
      if (voiceAction.type === "edit") reopenComposeFromConfirm();
      if (voiceAction.type === "change-recipient") reopenRecipientSelection();
      if (voiceAction.type === "select-contact") { flow.sel = voiceAction.index; confirm(); }
      if (voiceAction.type === "select-chip") {
        const visualIndex = findVisualChipIndexByOriginalIndex(voiceAction.index);
        flow.sel = visualIndex >= 0 ? visualIndex : voiceAction.index;
        confirm();
      }
      return;
    }
    if (flow.state === GS.IDLE || flow.state === GS.DISAMBIGUATE) {
      if (!skipThinking) transitionTo(GS.THINKING, "Searching contact...");
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
            flow.showCheck = false;
            cancelComposeMenu({ immediate: true });
            ensureComposeVisualChips(fallback[0]);
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
      const spoken = capitalizeFirstCharacter(text);
      if (!isFinal) {
        if (!flow.dictationInterimActive) {
          flow.dictationBaseText = flow.replaceComposeOnNextDictation ? "" : (flow.composeText || flow.msg || "");
          flow.dictationInterimActive = true;
        }
        const live = flow.replaceComposeOnNextDictation
          ? spoken
          : mergeFinalDictation(flow.dictationBaseText, spoken);
        handleInputChange(live, { allowChipMatch: false, fromDictation: true });
        return;
      }
      const dictationText = autoPunctuateByStructure(spoken);
      const base = flow.dictationInterimActive
        ? flow.dictationBaseText
        : (flow.replaceComposeOnNextDictation ? "" : (flow.composeText || flow.msg || ""));
      const merged = flow.replaceComposeOnNextDictation
        ? dictationText
        : mergeFinalDictation(base, dictationText);
      flow.dictationInterimActive = false;
      flow.dictationBaseText = "";
      flow.replaceComposeOnNextDictation = false;
      handleInputChange(merged, { allowChipMatch: true, fromDictation: true });
      return;
    }
    if (flow.state === GS.CONFIRM && isFinal && text) {
      const action = voice.parseComposeVoice(text, { ...flow, GS });
      if (action?.type === "action") doAction(action.index);
      if (action?.type === "edit") reopenComposeFromConfirm();
      if (action?.type === "change-recipient") reopenRecipientSelection();
    }
  }

  function start(seedText = "") {
    flowEpoch += 1;
    const epoch = flowEpoch;
    clearTimers();
    flow.active = true;
    flow.state = GS.IDLE;
    flow.sel = 0;
    flow.contact = null;
    flow.msg = "";
    flow.composeText = "";
    flow.composeChipMagicPending = false;
    flow.composeChipMagicOrbActive = false;
    flow.interimText = "";
    flow.composeMenuOpen = false;
    flow.composeMenuClosing = false;
    flow.composeMenuHolding = false;
    flow.composeMenuVisibleCount = 0;
    flow.composeVisualChips = [];
    flow.showCheck = false;
    flow.sentTransitionActive = false;
    flow.sentToastEnterPending = false;
    flow.disambiguateContacts = CONTACTS.filter((contact) => contact.name.toLowerCase().includes("hiro"));
    if (ctx.input) ctx.input.value = "";
    transitionTo(GS.THINKING, "Searching contact...");
    timers.startup = setTimeout(() => {
      timers.startup = null;
      if (!isEpochAlive(epoch)) return;
      transitionTo(GS.IDLE, "");
      const seeded = String(seedText || "").trim();
      if (seeded) {
        void handleInputSubmit(seeded, { skipThinking: true });
        return;
      }
      ctx.input.focus();
      ctx.voice.voiceEngine.start("command");
    }, FLOW_START_THINK_MS);
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
    startComposeMenuHold,
    updateComposeMenuPointerGesture,
    endComposeMenuHold,
    handleInputChange,
    handleInputSubmit,
    onTranscriptUpdate,
  };
}
