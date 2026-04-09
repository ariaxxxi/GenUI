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
const OPEN_STAGGER_STEP_MS = 25;
const DEFAULT_MOVE_DURATION_MS = 450;
const ACTIVE_MOVE_DURATION_MS = 250;
const APPEAR_MOVE_DURATION_MS = 500;
const DISAPPEAR_MOVE_DURATION_MS = 400;
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
const PILL_TEXT_LEFT_PADDING = 6;
const PILL_TEXT_RIGHT_PADDING = 40;
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
    y: -107,
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
    subIconKind: 'spotify-badge',
    subIconSize: 42.167,
    subIconOffsetX: 67.83,
    subIconOffsetY: 67.83,
    disableHoverScale: true,
  },
  {
    id: 3,
    x: -87,
    y: -148,
    zIndex: 15,
    img: 'assets/profile1.png',
    fill: true,
    isPill: true,
    pillTitle: 'Tony',
    pillSubtitle: 'I love it!',
    subIconKind: 'message-badge',
    subIconSize: 47.949,
    subIconOffsetX: 62.04,
    subIconOffsetY: 62.05,
  },
  {
    id: 9,
    x: 66,
    y: -204,
    zIndex: 14,
    img: FIGMA_ASSETS.note,
    fill: true,
  },
  {
    id: 4,
    x: 18,
    y: -272,
    zIndex: 12,
    img: FIGMA_ASSETS.health,
    fill: true,
    isPill: true,
    pillTitle: '10,243 steps',
    pillSubtitle: '',
  },
  {
    id: 2,
    x: -106,
    y: -22,
    zIndex: 13,
    img: FIGMA_ASSETS.chatgpt,
    fill: true,
    pillTitle: 'Continue',
    pillSubtitle: 'Book flight to Coachella',
  },
  {
    id: 8,
    x: 91,
    y: 7,
    zIndex: 14,
    img: FIGMA_ASSETS.gemini,
    fill: true,
  },
  {
    id: 5,
    x: 110,
    y: -126,
    zIndex: 16,
    img: 'assets/profile2.png',
    fill: true,
    isPill: true,
    pillTitle: 'Hiro',
    pillSubtitle: 'Yesterday',
    pillTextLeftPadding: 10,
    subIconKind: 'call-badge',
    subIconSize: 41.532,
    subIconOffsetX: 53.74,
    subIconOffsetY: 53.75,
  },
  {
    id: 6,
    x: -21,
    y: -203,
    zIndex: 10,
    img: FIGMA_ASSETS.map,
    fill: true,
  },
  {
    id: 10,
    x: -88,
    y: -230,
    zIndex: 12,
    img: FIGMA_ASSETS.weather,
    fill: true,
  },
].map(enrichBubbleMetrics);

const state = {
  isPressed: false,
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
  renderQueued: false,
};

let previousHoveredId = null;

const refs = {
  shell: document.querySelector('[data-bubble2-shell]'),
  panLayer: document.querySelector('[data-bubble2-pan-layer]'),
  orb: null,
  orbVisual: null,
  bubbleNodes: new Map(),
};

init();

function init() {
  if (!refs.shell || !refs.panLayer) return;

  buildScene();
  bindEvents();
  render();
}

