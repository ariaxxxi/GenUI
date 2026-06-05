import { initHandTracking } from './hand-tracking.js';
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
import {
  renderThinkingOrbStreamMarkup,
  setThinkingOrbStreamVisible,
  syncThinkingOrbStreamIcon,
  syncThinkingOrbStreamText,
} from './shared/thinking-orb-stream.js';
import {
  deleteDurableJsonRecord,
  persistDurableJson,
  readDurableJsonRecord,
} from './app-state.js';
import { playSimEarcon } from './sim-panel.js';

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
const CONTROL_BUBBLE_HOVER_SCALE = 1.1;
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
const PILL_TITLE_FONT_SIZE = 20;
const PILL_SUBTITLE_FONT_SIZE = 18;
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
const SWAP_PROMOTED_HANDOFF_DELAY_MS = 0;
const SWAP_PROMOTED_HANDOFF_FADE_MS = 60;
const BUBBLE_HOME_TRANSITION_TEXT_HOLD_MS = 1200;
const BUBBLE_HOME_IDLE_STREAM_GAP_MS = 180;
const BUBBLE_HOME_STREAM_FADE_MS = 180;
const BUBBLE_HOME_INTERRUPT_THINKING_TEXT = 'Reasoning';
const BUBBLE_HOME_THINKING_PILL_ICON_SIZE = 52;
const BUBBLE_HOME_THINKING_PILL_GAP = 10;
const BUBBLE_HOME_THINKING_PILL_PADDING_X = Object.freeze({ left: 14, right: 20 });
const BUBBLE_HOME_THINKING_PILL_MIN_WIDTH = 80;
const BUBBLE_HOME_PROMPT_THINKING_PILL_ICON_SIZE = ORB_BASE_SIZE;
const BUBBLE_HOME_PROMPT_THINKING_PILL_GAP = 0;
const BUBBLE_HOME_PROMPT_THINKING_PILL_PADDING_X = Object.freeze({ left: 0, right: 20 });
const BUBBLE_HOME_THINKING_TEXT_FONT = '500 20px "DM Sans", sans-serif';
const BUBBLE_HOME_PROMPT_THINKING_LOOP_MS = 5000;
const BUBBLE_HOME_PROMPT_TEXT_SWAP_MS = 140;
const LENS_SHIMMER_DURATION_MS = 3000;
const LENS_EXPAND_SHIMMER_DURATION_MS = 2000;
const LENS_FOCUS_SHIMMER_DURATION_MS = 1800;
const LENS_PUNCTURE_SCALE_DURATION_MS = 860;
const LENS_PUNCTURE_FADE_DURATION_MS = 360;
const LENS_PUNCTURE_POP_SCALE = 1.055;
const LENS_PUNCTURE_END_SCALE = 0.5;
const LENS_SET_ID = 'lens';
const LENS_EXPAND_SET_ID = 'lens-expand';
const LENS_FOCUS_SET_ID = 'lens-focus';
const ROW_SET_ID = 'row';
const ROW_AGENT_SEQUENCE = Object.freeze(['stars', 'gemini', 'bixby', 'perplexity']);
const ROW_AGENT_SEQUENCE_WITHOUT_STARS = Object.freeze(['gemini', 'bixby', 'perplexity']);
const ROW_SET_DEFAULT_AGENT_ID = 'stars';
const ROW_SET_DEFAULT_AGENT_ID_WITHOUT_STARS = 'gemini';
const ROW_CAROUSEL_MOVE_DURATION_MS = 760;
const ROW_CAROUSEL_FADE_OUT_DELAY_MS = 760;
const ROW_CAROUSEL_FADE_OUT_DURATION_MS = 320;
const ROW_CAROUSEL_SPACING = 76;
const ROW_CAROUSEL_STAGGER_MS = 70;
const ROW_CAROUSEL_DURATION_MS = ROW_CAROUSEL_FADE_OUT_DELAY_MS
  + ROW_CAROUSEL_FADE_OUT_DURATION_MS
  + (ROW_CAROUSEL_STAGGER_MS * 2);
