const BUBBLE_BASE_SIZE = 110;
const BUBBLE_MIN_SIZE = 60;
const BUBBLE_MAX_SIZE = 110;
const MAX_DIST = 260;
const MAX_PAN = 75;
const PAN_MARGIN_PX = 24;
const CANVAS_HALF_SIZE = 210;
const DEFAULT_BUBBLE_GAP = 8;
const PILL_LAYOUT_GAP = 10;
const PILL_REPULSION_INFLUENCE = 28;
const PILL_REPULSION_ITERATIONS = 12;
const BUBBLE_LAYOUT_ITERATIONS = 12;
const BUBBLE_STAGGER_STEP_MS = 35;
const DEFAULT_MOVE_DURATION_MS = 450;
const ACTIVE_MOVE_DURATION_MS = 250;
const APPEAR_MOVE_DURATION_MS = 400;
const DISAPPEAR_MOVE_DURATION_MS = 300;
const FADE_IN_DURATION_MS = 400;
const FADE_OUT_DURATION_MS = 300;
const BUBBLE_ENTER_EASE = 'cubic-bezier(0.22, 1.16, 0.3, 1.02)';
const BUBBLE_EXIT_EASE = 'cubic-bezier(0.42, -0.14, 0.7, 0.68)';
const ORB_BASE_SIZE = 80;
const ORB_PRESSED_SIZE = 110;
const ORB_IDLE_DURATION_MS = 1000;
const ORB_PRESSED_DURATION_MS = 450;
const ORB_CENTER_X = 210;
const ORB_CENTER_Y = 356;
const FALLBACK_ICON = 'https://img.icons8.com/color/512/application-window.png';
const PILL_TEXT_LEFT_PADDING = 8;
const PILL_TEXT_RIGHT_PADDING = 40;
const CHILD_STAGGER_STEP_MS = 60;
const CHILD_MENU_HOLD_MS = 3000;
const CHILD_BUBBLE_SIZE = 60;
const CHILD_CHIP_FONT_SIZE = 20;
const CHILD_CHIP_HEIGHT = 48;
const CHILD_CHIP_PADDING_X = 16;
const CHILD_CHIP_PARENT_GAP = 10;
const CHILD_CHIP_VERTICAL_GAP = 10;
const CHILD_FAN_DISTANCE = 20;
const CHILD_FAN_BOUNDS_PADDING = 14;
const CHILD_DIMMED_OPACITY = 0.22;
const CHILD_LAYOUT_GAP = 10;
const CHILD_SIBLING_GAP = 14;
const HOVER_LEASH_PX = 15;
const textMeasureContext = document.createElement('canvas').getContext('2d');
const FIGMA_ASSETS = {
  orb: 'https://www.figma.com/api/mcp/asset/f8fc665b-181b-4c9e-a75d-2edec5b03b3d',
  chatgpt: 'https://www.figma.com/api/mcp/asset/6226094c-fe66-40cc-bfeb-a23992ea5c25',
  gemini: 'https://www.figma.com/api/mcp/asset/9d1608d4-5006-4ce7-9784-7dc5b7eb62c5',
  health: 'https://www.figma.com/api/mcp/asset/87b4cdef-3bb5-416a-bb0f-211d77a0d40b',
  map: 'https://www.figma.com/api/mcp/asset/f40a0071-c992-4dbf-9256-c3736addfb85',
  weather: 'https://www.figma.com/api/mcp/asset/896a1ccd-1004-44f8-8049-ca37fea131a9',
  note: 'https://www.figma.com/api/mcp/asset/cdea9f5f-3322-4b7d-a23d-bde7e27887c7',
};
const PROFILE_CALL_BADGE_ASSET = 'https://store-images.s-microsoft.com/image/apps.36692.13838317266281778.c2d285ff-9d71-4e2b-9a04-aa9832c1b3c2.506b3747-5c34-4ea3-a97c-53b41cdf491e';

const BUBBLES_CONFIG = [
  {
    id: 1,
    x: 9,
    y: -102,
    zIndex: 20,
    img: 'https://i.scdn.co/image/ab67616d00001e0200702474f8e0e2b6155d48e3',
    fill: true,
    isPill: true,
    pillTitle: 'Happiness',
    pillSubtitle: '1975',
    imageOutlineColor: '#1ED760',
    imageOutlineWidth: 3,
    pillTrailingIcon: 'pause',
    pillTrailingIconSize: 40,
    pillTrailingIconColor: '#1ED760',
    pillActionGap: 16,
    subIconKind: 'spotify-badge',
    subIconSize: 42.167,
    subIconOffsetX: 67.83,
    subIconOffsetY: 67.83,
    disableHoverScale: true,
    childActions: [
      { id: 'playlist-1', img: 'https://misc.scdn.co/liked-songs/liked-songs-300.jpg', fill: true },
      { id: 'playlist-2', img: 'https://www.indieground.net/images/blog/2024/indieblog-best-album-covers-2010s-07.jpg', fill: true },
      { id: 'playlist-3', img: 'https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg', fill: true },
    ],
  },
  {
    id: 3,
    x: -87,
    y: -143,
    zIndex: 15,
    img: 'assets/profile1.png',
    fill: true,
    isPill: true,
    pillTitle: 'Tony',
    pillSubtitle: 'I love it!',
    pillTextRightPadding: 40,
    subIconKind: 'message-badge',
    subIconSize: 47.949,
    subIconOffsetX: 62.04,
    subIconOffsetY: 62.05,
    childActions: [
      { id: 'call', kind: 'phone', bg: '#18c964', fg: '#ffffff' },
      { id: 'message', kind: 'message', bg: '#2b6ff2', fg: '#ffffff' },
      { id: 'video', kind: 'video', bg: '#111827', fg: '#ffffff' },
    ],
  },
  {
    id: 9,
    x: 56,
    y: -189,
    zIndex: 14,
    img: FIGMA_ASSETS.note,
    fill: true,
    childActions: [
      { id: 'checklist', kind: 'check', bg: '#ffffff', fg: '#111827' },
      { id: 'voice', kind: 'mic', bg: '#fff5f5', fg: '#ff5252' },
      { id: 'scan', kind: 'scan', bg: '#ffffff', fg: '#ffffff' },
    ],
  },
  {
    id: 4,
    x: 18,
    y: -267,
    zIndex: 12,
    img: FIGMA_ASSETS.health,
    fill: true,
    isPill: true,
    pillTitle: '10,243 steps',
    pillSubtitle: '',
    childActions: [
      { id: 'run', kind: 'shoe', bg: '#ffffff', fg: '#111827' },
      { id: 'heart', kind: 'heart', bg: '#ffffff', fg: '#ff4d6d' },
      { id: 'water', kind: 'drop', bg: '#ffffff', fg: '#2aa8ff' },
    ],
  },
  {
    id: 2,
    x: -106,
    y: -57,
    zIndex: 13,
    img: FIGMA_ASSETS.chatgpt,
    fill: true,
    pillTitle: 'Continue',
    pillSubtitle: 'Book flight to Coachella',
    childLayout: 'chatgpt-chips',
    childActions: [
      { id: 'ideas', kind: 'chip', label: '💡 Give me ideas', fontWeight: 400, layoutLeft: -136, layoutTop: -85, accent: '#f5d76e' },
      { id: 'explain', kind: 'chip', label: '🔍 Explain this', fontWeight: 400, layoutLeft: -209, layoutTop: -36, accent: '#f4f4f4' },
      { id: 'surprise', kind: 'chip', label: '🎲 Surprise me', fontWeight: 400, layoutLeft: -172, layoutTop: 13, accent: '#d7d7ff' },
    ],
  },
  {
    id: 8,
    x: 91,
    y: -28,
    zIndex: 14,
    img: FIGMA_ASSETS.gemini,
    fill: true,
    childLayout: 'gemini-chips',
    childActions: [
      { id: 'plan', kind: 'chip', label: '🧩 Plan my day', fontWeight: 500, layoutLeft: -3, layoutTop: -81, accent: '#8ce56f' },
      { id: 'summarize', kind: 'chip', label: '📄 Summarize this', fontWeight: 500, layoutLeft: 40, layoutTop: -32, accent: '#f4f4f4' },
      { id: 'rewrite', kind: 'chip', label: '🔁 Rewrite this', fontWeight: 500, layoutLeft: 30, layoutTop: 17, accent: '#9dc5ff' },
    ],
  },
  {
    id: 5,
    x: 110,
    y: -121,
    zIndex: 16,
    img: 'assets/profile2.png',
    fill: true,
    isPill: true,
    pillTitle: 'Hiro',
    pillSubtitle: 'Yesterday',
    pillTextLeftPadding: 8,
    pillTextRightPadding: 40,
    subIconKind: 'call-badge',
    subIconSize: 41.532,
    subIconOffsetX: 66.5,
    subIconOffsetY: 66.5,
    childActions: [
      { id: 'call', kind: 'phone', bg: '#18c964', fg: '#ffffff' },
      { id: 'message', kind: 'message', bg: '#2b6ff2', fg: '#ffffff' },
      { id: 'video', kind: 'video', bg: '#111827', fg: '#ffffff' },
    ],
  },
  {
    id: 6,
    x: -21,
    y: -198,
    zIndex: 10,
    img: FIGMA_ASSETS.map,
    fill: true,
    childActions: [
      { id: 'home', kind: 'home', bg: '#ffffff', fg: '#ffffff' },
      { id: 'work', kind: 'briefcase', bg: '#ffffff', fg: '#ffffff' },
    ],
  },
  {
    id: 10,
    x: -88,
    y: -225,
    zIndex: 12,
    img: FIGMA_ASSETS.weather,
    fill: true,
    childActions: [
      { id: 'forecast', kind: 'sun', bg: '#ffffff', fg: '#f5b400' },
      { id: 'rain', kind: 'umbrella', bg: '#ffffff', fg: '#149cf1' },
      { id: 'radar', kind: 'radar', bg: '#ffffff', fg: '#149cf1' },
    ],
  },
].map(enrichBubbleMetrics);

