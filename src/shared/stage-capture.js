function fileSafeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function isElementNode(value) {
  return value && value.nodeType === Node.ELEMENT_NODE;
}

function inlineComputedStyles(sourceEl, cloneEl) {
  if (!isElementNode(sourceEl) || !isElementNode(cloneEl)) return;
  const sourceStyle = window.getComputedStyle(sourceEl);
  let cssText = "";
  for (let i = 0; i < sourceStyle.length; i += 1) {
    const prop = sourceStyle[i];
    cssText += `${prop}:${sourceStyle.getPropertyValue(prop)};`;
  }
  cloneEl.setAttribute("style", cssText);

  const sourceChildren = sourceEl.children || [];
  const cloneChildren = cloneEl.children || [];
  const count = Math.min(sourceChildren.length, cloneChildren.length);
  for (let i = 0; i < count; i += 1) {
    inlineComputedStyles(sourceChildren[i], cloneChildren[i]);
  }
}

function svgToDataUrl(svgText) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

export function getStageCaptureRoot(selector = "#stage", documentRef = document) {
  const root = documentRef.querySelector(selector);
  if (!root) {
    console.warn(`[stage-capture] Capture root not found for selector: ${selector}`);
    return null;
  }
  return root;
}

export function isEditableTarget(target) {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return !!el.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])");
}

export function getCaptureHotkeyAction(event) {
  if (!event || isEditableTarget(event.target)) return null;
  const hasPrimaryMod = !!(event.metaKey || event.ctrlKey);
  if (!hasPrimaryMod || !event.shiftKey || event.altKey) return null;
  const key = String(event.key || "").toLowerCase();
  if (key === "c") return "copy-png";
  if (key === "e") return "export-svg";
  return null;
}

export function buildStageSvg({ root, documentRef = document } = {}) {
  const captureRoot = root || getStageCaptureRoot("#stage", documentRef);
  if (!captureRoot) return null;

  const rect = captureRoot.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  const clone = captureRoot.cloneNode(true);
  inlineComputedStyles(captureRoot, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.margin = "0";

  const nsSvg = "http://www.w3.org/2000/svg";
  const svgEl = documentRef.createElementNS(nsSvg, "svg");
  svgEl.setAttribute("xmlns", nsSvg);
  svgEl.setAttribute("width", String(width));
  svgEl.setAttribute("height", String(height));
  svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const foreignObject = documentRef.createElementNS(nsSvg, "foreignObject");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");

  const wrapper = documentRef.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.appendChild(clone);
  foreignObject.appendChild(wrapper);
  svgEl.appendChild(foreignObject);

  const serialized = new XMLSerializer().serializeToString(svgEl);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>${serialized}`;

  return { svg, width, height };
}

export async function exportStageSvg({ root, filenamePrefix = "stage", documentRef = document } = {}) {
  const payload = buildStageSvg({ root, documentRef });
  if (!payload) return false;
  const blob = new Blob([payload.svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${fileSafeTimestamp()}.svg`;
  documentRef.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

function createCanvas(width, height) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return canvas;
}

async function drawSvgToCanvas(svgBlob, svgText, width, height) {
  const canvas = createCanvas(width, height);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(svgBlob);
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      return canvas;
    } catch (err) {
      console.warn("[stage-capture] createImageBitmap failed, falling back to Image:", err);
    }
  }

  const sources = [URL.createObjectURL(svgBlob), svgToDataUrl(svgText)];
  try {
    for (const src of sources) {
      const image = new Image();
      const loaded = new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = (err) => reject(err);
      });
      image.src = src;
      await loaded;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      return canvas;
    }
  } finally {
    URL.revokeObjectURL(sources[0]);
  }
  return null;
}

export async function copyStagePngToClipboard({ root, documentRef = document } = {}) {
  const payload = buildStageSvg({ root, documentRef });
  if (!payload) return false;
  const svgBlob = new Blob([payload.svg], { type: "image/svg+xml;charset=utf-8" });
  let canvas = null;
  try {
    canvas = await drawSvgToCanvas(svgBlob, payload.svg, payload.width, payload.height);
  } catch (err) {
    console.warn("[stage-capture] Failed to render SVG image for clipboard copy:", err);
    return false;
  }
  if (!canvas) {
    console.warn("[stage-capture] Unable to render canvas for clipboard copy.");
    return false;
  }
  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!pngBlob) {
    console.warn("[stage-capture] Failed to encode PNG blob.");
    return false;
  }
  if (!navigator.clipboard || typeof window.ClipboardItem === "undefined" || !navigator.clipboard.write) {
    console.warn("[stage-capture] Clipboard image write not supported in this environment.");
    return false;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    return true;
  } catch (err) {
    console.warn("[stage-capture] Clipboard write failed:", err);
    return false;
  }
}
