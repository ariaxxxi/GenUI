// import { initHandTracking } from './hand-tracking.js';
import {
  applySelectedChromePreset,
  clearDirectionalSelectionTimers,
  syncDirectionalSelection,
} from './shared/celestial-selection-chrome.js';
import { celestialSelectedPresetForRenderShape } from './shared/celestial-selected-presets.js';
import {
  bindAiOrbIconStorageSync,
  getAiOrbIconOption,
  renderAiOrbCenterMarkup,
  syncAiOrbCenterEmoji,
  syncAiOrbCenterIcon,
  syncAiOrbCenterImage,
} from './shared/ai-orb-icon.js';

// ── Audio ─────────────────────────────────────────────────────────────────────
let _audioCtx = null;
let _clickBuffer = null;
let _clickBufferLoading = false;

function getAudioCtx() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _audioCtx = new AC();
  }
  return _audioCtx;
}

async function loadClickBuffer() {
  if (_clickBuffer || _clickBufferLoading) return;
  _clickBufferLoading = true;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const res = await fetch('src/assets/click.mp3');
    const arrayBuffer = await res.arrayBuffer();
    _clickBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch (e) {}
}

function playBubbleHoverSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  loadClickBuffer();
  if (!_clickBuffer) return;
  const src = ctx.createBufferSource();
  src.buffer = _clickBuffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}
// ─────────────────────────────────────────────────────────────────────────────

const APP_SET_BUBBLE_BASE_SIZE = 110;
const AGENT_SET_BUBBLE_BASE_SIZE = 110;
const BUBBLE_BASE_SIZE = APP_SET_BUBBLE_BASE_SIZE;
const BUBBLE_MIN_SIZE = 60;
const BUBBLE_MAX_SIZE = 110;
const MAX_DIST = 260;
const MAX_PAN = 75;
const CANVAS_SIZE = 420;
const CANVAS_CENTER_X = CANVAS_SIZE / 2;
const CANVAS_CENTER_Y = CANVAS_SIZE / 2;
const PAN_MARGIN_PX = 24;
const CANVAS_HALF_SIZE = 210;
const DEFAULT_BUBBLE_GAP = 8;
const ORB_FIELD_LAYOUT_GAP = 10;
const PILL_LAYOUT_GAP = 10;
const PILL_REPULSION_INFLUENCE = 28;
const ORB_PILL_LAYOUT_GAP = 34;
const EXPANDED_PILL_VIEWPORT_MARGIN_X = 24;
const EXPANDED_PILL_VIEWPORT_MARGIN_Y = 14;
const PILL_REPULSION_ITERATIONS = 12;
const BUBBLE_LAYOUT_ITERATIONS = 12;
const BUBBLE_STAGGER_STEP_MS = 35;
const DEFAULT_MOVE_DURATION_MS = 450;
const ACTIVE_MOVE_DURATION_MS = 250;
const APPEAR_MOVE_DURATION_MS = 400;
const DISAPPEAR_MOVE_DURATION_MS = 300;
const BUBBLE_HOVER_CONTENT_SCALE = 0.75;
const BUBBLE_RELEASE_CONTENT_SCALE = 0.45;
const PILL_HOVER_BUBBLE_SCALE = 0.8;
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
const CENTER_PROBE_BASE_X = CANVAS_CENTER_X - ORB_CENTER_X;
const CENTER_PROBE_BASE_Y = CANVAS_CENTER_Y - ORB_CENTER_Y;
const FALLBACK_ICON = 'src/assets/fallback-icon.png';
const PILL_TEXT_LEFT_PADDING = 8;
const PILL_TEXT_RIGHT_PADDING = 24;
const PILL_TRAILING_ICON_SIZE = 40;
const PILL_TRAILING_ICON_RIGHT = 18;
const PILL_ACTION_GAP = 16;
const CHILD_STAGGER_STEP_MS = 60;
const CHILD_MENU_HOLD_MS = 1500;
const CHILD_BUBBLE_TRIGGER_ENABLED = false;
const CHILD_BUBBLE_SIZE = 80;
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
const SWAP_DURATION_MS = 980;
const SWAP_SIBLING_DURATION_MS = 300;
const SWAP_HIGHLIGHT_FREEZE_MS = 120;
const SWAP_PROMOTED_SHELL_ALPHA_DELAY_MS = 200;
const SWAP_ORB_BLOOM_OVERSHOOT_MS = 150;
const SWAP_ORB_BLOOM_SETTLE_MS = 220;
const SWAP_DEMOTED_START_DELAY_MS = 90;
const SWAP_DEMOTED_END_SCALE = 0.55;
const textMeasureContext = document.createElement('canvas').getContext('2d');
const FIGMA_ASSETS = {
  chatgpt: 'src/assets/figma-chatgpt.png',
  gemini:  'src/assets/figma-gemini.png',
  health:  'src/assets/figma-health.png',
  map:     'src/assets/figma-map.png',
  weather: 'src/assets/figma-weather.png',
  note:    'src/assets/figma-note.png',
};
const BUBBLE_HOME_AGENT_SEQUENCE = Object.freeze(['bixby', 'gemini', 'chatgpt']);
const BUBBLE_HOME_DEFAULT_AGENT_ID = 'bixby';
const PROFILE_CALL_BADGE_ASSET = 'src/assets/profile-call-badge.png';
const CLAUDE_AGENT_ASSET = 'assets/agents/Claude-ai-icon.png';
const CELESTIAL_CHIP_PRESET = celestialSelectedPresetForRenderShape('chip');
const CELESTIAL_ORB_PRESET = celestialSelectedPresetForRenderShape('orb');
const NON_PROMOTABLE_BUBBLE_IDS = new Set([1, 3, 4, 5]);
const CLAUDE_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(255 206 175)',
  blobTopEdge: 'rgb(226 142 92)',
  blobBottomCore: 'rgb(255 230 208)',
  blobBottomEdge: 'rgb(187 110 72)',
});
const WRITING_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(126 186 255)',
  blobTopEdge: 'rgb(92 132 255)',
  blobBottomCore: 'rgb(197 223 255)',
  blobBottomEdge: 'rgb(74 102 212)',
});
const BUDGET_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(121 255 168)',
  blobTopEdge: 'rgb(78 214 127)',
  blobBottomCore: 'rgb(214 255 143)',
  blobBottomEdge: 'rgb(92 184 74)',
});
const FITNESS_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(118 255 199)',
  blobTopEdge: 'rgb(72 210 165)',
  blobBottomCore: 'rgb(187 255 229)',
  blobBottomEdge: 'rgb(54 145 118)',
});
const TRAVEL_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(250 252 255)',
  blobTopEdge: 'rgb(223 232 247)',
  blobBottomCore: 'rgb(255 255 255)',
  blobBottomEdge: 'rgb(201 214 234)',
});

const BUBBLE_HOME_SLOT_THEMES = Object.freeze({
  2: Object.freeze({
    blobTopCore: 'rgb(247 249 255)',
    blobTopEdge: 'rgb(228 235 247)',
    blobBottomCore: 'rgb(255 255 255)',
    blobBottomEdge: 'rgb(214 223 238)',
  }),
  4: Object.freeze({
    blobTopCore: 'rgb(173 255 211)',
    blobTopEdge: 'rgb(88 208 168)',
    blobBottomCore: 'rgb(125 227 255)',
    blobBottomEdge: 'rgb(59 143 255)',
  }),
  6: Object.freeze({
    blobTopCore: 'rgb(244 249 255)',
    blobTopEdge: 'rgb(184 216 255)',
    blobBottomCore: 'rgb(170 205 255)',
    blobBottomEdge: 'rgb(67 123 255)',
  }),
  8: Object.freeze({
    blobTopCore: 'rgb(122 183 255)',
    blobTopEdge: 'rgb(121 114 255)',
    blobBottomCore: 'rgb(203 178 255)',
    blobBottomEdge: 'rgb(108 64 255)',
  }),
  9: Object.freeze({
    blobTopCore: 'rgb(255 182 182)',
    blobTopEdge: 'rgb(255 112 112)',
    blobBottomCore: 'rgb(255 146 111)',
    blobBottomEdge: 'rgb(209 63 63)',
  }),
  10: Object.freeze({
    blobTopCore: 'rgb(171 219 255)',
    blobTopEdge: 'rgb(85 157 255)',
    blobBottomCore: 'rgb(123 180 255)',
    blobBottomEdge: 'rgb(37 93 255)',
  }),
});

function renderCelestialSelectionChrome(direction = 'bottom', extraClass = '') {
  const cls = [extraClass, 'g-selection-chrome'].filter(Boolean).join(' ');
  return `<div class="${cls}" data-stage-direction="${direction}" aria-hidden="true"><div class="g-stage-selected-refraction"><div class="g-stage-selected-blob g-stage-selected-blob--top-left"></div><div class="g-stage-selected-blob g-stage-selected-blob--bottom-right"></div></div><div class="g-stage-selected-sharp-pass"><div class="g-stage-selected-sharp-highlight"></div></div><div class="g-stage-selected-accent-rim"></div><div class="g-stage-selected-highlight"></div><div class="g-stage-selected-highlight-mask"><div class="g-stage-selected-highlight-mask-image"></div></div></div>`;
}

function renderBubbleOrbShellMarkup(options = {}) {
  const includeCenter = options.includeCenter !== false;
  return `
    <div class="bubble2-orb-sphere g-celestial-orb-sphere" aria-hidden="true"></div>
    ${renderCelestialSelectionChrome('bottom', 'bubble2-orb-selection g-celestial-orb-selection')}
    ${includeCenter ? renderAiOrbCenterMarkup() : ''}
  `;
}

function applyBubbleCelestialChrome(chromeEl, hostEl, preset, colorOverrides = {}, geometryOverride = null) {
  if (!chromeEl || !hostEl || !preset) return;
  applySelectedChromePreset(chromeEl, hostEl, preset, colorOverrides, geometryOverride);
}

function orbGeometryForSize(size) {
  return {
    width: size,
    height: size,
    radius: size / 2,
  };
}

function currentBubbleHomeOrbTheme() {
  return state.homeOrbContent?.theme || getAiOrbIconOption(state.orbAgentId)?.theme || {};
}