const BUBBLE_STAGGER_TOTAL_MS = Math.max(0, (BUBBLES_CONFIG.length - 1) * BUBBLE_STAGGER_STEP_MS);
const OPEN_PHASE_LATCH_MS = APPEAR_MOVE_DURATION_MS;
const CLOSE_PHASE_LATCH_MS = DISAPPEAR_MOVE_DURATION_MS + BUBBLE_STAGGER_TOTAL_MS;

const state = {
  isPressed: false,
  hoveredBubble: null,
  hoveredChildBubble: null,
  mousePos: {
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    active: false,
  },
  dragStart: {
    x: ORB_CENTER_X,
    y: ORB_CENTER_Y,
  },
  pointerMovedSincePress: false,
  lockedExpandedPillId: null,
  lockedExpandedPillScale: null,
  childHoverTimer: null,
  childHoverCandidateId: null,
  childMenuParentId: null,
  childMenuPointerLock: null,
  openMotionUntil: 0,
  closeMotionUntil: 0,
  renderQueued: false,
};

let previousHoveredId = null;
let previousHoveredChildId = null;

const refs = {
  shell: document.querySelector('[data-bubble2-shell]'),
  panLayer: document.querySelector('[data-bubble2-pan-layer]'),
  orb: null,
  orbVisual: null,
  bubbleNodes: new Map(),
  childNodes: new Map(),
};

init();

function init() {
  if (!refs.shell || !refs.panLayer) return;

  buildScene();
  updateMeasuredChildChipWidths();
  if (document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        updateMeasuredChildChipWidths();
      })
      .catch(() => {
        // Ignore font loading errors; fallback widths remain usable.
      });
  }
  bindEvents();
  render();
}

function buildScene() {
  const fragment = document.createDocumentFragment();
  const childFragment = document.createDocumentFragment();

  BUBBLES_CONFIG.forEach((bubble, index) => {
    const node = createBubbleNode(bubble, index);
    refs.bubbleNodes.set(bubble.id, node);
    fragment.appendChild(node.root);

    for (const action of bubble.childActions || []) {
      const childNode = createChildNode(bubble, action);
      refs.childNodes.set(getChildBubbleKey(bubble.id, action.id), childNode);
      childFragment.appendChild(childNode.root);
    }
  });

  refs.orb = createOrbNode();
  refs.orbVisual = refs.orb.querySelector('.bubble2-orb-visual');
  fragment.appendChild(refs.orb);
  refs.panLayer.appendChild(fragment);
  refs.panLayer.appendChild(childFragment);
}

function createBubbleNode(bubble, index) {
  const root = document.createElement('div');
  root.className = 'bubble2-item';
  root.dataset.bubbleId = String(bubble.id);

  const inner = document.createElement('div');
  inner.className = 'bubble2-item-inner';

  const surface = document.createElement('div');
  surface.className = `bubble2-surface${bubble.isPill ? ' is-pill' : ''}`;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'bubble2-icon-wrap';
  if (bubble.imageOutlineColor) {
    iconWrap.classList.add('has-inner-outline');
    iconWrap.style.setProperty('--bubble-image-outline-color', bubble.imageOutlineColor);
    iconWrap.style.setProperty('--bubble-image-outline-width', `${bubble.imageOutlineWidth ?? 2}px`);
  }

  iconWrap.appendChild(createBubbleGraphic(bubble));
  surface.appendChild(iconWrap);

  let pillCopy = null;
  if (bubble.isPill) {
    pillCopy = document.createElement('div');
    pillCopy.className = 'bubble2-pill-copy';
    if (bubble.pillTrailingIcon) pillCopy.classList.add('has-action');
    pillCopy.style.setProperty('--pill-text-left-padding', `${bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING}px`);
    pillCopy.style.setProperty('--pill-text-right-padding', `${getPillTextRightPadding(bubble)}px`);

    const pillCopyInner = document.createElement('div');
    pillCopyInner.className = 'bubble2-pill-copy-inner';

    const title = document.createElement('p');
    title.className = 'bubble2-pill-title';
    title.textContent = bubble.pillTitle || '';

    const subtitle = document.createElement('p');
    subtitle.className = 'bubble2-pill-subtitle';
    subtitle.textContent = bubble.pillSubtitle || '';

    pillCopyInner.appendChild(title);
    pillCopyInner.appendChild(subtitle);
    pillCopy.appendChild(pillCopyInner);

    if (bubble.pillTrailingIcon) {
      const action = document.createElement('div');
      action.className = 'bubble2-pill-action';
      action.style.setProperty('--pill-action-size', `${bubble.pillTrailingIconSize || 40}px`);
      action.style.setProperty('--pill-action-right', `${bubble.pillTrailingIconRight ?? 40}px`);
      action.style.setProperty('--pill-action-color', bubble.pillTrailingIconColor || '#ffffff');
      action.innerHTML = getPillTrailingIconMarkup(bubble.pillTrailingIcon);
      pillCopy.appendChild(action);
    }

    surface.appendChild(pillCopy);
  }

  let subIcon = null;
  if (bubble.subIconKind || bubble.subIcon) {
    subIcon = document.createElement('div');
    subIcon.className = 'bubble2-subicon';
    if (bubble.subIconKind) {
      subIcon.appendChild(createSubIconGraphic(bubble.subIconKind));
    } else if (bubble.subIcon) {
      const image = document.createElement('img');
      image.src = bubble.subIcon;
      image.alt = '';
      image.draggable = false;
      subIcon.appendChild(image);
    }
    inner.appendChild(subIcon);
  }

  inner.appendChild(surface);
  root.appendChild(inner);

  return {
    index,
    bubble,
    root,
    surface,
    iconWrap,
    pillCopy,
    subIcon,
  };
}

