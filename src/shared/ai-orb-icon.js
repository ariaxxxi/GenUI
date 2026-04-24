import { STORAGE_KEYS, loadAiOrbIcon, persistToStorage } from '../app-state.js';

export const AI_ORB_ICON_OPTIONS = Object.freeze({
  bixby: Object.freeze({
    id: 'bixby',
    label: 'Bixby',
    src: 'assets/Bixby.png',
    theme: Object.freeze({
      blobTopCore: 'rgb(83 236 185)',
      blobTopEdge: 'rgb(73 154 255)',
      blobBottomCore: 'rgb(134 211 255)',
      blobBottomEdge: 'rgb(46 102 255)',
    }),
  }),
  gemini: Object.freeze({
    id: 'gemini',
    label: 'Gemini',
    src: 'src/assets/figma-gemini.png',
    theme: Object.freeze({
      blobTopCore: 'rgb(122 183 255)',
      blobTopEdge: 'rgb(121 114 255)',
      blobBottomCore: 'rgb(203 178 255)',
      blobBottomEdge: 'rgb(108 64 255)',
    }),
  }),
  chatgpt: Object.freeze({
    id: 'chatgpt',
    label: 'ChatGPT',
    src: 'src/assets/figma-chatgpt.png',
    theme: Object.freeze({
      blobTopCore: 'rgb(247 249 255)',
      blobTopEdge: 'rgb(228 235 247)',
      blobBottomCore: 'rgb(255 255 255)',
      blobBottomEdge: 'rgb(214 223 238)',
    }),
  }),
});

const DEFAULT_AI_ORB_ICON_ID = 'bixby';
const SWIPE_SWITCH_DURATION_MS = 650;
const FADE_SWITCH_DURATION_MS = 720;
const DEFAULT_EMOJI = '✨';
const DEFAULT_SWITCH_DIRECTION = 'left';

function normalizeAiOrbIconId(id) {
  const raw = String(id || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(AI_ORB_ICON_OPTIONS, raw)
    ? raw
    : DEFAULT_AI_ORB_ICON_ID;
}

function applyCenterImage(img, content) {
  if (!img || !content) return;
  const resolved = content.kind === 'image'
    ? {
        src: String(content.src || '').trim() || getAiOrbIconOption(loadAiOrbIconId()).src,
        alt: String(content.alt || '').trim(),
        iconId: '',
      }
    : {
        src: content.src,
        alt: content.alt,
        iconId: content.id,
      };
  img.src = resolved.src;
  img.alt = resolved.alt;
  img.dataset.iconId = resolved.iconId;
  img.dataset.imageSrc = resolved.src;
}

function normalizeCenterContent(content = {}) {
  if (content?.kind === 'emoji') {
    const emoji = String(content.emoji || '').trim() || DEFAULT_EMOJI;
    return { kind: 'emoji', emoji };
  }
  if (content?.kind === 'image') {
    return {
      kind: 'image',
      src: String(content.src || '').trim() || getAiOrbIconOption(loadAiOrbIconId()).src,
      alt: String(content.alt || '').trim(),
    };
  }
  const iconId = normalizeAiOrbIconId(content.iconId || content.id || loadAiOrbIcon());
  return { kind: 'icon', iconId };
}

function applyCenterEmoji(emojiEl, emoji) {
  if (!emojiEl) return;
  emojiEl.textContent = String(emoji || '').trim();
}

function applyCenterSlotContent(slot, content) {
  if (!slot) return;
  const normalized = normalizeCenterContent(content);
  const img = slot.querySelector('.g-celestial-orb-center-image');
  const emojiEl = slot.querySelector('.g-celestial-orb-center-emoji');
  slot.dataset.slotKind = normalized.kind;
  if (normalized.kind === 'emoji') {
    applyCenterEmoji(emojiEl, normalized.emoji);
    if (img) {
      img.dataset.iconId = '';
      img.dataset.imageSrc = '';
      img.alt = '';
    }
    return;
  }
  if (normalized.kind === 'image') {
    applyCenterImage(img, normalized);
  } else {
    const option = getAiOrbIconOption(normalized.iconId);
    applyCenterImage(img, {
      kind: 'icon',
      src: option.src,
      alt: `${option.label} orb icon`,
      id: option.id,
    });
  }
  applyCenterEmoji(emojiEl, '');
}

function currentContentForCenter(center) {
  const currentSlot = center?.querySelector?.('.g-celestial-orb-center-slot--current');
  if (currentSlot?.dataset?.slotKind === 'emoji') {
    return normalizeCenterContent({
      kind: 'emoji',
      emoji: currentSlot.querySelector('.g-celestial-orb-center-emoji')?.textContent || DEFAULT_EMOJI,
    });
  }
  const current = center?.querySelector?.('.g-celestial-orb-center-slot--current .g-celestial-orb-center-image');
  if (currentSlot?.dataset?.slotKind === 'image') {
    return normalizeCenterContent({
      kind: 'image',
      src: current?.dataset?.imageSrc || current?.src || getAiOrbIconOption(loadAiOrbIconId()).src,
      alt: current?.alt || '',
    });
  }
  return normalizeCenterContent({
    kind: 'icon',
    iconId: current?.dataset?.iconId || loadAiOrbIcon(),
  });
}

function centerContentMatches(a, b) {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'emoji') return a.emoji === b.emoji;
  if (a.kind === 'image') return a.src === b.src && a.alt === b.alt;
  return a.iconId === b.iconId;
}

