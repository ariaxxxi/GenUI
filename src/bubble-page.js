const LONG_PRESS_MS = 140;
const APPEAR_MOVE_DURATION_MS = 500;
const DISAPPEAR_MOVE_DURATION_MS = 400;
const FADE_IN_DURATION_MS = 400;
const FADE_OUT_DURATION_MS = 300;
const PUSH_DURATION_MS = 400;
const PAN_DURATION_MS = 1500;
const BUBBLE_STAGGER_STEP_S = 0.035;
const CHILD_STAGGER_STEP_S = 0.06;
const BUBBLE_ENTER_EASE = 'cubic-bezier(0.22, 1.16, 0.3, 1.02)';
const BUBBLE_EXIT_EASE = 'cubic-bezier(0.42, -0.14, 0.7, 0.68)';
const CHILD_MENU_HOLD_MS = 3000;
const CHILD_BUBBLE_SCALE = 0.7;
const CHILD_BUBBLE_MIN_SIZE = 50;
const CHILD_BUBBLE_SIZE = 56;
const CHILD_CHIP_FONT_SIZE = 20;
const CHILD_CHIP_HEIGHT = 48;
const CHILD_CHIP_PADDING_X = 16;
const CHILD_CHIP_BORDER_RADIUS = 30;
const CHILD_CHIP_PARENT_GAP = 10;
const CHILD_CHIP_VERTICAL_GAP = 10;
const CHILD_FAN_DISTANCE = 20;
const CHILD_FAN_BOUNDS_PADDING = 14;
const CHILD_DIMMED_OPACITY = 0.22;
const CHILD_LAYOUT_GAP = 10;
const CHILD_SIBLING_GAP = 14;
const HOVERED_SIBLING_OPACITY = 0.9;
const HOVER_LEASH_PX = 15;
const PAN_MARGIN_PX = 70;
const DEFAULT_BUBBLE_GAP = 8;
const PILL_INSET_ICON_SCALE = 0.8;
const PILL_TEXT_LEFT_PADDING = 6;
const PILL_TEXT_RIGHT_PADDING = 40;
const PILL_HIT_RIGHT_PADDING = 10;
const PILL_COLLISION_PADDING = 0;
const PILL_INITIAL_INFLUENCE_PADDING = 44;
const PILL_LAYOUT_GAP = 10;
const FALLBACK_ICON = 'https://img.icons8.com/color/512/application-window.png';
const ORB_BASE_SIZE = 80;
const ORB_PRESSED_SIZE = 110;
const textMeasureContext = document.createElement('canvas').getContext('2d');
const FIGMA_ASSETS = {
  orb: 'https://www.figma.com/api/mcp/asset/f8fc665b-181b-4c9e-a75d-2edec5b03b3d',
  spotify: 'https://www.figma.com/api/mcp/asset/2665f4e0-86fa-43f9-8899-9a4cd1a9500b',
  chatgpt: 'https://www.figma.com/api/mcp/asset/6226094c-fe66-40cc-bfeb-a23992ea5c25',
  gemini: 'https://www.figma.com/api/mcp/asset/9d1608d4-5006-4ce7-9784-7dc5b7eb62c5',
  health: 'https://www.figma.com/api/mcp/asset/87b4cdef-3bb5-416a-bb0f-211d77a0d40b',
  map: 'https://www.figma.com/api/mcp/asset/f40a0071-c992-4dbf-9256-c3736addfb85',
  weather: 'https://www.figma.com/api/mcp/asset/896a1ccd-1004-44f8-8049-ca37fea131a9',
  note: 'https://www.figma.com/api/mcp/asset/cdea9f5f-3322-4b7d-a23d-bde7e27887c7',
};
const PROFILE_CALL_BADGE_ASSET = 'https://store-images.s-microsoft.com/image/apps.36692.13838317266281778.c2d285ff-9d71-4e2b-9a04-aa9832c1b3c2.506b3747-5c34-4ea3-a97c-53b41cdf491e';
const ORB_CENTER = {
  x: 210.5,
  y: 374.5,
};

