import {
  layoutDisambiguationPillItems,
  renderActionRow,
  renderCompactStatus,
  renderComposeChipStack,
  renderComposeField,
  renderComposeHeader,
  renderDisambiguationPills,
  renderSendingStatus,
} from "./ui-primitives.js";

export function createMessageSendRenderContent({
  C,
  GS,
  getFlow,
  getConfirmTransitionTextWidthPx,
  isConfirmToSendTransition,
}) {
  function layoutDisambiguationContacts(contacts) {
    return { items: layoutDisambiguationPillItems(contacts, getFlow().sel) };
  }

  function buildConfirmStage(flow, extraClass = "") {
    const contact = flow.contact;
    const classes = ["g-compose-stage", "has-text", "confirm-mode", extraClass].filter(Boolean).join(" ");
    const styleAttr = extraClass === "confirm-exit-to-sent"
      ? ` style="--g-confirm-text-freeze-w:${getConfirmTransitionTextWidthPx()}px;"`
      : "";
    return `<div data-glass-body class="${classes}"${styleAttr}>${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: true })}<div class="g-compose-field-wrap">${renderComposeField({ text: flow.msg || "", active: true })}</div></div>`;
  }

  function buildComposeStage(flow, composePlaceholderDelayActive) {
    const contact = flow.contact;
    const hasText = !!String(flow.composeText || "").trim();
    const chipsHtml = renderComposeChipStack({
      chips: (flow.composeVisualChips || []).map((chip, idx) => ({ id: String(chip.originalIndex ?? idx), label: chip.label })),
      selectedIndex: flow.sel,
      open: !!flow.composeMenuOpen,
      closing: !!flow.composeMenuClosing,
      visibleCount: Number.isFinite(flow.composeMenuVisibleCount) ? flow.composeMenuVisibleCount : 0,
    });
    const inputHtml = renderComposeField({ text: flow.composeText, placeholder: "Speak your message...", active: hasText, magicPending: !!flow.composeChipMagicPending });
    const maybeCheckRow = flow.showCheck ? renderActionRow({ actions: [{ id: "confirm", emoji: "✅" }], selectedIndex: 0 }) : "";
    return `<div data-glass-body class="g-compose-stage ${flow.composeMenuOpen ? "menu-open" : ""} ${hasText ? "has-text" : ""} ${composePlaceholderDelayActive ? "placeholder-delayed" : ""}">${renderComposeHeader({ avatar: contact?.avatar, initials: contact?.initials, name: contact?.name || "", visible: !(flow.composeMenuOpen && !flow.composeMenuClosing) })}<div class="g-compose-field-wrap">${chipsHtml}${inputHtml}</div>${maybeCheckRow}</div>`;
  }

  function buildOutgoingDisambiguationStage(flow) {
    const layout = layoutDisambiguationContacts(flow.disambiguateContacts || []);
    return renderDisambiguationPills({
      phase: "settled",
      selectedIndex: flow.sel,
      items: layout.items.map((contact) => ({
        avatar: contact.avatar,
        initials: contact.initials,
        name: contact.name,
        x: contact.x,
        y: contact.y,
        rotStart: contact.rotStart,
        delay: contact.delay,
      })),
      rowDataAttr: "data-g-contact",
      clusterClass: "g-disambiguation-pills exiting-to-compose",
    });
  }

  function buildContent({
    composePlaceholderDelayActive,
    disambiguationPhase,
    manualComposeEntry,
  }) {
    const flow = getFlow();
    const sendTransitionActive = isConfirmToSendTransition(flow);
    if (flow.state === GS.IDLE) return "";
    if (sendTransitionActive) return `${renderSendingStatus({ label: "sending..." })}<div class="g-confirm-to-sent-layer">${buildConfirmStage(flow, "confirm-exit-to-sent")}</div>`;
    if (flow.state === GS.THINKING) return renderCompactStatus({ type: "loading", label: "·", dotsId: "g-thinking-dots" });
    if (flow.state === GS.SENDING) return renderSendingStatus({ label: "sending..." });
    if (flow.state === GS.DISAMBIGUATE) {
      const layout = layoutDisambiguationContacts(flow.disambiguateContacts || []);
      return renderDisambiguationPills({
        phase: disambiguationPhase,
        selectedIndex: flow.sel,
        items: layout.items.map((contact) => ({
          avatar: contact.avatar,
          initials: contact.initials,
          name: contact.name,
          x: contact.x,
          y: contact.y,
          rotStart: contact.rotStart,
          delay: contact.delay,
        })),
        rowDataAttr: "data-g-contact",
      });
    }
    if (flow.state === GS.COMPOSE) {
      const hasComposeText = !!String(flow.composeText || "").trim();
      const shouldShowOutgoingDisambiguation = manualComposeEntry
        && !hasComposeText
        && !flow.composeChipMagicPending
        && !flow.composeMenuOpen
        && !flow.composeMenuHolding
        && !flow.composeMenuClosing;
      if (shouldShowOutgoingDisambiguation) return `${buildOutgoingDisambiguationStage(flow)}${buildComposeStage(flow, composePlaceholderDelayActive)}`;
      return buildComposeStage(flow, composePlaceholderDelayActive);
    }
    if (flow.state === GS.CONFIRM) return buildConfirmStage(flow);
    if (flow.state === GS.SENT) return renderCompactStatus({ type: "success", label: "Message sent", enter: !!flow.sentToastEnterPending });
    return "";
  }

  return {
    buildContent,
  };
}
