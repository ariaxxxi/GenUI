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

/* ── Font embedding: inline Google Fonts as base64 @font-face ── */

let _fontStyleEl = null;

async function ensureFontsInlined() {
  // Only do this once
  if (_fontStyleEl) return;

  const fontLinks = document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
  if (fontLinks.length === 0) return;

  const allRules = [];
  for (const link of fontLinks) {
    try {
      const resp = await fetch(link.href);
      const cssText = await resp.text();
      const fontFaceRegex = /@font-face\s*\{[^}]+\}/g;
      let match;
      while ((match = fontFaceRegex.exec(cssText)) !== null) {
        allRules.push(match[0]);
      }
    } catch (_) { /* fetch failed */ }
  }

  if (allRules.length === 0) return;

  // Fetch each font URL and replace with base64 data URL
  const urlCache = new Map();
  const inlinedRules = [];

  for (const rule of allRules) {
    let inlined = rule;
    const urlRegex = /url\(([^)]+)\)/g;
    let m;
    const urls = [];
    while ((m = urlRegex.exec(rule)) !== null) {
      const url = m[1].replace(/['"]/g, "");
      if (!url.startsWith("data:")) urls.push({ full: m[0], url });
    }

    for (const { full, url } of urls) {
      if (!urlCache.has(url)) {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
          urlCache.set(url, dataUrl);
        } catch (_) {
          urlCache.set(url, null);
        }
      }
      const dataUrl = urlCache.get(url);
      if (dataUrl) {
        inlined = inlined.replace(full, `url(${dataUrl})`);
      }
    }
    inlinedRules.push(inlined);
  }

  // Inject as a <style> element so all capture libraries can access these fonts
  _fontStyleEl = document.createElement("style");
  _fontStyleEl.textContent = inlinedRules.join("\n");
  document.head.appendChild(_fontStyleEl);
}

/* ── Capture via modern-screenshot ── */

function getCaptureOptions(root) {
  const rect = root.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  return {
    backgroundColor: null,
    scale: 2,
    width,
    height,
    style: {
      "mix-blend-mode": "normal",
      "animation": "none",
      width: width + "px",
      height: height + "px",
      overflow: "visible",
    },
    fetch: {
      placeholderImage: TRANSPARENT_1PX,
      bypassingCache: false,
    },
    timeout: 30000,
  };
}

function hideStageOutline() {
  const style = document.createElement("style");
  style.textContent = "#stage::after { box-shadow: none !important; }";
  document.head.appendChild(style);
  return () => style.remove();
}

async function captureToBlob(root) {
  const { domToBlob } = window.modernScreenshot;
  await ensureFontsInlined();
  const restoreOutline = hideStageOutline();
  const restoreImages = preprocessImages(root);
  const restoreCanvases = preprocessCanvases(root);
  try {
    return await domToBlob(root, getCaptureOptions(root));
  } finally {
    restoreCanvases();
    restoreImages();
    restoreOutline();
  }
}

async function captureToPng(root) {
  const { domToPng } = window.modernScreenshot;
  await ensureFontsInlined();
  const restoreOutline = hideStageOutline();
  const restoreImages = preprocessImages(root);
  const restoreCanvases = preprocessCanvases(root);
  try {
    return await domToPng(root, getCaptureOptions(root));
  } finally {
    restoreCanvases();
    restoreImages();
    restoreOutline();
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
    const width = Math.ceil(rect.width) * 2;
    const height = Math.ceil(rect.height) * 2;

    // Figma-compatible SVG with embedded PNG raster at 2x
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