function applyThemeVars(node, theme) {
  if (!node || !theme) return;
  node.style.setProperty('--g-stage-selected-rgb', theme.blobTopCore);
  node.style.setProperty('--g-stage-selected-secondary-rgb', theme.blobBottomCore);
  node.style.setProperty('--g-stage-selected-blob-top-core', theme.blobTopCore);
  node.style.setProperty('--g-stage-selected-blob-top-edge', theme.blobTopEdge);
  node.style.setProperty('--g-stage-selected-blob-bottom-core', theme.blobBottomCore);
  node.style.setProperty('--g-stage-selected-blob-bottom-edge', theme.blobBottomEdge);
}

function applySwitchGlowVars(node, theme) {
  if (!node || !theme) return;
  node.style.setProperty('--g-orb-switch-glow-primary', theme.blobTopCore);
  node.style.setProperty('--g-orb-switch-glow-secondary', theme.blobBottomCore);
}

function resolveOrbTheme(themeOrId) {
  if (themeOrId && typeof themeOrId === 'object') return themeOrId;
  const option = getAiOrbIconOption(themeOrId);
  return option?.theme || null;
}

export function getAiOrbIconOption(id) {
  return AI_ORB_ICON_OPTIONS[normalizeAiOrbIconId(id)];
}

function normalizeSwitchDirection(direction) {
  const raw = String(direction || '').trim().toLowerCase();
  return raw === 'right' ? 'right' : DEFAULT_SWITCH_DIRECTION;
}

function iconSequence() {
  return Object.keys(AI_ORB_ICON_OPTIONS);
}

function deriveIconSwitchDirection(fromId, toId) {
  const currentId = normalizeAiOrbIconId(fromId);
  const targetId = normalizeAiOrbIconId(toId);
  if (currentId === targetId) return DEFAULT_SWITCH_DIRECTION;
  const sequence = iconSequence();
  const currentIndex = sequence.indexOf(currentId);
  const targetIndex = sequence.indexOf(targetId);
  if (currentIndex === -1 || targetIndex === -1) return DEFAULT_SWITCH_DIRECTION;
  const length = sequence.length;
  const forwardDistance = (targetIndex - currentIndex + length) % length;
  const backwardDistance = (currentIndex - targetIndex + length) % length;
  return forwardDistance <= backwardDistance ? 'right' : 'left';
}

export function loadAiOrbIconId() {
  return normalizeAiOrbIconId(loadAiOrbIcon());
}

export function persistAiOrbIconId(id) {
  const nextId = normalizeAiOrbIconId(id);
  persistToStorage(STORAGE_KEYS.aiOrbIcon, nextId, 'AI orb icon');
  return nextId;
}

export function renderAiOrbCenterMarkup() {
  const option = getAiOrbIconOption(loadAiOrbIconId());
  return `
    <div class="g-celestial-orb-center" aria-hidden="true" data-ai-orb-icon="${option.id}">
      <span class="g-celestial-orb-center-halo"></span>
      <span class="g-celestial-orb-center-shell">
        <span class="g-celestial-orb-center-slot g-celestial-orb-center-slot--current" data-slot-kind="icon">
          <img class="g-celestial-orb-center-image" src="${option.src}" alt="${option.label} orb icon" data-icon-id="${option.id}"/>
          <span class="g-celestial-orb-center-emoji" aria-hidden="true"></span>
        </span>
        <span class="g-celestial-orb-center-slot g-celestial-orb-center-slot--next" data-slot-kind="icon">
          <img class="g-celestial-orb-center-image" src="${option.src}" alt="${option.label} orb icon" data-icon-id="${option.id}"/>
          <span class="g-celestial-orb-center-emoji" aria-hidden="true"></span>
        </span>
      </span>
    </div>
  `.trim();
}

export function syncAiOrbSelectionTheme(root = document, themeOrId = loadAiOrbIconId()) {
  const scope = root?.querySelectorAll ? root : document;
  const theme = resolveOrbTheme(themeOrId);
  if (!theme) return;
  scope.querySelectorAll('.g-celestial-orb-selection').forEach((selection) => applyThemeVars(selection, theme));
}

