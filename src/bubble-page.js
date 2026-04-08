const LONG_PRESS_MS = 140;
const APPEAR_MOVE_DURATION_MS = 600;
const FADE_DURATION_MS = 400;
const PUSH_DURATION_MS = 1000;
const HOVER_LEASH_PX = 15;
const PAN_MARGIN_PX = 35;
const PILL_TEXT_LEFT_PADDING = 16;
const PILL_TEXT_RIGHT_PADDING = 40;
const PILL_HIT_RIGHT_PADDING = 10;
const PILL_COLLISION_PADDING = 0;
const PILL_INITIAL_INFLUENCE_PADDING = 44;
const PILL_LAYOUT_GAP = 10;
const MIN_BUBBLE_SIZE = 40;
const MAX_BUBBLE_SIZE = 100;
const FALLBACK_ICON = 'https://img.icons8.com/color/512/application-window.png';
const textMeasureContext = document.createElement('canvas').getContext('2d');
const ORB_CENTER = {
  x: 169.999 + (80.122 / 2),
  y: 323.56 + (79.587 / 2),
};

const RAW_BUBBLES_CONFIG = [
  { id: 1, width: 73, height: 72, x: -60.97, y: -278.72, zIndex: 10, kind: 'calendar' },
  { id: 2, width: 73, height: 72, x: 120.44, y: -287.35, zIndex: 10, kind: 'note', rotate: -4.29, img: 'https://play-lh.googleusercontent.com/z_o9Zbkp-r2ZU6_Erc2zNnrJDaD0rSa2mxX90Ucg77VzdTaCJvPj_RWywsT1NcRwBNAZffOM66PYkuOhBqwRlg', fill: true },
  { id: 3, width: 101, height: 100, x: 14.93, y: -222.65, zIndex: 9, img: 'https://pbs.twimg.com/profile_images/2028882435585249280/pENAnNHz_400x400.jpg', fill: true },
  { id: 4, width: 117, height: 116, x: 123, y: -185.63, zIndex: 8, kind: 'weather', img: 'https://downloadr2.apkmirror.com/wp-content/uploads/2024/12/38/676ed91c8e506_com.sec.android.daemonapp.png', fill: true },
  { id: 5, width: 153, height: 153, x: -106.56, y: -174.85, zIndex: 5, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80', fill: true, isPill: true, pillTitle: 'Tony', pillSubtitle: 'I love it!', subIconKind: 'message-badge', subIconSize: 66.692, subIconOffsetX: 86.31, subIconOffsetY: 86.31 },
  { id: 6, width: 73, height: 72, x: -170.97, y: -77.72, zIndex: 4, kind: 'health', isPill: true, pillTitle: 'Health', pillSubtitle: '10,243 steps' },
  { id: 7, width: 134, height: 131, x: 26.29, y: -104.67, zIndex: 7, kind: 'spotify', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/3840px-Spotify_logo_without_text.svg.png', fill: true, isPill: true, pillTitle: 'Playing', pillSubtitle: 'Blinding Lights' },
  { id: 8, width: 101, height: 99, x: -88.71, y: -49.81, zIndex: 4, img: 'https://store-images.s-microsoft.com/image/apps.14785.14423064005243201.42399137-369b-40bb-b5be-ac2f079c41bf.b1d6d110-9d93-441f-ac20-2e04fd7dfe3c', fill: true, isPill: true, pillTitle: 'Ready', pillSubtitle: 'How can I help?', rotate: -4.29 },
  { id: 9, width: 106, height: 106, x: 143.94, y: -73.35, zIndex: 4, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80', fill: true, subIconKind: 'message-badge', subIconSize: 46.205, subIconOffsetX: 59.79, subIconOffsetY: 59.79 },
  { id: 10, width: 62, height: 61, x: 76.94, y: -15.85, zIndex: 3, kind: 'gemini', img: 'https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png', fill: true, imageScale: 1.18 },
];

let BUBBLES_CONFIG = buildBubbleConfig();

const state = {
  isPressed: false,
  hoveredBubble: null,
  pressTimer: null,
  pressArmed: false,
};

const runtime = {
  layout: null,
  panCurrent: { x: 0, y: 0 },
  panFrom: { x: 0, y: 0 },
  panTarget: { x: 0, y: 0 },
  panStartedAt: 0,
  panFrame: 0,
};

const shell = document.querySelector('[data-bubble-shell]');
const panLayer = document.querySelector('[data-bubble-pan-layer]');
const orb = document.querySelector('[data-bubble-orb]');
const orbVisual = document.querySelector('.bubble-orb-visual');
const bubbleRefs = new Map();

buildBubbles();
render();
bindEvents();
if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    BUBBLES_CONFIG = buildBubbleConfig();
    buildBubbles();
    render();
  });
}

