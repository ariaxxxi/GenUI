export function createMessageSendVoice({ contacts }) {
  function normalizeMessageBody(rawBody) {
    const raw = String(rawBody || "").trim();
    if (!raw) return "";
    const compact = raw.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!compact) return "";

    const placeholderPatterns = [
      /^(?:a|an|the)?\s*(?:msg|message|text)s?$/,
      /^(?:some|any)\s+(?:msg|message|text)s?$/,
      /^(?:a|an|the)?\s*(?:new|quick|short)?\s*(?:msg|message|text)s?$/,
    ];
    if (placeholderPatterns.some((pattern) => pattern.test(compact))) return "";
    return raw;
  }

  async function parseIntent(text) {
    const lower = String(text || "").toLowerCase().trim();
    if (/\b(send|message|text|msg)\b/.test(lower)) {
      const toMatch = lower.match(/\bto\s+(.+)/i);
      const recipient = toMatch ? toMatch[1].trim() : "";
      const bodyMatch = lower.match(/\b(?:send|message|text|msg)\s+(.+?)\s+to\s+/i);
      const messageBody = bodyMatch ? normalizeMessageBody(bodyMatch[1]) : "";
      return { intent: "send_message", recipient, messageBody, confidence: 1 };
    }
    return { intent: "unknown", recipient: "", messageBody: "", confidence: 0 };
  }

  function isMessageIntent(text) {
    return /\b(send|message|text|msg)\b/i.test(String(text || ""));
  }

  function parseDisambiguateVoice(text, items) {
    const lower = String(text || "").toLowerCase().trim();
    if (/\b(second|the\s*second|number\s*two|option\s*two)\b/.test(lower)) return 1;
    if (/\b(third|the\s*third|number\s*three|option\s*three)\b/.test(lower)) return 2;
    if (/\b(first|one|1|the\s*first|number\s*one|option\s*one)\b/.test(lower)) return 0;
    for (let i = 0; i < items.length; i += 1) {
      const parts = String(items[i].name || "").toLowerCase().split(" ");
      if (parts.some((part) => part.length > 2 && lower.includes(part))) return i;
    }
    return -1;
  }

  function parseComposeVoice(text, flow) {
    const lower = String(text || "").toLowerCase().trim();
    if (!lower) return false;
    if (flow.state === flow.GS.CONFIRM) {
      if (/\b(send|yes|confirm)\b/.test(lower)) return { type: "action", index: 0 };
      if (/\b(edit|change)\b/.test(lower)) return { type: "action", index: 1 };
      if (/\b(cancel|nevermind|never mind)\b/.test(lower)) return { type: "action", index: 2 };
    }
    if (flow.state === flow.GS.COMPOSE && flow.showCheck && /\b(send|yes)\b/.test(lower)) {
      return { type: "action", index: 0 };
    }
    if (flow.state === flow.GS.DISAMBIGUATE) {
      const idx = contacts.findIndex((contact) => String(contact.name || "").toLowerCase().includes(lower));
      if (idx >= 0) return { type: "select-contact", index: idx };
    }
    if (flow.state === flow.GS.COMPOSE && flow.showChips && !flow.composeText) {
      const idx = (flow.contact?.chips || []).findIndex((chip) =>
        lower.includes(String(chip.label || "").toLowerCase())
      );
      if (idx >= 0) return { type: "select-chip", index: idx };
    }
    return false;
  }

  function findContacts(recipientHint = "", fullText = "") {
    const query = String(recipientHint || fullText || "").toLowerCase().trim();
    const pool = contacts.filter((contact) => String(contact.name || "").toLowerCase().includes("hiro"));
    if (!query) return pool;
    const tokens = query.split(/\s+/).filter((token) => token.length >= 2);
    return pool.filter((contact) => {
      const name = String(contact.name || "").toLowerCase();
      if (name.includes(query)) return true;
      return tokens.some((token) => name.includes(token));
    });
  }

  return {
    parseIntent,
    isMessageIntent,
    parseDisambiguateVoice,
    parseComposeVoice,
    findContacts,
  };
}