const RAW_BUBBLES_CONFIG = [
  {
    id: 1,
    width: 73,
    height: 72,
    x: -60.97,
    y: -278.72,
    zIndex: 10,
    hidden: true,
    kind: 'calendar',
    childActions: [
      { id: 'event', kind: 'plus', bg: '#ffffff', fg: '#121212' },
      { id: 'reminder', kind: 'bell', bg: '#ffffff', fg: '#1cc2c0' },
      { id: 'focus', kind: 'spark', bg: '#ffffff', fg: '#6d61ff' },
    ],
  },
  {
    id: 2,
    width: 80,
    height: 80,
    x: 74.5,
    y: -184.5,
    zIndex: 10,
    kind: 'note',
    img: FIGMA_ASSETS.note,
    fill: true,
    childActions: [
      { id: 'checklist', kind: 'check', bg: '#ffffff', fg: '#111827' },
      { id: 'voice', kind: 'mic', bg: '#fff5f5', fg: '#ff5252' },
      { id: 'scan', kind: 'scan', bg: '#ffffff', fg: '#ffffff' },
    ],
  },
  {
    id: 3,
    width: 90,
    height: 90,
    x: -17.08,
    y: -217.69,
    zIndex: 9,
    img: FIGMA_ASSETS.map,
    fill: true,
    childActions: [
      { id: 'home', kind: 'home', bg: '#ffffff', fg: '#ffffff' },
      { id: 'work', kind: 'briefcase', bg: '#ffffff', fg: '#ffffff' },
    ],
  },
  {
    id: 4,
    width: 61,
    height: 61,
    x: -79,
    y: -280,
    zIndex: 8,
    kind: 'weather',
    img: FIGMA_ASSETS.weather,
    fill: true,
    childActions: [
      { id: 'forecast', kind: 'sun', bg: '#ffffff', fg: '#f5b400' },
      { id: 'rain', kind: 'umbrella', bg: '#ffffff', fg: '#149cf1' },
      { id: 'radar', kind: 'radar', bg: '#ffffff', fg: '#149cf1' },
    ],
  },
  {
    id: 5,
    width: 110,
    height: 110,
    x: -116.02,
    y: -152.96,
    zIndex: 5,
    img: 'assets/profile1.png',
    fill: true,
    isPill: true,
    pillTitle: 'Tony',
    pillSubtitle: 'I love it!',
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
    id: 6,
    width: 60,
    height: 60,
    x: 55.5,
    y: -260.5,
    zIndex: 4,
    kind: 'health',
    img: FIGMA_ASSETS.health,
    fill: true,
    isPill: true,
    pillTitle: '10,243 steps',
    pillSubtitle: '',
    childActions: [
      { id: 'run', img: 'assets/run.svg', imageScale: 0.92 },
      { id: 'heart', kind: 'heart', bg: '#ffffff', fg: '#ff4d6d' },
      { id: 'water', kind: 'drop', bg: '#ffffff', fg: '#2aa8ff' },
    ],
  },
  {
    id: 7,
    width: 110,
    height: 110,
    x: 4.23,
    y: -108.02,
    zIndex: 7,
    kind: 'spotify',
    img: 'https://i.scdn.co/image/ab67616d00001e0200702474f8e0e2b6155d48e3',
    fill: true,
    imageOutlineColor: '#1ED760',
    imageOutlineWidth: 3,
    isPill: true,
    pillTitle: 'Happiness',
    pillSubtitle: '1975',
    pillTrailingIcon: 'pause',
    pillTrailingIconSize: 40,
    pillTrailingIconColor: '#1ED760',
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
    id: 8,
    width: 80,
    height: 80,
    x: -87.31,
    y: -51.24,
    zIndex: 4,
    img: FIGMA_ASSETS.chatgpt,
    fill: true,
    pillTitle: 'Continue',
    pillSubtitle: 'Book flight to Coachella',
    rotate: -4,
    childLayout: 'chatgpt-chips',
    childActions: [
      { id: 'ideas', kind: 'chip', label: '💡 Give me ideas', fontWeight: 400, layoutLeft: -136, layoutTop: -85, accent: '#f5d76e' },
      { id: 'explain', kind: 'chip', label: '🔍 Explain this', fontWeight: 400, layoutLeft: -209, layoutTop: -36, accent: '#f4f4f4' },
      { id: 'surprise', kind: 'chip', label: '🎲 Surprise me', fontWeight: 400, layoutLeft: -172, layoutTop: 13, accent: '#d7d7ff' },
    ],
  },
  {
    id: 9,
    width: 95.28,
    height: 95.28,
    x: 124.84,
    y: -97.73,
    zIndex: 4,
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
    childActions: [
      { id: 'call', kind: 'phone', bg: '#18c964', fg: '#ffffff' },
      { id: 'message', kind: 'message', bg: '#2b6ff2', fg: '#ffffff' },
      { id: 'video', kind: 'video', bg: '#111827', fg: '#ffffff' },
    ],
  },
  {
    id: 10,
    width: 80,
    height: 80,
    x: 74.31,
    y: -18.77,
    zIndex: 3,
    kind: 'gemini',
    img: FIGMA_ASSETS.gemini,
    fill: true,
    pillTitle: 'Ready',
    pillSubtitle: 'Where should we start?',
    childLayout: 'gemini-chips',
    childActions: [
      { id: 'plan', kind: 'chip', label: '🧩 Plan my day', fontWeight: 500, layoutLeft: -3, layoutTop: -81, accent: '#8ce56f' },
      { id: 'summarize', kind: 'chip', label: '📄 Summarize this', fontWeight: 500, layoutLeft: 40, layoutTop: -32, accent: '#f4f4f4' },
      { id: 'rewrite', kind: 'chip', label: '🔁 Rewrite this', fontWeight: 500, layoutLeft: 30, layoutTop: 17, accent: '#9dc5ff' },
    ],
  },
];

let BUBBLES_CONFIG = buildBubbleConfig();

const state = {
  isPressed: false,
  hoveredBubble: null,
  hoveredChildBubble: null,
  pressTimer: null,
  pressArmed: false,
  childHoverTimer: null,
  childHoverCandidateId: null,
  childMenuParentId: null,
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
const childBubbleRefs = new Map();

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
    .filter((bubble) => !bubble.hidden)
    .map(enrichBubbleMetrics);
}