function buildBubbleConfig() {
  return RAW_BUBBLES_CONFIG
    .map(normalizeBubbleSize)
    .map(enrichBubbleMetrics);
}

function normalizeBubbleSize(bubble) {
  const largestSide = Math.max(bubble.width, bubble.height);
  const smallestSide = Math.min(bubble.width, bubble.height);
  let scale = 1;

  if (largestSide > MAX_BUBBLE_SIZE) {
    scale = Math.min(scale, MAX_BUBBLE_SIZE / largestSide);
  }
  if ((smallestSide * scale) < MIN_BUBBLE_SIZE) {
    scale = MIN_BUBBLE_SIZE / smallestSide;
  }

  if (scale === 1) return bubble;

  return {
    ...bubble,
    width: bubble.width * scale,
    height: bubble.height * scale,
    subIconSize: bubble.subIconSize ? bubble.subIconSize * scale : bubble.subIconSize,
    subIconOffsetX: bubble.subIconOffsetX ? bubble.subIconOffsetX * scale : bubble.subIconOffsetX,
    subIconOffsetY: bubble.subIconOffsetY ? bubble.subIconOffsetY * scale : bubble.subIconOffsetY,
  };
}

function enrichBubbleMetrics(bubble) {
  return {
    ...bubble,
    expandedExtraWidth: bubble.isPill ? measurePillExtraWidth(bubble) : 0,
  };
}

function measurePillExtraWidth(bubble) {
  const titleWidth = measureTextWidth(bubble.pillTitle || '', '600 24px "DM Sans"');
  const subtitleWidth = measureTextWidth(bubble.pillSubtitle || '', '500 24px "DM Sans"');
  return Math.ceil(Math.max(titleWidth, subtitleWidth) + PILL_TEXT_LEFT_PADDING + PILL_TEXT_RIGHT_PADDING + 6);
}

function measureTextWidth(text, font) {
  if (!textMeasureContext) return text.length * 14;
  textMeasureContext.font = font;
  return textMeasureContext.measureText(text).width;
}

function buildBubbles() {
  panLayer.innerHTML = '';
  bubbleRefs.clear();
  for (const bubble of BUBBLES_CONFIG) {
    const item = document.createElement('div');
    item.className = 'bubble-item';
    item.dataset.bubbleId = String(bubble.id);

    const inner = document.createElement('div');
    inner.className = 'bubble-item-inner';

    const surface = document.createElement('div');
    surface.className = 'bubble-surface';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'bubble-icon-wrap';
    iconWrap.append(createBubbleGraphic(bubble));
    surface.append(iconWrap);

    let copy = null;
    if (bubble.isPill) {
      copy = document.createElement('div');
      copy.className = 'bubble-pill-copy';
      copy.innerHTML = `
        <div class="bubble-pill-copy-inner">
          <p class="bubble-pill-title">${bubble.pillTitle || ''}</p>
          <p class="bubble-pill-subtitle">${bubble.pillSubtitle || ''}</p>
        </div>
      `;
      surface.append(copy);
    }

    inner.append(surface);

    let subIcon = null;
    if (bubble.subIconKind) {
      subIcon = document.createElement('div');
      subIcon.className = 'bubble-subicon';
      subIcon.append(createSubIconGraphic(bubble.subIconKind));
      inner.append(subIcon);
    }

    item.append(inner);
    panLayer.append(item);

    bubbleRefs.set(bubble.id, {
      item,
      surface,
      iconWrap,
      copy,
      subIcon,
    });
  }
}

