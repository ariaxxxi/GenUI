export function createFlightAi({ apiUrl, getFlow, addChatBubble }) {
  function formatFlightDate(monthIndex, day) {
    const now = new Date();
    let year = now.getFullYear();
    let date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) return "";
    if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      year += 1;
      date = new Date(year, monthIndex, day);
    }
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${weekday}, ${month} ${date.getDate()}`;
  }

  function normalizeFlightDateValue(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const match = raw.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b[\s,]+(\d{1,2})\b/i);
    if (!match) return raw;
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const monthIndex = months[match[1].slice(0, 3).toLowerCase()];
    const day = Number(match[2]);
    if (!Number.isInteger(monthIndex) || !Number.isFinite(day)) return raw;
    return formatFlightDate(monthIndex, day) || raw;
  }

  function normalizeFlightDateData(data) {
    const next = { ...(data || {}) };
    if (next.depart) next.depart = normalizeFlightDateValue(next.depart);
    if (next.return) next.return = normalizeFlightDateValue(next.return);
    return next;
  }

  function detectEditTarget(text) {
    const t = String(text || "").toLowerCase();
    if (/\b(date|dates|depart|departure|return)\b/.test(t)) return { type: "dates" };
    if (/\b(passenger|passengers|adult|adults|people|traveler|travellers)\b/.test(t)) return { type: "options", key: "passengers" };
    if (/\b(flight|airline|time|times)\b/.test(t)) return { type: "recommendation", key: "flight" };
    if (/\b(payment|pay|card|apple pay|visa|bank)\b/.test(t)) return { type: "payment" };
    return null;
  }

  function parseFlightDatesLocally(text) {
    const t = String(text || "").toLowerCase();
    const matches = [...t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/g)];
    const out = {};
    if (matches[0]) out.depart = normalizeFlightDateValue(`${matches[0][1]} ${matches[0][2]}`);
    if (matches[1]) out.return = normalizeFlightDateValue(`${matches[1][1]} ${matches[1][2]}`);
    if (/\breturn|back\b/.test(t) && matches[0] && !out.return) {
      out.return = normalizeFlightDateValue(`${matches[0][1]} ${matches[0][2]}`);
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
    if (step.type === "recommendation") return "Would you like this flight or see alternatives?";
    if (step.type === "payment") return "How would you like to pay?";
    if (step.type === "confirm") return "Would you like to confirm this flight?";
    if (step.type === "done") return "Ready to book this trip?";
    return "What should we do next?";
  }

  function resolvePaymentMethod(rawText, flow) {
    const t = String(rawText || "").toLowerCase();
    return (flow.paymentMethods || []).find((item) => {
      const name = String(item.name || "").toLowerCase();
      return (t.includes("apple pay") && name.includes("apple pay"))
        || (t.includes("visa") && name.includes("visa"))
        || (t.includes("bank") && name.includes("bank"));
    }) || null;
  }

  function applyRecommendationRefinement(rawText, flow) {
    const t = String(rawText || "").toLowerCase();
    const options = flow.currentFlightOptions?.() || [];
    if (!options.length) return false;
    if (/\b(alternative|alternatives|other options|show more)\b/.test(t)) {
      flow.recommendationMode = "alternatives";
      flow.focused = 0;
      return true;
    }
    if (/\b(cheaper|cheap|lowest price)\b/.test(t)) {
      const cheapest = options.find((opt) => String(opt.sub || "").includes("$631")) || options[0];
      flow.setSelectedFlightOption?.(cheapest);
      flow.recommendationMode = "recommend";
      return true;
    }
    if (/\b(nonstop|non stop|faster|fastest|convenient|earlier)\b/.test(t)) {
      const nonstop = options.find((opt) => String(opt.sub || "").toLowerCase().includes("non-stop")) || options[0];
      flow.setSelectedFlightOption?.(nonstop);
      flow.recommendationMode = "recommend";
      return true;
    }
    return false;
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
    if (step.type === "recommendation") {
      if (/\b(yes|ok|confirm|book)\b/i.test(text)) return { reply: "Great, I’ll use that one.", action: "next", data: {} };
      if (/\b(alternative|alternatives|other option|other flight)\b/i.test(text)) return { reply: "Here are two alternatives.", action: "alternatives", data: {} };
      if (/\b(cancel|never mind)\b/i.test(text)) return { reply: "Canceled.", action: "cancel", data: {} };
      return { reply: "Want this one or should I show alternatives?", action: "stay", data: {} };
    }
    if (step.type === "confirm") return /\byes|ok|confirm|book\b/i.test(text) ? { reply: "Booked.", action: "next", data: {} } : { reply: "Tell me what to change.", action: "stay", data: {} };
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
        if (editTarget.type === "payment") {
          const payment = resolvePaymentMethod(rawText, flow);
          if (payment) {
            flow.data.paymentMethod = payment.name;
            addChatBubble("ai", `Using ${payment.name}.`);
            return flow.renderStep(true);
          }
        }
        flow.editReturnStepIndex = flow.stepIndexBy("confirm");
        if (flow.jumpToStep(editTarget)) return;
      }
      if (/\b(show details|flight times|what are the flight times)\b/.test(rawText.toLowerCase())) {
        flow.showConfirmDetails = true;
        addChatBubble("ai", "Here are the flight details.");
        return flow.renderStep(true);
      }
      if (/\b(hide details|collapse details|close details)\b/.test(rawText.toLowerCase())) {
        flow.showConfirmDetails = false;
        addChatBubble("ai", "Back to the summary.");
        return flow.renderStep(true);
      }
    }
    if (step.type === "recommendation") {
      if (applyRecommendationRefinement(rawText, flow)) {
        addChatBubble("ai", flow.recommendationMode === "alternatives" ? "Here are two alternatives." : "I found a better match.");
        return flow.renderStep(true);
      }
    }
    if (result?.data && typeof result.data === "object") {
      const nextData = step.type === "dates"
        ? normalizeFlightDateData(inferSingleDateSlot(rawText, result.data, flow.data))
        : result.data;
      Object.assign(flow.data, nextData);
    }
    const reply = enforceProgressReply(result?.reply, action, step, flow.nextStepFor(step));
    if (reply) addChatBubble("ai", reply);
    if (action === "back") return flow.backStep();
    if (action === "select") return flow.selectByIndex(Number(result?.data?.index) || 0);
    if (action === "alternatives") { flow.recommendationMode = "alternatives"; flow.focused = 0; return flow.renderStep(true); }
    if (action === "cancel") return flow.resetToHome();
    if (action === "next") return step.type === "dates" && !isDatesAdvanceIntent(rawText) ? flow.renderStep(true) : flow.nextStep(true);
    if (action === "update") return flow.renderStep(true);
  }

  return { detectEditTarget, parseFlightDatesLocally, inferSingleDateSlot, isDatesAdvanceIntent, nextQuestion, enforceProgressReply, callGeminiFlightAction, localFallback, handleUserInput };
}