function buildScene() {
  const fragment = document.createDocumentFragment();

  BUBBLES_CONFIG.forEach((bubble, index) => {
    const node = createBubbleNode(bubble, index);
    refs.bubbleNodes.set(bubble.id, node);
    fragment.appendChild(node.root);
  });

  refs.orb = createOrbNode();
  refs.orbVisual = refs.orb.querySelector('.bubble2-orb-visual');
  fragment.appendChild(refs.orb);
  refs.panLayer.appendChild(fragment);
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
      action.style.setProperty('--pill-action-right', `${bubble.pillTrailingIconRight ?? 18}px`);
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

  if (refs.orb?.releasePointerCapture && event.pointerId != null) {
    try {
      refs.orb.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore capture release errors.
    }
  }

  state.isPressed = false;
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
  state.lockedExpandedPillId = null;
  state.lockedExpandedPillScale = null;
  previousHoveredId = null;
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

function render() {
  const scene = computeScene();
  const isInitialReveal = state.isPressed && !state.pointerMovedSincePress;
  const activeMoveDuration = state.mousePos.active
    ? (isInitialReveal ? DEFAULT_MOVE_DURATION_MS : ACTIVE_MOVE_DURATION_MS)
    : DEFAULT_MOVE_DURATION_MS;
  const staggered = isInitialReveal ? OPEN_STAGGER_STEP_MS : 0;

  refs.panLayer.style.transitionDuration = '1000ms';
  refs.panLayer.style.transform =
    `translate(-50%, -50%) translate3d(${format(scene.panOffset.x)}px, ${format(scene.panOffset.y)}px, 0)`;

  for (const bubble of scene.bubbles) {
    const node = refs.bubbleNodes.get(bubble.id);
    if (!node) continue;

    const isHovered = scene.hoveredId === bubble.id;
    const isAppearing = isInitialReveal;
    const isReturning = !state.isPressed;
    const staggerDelay = staggered ? node.index * staggered : 0;
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
    node.root.style.opacity = state.isPressed ? '1' : '0';
    node.root.style.boxShadow = isHovered
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      : '0 15px 35px -5px rgba(0, 0, 0, 0.3)';
    node.root.style.transform =
      `translate3d(${format(translateX)}px, ${format(translateY)}px, 0) scale(${bubble.targetScale.toFixed(4)})`;
    node.root.style.setProperty('--bubble2-move-duration', `${activeMoveDuration}ms`);
    node.root.style.setProperty('--bubble2-stagger-delay', `${staggerDelay}ms`);
    node.root.style.transitionDuration = `${transformDuration}ms, 600ms, ${opacityDuration}ms, ${shadowDuration}ms`;
    node.root.style.transitionTimingFunction = `${transformEase}, var(--bubble2-pill-ease), ease-out, ease`;

    node.iconWrap.style.width = `${bubble.baseSize}px`;
    node.iconWrap.style.height = `${bubble.baseSize}px`;

    if (node.pillCopy) {
      node.pillCopy.style.left = `${bubble.baseSize}px`;
      node.pillCopy.style.width = `${bubble.expandedExtraSourceWidth}px`;
      node.pillCopy.style.setProperty('--bubble2-title-size', `${22 / pillScale}px`);
      node.pillCopy.style.setProperty('--bubble2-subtitle-size', `${18 / pillScale}px`);
      node.pillCopy.style.setProperty('--bubble2-pill-gap', `${4 / pillScale}px`);
      node.pillCopy.style.setProperty('--pill-text-left-padding', `${(bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING) / pillScale}px`);
      node.pillCopy.style.setProperty('--pill-text-right-padding', `${getPillTextRightPadding(bubble) / pillScale}px`);
      if (bubble.pillTrailingIcon) {
        node.pillCopy.style.setProperty('--pill-action-size', `${(bubble.pillTrailingIconSize || 40) / pillScale}px`);
        node.pillCopy.style.setProperty('--pill-action-right', `${(bubble.pillTrailingIconRight ?? 18) / pillScale}px`);
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
  const nx = state.mousePos.active ? state.mousePos.nx : 0;
  const ny = state.mousePos.active ? state.mousePos.ny : 0;

  const targetPanX = -nx * MAX_PAN;
  const targetPanY = -ny * MAX_PAN;
  const clusterMouseX = state.mousePos.x - targetPanX;
  const clusterMouseY = state.mousePos.y - targetPanY;

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
      radius: visualSize / 2,
      targetScale: state.isPressed ? depthScale : 0.2,
    };
  });

  if (state.isPressed) {
    resolveBubbleFieldLayout(processedBubbles);
  }

  let bestHit = null;
  let maxZ = -1;

  if (state.isPressed && state.mousePos.active) {
    for (const bubble of processedBubbles) {
      const dx = clusterMouseX - bubble.targetX;
      const dy = clusterMouseY - bubble.targetY;
      const hitRadius = bubble.baseVisualSize / 2;
      let isHit = false;

      if (previousHoveredId === bubble.id && bubble.isPill) {
        const scaledExtraWidth = bubble.expandedExtraWidth;
        if (
          dx >= -hitRadius - 15 &&
          dx <= hitRadius + scaledExtraWidth + 15 &&
          Math.abs(dy) <= hitRadius + 15
        ) {
          isHit = true;
        }
      } else if (Math.hypot(dx, dy) <= hitRadius + 5) {
        isHit = true;
      }

      if (isHit && bubble.zIndex > maxZ) {
        maxZ = bubble.zIndex;
        bestHit = bubble.id;
      }
    }
  }

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

  previousHoveredId = bestHit;

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
    const isExpanded = state.isPressed && isHovered && bubble.isPill;
    return {
      ...bubble,
      isExpanded,
      expandedExtraSourceWidth,
      targetWidth: isExpanded ? bubble.baseSize + expandedExtraSourceWidth : bubble.baseSize,
      radius: (bubble.baseSize * finalTargetScale) / 2,
      targetScale: finalTargetScale,
    };
  });

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

  let panX = targetPanX;
  let panY = targetPanY;
  if (expandedPill) {
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

  return {
    bubbles: processedBubbles,
    orb: {
      id: 'orb',
      targetScale: state.isPressed ? (ORB_PRESSED_SIZE / ORB_BASE_SIZE) : 1,
    },
    panOffset: {
      x: panX,
      y: panY,
    },
    hoveredId: bestHit,
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
  if (!bubble.pillTrailingIcon) return PILL_TEXT_RIGHT_PADDING;
  const actionSize = bubble.pillTrailingIconSize || 40;
  const actionRight = bubble.pillTrailingIconRight ?? 18;
  return actionRight + actionSize + 10;
}

function measureTextWidth(text, font) {
  if (!textMeasureContext) return text.length * 14;
  textMeasureContext.font = font;
  return textMeasureContext.measureText(text).width;
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

function getPillTrailingIconMarkup(kind) {
  switch (kind) {
    case 'pause':
      return '<i class="bi bi-pause-fill" aria-hidden="true"></i>';
    default:
      return '';
  }
}

function createHtmlNode(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
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