function createChildNode(parentBubble, action) {
  const root = document.createElement('div');
  root.className = 'bubble2-item bubble2-child-item';
  root.dataset.childBubbleId = getChildBubbleKey(parentBubble.id, action.id);
  root.dataset.parentBubbleId = String(parentBubble.id);

  const surface = document.createElement('div');
  surface.className = 'bubble2-surface bubble2-child-surface';
  if (action.img) surface.classList.add('is-image-only');
  if (isChipAction(action)) surface.classList.add('is-chip');
  surface.innerHTML = `
    <div class="bubble2-child-selection" aria-hidden="true">
      <div class="bubble2-child-selection-accent bubble2-child-selection-accent-left">
        <div class="bubble2-child-selection-accent-left-base"></div>
        <div class="bubble2-child-selection-accent-left-white-2"></div>
        <div class="bubble2-child-selection-accent-left-white-1"></div>
      </div>
      <div class="bubble2-child-selection-accent bubble2-child-selection-accent-right">
        <div class="bubble2-child-selection-accent-right-base"></div>
        <div class="bubble2-child-selection-accent-right-white-2"></div>
        <div class="bubble2-child-selection-accent-right-white-1"></div>
      </div>
      <div class="bubble2-child-selection-inner-glow"></div>
      <div class="bubble2-child-selection-ring"></div>
    </div>
  `;

  let content;
  if (isChipAction(action)) {
    content = document.createElement('div');
    content.className = 'bubble2-child-chip-content';
    content.style.setProperty('--child-chip-font-weight', String(action.fontWeight || 400));
    content.innerHTML = `<span class="bubble2-child-chip-label">${action.label}</span>`;
  } else {
    content = document.createElement('div');
    content.className = 'bubble2-icon-wrap bubble2-child-icon-wrap';
    content.appendChild(createChildActionGraphic(action));
  }

  surface.appendChild(content);
  root.appendChild(surface);

  return {
    root,
    surface,
    content,
    label: content.querySelector?.('.bubble2-child-chip-label') || null,
    action,
    parentId: parentBubble.id,
  };
}

function createOrbNode() {
  const button = document.createElement('button');
  button.className = 'bubble2-orb';
  button.type = 'button';
  button.setAttribute('aria-label', 'Press and drag to open the bubble field');

  const visual = document.createElement('div');
  visual.className = 'bubble2-orb-visual';

  const iconShell = document.createElement('div');
  iconShell.className = 'bubble2-orb-icon-shell';

  const image = document.createElement('img');
  image.className = 'bubble2-orb-icon-image';
  image.src = FIGMA_ASSETS.orb;
  image.alt = '';
  image.draggable = false;
  image.addEventListener('error', () => {
    if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
  });

  iconShell.appendChild(image);
  visual.appendChild(iconShell);
  button.appendChild(visual);

  button.addEventListener('pointerdown', handlePointerDown);
  return button;
}

function bindEvents() {
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerRelease);
  window.addEventListener('pointercancel', handlePointerRelease);
}

function handlePointerDown(event) {
  event.preventDefault();
  const now = performance.now();
  clearChildHoverTimer();
  if (refs.shell) {
    const rect = refs.shell.getBoundingClientRect();
    const scaleX = rect.width / 420;
    const scaleY = rect.height / 420;
    state.dragStart = {
      x: (event.clientX - rect.left) / scaleX,
      y: (event.clientY - rect.top) / scaleY,
    };
  } else {
    state.dragStart = {
      x: ORB_CENTER_X,
      y: ORB_CENTER_Y,
    };
  }
  state.isPressed = true;
  state.pointerMovedSincePress = false;
  state.openMotionUntil = now + OPEN_PHASE_LATCH_MS;
  state.closeMotionUntil = 0;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.childMenuParentId = null;
  state.childMenuPointerLock = null;
  state.mousePos = {
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    active: true,
  };
  if (refs.orb?.setPointerCapture && event.pointerId != null) {
    refs.orb.setPointerCapture(event.pointerId);
  }
  scheduleMotionPhaseRender(state.openMotionUntil);
  scheduleRender();
}

function handlePointerMove(event) {
  if (!state.isPressed || !refs.shell) return;

  const rect = refs.shell.getBoundingClientRect();
  const scaleX = rect.width / 420;
  const scaleY = rect.height / 420;
  const containerX = (event.clientX - rect.left) / scaleX;
  const containerY = (event.clientY - rect.top) / scaleY;

  const nx = clamp((containerX - state.dragStart.x) / ORB_CENTER_X, -1, 1);
  const ny = clamp((containerY - state.dragStart.y) / ORB_CENTER_X, -1, 1);

  state.mousePos = {
    x: containerX - ORB_CENTER_X,
    y: containerY - ORB_CENTER_Y,
    nx,
    ny,
    active: true,
  };
  state.pointerMovedSincePress = true;

  scheduleRender();
}

function handlePointerRelease(event) {
  if (!state.isPressed) return;
  const now = performance.now();

  if (refs.orb?.releasePointerCapture && event.pointerId != null) {
    try {
      refs.orb.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore capture release errors.
    }
  }

  state.isPressed = false;
  state.openMotionUntil = 0;
  state.closeMotionUntil = now + CLOSE_PHASE_LATCH_MS;
  state.mousePos = {
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    active: false,
  };
  state.dragStart = {
    x: ORB_CENTER_X,
    y: ORB_CENTER_Y,
  };
  state.pointerMovedSincePress = false;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.lockedExpandedPillId = null;
  state.lockedExpandedPillScale = null;
  state.childMenuParentId = null;
  state.childMenuPointerLock = null;
  clearChildHoverTimer();
  previousHoveredId = null;
  previousHoveredChildId = null;
  scheduleMotionPhaseRender(state.closeMotionUntil);
  scheduleRender();
}

function scheduleRender() {
  if (state.renderQueued) return;
  state.renderQueued = true;
  requestAnimationFrame(() => {
    state.renderQueued = false;
    render();
  });
}

function scheduleMotionPhaseRender(until) {
  const delay = Math.max(0, Math.ceil(until - performance.now()));
  window.setTimeout(() => {
    scheduleRender();
  }, delay);
}