function createBubbleGraphic(bubble) {
  if (bubble.img) {
    const image = document.createElement('img');
    image.className = bubble.fill ? 'bubble-icon is-fill' : 'bubble-icon is-contain';
    image.src = bubble.img;
    image.alt = '';
    image.draggable = false;
    image.style.setProperty('--bubble-image-scale', String(bubble.imageScale ?? (bubble.fill ? 1 : 0.72)));
    image.addEventListener('error', () => {
      if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
    });
    return image;
  }

  if (bubble.kind === 'calendar') {
    return createHtmlNode(`
      <div class="calendar-icon">
        <div class="calendar-icon__top"></div>
        <div class="calendar-icon__rings"><span></span><span></span></div>
        <div class="calendar-icon__date">31</div>
      </div>
    `);
  }

  if (bubble.kind === 'note') {
    return createHtmlNode(`
      <div class="note-icon">
        <div class="note-icon__page"></div>
        <div class="note-icon__fold"></div>
        <div class="note-icon__spiral"><span></span><span></span><span></span><span></span></div>
      </div>
    `);
  }

  if (bubble.kind === 'weather') {
    return createHtmlNode(`
      <div class="weather-icon">
        <div class="weather-icon__sun"></div>
        <div class="weather-icon__cloud weather-icon__cloud--back"></div>
        <div class="weather-icon__cloud weather-icon__cloud--front"></div>
      </div>
    `);
  }

  if (bubble.kind === 'health') {
    return createHtmlNode(`
      <div class="health-icon">
        <svg class="health-icon__runner" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="61" cy="23" r="11" fill="#ffffff"></circle>
          <path d="M57 37L44 51L56 62L71 48" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M44 51L26 74" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"></path>
          <path d="M56 62L69 81" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"></path>
          <path d="M37 46L21 44" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"></path>
        </svg>
      </div>
    `);
  }

  if (bubble.kind === 'spotify') {
    return createHtmlNode(`
      <div class="spotify-icon">
        <div class="spotify-icon__arc spotify-icon__arc--one"></div>
        <div class="spotify-icon__arc spotify-icon__arc--two"></div>
        <div class="spotify-icon__arc spotify-icon__arc--three"></div>
      </div>
    `);
  }

  if (bubble.kind === 'gemini') {
    return createHtmlNode(`
      <div class="gemini-icon">
        <div class="gemini-icon__star"></div>
      </div>
    `);
  }

  const fallback = document.createElement('img');
  fallback.className = 'bubble-icon is-contain';
  fallback.src = FALLBACK_ICON;
  fallback.alt = '';
  fallback.draggable = false;
  fallback.style.setProperty('--bubble-image-scale', '0.72');
  return fallback;
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
  return document.createElement('div');
}

