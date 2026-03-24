export function createFlightAi({ apiUrl, getFlow, addChatBubble }) {
  function detectEditTarget(text) {
    const t = String(text || "").toLowerCase();
    if (/\b(date|dates|depart|departure|return)\b/.test(t)) return { type: "dates" };
    if (/\b(passenger|passengers|adult|adults|people|traveler|travellers)\b/.test(t)) return { type: "options", key: "passengers" };
    if (/\b(flight|airline|time|times)\b/.test(t)) return { type: "options", key: "flight" };
    if (/\b(payment|pay|card|apple pay|visa|bank)\b/.test(t)) return { type: "payment" };
    return null;
  }

  function parseFlightDatesLocally(text) {
    const t = String(text || "").toLowerCase();
    const matches = [...t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/g)];
    const fmt = (m, d) => `${m.slice(0, 1).toUpperCase()}${m.slice(1, 3)} ${d}`;
    const out = {};
    if (matches[0]) out.depart = fmt(matches[0][1], matches[0][2]);
    if (matches[1]) out.return = fmt(matches[1][1], matches[1][2]);
    if (/\breturn|back\b/.test(t) && matches[0] && !out.return) {
      out.return = fmt(matches[0][1], matches[0][2]);
      delete out.depart;
    }
    return out;
  }

  function inferSingleDateSlot(rawText, dates, currentData) {
    const t = String(rawText || "").toLowerCase();
    const hasDepartKeyword = /\bdepart|departure|leave|outbound\b/.test(t);
    const hasReturnKeyword = /\breturn|back|inbound\b/.test(t);
    const next = { ...(dates || {}) };
    if (!(next.depart && !next.return)) return next;
    if (hasReturnKeyword) return { return: next.depart };
    if (hasDepartKeyword) return next;
    if (currentData?.depart && !currentData?.return) return { return: next.depart };
    return next;
  }

  function isDatesAdvanceIntent(text) {
    return /\b(search|confirm|confirmed|continue|next|done|yes|okay|ok|proceed)\b/.test(String(text || "").toLowerCase().trim());
  }

  function nextQuestion(step) {
    if (!step) return "What would you like to do next?";
    if (step.type === "dates") return "When are you departing and returning?";
    if (step.type === "options" && step.key === "passengers") return "How many passengers?";
    if (step.type === "thinking") return "Want me to find flights now?";
    if (step.type === "options" && step.key === "flight") return "Which flight do you want?";
    if (step.type === "confirm") return "Would you like to confirm this flight?";
    if (step.type === "payment") return "How would you like to pay?";
    if (step.type === "done") return "Ready to book this trip?";
    return "What should we do next?";
  }

  function enforceProgressReply(reply, action, currentStep, nextStep) {
    const text = String(reply || "").trim();
    if (action !== "next" && action !== "select") return text;
    const nextPrompt = nextQuestion(nextStep);
    if (!text) return nextPrompt;
    if (/\?\s*$/.test(text) || text.toLowerCase().includes(nextPrompt.toLowerCase().replace(/\?$/, ""))) return text;
    return `${text} ${nextPrompt}`;
  }

  async function callGeminiFlightAction(userText) {
    const flow = getFlow();
    const step = flow.step();
    const nextStep = flow.nextStepFor(step);
    const options = Array.isArray(step.options) ? step.options.map((opt, i) => `[${i}] ${opt.name} — ${opt.sub}`).join("\n") : "";
    const systemPrompt = `Return ONLY JSON: {"reply":"short reply","action":"next|update|select|stay|back","data":{}}.\nCurrent step: ${step.type}. Next step: ${nextStep?.type || "none"}.\nData: ${JSON.stringify(flow.data)}\n${options ? `Options:\\n${options}` : ""}`.trim();
    const response = await fetch(apiUrl("/api/gemini"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, systemPrompt, maxTokens: 600, model: "gemini-2.5-flash" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Gemini ${response.status}`);
    const raw = String(payload?.text || "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { reply: raw || "AI returned an unexpected response", action: "stay", data: {} };
    return JSON.parse(match[0]);
  }

  function localFallback(userText) {
    const flow = getFlow();
    const step = flow.step();
    const text = String(userText || "").trim();
    if (!text) return { reply: "Tell me more.", action: "stay", data: {} };
    if (step.type === "destination") return { reply: `Got it. Flying to ${flow.normalizeCity(text.replace(/book a flight to|book a flight|fly to|to/gi, " ").trim())}. When are you departing and returning?`, action: "next", data: { destination: flow.normalizeCity(text.replace(/book a flight to|book a flight|fly to|to/gi, " ").trim()) } };
    if (step.type === "dates") {
      if (isDatesAdvanceIntent(text) && flow.data.depart && flow.data.return) return { reply: "Great, dates are set. Moving on.", action: "next", data: {} };
      const dates = inferSingleDateSlot(text, parseFlightDatesLocally(text), flow.data);
      if (dates.depart && dates.return) return { reply: `Perfect, ${dates.depart} to ${dates.return}. Say confirm or press Space to continue.`, action: "update", data: dates };
      if (dates.depart || dates.return) return { reply: "Got one date. What is the other date?", action: "update", data: dates };
      return { reply: 'Please give dates like "Mar 24 to Mar 31".', action: "stay", data: {} };
    }
    if (step.type === "options" || step.type === "payment") {
      const idx = (step.options || []).findIndex((opt) => text.toLowerCase().includes(opt.name.toLowerCase().split(" ")[0]));
      return idx >= 0 ? { reply: `Selected ${step.options[idx].name}.`, action: "select", data: { index: idx } } : { reply: "Use arrow keys or type the option.", action: "stay", data: {} };
    }
    if (step.type === "confirm") return /\byes|ok|confirm|book\b/i.test(text) ? { reply: "Confirmed. How would you like to pay?", action: "next", data: {} } : { reply: "Tell me what to change.", action: "stay", data: {} };
    return { reply: "Done.", action: "stay", data: {} };
  }

  async function handleUserInput(userText) {
    const flow = getFlow();
    const rawText = String(userText || "").trim();
    const step = flow.step();
    if (step.type === "dates" && isDatesAdvanceIntent(rawText) && flow.data.depart && flow.data.return) {
      addChatBubble("user", userText);
      addChatBubble("ai", "Great, moving on.");
      return flow.advanceAfterDatesConfirm();
    }
    addChatBubble("user", userText);
    let result;
    try {
      result = await callGeminiFlightAction(userText);
    } catch (err) {
      console.warn("Gemini flight action failed, using local fallback", err);
      result = localFallback(userText);
    }
    if ((!result?.data || Object.keys(result.data || {}).length === 0) && typeof result?.reply === "string") {
      const parsedDates = parseFlightDatesLocally(result.reply);
      if (parsedDates.depart || parsedDates.return) result.data = { ...(result.data || {}), ...parsedDates };
    }
    const action = String(result?.action || "stay");
    if (step.type === "confirm") {
      const editTarget = detectEditTarget(rawText);
      if (editTarget) {
        flow.editReturnStepIndex = flow.stepIndexBy("confirm");
        if (flow.jumpToStep(editTarget)) return;
      }
    }
    if (result?.data && typeof result.data === "object") Object.assign(flow.data, step.type === "dates" ? inferSingleDateSlot(rawText, result.data, flow.data) : result.data);
    const reply = enforceProgressReply(result?.reply, action, step, flow.nextStepFor(step));
    if (reply) addChatBubble("ai", reply);
    if (action === "back") return flow.backStep();
    if (action === "select") return flow.selectByIndex(Number(result?.data?.index) || 0);
    if (action === "next") return step.type === "dates" && !isDatesAdvanceIntent(rawText) ? flow.renderStep(true) : flow.nextStep(true);
    if (action === "update") return flow.renderStep(true);
  }

  return { detectEditTarget, parseFlightDatesLocally, inferSingleDateSlot, isDatesAdvanceIntent, nextQuestion, enforceProgressReply, callGeminiFlightAction, localFallback, handleUserInput };
}
