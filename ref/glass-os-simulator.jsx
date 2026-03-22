import { useState, useEffect, useRef, useCallback } from "react";

const T = {
  font: "'DM Sans', sans-serif",
  primary: "rgba(255,255,255,1)",
  secondary: "rgba(255,255,255,0.50)",
  tertiary: "rgba(255,255,255,0.25)",
  radius: 30, pad: 20,
  size: { xs: 14, sm: 16, md: 20, body: 24, lg: 28 },
  canvas: 420,
  ease: "cubic-bezier(0.35, 0.23, 0.13, 0.98)",
  dur: "500ms",
};

const blueGlow = "inset 0 -6px 6px -2px rgba(35,101,255,0.15), inset 0 -15px 20px -6px rgba(255,255,255,0.5), inset 0 -15px 20px -6px rgba(230,229,247,0.5), inset 0 -70px 60px -30px rgba(19,75,192,1)";
const cardBase = "inset 0 1px 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.02)";

function TopGlow() {
  return <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.12) 70%, transparent 100%)", zIndex: 2 }} />;
}

const CONTACTS = [
  { id: 1, name: "Hiro Tanaka", initials: "HT", relation: "Colleague · Design",
    chips: [
      { label: "Design review", message: "Hey, do you have time for a design review sometime?" },
      { label: "Share a file", message: "I have a file to share with you — when's a good time?" },
      { label: "Schedule a sync", message: "Want to schedule a quick sync this week?" },
    ],
  },
  { id: 2, name: "Hiro Horri", initials: "HH", relation: "Friend",
    chips: [
      { label: "What's up?", message: "Hey! What's up? Haven't caught up in a while." },
      { label: "Lunch this week?", message: "Hey, want to grab lunch sometime this week?" },
      { label: "Check this out", message: "Hey, I found something cool I wanted to share with you!" },
    ],
  },
];

// COMPOSE = actively listening, with or without checkmark
// CONFIRM = not listening, 3 buttons
const S = { IDLE: 0, THINKING: 1, DISAMBIGUATE: 2, COMPOSE: 3, CONFIRM: 4, SENDING: 5, SENT: 6 };

function Ava({ initials, size = 42 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.36, fontWeight: 600, color: T.secondary, fontFamily: T.font }}>{initials}</div>
  );
}