function applyBubbleHomeOrbShellChrome(hostEl, theme) {
  if (!hostEl) return;
  applyBubbleCelestialChrome(
    hostEl.querySelector('.bubble2-orb-selection'),
    hostEl,
    CELESTIAL_ORB_PRESET,
    theme || {},
    orbGeometryForSize(ORB_BASE_SIZE),
  );
}

function resetBubbleHomeOrbCenter(root = refs.orb) {
  const visual = root?.querySelector?.('.bubble2-orb-visual');
  const center = visual?.querySelector?.('.g-celestial-orb-center');
  if (!visual || !center) return;
  if (visual._orbIconSwitchTimer) {
    clearTimeout(visual._orbIconSwitchTimer);
    visual._orbIconSwitchTimer = null;
  }
  visual.classList.remove('is-orb-icon-switching');
  visual.removeAttribute('data-orb-switch-motion');
  visual.removeAttribute('data-orb-switch-direction');
  center.outerHTML = renderAiOrbCenterMarkup();
}

function applyBubbleHoverShellChrome(hostEl, theme, geometryOverride) {
  if (!hostEl) return;
  applyBubbleCelestialChrome(
    hostEl.querySelector('.bubble2-orb-selection'),
    hostEl,
    CELESTIAL_ORB_PRESET,
    theme || {},
    geometryOverride,
  );
}

const APP_BUBBLES_CONFIG = [
  {
    id: 1,
    x: 9,
    y: -102,
    zIndex: 20,
    img: 'src/assets/spotify-album-happiness.jpg',
    fill: true,
    isPill: true,
    pillTitle: 'Happiness',
    pillSubtitle: '1975',
    imageOutlineColor: '#1ED760',
    imageOutlineWidth: 3,
    pillTrailingIcon: 'pause',
    pillTrailingIconColor: '#1ED760',
    subIconKind: 'spotify-badge',
    subIconSize: 42.167,
    subIconOffsetX: 67.83,
    subIconOffsetY: 67.83,
    disableHoverScale: true,
    childActions: [
      { id: 'playlist-1', img: 'src/assets/spotify-liked-songs.jpg', fill: true },
      { id: 'playlist-2', img: 'src/assets/spotify-album-2.jpg', fill: true },
      { id: 'playlist-3', img: 'src/assets/spotify-album-blonde.jpg', fill: true },
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
    haloColor: 'rgb(253, 64, 64)',
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
    x: -86,
    y: -57,
    zIndex: 13,
    img: FIGMA_ASSETS.chatgpt,
    fill: true,
    haloColor: '#ffffff',
    pillTitle: 'Continue',
    pillSubtitle: 'Book flight to Coachella',
    childLayout: 'chatgpt-chips',
    childActions: [
      { id: 'ideas', kind: 'chip', label: '💡 Give me ideas', fontWeight: 400, layoutLeft: -136, layoutTop: -85 },
      { id: 'explain', kind: 'chip', label: '🔍 Explain this', fontWeight: 400, layoutLeft: -209, layoutTop: -36 },
      { id: 'surprise', kind: 'chip', label: '🎲 Surprise me', fontWeight: 400, layoutLeft: -172, layoutTop: 13 },
    ],
  },
  {
    id: 8,
    x: 91,
    y: -28,
    zIndex: 14,
    img: FIGMA_ASSETS.gemini,
    fill: true,
    haloColor: '#A391FB',
    childLayout: 'gemini-chips',
    childActions: [
      { id: 'plan', kind: 'chip', label: '🧩 Plan my day', fontWeight: 500, layoutLeft: -3, layoutTop: -81 },
      { id: 'summarize', kind: 'chip', label: '📄 Summarize this', fontWeight: 500, layoutLeft: 40, layoutTop: -32 },
      { id: 'rewrite', kind: 'chip', label: '🔁 Rewrite this', fontWeight: 500, layoutLeft: 30, layoutTop: 17 },
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
    haloColor: '#ffffff',
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
    haloColor: '#3483FF',
    childActions: [
      { id: 'forecast', kind: 'sun', bg: '#ffffff', fg: '#f5b400' },
      { id: 'rain', kind: 'umbrella', bg: '#ffffff', fg: '#149cf1' },
      { id: 'radar', kind: 'radar', bg: '#ffffff', fg: '#149cf1' },
    ],
  },
].map(enrichBubbleMetrics);

const AGENT_BUBBLES_CONFIG = [
  {
    id: 1,
    baseSize: 120,
    fieldMaxSize: 120,
    x: 0,
    y: -105,
    zIndex: 20,
    img: CLAUDE_AGENT_ASSET,
    fill: true,
    imageScale: 0.82,
    theme: CLAUDE_AGENT_THEME,
    haloColor: CLAUDE_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 3,
    baseSize: 80,
    fieldMaxSize: 80,
    x: -79,
    y: -108,
    zIndex: 15,
    graphicKind: 'emoji',
    emoji: '✈️',
    emojiScale: 1,
    homeEmojiScale: 1.2,
    hoverExpandsToPill: true,
    pillTitle: 'Travel Agent',
    pillSubtitle: 'Plan trips',
    pillCopyOffsetX: -4,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: TRAVEL_AGENT_THEME,
    haloColor: TRAVEL_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 9,
    baseSize: 80,
    fieldMaxSize: 80,
    x: 31,
    y: -165,
    zIndex: 14,
    graphicKind: 'emoji',
    emoji: '📝',
    emojiScale: 1,
    homeEmojiScale: 1.2,
    hoverExpandsToPill: true,
    pillTitle: 'Writing Agent',
    pillSubtitle: 'Polish writing',
    pillCopyOffsetX: -4,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: WRITING_AGENT_THEME,
    haloColor: WRITING_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 2,
    x: -69,
    y: -36,
    zIndex: 13,
    img: FIGMA_ASSETS.chatgpt,
    fill: true,
    haloColor: '#ffffff',
    childActions: [],
  },
  {
    id: 8,
    x: 69,
    y: -36,
    zIndex: 14,
    img: FIGMA_ASSETS.gemini,
    fill: true,
    haloColor: '#A391FB',
    childActions: [],
  },
  {
    id: 5,
    baseSize: 80,
    fieldMaxSize: 80,
    x: 79,
    y: -108,
    zIndex: 16,
    graphicKind: 'emoji',
    emoji: '🏃',
    emojiScale: 1,
    homeEmojiScale: 1.2,
    hoverExpandsToPill: true,
    pillTitle: 'Fitness Agent',
    pillSubtitle: 'Train smart',
    pillCopyOffsetX: -4,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: FITNESS_AGENT_THEME,
    haloColor: FITNESS_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 6,
    baseSize: 80,
    fieldMaxSize: 80,
    x: -31,
    y: -165,
    zIndex: 10,
    graphicKind: 'emoji',
    emoji: '💸',
    emojiScale: 1,
    homeEmojiScale: 1.2,
    hoverExpandsToPill: true,
    pillTitle: 'Budget Agent',
    pillSubtitle: 'Track spending',
    pillCopyOffsetX: -4,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: BUDGET_AGENT_THEME,
    haloColor: BUDGET_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
].map(enrichBubbleMetrics);

const BUBBLE_SET_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'app',
    label: 'App',
    defaultBaseSize: APP_SET_BUBBLE_BASE_SIZE,
    slots: APP_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: 'agent',
    label: 'Agent',
    defaultBaseSize: AGENT_SET_BUBBLE_BASE_SIZE,
    slots: AGENT_BUBBLES_CONFIG,
  }),
]);

const DEFAULT_BUBBLE_SET_ID = BUBBLE_SET_DEFINITIONS[0]?.id || 'app';
const BUBBLE_STAGGER_TOTAL_MS = Math.max(
  0,
  ((Math.max(...BUBBLE_SET_DEFINITIONS.map((setDef) => setDef.slots.length), 1)) - 1) * BUBBLE_STAGGER_STEP_MS,
);
const OPEN_PHASE_LATCH_MS = APPEAR_MOVE_DURATION_MS;
const CLOSE_PHASE_LATCH_MS = DISAPPEAR_MOVE_DURATION_MS + BUBBLE_STAGGER_TOTAL_MS;

function bubbleSlotThemeForId(id) {
  return BUBBLE_HOME_SLOT_THEMES[id] || getAiOrbIconOption(BUBBLE_HOME_DEFAULT_AGENT_ID)?.theme || null;
}

function haloColorForTheme(theme) {
  return theme?.blobTopCore || theme?.blobBottomCore || null;
}

function fieldHaloColorForAgent(id, theme) {
  return id === 'bixby' ? '#ffffff' : haloColorForTheme(theme);
}

function createAgentOrbContent(id) {
  const option = getAiOrbIconOption(id);
  return {
    kind: 'agent-orb',
    contentId: `agent-orb:${option.id}`,
    sourceSlotId: null,
    iconId: option.id,
    img: option.src,
    alt: `${option.label} orb icon`,
    fill: false,
    imageScale: 0.72,
    fieldImageScale: 0.96,
    theme: option.theme,
    haloColor: fieldHaloColorForAgent(option.id, option.theme),
    orbPromotionEnabled: false,
    childActions: [],
  };
}

function createDemotedOrbSlotContent(homeOrbContent) {
  if (Number.isFinite(homeOrbContent?.sourceSlotId)) {
    const sourceSlot = findBubbleSlotById(homeOrbContent.sourceSlotId, state.activeSetId);
    if (sourceSlot) return createBaseSlotContent(sourceSlot);
  }
  return {
    kind: 'demoted-orb-bubble',
    contentId: `demoted:${homeOrbContent.contentId}`,
    sourceSlotId: null,
    graphicKind: homeOrbContent.graphicKind || 'image',
    emoji: homeOrbContent.emoji || '',
    emojiScale: homeOrbContent.emojiScale ?? 1,
    homeEmojiScale: homeOrbContent.homeEmojiScale ?? 1,
    img: homeOrbContent.img,
    alt: homeOrbContent.alt || '',
    fill: false,
    imageScale: homeOrbContent.fieldImageScale ?? 0.96,
    isPill: false,
    hoverExpandsToPill: false,
    pillTitle: '',
    pillSubtitle: '',
    pillTrailingIcon: '',
    theme: homeOrbContent.theme || null,
    haloColor: homeOrbContent.haloColor || haloColorForTheme(homeOrbContent.theme),
    hoverShadowMode: 'tight',
    orbPromotionEnabled: true,
    childActions: [],
  };
}

