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

  function start(prefill = {}) {
    state.active = true;
    state.status = "collecting";
    state.epoch += 1;
    state.selectionIndex = 0;
    state.filledSlots = { ...prefill };
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
    state.currentSlotIndex = resolveIndex(index);
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
