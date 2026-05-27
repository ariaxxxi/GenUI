import { AI_ORB_ICON_OPTIONS, loadAiOrbIconId, persistAiOrbIconId } from '../../shared/ai-orb-icon.js';
import {
  renderThinkingOrbStreamMarkup,
  setThinkingOrbStreamVisible,
  syncThinkingOrbStreamIcon,
  syncThinkingOrbStreamText,
} from '../../shared/thinking-orb-stream.js';

export function initManualBindings({
  document,
  UI,
  PAGE_MODE_OVERRIDE,
  RESPONSE_MODE,
  AI_STAGE_OVERRIDE,
  availableScenarioShapes,
  selectedScenario,
  stageById,
  normalizeScenarioCanvas,
  normalizeTriggers,
  normalizeIconByShape,
  normalizeListChipIconsByShape,
  normalizeListItemsByShape,
  createIcon,
  createDefaultListItem,
  normalizeStageTextByShape,
  normalizeTypographyByShape,
  normalizeStageSizeByShape,
  normalizeImagesByShape,
  stageListItemsForShape,
  STAGE_COMPONENT_TYPES,
  clamp,
  canvasSettings,
  setCanvasSettings,
  persistCanvasSettings,
  persistBackgroundImageStorage,
  persistBackgroundVideoStorage,
  clearBackgroundImageStorage,
  clearBackgroundVideoStorage,
  persistScenarios,
  responseMode,
  setResponseMode,
  persistResponseMode,
  aiStageOverride,
  setAiStageOverride,
  persistAiStageOverride,
  renderAiStageOverrideUi,
  previewAiStageOverride,
  renderScenarioUi,
  addScenario,
  duplicateScenario,
  deleteScenario,
  commitScenarioChange,
  addStage,
  duplicateCurrentStage,
  deleteCurrentStage,
  commitStageChange,
  getScenarioImagesForStage,
  isSupportedAssetFile,
  bindTypographyInputs,
  updateLayerPreviews,
  initSidebarTabs,
  initLayerRowToggles,
  initSidebarCollapsibleSections,
  applyCanvasSettings,
  applyStagePhoneBlur,
  applyResponseModeUi,
  previewScenarioInstant,
  previewScenario,
  morphTo,
  hideRich,
  hideIntentHeader,
  handleSend,
  manualShape,
  openCustom,
  movePrototypeListSelection,
  flight,
  rebuildAnim,
  initStarfield,
  setPrototypeSelectionOverride,
  setPrototypeAiDebugState,
  getPrototypeAiDebugState,
}) {
  const syncRangeProgress = (rangeInput) => {
    if (!rangeInput || rangeInput.type !== 'range') return;
    const min = Number(rangeInput.min || 0);
    const max = Number(rangeInput.max || 100);
    const value = Number(rangeInput.value || 0);
    const progress = max > min ? clamp(((value - min) / (max - min)) * 100, 0, 100) : 0;
    rangeInput.style.setProperty('--range-progress', `${progress}%`);
  };
  Array.from(document.querySelectorAll('#left-sidebar input[type="range"], #sidebar input[type="range"]')).forEach((rangeInput) => {
    syncRangeProgress(rangeInput);
    rangeInput.addEventListener('input', () => syncRangeProgress(rangeInput));
  });

  const isEditableTarget = (target) => {
    const el = target instanceof Element ? target : null;
    if (!el) return false;
    return !!el.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])");
  };
  const stopEditableShortcutEvent = (e) => {
    if (!isEditableTarget(e.target)) return;
    e.stopImmediatePropagation();
  };
  const input = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  let stageShapeClickTimer = null;
  const THINKING_VERBS = [
    'Reasoning',
    'Thinking',
    'Searching',
    'Finalizing',
  ];
  const BLUE_AGENT_ASSET = 'assets/agents/Blue.png';
  const GREEN_AGENT_ASSET = 'assets/agents/green.png';
  const ORANGE_AGENT_ASSET = 'assets/agents/orange.png';
  const YELLOW_AGENT_ASSET = 'assets/agents/yellow.png';
  const PROTOTYPE_SKILLS = [
    {
      id: 'trip-planner',
      label: 'Travel Agent',
      src: BLUE_AGENT_ASSET,
      theme: { blobTopCore: 'rgb(177 222 255)', blobTopEdge: 'rgb(90 164 255)', blobBottomCore: 'rgb(210 232 255)', blobBottomEdge: 'rgb(48 108 226)' },
      phrases: [
        'Comparing the morning flights',
        'Moving the hotel closer in',
        'Checking the weather window',
        'Protecting a slow afternoon',
        'Making room for a detour',
        'Finding the easier transfer',
        'Reordering the day plan',
        'Saving the sunset spot',
        'Looking for the calmer route',
        'Packing less for the same trip',
      ],
    },
    {
      id: 'doc-writing',
      label: 'Writing Agent',
      src: YELLOW_AGENT_ASSET,
      theme: { blobTopCore: 'rgb(255 243 158)', blobTopEdge: 'rgb(255 212 72)', blobBottomCore: 'rgb(255 249 208)', blobBottomEdge: 'rgb(222 176 34)' },
      phrases: [
        'Outlining the big idea',
        'Finding the cleaner headline',
        'Tightening the messy sentence',
        'Smoothing the intro paragraph',
        'Pulling out the key point',
        'Reshaping the closing line',
        'Cutting the extra fluff',
        'Making the structure clearer',
        'Rewriting for warmer tone',
        'Sharpening the summary',
      ],
    },
    {
      id: 'fitness-coach',
      label: 'Fitness Agent',
      src: GREEN_AGENT_ASSET,
      theme: { blobTopCore: 'rgb(146 255 191)', blobTopEdge: 'rgb(82 214 134)', blobBottomCore: 'rgb(210 255 176)', blobBottomEdge: 'rgb(82 176 84)' },
      phrases: [
        'Adjusting the recovery day',
        'Turning down the injury risk',
        'Balancing effort with rest',
        'Building a shorter workout',
        'Checking the weekly consistency',
        'Making the routine more realistic',
        'Choosing a better warmup',
        'Keeping the momentum gentle',
        'Finding the sustainable pace',
        'Protecting tomorrow’s energy',
      ],
    },
    {
      id: 'budget',
      label: 'Budget Agent',
      src: ORANGE_AGENT_ASSET,
      theme: { blobTopCore: 'rgb(255 204 152)', blobTopEdge: 'rgb(255 144 76)', blobBottomCore: 'rgb(255 228 194)', blobBottomEdge: 'rgb(215 109 39)' },
      phrases: [
        'Checking the monthly burn',
        'Looking for hidden subscriptions',
        'Balancing bills against fun',
        'Reworking the grocery cap',
        'Setting aside travel money',
        'Pressure-testing the weekend spend',
        'Comparing fixed and flexible costs',
        'Searching for the easy save',
        'Trimming the impulse bucket',
        'Finding room for a treat',
      ],
    },
  ];
  const PROTOTYPE_APPS = [
    {
      id: 'chatgpt',
      label: 'ChatGPT',
      src: 'src/assets/figma-chatgpt.png',
      theme: { blobTopCore: 'rgb(247 249 255)', blobTopEdge: 'rgb(228 235 247)', blobBottomCore: 'rgb(255 255 255)', blobBottomEdge: 'rgb(214 223 238)' },
    },
    {
      id: 'health',
      label: 'Health',
      src: 'src/assets/figma-health.png',
      theme: { blobTopCore: 'rgb(173 255 211)', blobTopEdge: 'rgb(88 208 168)', blobBottomCore: 'rgb(125 227 255)', blobBottomEdge: 'rgb(59 143 255)' },
    },
    {
      id: 'maps',
      label: 'Maps',
      src: 'src/assets/figma-map.png',
      theme: { blobTopCore: 'rgb(170 205 255)', blobTopEdge: 'rgb(184 216 255)', blobBottomCore: 'rgb(123 180 255)', blobBottomEdge: 'rgb(37 93 255)' },
    },
    {
      id: 'gemini',
      label: 'Gemini',
      src: 'src/assets/figma-gemini.png',
      theme: { blobTopCore: 'rgb(122 183 255)', blobTopEdge: 'rgb(121 114 255)', blobBottomCore: 'rgb(203 178 255)', blobBottomEdge: 'rgb(108 64 255)' },
    },
    {
      id: 'notes',
      label: 'Notes',
      src: 'src/assets/figma-note.png',
      theme: { blobTopCore: 'rgb(255 182 182)', blobTopEdge: 'rgb(255 112 112)', blobBottomCore: 'rgb(255 146 111)', blobBottomEdge: 'rgb(209 63 63)' },
    },
    {
      id: 'weather',
      label: 'Weather',
      src: 'src/assets/figma-weather.png',
      theme: { blobTopCore: 'rgb(171 219 255)', blobTopEdge: 'rgb(85 157 255)', blobBottomCore: 'rgb(123 180 255)', blobBottomEdge: 'rgb(37 93 255)' },
    },
  ];
  const multiAgentRow = document.getElementById('prototype-multi-agent-row');
  const thinkingStateRow = document.getElementById('prototype-thinking-state-row');
  const thinkingPauseRow = document.getElementById('prototype-thinking-pause-row');
  const thinkingCopyRow = document.getElementById('prototype-thinking-copy-row');
  const thinkingStateButtons = Array.from(document.querySelectorAll('[data-thinking-state]'));
  const thinkingOrb = document.getElementById('siri-orb');
  const stageThumb = document.getElementById('c-thumb');
  const stageThumbImg = document.getElementById('c-thumb-img');
  const stageThumbLabel = document.getElementById('c-thumb-label');
  let thinkingStream = document.getElementById('prototype-thinking-stream');
  if (thinkingStream && !thinkingStream.classList.contains('g-thinking-orb-stream')) {
    thinkingStream.outerHTML = renderThinkingOrbStreamMarkup({
      id: 'prototype-thinking-stream',
      textId: 'prototype-thinking-stream-text',
      hidden: true,
    });
    thinkingStream = document.getElementById('prototype-thinking-stream');
  }
  const thinkingStreamIcon = thinkingStream?.querySelector?.('[data-thinking-orb-stream-icon]');
  const thinkingStreamText = document.getElementById('prototype-thinking-stream-text');
  const thinkingPauseBtn = document.getElementById('prototype-thinking-pause');
  const thinkingResumeBtn = document.getElementById('prototype-thinking-resume');
  const thinkingCopyInput = document.getElementById('prototype-thinking-copy-input');
  const thinkingCopyFireBtn = document.getElementById('prototype-thinking-copy-fire');
  const DEBUG_FAMILY_SHAPES = new Set(['magic']);
  const thinkingDebugState = {
    mode: 'thinking',
    familyActive: getPrototypeAiDebugState?.()?.active === true,
    paused: false,
    minimized: false,
    activeSkillId: PROTOTYPE_SKILLS[0]?.id || '',
    activeAppId: PROTOTYPE_APPS[0]?.id || '',
    pendingCustomText: '',
    streamToken: 0,
    textSwapTimer: null,
    currentText: '',
    expandedPillWidth: 80,
    verbIndex: 0,
    skillPhraseIndexById: Object.create(null),
  };
  let thinkingMinimizeExpandTimer = null;
  let thinkingMinimizePhaseTimer = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const currentPrototypeShape = () => String(document.body?.dataset?.currentShape || '').trim().toLowerCase();
  const getThinkingMinimizePhase = () => String(document.body?.dataset?.thinkingDebugMinimizePhase || '').trim().toLowerCase();
  const isThinkingCirclePhase = (shape = currentPrototypeShape()) => {
    const phase = getThinkingMinimizePhase();
    return shape === 'listening'
      || thinkingDebugState.minimized
      || phase === 'collapsing-circle'
      || phase === 'expanding-circle';
  };
  const isDebugFamilyShape = (shape = currentPrototypeShape()) => DEBUG_FAMILY_SHAPES.has(String(shape || '').trim().toLowerCase());
  const aiAgentSequence = Object.keys(AI_ORB_ICON_OPTIONS);
  const prototypeAppSequence = PROTOTYPE_APPS.map((item) => item.id);
  const getSkillById = (id) => PROTOTYPE_SKILLS.find((item) => item.id === id) || PROTOTYPE_SKILLS[0];
  const getAppById = (id) => PROTOTYPE_APPS.find((item) => item.id === id) || PROTOTYPE_APPS[0];
  const getSkillTransitionText = (skill) => {
    const baseLabel = String(skill?.label || 'Domain').replace(/\s+Agent$/i, '').trim() || 'Domain';
    return `Using ${baseLabel} skill`;
  };
  const getAgentIndex = (id) => Math.max(0, aiAgentSequence.indexOf(String(id || '').trim().toLowerCase()));
  const getAgentSwitchDirection = (fromId, toId) => {
    const currentId = String(fromId || '').trim().toLowerCase();
    const nextId = String(toId || '').trim().toLowerCase();
    if (!nextId || currentId === nextId) return 'left';
    const length = aiAgentSequence.length;
    const currentIndex = getAgentIndex(currentId);
    const nextIndex = getAgentIndex(nextId);
    const forwardDistance = (nextIndex - currentIndex + length) % length;
    const backwardDistance = (currentIndex - nextIndex + length) % length;
    return forwardDistance <= backwardDistance ? 'right' : 'left';
  };
  const cycleAgentId = (currentId, step) => {
    const length = aiAgentSequence.length;
    const currentIndex = getAgentIndex(currentId);
    return aiAgentSequence[(currentIndex + step + length) % length] || aiAgentSequence[0];
  };
  const getAppIndex = (id) => Math.max(0, prototypeAppSequence.indexOf(String(id || '').trim().toLowerCase()));
  const getAppSwitchDirection = (fromId, toId) => {
    const currentId = String(fromId || '').trim().toLowerCase();
    const nextId = String(toId || '').trim().toLowerCase();
    if (!nextId || currentId === nextId) return 'left';
    const length = prototypeAppSequence.length;
    const currentIndex = getAppIndex(currentId);
    const nextIndex = getAppIndex(nextId);
    const forwardDistance = (nextIndex - currentIndex + length) % length;
    const backwardDistance = (currentIndex - nextIndex + length) % length;
    return forwardDistance <= backwardDistance ? 'right' : 'left';
  };
  const pickDifferentEntry = (items, currentId) => {
    const pool = items.filter((item) => item.id !== currentId);
    const source = pool.length ? pool : items;
    return source[Math.floor(Math.random() * source.length)] || items[0] || null;
  };
  const getPrototypeThinkingStreamVisual = () => {
    if (thinkingDebugState.mode === 'skill') {
      const skill = getSkillById(thinkingDebugState.activeSkillId);
      return {
        src: skill?.src || '',
        alt: skill?.label ? `${skill.label} icon` : '',
      };
    }
    if (thinkingDebugState.mode === 'app') {
      const app = getAppById(thinkingDebugState.activeAppId);
      return {
        src: app?.src || '',
        alt: app?.label ? `${app.label} app icon` : '',
      };
    }
    const option = AI_ORB_ICON_OPTIONS[loadAiOrbIconId()] || AI_ORB_ICON_OPTIONS.chatgpt;
    return {
      src: option?.src || '',
      alt: option?.label ? `${option.label} orb icon` : '',
    };
  };
  const syncPrototypeThinkingStreamIcon = ({ animate = false, switchDirection = '', motion = 'crossfade' } = {}) => {
    const visual = getPrototypeThinkingStreamVisual();
    syncThinkingOrbStreamIcon(thinkingStreamIcon, {
      src: visual.src,
      alt: visual.alt,
      animate,
      switchDirection,
      motion,
    });
    syncPrototypeStageThinkingIcon();
  };
  const syncPrototypeStageThinkingIcon = () => {
    const visual = getPrototypeThinkingStreamVisual();
    if (!stageThumb || !stageThumbImg) return;
    const shape = currentPrototypeShape();
    if (shape !== 'listening' && shape !== 'magic') return;
    const iconSize = 46;
    const collapsed = isThinkingCirclePhase(shape);
    const x = collapsed ? Math.round((80 - iconSize) / 2) : 14;
    const y = Math.round((80 - iconSize) / 2);
    stageThumb.classList.add('thumb-image', 'thumb-plain-icon');
    stageThumb.classList.remove('thumb-empty');
    stageThumb.style.width = `${iconSize}px`;
    stageThumb.style.height = `${iconSize}px`;
    stageThumb.style.borderRadius = '999px';
    stageThumb.style.transform = `translate(${x}px,${y}px)`;
    stageThumb.style.opacity = '1';
    stageThumb.style.pointerEvents = 'none';
    if (stageThumbLabel) stageThumbLabel.textContent = '';
    if (visual.src && stageThumbImg.getAttribute('src') !== visual.src) stageThumbImg.src = visual.src;
    stageThumbImg.alt = visual.alt || '';
    stageThumbImg.style.width = `${iconSize}px`;
    stageThumbImg.style.height = `${iconSize}px`;
  };
  const parseTranslateY = (el) => {
    const transform = getComputedStyle(el).transform;
    if (!transform || transform === 'none') return -60;
    const m2d = transform.match(/^matrix\(([^)]+)\)$/);
    if (m2d) {
      const parts = m2d[1].split(',').map((v) => parseFloat(v.trim()));
      return Number.isFinite(parts[5]) ? parts[5] : -60;
    }
    const m3d = transform.match(/^matrix3d\(([^)]+)\)$/);
    if (m3d) {
      const parts = m3d[1].split(',').map((v) => parseFloat(v.trim()));
      return Number.isFinite(parts[13]) ? parts[13] : -60;
    }
    return -60;
  };
  const syncPrototypeThinkingContainerGeometry = (pillWidth = 80) => {
    const main = document.getElementById('drop-main');
    const shape = currentPrototypeShape();
    if (!main || (shape !== 'listening' && shape !== 'magic')) return;
    const collapsed = isThinkingCirclePhase(shape);
    const requestedWidth = Math.max(80, Math.round(Number(pillWidth) || 80));
    if (!collapsed) thinkingDebugState.expandedPillWidth = requestedWidth;
    const width = collapsed ? 80 : requestedWidth;
    const y = parseTranslateY(main);
    const scale = shape === 'magic' && thinkingDebugState.minimized ? 0.2 : 1;
    const tx = -width / 2;
    main.style.width = `${width}px`;
    main.style.height = '80px';
    main.style.setProperty('--g-stage-h', '80px');
    main.style.borderRadius = '999px';
    main.style.transformOrigin = '50% 100%';
    main.style.transform = `translate(${tx}px, ${y}px) scale(${scale})`;
  };
  const syncPrototypeThinkingStreamMetrics = (text) => {
    if (!thinkingStream || !thinkingStreamText) return;
    const metrics = syncThinkingOrbStreamText(thinkingStream, thinkingStreamText, text || 'Thinking', {
      metrics: {
        iconSize: 46,
        gap: 10,
        paddingX: { left: 14, right: 20 },
        minWidth: 80,
      },
      font: '500 20px "DM Sans", sans-serif',
      setText: false,
    });
    thinkingDebugState.expandedPillWidth = metrics.pillWidth || 80;
    syncPrototypeThinkingContainerGeometry(metrics.pillWidth || 80);
    syncPrototypeStageThinkingIcon();
  };
  const syncPrototypeThinkingStreamShape = () => {
    if (!thinkingStream) return;
    const shape = currentPrototypeShape();
    const collapsed = isThinkingCirclePhase(shape);
    thinkingStream.classList.toggle('is-collapsed-stream', collapsed);
    if (shape === 'magic') {
      syncPrototypeThinkingContainerGeometry(collapsed ? 80 : thinkingDebugState.expandedPillWidth || 80);
      syncPrototypeStageThinkingIcon();
    }
    if (shape === 'listening') {
      syncPrototypeThinkingStreamIcon();
      syncPrototypeThinkingStreamMetrics(thinkingDebugState.currentText || 'Thinking');
      syncPrototypeStageThinkingIcon();
      setThinkingOrbStreamVisible(thinkingStream, true);
    }
  };
  const setThinkingStreamVisible = (visible) => {
    if (!thinkingStream) return;
    setThinkingOrbStreamVisible(thinkingStream, visible);
  };
  const setThinkingStreamPausedStyle = (paused) => {
    if (!thinkingStream) return;
    thinkingStream.classList.toggle('is-paused-debug', !!paused);
  };
  const clearThinkingStream = () => {
    thinkingDebugState.currentText = '';
    if (thinkingStreamText) thinkingStreamText.textContent = '';
    setThinkingStreamPausedStyle(false);
  };
  const isThinkingMinimizable = (shape = currentPrototypeShape()) => (
    thinkingDebugState.familyActive
    && String(shape || '').trim().toLowerCase() === 'magic'
    && thinkingDebugState.mode === 'thinking'
  );
  const syncThinkingOrbToggleUi = () => {
    const enabled = isThinkingMinimizable();
    if (!enabled) {
      thinkingDebugState.minimized = false;
      document.body?.removeAttribute('data-thinking-debug-minimize-phase');
      if (thinkingMinimizeExpandTimer) {
        clearTimeout(thinkingMinimizeExpandTimer);
        thinkingMinimizeExpandTimer = null;
      }
      if (thinkingMinimizePhaseTimer) {
        clearTimeout(thinkingMinimizePhaseTimer);
        thinkingMinimizePhaseTimer = null;
      }
    }
    if (thinkingDebugState.minimized) document.body?.setAttribute('data-thinking-debug-minimized', 'true');
    else document.body?.removeAttribute('data-thinking-debug-minimized');
    syncPrototypeThinkingStreamShape();
    if (!(thinkingOrb instanceof HTMLElement)) return;
    if (!enabled) {
      thinkingOrb.tabIndex = -1;
      thinkingOrb.removeAttribute('role');
      thinkingOrb.removeAttribute('aria-label');
      thinkingOrb.removeAttribute('aria-pressed');
      thinkingOrb.removeAttribute('title');
      return;
    }
    const nextLabel = thinkingDebugState.minimized ? 'Expand thinking orb' : 'Minimize thinking orb';
    thinkingOrb.tabIndex = 0;
    thinkingOrb.setAttribute('role', 'button');
    thinkingOrb.setAttribute('aria-label', nextLabel);
    thinkingOrb.setAttribute('aria-pressed', thinkingDebugState.minimized ? 'true' : 'false');
    thinkingOrb.setAttribute('title', nextLabel);
  };
  const setThinkingDebugMinimized = (minimized) => {
    const canMinimize = isThinkingMinimizable();
    const next = Boolean(minimized) && canMinimize;
    if (thinkingMinimizeExpandTimer) {
      clearTimeout(thinkingMinimizeExpandTimer);
      thinkingMinimizeExpandTimer = null;
    }
    if (thinkingMinimizePhaseTimer) {
      clearTimeout(thinkingMinimizePhaseTimer);
      thinkingMinimizePhaseTimer = null;
    }
    if (!canMinimize && !thinkingDebugState.minimized && !getThinkingMinimizePhase()) {
      syncThinkingOrbToggleUi();
      return;
    }
    if (next) {
      if (thinkingDebugState.minimized) {
        syncThinkingOrbToggleUi();
        return;
      }
      thinkingDebugState.minimized = true;
      document.body?.setAttribute('data-thinking-debug-minimize-phase', 'collapsing-circle');
      syncThinkingOrbToggleUi();
      thinkingMinimizePhaseTimer = setTimeout(() => {
        thinkingMinimizePhaseTimer = null;
        document.body?.removeAttribute('data-thinking-debug-minimize-phase');
        syncThinkingOrbToggleUi();
      }, 1200);
      return;
    }
    if (!thinkingDebugState.minimized && getThinkingMinimizePhase() !== 'collapsing-circle') {
      document.body?.removeAttribute('data-thinking-debug-minimize-phase');
      syncThinkingOrbToggleUi();
      return;
    }
    thinkingDebugState.minimized = false;
    document.body?.setAttribute('data-thinking-debug-minimize-phase', 'expanding-circle');
    syncThinkingOrbToggleUi();
    thinkingMinimizeExpandTimer = setTimeout(() => {
      thinkingMinimizeExpandTimer = null;
      document.body?.removeAttribute('data-thinking-debug-minimize-phase');
      syncThinkingOrbToggleUi();
    }, 1000);
  };
  const toggleThinkingDebugMinimized = () => {
    if (!isThinkingMinimizable()) return;
    setThinkingDebugMinimized(!thinkingDebugState.minimized);
  };
  const syncPrototypeDebugState = () => {
    if (thinkingDebugState.familyActive) {
      document.body?.setAttribute('data-thinking-debug-family-active', 'true');
      document.body?.setAttribute('data-thinking-debug-mode', thinkingDebugState.mode || 'thinking');
    } else {
      document.body?.removeAttribute('data-thinking-debug-family-active');
      document.body?.removeAttribute('data-thinking-debug-mode');
    }
    setPrototypeAiDebugState?.({
      active: thinkingDebugState.familyActive,
      mode: thinkingDebugState.mode,
    });
    syncThinkingOrbToggleUi();
  };
  const setThinkingFamilyActive = (active) => {
    thinkingDebugState.familyActive = !!active;
    syncPrototypeDebugState();
  };
  const syncThinkingPauseButtons = () => {
    const inDebugFamily = isDebugFamilyShape();
    if (thinkingPauseBtn) {
      thinkingPauseBtn.disabled = !inDebugFamily || thinkingDebugState.paused;
      thinkingPauseBtn.setAttribute('aria-pressed', thinkingDebugState.paused ? 'true' : 'false');
    }
    if (thinkingResumeBtn) {
      thinkingResumeBtn.disabled = !thinkingDebugState.paused;
      thinkingResumeBtn.setAttribute('aria-pressed', thinkingDebugState.paused ? 'true' : 'false');
    }
  };
  const setThinkingDebugPaused = (paused) => {
    thinkingDebugState.paused = !!paused;
    if (thinkingDebugState.paused) document.body?.setAttribute('data-thinking-debug-paused', 'true');
    else document.body?.removeAttribute('data-thinking-debug-paused');
    setThinkingStreamPausedStyle(thinkingDebugState.paused);
    syncThinkingPauseButtons();
  };
  const cancelThinkingStreamPlayback = () => {
    thinkingDebugState.streamToken += 1;
    if (thinkingDebugState.textSwapTimer) {
      clearTimeout(thinkingDebugState.textSwapTimer);
      thinkingDebugState.textSwapTimer = null;
    }
    thinkingStream?.classList.remove('is-text-transitioning');
  };
  const setThinkingStreamText = (text, { pausedStyle = false, visible = true } = {}) => {
    const value = String(text || '');
    thinkingDebugState.currentText = value;
    syncPrototypeThinkingStreamIcon();
    syncPrototypeThinkingStreamMetrics(value || 'Thinking');
    if (thinkingStreamText) thinkingStreamText.textContent = value;
    setThinkingStreamVisible(visible && !!value);
    setThinkingStreamPausedStyle(pausedStyle);
  };
  const getPausedThinkingText = () => 'Session paused';
  const playPauseOrbBounce = () => {
    const orb = document.querySelector('#siri-orb');
    if (!(orb instanceof HTMLElement)) return;
    if (orb._prototypePauseBounceAnim) {
      orb._prototypePauseBounceAnim.cancel();
      orb._prototypePauseBounceAnim = null;
    }
    orb.style.transformOrigin = '50% 50%';
    const anim = orb.animate([
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(0.93)', offset: 0.28 },
      { transform: 'scale(1.018)', offset: 0.7 },
      { transform: 'scale(1)', offset: 1 },
    ], {
      duration: 460,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'none',
    });
    orb._prototypePauseBounceAnim = anim;
    const clear = () => {
      if (orb._prototypePauseBounceAnim !== anim) return;
      orb._prototypePauseBounceAnim = null;
    };
    anim.onfinish = clear;
    anim.oncancel = clear;
  };
  const renderPausedThinkingStream = ({ animate = false } = {}) => {
    cancelThinkingStreamPlayback();
    const pausedText = getPausedThinkingText();
    if (!animate) {
      setThinkingStreamText(pausedText, {
        pausedStyle: false,
        visible: true,
      });
      return;
    }
    void transitionThinkingText(pausedText, { allowWhilePaused: true });
  };
  const stopThinkingStream = () => {
    cancelThinkingStreamPlayback();
    clearThinkingStream();
    setThinkingStreamVisible(false);
  };
  const waitForStream = async (ms, token) => {
    await sleep(ms);
    return token === thinkingDebugState.streamToken;
  };
  const showThinkingTextCrossfade = async (text, token, { animate = true } = {}) => {
    const value = String(text || '').trim();
    if (!value || !thinkingStreamText || token !== thinkingDebugState.streamToken) return false;
    if (thinkingDebugState.textSwapTimer) {
      clearTimeout(thinkingDebugState.textSwapTimer);
      thinkingDebugState.textSwapTimer = null;
    }
    syncPrototypeThinkingStreamIcon();
    syncPrototypeThinkingStreamMetrics(value);
    setThinkingStreamVisible(true);
    setThinkingStreamPausedStyle(false);
    if (!animate || !thinkingDebugState.currentText || thinkingDebugState.currentText === value) {
      thinkingDebugState.currentText = value;
      thinkingStreamText.textContent = value;
      thinkingStream?.classList.remove('is-text-transitioning');
      return token === thinkingDebugState.streamToken;
    }
    thinkingStream?.classList.add('is-text-transitioning');
    await new Promise((resolve) => {
      thinkingDebugState.textSwapTimer = setTimeout(resolve, 140);
    });
    thinkingDebugState.textSwapTimer = null;
    if (token !== thinkingDebugState.streamToken) return false;
    thinkingDebugState.currentText = value;
    thinkingStreamText.textContent = value;
    requestAnimationFrame(() => {
      if (token !== thinkingDebugState.streamToken) return;
      thinkingStream?.classList.remove('is-text-transitioning');
    });
    return token === thinkingDebugState.streamToken;
  };
  const playThinkingTextOnce = async (text, { holdMs = 2200, clearAfter = true } = {}) => {
    const value = String(text || '').trim();
    if (!value || thinkingDebugState.paused) return false;
    const token = ++thinkingDebugState.streamToken;
    setThinkingStreamVisible(true);
    setThinkingStreamPausedStyle(false);
    const typed = await showThinkingTextCrossfade(value, token);
    if (!typed) return false;
    if (!clearAfter) return token === thinkingDebugState.streamToken;
    if (!(await waitForStream(holdMs, token))) return false;
    setThinkingStreamVisible(false);
    return token === thinkingDebugState.streamToken;
  };
  const runThinkingTextLoop = async ({ initialText = '', items = [], indexKey = null, holdMs = 2200, shouldContinue, nextText = null }) => {
    if (thinkingDebugState.paused) return;
    const token = ++thinkingDebugState.streamToken;
    setThinkingStreamVisible(true);
    setThinkingStreamPausedStyle(false);
    if (initialText) {
      const initialTyped = await showThinkingTextCrossfade(initialText, token);
      if (!initialTyped) return;
      if (!(await waitForStream(1200, token))) return;
    }
    while (token === thinkingDebugState.streamToken && shouldContinue()) {
      const text = typeof nextText === 'function'
        ? nextText()
        : items.length
          ? items[((thinkingDebugState[indexKey] || 0) % items.length)]
          : '';
      if (!text) return;
      if (indexKey) thinkingDebugState[indexKey] = (thinkingDebugState[indexKey] || 0) + 1;
      const typed = await showThinkingTextCrossfade(text, token);
      if (!typed) return;
      if (!(await waitForStream(holdMs, token))) return;
    }
  };
  const runThinkingVerbLoop = async () => runThinkingTextLoop({
    items: THINKING_VERBS,
    indexKey: 'verbIndex',
    shouldContinue: () => currentPrototypeShape() === 'magic' && thinkingDebugState.mode === 'thinking',
  });
  const runSkillPhraseLoop = async (skill, { transitionText = '' } = {}) => {
    if (!skill) return;
    thinkingDebugState.skillPhraseIndexById[skill.id] = thinkingDebugState.skillPhraseIndexById[skill.id] || 0;
    await runThinkingTextLoop({
      initialText: transitionText,
      holdMs: 2200,
      shouldContinue: () => currentPrototypeShape() === 'magic' && thinkingDebugState.mode === 'skill' && thinkingDebugState.activeSkillId === skill.id,
      nextText: () => {
        const phrases = skill.phrases || [];
        if (!phrases.length) return '';
        const nextIndex = thinkingDebugState.skillPhraseIndexById[skill.id] || 0;
        thinkingDebugState.skillPhraseIndexById[skill.id] = nextIndex + 1;
        return phrases[nextIndex % phrases.length];
      },
    });
  };
  const transitionThinkingText = async (text, { allowWhilePaused = false } = {}) => {
    const value = String(text || '').trim();
    if (!value || (thinkingDebugState.paused && !allowWhilePaused)) return false;
    const token = ++thinkingDebugState.streamToken;
    return showThinkingTextCrossfade(value, token);
  };
  const playPausedThinkingTransition = async (text, { holdMs = 1200 } = {}) => {
    const value = String(text || '').trim();
    if (!value || !thinkingDebugState.paused) return false;
    const typed = await transitionThinkingText(value, { allowWhilePaused: true });
    if (!typed) return false;
    const token = thinkingDebugState.streamToken;
    if (!(await waitForStream(holdMs, token))) return false;
    if (!thinkingDebugState.paused) return false;
    return transitionThinkingText(getPausedThinkingText(), { allowWhilePaused: true });
  };
  const syncThinkingStateButtons = () => {
    thinkingStateButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.thinkingState === thinkingDebugState.mode);
    });
  };
  const syncThinkingCopyFireButton = () => {
    if (!thinkingCopyFireBtn) return;
    thinkingCopyFireBtn.disabled = !String(thinkingCopyInput?.value || '').trim();
  };
  const setSkillSelectionOverride = (skill) => {
    setPrototypeSelectionOverride?.(skill ? {
      enabled: true,
      renderShape: 'pill',
      theme: skill.theme,
    } : null);
  };
  const resumeThinkingPlaybackForCurrentMode = () => {
    if (thinkingDebugState.paused || !isDebugFamilyShape()) return;
    if (thinkingDebugState.mode === 'thinking') {
      void runThinkingVerbLoop();
      return;
    }
    if (thinkingDebugState.mode === 'skill') {
      void runSkillPhraseLoop(getSkillById(thinkingDebugState.activeSkillId), { transitionText: '' });
      return;
    }
    stopThinkingStream();
  };
  const pausePrototypeThinkingDebug = () => {
    if (!isDebugFamilyShape() || thinkingDebugState.paused) return;
    setThinkingDebugPaused(true);
    playPauseOrbBounce();
    renderPausedThinkingStream({ animate: true });
  };
  const resumePrototypeThinkingDebug = async () => {
    if (!thinkingDebugState.paused) return;
    setThinkingDebugPaused(false);
    const pendingText = String(thinkingDebugState.pendingCustomText || '').trim();
    thinkingDebugState.pendingCustomText = '';
    if (pendingText) {
      const played = await playThinkingTextOnce(pendingText, {
        holdMs: 2200,
        clearAfter: true,
      });
      if (!played || thinkingDebugState.paused) return;
    }
    resumeThinkingPlaybackForCurrentMode();
  };
  const renderPrototypeDebugMode = ({ reroll = false, explicitAgentId = null, forceRemorph = false } = {}) => {
    const shape = currentPrototypeShape();
    const activeAgentId = loadAiOrbIconId();
    const isPaused = thinkingDebugState.paused;
    syncThinkingStateButtons();
    syncThinkingPauseButtons();
    if (thinkingDebugState.mode === 'thinking') {
      setThinkingFamilyActive(true);
      setSkillSelectionOverride(null);
      if (shape !== 'magic' || forceRemorph) {
        manualShape('magic');
        return;
      }
      syncPrototypeThinkingStreamIcon();
      if (isPaused) {
        renderPausedThinkingStream();
        return;
      }
      void runThinkingVerbLoop();
      return;
    }
    if (thinkingDebugState.mode === 'skill') {
      const nextSkill = reroll
        ? pickDifferentEntry(PROTOTYPE_SKILLS, thinkingDebugState.activeSkillId)
        : getSkillById(thinkingDebugState.activeSkillId);
      if (!nextSkill) return;
      const skillTransitionText = isPaused ? '' : getSkillTransitionText(nextSkill);
      thinkingDebugState.activeSkillId = nextSkill.id;
      setThinkingFamilyActive(true);
      setSkillSelectionOverride(nextSkill);
      if (shape !== 'magic') {
        manualShape('magic');
        return;
      }
      syncPrototypeThinkingStreamIcon({
        animate: reroll || forceRemorph,
        switchDirection: reroll ? 'right' : '',
      });
      if (isPaused) {
        renderPausedThinkingStream();
        return;
      }
      void runSkillPhraseLoop(nextSkill, {
        transitionText: skillTransitionText,
      });
      return;
    }
    if (thinkingDebugState.mode === 'app') {
      const currentApp = getAppById(thinkingDebugState.activeAppId);
      const nextApp = reroll
        ? pickDifferentEntry(PROTOTYPE_APPS, currentApp?.id)
        : currentApp;
      if (!nextApp) return;
      const switchDirection = getAppSwitchDirection(currentApp?.id, nextApp.id);
      const transitionLabel = `Launching ${nextApp.label}`;
      thinkingDebugState.activeAppId = nextApp.id;
      setThinkingFamilyActive(true);
      if (isPaused) cancelThinkingStreamPlayback();
      else stopThinkingStream();
      setSkillSelectionOverride(null);
      if (shape !== 'magic') {
        manualShape('magic');
        return;
      }
      syncPrototypeThinkingStreamIcon({ animate: true, switchDirection });
      if (isPaused) renderPausedThinkingStream();
      else void transitionThinkingText(transitionLabel);
      return;
    }
    const nextAgentId = explicitAgentId || (
      reroll
        ? pickDifferentEntry(Object.values(AI_ORB_ICON_OPTIONS), activeAgentId)?.id
        : activeAgentId
    );
    const nextAgent = AI_ORB_ICON_OPTIONS[nextAgentId];
    if (!nextAgent) return;
    const switchDirection = getAgentSwitchDirection(activeAgentId, nextAgent.id);
    const switchingAgent = nextAgent.id !== activeAgentId;
    const transitionLabel = switchingAgent ? `Switch to ${nextAgent.label}` : '';
    persistAiOrbIconId(nextAgent.id);
    setThinkingFamilyActive(true);
    if (isPaused) cancelThinkingStreamPlayback();
    else stopThinkingStream();
    setSkillSelectionOverride(null);
    if (shape !== 'magic') {
      manualShape('magic');
      return;
    }
    syncPrototypeThinkingStreamIcon({
      animate: switchingAgent || forceRemorph,
      switchDirection,
    });
    if (isPaused) {
      if (transitionLabel) void playPausedThinkingTransition(transitionLabel);
      else renderPausedThinkingStream();
    }
    else if (transitionLabel) void transitionThinkingText(transitionLabel);
    syncAiOrbIconButtons();
  };
  const switchAgentByStep = (step) => {
    const shape = currentPrototypeShape();
    if (shape !== 'listening' && shape !== 'magic') return false;
    if (shape === 'magic' && thinkingDebugState.mode !== 'thinking') return false;
    const currentId = loadAiOrbIconId();
    const nextId = cycleAgentId(currentId, step);
    if (!nextId || nextId === currentId) return false;
    const switchDirection = step > 0 ? 'right' : 'left';
    persistAiOrbIconId(nextId);
    syncPrototypeThinkingStreamIcon({ animate: true, switchDirection });
    syncAiOrbIconButtons();
    return true;
  };
  const syncPrototypeAiDebugPanels = () => {
    const shape = currentPrototypeShape();
    const inDebugFamily = isDebugFamilyShape(shape);
    syncPrototypeThinkingStreamShape();
    setThinkingFamilyActive(inDebugFamily);
    multiAgentRow?.classList.toggle('hidden', shape !== 'listening' && !(shape === 'magic' && thinkingDebugState.mode === 'agent'));
    thinkingStateRow?.classList.toggle('hidden', !inDebugFamily);
    thinkingPauseRow?.classList.toggle('hidden', !inDebugFamily);
    thinkingCopyRow?.classList.toggle('hidden', !inDebugFamily);
    syncThinkingPauseButtons();
    if (shape === 'magic') {
      setSkillSelectionOverride(null);
      if (thinkingDebugState.mode !== 'thinking') {
        renderPrototypeDebugMode({ forceRemorph: true });
        return;
      }
      syncPrototypeThinkingStreamIcon();
      if (thinkingDebugState.paused) {
        renderPausedThinkingStream();
        syncThinkingStateButtons();
        return;
      }
      void runThinkingVerbLoop();
      return;
    }
    if (shape === 'listening') {
      setThinkingDebugPaused(false);
      thinkingDebugState.currentText = '';
      if (thinkingStreamText) thinkingStreamText.textContent = '';
      syncPrototypeThinkingStreamShape();
      syncThinkingStateButtons();
      return;
    }
    if (!inDebugFamily) {
      setThinkingDebugPaused(false);
      thinkingDebugState.pendingCustomText = '';
      setSkillSelectionOverride(null);
      stopThinkingStream();
      syncThinkingStateButtons();
    }
  };

  const commitPhoneFrameSize = (axis, rawValue) => {
    const parsed = parseInt(String(rawValue || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    const key = axis === 'w' ? 'phoneFrameWidth' : 'phoneFrameHeight';
    const bounded = axis === 'w' ? clamp(parsed, 240, 600) : clamp(parsed, 420, 1200);
    const next = { ...canvasSettings(), [key]: bounded };
    setCanvasSettings(next);
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
  };

  const commitStageRadius = (rawValue) => {
    const scenario = selectedScenario();
    const stage = stageById(scenario?.shape);
    if (!stage) return;
    const parsed = parseInt(String(rawValue || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    const nextRadius = clamp(Math.round(parsed / 10) * 10, 0, 100);
    commitStageChange(stage.id, (draft) => { draft.cornerRadius = nextRadius; });
  };

  const commitStageSizeOverride = (axis, rawValue) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    const value = String(rawValue || '').trim();
    const key = axis === 'width' ? 'widthOverride' : 'heightOverride';
    if (!value) {
      commitScenarioChange((draftScenario) => {
        draftScenario.content.sizeByShape = normalizeStageSizeByShape(draftScenario.content.sizeByShape, draftScenario.shape, draftScenario.content);
        draftScenario.content.sizeByShape[draftScenario.shape][key] = null;
      });
      return;
    }
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const bounded = clamp(Math.round(parsed / 10) * 10, 40, 420);
    commitScenarioChange((draftScenario) => {
      draftScenario.content.sizeByShape = normalizeStageSizeByShape(draftScenario.content.sizeByShape, draftScenario.shape, draftScenario.content);
      draftScenario.content.sizeByShape[draftScenario.shape][key] = bounded;
    });
  };

  const commitStageImagePadding = (rawValue) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    const value = String(rawValue || '').trim();
    const parsed = value ? parseInt(value, 10) : 24;
    if (!Number.isFinite(parsed)) return;
    const bounded = clamp(parsed, 0, 30);
    commitScenarioChange((draftScenario) => {
      draftScenario.content.cardImagePaddingByShape = draftScenario.content.cardImagePaddingByShape || {};
      draftScenario.content.cardImagePaddingByShape[draftScenario.shape] = bounded;
    });
  };

  const commitStageGapOverride = (rawValue) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    const value = String(rawValue || '').trim();
    if (!value) return void commitStageChange(stage.id, (draft) => { draft.iconTextGap = null; });
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    commitStageChange(stage.id, (draft) => { draft.iconTextGap = clamp(parsed, 0, 30); });
  };

  const commitStageIconPadOverride = (rawValue) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    const value = String(rawValue || '').trim();
    if (!value) return void commitStageChange(stage.id, (draft) => { draft.iconLeftPadding = null; });
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    commitStageChange(stage.id, (draft) => { draft.iconLeftPadding = clamp(parsed, 0, 30); });
  };

  const commitStageSelectedMaskBlur = (rawValue) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    const parsed = Number.parseFloat(String(rawValue || '').trim());
    if (!Number.isFinite(parsed)) return;
    const bounded = clamp(parsed, 0, 30);
    commitScenarioChange((draft) => {
      draft.content.selectedMaskBlurByShape = { ...(draft.content.selectedMaskBlurByShape || {}) };
      draft.content.selectedMaskBlurByShape[draft.shape] = bounded;
    });
  };

  input.addEventListener('input', () => sendBtn.classList.toggle('active', input.value.trim().length > 0));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      handleSend();
    }
    e.stopPropagation();
  });

  document.addEventListener('keydown', stopEditableShortcutEvent, true);
  document.addEventListener('keypress', stopEditableShortcutEvent, true);

  document.addEventListener('keydown', (e) => {
    if (isEditableTarget(e.target) || document.activeElement?.matches?.("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
    if (flight.handleKeyDown(e)) return;
    const activeStageShape = selectedScenario()?.shape;
    const activeRenderShape = activeStageShape ? stageById(activeStageShape, selectedScenario())?.renderShape : '';
    const activeStage = activeStageShape ? stageById(activeStageShape, selectedScenario()) : null;
    const listSelectable = activeStage?.listSelectable !== false;
    if (activeRenderShape === 'list' && listSelectable && e.key === 'ArrowUp') {
      e.preventDefault();
      movePrototypeListSelection?.(-1);
      return;
    }
    if (activeRenderShape === 'list' && listSelectable && e.key === 'ArrowDown') {
      e.preventDefault();
      movePrototypeListSelection?.(1);
      return;
    }
    if (e.key.toLowerCase() === 'm' && isThinkingMinimizable()) {
      e.preventDefault();
      toggleThinkingDebugMinimized();
      return;
    }
    if (e.key === 'ArrowRight' && switchAgentByStep(1)) {
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft' && switchAgentByStep(-1)) {
      e.preventDefault();
      return;
    }
    if (e.key === '1') manualShape('circle');
    if (e.key === '2') manualShape('dot');
    if (e.key === '3') manualShape('pill');
    if (e.key === '4') manualShape('card');
    if (e.key === '5') manualShape('list');
    if (e.key === '8') manualShape('ai');
    if (e.key === '6') manualShape('split');
    if (e.key === '7') openCustom();
    if (e.key === 'Escape') {
      document.getElementById('stage').classList.remove('flow-active');
      document.getElementById('input-area').classList.remove('hidden');
      hideRich();
      hideIntentHeader();
      previewScenario(selectedScenario());
    }
  });

  document.querySelectorAll('.bz-inp, .sp-inp, .sb-input, .sb-textarea, .typo-color').forEach((inp) => {
    inp.addEventListener('keydown', (e) => e.stopImmediatePropagation());
    inp.addEventListener('keypress', (e) => e.stopImmediatePropagation());
  });

  if (UI.modeToggle && !PAGE_MODE_OVERRIDE) {
    UI.modeToggle.addEventListener('change', () => {
      setResponseMode(UI.modeToggle.checked ? RESPONSE_MODE.AI : RESPONSE_MODE.MANUAL);
      persistResponseMode();
      applyResponseModeUi();
      if (responseMode() === RESPONSE_MODE.AI) {
        hideRich();
        hideIntentHeader();
        document.getElementById('stage').classList.remove('flow-active');
        document.getElementById('input-area').classList.remove('hidden');
        previewAiStageOverride();
      }
    });
  }

  UI.aiStageButtons.forEach((button) => button.addEventListener('click', () => {
    const stage = button.dataset.aiStage;
    if (!Object.values(AI_STAGE_OVERRIDE).includes(stage)) return;
    setAiStageOverride(stage);
    persistAiStageOverride();
    renderAiStageOverrideUi();
    previewAiStageOverride();
  }));

  const aiOrbIconButtons = Array.from(document.querySelectorAll('[data-ai-orb-icon]'));
  const syncAiOrbIconButtons = () => {
    const activeIcon = loadAiOrbIconId();
    aiOrbIconButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.aiOrbIcon === activeIcon);
      const option = AI_ORB_ICON_OPTIONS[button.dataset.aiOrbIcon];
      if (option) button.setAttribute('aria-pressed', button.dataset.aiOrbIcon === activeIcon ? 'true' : 'false');
    });
  };
  aiOrbIconButtons.forEach((button) => button.addEventListener('click', () => {
    const currentId = loadAiOrbIconId();
    const iconId = String(button.dataset.aiOrbIcon || '').trim().toLowerCase();
    if (!iconId) return;
    persistAiOrbIconId(iconId);
    const currentIndex = getAgentIndex(currentId);
    const nextIndex = getAgentIndex(iconId);
    const switchDirection = nextIndex === currentIndex
      ? 'left'
      : ((nextIndex - currentIndex + aiAgentSequence.length) % aiAgentSequence.length) <= ((currentIndex - nextIndex + aiAgentSequence.length) % aiAgentSequence.length)
        ? 'right'
        : 'left';
    if (currentPrototypeShape() === 'magic') {
      thinkingDebugState.mode = 'thinking';
    }
    syncPrototypeThinkingStreamIcon({ animate: true, switchDirection });
    syncAiOrbIconButtons();
  }));
  syncAiOrbIconButtons();
  syncThinkingPauseButtons();
  thinkingOrb?.addEventListener('click', (e) => {
    if (!isThinkingMinimizable()) return;
    e.preventDefault();
    e.stopPropagation();
    toggleThinkingDebugMinimized();
  });
  thinkingOrb?.addEventListener('keydown', (e) => {
    if (!isThinkingMinimizable()) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    toggleThinkingDebugMinimized();
  });

  thinkingStateButtons.forEach((button) => button.addEventListener('click', () => {
    const nextMode = String(button.dataset.thinkingState || '').trim().toLowerCase();
    if (!nextMode) return;
    if (nextMode === 'thinking') {
      thinkingDebugState.mode = 'thinking';
      renderPrototypeDebugMode();
      return;
    }
    if (nextMode === 'skill') {
      thinkingDebugState.mode = 'skill';
      renderPrototypeDebugMode({ reroll: true });
      return;
    }
    if (nextMode === 'agent') {
      thinkingDebugState.mode = 'agent';
      renderPrototypeDebugMode({ reroll: true });
      return;
    }
    if (nextMode === 'app') {
      thinkingDebugState.mode = 'app';
      renderPrototypeDebugMode({ reroll: true });
    }
  }));
  thinkingPauseBtn?.addEventListener('click', pausePrototypeThinkingDebug);
  thinkingResumeBtn?.addEventListener('click', () => {
    void resumePrototypeThinkingDebug();
  });
  const fireCustomThinkingText = () => {
    const text = String(thinkingCopyInput?.value || '').trim();
    if (!text || !isDebugFamilyShape()) return;
    if (thinkingDebugState.paused) {
      thinkingDebugState.pendingCustomText = text;
      if (thinkingCopyInput) thinkingCopyInput.value = '';
      syncThinkingCopyFireButton();
      return;
    }
    void transitionThinkingText(text);
    if (thinkingCopyInput) thinkingCopyInput.value = '';
    syncThinkingCopyFireButton();
  };
  thinkingCopyInput?.addEventListener('input', syncThinkingCopyFireButton);
  thinkingCopyInput?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    fireCustomThinkingText();
  });
  thinkingCopyFireBtn?.addEventListener('click', fireCustomThinkingText);
  syncThinkingCopyFireButton();

  new MutationObserver(syncPrototypeAiDebugPanels).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-current-shape'],
  });
  syncPrototypeAiDebugPanels();

  const revokeBackgroundVideoObjectUrl = (video) => {
    const objectUrl = typeof video?.objectUrl === 'string' ? video.objectUrl : '';
    if (!objectUrl || !objectUrl.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {}
  };
  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const updateCanvas = (updates) => { setCanvasSettings({ ...canvasSettings(), ...updates }); persistCanvasSettings(); applyCanvasSettings(); };
  UI.bgToggle.addEventListener('change', () => updateCanvas({ backgroundEnabled: UI.bgToggle.checked }));
  UI.bgImageSelect?.addEventListener('change', () => updateCanvas({
    backgroundImage: UI.bgImageSelect.value,
    backgroundEnabled: true,
    backgroundMediaKind: 'image',
  }));
  UI.bgImageUpload?.addEventListener('click', (e) => { e.target.value = ''; });
  UI.bgImageUpload?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) return void (e.target.value = '');
    const dataUrl = await readFileAsDataUrl(file).catch(() => '');
    if (!dataUrl) return;
    updateCanvas({
      backgroundImage: dataUrl,
      backgroundImageAlpha: canvasSettings().backgroundImageAlpha ?? 0.9,
      backgroundEnabled: true,
      backgroundMediaKind: 'image',
    });
    persistBackgroundImageStorage?.({
      src: dataUrl,
      name: String(file.name || 'uploaded image'),
      alpha: clamp(Number(canvasSettings().backgroundImageAlpha ?? 0.9), 0, 1),
    });
    e.target.value = '';
  });
  UI.bgImageReset?.addEventListener('click', () => {
    updateCanvas({
      backgroundImage: UI.bgImageSelect?.value || 'assets/bg/living room.jpg',
      backgroundImageAlpha: canvasSettings().backgroundImageAlpha ?? 0.9,
      backgroundEnabled: true,
      backgroundMediaKind: 'image',
    });
    clearBackgroundImageStorage?.();
    if (UI.bgImageUpload) UI.bgImageUpload.value = '';
  });
  UI.bgImageAlpha?.addEventListener('input', (e) => {
    const alpha = clamp((Number(e.target.value) || 0) / 100, 0, 1);
    setCanvasSettings({
      ...canvasSettings(),
      backgroundImageAlpha: alpha,
      backgroundMediaKind: canvasSettings().backgroundMediaKind === 'video' ? 'video' : 'image',
    });
    persistCanvasSettings();
    if (String(canvasSettings().backgroundImage || '').startsWith('data:')) {
      persistBackgroundImageStorage?.({
        alpha,
      });
    }
    applyCanvasSettings();
  });
  UI.bgVideoUpload?.addEventListener('click', (e) => { e.target.value = ''; });
  UI.bgVideoUpload?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('video/')) return void (e.target.value = '');
    const previousVideo = canvasSettings().backgroundVideo;
    const objectUrl = URL.createObjectURL(file);
    revokeBackgroundVideoObjectUrl(previousVideo);
    setCanvasSettings({
      ...canvasSettings(),
      backgroundEnabled: true,
      backgroundMediaKind: 'video',
      backgroundVideoPaused: false,
      backgroundVideoProgress: 0,
      backgroundVideoAlpha: canvasSettings().backgroundVideoAlpha ?? 0.8,
      backgroundVideo: {
        src: objectUrl,
        objectUrl,
        name: String(file.name || ''),
        type: String(file.type || ''),
      },
    });
    persistCanvasSettings();
    applyCanvasSettings();
    e.target.value = '';
    const dataUrl = await readFileAsDataUrl(file).catch(() => '');
    if (!dataUrl || canvasSettings().backgroundVideo?.objectUrl !== objectUrl) return;
    persistBackgroundVideoStorage?.({
      src: dataUrl,
      name: String(file.name || 'uploaded video'),
      type: String(file.type || ''),
      paused: canvasSettings().backgroundVideoPaused === true,
      progress: clamp(Number(canvasSettings().backgroundVideoProgress) || 0, 0, 1),
      alpha: clamp(Number(canvasSettings().backgroundVideoAlpha ?? 0.8), 0, 1),
    });
  });
  UI.bgVideoReset?.addEventListener('click', async () => {
    revokeBackgroundVideoObjectUrl(canvasSettings().backgroundVideo);
    setCanvasSettings({
      ...canvasSettings(),
      backgroundMediaKind: 'image',
      backgroundVideoPaused: false,
      backgroundVideoProgress: 0,
      backgroundVideoAlpha: 0.8,
      backgroundVideo: null,
    });
    persistCanvasSettings();
    await clearBackgroundVideoStorage?.();
    applyCanvasSettings();
    if (UI.bgVideoUpload) UI.bgVideoUpload.value = '';
  });
  UI.bgVideoPlayToggle?.addEventListener('click', () => {
    const nextPaused = !canvasSettings().backgroundVideoPaused;
    setCanvasSettings({ ...canvasSettings(), backgroundVideoPaused: nextPaused, backgroundMediaKind: 'video' });
    persistCanvasSettings();
    persistBackgroundVideoStorage?.({
      ...(canvasSettings().backgroundVideo || {}),
      paused: nextPaused,
      progress: clamp(Number(canvasSettings().backgroundVideoProgress) || 0, 0, 1),
      alpha: clamp(Number(canvasSettings().backgroundVideoAlpha ?? 0.8), 0, 1),
    });
    applyCanvasSettings();
  });
  UI.bgVideoProgress?.addEventListener('input', (e) => {
    const ratio = clamp((Number(e.target.value) || 0) / 1000, 0, 1);
    setCanvasSettings({
      ...canvasSettings(),
      backgroundMediaKind: 'video',
      backgroundVideoProgress: ratio,
    });
    persistCanvasSettings();
    persistBackgroundVideoStorage?.({
      ...(canvasSettings().backgroundVideo || {}),
      paused: canvasSettings().backgroundVideoPaused === true,
      progress: ratio,
      alpha: clamp(Number(canvasSettings().backgroundVideoAlpha ?? 0.8), 0, 1),
    });
    applyCanvasSettings();
  });
  UI.bgVideoAlpha?.addEventListener('input', (e) => {
    const alpha = clamp((Number(e.target.value) || 0) / 100, 0, 1);
    setCanvasSettings({
      ...canvasSettings(),
      backgroundMediaKind: 'video',
      backgroundVideoAlpha: alpha,
    });
    persistCanvasSettings();
    persistBackgroundVideoStorage?.({
      ...(canvasSettings().backgroundVideo || {}),
      paused: canvasSettings().backgroundVideoPaused === true,
      progress: clamp(Number(canvasSettings().backgroundVideoProgress) || 0, 0, 1),
      alpha,
    });
    applyCanvasSettings();
  });
  UI.floatToggle.addEventListener('change', () => updateCanvas({ floatingEnabled: UI.floatToggle.checked }));
  UI.alignBottomToggle.addEventListener('change', () => {
    updateCanvas({ bottomAlign: UI.alignBottomToggle.checked });
    if (responseMode() === RESPONSE_MODE.AI) previewAiStageOverride();
    else previewScenario(selectedScenario());
  });

  UI.frameGlassesToggle.addEventListener('change', () => {
    const nextMode = UI.frameGlassesToggle.checked ? 'glasses' : 'none';
    if (nextMode === 'glasses' && UI.framePhoneToggle) UI.framePhoneToggle.checked = false;
    const scenario = selectedScenario();
    if (!scenario) return;
    scenario.content.canvas = normalizeScenarioCanvas(scenario.content.canvas, { frameMode: canvasSettings().frameMode });
    scenario.content.canvas.frameMode = nextMode;
    persistScenarios();
    renderScenarioUi();
    applyCanvasSettings();
    applyStagePhoneBlur(scenario.shape);
  });

  UI.framePhoneToggle.addEventListener('change', () => {
    const nextMode = UI.framePhoneToggle.checked ? 'phone' : 'none';
    if (nextMode === 'phone' && UI.frameGlassesToggle) UI.frameGlassesToggle.checked = false;
    if (nextMode === 'phone') setCanvasSettings({ ...canvasSettings(), floatingEnabled: false });
    persistCanvasSettings();
    const scenario = selectedScenario();
    if (!scenario) return;
    scenario.content.canvas = normalizeScenarioCanvas(scenario.content.canvas, { frameMode: canvasSettings().frameMode });
    scenario.content.canvas.frameMode = nextMode;
    persistScenarios();
    renderScenarioUi();
    applyCanvasSettings();
    applyStagePhoneBlur(scenario.shape);
  });

  UI.phoneFrameWidth.addEventListener('change', (e) => commitPhoneFrameSize('w', e.target.value));
  UI.phoneFrameHeight.addEventListener('change', (e) => commitPhoneFrameSize('h', e.target.value));
  UI.frameCornerRadius.addEventListener('change', (e) => {
    const parsed = parseInt(String(e.target.value || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    setCanvasSettings({ ...canvasSettings(), frameCornerRadius: clamp(parsed, 0, 120) });
    persistCanvasSettings();
    applyCanvasSettings();
  });

  UI.phoneBgUpload.addEventListener('click', (e) => { e.target.value = ''; });
  UI.phoneBgUpload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) return void (e.target.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return;
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dimensions?.width || !dimensions?.height) return;
    setCanvasSettings({ ...canvasSettings(), phoneFrameBackground: { src: dataUrl, width: dimensions.width, height: dimensions.height } });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
    e.target.value = '';
  });
  UI.phoneBgReset.addEventListener('click', () => {
    setCanvasSettings({ ...canvasSettings(), phoneFrameBackground: null });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
    UI.phoneBgUpload.value = '';
  });
  UI.phoneBgVisibleToggle.addEventListener('change', () => {
    setCanvasSettings({ ...canvasSettings(), phoneBgEnabled: UI.phoneBgVisibleToggle.checked });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
  });

  UI.scenarioAdd.addEventListener('click', () => addScenario('pill'));
  UI.scenarioDuplicate.addEventListener('click', duplicateScenario);
  UI.scenarioDelete.addEventListener('click', deleteScenario);
  UI.scenarioTriggers?.addEventListener('input', (e) => commitScenarioChange((scenario) => { scenario.triggers = normalizeTriggers(e.target.value); }));
  UI.scenarioIconInput.addEventListener('input', (e) => commitScenarioChange((scenario) => {
    const value = String(e.target.value || '').trim();
    scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
    scenario.content.iconByShape[scenario.shape] = value ? createIcon('emoji', value) : createIcon('none', '');
  }));
  const getDraftListItems = (scenario) => {
    scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content);
    scenario.content.listChipIconsByShape = normalizeListChipIconsByShape(scenario.content.listChipIconsByShape, scenario.shape);
    scenario.content.listItemsByShape = normalizeListItemsByShape(scenario.content.listItemsByShape, scenario.shape, {
      textByShape: scenario.content.textByShape,
      listChipIconsByShape: scenario.content.listChipIconsByShape,
    });
    return [...(stageListItemsForShape(scenario, scenario.shape) || [])];
  };
  const commitListItems = (mutator) => commitScenarioChange((scenario) => {
    const items = getDraftListItems(scenario);
    const nextItems = mutator(items.map((item) => ({
      ...item,
      icon: item?.icon ? { ...item.icon } : createIcon('none', ''),
    })));
    scenario.content.listItemsByShape = normalizeListItemsByShape(scenario.content.listItemsByShape, scenario.shape, {
      textByShape: scenario.content.textByShape,
      listChipIconsByShape: scenario.content.listChipIconsByShape,
    });
    scenario.content.listItemsByShape[scenario.shape] = Array.isArray(nextItems) ? nextItems : items;
  });
  const commitTextField = (field, el) => el.addEventListener('input', (e) => commitScenarioChange((scenario) => {
    scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content);
    scenario.content.textByShape[scenario.shape][field] = e.target.value;
  }));
  commitTextField('primary', UI.scenarioPrimary);
  commitTextField('secondary', UI.scenarioSecondary);
  commitTextField('detail', UI.scenarioDetail);
  if (UI.scenarioIntentHeader) commitTextField('intentHeader', UI.scenarioIntentHeader);
  const commitActionCardField = (field, el) => el?.addEventListener('input', (e) => commitScenarioChange((scenario) => {
    scenario.content.actionCardActionsByShape = scenario.content.actionCardActionsByShape || {};
    const current = scenario.content.actionCardActionsByShape[scenario.shape] || { left: 'Snooze', right: 'Join now →' };
    scenario.content.actionCardActionsByShape[scenario.shape] = {
      ...current,
      [field]: e.target.value,
    };
  }));
  commitActionCardField('left', UI.scenarioActionCardLeft);
  commitActionCardField('right', UI.scenarioActionCardRight);
  const selectScenarioShape = (shape) => {
    if (!availableScenarioShapes().includes(shape)) return;
    if (selectedScenario()?.shape === shape) return;
    commitScenarioChange((scenario) => {
      scenario.shape = shape;
      scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, shape, scenario.content);
      scenario.content.typographyByShape = normalizeTypographyByShape(scenario.content.typographyByShape, shape);
      scenario.content.sizeByShape = normalizeStageSizeByShape(scenario.content.sizeByShape, shape, scenario.content);
    });
  };

  UI.scenarioShapeRow.addEventListener('click', (e) => {
    if (e.target.closest('.sb-inline-rename-input')) return;
    const button = e.target.closest('[data-scenario-shape]');
    if (!button) return;
    const shape = String(button.dataset.scenarioShape || '');
    if (!availableScenarioShapes().includes(shape)) return;
    if (stageShapeClickTimer) clearTimeout(stageShapeClickTimer);
    stageShapeClickTimer = setTimeout(() => {
      stageShapeClickTimer = null;
      selectScenarioShape(shape);
    }, 220);
  });

  function beginInlineRename(button, {
    initialValue = '',
    fallbackValue = 'Untitled',
    onCommit,
  } = {}) {
    if (!button || button.dataset.renaming === '1') return;
    button.dataset.renaming = '1';
    button.classList.add('is-renaming');
    const previousHtml = button.innerHTML;
    button.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sb-inline-rename-input';
    input.value = String(initialValue || '');
    input.autocomplete = 'off';
    input.spellcheck = false;
    button.appendChild(input);
    let finished = false;

    const restore = () => {
      button.dataset.renaming = '';
      button.classList.remove('is-renaming');
      if (button.contains(input)) button.removeChild(input);
      if (!finished) button.innerHTML = previousHtml;
    };

    const complete = (commit = true) => {
      if (finished) return;
      finished = true;
      if (commit && typeof onCommit === 'function') {
        const nextValue = String(input.value || '').trim() || fallbackValue;
        onCommit(nextValue);
        return;
      }
      restore();
    };

    input.addEventListener('click', (event) => event.stopPropagation());
    input.addEventListener('dblclick', (event) => event.stopPropagation());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        complete(true);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        complete(false);
      }
    });
    input.addEventListener('blur', () => complete(true));
    input.focus({ preventScroll: true });
    input.select();
  }

  UI.scenarioList?.addEventListener('dblclick', (e) => {
    const button = e.target.closest('.scenario-item');
    if (!button) return;
    const scenarioId = String(button.dataset.scenarioId || '');
    if (!scenarioId) return;
    const scenario = getScenarioLibrary().find((item) => item.id === scenarioId);
    if (!scenario) return;
    beginInlineRename(button, {
      initialValue: scenario.name,
      fallbackValue: 'Untitled Scenario',
      onCommit: (nextValue) => {
        setScenarioLibrary(getScenarioLibrary().map((item) => (
          item.id === scenarioId ? { ...item, name: nextValue } : item
        )));
        renderScenarioUi();
      },
    });
  });

  UI.scenarioShapeRow?.addEventListener('dblclick', (e) => {
    if (stageShapeClickTimer) {
      clearTimeout(stageShapeClickTimer);
      stageShapeClickTimer = null;
    }
    const button = e.target.closest('[data-scenario-shape]');
    if (!button) return;
    const stageId = String(button.dataset.scenarioShape || '');
    const stage = stageById(stageId);
    if (!stage) return;
    beginInlineRename(button, {
      initialValue: stage.name,
      fallbackValue: 'Untitled Stage',
      onCommit: (nextValue) => {
        commitStageChange(stage.id, (draft) => { draft.name = nextValue; });
      },
    });
  });

  UI.stageAdd.addEventListener('click', () => {
    const kind = String(UI.stageAddKind?.value || 'card');
    addStage(kind);
  });
  UI.stageDuplicate?.addEventListener('click', () => duplicateCurrentStage());
  UI.stageDelete.addEventListener('click', () => deleteCurrentStage());
  UI.stageRadiusInput.addEventListener('input', (e) => commitStageRadius(e.target.value));
  UI.stageWidthInput.addEventListener('input', (e) => commitStageSizeOverride('width', e.target.value));
  UI.stageHeightInput.addEventListener('input', (e) => commitStageSizeOverride('height', e.target.value));
  UI.stageImagePaddingInput?.addEventListener('input', (e) => commitStageImagePadding(e.target.value));
  UI.stageGapInput.addEventListener('input', (e) => commitStageGapOverride(e.target.value));
  UI.stageIconPadInput.addEventListener('input', (e) => commitStageIconPadOverride(e.target.value));
  UI.stageCardSToggle?.addEventListener('change', (e) => {
    const scenario = selectedScenario();
    const stage = stageById(scenario?.shape, scenario);
    if (!scenario || !stage) return;
    commitScenarioChange((draft) => {
      draft.content.stageRenderShapeById = { ...(draft.content.stageRenderShapeById || {}) };
      draft.content.stageRenderShapeById[stage.id] = e.target.checked ? 'card-s' : 'card';
    });
  });
  UI.stageListListeningOrbToggle?.addEventListener('change', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => { draft.listListeningOrb = e.target.checked; });
  });
  UI.stageListSelectableToggle?.addEventListener('change', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => { draft.listSelectable = e.target.checked; });
  });
  UI.stageSelectedToggle?.addEventListener('change', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.selectedByShape = { ...(draft.content.selectedByShape || {}) };
      draft.content.selectedByShape[draft.shape] = e.target.checked;
    });
  });
  UI.stageShellHiddenToggle?.addEventListener('change', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => {
      draft.hideShell = e.target.checked;
    });
  });
  UI.stageNudgeDividerColor?.addEventListener('input', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.dividerColorByShape = { ...(draft.content.dividerColorByShape || {}) };
      draft.content.dividerColorByShape[draft.shape] = String(e.target.value || '#ffffff');
    });
  });
  UI.stageBlobTopCoreColor?.addEventListener('input', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.selectedBlobTopCoreColorByShape = { ...(draft.content.selectedBlobTopCoreColorByShape || {}) };
      draft.content.selectedBlobTopCoreColorByShape[draft.shape] = String(e.target.value || '#90acff');
    });
  });
  UI.stageBlobTopEdgeColor?.addEventListener('input', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.selectedBlobTopEdgeColorByShape = { ...(draft.content.selectedBlobTopEdgeColorByShape || {}) };
      draft.content.selectedBlobTopEdgeColorByShape[draft.shape] = String(e.target.value || '#9761ff');
    });
  });
  UI.stageBlobBottomCoreColor?.addEventListener('input', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.selectedBlobBottomCoreColorByShape = { ...(draft.content.selectedBlobBottomCoreColorByShape || {}) };
      draft.content.selectedBlobBottomCoreColorByShape[draft.shape] = String(e.target.value || '#90acff');
    });
  });
  UI.stageBlobBottomEdgeColor?.addEventListener('input', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.selectedBlobBottomEdgeColorByShape = { ...(draft.content.selectedBlobBottomEdgeColorByShape || {}) };
      draft.content.selectedBlobBottomEdgeColorByShape[draft.shape] = String(e.target.value || '#9761ff');
    });
  });
  UI.stageMaskBlurInput?.addEventListener('input', (e) => commitStageSelectedMaskBlur(e.target.value));
  UI.stageListCountDec?.addEventListener('click', () => {
    const scenario = selectedScenario();
    if (!scenario || stageById(scenario.shape, scenario)?.renderShape !== 'list') return;
    commitListItems((items) => items.length > 1 ? items.slice(0, -1) : items);
  });
  UI.stageListCountInc?.addEventListener('click', () => {
    const scenario = selectedScenario();
    if (!scenario || stageById(scenario.shape, scenario)?.renderShape !== 'list') return;
    commitListItems((items) => {
      if (items.length >= 8) return items;
      return [...items, createDefaultListItem(`List item ${items.length + 1}`)];
    });
  });

  UI.stageComponentControls.addEventListener('click', (e) => {
    const listCountButton = e.target.closest('[data-stage-list-count-action]');
    if (listCountButton) {
      const scenario = selectedScenario();
      if (!scenario || stageById(scenario.shape, scenario)?.renderShape !== 'list') return;
      const action = String(listCountButton.dataset.stageListCountAction || '');
      if (action === 'remove') {
        commitListItems((items) => items.length > 1 ? items.slice(0, -1) : items);
        return;
      }
      if (action === 'add') {
        commitListItems((items) => {
          if (items.length >= 8) return items;
          return [...items, createDefaultListItem(`List item ${items.length + 1}`)];
        });
      }
      return;
    }
    const button = e.target.closest('[data-stage-comp-action][data-stage-comp-type]');
    if (!button) return;
    const action = String(button.dataset.stageCompAction || '');
    const type = String(button.dataset.stageCompType || '');
    if (!STAGE_COMPONENT_TYPES.includes(type)) return;
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => {
      const next = [...(draft.components || [])];
      if (action === 'add') next.push(type);
      else if (action === 'remove') {
        const removeIndex = next.lastIndexOf(type);
        if (removeIndex >= 0) next.splice(removeIndex, 1);
      }
      draft.components = next;
    });
  });
  UI.stageComponentControls.addEventListener('change', (e) => {
    const orbToggle = e.target.closest('[data-stage-list-orb-toggle]');
    if (orbToggle) {
      const stage = stageById(selectedScenario()?.shape);
      if (!stage || stage.renderShape !== 'list') return;
      commitStageChange(stage.id, (draft) => {
        draft.listListeningOrb = orbToggle.checked;
      });
      return;
    }
    const selectableToggle = e.target.closest('[data-stage-list-selectable-toggle]');
    if (selectableToggle) {
      const stage = stageById(selectedScenario()?.shape);
      if (!stage || stage.renderShape !== 'list') return;
      commitStageChange(stage.id, (draft) => {
        draft.listSelectable = selectableToggle.checked;
      });
      return;
    }
    const checkbox = e.target.closest('[data-stage-comp-toggle]');
    if (!checkbox) return;
    const type = String(checkbox.dataset.stageCompToggle || '');
    if (!['icon', 'primary', 'secondary', 'detail', 'intent-header', 'action-row'].includes(type)) return;
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => {
      const next = [...(draft.components || [])].filter((item) => item !== type);
      if (checkbox.checked) next.push(type);
      draft.components = next;
    });
  });

  UI.scenarioIconReset.addEventListener('click', () => {
    commitScenarioChange((scenario) => {
      scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
      scenario.content.iconByShape[scenario.shape] = createIcon('none', '');
    });
    UI.scenarioIconUpload.value = '';
  });
  UI.scenarioIconUpload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedAssetFile(file)) return void (e.target.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return;
    commitScenarioChange((scenario) => {
      scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
      scenario.content.iconByShape[scenario.shape] = createIcon('image', dataUrl);
    });
    e.target.value = '';
  });
  UI.scenarioIconUpload.addEventListener('click', (e) => { e.target.value = ''; });
  UI.scenarioListItemsEditor?.addEventListener('input', (e) => {
    const primaryInput = e.target.closest('[data-list-item-primary-index]');
    if (primaryInput) {
      const index = parseInt(primaryInput.dataset.listItemPrimaryIndex || '-1', 10);
      if (index >= 0) {
        return commitListItems((items) => {
          if (!items[index]) return items;
          items[index] = { ...items[index], primary: primaryInput.value };
          return items;
        });
      }
    }
    const secondaryInput = e.target.closest('[data-list-item-secondary-index]');
    if (secondaryInput) {
      const index = parseInt(secondaryInput.dataset.listItemSecondaryIndex || '-1', 10);
      if (index >= 0) {
        return commitListItems((items) => {
          if (!items[index]) return items;
          items[index] = { ...items[index], secondary: secondaryInput.value };
          return items;
        });
      }
    }
    const iconInput = e.target.closest('[data-list-item-icon-input-index]');
    if (iconInput) {
      const index = parseInt(iconInput.dataset.listItemIconInputIndex || '-1', 10);
      if (index >= 0) {
        const value = String(iconInput.value || '').trim();
        return commitListItems((items) => {
          if (!items[index]) return items;
          items[index] = { ...items[index], icon: value ? createIcon('emoji', value) : createIcon('none', '') };
          return items;
        });
      }
    }
  });
  UI.scenarioListItemsEditor?.addEventListener('click', (e) => {
    const resetBtn = e.target.closest('[data-list-item-icon-reset-index]');
    if (!resetBtn) return;
    const index = parseInt(resetBtn.dataset.listItemIconResetIndex || '-1', 10);
    if (index < 0) return;
    commitListItems((items) => {
      if (!items[index]) return items;
      items[index] = { ...items[index], icon: createIcon('none', '') };
      return items;
    });
  });
  UI.scenarioListItemsEditor?.addEventListener('change', async (e) => {
    const uploadInput = e.target.closest('[data-list-item-icon-upload-index]');
    if (!uploadInput) return;
    const index = parseInt(uploadInput.dataset.listItemIconUploadIndex || '-1', 10);
    if (index < 0) return;
    const file = uploadInput.files?.[0];
    if (!file) return;
    if (!isSupportedAssetFile(file)) return void (uploadInput.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return void (uploadInput.value = '');
    commitListItems((items) => {
      if (!items[index]) return items;
      items[index] = { ...items[index], icon: createIcon('image', dataUrl) };
      return items;
    });
    uploadInput.value = '';
  });
  UI.scenarioListItemsEditor?.addEventListener('click', (e) => {
    const uploadInput = e.target.closest('[data-list-item-icon-upload-index]');
    if (uploadInput) uploadInput.value = '';
  });

  UI.editorMedia.addEventListener('click', (e) => {
    const button = e.target.closest('[data-media-reset-index]');
    if (!button) return;
    const index = parseInt(button.dataset.mediaResetIndex, 10);
    if (!Number.isFinite(index) || index < 0) return;
    commitScenarioChange((scenario) => {
      const stage = stageById(scenario.shape);
      const images = getScenarioImagesForStage(scenario, stage);
      images[index] = null;
      scenario.content.imagesByShape = normalizeImagesByShape(scenario.content.imagesByShape, scenario.shape, scenario.content.images);
      scenario.content.imagesByShape[scenario.shape] = images.filter(Boolean);
    });
  });
  UI.editorMedia.addEventListener('change', async (e) => {
    const inputEl = e.target.closest('[data-media-upload-index]');
    if (!inputEl) return;
    const index = parseInt(inputEl.dataset.mediaUploadIndex, 10);
    if (!Number.isFinite(index) || index < 0) return;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (!isSupportedAssetFile(file)) return void (inputEl.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return;
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dimensions?.width || !dimensions?.height) return;
    commitScenarioChange((scenario) => {
      const stage = stageById(scenario.shape);
      const images = getScenarioImagesForStage(scenario, stage);
      images[index] = { src: dataUrl, width: dimensions.width, height: dimensions.height };
      scenario.content.imagesByShape = normalizeImagesByShape(scenario.content.imagesByShape, scenario.shape, scenario.content.images);
      scenario.content.imagesByShape[scenario.shape] = images.filter(Boolean);
    });
    inputEl.value = '';
  });
  UI.editorMedia.addEventListener('click', (e) => {
    const inputEl = e.target.closest('[data-media-upload-index]');
    if (!inputEl) return;
    inputEl.value = '';
  });

  bindTypographyInputs('icon', UI.scenarioIconSize, UI.scenarioIconColor);
  bindTypographyInputs('primary', UI.scenarioPrimarySize, UI.scenarioPrimaryColor);
  bindTypographyInputs('secondary', UI.scenarioSecondarySize, UI.scenarioSecondaryColor);
  bindTypographyInputs('detail', UI.scenarioDetailSize, UI.scenarioDetailColor);
  if (UI.scenarioIntentHeaderSize && UI.scenarioIntentHeaderColor) {
    bindTypographyInputs('intentHeader', UI.scenarioIntentHeaderSize, UI.scenarioIntentHeaderColor);
  }
  [UI.scenarioIconInput, UI.scenarioPrimary, UI.scenarioSecondary, UI.scenarioDetail,
    UI.scenarioIntentHeader,
    UI.scenarioIconSize, UI.scenarioIconColor, UI.scenarioPrimarySize, UI.scenarioPrimaryColor,
    UI.scenarioSecondarySize, UI.scenarioSecondaryColor, UI.scenarioDetailSize, UI.scenarioDetailColor,
    UI.scenarioIntentHeaderSize, UI.scenarioIntentHeaderColor,
  ].forEach((el) => { if (el) el.addEventListener('input', updateLayerPreviews); });

  initSidebarTabs();
  initLayerRowToggles();
  initSidebarCollapsibleSections();
  applyCanvasSettings();
  applyResponseModeUi();
  renderScenarioUi();
  previewScenarioInstant(selectedScenario());
  rebuildAnim();
  initStarfield();
}