function syncAiOrbCenterContent(root = document, content, options = {}) {
  const scope = root?.querySelectorAll ? root : document;
  const target = normalizeCenterContent(content);
  const animate = options.animate !== false;
  const switchMotion = options.switchMotion || (target.kind === 'icon' ? 'swipe' : 'fade');
  const targetTheme = resolveOrbTheme(options.theme || (target.kind === 'icon' ? target.iconId : null));
  if (targetTheme) syncAiOrbSelectionTheme(scope, targetTheme);
  else if (target.kind === 'icon') syncAiOrbSelectionTheme(scope, target.iconId);

  scope.querySelectorAll('.g-celestial-orb-center').forEach((center) => {
    const currentContent = currentContentForCenter(center);
    const currentSlot = center.querySelector('.g-celestial-orb-center-slot--current');
    const nextSlot = center.querySelector('.g-celestial-orb-center-slot--next');
    const visual = center.closest('.g-celestial-orb-visual, .bubble2-orb-visual');
    const shell = center.querySelector('.g-celestial-orb-center-shell');
    const switchDirection = switchMotion === 'swipe' && target.kind === 'icon'
      ? normalizeSwitchDirection(options.switchDirection || deriveIconSwitchDirection(currentContent?.iconId, target.iconId))
      : '';
    const switchDurationMs = switchMotion === 'swipe' ? SWIPE_SWITCH_DURATION_MS : FADE_SWITCH_DURATION_MS;
    const currentTimer = visual?._orbIconSwitchTimer;
    if (currentTimer) {
      clearTimeout(currentTimer);
      visual._orbIconSwitchTimer = null;
    }
    if (!currentSlot || !nextSlot) return;
    applySwitchGlowVars(visual, targetTheme);
    if (!animate || centerContentMatches(currentContent, target) || !visual || !shell) {
      applyCenterSlotContent(currentSlot, target);
      applyCenterSlotContent(nextSlot, target);
      center.dataset.aiOrbIcon = target.kind === 'icon' ? target.iconId : center.dataset.aiOrbIcon || loadAiOrbIconId();
      visual?.removeAttribute?.('data-orb-switch-motion');
      visual?.removeAttribute?.('data-orb-switch-direction');
      visual?.classList?.remove('is-orb-icon-switching');
      shell?.classList?.remove('is-orb-icon-switching');
      return;
    }
    applyCenterSlotContent(nextSlot, target);
    if (target.kind === 'icon') center.dataset.aiOrbIcon = target.iconId;
    visual.dataset.orbSwitchMotion = switchMotion;
    if (switchDirection) visual.dataset.orbSwitchDirection = switchDirection;
    else visual.removeAttribute('data-orb-switch-direction');
    visual.classList.remove('is-orb-icon-switching');
    shell.classList.remove('is-orb-icon-switching');
    void visual.offsetWidth;
    visual.classList.add('is-orb-icon-switching');
    shell.classList.add('is-orb-icon-switching');
    visual._orbIconSwitchTimer = setTimeout(() => {
      applyCenterSlotContent(currentSlot, target);
      applyCenterSlotContent(nextSlot, target);
      visual.removeAttribute('data-orb-switch-motion');
      visual.removeAttribute('data-orb-switch-direction');
      visual.classList.remove('is-orb-icon-switching');
      shell.classList.remove('is-orb-icon-switching');
      visual._orbIconSwitchTimer = null;
    }, switchDurationMs);
  });
}

export function syncAiOrbCenterIcon(root = document, options = {}) {
  const targetId = normalizeAiOrbIconId(options.id || loadAiOrbIconId());
  syncAiOrbCenterContent(root, {
    kind: 'icon',
    iconId: targetId,
  }, options);
}

export function syncAiOrbCenterImage(root = document, options = {}) {
  syncAiOrbCenterContent(root, {
    kind: 'image',
    src: options.src,
    alt: options.alt,
  }, options);
}

export function syncAiOrbCenterEmoji(root = document, options = {}) {
  syncAiOrbCenterContent(root, {
    kind: 'emoji',
    emoji: String(options.emoji || '').trim() || DEFAULT_EMOJI,
  }, options);
}

export function bindAiOrbIconStorageSync(root = document, hostWindow = window) {
  if (!hostWindow || hostWindow.__gAiOrbIconStorageBound) return;
  hostWindow.__gAiOrbIconStorageBound = true;
  hostWindow.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEYS.aiOrbIcon) return;
    syncAiOrbCenterIcon(root, {
      animate: true,
      id: loadAiOrbIconId(),
    });
    syncAiOrbSelectionTheme(root, loadAiOrbIconId());
  });
}