function createBaseSlotContent(slot, setId = state.activeSetId) {
  const slotTheme = slot.theme || bubbleSlotThemeForId(slot.id);
  return {
    kind: 'slot-bubble',
    contentId: `slot:${slot.id}`,
    sourceSlotId: slot.id,
    baseSize: slot.baseSize ?? getDefaultBubbleBaseSizeForSet(setId),
    fieldMaxSize: slot.fieldMaxSize ?? BUBBLE_MAX_SIZE,
    graphicKind: slot.graphicKind || 'image',
    emoji: slot.emoji || '',
    emojiScale: slot.emojiScale ?? 1,
    homeEmojiScale: slot.homeEmojiScale ?? 1,
    img: slot.img,
    alt: '',
    fill: Boolean(slot.fill),
    imageScale: slot.imageScale ?? (slot.fill ? 1 : 0.72),
    isPill: Boolean(slot.isPill),
    hoverExpandsToPill: Boolean(slot.hoverExpandsToPill),
    pillTitle: slot.pillTitle || '',
    pillSubtitle: slot.pillSubtitle || '',
    pillTrailingIcon: slot.pillTrailingIcon || '',
    pillTrailingIconColor: slot.pillTrailingIconColor || '',
    pillTrailingIconSize: slot.pillTrailingIconSize,
    pillTrailingIconRight: slot.pillTrailingIconRight,
    pillTextLeftPadding: slot.pillTextLeftPadding,
    pillTextRightPadding: slot.pillTextRightPadding,
    pillCopyOffsetX: slot.pillCopyOffsetX,
    pillActionGap: slot.pillActionGap,
    imageOutlineColor: slot.imageOutlineColor,
    imageOutlineWidth: slot.imageOutlineWidth,
    subIconKind: slot.subIconKind,
    subIcon: slot.subIcon,
    subIconSize: slot.subIconSize,
    subIconOffsetX: slot.subIconOffsetX,
    subIconOffsetY: slot.subIconOffsetY,
    childActions: slot.childActions || [],
    childLayout: slot.childLayout || null,
    haloColor: slot.haloColor || haloColorForTheme(slotTheme),
    theme: slotTheme,
    hoverShadowMode: 'default',
    orbPromotionEnabled: slot.orbPromotionEnabled ?? !NON_PROMOTABLE_BUBBLE_IDS.has(slot.id),
  };
}

function getBubbleSetDefinition(setId = DEFAULT_BUBBLE_SET_ID) {
  return BUBBLE_SET_DEFINITIONS.find((setDef) => setDef.id === setId) || BUBBLE_SET_DEFINITIONS[0];
}

function getBubblesConfigForSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return getBubbleSetDefinition(setId)?.slots || [];
}

function getDefaultBubbleBaseSizeForSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return getBubbleSetDefinition(setId)?.defaultBaseSize || BUBBLE_BASE_SIZE;
}

function findBubbleSlotById(slotId, setId = DEFAULT_BUBBLE_SET_ID) {
  return getBubblesConfigForSet(setId).find((bubble) => bubble.id === slotId) || null;
}

function createInitialSlotContentMap(setId) {
  return Object.fromEntries(getBubblesConfigForSet(setId).map((slot) => [slot.id, createBaseSlotContent(slot, setId)]));
}

function createInitialSlotContentMaps() {
  return Object.fromEntries(BUBBLE_SET_DEFINITIONS.map((setDef) => [setDef.id, createInitialSlotContentMap(setDef.id)]));
}

function getCurrentSlotContent(slotId, setId = state.activeSetId) {
  const contentMap = state.slotContentBySetId[setId] || {};
  return contentMap[slotId] || createBaseSlotContent(findBubbleSlotById(slotId, setId), setId);
}

function resolveRenderedBubble(slot, setId = state.activeSetId) {
  const content = getCurrentSlotContent(slot.id, setId);
  return {
    ...slot,
    ...content,
    id: slot.id,
    baseSize: content.baseSize ?? slot.baseSize ?? getDefaultBubbleBaseSizeForSet(setId),
    fieldMaxSize: content.fieldMaxSize ?? slot.fieldMaxSize ?? BUBBLE_MAX_SIZE,
    expandedExtraWidth: bubbleSupportsPillExpansion(content) ? measurePillExtraWidth(content) : 0,
    childActions: content.childActions || [],
    imageScale: content.imageScale ?? (content.fill ? 1 : 0.72),
  };
}

