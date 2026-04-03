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

export function renderComposeHeader({ avatar = "", initials = "", name = "", visible = true } = {}) {
  return `<div class="g-compose-header ${visible ? "" : "is-hidden"}">${renderAvatar({ avatar, initials, name, cls: "g-compose-header-avatar" })}<div class="g-compose-header-text">To: ${esc(name)}</div></div>`;
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

// Reusable edge-light scaffold. Host containers can recolor it with
// --g-accent-rgb / --g-accent-secondary-rgb and toggle .selected / .is-accented.
export function renderAccentOrbitChrome() {
  return `<span class="g-accent-orbit" aria-hidden="true"><span class="g-accent-orbit-fill"></span><span class="g-accent-orbit-left-spot"></span><span class="g-accent-orbit-inner-glow"></span><span class="g-accent-orbit-middle"></span><span class="g-accent-orbit-ring"></span></span>`;
}

export function layoutDisambiguationPillItems(items = [], selectedIndex = 0, variant = "fan", options = {}) {
  const count = Math.max(0, Number(items?.length) || 0);
  if (count <= 0) return [];
  let positions;
  if (variant === "stack") {
    const pillHeight = 56;
    const gap = Number.isFinite(Number(options?.gap)) ? Math.max(0, Math.round(Number(options.gap))) : 8;
    const pillHalf = pillHeight / 2;
    const step = pillHeight + gap;
    const bottomY = Number.isFinite(Number(options?.bottomY))
      ? Math.round(Number(options.bottomY))
      : Math.round(-45 - gap - pillHalf);
    positions = Array.from({ length: count }, (_, index) => ({
      x: 0,
      y: bottomY - ((count - 1 - index) * step),
    }));
  } else if (count === 1) {
    positions = [{ x: 0, y: -88 }];
  } else if (count === 2) {
    positions = [{ x: 0, y: -136 }, { x: 0, y: -72 }];
  } else if (count === 3) {
    positions = [{ x: 0, y: -144 }, { x: -74, y: -84 }, { x: 74, y: -84 }];
  } else {
    const radiusX = Math.min(122, 84 + Math.max(0, count - 4) * 8);
    const radiusY = Math.min(116, 78 + Math.max(0, count - 4) * 6);
    positions = Array.from({ length: count }, (_, index) => {
      const span = Math.min(160, 88 + (count * 10));
      const start = -90 - (span / 2);
      const angle = (start + ((count === 1 ? 0 : span / (count - 1)) * index)) * (Math.PI / 180);
      return {
        x: Math.round(Math.cos(angle) * radiusX),
        y: Math.round(Math.sin(angle) * radiusY) - 34,
      };
    });
  }
  return positions.map((pos, index) => ({
    ...items[index],
    x: pos.x,
    y: pos.y,
    rotStart: pos.x >= 0 ? 10 : -10,
    delay: Math.max(0, (index * 42) - (index === selectedIndex ? 28 : 0)),
  }));
}

export function renderDisambiguationPills({ items = [], selectedIndex = 0, phase = "settled", rowDataAttr = "data-g-contact", clusterClass = "g-disambiguation-pills" } = {}) {
  const attrName = String(rowDataAttr || "data-g-contact").trim();
  return `<div data-glass-body class="${esc(clusterClass)}">${items.map((item, index) => {
    const selected = index === selectedIndex;
    const title = String(item?.name || item?.title || "").trim();
    const avatar = renderAvatar({ avatar: item?.avatar || "", initials: item?.initials || "", name: title, cls: "g-disambiguation-pill-media" });
    const rotStart = Number.isFinite(Number(item?.rotStart)) ? Number(item.rotStart) : (index % 2 === 0 ? -10 : 10);
    const delay = Number.isFinite(Number(item?.delay)) ? Number(item.delay) : Math.max(0, (index * 42) - (selected ? 28 : 0));
    const finalScale = selected ? 1 : 0.98;
    const accentRgb = String(item?.accentRgb || "").trim();
    const accentSecondaryRgb = String(item?.accentSecondaryRgb || "").trim();
    const orbitMs = Number.isFinite(Number(item?.orbitMs)) ? Math.max(600, Math.round(Number(item.orbitMs))) : null;
    const styleVars = [
      `--pill-x:${Math.round(Number(item?.x) || 0)}px`,
      `--pill-y:${Math.round(Number(item?.y) || 0)}px`,
      `--pill-rot-start:${rotStart}deg`,
      `--pill-delay:${delay}ms`,
      `--pill-scale-final:${finalScale}`,
    ];
    if (accentRgb) styleVars.push(`--g-accent-rgb:${esc(accentRgb)}`);
    if (accentSecondaryRgb) styleVars.push(`--g-accent-secondary-rgb:${esc(accentSecondaryRgb)}`);
    if (orbitMs !== null) styleVars.push(`--g-accent-orbit-ms:${orbitMs}ms`);
    return `<div class="g-disambiguation-pill g-accent-orbit-host ${selected ? "selected" : ""}" ${attrName}="${index}" aria-label="${esc(title)}" style="${styleVars.join(";")};">${renderAccentOrbitChrome()}${avatar}<div class="g-disambiguation-pill-text">${esc(title)}</div></div>`;
  }).join("")}</div>`;
}

export function renderChipBar({ chips = [], selectedIndex = 0, navigable = true, collapsed = false } = {}) {
  return `<div class="g-chips-wrap ${collapsed ? "collapsed" : ""}"><div class="g-chips">${chips.map((chip, index) => `<div class="g-chip ${navigable && index === selectedIndex ? "selected" : ""}" data-chip-id="${esc(chip.id || index)}">${esc(chip.label || "")}</div>`).join("")}</div></div>`;
}

const COMPOSE_CHIP_MOTION_PRESETS = [
  { rotStart: -12, rotEnd: -8, travelStart: 138, travelEnd: 108 },
  { rotStart: 8, rotEnd: 6, travelStart: 118, travelEnd: 92 },
  { rotStart: -6, rotEnd: -5, travelStart: 98, travelEnd: 78 },
  { rotStart: 10, rotEnd: 7, travelStart: 156, travelEnd: 122 },
  { rotStart: -10, rotEnd: -7, travelStart: 174, travelEnd: 136 },
];

function composeChipMotionVars(index) {
  const preset = COMPOSE_CHIP_MOTION_PRESETS[index];
  if (preset) return { order: index, ...preset };
  const overflowIndex = index - COMPOSE_CHIP_MOTION_PRESETS.length;
  const direction = index % 2 === 0 ? -1 : 1;
  return {
    order: index,
    rotStart: direction * (10 + ((overflowIndex % 3) * 2)),
    rotEnd: direction * (7 + (overflowIndex % 2)),
    travelStart: 174 + ((overflowIndex + 1) * 18),
    travelEnd: 136 + ((overflowIndex + 1) * 14),
  };
}

export function renderComposeChipStack({ chips = [], selectedIndex = 0, open = false, closing = false, visibleCount = 0 } = {}) {
  const resolvedVisibleCount = Math.max(0, Math.min(Number(visibleCount) || 0, chips.length));
  return `<div class="g-compose-chip-stack ${open ? "open" : ""} ${closing ? "closing" : ""} ${resolvedVisibleCount > 3 ? "expanded" : ""}" data-visible-count="${resolvedVisibleCount}">${chips.map((chip, index) => {
    const accentRgb = String(chip?.accentRgb || "255 255 255").trim();
    const accentSecondaryRgb = String(chip?.accentSecondaryRgb || accentRgb).trim();
    const orbitMs = Number.isFinite(Number(chip?.orbitMs)) ? Math.max(600, Math.round(Number(chip.orbitMs))) : null;
    const motion = composeChipMotionVars(index);
    const styleVars = [
      `--chip-order:${motion.order}`,
      `--chip-rot-start:${motion.rotStart}deg`,
      `--chip-rot-end:${motion.rotEnd}deg`,
      `--chip-travel-start:${motion.travelStart}px`,
      `--chip-travel-end:${motion.travelEnd}px`,
    ];
    if (accentRgb) styleVars.push(`--g-accent-rgb:${esc(accentRgb)}`);
    if (accentSecondaryRgb) styleVars.push(`--g-accent-secondary-rgb:${esc(accentSecondaryRgb)}`);
    if (orbitMs !== null) styleVars.push(`--g-accent-orbit-ms:${orbitMs}ms`);
    const styleAttr = styleVars.length ? ` style="${styleVars.join(";")};"` : "";
    return `<div class="g-compose-chip g-accent-orbit-host ${index === selectedIndex ? "selected" : ""} ${index < resolvedVisibleCount ? "is-visible" : ""}" data-chip-id="${esc(chip.id || index)}"${styleAttr}>${renderAccentOrbitChrome()}<span class="g-compose-chip-label">${esc(chip.label || "")}</span></div>`;
  }).join("")}</div>`;
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

export function renderComposeField({ text = "", placeholder = "Speak your message...", active = false, magicPending = false } = {}) {
  const value = String(text || "").trim();
  const fieldCls = `g-compose-field${active ? " active" : ""}${value ? " has-text" : ""}${magicPending ? " g-compose-field-magic-pending" : ""}`;
  if (value) {
    return `<div class="${fieldCls}" data-compose-field><div class="g-compose-field-text${magicPending ? " g-compose-text-pending" : ""}" data-compose-field-text>${esc(text)}</div></div>`;
  }
  return `<div class="${fieldCls}" data-compose-field><div class="g-compose-field-empty">${esc(placeholder)}</div></div>`;
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
  focused = false,
  scrollableExpand = false,
  expandMaxHeight = "",
  sections = [],
  footerLabel = "",
  footerValue = "",
} = {}) {
  const normalizedSections = Array.isArray(sections) ? sections.filter(Boolean) : [];
  const shouldShowDetails = normalizedSections.length > 0 || footerLabel || footerValue;
  const shellStyle = expandMaxHeight ? ` style="--g-info-expand-max-h:${esc(expandMaxHeight)};"` : "";
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
    return `<div data-confirm-shell class="g-info-shell ${expandable ? "expandable" : ""} ${expanded ? "expanded" : ""} ${focused ? "focused" : ""}"${shellStyle}><div class="g-info-summary-head">${renderTextLine("g-info-title", `${icon ? `${icon} ` : ""}${title}`)}${renderTextLine("g-info-subtitle", subtitle)}${renderTextLine("g-info-detail", body || detail)}${chevronHtml}</div><div data-confirm-scroll class="g-info-expand-region ${scrollableExpand ? "scrollable" : ""}">${sectionHtml}${footerHtml}</div></div>`;
  }
  const mediaText = avatar ? "" : (initials || avatarText || icon || "");
  const hasMedia = !!(String(avatar || "").trim() || String(mediaText || "").trim());
  if (hasMedia) {
    return `<div data-confirm-shell class="g-info-shell ${expandable ? "expandable" : ""} ${expanded ? "expanded" : ""} ${focused ? "focused" : ""}"${shellStyle}><div class="g-info-summary-head g-info-summary-head--inline">${renderAvatar({ avatar, initials: mediaText, name: title, kind: "logo" })}<div class="g-contact-body">${renderTextLine("g-info-title", title)}${renderTextLine("g-info-subtitle", subtitle)}${renderTextLine("g-info-detail", body || detail)}</div>${chevronHtml}</div></div>`;
  }
  return `<div data-confirm-shell class="g-info-shell ${expandable ? "expandable" : ""} ${expanded ? "expanded" : ""} ${focused ? "focused" : ""}"${shellStyle}><div class="g-info-summary-head">${renderTextLine("g-info-title", `${icon ? `${icon} ` : ""}${title}`)}${renderTextLine("g-info-subtitle", subtitle)}${renderTextLine("g-info-detail", body || detail)}${chevronHtml}</div></div>`;
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

export function renderCompactStatus({ type = "loading", label = "", icon = "", dotsId = "g-thinking-dots", enter = false } = {}) {
  if (type === "loading") {
    return `<div class="g-center-row"><span id="${esc(dotsId)}">${esc(label || "·")}</span></div>`;
  }
  const finalIcon = icon || (type === "error" ? "⚠️" : "✅");
  return `<div data-glass-sent class="g-sent-toast${enter ? " sent-toast-enter" : ""}"><span class="g-sent-emoji">${esc(finalIcon)}</span><span>${esc(label || (type === "error" ? "Failed" : "Success"))}</span></div>`;
}

export function renderSendingStatus({ label = "sending..." } = {}) {
  return `<div class="g-sending-status"><div class="g-sending-label">${esc(label)}</div></div>`;
}
