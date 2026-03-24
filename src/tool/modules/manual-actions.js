export function initManualActions({ input, sendBtn, flight, resolveScenario, previewScenario, renderScenarioUi, setSelectedScenarioId }) {
  async function processRequest(userText) {
    await flight.processRequest(userText);
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    if (flight.isActive()) flight.cancelFlightFlow();
    input.value = '';
    sendBtn.classList.remove('active');
    void processRequest(text);
  }

  function fireChip(el) {
    const text = el.textContent.trim();
    if (flight.isActive()) flight.cancelFlightFlow();
    input.value = text;
    sendBtn.classList.add('active');
    setTimeout(() => {
      input.value = '';
      sendBtn.classList.remove('active');
      void processRequest(text);
    }, 120);
  }

  return { processRequest, handleSend, fireChip };
}