const state = {
  activeSetId: DEFAULT_BUBBLE_SET_ID,
  isPressed: false,
  hoveredBubble: null,
  hoveredChildBubble: null,
  dragOffset: {
    x: 0,
    y: 0,
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
  orbAgentId: BUBBLE_HOME_DEFAULT_AGENT_ID,
  homeOrbContent: createAgentOrbContent(BUBBLE_HOME_DEFAULT_AGENT_ID),
  slotContentBySetId: createInitialSlotContentMaps(),
  swapTransition: null,
  swapResetPending: false,
  panSnapPending: false,
  pendingDemotedSlotSwap: null,
  lastScene: null,
  renderQueued: false,
};

let previousHoveredId = null;
let previousHoveredChildId = null;
let syncedChildSelectionParentId = null;
let syncedChildSelectionId = null;
const childSelectionMotionTimers = new Map();

const refs = {
  shell: document.querySelector('[data-bubble2-shell]'),
  setPanel: document.querySelector('[data-bubble2-set-panel]'),
  panLayer: document.querySelector('[data-bubble2-pan-layer]'),
  orb: null,
  orbVisual: null,
  swapLayer: null,
  bubbleNodes: new Map(),
  childNodes: new Map(),
};

init();

function init() {
  if (!refs.shell || !refs.panLayer) return;

  syncSetSwitcherUi();
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
  // initHandTracking();
}

function buildScene() {
  clearDirectionalSelectionTimers(childSelectionMotionTimers);
  refs.panLayer.replaceChildren();
  refs.bubbleNodes.clear();
  refs.childNodes.clear();
  refs.orb = null;
  refs.orbVisual = null;
  refs.swapLayer = null;
  syncedChildSelectionParentId = null;
  syncedChildSelectionId = null;
  const fragment = document.createDocumentFragment();
  const childFragment = document.createDocumentFragment();
  const activeBubbles = getBubblesConfigForSet(state.activeSetId);

  activeBubbles.forEach((bubble, index) => {
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
  refs.swapLayer = document.createElement('div');
  refs.swapLayer.className = 'bubble2-swap-layer';
  refs.panLayer.appendChild(fragment);
  refs.panLayer.appendChild(childFragment);
  refs.panLayer.appendChild(refs.swapLayer);
}

function getChildSelectionSurfaces(parentId) {
  const slot = findBubbleSlotById(parentId, state.activeSetId);
  const parentBubble = slot ? resolveRenderedBubble(slot) : null;
  if (!parentBubble?.childActions?.length) return [];
  return parentBubble.childActions
    .map((action) => refs.childNodes.get(getChildBubbleKey(parentId, action.id))?.surface || null)
    .filter(Boolean);
}

function clearChildDirectionalSelection(nodes) {
  const items = Array.from(nodes || []);
  clearDirectionalSelectionTimers(childSelectionMotionTimers);
  items.forEach((node) => {
    node.classList.remove('selected', 'deselecting');
    const chrome = node.querySelector('.g-selection-chrome');
    if (chrome) chrome.dataset.stageDirection = 'bottom';
  });
}

function syncChildDirectionalSelectionUi(parentId, hoveredChildId) {
  const resolvedParentId = Number.isFinite(Number(parentId)) ? Number(parentId) : null;
  const resolvedChildId = hoveredChildId || null;
  const parentChanged = syncedChildSelectionParentId !== resolvedParentId;
  const selectionChanged = syncedChildSelectionId !== resolvedChildId;

  if (!parentChanged && !selectionChanged) return false;

  if (syncedChildSelectionParentId != null && parentChanged) {
    clearChildDirectionalSelection(getChildSelectionSurfaces(syncedChildSelectionParentId));
  }

  const nodes = resolvedParentId != null ? getChildSelectionSurfaces(resolvedParentId) : [];
  if (!nodes.length || !resolvedChildId) {
    clearChildDirectionalSelection(nodes);
    syncedChildSelectionParentId = resolvedParentId;
    syncedChildSelectionId = resolvedChildId;
    return false;
  }

  const slot = findBubbleSlotById(resolvedParentId, state.activeSetId);
  const parentBubble = slot ? resolveRenderedBubble(slot) : null;
  const nextIndex = parentBubble?.childActions?.findIndex(
    (action) => getChildBubbleKey(resolvedParentId, action.id) === resolvedChildId,
  ) ?? -1;
  if (nextIndex < 0) {
    clearChildDirectionalSelection(nodes);
    syncedChildSelectionParentId = resolvedParentId;
    syncedChildSelectionId = resolvedChildId;
    return false;
  }

  syncDirectionalSelection(nodes, nextIndex, childSelectionMotionTimers, { durationMs: 700 });
  syncedChildSelectionParentId = resolvedParentId;
  syncedChildSelectionId = resolvedChildId;
  return true;
}

function createBubbleNode(bubble, index) {
  const root = document.createElement('div');
  root.className = 'bubble2-item';
  root.dataset.bubbleId = String(bubble.id);

  const shadowEl = document.createElement('div');
  shadowEl.className = 'bubble2-item-shadow';

  const inner = document.createElement('div');
  inner.className = 'bubble2-item-inner';
  root.appendChild(shadowEl);
  root.appendChild(inner);
  const node = {
    index,
    bubbleId: bubble.id,
    root,
    inner,
    visual: null,
    surface: null,
    iconWrap: null,
    leadingGroup: null,
    pillCopy: null,
    subIcon: null,
    hoverShell: null,
    surfaceChrome: null,
    shadowEl,
    contentSignature: '',
  };
  syncBubbleNodeContent(node, bubble);
  return node;
}

function bubbleContentSignature(bubble) {
  return JSON.stringify({
    contentId: bubble.contentId || '',
    graphicKind: bubble.graphicKind || 'image',
    emoji: bubble.emoji || '',
    emojiScale: bubble.emojiScale ?? '',
    img: bubble.img || '',
    fill: Boolean(bubble.fill),
    imageScale: bubble.imageScale ?? '',
    isPill: Boolean(bubble.isPill),
    hoverExpandsToPill: Boolean(bubble.hoverExpandsToPill),
    pillTitle: bubble.pillTitle || '',
    pillSubtitle: bubble.pillSubtitle || '',
    pillTrailingIcon: bubble.pillTrailingIcon || '',
    pillTrailingIconColor: bubble.pillTrailingIconColor || '',
    subIconKind: bubble.subIconKind || '',
    subIcon: bubble.subIcon || '',
    imageOutlineColor: bubble.imageOutlineColor || '',
    imageOutlineWidth: bubble.imageOutlineWidth ?? '',
  });
}

function syncBubbleNodeContent(node, bubble) {
  const signature = bubbleContentSignature(bubble);
  if (node.contentSignature === signature) return;
  node.contentSignature = signature;
  node.inner.replaceChildren();
  const usesPillInteraction = bubbleSupportsPillExpansion(bubble);

  const visual = document.createElement('div');
  visual.className = 'bubble2-item-visual';
  node.inner.appendChild(visual);

  const surface = document.createElement('div');
  surface.className = `bubble2-surface${bubble.hoverExpandsToPill ? ' g-stage-selected-host' : ''}`;
  let surfaceChrome = null;

  if (!bubble.isPill && !bubble.hoverExpandsToPill) {
    const hoverShell = document.createElement('div');
    hoverShell.className = 'bubble2-hover-shell bubble2-orb-visual g-celestial-orb-visual g-stage-selected-host selected';
    hoverShell.setAttribute('aria-hidden', 'true');
    hoverShell.innerHTML = renderBubbleOrbShellMarkup({ includeCenter: false });
    node.inner.appendChild(hoverShell);
    node.hoverShell = hoverShell;
  } else {
    node.hoverShell = null;
  }

  if (bubble.hoverExpandsToPill) {
    surfaceChrome = createHtmlNode(renderCelestialSelectionChrome('bottom', 'bubble2-surface-selection'));
    surface.appendChild(surfaceChrome);
  }

  const iconWrap = document.createElement('div');
  iconWrap.className = 'bubble2-icon-wrap';
  if (bubble.imageOutlineColor) {
    iconWrap.classList.add('has-inner-outline');
    iconWrap.style.setProperty('--bubble-image-outline-color', bubble.imageOutlineColor);
    iconWrap.style.setProperty('--bubble-image-outline-width', `${bubble.imageOutlineWidth ?? 2}px`);
  }
  iconWrap.appendChild(createBubbleGraphic(bubble));

  let pillCopy = null;
  if (usesPillInteraction) {
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
      action.style.setProperty('--pill-action-size', `${bubble.pillTrailingIconSize ?? PILL_TRAILING_ICON_SIZE}px`);
      action.style.setProperty('--pill-action-right', `${bubble.pillTrailingIconRight ?? PILL_TRAILING_ICON_RIGHT}px`);
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
  }

  let leadingGroup = null;
  if (usesPillInteraction) {
    leadingGroup = document.createElement('div');
    leadingGroup.className = 'bubble2-pill-leading-group';
    leadingGroup.appendChild(iconWrap);
    if (subIcon) leadingGroup.appendChild(subIcon);
    visual.appendChild(leadingGroup);
  } else {
    surface.appendChild(iconWrap);
    if (subIcon) visual.appendChild(subIcon);
  }

  visual.appendChild(surface);
  node.visual = visual;
  node.surface = surface;
  node.iconWrap = iconWrap;
  node.leadingGroup = leadingGroup;
  node.pillCopy = pillCopy;
  node.subIcon = subIcon;
  node.surfaceChrome = surfaceChrome;
}

function createChildNode(parentBubble, action) {
  const root = document.createElement('div');
  root.className = 'bubble2-item bubble2-child-item';
  root.dataset.childBubbleId = getChildBubbleKey(parentBubble.id, action.id);
  root.dataset.parentBubbleId = String(parentBubble.id);

  const surface = document.createElement('div');
  surface.className = 'bubble2-surface bubble2-child-surface g-stage-selected-host';
  if (action.img) surface.classList.add('is-image-only');
  if (isChipAction(action)) surface.classList.add('is-chip');
  surface.innerHTML = `
    ${renderCelestialSelectionChrome('bottom', 'bubble2-child-selection')}
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
  visual.className = 'bubble2-orb-visual g-celestial-orb-visual g-stage-selected-host selected';

  visual.innerHTML = renderBubbleOrbShellMarkup();
  button.appendChild(visual);
  syncBubbleHomeOrbVisual(button, { animate: false });

  return button;
}

function syncBubbleHomeOrbVisual(root = refs.orb, options = {}) {
  if (!root) return;
  const content = state.homeOrbContent;
  if (!content) return;
  const visual = root?.querySelector?.('.bubble2-orb-visual');
  const isClaudePromotedImage = content.kind !== 'agent-orb'
    && content.graphicKind !== 'emoji'
    && content.img === CLAUDE_AGENT_ASSET;
  visual?.classList.toggle('is-promoted-home-claude', isClaudePromotedImage);
  if (content.kind === 'agent-orb') {
    syncAiOrbCenterIcon(root, {
      animate: options.animate,
      id: content.iconId,
      switchDirection: options.switchDirection,
      theme: content.theme,
      switchMotion: options.switchMotion,
    });
    return;
  }
  if (content.graphicKind === 'emoji') {
    syncAiOrbCenterEmoji(root, {
      animate: options.animate,
      emoji: content.emoji,
      emojiScale: content.homeEmojiScale ?? 1,
      theme: content.theme,
      switchMotion: options.switchMotion || 'fade',
    });
    return;
  }
  syncAiOrbCenterImage(root, {
    animate: options.animate,
    src: content.img,
    alt: content.alt || '',
    theme: content.theme,
    switchMotion: options.switchMotion || 'fade',
  });
}

bindAiOrbIconStorageSync(document, window);

function syncSetSwitcherUi() {
  if (!refs.setPanel) return;
  refs.setPanel.replaceChildren(
    ...BUBBLE_SET_DEFINITIONS.map((setDef) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `bubble2-set-button${setDef.id === state.activeSetId ? ' is-active' : ''}`;
      button.dataset.bubbleSetId = setDef.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(setDef.id === state.activeSetId));
      button.textContent = setDef.label;
      return button;
    }),
  );
}

function resetStateForSetSwitch() {
  state.isPressed = false;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.dragOffset = { x: 0, y: 0, active: false };
  state.dragStart = { x: ORB_CENTER_X, y: ORB_CENTER_Y };
  state.pointerMovedSincePress = false;
  state.lockedExpandedPillId = null;
  state.lockedExpandedPillScale = null;
  clearChildHoverTimer();
  state.childHoverCandidateId = null;
  state.childMenuParentId = null;
  state.childMenuPointerLock = null;
  state.openMotionUntil = 0;
  state.closeMotionUntil = 0;
  state.swapTransition = null;
  state.swapResetPending = false;
  state.panSnapPending = false;
  state.pendingDemotedSlotSwap = null;
  state.lastScene = null;
  previousHoveredId = null;
  previousHoveredChildId = null;
  syncedChildSelectionParentId = null;
  syncedChildSelectionId = null;
  clearDirectionalSelectionTimers(childSelectionMotionTimers);
}

function switchBubbleSet(nextSetId) {
  const nextSet = getBubbleSetDefinition(nextSetId);
  if (!nextSet || nextSet.id === state.activeSetId) return;
  state.activeSetId = nextSet.id;
  resetStateForSetSwitch();
  syncSetSwitcherUi();
  buildScene();
  updateMeasuredChildChipWidths();
  render();
}

function bindEvents() {
  refs.shell?.addEventListener('pointerdown', handlePointerDown);
  refs.setPanel?.addEventListener('click', handleSetPanelClick);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerRelease);
  window.addEventListener('pointercancel', handlePointerRelease);
}

function handleSetPanelClick(event) {
  const target = event.target instanceof Element ? event.target.closest('[data-bubble-set-id]') : null;
  if (!target) return;
  switchBubbleSet(target.dataset.bubbleSetId || '');
}

function handleKeyDown(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    cycleBubbleHomeAgent(1);
    return;
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    cycleBubbleHomeAgent(-1);
  }
}

function cycleBubbleHomeAgent(step) {
  if (!refs.orb || !step || state.swapTransition?.active) return;
  const currentIndex = BUBBLE_HOME_AGENT_SEQUENCE.indexOf(state.orbAgentId);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeCurrentIndex + step + BUBBLE_HOME_AGENT_SEQUENCE.length) % BUBBLE_HOME_AGENT_SEQUENCE.length;
  const nextId = BUBBLE_HOME_AGENT_SEQUENCE[nextIndex];
  if (nextId === state.orbAgentId) return;
  state.orbAgentId = nextId;
  state.homeOrbContent = createAgentOrbContent(nextId);
  syncBubbleHomeOrbVisual(refs.orb, {
    animate: true,
    switchDirection: step > 0 ? 'right' : 'left',
    switchMotion: 'swipe',
  });
  scheduleRender();
}

function handlePointerDown(event) {
  if (state.swapTransition?.active) return;
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
  state.dragOffset = {
    x: 0,
    y: 0,
    active: true,
  };
  if (refs.shell?.setPointerCapture && event.pointerId != null) {
    try { refs.shell.setPointerCapture(event.pointerId); } catch (_) {}
  }
  scheduleMotionPhaseRender(state.openMotionUntil);
  scheduleRender();
}

function handlePointerMove(event) {
  if (state.swapTransition?.active || !state.isPressed || !refs.shell) return;

  const rect = refs.shell.getBoundingClientRect();
  const scaleX = rect.width / 420;
  const scaleY = rect.height / 420;
  const containerX = (event.clientX - rect.left) / scaleX;
  const containerY = (event.clientY - rect.top) / scaleY;
  const dragOffsetX = containerX - state.dragStart.x;
  const dragOffsetY = containerY - state.dragStart.y;

  state.dragOffset = {
    x: dragOffsetX,
    y: dragOffsetY,
    active: true,
  };
  state.pointerMovedSincePress = state.pointerMovedSincePress || dragOffsetX !== 0 || dragOffsetY !== 0;

  scheduleRender();
}

function handlePointerRelease(event) {
  if (!state.isPressed) return;
  const now = performance.now();
  const releaseScene = computeScene(now);

  if (refs.shell?.releasePointerCapture && event.pointerId != null) {
    try {
      refs.shell.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore capture release errors.
    }
  }

  if (shouldStartBubbleSwap(releaseScene)) {
    startBubbleSwap(releaseScene, now);
    return;
  }

  state.isPressed = false;
  state.openMotionUntil = 0;
  state.closeMotionUntil = now + CLOSE_PHASE_LATCH_MS;
  state.dragOffset = {
    x: 0,
    y: 0,
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

function shouldStartBubbleSwap(scene) {
  if (!scene || state.swapTransition?.active) return false;
  if (scene.hoveredChildId) return false;
  const selectedBubble = scene.bubbles.find((bubble) => bubble.id === scene.hoveredId);
  return Boolean(selectedBubble?.orbPromotionEnabled);
}

function snapshotReleaseBubble(bubble) {
  return {
    ...bubble,
    sourceDiameter: bubble.baseSize * bubble.targetScale,
  };
}

function startBubbleSwap(scene, now) {
  const selectedBubble = scene.bubbles.find((bubble) => bubble.id === scene.hoveredId);
  if (!selectedBubble) return;

  state.isPressed = false;
  state.openMotionUntil = 0;
  state.closeMotionUntil = now + SWAP_SIBLING_DURATION_MS + BUBBLE_STAGGER_TOTAL_MS;
  state.dragOffset = { x: 0, y: 0, active: false };
  state.dragStart = { x: ORB_CENTER_X, y: ORB_CENTER_Y };
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

  const promotedContent = { ...getCurrentSlotContent(selectedBubble.id) };
  const demotedContent = createDemotedOrbSlotContent(state.homeOrbContent);
  const promotedImageScaleCompensation = selectedBubble.graphicKind === 'emoji'
    ? 1
    : (selectedBubble.fill ? (1 / Math.max(selectedBubble.imageScale ?? 1, 0.0001)) : 1);
  state.swapTransition = {
    active: true,
    selectedBubbleId: selectedBubble.id,
    startedAt: now,
    durationMs: SWAP_DURATION_MS,
    siblingDurationMs: SWAP_SIBLING_DURATION_MS,
    highlightFreezeUntil: now + SWAP_HIGHLIGHT_FREEZE_MS,
    panOffset: { ...scene.panOffset },
    demotedCenterStartX: scene.orb?.targetX ?? 0,
    demotedCenterStartY: scene.orb?.targetY ?? 0,
    demotedShellScaleStart: scene.orb?.targetScale ?? 1,
    demotedShellScaleEnd: SWAP_DEMOTED_END_SCALE,
    promotedRootScaleEnd: ORB_BASE_SIZE / selectedBubble.baseSize,
    promotedVisualScaleStart: selectedBubble.hoverExpandsToPill
      ? PILL_HOVER_BUBBLE_SCALE
      : BUBBLE_HOVER_CONTENT_SCALE,
    promotedVisualScaleEnd: BUBBLE_RELEASE_CONTENT_SCALE * (selectedBubble.graphicKind === 'emoji'
      ? (selectedBubble.homeEmojiScale ?? 1)
      : promotedImageScaleCompensation),
    releaseBubbles: scene.bubbles.map(snapshotReleaseBubble),
    promotedContent,
    demotedContent,
    previousHomeOrbContent: { ...state.homeOrbContent },
  };

  scheduleMotionPhaseRender(state.closeMotionUntil);
  scheduleRender();
}

function commitBubbleSwap() {
  const transition = state.swapTransition;
  if (!transition) return;
  state.homeOrbContent = transition.promotedContent;
  state.swapTransition = null;
  state.closeMotionUntil = 0;
  state.swapResetPending = true;
  state.panSnapPending = true;
  state.pendingDemotedSlotSwap = {
    setId: state.activeSetId,
    slotId: transition.selectedBubbleId,
    content: transition.demotedContent,
  };
  clearSwapLayer();
  resetBubbleHomeOrbCenter(refs.orb);
  syncBubbleHomeOrbVisual(refs.orb, { animate: false });
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

function findPromotedReleaseBubble(transition) {
  return transition?.releaseBubbles?.find((bubble) => bubble.id === transition.selectedBubbleId) || null;
}

function computePromotedSwapMotion(transition, promotedBubble, now) {
  if (!transition || !promotedBubble) return null;
  const progress = clamp((now - transition.startedAt) / transition.durationMs, 0, 1);
  const travel = easeInOutCubic(progress);
  const lift = Math.sin(Math.min(progress, 1) * Math.PI) * -8;
  const orbCanvasDestinationX = -transition.panOffset.x;
  const orbCanvasDestinationY = -transition.panOffset.y;
  return {
    progress,
    currentCenterX: interpolate(promotedBubble.targetX, orbCanvasDestinationX, travel),
    currentCenterY: interpolate(promotedBubble.targetY, orbCanvasDestinationY, travel) + lift,
    rootScale: interpolate(promotedBubble.targetScale, transition.promotedRootScaleEnd, travel),
    visualScale: interpolate(transition.promotedVisualScaleStart, transition.promotedVisualScaleEnd, travel),
  };
}

function computeDemotedSwapMotion(transition, now) {
  if (!transition) return null;
  const demotedProgress = easeInOutCubic(clamp((now - transition.startedAt - SWAP_DEMOTED_START_DELAY_MS) / (transition.durationMs - SWAP_DEMOTED_START_DELAY_MS), 0, 1));
  return {
    centerX: transition.demotedCenterStartX ?? 0,
    centerY: transition.demotedCenterStartY ?? 0,
    shellScale: interpolate(
      transition.demotedShellScaleStart ?? 1,
      transition.demotedShellScaleEnd ?? SWAP_DEMOTED_END_SCALE,
      demotedProgress,
    ),
    opacity: 1 - easeOutQuart(clamp((now - transition.startedAt - 30) / 220, 0, 1)),
  };
}

function render() {
  const now = performance.now();
  const swapShouldCommit = Boolean(
    state.swapTransition?.active
    && now >= state.swapTransition.startedAt + state.swapTransition.durationMs
  );

  let scene = computeScene(now);
  const hoverChanged = state.hoveredBubble !== scene.hoveredId || state.hoveredChildBubble !== scene.hoveredChildId;
  if (hoverChanged) {
    if (scene.hoveredId != null && scene.hoveredId !== state.hoveredBubble) playBubbleHoverSound();
    state.hoveredBubble = scene.hoveredId;
    state.hoveredChildBubble = scene.hoveredChildId;
    scene = computeScene(now);
  }
  if (syncChildMenuState(scene.hoveredId)) {
    scene = computeScene(now);
    state.hoveredBubble = scene.hoveredId;
    state.hoveredChildBubble = scene.hoveredChildId;
  }
  const isInitialReveal = state.isPressed && now < state.openMotionUntil;
  const isSwapActive = Boolean(state.swapTransition?.active);
  const isPostSwapReset = state.swapResetPending;
  const demotedSwapMotion = isSwapActive ? computeDemotedSwapMotion(state.swapTransition, now) : null;
  const panTransitionDuration = state.panSnapPending ? '0ms' : '1000ms';

  refs.panLayer.style.transitionDuration = panTransitionDuration;
  refs.panLayer.style.transform =
    `translate(-50%, -50%) translate3d(${format(scene.panOffset.x)}px, ${format(scene.panOffset.y)}px, 0)`;

  syncChildDirectionalSelectionUi(state.childMenuParentId, isSwapActive ? null : scene.hoveredChildId);

  for (const bubble of scene.bubbles) {
    const node = refs.bubbleNodes.get(bubble.id);
    if (!node) continue;
    syncBubbleNodeContent(node, bubble);
    const usesPillInteraction = bubbleSupportsPillExpansion(bubble);

    const isHovered = scene.hoveredId === bubble.id;
    const isPromoting = bubble.swapState === 'promoting';
    const isPromotingDomainPill = isPromoting && bubble.hoverExpandsToPill;
    const isHoverShellActive = (isHovered && !bubble.isPill) || isPromoting;
    const isRoundVisualScaleActive = (isHovered && !usesPillInteraction) || isPromoting;
    const isAppearing = isInitialReveal;
    const isSwapFade = bubble.swapState === 'fade';
    const isSwapHidden = bubble.swapState === 'hidden';
    const isReturning = !isSwapActive && !state.isPressed && now < state.closeMotionUntil;
    const isForcedHiddenReset = isPostSwapReset && !state.isPressed && !isSwapActive;
    const staggerDelay = isSwapFade
      ? (node.index * BUBBLE_STAGGER_STEP_MS)
      : ((isAppearing || isReturning)
      ? (node.index * BUBBLE_STAGGER_STEP_MS)
      : 0);
    const transformDuration = isSwapFade
      ? SWAP_SIBLING_DURATION_MS
      : (isSwapHidden ? 1 : (isAppearing
      ? APPEAR_MOVE_DURATION_MS
      : (isReturning ? DISAPPEAR_MOVE_DURATION_MS : ACTIVE_MOVE_DURATION_MS)));
    const opacityDuration = isSwapFade
      ? SWAP_SIBLING_DURATION_MS
      : (isSwapHidden ? 1 : (isAppearing
      ? FADE_IN_DURATION_MS
      : (isReturning ? FADE_OUT_DURATION_MS : DEFAULT_MOVE_DURATION_MS)));
    const shadowDuration = isSwapFade || isSwapHidden
      ? SWAP_SIBLING_DURATION_MS
      : (isAppearing
      ? FADE_IN_DURATION_MS
      : (isReturning ? FADE_OUT_DURATION_MS : 300));
    const transformEase = isSwapFade
      ? BUBBLE_EXIT_EASE
      : (isSwapHidden
      ? 'linear'
      : (isAppearing
      ? BUBBLE_ENTER_EASE
      : (isReturning ? BUBBLE_EXIT_EASE : 'ease-out')));
    const translateX = bubble.targetX - bubble.baseSize / 2;
    const translateY = bubble.targetY - bubble.baseSize / 2;
    node.root.style.zIndex = String(isPromoting ? 60 : (isHovered ? 50 : bubble.zIndex));
    node.root.style.width = `${format(bubble.targetWidth)}px`;
    node.root.style.height = `${format(bubble.baseSize)}px`;
    const isContextParent = state.childMenuParentId === bubble.id;
    const isDimmed = state.childMenuParentId != null && !isContextParent;
    const anyHovered = scene.hoveredId != null;
    const isHoverDimmed = anyHovered && !isHovered;
    const bubbleOpacity = isDimmed ? CHILD_DIMMED_OPACITY : isHoverDimmed ? 0.6 : 1;
    node.root.style.opacity = isPromoting
      ? '1'
      : state.isPressed
      ? String(bubbleOpacity)
      : (isSwapActive ? '0' : '0');
    if (node.shadowEl) {
      if (isHoverShellActive || isPromoting) {
        node.shadowEl.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.3)';
      } else {
        const isTightHoverShadow = bubble.hoverShadowMode === 'tight';
        const accentShadow = (!usesPillInteraction && isHovered && bubble.haloColor)
          ? (isTightHoverShadow
            ? `0 0 16px 4px ${bubble.haloColor}`
            : `0 0 20px 8px ${bubble.haloColor}`)
          : '';
        node.shadowEl.style.boxShadow = [
          accentShadow,
          isHovered
            ? (isTightHoverShadow
              ? '0 0 28px 12px rgba(0, 0, 0, 0.52)'
              : '0 0 50px 40px rgba(0, 0, 0, 1)')
            : '0 15px 35px -5px rgba(0, 0, 0, 0.3)'
        ].filter(Boolean).join(', ');
      }
    }
    node.root.style.transform =
      `translate3d(${format(translateX)}px, ${format(translateY)}px, 0) scale(${bubble.targetScale.toFixed(4)})`;
    node.root.style.filter = isDimmed
      ? 'brightness(0.42) saturate(0.68)'
      : 'none';
    node.root.style.setProperty('--bubble2-stagger-delay', `${staggerDelay}ms`);
    node.root.style.transitionDelay = `${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms`;
    node.root.style.transitionDuration = isForcedHiddenReset
      ? '0ms, 0ms, 0ms, 0ms, 0ms'
      : isPromoting
      ? '0ms, 0ms, 0ms, 0ms, 0ms'
      : `${transformDuration}ms, 600ms, ${opacityDuration}ms, ${shadowDuration}ms, ${opacityDuration}ms`;
    node.root.style.transitionTimingFunction = isForcedHiddenReset
      ? 'linear, linear, linear, linear, linear'
      : isPromoting
      ? 'linear, linear, linear, linear, linear'
      : `${transformEase}, var(--bubble2-pill-ease), ease-out, ease, ease`;
    node.root.classList.toggle('is-round-hovered', isHoverShellActive);
    node.root.classList.toggle('is-swap-promoting', isPromoting);
    if (node.visual) {
      node.visual.style.transform = `scale(${isPromotingDomainPill ? 1 : (isPromoting ? bubble.promotedVisualScale : (isRoundVisualScaleActive ? BUBBLE_HOVER_CONTENT_SCALE : 1))})`;
    }
    if (node.surfaceChrome) {
      applyBubbleCelestialChrome(
        node.surfaceChrome,
        node.surface,
        CELESTIAL_ORB_PRESET,
        bubble.theme || {},
        {
          width: bubble.targetWidth,
          height: bubble.baseSize,
          radius: bubble.baseSize / 2,
        },
      );
      node.surfaceChrome.style.opacity = (isHovered || isPromoting) ? '1' : '0';
    }
    if (node.hoverShell) {
      applyBubbleHoverShellChrome(node.hoverShell, bubble.theme, orbGeometryForSize(bubble.baseSize));
      node.hoverShell.style.inset = '0';
      node.hoverShell.style.width = '';
      node.hoverShell.style.height = '';
      node.hoverShell.style.opacity = isPromoting ? '1' : '';
      node.hoverShell.style.transform = isPromoting ? 'scale(1)' : '';
    }

    node.iconWrap.style.width = `${bubble.baseSize}px`;
    node.iconWrap.style.height = `${bubble.baseSize}px`;
    node.iconWrap.style.left = '0px';
    node.iconWrap.style.top = '0px';
    node.iconWrap.style.setProperty('--bubble-emoji-size', `${bubble.baseSize * 0.6}px`);
    const pillHoverBubbleScale = usesPillInteraction && isHovered ? PILL_HOVER_BUBBLE_SCALE : 1;
    node.iconWrap.style.transform = isPromotingDomainPill
      ? 'scale(1)'
      : (usesPillInteraction ? 'scale(1)' : `scale(${pillHoverBubbleScale})`);
    node.surface.classList.toggle('is-pill', bubble.isPill || bubble.isExpanded || bubble.hoverExpandsToPill);
    node.surface.classList.toggle('selected', Boolean(node.surfaceChrome) && (isHovered || isPromoting));
    if (!usesPillInteraction) {
      node.surface.classList.toggle('is-hovered', isHovered);
    } else {
      node.surface.classList.remove('is-hovered');
    }
    node.surface.style.opacity = '';

    if (node.pillCopy) {
      const pillContentScale = Math.max((bubble.targetScale ?? 1), 0.0001);
      node.pillCopy.style.left = `${bubble.baseSize + (bubble.pillCopyOffsetX ?? 0)}px`;
      node.pillCopy.style.width = `${bubble.expandedExtraSourceWidth}px`;
      node.pillCopy.style.transitionDuration = bubble.isExpanded ? '' : '0ms';
      node.pillCopy.style.opacity = bubble.isExpanded ? '' : '0';
      node.pillCopy.style.setProperty('--bubble2-title-size', `${18 / pillContentScale}px`);
      node.pillCopy.style.setProperty('--bubble2-subtitle-size', `${16 / pillContentScale}px`);
      node.pillCopy.style.setProperty('--bubble2-pill-gap', `${4 / pillContentScale}px`);
      node.pillCopy.style.setProperty('--pill-text-left-padding', `${(bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING) / pillContentScale}px`);
      node.pillCopy.style.setProperty('--pill-text-right-padding', `${getPillTextRightPadding(bubble) / pillContentScale}px`);
      if (bubble.pillTrailingIcon) {
        node.pillCopy.style.setProperty('--pill-action-size', `${(bubble.pillTrailingIconSize ?? PILL_TRAILING_ICON_SIZE) / pillContentScale}px`);
        node.pillCopy.style.setProperty('--pill-action-right', `${(bubble.pillTrailingIconRight ?? PILL_TRAILING_ICON_RIGHT) / pillContentScale}px`);
      }
      node.pillCopy.classList.toggle('is-expanded', bubble.isExpanded);
    }

    if (node.subIcon) {
      const subIconSize = bubble.subIconSize ?? (bubble.baseSize * 0.38);
      const subIconOffsetX = bubble.subIconOffsetX ?? (bubble.baseSize * 0.6);
      const subIconOffsetY = bubble.subIconOffsetY ?? (bubble.baseSize * 0.6);
      if (node.leadingGroup) {
        const groupLeft = Math.min(0, subIconOffsetX);
        const groupTop = Math.min(0, subIconOffsetY);
        const groupRight = Math.max(bubble.baseSize, subIconOffsetX + subIconSize);
        const groupBottom = Math.max(bubble.baseSize, subIconOffsetY + subIconSize);
        node.leadingGroup.style.left = `${format(groupLeft)}px`;
        node.leadingGroup.style.top = `${format(groupTop)}px`;
        node.leadingGroup.style.width = `${format(groupRight - groupLeft)}px`;
        node.leadingGroup.style.height = `${format(groupBottom - groupTop)}px`;
        node.leadingGroup.style.transform = `scale(${isPromotingDomainPill ? (bubble.promotedVisualScale ?? 1) : pillHoverBubbleScale})`;
        node.iconWrap.style.left = `${format(-groupLeft)}px`;
        node.iconWrap.style.top = `${format(-groupTop)}px`;
        node.subIcon.style.width = `${format(subIconSize)}px`;
        node.subIcon.style.height = `${format(subIconSize)}px`;
        node.subIcon.style.left = `${format(subIconOffsetX - groupLeft)}px`;
        node.subIcon.style.top = `${format(subIconOffsetY - groupTop)}px`;
        node.subIcon.style.transform = 'scale(1)';
      } else {
        node.subIcon.style.width = `${format(subIconSize)}px`;
        node.subIcon.style.height = `${format(subIconSize)}px`;
        node.subIcon.style.left = `${format(subIconOffsetX)}px`;
        node.subIcon.style.top = `${format(subIconOffsetY)}px`;
        node.subIcon.style.transform = `scale(${pillHoverBubbleScale})`;
      }
    } else if (node.leadingGroup) {
      node.leadingGroup.style.left = '0px';
      node.leadingGroup.style.top = '0px';
      node.leadingGroup.style.width = `${bubble.baseSize}px`;
      node.leadingGroup.style.height = `${bubble.baseSize}px`;
      node.leadingGroup.style.transform = `scale(${isPromotingDomainPill ? (bubble.promotedVisualScale ?? 1) : pillHoverBubbleScale})`;
    }
    if (node.leadingGroup) {
      node.leadingGroup.style.opacity = '1';
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

    const chromeEl = node.surface.querySelector('.bubble2-child-selection');
    if (!chromeEl) continue;
    const isDeselecting = node.surface.classList.contains('deselecting');
    node.surface.classList.toggle('is-highlighted', (isHighlighted || isDeselecting) && !node.action.img);
    node.surface.style.setProperty('--g-stage-h', `${height}px`);
    applyBubbleCelestialChrome(
      chromeEl,
      node.surface,
      CELESTIAL_CHIP_PRESET,
    );
    node.content.style.width = `${format(width)}px`;
    node.content.style.height = `${format(height)}px`;
    node.content.style.transform = isChip ? 'scale(1)' : (node.action.img ? 'scale(1)' : 'scale(0.88)');
  }

  if (refs.orb) {
    refs.orb.classList.toggle('is-pressed', state.isPressed);
    refs.orb.style.transitionDuration = (demotedSwapMotion || state.panSnapPending) ? '0ms' : '';
    refs.orb.style.transform = demotedSwapMotion
      ? `translate3d(${format(demotedSwapMotion.centerX)}px, ${format(demotedSwapMotion.centerY)}px, 0)`
      : `translate3d(${format(scene.orb.targetX ?? 0)}px, ${format(scene.orb.targetY ?? 0)}px, 0)`;
    refs.orb.style.opacity = demotedSwapMotion ? format(demotedSwapMotion.opacity) : (isSwapActive ? '0' : '1');
  }

  if (refs.orbVisual) {
    syncBubbleHomeOrbVisual(refs.orb, { animate: false });
    refs.orbVisual.classList.toggle('is-promoted-home', state.homeOrbContent?.kind !== 'agent-orb');
    refs.orbVisual.style.transitionDuration = (demotedSwapMotion || state.panSnapPending || state.swapResetPending)
      ? '0ms'
      : `${state.isPressed ? ORB_PRESSED_DURATION_MS : ORB_IDLE_DURATION_MS}ms`;
    refs.orbVisual.style.transform = `translate3d(0, 0, 0) scale(${(demotedSwapMotion ? demotedSwapMotion.shellScale : scene.orb.targetScale).toFixed(4)})`;
    refs.orbVisual.style.setProperty('--g-stage-h', `${ORB_BASE_SIZE}px`);
    applyBubbleHomeOrbShellChrome(refs.orbVisual, currentBubbleHomeOrbTheme());
  }

  syncSwapLayer(now);
  state.lastScene = scene;

  if (state.swapTransition?.active) {
    scheduleRender();
  }
  if (state.panSnapPending) {
    state.panSnapPending = false;
  }
  if (state.swapResetPending) {
    state.swapResetPending = false;
    if (state.pendingDemotedSlotSwap) {
      const pending = state.pendingDemotedSlotSwap;
      state.slotContentBySetId = {
        ...state.slotContentBySetId,
        [pending.setId]: {
          ...(state.slotContentBySetId[pending.setId] || {}),
          [pending.slotId]: pending.content,
        },
      };
      state.pendingDemotedSlotSwap = null;
      scheduleRender();
    }
  }

  if (swapShouldCommit) {
    commitBubbleSwap();
  }
}

function computeScene(now = performance.now()) {
  if (state.swapTransition?.active) {
    return computeSwapTransitionScene(now);
  }

  const desiredPan = state.isPressed && state.dragOffset.active
    ? { x: state.dragOffset.x, y: state.dragOffset.y }
    : { x: 0, y: 0 };
  const hoverEnabled = state.isPressed && state.pointerMovedSincePress;

  function buildSceneState(centerProbe) {
    const orbFieldNode = state.isPressed
      ? {
        targetX: 0,
        targetY: 0,
        radius: (ORB_BASE_SIZE * 0.8) / 2,
      }
      : null;
    let processedBubbles = getBubblesConfigForSet(state.activeSetId).map((slot) => {
      const bubble = resolveRenderedBubble(slot);
      let depthScale = BUBBLE_MIN_SIZE / bubble.baseSize;
      let dx = 0;
      let dy = 0;
      let visualSize = BUBBLE_MIN_SIZE;

      if (state.isPressed) {
        const fieldMaxSize = bubble.fieldMaxSize ?? BUBBLE_MAX_SIZE;
        const dist = Math.hypot(bubble.x - centerProbe.x, bubble.y - centerProbe.y);
        const factor = Math.max(0, 1 - dist / MAX_DIST);
        const smoothFactor = smoothstep(factor);
        visualSize = BUBBLE_MIN_SIZE + ((fieldMaxSize - BUBBLE_MIN_SIZE) * smoothFactor);
        depthScale = visualSize / bubble.baseSize;

        if (factor > 0) {
          const angle = Math.atan2(bubble.y - centerProbe.y, bubble.x - centerProbe.x);
          const push = smoothFactor * 12;
          dx = Math.cos(angle) * push;
          dy = Math.sin(angle) * push;
        }
      }

      bubble.targetX = state.isPressed ? bubble.x + dx : 0;
      bubble.targetY = state.isPressed ? bubble.y + dy : 0;
      bubble.baseVisualSize = visualSize;
      bubble.currentDepthScale = depthScale;
      bubble.width = bubble.baseSize;
      bubble.height = bubble.baseSize;
      bubble.radius = visualSize / 2;
      bubble.targetScale = state.isPressed ? depthScale : 0.2;
      return bubble;
    });

    if (state.isPressed) {
      resolveBubbleFieldLayout(processedBubbles);
      resolveBubbleOrbFieldLayout(processedBubbles, orbFieldNode);
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

    const hoverState = hoverEnabled
      ? getHoverState(centerProbe, processedBubbles, childNodes, childZone)
      : { bubbleId: null, childId: null };
    let bestHit = hoverState.bubbleId;
    let hoveredChildId = hoverState.childId;

    const hoveredPill = processedBubbles.find((bubble) => bubble.id === bestHit && bubbleSupportsPillExpansion(bubble));
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
        bubbleSupportsPillExpansion(bubble) &&
        state.lockedExpandedPillId === bubble.id &&
        state.lockedExpandedPillScale != null
      ) {
        finalTargetScale = state.lockedExpandedPillScale;
      }
      const expandedExtraSourceWidth = bubbleSupportsPillExpansion(bubble)
        ? bubble.expandedExtraWidth / Math.max(finalTargetScale || 1, 0.0001)
        : 0;
      const isExpanded = state.isPressed
        && isHovered
        && bubbleSupportsPillExpansion(bubble)
        && state.childMenuParentId !== bubble.id;
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

      resolveBubbleOrbFieldLayout(processedBubbles, orbFieldNode);
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
        resolveBubbleOrbFieldLayout(processedBubbles, orbFieldNode, 1);
      }
    }

    return {
      bubbles: processedBubbles,
      children: childNodes,
      childZone,
      hoveredId: bestHit,
      hoveredChildId,
    };
  }

  let panOffset = { ...desiredPan };
  let sceneData = buildSceneState(getCenterProbeForPan(panOffset));

  if (state.isPressed) {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const nextPanOffset = clampPanOffset(desiredPan, sceneData);
      if (Math.abs(nextPanOffset.x - panOffset.x) < 0.01 && Math.abs(nextPanOffset.y - panOffset.y) < 0.01) {
        panOffset = nextPanOffset;
        break;
      }
      panOffset = nextPanOffset;
      sceneData = buildSceneState(getCenterProbeForPan(panOffset));
    }

    sceneData = buildSceneState(getCenterProbeForPan(panOffset));
    const finalPanOffset = clampPanOffset(desiredPan, sceneData);
    if (Math.abs(finalPanOffset.x - panOffset.x) >= 0.01 || Math.abs(finalPanOffset.y - panOffset.y) >= 0.01) {
      panOffset = finalPanOffset;
      sceneData = buildSceneState(getCenterProbeForPan(panOffset));
      panOffset = clampPanOffset(desiredPan, sceneData);
    } else {
      panOffset = finalPanOffset;
    }
  } else {
    panOffset = { x: 0, y: 0 };
  }

  previousHoveredId = sceneData.hoveredId;
  previousHoveredChildId = sceneData.hoveredChildId;

  const orbPressedScale = state.isPressed ? 0.8 : 1;
  let orbOffset = { x: 0, y: 0 };
  const expandedPill = sceneData.bubbles.find((bubble) => bubble.isExpanded);
  if (expandedPill) {
    const initialOrbPush = getExpandedPillRepulsion(
      expandedPill,
      {
        targetX: 0,
        targetY: 0,
        radius: (ORB_BASE_SIZE * orbPressedScale) / 2,
        layoutGap: ORB_PILL_LAYOUT_GAP,
      },
      PILL_REPULSION_INFLUENCE,
    );
    if (initialOrbPush) {
      orbOffset = { ...initialOrbPush };
      const settleOrbPush = getExpandedPillRepulsion(
        expandedPill,
        {
          targetX: orbOffset.x,
          targetY: orbOffset.y,
          radius: (ORB_BASE_SIZE * orbPressedScale) / 2,
          layoutGap: ORB_PILL_LAYOUT_GAP,
        },
        0,
      );
      if (settleOrbPush) {
        orbOffset.x += settleOrbPush.x;
        orbOffset.y += settleOrbPush.y;
      }
    }
  }

  return {
    ...sceneData,
    orb: {
      id: 'orb',
      targetScale: orbPressedScale,
      targetX: orbOffset.x,
      targetY: orbOffset.y,
    },
    panOffset,
  };
}

function computeSwapTransitionScene(now) {
  const transition = state.swapTransition;
  const promotedBubble = findPromotedReleaseBubble(transition);
  const promotedMotion = computePromotedSwapMotion(transition, promotedBubble, now);
  return {
    bubbles: transition.releaseBubbles.map((bubble) => ({
      ...bubble,
      swapState: bubble.id === transition.selectedBubbleId ? 'promoting' : 'fade',
      targetX: bubble.id === transition.selectedBubbleId ? promotedMotion?.currentCenterX ?? bubble.targetX : bubble.targetX,
      targetY: bubble.id === transition.selectedBubbleId ? promotedMotion?.currentCenterY ?? bubble.targetY : bubble.targetY,
      targetScale: bubble.id === transition.selectedBubbleId ? promotedMotion?.rootScale ?? bubble.targetScale : 0.2,
      targetWidth: bubble.id === transition.selectedBubbleId
        ? interpolate(
            bubble.targetWidth ?? bubble.baseSize,
            bubble.baseSize,
            easeInOutCubic(promotedMotion?.progress ?? 0),
          )
        : (bubble.targetWidth ?? bubble.baseSize),
      isExpanded: false,
      expandedExtraSourceWidth: 0,
      promotedVisualScale: bubble.id === transition.selectedBubbleId ? (promotedMotion?.visualScale ?? transition.promotedVisualScaleStart) : 1,
    })),
    children: [],
    childZone: null,
    hoveredId: null,
    hoveredChildId: null,
    orb: {
      id: 'orb',
      targetScale: 1,
    },
    panOffset: transition.panOffset,
  };
}

function clearSwapLayer() {
  refs.swapLayer?.replaceChildren();
}

function syncSwapLayer(now) {
  if (!refs.swapLayer) return;
  clearSwapLayer();
}

function computeShellBloomScale(elapsedMs, startScale) {
  if (elapsedMs <= SWAP_ORB_BLOOM_OVERSHOOT_MS) {
    return interpolate(startScale, 1.04, easeOutBackSoft(clamp(elapsedMs / SWAP_ORB_BLOOM_OVERSHOOT_MS, 0, 1)));
  }
  if (elapsedMs <= SWAP_ORB_BLOOM_SETTLE_MS) {
    return interpolate(1.04, 1, easeOutQuart(clamp((elapsedMs - SWAP_ORB_BLOOM_OVERSHOOT_MS) / (SWAP_ORB_BLOOM_SETTLE_MS - SWAP_ORB_BLOOM_OVERSHOOT_MS), 0, 1)));
  }
  return 1;
}

function createSwapPromotedNode() {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble2-swap-node bubble2-swap-promoted';
  wrapper.innerHTML = `
    <div class="bubble2-swap-orb bubble2-orb-visual g-celestial-orb-visual g-stage-selected-host selected">
      ${renderBubbleOrbShellMarkup()}
    </div>
  `;
  return wrapper;
}

function createSwapDemotedNode() {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble2-swap-node bubble2-swap-demoted';
  wrapper.innerHTML = `
    <div class="bubble2-swap-demoted-shell bubble2-orb-visual g-celestial-orb-visual g-stage-selected-host selected">
      ${renderBubbleOrbShellMarkup()}
    </div>
  `;
  return wrapper;
}

function applySwapOrbTheme(node, theme) {
  if (!node || !theme) return;
  applyBubbleHomeOrbShellChrome(node.querySelector('.bubble2-orb-visual'), theme);
}

function syncSwapOrbContent(node, content) {
  if (!node || !content) return;
  if (content.kind === 'agent-orb') {
    syncAiOrbCenterIcon(node, {
      animate: false,
      id: content.iconId,
      theme: content.theme,
    });
    return;
  }
  if (content.graphicKind === 'emoji') {
    syncAiOrbCenterEmoji(node, {
      animate: false,
      emoji: content.emoji,
      theme: content.theme,
    });
    return;
  }
  syncAiOrbCenterImage(node, {
    animate: false,
    src: content.img,
    alt: content.alt || '',
    theme: content.theme,
  });
}

function getCenterProbeForPan(panOffset) {
  return {
    x: CENTER_PROBE_BASE_X - panOffset.x,
    y: CENTER_PROBE_BASE_Y - panOffset.y,
  };
}

function clampPanOffset(desiredPan, sceneData) {
  const childMenuParent = state.childMenuParentId != null
    ? sceneData.bubbles.find((bubble) => bubble.id === state.childMenuParentId)
    : null;

  if (childMenuParent && sceneData.children.length) {
    return clampBoundsIntoViewport(
      { x: desiredPan.x, y: desiredPan.y },
      getChildBranchBounds(childMenuParent, sceneData.children),
    );
  }

  const expandedPill = sceneData.bubbles.find((bubble) => bubble.isExpanded);
  if (expandedPill) {
    return clampBoundsIntoViewport(
      { x: desiredPan.x, y: desiredPan.y },
      getExpandedPillViewportBounds(expandedPill),
    );
  }

  return { x: desiredPan.x, y: desiredPan.y };
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
  const safeGap = bubble.layoutGap ?? PILL_LAYOUT_GAP;
  const safeDist = bubble.radius + safeGap;
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

function resolveBubbleOrbFieldLayout(bubbles, orbNode, iterations = BUBBLE_LAYOUT_ITERATIONS) {
  if (!orbNode) return;

  for (let iter = 0; iter < iterations; iter += 1) {
    for (const bubble of bubbles) {
      const orbPush = getNodeRepulsion(orbNode, bubble, 0, ORB_FIELD_LAYOUT_GAP);
      if (!orbPush) continue;
      bubble.targetX += orbPush.x;
      bubble.targetY += orbPush.y;
    }
  }
}

function measurePillExtraWidth(bubble) {
  const titleWidth = measureTextWidth(bubble.pillTitle || '', '600 18px "DM Sans"');
  const subtitleWidth = measureTextWidth(bubble.pillSubtitle || '', '400 16px "DM Sans"');
  const leftPadding = bubble.pillTextLeftPadding ?? PILL_TEXT_LEFT_PADDING;
  const rightPadding = getPillTextRightPadding(bubble);
  return Math.ceil(Math.max(titleWidth, subtitleWidth) + leftPadding + rightPadding + 10);
}

function getPillTextRightPadding(bubble) {
  if (bubble.pillTextRightPadding != null) return bubble.pillTextRightPadding;
  if (!bubble.pillTrailingIcon) return PILL_TEXT_RIGHT_PADDING;
  const actionSize = bubble.pillTrailingIconSize ?? PILL_TRAILING_ICON_SIZE;
  const actionRight = bubble.pillTrailingIconRight ?? PILL_TRAILING_ICON_RIGHT;
  return actionRight + actionSize + (bubble.pillActionGap ?? PILL_ACTION_GAP);
}

function measureTextWidth(text, font) {
  if (!textMeasureContext) return text.length * 14;
  textMeasureContext.font = font;
  return textMeasureContext.measureText(text).width;
}

function bubbleSupportsPillExpansion(bubble) {
  return Boolean(bubble?.isPill || bubble?.hoverExpandsToPill);
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
    baseSize: bubble.baseSize ?? BUBBLE_BASE_SIZE,
    fieldMaxSize: bubble.fieldMaxSize ?? BUBBLE_MAX_SIZE,
    expandedExtraWidth: bubbleSupportsPillExpansion(bubble) ? measurePillExtraWidth(bubble) : 0,
  };
}

function createBubbleGraphic(bubble) {
  if (bubble.graphicKind === 'emoji') {
    const emoji = document.createElement('span');
    emoji.className = 'bubble2-icon-emoji';
    emoji.textContent = bubble.emoji || '✨';
    emoji.style.setProperty('--bubble-emoji-scale', String(bubble.emojiScale ?? 1));
    return emoji;
  }
  const image = document.createElement('img');
  image.className = bubble.fill ? 'bubble2-icon is-fill' : 'bubble2-icon is-contain';
  image.src = bubble.img;
  image.alt = bubble.alt || '';
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
    image.src = 'src/assets/spotify-icon.png';
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
  return Boolean(getCurrentSlotContent(id)?.childActions?.length);
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

  if (!CHILD_BUBBLE_TRIGGER_ENABLED) {
    if (state.childMenuParentId != null) {
      state.childMenuParentId = null;
      state.childMenuPointerLock = null;
      state.hoveredChildBubble = null;
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
    state.childMenuPointerLock = null;
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

  if (previousHoveredId === bubble.id && bubbleSupportsPillExpansion(bubble) && state.childMenuParentId !== bubble.id) {
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

function getBubbleBounds(bubble) {
  return getNodeBounds(bubble);
}

function getExpandedPillViewportBounds(bubble) {
  const bounds = getBubbleBounds(bubble);
  return {
    left: bounds.left - EXPANDED_PILL_VIEWPORT_MARGIN_X,
    right: bounds.right + EXPANDED_PILL_VIEWPORT_MARGIN_X,
    top: bounds.top - EXPANDED_PILL_VIEWPORT_MARGIN_Y,
    bottom: bounds.bottom + EXPANDED_PILL_VIEWPORT_MARGIN_Y,
  };
}

function clampBoundsIntoViewport(panOffset, bounds) {
  const viewportLeft = -ORB_CENTER_X;
  const viewportRight = CANVAS_SIZE - ORB_CENTER_X;
  const viewportTop = -ORB_CENTER_Y;
  const viewportBottom = CANVAS_SIZE - ORB_CENTER_Y;
  let panX = panOffset.x;
  let panY = panOffset.y;

  if (bounds.right + panX + PAN_MARGIN_PX > viewportRight) {
    panX = viewportRight - bounds.right - PAN_MARGIN_PX;
  } else if (bounds.left + panX - PAN_MARGIN_PX < viewportLeft) {
    panX = viewportLeft - bounds.left + PAN_MARGIN_PX;
  }

  if (bounds.bottom + panY + PAN_MARGIN_PX > viewportBottom) {
    panY = viewportBottom - bounds.bottom - PAN_MARGIN_PX;
  } else if (bounds.top + panY - PAN_MARGIN_PX < viewportTop) {
    panY = viewportTop - bounds.top + PAN_MARGIN_PX;
  }

  return { x: panX, y: panY };
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

function easeOutQuart(value) {
  const inverse = 1 - value;
  return 1 - (inverse * inverse * inverse * inverse);
}

function easeInOutCubic(value) {
  if (value < 0.5) return 4 * value * value * value;
  const inverse = (-2 * value) + 2;
  return 1 - ((inverse * inverse * inverse) / 2);
}

function easeOutBackSoft(value) {
  const c1 = 1.04;
  const c3 = c1 + 1;
  const x = value - 1;
  return 1 + (c3 * x * x * x) + (c1 * x * x);
}

function interpolate(start, end, progress) {
  return start + ((end - start) * progress);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function format(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, '');
}