const ROW_CAROUSEL_HANDOFF_MS = 140;
const AGENT_SET_RETURN_HOLD_MS = 10000;
const AGENT_SET_SPREAD_SLOT_IDS = Object.freeze([1, 2, 8]);
const BUBBLE_BACKGROUND_IMAGE_STORAGE_KEY = 'genui.bubble.background-image.v1';
const BUBBLE_BACKGROUND_VIDEO_STORAGE_KEY = 'genui.bubble.background-video.v1';
const UI_CHROME_HOTKEY = 'h';
const HOME_ORB_HOTKEY = 'd';
const BACKGROUND_VIDEO_HOTKEY = 'p';
const textMeasureContext = document.createElement('canvas').getContext('2d');
const FIGMA_ASSETS = {
  chatgpt: 'src/assets/figma-chatgpt.png',
  gemini:  'src/assets/figma-gemini.png',
  health:  'src/assets/figma-health.png',
  map:     'src/assets/figma-map.png',
  weather: 'src/assets/figma-weather.png',
  note:    'src/assets/figma-note.png',
};
const LENS_HOME_ORB_ASSET = 'assets/app/lens.png';
const BUBBLE_HOME_AGENT_SEQUENCE = Object.freeze(['bixby', 'gemini', 'chatgpt']);
const BUBBLE_HOME_DEFAULT_AGENT_ID = 'bixby';
const PROMPT_SET_DEFAULT_AGENT_ID = 'chatgpt';
const BUBBLE_HOME_PROMPT_THINKING_TEXT = 'Thinking';
const PROFILE_CALL_BADGE_ASSET = 'src/assets/profile-call-badge.png';
const CLAUDE_AGENT_ASSET = 'assets/agents/Claude-ai-icon.png';
const PERPLEXITY_AGENT_ASSET = 'assets/agents/perplexity.png';
const STARS_AGENT_ASSET = 'assets/agents/stars.png';
const BLUE_AGENT_ASSET = 'assets/agents/Blue.png';
const GREEN_AGENT_ASSET = 'assets/agents/green.png';
const ORANGE_AGENT_ASSET = 'assets/agents/orange.png';
const YELLOW_AGENT_ASSET = 'assets/agents/yellow.png';
const CELESTIAL_CHIP_PRESET = celestialSelectedPresetForRenderShape('chip');
const CELESTIAL_ORB_PRESET = celestialSelectedPresetForRenderShape('orb');
const NON_PROMOTABLE_BUBBLE_IDS = new Set([1, 3, 4, 5]);
const CLAUDE_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(255 206 175)',
  blobTopEdge: 'rgb(226 142 92)',
  blobBottomCore: 'rgb(255 230 208)',
  blobBottomEdge: 'rgb(187 110 72)',
});
const PERPLEXITY_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(180 255 246)',
  blobTopEdge: 'rgb(47 173 164)',
  blobBottomCore: 'rgb(230 255 252)',
  blobBottomEdge: 'rgb(21 116 122)',
});
const STARS_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(116 184 255)',
  blobTopEdge: 'rgb(56 124 255)',
  blobBottomCore: 'rgb(206 173 255)',
  blobBottomEdge: 'rgb(126 92 234)',
});
const CHATGPT_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(255 255 255)',
  blobTopEdge: 'rgb(228 235 247)',
  blobBottomCore: 'rgb(255 255 255)',
  blobBottomEdge: 'rgb(214 223 238)',
});
const GEMINI_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(180 214 255)',
  blobTopEdge: 'rgb(95 152 255)',
  blobBottomCore: 'rgb(218 191 255)',
  blobBottomEdge: 'rgb(123 92 255)',
});
const WRITING_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(255 243 158)',
  blobTopEdge: 'rgb(255 212 72)',
  blobBottomCore: 'rgb(255 249 208)',
  blobBottomEdge: 'rgb(222 176 34)',
});
const BUDGET_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(255 204 152)',
  blobTopEdge: 'rgb(255 144 76)',
  blobBottomCore: 'rgb(255 228 194)',
  blobBottomEdge: 'rgb(215 109 39)',
});
const FITNESS_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(146 255 191)',
  blobTopEdge: 'rgb(82 214 134)',
  blobBottomCore: 'rgb(210 255 176)',
  blobBottomEdge: 'rgb(82 176 84)',
});
const TRAVEL_AGENT_THEME = Object.freeze({
  blobTopCore: 'rgb(177 222 255)',
  blobTopEdge: 'rgb(90 164 255)',
  blobBottomCore: 'rgb(210 232 255)',
  blobBottomEdge: 'rgb(48 108 226)',
});
const RESET_APP_THEME = Object.freeze({
  blobTopCore: 'rgb(232 221 203)',
  blobTopEdge: 'rgb(191 173 146)',
  blobBottomCore: 'rgb(222 238 246)',
  blobBottomEdge: 'rgb(146 176 198)',
});
const COFFEE_APP_THEME = Object.freeze({
  blobTopCore: 'rgb(229 199 163)',
  blobTopEdge: 'rgb(191 150 108)',
  blobBottomCore: 'rgb(112 74 49)',
  blobBottomEdge: 'rgb(63 41 27)',
});
const MONSTERA_PROMPT_THEME = Object.freeze({
  blobTopCore: 'rgb(176 199 144)',
  blobTopEdge: 'rgb(118 149 88)',
  blobBottomCore: 'rgb(227 233 218)',
  blobBottomEdge: 'rgb(128 151 106)',
});
const MIX_APP_THEME = Object.freeze({
  blobTopCore: 'rgb(153 221 255)',
  blobTopEdge: 'rgb(89 185 239)',
  blobBottomCore: 'rgb(244 248 255)',
  blobBottomEdge: 'rgb(184 209 235)',
});
const DAY_APP_THEME = Object.freeze({
  blobTopCore: 'rgb(255 214 196)',
  blobTopEdge: 'rgb(255 153 129)',
  blobBottomCore: 'rgb(225 244 250)',
  blobBottomEdge: 'rgb(151 205 223)',
});
const WRITE_APP_THEME = Object.freeze({
  blobTopCore: 'rgb(231 223 207)',
  blobTopEdge: 'rgb(194 181 160)',
  blobBottomCore: 'rgb(135 138 145)',
  blobBottomEdge: 'rgb(86 92 101)',
});
const MUSIC_PROMPT_THEME = Object.freeze({
  blobTopCore: 'rgb(255 220 116)',
  blobTopEdge: 'rgb(255 176 68)',
  blobBottomCore: 'rgb(255 251 232)',
  blobBottomEdge: 'rgb(255 244 204)',
});
const ANDY_PROMPT_THEME = Object.freeze({
  blobTopCore: 'rgb(224 207 188)',
  blobTopEdge: 'rgb(186 154 124)',
  blobBottomCore: 'rgb(97 78 64)',
  blobBottomEdge: 'rgb(49 37 30)',
});
const LAYLA_PROMPT_THEME = Object.freeze({
  blobTopCore: 'rgb(172 236 255)',
  blobTopEdge: 'rgb(97 205 244)',
  blobBottomCore: 'rgb(255 190 150)',
  blobBottomEdge: 'rgb(214 122 78)',
});
const INTERRUPT_WHITE_THEME = Object.freeze({
  blobTopCore: 'rgb(247 249 255)',
  blobTopEdge: 'rgb(228 235 247)',
  blobBottomCore: 'rgb(255 255 255)',
  blobBottomEdge: 'rgb(214 223 238)',
});
const INTERRUPT_RED_THEME = Object.freeze({
  blobTopCore: 'rgb(255 182 182)',
  blobTopEdge: 'rgb(255 112 112)',
  blobBottomCore: 'rgb(255 146 111)',
  blobBottomEdge: 'rgb(209 63 63)',
});
const INTERRUPT_HOME_ORB_THEME = Object.freeze({
  blobTopCore: 'rgb(255 255 255)',
  blobTopEdge: 'rgb(255 255 255)',
  blobBottomCore: 'rgb(255 255 255)',
  blobBottomEdge: 'rgb(255 255 255)',
});
const HOME_ORB_SHELL_PRESET = Object.freeze({
  ...CELESTIAL_ORB_PRESET,
  maskBlur: 10,
  blobBlur: 38,
  blobTopX: -17,
  blobBottomX: 62,
  highlightScale: 40,
  innerGlowBlur: 0,
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

function renderInterruptControlSvg(kind) {
  if (kind === 'pause-fill') {
    return `
      <svg class="bubble2-icon-svg bubble2-icon-svg--pause" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
      </svg>
    `;
  }
  if (kind === 'play-fill') {
    return `
      <svg class="bubble2-icon-svg bubble2-icon-svg--play" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M11.596 8.697 6.233 11.89A1 1 0 0 1 4.75 11.034V4.966a1 1 0 0 1 1.483-.856l5.363 3.193a.8.8 0 0 1 0 1.394"/>
      </svg>
    `;
  }
  if (kind === 'plus') {
    return `
      <svg class="bubble2-icon-svg bubble2-icon-svg--plus" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M8 3.25a.75.75 0 0 1 .75.75v3.25H12a.75.75 0 0 1 0 1.5H8.75V12a.75.75 0 0 1-1.5 0V8.75H4a.75.75 0 0 1 0-1.5h3.25V4A.75.75 0 0 1 8 3.25"/>
      </svg>
    `;
  }
  return `
    <svg class="bubble2-icon-svg bubble2-icon-svg--end" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3.25" y="3.25" width="9.5" height="9.5" rx="2.4" fill="currentColor"/>
    </svg>
  `;
}

function createInterruptControlIconDataUri(kind) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
      ${kind === 'pause-fill'
        ? '<path fill="#FFFFFF" d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>'
        : (kind === 'play-fill'
          ? '<path fill="#FFFFFF" d="M11.596 8.697 6.233 11.89A1 1 0 0 1 4.75 11.034V4.966a1 1 0 0 1 1.483-.856l5.363 3.193a.8.8 0 0 1 0 1.394"/>'
        : (kind === 'plus'
          ? '<path fill="#FFFFFF" d="M8 3.25a.75.75 0 0 1 .75.75v3.25H12a.75.75 0 0 1 0 1.5H8.75V12a.75.75 0 0 1-1.5 0V8.75H4a.75.75 0 0 1 0-1.5h3.25V4A.75.75 0 0 1 8 3.25"/>'
          : '<rect x="3.25" y="3.25" width="9.5" height="9.5" rx="2.4" fill="#FFFFFF"/>'))}
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const PAUSE_CONTROL_ASSET = createInterruptControlIconDataUri('pause-fill');
const PLAY_CONTROL_ASSET = createInterruptControlIconDataUri('play-fill');
const PLUS_CONTROL_ASSET = createInterruptControlIconDataUri('plus');
const END_CONTROL_ASSET = createInterruptControlIconDataUri('end-square');

function renderCelestialSelectionChrome(direction = 'bottom', extraClass = '') {
  const cls = [extraClass, 'g-selection-chrome'].filter(Boolean).join(' ');
  return `<div class="${cls}" data-stage-direction="${direction}" aria-hidden="true"><div class="g-stage-selected-refraction"><div class="g-stage-selected-blob g-stage-selected-blob--top-left"></div><div class="g-stage-selected-blob g-stage-selected-blob--bottom-right"></div></div><div class="g-stage-selected-sharp-pass"><div class="g-stage-selected-sharp-highlight"></div></div><div class="g-stage-selected-accent-rim"></div><div class="g-stage-selected-highlight"></div><div class="g-stage-selected-highlight-mask"><div class="g-stage-selected-highlight-mask-image"></div></div></div>`;
}

function renderBubbleOrbShellMarkup(options = {}) {
  const includeCenter = options.includeCenter !== false;
  return `
    <div class="bubble2-orb-simple-shell" aria-hidden="true"></div>
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function currentBubbleHomeOrbTheme() {
  if (state.activeSetId === 'interrupt') return INTERRUPT_HOME_ORB_THEME;
  return state.homeOrbContent?.theme || getAiOrbIconOption(state.orbAgentId)?.theme || {};
}

function isPromptHomeThinkingActive() {
  return state.activeSetId === 'prompt'
    && Boolean(state.promptHomeThinking)
    && state.homeOrbContent?.kind !== 'agent-orb';
}

function isHomeOrbThinkingModeActive() {
  return state.activeSetId === 'interrupt' || isPromptHomeThinkingActive();
}

function currentBubbleHomeThinkingPillMetrics() {
  if (isPromptHomeThinkingActive()) {
    return {
      iconSize: BUBBLE_HOME_PROMPT_THINKING_PILL_ICON_SIZE,
      gap: BUBBLE_HOME_PROMPT_THINKING_PILL_GAP,
      paddingX: BUBBLE_HOME_PROMPT_THINKING_PILL_PADDING_X,
    };
  }
  return {
    iconSize: BUBBLE_HOME_THINKING_PILL_ICON_SIZE,
    gap: BUBBLE_HOME_THINKING_PILL_GAP,
    paddingX: BUBBLE_HOME_THINKING_PILL_PADDING_X,
  };
}

function applyBubbleHomeOrbShellChrome(hostEl, theme) {
  // Home orb shells use the same static glass treatment as the thinking pill.
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

function syncBubbleHomeOrbVisualStateClasses(visual, content = state.homeOrbContent) {
  if (!visual || !content) return;
  visual.classList.toggle('is-promoted-home-claude', content.iconId === 'claude');
  visual.classList.toggle('is-promoted-home-perplexity', content.iconId === 'perplexity');
  visual.classList.toggle('is-promoted-home-uncropped', Boolean(content.disableCircularImageMask));
  const promotedImageSize = Number(content.homePromotedImageSize);
  const hasPromotedImageSize = Number.isFinite(promotedImageSize) && promotedImageSize > 0;
  visual.classList.toggle('is-promoted-home-large-image', hasPromotedImageSize);
  if (hasPromotedImageSize) {
    visual.style.setProperty('--bubble2-home-promoted-image-size', `${promotedImageSize}px`);
  } else {
    visual.style.removeProperty('--bubble2-home-promoted-image-size');
  }
}

function applyBubbleHoverShellChrome(hostEl, theme, geometryOverride) {
  // Bubble shells use the same static glass treatment as the thinking pill.
}

const APP_BUBBLES_CONFIG = [
  {
    id: 1,
    x: 9,
    y: -122,
    zIndex: 20,
    img: 'src/assets/spotify-album-happiness.jpg',
    fill: true,
    isPill: true,
    hoverExpandsToPill: true,
    pillTitle: 'Happiness',
    pillSubtitle: '1975',
    imageOutlineColor: '#1ED760',
    imageOutlineWidth: 3,
    pillTrailingIcon: 'pause',
    pillTrailingIconColor: '#1ED760',
    pillActionGap: 2,
    subIconKind: 'spotify-badge',
    subIconSize: 42.167,
    subIconOffsetX: 67.83,
    subIconOffsetY: 67.83,
    theme: INTERRUPT_WHITE_THEME,
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
    hoverExpandsToPill: true,
    pillTitle: 'Tony',
    pillSubtitle: 'I love it!',
    theme: INTERRUPT_WHITE_THEME,
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
    hoverExpandsToPill: true,
    pillTitle: 'Lisa',
    pillSubtitle: 'Yesterday',
    theme: INTERRUPT_WHITE_THEME,
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

const PROMPT_BUBBLES_CONFIG = [
  {
    id: 2,
    ...getAppSetSlotLayout(2),
    img: 'assets/app/music.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Make a playlist',
    pillSubtitle: 'Build a focus mix',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    orbPromotionEnabled: true,
    usesSurfaceShell: true,
    theme: MUSIC_PROMPT_THEME,
    haloColor: MUSIC_PROMPT_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 3,
    ...getAppSetSlotLayout(3),
    img: 'assets/app/Andy.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Andy',
    pillSubtitle: 'Sent a voice note',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    orbPromotionEnabled: true,
    usesSurfaceShell: true,
    theme: ANDY_PROMPT_THEME,
    haloColor: ANDY_PROMPT_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 9,
    ...getAppSetSlotLayout(9),
    img: 'assets/app/run.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Fitness',
    pillSubtitle: 'Build a workout plan',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    theme: WRITE_APP_THEME,
    haloColor: WRITE_APP_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 1,
    ...getAppSetSlotLayout(1),
    img: 'assets/app/day.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Day check',
    pillSubtitle: 'Morning brief',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    orbPromotionEnabled: true,
    theme: DAY_APP_THEME,
    haloColor: DAY_APP_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 8,
    ...getAppSetSlotLayout(8),
    img: 'assets/app/reset.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Book a flight',
    pillSubtitle: 'Find the best route',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    theme: RESET_APP_THEME,
    haloColor: RESET_APP_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 5,
    ...getAppSetSlotLayout(5),
    img: 'assets/app/layla.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Layla',
    pillSubtitle: 'Call her back',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    orbPromotionEnabled: true,
    usesSurfaceShell: true,
    theme: LAYLA_PROMPT_THEME,
    haloColor: LAYLA_PROMPT_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 6,
    ...getAppSetSlotLayout(6),
    img: 'assets/app/coffee.png',
    imageScale: 1,
    lockGraphicScaleOnHover: true,
    hoverExpandsToPill: true,
    pillTitle: 'Monstera care',
    pillSubtitle: 'Tips to keep it healthy',
    pillCopyOffsetX: -10,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    preservePromotedImageScale: true,
    homePromotedImageSize: ORB_BASE_SIZE,
    theme: MONSTERA_PROMPT_THEME,
    haloColor: MONSTERA_PROMPT_THEME.blobTopCore,
    childActions: [],
  },
].map(enrichBubbleMetrics);

const LENS_TITLES_BY_SLOT_ID = Object.freeze({
  1: 'Shopping Lens',
  2: 'Music Lens',
  3: 'Golf Lens',
  5: 'Dog Walking Lens',
  6: 'Nature Lens',
  8: 'Travel Lens',
  9: 'Hiking Lens',
});

const LENS_SUBTITLES_BY_SLOT_ID = Object.freeze({
  1: 'Shopping finds',
  2: 'Fresh mixes',
  3: 'Better form',
  5: 'Routes and routines',
  6: 'Nature care',
  8: 'Local finds',
  9: 'Trail guides',
});

const LENS_CAROUSEL_SEQUENCE = Object.freeze([2, 3, 8, 5, 6, 1, 9]);

const LENS_IMAGE_BY_SLOT_ID = Object.freeze({
  1: 'assets/app/camera.png',
  3: 'assets/app/golf.png',
});

const LENS_THEME_BY_SLOT_ID = Object.freeze({
  1: Object.freeze({
    blobTopCore: 'rgb(238 244 255)',
    blobTopEdge: 'rgb(170 190 220)',
    blobBottomCore: 'rgb(255 255 255)',
    blobBottomEdge: 'rgb(105 120 145)',
  }),
  3: Object.freeze({
    blobTopCore: 'rgb(96 128 64)',
    blobTopEdge: 'rgb(64 96 48)',
    blobBottomCore: 'rgb(80 112 64)',
    blobBottomEdge: 'rgb(32 48 32)',
  }),
  5: Object.freeze({
    blobTopCore: 'rgb(255 214 77)',
    blobTopEdge: 'rgb(255 184 46)',
    blobBottomCore: 'rgb(255 242 146)',
    blobBottomEdge: 'rgb(188 132 16)',
  }),
});

const LENS_BUBBLES_CONFIG = PROMPT_BUBBLES_CONFIG.map((bubble) => {
  const title = LENS_TITLES_BY_SLOT_ID[bubble.id] || 'Topic';
  const subtitle = LENS_SUBTITLES_BY_SLOT_ID[bubble.id] || 'Curated related content';
  const img = LENS_IMAGE_BY_SLOT_ID[bubble.id] || bubble.img;
  const theme = LENS_THEME_BY_SLOT_ID[bubble.id] || bubble.theme;
  return {
    ...bubble,
    img,
    label: title,
    pillTitle: title,
    pillSubtitle: subtitle,
    theme,
    haloColor: haloColorForTheme(theme),
  };
});

const ROW_AGENT_OPTIONS = Object.freeze({
  stars: Object.freeze({
    id: 'stars',
    label: 'Stars',
    src: STARS_AGENT_ASSET,
    theme: STARS_AGENT_THEME,
  }),
  gemini: getAiOrbIconOption('gemini'),
  bixby: getAiOrbIconOption('bixby'),
  perplexity: Object.freeze({
    id: 'perplexity',
    label: 'Perplexity',
    src: PERPLEXITY_AGENT_ASSET,
    theme: PERPLEXITY_AGENT_THEME,
  }),
});

function getAppSetSlotLayout(slotId) {
  const slot = APP_BUBBLES_CONFIG.find((bubble) => bubble.id === slotId);
  if (!slot) {
    return {
      baseSize: APP_SET_BUBBLE_BASE_SIZE,
      fieldMaxSize: BUBBLE_MAX_SIZE,
      x: 0,
      y: 0,
      zIndex: 10,
    };
  }
  return {
    baseSize: slot.baseSize,
    fieldMaxSize: slot.fieldMaxSize,
    x: slot.x,
    y: slot.y,
    zIndex: slot.zIndex,
  };
}

const AGENT_BUBBLES_CONFIG = [
  {
    id: 1,
    ...getAppSetSlotLayout(1),
    label: 'Claude',
    img: CLAUDE_AGENT_ASSET,
    fill: false,
    imageScale: 0.72,
    hoverExpandsToPill: true,
    pillTitle: 'Claude',
    pillSubtitle: 'Reason deeply',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: CLAUDE_AGENT_THEME,
    haloColor: CLAUDE_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 3,
    ...getAppSetSlotLayout(3),
    label: 'Travel Agent',
    img: BLUE_AGENT_ASSET,
    imageScale: 0.72,
    disableCircularImageMask: true,
    hoverExpandsToPill: true,
    pillTitle: 'Travel Agent',
    pillSubtitle: 'Plan trips',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: TRAVEL_AGENT_THEME,
    haloColor: TRAVEL_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 9,
    ...getAppSetSlotLayout(9),
    label: 'Writing Agent',
    img: YELLOW_AGENT_ASSET,
    imageScale: 0.72,
    disableCircularImageMask: true,
    hoverExpandsToPill: true,
    pillTitle: 'Writing Agent',
    pillSubtitle: 'Polish writing',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: WRITING_AGENT_THEME,
    haloColor: WRITING_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 2,
    ...getAppSetSlotLayout(2),
    label: 'ChatGPT',
    img: FIGMA_ASSETS.chatgpt,
    fill: false,
    imageScale: 0.72,
    hoverExpandsToPill: true,
    pillTitle: 'ChatGPT',
    pillSubtitle: 'Ask anything',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: CHATGPT_AGENT_THEME,
    haloColor: CHATGPT_AGENT_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 8,
    ...getAppSetSlotLayout(8),
    label: 'Gemini',
    img: FIGMA_ASSETS.gemini,
    fill: false,
    imageScale: 0.72,
    hoverExpandsToPill: true,
    pillTitle: 'Gemini',
    pillSubtitle: 'Search and reason',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: GEMINI_AGENT_THEME,
    haloColor: GEMINI_AGENT_THEME.blobTopCore,
    childActions: [],
  },
  {
    id: 5,
    ...getAppSetSlotLayout(5),
    label: 'Fitness Agent',
    img: GREEN_AGENT_ASSET,
    imageScale: 0.72,
    disableCircularImageMask: true,
    hoverExpandsToPill: true,
    pillTitle: 'Fitness Agent',
    pillSubtitle: 'Train smart',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: FITNESS_AGENT_THEME,
    haloColor: FITNESS_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 6,
    ...getAppSetSlotLayout(6),
    label: 'Budget Agent',
    img: ORANGE_AGENT_ASSET,
    imageScale: 0.72,
    disableCircularImageMask: true,
    hoverExpandsToPill: true,
    pillTitle: 'Budget Agent',
    pillSubtitle: 'Track spending',
    pillCopyOffsetX: -12,
    pillTextLeftPadding: 2,
    pillTextRightPadding: 18,
    theme: BUDGET_AGENT_THEME,
    haloColor: BUDGET_AGENT_THEME.blobTopCore,
    orbPromotionEnabled: true,
    childActions: [],
  },
].map(enrichBubbleMetrics);

const INTERRUPT_BUBBLES_CONFIG = [
  {
    id: 1,
    ...getAppSetSlotLayout(1),
    label: 'Pause',
    graphicKind: 'interrupt-control',
    controlIcon: 'pause-fill',
    img: PAUSE_CONTROL_ASSET,
    controlAction: 'pause-session',
    controlToggleMode: 'pause-play',
    theme: INTERRUPT_WHITE_THEME,
    haloColor: '#ffffff',
    usesSurfaceShell: true,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 2,
    ...getAppSetSlotLayout(2),
    label: 'End',
    graphicKind: 'interrupt-control',
    controlIcon: 'end-square',
    img: END_CONTROL_ASSET,
    theme: INTERRUPT_RED_THEME,
    haloColor: INTERRUPT_RED_THEME.blobTopCore,
    usesSurfaceShell: true,
    orbPromotionEnabled: true,
    childActions: [],
  },
  {
    id: 8,
    ...getAppSetSlotLayout(8),
    label: 'Add',
    graphicKind: 'interrupt-control',
    controlIcon: 'plus',
    img: PLUS_CONTROL_ASSET,
    theme: BUBBLE_HOME_SLOT_THEMES[8],
    haloColor: '#A391FB',
    usesSurfaceShell: true,
    orbPromotionEnabled: true,
    childActions: [],
  },
].map(enrichBubbleMetrics);

const BUBBLE_SET_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'app',
    label: 'App',
    defaultBaseSize: APP_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: BUBBLE_HOME_DEFAULT_AGENT_ID,
    slots: APP_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: 'prompt',
    label: 'Prompt',
    defaultBaseSize: APP_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: PROMPT_SET_DEFAULT_AGENT_ID,
    slots: PROMPT_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: LENS_SET_ID,
    label: 'Lens',
    defaultBaseSize: APP_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: PROMPT_SET_DEFAULT_AGENT_ID,
    slots: LENS_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: LENS_EXPAND_SET_ID,
    label: 'Lens - Expand',
    defaultBaseSize: APP_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: PROMPT_SET_DEFAULT_AGENT_ID,
    slots: LENS_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: LENS_FOCUS_SET_ID,
    label: 'Lens - Focus',
    defaultBaseSize: APP_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: PROMPT_SET_DEFAULT_AGENT_ID,
    slots: LENS_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: ROW_SET_ID,
    label: 'Row',
    defaultBaseSize: AGENT_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: ROW_SET_DEFAULT_AGENT_ID,
    slots: [],
  }),
  Object.freeze({
    id: 'agent',
    label: 'Agent',
    defaultBaseSize: AGENT_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: BUBBLE_HOME_DEFAULT_AGENT_ID,
    slots: AGENT_BUBBLES_CONFIG,
  }),
  Object.freeze({
    id: 'interrupt',
    label: 'Interrupt',
    defaultBaseSize: AGENT_SET_BUBBLE_BASE_SIZE,
    defaultHomeAgentId: PROMPT_SET_DEFAULT_AGENT_ID,
    slots: INTERRUPT_BUBBLES_CONFIG,
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
    label: option.label,
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

function getRowAgentOption(id) {
  const key = Object.prototype.hasOwnProperty.call(ROW_AGENT_OPTIONS, id)
    ? id
    : getDefaultHomeAgentIdForSet(ROW_SET_ID);
  return ROW_AGENT_OPTIONS[key] || ROW_AGENT_OPTIONS[ROW_SET_DEFAULT_AGENT_ID];
}

function getActiveRowAgentSequence() {
  return state.rowStarsHidden ? ROW_AGENT_SEQUENCE_WITHOUT_STARS : ROW_AGENT_SEQUENCE;
}

function getSafeRowAgentId(id = state.orbAgentId) {
  const sequence = getActiveRowAgentSequence();
  return sequence.includes(id) ? id : sequence[0];
}

function createRowAgentOrbContent(id) {
  const option = getRowAgentOption(id);
  return {
    kind: 'agent-orb',
    contentId: `row-agent:${option.id}`,
    sourceSlotId: null,
    label: option.label,
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

function isLensBubbleSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return setId === LENS_SET_ID || setId === LENS_EXPAND_SET_ID || setId === LENS_FOCUS_SET_ID;
}

function isRowBubbleSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return setId === ROW_SET_ID;
}

function isLensExpandBubbleSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return setId === LENS_EXPAND_SET_ID;
}

function isLensFocusBubbleSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return setId === LENS_FOCUS_SET_ID;
}

function lensShimmerModeForSet(setId = DEFAULT_BUBBLE_SET_ID) {
  if (isLensExpandBubbleSet(setId)) return 'expand';
  if (isLensFocusBubbleSet(setId)) return 'focus';
  return 'slice';
}

function lensShimmerDurationForMode(mode = 'slice') {
  if (mode === 'expand') return LENS_EXPAND_SHIMMER_DURATION_MS;
  if (mode === 'focus') return LENS_FOCUS_SHIMMER_DURATION_MS;
  return LENS_SHIMMER_DURATION_MS;
}

function createHomeOrbAgentContentForSet(agentId, setId = state.activeSetId) {
  if (isRowBubbleSet(setId)) return createRowAgentOrbContent(agentId);
  const content = createAgentOrbContent(agentId);
  if (!isLensBubbleSet(setId) || agentId !== PROMPT_SET_DEFAULT_AGENT_ID) return content;
  return {
    ...content,
    img: LENS_HOME_ORB_ASSET,
    alt: 'Lens orb icon',
  };
}

function hasCustomAgentOrbImage(content) {
  if (content?.kind !== 'agent-orb') return false;
  const defaultSrc = getAiOrbIconOption(content.iconId)?.src || '';
  return Boolean(content.img) && content.img !== defaultSrc;
}

function createDemotedOrbSlotContent(homeOrbContent) {
  if (Number.isFinite(homeOrbContent?.sourceSlotId)) {
    const sourceSlot = findBubbleSlotById(homeOrbContent.sourceSlotId, state.activeSetId);
    if (sourceSlot) return createBaseSlotContent(sourceSlot);
  }
  const usesSurfaceShell = Boolean(
    homeOrbContent?.usesSurfaceShell
    || (state.activeSetId === 'agent'
      && homeOrbContent?.kind === 'agent-orb'
      && homeOrbContent?.iconId === 'bixby')
  );
  return {
    kind: 'demoted-orb-bubble',
    contentId: `demoted:${homeOrbContent.contentId}`,
    sourceSlotId: null,
    label: homeOrbContent.label || '',
    graphicKind: homeOrbContent.graphicKind || 'image',
    controlAction: homeOrbContent.controlAction || '',
    emoji: homeOrbContent.emoji || '',
    emojiScale: homeOrbContent.emojiScale ?? 1,
    homeEmojiScale: homeOrbContent.homeEmojiScale ?? 1,
    img: homeOrbContent.img,
    alt: homeOrbContent.alt || '',
    fill: false,
    imageScale: homeOrbContent.fieldImageScale ?? 0.96,
    disableCircularImageMask: Boolean(homeOrbContent.disableCircularImageMask),
    isPill: false,
    hoverExpandsToPill: false,
    controlIcon: homeOrbContent.controlIcon || '',
    usesSurfaceShell,
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

let interruptSessionPaused = false;

function resolveInterruptPrimaryControlState(slot) {
  if (slot?.controlToggleMode !== 'pause-play') return null;
  if (interruptSessionPaused) {
    return {
      label: 'Play',
      controlIcon: 'play-fill',
      img: PLAY_CONTROL_ASSET,
      controlAction: 'play-session',
    };
  }
  return {
    label: 'Pause',
    controlIcon: 'pause-fill',
    img: PAUSE_CONTROL_ASSET,
    controlAction: 'pause-session',
  };
}

function createBaseSlotContent(slot, setId = state.activeSetId) {
  const slotTheme = slot.theme || bubbleSlotThemeForId(slot.id);
  const resolvedPrimaryControl = setId === 'interrupt' && slot?.id === 1
    ? resolveInterruptPrimaryControlState(slot)
    : null;
  return {
    kind: 'slot-bubble',
    contentId: `slot:${slot.id}`,
    sourceSlotId: slot.id,
    label: resolvedPrimaryControl?.label || slot.label || slot.pillTitle || '',
    baseSize: slot.baseSize ?? getDefaultBubbleBaseSizeForSet(setId),
    fieldMaxSize: slot.fieldMaxSize ?? BUBBLE_MAX_SIZE,
    graphicKind: slot.graphicKind || 'image',
    controlAction: resolvedPrimaryControl?.controlAction || slot.controlAction || '',
    controlIcon: resolvedPrimaryControl?.controlIcon || slot.controlIcon || '',
    emoji: slot.emoji || '',
    emojiScale: slot.emojiScale ?? 1,
    homeEmojiScale: slot.homeEmojiScale ?? 1,
    img: resolvedPrimaryControl?.img || slot.img,
    alt: '',
    fill: Boolean(slot.fill),
    imageScale: slot.imageScale ?? (slot.fill ? 1 : 0.72),
    disableCircularImageMask: Boolean(slot.disableCircularImageMask),
    isPill: Boolean(slot.isPill),
    hoverExpandsToPill: Boolean(slot.hoverExpandsToPill),
    usesSurfaceShell: Boolean(slot.usesSurfaceShell),
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
    preservePromotedImageScale: Boolean(slot.preservePromotedImageScale),
    homePromotedImageSize: slot.homePromotedImageSize,
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

function getDefaultHomeAgentIdForSet(setId = DEFAULT_BUBBLE_SET_ID) {
  if (isRowBubbleSet(setId) && state?.rowStarsHidden) return ROW_SET_DEFAULT_AGENT_ID_WITHOUT_STARS;
  return getBubbleSetDefinition(setId)?.defaultHomeAgentId || BUBBLE_HOME_DEFAULT_AGENT_ID;
}

function getBubblesConfigForSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return getBubbleSetDefinition(setId)?.slots || [];
}

function getDefaultBubbleBaseSizeForSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return getBubbleSetDefinition(setId)?.defaultBaseSize || BUBBLE_BASE_SIZE;
}

function isAgentStyleBubbleSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return setId === 'agent' || setId === 'interrupt';
}

function isPromptLikeBubbleSet(setId = DEFAULT_BUBBLE_SET_ID) {
  return setId === 'prompt' || isLensBubbleSet(setId);
}

function getBubbleSetControlDefaults(setId = DEFAULT_BUBBLE_SET_ID) {
  return { viewportPanEnabled: true, canvaslessEnabled: true };
}

function getBubbleSetSequence(setId = DEFAULT_BUBBLE_SET_ID) {
  if (isLensBubbleSet(setId)) return LENS_CAROUSEL_SEQUENCE;
  return getBubblesConfigForSet(setId).map((bubble) => bubble.id);
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
  if (setId === 'interrupt' && slotId === 1) {
    return createBaseSlotContent(findBubbleSlotById(slotId, setId), setId);
  }
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
  ...getBubbleSetControlDefaults(DEFAULT_BUBBLE_SET_ID),
  backgroundImageEnabled: true,
  backgroundImage: {
    src: 'assets/bg/park.jpg',
    objectUrl: '',
    name: 'park image',
  },
  backgroundImageAlpha: 0.8,
  backgroundVideo: null,
  backgroundVideoPaused: false,
  backgroundVideoProgress: 0,
  backgroundVideoAlpha: 0.8,
  backgroundVideoX: 0,
  canvasX: 0,
  canvasY: 0,
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
  lastPointerClient: null,
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
  homeOrbVisible: true,
  homeOrbContent: createAgentOrbContent(BUBBLE_HOME_DEFAULT_AGENT_ID),
  promptHomeThinking: false,
  promptHomeThinkingAnimating: false,
  promptHomeThinkingTimer: null,
  rowStarsHidden: false,
  slotContentBySetId: createInitialSlotContentMaps(),
  swapTransition: null,
  swapResetPending: false,
  panSnapPending: false,
  pendingDemotedSlotSwap: null,
  promotedHandoffGhost: null,
  rowTransition: null,
  rowHandoffUntil: 0,
  agentSetReturnTimer: null,
  agentSetReturnTriggered: false,
  agentSetReturnPhase: '',
  lensShimmerUntil: 0,
  lensShimmerMode: 'slice',
  lastScene: null,
  renderQueued: false,
  uiChromeHidden: false,
};

const bubbleHomeStreamState = {
  streamToken: 0,
  currentText: '',
  currentCursor: null,
  idleLoopToken: 0,
  idleLoopActive: false,
  idleLoopTimer: null,
  promptLoopTimer: null,
  textSwapTimer: null,
  promptPhraseIndex: 0,
  fadeTimer: null,
  lensToastTimer: null,
};

let previousHoveredId = null;
let previousHoveredChildId = null;
let syncedChildSelectionParentId = null;
let syncedChildSelectionId = null;
const childSelectionMotionTimers = new Map();

const refs = {
  stage: document.querySelector('[data-bubble2-stage]'),
  shell: document.querySelector('[data-bubble2-shell]'),
  controlPanel: document.querySelector('[data-bubble2-control-panel]'),
  setPanel: document.querySelector('[data-bubble2-set-panel]'),
  rowSettings: document.querySelector('[data-bubble2-row-settings]'),
  rowHideStarsToggle: document.querySelector('[data-bubble2-row-hide-stars-toggle]'),
  orbReset: document.querySelector('[data-bubble2-orb-reset]'),
  viewportPanToggle: document.querySelector('[data-bubble2-viewport-pan-toggle]'),
  handToggle: document.querySelector('[data-bubble2-hand-toggle]'),
  handState: document.querySelector('[data-bubble2-hand-state]'),
  handRatio: document.querySelector('[data-bubble2-hand-ratio]'),
  handRatioState: document.querySelector('[data-bubble2-hand-ratio-state]'),
  canvaslessToggle: document.querySelector('[data-bubble2-canvasless-toggle]'),
  canvasX: document.querySelector('[data-bubble2-canvas-x]'),
  canvasXState: document.querySelector('[data-bubble2-canvas-x-state]'),
  canvasY: document.querySelector('[data-bubble2-canvas-y]'),
  canvasYState: document.querySelector('[data-bubble2-canvas-y-state]'),
  homeOrbToggle: document.querySelector('[data-bubble2-home-orb-toggle]'),
  bgImage: document.querySelector('[data-bubble2-bg-image]'),
  bgImageToggle: document.querySelector('[data-bubble2-bg-image-toggle]'),
  bgImageUpload: document.querySelector('[data-bubble2-bg-image-upload]'),
  bgImageReset: document.querySelector('[data-bubble2-bg-image-reset]'),
  bgImageState: document.querySelector('[data-bubble2-bg-image-state]'),
  bgImageAlpha: document.querySelector('[data-bubble2-bg-image-alpha]'),
  bgVideo: document.querySelector('[data-bubble2-bg-video]'),
  bgVideoUpload: document.querySelector('[data-bubble2-bg-video-upload]'),
  bgVideoReset: document.querySelector('[data-bubble2-bg-video-reset]'),
  bgVideoState: document.querySelector('[data-bubble2-bg-video-state]'),
  bgVideoControls: document.querySelector('[data-bubble2-bg-video-controls]'),
  bgVideoPlayToggle: document.querySelector('[data-bubble2-bg-video-play-toggle]'),
  bgVideoProgress: document.querySelector('[data-bubble2-bg-video-progress]'),
  bgVideoAlpha: document.querySelector('[data-bubble2-bg-video-alpha]'),
  bgVideoX: document.querySelector('[data-bubble2-bg-video-x]'),
  canvasBanner: document.querySelector('[data-bubble2-canvas-banner]'),
  lensToast: document.querySelector('[data-bubble2-lens-toast]'),
  panLayer: document.querySelector('[data-bubble2-pan-layer]'),
  orb: null,
  orbVisual: null,
  orbStream: null,
  orbStreamIcon: null,
  orbStreamText: null,
  rowLayer: null,
  rowAgentNodes: new Map(),
  swapLayer: null,
  bubbleNodes: new Map(),
  childNodes: new Map(),
};

void init();

async function init() {
  if (!refs.stage || !refs.shell || !refs.panLayer) return;

  await hydrateStoredBackgroundMedia();
  syncSetSwitcherUi();
  syncRowSettingsUi();
  syncViewportPanToggleUi();
  syncCanvaslessUi();
  syncCanvasPositionUi();
  syncHomeOrbToggleUi();
  syncBackgroundImageUi();
  syncBackgroundVideoUi();
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
  initHandTracking({
    toggle: refs.handToggle,
    status: refs.handState,
    stage: refs.stage,
    shell: refs.shell,
    controlPanel: refs.controlPanel,
    movementRatioInput: refs.handRatio,
    movementRatioState: refs.handRatioState,
  });
  scheduleInterruptRestingStream(BUBBLE_HOME_IDLE_STREAM_GAP_MS);
}

function buildScene() {
  clearDirectionalSelectionTimers(childSelectionMotionTimers);
  refs.panLayer.replaceChildren();
  refs.bubbleNodes.clear();
  refs.childNodes.clear();
  refs.orb = null;
  refs.orbVisual = null;
  refs.orbStream = null;
  refs.orbStreamIcon = null;
  refs.orbStreamText = null;
  refs.rowLayer = null;
  refs.rowAgentNodes.clear();
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
  refs.orbStream = refs.orb.querySelector('.g-thinking-orb-stream');
  refs.orbStreamIcon = refs.orb.querySelector('[data-thinking-orb-stream-icon]');
  refs.orbStreamText = refs.orb.querySelector('.g-thinking-orb-stream-text');
  fragment.appendChild(refs.orb);
  if (isRowBubbleSet(state.activeSetId)) {
    refs.rowLayer = createRowCarouselLayer();
    fragment.appendChild(refs.rowLayer);
  }
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
    controlAction: bubble.controlAction || '',
    emoji: bubble.emoji || '',
    emojiScale: bubble.emojiScale ?? '',
    img: bubble.img || '',
    fill: Boolean(bubble.fill),
    imageScale: bubble.imageScale ?? '',
    disableCircularImageMask: Boolean(bubble.disableCircularImageMask),
    isPill: Boolean(bubble.isPill),
    hoverExpandsToPill: Boolean(bubble.hoverExpandsToPill),
    usesSurfaceShell: Boolean(bubble.usesSurfaceShell),
    controlIcon: bubble.controlIcon || '',
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
  surface.className = `bubble2-surface${(bubble.hoverExpandsToPill || bubble.usesSurfaceShell) ? ' g-stage-selected-host' : ''}`;
  let surfaceChrome = null;
  let surfaceShell = null;

  if (!bubble.isPill && !bubble.hoverExpandsToPill && !bubble.usesSurfaceShell) {
    const hoverShell = document.createElement('div');
    hoverShell.className = 'bubble2-hover-shell';
    hoverShell.setAttribute('aria-hidden', 'true');
    hoverShell.innerHTML = renderBubbleOrbShellMarkup({ includeCenter: false });
    node.inner.appendChild(hoverShell);
    node.hoverShell = hoverShell;
  } else {
    node.hoverShell = null;
  }

  if (usesPillInteraction || bubble.usesSurfaceShell) {
    surfaceShell = document.createElement('div');
    surfaceShell.className = 'bubble2-surface-shell';
    surfaceShell.setAttribute('aria-hidden', 'true');
    surfaceShell.innerHTML = renderBubbleOrbShellMarkup({ includeCenter: false });
    surface.appendChild(surfaceShell);
  }

  if (bubble.hoverExpandsToPill || bubble.usesSurfaceShell) {
    surfaceChrome = createHtmlNode(renderCelestialSelectionChrome('bottom', 'bubble2-surface-selection'));
    surface.appendChild(surfaceChrome);
  }

  const iconWrap = document.createElement('div');
  iconWrap.className = 'bubble2-icon-wrap';
  iconWrap.classList.toggle('is-uncropped', Boolean(bubble.disableCircularImageMask));
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
  node.surfaceShell = surfaceShell;
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
  button.className = `bubble2-orb${state.activeSetId === 'interrupt' ? ' is-interrupt-home-orb' : ''}`;
  button.type = 'button';
  button.setAttribute('aria-label', 'Press and drag to open the bubble field');

  button.insertAdjacentHTML('beforeend', renderThinkingOrbStreamMarkup());

  if (state.activeSetId === 'interrupt') {
    refs.orbStream = button.querySelector('.g-thinking-orb-stream');
    refs.orbStreamIcon = button.querySelector('[data-thinking-orb-stream-icon]');
    refs.orbStreamText = button.querySelector('.g-thinking-orb-stream-text');
    refs.orbStream.classList.remove('hidden');
    syncBubbleHomeThinkingPillText(interruptSessionPaused ? 'Session paused' : BUBBLE_HOME_INTERRUPT_THINKING_TEXT, button);
    syncBubbleHomeThinkingPillIcon(state.homeOrbContent, button);
    return button;
  }

  const visual = document.createElement('div');
  visual.className = 'bubble2-orb-visual';

  visual.innerHTML = renderBubbleOrbShellMarkup();
  button.appendChild(visual);
  syncBubbleHomeOrbVisual(button, { animate: false });

  return button;
}

function createRowCarouselLayer() {
  const layer = document.createElement('div');
  layer.className = 'bubble2-row-carousel';
  layer.setAttribute('aria-hidden', 'true');
  ROW_AGENT_SEQUENCE.forEach((agentId) => {
    const option = getRowAgentOption(agentId);
    const item = document.createElement('div');
    item.className = `bubble2-row-agent${option.id === 'perplexity' ? ' is-perplexity' : ''}`;
    item.dataset.rowAgentId = option.id;
    const image = document.createElement('img');
    image.className = 'bubble2-row-agent-image';
    image.src = option.src;
    image.alt = `${option.label} orb icon`;
    image.draggable = false;
    item.appendChild(image);
    layer.appendChild(item);
    refs.rowAgentNodes.set(option.id, { root: item, image });
  });
  return layer;
}

function removeBubbleHomeStreamCursor() {
  if (!bubbleHomeStreamState.currentCursor) return;
  bubbleHomeStreamState.currentCursor.remove();
  bubbleHomeStreamState.currentCursor = null;
}

function clearBubbleHomeStreamTimers() {
  if (bubbleHomeStreamState.idleLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.idleLoopTimer);
    bubbleHomeStreamState.idleLoopTimer = null;
  }
  if (bubbleHomeStreamState.promptLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.promptLoopTimer);
    bubbleHomeStreamState.promptLoopTimer = null;
  }
  if (bubbleHomeStreamState.textSwapTimer) {
    window.clearTimeout(bubbleHomeStreamState.textSwapTimer);
    bubbleHomeStreamState.textSwapTimer = null;
  }
  if (bubbleHomeStreamState.fadeTimer) {
    window.clearTimeout(bubbleHomeStreamState.fadeTimer);
    bubbleHomeStreamState.fadeTimer = null;
  }
}

function setBubbleHomeStreamVisible(visible) {
  if (!refs.orbStream) return;
  if (visible && bubbleHomeStreamState.fadeTimer) {
    window.clearTimeout(bubbleHomeStreamState.fadeTimer);
    bubbleHomeStreamState.fadeTimer = null;
  }
  setThinkingOrbStreamVisible(refs.orbStream, visible);
}

function clearBubbleHomeStream() {
  removeBubbleHomeStreamCursor();
  bubbleHomeStreamState.currentText = '';
  bubbleHomeStreamState.promptPhraseIndex = 0;
  refs.orbStream?.classList.remove('is-text-transitioning');
  if (refs.orbStreamText) refs.orbStreamText.textContent = '';
}

function stopBubbleHomeStream() {
  bubbleHomeStreamState.idleLoopToken += 1;
  bubbleHomeStreamState.idleLoopActive = false;
  clearBubbleHomeStreamTimers();
  bubbleHomeStreamState.streamToken += 1;
  clearBubbleHomeStream();
  setBubbleHomeStreamVisible(false);
}

function clearLensToast() {
  if (bubbleHomeStreamState.lensToastTimer) {
    window.clearTimeout(bubbleHomeStreamState.lensToastTimer);
    bubbleHomeStreamState.lensToastTimer = null;
  }
  refs.lensToast?.classList.add('is-hidden');
  refs.lensToast?.classList.remove('is-above-orb');
}

function showLensToast(text, options = {}) {
  if (!refs.lensToast) return;
  if (bubbleHomeStreamState.lensToastTimer) {
    window.clearTimeout(bubbleHomeStreamState.lensToastTimer);
    bubbleHomeStreamState.lensToastTimer = null;
  }
  refs.lensToast.textContent = text || 'Lens on';
  refs.lensToast.classList.toggle('is-above-orb', options.placement === 'above-orb');
  refs.lensToast.classList.remove('is-hidden');
  bubbleHomeStreamState.lensToastTimer = window.setTimeout(() => {
    bubbleHomeStreamState.lensToastTimer = null;
    refs.lensToast?.classList.add('is-hidden');
  }, 2000);
}

function getLensOnText(content) {
  const lensName = String(content?.pillTitle || content?.label || 'Lens').trim() || 'Lens';
  return `${lensName.replace(/\s+lens$/i, ' lens')} on`;
}

function startLensFeedback(content, now = performance.now(), options = {}) {
  const lensTheme = content?.theme || {};
  const lensAccent = content?.haloColor
    || lensTheme.blobTopCore
    || lensTheme.blobBottomCore;
  const lensAccentSecondary = lensTheme.blobBottomCore
    || lensTheme.blobTopEdge
    || lensAccent;
  const shimmerMode = ['expand', 'focus'].includes(options.mode) ? options.mode : 'slice';
  state.lensShimmerMode = shimmerMode;
  state.lensShimmerUntil = now + lensShimmerDurationForMode(shimmerMode);
  if (refs.shell) {
    refs.shell.classList.remove('is-lens-firing');
    refs.shell.classList.remove('is-lens-expand-firing');
    refs.shell.classList.remove('is-lens-focus-firing');
    if (lensAccent) refs.shell.style.setProperty('--bubble2-lens-accent', lensAccent);
    if (lensAccentSecondary) refs.shell.style.setProperty('--bubble2-lens-accent-secondary', lensAccentSecondary);
    void refs.shell.offsetWidth;
  }
  showLensToast(getLensOnText(content), options);
  scheduleMotionPhaseRender(state.lensShimmerUntil);
}

function clearPromptHomeThinkingTimer() {
  if (state.promptHomeThinkingTimer) {
    window.clearTimeout(state.promptHomeThinkingTimer);
    state.promptHomeThinkingTimer = null;
  }
}

function stopPromptHomeThinking() {
  state.promptHomeThinking = false;
  state.promptHomeThinkingAnimating = false;
  clearPromptHomeThinkingTimer();
  if (state.activeSetId !== 'interrupt') stopBubbleHomeStream();
}

function activatePromptHomeThinking() {
  const phrases = getPromptThinkingPhrases(state.homeOrbContent);
  state.promptHomeThinking = true;
  state.promptHomeThinkingAnimating = true;
  clearPromptHomeThinkingTimer();
  syncBubbleHomeThinkingPillIcon(state.homeOrbContent);
  bubbleHomeStreamState.promptPhraseIndex = 0;
  void showPersistentBubbleHomeStreamText(phrases[0] || BUBBLE_HOME_PROMPT_THINKING_TEXT, { animate: false });
  scheduleRender();
  state.promptHomeThinkingTimer = window.setTimeout(() => {
    state.promptHomeThinkingTimer = null;
    if (!isPromptHomeThinkingActive()) return;
    state.promptHomeThinkingAnimating = false;
    schedulePromptThinkingLoop(BUBBLE_HOME_PROMPT_THINKING_LOOP_MS);
    scheduleRender();
  }, 24);
}

function getPromptThinkingPhrases(content = state.homeOrbContent) {
  const title = String(content?.pillTitle || content?.label || '').trim().toLowerCase();
  if (title.includes('playlist') || title.includes('music')) {
    return ['Picking songs', 'Balancing energy', 'Saving mix'];
  }
  if (title.includes('andy')) {
    return ['Reading note', 'Pulling details', 'Drafting reply'];
  }
  if (title.includes('day check')) {
    return ['Checking calendar', 'Sorting priorities', 'Writing summary'];
  }
  if (title.includes('hiking')) {
    return ['Finding trails', 'Checking elevation', 'Packing essentials'];
  }
  if (title.includes('fitness')) {
    return ['Planning workout', 'Counting reps', 'Tracking progress'];
  }
  if (title.includes('mood reset')) {
    return ['Reading mood', 'Finding calm', 'Shifting energy'];
  }
  if (title.includes('layla')) {
    return ['Reviewing context', 'Drafting reply', 'Setting reminder'];
  }
  if (title.includes('monstera')) {
    return ['Checking light', 'Watching leaves', 'Watering guide'];
  }
  return ['Thinking', 'Working through', 'Almost ready'];
}

function schedulePromptThinkingLoop(delayMs = BUBBLE_HOME_PROMPT_THINKING_LOOP_MS) {
  if (bubbleHomeStreamState.promptLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.promptLoopTimer);
    bubbleHomeStreamState.promptLoopTimer = null;
  }
  if (!isPromptHomeThinkingActive() || state.isPressed || state.swapTransition?.active || !refs.orbStreamText?.isConnected) return;
  bubbleHomeStreamState.promptLoopTimer = window.setTimeout(() => {
    bubbleHomeStreamState.promptLoopTimer = null;
    if (!isPromptHomeThinkingActive() || state.isPressed || state.swapTransition?.active) return;
    const phrases = getPromptThinkingPhrases(state.homeOrbContent);
    if (!phrases.length) return;
    bubbleHomeStreamState.promptPhraseIndex = (bubbleHomeStreamState.promptPhraseIndex + 1) % phrases.length;
    void showPersistentBubbleHomeStreamText(phrases[bubbleHomeStreamState.promptPhraseIndex], { animate: true });
    schedulePromptThinkingLoop(BUBBLE_HOME_PROMPT_THINKING_LOOP_MS);
  }, delayMs);
}

async function showPersistentBubbleHomeStreamText(text, options = {}) {
  const value = String(text || '').trim();
  if (!value || !refs.orbStreamText) return;
  const animate = options.animate === true;
  bubbleHomeStreamState.idleLoopToken += 1;
  bubbleHomeStreamState.idleLoopActive = false;
  if (bubbleHomeStreamState.idleLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.idleLoopTimer);
    bubbleHomeStreamState.idleLoopTimer = null;
  }
  const token = ++bubbleHomeStreamState.streamToken;
  setBubbleHomeStreamVisible(true);
  removeBubbleHomeStreamCursor();
  if (token !== bubbleHomeStreamState.streamToken) return;
  syncBubbleHomeThinkingPillText(value, refs.orb, { animate });
}

function fadeOutBubbleHomeStream({ clearAfter = true } = {}) {
  bubbleHomeStreamState.idleLoopToken += 1;
  bubbleHomeStreamState.idleLoopActive = false;
  if (bubbleHomeStreamState.idleLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.idleLoopTimer);
    bubbleHomeStreamState.idleLoopTimer = null;
  }
  bubbleHomeStreamState.streamToken += 1;
  removeBubbleHomeStreamCursor();
  setBubbleHomeStreamVisible(false);
  if (!clearAfter) return;
  if (bubbleHomeStreamState.fadeTimer) window.clearTimeout(bubbleHomeStreamState.fadeTimer);
  bubbleHomeStreamState.fadeTimer = window.setTimeout(() => {
    bubbleHomeStreamState.fadeTimer = null;
    if (refs.orbStream?.classList.contains('hidden')) clearBubbleHomeStream();
  }, BUBBLE_HOME_STREAM_FADE_MS);
}

async function waitForBubbleHomeStream(ms, token) {
  await sleep(ms);
  return token === bubbleHomeStreamState.streamToken && Boolean(refs.orbStreamText?.isConnected);
}

function getBubbleHomeContentLabel(content = state.homeOrbContent) {
  if (!content) return '';
  if (content.label) return String(content.label).trim();
  if (content.kind === 'agent-orb') {
    return String(getAiOrbIconOption(content.iconId)?.label || '').trim();
  }
  const slot = Number.isFinite(content.sourceSlotId)
    ? findBubbleSlotById(content.sourceSlotId, state.activeSetId)
    : null;
  return String(slot?.label || slot?.pillTitle || '').trim();
}

async function streamBubbleHomeTransitionText(text) {
  const value = String(text || '').trim();
  if (!value || !refs.orbStreamText) return;
  bubbleHomeStreamState.idleLoopToken += 1;
  bubbleHomeStreamState.idleLoopActive = false;
  if (bubbleHomeStreamState.idleLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.idleLoopTimer);
    bubbleHomeStreamState.idleLoopTimer = null;
  }
  const token = ++bubbleHomeStreamState.streamToken;
  setBubbleHomeStreamVisible(true);
  removeBubbleHomeStreamCursor();
  bubbleHomeStreamState.currentText = value;
  syncBubbleHomeThinkingPillText(value);
  if (!(await waitForBubbleHomeStream(BUBBLE_HOME_TRANSITION_TEXT_HOLD_MS, token))) return;
  if (token !== bubbleHomeStreamState.streamToken) return;
  await showPersistentBubbleHomeStreamText(BUBBLE_HOME_INTERRUPT_THINKING_TEXT);
}

function shouldRunInterruptIdleStream() {
  return state.activeSetId === 'interrupt'
    && !interruptSessionPaused
    && !state.isPressed
    && !state.swapTransition?.active
    && !state.pointerMovedSincePress
    && Boolean(refs.orbStreamText?.isConnected);
}

function scheduleInterruptRestingStream(delayMs = 0) {
  if (bubbleHomeStreamState.idleLoopTimer) {
    window.clearTimeout(bubbleHomeStreamState.idleLoopTimer);
    bubbleHomeStreamState.idleLoopTimer = null;
  }
  if (state.activeSetId !== 'interrupt' || state.isPressed || state.swapTransition?.active) return;
  bubbleHomeStreamState.idleLoopTimer = window.setTimeout(() => {
    bubbleHomeStreamState.idleLoopTimer = null;
    if (state.activeSetId !== 'interrupt' || state.isPressed || state.swapTransition?.active) return;
    if (interruptSessionPaused) {
      void showPersistentBubbleHomeStreamText('Session paused');
      return;
    }
    void runInterruptIdleStreamLoop();
  }, delayMs);
}

async function runInterruptIdleStreamLoop() {
  if (!shouldRunInterruptIdleStream() || bubbleHomeStreamState.idleLoopActive) return;
  const idleToken = ++bubbleHomeStreamState.idleLoopToken;
  bubbleHomeStreamState.idleLoopActive = true;
  if (idleToken === bubbleHomeStreamState.idleLoopToken && shouldRunInterruptIdleStream()) {
    await showPersistentBubbleHomeStreamText(BUBBLE_HOME_INTERRUPT_THINKING_TEXT);
  }
  bubbleHomeStreamState.idleLoopActive = false;
}

function syncBubbleHomeOrbVisual(root = refs.orb, options = {}) {
  if (!root) return;
  const content = state.homeOrbContent;
  if (!content) return;
  if (state.activeSetId === 'interrupt') {
    syncBubbleHomeThinkingPillIcon(content, root);
    return;
  }
  const visual = root?.querySelector?.('.bubble2-orb-visual');
  syncBubbleHomeOrbVisualStateClasses(visual, content);
  if (content.kind === 'agent-orb' && !hasCustomAgentOrbImage(content)) {
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
      switchDirection: options.switchDirection,
      theme: content.theme,
      switchMotion: options.switchMotion || 'fade',
    });
    return;
  }
  syncAiOrbCenterImage(root, {
    animate: options.animate,
    src: content.img,
    alt: content.alt || '',
    switchDirection: options.switchDirection,
    theme: content.theme,
    switchMotion: options.switchMotion || 'fade',
  });
}

function syncBubbleHomeThinkingPillIcon(content = state.homeOrbContent, root = refs.orb) {
  const image = refs.orbStreamIcon || root?.querySelector?.('[data-thinking-orb-stream-icon]');
  if (!image || !content) return;
  const fallback = getAiOrbIconOption(state.orbAgentId);
  const src = String(content.img || fallback?.src || '').trim();
  syncThinkingOrbStreamIcon(image, {
    src,
    alt: String(content.alt || content.label || fallback?.label || ''),
  });
}

function syncBubbleHomeThinkingPillText(text, root = refs.orb, options = {}) {
  const value = String(text || '').trim();
  const stream = refs.orbStream || root?.querySelector?.('.g-thinking-orb-stream');
  const textEl = refs.orbStreamText || root?.querySelector?.('.g-thinking-orb-stream-text');
  if (!value || !stream || !textEl) return;
  const metrics = currentBubbleHomeThinkingPillMetrics();
  syncThinkingOrbStreamText(stream, textEl, value, {
    metrics: {
      ...metrics,
      minWidth: BUBBLE_HOME_THINKING_PILL_MIN_WIDTH,
    },
    font: BUBBLE_HOME_THINKING_TEXT_FONT,
    setText: false,
  });
  if (!options.animate || !bubbleHomeStreamState.currentText || bubbleHomeStreamState.currentText === value) {
    bubbleHomeStreamState.currentText = value;
    textEl.textContent = value;
    stream.classList.remove('is-text-transitioning');
    return;
  }
  if (bubbleHomeStreamState.textSwapTimer) {
    window.clearTimeout(bubbleHomeStreamState.textSwapTimer);
    bubbleHomeStreamState.textSwapTimer = null;
  }
  stream.classList.add('is-text-transitioning');
  const expectedToken = bubbleHomeStreamState.streamToken;
  bubbleHomeStreamState.textSwapTimer = window.setTimeout(() => {
    bubbleHomeStreamState.textSwapTimer = null;
    if (expectedToken !== bubbleHomeStreamState.streamToken) return;
    bubbleHomeStreamState.currentText = value;
    textEl.textContent = value;
    requestAnimationFrame(() => {
      if (expectedToken !== bubbleHomeStreamState.streamToken) return;
      stream.classList.remove('is-text-transitioning');
    });
  }, BUBBLE_HOME_PROMPT_TEXT_SWAP_MS);
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

function syncRowSettingsUi() {
  if (refs.rowSettings) refs.rowSettings.hidden = !isRowBubbleSet(state.activeSetId);
  if (refs.rowHideStarsToggle) refs.rowHideStarsToggle.checked = state.rowStarsHidden;
}

function syncViewportPanToggleUi() {
  if (!refs.viewportPanToggle) return;
  refs.viewportPanToggle.checked = state.viewportPanEnabled;
}

function syncCanvaslessUi() {
  if (refs.canvaslessToggle) refs.canvaslessToggle.checked = state.canvaslessEnabled;
  document.body.classList.toggle('is-canvasless', state.canvaslessEnabled);
  refs.shell?.classList.toggle('is-canvasless', state.canvaslessEnabled);
}

function syncCanvasPositionUi() {
  const canvasX = clamp(Number(state.canvasX) || 0, -1000, 1000);
  const canvasY = clamp(Number(state.canvasY) || 0, -240, 240);
  state.canvasX = canvasX;
  state.canvasY = canvasY;
  if (refs.canvasX) refs.canvasX.value = String(Math.round(canvasX));
  if (refs.canvasXState) refs.canvasXState.textContent = `${Math.round(canvasX)}px`;
  if (refs.canvasY) refs.canvasY.value = String(Math.round(canvasY));
  if (refs.canvasYState) refs.canvasYState.textContent = `${Math.round(canvasY)}px`;
  refs.shell?.style.setProperty('--bubble2-canvas-x', `${canvasX}px`);
  refs.shell?.style.setProperty('--bubble2-canvas-y', `${canvasY}px`);
}

function syncHomeOrbToggleUi() {
  if (!refs.homeOrbToggle) return;
  const visible = state.homeOrbVisible !== false;
  refs.homeOrbToggle.textContent = visible ? 'Dismiss orb' : 'Invoke orb';
  refs.homeOrbToggle.setAttribute('aria-pressed', String(visible));
}

function syncBackgroundImageUi() {
  const enabled = state.backgroundImageEnabled === true;
  const imageAlpha = clamp(Number(state.backgroundImageAlpha ?? 0.8), 0, 1);
  state.backgroundImageAlpha = imageAlpha;
  if (refs.bgImageToggle) refs.bgImageToggle.checked = enabled;
  refs.stage?.classList.toggle('has-bg-image', enabled);
  if (refs.bgImageState) refs.bgImageState.textContent = state.backgroundImage?.name || 'park image';
  if (refs.bgImageAlpha) {
    refs.bgImageAlpha.value = String(Math.round(imageAlpha * 100));
    refs.bgImageAlpha.disabled = !enabled;
  }
  if (refs.bgImage) {
    const src = state.backgroundImage?.src || 'assets/bg/park.jpg';
    refs.bgImage.style.backgroundImage = enabled ? `url("${src}")` : 'none';
    refs.bgImage.style.opacity = enabled ? String(imageAlpha) : '0';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

async function hydrateStoredBackgroundMedia() {
  const [imageRecord, videoRecord] = await Promise.all([
    readDurableJsonRecord(BUBBLE_BACKGROUND_IMAGE_STORAGE_KEY),
    readDurableJsonRecord(BUBBLE_BACKGROUND_VIDEO_STORAGE_KEY),
  ]);
  const image = imageRecord?.value;
  if (typeof image?.src === 'string' && image.src) {
    revokeBackgroundImageObjectUrl(state.backgroundImage);
    state.backgroundImage = {
      src: image.src,
      objectUrl: '',
      name: String(image.name || 'uploaded image'),
    };
    state.backgroundImageAlpha = clamp(Number(image.alpha ?? 0.8), 0, 1);
    state.backgroundImageEnabled = true;
  }
  const video = videoRecord?.value;
  const videoBlob = video?.blob instanceof Blob ? video.blob : null;
  const videoSrc = videoBlob
    ? URL.createObjectURL(videoBlob)
    : (typeof video?.src === 'string' && video.src && !video.src.startsWith('blob:') ? video.src : '');
  if (videoSrc) {
    revokeBackgroundVideoObjectUrl(state.backgroundVideo);
    state.backgroundVideo = {
      src: videoSrc,
      objectUrl: videoBlob ? videoSrc : '',
      name: String(video.name || 'uploaded video'),
      type: String(video.type || ''),
    };
    state.backgroundVideoPaused = video.paused === true;
    state.backgroundVideoProgress = clamp(Number(video.progress) || 0, 0, 1);
    state.backgroundVideoAlpha = clamp(Number(video.alpha ?? 0.8), 0, 1);
    state.backgroundVideoX = clamp(Number(video.x) || 0, -1000, 1000);
  }
}

function persistBackgroundImage() {
  void persistDurableJson(
    BUBBLE_BACKGROUND_IMAGE_STORAGE_KEY,
    {
      src: state.backgroundImage?.src || '',
      name: state.backgroundImage?.name || 'uploaded image',
      alpha: clamp(Number(state.backgroundImageAlpha ?? 0.8), 0, 1),
    },
    { label: 'bubble background image' },
  );
}

async function readStoredBackgroundVideoValue() {
  const record = await readDurableJsonRecord(BUBBLE_BACKGROUND_VIDEO_STORAGE_KEY);
  return record?.value && typeof record.value === 'object' ? record.value : null;
}

function persistBackgroundVideo() {
  if (!state.backgroundVideo?.src) return;
  void (async () => {
    const stored = await readStoredBackgroundVideoValue();
    const currentSrc = String(state.backgroundVideo?.src || '');
    const durableSrc = currentSrc && !currentSrc.startsWith('blob:') ? currentSrc : (stored?.src || '');
    const durableBlob = stored?.blob instanceof Blob ? stored.blob : null;
    if (!durableSrc && !durableBlob) return;
    await persistDurableJson(
      BUBBLE_BACKGROUND_VIDEO_STORAGE_KEY,
      {
        src: durableSrc,
        blob: durableBlob,
        name: state.backgroundVideo.name || 'uploaded video',
        type: state.backgroundVideo.type || '',
        paused: state.backgroundVideoPaused === true,
        progress: clamp(Number(state.backgroundVideoProgress) || 0, 0, 1),
        alpha: clamp(Number(state.backgroundVideoAlpha ?? 0.8), 0, 1),
        x: clamp(Number(state.backgroundVideoX) || 0, -1000, 1000),
      },
      { label: 'bubble background video' },
    );
  })();
}

function revokeBackgroundImageObjectUrl(image) {
  const objectUrl = typeof image?.objectUrl === 'string' ? image.objectUrl : '';
  if (!objectUrl || !objectUrl.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(objectUrl);
  } catch (_) {}
}

function revokeBackgroundVideoObjectUrl(video) {
  const objectUrl = typeof video?.objectUrl === 'string' ? video.objectUrl : '';
  if (!objectUrl || !objectUrl.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(objectUrl);
  } catch (_) {}
}

function syncBackgroundVideoUi() {
  const video = state.backgroundVideo;
  const hasVideo = Boolean(video?.src);
  if (refs.bgVideoState) refs.bgVideoState.textContent = hasVideo ? (video.name || 'loaded') : 'empty';
  refs.stage?.classList.toggle('has-bg-video', hasVideo);
  refs.bgVideoControls?.classList.toggle('is-hidden', !hasVideo);
  if (refs.bgVideoPlayToggle) {
    refs.bgVideoPlayToggle.textContent = state.backgroundVideoPaused ? 'Play' : 'Pause';
    refs.bgVideoPlayToggle.disabled = !hasVideo;
  }
  if (refs.bgVideoProgress) {
    refs.bgVideoProgress.value = String(Math.round(clamp(Number(state.backgroundVideoProgress) || 0, 0, 1) * 1000));
    refs.bgVideoProgress.disabled = !hasVideo;
  }
  const videoAlpha = clamp(Number(state.backgroundVideoAlpha ?? 0.8), 0, 1);
  state.backgroundVideoAlpha = videoAlpha;
  if (refs.bgVideoAlpha) {
    refs.bgVideoAlpha.value = String(Math.round(videoAlpha * 100));
    refs.bgVideoAlpha.disabled = !hasVideo;
  }
  const videoX = clamp(Number(state.backgroundVideoX) || 0, -1000, 1000);
  state.backgroundVideoX = videoX;
  if (refs.bgVideoX) {
    refs.bgVideoX.value = String(Math.round(videoX));
    refs.bgVideoX.disabled = !hasVideo;
  }
  if (!refs.bgVideo) return;
  refs.bgVideo.style.setProperty('--bubble2-bg-video-x', `${videoX}px`);
  refs.bgVideo.style.opacity = hasVideo ? String(videoAlpha) : '0';
  const nextSrc = hasVideo ? String(video.src) : '';
  if (refs.bgVideo.dataset.loadedSrc !== nextSrc) {
    refs.bgVideo.dataset.loadedSrc = nextSrc;
    refs.bgVideo.pause();
    if (nextSrc) refs.bgVideo.src = nextSrc;
    else refs.bgVideo.removeAttribute('src');
    refs.bgVideo.load();
  }
  if (!hasVideo) return;
  const desiredProgress = clamp(Number(state.backgroundVideoProgress) || 0, 0, 1);
  const syncVideoTime = () => {
    if (!Number.isFinite(refs.bgVideo.duration) || refs.bgVideo.duration <= 0) return;
    const targetTime = desiredProgress * refs.bgVideo.duration;
    if (Math.abs(refs.bgVideo.currentTime - targetTime) > 0.1) refs.bgVideo.currentTime = targetTime;
  };
  refs.bgVideo.onloadedmetadata = syncVideoTime;
  if (refs.bgVideo.readyState >= 1) syncVideoTime();
  if (state.backgroundVideoPaused) {
    refs.bgVideo.pause();
    return;
  }
  const playPromise = refs.bgVideo.play?.();
  if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
}

function syncBackgroundVideoProgressUi() {
  if (!refs.bgVideoProgress || !refs.bgVideo || !Number.isFinite(refs.bgVideo.duration) || refs.bgVideo.duration <= 0) return;
  const ratio = clamp(refs.bgVideo.currentTime / refs.bgVideo.duration, 0, 1);
  state.backgroundVideoProgress = ratio;
  if (document.activeElement === refs.bgVideoProgress) return;
  refs.bgVideoProgress.value = String(Math.round(ratio * 1000));
}

function resetStateForSetSwitch() {
  state.promptHomeThinking = false;
  state.promptHomeThinkingAnimating = false;
  clearPromptHomeThinkingTimer();
  stopBubbleHomeStream();
  clearLensToast();
  state.lensShimmerUntil = 0;
  state.lensShimmerMode = 'slice';
  refs.shell?.classList.remove('is-lens-firing');
  refs.shell?.classList.remove('is-lens-expand-firing');
  refs.shell?.classList.remove('is-lens-focus-firing');
  state.isPressed = false;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.dragOffset = { x: 0, y: 0, active: false };
  state.dragStart = { x: ORB_CENTER_X, y: ORB_CENTER_Y };
  state.lastPointerClient = null;
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
  state.rowTransition = null;
  state.rowHandoffUntil = 0;
  clearAgentSetReturnInteraction();
  state.lastScene = null;
  previousHoveredId = null;
  previousHoveredChildId = null;
  syncedChildSelectionParentId = null;
  syncedChildSelectionId = null;
  clearDirectionalSelectionTimers(childSelectionMotionTimers);
}

function clearAgentSetReturnTimer() {
  if (state.agentSetReturnTimer) {
    window.clearTimeout(state.agentSetReturnTimer);
    state.agentSetReturnTimer = null;
  }
}

function clearAgentSetReturnInteraction() {
  clearAgentSetReturnTimer();
  state.agentSetReturnTriggered = false;
  state.agentSetReturnPhase = '';
}

function resetAgentSetToDefaults() {
  state.promptHomeThinking = false;
  state.promptHomeThinkingAnimating = false;
  clearPromptHomeThinkingTimer();
  state.slotContentBySetId = {
    ...state.slotContentBySetId,
    agent: createInitialSlotContentMap('agent'),
  };
  state.orbAgentId = BUBBLE_HOME_DEFAULT_AGENT_ID;
  state.homeOrbContent = createHomeOrbAgentContentForSet(BUBBLE_HOME_DEFAULT_AGENT_ID, 'agent');
  state.pendingDemotedSlotSwap = null;
  state.panSnapPending = false;
  state.swapResetPending = false;
  syncBubbleHomeOrbVisual(refs.orb, { animate: false });
}

function resetActiveSetOrbToDefaults() {
  const activeSetId = state.activeSetId;
  if (!getBubbleSetDefinition(activeSetId)) return;
  resetStateForSetSwitch();
  clearSwapLayer();
  if (activeSetId === 'interrupt') interruptSessionPaused = false;
  state.slotContentBySetId = {
    ...state.slotContentBySetId,
    [activeSetId]: createInitialSlotContentMap(activeSetId),
  };
  state.orbAgentId = getDefaultHomeAgentIdForSet(activeSetId);
  state.homeOrbContent = createHomeOrbAgentContentForSet(state.orbAgentId, activeSetId);
  state.homeOrbVisible = true;
  syncBubbleHomeOrbVisual(refs.orb, { animate: false });
  syncSetSwitcherUi();
  syncRowSettingsUi();
  syncHomeOrbToggleUi();
  buildScene();
  updateMeasuredChildChipWidths();
  render();
}

function handleAgentSetReturnLongPress() {
  if (!state.isPressed || state.activeSetId !== 'agent' || state.swapTransition?.active) return;
  const now = performance.now();
  clearAgentSetReturnTimer();
  state.isPressed = false;
  state.openMotionUntil = 0;
  state.closeMotionUntil = now + CLOSE_PHASE_LATCH_MS;
  state.agentSetReturnTriggered = true;
  state.agentSetReturnPhase = 'closing';
  state.dragOffset = { x: 0, y: 0, active: false };
  state.dragStart = { x: ORB_CENTER_X, y: ORB_CENTER_Y };
  state.lastPointerClient = null;
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
  window.setTimeout(() => {
    if (!state.agentSetReturnTriggered || state.agentSetReturnPhase !== 'closing' || state.activeSetId !== 'agent' || state.swapTransition?.active) return;
    const reopenNow = performance.now();
    resetAgentSetToDefaults();
    state.isPressed = true;
    state.openMotionUntil = reopenNow + OPEN_PHASE_LATCH_MS;
    state.closeMotionUntil = 0;
    state.agentSetReturnPhase = 'reopening';
    state.dragOffset = { x: 0, y: 0, active: true };
    state.dragStart = { x: ORB_CENTER_X, y: ORB_CENTER_Y };
    state.lastPointerClient = null;
    state.pointerMovedSincePress = false;
    scheduleMotionPhaseRender(state.openMotionUntil);
    scheduleRender();
  }, CLOSE_PHASE_LATCH_MS);
  scheduleRender();
}

function scheduleAgentSetReturnLongPress() {
  clearAgentSetReturnTimer();
  if (state.activeSetId !== 'agent') return;
  state.agentSetReturnTimer = window.setTimeout(handleAgentSetReturnLongPress, AGENT_SET_RETURN_HOLD_MS);
}

function getVisibleSlotsForActiveSet(now = performance.now()) {
  const slots = getBubblesConfigForSet(state.activeSetId);
  if (state.activeSetId !== 'agent' || !state.isPressed || !state.agentSetReturnTriggered) return slots;
  if (state.agentSetReturnPhase !== 'reopening') return slots;
  const visibleIds = new Set(AGENT_SET_SPREAD_SLOT_IDS);
  return slots.filter((slot) => visibleIds.has(slot.id));
}

function switchBubbleSet(nextSetId) {
  const nextSet = getBubbleSetDefinition(nextSetId);
  if (!nextSet || nextSet.id === state.activeSetId) return;
  state.activeSetId = nextSet.id;
  const nextDefaults = getBubbleSetControlDefaults(nextSet.id);
  state.viewportPanEnabled = nextDefaults.viewportPanEnabled;
  state.canvaslessEnabled = nextDefaults.canvaslessEnabled;
  resetStateForSetSwitch();
  state.orbAgentId = getDefaultHomeAgentIdForSet(nextSet.id);
  state.homeOrbContent = createHomeOrbAgentContentForSet(state.orbAgentId, nextSet.id);
  syncSetSwitcherUi();
  syncRowSettingsUi();
  syncViewportPanToggleUi();
  syncCanvaslessUi();
  syncCanvasPositionUi();
  buildScene();
  updateMeasuredChildChipWidths();
  render();
  scheduleInterruptRestingStream(BUBBLE_HOME_IDLE_STREAM_GAP_MS);
}

function bindEvents() {
  refs.stage?.addEventListener('pointerdown', handlePointerDown);
  refs.setPanel?.addEventListener('click', handleSetPanelClick);
  refs.rowHideStarsToggle?.addEventListener('change', handleRowHideStarsToggleChange);
  refs.orbReset?.addEventListener('click', resetActiveSetOrbToDefaults);
  refs.viewportPanToggle?.addEventListener('change', handleViewportPanToggleChange);
  refs.canvaslessToggle?.addEventListener('change', handleCanvaslessToggleChange);
  refs.canvasX?.addEventListener('input', handleCanvasXInput);
  refs.canvasY?.addEventListener('input', handleCanvasYInput);
  refs.homeOrbToggle?.addEventListener('click', handleHomeOrbToggleClick);
  refs.bgImageToggle?.addEventListener('change', handleBackgroundImageToggleChange);
  refs.bgImageUpload?.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) target.value = '';
  });
  refs.bgImageUpload?.addEventListener('change', handleBackgroundImageUpload);
  refs.bgImageReset?.addEventListener('click', resetBackgroundImage);
  refs.bgImageAlpha?.addEventListener('input', handleBackgroundImageAlphaInput);
  refs.bgVideoUpload?.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) target.value = '';
  });
  refs.bgVideoUpload?.addEventListener('change', handleBackgroundVideoUpload);
  refs.bgVideoReset?.addEventListener('click', resetBackgroundVideo);
  refs.bgVideoPlayToggle?.addEventListener('click', handleBackgroundVideoPlayToggle);
  refs.bgVideoProgress?.addEventListener('input', handleBackgroundVideoProgressInput);
  refs.bgVideoAlpha?.addEventListener('input', handleBackgroundVideoAlphaInput);
  refs.bgVideoX?.addEventListener('input', handleBackgroundVideoXInput);
  refs.bgVideo?.addEventListener('timeupdate', syncBackgroundVideoProgressUi);
  refs.bgVideo?.addEventListener('loadedmetadata', syncBackgroundVideoProgressUi);
  refs.bgVideo?.addEventListener('error', () => {
    if (refs.bgVideoState) refs.bgVideoState.textContent = 'unsupported';
  });
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerRelease);
  window.addEventListener('pointercancel', handlePointerRelease);
  window.addEventListener('beforeunload', () => {
    revokeBackgroundImageObjectUrl(state.backgroundImage);
    revokeBackgroundVideoObjectUrl(state.backgroundVideo);
  }, { once: true });
}

function handleSetPanelClick(event) {
  const target = event.target instanceof Element ? event.target.closest('[data-bubble-set-id]') : null;
  if (!target) return;
  switchBubbleSet(target.dataset.bubbleSetId || '');
}

function handleRowHideStarsToggleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.rowStarsHidden = target.checked;
  state.rowTransition = null;
  state.rowHandoffUntil = 0;
  if (isRowBubbleSet(state.activeSetId)) {
    const nextId = getSafeRowAgentId();
    state.orbAgentId = nextId;
    state.homeOrbContent = createHomeOrbAgentContentForSet(nextId, ROW_SET_ID);
    syncBubbleHomeOrbVisual(refs.orb, { animate: false });
  }
  syncRowSettingsUi();
  scheduleRender();
}

function handleViewportPanToggleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.viewportPanEnabled = target.checked;
  syncViewportPanToggleUi();
}

function handleCanvaslessToggleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.canvaslessEnabled = target.checked;
  syncCanvaslessUi();
}

function handleCanvasXInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.canvasX = clamp(Number(target.value) || 0, -1000, 1000);
  syncCanvasPositionUi();
}

function handleCanvasYInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.canvasY = clamp(Number(target.value) || 0, -240, 240);
  syncCanvasPositionUi();
}

function handleHomeOrbToggleClick() {
  toggleHomeOrbVisibility();
}

function toggleHomeOrbVisibility() {
  state.homeOrbVisible = !state.homeOrbVisible;
  syncHomeOrbToggleUi();
  scheduleRender();
}

function handleBackgroundImageToggleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.backgroundImageEnabled = target.checked;
  persistBackgroundImage();
  syncBackgroundImageUi();
}

function handleBackgroundImageAlphaInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.backgroundImageAlpha = clamp((Number(target.value) || 0) / 100, 0, 1);
  persistBackgroundImage();
  syncBackgroundImageUi();
}

async function handleBackgroundImageUpload(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const file = target.files?.[0];
  if (!file) return;
  if (!String(file.type || '').startsWith('image/')) {
    target.value = '';
    return;
  }
  const previousImage = state.backgroundImage;
  const dataUrl = await readFileAsDataUrl(file).catch(() => '');
  if (!dataUrl) {
    target.value = '';
    return;
  }
  revokeBackgroundImageObjectUrl(previousImage);
  state.backgroundImage = {
    src: dataUrl,
    objectUrl: '',
    name: String(file.name || 'uploaded image'),
  };
  state.backgroundImageAlpha = clamp(Number(state.backgroundImageAlpha ?? 0.8), 0, 1);
  state.backgroundImageEnabled = true;
  persistBackgroundImage();
  syncBackgroundImageUi();
  target.value = '';
}

function resetBackgroundImage() {
  revokeBackgroundImageObjectUrl(state.backgroundImage);
  state.backgroundImage = {
    src: 'assets/bg/park.jpg',
    objectUrl: '',
    name: 'park image',
  };
  state.backgroundImageAlpha = 0.8;
  state.backgroundImageEnabled = true;
  void deleteDurableJsonRecord(BUBBLE_BACKGROUND_IMAGE_STORAGE_KEY, { label: 'bubble background image' });
  syncBackgroundImageUi();
  if (refs.bgImageUpload) refs.bgImageUpload.value = '';
}

async function handleBackgroundVideoUpload(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const file = target.files?.[0];
  if (!file) return;
  if (!String(file.type || '').startsWith('video/')) {
    target.value = '';
    return;
  }
  const previousVideo = state.backgroundVideo;
  const objectUrl = URL.createObjectURL(file);
  revokeBackgroundVideoObjectUrl(previousVideo);
  state.backgroundVideo = {
    src: objectUrl,
    objectUrl,
    name: String(file.name || ''),
    type: String(file.type || ''),
  };
  state.backgroundVideoPaused = false;
  state.backgroundVideoProgress = 0;
  state.backgroundVideoAlpha = clamp(Number(state.backgroundVideoAlpha ?? 0.8), 0, 1);
  state.backgroundVideoX = 0;
  syncBackgroundVideoUi();
  target.value = '';
  void persistDurableJson(
    BUBBLE_BACKGROUND_VIDEO_STORAGE_KEY,
    {
      src: '',
      blob: file,
      name: state.backgroundVideo.name || 'uploaded video',
      type: state.backgroundVideo.type || '',
      paused: state.backgroundVideoPaused === true,
      progress: clamp(Number(state.backgroundVideoProgress) || 0, 0, 1),
      alpha: clamp(Number(state.backgroundVideoAlpha ?? 0.8), 0, 1),
      x: clamp(Number(state.backgroundVideoX) || 0, -1000, 1000),
    },
    { label: 'bubble background video' },
  );
}

function resetBackgroundVideo() {
  revokeBackgroundVideoObjectUrl(state.backgroundVideo);
  state.backgroundVideo = null;
  state.backgroundVideoPaused = false;
  state.backgroundVideoProgress = 0;
  state.backgroundVideoAlpha = 0.8;
  state.backgroundVideoX = 0;
  void deleteDurableJsonRecord(BUBBLE_BACKGROUND_VIDEO_STORAGE_KEY, { label: 'bubble background video' });
  syncBackgroundVideoUi();
  if (refs.bgVideoUpload) refs.bgVideoUpload.value = '';
}

function handleBackgroundVideoPlayToggle() {
  toggleBackgroundVideoPlayback();
}

function toggleBackgroundVideoPlayback() {
  if (!state.backgroundVideo?.src) return;
  state.backgroundVideoPaused = !state.backgroundVideoPaused;
  persistBackgroundVideo();
  syncBackgroundVideoUi();
}

function handleBackgroundVideoProgressInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.backgroundVideoProgress = clamp((Number(target.value) || 0) / 1000, 0, 1);
  persistBackgroundVideo();
  syncBackgroundVideoUi();
}

function handleBackgroundVideoAlphaInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.backgroundVideoAlpha = clamp((Number(target.value) || 0) / 100, 0, 1);
  persistBackgroundVideo();
  syncBackgroundVideoUi();
}

function handleBackgroundVideoXInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.backgroundVideoX = clamp(Number(target.value) || 0, -1000, 1000);
  persistBackgroundVideo();
  syncBackgroundVideoUi();
}

function shouldStartBubblePress(event) {
  if (isRowBubbleSet(state.activeSetId)) return false;
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return false;
  if (refs.controlPanel?.contains(target)) return false;
  if (!state.viewportPanEnabled) return refs.shell?.contains(target) || false;
  return refs.stage?.contains(target) || false;
}

function handleKeyDown(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (shouldToggleUiChrome(event)) {
    event.preventDefault();
    toggleUiChrome();
    return;
  }
  if (shouldToggleHomeOrb(event)) {
    event.preventDefault();
    toggleHomeOrbVisibility();
    return;
  }
  if (shouldToggleBackgroundVideo(event)) {
    event.preventDefault();
    toggleBackgroundVideoPlayback();
    return;
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    cycleBubbleHomeSelection(1);
    return;
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    cycleBubbleHomeSelection(-1);
  }
}

function shouldToggleUiChrome(event) {
  if (event.key?.toLowerCase() !== UI_CHROME_HOTKEY) return false;
  if (state.uiChromeHidden) return true;
  return !isEditableHotkeyTarget(event);
}

function shouldToggleHomeOrb(event) {
  if (event.key?.toLowerCase() !== HOME_ORB_HOTKEY) return false;
  return !isEditableHotkeyTarget(event);
}

function shouldToggleBackgroundVideo(event) {
  if (event.key?.toLowerCase() !== BACKGROUND_VIDEO_HOTKEY) return false;
  return !isEditableHotkeyTarget(event);
}

function isEditableHotkeyTarget(event) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const tagName = target.tagName.toLowerCase();
  return ['input', 'textarea', 'select', 'button'].includes(tagName) || Boolean(target.closest('[contenteditable="true"]'));
}

function toggleUiChrome() {
  state.uiChromeHidden = !state.uiChromeHidden;
  document.body.classList.toggle('is-bubble-ui-hidden', state.uiChromeHidden);
  if (state.uiChromeHidden && document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

function cycleBubbleHomeSelection(step) {
  if (isRowBubbleSet(state.activeSetId)) {
    cycleRowAgent(step);
    return;
  }
  if (isAgentStyleBubbleSet(state.activeSetId) || isLensBubbleSet(state.activeSetId)) {
    cycleBubbleHomeSetItem(step, state.activeSetId);
    return;
  }
  cycleBubbleHomeAgent(step);
}

function cycleRowAgent(step) {
  if (!refs.orb || !step || state.rowTransition?.active || state.swapTransition?.active) return;
  stopPromptHomeThinking();
  const sequence = getActiveRowAgentSequence();
  const currentIndex = sequence.indexOf(state.orbAgentId);
  const fromIndex = currentIndex >= 0 ? currentIndex : sequence.indexOf(getSafeRowAgentId());
  const direction = step > 0 ? 1 : -1;
  const toIndex = (fromIndex + direction + sequence.length) % sequence.length;
  const nextId = sequence[toIndex];
  if (!nextId || nextId === state.orbAgentId) return;
  const now = performance.now();
  state.rowTransition = {
    active: true,
    direction,
    fromIndex,
    toIndex,
    nextId,
    startedAt: now,
    durationMs: ROW_CAROUSEL_DURATION_MS,
  };
  playSimEarcon('button');
  scheduleMotionPhaseRender(now + ROW_CAROUSEL_DURATION_MS);
  scheduleRender();
}

function cycleBubbleHomeAgent(step) {
  if (!refs.orb || !step || state.swapTransition?.active) return;
  stopPromptHomeThinking();
  const currentIndex = BUBBLE_HOME_AGENT_SEQUENCE.indexOf(state.orbAgentId);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeCurrentIndex + step + BUBBLE_HOME_AGENT_SEQUENCE.length) % BUBBLE_HOME_AGENT_SEQUENCE.length;
  const nextId = BUBBLE_HOME_AGENT_SEQUENCE[nextIndex];
  if (nextId === state.orbAgentId) return;
  state.orbAgentId = nextId;
  state.homeOrbContent = createHomeOrbAgentContentForSet(nextId, state.activeSetId);
  void streamBubbleHomeTransitionText(`Switch to ${getBubbleHomeContentLabel(state.homeOrbContent)}`);
  syncBubbleHomeOrbVisual(refs.orb, {
    animate: true,
    switchDirection: step > 0 ? 'right' : 'left',
    switchMotion: 'swipe',
  });
  scheduleRender();
}

function cycleBubbleHomeSetItem(step, setId = state.activeSetId) {
  if (!refs.orb || !step || state.swapTransition?.active) return;
  stopPromptHomeThinking();
  const sequence = getBubbleSetSequence(setId);
  if (!sequence.length) return;

  const currentSlotId = Number.isFinite(state.homeOrbContent?.sourceSlotId)
    ? state.homeOrbContent.sourceSlotId
    : null;
  const currentIndex = currentSlotId != null ? sequence.indexOf(currentSlotId) : -1;
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : (step > 0 ? -1 : 0);
  const nextIndex = (safeCurrentIndex + step + sequence.length) % sequence.length;
  const nextSlotId = sequence[nextIndex];
  if (nextSlotId == null) return;

  const slot = findBubbleSlotById(nextSlotId, setId);
  if (!slot) return;
  const nextContent = createBaseSlotContent(slot, setId);
  const switchDirection = step > 0 ? 'right' : 'left';

  state.homeOrbContent = nextContent;
  if (isLensBubbleSet(setId)) {
    startLensFeedback(nextContent, performance.now(), {
      placement: 'above-orb',
      mode: lensShimmerModeForSet(setId),
    });
  } else {
    void streamBubbleHomeTransitionText(`Switch to ${getBubbleHomeContentLabel(nextContent)}`);
  }
  syncBubbleHomeOrbVisual(refs.orb, {
    animate: true,
    switchDirection,
    switchMotion: 'swipe',
  });
  scheduleRender();
}

function handlePointerDown(event) {
  if (!shouldStartBubblePress(event)) return;
  if (state.swapTransition?.active) return;
  event.preventDefault();
  playSimEarcon('disambiguate-reveal');
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
  state.lastPointerClient = {
    x: event.clientX,
    y: event.clientY,
  };
  state.isPressed = true;
  state.pointerMovedSincePress = false;
  state.openMotionUntil = now + OPEN_PHASE_LATCH_MS;
  state.closeMotionUntil = 0;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.childMenuParentId = null;
  state.childMenuPointerLock = null;
  clearAgentSetReturnInteraction();
  state.dragOffset = {
    x: 0,
    y: 0,
    active: true,
  };
  if (refs.shell?.setPointerCapture && event.pointerId != null) {
    try { refs.shell.setPointerCapture(event.pointerId); } catch (_) {}
  }
  scheduleAgentSetReturnLongPress();
  scheduleMotionPhaseRender(state.openMotionUntil);
  scheduleRender();
}

function handlePointerMove(event) {
  if (state.swapTransition?.active || !state.isPressed || !refs.shell) return;

  if (
    state.activeSetId === 'agent'
    && state.agentSetReturnTriggered
    && state.agentSetReturnPhase === 'reopening'
  ) {
    if (!state.lastPointerClient) {
      state.lastPointerClient = {
        x: event.clientX,
        y: event.clientY,
      };
      return;
    }
    const rect = refs.shell.getBoundingClientRect();
    const scaleX = rect.width / 420;
    const scaleY = rect.height / 420;
    const deltaX = (event.clientX - state.lastPointerClient.x) / scaleX;
    const deltaY = (event.clientY - state.lastPointerClient.y) / scaleY;
    state.lastPointerClient = {
      x: event.clientX,
      y: event.clientY,
    };
    state.dragOffset = {
      x: state.dragOffset.x + deltaX,
      y: state.dragOffset.y + deltaY,
      active: true,
    };
    state.pointerMovedSincePress = state.pointerMovedSincePress || deltaX !== 0 || deltaY !== 0;
    scheduleRender();
    return;
  }

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
  state.lastPointerClient = {
    x: event.clientX,
    y: event.clientY,
  };
  state.pointerMovedSincePress = state.pointerMovedSincePress || dragOffsetX !== 0 || dragOffsetY !== 0;

  scheduleRender();
}

function handlePointerRelease(event) {
  if (!state.isPressed) return;
  const now = performance.now();
  const releaseScene = computeScene(now);
  clearAgentSetReturnTimer();

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
  state.lastPointerClient = null;
  state.pointerMovedSincePress = false;
  state.hoveredBubble = null;
  state.hoveredChildBubble = null;
  state.lockedExpandedPillId = null;
  state.lockedExpandedPillScale = null;
  state.childMenuParentId = null;
  state.childMenuPointerLock = null;
  state.agentSetReturnTriggered = false;
  state.agentSetReturnRevealUntil = 0;
  clearChildHoverTimer();
  previousHoveredId = null;
  previousHoveredChildId = null;
  scheduleMotionPhaseRender(state.closeMotionUntil);
  scheduleRender();
  scheduleInterruptRestingStream(CLOSE_PHASE_LATCH_MS);
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

function isPauseSessionSwap(transition = state.swapTransition) {
  return transition?.specialAction === 'pause-session';
}

function isPlaySessionSwap(transition = state.swapTransition) {
  return transition?.specialAction === 'play-session';
}

function isInterruptPlaybackSwap(transition = state.swapTransition) {
  return isPauseSessionSwap(transition) || isPlaySessionSwap(transition);
}

function isLensFireSwap(transition = state.swapTransition) {
  return transition?.swapMode === 'lens-fire';
}

function startBubbleSwap(scene, now) {
  const selectedBubble = scene.bubbles.find((bubble) => bubble.id === scene.hoveredId);
  if (!selectedBubble) return;

  playSimEarcon('button');
  clearAgentSetReturnInteraction();
  state.promotedHandoffGhost = null;
  state.isPressed = false;
  state.openMotionUntil = 0;
  state.closeMotionUntil = now + SWAP_SIBLING_DURATION_MS + BUBBLE_STAGGER_TOTAL_MS;
  state.dragOffset = { x: 0, y: 0, active: false };
  state.dragStart = { x: ORB_CENTER_X, y: ORB_CENTER_Y };
  state.lastPointerClient = null;
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
  const isPauseAction = selectedBubble.controlAction === 'pause-session';
  const isPlayAction = selectedBubble.controlAction === 'play-session';
  const isLensFire = isLensBubbleSet(state.activeSetId);
  const promotedImageScaleCompensation = selectedBubble.graphicKind === 'emoji'
    ? 1
    : (selectedBubble.fill ? (1 / Math.max(selectedBubble.imageScale ?? 1, 0.0001)) : 1);
  const promotedVisualScaleEnd = selectedBubble.graphicKind === 'emoji'
    ? BUBBLE_RELEASE_CONTENT_SCALE * (selectedBubble.homeEmojiScale ?? 1)
    : ((selectedBubble.preservePromotedImageScale ? 1 : BUBBLE_RELEASE_CONTENT_SCALE) * promotedImageScaleCompensation);
  const selectedNode = refs.bubbleNodes.get(selectedBubble.id)?.root;
  const selectedRenderedWidth = selectedNode
    ? Number.parseFloat(window.getComputedStyle(selectedNode).width)
    : NaN;
  if (isLensFire) {
    startLensFeedback(promotedContent, now, { mode: lensShimmerModeForSet(state.activeSetId) });
  }
  state.swapTransition = {
    active: true,
    swapMode: isLensFire ? 'lens-fire' : 'promote',
    specialAction: isPauseAction ? 'pause-session' : (isPlayAction ? 'play-session' : ''),
    selectedBubbleId: selectedBubble.id,
    startedAt: now,
    durationMs: isLensFire
      ? (LENS_PUNCTURE_SCALE_DURATION_MS + BUBBLE_STAGGER_TOTAL_MS)
      : ((isPauseAction || isPlayAction) ? (SWAP_SIBLING_DURATION_MS + BUBBLE_STAGGER_TOTAL_MS) : SWAP_DURATION_MS),
    siblingDurationMs: SWAP_SIBLING_DURATION_MS,
    highlightFreezeUntil: now + SWAP_HIGHLIGHT_FREEZE_MS,
    panOffset: { ...scene.panOffset },
    demotedCenterStartX: scene.orb?.targetX ?? 0,
    demotedCenterStartY: scene.orb?.targetY ?? 0,
    demotedShellScaleStart: scene.orb?.targetScale ?? 1,
    demotedShellScaleEnd: isLensFire ? 0.2 : SWAP_DEMOTED_END_SCALE,
    promotedRootScaleEnd: ORB_BASE_SIZE / selectedBubble.baseSize,
    promotedVisualScaleStart: selectedBubble.hoverExpandsToPill
      ? PILL_HOVER_BUBBLE_SCALE
      : BUBBLE_HOVER_CONTENT_SCALE,
    promotedVisualScaleEnd,
    releaseBubbles: scene.bubbles.map(snapshotReleaseBubble),
    promotedContent,
    demotedContent,
    previousHomeOrbContent: { ...state.homeOrbContent },
    selectedRenderedWidth: Number.isFinite(selectedRenderedWidth) && selectedRenderedWidth > 0
      ? selectedRenderedWidth
      : null,
  };

  if (isPauseAction) {
    interruptSessionPaused = true;
    void showPersistentBubbleHomeStreamText('Session paused');
  } else if (isPlayAction) {
    interruptSessionPaused = false;
    void showPersistentBubbleHomeStreamText(BUBBLE_HOME_INTERRUPT_THINKING_TEXT);
  }

  scheduleMotionPhaseRender(state.closeMotionUntil);
  scheduleRender();
}

function commitBubbleSwap() {
  const transition = state.swapTransition;
  if (!transition) return;
  const promotedBubble = findPromotedReleaseBubble(transition);
  if (isPauseSessionSwap(transition)) {
    interruptSessionPaused = true;
    state.swapTransition = null;
    state.closeMotionUntil = 0;
    clearSwapLayer();
    void showPersistentBubbleHomeStreamText('Session paused');
    scheduleRender();
    return;
  }
  if (isPlaySessionSwap(transition)) {
    interruptSessionPaused = false;
    state.swapTransition = null;
    state.closeMotionUntil = 0;
    clearSwapLayer();
    void showPersistentBubbleHomeStreamText(BUBBLE_HOME_INTERRUPT_THINKING_TEXT);
    scheduleRender();
    return;
  }
  if (isLensFireSwap(transition)) {
    state.swapTransition = null;
    state.closeMotionUntil = 0;
    state.homeOrbVisible = false;
    clearSwapLayer();
    syncHomeOrbToggleUi();
    scheduleRender();
    return;
  }
  state.homeOrbContent = transition.promotedContent;
  state.promotedHandoffGhost = promotedBubble
    ? {
        startedAt: performance.now(),
        centerX: 0,
        centerY: 0,
        content: { ...transition.promotedContent },
        theme: promotedBubble.theme || transition.promotedContent?.theme || null,
      }
    : null;
  if (state.activeSetId === 'prompt') {
    activatePromptHomeThinking();
  } else {
    stopPromptHomeThinking();
  }
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
  scheduleInterruptRestingStream(BUBBLE_HOME_IDLE_STREAM_GAP_MS);
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
  const travel = easeSmoothConnect(progress);
  const lift = Math.sin(Math.min(progress, 1) * Math.PI) * -8;
  const orbCanvasDestinationX = -transition.panOffset.x;
  const orbCanvasDestinationY = -transition.panOffset.y;
  return {
    progress,
    currentCenterX: interpolate(promotedBubble.targetX, orbCanvasDestinationX, travel),
    currentCenterY: interpolate(promotedBubble.targetY, orbCanvasDestinationY, travel) + lift,
    rootScale: interpolate(promotedBubble.targetScale, transition.promotedRootScaleEnd, travel),
    visualScale: interpolate(transition.promotedVisualScaleStart, transition.promotedVisualScaleEnd, travel),
    opacity: 1,
  };
}

function computeLensFirePunctureScale(bubble, transition, now) {
  const startScale = bubble.targetScale ?? 1;
  const progress = clamp((now - transition.startedAt) / LENS_PUNCTURE_SCALE_DURATION_MS, 0, 1);
  if (progress <= 0) return startScale;
  const popScale = startScale * LENS_PUNCTURE_POP_SCALE;
  if (progress < 0.18) {
    return interpolate(startScale, popScale, easeOutBackSoft(progress / 0.18));
  }
  return interpolate(popScale, LENS_PUNCTURE_END_SCALE, easeInOutCubic((progress - 0.18) / 0.82));
}

function computeLensFirePunctureWidth(bubble, transition, staggerIndex, now) {
  const startWidth = transition.selectedRenderedWidth ?? bubble.targetWidth ?? bubble.baseSize;
  const collapseStart = transition.startedAt + (LENS_PUNCTURE_SCALE_DURATION_MS * 0.18);
  const fadeEnd = transition.startedAt + (staggerIndex * BUBBLE_STAGGER_STEP_MS) + LENS_PUNCTURE_SCALE_DURATION_MS;
  const progress = clamp((now - collapseStart) / Math.max(fadeEnd - collapseStart, 1), 0, 1);
  return interpolate(startWidth, bubble.baseSize, easeInOutCubic(progress));
}

function computeDemotedSwapMotion(transition, now) {
  if (!transition) return null;
  if (isInterruptPlaybackSwap(transition)) return null;
  if (isLensFireSwap(transition)) {
    const duration = transition.siblingDurationMs || SWAP_SIBLING_DURATION_MS;
    const progress = easeSmoothConnect(clamp((now - transition.startedAt) / duration, 0, 1));
    return {
      centerX: transition.demotedCenterStartX ?? 0,
      centerY: transition.demotedCenterStartY ?? 0,
      shellScale: interpolate(
        transition.demotedShellScaleStart ?? 1,
        transition.demotedShellScaleEnd ?? 0.2,
        progress,
      ),
      opacity: 1 - easeOutQuart(clamp((now - transition.startedAt) / duration, 0, 1)),
    };
  }
  const demotedProgress = easeSmoothConnect(clamp((now - transition.startedAt - SWAP_DEMOTED_START_DELAY_MS) / (transition.durationMs - SWAP_DEMOTED_START_DELAY_MS), 0, 1));
  const orbFadeDurationMs = 200;
  return {
    centerX: transition.demotedCenterStartX ?? 0,
    centerY: transition.demotedCenterStartY ?? 0,
    shellScale: interpolate(
      transition.demotedShellScaleStart ?? 1,
      transition.demotedShellScaleEnd ?? SWAP_DEMOTED_END_SCALE,
      demotedProgress,
    ),
    opacity: 1 - easeOutQuart(clamp((now - transition.startedAt - 30) / orbFadeDurationMs, 0, 1)),
  };
}

function isRowTransitionRunning(now = performance.now()) {
  const transition = state.rowTransition;
  if (!transition?.active) return false;
  if (now < transition.startedAt + transition.durationMs) return true;
  commitRowTransition(transition);
  return false;
}

function commitRowTransition(transition) {
  const nextId = transition?.nextId || rowSequenceIdAt(transition?.toIndex ?? 0);
  state.orbAgentId = nextId;
  state.homeOrbContent = createHomeOrbAgentContentForSet(nextId, ROW_SET_ID);
  state.rowTransition = null;
  state.rowHandoffUntil = performance.now() + ROW_CAROUSEL_HANDOFF_MS;
  syncBubbleHomeOrbVisual(refs.orb, { animate: false });
}

function rowSequenceIdAt(index) {
  const sequence = getActiveRowAgentSequence();
  const length = sequence.length;
  return sequence[(index + length) % length];
}

function rowAgentDepthForCenterX(centerX) {
  const distance = clamp(Math.abs(centerX) / ROW_CAROUSEL_SPACING, 0, 2);
  if (distance <= 1) {
    return {
      opacity: interpolate(1, 0.8, distance),
      blur: interpolate(0, 1, distance),
    };
  }
  const farProgress = distance - 1;
  return {
    opacity: interpolate(0.8, 0.6, farProgress),
    blur: interpolate(1, 6, farProgress),
  };
}

function rowStaggerRank(slotIndex, direction, phase) {
  if (slotIndex === 0) return 0;
  const forwardDistance = direction > 0 ? slotIndex : -slotIndex;
  if (forwardDistance > 0) return Math.max(0, forwardDistance - 1);
  return 2;
}

function rowFadeOutStaggerRank(slotIndex, direction, visibleSlotIndexes) {
  const finalSlotIndex = slotIndex - direction;
  const finalRightToLeft = visibleSlotIndexes
    .filter((entry) => entry !== direction)
    .map((entry) => entry - direction)
    .sort((a, b) => b - a);
  return Math.max(0, finalRightToLeft.indexOf(finalSlotIndex));
}

function syncRowCarousel(now = performance.now()) {
  if (!refs.rowLayer) return;
  if (state.homeOrbVisible === false) {
    refs.rowLayer.classList.remove('is-active');
    refs.rowAgentNodes.forEach((node) => {
      node.root.style.opacity = '0';
      node.root.style.zIndex = '20';
      node.root.style.transform = 'translate3d(-50%, -50%, 0) scale(0.72)';
      if (node.image) node.image.style.filter = 'blur(6px)';
    });
    return;
  }
  const transition = state.rowTransition;
  const handoffProgress = clamp(
    (state.rowHandoffUntil - now) / ROW_CAROUSEL_HANDOFF_MS,
    0,
    1,
  );
  const isHandoffActive = handoffProgress > 0;
  const isActive = Boolean(transition?.active);
  refs.rowLayer.classList.toggle('is-active', isActive || isHandoffActive);
  if (!isActive) {
    const activeId = getSafeRowAgentId();
    refs.rowAgentNodes.forEach((node, agentId) => {
      const isCurrent = agentId === activeId;
      node.root.style.opacity = isCurrent && isHandoffActive ? String(easeOutQuart(handoffProgress)) : '0';
      node.root.style.zIndex = isCurrent ? '40' : '20';
      node.root.style.transform = isCurrent
        ? 'translate3d(-50%, -50%, 0) scale(1)'
        : 'translate3d(-50%, -50%, 0) scale(0.72)';
      if (node.image) node.image.style.filter = isCurrent ? 'blur(0px)' : 'blur(6px)';
    });
    return;
  }

  const elapsed = now - transition.startedAt;
  const moveLinearProgress = clamp(elapsed / ROW_CAROUSEL_MOVE_DURATION_MS, 0, 1);
  const moveProgress = easeSmoothConnect(clamp((moveLinearProgress - 0.12) / 0.66, 0, 1));
  const shiftX = -transition.direction * ROW_CAROUSEL_SPACING * moveProgress;
  const activeSequence = getActiveRowAgentSequence();
  const slotIndexes = activeSequence.length <= 3
    ? [-1, 0, 1]
    : (transition.direction > 0 ? [-1, 0, 1, 2] : [-2, -1, 0, 1]);
  const visibleIds = new Set();

  slotIndexes.forEach((slotIndex) => {
    const agentId = rowSequenceIdAt(transition.fromIndex + slotIndex);
    visibleIds.add(agentId);
    const node = refs.rowAgentNodes.get(agentId);
    if (!node) return;
    const centerX = (slotIndex * ROW_CAROUSEL_SPACING) + shiftX;
    const centerWeight = 1 - clamp(Math.abs(centerX) / ROW_CAROUSEL_SPACING, 0, 1);
    const scale = interpolate(0.72, 1, easeOutQuart(centerWeight));
    const isDestination = agentId === rowSequenceIdAt(transition.toIndex);
    const isOrigin = agentId === rowSequenceIdAt(transition.fromIndex);
    const depth = rowAgentDepthForCenterX(centerX);
    const fadeInDelay = rowStaggerRank(slotIndex, transition.direction, 'in') * ROW_CAROUSEL_STAGGER_MS;
    const fadeOutDelay = rowFadeOutStaggerRank(slotIndex, transition.direction, slotIndexes) * ROW_CAROUSEL_STAGGER_MS;
    const revealOpacity = isOrigin
      ? 1
      : easeInOutCubic(clamp((elapsed - fadeInDelay) / (ROW_CAROUSEL_MOVE_DURATION_MS * 0.68), 0, 1));
    const hideOpacity = isDestination
      ? 1
      : 1 - easeInOutCubic(clamp(
        (elapsed - ROW_CAROUSEL_FADE_OUT_DELAY_MS - fadeOutDelay) / ROW_CAROUSEL_FADE_OUT_DURATION_MS,
        0,
        1,
      ));
    const sideOpacity = Math.min(revealOpacity, hideOpacity);
    const opacity = isDestination
      ? revealOpacity
      : (isOrigin ? hideOpacity : sideOpacity);
    node.root.style.opacity = String(clamp(opacity * depth.opacity, 0, 1));
    node.root.style.zIndex = String(20 + Math.round(centerWeight * 20));
    node.root.style.transform = `translate3d(calc(-50% + ${format(centerX)}px), -50%, 0) scale(${format(scale)})`;
    if (node.image) node.image.style.filter = `blur(${format(depth.blur)}px)`;
  });

  refs.rowAgentNodes.forEach((node, agentId) => {
    if (visibleIds.has(agentId)) return;
    node.root.style.opacity = '0';
    node.root.style.transform = 'translate3d(-50%, -50%, 0) scale(0.72)';
    if (node.image) node.image.style.filter = 'blur(6px)';
  });
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
    if (scene.hoveredId != null && scene.hoveredId !== state.hoveredBubble) playSimEarcon('hover');
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
  const isLensFiring = isLensFireSwap(state.swapTransition);
  const isLensShimmerActive = isLensFiring || now < state.lensShimmerUntil;
  const isLensExpandShimmerActive = isLensShimmerActive && state.lensShimmerMode === 'expand';
  const isLensFocusShimmerActive = isLensShimmerActive && state.lensShimmerMode === 'focus';
  const isRowTransitionActive = isRowTransitionRunning(now);
  const isRowHandoffActive = now < state.rowHandoffUntil;
  const isPostSwapReset = state.swapResetPending;
  const demotedSwapMotion = isSwapActive ? computeDemotedSwapMotion(state.swapTransition, now) : null;
  const panTransitionDuration = state.panSnapPending ? '0ms' : '1000ms';
  const showDefaultAgentBanner = state.activeSetId === 'agent'
    && state.agentSetReturnTriggered
    && state.agentSetReturnPhase === 'reopening'
    && state.isPressed;

  refs.shell?.classList.toggle('is-lens-firing', isLensShimmerActive);
  refs.shell?.classList.toggle('is-lens-expand-firing', isLensExpandShimmerActive);
  refs.shell?.classList.toggle('is-lens-focus-firing', isLensFocusShimmerActive);
  refs.shell?.classList.toggle('is-row-set', isRowBubbleSet(state.activeSetId));

  if (refs.canvasBanner) {
    refs.canvasBanner.textContent = 'Set default agent';
    refs.canvasBanner.classList.toggle('is-hidden', !showDefaultAgentBanner);
    refs.canvasBanner.setAttribute('aria-hidden', String(!showDefaultAgentBanner));
  }

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
    const hoverVisualScale = bubble.usesSurfaceShell
      ? CONTROL_BUBBLE_HOVER_SCALE
      : BUBBLE_HOVER_CONTENT_SCALE;
    const isAppearing = isInitialReveal;
    const isSwapFade = bubble.swapState === 'fade';
    const isSelectedLensFireBubble = isLensFiring
      && isSwapFade
      && bubble.id === state.swapTransition?.selectedBubbleId;
    const isSwapHidden = bubble.swapState === 'hidden';
    const isReturning = !isSwapActive && !state.isPressed && now < state.closeMotionUntil;
    const isForcedHiddenReset = isPostSwapReset && !state.isPressed && !isSwapActive;
    const staggerDelay = isSwapFade
      ? ((bubble.swapStaggerIndex ?? node.index) * BUBBLE_STAGGER_STEP_MS)
      : ((isAppearing || isReturning)
      ? (node.index * BUBBLE_STAGGER_STEP_MS)
      : 0);
    const transformDuration = isSelectedLensFireBubble
      ? 0
      : isSwapFade
      ? SWAP_SIBLING_DURATION_MS
      : (isSwapHidden ? 1 : (isAppearing
      ? APPEAR_MOVE_DURATION_MS
      : (isReturning ? DISAPPEAR_MOVE_DURATION_MS : ACTIVE_MOVE_DURATION_MS)));
    const opacityDuration = isSelectedLensFireBubble
      ? LENS_PUNCTURE_FADE_DURATION_MS
      : isSwapFade
      ? SWAP_SIBLING_DURATION_MS
      : (isSwapHidden ? 1 : (isAppearing
      ? FADE_IN_DURATION_MS
      : (isReturning ? FADE_OUT_DURATION_MS : DEFAULT_MOVE_DURATION_MS)));
    const shadowDuration = isSelectedLensFireBubble
      ? LENS_PUNCTURE_FADE_DURATION_MS
      : isSwapFade || isSwapHidden
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
    const isHoverDimmed = !isPromptLikeBubbleSet(state.activeSetId) && anyHovered && !isHovered;
    const bubbleOpacity = isDimmed ? CHILD_DIMMED_OPACITY : isHoverDimmed ? 0.6 : 1;
    const suppressHoveredShadowForVideo = state.activeSetId === 'app'
      && Boolean(state.backgroundVideo?.src)
      && isHovered;
    if (isPromoting) {
      node.root.style.opacity = String(clamp(Number(bubble.promotedOpacity) || 0, 0, 1));
    } else {
      node.root.style.opacity = state.isPressed
        ? String(bubbleOpacity)
        : (isSwapActive ? '0' : '0');
    }
    if (node.shadowEl) {
      if (suppressHoveredShadowForVideo) {
        node.shadowEl.style.boxShadow = 'none';
      } else if (isHoverShellActive || isPromoting) {
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
    node.root.style.transitionDelay = isSelectedLensFireBubble
      ? `0ms, 0ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms`
      : `${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms, ${staggerDelay}ms`;
    node.root.style.transitionDuration = isForcedHiddenReset
      ? '0ms, 0ms, 0ms, 0ms, 0ms'
      : isPromoting
      ? '0ms, 0ms, 0ms, 0ms, 0ms'
      : `${transformDuration}ms, ${isSelectedLensFireBubble ? 0 : 600}ms, ${opacityDuration}ms, ${shadowDuration}ms, ${opacityDuration}ms`;
    node.root.style.transitionTimingFunction = isForcedHiddenReset
      ? 'linear, linear, linear, linear, linear'
      : isPromoting
      ? 'linear, linear, linear, linear, linear'
      : `${transformEase}, var(--bubble2-pill-ease), ease-out, ease, ease`;
    node.root.classList.toggle('is-round-hovered', isHoverShellActive);
    node.root.classList.toggle('is-swap-promoting', isPromoting);
    if (node.visual) {
      node.visual.style.transform = `scale(${isPromotingDomainPill ? 1 : (isPromoting ? bubble.promotedVisualScale : (isRoundVisualScaleActive ? hoverVisualScale : 1))})`;
    }
    if (node.surfaceChrome) {
      const suppressChromeDuringLensFire = isLensFiring && isSwapFade && !isSelectedLensFireBubble;
      if (!suppressChromeDuringLensFire) {
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
      }
      node.surfaceChrome.style.transitionDuration = suppressChromeDuringLensFire ? '0ms' : '';
      node.surfaceChrome.style.opacity = !suppressChromeDuringLensFire && (isHovered || isPromoting || isSelectedLensFireBubble) ? '1' : '0';
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
    const bubbleGraphicEl = node.iconWrap.querySelector('.bubble2-icon');
    const pillHoverBubbleScale = usesPillInteraction && isHovered ? PILL_HOVER_BUBBLE_SCALE : 1;
    let iconWrapScale = bubble.lockGraphicScaleOnHover && usesPillInteraction
      ? (1 / Math.max(isPromoting ? (bubble.promotedVisualScale ?? 1) : pillHoverBubbleScale, 0.0001))
      : (isPromotingDomainPill
        ? 1
        : (usesPillInteraction ? 1 : pillHoverBubbleScale));
    node.iconWrap.style.transform = `scale(${iconWrapScale})`;
    node.iconWrap.style.opacity = '1';
    if (bubbleGraphicEl instanceof HTMLElement) {
      bubbleGraphicEl.style.removeProperty('transform');
    }
    node.surface.classList.toggle('has-surface-shell', Boolean(bubble.usesSurfaceShell));
    node.surface.classList.toggle('is-pill', bubble.isPill || bubble.isExpanded || bubble.hoverExpandsToPill);
    node.surface.classList.toggle('selected', Boolean(node.surfaceChrome) && (isHovered || isPromoting || isSelectedLensFireBubble));
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
      node.pillCopy.style.setProperty('--bubble2-title-size', `${PILL_TITLE_FONT_SIZE / pillContentScale}px`);
      node.pillCopy.style.setProperty('--bubble2-subtitle-size', `${PILL_SUBTITLE_FONT_SIZE / pillContentScale}px`);
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

  const promptThinkingActive = isPromptHomeThinkingActive();
  const thinkingHomeOrbActive = isHomeOrbThinkingModeActive();
  const collapsedThinkingStream = (promptThinkingActive && state.promptHomeThinkingAnimating)
    || (!thinkingHomeOrbActive && Boolean(refs.orbStream?.classList.contains('hidden')));

  if (refs.orb) {
    const orbVisibleScale = state.homeOrbVisible === false ? 0.2 : 1;
    const orbVisibleOpacity = state.homeOrbVisible === false ? 0 : 1;
    refs.orb.classList.toggle('is-pressed', state.isPressed);
    refs.orb.classList.toggle('is-home-orb-hidden', state.homeOrbVisible === false);
    refs.orb.classList.toggle('is-interrupt-home-orb', state.activeSetId === 'interrupt');
    refs.orb.classList.toggle('is-prompt-thinking-home-orb', promptThinkingActive);
    refs.orb.classList.toggle('is-thinking-home-orb', thinkingHomeOrbActive);
    refs.orb.classList.toggle('is-collapsed-stream', collapsedThinkingStream);
    refs.orb.classList.toggle('is-row-home-orb', isRowBubbleSet(state.activeSetId));
    refs.orb.classList.toggle('is-row-transitioning', isRowBubbleSet(state.activeSetId) && isRowTransitionActive);
    refs.orb.style.transitionDuration = (demotedSwapMotion || state.panSnapPending) ? '0ms, 0ms' : '';
    refs.orb.style.transform = demotedSwapMotion
      ? `translate3d(${format(demotedSwapMotion.centerX)}px, ${format(demotedSwapMotion.centerY)}px, 0) scale(${format(orbVisibleScale)})`
      : `translate3d(${format(scene.orb.targetX ?? 0)}px, ${format(scene.orb.targetY ?? 0)}px, 0) scale(${format(orbVisibleScale)})`;
    refs.orb.style.opacity = demotedSwapMotion
      ? format(demotedSwapMotion.opacity * orbVisibleOpacity)
      : ((isSwapActive && !isInterruptPlaybackSwap()) ? '0' : String(orbVisibleOpacity));
  }

  if (refs.orbStream) {
    if (thinkingHomeOrbActive) {
      setBubbleHomeStreamVisible(true);
      syncBubbleHomeThinkingPillIcon(state.homeOrbContent);
      if (state.activeSetId === 'interrupt' || !refs.orbStream.classList.contains('is-text-transitioning')) {
        syncBubbleHomeThinkingPillText(
          state.activeSetId === 'interrupt'
            ? (interruptSessionPaused ? 'Session paused' : BUBBLE_HOME_INTERRUPT_THINKING_TEXT)
            : (bubbleHomeStreamState.currentText || BUBBLE_HOME_PROMPT_THINKING_TEXT),
        );
      }
    }
  }

  if (refs.orbVisual) {
    syncBubbleHomeOrbVisualStateClasses(refs.orbVisual, state.homeOrbContent);
    if (!refs.orbVisual.classList.contains('is-orb-icon-switching')) {
      syncBubbleHomeOrbVisual(refs.orb, { animate: false });
    }
    refs.orbVisual.classList.toggle('is-promoted-home', state.homeOrbContent?.kind !== 'agent-orb');
    refs.orbVisual.style.transitionDuration = (demotedSwapMotion || state.panSnapPending || state.swapResetPending)
      ? '0ms'
      : `${state.isPressed ? ORB_PRESSED_DURATION_MS : ORB_IDLE_DURATION_MS}ms`;
    refs.orbVisual.style.transform = `translate3d(0, 0, 0) scale(${(demotedSwapMotion ? demotedSwapMotion.shellScale : scene.orb.targetScale).toFixed(4)})`;
    refs.orbVisual.style.setProperty('--g-stage-h', `${ORB_BASE_SIZE}px`);
    applyBubbleHomeOrbShellChrome(refs.orbVisual, currentBubbleHomeOrbTheme());
  }

  syncRowCarousel(now);
  syncSwapLayer(now);
  state.lastScene = scene;

  if (state.swapTransition?.active || state.rowTransition?.active || isRowHandoffActive) {
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
    let processedBubbles = getVisibleSlotsForActiveSet(now).map((slot) => {
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
  if (isInterruptPlaybackSwap(transition)) {
    const progress = easeSmoothConnect(clamp((now - transition.startedAt) / transition.durationMs, 0, 1));
    return {
      bubbles: transition.releaseBubbles.map((bubble) => ({
        ...bubble,
        swapState: 'fade',
        targetScale: 0.2,
        isExpanded: false,
        expandedExtraSourceWidth: 0,
        promotedVisualScale: 1,
      })),
      children: [],
      childZone: null,
      hoveredId: null,
      hoveredChildId: null,
      orb: {
        id: 'orb',
        targetScale: 1,
        targetX: 0,
        targetY: 0,
      },
      panOffset: {
        x: interpolate(transition.panOffset.x, 0, progress),
        y: interpolate(transition.panOffset.y, 0, progress),
      },
    };
  }
  if (isLensFireSwap(transition)) {
    const selectedBubbleId = transition.selectedBubbleId;
    const nonSelectedBubbles = transition.releaseBubbles.filter((bubble) => bubble.id !== selectedBubbleId);
    const staggerIndexById = new Map(nonSelectedBubbles.map((bubble, index) => [bubble.id, index]));
    const selectedStaggerIndex = Math.max(transition.releaseBubbles.length - 1, 0);
    return {
      bubbles: transition.releaseBubbles.map((bubble) => {
        const isSelected = bubble.id === selectedBubbleId;
        const swapStaggerIndex = isSelected
          ? selectedStaggerIndex
          : (staggerIndexById.get(bubble.id) ?? 0);
        return {
          ...bubble,
          isLensFireSelectedBubble: isSelected,
          swapState: 'fade',
          swapStaggerIndex,
          targetScale: isSelected
            ? computeLensFirePunctureScale(bubble, transition, now)
            : 0.2,
          targetWidth: isSelected
            ? computeLensFirePunctureWidth(bubble, transition, swapStaggerIndex, now)
            : bubble.baseSize,
          isExpanded: false,
          expandedExtraSourceWidth: 0,
          promotedVisualScale: 1,
        };
      }),
      children: [],
      childZone: null,
      hoveredId: null,
      hoveredChildId: null,
      orb: {
        id: 'orb',
        targetScale: 1,
        targetX: transition.demotedCenterStartX ?? 0,
        targetY: transition.demotedCenterStartY ?? 0,
      },
      panOffset: transition.panOffset,
    };
  }
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
            easeSmoothConnect(promotedMotion?.progress ?? 0),
          )
        : (bubble.targetWidth ?? bubble.baseSize),
      isExpanded: false,
      expandedExtraSourceWidth: 0,
      promotedVisualScale: bubble.id === transition.selectedBubbleId ? (promotedMotion?.visualScale ?? transition.promotedVisualScaleStart) : 1,
      promotedImageOpacity: bubble.id === transition.selectedBubbleId ? easeOutQuart(promotedMotion?.progress ?? 0) : 1,
      promotedOpacity: bubble.id === transition.selectedBubbleId ? (promotedMotion?.opacity ?? 1) : 1,
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
  const ghost = state.promotedHandoffGhost;
  if (!ghost) return;
  const elapsed = now - ghost.startedAt;
  const fadeProgress = clamp((elapsed - SWAP_PROMOTED_HANDOFF_DELAY_MS) / SWAP_PROMOTED_HANDOFF_FADE_MS, 0, 1);
  const opacity = 1 - easeInQuart(fadeProgress);
  if (elapsed >= SWAP_PROMOTED_HANDOFF_DELAY_MS + SWAP_PROMOTED_HANDOFF_FADE_MS) {
    state.promotedHandoffGhost = null;
    return;
  }
  const node = createSwapPromotedNode();
  node.style.setProperty('--swap-center-x', `${format(ghost.centerX ?? 0)}px`);
  node.style.setProperty('--swap-center-y', `${format(ghost.centerY ?? 0)}px`);
  node.style.setProperty('--swap-rim-drift', '0px');
  node.style.setProperty('--swap-shell-scale', '1');
  syncSwapOrbContent(node, ghost.content);
  const visual = node.querySelector('.bubble2-swap-orb');
  syncBubbleHomeOrbVisualStateClasses(visual, ghost.content);
  applySwapOrbTheme(node, ghost.theme || ghost.content?.theme);
  if (visual) {
    visual.style.opacity = String(clamp(opacity, 0, 1));
  }
  refs.swapLayer.appendChild(node);
  scheduleRender();
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
    <div class="bubble2-swap-orb bubble2-orb-visual">
      ${renderBubbleOrbShellMarkup()}
    </div>
  `;
  return wrapper;
}

function createSwapDemotedNode() {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble2-swap-node bubble2-swap-demoted';
  wrapper.innerHTML = `
    <div class="bubble2-swap-demoted-shell bubble2-orb-visual">
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
  const promotedImageSize = Number(content.homePromotedImageSize);
  if (Number.isFinite(promotedImageSize) && promotedImageSize > 0) {
    node.style.setProperty('--swap-icon-size', `${promotedImageSize}px`);
  } else {
    node.style.removeProperty('--swap-icon-size');
  }
  if (content.kind === 'agent-orb' && !hasCustomAgentOrbImage(content)) {
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
  const titleWidth = measureTextWidth(bubble.pillTitle || '', `600 ${PILL_TITLE_FONT_SIZE}px "DM Sans"`);
  const subtitleWidth = measureTextWidth(bubble.pillSubtitle || '', `400 ${PILL_SUBTITLE_FONT_SIZE}px "DM Sans"`);
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
  if (bubble.graphicKind === 'interrupt-control') {
    return createHtmlNode(renderInterruptControlSvg(bubble.controlIcon));
  }
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
    playSimEarcon('chip-reveal');
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

function easeInQuart(value) {
  return value * value * value * value;
}

function easeSmoothConnect(value) {
  return cubicBezierAt(clamp(value, 0, 1), 0.645, 0.045, 0.355, 1);
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

function cubicBezierAt(x, x1, y1, x2, y2) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lower = 0;
  let upper = 1;
  let t = x;
  for (let i = 0; i < 8; i += 1) {
    const currentX = cubicBezierPoint(t, x1, x2);
    if (Math.abs(currentX - x) < 0.0005) break;
    if (currentX < x) lower = t;
    else upper = t;
    t = (lower + upper) / 2;
  }
  return cubicBezierPoint(t, y1, y2);
}

function cubicBezierPoint(t, p1, p2) {
  const inverse = 1 - t;
  return (3 * inverse * inverse * t * p1) + (3 * inverse * t * t * p2) + (t * t * t);
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
