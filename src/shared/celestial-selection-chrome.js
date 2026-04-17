import { celestialSelectedPresetForRenderShape } from "./celestial-selected-presets.js";

const DEFAULT_DIRECTION = "bottom";
const DEFAULT_DURATION_MS = 700;

export function hexToCssColor(value, fallback = "rgb(144 172 255)") {
  const raw = String(value || "").trim();
  const full = raw.match(/^#([0-9a-f]{6})$/i);
  if (full) {
    const hex = full[1];
    return `rgb(${parseInt(hex.slice(0, 2), 16)} ${parseInt(hex.slice(2, 4), 16)} ${parseInt(hex.slice(4, 6), 16)})`;
  }
  const short = raw.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    const hex = short[1];
    return `rgb(${parseInt(hex[0] + hex[0], 16)} ${parseInt(hex[1] + hex[1], 16)} ${parseInt(hex[2] + hex[2], 16)})`;
  }
  return raw || fallback;
}

function readCssVar(el, name) {
  if (!el) return "";
  const inlineValue = el.style?.getPropertyValue?.(name)?.trim?.() || "";
  if (inlineValue) return inlineValue;
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function buildZeroSpreadMaskUrl(width, height, radius, blurBase) {
  const blur = Math.max(0, (height * blurBase) / 56);
  const stdDeviation = blur / 2;
  const spread = Math.max(0, (height * 3) / 56);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${width} ${height}" fill="none">
      <g filter="url(#f)">
        <rect width="${width}" height="${height}" rx="${radius}" fill="black"/>
      </g>
      <defs>
        <filter id="f" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feMorphology in="hardAlpha" operator="dilate" radius="${spread}" result="spreadAlpha"/>
          <feGaussianBlur in="spreadAlpha" stdDeviation="${stdDeviation}" result="blurredSpread"/>
          <feComposite in="blurredSpread" in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" result="innerShadowAlpha"/>
          <feColorMatrix in="innerShadowAlpha" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" result="innerShadowColor"/>
          <feBlend mode="normal" in="innerShadowColor" in2="shape" result="effect1_innerShadow"/>
        </filter>
      </defs>
    </svg>
  `.replace(/\s+/g, " ").trim();
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function applySelectedChromePreset(chromeEl, hostEl, preset, colorOverrides = {}, geometryOverride = null, runtimeOverrides = {}) {
  if (!chromeEl || !hostEl || !preset) return;
  const rect = geometryOverride ? null : hostEl.getBoundingClientRect();
  const width = Math.max(
    1,
    Math.round(
      Number(geometryOverride?.width)
      || Number.parseFloat(hostEl.style.width)
      || rect?.width
      || hostEl.offsetWidth
      || 1,
    ),
  );
  const height = Math.max(
    1,
    Math.round(
      Number(geometryOverride?.height)
      || Number.parseFloat(hostEl.style.height)
      || rect?.height
      || hostEl.offsetHeight
      || 1,
    ),
  );
  const computed = getComputedStyle(hostEl);
  const radius = Math.max(
    0,
    Number(geometryOverride?.radius)
    || Number.parseFloat(hostEl.style.borderRadius)
    || Number.parseFloat(computed.borderRadius)
    || Math.min(width, height) / 2,
  );
  const blobTopCore = hexToCssColor(colorOverrides.blobTopCore, hexToCssColor(preset.blobTopCore, "rgb(144 172 255)"));
  const blobTopEdge = hexToCssColor(colorOverrides.blobTopEdge, hexToCssColor(preset.blobTopEdge, blobTopCore));
  const blobBottomCore = hexToCssColor(colorOverrides.blobBottomCore, hexToCssColor(preset.blobBottomCore, blobTopCore));
  const blobBottomEdge = hexToCssColor(colorOverrides.blobBottomEdge, hexToCssColor(preset.blobBottomEdge, blobBottomCore));
  const maskBlur = Number.isFinite(Number(runtimeOverrides.maskBlur))
    ? Number(runtimeOverrides.maskBlur)
    : preset.maskBlur;
  const rimPrimary = blobTopCore;
  const rimSecondary = blobBottomCore;
  const unit = Math.max(0.65, Math.min(width, height) / 320);
  const highlightScale = preset.highlightScale / 100;
  const topHighlightWidth = Math.round(84 * highlightScale);
  const topHighlightHeight = Math.round(84 * highlightScale);
  const bottomHighlightWidth = Math.round(96 * highlightScale);
  const bottomHighlightHeight = Math.round(96 * highlightScale);
  const topHighlightAnchorX = 10 - (topHighlightWidth / 2) + preset.highlightTopX;
  const topHighlightAnchorY = 10 - (topHighlightHeight / 2) + preset.highlightTopY;
  const bottomHighlightAnchorX = (bottomHighlightWidth / 2) + preset.highlightBottomX;
  const bottomHighlightAnchorY = (bottomHighlightHeight / 2) + preset.highlightBottomY;
  const blobSize = Math.round(Math.max(height * 1.9, Math.min(width * 0.42, height * 2.4)));
  const blobBlurPx = unit * preset.blobBlur;
  const innerGlowBlurPx = (height * preset.innerGlowBlur) / 56;

  hostEl.style.setProperty("--g-stage-selected-rgb", rimPrimary);
  hostEl.style.setProperty("--g-stage-selected-secondary-rgb", rimSecondary);
  hostEl.style.setProperty("--g-stage-selected-blob-top-core", blobTopCore);
  hostEl.style.setProperty("--g-stage-selected-blob-top-edge", blobTopEdge);
  hostEl.style.setProperty("--g-stage-selected-blob-bottom-core", blobBottomCore);
  hostEl.style.setProperty("--g-stage-selected-blob-bottom-edge", blobBottomEdge);

  chromeEl.style.setProperty("--g-stage-h", `${height}px`);
  chromeEl.style.setProperty("--g-stage-selected-unit", `${unit}px`);
  chromeEl.style.setProperty("--g-stage-selected-mask-url", buildZeroSpreadMaskUrl(width, height, radius, maskBlur));
  chromeEl.style.setProperty("--g-stage-selected-rgb", rimPrimary);
  chromeEl.style.setProperty("--g-stage-selected-secondary-rgb", rimSecondary);
  chromeEl.style.setProperty("--g-stage-selected-blob-top-core", blobTopCore);
  chromeEl.style.setProperty("--g-stage-selected-blob-top-edge", blobTopEdge);
  chromeEl.style.setProperty("--g-stage-selected-blob-bottom-core", blobBottomCore);
  chromeEl.style.setProperty("--g-stage-selected-blob-bottom-edge", blobBottomEdge);
  chromeEl.style.setProperty("--g-stage-selected-blob-size", `${blobSize}px`);
  chromeEl.style.setProperty("--g-stage-selected-blob-blur", `${blobBlurPx.toFixed(2)}px`);
  chromeEl.style.setProperty("--g-stage-selected-blob-top-x", `${preset.blobTopX}%`);
  chromeEl.style.setProperty("--g-stage-selected-blob-top-y", `${preset.blobTopY}%`);
  chromeEl.style.setProperty("--g-stage-selected-blob-bottom-x", `${preset.blobBottomX}%`);
  chromeEl.style.setProperty("--g-stage-selected-blob-bottom-y", `${preset.blobBottomY}%`);
  chromeEl.style.setProperty("--g-stage-selected-inner-glow-blur", `${innerGlowBlurPx.toFixed(2)}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-top-end-x", `${topHighlightAnchorX}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-top-end-y", `${topHighlightAnchorY}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-bottom-end-x", `${bottomHighlightAnchorX}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-bottom-end-y", `${bottomHighlightAnchorY}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-top-width", `${topHighlightWidth}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-top-height", `${topHighlightHeight}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-bottom-width", `${bottomHighlightWidth}px`);
  chromeEl.style.setProperty("--g-stage-selected-highlight-bottom-height", `${bottomHighlightHeight}px`);
}

function presetKeyForSelectionHost(hostEl) {
  if (!hostEl) return "list";
  if (hostEl.matches("#prototype-stage-selection, .g-contact-row, .g-compose-field, .g-flight-rec-option")) {
    return "pill";
  }
  if (hostEl.matches("#siri-orb, .ai-flow-orb-sphere")) {
    return "list";
  }
  return "list";
}

function hostChromePair(node) {
  if (!node) return null;
  if (node.id === "prototype-stage-selection") {
    return {
      chromeEl: node,
      hostEl: document.getElementById("drop-main") || node,
      presetKey: presetKeyForSelectionHost(node),
    };
  }
  if (node.classList?.contains("ai-flow-orb-selection")) {
    const hostEl = node.closest(".ai-flow-orb-sphere") || document.getElementById("siri-orb") || node;
    return {
      chromeEl: node,
      hostEl,
      presetKey: presetKeyForSelectionHost(hostEl),
    };
  }
  const chromeEl = node.querySelector?.(":scope > .g-selection-chrome");
  if (!chromeEl) return null;
  return {
    chromeEl,
    hostEl: node,
    presetKey: presetKeyForSelectionHost(node),
  };
}

function chromeColorOverrides(hostEl, chromeEl, preset) {
  const presetCss = {
    blobTopCore: hexToCssColor(preset.blobTopCore, "rgb(144 172 255)"),
    blobTopEdge: hexToCssColor(preset.blobTopEdge, hexToCssColor(preset.blobTopCore, "rgb(144 172 255)")),
    blobBottomCore: hexToCssColor(preset.blobBottomCore, hexToCssColor(preset.blobTopCore, "rgb(144 172 255)")),
    blobBottomEdge: hexToCssColor(preset.blobBottomEdge, hexToCssColor(preset.blobBottomCore, "rgb(151 97 255)")),
  };
  const resolved = { ...presetCss };
  const explicitTopCore = readCssVar(chromeEl, "--g-stage-selected-blob-top-core") || readCssVar(hostEl, "--g-stage-selected-blob-top-core");
  const explicitTopEdge = readCssVar(chromeEl, "--g-stage-selected-blob-top-edge") || readCssVar(hostEl, "--g-stage-selected-blob-top-edge");
  const explicitBottomCore = readCssVar(chromeEl, "--g-stage-selected-blob-bottom-core") || readCssVar(hostEl, "--g-stage-selected-blob-bottom-core");
  const explicitBottomEdge = readCssVar(chromeEl, "--g-stage-selected-blob-bottom-edge") || readCssVar(hostEl, "--g-stage-selected-blob-bottom-edge");
  if (explicitTopCore) resolved.blobTopCore = explicitTopCore;
  if (explicitTopEdge) resolved.blobTopEdge = explicitTopEdge;
  if (explicitBottomCore) resolved.blobBottomCore = explicitBottomCore;
  if (explicitBottomEdge) resolved.blobBottomEdge = explicitBottomEdge;
  return resolved;
}

export function applyAiCelestialChrome(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  const selectors = [
    "#prototype-stage-selection",
    "#siri-orb .ai-flow-orb-selection",
    ".g-stage-selected-host",
  ];
  scope.querySelectorAll(selectors.join(", ")).forEach((node) => {
    const pair = hostChromePair(node);
    if (!pair) return;
    const preset = celestialSelectedPresetForRenderShape(pair.presetKey);
    applySelectedChromePreset(
      pair.chromeEl,
      pair.hostEl,
      preset,
      chromeColorOverrides(pair.hostEl, pair.chromeEl, preset),
      null,
      { maskBlur: preset.maskBlur },
    );
    if (!pair.chromeEl.dataset.stageDirection) {
      pair.chromeEl.dataset.stageDirection = DEFAULT_DIRECTION;
    }
  });
}

function setChromeDirection(node, direction = DEFAULT_DIRECTION) {
  const chrome = node?.querySelector?.(".g-selection-chrome");
  if (chrome) chrome.dataset.stageDirection = direction || DEFAULT_DIRECTION;
}

export function clearDirectionalSelectionTimers(timerMap) {
  if (!(timerMap instanceof Map)) return;
  timerMap.forEach((timerId) => clearTimeout(timerId));
  timerMap.clear();
}

export function syncDirectionalSelection(nodes, nextIndex, timerMap, options = {}) {
  const items = Array.from(nodes || []);
  if (!items.length) return false;
  const durationMs = Math.max(120, Number(options.durationMs) || DEFAULT_DURATION_MS);
  const selectedClass = options.selectedClass || "selected";
  const deselectingClass = options.deselectingClass || "deselecting";
  const defaultDirection = options.defaultDirection || DEFAULT_DIRECTION;
  const previousIndex = Number.isFinite(Number(options.previousIndex))
    ? Number(options.previousIndex)
    : items.findIndex((node) => node.classList.contains(selectedClass));
  const resolvedNextIndex = Math.max(0, Math.min(items.length - 1, Number(nextIndex) || 0));

  if (previousIndex < 0 || previousIndex === resolvedNextIndex) {
    items.forEach((node, index) => {
      const timerId = timerMap?.get?.(node);
      if (timerId) {
        clearTimeout(timerId);
        timerMap.delete(node);
      }
      node.classList.remove(deselectingClass);
      node.classList.toggle(selectedClass, index === resolvedNextIndex);
      setChromeDirection(node, index === resolvedNextIndex ? defaultDirection : DEFAULT_DIRECTION);
    });
    return true;
  }

  const movingDown = resolvedNextIndex > previousIndex;
  const outgoingDirection = movingDown ? "bottom" : "top";
  const incomingDirection = movingDown ? "top" : "bottom";

  items.forEach((node, index) => {
    const timerId = timerMap?.get?.(node);
    if (timerId) {
      clearTimeout(timerId);
      timerMap.delete(node);
    }
    if (index === previousIndex) {
      setChromeDirection(node, outgoingDirection);
      node.classList.remove(selectedClass);
      node.classList.add(deselectingClass);
      if (timerMap instanceof Map) {
        const nextTimerId = setTimeout(() => {
          node.classList.remove(deselectingClass);
          timerMap.delete(node);
        }, durationMs);
        timerMap.set(node, nextTimerId);
      }
      return;
    }
    if (index === resolvedNextIndex) {
      setChromeDirection(node, incomingDirection);
      node.classList.remove(deselectingClass);
      node.classList.add(selectedClass);
      return;
    }
    node.classList.remove(selectedClass, deselectingClass);
    setChromeDirection(node, DEFAULT_DIRECTION);
  });
  return true;
}
