export function measureSuccessToastGeometry({
  richRoot,
  pillShape,
  fallbackLabel = "",
  clamp = (value, min, max) => Math.max(min, Math.min(max, value)),
}) {
  const base = pillShape || {};
  const textEl = richRoot?.querySelector?.("[data-glass-sent]");
  let w = 200;
  let h = 52;
  if (textEl) {
    const rect = textEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      w = clamp(Math.round(rect.width + 48), 140, 360);
      h = clamp(Math.round(rect.height + 32), 52, 140);
    }
  }
  if (!(w > 0)) {
    const text = String(fallbackLabel || "").trim();
    w = clamp(Math.round(text.length * 11 + 96), 160, 360);
  }
  return {
    ...base,
    main: {
      ...(base.main || {}),
      w,
      h,
      tx: -(w / 2),
      ty: -(h / 2) - 18,
    },
  };
}

export function applyFlowChromeVisibility({ C, active, richSent = false }) {
  if (!C) return;
  if (C.thumb) C.thumb.style.opacity = active ? "0" : "";
  if (C.prim) C.prim.style.opacity = active ? "0" : "";
  if (C.sec) C.sec.style.opacity = active ? "0" : "";
  if (C.det) C.det.style.opacity = active ? "0" : "";
  if (C.div) C.div.style.opacity = active ? "0" : "";
  if (C.div) C.div.style.display = (active && richSent) ? "none" : "";
}
