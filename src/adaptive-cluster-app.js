import { clamp } from './utils.js';
import { initMorph } from './shared/morph.js';
import { initScenarioData } from './shared/scenario-data.js';
import { initAnimControls } from './shared/anim-controls.js';
import { initOrbController } from './shared/orb-controller.js';
import { applyAiCelestialChrome } from './shared/celestial-selection-chrome.js';
import { AI_ORB_ICON_OPTIONS, loadAiOrbIconId } from './shared/ai-orb-icon.js';
import {
  renderThinkingOrbStreamMarkup,
  syncThinkingOrbStreamText,
  setThinkingOrbStreamVisible,
  syncThinkingOrbStreamIcon,
} from './shared/thinking-orb-stream.js';

const DROPS = {
  main: document.getElementById('drop-main'),
  left: document.getElementById('drop-left'),
  right: document.getElementById('drop-right'),
};
const stageEl = document.getElementById('stage');
const uiFrame = document.getElementById('ui-frame');
const topSlot = document.getElementById('adaptive-top-slot');
const actionRow = document.getElementById('adaptive-action-row');
const cardReflection = document.getElementById('adaptive-card-reflection');

const C = {
  thumb: document.getElementById('c-thumb'),
  thumbLabel: document.getElementById('c-thumb-label'),
  thumbImg: document.getElementById('c-thumb-img'),
  prim: document.getElementById('c-primary'),
  sec: document.getElementById('c-secondary'),
  div: document.getElementById('c-divider'),
  det: document.getElementById('c-detail'),
  media: document.getElementById('c-media'),
  rich: document.getElementById('c-rich'),
  actionCardActions: document.getElementById('action-card-actions'),
};

const EMPTY_CONTENT = { icon: '', primary: '', secondary: '', detail: '' };
const THINKING_LABEL = 'Finding options';
const THINKING_METRICS = { iconSize: 46, gap: 10, paddingX: { left: 14, right: 20 }, minWidth: 80 };
const CONTENT_BOTTOM_Y = -40;
const RICH_CARD_PADDING = 20;
const REVIEW_CARD_W = 380;
const BOOKING_CARD_W = 356;
const REVIEW_CARD_MIN_H = 96;
const BOOKING_CARD_MIN_H = 74;

const planeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 13.5 3 21l-1-3 5.5-7.5L2 7l1-3 9 4.5L19 2l3 1-5.5 8.5L22 16l-1 3-8.5-5.5Z"/></svg>';
const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>';
const xIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const shareIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/></svg>';