function ActionBtn({ emoji, selected, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: selected ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
      border: `1px solid rgba(255,255,255,${selected ? 0.22 : 0.08})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, transition: `all 300ms ${T.ease}`,
      transform: selected ? "scale(1.12)" : "scale(1)",
    }}>{emoji}</div>
  );
}

function Chip({ label, selected }) {
  return (
    <div style={{
      padding: "8px 16px", borderRadius: 50,
      background: selected ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
      border: `1px solid rgba(255,255,255,${selected ? 0.28 : 0.10})`,
      fontSize: T.size.md, color: selected ? T.primary : T.secondary,
      fontFamily: T.font, fontWeight: selected ? 500 : 400,
      whiteSpace: "nowrap", transition: "all 0.2s ease",
    }}>{label}</div>
  );
}

function ThinkingContent() {
  const [f, setF] = useState(0);
  useEffect(() => { const i = setInterval(() => setF(n => n + 1), 400); return () => clearInterval(i); }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.10)", borderTopColor: "rgba(255,255,255,0.6)", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 24, color: T.secondary, fontFamily: T.font, letterSpacing: 3 }}>{["·", "· ·", "· · ·"][f % 3]}</span>
    </div>
  );
}

export default function GlassOS() {
  const [state, setState] = useState(S.IDLE);
  const [input, setInput] = useState("");
  const [sel, setSel] = useState(0);
  const [contact, setContact] = useState(null);
  const [msg, setMsg] = useState("");
  const [composeText, setComposeText] = useState("");
  const [showChips, setShowChips] = useState(true);
  const [showCheck, setShowCheck] = useState(false); // checkmark visible in COMPOSE
  const [aiVoice, setAiVoice] = useState("");
  const [log, setLog] = useState([]);
  const [containerH, setContainerH] = useState("auto");
  const inputRef = useRef(null);
  const pauseTimer = useRef(null);
  const contentRef = useRef(null);

  const addLog = (t, type = "system") => setLog(prev => [...prev.slice(-24), { text: t, type, time: Date.now() }]);

  const isComposing = state === S.COMPOSE;
  const hasText = composeText && composeText.length > 0;

  const maxSel = useCallback(() => {
    if (state === S.DISAMBIGUATE) return CONTACTS.length - 1;
    if (state === S.COMPOSE && showChips && !composeText) return contact ? contact.chips.length - 1 : 0;
    if (state === S.CONFIRM) return 2;
    return 0;
  }, [state, contact, showChips, composeText]);

  const reset = () => {
    setState(S.IDLE); setSel(0); setContact(null); setMsg("");
    setComposeText(""); setShowChips(true); setShowCheck(false);
    setAiVoice(""); setInput("");
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
  };

  // Measure content height for morph
  useEffect(() => {
    if (contentRef.current) {
      // Use rAF to get post-render measurement
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setContainerH(contentRef.current.scrollHeight);
        }
      });
    }
  }, [state, composeText, showChips, sel, msg, showCheck]);

  // 3s pause → show checkmark (still COMPOSE, still listening)
  const startPauseTimer = useCallback(() => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      if (composeText.trim()) {
        setShowCheck(true);
        setMsg(composeText.trim());
        addLog("⏸ 3s pause — ✅ appears", "system");
      }
    }, 3000);
  }, [composeText]);

  // Clear pause timer and hide checkmark when user resumes
  const resumeComposing = () => {
    setShowCheck(false);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
  };

  // Global keyboard
  useEffect(() => {
    const h = (e) => {
      if (document.activeElement === inputRef.current) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setSel(s => Math.min(s + 1, maxSel())); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
      else if (e.key === " ") { e.preventDefault(); handleConfirm(); }
      else if (e.key === "Escape") { e.preventDefault(); handleDismiss(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const handleConfirm = () => {
    if (state === S.DISAMBIGUATE) {
      const c = CONTACTS[sel];
      setContact(c); setState(S.THINKING); setAiVoice("");
      addLog(`Selected: ${c.name}`, "action");
      setTimeout(() => {
        setAiVoice(`What would you like to say to ${c.name.split(" ")[0]}?`);
        addLog(`🔊 "What would you like to say to ${c.name.split(" ")[0]}?"`, "voice");
        setState(S.COMPOSE); setShowChips(true); setComposeText(""); setShowCheck(false); setSel(0);
        setTimeout(() => inputRef.current?.focus(), 200);
      }, 800);
    } else if (state === S.COMPOSE && showChips && !composeText && contact) {
      // Chip selected → fill message, show checkmark immediately
      const chip = contact.chips[sel];
      setMsg(chip.message); setComposeText(chip.message);
      setShowChips(false); setShowCheck(true);
      addLog(`Chip: "${chip.label}" → "${chip.message}"`, "action");
    } else if (state === S.COMPOSE && showCheck) {
      // Checkmark tapped → go to CONFIRM (stop listening, 3 buttons)
      setMsg(composeText.trim() || msg);
      setState(S.CONFIRM); setSel(0); setShowCheck(false);
      setAiVoice(`Send to ${contact.name.split(" ")[0]}?`);
      addLog("→ Confirm options", "system");
    } else if (state === S.CONFIRM) {
      doConfirmAction(sel);
    }
  };

  const doConfirmAction = (action) => {
    if (action === 0) {
      setState(S.SENDING); setAiVoice("");
      addLog("Sending...", "system");
      setTimeout(() => {
        setState(S.SENT); setAiVoice("Sent.");
        addLog(`✓ Delivered to ${contact.name}`, "success");
        setTimeout(reset, 2500);
      }, 900);
    } else if (action === 1) {
      // Edit → back to COMPOSE with text, blue glow, still listening
      setState(S.COMPOSE); setComposeText(msg); setInput(msg);
      setShowChips(false); setShowCheck(false); setSel(0);
      setAiVoice("Edit your message.");
      addLog("Editing", "action");
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      addLog("Cancelled", "system"); reset();
    }
  };

  const handleDismiss = () => {
    if (state === S.CONFIRM) {
      // Back to compose with text
      setState(S.COMPOSE); setComposeText(msg); setInput(msg);
      setShowChips(false); setShowCheck(false); setSel(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    } else if (state !== S.IDLE && state !== S.THINKING && state !== S.SENDING) {
      reset();
    }
  };

  // Voice command parser
  const parseVoiceCommand = (text) => {
    const lower = text.toLowerCase().trim();
    if (state === S.CONFIRM) {
      if (lower === "send" || lower === "yes" || lower === "confirm") { doConfirmAction(0); return true; }
      if (lower === "edit" || lower === "change") { doConfirmAction(1); return true; }
      if (lower === "cancel" || lower === "nevermind") { doConfirmAction(2); return true; }
    }
    // At compose with checkmark showing, "send" skips to sending
    if (state === S.COMPOSE && showCheck) {
      if (lower === "send" || lower === "yes") {
        setMsg(composeText.trim() || msg);
        setState(S.SENDING); setAiVoice(""); setShowCheck(false);
        addLog("🎤 \"send\" — skipping to send", "action");
        setTimeout(() => {
          setState(S.SENT); setAiVoice("Sent.");
          addLog(`✓ Delivered to ${contact.name}`, "success");
          setTimeout(reset, 2500);
        }, 900);
        return true;
      }
    }
    if (state === S.DISAMBIGUATE) {
      const match = CONTACTS.findIndex(c => c.name.toLowerCase().includes(lower));
      if (match >= 0) { setSel(match); setTimeout(handleConfirm, 100); return true; }
    }
    if (state === S.COMPOSE && showChips && !composeText && contact) {
      const ci = contact.chips.findIndex(c => lower.includes(c.label.toLowerCase()));
      if (ci >= 0) { setSel(ci); setTimeout(handleConfirm, 100); return true; }
    }
    return false;
  };

  const handleInputSubmit = () => {
    if (!input.trim()) return;
    const text = input.trim();

    if (state !== S.IDLE && state !== S.THINKING) {
      if (parseVoiceCommand(text)) { setInput(""); addLog(`🎤 "${text}"`, "action"); return; }
    }

    if (isComposing) {
      // Enter during compose: finalize text, show checkmark
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      setComposeText(text); setMsg(text); setShowCheck(true); setShowChips(false);
      setInput("");
      addLog(`🎤 "${text}"`, "action");
      inputRef.current?.blur();
      return;
    }

    setInput(""); addLog(`> ${text}`, "user");

    if (text.toLowerCase().includes("send") || text.toLowerCase().includes("message")) {
      setState(S.THINKING); setAiVoice("");
      const toMatch = text.match(/\bto\s+(\w+)/i);
      const search = toMatch ? toMatch[1] : text.split(/\s+/).pop() || "";
      setTimeout(() => {
        const matches = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        if (matches.length === 1) {
          setContact(matches[0]);
          setAiVoice(`Message to ${matches[0].name}. What would you like to say?`);
          addLog(`🔊 "Message to ${matches[0].name}..."`, "voice");
          setState(S.COMPOSE); setShowChips(true); setComposeText(""); setShowCheck(false); setSel(0);
          setTimeout(() => inputRef.current?.focus(), 200);
        } else if (matches.length > 1) {
          setAiVoice("Which Hiro?"); addLog(`🔊 "Which Hiro?"`, "voice");
          setState(S.DISAMBIGUATE); setSel(0);
        } else {
          setAiVoice("Contact not found."); addLog("Not found", "system");
          setTimeout(reset, 2000);
        }
      }, 1200);
    } else {
      addLog("Try: \"Send a message to Hiro\"", "system");
    }
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (isComposing) {
      setComposeText(val);
      if (val.trim()) {
        setShowChips(false);
        resumeComposing(); // hide checkmark, reset timer
        startPauseTimer(); // restart 3s timer
      } else {
        setShowChips(true);
        resumeComposing();
      }
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") handleInputSubmit();
    else if (e.key === "Escape") { e.preventDefault(); inputRef.current?.blur(); handleDismiss(); }
  };

  const inputLabel = isComposing ? "🎤 Voice Dictation" : "Voice Command";
  const inputPlaceholder = isComposing
    ? "Speak (type to simulate)..."
    : state === S.CONFIRM ? '"send", "edit", or "cancel"'
    : state === S.DISAMBIGUATE ? 'Say a name, e.g. "Tanaka"'
    : '"Send a message to Hiro"';

  const isActive = state !== S.IDLE;

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#050505", display: "flex", fontFamily: T.font, color: T.primary, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #050505; overflow: hidden; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.18); }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
      `}</style>

      {/* LEFT PANEL */}
      <div style={{ width: 290, height: "100vh", display: "flex", flexDirection: "column", padding: "22px 18px", gap: 12, borderRight: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <div style={{ fontSize: 10, color: T.tertiary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 5, fontFamily: T.font }}>GlassOS Simulator</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", fontFamily: T.font, lineHeight: 1.5 }}>
            <span style={{ color: T.tertiary }}>↑↓</span> nav · <span style={{ color: T.tertiary }}>Space</span> confirm · <span style={{ color: T.tertiary }}>Esc</span> back
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 5, fontFamily: T.font, color: isComposing ? "rgba(100,150,255,0.7)" : T.tertiary, transition: "color 0.3s" }}>{inputLabel}</div>
          <div style={{ position: "relative" }}>
            {isComposing && <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 6, height: 6, borderRadius: "50%", background: "rgba(100,150,255,0.9)", boxShadow: "0 0 5px rgba(100,150,255,0.4)", animation: "pulse 1.5s ease infinite", zIndex: 1 }} />}
            <input ref={inputRef} type="text" value={input} onChange={handleInputChange} onKeyDown={handleInputKeyDown} placeholder={inputPlaceholder}
              style={{ width: "100%", background: isComposing ? "rgba(100,150,255,0.03)" : "rgba(255,255,255,0.03)", border: `1px solid ${isComposing ? "rgba(100,150,255,0.12)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: isComposing ? "8px 11px 8px 24px" : "8px 11px", color: T.primary, fontSize: 13, fontFamily: T.font, outline: "none", transition: "all 0.3s" }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(100,150,255,0.30)", fontFamily: T.font, marginTop: 4, minHeight: 14 }}>
            {isComposing && !showCheck && "Type → glass · 3s pause = ✅ · Enter = done"}
            {isComposing && showCheck && "Keep talking to edit · Space = confirm · say \"send\""}
            {state === S.CONFIRM && 'Say "send", "edit", or "cancel"'}
          </div>
        </div>

        {aiVoice && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px" }}>
            <div style={{ fontSize: 9, color: T.tertiary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 3, fontFamily: T.font }}>🔊 AI</div>
            <div style={{ fontSize: 12, color: T.secondary, fontFamily: T.font }}>"{aiVoice}"</div>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ fontSize: 9, color: T.tertiary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 5, fontFamily: T.font }}>Log</div>
          {log.map((e, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: T.font, lineHeight: 1.8, color: e.type === "user" ? T.primary : e.type === "voice" ? "rgba(130,170,255,0.5)" : e.type === "action" ? "rgba(160,255,160,0.45)" : e.type === "success" ? "rgba(100,255,140,0.6)" : "rgba(255,255,255,0.14)" }}>{e.text}</div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", padding: "8px 0 0", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          {[["↑↓", "Nav"], ["Space", "OK"], ["Esc", "Back"], ["Enter", "Send"]].map(([k, l]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 9, fontFamily: T.font, color: T.secondary, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "1px 4px" }}>{k}</span>
              <span style={{ fontSize: 9, color: T.tertiary, fontFamily: T.font }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GLASS */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: T.canvas + 50, height: T.canvas + 50, transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(255,255,255,0.008) 0%, transparent 70%)", borderRadius: 40, pointerEvents: "none" }} />

          <div style={{ width: T.canvas, height: T.canvas, borderRadius: 24, border: "1px solid rgba(255,255,255,0.04)", position: "relative", overflow: "hidden" }}>
            {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((p, i) => (
              <div key={i} style={{ position: "absolute", ...p, width: 4, height: 4, border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />
            ))}

            {/* MORPH WRAPPER */}
            <div style={{
              position: "absolute", bottom: T.pad, left: T.pad, right: T.pad,
              height: typeof containerH === "number" ? containerH : "auto",
              transition: `height ${T.dur} ${T.ease}, opacity ${T.dur} ${T.ease}, transform ${T.dur} ${T.ease}`,
              opacity: isActive ? 1 : 0,
              transform: isActive ? "translateY(0)" : "translateY(16px)",
              overflow: "visible",
            }}>
              <div ref={contentRef} style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>

                {/* THINKING */}
                {state === S.THINKING && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 50, border: "1px solid rgba(255,255,255,0.10)", boxShadow: cardBase, padding: "14px 20px", position: "relative", overflow: "hidden" }}>
                    <TopGlow /><ThinkingContent />
                  </div>
                )}

                {/* DISAMBIGUATE */}
                {state === S.DISAMBIGUATE && (
                  <div>
                    <div style={{ fontSize: T.size.body, color: T.secondary, fontFamily: T.font, marginBottom: 10, padding: "0 2px" }}>Which Hiro?</div>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: T.radius, border: "1px solid rgba(255,255,255,0.10)", boxShadow: cardBase, padding: 6, position: "relative", overflow: "hidden" }}>
                      <TopGlow />
                      {CONTACTS.map((c, i) => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 24, background: sel === i ? "rgba(255,255,255,0.05)" : "transparent", transition: "background 0.2s" }}>
                          <Ava initials={c.initials} size={42} />
                          <div style={{ fontSize: T.size.body, fontFamily: T.font, fontWeight: sel === i ? 600 : 400, color: sel === i ? T.primary : T.secondary, transition: "all 0.2s" }}>{c.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMPOSE (always listening, blue glow always on, checkmark optional) */}
                {state === S.COMPOSE && contact && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.03)", borderRadius: T.radius,
                      border: "1px solid rgba(255,255,255,0.10)", boxShadow: cardBase,
                      padding: T.pad, position: "relative", overflow: "hidden",
                    }}>
                      <TopGlow />
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <Ava initials={contact.initials} size={40} />
                        <span style={{ fontSize: T.size.body, color: T.secondary, fontFamily: T.font }}>
                          To: <span style={{ fontWeight: 600, color: T.primary }}>{contact.name}</span>
                        </span>
                      </div>
                      {/* Chips — animate out */}
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: 8,
                        maxHeight: showChips && !hasText ? 120 : 0,
                        opacity: showChips && !hasText ? 1 : 0,
                        marginBottom: showChips && !hasText ? 14 : 0,
                        overflow: "hidden",
                        transition: `all 400ms ${T.ease}`,
                      }}>
                        {contact.chips.map((chip, i) => (
                          <Chip key={i} label={chip.label} selected={sel === i} />
                        ))}
                      </div>
                      {/* Listening field — always blue glow */}
                      <div style={{
                        borderRadius: 22, padding: "14px 16px",
                        minHeight: hasText ? 56 : 44,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: blueGlow,
                        transition: `min-height 400ms ${T.ease}`,
                      }}>
                        <div style={{ fontSize: T.size.body, color: T.primary, fontFamily: T.font, lineHeight: 1.45 }}>
                          {hasText ? composeText : <span style={{ color: T.secondary, fontStyle: "italic" }}>Listening...</span>}
                        </div>
                      </div>
                    </div>
                    {/* Checkmark — appears/disappears smoothly */}
                    <div style={{
                      transition: `all 350ms ${T.ease}`,
                      opacity: showCheck ? 1 : 0,
                      transform: showCheck ? "translateY(0) scale(1)" : "translateY(4px) scale(0.85)",
                      pointerEvents: showCheck ? "auto" : "none",
                      height: showCheck ? 48 : 0,
                      overflow: "visible",
                    }}>
                      <ActionBtn emoji="✅" selected={true} size={48} />
                    </div>
                  </div>
                )}

                {/* CONFIRM — not listening, no blue glow, 3 buttons */}
                {state === S.CONFIRM && contact && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.03)", borderRadius: T.radius,
                      border: "1px solid rgba(255,255,255,0.10)", boxShadow: cardBase,
                      padding: T.pad, position: "relative", overflow: "hidden",
                    }}>
                      <TopGlow />
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <Ava initials={contact.initials} size={40} />
                        <span style={{ fontSize: T.size.body, color: T.secondary, fontFamily: T.font }}>
                          To: <span style={{ fontWeight: 600, color: T.primary }}>{contact.name}</span>
                        </span>
                      </div>
                      {/* NO blue glow — not listening */}
                      <div style={{
                        borderRadius: 22, padding: "14px 16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: cardBase,
                      }}>
                        <div style={{ fontSize: T.size.body, color: T.primary, fontFamily: T.font, lineHeight: 1.45 }}>{msg}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 14, justifyContent: "center", animation: "fadeUp 400ms ease both" }}>
                      {["✈️", "✊", "❌"].map((e, i) => (
                        <ActionBtn key={i} emoji={e} selected={sel === i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* SENDING */}
                {state === S.SENDING && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 50, border: "1px solid rgba(255,255,255,0.10)", boxShadow: cardBase, padding: "14px 20px", position: "relative", overflow: "hidden" }}>
                    <TopGlow />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.10)", borderTopColor: "rgba(255,255,255,0.6)", animation: "spin 0.7s linear infinite" }} />
                      <span style={{ fontSize: T.size.md, color: T.secondary, fontFamily: T.font }}>Sending...</span>
                    </div>
                  </div>
                )}

                {/* SENT */}
                {state === S.SENT && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 50, border: "1px solid rgba(255,255,255,0.10)", boxShadow: cardBase, padding: "14px 20px", position: "relative", overflow: "hidden" }}>
                    <TopGlow />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <span style={{ fontSize: T.size.body, color: T.primary, fontFamily: T.font, fontWeight: 500 }}>Message sent</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* IDLE */}
            {state === S.IDLE && (
              <div style={{ position: "absolute", bottom: T.pad, left: 0, right: 0, textAlign: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.10)", animation: "pulse 2s ease infinite" }} />
                </div>
                <div style={{ fontSize: T.size.sm, color: T.tertiary, fontFamily: T.font }}>Listening</div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, color: "rgba(255,255,255,0.08)", fontFamily: T.font, letterSpacing: 2, textTransform: "uppercase" }}>420 × 420</div>
        </div>
      </div>
    </div>
  );
}