function createHtmlNode(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function bindEvents() {
  orb.addEventListener('pointerdown', handlePointerDown);
  shell.addEventListener('pointermove', handlePointerMove);
  shell.addEventListener('touchmove', handlePointerMove, { passive: false });
  window.addEventListener('pointerup', handleRelease);
  window.addEventListener('pointercancel', handleRelease);
  window.addEventListener('touchend', handleRelease);
}

function handlePointerDown(event) {
  event.preventDefault();
  clearPressTimer();
  state.pressArmed = true;
  state.pressTimer = window.setTimeout(() => {
    state.isPressed = true;
    render();
  }, LONG_PRESS_MS);
}

function handlePointerMove(event) {
  if (!state.pressArmed && !state.isPressed) return;
  if (event.cancelable) event.preventDefault();

  if (!state.isPressed) return;

  const stablePoint = getStablePointerPoint(event);
  if (!stablePoint || !runtime.layout) return;
  const nextHovered = getHoveredBubbleId(stablePoint, runtime.layout, state.hoveredBubble);

  if (nextHovered !== state.hoveredBubble) {
    state.hoveredBubble = nextHovered;
    render();
  }
}

function handleRelease() {
  clearPressTimer();
  if (!state.pressArmed && !state.isPressed && state.hoveredBubble == null) return;
  state.pressArmed = false;
  state.isPressed = false;
  state.hoveredBubble = null;
  render();
}

function clearPressTimer() {
  if (state.pressTimer != null) {
    window.clearTimeout(state.pressTimer);
    state.pressTimer = null;
  }
}

function render() {
  const layout = computeLayout(state.isPressed, state.hoveredBubble);
  runtime.layout = layout;
  updatePanTarget(layout.panOffset);

  for (const [id, refs] of bubbleRefs.entries()) {
    const bubble = layout.bubbles.find((entry) => entry.id === id);
    if (!bubble) continue;

    const isHovered = state.hoveredBubble === bubble.id;
    const transformDuration = state.isPressed && state.hoveredBubble != null
      ? PUSH_DURATION_MS
      : APPEAR_MOVE_DURATION_MS;
    const bubbleIndex = BUBBLES_CONFIG.findIndex((entry) => entry.id === bubble.id);
    const staggerDelay = bubbleIndex * 0.02;
    const shadow = isHovered
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      : '0 15px 35px -5px rgba(0, 0, 0, 0.3)';
    const transform = `translate3d(${bubble.targetX - bubble.width / 2}px, ${bubble.targetY - bubble.height / 2}px, 0) rotate(${bubble.rotate || 0}deg) scale(${bubble.targetScale})`;

    refs.item.classList.toggle('is-pressed', state.isPressed);
    refs.item.style.zIndex = String(isHovered ? 50 : bubble.zIndex);
    refs.item.style.width = `${bubble.targetWidth}px`;
    refs.item.style.height = `${bubble.height}px`;
    refs.item.style.opacity = state.isPressed ? '1' : '0';
    refs.item.style.boxShadow = shadow;
    refs.item.style.transform = transform;
    refs.item.style.transitionDelay = `${staggerDelay}s, ${staggerDelay}s, ${staggerDelay}s, ${staggerDelay}s`;
    refs.item.style.transitionDuration = `${transformDuration}ms, ${FADE_DURATION_MS}ms, ${FADE_DURATION_MS}ms, ${FADE_DURATION_MS}ms`;

    refs.surface.style.backgroundColor = bubble.isPill ? '#2D2D2E' : 'transparent';
    refs.iconWrap.style.width = `${bubble.width}px`;
    refs.iconWrap.style.height = `${bubble.height}px`;

    if (refs.copy) {
      refs.copy.classList.toggle('is-expanded', bubble.isExpanded);
      refs.copy.style.left = `${bubble.width}px`;
      refs.copy.style.width = `${bubble.expandedExtraWidth}px`;
    }

    if (refs.subIcon) {
      refs.subIcon.style.width = `${bubble.subIconSize}px`;
      refs.subIcon.style.height = `${bubble.subIconSize}px`;
      refs.subIcon.style.left = `${bubble.subIconOffsetX}px`;
      refs.subIcon.style.top = `${bubble.subIconOffsetY}px`;
    }
  }
}

function computeLayout(isPressed, hoveredBubble) {
  const positions = BUBBLES_CONFIG.map((bubble) => ({
    ...bubble,
    radius: Math.max(bubble.width, bubble.height) / 2,
    targetX: isPressed ? bubble.x : 0,
    targetY: isPressed ? bubble.y : 0,
    targetWidth: isPressed && hoveredBubble === bubble.id && bubble.isPill
      ? bubble.width + bubble.expandedExtraWidth
      : bubble.width,
    targetScale: !isPressed ? 0.18 : (hoveredBubble === bubble.id ? 1.04 : 1),
    isExpanded: isPressed && hoveredBubble === bubble.id && bubble.isPill,
  }));

  const orbNode = {
    id: 'orb',
    width: 80.122,
    height: 79.587,
    radius: 40.061,
    targetX: 0,
    targetY: 0,
    targetScale: isPressed ? 0.92 : 1,
  };
  positions.push(orbNode);

  const activeBubble = isPressed && hoveredBubble
    ? positions.find((bubble) => bubble.id === hoveredBubble)
    : null;

  if (activeBubble?.isPill) {
    for (const position of positions) {
      if (position.id === activeBubble.id) continue;

      const initialPush = getPillRepulsion(activeBubble, position, PILL_INITIAL_INFLUENCE_PADDING);
      if (initialPush) {
        position.targetX += initialPush.x;
        position.targetY += initialPush.y;
      }
    }

    for (let iter = 0; iter < 12; iter += 1) {
      for (const position of positions) {
        if (position.id === activeBubble.id) continue;
        const repel = getPillRepulsion(activeBubble, position, 0);
        if (repel) {
          position.targetX += repel.x;
          position.targetY += repel.y;
        }
      }

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const p1 = positions[i];
          const p2 = positions[j];
          if (p1.id === activeBubble.id || p2.id === activeBubble.id) continue;

          const dx = p2.targetX - p1.targetX;
          const dy = p2.targetY - p1.targetY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = p1.radius + p2.radius + 8;

          if (dist < minDist) {
            const diff = (minDist - dist) / 2;
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * diff;
            const moveY = Math.sin(angle) * diff;
            p1.targetX -= moveX;
            p1.targetY -= moveY;
            p2.targetX += moveX;
            p2.targetY += moveY;
          }
        }
      }
    }
  }

  let panX = 0;
  let panY = 0;
  const activeItem = positions.find((bubble) => bubble.id === hoveredBubble);
  if (activeItem) {
    const halfWidth = activeItem.width / 2;
    const halfHeight = activeItem.height / 2;
    const left = activeItem.targetX - halfWidth;
    const right = activeItem.targetX + (activeItem.isExpanded ? halfWidth + activeItem.expandedExtraWidth : halfWidth);
    const top = activeItem.targetY - halfHeight;
    const bottom = activeItem.targetY + halfHeight;
    const canvasHalf = 210;
    const topLimit = -323;
    const bottomLimit = 40;

    if (right + PAN_MARGIN_PX > canvasHalf) panX = canvasHalf - right - PAN_MARGIN_PX;
    else if (left - PAN_MARGIN_PX < -canvasHalf) panX = -canvasHalf - left + PAN_MARGIN_PX;

    if (bottom + PAN_MARGIN_PX > bottomLimit) panY = bottomLimit - bottom - PAN_MARGIN_PX;
    else if (top - PAN_MARGIN_PX < topLimit) panY = topLimit - top + PAN_MARGIN_PX;
  }

  return {
    bubbles: positions.filter((bubble) => bubble.id !== 'orb'),
    orb: orbNode,
    panOffset: { x: panX, y: panY },
  };
}

