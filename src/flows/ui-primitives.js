function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTextLine(cls, value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `<div class="${cls}">${esc(text)}</div>`;
}

function renderAvatar({ avatar = "", initials = "", name = "", cls = "g-ava", kind = "default" } = {}) {
  const trimmedAvatar = String(avatar || "").trim();
  const finalCls = `${cls}${kind === "logo" ? ` ${cls}--logo` : ""}`;
  if (trimmedAvatar) return `<div class="${finalCls}"><img src="${esc(trimmedAvatar)}" alt="${esc(name)}" class="g-ava-img"/></div>`;
  return `<div class="${finalCls}">${esc(initials)}</div>`;
}

export function renderContactHeader({ avatar = "", initials = "", name = "", prefix = "To:", subtitle = "" } = {}) {
  const subtitleText = String(subtitle || "").trim();
  return `<div class="g-card-header">${renderAvatar({ avatar, initials, name })}<div class="g-to-text">${esc(prefix)} <span class="g-to-name">${esc(name)}</span>${subtitleText ? `<span class="g-contact-sub"> ${esc(subtitleText)}</span>` : ""}</div></div>`;
}

export function renderSelectionList({ items = [], selectedIndex = 0, rowDataAttr = "data-g-contact", listClass = "g-card-list" } = {}) {
  const attrName = String(rowDataAttr || "data-g-contact").trim();
  return `<div class="${esc(listClass || "g-card-list")}">${items.map((item, index) => {
    const title = String(item?.title || "").trim();
    const subtitle = String(item?.subtitle || "").trim();
    const detail = String(item?.detail || "").trim();
    const hasMeta = !!(subtitle || detail);
    const iconText = item?.avatar ? "" : (item?.initials || item?.avatarText || item?.icon || "");
    const avatar = renderAvatar({ avatar: item?.avatar || "", initials: iconText, name: title, kind: item?.avatarKind || "default" });
    return `<div class="g-contact-row ${index === selectedIndex ? "selected" : ""} ${hasMeta ? "has-meta" : ""}" ${attrName}="${index}">${avatar}<div class="g-contact-body">${renderTextLine("g-contact-name", title)}${renderTextLine("g-contact-subtitle", subtitle)}${renderTextLine("g-contact-detail", detail)}</div></div>${index < items.length - 1 ? '<div class="rich-divider"></div>' : ""}`;
  }).join("")}</div>`;
}

export function renderChipBar({ chips = [], selectedIndex = 0, navigable = true, collapsed = false } = {}) {
  return `<div class="g-chips-wrap ${collapsed ? "collapsed" : ""}"><div class="g-chips">${chips.map((chip, index) => `<div class="g-chip ${navigable && index === selectedIndex ? "selected" : ""}" data-chip-id="${esc(chip.id || index)}">${esc(chip.label || "")}</div>`).join("")}</div></div>`;
}

export function renderTextBubble({ text = "", placeholder = "", mode = "static", hasText = false } = {}) {
  const value = String(text || "");
  const isListening = mode === "listening";
  const bubbleCls = `g-listen-field${isListening ? " compose-input" : ""}${hasText ? " has-text" : ""}`;
  const staticStyle = !isListening ? ' style="box-shadow:inset 0 1px 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.02);"' : "";
  if (value.trim()) return `<div class="${bubbleCls}"${staticStyle}><div class="g-listen-text">${esc(value)}</div></div>`;
  return `<div class="${bubbleCls}"${staticStyle}><div class="g-listen-empty">${esc(placeholder || "Listening...")}</div></div>`;
}

export function renderInputField({ text = "", placeholder = "Listening...", hasText = false } = {}) {
  return renderTextBubble({ text, placeholder, mode: "listening", hasText });
}