function svgData(markup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

const AIRLINES = {
  ana: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#4169dc"/><path d="M4 23c10.6 1.2 19.2 4.7 28.9 13.5 2.5-8.5 6.3-14.7 12.1-19.7-9.2 4.2-16.4 7.1-24 7.3C14.8 24.2 9.5 23.8 4 23z" fill="#fff"/></svg>'),
  delta: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#071239"/><path d="M24 7 8 34l16-8.3V7z" fill="#ee173d"/><path d="m24 7 16 27-16-8.3V7z" fill="#ad0035"/><path d="M24 28.8 7 39h17V28.8z" fill="#ee173d"/><path d="m24 28.8 17 10.2H24V28.8z" fill="#ad0035"/></svg>'),
  united: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><clipPath id="c"><circle cx="24" cy="24" r="24"/></clipPath></defs><g clip-path="url(#c)"><rect width="48" height="48" fill="#2117dc"/><path d="M-5 19c13-6.2 24.7-7.7 35-4.2 11.4 3.9 20.9 13.2 28.5 28" fill="none" stroke="#fff" stroke-width="3.1"/><path d="M-3 26c11.6-5.1 22.4-6.2 32.4-3.2 10.1 3 19.1 9.9 27 20.6" fill="none" stroke="#fff" stroke-width="3.1"/><path d="M-4 35c10.8-5.5 21.1-7.4 31-5.7 9.9 1.7 19 7 27.4 16" fill="none" stroke="#fff" stroke-width="3.1"/><path d="M10-2c8 5.1 12.9 12.8 14.7 23.2 1.8 10.5-.4 20.5-6.7 30" fill="none" stroke="#fff" stroke-width="4.2"/><path d="M24-2c7.8 6.2 12.3 14.4 13.4 24.8 1.1 10.3-1.5 19.9-7.9 28.7" fill="none" stroke="#fff" stroke-width="3.2"/><path d="M38 3c6 7.4 9.1 15.6 9.2 24.6.1 8.2-2.2 15.7-6.8 22.4" fill="none" stroke="#fff" stroke-width="3.2"/></g></svg>'),
};

const OPTIONS = [
  {
    brand: 'ana',
    title: 'Book ANA 118',
    description: 'Recommended · earliest arrival · $0',
    review: {
      title: 'ANA 118 · direct',
      route: 'San Francisco → Osaka Kansai',
      date: 'Today',
      time: 'Departs 10:40am · Arrives 2:15pm',
      fare: 'No fare difference',
      total: '$0 charged',
      confirmation: 'ANA-8K2Q7',
      result: 'ANA 118 confirmed · arrives 2:15pm · $0 charged',
    },
  },
  {
    brand: 'delta',
    title: 'Take Delta 92',
    description: 'Later arrival · $0',
    review: {
      title: 'Delta 92 · direct',
      route: 'San Francisco → Osaka Kansai',
      date: 'Today',
      time: 'Departs 4:20pm · Arrives 9:40pm',
      fare: 'No fare difference',
      total: '$0 charged',
      confirmation: 'DL-3F8M1',
      result: 'Delta 92 confirmed · arrives 9:40pm · $0 charged',
    },
  },
  {
    brand: 'united',
    title: 'Pick United 214',
    description: '1 stop · +$84',
    review: {
      title: 'United 214 · 1 stop',
      route: 'San Francisco → Osaka Kansai',
      date: 'Today',
      time: 'Departs 5:35pm · Arrives 11:10pm',
      fare: '+$84 fare difference',
      total: '$84 charged',
      confirmation: 'UA-6P4D9',
      result: 'United 214 confirmed · arrives 11:10pm · $84 charged',
    },
  },
];

function currentAiIcon() {
  const option = AI_ORB_ICON_OPTIONS[loadAiOrbIconId()] || AI_ORB_ICON_OPTIONS.chatgpt;
  return option?.src || '';
}

function chatgptAiIcon() {
  return AI_ORB_ICON_OPTIONS.chatgpt?.src || currentAiIcon();
}

const detailMeasureEl = document.createElement('div');
detailMeasureEl.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";
document.body.appendChild(detailMeasureEl);

const canvasSettings = {
  frameMode: 'none',
  floatingEnabled: false,
  bottomAlign: false,
  backgroundEnabled: false,
  phoneFrameWidth: 390,
  phoneFrameHeight: 838,
  frameCornerRadius: 48,
};

let stageLibrary = [];
let currentScenario = null;
let selectedIndex = 0;
let phase = 'idle';
let morph = null;
let orb = null;
let thinkingStream = document.getElementById('prototype-thinking-stream');
let frameEnabled = false;
let actionRowTimer = null;
let richRevealTimer = null;
let topChromeTimer = null;
let postActionTimer = null;
let activeActionIndex = 0;
const LIST_TO_CARD_RICH_REVEAL_MS = 420;

const scenarioData = initScenarioData({
  getStageLibrary: () => stageLibrary,
  getCanvasSettings: () => canvasSettings,
  clampFn: clamp,
});

const {
  loadStageLibrary,
  stageById,
  renderShapeForStageId,
  stageComponentCounts,
  stageTextForShape,
  stageIconForShape,
  stageListChipIconsForShape,
  stageListItemsForShape,
  stageListListeningOrbForShape,
  stageListSelectableForShape,
  stageImagesForShape,
  stageSelectedForShape,
  stageAccentColorForShape,
  stageSecondaryAccentColorForShape,
  stageNudgeDividerColorForShape,
  stageSelectedBlobTopCoreColorForShape,
  stageSelectedBlobTopEdgeColorForShape,
  stageSelectedBlobBottomCoreColorForShape,
  stageSelectedBlobBottomEdgeColorForShape,
  scenarioStageSizeOverride,
  stageCardImagePaddingForShape,
  stageMainSize,
  stageIconTextGap,
  stageIconLeftPadding,
  normalizeStageSizeEntry,
  createIcon,
} = scenarioData;

stageLibrary = loadStageLibrary();

function selectedScenario() {
  return currentScenario;
}

function makeScenario(shape = 'pill') {
  return {
    id: `adaptive-${shape}`,
    name: 'Adaptive Cluster',
    shape,
    triggers: [],
    content: {
      canvas: { frameMode: 'none' },
      sizeByShape: {
        'list-pill': { widthOverride: 380, heightOverride: 96 },
      },
      typographyByShape: {},
      listItemsByShape: {},
      listChipIconsByShape: {},
      iconByShape: {},
      imagesByShape: {},
    },
  };
}

function setupThinkingStream() {
  if (thinkingStream && !thinkingStream.classList.contains('g-thinking-orb-stream')) {
    thinkingStream.outerHTML = renderThinkingOrbStreamMarkup({
      id: 'prototype-thinking-stream',
      textId: 'prototype-thinking-stream-text',
      hidden: true,
    });
    thinkingStream = document.getElementById('prototype-thinking-stream');
  }
}

function measureThinkingGeo(text = THINKING_LABEL) {
  const textEl = document.getElementById('prototype-thinking-stream-text');
  const metrics = syncThinkingOrbStreamText(thinkingStream, textEl, text, {
    metrics: THINKING_METRICS,
    font: '500 20px "DM Sans", sans-serif',
    setText: false,
  });
  const width = Math.max(80, Math.round(metrics.pillWidth || 80));
  return {
    main: { w: width, h: 80, br: '999px', tx: -width / 2, ty: -60, op: 1 },
    left: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
    right: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
  };
}

function setThinkingText(text = THINKING_LABEL) {
  const textEl = document.getElementById('prototype-thinking-stream-text');
  const iconEl = thinkingStream?.querySelector?.('[data-thinking-orb-stream-icon]');
  const option = AI_ORB_ICON_OPTIONS.chatgpt || AI_ORB_ICON_OPTIONS[loadAiOrbIconId()];
  syncThinkingOrbStreamIcon(iconEl, { src: option?.src || '', alt: `${option?.label || 'AI'} orb icon` });
  const metrics = syncThinkingOrbStreamText(thinkingStream, textEl, text, {
    metrics: THINKING_METRICS,
    font: '500 20px "DM Sans", sans-serif',
  });
  const width = Math.max(80, Math.round(metrics.pillWidth || 80));
  DROPS.main.style.width = `${width}px`;
  DROPS.main.style.height = '80px';
  DROPS.main.style.borderRadius = '999px';
  DROPS.main.style.transform = `translate(${-width / 2}px, -60px)`;
  setThinkingOrbStreamVisible(thinkingStream, true);
  syncStageThinkingIcon('magic');
}

function syncStageThinkingIcon(shape = document.body.dataset.currentShape || '') {
  if (shape !== 'listening' && shape !== 'magic') return;
  if (!C.thumb || !C.thumbImg) return;
  const src = chatgptAiIcon();
  if (!src) return;
  const iconSize = 46;
  const collapsed = shape === 'listening';
  const x = collapsed ? Math.round((80 - iconSize) / 2) : 14;
  const y = Math.round((80 - iconSize) / 2);
  C.thumb.classList.add('thumb-image', 'thumb-plain-icon');
  C.thumb.classList.remove('thumb-empty');
  C.thumb.style.width = `${iconSize}px`;
  C.thumb.style.height = `${iconSize}px`;
  C.thumb.style.borderRadius = '999px';
  C.thumb.style.transform = `translate(${x}px,${y}px)`;
  C.thumb.style.opacity = '1';
  C.thumb.style.pointerEvents = 'none';
  C.thumbLabel.textContent = '';
  if (C.thumbImg.getAttribute('src') !== src) C.thumbImg.src = src;
  C.thumbImg.alt = 'ChatGPT';
  C.thumbImg.style.width = `${iconSize}px`;
  C.thumbImg.style.height = `${iconSize}px`;
}

function hideThinkingStream() {
  setThinkingOrbStreamVisible(thinkingStream, false);
  document.body.dataset.thinkingDebugFamilyActive = 'false';
  document.body.dataset.thinkingDebugMode = '';
}

function syncChrome() {
  requestAnimationFrame(() => requestAnimationFrame(() => applyAiCelestialChrome(document)));
}

function updateActive(shape) {
  syncChrome();
  if (shape !== 'magic' && shape !== 'listening') hideThinkingStream();
  if (shape === 'magic' || shape === 'listening') {
    requestAnimationFrame(() => syncStageThinkingIcon(shape));
  }
  const prompt = document.getElementById('prototype-listening-prompt');
  if (prompt) {
    prompt.textContent = '';
    prompt.classList.remove('visible', 'has-interim', 'is-settling-out');
  }
}

function hideIntentHeader() {
  const hdr = document.getElementById('intent-header');
  if (!hdr) return;
  hdr.classList.remove('visible', 'glass-intent');
  hdr.style.display = 'none';
  hdr.style.left = '';
  hdr.style.top = '';
}

function initMorphRuntime() {
  const anim = initAnimControls({ document, clamp });
  morph = initMorph({
    DROPS,
    C,
    detailMeasureEl,
    callbacks: {
      clamp,
      selectedScenario,
      stageById: (id, scenario = selectedScenario()) => stageById(id, scenario),
      updateActive,
      stopSiriOrb: (...args) => orb?.stopSiriOrb?.(...args),
      startSiriOrb: (...args) => orb?.startSiriOrb?.(...args),
      showAiIdle: (...args) => orb?.showAiIdle?.(...args),
      collapseListStack: (...args) => morph?.collapsePrototypeListStack?.(...args),
      animateSplitMetaball: () => {},
      normalizeStageSizeEntry,
      scenarioStageSizeOverride,
      stageCardImagePaddingForShape,
      stageMainSize: (stage, scenario = null) => (
        String(stage?.id || scenario?.shape || '') === 'list-pill'
          ? { width: 380, height: 96 }
          : stageMainSize(stage, scenario)
      ),
      stageIconTextGap,
      stageIconLeftPadding,
      renderShapeForStageId: (id) => renderShapeForStageId(id, selectedScenario()),
      getCanvasSettings: () => canvasSettings,
      stageComponentCounts,
      stageTextForShape,
      stageIconForShape,
      stageListChipIconsForShape,
      stageListItemsForShape,
      stageListListeningOrbForShape: (scenario, shape) => (
        phase === 'options' && String(shape || scenario?.shape || '') === 'list-pill'
          ? true
          : stageListListeningOrbForShape(scenario, shape)
      ),
      stageListSelectableForShape,
      stageImagesForShape,
      stageSelectedForShape,
      stageAccentColorForShape,
      stageSecondaryAccentColorForShape,
      stageNudgeDividerColorForShape,
      stageSelectedBlobTopCoreColorForShape,
      stageSelectedBlobTopEdgeColorForShape,
      stageSelectedBlobBottomCoreColorForShape,
      stageSelectedBlobBottomEdgeColorForShape,
      getPrototypeSelectionOverride: () => null,
      createIcon,
      getAnimDuration: anim.getAnimDuration,
      getEasingFns: anim.getEasingFns,
    },
  });

  orb = initOrbController({
    document,
    C,
    clearListPills: () => morph?.clearPrototypeListStage?.(true),
    morphTo: (...args) => morph.morphTo(...args),
  });
}

function taskAurora(state = 'needs-input', icon = planeIcon) {
  return `<div class="adaptive-task-aurora" data-task-state="${state}"><div class="adaptive-task-thumb">${icon}</div></div>`;
}

function topChromeHtml(title, state = 'needs-input', icon = planeIcon, { showAurora = true, tone = '' } = {}) {
  const toneClass = tone ? ` adaptive-stage-title--${escapeHtml(tone)}` : '';
  return `
    <div class="adaptive-top-stack">
      ${showAurora ? taskAurora(state, icon) : ''}
      <div class="adaptive-stage-title${toneClass}">${escapeHtml(title)}</div>
    </div>
  `;
}

function bottomAnchoredGeo({ width = REVIEW_CARD_W, height = REVIEW_CARD_MIN_H, radius = 30 } = {}) {
  const w = Math.round(width);
  const h = Math.round(height);
  const tx = Math.round(-w / 2);
  const ty = Math.round(CONTENT_BOTTOM_Y - h);
  return {
    main: { w, h, br: `${radius}px`, tx, ty, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx, ty: CONTENT_BOTTOM_Y - 100, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: Math.round(w / 2) - 100, ty: CONTENT_BOTTOM_Y - 100, op: 0 },
  };
}

function measureRichCardHeight(html, width, minHeight) {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.left = '-10000px';
  probe.style.top = '0';
  probe.style.width = `${width}px`;
  probe.style.boxSizing = 'border-box';
  probe.style.padding = `${RICH_CARD_PADDING}px`;
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.innerHTML = html;
  document.body.appendChild(probe);
  const height = Math.ceil(probe.scrollHeight);
  probe.remove();
  return Math.max(minHeight, height);
}

function richCardGeo(html, { width = REVIEW_CARD_W, minHeight = REVIEW_CARD_MIN_H, radius = 30 } = {}) {
  return bottomAnchoredGeo({
    width,
    height: measureRichCardHeight(html, width, minHeight),
    radius,
  });
}

function positionExternalChrome() {
  if (!stageEl || !DROPS.main) return;
  const stageRect = stageEl.getBoundingClientRect();
  const mainRect = DROPS.main.getBoundingClientRect();
  const centerX = Math.round(mainRect.left - stageRect.left + mainRect.width / 2);
  const topY = Math.round(mainRect.top - stageRect.top);
  const bottomY = Math.round(mainRect.bottom - stageRect.top);
  if (topSlot) {
    const slotRect = topSlot.getBoundingClientRect();
    topSlot.style.left = `${centerX}px`;
    if (phase === 'options') {
      const firstPill = document.querySelector('.prototype-disambiguation-pills--list-pill .g-disambiguation-pill');
      const firstPillRect = firstPill?.getBoundingClientRect?.();
      topSlot.style.top = firstPillRect
        ? `${Math.round(firstPillRect.top - stageRect.top - slotRect.height - 16)}px`
        : `${Math.round(topY - slotRect.height - 30)}px`;
    } else {
      topSlot.style.top = `${Math.round(topY - slotRect.height - 30)}px`;
    }
  }
  if (actionRow) {
    actionRow.style.left = `${centerX}px`;
    actionRow.style.top = `${bottomY + 16}px`;
  }
  syncActionReflection();
}

function trackExternalChrome(duration = 760) {
  const end = performance.now() + duration;
  const tick = () => {
    positionExternalChrome();
    if (performance.now() < end) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function setActiveAction(index) {
  if (!actionRow) return false;
  const buttons = Array.from(actionRow.querySelectorAll('[data-adaptive-action]'));
  if (!buttons.length) return false;
  activeActionIndex = ((index % buttons.length) + buttons.length) % buttons.length;
  buttons.forEach((button, i) => {
    button.classList.toggle('is-active', i === activeActionIndex);
    button.setAttribute('aria-pressed', String(i === activeActionIndex));
  });
  syncActionReflection();
  return true;
}

function syncActionReflection() {
  const reflecting = phase === 'review' || phase === 'booked';
  if (!DROPS.main || !cardReflection) return;
  const buttons = Array.from(actionRow?.querySelectorAll('[data-adaptive-action]') || []);
  const active = buttons[activeActionIndex];
  if (!reflecting || !active || !actionRow?.classList.contains('is-shown')) {
    cardReflection.classList.remove('is-shown');
    return;
  }
  const stageRect = stageEl.getBoundingClientRect();
  const mainRect = DROPS.main.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  cardReflection.style.left = `${Math.round(activeRect.left - stageRect.left + activeRect.width / 2)}px`;
  cardReflection.style.top = `${Math.round(mainRect.bottom - stageRect.top - 115)}px`;
  cardReflection.classList.add('is-shown');
}

function moveAction(delta) {
  if (phase !== 'review' && phase !== 'booked') return false;
  if (!actionRow?.querySelector('[data-adaptive-action]')) return false;
  return setActiveAction(activeActionIndex + delta);
}

function activateAction(action) {
  if (action === 'confirm') return enterBooking();
  if (action === 'options') return enterOptions();
  if (action === 'share' || action === 'calendar') return enterPostBookedAction(action);
  if (action === 'reset') return enterIdle();
  return undefined;
}

function activateCurrentAction() {
  if (phase !== 'review' && phase !== 'booked') return false;
  const buttons = Array.from(actionRow?.querySelectorAll('[data-adaptive-action]') || []);
  const active = buttons[clamp(activeActionIndex, 0, Math.max(0, buttons.length - 1))];
  if (!active) return false;
  activateAction(active.dataset.adaptiveAction);
  return true;
}

function setExternalChrome({ topHtml = '', actions = [], actionDelayMs = 0, activeIndex = 0 } = {}) {
  if (actionRowTimer) {
    clearTimeout(actionRowTimer);
    actionRowTimer = null;
  }
  if (topChromeTimer) {
    clearTimeout(topChromeTimer);
    topChromeTimer = null;
  }
  if (topSlot) {
    topSlot.innerHTML = topHtml;
    topSlot.classList.toggle('is-shown', Boolean(topHtml));
    topSlot.setAttribute('aria-hidden', topHtml ? 'false' : 'true');
  }
  if (!topHtml) cardReflection?.classList.remove('is-shown');
  if (actionRow) {
    activeActionIndex = clamp(activeIndex, 0, Math.max(0, actions.length - 1));
    actionRow.innerHTML = actions.map((action, index) => `
      <button class="adaptive-action${index === activeActionIndex ? ' is-active' : ''}" type="button" data-adaptive-action="${escapeHtml(action.id)}" aria-label="${escapeHtml(action.label)}" aria-pressed="${index === activeActionIndex ? 'true' : 'false'}">
        ${action.icon || checkIcon}
        <span class="adaptive-action-label">${escapeHtml(action.label)}</span>
      </button>
    `).join('');
    actionRow.classList.remove('is-shown');
    actionRow.setAttribute('aria-hidden', actions.length ? 'false' : 'true');
    if (actions.length > 0) {
      actionRowTimer = window.setTimeout(() => {
        actionRowTimer = null;
        actionRow.classList.add('is-shown');
        trackExternalChrome();
      }, Math.max(0, actionDelayMs));
    }
  }
  trackExternalChrome();
}

function setTopChromeDelayed(topHtml = '', delayMs = 0) {
  if (topChromeTimer) {
    clearTimeout(topChromeTimer);
    topChromeTimer = null;
  }
  if (!topSlot) return;
  if (delayMs <= 0) {
    topSlot.innerHTML = topHtml;
    topSlot.classList.toggle('is-shown', Boolean(topHtml));
    topSlot.setAttribute('aria-hidden', topHtml ? 'false' : 'true');
    trackExternalChrome();
    return;
  }
  topSlot.innerHTML = '';
  topSlot.classList.remove('is-shown');
  topSlot.setAttribute('aria-hidden', 'true');
  trackExternalChrome();
  topChromeTimer = window.setTimeout(() => {
    topChromeTimer = null;
    if (!topHtml) return;
    topSlot.innerHTML = topHtml;
    topSlot.setAttribute('aria-hidden', 'false');
    trackExternalChrome();
    requestAnimationFrame(() => {
      topSlot.classList.add('is-shown');
      trackExternalChrome();
    });
  }, delayMs);
}

function clearExternalChrome() {
  setExternalChrome();
  syncActionReflection();
}

function clearRichRevealTimer() {
  if (!richRevealTimer) return;
  clearTimeout(richRevealTimer);
  richRevealTimer = null;
}

function clearPostActionTimer() {
  if (!postActionTimer) return;
  clearTimeout(postActionTimer);
  postActionTimer = null;
}

function showRichDelayed(html, delayMs = 0, expectedPhase = phase) {
  clearRichRevealTimer();
  if (delayMs <= 0) {
    morph.showRich(html);
    return;
  }
  C.rich.style.opacity = '0';
  C.rich.innerHTML = html;
  C.rich.classList.add('visible');
  richRevealTimer = window.setTimeout(() => {
    richRevealTimer = null;
    if (phase !== expectedPhase) return;
    requestAnimationFrame(() => {
      if (phase === expectedPhase) C.rich.style.opacity = '1';
    });
  }, delayMs);
}

function syncToggles() {
  document.body.classList.add('adaptive-bg-off');
  document.body.classList.add('float-off');
  document.body.classList.toggle('adaptive-frame-on', frameEnabled);
  uiFrame?.classList.toggle('phone', frameEnabled);
  uiFrame?.classList.remove('has-bg');
  uiFrame?.style.setProperty('--phone-frame-w', `${canvasSettings.phoneFrameWidth}px`);
  uiFrame?.style.setProperty('--phone-frame-h', `${canvasSettings.phoneFrameHeight}px`);
  uiFrame?.style.setProperty('--frame-corner-radius', `${canvasSettings.frameCornerRadius}px`);
  document.querySelectorAll('[data-adaptive-action="toggle-frame"]').forEach((button) => {
    button.classList.toggle('is-active', frameEnabled);
    button.setAttribute('aria-pressed', String(frameEnabled));
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function reviewHtml(option) {
  const review = option.review;
  return `
    <div class="adaptive-rich adaptive-rich--tight-x">
      <div class="adaptive-review">
        <div class="adaptive-review-title">${escapeHtml(review.title)}</div>
        <div class="adaptive-review-lines">
          <div>${escapeHtml(review.route)}</div>
          <div>${escapeHtml(review.date)} · ${escapeHtml(review.time)}</div>
          <div>${escapeHtml(review.fare)} · ${escapeHtml(review.total)}</div>
        </div>
      </div>
    </div>
  `;
}

function bookedHtml(option) {
  const review = option.review;
  return `
    <div class="adaptive-rich adaptive-rich--tight-x">
      <div class="adaptive-review">
        <div class="adaptive-review-title">Booked</div>
        <div class="adaptive-review-lines">
          <div>${escapeHtml(review.result)}</div>
          <div>${escapeHtml(review.route)} · ${escapeHtml(review.date)}</div>
          <div>${escapeHtml(review.total)}</div>
        </div>
      </div>
    </div>
  `;
}

function bookingHtml() {
  return bookingMessageHtml('Completing the airline change.');
}

function bookingFinalizingHtml() {
  return bookingMessageHtml('Securing your new confirmation.');
}

function bookingMessageHtml(message) {
  return `
    <div class="adaptive-rich adaptive-rich--tight-x">
      <div class="adaptive-booking">${escapeHtml(message)}</div>
    </div>
  `;
}

function listContent() {
  currentScenario = makeScenario('list-pill');
  const aiIcon = currentAiIcon();
  return {
    scenario: currentScenario,
    icon: aiIcon ? createIcon('image', aiIcon) : createIcon('none', ''),
    primary: '',
    secondary: '',
    detail: '',
    listItems: OPTIONS.map((option) => ({
      primary: option.title,
      secondary: option.description,
      icon: createIcon('image', AIRLINES[option.brand]),
    })),
  };
}

function enterIdle() {
  clearPostActionTimer();
  phase = 'idle';
  selectedIndex = 0;
  currentScenario = makeScenario('idle');
  clearExternalChrome();
  hideIntentHeader();
  hideThinkingStream();
  clearRichRevealTimer();
  morph.hideRich();
  morph.clearPrototypeListStage?.(true);
  orb?.stopSiriOrb?.();
  DROPS.main?.classList.remove('ai-mode', 'home-glow', 'home-blur', 'magic-glow', 'listening-orb', 'orb-thinking-bridge', 'adaptive-success-mode', 'adaptive-success-exit');
  morph.morphCore?.('idle', EMPTY_CONTENT, null, false, 0, null);
}

function enterListening() {
  phase = 'listening';
  currentScenario = makeScenario('listening');
  clearExternalChrome();
  hideIntentHeader();
  hideThinkingStream();
  clearRichRevealTimer();
  morph.hideRich();
  morph.clearPrototypeListStage?.(true);
  morph.morphTo('listening', {
    icon: createIcon('image', chatgptAiIcon()),
    primary: '',
    secondary: '',
    detail: '',
  });
}

function enterThinking() {
  const thinkingGeo = measureThinkingGeo(THINKING_LABEL);
  phase = 'thinking';
  currentScenario = makeScenario('magic');
  clearExternalChrome();
  clearRichRevealTimer();
  morph.hideRich();
  morph.clearPrototypeListStage?.(true);
  document.body.dataset.thinkingDebugFamilyActive = 'true';
  document.body.dataset.thinkingDebugMode = 'thinking';
  const content = {
    icon: createIcon('image', chatgptAiIcon()),
    primary: '',
    secondary: '',
    detail: '',
  };
  morph.morphTo('magic', content, thinkingGeo);
  window.setTimeout(() => {
    if (phase === 'thinking') setThinkingText(THINKING_LABEL);
  }, 180);
  window.setTimeout(() => {
    if (phase === 'thinking') syncStageThinkingIcon('magic');
  }, 360);
  window.setTimeout(() => {
    if (phase === 'thinking') syncStageThinkingIcon('magic');
  }, 620);
}

function enterOptions() {
  phase = 'options';
  selectedIndex = 0;
  setExternalChrome({ topHtml: topChromeHtml('Choose flight option', 'needs-input', planeIcon, { showAurora: false }) });
  hideIntentHeader();
  clearRichRevealTimer();
  morph.hideRich();
  const content = listContent();
  morph.applyContent(content);
  morph.morphTo('list', content, null, 'list-pill');
  window.setTimeout(() => {
    if (phase === 'options') trackExternalChrome(360);
  }, 80);
}

function enterReview() {
  phase = 'review';
  const option = OPTIONS[selectedIndex] || OPTIONS[0];
  currentScenario = makeScenario('card');
  hideIntentHeader();
  clearRichRevealTimer();
  const html = reviewHtml(option);
  morph.morphTo('card', { icon: '', primary: '', secondary: '', detail: '' }, richCardGeo(html), 'card');
  showRichDelayed(html, LIST_TO_CARD_RICH_REVEAL_MS, 'review');
  setExternalChrome({
    topHtml: '',
    actions: [
      { id: 'confirm', label: 'Yes, book it', icon: checkIcon },
      { id: 'options', label: 'Change option', icon: xIcon },
    ],
    activeIndex: 0,
    actionDelayMs: 520,
  });
  setTopChromeDelayed(topChromeHtml('Review before booking', 'needs-input', planeIcon, { tone: 'warm' }), 300);
}

function enterBooking() {
  phase = 'booking';
  currentScenario = makeScenario('card');
  hideIntentHeader();
  clearRichRevealTimer();
  const html = bookingHtml();
  morph.morphTo('card', { icon: '', primary: '', secondary: '', detail: '' }, richCardGeo(html, { width: BOOKING_CARD_W, minHeight: BOOKING_CARD_MIN_H, radius: 42 }), 'card');
  morph.showRich(html);
  setExternalChrome({ topHtml: topChromeHtml('Booking flight...', 'ongoing') });
  window.setTimeout(() => {
    if (phase !== 'booking') return;
    const nextHtml = bookingFinalizingHtml();
    morph.morphTo('card', { icon: '', primary: '', secondary: '', detail: '' }, richCardGeo(nextHtml, { width: BOOKING_CARD_W, minHeight: BOOKING_CARD_MIN_H, radius: 42 }), 'card');
    morph.showRich(nextHtml);
  }, 2000);
  window.setTimeout(() => {
    if (phase === 'booking') enterBooked();
  }, 4000);
}

function enterBooked() {
  phase = 'booked';
  const option = OPTIONS[selectedIndex] || OPTIONS[0];
  currentScenario = makeScenario('card');
  hideIntentHeader();
  clearRichRevealTimer();
  const html = bookedHtml(option);
  morph.morphTo('card', { icon: '', primary: '', secondary: '', detail: '' }, richCardGeo(html), 'card');
  morph.showRich(html);
  setExternalChrome({
    topHtml: topChromeHtml('Osaka flight booked', 'done', checkIcon, { tone: 'done' }),
    actions: [
      { id: 'share', label: 'Share', icon: shareIcon },
      { id: 'calendar', label: 'Add to Calendar', icon: checkIcon },
    ],
    activeIndex: 0,
  });
}

function enterPostBookedAction(action) {
  clearPostActionTimer();
  const label = action === 'calendar' ? 'Adding to calendar' : 'Sharing flight';
  phase = action === 'calendar' ? 'adding-calendar' : 'sharing-flight';
  currentScenario = makeScenario('magic');
  hideIntentHeader();
  clearRichRevealTimer();
  clearExternalChrome();
  morph.hideRich();
  morph.clearPrototypeListStage?.(true);
  DROPS.main?.classList.remove('adaptive-success-mode');
  document.body.dataset.thinkingDebugFamilyActive = 'true';
  document.body.dataset.thinkingDebugMode = 'thinking';
  const content = {
    icon: createIcon('image', chatgptAiIcon()),
    primary: '',
    secondary: '',
    detail: '',
  };
  morph.morphTo('magic', content, measureThinkingGeo(label));
  window.setTimeout(() => {
    if (phase !== 'adding-calendar' && phase !== 'sharing-flight') return;
    setThinkingText(label);
  }, 140);
  postActionTimer = window.setTimeout(() => {
    postActionTimer = null;
    if (phase !== 'adding-calendar' && phase !== 'sharing-flight') return;
    enterPostDone();
  }, 1350);
}

function enterPostDone() {
  clearPostActionTimer();
  phase = 'post-done';
  currentScenario = makeScenario('dot');
  clearExternalChrome();
  hideThinkingStream();
  clearRichRevealTimer();
  morph.hideRich();
  DROPS.main?.classList.add('adaptive-success-mode');
  morph.morphTo('dot', {
    icon: createIcon('emoji', '✓'),
    primary: '',
    secondary: '',
    detail: '',
  }, {
    main: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 1 },
    left: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
    right: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
  });
  postActionTimer = window.setTimeout(() => {
    postActionTimer = null;
    if (phase !== 'post-done') return;
    DROPS.main?.classList.add('adaptive-success-exit');
    postActionTimer = window.setTimeout(() => {
      postActionTimer = null;
      if (phase === 'post-done') enterIdle();
    }, 360);
  }, 950);
}

function startFlow() {
  const fromIdle = phase === 'idle';
  if (fromIdle) enterListening();
  else enterThinking();
  window.setTimeout(() => {
    if (fromIdle && phase !== 'listening') return;
    if (!fromIdle && phase !== 'thinking') return;
    if (fromIdle) enterThinking();
  }, fromIdle ? 520 : 0);
  window.setTimeout(() => {
    if (phase !== 'thinking') return;
    enterOptions();
  }, fromIdle ? 2520 : 2000);
}

function moveOption(delta) {
  if (phase !== 'options') return false;
  const next = clamp(selectedIndex + delta, 0, OPTIONS.length - 1);
  if (next === selectedIndex) return false;
  selectedIndex = next;
  return morph.movePrototypeListSelection(delta);
}

function confirmCurrent() {
  if (phase === 'idle' || phase === 'listening') return startFlow();
  if (phase === 'options') return enterReview();
  if (phase === 'review' || phase === 'booked') return activateCurrentAction();
  return undefined;
}

function back() {
  if (phase === 'review') return enterOptions();
  if (phase === 'options' || phase === 'thinking' || phase === 'booked') return enterIdle();
  if (phase === 'listening') return enterIdle();
  return undefined;
}

function bindEvents() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
    if (event.key === 'L' || event.key === 'l') {
      event.preventDefault();
      enterListening();
      return;
    }
    if (event.key === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      confirmCurrent();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (event.key === 'ArrowRight' && moveAction(1)) return;
      moveOption(1);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (event.key === 'ArrowLeft' && moveAction(-1)) return;
      moveOption(-1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      back();
    }
  });

  document.addEventListener('click', (event) => {
    const action = event.target?.closest?.('[data-adaptive-action]')?.dataset?.adaptiveAction;
    if (action === 'listen') enterListening();
    if (action === 'start') startFlow();
    if (['reset', 'confirm', 'options', 'share', 'calendar'].includes(action)) {
      const buttons = Array.from(actionRow?.querySelectorAll('[data-adaptive-action]') || []);
      const clicked = event.target.closest('[data-adaptive-action]');
      const index = buttons.indexOf(clicked);
      if (index >= 0) setActiveAction(index);
      activateAction(action);
    }
    if (action === 'toggle-frame') {
      frameEnabled = !frameEnabled;
      canvasSettings.frameMode = frameEnabled ? 'phone' : 'none';
      syncToggles();
      window.setTimeout(() => {
        positionExternalChrome();
      }, 280);
    }

    const pill = event.target?.closest?.('[data-prototype-list-pill]');
    if (!pill || phase !== 'options') return;
    const pills = Array.from(document.querySelectorAll('[data-prototype-list-pill]'));
    const index = pills.indexOf(pill);
    if (index < 0) return;
    selectedIndex = index;
    morph.showPrototypeListStage?.(listContent(), { entering: false, selectedIndex });
    enterReview();
  });
}

setupThinkingStream();
initMorphRuntime();
bindEvents();
window.addEventListener('resize', () => {
  positionExternalChrome();
});
syncToggles();
enterIdle();