function getStablePointerPoint(event) {
  const touch = event.touches && event.touches[0];
  const clientX = event.clientX ?? touch?.clientX;
  const clientY = event.clientY ?? touch?.clientY;
  if (clientX == null || clientY == null) return null;

  const rect = shell.getBoundingClientRect();
  const centerX = rect.left + ORB_CENTER.x;
  const centerY = rect.top + ORB_CENTER.y;

  return {
    x: clientX - centerX - runtime.panCurrent.x,
    y: clientY - centerY - runtime.panCurrent.y,
  };
}

function getHoveredBubbleId(point, layout, previousHoveredId) {
  const bubbles = [...layout.bubbles].sort((a, b) => {
    if (a.id === previousHoveredId) return -1;
    if (b.id === previousHoveredId) return 1;
    return (b.zIndex || 0) - (a.zIndex || 0);
  });

  for (const bubble of bubbles) {
    if (isPointerInsideBubble(point, bubble, previousHoveredId)) {
      return bubble.id;
    }
  }

  return null;
}

function isPointerInsideBubble(point, bubble, previousHoveredId) {
  const stickyPadding = previousHoveredId === bubble.id ? HOVER_LEASH_PX : 0;
  const halfWidth = bubble.width / 2;
  const halfHeight = bubble.height / 2;

  if (bubble.isExpanded) {
    const left = bubble.targetX - halfWidth - stickyPadding;
    const right = bubble.targetX + halfWidth + bubble.expandedExtraWidth + PILL_HIT_RIGHT_PADDING + stickyPadding;
    const top = bubble.targetY - halfHeight - stickyPadding;
    const bottom = bubble.targetY + halfHeight + stickyPadding;
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }

  const radius = bubble.radius + stickyPadding;
  const dx = point.x - bubble.targetX;
  const dy = point.y - bubble.targetY;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}