function render() {
  let scene = computeScene();
  const hoverChanged = state.hoveredBubble !== scene.hoveredId || state.hoveredChildBubble !== scene.hoveredChildId;
  if (hoverChanged) {
    state.hoveredBubble = scene.hoveredId;
    state.hoveredChildBubble = scene.hoveredChildId;
    scene = computeScene();
  }
  if (syncChildMenuState(scene.hoveredId)) {
    scene = computeScene();
    state.hoveredBubble = scene.hoveredId;
    state.hoveredChildBubble = scene.hoveredChildId;
  }
  const now = performance.now();
  const isInitialReveal = state.isPressed && now < state.openMotionUntil;

  refs.panLayer.style.transitionDuration = '1000ms';
  refs.panLayer.style.transform =
    `translate(-50%, -50%) translate3d(${format(scene.panOffset.x)}px, ${format(scene.panOffset.y)}px, 0)`;

  for (const bubble of scene.bubbles) {
    const node = refs.bubbleNodes.get(bubble.id);
    if (!node) continue;

    const isHovered = scene.hoveredId === bubble.id;
    const isAppearing = isInitialReveal;
    const isReturning = !state.isPressed && now < state.closeMotionUntil;
    const staggerDelay = (isAppearing || isReturning)
      ? (node.index * BUBBLE_STAGGER_STEP_MS)
      : 0;
    const transformDuration = isAppearing
      ? APPEAR_MOVE_DURATION_MS
      : (isReturning ? DISAPPEAR_MOVE_DURATION_MS : ACTIVE_MOVE_DURATION_MS);
    const opacityDuration = isAppearing
      ? FADE_IN_DURATION_MS
      : (isReturning ? FADE_OUT_DURATION_MS : DEFAULT_MOVE_DURATION_MS);
    const shadowDuration = isAppearing
      ? FADE_IN_DURATION_MS
      : (isReturning ? FADE_OUT_DURATION_MS : 300);
    const transformEase = isAppearing
      ? BUBBLE_ENTER_EASE
      : (isReturning ? BUBBLE_EXIT_EASE : 'ease-out');
    const translateX = bubble.targetX - bubble.baseSize / 2;
    const translateY = bubble.targetY - bubble.baseSize / 2;
    const pillScale = Math.max(bubble.targetScale || 1, 0.0001);

    node.root.style.zIndex = String(isHovered ? 50 : bubble.zIndex);
    node.root.style.width = `${format(bubble.targetWidth)}px`;
    node.root.style.height = `${format(bubble.baseSize)}px`;
    const isContextParent = state.childMenuParentId === bubble.id;
    const isDimmed = state.childMenuParentId != null && !isContextParent;
    node.root.style.opacity = state.isPressed ? String(isDimmed ? CHILD_DIMMED_OPACITY : 1) : '0';
    node.root.style.boxShadow = isHovered
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      : '0 15px 35px -5px rgba(0, 0, 0, 0.3)';
    node.root.style.transform =
      `translate3d(${format(translateX)}px, ${format(translateY)}px, 0) scale(${bubble.targetScale.toFixed(4)})`;
    node.root.style.filter = isDimmed ? 'brightness(0.42) saturate(0.68)' : 'none';
    node.root.style.setProperty('--bubble2-stagger-delay', `${staggerDelay}ms`);
    node.root.style.transitionDelay = `${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms`;
    node.root.style.transitionDuration = `${transformDuration}ms, 600ms, ${opacityDuration}ms, ${shadowDuration}ms, ${opacityDuration}ms`;
    node.root.style.transitionTimingFunction = `${transformEase}, var(--bubble2-pill-ease), ease-out, ease, ease`;

    node.iconWrap.style.width = `${bubble.baseSize}px`;
    node.iconWrap.style.height = `${bubble.baseSize}px`;

    if (node.pillCopy) {
      node.pillCopy.style.left = `${bubble.baseSize}px`;
      node.pillCopy.style.width = `${bubble.expandedExtraSourceWidth}px`;
      node.pillCopy.style.setProperty('--bubble2-title-size', `${24 / pillScale}px`);
      node.pillCopy.style.setProperty('--bubble2-subtitle-size', `${24 / pillScale}px`);
      node.pillCopy.style.setProperty('--bubble2-pill-gap', `${4 / pillScale}px`);
      node.pillCopy.style.setProperty('--pill-text-left-padding', `${(bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING) / pillScale}px`);
      node.pillCopy.style.setProperty('--pill-text-right-padding', `${getPillTextRightPadding(bubble) / pillScale}px`);
      if (bubble.pillTrailingIcon) {
        node.pillCopy.style.setProperty('--pill-action-size', `${(bubble.pillTrailingIconSize || 40) / pillScale}px`);
        node.pillCopy.style.setProperty('--pill-action-right', `${(bubble.pillTrailingIconRight ?? 40) / pillScale}px`);
      }
      node.pillCopy.classList.toggle('is-expanded', bubble.isExpanded);
    }

    if (node.subIcon) {
      const subIconSize = bubble.subIconSize ?? (bubble.baseSize * 0.38);
      const subIconOffsetX = bubble.subIconOffsetX ?? (bubble.baseSize * 0.6);
      const subIconOffsetY = bubble.subIconOffsetY ?? (bubble.baseSize * 0.6);
      node.subIcon.style.width = `${format(subIconSize)}px`;
      node.subIcon.style.height = `${format(subIconSize)}px`;
      node.subIcon.style.left = `${format(subIconOffsetX)}px`;
      node.subIcon.style.top = `${format(subIconOffsetY)}px`;
    }
  }

  for (const [childId, node] of refs.childNodes.entries()) {
    const child = scene.children.find((entry) => entry.id === childId);
    const parentBubble = scene.bubbles.find((entry) => entry.id === node.parentId);
    if (!parentBubble) continue;

    const isChip = isChipAction(node.action);
    const fallbackWidth = isChip ? measureChildChipWidth(node.action) : CHILD_BUBBLE_SIZE;
    const width = child ? child.width : fallbackWidth;
    const height = child ? child.height : (isChip ? CHILD_CHIP_HEIGHT : CHILD_BUBBLE_SIZE);
    const displayX = child ? child.targetX : parentBubble.targetX;
    const displayY = child ? child.targetY : parentBubble.targetY;
    const scale = child ? child.targetScale : 0.62;
    const opacity = child ? 1 : 0;
    const transformEase = child ? BUBBLE_ENTER_EASE : BUBBLE_EXIT_EASE;
    const fadeDuration = child ? FADE_IN_DURATION_MS : FADE_OUT_DURATION_MS;
    const staggerDelay = child ? child.actionIndex * CHILD_STAGGER_STEP_MS : 0;
    const isHighlighted = scene.hoveredChildId === childId;

    node.root.style.zIndex = String(child ? 65 + child.actionIndex : 20);
    node.root.style.width = `${format(width)}px`;
    node.root.style.height = `${format(height)}px`;
    node.root.style.opacity = String(opacity);
    node.root.style.boxShadow = isHighlighted
      ? '0 16px 32px rgba(0, 0, 0, 0.42)'
      : '0 10px 24px rgba(0, 0, 0, 0.26)';
    node.root.style.filter = 'none';
    node.root.style.transform =
      `translate3d(${format(displayX - (width / 2))}px, ${format(displayY - (height / 2))}px, 0) scale(${format(scale)})`;
    node.root.style.transitionDelay = `${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, 0ms, 0ms`;
    node.root.style.transitionDuration =
      `${child ? APPEAR_MOVE_DURATION_MS : DISAPPEAR_MOVE_DURATION_MS}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms`;
    node.root.style.transitionTimingFunction = `${transformEase}, ease-out, ease-out, ease-out, ease-out`;

    node.surface.classList.toggle('is-highlighted', isHighlighted && !node.action.img);
    node.surface.style.setProperty('--g-stage-selected-rgb', getChildActionAccent(node.action));
    node.surface.style.setProperty('--g-stage-selected-secondary-rgb', 'rgb(0 0 0)');
    node.content.style.width = `${format(width)}px`;
    node.content.style.height = `${format(height)}px`;
    node.content.style.transform = isChip ? 'scale(1)' : (node.action.img ? 'scale(1)' : 'scale(0.88)');
  }

  if (refs.orb) {
    refs.orb.classList.toggle('is-pressed', state.isPressed);
    refs.orb.style.transform = 'translate3d(0, 0, 0)';
  }

  if (refs.orbVisual) {
    refs.orbVisual.style.transitionDuration = `${state.isPressed ? ORB_PRESSED_DURATION_MS : ORB_IDLE_DURATION_MS}ms`;
    refs.orbVisual.style.transform = `translate3d(0, 0, 0) scale(${scene.orb.targetScale.toFixed(4)})`;
  }
}

