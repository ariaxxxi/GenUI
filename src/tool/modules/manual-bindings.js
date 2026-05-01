import { AI_ORB_ICON_OPTIONS, loadAiOrbIconId, persistAiOrbIconId, syncAiOrbCenterIcon, syncAiOrbCenterImage } from '../../shared/ai-orb-icon.js';

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
  scenarioStageSizeOverride,
  stageSelectedMaskBlurForShape,
  stageListItemsForShape,
  STAGE_COMPONENT_TYPES,
  clamp,
  canvasSettings,
  setCanvasSettings,
  persistCanvasSettings,
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
    'Waffling',
    'Spiraling',
    'Levitating',
    'Hallucinating',
    'Overthinking',
    'Reticulating',
    'Triangulating',
    'Meandering',
    'Philosophizing',
    'Untangling',
    'Daydreaming',
    'Cogitating',
    'Extrapolating',
    'Ruminating',
    'Vibing',
    'Catastrophizing',
    'Manifesting',
    'Yapping',
  ];
  const PROTOTYPE_SKILLS = [
    {
      id: 'doc-writing',
      label: 'Writing Agent',
      emoji: '📝',
      theme: { blobTopCore: 'rgb(126 186 255)', blobTopEdge: 'rgb(92 132 255)', blobBottomCore: 'rgb(197 223 255)', blobBottomEdge: 'rgb(74 102 212)' },
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
      id: 'budget',
      label: 'Budget Agent',
      emoji: '💸',
      theme: { blobTopCore: 'rgb(121 255 168)', blobTopEdge: 'rgb(78 214 127)', blobBottomCore: 'rgb(214 255 143)', blobBottomEdge: 'rgb(92 184 74)' },
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
    {
      id: 'wine-pairing-expert',
      label: 'Wine Agent',
      emoji: '🍷',
      theme: { blobTopCore: 'rgb(188 66 120)', blobTopEdge: 'rgb(118 28 88)', blobBottomCore: 'rgb(244 146 188)', blobBottomEdge: 'rgb(90 20 68)' },
      phrases: [
        'Matching acidity to the dish',
        'Softening the tannin choice',
        'Leaning into brighter fruit',
        'Comparing light and bold pours',
        'Balancing spice with sweetness',
        'Picking the cleaner finish',
        'Choosing a better dinner bottle',
        'Checking the texture pairing',
        'Finding the safer crowd pleaser',
        'Saving the richer red for later',
      ],
    },
    {
      id: 'trip-planner',
      label: 'Travel Agent',
      emoji: '✈️',
      theme: { blobTopCore: 'rgb(115 204 255)', blobTopEdge: 'rgb(73 147 255)', blobBottomCore: 'rgb(209 241 255)', blobBottomEdge: 'rgb(74 110 224)' },
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
      id: 'fitness-coach',
      label: 'Fitness Agent',
      emoji: '🏃',
      theme: { blobTopCore: 'rgb(118 255 199)', blobTopEdge: 'rgb(72 210 165)', blobBottomCore: 'rgb(187 255 229)', blobBottomEdge: 'rgb(54 145 118)' },
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
      id: 'meal-planner',
      label: 'Meal Agent',
      emoji: '🍱',
      theme: { blobTopCore: 'rgb(255 182 108)', blobTopEdge: 'rgb(255 123 86)', blobBottomCore: 'rgb(255 227 146)', blobBottomEdge: 'rgb(210 108 56)' },
      phrases: [
        'Using up what is in the fridge',
        'Balancing quick and cozy dinners',
        'Planning leftovers on purpose',
        'Pairing the sides more cleanly',
        'Checking the protein spread',
        'Making lunch easier tomorrow',
        'Keeping prep time reasonable',
        'Turning one base into two meals',
        'Finding a lighter dinner option',
        'Saving the easiest dish for late',
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
  const thinkingStream = document.getElementById('prototype-thinking-stream');
  const thinkingStreamText = document.getElementById('prototype-thinking-stream-text');
  const thinkingPauseBtn = document.getElementById('prototype-thinking-pause');
  const thinkingResumeBtn = document.getElementById('prototype-thinking-resume');
  const thinkingCopyInput = document.getElementById('prototype-thinking-copy-input');
  const thinkingCopyFireBtn = document.getElementById('prototype-thinking-copy-fire');
  const DEBUG_FAMILY_SHAPES = new Set(['magic', 'skill-pill', 'agent-circle']);
  const thinkingDebugState = {
    mode: 'thinking',
    familyActive: getPrototypeAiDebugState?.()?.active === true,
    paused: false,
    activeSkillId: PROTOTYPE_SKILLS[0]?.id || '',
    activeAppId: PROTOTYPE_APPS[0]?.id || '',
    pendingCustomText: '',
    pendingPausedTransitionText: '',
    pendingSkillTransitionText: '',
    pendingAppVisualSync: null,
    pendingAppTransitionText: '',
    pendingAgentVisualSync: null,
    pendingAgentTransitionText: '',
    streamToken: 0,
    currentText: '',
    currentCursor: null,
    verbIndex: 0,
    skillPhraseIndexById: Object.create(null),
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const currentPrototypeShape = () => String(document.body?.dataset?.currentShape || '').trim().toLowerCase();
  const isDebugFamilyShape = (shape = currentPrototypeShape()) => DEBUG_FAMILY_SHAPES.has(String(shape || '').trim().toLowerCase());
  const agentDebugTypography = {
    icon: { size: 40, color: '#ffffff' },
    primary: { size: 28, color: '#ffffff' },
    secondary: { size: 24, color: '#d4d4d4' },
    detail: { size: 24, color: '#a3a3a3' },
    intentHeader: { size: 18, color: '#a0a0a0' },
  };
  const skillChipTypography = {
    icon: { size: 28, color: '#ffffff' },
    primary: { size: 20, color: '#ffffff' },
    secondary: { size: 20, color: '#d4d4d4' },
    detail: { size: 20, color: '#a3a3a3' },
    intentHeader: { size: 18, color: '#a0a0a0' },
  };
  const skillChipMeasureCanvas = document.createElement('canvas');
  const skillChipMeasureContext = skillChipMeasureCanvas.getContext('2d');
  const aiAgentSequence = Object.keys(AI_ORB_ICON_OPTIONS);
  const prototypeAppSequence = PROTOTYPE_APPS.map((item) => item.id);
  const getSkillById = (id) => PROTOTYPE_SKILLS.find((item) => item.id === id) || PROTOTYPE_SKILLS[0];
  const getAppById = (id) => PROTOTYPE_APPS.find((item) => item.id === id) || PROTOTYPE_APPS[0];
  const getAgentOptionById = (id = loadAiOrbIconId()) => {
    const fallbackId = loadAiOrbIconId();
    return AI_ORB_ICON_OPTIONS[id] || AI_ORB_ICON_OPTIONS[fallbackId] || Object.values(AI_ORB_ICON_OPTIONS)[0] || null;
  };
  const getSkillTransitionText = (skill) => {
    const baseLabel = String(skill?.label || 'Skill').replace(/\s+Agent$/i, '').trim() || 'Skill';
    return `Using ${baseLabel} skill`;
  };
  const getSkillRenderContent = (skill) => ({
    icon: createIcon('emoji', skill?.emoji || '✨'),
    primary: skill?.label || 'Skill Agent',
    secondary: '',
    detail: '',
    typography: skillChipTypography,
  });
  const getAgentRenderContent = (agentId = loadAiOrbIconId()) => {
    const option = AI_ORB_ICON_OPTIONS[agentId] || AI_ORB_ICON_OPTIONS[loadAiOrbIconId()];
    return {
      icon: createIcon('image', option?.src || ''),
      primary: '',
      secondary: '',
      detail: '',
      typography: agentDebugTypography,
    };
  };
  const getAppRenderContent = (app = getAppById()) => ({
    icon: createIcon('image', app?.src || ''),
    primary: '',
    secondary: '',
    detail: '',
    typography: agentDebugTypography,
  });
  const measureSkillChipLabelWidth = (label) => {
    const text = String(label || '').trim();
    if (!text) return 0;
    if (skillChipMeasureContext) {
      skillChipMeasureContext.font = "600 20px 'DM Sans', sans-serif";
      return Math.ceil(skillChipMeasureContext.measureText(text).width);
    }
    return text.length * 12;
  };
  const getSkillChipGeometry = (skill) => {
    const labelWidth = measureSkillChipLabelWidth(skill?.label || 'Skill Agent');
    const chipHeight = 68;
    const leftPad = 18;
    const iconSize = 36;
    const iconGap = 10;
    const rightPad = 22;
    const minWidth = 164;
    const maxWidth = 320;
    const width = clamp(leftPad + iconSize + iconGap + labelWidth + rightPad, minWidth, maxWidth);
    const radius = Math.round(chipHeight / 2);
    const chipCenterY = -20;
    return {
      main: { w: width, h: chipHeight, br: `${radius}px`, tx: -(width / 2), ty: chipCenterY - (chipHeight / 2), op: 1 },
      left: { w: 100, h: 100, br: '50px', tx: -(width / 2), ty: chipCenterY - 50, op: 0 },
      right: { w: 100, h: 100, br: '50px', tx: (width / 2) - 100, ty: chipCenterY - 50, op: 0 },
    };
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
  const createPixelCursor = () => {
    const px = document.createElement('span');
    px.className = 'pixel-cursor';
    for (let i = 0; i < 16; i += 1) {
      const dot = document.createElement('span');
      px.appendChild(dot);
    }
    return px;
  };
  const removeThinkingCursor = () => {
    if (!thinkingDebugState.currentCursor) return;
    thinkingDebugState.currentCursor.remove();
    thinkingDebugState.currentCursor = null;
  };
  const setThinkingStreamVisible = (visible) => {
    if (!thinkingStream) return;
    thinkingStream.classList.toggle('hidden', !visible);
  };
  const setThinkingStreamPausedStyle = (paused) => {
    if (!thinkingStream) return;
    thinkingStream.classList.toggle('is-paused-debug', !!paused);
  };
  const clearThinkingStream = () => {
    removeThinkingCursor();
    thinkingDebugState.currentText = '';
    if (thinkingStreamText) thinkingStreamText.textContent = '';
    setThinkingStreamPausedStyle(false);
  };
  const syncPrototypeDebugState = () => {
    setPrototypeAiDebugState?.({
      active: thinkingDebugState.familyActive,
      mode: thinkingDebugState.mode,
    });
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
    removeThinkingCursor();
  };
  const setThinkingStreamText = (text, { pausedStyle = false, visible = true } = {}) => {
    const value = String(text || '');
    thinkingDebugState.currentText = value;
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
  const queuePendingPausedTransitionText = (text = '') => {
    thinkingDebugState.pendingPausedTransitionText = String(text || '').trim();
  };
  const flushPendingPausedTransitionText = () => {
    const text = String(thinkingDebugState.pendingPausedTransitionText || '').trim();
    thinkingDebugState.pendingPausedTransitionText = '';
    return text;
  };
  const playSkillChipSquash = () => {
    const main = document.getElementById('drop-main');
    if (!main) return;
    if (main._prototypeSkillChipSquashAnim) {
      main._prototypeSkillChipSquashAnim.cancel();
      main._prototypeSkillChipSquashAnim = null;
    }
    main.style.transformOrigin = '50% 50%';
    main.style.scale = '1 1';
    const anim = main.animate([
      { scale: '1 1', offset: 0 },
      { scale: '0.965 1', offset: 0.3 },
      { scale: '1.012 1', offset: 0.68 },
      { scale: '1 1', offset: 1 },
    ], {
      duration: 1180,
      easing: 'cubic-bezier(0.28, 0.08, 0.18, 1)',
      fill: 'none',
    });
    main._prototypeSkillChipSquashAnim = anim;
    const clear = () => {
      if (main._prototypeSkillChipSquashAnim !== anim) return;
      main._prototypeSkillChipSquashAnim = null;
      main.style.scale = '1 1';
    };
    anim.onfinish = clear;
    anim.oncancel = clear;
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
  const tokenizeThinkingText = (text) => {
    const tokens = [];
    let idx = 0;
    while (idx < text.length) {
      const len = Math.random() < 0.4 ? 1 : Math.random() < 0.6 ? 2 : Math.random() < 0.7 ? 3 : 4;
      tokens.push(text.slice(idx, idx + len));
      idx += len;
    }
    return tokens;
  };
  const typeThinkingText = async (text, token) => {
    if (!thinkingStreamText || token !== thinkingDebugState.streamToken) return false;
    setThinkingStreamPausedStyle(false);
    removeThinkingCursor();
    const px = createPixelCursor();
    let settled = '';
    const tokens = tokenizeThinkingText(text);
    for (const tokenText of tokens) {
      const cycles = 2 + Math.floor(Math.random() * 3);
      for (let cycle = 0; cycle < cycles; cycle += 1) {
        if (token !== thinkingDebugState.streamToken) {
          removeThinkingCursor();
          return false;
        }
        Array.from(px.children).forEach((dot) => {
          dot.style.opacity = Math.random() < 0.5 ? '1' : '0.08';
        });
        await sleep(21);
      }
      settled += tokenText;
      thinkingDebugState.currentText = settled;
      thinkingStreamText.textContent = settled;
      thinkingStreamText.appendChild(px);
      thinkingDebugState.currentCursor = px;
      await sleep(6);
    }
    removeThinkingCursor();
    return token === thinkingDebugState.streamToken;
  };
  const deleteThinkingText = async (token) => {
    if (!thinkingStreamText) return false;
    let settled = thinkingDebugState.currentText;
    while (settled.length > 0) {
      if (token !== thinkingDebugState.streamToken) return false;
      settled = settled.slice(0, -1);
      thinkingDebugState.currentText = settled;
      thinkingStreamText.textContent = settled;
      await sleep(21 + (Math.random() * 14));
    }
    return token === thinkingDebugState.streamToken;
  };
  const playThinkingTextOnce = async (text, { holdMs = 2200, clearAfter = true } = {}) => {
    const value = String(text || '').trim();
    if (!value || thinkingDebugState.paused) return false;
    const token = ++thinkingDebugState.streamToken;
    setThinkingStreamVisible(true);
    setThinkingStreamPausedStyle(false);
    removeThinkingCursor();
    if (thinkingDebugState.currentText) {
      const deleted = await deleteThinkingText(token);
      if (!deleted) return false;
      if (!(await waitForStream(200, token))) return false;
    }
    const typed = await typeThinkingText(value, token);
    if (!typed) return false;
    if (!clearAfter) return token === thinkingDebugState.streamToken;
    if (!(await waitForStream(holdMs, token))) return false;
    const cleared = await deleteThinkingText(token);
    if (!cleared) return false;
    if (!(await waitForStream(200, token))) return false;
    return token === thinkingDebugState.streamToken;
  };
  const runThinkingTextLoop = async ({ initialText = '', items = [], indexKey = null, holdMs = 2200, shouldContinue, nextText = null }) => {
    if (thinkingDebugState.paused) return;
    const token = ++thinkingDebugState.streamToken;
    setThinkingStreamVisible(true);
    setThinkingStreamPausedStyle(false);
    removeThinkingCursor();
    if (thinkingDebugState.currentText) {
      const cleared = await deleteThinkingText(token);
      if (!cleared) return;
      if (!(await waitForStream(200, token))) return;
    }
    if (initialText) {
      const initialTyped = await typeThinkingText(initialText, token);
      if (!initialTyped) return;
      if (!(await waitForStream(3000, token))) return;
      const initialDeleted = await deleteThinkingText(token);
      if (!initialDeleted) return;
      if (!(await waitForStream(200, token))) return;
    }
    while (token === thinkingDebugState.streamToken && shouldContinue()) {
      const text = typeof nextText === 'function'
        ? nextText()
        : items.length
          ? items[((thinkingDebugState[indexKey] || 0) % items.length)]
          : '';
      if (!text) return;
      if (indexKey) thinkingDebugState[indexKey] = (thinkingDebugState[indexKey] || 0) + 1;
      const typed = await typeThinkingText(text, token);
      if (!typed) return;
      if (!(await waitForStream(holdMs, token))) return;
      const deleted = await deleteThinkingText(token);
      if (!deleted) return;
      if (!(await waitForStream(200, token))) return;
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
      shouldContinue: () => currentPrototypeShape() === 'skill-pill' && thinkingDebugState.mode === 'skill' && thinkingDebugState.activeSkillId === skill.id,
      nextText: () => {
        const phrases = skill.phrases || [];
        if (!phrases.length) return '';
        const nextIndex = thinkingDebugState.skillPhraseIndexById[skill.id] || 0;
        thinkingDebugState.skillPhraseIndexById[skill.id] = nextIndex + 1;
        return phrases[nextIndex % phrases.length];
      },
    });
  };
  const queuePendingSkillTransitionText = (text = '') => {
    thinkingDebugState.pendingSkillTransitionText = String(text || '').trim();
  };
  const flushPendingSkillTransitionText = () => {
    const text = String(thinkingDebugState.pendingSkillTransitionText || '').trim();
    thinkingDebugState.pendingSkillTransitionText = '';
    return text;
  };
  const queuePendingAppVisualSync = (app, switchDirection) => {
    thinkingDebugState.pendingAppVisualSync = app?.src ? {
      src: app.src,
      alt: `${app.label} app icon`,
      theme: app.theme,
      switchDirection,
    } : null;
  };
  const queuePendingAppTransitionText = (text = '') => {
    thinkingDebugState.pendingAppTransitionText = String(text || '').trim();
  };
  const flushPendingAppVisualSync = () => {
    const pending = thinkingDebugState.pendingAppVisualSync;
    if (!pending?.src) return false;
    thinkingDebugState.pendingAppVisualSync = null;
    syncAiOrbCenterImage(document, {
      animate: true,
      src: pending.src,
      alt: pending.alt,
      theme: pending.theme,
      switchDirection: pending.switchDirection,
      switchMotion: 'swipe',
    });
    return true;
  };
  const flushPendingAppTransitionText = () => {
    const text = String(thinkingDebugState.pendingAppTransitionText || '').trim();
    thinkingDebugState.pendingAppTransitionText = '';
    if (!text || thinkingDebugState.paused) return false;
    void transitionThinkingText(text);
    return true;
  };
  const transitionThinkingText = async (text, { allowWhilePaused = false } = {}) => {
    const value = String(text || '').trim();
    if (!value || (thinkingDebugState.paused && !allowWhilePaused)) return false;
    const token = ++thinkingDebugState.streamToken;
    setThinkingStreamVisible(true);
    setThinkingStreamPausedStyle(false);
    removeThinkingCursor();
    if (thinkingDebugState.currentText) {
      const deleted = await deleteThinkingText(token);
      if (!deleted) return false;
      if (!(await waitForStream(200, token))) return false;
    }
    return typeThinkingText(value, token);
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
  const queuePendingAgentVisualSync = (agentId, switchDirection) => {
    thinkingDebugState.pendingAgentVisualSync = agentId ? { agentId, switchDirection } : null;
  };
  const queuePendingAgentTransitionText = (text = '') => {
    thinkingDebugState.pendingAgentTransitionText = String(text || '').trim();
  };
  const flushPendingAgentVisualSync = () => {
    const pending = thinkingDebugState.pendingAgentVisualSync;
    if (!pending?.agentId) return false;
    thinkingDebugState.pendingAgentVisualSync = null;
    syncAiOrbCenterIcon(document, {
      animate: true,
      id: pending.agentId,
      switchDirection: pending.switchDirection,
      switchMotion: 'swipe',
    });
    return true;
  };
  const flushPendingAgentTransitionText = () => {
    const text = String(thinkingDebugState.pendingAgentTransitionText || '').trim();
    thinkingDebugState.pendingAgentTransitionText = '';
    if (!text || thinkingDebugState.paused) return false;
    void transitionThinkingText(text);
    return true;
  };
  const syncAgentOrbVisual = (agentId, { animate = false, switchDirection = '' } = {}) => {
    const run = () => syncAiOrbCenterIcon(document, {
      animate,
      id: agentId,
      switchDirection,
      switchMotion: 'swipe',
    });
    if (!animate) {
      run();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(run));
  };
  const syncAppOrbVisual = (app, { animate = false, switchDirection = '' } = {}) => {
    const run = () => syncAiOrbCenterImage(document, {
      animate,
      src: app?.src || '',
      alt: app?.label ? `${app.label} app icon` : '',
      theme: app?.theme || null,
      switchDirection,
      switchMotion: 'swipe',
    });
    if (!animate) {
      run();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(run));
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
      syncAiOrbCenterIcon(document, { animate: false, id: activeAgentId });
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
      queuePendingSkillTransitionText(skillTransitionText);
      if (shape !== 'skill-pill' || reroll || forceRemorph) {
        morphTo('skill-pill', getSkillRenderContent(nextSkill), getSkillChipGeometry(nextSkill));
      }
      if (reroll && shape === 'skill-pill' && !forceRemorph) {
        playSkillChipSquash();
      }
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
      if (shape !== 'agent-circle' || forceRemorph) {
        queuePendingAppVisualSync(nextApp, switchDirection);
        queuePendingAppTransitionText(isPaused ? '' : transitionLabel);
        morphTo('agent-circle', getAppRenderContent(nextApp));
      } else {
        queuePendingAppVisualSync(null, '');
        queuePendingAppTransitionText('');
        syncAppOrbVisual(nextApp, {
          animate: true,
          switchDirection,
        });
        if (isPaused) renderPausedThinkingStream();
        else void transitionThinkingText(transitionLabel);
      }
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
    if (shape !== 'agent-circle' || forceRemorph) {
      queuePendingAgentVisualSync(switchingAgent ? nextAgent.id : null, switchDirection);
      queuePendingAgentTransitionText(isPaused ? '' : transitionLabel);
      queuePendingPausedTransitionText(isPaused ? transitionLabel : '');
      morphTo('agent-circle', getAgentRenderContent(nextAgent.id));
    } else {
      queuePendingAgentVisualSync(null, '');
      queuePendingAgentTransitionText('');
      syncAiOrbCenterIcon(document, {
        animate: switchingAgent,
        id: nextAgent.id,
        switchDirection,
        switchMotion: 'swipe',
      });
      if (isPaused) {
        if (transitionLabel) void playPausedThinkingTransition(transitionLabel);
        else renderPausedThinkingStream();
      }
      else if (transitionLabel) void transitionThinkingText(transitionLabel);
    }
    syncAiOrbIconButtons();
  };
  const switchAgentByStep = (step) => {
    const shape = currentPrototypeShape();
    if (shape !== 'listening' && shape !== 'agent-circle' && shape !== 'magic') return false;
    if (shape === 'magic' && thinkingDebugState.mode !== 'thinking') return false;
    const currentId = loadAiOrbIconId();
    const nextId = cycleAgentId(currentId, step);
    if (!nextId || nextId === currentId) return false;
    if (shape === 'agent-circle') {
      thinkingDebugState.mode = 'agent';
      renderPrototypeDebugMode({ explicitAgentId: nextId });
      return true;
    }
    if (shape === 'magic') {
      const switchDirection = step > 0 ? 'right' : 'left';
      persistAiOrbIconId(nextId);
      syncAiOrbCenterIcon(document, { animate: true, id: nextId, switchDirection, switchMotion: 'swipe' });
      syncAiOrbIconButtons();
      return true;
    }
    const switchDirection = step > 0 ? 'right' : 'left';
    persistAiOrbIconId(nextId);
    syncAiOrbCenterIcon(document, { animate: true, id: nextId, switchDirection });
    syncAiOrbIconButtons();
    return true;
  };
  const syncPrototypeAiDebugPanels = () => {
    const shape = currentPrototypeShape();
    const inDebugFamily = isDebugFamilyShape(shape);
    setThinkingFamilyActive(inDebugFamily);
    multiAgentRow?.classList.toggle('hidden', shape !== 'listening' && !(shape === 'agent-circle' && thinkingDebugState.mode === 'agent'));
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
      syncAiOrbCenterIcon(document, { animate: false, id: loadAiOrbIconId() });
      if (thinkingDebugState.paused) {
        renderPausedThinkingStream();
        syncThinkingStateButtons();
        return;
      }
      void runThinkingVerbLoop();
      return;
    }
    if (shape === 'skill-pill') {
      const activeSkill = getSkillById(thinkingDebugState.activeSkillId);
      setSkillSelectionOverride(activeSkill);
      syncThinkingStateButtons();
      if (thinkingDebugState.paused) {
        queuePendingSkillTransitionText('');
        renderPausedThinkingStream();
        return;
      }
      void runSkillPhraseLoop(activeSkill, {
        transitionText: flushPendingSkillTransitionText(),
      });
      return;
    }
    if (shape === 'agent-circle') {
      setSkillSelectionOverride(null);
      if (thinkingDebugState.mode === 'app') {
        const activeApp = getAppById(thinkingDebugState.activeAppId);
        const flushedVisual = flushPendingAppVisualSync();
        const flushedText = flushPendingAppTransitionText();
        if (!flushedVisual) {
          syncAppOrbVisual(activeApp, { animate: false });
        }
        if (thinkingDebugState.paused) {
          renderPausedThinkingStream();
          syncThinkingStateButtons();
          return;
        }
        if (!flushedText) {
          if (thinkingDebugState.currentText) setThinkingStreamVisible(true);
          else stopThinkingStream();
        }
        syncThinkingStateButtons();
        return;
      }
      const flushedVisual = flushPendingAgentVisualSync();
      const flushedText = flushPendingAgentTransitionText();
      const pausedTransitionText = flushPendingPausedTransitionText();
      if (!flushedVisual) {
        syncAgentOrbVisual(loadAiOrbIconId(), { animate: false });
      }
      if (thinkingDebugState.paused) {
        if (pausedTransitionText) void playPausedThinkingTransition(pausedTransitionText);
        else renderPausedThinkingStream();
        syncThinkingStateButtons();
        return;
      }
      if (!flushedText) {
        if (thinkingDebugState.currentText) setThinkingStreamVisible(true);
        else stopThinkingStream();
      }
      syncThinkingStateButtons();
      return;
    }
    if (!inDebugFamily) {
      setThinkingDebugPaused(false);
      thinkingDebugState.pendingCustomText = '';
      setSkillSelectionOverride(null);
      queuePendingPausedTransitionText('');
      queuePendingSkillTransitionText('');
      queuePendingAppVisualSync(null, '');
      queuePendingAppTransitionText('');
      queuePendingAgentVisualSync(null, '');
      queuePendingAgentTransitionText('');
      stopThinkingStream();
      syncAiOrbCenterIcon(document, { animate: false, id: loadAiOrbIconId() });
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
    const nextRadius = clamp(parsed, 0, 120);
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
    const bounded = clamp(parsed, 40, 1400);
    commitScenarioChange((draftScenario) => {
      draftScenario.content.sizeByShape = normalizeStageSizeByShape(draftScenario.content.sizeByShape, draftScenario.shape, draftScenario.content);
      draftScenario.content.sizeByShape[draftScenario.shape][key] = bounded;
    });
  };

  const commitStageGapOverride = (rawValue) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    const value = String(rawValue || '').trim();
    if (!value) return void commitStageChange(stage.id, (draft) => { draft.iconTextGap = null; });
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    commitStageChange(stage.id, (draft) => { draft.iconTextGap = clamp(parsed, 0, 80); });
  };

  const commitStageIconPadOverride = (rawValue) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    const value = String(rawValue || '').trim();
    if (!value) return void commitStageChange(stage.id, (draft) => { draft.iconLeftPadding = null; });
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    commitStageChange(stage.id, (draft) => { draft.iconLeftPadding = clamp(parsed, 0, 120); });
  };

  const commitStageSelectedMaskBlur = (rawValue) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    const value = String(rawValue || '').trim();
    if (!value) {
      commitScenarioChange((draft) => {
        draft.content.selectedMaskBlurByShape = { ...(draft.content.selectedMaskBlurByShape || {}) };
        delete draft.content.selectedMaskBlurByShape[draft.shape];
      });
      return;
    }
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return;
    const bounded = clamp(parsed, 0, 120);
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
    if (selectedScenario()?.shape === 'list' && e.key === 'ArrowUp') {
      e.preventDefault();
      movePrototypeListSelection?.(-1);
      return;
    }
    if (selectedScenario()?.shape === 'list' && e.key === 'ArrowDown') {
      e.preventDefault();
      movePrototypeListSelection?.(1);
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
    if (currentPrototypeShape() === 'agent-circle') {
      thinkingDebugState.mode = 'agent';
      renderPrototypeDebugMode({ explicitAgentId: iconId });
      return;
    }
    persistAiOrbIconId(iconId);
    const currentIndex = getAgentIndex(currentId);
    const nextIndex = getAgentIndex(iconId);
    const switchDirection = nextIndex === currentIndex
      ? 'left'
      : ((nextIndex - currentIndex + aiAgentSequence.length) % aiAgentSequence.length) <= ((currentIndex - nextIndex + aiAgentSequence.length) % aiAgentSequence.length)
        ? 'right'
        : 'left';
    syncAiOrbCenterIcon(document, { animate: true, id: iconId, switchDirection });
    syncAiOrbIconButtons();
  }));
  syncAiOrbIconButtons();
  syncThinkingPauseButtons();

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

  const updateCanvas = (updates) => { setCanvasSettings({ ...canvasSettings(), ...updates }); persistCanvasSettings(); applyCanvasSettings(); };
  UI.bgToggle.addEventListener('change', () => updateCanvas({ backgroundEnabled: UI.bgToggle.checked }));
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
  UI.stageRadiusInput.addEventListener('change', (e) => commitStageRadius(e.target.value));
  UI.stageRadiusInput.addEventListener('blur', (e) => {
    const value = String(e.target.value || '').trim();
    if (!value) {
      const stage = stageById(selectedScenario()?.shape);
      e.target.value = stage ? String(stage.cornerRadius) : '';
      return;
    }
    commitStageRadius(value);
  });
  UI.stageWidthInput.addEventListener('change', (e) => commitStageSizeOverride('width', e.target.value));
  UI.stageWidthInput.addEventListener('blur', (e) => {
    const scenario = selectedScenario();
    const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '');
    commitStageSizeOverride('width', value);
  });
  UI.stageHeightInput.addEventListener('change', (e) => commitStageSizeOverride('height', e.target.value));
  UI.stageHeightInput.addEventListener('blur', (e) => {
    const scenario = selectedScenario();
    const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '');
    commitStageSizeOverride('height', value);
  });
  UI.stageGapInput.addEventListener('change', (e) => commitStageGapOverride(e.target.value));
  UI.stageGapInput.addEventListener('blur', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '');
    commitStageGapOverride(value);
  });
  UI.stageIconPadInput.addEventListener('change', (e) => commitStageIconPadOverride(e.target.value));
  UI.stageIconPadInput.addEventListener('blur', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '');
    commitStageIconPadOverride(value);
  });
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
  UI.stageSelectedToggle?.addEventListener('change', (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    commitScenarioChange((draft) => {
      draft.content.selectedByShape = { ...(draft.content.selectedByShape || {}) };
      draft.content.selectedByShape[draft.shape] = e.target.checked;
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
  UI.stageMaskBlurInput?.addEventListener('change', (e) => commitStageSelectedMaskBlur(e.target.value));
  UI.stageMaskBlurInput?.addEventListener('blur', (e) => {
    const scenario = selectedScenario();
    const value = String(e.target.value || '').trim();
    if (!value) {
      e.target.value = scenario ? String(stageSelectedMaskBlurForShape(scenario, scenario.shape)) : '';
      return;
    }
    commitStageSelectedMaskBlur(value);
  });
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
    const checkbox = e.target.closest('[data-stage-comp-toggle]');
    if (!checkbox) return;
    const type = String(checkbox.dataset.stageCompToggle || '');
    if (!['icon', 'primary', 'secondary', 'detail', 'intent-header'].includes(type)) return;
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
    const labelInput = e.target.closest('[data-list-item-label-index]');
    if (labelInput) {
      const index = parseInt(labelInput.dataset.listItemLabelIndex || '-1', 10);
      if (index >= 0) {
        return commitListItems((items) => {
          if (!items[index]) return items;
          items[index] = { ...items[index], label: labelInput.value };
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
