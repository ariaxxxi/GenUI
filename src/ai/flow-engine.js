export function getPaymentDefaultSources({
  storageKey = "genui.primaryPaymentMethod",
  fallback = null,
} = {}) {
  let primaryPaymentMethod = fallback;
  try {
    if (typeof globalThis?.localStorage?.getItem === "function") {
      const stored = globalThis.localStorage.getItem(storageKey);
      if (stored === "__none__" || stored === "") primaryPaymentMethod = null;
      else if (typeof stored === "string" && stored.trim()) primaryPaymentMethod = stored.trim();
    }
  } catch {}
  return { user: { primaryPaymentMethod } };
}

export function createFlowEngine({ definition, initialFilledSlots = {}, onChange = null } = {}) {
  const slots = Array.isArray(definition?.slots) ? definition.slots : [];
  const state = {
    active: false,
    status: "idle",
    currentSlotIndex: 0,
    filledSlots: { ...initialFilledSlots },
    selectionIndex: 0,
    epoch: 0,
  };

  function emitChange(reason = "update") {
    if (typeof onChange === "function") onChange({ reason, state, slot: currentSlot() });
  }

  function slotIndexById(id) {
    if (!id) return -1;
    return slots.findIndex((slot) => slot?.id === id);
  }

  function currentSlot() {
    return slots[state.currentSlotIndex] || null;
  }

  function getValueByPath(source, path) {
    const raw = String(path || "").trim();
    if (!raw) return undefined;
    return raw.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
  }

  function resolveAutoDefault(slot, sources = {}) {
    if (!slot?.autoDefault) return undefined;
    return getValueByPath(sources, slot.defaultSource);
  }

  function applyAutoDefaults(sources = {}) {
    let changed = false;
    slots.forEach((slot) => {
      if (!slot?.autoDefault) return;
      const existing = state.filledSlots[slot.id];
      if (existing != null && existing !== "") return;
      const resolved = resolveAutoDefault(slot, sources);
      if (resolved == null || resolved === "") return;
      state.filledSlots[slot.id] = resolved;
      changed = true;
    });
    if (changed) emitChange("auto-default");
    return changed;
  }

  function resolveTemplateString(template, values = {}) {
    return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(values[key] ?? ""));
  }

  function resolveConfirmTemplate(values = {}) {
    const tpl = definition?.confirmTemplate || {};
    return {
      title: resolveTemplateString(tpl.title, values),
      subtitle: resolveTemplateString(tpl.subtitle, values),
      detail: resolveTemplateString(tpl.detail, values),
      body: resolveTemplateString(tpl.body, values),
    };
  }

  function matchVoiceEditTarget(utterance = "") {
    const lower = String(utterance || "").toLowerCase().trim();
    if (!lower) return null;
    return slots.find((slot) => Array.isArray(slot?.editPhrases) && slot.editPhrases.some((phrase) => lower.includes(String(phrase).toLowerCase()))) || null;
  }

  function resolveIndex(index) {
    let nextIndex = Math.max(0, Number(index) || 0);
    while (nextIndex < slots.length) {
      const slot = slots[nextIndex];
      if (!slot?.required) break;
      const value = state.filledSlots[slot.id];
      if (value == null || value === "") break;
      nextIndex += 1;
    }
    return nextIndex;
  }

  function start(prefill = {}, sources = {}) {
    state.active = true;
    state.status = "collecting";
    state.epoch += 1;
    state.selectionIndex = 0;
    state.filledSlots = { ...prefill };
    applyAutoDefaults(sources);
    state.currentSlotIndex = resolveIndex(0);
    if (state.currentSlotIndex >= slots.length) state.status = "executing";
    emitChange("start");
    return currentSlot();
  }

  function reset() {
    state.active = false;
    state.status = "idle";
    state.currentSlotIndex = 0;
    state.selectionIndex = 0;
    state.filledSlots = {};
    state.epoch += 1;
    emitChange("reset");
  }

  function goToSlot(idOrIndex) {
    const index = typeof idOrIndex === "number" ? idOrIndex : slotIndexById(idOrIndex);
    if (index < 0 || index >= slots.length) return false;
    state.currentSlotIndex = index;
    state.selectionIndex = 0;
    state.status = "collecting";
    emitChange("goto");
    return true;
  }

  function next() {
    if (state.currentSlotIndex >= slots.length - 1) {
      state.status = "executing";
      emitChange("executing");
      return false;
    }
    state.currentSlotIndex = resolveIndex(state.currentSlotIndex + 1);
    state.selectionIndex = 0;
    state.status = state.currentSlotIndex >= slots.length ? "executing" : "collecting";
    emitChange("next");
    return true;
  }

  function back() {
    if (state.currentSlotIndex <= 0) return false;
    state.currentSlotIndex -= 1;
    state.selectionIndex = 0;
    state.status = "collecting";
    emitChange("back");
    return true;
  }

  function setSlotValue(id, value) {
    if (!id) return;
    state.filledSlots[id] = value;
    emitChange("set-slot");
  }

  function getSlotValue(id) {
    return state.filledSlots[id];
  }

  function clearSlotValue(id) {
    if (!id) return;
    delete state.filledSlots[id];
    emitChange("clear-slot");
  }

  function isComplete() {
    return slots.every((slot) => !slot?.required || !!state.filledSlots[slot.id]);
  }

  function setSelectionIndex(value) {
    state.selectionIndex = Math.max(0, Number(value) || 0);
    emitChange("selection");
  }

  function setStatus(status) {
    state.status = String(status || "idle");
    emitChange("status");
  }

  function currentVoiceMode() {
    const slot = currentSlot();
    if (!slot) return "command";
    if (slot.voiceMode) return slot.voiceMode;
    return slot.type === "text_input" ? "dictation" : "command";
  }

  function isEpochAlive(epoch) {
    return epoch === state.epoch && state.active;
  }

  return {
    definition,
    state,
    slots,
    currentSlot,
    applyAutoDefaults,
    resolveAutoDefault,
    resolveConfirmTemplate,
    matchVoiceEditTarget,
    start,
    reset,
    next,
    back,
    goToSlot,
    setSlotValue,
    getSlotValue,
    clearSlotValue,
    isComplete,
    setSelectionIndex,
    setStatus,
    currentVoiceMode,
    isEpochAlive,
    slotIndexById,
  };
}