function computeScene() {
  const pointerBasis = state.childMenuParentId != null && state.childMenuPointerLock
    ? state.childMenuPointerLock
    : state.mousePos;
  const nx = pointerBasis.active ? pointerBasis.nx : 0;
  const ny = pointerBasis.active ? pointerBasis.ny : 0;

  const targetPanX = -nx * MAX_PAN;
  const targetPanY = -ny * MAX_PAN;
  const clusterMouseX = pointerBasis.x - targetPanX;
  const clusterMouseY = pointerBasis.y - targetPanY;

  let processedBubbles = BUBBLES_CONFIG.map((bubble) => {
    let depthScale = BUBBLE_MIN_SIZE / bubble.baseSize;
    let dx = 0;
    let dy = 0;
    let visualSize = BUBBLE_MIN_SIZE;

    if (state.isPressed) {
      const dist = Math.hypot(bubble.x - clusterMouseX, bubble.y - clusterMouseY);
      const factor = Math.max(0, 1 - dist / MAX_DIST);
      const smoothFactor = smoothstep(factor);
      visualSize = BUBBLE_MIN_SIZE + ((BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE) * smoothFactor);
      depthScale = visualSize / bubble.baseSize;

      if (factor > 0) {
        const angle = Math.atan2(bubble.y - clusterMouseY, bubble.x - clusterMouseX);
        const push = smoothFactor * 12;
        dx = Math.cos(angle) * push;
        dy = Math.sin(angle) * push;
      }
    }

    return {
      ...bubble,
      targetX: state.isPressed ? bubble.x + dx : 0,
      targetY: state.isPressed ? bubble.y + dy : 0,
      baseVisualSize: visualSize,
      currentDepthScale: depthScale,
      width: bubble.baseSize,
      height: bubble.baseSize,
      radius: visualSize / 2,
      targetScale: state.isPressed ? depthScale : 0.2,
    };
  });

  if (state.isPressed) {
    resolveBubbleFieldLayout(processedBubbles);
  }

  const childMenuParent = state.isPressed && state.childMenuParentId != null
    ? processedBubbles.find((bubble) => bubble.id === state.childMenuParentId)
    : null;
  let childNodes = childMenuParent
    ? buildChildBubbleLayout(childMenuParent, state.hoveredChildBubble)
    : [];
  let childZone = childMenuParent && childNodes.length
    ? getChildZone(childMenuParent, childNodes)
    : null;

  const hoverState = state.isPressed && state.mousePos.active
    ? getHoverState(
      { x: clusterMouseX, y: clusterMouseY },
      processedBubbles,
      childNodes,
      childZone,
    )
    : { bubbleId: null, childId: null };
  let bestHit = hoverState.bubbleId;
  let hoveredChildId = hoverState.childId;

  const hoveredPill = processedBubbles.find((bubble) => bubble.id === bestHit && bubble.isPill);
  if (hoveredPill && state.isPressed) {
    if (state.lockedExpandedPillId !== hoveredPill.id) {
      state.lockedExpandedPillId = hoveredPill.id;
      state.lockedExpandedPillScale = hoveredPill.targetScale;
    }
  } else {
    state.lockedExpandedPillId = null;
    state.lockedExpandedPillScale = null;
  }

  processedBubbles = processedBubbles.map((bubble) => {
    const isHovered = bestHit === bubble.id;
    let finalTargetScale = bubble.targetScale;
    if (
      isHovered &&
      bubble.isPill &&
      state.lockedExpandedPillId === bubble.id &&
      state.lockedExpandedPillScale != null
    ) {
      finalTargetScale = state.lockedExpandedPillScale;
    }
    const expandedExtraSourceWidth = bubble.isPill
      ? bubble.expandedExtraWidth / Math.max(finalTargetScale || 1, 0.0001)
      : 0;
    const isExpanded = state.isPressed && isHovered && bubble.isPill && state.childMenuParentId !== bubble.id;
    return {
      ...bubble,
      isExpanded,
      expandedExtraSourceWidth,
      targetWidth: isExpanded ? bubble.baseSize + expandedExtraSourceWidth : bubble.baseSize,
      width: isExpanded ? bubble.baseSize + expandedExtraSourceWidth : bubble.baseSize,
      height: bubble.baseSize,
      radius: (bubble.baseSize * finalTargetScale) / 2,
      targetScale: finalTargetScale,
    };
  });

  childNodes = childNodes.map((child) => ({
    ...child,
    targetScale: hoveredChildId === child.id ? 1.08 : 1,
  }));

  const expandedPill = processedBubbles.find((bubble) => bubble.isExpanded);
  if (expandedPill) {
    for (const bubble of processedBubbles) {
      if (bubble.id === expandedPill.id) continue;
      const initialPush = getExpandedPillRepulsion(expandedPill, bubble, PILL_REPULSION_INFLUENCE);
      if (initialPush) {
        bubble.targetX += initialPush.x;
        bubble.targetY += initialPush.y;
      }
    }

    for (let iter = 0; iter < PILL_REPULSION_ITERATIONS; iter += 1) {
      for (const bubble of processedBubbles) {
        if (bubble.id === expandedPill.id) continue;
        const pillPush = getExpandedPillRepulsion(expandedPill, bubble, 0);
        if (pillPush) {
          bubble.targetX += pillPush.x;
          bubble.targetY += pillPush.y;
        }
      }

      for (let i = 0; i < processedBubbles.length; i += 1) {
        for (let j = i + 1; j < processedBubbles.length; j += 1) {
          const bubbleA = processedBubbles[i];
          const bubbleB = processedBubbles[j];
          if (bubbleA.id === expandedPill.id || bubbleB.id === expandedPill.id) continue;
          separateBubblePair(bubbleA, bubbleB);
        }
      }
    }
  }

  if (childNodes.length && childMenuParent) {
    const branchIds = new Set([childMenuParent.id, ...childNodes.map((node) => node.id)]);
    for (const child of childNodes) {
      for (const bubble of processedBubbles) {
        if (branchIds.has(bubble.id)) continue;
        const initialPush = getNodeRepulsion(child, bubble, 28, CHILD_LAYOUT_GAP);
        if (initialPush) {
          bubble.targetX += initialPush.x;
          bubble.targetY += initialPush.y;
        }
      }
    }

    for (let iter = 0; iter < 12; iter += 1) {
      for (const child of childNodes) {
        for (const bubble of processedBubbles) {
          if (branchIds.has(bubble.id)) continue;
          const repel = getNodeRepulsion(child, bubble, 0, CHILD_LAYOUT_GAP);
          if (repel) {
            bubble.targetX += repel.x;
            bubble.targetY += repel.y;
          }
        }
      }
      resolveBubbleFieldLayout(processedBubbles);
    }
  }

  let panX = targetPanX;
  let panY = targetPanY;
  if (childMenuParent && childNodes.length) {
    const branchBounds = getChildBranchBounds(childMenuParent, childNodes);
    if (branchBounds.right + panX + PAN_MARGIN_PX > CANVAS_HALF_SIZE) {
      panX = CANVAS_HALF_SIZE - branchBounds.right - PAN_MARGIN_PX;
    } else if (branchBounds.left + panX - PAN_MARGIN_PX < -CANVAS_HALF_SIZE) {
      panX = -CANVAS_HALF_SIZE - branchBounds.left + PAN_MARGIN_PX;
    }

    if (branchBounds.bottom + panY + PAN_MARGIN_PX > CANVAS_HALF_SIZE) {
      panY = CANVAS_HALF_SIZE - branchBounds.bottom - PAN_MARGIN_PX;
    } else if (branchBounds.top + panY - PAN_MARGIN_PX < -CANVAS_HALF_SIZE) {
      panY = -CANVAS_HALF_SIZE - branchBounds.top + PAN_MARGIN_PX;
    }

    if (state.mousePos.active) {
      const correctedPoint = { x: state.mousePos.x - panX, y: state.mousePos.y - panY };
      let correctedHover = getHoverState(
        correctedPoint,
        processedBubbles,
        childNodes,
        childZone,
      );
      if (!correctedHover.childId) {
        const stickyChild = getNearestChildHover(correctedPoint, childNodes);
        if (stickyChild) {
          correctedHover = {
            bubbleId: childMenuParent.id,
            childId: stickyChild.id,
          };
        } else if (!correctedHover.bubbleId) {
          correctedHover = {
            bubbleId: childMenuParent.id,
            childId: null,
          };
        }
      }
      bestHit = correctedHover.bubbleId;
      hoveredChildId = correctedHover.childId;
      childNodes = childNodes.map((child) => ({
        ...child,
        targetScale: hoveredChildId === child.id ? 1.08 : 1,
      }));
    }
  } else if (expandedPill) {
    const pillHalfWidth = (expandedPill.baseSize * expandedPill.targetScale) / 2;
    const pillHalfHeight = (expandedPill.baseSize * expandedPill.targetScale) / 2;
    const left = expandedPill.targetX - pillHalfWidth;
    const right = expandedPill.targetX + pillHalfWidth + expandedPill.expandedExtraWidth;
    const top = expandedPill.targetY - pillHalfHeight;
    const bottom = expandedPill.targetY + pillHalfHeight;

    if (right + panX + PAN_MARGIN_PX > CANVAS_HALF_SIZE) {
      panX = CANVAS_HALF_SIZE - right - PAN_MARGIN_PX;
    } else if (left + panX - PAN_MARGIN_PX < -CANVAS_HALF_SIZE) {
      panX = -CANVAS_HALF_SIZE - left + PAN_MARGIN_PX;
    }

    if (bottom + panY + PAN_MARGIN_PX > CANVAS_HALF_SIZE) {
      panY = CANVAS_HALF_SIZE - bottom - PAN_MARGIN_PX;
    } else if (top + panY - PAN_MARGIN_PX < -CANVAS_HALF_SIZE) {
      panY = -CANVAS_HALF_SIZE - top + PAN_MARGIN_PX;
    }
  }

  previousHoveredId = bestHit;
  previousHoveredChildId = hoveredChildId;

  return {
    bubbles: processedBubbles,
    children: childNodes,
    childZone,
    orb: {
      id: 'orb',
      targetScale: state.isPressed ? (ORB_PRESSED_SIZE / ORB_BASE_SIZE) : 1,
    },
    panOffset: {
      x: panX,
      y: panY,
    },
    hoveredId: bestHit,
    hoveredChildId,
  };
}