function updatePanTarget(nextTarget) {
  if (runtime.panTarget.x === nextTarget.x && runtime.panTarget.y === nextTarget.y) {
    if (!runtime.panFrame) applyPanVisuals();
    return;
  }

  runtime.panFrom = { ...runtime.panCurrent };
  runtime.panTarget = { ...nextTarget };
  runtime.panStartedAt = performance.now();

  if (runtime.panFrame) {
    cancelAnimationFrame(runtime.panFrame);
  }

  const tick = (now) => {
    const elapsed = now - runtime.panStartedAt;
    const progress = Math.min(1, elapsed / PUSH_DURATION_MS);
    const eased = easeInOutCubic(progress);
    runtime.panCurrent.x = lerp(runtime.panFrom.x, runtime.panTarget.x, eased);
    runtime.panCurrent.y = lerp(runtime.panFrom.y, runtime.panTarget.y, eased);
    applyPanVisuals();

    if (progress < 1) {
      runtime.panFrame = requestAnimationFrame(tick);
    } else {
      runtime.panFrame = 0;
      runtime.panCurrent = { ...runtime.panTarget };
      applyPanVisuals();
    }
  };

  runtime.panFrame = requestAnimationFrame(tick);
}

function applyPanVisuals() {
  panLayer.style.transform = `translate3d(${runtime.panCurrent.x}px, ${runtime.panCurrent.y}px, 0) translate(-50%, -50%)`;
  const orbOffsetX = runtime.layout?.orb?.targetX ?? 0;
  const orbOffsetY = runtime.layout?.orb?.targetY ?? 0;
  const orbScale = runtime.layout?.orb?.targetScale ?? 1;
  orb.style.transform = `translate3d(${runtime.panCurrent.x}px, ${runtime.panCurrent.y}px, 0)`;
  orbVisual.style.transform = `translate3d(${orbOffsetX}px, ${orbOffsetY}px, 0) scale(${orbScale})`;
}

function lerp(from, to, progress) {
  return from + ((to - from) * progress);
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function getPillRepulsion(pill, node, influencePadding) {
  const rectLeft = pill.targetX - (pill.width / 2);
  const rectRight = pill.targetX + (pill.width / 2) + pill.expandedExtraWidth;
  const rectTop = pill.targetY - (pill.height / 2);
  const rectBottom = pill.targetY + (pill.height / 2);

  const closestX = clamp(node.targetX, rectLeft, rectRight);
  const closestY = clamp(node.targetY, rectTop, rectBottom);
  let dx = node.targetX - closestX;
  let dy = node.targetY - closestY;

  if (dx === 0 && dy === 0) {
    dx = node.targetX >= pill.targetX ? 1 : -1;
    dy = 0;
  }

  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const safeDist = node.radius + PILL_COLLISION_PADDING + PILL_LAYOUT_GAP;
  const influenceZone = safeDist + influencePadding;
  if (dist >= influenceZone) return null;

  const pushFactor = influencePadding > 0
    ? Math.pow((influenceZone - dist) / influenceZone, 1.15)
    : 0;
  const required = Math.max(0, safeDist - dist);
  const angle = Math.atan2(dy, dx);
  const distance = required + (pushFactor * 22);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
