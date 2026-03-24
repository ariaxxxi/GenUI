export function initInputActions({
  input,
  ensureHomeAwake,
  responseMode,
  RESPONSE_MODE,
  selectedScenario,
  scenarioLibrary,
  createScenario,
  createIcon,
  renderScenarioUi,
  setSelectedScenarioId,
  previewScenario,
  messageFlow,
  flightFlow,
  voice,
  morph,
}) {
  const isMessageIntent = (text) => /\bsend(?:\s+a)?\s+message\b/i.test(String(text || ""));

  function clearActiveFlows() {
    if (messageFlow.isActive()) messageFlow.reset();
    if (flightFlow.isActive()) flightFlow.reset();
  }

  function startMessageFlowWithText(text) {
    const userText = String(text || "").trim();
    if (!userText) return false;
    clearActiveFlows();
    morph.hideRich();
    voice.voiceEngine.stop();
    if (input) input.value = "";
    messageFlow.start();
    setTimeout(() => { void messageFlow.handleInputSubmit(userText); }, 60);
    return true;
  }

  function scenarioMatchesText(scenario, text) {
    const haystack = String(text || "").toLowerCase();
    if (!haystack) return false;
    if (String(scenario.name || "").toLowerCase().includes(haystack)) return true;
    return (scenario.triggers || []).some((trigger) => haystack.includes(String(trigger || "").toLowerCase()));
  }

  function resolveScenario(inputText) {
    return scenarioLibrary().find((scenario) => scenarioMatchesText(scenario, inputText)) || selectedScenario();
  }

  function handleManualRequest(userText) {
    const scenario = resolveScenario(userText);
    if (scenario) {
      setSelectedScenarioId(scenario.id);
      renderScenarioUi();
      previewScenario(scenario);
      return;
    }
    morph.morphTo("pill", { icon: createIcon("emoji", "⚠"), primary: "No Match", secondary: "Create a scenario to preview this", detail: "" });
  }

  async function handleAiRequest(userText) {
    const scenario = selectedScenario();
    previewScenario(createScenario({
      ...scenario,
      name: "AI Preview",
      shape: scenario?.shape || "pill",
      content: {
        ...(scenario?.content || {}),
        icon: scenario?.content?.icon || createIcon("emoji", "✨"),
        primary: scenario?.content?.primary || "Generated response",
        secondary: userText,
        detail: scenario?.content?.detail || "",
      },
      triggers: [],
    }));
  }

  async function processRequest(userText) {
    ensureHomeAwake?.();
    if (flightFlow.isActive()) return flightFlow.handleUserInput(userText);
    if (isMessageIntent(userText)) return startMessageFlowWithText(userText);
    morph.hideRich();
    voice.voiceEngine.stop();
    if (handleChipQuickAction(userText)) return;
    if (flightFlow.processRequest(userText)) return;
    if (responseMode() === RESPONSE_MODE.AI) return handleAiRequest(userText);
    return handleManualRequest(userText);
  }

  function handleSend() {
    ensureHomeAwake?.();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    void processRequest(text);
  }

  function handleChipQuickAction(text) {
    const lower = String(text || "").trim().toLowerCase();
    clearActiveFlows();
    morph.hideRich();
    voice.voiceEngine.stop();
    if (/\bweather\b|\bforecast\b|\btemperature\b/.test(lower)) {
      previewScenario(createScenario({ name: "Weather", shape: "card", content: { icon: createIcon("emoji", "🌤"), primary: "San Francisco", secondary: "57°F · Sunny", detail: "H: 61°F  L: 51°F · 0% rain · Wind 8 mph" }, triggers: [] }));
      setTimeout(() => {
        voice.voiceEngine.start("command");
      }, 120);
      return true;
    }
    if (/\btimer\b/.test(lower)) {
      previewScenario(createScenario({ name: "Timer", shape: "pill", content: { icon: createIcon("emoji", "⏱"), primary: "10 min timer", secondary: "Ready to start", detail: "" }, triggers: [] }));
      return true;
    }
    if (/\bcall\b/.test(lower)) {
      previewScenario(createScenario({ name: "Call", shape: "pill", content: { icon: createIcon("emoji", "📞"), primary: "Call Mom", secondary: "Ready to dial", detail: "" }, triggers: [] }));
      return true;
    }
    return false;
  }

  function fireChip(el) {
    const text = String(el?.textContent || "").trim();
    ensureHomeAwake?.();
    clearActiveFlows();
    input.value = text;
    setTimeout(() => {
      if (/^send(?: a)? message to hiro$/i.test(text)) {
        input.value = "";
        clearActiveFlows();
        morph.hideRich();
        voice.voiceEngine.stop();
        messageFlow.start();
        setTimeout(() => { void messageFlow.handleInputSubmit("send message to hiro"); }, 60);
        return;
      }
      input.value = "";
      if (handleChipQuickAction(text)) return;
      void processRequest(text);
    }, 120);
  }

  return { resolveScenario, processRequest, handleManualRequest, handleAiRequest, handleSend, handleChipQuickAction, fireChip };
}