function getExpandedPillRepulsion(pill, bubble, influencePadding) {
  const pillHalfWidth = (pill.baseSize * pill.targetScale) / 2;
  const pillHalfHeight = (pill.baseSize * pill.targetScale) / 2;
  const rectLeft = pill.targetX - pillHalfWidth;
  const rectRight = pill.targetX + pillHalfWidth + pill.expandedExtraWidth;
  const rectTop = pill.targetY - pillHalfHeight;
  const rectBottom = pill.targetY + pillHalfHeight;

  const closestX = clamp(bubble.targetX, rectLeft, rectRight);
  const closestY = clamp(bubble.targetY, rectTop, rectBottom);
  let dx = bubble.targetX - closestX;
  let dy = bubble.targetY - closestY;

  if (dx === 0 && dy === 0) {
    dx = bubble.targetX >= pill.targetX ? 1 : -1;
    dy = 0;
  }

  const dist = Math.hypot(dx, dy) || 1;
  const safeDist = bubble.radius + PILL_LAYOUT_GAP;
  const influenceZone = safeDist + influencePadding;
  if (dist >= influenceZone) return null;

  const required = Math.max(0, safeDist - dist);
  const pushFactor = influencePadding > 0
    ? Math.pow((influenceZone - dist) / influenceZone, 1.15)
    : 0;
  const angle = Math.atan2(dy, dx);
  const distance = required + (pushFactor * 22);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function separateBubblePair(bubbleA, bubbleB) {
  const dx = bubbleB.targetX - bubbleA.targetX;
  const dy = bubbleB.targetY - bubbleA.targetY;
  const dist = Math.hypot(dx, dy) || 1;
  const minDist = bubbleA.radius + bubbleB.radius + DEFAULT_BUBBLE_GAP;

  if (dist >= minDist) return;

  const diff = (minDist - dist) / 2;
  const angle = Math.atan2(dy || 0.0001, dx || 0.0001);
  const moveX = Math.cos(angle) * diff;
  const moveY = Math.sin(angle) * diff;
  bubbleA.targetX -= moveX;
  bubbleA.targetY -= moveY;
  bubbleB.targetX += moveX;
  bubbleB.targetY += moveY;
}

function resolveBubbleFieldLayout(bubbles) {
  for (let iter = 0; iter < BUBBLE_LAYOUT_ITERATIONS; iter += 1) {
    for (let i = 0; i < bubbles.length; i += 1) {
      for (let j = i + 1; j < bubbles.length; j += 1) {
        separateBubblePair(bubbles[i], bubbles[j]);
      }
    }
  }
}

function measurePillExtraWidth(bubble) {
  const titleWidth = measureTextWidth(bubble.pillTitle || '', '600 22px "DM Sans"');
  const subtitleWidth = measureTextWidth(bubble.pillSubtitle || '', '400 18px "DM Sans"');
  const leftPadding = bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING;
  const rightPadding = getPillTextRightPadding(bubble);
  return Math.ceil(Math.max(titleWidth, subtitleWidth) + leftPadding + rightPadding + 2);
}

function getPillTextRightPadding(bubble) {
  if (bubble.pillTextRightPadding != null) return bubble.pillTextRightPadding;
  if (!bubble.pillTrailingIcon) return PILL_TEXT_RIGHT_PADDING;
  const actionSize = bubble.pillTrailingIconSize || 40;
  const actionRight = bubble.pillTrailingIconRight ?? 40;
  return actionRight + actionSize + (bubble.pillActionGap ?? 10);
}

function measureTextWidth(text, font) {
  if (!textMeasureContext) return text.length * 14;
  textMeasureContext.font = font;
  return textMeasureContext.measureText(text).width;
}

function measureChildChipWidth(action) {
  if (action.measuredWidth) return action.measuredWidth;
  const fontWeight = action.fontWeight || 400;
  const labelWidth = measureTextWidth(action.label || '', `${fontWeight} ${CHILD_CHIP_FONT_SIZE}px "DM Sans"`);
  return Math.ceil(labelWidth + (CHILD_CHIP_PADDING_X * 2));
}

function updateMeasuredChildChipWidths() {
  let changed = false;

  for (const refsForChild of refs.childNodes.values()) {
    if (!isChipAction(refsForChild.action) || !refsForChild.label) continue;

    const measuredLabelWidth = Math.ceil(
      refsForChild.label.getBoundingClientRect().width ||
      refsForChild.label.scrollWidth ||
      0,
    );
    if (!measuredLabelWidth) continue;

    const nextMeasuredWidth = measuredLabelWidth + (CHILD_CHIP_PADDING_X * 2);
    if (refsForChild.action.measuredWidth !== nextMeasuredWidth) {
      refsForChild.action.measuredWidth = nextMeasuredWidth;
      changed = true;
    }
  }

  if (changed) scheduleRender();
}

function enrichBubbleMetrics(bubble) {
  return {
    ...bubble,
    baseSize: BUBBLE_BASE_SIZE,
    expandedExtraWidth: bubble.isPill ? measurePillExtraWidth(bubble) : 0,
  };
}

function createBubbleGraphic(bubble) {
  const image = document.createElement('img');
  image.className = bubble.fill ? 'bubble2-icon is-fill' : 'bubble2-icon is-contain';
  image.src = bubble.img;
  image.alt = '';
  image.draggable = false;
  image.style.setProperty('--bubble-image-scale', String(bubble.imageScale ?? (bubble.fill ? 1 : 0.72)));
  image.addEventListener('error', () => {
    if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
  });
  return image;
}

function createSubIconGraphic(kind) {
  if (kind === 'message-badge') {
    return createHtmlNode(`
      <div class="message-badge">
        <div class="message-badge__bubble"></div>
        <div class="message-badge__tail"></div>
        <div class="message-badge__dots"><span></span><span></span><span></span></div>
      </div>
    `);
  }

  if (kind === 'spotify-badge') {
    const image = document.createElement('img');
    image.className = 'bubble2-icon is-fill';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/960px-Spotify_icon.svg.png?_=20220821125323';
    image.alt = '';
    image.draggable = false;
    image.style.setProperty('--bubble-image-scale', '1');
    image.addEventListener('error', () => {
      if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
    });
    return image;
  }

  if (kind === 'call-badge') {
    const image = document.createElement('img');
    image.className = 'bubble2-icon is-fill';
    image.src = PROFILE_CALL_BADGE_ASSET;
    image.alt = '';
    image.draggable = false;
    image.style.setProperty('--bubble-image-scale', '1');
    image.addEventListener('error', () => {
      if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
    });
    return image;
  }

  return document.createElement('div');
}

function createChildActionGraphic(action) {
  if (action.img) {
    const image = document.createElement('img');
    image.className = action.fill ? 'bubble2-icon is-fill' : 'bubble2-icon is-contain';
    image.src = action.img;
    image.alt = '';
    image.draggable = false;
    image.style.setProperty('--bubble-image-scale', String(action.imageScale ?? (action.fill ? 1 : 0.76)));
    image.addEventListener('error', () => {
      if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
    });
    return image;
  }

  const fg = getChildActionForeground(action.fg);
  return createHtmlNode(`
    <div class="bubble2-child-action-icon" style="--child-action-fg: ${fg};">
      ${getChildActionIconMarkup(action.kind)}
    </div>
  `);
}

function getPillTrailingIconMarkup(kind) {
  switch (kind) {
    case 'pause':
      return '<i class="bi bi-pause-fill" aria-hidden="true"></i>';
    default:
      return '';
  }
}

function getChildActionForeground(color) {
  const normalized = (color || '').trim().toLowerCase();
  if (!normalized) return '#ffffff';
  if (normalized === '#121212' || normalized === '#111827' || normalized === '#0f172a' || normalized === '#000000') {
    return '#ffffff';
  }
  return color;
}

function getChildActionAccent(action) {
  if (!action) return 'rgb(144 172 255)';
  if (action.accent) return action.accent;
  return getChildActionForeground(action.fg || action.bg || 'rgb(144 172 255)');
}

function getChildActionIconMarkup(kind) {
  switch (kind) {
    case 'home':
      return '<i class="bi bi-house-door-fill" aria-hidden="true"></i>';
    case 'briefcase':
      return '<i class="bi bi-suitcase-lg-fill" aria-hidden="true"></i>';
    case 'phone':
      return '<i class="bi bi-telephone-fill" aria-hidden="true"></i>';
    case 'message':
      return '<i class="bi bi-chat-fill" aria-hidden="true"></i>';
    case 'video':
      return '<i class="bi bi-camera-video-fill" aria-hidden="true"></i>';
    case 'check':
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.354-8.354a.5.5 0 0 0-.708-.708L7 9.586 5.854 8.44a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l4-4Z"/></svg>';
    case 'mic':
      return '<i class="bi bi-mic-fill" aria-hidden="true"></i>';
    case 'scan':
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h3v1H3v2H2V2Zm11 0h1v3h-1V3h-2V2h2ZM2 11h1v2h2v1H2v-3Zm11 0h1v3h-3v-1h2v-2ZM5.5 5h5v6h-5V5Zm1 1v4h3V6h-3Z"/></svg>';
    case 'sun':
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 4a.5.5 0 0 1-.5-.5V14a.5.5 0 0 1 1 0v1.5a.5.5 0 0 1-.5.5Zm0-13a.5.5 0 0 1-.5-.5V1a.5.5 0 0 1 1 0v1.5A.5.5 0 0 1 8 3Zm8 5a.5.5 0 0 1-.5.5H14a.5.5 0 0 1 0-1h1.5A.5.5 0 0 1 16 8ZM2 8a.5.5 0 0 1-.5.5H0a.5.5 0 0 1 0-1h1.5A.5.5 0 0 1 2 8Zm11.657 5.657a.5.5 0 0 1-.707 0l-1.06-1.06a.5.5 0 1 1 .707-.708l1.06 1.061a.5.5 0 0 1 0 .707Zm-9.9-9.9a.5.5 0 0 1-.707 0L1.99 2.697a.5.5 0 1 1 .707-.707l1.06 1.06a.5.5 0 0 1 0 .708Zm9.9-1.06a.5.5 0 0 1 0 .707l-1.06 1.061a.5.5 0 0 1-.707-.708l1.06-1.06a.5.5 0 0 1 .707 0Zm-9.9 9.9a.5.5 0 0 1 0 .707l-1.06 1.06a.5.5 0 0 1-.707-.707l1.06-1.06a.5.5 0 0 1 .707 0Z"/></svg>';
    case 'umbrella':
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0a5.5 5.5 0 0 0-5.456 4.803A1.5 1.5 0 0 0 2.5 8H7v5.5a1.5 1.5 0 0 0 3 0V13a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-1 0V8h5.5a1.5 1.5 0 0 0-.044-3.197A5.5 5.5 0 0 0 8 0Z"/></svg>';
    case 'radar':
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1A6 6 0 1 1 8 2a6 6 0 0 1 0 12Zm0-2.5A3.5 3.5 0 1 0 8 4.5a3.5 3.5 0 0 0 0 7Zm0-1A2.5 2.5 0 1 1 8 5.5a2.5 2.5 0 0 1 0 5Zm0-2A.5.5 0 1 0 8 7a.5.5 0 0 0 0 1Z"/></svg>';
    case 'shoe':
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8.5 1.5a.5.5 0 0 1 .5.5v2.086a1 1 0 0 0 .293.707l1.414 1.414a1 1 0 0 0 .707.293H14a1 1 0 0 1 1 1v1H1v-.5a2 2 0 0 1 2-2h2.086a1 1 0 0 0 .707-.293L7.5 4.5V2a.5.5 0 0 1 .5-.5Z"/></svg>';
    case 'heart':
      return '<i class="bi bi-heart-fill" aria-hidden="true"></i>';
    case 'drop':
      return '<i class="bi bi-droplet-fill" aria-hidden="true"></i>';
    default:
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>';
  }
}

function createHtmlNode(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function getChildBubbleKey(parentId, childId) {
  return `${parentId}:${childId}`;
}

function isChipAction(action) {
  return action?.kind === 'chip';
}

function hasChildActions(id) {
  return Boolean(BUBBLES_CONFIG.find((bubble) => bubble.id === id)?.childActions?.length);
}

function clearChildHoverTimer() {
  if (state.childHoverTimer != null) {
    window.clearTimeout(state.childHoverTimer);
    state.childHoverTimer = null;
  }
  state.childHoverCandidateId = null;
}

function syncChildMenuState(nextHoveredBubbleId) {
  let changed = false;

  if (!state.isPressed) {
    if (state.childMenuParentId != null) {
      state.childMenuParentId = null;
      state.childMenuPointerLock = null;
      changed = true;
    }
    clearChildHoverTimer();
    return changed;
  }

  if (
    state.childMenuParentId != null &&
    nextHoveredBubbleId != null &&
    nextHoveredBubbleId !== state.childMenuParentId
  ) {
    state.childMenuParentId = null;
    state.childMenuPointerLock = null;
    state.hoveredChildBubble = null;
    changed = true;
  }

  if (!nextHoveredBubbleId || !hasChildActions(nextHoveredBubbleId)) {
    clearChildHoverTimer();
    return changed;
  }

  if (state.childMenuParentId === nextHoveredBubbleId) {
    clearChildHoverTimer();
    return changed;
  }

  if (state.childHoverCandidateId === nextHoveredBubbleId) return changed;

  clearChildHoverTimer();
  state.childHoverCandidateId = nextHoveredBubbleId;
  state.childHoverTimer = window.setTimeout(() => {
    state.childHoverTimer = null;
    state.childHoverCandidateId = null;

    if (!state.isPressed || state.hoveredBubble !== nextHoveredBubbleId) return;
    if (!hasChildActions(nextHoveredBubbleId)) return;

    state.childMenuParentId = nextHoveredBubbleId;
    state.childMenuPointerLock = { ...state.mousePos };
    state.hoveredChildBubble = null;
    scheduleRender();
  }, CHILD_MENU_HOLD_MS);

  return changed;
}

function getHoverState(point, bubbles, children, childZone) {
  const sortedChildren = [...children].sort((a, b) => {
    if (a.id === previousHoveredChildId) return -1;
    if (b.id === previousHoveredChildId) return 1;
    return (b.zIndex || 0) - (a.zIndex || 0);
  });

  for (const child of sortedChildren) {
    if (isPointerInsideChild(point, child, previousHoveredChildId === child.id ? HOVER_LEASH_PX : 0)) {
      return { bubbleId: child.parentId, childId: child.id };
    }
  }

  if (childZone && isPointInsideRect(point, childZone)) {
    return { bubbleId: childZone.parentId, childId: null };
  }

  const sortedBubbles = [...bubbles].sort((a, b) => {
    if (a.id === previousHoveredId) return -1;
    if (b.id === previousHoveredId) return 1;
    return (b.zIndex || 0) - (a.zIndex || 0);
  });

  for (const bubble of sortedBubbles) {
    if (isPointerInsideBubble(point, bubble)) {
      return { bubbleId: bubble.id, childId: null };
    }
  }

  return { bubbleId: null, childId: null };
}

function isPointerInsideChild(point, child, padding) {
  if (child.shape === 'rect') {
    const bounds = getNodeBounds(child);
    return (
      point.x >= bounds.left - padding &&
      point.x <= bounds.right + padding &&
      point.y >= bounds.top - padding &&
      point.y <= bounds.bottom + padding
    );
  }

  const radius = child.radius + padding;
  const dx = point.x - child.targetX;
  const dy = point.y - child.targetY;
  return Math.hypot(dx, dy) <= radius;
}

function getNearestChildHover(point, children) {
  for (const child of children) {
    if (isPointerInsideChild(point, child, 24)) return child;
  }
  return null;
}

function isPointerInsideBubble(point, bubble) {
  const stickyPadding = previousHoveredId === bubble.id ? HOVER_LEASH_PX : 0;
  const hitRadius = bubble.baseVisualSize / 2;
  const dx = point.x - bubble.targetX;
  const dy = point.y - bubble.targetY;

  if (previousHoveredId === bubble.id && bubble.isPill && state.childMenuParentId !== bubble.id) {
    return (
      dx >= -hitRadius - stickyPadding &&
      dx <= hitRadius + bubble.expandedExtraWidth + stickyPadding + 10 &&
      dy >= -hitRadius - stickyPadding &&
      dy <= hitRadius + stickyPadding
    );
  }

  return Math.hypot(dx, dy) <= hitRadius + 5 + stickyPadding;
}

function isPointInsideRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function getNodeBounds(node) {
  const scale = node.targetScale || 1;
  const width = node.width ?? node.targetWidth ?? node.baseSize ?? 0;
  const height = node.height ?? node.targetHeight ?? node.baseSize ?? 0;
  const halfWidth = (width * scale) / 2;
  const halfHeight = (height * scale) / 2;
  return {
    left: node.targetX - halfWidth,
    right: node.targetX + halfWidth,
    top: node.targetY - halfHeight,
    bottom: node.targetY + halfHeight,
  };
}

function getNodeGap(nodeA, nodeB) {
  if (nodeA.isChild || nodeB.isChild) return CHILD_LAYOUT_GAP;
  return DEFAULT_BUBBLE_GAP;
}

function getCircleRepulsion(source, node, influencePadding, extraGap) {
  const dx = node.targetX - source.targetX;
  const dy = node.targetY - source.targetY;
  const dist = Math.hypot(dx, dy) || 1;
  const safeDist = source.radius + node.radius + extraGap;
  const influenceZone = safeDist + influencePadding;
  if (dist >= influenceZone) return null;

  const pushFactor = influencePadding > 0
    ? Math.pow((influenceZone - dist) / influenceZone, 1.1)
    : 0;
  const required = Math.max(0, safeDist - dist);
  const angle = Math.atan2(dy || 0.0001, dx || 0.0001);
  const distance = required + (pushFactor * 20);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function getNodeRepulsion(source, node, influencePadding, extraGap) {
  if (source.shape !== 'rect') {
    return getCircleRepulsion(source, node, influencePadding, extraGap);
  }

  const bounds = getNodeBounds(source);
  const closestX = clamp(node.targetX, bounds.left, bounds.right);
  const closestY = clamp(node.targetY, bounds.top, bounds.bottom);
  let dx = node.targetX - closestX;
  let dy = node.targetY - closestY;

  if (dx === 0 && dy === 0) {
    dx = node.targetX >= source.targetX ? 1 : -1;
    dy = 0;
  }

  const dist = Math.hypot(dx, dy) || 1;
  const safeDist = (node.radius || (Math.max(node.width, node.height) / 2)) + extraGap;
  const influenceZone = safeDist + influencePadding;
  if (dist >= influenceZone) return null;

  const pushFactor = influencePadding > 0
    ? Math.pow((influenceZone - dist) / influenceZone, 1.1)
    : 0;
  const required = Math.max(0, safeDist - dist);
  const angle = Math.atan2(dy, dx);
  const distance = required + (pushFactor * 20);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function buildChildBubbleLayout(parentBubble, hoveredChildBubbleId) {
  const actions = parentBubble.childActions || [];
  if (parentBubble.childLayout === 'chatgpt-chips' || parentBubble.childLayout === 'gemini-chips') {
    return buildChildChipLayout(parentBubble, actions, hoveredChildBubbleId);
  }

  const baseAngle = Math.atan2(parentBubble.targetY - 18, parentBubble.targetX || 0.001);
  const childRadius = CHILD_BUBBLE_SIZE / 2;
  const distance = parentBubble.radius + childRadius + CHILD_FAN_DISTANCE;
  const offsets = getFanAngleOffsets(actions.length, CHILD_BUBBLE_SIZE, distance);

  return actions.map((action, index) => {
    const angle = baseAngle + offsets[index];
    const childId = getChildBubbleKey(parentBubble.id, action.id);
    return {
      ...action,
      id: childId,
      parentId: parentBubble.id,
      actionIndex: index,
      isChild: true,
      width: CHILD_BUBBLE_SIZE,
      height: CHILD_BUBBLE_SIZE,
      radius: childRadius,
      targetX: parentBubble.targetX + Math.cos(angle) * distance,
      targetY: parentBubble.targetY + Math.sin(angle) * distance,
      targetScale: hoveredChildBubbleId === childId ? 1.08 : 1,
      zIndex: 60 + index,
    };
  });
}

function buildChildChipLayout(parentBubble, actions, hoveredChildBubbleId) {
  const chipNodes = actions.map((action, index) => {
    const width = measureChildChipWidth(action);
    const height = CHILD_CHIP_HEIGHT;
    const childId = getChildBubbleKey(parentBubble.id, action.id);
    const baseCenterX = parentBubble.targetX + (action.layoutLeft || 0) + (width / 2);
    const baseCenterY = parentBubble.targetY + (action.layoutTop || 0) + (height / 2);
    const dx = baseCenterX - parentBubble.targetX;
    const dy = baseCenterY - parentBubble.targetY;
    const distance = Math.hypot(dx, dy) || 1;
    const gapOffsetX = (dx / distance) * CHILD_CHIP_PARENT_GAP;
    const gapOffsetY = (dy / distance) * CHILD_CHIP_PARENT_GAP;
    const centerX = baseCenterX + gapOffsetX;
    const centerY = baseCenterY + gapOffsetY;
    const extraOffset = getChipParentClearanceOffset(parentBubble, centerX, centerY, width, height, CHILD_CHIP_PARENT_GAP);

    return {
      ...action,
      id: childId,
      parentId: parentBubble.id,
      actionIndex: index,
      isChild: true,
      shape: 'rect',
      width,
      height,
      radius: Math.max(width, height) / 2,
      targetX: centerX + ((dx / distance) * extraOffset),
      targetY: centerY + ((dy / distance) * extraOffset),
      targetScale: hoveredChildBubbleId === childId ? 1.08 : 1,
      zIndex: 60 + index,
    };
  });

  for (let index = 1; index < chipNodes.length; index += 1) {
    const previous = chipNodes[index - 1];
    const current = chipNodes[index];
    const previousBottom = previous.targetY + (previous.height / 2);
    const desiredTop = previousBottom + CHILD_CHIP_VERTICAL_GAP;
    current.targetY = desiredTop + (current.height / 2);
  }

  return chipNodes;
}

function getChipParentClearanceOffset(parentBubble, chipCenterX, chipCenterY, chipWidth, chipHeight, gap) {
  const rectLeft = chipCenterX - (chipWidth / 2);
  const rectRight = chipCenterX + (chipWidth / 2);
  const rectTop = chipCenterY - (chipHeight / 2);
  const rectBottom = chipCenterY + (chipHeight / 2);
  const closestX = clamp(parentBubble.targetX, rectLeft, rectRight);
  const closestY = clamp(parentBubble.targetY, rectTop, rectBottom);
  const dx = closestX - parentBubble.targetX;
  const dy = closestY - parentBubble.targetY;
  const distance = Math.hypot(dx, dy);
  const requiredDistance = parentBubble.radius + gap;
  return Math.max(0, requiredDistance - distance);
}

function getFanAngleOffsets(count, childSize, distance) {
  if (count <= 1) return [0];

  const minimumChord = childSize + CHILD_SIBLING_GAP;
  const safeRatio = Math.min(0.98, minimumChord / Math.max(1, 2 * distance));
  const minimumStep = 2 * Math.asin(safeRatio);
  const preferredStep = count === 2 ? 0.76 : count === 3 ? 0.7 : 0.64;
  const step = Math.max(preferredStep, minimumStep);
  const centerIndex = (count - 1) / 2;

  return Array.from({ length: count }, (_, index) => (index - centerIndex) * step);
}

function getChildBranchBounds(parentBubble, childNodes) {
  const nodes = [parentBubble, ...childNodes];
  return nodes.reduce((bounds, node) => {
    const nodeBounds = getNodeBounds(node);
    return {
      left: Math.min(bounds.left, nodeBounds.left),
      right: Math.max(bounds.right, nodeBounds.right),
      top: Math.min(bounds.top, nodeBounds.top),
      bottom: Math.max(bounds.bottom, nodeBounds.bottom),
    };
  }, {
    left: Number.POSITIVE_INFINITY,
    right: Number.NEGATIVE_INFINITY,
    top: Number.POSITIVE_INFINITY,
    bottom: Number.NEGATIVE_INFINITY,
  });
}

function getChildZone(parentBubble, childNodes) {
  const bounds = getChildBranchBounds(parentBubble, childNodes);
  return {
    parentId: parentBubble.id,
    left: bounds.left - CHILD_FAN_BOUNDS_PADDING,
    right: bounds.right + CHILD_FAN_BOUNDS_PADDING,
    top: bounds.top - CHILD_FAN_BOUNDS_PADDING,
    bottom: bounds.bottom + CHILD_FAN_BOUNDS_PADDING,
  };
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function format(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, '');
}
