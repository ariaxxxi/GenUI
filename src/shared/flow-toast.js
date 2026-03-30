import { clamp } from "../utils.js";

export function ensureMeasureLayer(id) {
  let layer = document.getElementById(id);
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = id;
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:380px;visibility:hidden;pointer-events:none;z-index:-1;";
  document.body.appendChild(layer);
  return layer;
}

export function positionControlsOverlay(layer, controlsGap = 14) {
  const stage = document.getElementById("stage");
  const main = document.getElementById("drop-main");
  const controls = layer?.querySelector(".g-glass-controls");
  if (!layer || !stage || !main || !controls) return false;
  const stageRect = stage.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const controlsRect = controls.getBoundingClientRect();
  const centerX = (mainRect.left + (mainRect.width / 2)) - stageRect.left;
  const topY = Math.min((mainRect.bottom - stageRect.top) + controlsGap, Math.max(8, stageRect.height - controlsRect.height - 8));
  controls.style.left = `${Math.round(centerX)}px`;
  controls.style.top = `${Math.round(topY)}px`;
  return true;
}

export function measureSuccessToastGeometry({
  richRoot,
  pillShape,
  fallbackLabel = "",
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