function normalizeBubbleSize(bubble) {
  return bubble;
}

function enrichBubbleMetrics(bubble) {
  return {
    ...bubble,
    expandedExtraWidth: bubble.isPill ? measurePillExtraWidth(bubble) : 0,
  };
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

function isChipAction(action) {
  return action?.kind === 'chip';
}

function measureChildChipWidth(action) {
  const fontWeight = action.fontWeight || 400;
  const labelWidth = measureTextWidth(action.label || '', `${fontWeight} ${CHILD_CHIP_FONT_SIZE}px "DM Sans"`);
  return Math.ceil(labelWidth + (CHILD_CHIP_PADDING_X * 2));
}

function buildBubbles() {
  panLayer.innerHTML = '';
  bubbleRefs.clear();
  childBubbleRefs.clear();
  const childItems = [];
  for (const bubble of BUBBLES_CONFIG) {
    const item = document.createElement('div');
    item.className = 'bubble-item';
    item.dataset.bubbleId = String(bubble.id);

    const inner = document.createElement('div');
    inner.className = 'bubble-item-inner';

    const surface = document.createElement('div');
    surface.className = 'bubble-surface';
    if (bubble.isPill) surface.classList.add('is-pill');

    const iconWrap = document.createElement('div');
    iconWrap.className = 'bubble-icon-wrap';
    if (bubble.imageOutlineColor) {
      iconWrap.classList.add('has-inner-outline');
      iconWrap.style.setProperty('--bubble-image-outline-color', bubble.imageOutlineColor);
      iconWrap.style.setProperty('--bubble-image-outline-width', `${bubble.imageOutlineWidth ?? 2}px`);
    }
    iconWrap.append(createBubbleGraphic(bubble));
    surface.append(iconWrap);

    let copy = null;
    if (bubble.isPill) {
      const titleMarkup = bubble.pillTitle ? `<p class="bubble-pill-title">${bubble.pillTitle}</p>` : '';
      const subtitleMarkup = bubble.pillSubtitle ? `<p class="bubble-pill-subtitle">${bubble.pillSubtitle}</p>` : '';
      const actionMarkup = bubble.pillTrailingIcon
        ? `<div class="bubble-pill-action" style="--pill-action-size: ${bubble.pillTrailingIconSize || 40}px; --pill-action-right: ${bubble.pillTrailingIconRight ?? 18}px; --pill-action-color: ${bubble.pillTrailingIconColor || '#ffffff'};">${getPillTrailingIconMarkup(bubble.pillTrailingIcon)}</div>`
        : '';
      copy = document.createElement('div');
      copy.className = 'bubble-pill-copy';
      if (bubble.pillTrailingIcon) copy.classList.add('has-action');
      copy.style.setProperty('--pill-text-left-padding', `${bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING}px`);
      copy.style.setProperty('--pill-text-right-padding', `${getPillTextRightPadding(bubble)}px`);
      copy.innerHTML = `
        <div class="bubble-pill-copy-inner">
          ${titleMarkup}
          ${subtitleMarkup}
        </div>
        ${actionMarkup}
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

    for (const action of bubble.childActions || []) {
      const childKey = getChildBubbleKey(bubble.id, action.id);
      const childItem = document.createElement('div');
      childItem.className = 'bubble-item bubble-child-item';
      childItem.dataset.childBubbleId = childKey;
      childItem.dataset.parentBubbleId = String(bubble.id);

      const childSurface = document.createElement('div');
      childSurface.className = 'bubble-surface bubble-child-surface';
      if (action.img) childSurface.classList.add('is-image-only');
      if (isChipAction(action)) childSurface.classList.add('is-chip');
      childSurface.innerHTML = `
        <div class="bubble-child-selection" aria-hidden="true">
          <div class="bubble-child-selection-accent bubble-child-selection-accent-left">
            <div class="bubble-child-selection-accent-left-base"></div>
            <div class="bubble-child-selection-accent-left-white-2"></div>
            <div class="bubble-child-selection-accent-left-white-1"></div>
          </div>
          <div class="bubble-child-selection-accent bubble-child-selection-accent-right">
            <div class="bubble-child-selection-accent-right-base"></div>
            <div class="bubble-child-selection-accent-right-white-2"></div>
            <div class="bubble-child-selection-accent-right-white-1"></div>
          </div>
          <div class="bubble-child-selection-inner-glow"></div>
          <div class="bubble-child-selection-ring"></div>
        </div>
      `;

      let childContent;
      if (isChipAction(action)) {
        childContent = document.createElement('div');
        childContent.className = 'bubble-child-chip-content';
        childContent.style.setProperty('--child-chip-font-weight', String(action.fontWeight || 400));
        childContent.innerHTML = `<span class="bubble-child-chip-label">${action.label}</span>`;
      } else {
        childContent = document.createElement('div');
        childContent.className = 'bubble-icon-wrap bubble-child-icon-wrap';
        childContent.append(createChildActionGraphic(action));
      }
      childSurface.append(childContent);
      childItem.append(childSurface);
      childItems.push(childItem);

      childBubbleRefs.set(childKey, {
        item: childItem,
        surface: childSurface,
        action,
        content: childContent,
      });
    }
  }

  for (const childItem of childItems) {
    panLayer.append(childItem);
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
  if (kind === 'spotify-badge') {
    const image = document.createElement('img');
    image.className = 'bubble-icon is-fill';
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
    image.className = 'bubble-icon is-fill';
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
    image.className = action.fill ? 'bubble-icon is-fill' : 'bubble-icon is-contain';
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
  const iconMarkup = getChildActionIconMarkup(action.kind);
  return createHtmlNode(`
    <div class="child-action-icon" style="--child-action-fg: ${fg};">
      ${iconMarkup}
    </div>
  `);
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

function getPillTrailingIconMarkup(kind) {
  switch (kind) {
    case 'pause':
      return `<i class="bi bi-pause-fill" aria-hidden="true"></i>`;
    case 'incoming-call':
      return `<i class="bi bi-telephone-inbound-fill" aria-hidden="true"></i>`;
    default:
      return '';
  }
}

function getChildActionIconMarkup(kind) {
  switch (kind) {
    case 'home':
      return `<i class="bi bi-house-door-fill" aria-hidden="true"></i>`;
    case 'briefcase':
      return `<i class="bi bi-suitcase-lg-fill" aria-hidden="true"></i>`;
    case 'phone':
      return `<i class="bi bi-telephone-fill" aria-hidden="true"></i>`;
    case 'message':
      return `<i class="bi bi-chat-fill" aria-hidden="true"></i>`;
    case 'video':
      return `<i class="bi bi-camera-video-fill" aria-hidden="true"></i>`;
    case 'check':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.354-8.354a.5.5 0 0 0-.708-.708L7 9.586 5.854 8.44a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l4-4Z"/></svg>`;
    case 'mic':
      return `<i class="bi bi-mic-fill" aria-hidden="true"></i>`;
    case 'scan':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h3v1H3v2H2V2Zm11 0h1v3h-1V3h-2V2h2ZM2 11h1v2h2v1H2v-3Zm11 0h1v3h-3v-1h2v-2ZM5.5 5h5v6h-5V5Zm1 1v4h3V6h-3Z"/></svg>`;
    case 'bell':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 16a2 2 0 0 0 1.985-1.75H6.015A2 2 0 0 0 8 16Zm.104-14.804A1 1 0 0 0 7 2.18V2.5c-2.44.514-4 2.276-4 4.9 0 1.171-.166 2.65-.545 3.982-.19.667-.43 1.247-.706 1.73-.07.122-.146.242-.227.36h12.956a8.79 8.79 0 0 1-.227-.36c-.275-.483-.516-1.063-.706-1.73C13.166 10.05 13 8.57 13 7.4c0-2.624-1.56-4.386-4-4.9V2.18a1 1 0 0 0-.896-.984Z"/></svg>`;
    case 'spark':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M7.247.86c.317-.766 1.19-.766 1.506 0l1.08 2.612a1 1 0 0 0 .53.53l2.612 1.08c.766.317.766 1.19 0 1.506l-2.612 1.08a1 1 0 0 0-.53.53l-1.08 2.612c-.317.766-1.19.766-1.506 0l-1.08-2.612a1 1 0 0 0-.53-.53L3.025 6.368c-.766-.317-.766-1.19 0-1.506l2.612-1.08a1 1 0 0 0 .53-.53L7.247.86Zm6.286 9.346c.184-.447.75-.447.934 0l.363.878a.5.5 0 0 0 .265.265l.878.363c.447.185.447.75 0 .934l-.878.363a.5.5 0 0 0-.265.265l-.363.878c-.185.447-.75.447-.934 0l-.363-.878a.5.5 0 0 0-.265-.265l-.878-.363c-.447-.185-.447-.75 0-.934l.878-.363a.5.5 0 0 0 .265-.265l.363-.878Z"/></svg>`;
    case 'sun':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 4a.5.5 0 0 1-.5-.5V14a.5.5 0 0 1 1 0v1.5a.5.5 0 0 1-.5.5Zm0-13a.5.5 0 0 1-.5-.5V1a.5.5 0 0 1 1 0v1.5A.5.5 0 0 1 8 3Zm8 5a.5.5 0 0 1-.5.5H14a.5.5 0 0 1 0-1h1.5A.5.5 0 0 1 16 8ZM2 8a.5.5 0 0 1-.5.5H0a.5.5 0 0 1 0-1h1.5A.5.5 0 0 1 2 8Zm11.657 5.657a.5.5 0 0 1-.707 0l-1.06-1.06a.5.5 0 1 1 .707-.708l1.06 1.061a.5.5 0 0 1 0 .707Zm-9.9-9.9a.5.5 0 0 1-.707 0L1.99 2.697a.5.5 0 1 1 .707-.707l1.06 1.06a.5.5 0 0 1 0 .708Zm9.9-1.06a.5.5 0 0 1 0 .707l-1.06 1.061a.5.5 0 0 1-.707-.708l1.06-1.06a.5.5 0 0 1 .707 0Zm-9.9 9.9a.5.5 0 0 1 0 .707l-1.06 1.06a.5.5 0 0 1-.707-.707l1.06-1.06a.5.5 0 0 1 .707 0Z"/></svg>`;
    case 'umbrella':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0a5.5 5.5 0 0 0-5.456 4.803A1.5 1.5 0 0 0 2.5 8H7v5.5a1.5 1.5 0 0 0 3 0V13a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-1 0V8h5.5a1.5 1.5 0 0 0-.044-3.197A5.5 5.5 0 0 0 8 0Z"/></svg>`;
    case 'radar':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1A6 6 0 1 1 8 2a6 6 0 0 1 0 12Zm0-2.5A3.5 3.5 0 1 0 8 4.5a3.5 3.5 0 0 0 0 7Zm0-1A2.5 2.5 0 1 1 8 5.5a2.5 2.5 0 0 1 0 5Zm0-2A.5.5 0 1 0 8 7a.5.5 0 0 0 0 1Z"/></svg>`;
    case 'shoe':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8.5 1.5a.5.5 0 0 1 .5.5v2.086a1 1 0 0 0 .293.707l1.414 1.414a1 1 0 0 0 .707.293H14a1 1 0 0 1 1 1v1H1v-.5a2 2 0 0 1 2-2h2.086a1 1 0 0 0 .707-.293L7.5 4.5V2a.5.5 0 0 1 .5-.5Z"/></svg>`;
    case 'heart':
      return `<i class="bi bi-heart-fill" aria-hidden="true"></i>`;
    case 'drop':
      return `<i class="bi bi-droplet-fill" aria-hidden="true"></i>`;
    case 'pen':
      return `<i class="bi bi-pencil-square" aria-hidden="true"></i>`;
    case 'plus':
      return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0ZM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3Z"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>`;
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

function getBubbleConfigById(id) {
  return BUBBLES_CONFIG.find((bubble) => bubble.id === id) || null;
}

function hasChildActions(id) {
  return Boolean(getBubbleConfigById(id)?.childActions?.length);
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
  const nextHoverState = getHoverState(
    stablePoint,
    runtime.layout,
    state.hoveredBubble,
    state.hoveredChildBubble,
  );
  let shouldRender = false;

  if (nextHoverState.bubbleId !== state.hoveredBubble) {
    state.hoveredBubble = nextHoverState.bubbleId;
    shouldRender = true;
  }

  if (nextHoverState.childId !== state.hoveredChildBubble) {
    state.hoveredChildBubble = nextHoverState.childId;
    shouldRender = true;
  }

  if (syncChildMenuState(nextHoverState.bubbleId)) {
    shouldRender = true;
  }

  if (shouldRender) {
    render();
  }
}

function handleRelease() {
  clearPressTimer();
  clearChildHoverTimer();
  if (!state.pressArmed && !state.isPressed && state.hoveredBubble == null) return;
  state.pressArmed = false;
  state.isPressed = false;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.childMenuParentId = null;
  render();
}

function clearPressTimer() {
  if (state.pressTimer != null) {
    window.clearTimeout(state.pressTimer);
    state.pressTimer = null;
  }
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
      changed = true;
    }
    clearChildHoverTimer();
    return changed;
  }

  if (state.childMenuParentId != null && nextHoveredBubbleId !== state.childMenuParentId) {
    state.childMenuParentId = null;
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

  if (state.childHoverCandidateId === nextHoveredBubbleId) {
    return changed;
  }

  clearChildHoverTimer();
  state.childHoverCandidateId = nextHoveredBubbleId;
  state.childHoverTimer = window.setTimeout(() => {
    state.childHoverTimer = null;
    state.childHoverCandidateId = null;

    if (!state.isPressed || state.hoveredBubble !== nextHoveredBubbleId) return;
    if (!hasChildActions(nextHoveredBubbleId)) return;

    state.childMenuParentId = nextHoveredBubbleId;
    state.hoveredChildBubble = null;
    render();
  }, CHILD_MENU_HOLD_MS);

  return changed;
}

function render() {
  const layout = computeLayout(
    state.isPressed,
    state.hoveredBubble,
    state.childMenuParentId,
    state.hoveredChildBubble,
  );
  runtime.layout = layout;
  updatePanTarget(layout.panOffset);
  orb.classList.toggle('is-pressed', state.isPressed);

  for (const [id, refs] of bubbleRefs.entries()) {
    const bubble = layout.bubbles.find((entry) => entry.id === id);
    if (!bubble) continue;

    const isHovered = state.hoveredBubble === bubble.id;
    const isContextParent = state.childMenuParentId === bubble.id;
    const isDimmed = state.childMenuParentId != null && !isContextParent;
    const isSoftFaded = state.childMenuParentId == null && state.hoveredBubble != null && !isHovered;
    const transformDuration = state.isPressed
      ? (state.hoveredBubble != null ? PUSH_DURATION_MS : APPEAR_MOVE_DURATION_MS)
      : DISAPPEAR_MOVE_DURATION_MS;
    const fadeDuration = state.isPressed ? FADE_IN_DURATION_MS : FADE_OUT_DURATION_MS;
    const transformEase = !state.isPressed
      ? BUBBLE_EXIT_EASE
      : (state.hoveredBubble == null ? BUBBLE_ENTER_EASE : 'var(--bubble-ease)');
    const bubbleIndex = BUBBLES_CONFIG.findIndex((entry) => entry.id === bubble.id);
    const staggerDelay = bubbleIndex * BUBBLE_STAGGER_STEP_S;
    const shadow = isHovered
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      : '0 15px 35px -5px rgba(0, 0, 0, 0.3)';
    const transform = `translate3d(${bubble.targetX - bubble.width / 2}px, ${bubble.targetY - bubble.height / 2}px, 0) rotate(${bubble.rotate || 0}deg) scale(${bubble.targetScale})`;
    const opacity = state.isPressed
      ? (isDimmed ? CHILD_DIMMED_OPACITY : (isSoftFaded ? HOVERED_SIBLING_OPACITY : 1))
      : 0;
    const filter = isDimmed ? 'brightness(0.42) saturate(0.68)' : 'none';

    refs.item.classList.toggle('is-pressed', state.isPressed);
    refs.item.style.zIndex = String(isHovered ? 50 : bubble.zIndex);
    refs.item.style.width = `${bubble.targetWidth}px`;
    refs.item.style.height = `${bubble.height}px`;
    refs.item.style.opacity = String(opacity);
    refs.item.style.boxShadow = shadow;
    refs.item.style.filter = filter;
    refs.item.style.transform = transform;
    refs.item.style.transitionDelay = `${staggerDelay}s, ${staggerDelay}s, ${staggerDelay}s, ${staggerDelay}s, ${staggerDelay}s, 0s`;
    refs.item.style.transitionDuration = `${transformDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms`;
    refs.item.style.transitionTimingFunction = `${transformEase}, var(--bubble-ease), var(--bubble-ease), var(--bubble-ease), var(--bubble-ease), var(--bubble-ease)`;

    if (bubble.isPill) {
      refs.surface.style.backgroundColor = '';
      refs.surface.style.border = '';
      refs.surface.style.boxShadow = '';
    } else {
      refs.surface.style.backgroundColor = 'transparent';
      refs.surface.style.border = '0 solid transparent';
      refs.surface.style.boxShadow = isHovered
        ? 'inset 0 0 0 2px rgba(255, 255, 255, 0.96)'
        : 'none';
    }
    refs.iconWrap.style.width = `${bubble.width}px`;
    refs.iconWrap.style.height = `${bubble.height}px`;
    refs.iconWrap.style.left = '0px';
    refs.iconWrap.style.top = '0px';
    refs.iconWrap.style.transform = bubble.isExpanded ? `scale(${PILL_INSET_ICON_SCALE})` : 'scale(1)';

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
      refs.subIcon.style.transform = bubble.isExpanded ? 'scale(0.8)' : 'scale(1)';
    }
  }

  for (const [childKey, refs] of childBubbleRefs.entries()) {
    const child = layout.children.find((entry) => entry.id === childKey);
    const parentId = Number(refs.item.dataset.parentBubbleId);
    const parentBubble = layout.bubbles.find((entry) => entry.id === parentId);
    if (!parentBubble) continue;
    const isChip = isChipAction(refs.action);
    const fallbackChildWidth = isChip ? measureChildChipWidth(refs.action) : getChildBubbleSize(parentBubble);
    const childSize = child ? child.width : fallbackChildWidth;
    const childWidth = child ? child.width : fallbackChildWidth;
    const childHeightForLayout = child ? child.height : (isChip ? CHILD_CHIP_HEIGHT : childSize);

    const childActionIndex = child
      ? child.actionIndex
      : ((getBubbleConfigById(parentId)?.childActions || []).findIndex((action) => getChildBubbleKey(parentId, action.id) === childKey));
    const staggerDelay = Math.max(0, childActionIndex) * CHILD_STAGGER_STEP_S;
    const restingScale = 0.62;
    const displayX = child ? child.targetX : parentBubble.targetX;
    const displayY = child ? child.targetY : parentBubble.targetY;
    const scale = child ? child.targetScale : restingScale;
    const opacity = child ? 1 : 0;
    const transformEase = child ? BUBBLE_ENTER_EASE : BUBBLE_EXIT_EASE;
    const fadeDuration = child ? FADE_IN_DURATION_MS : FADE_OUT_DURATION_MS;
    const shadow = child && state.hoveredChildBubble === childKey
      ? '0 16px 32px rgba(0, 0, 0, 0.42)'
      : '0 10px 24px rgba(0, 0, 0, 0.26)';
    const isHighlighted = state.hoveredChildBubble === childKey;
    const childAccent = getChildActionAccent(refs.action);
    const childSecondaryAccent = 'rgb(0 0 0)';
    const childHeight = child ? child.height : (isChip ? CHILD_CHIP_HEIGHT : childSize);

    refs.item.style.zIndex = String(child ? 65 + childActionIndex : 20);
    refs.item.style.width = `${childWidth}px`;
    refs.item.style.height = `${childHeight}px`;
    refs.item.style.opacity = String(opacity);
    refs.item.style.boxShadow = shadow;
    refs.item.style.filter = 'none';
    refs.item.style.transform = `translate3d(${displayX - (childWidth / 2)}px, ${displayY - (childHeightForLayout / 2)}px, 0) scale(${scale})`;
    refs.item.style.transitionDelay = `${staggerDelay}s, ${staggerDelay}s, ${staggerDelay}s, 0s, 0s`;
    refs.item.style.transitionDuration = `${child ? APPEAR_MOVE_DURATION_MS : DISAPPEAR_MOVE_DURATION_MS}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms, ${fadeDuration}ms`;
    refs.item.style.transitionTimingFunction = `${transformEase}, var(--bubble-ease), var(--bubble-ease), var(--bubble-ease), var(--bubble-ease)`;
    refs.surface.classList.toggle('is-highlighted', isHighlighted && !refs.action?.img);
    refs.surface.style.setProperty('--g-stage-selected-rgb', childAccent);
    refs.surface.style.setProperty('--g-stage-selected-secondary-rgb', childSecondaryAccent);
    refs.content.style.width = `${childWidth}px`;
    refs.content.style.height = `${childHeight}px`;
    refs.content.style.transform = isChip ? 'scale(1)' : (refs.action?.img ? 'scale(1)' : 'scale(0.88)');
  }
}

function computeLayout(isPressed, hoveredBubble, childMenuParentId, hoveredChildBubbleId) {
  const positions = BUBBLES_CONFIG.map((bubble) => ({
    ...bubble,
    radius: Math.max(bubble.width, bubble.height) / 2,
    targetX: isPressed ? bubble.x : 0,
    targetY: isPressed ? bubble.y : 0,
    targetWidth: isPressed && hoveredBubble === bubble.id && bubble.isPill && childMenuParentId !== bubble.id
      ? bubble.width + bubble.expandedExtraWidth
      : bubble.width,
    targetScale: !isPressed
      ? 0.18
      : (hoveredBubble === bubble.id ? (bubble.disableHoverScale ? 1 : 1.1) : 1),
    isExpanded: isPressed && hoveredBubble === bubble.id && bubble.isPill && childMenuParentId !== bubble.id,
  }));

  const orbNode = {
    id: 'orb',
    width: ORB_BASE_SIZE,
    height: ORB_BASE_SIZE,
    radius: ORB_BASE_SIZE / 2,
    targetX: 0,
    targetY: 0,
    targetScale: isPressed ? (ORB_PRESSED_SIZE / ORB_BASE_SIZE) : 1,
  };
  positions.push(orbNode);

  let childNodes = [];
  const childMenuParent = isPressed && childMenuParentId != null
    ? positions.find((bubble) => bubble.id === childMenuParentId)
    : null;
  if (childMenuParent) {
    childNodes = buildChildBubbleLayout(childMenuParent, hoveredChildBubbleId);
    positions.push(...childNodes);
  }

  const activeBubble = isPressed && hoveredBubble
    ? positions.find((bubble) => bubble.id === hoveredBubble)
    : null;

  if (activeBubble?.isExpanded) {
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
          const minDist = p1.radius + p2.radius + getNodeGap(p1, p2);

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

  if (childNodes.length) {
    const branchIds = new Set([childMenuParent.id, ...childNodes.map((node) => node.id)]);

    for (const child of childNodes) {
      for (const position of positions) {
        if (branchIds.has(position.id)) continue;
        const initialPush = getNodeRepulsion(child, position, 28, CHILD_LAYOUT_GAP);
        if (initialPush) {
          position.targetX += initialPush.x;
          position.targetY += initialPush.y;
        }
      }
    }

    for (let iter = 0; iter < 12; iter += 1) {
      for (const child of childNodes) {
        for (const position of positions) {
          if (branchIds.has(position.id)) continue;
          const repel = getNodeRepulsion(child, position, 0, CHILD_LAYOUT_GAP);
          if (repel) {
            position.targetX += repel.x;
            position.targetY += repel.y;
          }
        }
      }

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const p1 = positions[i];
          const p2 = positions[j];
          if (branchIds.has(p1.id) || branchIds.has(p2.id)) continue;

          const dx = p2.targetX - p1.targetX;
          const dy = p2.targetY - p1.targetY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = p1.radius + p2.radius + getNodeGap(p1, p2);

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
  const activeItem = childMenuParent || positions.find((bubble) => bubble.id === hoveredBubble);
  if (activeItem) {
    let left;
    let right;
    let top;
    let bottom;

    if (childMenuParent && childNodes.length) {
      const branchBounds = getChildBranchBounds(childMenuParent, childNodes);
      left = branchBounds.left;
      right = branchBounds.right;
      top = branchBounds.top;
      bottom = branchBounds.bottom;
    } else {
      const halfWidth = activeItem.width / 2;
      const halfHeight = activeItem.height / 2;
      left = activeItem.targetX - halfWidth;
      right = activeItem.targetX + (activeItem.isExpanded ? halfWidth + activeItem.expandedExtraWidth : halfWidth);
      top = activeItem.targetY - halfHeight;
      bottom = activeItem.targetY + halfHeight;
    }

    const canvasHalf = 210;
    const topLimit = -323;
    const bottomLimit = 40;

    if (right + PAN_MARGIN_PX > canvasHalf) panX = canvasHalf - right - PAN_MARGIN_PX;
    else if (left - PAN_MARGIN_PX < -canvasHalf) panX = -canvasHalf - left + PAN_MARGIN_PX;

    if (bottom + PAN_MARGIN_PX > bottomLimit) panY = bottomLimit - bottom - PAN_MARGIN_PX;
    else if (top - PAN_MARGIN_PX < topLimit) panY = topLimit - top + PAN_MARGIN_PX;
  }

  return {
    bubbles: positions.filter((bubble) => bubble.id !== 'orb' && !bubble.isChild),
    children: childNodes,
    orb: orbNode,
    childZone: childMenuParent && childNodes.length
      ? getChildZone(childMenuParent, childNodes)
      : null,
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

function getHoverState(point, layout, previousHoveredId, previousHoveredChildId) {
  const children = [...(layout.children || [])].sort((a, b) => {
    if (a.id === previousHoveredChildId) return -1;
    if (b.id === previousHoveredChildId) return 1;
    return (b.zIndex || 0) - (a.zIndex || 0);
  });

  for (const child of children) {
    if (isPointerInsideChild(point, child, previousHoveredChildId === child.id ? HOVER_LEASH_PX : 0)) {
      return {
        bubbleId: child.parentId,
        childId: child.id,
      };
    }
  }

  if (layout.childZone && isPointInsideRect(point, layout.childZone)) {
    return {
      bubbleId: layout.childZone.parentId,
      childId: null,
    };
  }

  const bubbles = [...layout.bubbles].sort((a, b) => {
    if (a.id === previousHoveredId) return -1;
    if (b.id === previousHoveredId) return 1;
    return (b.zIndex || 0) - (a.zIndex || 0);
  });

  for (const bubble of bubbles) {
    if (isPointerInsideBubble(point, bubble, previousHoveredId)) {
      return {
        bubbleId: bubble.id,
        childId: null,
      };
    }
  }

  return {
    bubbleId: null,
    childId: null,
  };
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

  return isPointerInsideCircle(point, child, padding);
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
  return isPointerInsideCircle(point, bubble, stickyPadding);
}

function isPointerInsideCircle(point, node, padding) {
  const radius = node.radius + padding;
  const dx = point.x - node.targetX;
  const dy = point.y - node.targetY;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}

function isPointInsideRect(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
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
    const progress = Math.min(1, elapsed / PAN_DURATION_MS);
    const eased = cubicBezier(progress, 0.35, 0.23, 0.13, 0.98);
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

function cubicBezier(t, x1, y1, x2, y2) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (u) => ((ax * u + bx) * u + cx) * u;
  const sampleCurveY = (u) => ((ay * u + by) * u + cy) * u;
  const sampleCurveDerivativeX = (u) => (3 * ax * u + 2 * bx) * u + cx;

  let u = t;
  for (let i = 0; i < 5; i += 1) {
    const x = sampleCurveX(u) - t;
    const dx = sampleCurveDerivativeX(u);
    if (Math.abs(x) < 1e-6 || Math.abs(dx) < 1e-6) break;
    u -= x / dx;
  }

  u = Math.min(1, Math.max(0, u));
  return sampleCurveY(u);
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

function getCircleRepulsion(source, node, influencePadding, extraGap) {
  const dx = node.targetX - source.targetX;
  const dy = node.targetY - source.targetY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
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

  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
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

function getNodeGap(nodeA, nodeB) {
  if (nodeA.isChild || nodeB.isChild) return CHILD_LAYOUT_GAP;
  return DEFAULT_BUBBLE_GAP;
}

function getChildBubbleSize(parentBubble) {
  return CHILD_BUBBLE_SIZE;
}

function buildChildBubbleLayout(parentBubble, hoveredChildBubbleId) {
  const actions = parentBubble.childActions || [];
  if (parentBubble.childLayout === 'chatgpt-chips' || parentBubble.childLayout === 'gemini-chips') {
    return buildChildChipLayout(parentBubble, actions, hoveredChildBubbleId);
  }
  const baseAngle = Math.atan2(parentBubble.targetY - 18, parentBubble.targetX || 0.001);
  const childSize = getChildBubbleSize(parentBubble);
  const childRadius = childSize / 2;
  const distance = parentBubble.radius + childRadius + CHILD_FAN_DISTANCE;
  const offsets = getFanAngleOffsets(actions.length, childSize, distance);

  return actions.map((action, index) => {
    const angle = baseAngle + offsets[index];
    const childId = getChildBubbleKey(parentBubble.id, action.id);
    return {
      ...action,
      id: childId,
      parentId: parentBubble.id,
      actionIndex: index,
      isChild: true,
      width: childSize,
      height: childSize,
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
    const distance = Math.sqrt((dx * dx) + (dy * dy)) || 1;
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
  const distance = Math.sqrt((dx * dx) + (dy * dy));
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

function getNodeBounds(node) {
  return {
    left: node.targetX - (node.width / 2),
    right: node.targetX + (node.width / 2),
    top: node.targetY - (node.height / 2),
    bottom: node.targetY + (node.height / 2),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
