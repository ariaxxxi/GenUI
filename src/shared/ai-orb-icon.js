import { STORAGE_KEYS, loadAiOrbIcon, persistToStorage } from '../app-state.js';

export const AI_ORB_ICON_OPTIONS = Object.freeze({
  bixby: Object.freeze({
    id: 'bixby',
    label: 'Bixby',
    src: 'assets/Bixby.png',
  }),
  gemini: Object.freeze({
    id: 'gemini',
    label: 'Gemini',
    src: 'src/assets/figma-gemini.png',
  }),
  chatgpt: Object.freeze({
    id: 'chatgpt',
    label: 'ChatGPT',
    src: 'src/assets/figma-chatgpt.png',
  }),
});

const DEFAULT_AI_ORB_ICON_ID = 'bixby';
const ICON_SWITCH_DURATION_MS = 720;

function normalizeAiOrbIconId(id) {
  const raw = String(id || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(AI_ORB_ICON_OPTIONS, raw)
    ? raw
    : DEFAULT_AI_ORB_ICON_ID;
}

function applyCenterImage(img, option) {
  if (!img || !option) return;
  img.src = option.src;
  img.alt = `${option.label} orb icon`;
  img.dataset.iconId = option.id;
}

function currentIconIdForCenter(center) {
  const current = center?.querySelector?.('.g-celestial-orb-center-slot--current .g-celestial-orb-center-image');
  return normalizeAiOrbIconId(current?.dataset?.iconId || loadAiOrbIcon());
}

export function getAiOrbIconOption(id) {
  return AI_ORB_ICON_OPTIONS[normalizeAiOrbIconId(id)];
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
        <span class="g-celestial-orb-center-slot g-celestial-orb-center-slot--current">
          <img class="g-celestial-orb-center-image" src="${option.src}" alt="${option.label} orb icon" data-icon-id="${option.id}"/>
        </span>
        <span class="g-celestial-orb-center-slot g-celestial-orb-center-slot--next">
          <img class="g-celestial-orb-center-image" src="${option.src}" alt="${option.label} orb icon" data-icon-id="${option.id}"/>
        </span>
      </span>
    </div>
  `.trim();
}

export function syncAiOrbCenterIcon(root = document, options = {}) {
  const scope = root?.querySelectorAll ? root : document;
  const targetId = normalizeAiOrbIconId(options.id || loadAiOrbIconId());
  const option = getAiOrbIconOption(targetId);
  const animate = options.animate !== false;

  scope.querySelectorAll('.g-celestial-orb-center').forEach((center) => {
    const currentId = currentIconIdForCenter(center);
    const currentSlot = center.querySelector('.g-celestial-orb-center-slot--current .g-celestial-orb-center-image');
    const nextSlot = center.querySelector('.g-celestial-orb-center-slot--next .g-celestial-orb-center-image');
    const visual = center.closest('.g-celestial-orb-visual, .bubble2-orb-visual');
    const shell = center.querySelector('.g-celestial-orb-center-shell');
    const currentTimer = visual?._orbIconSwitchTimer;
    if (currentTimer) {
      clearTimeout(currentTimer);
      visual._orbIconSwitchTimer = null;
    }
    if (!currentSlot || !nextSlot) return;
    if (!animate || currentId === option.id || !visual || !shell) {
      applyCenterImage(currentSlot, option);
      applyCenterImage(nextSlot, option);
      center.dataset.aiOrbIcon = option.id;
      visual?.classList?.remove('is-orb-icon-switching');
      shell?.classList?.remove('is-orb-icon-switching');
      return;
    }
    applyCenterImage(nextSlot, option);
    center.dataset.aiOrbIcon = option.id;
    visual.classList.remove('is-orb-icon-switching');
    shell.classList.remove('is-orb-icon-switching');
    void visual.offsetWidth;
    visual.classList.add('is-orb-icon-switching');
    shell.classList.add('is-orb-icon-switching');
    visual._orbIconSwitchTimer = setTimeout(() => {
      applyCenterImage(currentSlot, option);
      applyCenterImage(nextSlot, option);
      visual.classList.remove('is-orb-icon-switching');
      shell.classList.remove('is-orb-icon-switching');
      visual._orbIconSwitchTimer = null;
    }, ICON_SWITCH_DURATION_MS);
  });
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
  });
}
