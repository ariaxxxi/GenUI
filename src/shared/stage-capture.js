function fileSafeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
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

/* ── Preprocessing: inline cross-origin images before capture ── */

const TRANSPARENT_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==";

function imgToDataUrl(imgEl) {
  const c = document.createElement("canvas");
  c.width = imgEl.naturalWidth || imgEl.width || 1;
  c.height = imgEl.naturalHeight || imgEl.height || 1;
  c.getContext("2d").drawImage(imgEl, 0, 0);
  return c.toDataURL("image/png");
}

/**
 * Pre-process images: replace cross-origin <img> src with inline data URLs.
 * This prevents CORS errors during capture. Returns a restore function.
 */
function preprocessImages(root) {
  const originals = [];
  root.querySelectorAll("img").forEach((img) => {
    const src = img.src;
    if (!src || src.startsWith("data:")) return;
    const originalSrc = src;
    try {
      // If the image is already loaded and same-origin, convert via canvas
      if (img.complete && img.naturalWidth > 0) {
        img.src = imgToDataUrl(img);
        originals.push({ img, originalSrc });
      }
    } catch (_) {
      // Cross-origin tainted — use placeholder
      img.src = TRANSPARENT_1PX;
      originals.push({ img, originalSrc });
    }
  });
  return () => {
    for (const { img, originalSrc } of originals) {
      img.src = originalSrc;
    }
  };
}

/**
 * Pre-process canvas elements: convert to static images.
 * Returns a restore function.
 */
function preprocessCanvases(root) {
  const originals = [];
  root.querySelectorAll("canvas").forEach((canvas) => {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const img = document.createElement("img");
      img.src = dataUrl;
      img.width = canvas.width;
      img.height = canvas.height;
      img.style.cssText = canvas.style.cssText;
      canvas.parentNode.insertBefore(img, canvas);
      canvas.style.display = "none";
      originals.push({ canvas, img });
    } catch (_) { /* tainted — skip */ }
  });
  return () => {
    for (const { canvas, img } of originals) {
      canvas.style.display = "";
      img.remove();
    }
  };
}

/* ── Capture via modern-screenshot ── */

const captureOptions = {
  backgroundColor: "#000",
  style: {
    "mix-blend-mode": "normal",
    "animation": "none",
  },
  fetch: {
    placeholderImage: TRANSPARENT_1PX,
    bypassingCache: false,
  },
  timeout: 30000,
};

async function captureToBlob(root) {
  const { domToBlob } = window.modernScreenshot;
  const restoreImages = preprocessImages(root);
  const restoreCanvases = preprocessCanvases(root);
  try {
    return await domToBlob(root, captureOptions);
  } finally {
    restoreCanvases();
    restoreImages();
  }
}

async function captureToPng(root) {
  const { domToPng } = window.modernScreenshot;
  const restoreImages = preprocessImages(root);
  const restoreCanvases = preprocessCanvases(root);
  try {
    return await domToPng(root, captureOptions);
  } finally {
    restoreCanvases();
    restoreImages();
  }
}

/* ── Public API ── */

export async function copyStagePngToClipboard({ root, documentRef = document } = {}) {
  const captureRoot = root || getStageCaptureRoot("#stage", documentRef);
  if (!captureRoot) return false;

  if (!navigator.clipboard || typeof window.ClipboardItem === "undefined" || !navigator.clipboard.write) {
    console.warn("[stage-capture] Clipboard image write not supported.");
    return false;
  }

  try {
    const blob = await captureToBlob(captureRoot);
    if (!blob) {
      console.warn("[stage-capture] Capture returned no blob.");
      return false;
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch (err) {
    console.warn("[stage-capture] PNG copy failed:", err);
    return false;
  }
}

export async function exportStageSvg({ root, filenamePrefix = "stage", documentRef = document } = {}) {
  const captureRoot = root || getStageCaptureRoot("#stage", documentRef);
  if (!captureRoot) return false;

  try {
    const pngDataUrl = await captureToPng(captureRoot);
    if (!pngDataUrl) {
      console.warn("[stage-capture] Capture returned no data.");
      return false;
    }

    const rect = captureRoot.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    // Figma-compatible SVG with embedded PNG raster
    const svgContent = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<image href="${pngDataUrl}" x="0" y="0" width="${width}" height="${height}"/>`,
      "</svg>",
    ].join("");

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = documentRef.createElement("a");
    anchor.href = url;
    anchor.download = `${filenamePrefix}-${fileSafeTimestamp()}.svg`;
    documentRef.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.warn("[stage-capture] SVG export failed:", err);
    return false;
  }
}
