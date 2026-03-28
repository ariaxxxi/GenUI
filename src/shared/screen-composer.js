import {
  renderActionRow,
  renderChipBar,
  renderCompactStatus,
  renderContactHeader,
  renderFlightRouteStep,
  renderInfoCard,
  renderInputField,
  renderSelectionList,
  renderTextBubble,
} from "../flows/ui-primitives.js";

const PRIMITIVE_RENDERERS = {
  contact_header: renderContactHeader,
  selection_list: renderSelectionList,
  chip_bar: renderChipBar,
  text_bubble: renderTextBubble,
  input_field: renderInputField,
  info_card: renderInfoCard,
  compact_status: renderCompactStatus,
  flight_route_step: renderFlightRouteStep,
};

function escAttr(value) {
  return String(value ?? "").replace(/"/g, "&quot;");
}

function applyRichState(richRoot, spec = {}) {
  if (!richRoot) return;
  const prevClasses = richRoot.__screenComposerClasses || [];
  prevClasses.forEach((name) => richRoot.classList.remove(name));
  const nextClasses = Array.isArray(spec.richClasses) ? spec.richClasses.filter(Boolean) : [];
  nextClasses.forEach((name) => richRoot.classList.add(name));
  richRoot.__screenComposerClasses = nextClasses;

  const prevDataset = richRoot.__screenComposerDataset || [];
  prevDataset.forEach((key) => {
    delete richRoot.dataset[key];
  });
  const nextDataset = spec.richDataset && typeof spec.richDataset === "object" ? Object.entries(spec.richDataset) : [];
  nextDataset.forEach(([key, value]) => {
    richRoot.dataset[key] = value;
  });
  richRoot.__screenComposerDataset = nextDataset.map(([key]) => key);

  const prevStyleKeys = richRoot.__screenComposerStyleKeys || [];
  prevStyleKeys.forEach((key) => {
    richRoot.style[key] = "";
  });
  const nextStyle = spec.richStyle && typeof spec.richStyle === "object" ? Object.entries(spec.richStyle) : [];
  nextStyle.forEach(([key, value]) => {
    richRoot.style[key] = value ?? "";
  });
  richRoot.__screenComposerStyleKeys = nextStyle.map(([key]) => key);
}

export function renderScreenMarkup(spec = {}) {
  const layout = Array.isArray(spec.layout) ? spec.layout : [];
  const props = spec.props && typeof spec.props === "object" ? spec.props : {};
  const html = layout.map((key) => {
    const renderer = PRIMITIVE_RENDERERS[key];
    if (!renderer) {
      const msg = `Unknown screen composer layout key: ${key}`;
      console.warn(msg, spec);
      throw new Error(msg);
    }
    return renderer(props[key] || {});
  }).join("");
  if (!html) return "";
  if (!spec.wrapBody) return html;
  const bodyClass = spec.bodyClass ? ` class="${escAttr(spec.bodyClass)}"` : "";
  const bodyOpen = spec.bodyClass ? `<div${bodyClass}>` : "";
  const bodyClose = spec.bodyClass ? "</div>" : "";
  return `<div data-glass-body>${bodyOpen}${html}${bodyClose}</div>`;
}

export function composeScreen({
  documentRef,
  richRoot,
  controlsRoot,
  intentHeaderRoot,
  setIntentHeader,
  hideIntentHeader,
  positionIntentHeaderAboveMain,
  trackIntentHeaderForTransition,
  spec = {},
}) {
  if (!documentRef || !richRoot) return;

  applyRichState(richRoot, spec);
  richRoot.innerHTML = renderScreenMarkup(spec);

  if (typeof spec.intentHeader === "string" && spec.intentHeader.trim()) {
    setIntentHeader?.(spec.intentHeader, null);
    const hdr = intentHeaderRoot || documentRef.getElementById("intent-header");
    if (hdr) hdr.classList.add("glass-intent");
    positionIntentHeaderAboveMain?.();
    trackIntentHeaderForTransition?.();
  } else {
    hideIntentHeader?.();
  }

  if (!controlsRoot) return;
  controlsRoot.innerHTML = "";
  const actions = Array.isArray(spec.actions) ? spec.actions : [];
  if (actions.length) {
    controlsRoot.innerHTML = `<div class="g-glass-controls">${renderActionRow({
      actions,
      selectedIndex: Number.isFinite(spec.actionSelectedIndex) ? spec.actionSelectedIndex : 0,
    })}</div>`;
    controlsRoot.classList.add("visible");
  } else {
    controlsRoot.classList.remove("visible");
  }
}