export function renderInfoCard({
  avatar = "",
  initials = "",
  avatarText = "",
  icon = "",
  title = "",
  subtitle = "",
  body = "",
  detail = "",
  expandable = false,
  expanded = false,
  chevron = true,
  sections = [],
  footerLabel = "",
  footerValue = "",
} = {}) {
  const normalizedSections = Array.isArray(sections) ? sections.filter(Boolean) : [];
  const shouldShowDetails = normalizedSections.length > 0 || footerLabel || footerValue;
  const chevronHtml = expandable && chevron && shouldShowDetails
    ? `<button type="button" class="g-info-chevron ${expanded ? "expanded" : ""}" aria-label="${expanded ? "Collapse details" : "Expand details"}" aria-expanded="${expanded ? "true" : "false"}"><span class="g-info-chevron-icon"></span></button>`
    : "";
  if (normalizedSections.length > 0) {
    const sectionHtml = normalizedSections.map((section) => {
      const sectionMedia = section?.avatar
        ? renderAvatar({ avatar: section.avatar, initials: section.initials || "", name: section?.title || "", kind: section?.avatarKind || "logo", cls: "g-info-section-ava" })
        : "";
      const bodyHtml = `${renderTextLine("g-info-eyebrow", section?.eyebrow || "")}${renderTextLine("g-info-title", section?.title || "")}${renderTextLine("g-info-subtitle", section?.subtitle || "")}${renderTextLine("g-info-detail", section?.detail || "")}`;
      return `<div class="g-listen-field g-info-card">${sectionMedia ? `<div class="g-info-card-row">${sectionMedia}<div class="g-info-card-body">${bodyHtml}</div></div>` : bodyHtml}</div>`;
    }).join('<div class="g-info-gap"></div>');
    const footerHtml = footerLabel || footerValue ? `<div class="g-info-footer"><div class="g-info-footer-label">${esc(footerLabel || "")}</div><div class="g-info-footer-value">${esc(footerValue || "")}</div></div>` : "";
    return `<div class="g-info-shell ${expandable ? "expandable" : ""} ${expanded ? "expanded" : ""}"><div class="g-info-summary-head">${renderTextLine("g-info-title", `${icon ? `${icon} ` : ""}${title}`)}${renderTextLine("g-info-subtitle", subtitle)}${renderTextLine("g-info-detail", body || detail)}${chevronHtml}</div><div class="g-info-expand-region">${sectionHtml}${footerHtml}</div></div>`;
  }
  const mediaText = avatar ? "" : (initials || avatarText || icon || "");
  const hasMedia = !!(String(avatar || "").trim() || String(mediaText || "").trim());
  if (hasMedia) {
    return `<div class="g-info-shell ${expandable ? "expandable" : ""} ${expanded ? "expanded" : ""}"><div class="g-info-summary-head g-info-summary-head--inline">${renderAvatar({ avatar, initials: mediaText, name: title, kind: "logo" })}<div class="g-contact-body">${renderTextLine("g-info-title", title)}${renderTextLine("g-info-subtitle", subtitle)}${renderTextLine("g-info-detail", body || detail)}</div>${chevronHtml}</div></div>`;
  }
  return `<div class="g-info-shell ${expandable ? "expandable" : ""} ${expanded ? "expanded" : ""}"><div class="g-info-summary-head">${renderTextLine("g-info-title", `${icon ? `${icon} ` : ""}${title}`)}${renderTextLine("g-info-subtitle", subtitle)}${renderTextLine("g-info-detail", body || detail)}${chevronHtml}</div></div>`;
}

export function renderFlightRouteStep({
  mode = "destination",
  routeRowHtml = "",
  depart = "",
  ret = "",
} = {}) {
  if (mode === "dates") {
    return `<div class="flight-date-step"><div class="flight-date-route-shared">${routeRowHtml}</div><div class="flight-date-panel"><div class="flight-date-panel-col"><div class="flight-date-panel-lbl">Depart</div><div class="flight-date-panel-val ${depart ? "" : "placeholder"}">${esc(depart)}</div></div><div class="flight-date-panel-divider"></div><div class="flight-date-panel-col"><div class="flight-date-panel-lbl">Return</div><div class="flight-date-panel-val ${ret ? "" : "placeholder"}">${esc(ret)}</div></div></div></div>`;
  }
  return `<div class="flight-destination-step">${routeRowHtml}</div>`;
}

export function renderActionRow({ actions = [], selectedIndex = 0 } = {}) {
  return `<div class="g-action-row enter">${actions.map((action, idx) => `<div class="g-action-btn ${idx === selectedIndex ? "selected" : ""}" data-action-id="${esc(action.id || idx)}">${action.iconHtml || esc(action.emoji || "")}</div>`).join("")}</div>`;
}

export function renderCompactStatus({ type = "loading", label = "", icon = "", dotsId = "g-thinking-dots" } = {}) {
  if (type === "loading") {
    return `<div class="g-center-row"><div class="g-spinner"></div><span id="${esc(dotsId)}">${esc(label || "·")}</span></div>`;
  }
  const finalIcon = icon || (type === "error" ? "⚠️" : "✅");
  return `<div data-glass-sent class="g-sent-toast"><span class="g-sent-emoji">${esc(finalIcon)}</span><span>${esc(label || (type === "error" ? "Failed" : "Success"))}</span></div>`;
}
