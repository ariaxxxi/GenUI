import {
  SHAPES,
  configureShapeHelpers,
  defaultTypographyForShape,
  normalizeIcon,
  normalizeIconByShape,
  normalizeImagesByShape,
  normalizeStage,
  normalizeStageImage,
  normalizeStageImages,
  normalizeTypography,
  normalizeTypographyByShape,
} from './shapes.js';
import {
  STORAGE_KEYS,
  RESPONSE_MODE,
  PAGE_MODE_OVERRIDE,
  AI_STAGE_OVERRIDE,
  readStoredJson,
  loadCanvasSettings,
  loadResponseMode,
  loadAiStageOverride,
} from './app-state.js';
import {
  addSimLog,
  setSimVoice,
  setSimInputState,
  addChatBubble,
  showTypingBubble,
  hideTypingBubble,
} from './sim-panel.js';

const P   = 20;
const PILL_NO_ICON_P = 32;
const PILL_ICON_P = 16;
const CARD_P = 24;
const BOTTOM_ALIGN_REF_H = 420;
const CARD_MEDIA_BOTTOM_P = CARD_P + 6;
const CARD_DIVIDER_GAP = 10;
const CARD_PRIMARY_GAP = 14;
const CARD_PRIMARY_TO_SECONDARY_GAP = 8;
const CARD_SECONDARY_TO_DETAIL_GAP = 8;
const CARD_DETAIL_TO_MEDIA_GAP = 24;
const CARD_MEDIA_STACK_GAP = 8;
const TS  = 60;
const TBR = '30px';
const GAP = 8;

const BUILTIN_STAGE_DEFS = Object.freeze([
  { id: 'idle', name: 'Idle', preset: true, renderShape: 'idle', cornerRadius: 0, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: [] },
  { id: 'dot', name: 'Dot', preset: true, renderShape: 'dot', cornerRadius: 50, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: ['icon'] },
  { id: 'pill', name: 'Pill', preset: true, renderShape: 'pill', cornerRadius: 60, widthOverride: null, heightOverride: null, iconTextGap: 8, iconLeftPadding: 16, phoneBgBlur: false, components: ['icon', 'primary', 'secondary'] },
  { id: 'card', name: 'Card', preset: true, renderShape: 'card', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: ['icon', 'primary', 'secondary', 'detail', 'image'] },
  { id: 'card-s', name: 'Card-S', preset: true, renderShape: 'card-s', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: 8, iconLeftPadding: 16, phoneBgBlur: false, components: ['icon', 'primary', 'secondary', 'detail', 'image'] },
  { id: 'image', name: 'Image', preset: true, renderShape: 'image', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: ['image'] },
]);
const SCENARIO_SHAPES = ['idle', 'dot', 'pill', 'card', 'card-s', 'image'];
const STAGE_COMPONENT_TYPES = ['icon', 'primary', 'secondary', 'detail', 'image'];

configureShapeHelpers({
  clampFn: clamp,
  getAvailableScenarioShapes: availableScenarioShapes,
  renderShapeForStageId,
  scenarioShapes: SCENARIO_SHAPES,
  stageComponentTypes: STAGE_COMPONENT_TYPES,
});

function stageId() {
  return 'stage-' + Math.random().toString(36).slice(2, 10);
}

function defaultStageLibrary() {
  return BUILTIN_STAGE_DEFS.map((stage) => ({
    ...stage,
    components: [...stage.components],
  }));
}

function loadStageLibrary() {
  const stored = readStoredJson(STORAGE_KEYS.stages, null);
  if (!Array.isArray(stored)) return defaultStageLibrary();
  const byId = new Map(BUILTIN_STAGE_DEFS.map((stage) => [stage.id, stage]));
  const normalized = stored.map((item) => normalizeStage(item, byId.get(item?.id) || BUILTIN_STAGE_DEFS[0])).filter(Boolean);
  const ids = new Set(normalized.map((stage) => stage.id));
  BUILTIN_STAGE_DEFS.forEach((builtin) => {
    if (!ids.has(builtin.id)) normalized.unshift(normalizeStage(builtin, builtin));
  });
  return normalized;
}

function persistStageLibrary() {
  try {
    localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(stageLibrary));
  } catch (err) {
    console.warn('Unable to persist stage library', err);
  }
}

function stageById(id) {
  return stageLibrary.find((stage) => stage.id === id) || stageLibrary.find((stage) => stage.id === 'pill') || stageLibrary[0];
}

function builtinStageById(id) {
  return BUILTIN_STAGE_DEFS.find((stage) => stage.id === id) || null;
}

function renderShapeForStageId(id) {
  const stage = stageById(id);
  return stage?.renderShape || 'pill';
}

function availableScenarioShapes() {
  return stageLibrary.map((stage) => stage.id);
}

function stageComponentCounts(stage) {
  const counts = Object.fromEntries(STAGE_COMPONENT_TYPES.map((type) => [type, 0]));
  (stage?.components || []).forEach((component) => {
    if (counts[component] !== undefined) counts[component] += 1;
  });
  return counts;
}

function stageHasComponent(stage, component) {
  return stageComponentCounts(stage)[component] > 0;
}

function stageVisibleEditorFields(stage) {
  const fields = new Set();
  if (stageHasComponent(stage, 'primary')) fields.add('primary');
  if (stageHasComponent(stage, 'secondary')) fields.add('secondary');
  if (stageHasComponent(stage, 'detail')) fields.add('detail');
  return fields;
}

function scenarioId() {
  return 'scenario-' + Math.random().toString(36).slice(2, 10);
}

function createIcon(kind = 'none', value = '') {
  return { kind, value: String(value || '') };
}

function normalizeStageTextEntry(value = {}, fallback = {}) {
  return {
    primary: String(value?.primary ?? fallback?.primary ?? ''),
    secondary: String(value?.secondary ?? fallback?.secondary ?? ''),
    detail: String(value?.detail ?? fallback?.detail ?? ''),
  };
}

function hasMeaningfulStageText(value = {}) {
  const entry = normalizeStageTextEntry(value);
  return !!(entry.primary.trim() || entry.secondary.trim() || entry.detail.trim());
}

function defaultStageTextFallback(shape) {
  const renderShape = renderShapeForStageId(shape) || shape;
  if (renderShape === 'pill') {
    return {
      primary: 'Primary text',
      secondary: 'Secondary text',
      detail: '',
    };
  }
  if (renderShape === 'card') {
    return {
      primary: 'Primary text',
      secondary: 'Secondary text',
      detail: 'Detail text example',
    };
  }
  if (renderShape === 'card-s') {
    return {
      primary: 'Primary text',
      secondary: 'Secondary text',
      detail: 'Detail text example',
    };
  }
  return { primary: '', secondary: '', detail: '' };
}

function isPlaceholderStageText(entry, shape) {
  const normalized = normalizeStageTextEntry(entry);
  const placeholder = normalizeStageTextEntry(defaultStageTextFallback(shape));
  return normalized.primary === placeholder.primary
    && normalized.secondary === placeholder.secondary
    && normalized.detail === placeholder.detail;
}

function normalizeStageTextByShape(value = {}, fallbackShape = 'pill', legacy = {}) {
  const stageIds = Array.from(new Set([
    ...SCENARIO_SHAPES,
    ...availableScenarioShapes(),
    ...Object.keys(value || {}),
    fallbackShape,
  ].filter(Boolean)));
  const output = {};
  const legacyEntry = normalizeStageTextEntry(legacy);
  const useLegacyByDefault = hasMeaningfulStageText(legacyEntry);
  stageIds.forEach((shape) => {
    const rawEntry = value?.[shape];
    if (rawEntry !== undefined) {
      const normalized = normalizeStageTextEntry(rawEntry);
      if (useLegacyByDefault && isPlaceholderStageText(normalized, shape)) {
        output[shape] = normalizeStageTextEntry(undefined, legacyEntry);
      } else {
        output[shape] = normalized;
      }
      return;
    }
    const fallback = useLegacyByDefault ? legacyEntry : defaultStageTextFallback(shape);
    output[shape] = normalizeStageTextEntry(undefined, fallback);
  });
  return output;
}

function normalizeScenarioCanvas(value = {}, fallback = {}) {
  const rawMode = String(value?.frameMode || fallback?.frameMode || 'none');
  const frameMode = ['none', 'glasses', 'phone'].includes(rawMode) ? rawMode : 'none';
  return { frameMode };
}

function normalizeStageSizeEntry(value = {}, fallback = {}) {
  const rawWidth = Number(value?.widthOverride ?? fallback?.widthOverride);
  const rawHeight = Number(value?.heightOverride ?? fallback?.heightOverride);
  return {
    widthOverride: Number.isFinite(rawWidth) && rawWidth > 0 ? clamp(Math.round(rawWidth), 40, 1400) : null,
    heightOverride: Number.isFinite(rawHeight) && rawHeight > 0 ? clamp(Math.round(rawHeight), 40, 1400) : null,
  };
}

function normalizeStageSizeByShape(value = {}, fallbackShape = 'pill', legacy = {}) {
  const stageIds = Array.from(new Set([
    ...SCENARIO_SHAPES,
    ...availableScenarioShapes(),
    ...Object.keys(value || {}),
    fallbackShape,
  ].filter(Boolean)));
  const output = {};
  stageIds.forEach((shape) => {
    output[shape] = normalizeStageSizeEntry(
      value?.[shape],
      shape === fallbackShape ? legacy : {}
    );
  });
  return output;
}

function scenarioStageSizeOverride(scenario, shape) {
  return normalizeStageSizeEntry(scenario?.content?.sizeByShape?.[shape]);
}

function stageDefaultMainSize(stageId) {
  const renderShape = renderShapeForStageId(stageId);
  const base = SHAPES[renderShape] || SHAPES.pill;
  const width = Number(base?.main?.w);
  const height = Number(base?.main?.h);
  return {
    width: Number.isFinite(width) ? width : 420,
    height: Number.isFinite(height) ? height : 120,
  };
}

function stageMainSize(stage, scenario = selectedScenario()) {
  const defaults = stageDefaultMainSize(stage?.id);
  const sizeOverride = scenarioStageSizeOverride(scenario, stage?.id);
  const renderShape = stage?.renderShape || renderShapeForStageId(stage?.id);
  const frameMode = normalizeScenarioCanvas(
    scenario?.content?.canvas,
    { frameMode: canvasSettings?.frameMode || 'none' }
  ).frameMode;
  const phoneDefaultWidth = clamp((Number(canvasSettings?.phoneFrameWidth) || 390) - 20, 40, 1400);
  const usePhoneDefaultWidth = frameMode === 'phone' && ['pill', 'card', 'card-s', 'image'].includes(renderShape);
  const defaultWidth = usePhoneDefaultWidth ? phoneDefaultWidth : defaults.width;
  return {
    width: Number.isFinite(sizeOverride.widthOverride)
      ? sizeOverride.widthOverride
      : defaultWidth,
    height: Number.isFinite(sizeOverride.heightOverride)
      ? sizeOverride.heightOverride
      : defaults.height,
  };
}

function stageIconTextGap(stageId, renderShape) {
  if (renderShape !== 'pill' && renderShape !== 'card-s') return GAP;
  const stage = stageId ? stageById(stageId) : null;
  const value = Number(stage?.iconTextGap);
  const resolved = Number.isFinite(value) ? clamp(Math.round(value), 0, 80) : GAP;
  if (PAGE_MODE_OVERRIDE === RESPONSE_MODE.AI) return 8;
  return resolved;
}

function stageIconLeftPadding(stageId, renderShape) {
  if (renderShape !== 'pill' && renderShape !== 'card-s') return renderShape === 'pill' ? PILL_ICON_P : CARD_P;
  const stage = stageId ? stageById(stageId) : null;
  const value = Number(stage?.iconLeftPadding);
  const fallback = (renderShape === 'pill' || renderShape === 'card-s') ? PILL_ICON_P : CARD_P;
  const resolved = Number.isFinite(value) ? clamp(Math.round(value), 0, 120) : fallback;
  if (PAGE_MODE_OVERRIDE === RESPONSE_MODE.AI) return 16;
  return resolved;
}

function stageTextForShape(scenario, shape) {
  const legacy = {
    primary: String(scenario?.content?.primary || ''),
    secondary: String(scenario?.content?.secondary || ''),
    detail: String(scenario?.content?.detail || ''),
  };
  return normalizeStageTextEntry(scenario?.content?.textByShape?.[shape], legacy);
}

function stageIconForShape(scenario, shape) {
  const iconByShape = scenario?.content?.iconByShape || {};
  if (iconByShape[shape] !== undefined) {
    return normalizeIcon(iconByShape[shape]);
  }
  const legacy = normalizeIcon(scenario?.content?.icon);
  if (legacy.kind !== 'none' && legacy.value) return legacy;
  const firstDefined = Object.values(iconByShape)
    .map((value) => normalizeIcon(value))
    .find((value) => value.kind !== 'none' && value.value);
  return firstDefined || createIcon('none', '');
}

function stageImagesForShape(scenario, shape) {
  return normalizeStageImages(
    scenario?.content?.imagesByShape?.[shape] || scenario?.content?.images || (scenario?.content?.image ? [scenario.content.image] : [])
  );
}

function createScenario({
  id = scenarioId(),
  name = 'New Scenario',
  shape = 'pill',
  content = {},
  triggers = [],
} = {}) {
  return {
    id,
    name,
    shape: availableScenarioShapes().includes(shape) ? shape : 'pill',
    content: {
      icon: normalizeIcon(content.icon),
      iconByShape: normalizeIconByShape(content.iconByShape, shape, content.icon),
      primary: String(content.primary || ''),
      secondary: String(content.secondary || ''),
      detail: String(content.detail || ''),
      textByShape: normalizeStageTextByShape(content.textByShape, shape, {
        primary: String(content.primary || ''),
        secondary: String(content.secondary || ''),
        detail: String(content.detail || ''),
      }),
      images: normalizeStageImages(content.images || (content.image ? [content.image] : [])),
      imagesByShape: normalizeImagesByShape(
        content.imagesByShape,
        shape,
        normalizeStageImages(content.images || (content.image ? [content.image] : []))
      ),
      typographyByShape: normalizeTypographyByShape(content.typographyByShape || content.typography, shape),
      sizeByShape: normalizeStageSizeByShape(content.sizeByShape, shape, {
        widthOverride: content.widthOverride,
        heightOverride: content.heightOverride,
      }),
      canvas: normalizeScenarioCanvas(content.canvas, { frameMode: content.frameMode || 'none' }),
    },
    triggers: normalizeTriggers(triggers),
  };
}

function normalizeTriggers(value) {
  if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
  return String(value || '')
    .split(/[\n,]/)
    .map(v => v.trim())
    .filter(Boolean);
}

function normalizeScenario(raw, index = 0) {
  const fallbackNames = ['Weather', 'Message', 'QR Access'];
  return createScenario({
    id: raw?.id || scenarioId(),
    name: raw?.name || fallbackNames[index] || `Scenario ${index + 1}`,
    shape: raw?.shape || 'pill',
    content: raw?.content || {},
    triggers: raw?.triggers || [],
  });
}

function defaultScenarioLibrary() {
  return [
    createScenario({
      name: 'Weather Snapshot',
      shape: 'pill',
      content: {
        icon: createIcon('emoji', '🌤'),
        primary: '21° Sunny',
        secondary: 'San Francisco',
        textByShape: {
          card: {
            primary: '21° Sunny',
            secondary: 'San Francisco',
            detail: 'H:24°  L:16° · Humidity 68%',
          },
          'card-s': {
            primary: '21° Sunny',
            secondary: 'San Francisco',
            detail: 'H:24°  L:16° · Humidity 68%',
          },
        },
      },
      triggers: ['weather', 'temperature', 'forecast'],
    }),
    createScenario({
      name: 'Incoming Message',
      shape: 'card',
      content: {
        icon: createIcon('emoji', '✉'),
        primary: 'New Message',
        secondary: 'Alice wants to meet',
        detail: 'Unread · 2 mins ago',
      },
      triggers: ['message', 'text', 'notification'],
    }),
    createScenario({
      name: 'QR Access Pass',
      shape: 'card',
      content: {
        icon: createIcon('emoji', '▣'),
        primary: 'Gate A12',
        secondary: 'Show QR at entry',
        detail: 'Boarding 18:40 · Seat 14C',
      },
      triggers: ['qr', 'boarding pass', 'ticket', 'check in'],
    }),
    createScenario({
      name: 'Card-S Promo',
      shape: 'card-s',
      content: {
        icon: createIcon('emoji', '🎟'),
        primary: 'Event Access',
        secondary: 'Hall B · 19:30',
        detail: 'Show this pass at entry',
      },
      triggers: ['event', 'pass', 'entry'],
    }),
    createScenario({
      name: 'Image Hero',
      shape: 'image',
      content: {
        image: {
          src: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 800,
        },
      },
      triggers: ['photo', 'hero image', 'cover'],
    }),
  ];
}

function contentPos(shape, w, h) {
  if (shape === 'idle') return {
    thumb:  { x:w/2, y:h/2, w:0, h:0, br:'0px', op:0 },
    prim:   { x:w/2, y:h/2, op:0, fs:28, cx:true },
    sec:    { x:w/2, y:h/2, op:0, fs:24, cx:true },
    div:    { x:w/2, y:h/2, dw:0, op:0 },
    det:    { x:w/2, y:h/2, op:0, fs:24, cx:true },
  };
  if (shape === 'circle' || shape === 'magic' || shape === 'dot') return {
    thumb:  { x:(w-TS)/2, y:(h-TS)/2, w:TS, h:TS, br:TBR, op:1 },
    prim:   { x:w/2, y:h/2, op:0, fs:28, cx:true },
    sec:    { x:w/2, y:h/2, op:0, fs:24, cx:true },
    div:    { x:P, y:h/2, dw:0, op:0 },
    det:    { x:w/2, y:h/2, op:0, fs:24, cx:true },
  };
  if (shape === 'pill') {
    const typography = normalizeTypography(contentTypographyState, 'pill');
    const gap = stageIconTextGap(selectedScenario()?.shape, 'pill');
    const iconLeft = stageIconLeftPadding(selectedScenario()?.shape, 'pill');
    const hasIcon = hasIconContent(thumbContentState);
    const textX = hasIcon ? (iconLeft + TS + gap) : PILL_NO_ICON_P;
    const primaryHeight = measureLineHeight(typography.primary.size, 1.1);
    const secondaryHeight = measureLineHeight(typography.secondary.size, 1.2);
    const rowGap = 2;
    const tY = (h-TS)/2;
    const iconMidY = tY + TS/2;
    const hasPrimary = !!String(C.prim.textContent || '').trim();
    const hasSecondary = !!String(C.sec.textContent || '').trim();
    let pY = Math.round(iconMidY - primaryHeight/2);
    let sY = pY + primaryHeight + rowGap;
    if (hasPrimary && hasSecondary) {
      const groupHeight = primaryHeight + rowGap + secondaryHeight;
      pY = Math.round(iconMidY - groupHeight/2);
      sY = pY + primaryHeight + rowGap;
    } else if (!hasPrimary && hasSecondary) {
      sY = Math.round(iconMidY - secondaryHeight/2);
      pY = sY;
    }
    return {
      thumb:  { x:iconLeft, y:tY, w:TS, h:TS, br:TBR, op:hasIcon ? 1 : 0 },
      prim:   { x:textX, y:pY, op:1, fs:typography.primary.size, cx:false },
      sec:    { x:textX, y:sY, op:1, fs:typography.secondary.size, cx:false },
      div:    { x:P, y:h/2, dw:0, op:0 },
      det:    { x:textX, y:sY, op:0, fs:typography.detail.size, cx:false },
    };
  }
  if (shape === 'card') {
    const typography = normalizeTypography(contentTypographyState, 'card');
    const layout = getCardLayoutMetrics(
      w,
      typography,
      C.det.textContent,
      stageMediaState,
      C.prim.textContent,
      C.sec.textContent,
      thumbContentState
    );
    const cardTextX = CARD_P;
    const hasPrimary = !!String(C.prim.textContent || '').trim();
    const hasSecondary = !!String(C.sec.textContent || '').trim();
    const hasIcon = hasIconContent(thumbContentState);
    return {
      thumb:  { x:CARD_P, y:CARD_P, w:TS, h:TS, br:TBR, op:layout.hasTopRow && hasIcon ? 1 : 0 },
      prim:   { x:cardTextX, y:layout.primaryTop, op:hasPrimary ? 1 : 0, fs:typography.primary.size, cx:false },
      sec:    { x:cardTextX, y:layout.secondaryTop, op:hasSecondary ? 1 : 0, fs:typography.secondary.size, cx:false },
      div:    { x:CARD_P, y:layout.dividerY, dw:w-CARD_P*2, op:layout.hasTopRow ? 1 : 0 },
      det:    { x:CARD_P, y:layout.detailTop, op:String(C.det.textContent || '').trim() ? 1 : 0, fs:typography.detail.size, cx:false },
    };
  }
  if (shape === 'card-s') {
    const typography = normalizeTypography(contentTypographyState, 'card-s');
    const gap = stageIconTextGap(selectedScenario()?.shape, 'card-s');
    const iconLeft = stageIconLeftPadding(selectedScenario()?.shape, 'card-s');
    const layout = getCardSLayoutMetrics(
      w,
      typography,
      C.det.textContent,
      stageMediaState,
      C.prim.textContent,
      C.sec.textContent,
      thumbContentState
    );
    const hasIcon = hasIconContent(thumbContentState);
    const textX = hasIcon ? (iconLeft + TS + gap) : CARD_P;
    const hasPrimary = !!String(C.prim.textContent || '').trim();
    const hasSecondary = !!String(C.sec.textContent || '').trim();
    return {
      thumb:  { x:iconLeft, y:CARD_P, w:TS, h:TS, br:TBR, op:layout.hasTopRow && hasIcon ? 1 : 0 },
      prim:   { x:textX, y:layout.primaryTop, op:layout.hasTopRow && hasPrimary ? 1 : 0, fs:typography.primary.size, cx:false },
      sec:    { x:textX, y:layout.secondaryTop, op:layout.hasTopRow && hasSecondary ? 1 : 0, fs:typography.secondary.size, cx:false },
      div:    { x:CARD_P, y:layout.dividerY, dw:w-CARD_P*2, op:layout.hasTopRow ? 1 : 0 },
      det:    { x:CARD_P, y:layout.detailTop, op:String(C.det.textContent || '').trim() ? 1 : 0, fs:typography.detail.size, cx:false },
    };
  }
  if (shape === 'image') {
    return {
      thumb:  { x:CARD_P, y:CARD_P, w:0, h:0, br:'0px', op:0 },
      prim:   { x:CARD_P, y:CARD_P, op:0, fs:28, cx:false },
      sec:    { x:CARD_P, y:CARD_P, op:0, fs:24, cx:false },
      div:    { x:CARD_P, y:CARD_P, dw:0, op:0 },
      det:    { x:CARD_P, y:CARD_P, op:0, fs:24, cx:false },
    };
  }
  return {
    thumb:  { x:(w-TS)/2, y:(h-TS)/2, w:TS, h:TS, br:TBR, op:0 },
    prim:   { x:P, y:P, op:0, fs:28, cx:false },
    sec:    { x:P, y:P+40, op:0, fs:24, cx:false },
    div:    { x:P, y:P+TS+8, dw:0, op:0 },
    det:    { x:P, y:P+80, op:0, fs:24, cx:false },
  };
}

const DROPS = {
  main:  document.getElementById('drop-main'),
  left:  document.getElementById('drop-left'),
  right: document.getElementById('drop-right'),
};
const C = {
  thumb: document.getElementById('c-thumb'),
  thumbLabel: document.getElementById('c-thumb-label'),
  thumbImg: document.getElementById('c-thumb-img'),
  prim:  document.getElementById('c-primary'),
  sec:   document.getElementById('c-secondary'),
  div:   document.getElementById('c-divider'),
  det:   document.getElementById('c-detail'),
  media: document.getElementById('c-media'),
  rich:  document.getElementById('c-rich'),
  glassControlsLayer: document.getElementById('glass-controls-layer'),
};
const UI = {
  modeToggle: document.getElementById('mode-toggle'),
  bgToggle: document.getElementById('bg-toggle'),
  floatToggle: document.getElementById('float-toggle'),
  alignBottomToggle: document.getElementById('align-bottom-toggle'),
  frameGlassesToggle: document.getElementById('frame-glasses-toggle'),
  framePhoneToggle: document.getElementById('frame-phone-toggle'),
  phoneFrameControls: document.getElementById('phone-frame-controls'),
  phoneFrameWidth: document.getElementById('phone-frame-width'),
  phoneFrameHeight: document.getElementById('phone-frame-height'),
  frameCornerRadius: document.getElementById('frame-corner-radius'),
  phoneBgUpload: document.getElementById('phone-bg-upload'),
  phoneBgReset: document.getElementById('phone-bg-reset'),
  phoneBgState: document.getElementById('phone-bg-state'),
  phoneBgVisibleToggle: document.getElementById('phone-bg-visible-toggle'),
  phoneSceneVisibleRow: document.getElementById('phone-scene-visible-row'),
  aiStageButtons: Array.from(document.querySelectorAll('[data-ai-stage]')),
  scenarioList: document.getElementById('scenario-list'),
  scenarioAdd: document.getElementById('scenario-add'),
  scenarioDuplicate: document.getElementById('scenario-duplicate'),
  scenarioDelete: document.getElementById('scenario-delete'),
  scenarioName: document.getElementById('scenario-name'),
  stageAdd: document.getElementById('stage-add'),
  stageDelete: document.getElementById('stage-delete'),
  stageReset: document.getElementById('stage-reset'),
  stageNameInput: document.getElementById('stage-name-input'),
  stageRadiusInput: document.getElementById('stage-radius-input'),
  stageWidthInput: document.getElementById('stage-width-input'),
  stageHeightInput: document.getElementById('stage-height-input'),
  stageGapInput: document.getElementById('stage-gap-input'),
  stageIconPadInput: document.getElementById('stage-icon-pad-input'),
  stagePhoneBlurToggle: document.getElementById('stage-phone-blur-toggle'),
  stageComponentsPanel: document.getElementById('stage-components-panel'),
  stageComponentControls: document.getElementById('stage-component-controls'),
  scenarioShapeRow: document.getElementById('scenario-shape-row'),
  scenarioTriggers: document.getElementById('scenario-triggers'),
  scenarioIconInput: document.getElementById('scenario-icon-input'),
  scenarioIconUpload: document.getElementById('scenario-icon-upload'),
  scenarioIconReset: document.getElementById('scenario-icon-reset'),
  scenarioIconMode: document.getElementById('scenario-icon-mode'),
  scenarioIconSize: document.getElementById('scenario-icon-size'),
  scenarioIconColor: document.getElementById('scenario-icon-color'),
  scenarioPrimary: document.getElementById('scenario-primary'),
  scenarioPrimarySize: document.getElementById('scenario-primary-size'),
  scenarioPrimaryColor: document.getElementById('scenario-primary-color'),
  scenarioSecondary: document.getElementById('scenario-secondary'),
  scenarioSecondarySize: document.getElementById('scenario-secondary-size'),
  scenarioSecondaryColor: document.getElementById('scenario-secondary-color'),
  scenarioDetail: document.getElementById('scenario-detail'),
  scenarioDetailSize: document.getElementById('scenario-detail-size'),
  scenarioDetailColor: document.getElementById('scenario-detail-color'),
  scenarioMediaList: document.getElementById('scenario-media-list'),
  editorPrimary: document.getElementById('editor-primary-field'),
  editorSecondary: document.getElementById('editor-secondary-field'),
  editorDetail: document.getElementById('editor-detail-field'),
  editorMedia: document.getElementById('editor-media-field'),
};

let currentShape = 'circle';
let lastMainGeo = { ...SHAPES.circle.main };
let mainDeformAnim = null;
const splitTimers = [];
let splitAnimStyleBackup = null;
let suppressDeformation = false;
let splitBridgeTimer = null;
let listBridgeTimer = null;
let thinkingBridgeTimer = null;
let aiBridgeTimer = null;
let aiBreathingTimer = null;
let homePromptExitTimer = null;
let thumbContentState = createIcon('none', '');
let contentTypographyState = defaultTypographyForShape('pill');
let contentDelayProfile = { secondaryInAdvanceMs: 0, detailInAdvanceMs: 0 };
let stageMediaState = [];
let canvasSettings = loadCanvasSettings();
let responseMode = loadResponseMode();
let aiStageOverride = loadAiStageOverride();
let stageLibrary = loadStageLibrary();
let scenarioLibrary = loadScenarioLibrary();
let selectedScenarioId = scenarioLibrary[0]?.id || '';
const detailMeasureEl = document.createElement('div');
detailMeasureEl.style.position = 'fixed';
detailMeasureEl.style.left = '-9999px';
detailMeasureEl.style.top = '-9999px';
detailMeasureEl.style.visibility = 'hidden';
detailMeasureEl.style.pointerEvents = 'none';
detailMeasureEl.style.whiteSpace = 'normal';
detailMeasureEl.style.wordBreak = 'break-word';
detailMeasureEl.style.fontFamily = "'DM Sans', sans-serif";
detailMeasureEl.style.fontWeight = '300';
document.body.appendChild(detailMeasureEl);

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function loadScenarioLibrary() {
  const stored = readStoredJson(STORAGE_KEYS.scenarios, null);
  const scenarios = Array.isArray(stored) ? stored.map(normalizeScenario).filter(Boolean) : defaultScenarioLibrary();
  scenarios.forEach((scenario) => {
    scenario.content.canvas = normalizeScenarioCanvas(
      scenario?.content?.canvas,
      { frameMode: canvasSettings?.frameMode || 'none' }
    );
  });
  return scenarios.length ? scenarios : defaultScenarioLibrary();
}

function persistScenarios() {
  try {
    localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(scenarioLibrary));
  } catch (err) {
    console.warn('Unable to persist scenarios', err);
  }
}

function persistCanvasSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(canvasSettings));
  } catch (err) {
    console.warn('Unable to persist canvas settings', err);
  }
}

function persistResponseMode() {
  if (PAGE_MODE_OVERRIDE) return;
  try {
    localStorage.setItem(STORAGE_KEYS.mode, JSON.stringify(responseMode));
  } catch (err) {
    console.warn('Unable to persist response mode', err);
  }
}

function persistAiStageOverride() {
  try {
    localStorage.setItem(STORAGE_KEYS.aiStage, JSON.stringify(aiStageOverride));
  } catch (err) {
    console.warn('Unable to persist AI stage override', err);
  }
}

function selectedScenario() {
  return scenarioLibrary.find(item => item.id === selectedScenarioId) || scenarioLibrary[0] || null;
}

function setThumbContent(iconValue) {
  thumbContentState = normalizeIcon(iconValue);
  const isImage = thumbContentState.kind === 'image' && !!thumbContentState.value;
  const isText = thumbContentState.kind === 'emoji' && !!thumbContentState.value;
  C.thumb.classList.toggle('thumb-image', isImage);
  C.thumbLabel.textContent = isText ? thumbContentState.value : '';
  if (isImage) {
    C.thumbImg.src = thumbContentState.value;
  } else {
    C.thumbImg.removeAttribute('src');
  }
}

function setContentTypography(typographyValue, shape = currentShape) {
  contentTypographyState = normalizeTypography(typographyValue, shape);
}

function setStageMedia(imageValue) {
  stageMediaState = normalizeStageImages(Array.isArray(imageValue) ? imageValue : (imageValue ? [imageValue] : []));
  if (stageMediaState[0]) C.media.src = stageMediaState[0].src;
  else C.media.removeAttribute('src');
}

function getScenarioTypography(scenario, shape = scenario?.shape || currentShape) {
  const renderShape = renderShapeForStageId(shape) || shape;
  return normalizeTypography(
    scenario?.content?.typographyByShape?.[shape],
    renderShape
  );
}

function cardDetailTextWidth(cardWidth) {
  return Math.max(120, cardWidth - CARD_P * 2);
}

function lineTextWidth(shape, width) {
  const hasIcon = hasIconContent(thumbContentState);
  if (shape === 'pill') {
    const textX = hasIcon
      ? (stageIconLeftPadding(selectedScenario()?.shape, 'pill') + TS + stageIconTextGap(selectedScenario()?.shape, 'pill'))
      : PILL_NO_ICON_P;
    return Math.max(120, width - textX - P);
  }
  if (shape === 'card') {
    return Math.max(120, width - CARD_P * 2);
  }
  if (shape === 'card-s') {
    const textX = hasIcon
      ? (stageIconLeftPadding(selectedScenario()?.shape, 'card-s') + TS + stageIconTextGap(selectedScenario()?.shape, 'card-s'))
      : CARD_P;
    return Math.max(120, width - textX - CARD_P);
  }
  return null;
}

function cardMediaWidth(cardWidth, shape = 'card') {
  if (shape === 'image') return Math.max(40, cardWidth - CARD_P * 2);
  return Math.max(120, cardWidth - CARD_P * 2);
}

function measureLineHeight(fontSize, lineHeight = 1.2) {
  return Math.ceil(Number(fontSize || 0) * lineHeight);
}

function measureCardMediaHeight(imageValue, cardWidth, shape = 'card') {
  const image = normalizeStageImage(imageValue);
  if (!image) return 0;
  return Math.ceil(cardMediaWidth(cardWidth, shape) * (image.height / image.width));
}

function measureCardMediaHeights(imagesValue, cardWidth, shape = 'card') {
  const images = normalizeStageImages(Array.isArray(imagesValue) ? imagesValue : (imagesValue ? [imagesValue] : []));
  return images.map((image) => measureCardMediaHeight(image, cardWidth, shape)).filter((height) => height > 0);
}

function mediaStackHeight(mediaHeights) {
  if (!Array.isArray(mediaHeights) || !mediaHeights.length) return 0;
  return mediaHeights.reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * Math.max(0, mediaHeights.length - 1);
}

function measureCardDetailHeight(detailText, typography, cardWidth) {
  const text = String(detailText || '').trim();
  if (!text) return 0;
  detailMeasureEl.style.width = `${cardDetailTextWidth(cardWidth)}px`;
  detailMeasureEl.style.fontSize = `${typography.detail.size}px`;
  detailMeasureEl.style.lineHeight = '1.2';
  detailMeasureEl.style.whiteSpace = 'normal';
  detailMeasureEl.style.wordBreak = 'break-word';
  detailMeasureEl.textContent = text;
  return Math.ceil(detailMeasureEl.getBoundingClientRect().height);
}

function hasIconContent(iconValue) {
  const icon = normalizeIcon(iconValue);
  return icon.kind !== 'none' && String(icon.value || '').trim().length > 0;
}

function getCardLayoutMetrics(cardWidth, typography, detailText = '', imageValue = null, primaryText = '', secondaryText = '', iconValue = null) {
  const hasPrimary = !!String(primaryText || '').trim();
  const hasSecondary = !!String(secondaryText || '').trim();
  const hasTopRow = hasIconContent(iconValue);
  const hasDetailText = String(detailText || '').trim().length > 0;
  const primaryHeight = measureLineHeight(typography.primary.size, 1.1);
  const secondaryHeight = measureLineHeight(typography.secondary.size, 1.2);
  const detailHeight = measureCardDetailHeight(detailText, typography, cardWidth);
  const mediaHeights = measureCardMediaHeights(imageValue, cardWidth);
  const mediaHeight = mediaStackHeight(mediaHeights);
  const dividerY = hasTopRow ? (CARD_P + TS + CARD_DIVIDER_GAP) : CARD_P;
  const bodyStart = hasTopRow ? (dividerY + CARD_PRIMARY_GAP) : CARD_P;
  let cursorY = bodyStart;
  let primaryTop = bodyStart;
  let secondaryTop = bodyStart;
  if (hasPrimary) {
    primaryTop = cursorY;
    cursorY += primaryHeight;
  }
  if (hasSecondary) {
    if (hasPrimary) cursorY += CARD_PRIMARY_TO_SECONDARY_GAP;
    secondaryTop = cursorY;
    cursorY += secondaryHeight;
  }
  const detailTop = hasDetailText
    ? ((hasPrimary || hasSecondary) ? (cursorY + CARD_SECONDARY_TO_DETAIL_GAP) : bodyStart)
    : bodyStart;
  const mediaTop = hasDetailText
    ? detailTop + detailHeight + CARD_DETAIL_TO_MEDIA_GAP
    : ((hasPrimary || hasSecondary) ? (cursorY + CARD_DETAIL_TO_MEDIA_GAP) : bodyStart);
  const contentBottom = mediaHeight > 0
    ? mediaTop + mediaHeight
    : (detailHeight > 0
      ? detailTop + detailHeight
      : ((hasPrimary || hasSecondary) ? cursorY : bodyStart));
  const bottomPadding = mediaHeight > 0 ? CARD_MEDIA_BOTTOM_P : CARD_P;
  return {
    hasTopRow,
    dividerY,
    primaryTop,
    secondaryTop,
    detailTop,
    detailHeight,
    mediaTop,
    mediaTops: mediaHeights.map((_, index) =>
      mediaTop + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index
    ),
    mediaHeights,
    mediaHeight,
    neededHeight: contentBottom + bottomPadding,
  };
}

function getCardSLayoutMetrics(cardWidth, typography, detailText = '', imageValue = null, primaryText = '', secondaryText = '', iconValue = null) {
  const hasPrimary = !!String(primaryText || '').trim();
  const hasSecondary = !!String(secondaryText || '').trim();
  const hasTopRow = hasIconContent(iconValue) || hasPrimary || hasSecondary;
  const primaryHeight = measureLineHeight(typography.primary.size, 1.1);
  const secondaryHeight = measureLineHeight(typography.secondary.size, 1.2);
  const iconMidY = CARD_P + TS / 2;
  const rowGap = 4;
  let primaryTop = Math.round(iconMidY - primaryHeight/2);
  let secondaryTop = primaryTop + primaryHeight + rowGap;
  if (hasPrimary && hasSecondary) {
    const groupHeight = primaryHeight + rowGap + secondaryHeight;
    primaryTop = Math.round(iconMidY - groupHeight/2);
    secondaryTop = primaryTop + primaryHeight + rowGap;
  } else if (!hasPrimary && hasSecondary) {
    secondaryTop = Math.round(iconMidY - secondaryHeight/2);
    primaryTop = secondaryTop;
  }
  const dividerY = hasTopRow ? (CARD_P + TS + CARD_DIVIDER_GAP) : CARD_P;
  const detailTop = hasTopRow ? (dividerY + CARD_PRIMARY_GAP) : CARD_P;
  const detailHeight = measureCardDetailHeight(detailText, typography, cardWidth);
  const mediaHeights = measureCardMediaHeights(imageValue, cardWidth, 'card-s');
  const mediaHeight = mediaStackHeight(mediaHeights);
  const hasDetailText = String(detailText || '').trim().length > 0;
  const mediaTop = hasDetailText
    ? detailTop + detailHeight + CARD_DETAIL_TO_MEDIA_GAP
    : (hasTopRow ? detailTop : CARD_P);
  const contentBottom = mediaHeight > 0
    ? mediaTop + mediaHeight
    : (detailHeight > 0 ? detailTop + detailHeight : (hasTopRow ? dividerY : CARD_P));
  const bottomPadding = mediaHeight > 0 ? CARD_MEDIA_BOTTOM_P : CARD_P;
  return {
    hasTopRow,
    dividerY,
    primaryTop,
    secondaryTop,
    detailTop,
    detailHeight,
    mediaTop,
    mediaTops: mediaHeights.map((_, index) =>
      mediaTop + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index
    ),
    mediaHeights,
    mediaHeight,
    neededHeight: contentBottom + bottomPadding,
  };
}

function stageCornerRadiusPx(stageId, fallbackBr) {
  const stage = stageById(stageId);
  if (!stage) return fallbackBr;
  const radius = Number(stage.cornerRadius);
  if (!Number.isFinite(radius)) return fallbackBr;
  return `${clamp(Math.round(radius), 0, 120)}px`;
}

function withStageSizeOverride(geo, stageId, scenario = selectedScenario(), sizeOverride = null) {
  if (!stageId) return geo;
  const stage = stageById(stageId);
  if (!stage) return geo;
  const normalizedOverride = normalizeStageSizeEntry(sizeOverride);
  const width = Number.isFinite(normalizedOverride.widthOverride)
    ? normalizedOverride.widthOverride
    : stageMainSize(stage, scenario).width;
  const height = Number.isFinite(normalizedOverride.heightOverride)
    ? normalizedOverride.heightOverride
    : stageMainSize(stage, scenario).height;
  if (width === geo.main.w && height === geo.main.h) return geo;
  return {
    ...geo,
    main: {
      ...geo.main,
      w: width,
      h: height,
      tx: -(width / 2),
      ty: -(height / 2),
    },
  };
}

function resolveGeometryForContent(shape, contentData, customGeo, stageId = null) {
  const rawGeo = customGeo || SHAPES[shape] || SHAPES.card;
  const scenario = selectedScenario();
  const stageSizeOverride = normalizeStageSizeEntry(
    contentData?.sizeOverride,
    scenarioStageSizeOverride(scenario, stageId)
  );
  const baseGeo = customGeo ? rawGeo : withStageSizeOverride(rawGeo, stageId, scenario, stageSizeOverride);
  const hasHeightOverride = Number.isFinite(stageSizeOverride.heightOverride);
  const withStageRadius = (geo) => {
    if (!stageId) return geo;
    const nextRadius = stageCornerRadiusPx(stageId, geo.main.br);
    if (nextRadius === geo.main.br) return geo;
    return {
      ...geo,
      main: {
        ...geo.main,
        br: nextRadius,
      },
    };
  };
  if ((shape !== 'card' && shape !== 'card-s' && shape !== 'image') || customGeo) {
    return withStageRadius(baseGeo);
  }

  const detailText = contentData?.detail !== undefined ? contentData.detail : C.det.textContent;
  const typography = normalizeTypography(contentData?.typography || contentTypographyState, shape);
  const mediaValue = contentData?.images !== undefined
    ? contentData.images
    : (contentData?.image !== undefined ? [contentData.image] : stageMediaState);
  const primaryText = contentData?.primary !== undefined ? contentData.primary : C.prim.textContent;
  const secondaryText = contentData?.secondary !== undefined ? contentData.secondary : C.sec.textContent;
  const iconValue = contentData?.icon !== undefined ? contentData.icon : thumbContentState;
  if (shape === 'image') {
    if (hasHeightOverride) return withStageRadius(baseGeo);
    const mediaHeight = mediaStackHeight(measureCardMediaHeights(mediaValue, baseGeo.main.w, 'image'));
    if (!mediaHeight) return withStageRadius(baseGeo);
    const neededHeight = mediaHeight + CARD_P * 2;
    if (neededHeight === baseGeo.main.h) return withStageRadius(baseGeo);
    return withStageRadius({
      ...baseGeo,
      main: {
        ...baseGeo.main,
        h: neededHeight,
        ty: -(neededHeight / 2),
      },
    });
  }
  const layout = shape === 'card-s'
    ? getCardSLayoutMetrics(baseGeo.main.w, typography, detailText, mediaValue, primaryText, secondaryText, iconValue)
    : getCardLayoutMetrics(baseGeo.main.w, typography, detailText, mediaValue, primaryText, secondaryText, iconValue);
  const hasDetailText = String(detailText || '').trim().length > 0;
  const hasMedia = layout.mediaHeight > 0;
  const baselineLayout = shape === 'card-s'
    ? getCardSLayoutMetrics(
      baseGeo.main.w,
      defaultTypographyForShape(shape),
      detailText,
      mediaValue,
      primaryText,
      secondaryText,
      iconValue
    )
    : getCardLayoutMetrics(
      baseGeo.main.w,
      defaultTypographyForShape(shape),
      detailText,
      mediaValue,
      primaryText,
      secondaryText,
      iconValue
    );
  const neededHeight = (shape === 'card-s')
    ? Math.ceil(layout.neededHeight)
    : (!hasDetailText && !hasMedia)
    ? Math.ceil(layout.neededHeight)
    : Math.max(
      Math.round(baseGeo.main.h + (layout.neededHeight - baselineLayout.neededHeight)),
      Math.ceil(layout.neededHeight)
    );
  if (hasHeightOverride) return withStageRadius(baseGeo);
  if (neededHeight === baseGeo.main.h) return withStageRadius(baseGeo);

  return withStageRadius({
    ...baseGeo,
    main: {
      ...baseGeo.main,
      h: neededHeight,
      ty: -(neededHeight / 2),
    },
  });
}

function scenarioToRenderContent(scenario) {
  const stage = stageById(scenario?.shape);
  const counts = stageComponentCounts(stage);
  const shape = scenario?.shape || currentShape;
  const has = (type) => counts[type] > 0;
  const text = stageTextForShape(scenario, shape);
  const sourceImages = stageImagesForShape(scenario, shape);
  const imageCount = Math.max(0, counts.image || 0);
  const images = has('image') ? sourceImages.slice(0, imageCount).filter(Boolean) : [];
  return {
    icon: has('icon') ? stageIconForShape(scenario, shape) : createIcon('none', ''),
    primary: has('primary') ? text.primary : '',
    secondary: has('secondary') ? text.secondary : '',
    detail: has('detail') ? text.detail : '',
    image: images[0] || null,
    images,
    typography: getScenarioTypography(scenario, shape),
    sizeOverride: scenarioStageSizeOverride(scenario, shape),
  };
}

function currentScenarioFrameMode() {
  const scenario = selectedScenario();
  if (!scenario) return canvasSettings.frameMode;
  return normalizeScenarioCanvas(
    scenario?.content?.canvas,
    { frameMode: canvasSettings.frameMode }
  ).frameMode;
}

function applyCanvasSettings() {
  const frame = document.getElementById('ui-frame');
  const frameBg = document.getElementById('ui-frame-bg');
  const frameMode = currentScenarioFrameMode();
  const isPhone = frameMode === 'phone';
  const isGlasses = frameMode === 'glasses';
  document.body.classList.toggle('bg-off', !canvasSettings.backgroundEnabled);
  document.body.classList.toggle('float-off', !canvasSettings.floatingEnabled);
  document.body.classList.toggle('stage-bottom-align', !!canvasSettings.bottomAlign);
  if (frame) {
    frame.classList.toggle('phone', isPhone);
    frame.classList.toggle('glasses', isGlasses);
    frame.classList.remove('stage-blur');
    frame.classList.toggle('phone-scene-off', isPhone && !canvasSettings.phoneBgEnabled);
    frame.style.setProperty('--phone-frame-w', `${canvasSettings.phoneFrameWidth}px`);
    frame.style.setProperty('--phone-frame-h', `${canvasSettings.phoneFrameHeight}px`);
    frame.style.setProperty('--frame-corner-radius', `${canvasSettings.frameCornerRadius}px`);
    const hasBg = isPhone && !!canvasSettings.phoneBgEnabled && !!canvasSettings.phoneFrameBackground?.src;
    frame.classList.toggle('has-bg', hasBg);
  }
  if (frameBg) {
    if (canvasSettings.phoneFrameBackground?.src) frameBg.style.backgroundImage = `url("${canvasSettings.phoneFrameBackground.src}")`;
    else frameBg.style.backgroundImage = '';
  }
  if (UI.bgToggle) UI.bgToggle.checked = !!canvasSettings.backgroundEnabled;
  if (UI.floatToggle) UI.floatToggle.checked = !!canvasSettings.floatingEnabled;
  if (UI.alignBottomToggle) UI.alignBottomToggle.checked = !!canvasSettings.bottomAlign;
  if (UI.framePhoneToggle) UI.framePhoneToggle.checked = isPhone;
  if (UI.frameGlassesToggle) UI.frameGlassesToggle.checked = isGlasses;
  if (UI.phoneFrameControls) UI.phoneFrameControls.classList.toggle('hidden', !isPhone);
  if (UI.phoneFrameWidth) UI.phoneFrameWidth.value = String(canvasSettings.phoneFrameWidth);
  if (UI.phoneFrameHeight) UI.phoneFrameHeight.value = String(canvasSettings.phoneFrameHeight);
  if (UI.frameCornerRadius) UI.frameCornerRadius.value = String(canvasSettings.frameCornerRadius);
  if (UI.phoneBgState) UI.phoneBgState.textContent = canvasSettings.phoneFrameBackground?.src ? 'loaded' : 'empty';
  if (UI.phoneBgVisibleToggle) {
    UI.phoneBgVisibleToggle.checked = !!canvasSettings.phoneBgEnabled;
    UI.phoneBgVisibleToggle.disabled = !isPhone;
  }
  if (UI.phoneSceneVisibleRow) {
    UI.phoneSceneVisibleRow.classList.toggle('hidden', !isPhone);
  }
}

function applyStagePhoneBlur(stageId) {
  const frame = document.getElementById('ui-frame');
  if (!frame) return;
  const stage = stageById(stageId);
  const shouldBlur = currentScenarioFrameMode() === 'phone'
    && !!canvasSettings.phoneFrameBackground?.src
    && !!stage?.phoneBgBlur;
  frame.classList.toggle('stage-blur', shouldBlur);
}

function applyResponseModeUi() {
  const isAi = responseMode === RESPONSE_MODE.AI;
  document.body.classList.toggle('mode-ai', isAi);
  document.body.classList.toggle('mode-manual', !isAi);
  if (UI.modeToggle) UI.modeToggle.checked = isAi;
}

function renderAiStageOverrideUi() {
  UI.aiStageButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.aiStage === aiStageOverride);
  });
}

function previewAiStageOverride() {
  if (responseMode !== RESPONSE_MODE.AI) return;
  const scenario = selectedScenario();
  if (!scenario) return;
  if (aiStageOverride === AI_STAGE_OVERRIDE.AUTO) {
    previewScenario(scenario);
    return;
  }
  const overrideShape = availableScenarioShapes().includes(aiStageOverride) ? aiStageOverride : scenario.shape;
  const preview = createScenario({
    ...scenario,
    shape: overrideShape,
    content: scenario.content,
    triggers: scenario.triggers,
  });
  previewScenario(preview);
}

function renderScenarioList() {
  if (!UI.scenarioList) return;
  UI.scenarioList.innerHTML = '';
  scenarioLibrary.forEach((scenario) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scenario-item' + (scenario.id === selectedScenarioId ? ' active' : '');
    const stage = stageById(scenario.shape);
    button.innerHTML = `
      <span class="scenario-item-name">${scenario.name}</span>
      <span class="scenario-item-meta">${stage?.name || scenario.shape}</span>
    `;
    button.addEventListener('click', () => selectScenario(scenario.id));
    UI.scenarioList.appendChild(button);
  });
  if (UI.scenarioDuplicate) UI.scenarioDuplicate.disabled = !selectedScenario();
  if (UI.scenarioDelete) UI.scenarioDelete.disabled = scenarioLibrary.length <= 1;
}

function renderScenarioStageChips() {
  if (!UI.scenarioShapeRow) return;
  const scenario = selectedScenario();
  UI.scenarioShapeRow.innerHTML = '';
  stageLibrary.forEach((stage) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shape-chip' + (scenario?.shape === stage.id ? ' active' : '');
    button.dataset.scenarioShape = stage.id;
    button.textContent = stage.name;
    button.title = stage.id;
    UI.scenarioShapeRow.appendChild(button);
  });
}

function renderStageComponentControls(stage) {
  if (!UI.stageComponentControls) return;
  UI.stageComponentControls.innerHTML = '';
  if (!stage) return;
  const list = document.createElement('div');
  list.className = 'stage-comp-list';
  const counts = stageComponentCounts(stage);
  STAGE_COMPONENT_TYPES.forEach((type) => {
    const row = document.createElement('div');
    const isSingleToggle = type === 'icon' || type === 'primary' || type === 'secondary' || type === 'detail';
    row.className = 'stage-comp-row' + (isSingleToggle ? ' toggle' : '');
    if (isSingleToggle) {
      row.innerHTML = `
        <span class="stage-comp-label">${type}</span>
        <input class="stage-comp-check" type="checkbox" data-stage-comp-toggle="${type}" ${counts[type] > 0 ? 'checked' : ''}/>
      `;
    } else {
      row.innerHTML = `
        <span class="stage-comp-label">${type}</span>
        <button type="button" class="stage-comp-btn" data-stage-comp-action="remove" data-stage-comp-type="${type}">-</button>
        <span class="stage-comp-count">${counts[type]}</span>
        <button type="button" class="stage-comp-btn" data-stage-comp-action="add" data-stage-comp-type="${type}">+</button>
      `;
      const removeBtn = row.querySelector('[data-stage-comp-action="remove"]');
      if (removeBtn) removeBtn.disabled = counts[type] <= 0;
    }
    list.appendChild(row);
  });
  UI.stageComponentControls.appendChild(list);
}

function renderStageConfigPanel() {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  const builtin = builtinStageById(stage?.id);
  const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
  if (UI.stageNameInput) UI.stageNameInput.value = stage?.name || '';
  if (UI.stageRadiusInput) UI.stageRadiusInput.value = Number.isFinite(stage?.cornerRadius) ? String(stage.cornerRadius) : '';
  if (UI.stageWidthInput) UI.stageWidthInput.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '';
  if (UI.stageHeightInput) UI.stageHeightInput.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '';
  if (UI.stageGapInput) UI.stageGapInput.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '';
  if (UI.stageIconPadInput) UI.stageIconPadInput.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '';
  if (UI.stagePhoneBlurToggle) UI.stagePhoneBlurToggle.checked = !!stage?.phoneBgBlur;
  if (UI.stageComponentsPanel) UI.stageComponentsPanel.classList.remove('hidden');
  if (UI.stageDelete) UI.stageDelete.disabled = !stage || !!stage.preset;
  if (UI.stageReset) UI.stageReset.disabled = !stage || !builtin;
  renderStageComponentControls(stage);
}

function getScenarioImagesForStage(scenario, stage) {
  const count = Math.max(0, stageComponentCounts(stage).image || 0);
  const source = stageImagesForShape(scenario, scenario?.shape);
  const output = [];
  for (let i = 0; i < count; i += 1) {
    output.push(source[i] || null);
  }
  return output;
}

function renderScenarioMediaEditor(scenario, stage) {
  if (!UI.scenarioMediaList) return;
  UI.scenarioMediaList.innerHTML = '';
  const images = getScenarioImagesForStage(scenario, stage);
  if (!images.length) return;
  images.forEach((image, index) => {
    const row = document.createElement('div');
    row.className = 'media-upload-row';
    const inputId = `scenario-media-upload-${index}`;
    row.innerHTML = `
      <label class="sb-mini-btn upload-btn" for="${inputId}">PNG/GIF ${index + 1}<input id="${inputId}" data-media-upload-index="${index}" type="file" accept="image/png,image/gif"/></label>
      <button class="sb-mini-btn" type="button" data-media-reset-index="${index}">Reset</button>
    `;
    UI.scenarioMediaList.appendChild(row);
    const badge = document.createElement('div');
    badge.className = 'icon-mode-badge';
    badge.textContent = image ? 'loaded' : 'empty';
    UI.scenarioMediaList.appendChild(badge);
  });
}

function renderScenarioEditor() {
  const scenario = selectedScenario();
  if (!scenario) return;
  const stageText = stageTextForShape(scenario, scenario.shape);
  const stageIcon = stageIconForShape(scenario, scenario.shape);
  UI.scenarioName.value = scenario.name;
  UI.scenarioTriggers.value = scenario.triggers.join(', ');
  UI.scenarioIconInput.value = stageIcon.kind === 'emoji' ? stageIcon.value : '';
  UI.scenarioPrimary.value = stageText.primary;
  UI.scenarioSecondary.value = stageText.secondary;
  UI.scenarioDetail.value = stageText.detail;
  const typography = getScenarioTypography(scenario, scenario.shape);
  UI.scenarioIconSize.value = typography.icon.size;
  UI.scenarioIconColor.value = typography.icon.color;
  UI.scenarioPrimarySize.value = typography.primary.size;
  UI.scenarioPrimaryColor.value = typography.primary.color;
  UI.scenarioSecondarySize.value = typography.secondary.size;
  UI.scenarioSecondaryColor.value = typography.secondary.color;
  UI.scenarioDetailSize.value = typography.detail.size;
  UI.scenarioDetailColor.value = typography.detail.color;
  UI.scenarioIconMode.textContent = stageIcon.kind === 'image' ? 'png' : (stageIcon.kind === 'emoji' ? 'emoji' : 'empty');
  const iconTextEditable = stageIcon.kind !== 'image';
  UI.scenarioIconInput.disabled = !iconTextEditable;
  UI.scenarioIconColor.disabled = !iconTextEditable;
  UI.scenarioIconInput.placeholder = iconTextEditable ? 'Emoji or glyph' : 'PNG icon active';
  renderScenarioStageChips();
  renderStageConfigPanel();
  const stage = stageById(scenario.shape);
  const visibleFields = stageVisibleEditorFields(stage);
  renderScenarioMediaEditor(scenario, stage);
  const iconLayerRow = document.getElementById('editor-icon-layer');
  if (iconLayerRow) iconLayerRow.classList.toggle('hidden', !visibleFields.has('primary') && !stageHasComponent(stage, 'icon'));
  UI.editorPrimary.classList.toggle('hidden', !visibleFields.has('primary'));
  UI.editorSecondary.classList.toggle('hidden', !visibleFields.has('secondary'));
  UI.editorDetail.classList.toggle('hidden', !visibleFields.has('detail'));
  UI.editorMedia.classList.toggle('hidden', !stageHasComponent(stage, 'image'));
  updateLayerPreviews();
}

function renderScenarioUi() {
  renderScenarioList();
  renderScenarioEditor();
  renderAiStageOverrideUi();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
}

function previewScenario(scenario) {
  if (!scenario) return;
  if (flightUi.active) {
    flightUi.active = false;
    setFlightStep('idle', 0);
  }
  stopSiriOrb();
  hideRich();
  hideIntentHeader();
  document.getElementById('stage').classList.remove('flow-active');
  document.getElementById('stage-wrap')?.classList.remove('flow-active');
  updateActive('');
  applyStagePhoneBlur(scenario.shape);
  morphTo(renderShapeForStageId(scenario.shape), scenarioToRenderContent(scenario), null, scenario.shape);
}

function previewScenarioInstant(scenario) {
  if (!scenario) return;
  if (flightUi.active) {
    flightUi.active = false;
    setFlightStep('idle', 0);
  }
  stopSiriOrb();
  hideRich();
  hideIntentHeader();
  document.getElementById('stage').classList.remove('flow-active');
  document.getElementById('stage-wrap')?.classList.remove('flow-active');
  updateActive('');
  applyStagePhoneBlur(scenario.shape);

  const shape = renderShapeForStageId(scenario.shape);
  const content = scenarioToRenderContent(scenario);
  const geo = resolveGeometryForContent(shape, content, null, scenario.shape);

  const root = document.documentElement;
  const prevSuppress = suppressDeformation;
  suppressDeformation = true;
  root.style.setProperty('--anim-w', '0ms linear');
  root.style.setProperty('--anim-h', '0ms linear');
  root.style.setProperty('--anim-br', '0ms linear');
  root.style.setProperty('--anim-tx', '0ms linear');
  root.style.setProperty('--anim-t', '0ms linear');
  root.style.setProperty('--content-fade-ms', '0ms');
  root.style.setProperty('--detail-fade-ms', '0ms');
  root.style.setProperty('--media-fade-ms', '0ms');
  root.style.setProperty('--content-move-t', '0ms linear');
  root.style.setProperty('--primary-size-anim-ms', '0ms');
  root.style.setProperty('--text-size-anim-ms', '0ms');

  clearUiFadeTimers();
  currentShape = shape;
  applyGeometry(shape, geo, scenario.shape);
  DROPS.main.classList.toggle('home-blur', shape === 'magic');
  DROPS.main.style.setProperty('--home-glow-delay', '0ms');
  DROPS.main.classList.toggle('home-glow', shape === 'listening' || shape === 'magic');
  DROPS.main.classList.toggle('listening-orb', shape === 'listening');
  DROPS.main.classList.toggle('magic-glow', shape === 'magic');
  applyContent(content);
  applyContentPositions(shape, geo.main.w, geo.main.h, 0, 0, shape, geo.main.w, geo.main.h, null, null);
  updateActive(shape);

  suppressDeformation = prevSuppress;
  root.style.removeProperty('--anim-w');
  root.style.removeProperty('--anim-h');
  root.style.removeProperty('--anim-br');
  root.style.removeProperty('--anim-tx');
  root.style.removeProperty('--anim-t');
  root.style.removeProperty('--content-fade-ms');
  root.style.removeProperty('--detail-fade-ms');
  root.style.removeProperty('--media-fade-ms');
  root.style.removeProperty('--content-move-t');
  root.style.removeProperty('--primary-size-anim-ms');
  root.style.removeProperty('--text-size-anim-ms');
}

function selectScenario(id) {
  if (!scenarioLibrary.some(item => item.id === id)) return;
  selectedScenarioId = id;
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function commitScenarioChange(mutator) {
  const scenario = selectedScenario();
  if (!scenario) return;
  mutator(scenario);
  persistScenarios();
  renderScenarioUi();
  previewScenario(scenario);
}

function commitStageChange(stageId, mutator) {
  const index = stageLibrary.findIndex((stage) => stage.id === stageId);
  if (index < 0) return;
  const stage = { ...stageLibrary[index], components: [...stageLibrary[index].components] };
  mutator(stage);
  stageLibrary[index] = normalizeStage(stage, stageLibrary[index]);
  persistStageLibrary();
  scenarioLibrary = scenarioLibrary.map((scenario) => createScenario(scenario));
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function addStage() {
  const scenario = selectedScenario();
  const baseStage = stageById(scenario?.shape || 'card');
  const stage = normalizeStage({
    id: stageId(),
    name: 'New Stage',
    preset: false,
    renderShape: baseStage?.renderShape || 'card',
    cornerRadius: Number.isFinite(baseStage?.cornerRadius) ? baseStage.cornerRadius : 30,
    widthOverride: null,
    heightOverride: null,
    iconTextGap: Number.isFinite(baseStage?.iconTextGap) ? baseStage.iconTextGap : null,
    iconLeftPadding: Number.isFinite(baseStage?.iconLeftPadding) ? baseStage.iconLeftPadding : null,
    components: (baseStage?.components?.length ? [...baseStage.components] : ['icon', 'primary', 'secondary']),
  }, baseStage);
  stageLibrary.push(stage);
  persistStageLibrary();
  commitScenarioChange((active) => {
    active.shape = stage.id;
    active.content.typographyByShape = normalizeTypographyByShape(
      active.content.typographyByShape,
      stage.id
    );
    active.content.sizeByShape = normalizeStageSizeByShape(
      active.content.sizeByShape,
      stage.id,
      active.content
    );
  });
}

function deleteCurrentStage() {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage || stage.preset) return;
  const fallbackId = stageById('pill')?.id || stageLibrary.find((item) => item.id !== stage.id)?.id;
  if (!fallbackId) return;
  stageLibrary = stageLibrary.filter((item) => item.id !== stage.id);
  scenarioLibrary = scenarioLibrary.map((item) => {
    if (item.shape !== stage.id) return item;
    return createScenario({
      ...item,
      shape: fallbackId,
      content: item.content,
      triggers: item.triggers,
    });
  });
  if (scenario?.shape === stage.id) {
    selectedScenarioId = scenario.id;
  }
  persistStageLibrary();
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function resetCurrentStageToDefault() {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  const builtin = builtinStageById(stage.id);
  if (!builtin) return;
  const index = stageLibrary.findIndex((item) => item.id === stage.id);
  if (index < 0) return;
  stageLibrary[index] = normalizeStage(builtin, builtin);
  persistStageLibrary();
  scenarioLibrary = scenarioLibrary.map((item) => createScenario(item));
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function addScenario(shape = 'pill') {
  const scenario = createScenario({
    name: shape === 'card' ? 'New Card' : (shape === 'dot' ? 'New Dot' : 'New Scenario'),
    shape,
    content: {
      icon: createIcon('emoji', shape === 'dot' ? '•' : '◉'),
      primary: '',
      secondary: '',
      detail: '',
    },
  });
  scenarioLibrary.push(scenario);
  selectedScenarioId = scenario.id;
  persistScenarios();
  renderScenarioUi();
  previewScenario(scenario);
}

function duplicateScenario() {
  const scenario = selectedScenario();
  if (!scenario) return;
  const copy = createScenario({
    name: `${scenario.name} Copy`,
    shape: scenario.shape,
    content: typeof structuredClone === 'function'
      ? structuredClone(scenario.content)
      : JSON.parse(JSON.stringify(scenario.content)),
    triggers: [...scenario.triggers],
  });
  scenarioLibrary.push(copy);
  selectedScenarioId = copy.id;
  persistScenarios();
  renderScenarioUi();
  previewScenario(copy);
}

function deleteScenario() {
  if (scenarioLibrary.length <= 1) return;
  const idx = scenarioLibrary.findIndex(item => item.id === selectedScenarioId);
  if (idx < 0) return;
  scenarioLibrary.splice(idx, 1);
  selectedScenarioId = scenarioLibrary[Math.max(0, idx - 1)]?.id || scenarioLibrary[0]?.id || '';
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function scenarioMatchesText(scenario, text) {
  const haystack = String(text || '').toLowerCase();
  if (!haystack) return false;
  if (scenario.name.toLowerCase().includes(haystack)) return true;
  return scenario.triggers.some(trigger => haystack.includes(trigger.toLowerCase()));
}

function resolveScenario(inputText) {
  const match = scenarioLibrary.find(item => scenarioMatchesText(item, inputText));
  return match || selectedScenario();
}

function splitBridgeMs() {
  return clamp(Math.round(animDur * 0.62), 300, 460);
}

function listBridgeMs() {
  return 500;
}

function listPhaseTwoStartMs() {
  return 500;
}

function thinkingBridgeMs() {
  return clamp(Math.round(animDur * 0.55), 220, 420);
}

function homeThinkingBridgeMs() {
  return clamp(Math.round(animDur * 0.48), 180, 320);
}

function cardHeightForTransition(fromShape, toShape, fromGeo, toGeo) {
  if (fromShape === 'card' && Number.isFinite(fromGeo?.h)) return fromGeo.h;
  if (toShape === 'card' && Number.isFinite(toGeo?.main?.h)) return toGeo.main.h;
  return SHAPES.card.main.h;
}

function cardDurationBonusMs(cardHeight) {
  const h = Number.isFinite(cardHeight) ? cardHeight : SHAPES.card.main.h;
  return clamp(Math.round((h / 580) * 200), 0, 360);
}

function transitionAnimMs(fromShape, toShape, baseMs = animDur, fromGeo = null, toGeo = null) {
  const fromCardLike = fromShape === 'card' || fromShape === 'card-s';
  const toCardLike = toShape === 'card' || toShape === 'card-s';
  const isDotPillPair = (
    (fromShape === 'dot' && toShape === 'pill') ||
    (fromShape === 'pill' && toShape === 'dot')
  );
  const isPillCardPair = (
    (fromShape === 'pill' && toCardLike) ||
    (fromCardLike && toShape === 'pill')
  );
  const isDotCardPair = (
    (fromShape === 'dot' && toCardLike) ||
    (fromCardLike && toShape === 'dot')
  );
  const cardBonus = cardDurationBonusMs(cardHeightForTransition(fromShape, toShape, fromGeo, toGeo));
  if (isDotPillPair) return clamp(baseMs, 100, 1800);
  if (isPillCardPair) return clamp(baseMs + Math.round(cardBonus * 0.5), 100, 1800);
  if (isDotCardPair) return clamp(baseMs + cardBonus, 100, 1800);
  return clamp(baseMs, 100, 1800);
}

function clearSplitTimers() {
  while (splitTimers.length) clearTimeout(splitTimers.pop());
}

function scheduleSplitTimer(ms, fn) {
  const id = setTimeout(fn, ms);
  splitTimers.push(id);
  return id;
}

function clearSplitAnimationOverlays() {
  const main = DROPS.main;
  const left = DROPS.left;
  const right = DROPS.right;
  if (!main || !left || !right) return;

  if (main._metaAnim) {
    main._metaAnim.cancel();
    main._metaAnim = null;
  }
  if (main._splitAnim) {
    main._splitAnim.cancel();
    main._splitAnim = null;
  }
  [left, right].forEach((el) => {
    if (el._splitAnim) {
      el._splitAnim.cancel();
      el._splitAnim = null;
    }
  });

  main.classList.remove('metaball-prep');
  main.style.filter = '';
}

function bridgeFromSplitToTarget(shape, contentData, customGeo, stageId = null) {
  clearSplitAnimationOverlays();
  clearSplitTimers();

  const easing = getActiveEasing();
  const phaseMs = splitBridgeMs();
  const main = DROPS.main;
  const left = DROPS.left;
  const right = DROPS.right;

  if (!main || !left || !right) {
    morphCore(shape, contentData, customGeo, false, null, stageId);
    return;
  }

  main.style.width = '100px';
  main.style.height = '100px';
  main.style.borderRadius = '50px';
  main.style.transform = 'translate(-50px,-50px)';
  main.style.pointerEvents = 'auto';
  main.style.opacity = '0';
  main.style.scale = '1 1';

  [left, right].forEach((el) => {
    el.style.width = '96px';
    el.style.height = '96px';
    el.style.borderRadius = '48px';
    el.style.opacity = '1';
    el.style.pointerEvents = 'none';
    el.style.scale = '1 1';
  });
  left.style.transform = 'translate(-108px,-48px)';
  right.style.transform = 'translate(12px,-48px)';

  main._splitAnim = main.animate([
    { transform: 'translate(-50px,-50px) scale(1.1,0.92)', borderRadius: '42px', opacity: 0, filter: 'blur(0.3px)', offset: 0 },
    { transform: 'translate(-50px,-50px) scale(1.05,0.97)', borderRadius: '46px', opacity: 0.58, filter: 'blur(0px)', offset: 0.58 },
    { transform: 'translate(-50px,-50px) scale(1,1)', borderRadius: '50px', opacity: 1, filter: 'blur(0px)', offset: 1 },
  ], { duration: phaseMs, easing, fill: 'forwards' });

  left._splitAnim = left.animate([
    { transform: 'translate(-108px,-48px) scale(1,1)', opacity: 1, offset: 0 },
    { transform: 'translate(-76px,-48px) scale(1.02,0.98)', opacity: 0.68, offset: 0.56 },
    { transform: 'translate(-48px,-48px) scale(0.94,1.04)', opacity: 0, offset: 1 },
  ], { duration: phaseMs, easing, fill: 'forwards' });

  right._splitAnim = right.animate([
    { transform: 'translate(12px,-48px) scale(1,1)', opacity: 1, offset: 0 },
    { transform: 'translate(-20px,-48px) scale(1.02,0.98)', opacity: 0.68, offset: 0.56 },
    { transform: 'translate(-48px,-48px) scale(0.94,1.04)', opacity: 0, offset: 1 },
  ], { duration: phaseMs, easing, fill: 'forwards' });

  updateActive('split');
  splitBridgeTimer = setTimeout(() => {
    splitBridgeTimer = null;
    clearSplitAnimationOverlays();

    main.style.width = '100px';
    main.style.height = '100px';
    main.style.borderRadius = '50px';
    main.style.transform = 'translate(-50px,-50px)';
    main.style.opacity = '1';
    main.style.pointerEvents = 'auto';
    main.style.scale = '1 1';

    left.style.transform = 'translate(-48px,-48px)';
    right.style.transform = 'translate(-48px,-48px)';
    left.style.opacity = '0';
    right.style.opacity = '0';
    left.style.pointerEvents = 'none';
    right.style.pointerEvents = 'none';

    currentShape = 'dot';
    lastMainGeo = { ...SHAPES.dot.main };
    applyContentPositions('dot', SHAPES.dot.main.w, SHAPES.dot.main.h);

    if (shape === 'dot') {
      if (contentData) applyContent(contentData);
      updateActive('dot');
      return;
    }
    // Commit centered dot first so phase 2 matches normal dot -> target motion.
    void main.offsetWidth;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        morphCore(shape, contentData, customGeo, false, null, stageId);
      });
    });
  }, phaseMs + 12);
}

function bridgeToSplitViaDot() {
  clearSplitAnimationOverlays();
  clearSplitTimers();

  morphCore('dot', { icon:'', primary:'', secondary:'', detail:'' }, null, true, 0);
  splitBridgeTimer = setTimeout(() => {
    splitBridgeTimer = null;
    animateSplitMetaball();
  }, splitBridgeMs());
}

function bridgeFromListToTarget(shape, contentData, customGeo, stageId = null) {
  collapseListStack();
  morphCore('pill', null, null, true);
  updateActive('list');
  listBridgeTimer = setTimeout(() => {
    listBridgeTimer = null;
    if (shape === 'pill') {
      morphCore('pill', contentData, customGeo, false, null, stageId);
      return;
    }
    morphTo(shape, contentData, customGeo, stageId);
  }, listPhaseTwoStartMs());
}

function bridgeFromThinkingToTarget(shape, contentData, customGeo, stageId = null) {
  morphCore('circle', null, null, true, 0);
  updateActive('ai');
  thinkingBridgeTimer = setTimeout(() => {
    thinkingBridgeTimer = null;
    morphTo(shape, contentData, customGeo, stageId);
  }, thinkingBridgeMs());
}

function enterAiModeVisual(startBreathing = false) {
  const main = document.getElementById('drop-main');
  if (!main) return;
  if (aiBreathingTimer) {
    clearTimeout(aiBreathingTimer);
    aiBreathingTimer = null;
  }
  main.classList.add('ai-mode');
  main.classList.remove('ai-breathing');
}

function setAiBridgeWindow(durationMs = 900) {
  const main = document.getElementById('drop-main');
  if (!main) return;
  if (aiBridgeTimer) {
    clearTimeout(aiBridgeTimer);
    aiBridgeTimer = null;
  }
  main.classList.add('ai-bridge');
  aiBridgeTimer = setTimeout(() => {
    aiBridgeTimer = null;
    main.classList.remove('ai-bridge');
  }, Math.max(220, durationMs));
}

function animateHomePromptToThinking() {
  const prompt = document.getElementById('home-start-prompt');
  if (!prompt) return;
  if (homePromptExitTimer) {
    clearTimeout(homePromptExitTimer);
    homePromptExitTimer = null;
  }
  prompt.classList.add('visible');
  prompt.classList.remove('to-thinking');
  void prompt.offsetWidth;
  prompt.classList.add('to-thinking');
  homePromptExitTimer = setTimeout(() => {
    homePromptExitTimer = null;
    prompt.classList.remove('visible');
    prompt.classList.remove('to-thinking');
  }, 360);
}

function bridgeHomeToThinking(targetShape) {
  if (thinkingBridgeTimer) {
    clearTimeout(thinkingBridgeTimer);
    thinkingBridgeTimer = null;
  }
  stopSiriOrb();
  C.thumb.style.opacity = '0';
  animateHomePromptToThinking();
  updateActive(targetShape);
  enterAiModeVisual(false);
  const transitionMs = clamp(
    Math.round(transitionAnimMs('circle', 'ai', animDur) * 1.45),
    520,
    1200
  );
  setAiBridgeWindow(Math.max(780, Math.round(animDur * 1.8)));
  morphCore('ai', { icon:'', primary:'', secondary:'', detail:'' }, null, true, 0);
  {
    const main = document.getElementById('drop-main');
    if (main) {
      main.classList.add('home-blur');
      main.classList.add('home-glow');
    }
  }
  if (targetShape === 'idle') {
    showAiIdle();
    updateActive('idle');
    return;
  }
  startSiriOrb(true, false, false);
  updateActive('ai');
}

function bridgeThinkingToHome(targetShape = 'circle', contentData = null, customGeo = null, stageId = null) {
  if (thinkingBridgeTimer) {
    clearTimeout(thinkingBridgeTimer);
    thinkingBridgeTimer = null;
  }
  stopSiriOrb({ keepAiMode: true });
  const bridgeWindowMs = Math.max(780, Math.round(animDur * 1.8));
  setAiBridgeWindow(bridgeWindowMs);
  setTimeout(() => {
    const main = document.getElementById('drop-main');
    if (!main) return;
    main.classList.remove('ai-mode');
    main.classList.remove('home-blur');
    main.classList.remove('home-glow');
  }, bridgeWindowMs);
  morphCore(targetShape, contentData, customGeo, true, Math.round(homeThinkingBridgeMs() * 0.2), stageId);
  updateActive(targetShape);
}

function getActiveEasing() {
  const sel = document.getElementById('ease-select');
  if (!sel) return 'cubic-bezier(0.22,1,0.36,1)';
  const pick = EASING_FN[sel.value];
  return pick ? pick() : 'cubic-bezier(0.22,1,0.36,1)';
}

function getCurrentMainGeometry() {
  const main = DROPS.main;
  if (!main) return { ...lastMainGeo };
  const cs = getComputedStyle(main);
  const g = { ...lastMainGeo };

  const w = parseFloat(cs.width);
  const h = parseFloat(cs.height);
  const op = parseFloat(cs.opacity);
  if (Number.isFinite(w)) g.w = w;
  if (Number.isFinite(h)) g.h = h;
  if (Number.isFinite(op)) g.op = op;

  if (cs.borderRadius) g.br = cs.borderRadius.split(' ')[0];

  const t = cs.transform;
  if (t && t !== 'none') {
    const m2d = t.match(/^matrix\(([^)]+)\)$/);
    if (m2d) {
      const parts = m2d[1].split(',').map(v => parseFloat(v.trim()));
      if (parts.length === 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
        g.tx = parts[4];
        g.ty = parts[5];
      }
    } else {
      const m3d = t.match(/^matrix3d\(([^)]+)\)$/);
      if (m3d) {
        const parts = m3d[1].split(',').map(v => parseFloat(v.trim()));
        if (parts.length === 16 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
          g.tx = parts[12];
          g.ty = parts[13];
        }
      }
    }
  }
  return g;
}

function shouldUseStrongDeform(fromShape, toShape) {
  const compact = new Set(['circle', 'magic', 'pill', 'split']);
  return compact.has(fromShape) && compact.has(toShape);
}

function deformationIntensity(fromShape, toShape, fromMain, toMain) {
  const maxSide = Math.max(fromMain.w, fromMain.h, toMain.w, toMain.h);
  if (shouldUseStrongDeform(fromShape, toShape)) return 1;
  if (String(fromShape).startsWith('card') || String(toShape).startsWith('card')) return 0.35;
  if (maxSide >= 320 || fromMain.h >= 220 || toMain.h >= 220) return 0.35;
  if (maxSide <= 160) return 0.9;
  return 0.6;
}

function runMainDeformation(fromShape, toShape, fromMain, toMain) {
  const main = DROPS.main;
  if (!main || !fromMain || !toMain) return;
  if (suppressDeformation) return;
  if (toShape === 'split') return;
  if ((fromMain.op ?? 1) <= 0.01 || (toMain.op ?? 1) <= 0.01) return;

  const dw = toMain.w - fromMain.w;
  const dh = toMain.h - fromMain.h;
  if (Math.abs(dw) < 2 && Math.abs(dh) < 2) return;

  if (mainDeformAnim) {
    mainDeformAnim.cancel();
    mainDeformAnim = null;
  }
  main.style.scale = '1 1';

  const intensity = deformationIntensity(fromShape, toShape, fromMain, toMain);
  const horizontal = Math.abs(dw) >= Math.abs(dh);
  const direction = horizontal ? (dw >= 0 ? 1 : -1) : (dh >= 0 ? 1 : -1);

  const antMag = 0.04 * intensity;
  const relMag = 0.06 * intensity;

  let antX = 1, antY = 1, relX = 1, relY = 1;
  if (horizontal) {
    antX = 1 - direction * antMag;
    antY = 1 + direction * antMag * 0.95;
    relX = 1 + direction * relMag;
    relY = 1 - direction * relMag * 0.8;
  } else {
    antX = 1 + direction * antMag * 0.95;
    antY = 1 - direction * antMag;
    relX = 1 - direction * relMag * 0.8;
    relY = 1 + direction * relMag;
  }

  antX = clamp(antX, 0.93, 1.1);
  antY = clamp(antY, 0.93, 1.1);
  relX = clamp(relX, 0.9, 1.14);
  relY = clamp(relY, 0.9, 1.14);

  const totalMs = clamp(Math.round(currentTransitionAnimMs * 1.02), 340, 980);
  const ease = getActiveEasing();
  const aEnd = 0.16;
  const bEnd = 0.74;

  const anim = main.animate([
    {
      scale: '1 1',
      offset: 0,
      easing: ease,
    },
    {
      scale: `${antX} ${antY}`,
      offset: aEnd,
      easing: ease,
    },
    {
      scale: `${relX} ${relY}`,
      offset: bEnd,
      easing: ease,
    },
    {
      scale: '1 1',
      offset: 1,
    },
  ], {
    duration: totalMs,
    easing: 'linear',
    fill: 'none',
  });

  mainDeformAnim = anim;
  anim.onfinish = () => {
    if (mainDeformAnim !== anim) return;
    mainDeformAnim = null;
    main.style.scale = '1 1';
  };
  anim.oncancel = () => {
    if (mainDeformAnim === anim) {
      mainDeformAnim = null;
      main.style.scale = '1 1';
    }
  };
}

function applyGeometry(shape, resolvedGeo, stageId = null) {
  const geo = resolvedGeo || SHAPES[shape] || SHAPES.card;
  const mainRadius = stageId ? stageCornerRadiusPx(stageId, geo.main.br) : geo.main.br;
  const useBottomAlign = !!canvasSettings.bottomAlign;
  const HOME_ORB_BOTTOM_MARGIN = 20;
  const alignedStageHeight = PAGE_MODE_OVERRIDE === RESPONSE_MODE.AI
    ? 420
    : (useBottomAlign
    ? Math.max(BOTTOM_ALIGN_REF_H, geo.main.h, SHAPES.dot.main.h)
    : geo.main.h);
  ['main','left','right'].forEach(k => {
    const el = DROPS[k], s = geo[k];
    const anchorHeight = (shape === 'idle' && k === 'main')
      ? SHAPES.dot.main.h
      : ((shape === 'ai' && k === 'main') ? SHAPES.dot.main.h : s.h);
    const yOffset = useBottomAlign ? ((alignedStageHeight - anchorHeight) / 2) : 0;
    let translateY = s.ty + yOffset;
    if (PAGE_MODE_OVERRIDE === RESPONSE_MODE.AI && (shape === 'circle' || shape === 'listening' || shape === 'magic') && k === 'main') {
      const topLeftY = alignedStageHeight - s.h - HOME_ORB_BOTTOM_MARGIN;
      translateY = topLeftY - (alignedStageHeight / 2);
    }
    el.style.width        = s.w + 'px';
    el.style.height       = s.h + 'px';
    el.style.borderRadius = (k === 'main') ? mainRadius : s.br;
    el.style.transform    = `translate(${s.tx}px,${translateY}px)`;
    el.style.opacity      = s.op;
    el.style.pointerEvents = s.op > 0 ? 'auto' : 'none';
  });
  const stage = document.getElementById('stage');
  if (stage) stage.style.height = alignedStageHeight + 'px';
  lastMainGeo = { ...geo.main };
}

const uiFadeTimers = [];
function clearUiFadeTimers() {
  while (uiFadeTimers.length) clearTimeout(uiFadeTimers.pop());
}

let currentContentFadeMs = 260;
let currentDetailFadeMs = 260;
let currentMediaFadeMs = 260;
let currentTransitionAnimMs = 450;

function applyCardDetailLayout(cardWidth) {
  C.det.style.width = `${cardDetailTextWidth(cardWidth)}px`;
  C.det.style.maxWidth = `${cardDetailTextWidth(cardWidth)}px`;
  C.det.style.whiteSpace = 'normal';
  C.det.style.wordBreak = 'break-word';
}

function resetDetailInlineLayout() {
  C.det.style.width = '';
  C.det.style.maxWidth = '';
  C.det.style.whiteSpace = 'nowrap';
  C.det.style.wordBreak = '';
}

function setOpacityWithDelay(el, targetOpacity, inDelayMs = 0, outDelayMs = 0) {
  const target = Number(targetOpacity) || 0;
  const current = parseFloat(getComputedStyle(el).opacity);

  if (target <= 0) {
    if (outDelayMs > 0 && Number.isFinite(current) && current > 0.02) {
      const id = setTimeout(() => {
        el.style.opacity = '0';
      }, outDelayMs);
      uiFadeTimers.push(id);
      return;
    }
    el.style.opacity = '0';
    return;
  }

  if (inDelayMs <= 0) {
    el.style.opacity = String(target);
    return;
  }

  if (Number.isFinite(current) && current <= 0.02) {
    el.style.opacity = '0';
    const id = setTimeout(() => {
      el.style.opacity = String(target);
    }, inDelayMs);
    uiFadeTimers.push(id);
    return;
  }
  el.style.opacity = String(target);
}

function isIconOnlyThumb(shape) {
  if (thumbContentState.kind === 'image' && thumbContentState.value) {
    return ['circle', 'listening', 'magic', 'dot', 'pill', 'card', 'card-s', 'card-form', 'card-list', 'custom'].includes(shape);
  }
  const icon = (C.thumbLabel.textContent || '').trim();
  if (!icon) return false;
  if (icon === '···') return false;
  return ['circle', 'listening', 'magic', 'dot', 'pill', 'card', 'card-s', 'card-form', 'card-list', 'custom'].includes(shape);
}

function applyThumbVisualMode(shape) {
  const icon = thumbContentState.kind === 'image' ? '__image__' : (C.thumbLabel.textContent || '').trim();
  const homeEmpty = (shape === 'circle' || shape === 'listening' || shape === 'magic') && !icon;
  C.thumb.classList.toggle('thumb-empty', homeEmpty);

  const plain = isIconOnlyThumb(shape);
  C.thumb.classList.toggle('thumb-plain-icon', plain && !homeEmpty);
  if (!plain || homeEmpty) {
    C.thumb.style.fontSize = '';
    C.thumb.style.color = '';
    return;
  }
  const sizeByShape = {
    circle: 42,
    listening: 42,
    magic: 42,
    dot: 42,
    pill: 40,
    card: 48,
    'card-s': 48,
    'card-form': 48,
    'card-list': 48,
    custom: 40,
  };
  C.thumb.style.fontSize = (sizeByShape[shape] || 40) + 'px';
}

function applyTypographyStyles(shape) {
  const typography = normalizeTypography(contentTypographyState, shape);
  C.thumb.style.color = typography.icon.color;
  if (thumbContentState.kind !== 'image') {
    C.thumb.style.fontSize = typography.icon.size + 'px';
    C.thumbImg.style.width = '';
    C.thumbImg.style.height = '';
  } else {
    C.thumbImg.style.width = `${typography.icon.size}px`;
    C.thumbImg.style.height = `${typography.icon.size}px`;
  }
  C.prim.style.fontSize = typography.primary.size + 'px';
  C.prim.style.color = typography.primary.color;
  C.sec.style.fontSize = typography.secondary.size + 'px';
  C.sec.style.color = typography.secondary.color;
  C.det.style.fontSize = typography.detail.size + 'px';
  C.det.style.color = typography.detail.color;
}

function ensureStageMediaEls(count) {
  const stage = document.getElementById('stage');
  if (!stage) return [C.media];
  const existing = Array.from(stage.querySelectorAll('.c-media-extra'));
  const neededExtra = Math.max(0, count - 1);
  while (existing.length < neededExtra) {
    const img = document.createElement('img');
    img.className = 'c-media-extra';
    img.alt = '';
    stage.appendChild(img);
    existing.push(img);
  }
  while (existing.length > neededExtra) {
    const el = existing.pop();
    if (el) el.remove();
  }
  return [C.media, ...existing];
}

function hideAllStageMedia() {
  ensureStageMediaEls(1).forEach((el) => {
    el.style.display = 'none';
    el.style.opacity = '0';
    el.style.width = '';
    el.style.height = '';
    el.style.transform = '';
    if (el !== C.media) el.removeAttribute('src');
  });
}

function applyCardMediaLayout(cardWidth, shape = 'card') {
  const images = normalizeStageImages(stageMediaState);
  const mediaHeights = measureCardMediaHeights(images, cardWidth, shape);
  const mediaHeight = mediaStackHeight(mediaHeights);
  const mediaTops = mediaHeights.map((_, index) =>
    CARD_P + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index
  );
  const typography = normalizeTypography(contentTypographyState, shape);
  const layout = shape === 'image'
    ? { mediaHeight, mediaHeights, mediaTops }
    : (shape === 'card-s'
      ? getCardSLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, thumbContentState)
      : getCardLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, thumbContentState));
  if (!images.length || !layout.mediaHeight) {
    hideAllStageMedia();
    return;
  }
  const els = ensureStageMediaEls(images.length);
  const x = CARD_P;
  els.forEach((el, idx) => {
    const image = images[idx];
    const mediaHeight = layout.mediaHeights[idx];
    const mediaTop = layout.mediaTops[idx];
    if (!image || !mediaHeight || !Number.isFinite(mediaTop)) {
      el.style.display = 'none';
      el.style.opacity = '0';
      return;
    }
    el.src = image.src;
    el.style.display = 'block';
    el.style.width = `${cardMediaWidth(cardWidth, shape)}px`;
    el.style.height = `${mediaHeight}px`;
    el.style.transform = `translate(${x}px,${mediaTop}px)`;
    el.style.opacity = '1';
  });
}

function applyOutgoingCardMediaLayout(imageValue, cardWidth, shape = 'card') {
  const images = normalizeStageImages(Array.isArray(imageValue) ? imageValue : (imageValue ? [imageValue] : []));
  const mediaHeights = measureCardMediaHeights(images, cardWidth, shape);
  const mediaHeight = mediaStackHeight(mediaHeights);
  const mediaTops = mediaHeights.map((_, index) =>
    CARD_P + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index
  );
  const typography = normalizeTypography(contentTypographyState, shape);
  const layout = shape === 'image'
    ? { mediaHeight, mediaHeights, mediaTops }
    : (shape === 'card-s'
      ? getCardSLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, thumbContentState)
      : getCardLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, thumbContentState));
  if (!images.length || !layout.mediaHeight) return false;
  const els = ensureStageMediaEls(images.length);
  els.forEach((el, idx) => {
    const image = images[idx];
    const mediaHeight = layout.mediaHeights[idx];
    const mediaTop = layout.mediaTops[idx];
    if (!image || !mediaHeight || !Number.isFinite(mediaTop)) {
      el.style.display = 'none';
      el.style.opacity = '0';
      return;
    }
    el.src = image.src;
    el.style.display = 'block';
    el.style.width = `${cardMediaWidth(cardWidth, shape)}px`;
    el.style.height = `${mediaHeight}px`;
    el.style.transform = `translate(${CARD_P}px,${mediaTop}px)`;
    el.style.opacity = '0';
  });
  return true;
}

function setUiMotionProfile(fromShape, toShape, fromGeo = null, toGeo = null) {
  const root = document.documentElement;
  let transitionMs = transitionAnimMs(fromShape, toShape, animDur, fromGeo, toGeo);
  const isHomeThinkingPair = (
    (fromShape === 'circle' && toShape === 'ai') ||
    (fromShape === 'ai' && toShape === 'circle') ||
    (fromShape === 'magic' && toShape === 'ai') ||
    (fromShape === 'ai' && toShape === 'magic')
  );
  if (isHomeThinkingPair) {
    transitionMs = clamp(Math.round(transitionMs * 1.45), 520, 1200);
  }
  const geometryEase = isHomeThinkingPair ? 'cubic-bezier(0.42,0,0.2,1)' : 'var(--spring)';
  const fromCardLike = fromShape === 'card' || fromShape === 'card-s';
  const toCardLike = toShape === 'card' || toShape === 'card-s';
  let contentFadeMs = 260;
  let detailFadeMs = 260;
  let mediaFadeMs = 260;
  let thumbFadeMs = 280;
  let contentMoveMs = transitionMs;
  let primarySizeAnimMs = transitionMs;
  let textSizeAnimMs = transitionMs;
  let secondaryInAdvanceMs = 0;
  let detailInAdvanceMs = 0;

  if ((fromShape === 'pill' && toCardLike) || (fromCardLike && toShape === 'pill')) {
    primarySizeAnimMs = clamp(Math.round(transitionMs * 1.2), 420, 900);
    textSizeAnimMs = clamp(Math.round(transitionMs * 1.08), 360, 820);
  }
  if (fromShape === 'pill' && toCardLike) {
    secondaryInAdvanceMs = 60;
    detailInAdvanceMs = 200;
  }
  if (fromShape === 'dot' && toCardLike) {
    contentMoveMs = 0;
  }
  if (fromShape === 'image' && toShape === 'pill') {
    contentMoveMs = 0;
  }
  if (fromCardLike && toShape === 'dot') {
    contentFadeMs = 200;
    detailFadeMs = 200;
  }
  if (fromCardLike && toShape === 'pill') {
    mediaFadeMs = transitionMs;
  }
  if ((fromShape === 'idle' && toShape === 'dot') || (fromShape === 'dot' && toShape === 'idle')) {
    thumbFadeMs = 200;
  }

  contentDelayProfile = { secondaryInAdvanceMs, detailInAdvanceMs };
  currentContentFadeMs = contentFadeMs;
  currentDetailFadeMs = detailFadeMs;
  currentMediaFadeMs = mediaFadeMs;
  currentTransitionAnimMs = transitionMs;
  root.style.setProperty('--anim-w', `${transitionMs}ms ${geometryEase}`);
  root.style.setProperty('--anim-h', `${transitionMs}ms ${geometryEase}`);
  root.style.setProperty('--anim-br', `${transitionMs}ms ${geometryEase}`);
  root.style.setProperty('--anim-tx', `${transitionMs}ms ${geometryEase}`);
  root.style.setProperty('--anim-t', `${transitionMs}ms ${geometryEase}`);
  root.style.setProperty('--content-fade-ms', `${contentFadeMs}ms`);
  root.style.setProperty('--detail-fade-ms', `${detailFadeMs}ms`);
  root.style.setProperty('--media-fade-ms', `${mediaFadeMs}ms`);
  root.style.setProperty('--thumb-fade-ms', `${thumbFadeMs}ms`);
  root.style.setProperty('--content-move-t', `${contentMoveMs}ms ${geometryEase}`);
  root.style.setProperty('--primary-size-anim-ms', `${primarySizeAnimMs}ms`);
  root.style.setProperty('--text-size-anim-ms', `${textSizeAnimMs}ms`);
}

function applyContentPositions(shape, w, h, fadeInDelayMs = 0, fadeOutDelayMs = 0, fromShape = shape, fromWidth = w, fromHeight = h, outgoingMedia = null, outgoingTypography = null) {
  const pos = contentPos(shape, w, h);
  C.thumb.style.cssText += `width:${pos.thumb.w}px;height:${pos.thumb.h}px;border-radius:${pos.thumb.br};transform:translate(${pos.thumb.x}px,${pos.thumb.y}px);`;
  applyThumbVisualMode(shape);
  let thumbOpacity = pos.thumb.op;
  if (shape === 'circle') thumbOpacity = 0;
  else if (shape === 'magic' && thumbContentState.kind === 'none') thumbOpacity = 0;
  setOpacityWithDelay(C.thumb, thumbOpacity, fadeInDelayMs, fadeOutDelayMs);
  const setEl = (el, p, customInDelayMs = fadeInDelayMs) => {
    const finalTransform = p.cx
      ? `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`
      : `translate(${p.x}px,${p.y}px)`;
    el.style.transform = finalTransform;
    setOpacityWithDelay(el, p.op, customInDelayMs, fadeOutDelayMs);
    if (p.fs) el.style.fontSize = p.fs + 'px';
  };
  setEl(C.prim, pos.prim);
  setEl(C.sec, pos.sec, Math.max(0, fadeInDelayMs - (contentDelayProfile.secondaryInAdvanceMs || 0)));
  setEl(C.det, pos.det, Math.max(0, fadeInDelayMs - (contentDelayProfile.detailInAdvanceMs || 0)));
  if (shape === 'ai' || shape === 'magic') {
    [C.thumb, C.prim, C.sec, C.det, C.div].forEach((el) => {
      if (!el) return;
      el.style.transitionDelay = '0ms';
      el.style.opacity = '0';
    });
    hideAllStageMedia();
    if (!document.body.classList.contains('glass-flow-active')) {
      hideRich();
    }
  }
  applyTypographyStyles(shape);
  const mainLineWidth = lineTextWidth(shape, w);
  if (mainLineWidth) {
    C.prim.style.width = `${mainLineWidth}px`;
    C.prim.style.maxWidth = `${mainLineWidth}px`;
    C.sec.style.width = `${mainLineWidth}px`;
    C.sec.style.maxWidth = `${mainLineWidth}px`;
    C.prim.style.overflow = 'hidden';
    C.sec.style.overflow = 'hidden';
    C.prim.style.textOverflow = 'ellipsis';
    C.sec.style.textOverflow = 'ellipsis';
    C.prim.style.whiteSpace = 'nowrap';
    C.sec.style.whiteSpace = 'nowrap';
  } else {
    C.prim.style.width = '';
    C.prim.style.maxWidth = '';
    C.sec.style.width = '';
    C.sec.style.maxWidth = '';
    C.prim.style.overflow = '';
    C.sec.style.overflow = '';
    C.prim.style.textOverflow = '';
    C.sec.style.textOverflow = '';
    C.prim.style.whiteSpace = '';
    C.sec.style.whiteSpace = '';
  }
  if (shape === 'card' || shape === 'card-s') {
    applyCardDetailLayout(w);
    applyCardMediaLayout(w, shape);
  } else if (shape === 'image') {
    resetDetailInlineLayout();
    C.det.style.opacity = '0';
    C.div.style.opacity = '0';
    C.thumb.style.opacity = '0';
    C.prim.style.opacity = '0';
    C.sec.style.opacity = '0';
    applyCardMediaLayout(w, 'image');
  } else {
    if (fromShape === 'card' || fromShape === 'card-s') {
      applyCardDetailLayout(fromWidth);
      const outgoingLayout = outgoingTypography
        ? ((fromShape === 'card-s')
          ? getCardSLayoutMetrics(fromWidth, outgoingTypography, C.det.textContent, outgoingMedia, C.prim.textContent, C.sec.textContent, thumbContentState)
          : getCardLayoutMetrics(fromWidth, outgoingTypography, C.det.textContent, outgoingMedia, C.prim.textContent, C.sec.textContent, thumbContentState))
        : null;
      if (shape === 'dot' && outgoingTypography && outgoingLayout) {
        const cardSGap = stageIconTextGap(selectedScenario()?.shape, 'card-s');
        const cardSIconPad = stageIconLeftPadding(selectedScenario()?.shape, 'card-s');
        const outgoingTextX = fromShape === 'card-s'
          ? (hasIconContent(thumbContentState) ? (cardSIconPad + TS + cardSGap) : CARD_P)
          : CARD_P;
        const outgoingLineWidth = fromShape === 'card-s'
          ? Math.max(
            120,
            fromWidth - (hasIconContent(thumbContentState) ? (cardSIconPad + TS + cardSGap) : CARD_P) - CARD_P
          )
          : Math.max(120, fromWidth - CARD_P * 2);
        C.prim.style.transform = `translate(${outgoingTextX}px,${outgoingLayout.primaryTop}px)`;
        C.sec.style.transform = `translate(${outgoingTextX}px,${outgoingLayout.secondaryTop}px)`;
        C.prim.style.fontSize = outgoingTypography.primary.size + 'px';
        C.sec.style.fontSize = outgoingTypography.secondary.size + 'px';
        C.prim.style.color = outgoingTypography.primary.color;
        C.sec.style.color = outgoingTypography.secondary.color;
        C.prim.style.width = `${outgoingLineWidth}px`;
        C.prim.style.maxWidth = `${outgoingLineWidth}px`;
        C.sec.style.width = `${outgoingLineWidth}px`;
        C.sec.style.maxWidth = `${outgoingLineWidth}px`;
      }
      if (outgoingTypography && outgoingLayout) {
        C.det.style.transform = `translate(${CARD_P}px,${outgoingLayout.detailTop}px)`;
        C.det.style.fontSize = outgoingTypography.detail.size + 'px';
        C.det.style.color = outgoingTypography.detail.color;
      }
      const id = setTimeout(() => {
        resetDetailInlineLayout();
      }, fadeOutDelayMs + currentDetailFadeMs);
      uiFadeTimers.push(id);
    } else {
      resetDetailInlineLayout();
    }
    if ((fromShape === 'card' || fromShape === 'card-s') && outgoingMedia && applyOutgoingCardMediaLayout(outgoingMedia, fromWidth, fromShape)) {
      const id = setTimeout(() => {
        hideAllStageMedia();
        if (!stageMediaState?.length) C.media.removeAttribute('src');
      }, fadeOutDelayMs + currentMediaFadeMs);
      uiFadeTimers.push(id);
    } else {
      hideAllStageMedia();
    }
  }
  C.div.style.transform = `translate(${pos.div.x}px,${pos.div.y}px)`;
  C.div.style.width = (pos.div.dw||0) + 'px';
  setOpacityWithDelay(C.div, pos.div.op, fadeInDelayMs, fadeOutDelayMs);
}

function applyContent(data) {
  if (data.icon      !== undefined) setThumbContent(data.icon);
  if (data.primary   !== undefined) C.prim.textContent  = data.primary;
  if (data.secondary !== undefined) C.sec.textContent   = data.secondary;
  if (data.detail    !== undefined) C.det.textContent   = data.detail;
  if (data.images    !== undefined) setStageMedia(data.images);
  else if (data.image !== undefined) setStageMedia(data.image ? [data.image] : []);
  if (data.typography !== undefined) setContentTypography(data.typography, currentShape);
}

let richHideTimer = null;

function showRich(html) {
  if (richHideTimer) {
    clearTimeout(richHideTimer);
    richHideTimer = null;
  }
  C.rich.style.opacity = '0';
  C.rich.innerHTML = html;
  C.rich.classList.add('visible');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    C.rich.style.opacity = '1';
  }));
}

function hideRich() {
  if (document.body.classList.contains('glass-flow-active')) return;
  if (richHideTimer) {
    clearTimeout(richHideTimer);
    richHideTimer = null;
  }
  C.rich.style.opacity = '0';
  richHideTimer = setTimeout(() => {
    richHideTimer = null;
    C.rich.classList.remove('visible');
    C.rich.innerHTML = '';
  }, 220);
}

function morphCore(shape, contentData, customGeo, skipActiveUpdate = false, uiFadeDelayMs = null, stageId = null) {
  clearUiFadeTimers();
  const fromShape = currentShape;
  const prevStageMedia = Array.isArray(stageMediaState) ? stageMediaState.map((item) => ({ ...item })) : [];
  const prevCardTypography = fromShape === 'card'
    ? normalizeTypography(contentTypographyState, 'card')
    : null;
  const prevGeo = getCurrentMainGeometry();
  const nextGeo = resolveGeometryForContent(shape, contentData, customGeo, stageId);
  setUiMotionProfile(fromShape, shape, prevGeo, nextGeo);
  const prevArea = Math.max(1, prevGeo.w * prevGeo.h);
  const nextArea = Math.max(1, nextGeo.main.w * nextGeo.main.h);
  const autoInDelay = fromShape === 'dot' && shape === 'pill'
    ? 180
    : (fromShape === 'idle' && shape === 'dot')
      ? 0
    : (fromShape === 'dot' && (shape === 'card' || shape === 'card-s'))
      ? 200
      : (nextArea > prevArea * 1.08 ? 300 : 0);
  const autoOutDelay = (
    (fromShape === 'pill' && shape === 'dot') ||
    (fromShape === 'card' && shape === 'dot') ||
    (fromShape === 'card-s' && shape === 'dot') ||
    (fromShape === 'card' && shape === 'pill') ||
    (fromShape === 'card-s' && shape === 'pill') ||
    (fromShape === 'dot' && shape === 'idle')
  )
    ? 0
    : (nextArea < prevArea * 0.92 ? 120 : 0);
  const fadeInDelayMs = uiFadeDelayMs === null ? autoInDelay : uiFadeDelayMs;
  const fadeOutDelayMs = uiFadeDelayMs === null ? autoOutDelay : 0;

  currentShape = shape;
  document.body.dataset.currentShape = shape;
  const geo = nextGeo;
  const mw = geo.main.w, mh = geo.main.h;
  applyGeometry(shape, geo, stageId);
  DROPS.main.classList.toggle('home-blur', shape === 'magic');
  const enteringHomeLike = (shape === 'circle' || shape === 'listening' || shape === 'magic') && !(fromShape === 'circle' || fromShape === 'listening' || fromShape === 'magic');
  const goingHome = enteringHomeLike;
  if (goingHome) {
    DROPS.main.style.setProperty('--home-glow-delay', `${Math.max(0, currentTransitionAnimMs - 500)}ms`);
    DROPS.main.classList.remove('home-glow');
    void DROPS.main.offsetWidth;
    if (shape === 'listening' || shape === 'magic') DROPS.main.classList.add('home-glow');
  } else {
    DROPS.main.style.setProperty('--home-glow-delay', '0ms');
    DROPS.main.classList.toggle('home-glow', shape === 'listening' || shape === 'magic');
  }
  DROPS.main.classList.toggle('listening-orb', shape === 'listening');
  DROPS.main.classList.toggle('magic-glow', shape === 'magic');
  if (contentData) applyContent(contentData);
  applyContentPositions(shape, mw, mh, fadeInDelayMs, fadeOutDelayMs, fromShape, prevGeo.w, prevGeo.h, prevStageMedia, prevCardTypography);
  if (!skipActiveUpdate) updateActive(shape);
}

function morphTo(shape, contentData, customGeo, stageId = null) {
  if (splitBridgeTimer) {
    clearTimeout(splitBridgeTimer);
    splitBridgeTimer = null;
  }
  if (listBridgeTimer) {
    clearTimeout(listBridgeTimer);
    listBridgeTimer = null;
  }
  if (thinkingBridgeTimer) {
    clearTimeout(thinkingBridgeTimer);
    thinkingBridgeTimer = null;
  }

  const inAiIdleState = currentShape === 'idle' && document.getElementById('drop-main')?.classList.contains('ai-mode');
  if ((currentShape === 'ai' || inAiIdleState) && shape !== 'ai' && shape !== 'idle') {
    if (shape === 'circle' || shape === 'magic') {
      bridgeThinkingToHome(shape, contentData, customGeo, stageId);
      return;
    }
    bridgeFromThinkingToTarget(shape, contentData, customGeo, stageId);
    return;
  }

  if (currentShape === 'split' && shape !== 'split') {
    bridgeFromSplitToTarget(shape, contentData, customGeo, stageId);
    return;
  }

  if (currentShape === 'list' && shape !== 'list') {
    bridgeFromListToTarget(shape, contentData, customGeo, stageId);
    return;
  }

  if (shape === 'split' && currentShape !== 'split') {
    bridgeToSplitViaDot();
    return;
  }

  morphCore(shape, contentData, customGeo, false, null, stageId);
}

function setIntentHeader(label, step) {
  const hdr  = document.getElementById('intent-header');
  const lbl  = document.getElementById('intent-label');
  const dot  = document.getElementById('intent-step-dot');
  const slbl = document.getElementById('intent-step-lbl');
  if (!hdr || !lbl || !dot || !slbl) return;
  lbl.textContent = label;
  if (step) {
    slbl.textContent = step;
    dot.classList.add('visible');
  } else {
    slbl.textContent = '';
    dot.classList.remove('visible');
  }
  hdr.style.display = 'flex';
  hdr.classList.add('visible');
}

let intentHeaderTrackRaf = null;

function cancelIntentHeaderTracking() {
  if (!intentHeaderTrackRaf) return;
  cancelAnimationFrame(intentHeaderTrackRaf);
  intentHeaderTrackRaf = null;
}

function trackIntentHeaderForTransition(ms = animDur + 120) {
  cancelIntentHeaderTracking();
  const end = performance.now() + Math.max(120, ms);
  const tick = () => {
    const hdr = document.getElementById('intent-header');
    if (!hdr || !hdr.classList.contains('glass-intent') || !hdr.classList.contains('visible')) return;
    positionIntentHeaderAboveMain();
    if (performance.now() < end) {
      intentHeaderTrackRaf = requestAnimationFrame(tick);
    } else {
      intentHeaderTrackRaf = null;
    }
  };
  intentHeaderTrackRaf = requestAnimationFrame(tick);
}

function positionIntentHeaderAboveMain() {
  const hdr = document.getElementById('intent-header');
  const stage = document.getElementById('stage');
  const main = document.getElementById('drop-main');
  if (!hdr || !stage || !main) return;
  const stageRect = stage.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const headerH = Math.ceil(hdr.getBoundingClientRect().height || hdr.offsetHeight || 0);
  const gap = 10;
  const left = Math.round(mainRect.left - stageRect.left + 2);
  const top = Math.max(8, Math.round(mainRect.top - stageRect.top - headerH - gap));
  hdr.style.left = `${left}px`;
  hdr.style.top = `${top}px`;
}

function updateOrbLabel() {
  const lbl = document.getElementById('glass-orb-label');
  const stage = document.getElementById('stage');
  const main = document.getElementById('drop-main');
  if (!lbl) return;
  const isIdle = glassUi.active && glassUi.state === GS.IDLE;
  const isThinking = glassUi.active && glassUi.state === GS.THINKING;
  const text = isIdle ? (glassUi.interimText || '') : (isThinking ? (glassUi.aiVoice || '') : '');
  if (!text || (!isIdle && !isThinking)) {
    lbl.classList.remove('visible');
    lbl.textContent = '';
    return;
  }
  lbl.textContent = text;
  lbl.classList.add('visible');
  if (stage && main) {
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const lblH = lbl.offsetHeight || 24;
    const gap = 12;
    const top = Math.max(8, Math.round(mainRect.top - stageRect.top - lblH - gap));
    lbl.style.top = `${top}px`;
  }
}

function hideIntentHeader() {
  const hdr = document.getElementById('intent-header');
  if (!hdr) return;
  hdr.classList.remove('visible');
  hdr.classList.remove('glass-intent');
  hdr.style.display = 'none';
  hdr.style.left = '';
  hdr.style.top = '';
  cancelIntentHeaderTracking();
}

let siriRaf     = null;
let orbT        = 0;
let orbRamp     = 0;
let orbTarget   = 0;
const ORB_SPEED = 1/180;
let orbCY = 0.5;
let orbCYTarget = 0.5;
const USE_THINKING_ORB = false;

const _BLOBS = [
  { r:0.32, speed:0.022, phase:0.00, ax:0.10, ay:0.08, freq:1.00 },
  { r:0.28, speed:0.027, phase:2.10, ax:0.09, ay:0.11, freq:1.31 },
  { r:0.26, speed:0.032, phase:4.20, ax:0.11, ay:0.07, freq:0.77 },
  { r:0.24, speed:0.022, phase:1.05, ax:0.08, ay:0.09, freq:1.61 },
];

function ss(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

function _ensureOrbLoop() {
  if (!USE_THINKING_ORB) return;
  if (siriRaf) return;
  const orb    = document.getElementById('siri-orb');
  const canvas = document.getElementById('siri-canvas');
  orb.classList.add('visible');
  const ctx = canvas.getContext('2d');

  function draw() {
    orbT += 1;
    if (orbRamp < orbTarget) orbRamp = Math.min(orbTarget, orbRamp + ORB_SPEED);
    if (orbRamp > orbTarget) orbRamp = Math.max(orbTarget, orbRamp - ORB_SPEED);

    const dm = document.getElementById('drop-main');
    const W = dm.offsetWidth  || 100;
    const H = dm.offsetHeight || 100;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width  = W;
      canvas.height = H;
    }

    orbCY += (orbCYTarget - orbCY) * 0.03;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const r = ss(orbRamp);
    for (const b of _BLOBS) {
      const px = (0.5   + Math.sin(orbT * b.speed          + b.phase) * b.ax * r) * W;
      const py = (orbCY + Math.cos(orbT * b.speed * b.freq + b.phase) * b.ay * r) * H;
      const br = b.r * Math.min(W, H) * (1 + 0.06 * Math.sin(orbT * 0.027 + b.phase));
      const col = (b === _BLOBS[1] || b === _BLOBS[3]) ? 'rgba(210,232,255,1)' : 'rgba(255,255,255,1)';
      ctx.save();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    siriRaf = requestAnimationFrame(draw);
  }
  draw();
}

function resetOrbStyle() {
  const orb = document.getElementById('siri-orb');
  if (!orb) return;
  orb.style.transition = 'none';
  orb.style.filter     = '';
  orb.style.opacity    = '';
  orb.style.zIndex     = '';
  orbCYTarget = 0.5;
}

function showAiIdle() {
  enterAiModeVisual(false);
  if (!USE_THINKING_ORB) {
    const orb = document.getElementById('siri-orb');
    if (orb) orb.classList.remove('visible');
    orbRamp = 0;
    orbTarget = 0;
    return;
  }
  orbTarget = 0;
  _ensureOrbLoop();
}

function startSiriOrb(instant, startBreathing = true, startGlow = true) {
  enterAiModeVisual(startBreathing);
  if (!USE_THINKING_ORB) {
    const orb = document.getElementById('siri-orb');
    if (orb) orb.classList.remove('visible');
    orbRamp = 0;
    orbTarget = 0;
    return;
  }
  if (instant) { orbRamp = 1; }
  orbTarget = 1;
  _ensureOrbLoop();
}

function ambientFromAi(shape, contentData, customGeo) {
  stopSiriOrb();
  morphTo(shape, contentData, customGeo);
}

function stopSiriOrb(options = {}) {
  const keepAiMode = options?.keepAiMode === true;
  if (aiBreathingTimer) {
    clearTimeout(aiBreathingTimer);
    aiBreathingTimer = null;
  }
  if (aiBridgeTimer) {
    clearTimeout(aiBridgeTimer);
    aiBridgeTimer = null;
  }
  if (siriRaf) { cancelAnimationFrame(siriRaf); siriRaf = null; }
  const orb = document.getElementById('siri-orb');
  if (orb) orb.classList.remove('visible');
  clearListPills();
  const main = document.getElementById('drop-main');
  if (main && !keepAiMode) {
    main.classList.remove('ai-mode');
    main.classList.remove('ai-breathing');
    main.classList.remove('ai-bridge');
  }
  C.thumb.style.opacity = '';
  C.thumb.style.fontSize = '';
  orbRamp = 0; orbTarget = 0;
}

const THINKING_HOLD_MS = 3000;
const DATE_SELECTION_STEP_GEO = {
  ...SHAPES['card-form'],
  main: { ...SHAPES['card-form'].main, h: 180, ty: -90 },
};
const FLIGHT_FLOW_STEPS = [
  { type: 'destination', shape: 'pill', aiGreet: 'Where would you like to go?' },
  { type: 'dates', shape: 'card-form', aiGreet: 'When are you departing, and when do you return?' },
  {
    type: 'options',
    shape: 'card-list',
    label: 'Passengers',
    key: 'passengers',
    aiGreet: 'How many passengers?',
    options: [
      { icon: '🧑', name: '1 adult', sub: 'Just me' },
      { icon: '👫', name: '2 adults', sub: 'Pair' },
      { icon: '👨‍👩‍👧', name: 'Family · 2+', sub: 'Adults with children' },
    ],
  },
  { type: 'thinking', shape: 'magic', aiGreet: null },
  {
    type: 'options',
    shape: 'card-list',
    label: 'Choose your flight',
    key: 'flight',
    aiGreet: 'I found three options — arrow keys to navigate, space to pick.',
    options: [
      { icon: '🟢', name: '06:45 → 09:30', sub: 'ANA · Non-stop · $842' },
      { icon: '🟡', name: '10:15 → 15:40', sub: 'JAL · 1 stop · $631' },
      { icon: '🟢', name: '22:00 → 06:15+1', sub: 'United · Non-stop · $912' },
    ],
  },
  { type: 'confirm', shape: 'card-form', aiGreet: "Here's your flight summary. Space to continue or tell me what to change." },
  {
    type: 'payment',
    shape: 'card-form',
    aiGreet: 'How would you like to pay?',
    options: [
      { icon: '', name: 'Apple Pay', sub: 'Default wallet' },
      { icon: '💳', name: 'Visa •••• 9421', sub: 'Primary card' },
      { icon: '🏦', name: 'Bank transfer', sub: '1-2 business days' },
    ],
  },
  { type: 'done', shape: 'card', aiGreet: null },
];
const flightUi = {
  active: false,
  stepIndex: 0,
  focused: 0,
  editReturnStepIndex: null,
  data: {
    origin: 'SFO',
    destination: '',
    depart: '',
    return: '',
    passengers: '',
    flight: '',
    paymentMethod: '',
  },
};
let flightThinkingTimer = null;
const API_BASE = location.protocol === 'file:' ? 'http://localhost:5180' : '';

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function chatPanelEl() { return null; }

const GLASS_CONTACTS = [
  { id:1, name:'Hiro Tanaka', initials:'HT', relation:'Colleague · Design',
    chips:[
      { label:'Design review', message:'Hey, do you have time for a design review sometime?' },
      { label:'Share a file', message:'I have a file to share with you — when\'s a good time?' },
      { label:'Schedule a sync', message:'Want to schedule a quick sync this week?' },
    ]},
  { id:2, name:'Hiro Horri', initials:'HH', relation:'Friend',
    chips:[
      { label:'What\'s up?', message:'Hey! What\'s up? Haven\'t caught up in a while.' },
      { label:'Lunch this week?', message:'Hey, want to grab lunch sometime this week?' },
      { label:'Check this out', message:'Hey, I found something cool I wanted to share with you!' },
    ]},
];
const GS = { IDLE:0, THINKING:1, DISAMBIGUATE:2, COMPOSE:3, CONFIRM:4, SENDING:5, SENT:6 };
const GLASS_TOP_INSET = 10;
const GLASS_BOTTOM_INSET = 10;
const GLASS_CONTROLS_GAP = 14;
const GLASS_CONTROLS_LIFT = 78;
const GLASS_MIN_SHELL_H = 100;
const GLASS_MAX_SHELL_H = 400;
const glassUi = {
  active:false, state:GS.IDLE, sel:0,
  contact:null, msg:'', composeText:'',
  showChips:true, showCheck:false, aiVoice:'',
  disambiguateContacts: [], interimText: '',
};
const voiceEngine = {
  recognition: null,
  supported: false,
  active: false,
  mode: 'off',
  restartOnEnd: false,
  audioCtx: null,
  analyser: null,
  micStream: null,
  vizRaf: null,
};

async function initVoiceAnalyser() {
  if (voiceEngine.analyser) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    voiceEngine.micStream = stream;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.88;
    ctx.createMediaStreamSource(stream).connect(analyser);
    voiceEngine.audioCtx = ctx;
    voiceEngine.analyser = analyser;
  } catch(e) {}
}

function lerpShadow(t) {
  const lr = (a, b) => (a + (b - a) * t).toFixed(2);
  const lc = (r0,g0,b0,a0, r1,g1,b1,a1) =>
    `rgba(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)},${(a0+(a1-a0)*t).toFixed(3)})`;
  return [
    `inset 0 ${lr(4,6)}px ${lr(29.8,6)}px -2px ${lc(192,213,255,0.15, 34,105,245,0.15)}`,
    `inset 0 ${lr(-7,-11)}px 20px -6px ${lc(225,231,255,0.60, 255,255,255,0.40)}`,
    `inset 0 ${lr(6,-20)}px ${lr(18.4,30)}px ${lr(-10,-8)}px ${lc(255,255,255,0.20, 172,188,247,0.50)}`,
    `inset 0 ${lr(-3,-56)}px 60px -30px rgba(19,75,192,1)`,
  ].join(', ');
}

function lerpButtonShadow(t) {
  const lr = (a, b) => (a + (b - a) * t).toFixed(2);
  const lc = (r0,g0,b0,a0, r1,g1,b1,a1) =>
    `rgba(${Math.round(r0+(r1-r0)*t)},${Math.round(g0+(g1-g0)*t)},${Math.round(b0+(b1-b0)*t)},${(a0+(a1-a0)*t).toFixed(3)})`;
  return [
    `inset 0 ${lr(-5,6)}px ${lr(6,6)}px -2px ${lc(70,132,255,0.15, 34,105,245,0.15)}`,
    `inset 0 ${lr(-6,-11)}px ${lr(7.8,20)}px -8px ${lc(172,188,247,0.50, 255,255,255,0.40)}`,
    `inset 0 ${lr(-1,10)}px ${lr(14.4,30)}px -6px ${lc(255,255,255,0.40, 172,188,247,0.50)}`,
    `inset 0 ${lr(-6,-56)}px ${lr(47.4,60)}px -30px rgba(19,75,192,1)`,
  ].join(', ');
}

let _voiceVizDictationStart = 0;

function lerpGlowShadow(t) {
  return `0 0 ${(t * 12).toFixed(1)}px ${(t * 3).toFixed(1)}px rgba(34,105,245,${(t * 0.45).toFixed(3)})`;
}

function applyVoiceVisualization(level) {
  const shadow = lerpShadow(level);
  const glow = lerpGlowShadow(level);

  if (voiceEngine.mode === 'command') {
    const glowEl = document.getElementById('home-glow-layer');
    if (glowEl) glowEl.style.boxShadow = shadow;

    if (glassUi.state === GS.DISAMBIGUATE) {
      const dropMain = document.getElementById('drop-main');
      if (dropMain) {
        dropMain.style.boxShadow = lerpShadow(level);
      }
    }

    if (glassUi.state === GS.CONFIRM) {
      document.querySelectorAll('.g-action-btn').forEach(btn => {
        btn.style.transition = 'transform 240ms cubic-bezier(0.22,1,0.36,1), background 240ms cubic-bezier(0.22,1,0.36,1)';
        btn.style.boxShadow = lerpButtonShadow(level);
      });
    }
  }

  if (voiceEngine.mode === 'dictation' && Date.now() - _voiceVizDictationStart > 600) {
    const field = document.querySelector('.g-listen-field.compose-input');
    if (field) {
      field.style.transition = 'min-height 400ms ease, background 400ms ease, border-color 400ms ease';
      field.style.boxShadow = shadow;
    }
  }
}

let _vizLevel = 0;

function startVoiceViz() {
  if (!voiceEngine.analyser) return;
  if (voiceEngine.vizRaf) cancelAnimationFrame(voiceEngine.vizRaf);
  _vizLevel = 0;
  const data = new Uint8Array(voiceEngine.analyser.frequencyBinCount);
  function tick() {
    if (!voiceEngine.active || voiceEngine.mode === 'off') {
      voiceEngine.vizRaf = null;
      return;
    }
    voiceEngine.analyser.getByteFrequencyData(data);
    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    const raw = Math.pow(Math.min(avg / 32, 1), 0.6); // lower floor + power curve for obvious response
    _vizLevel += (raw - _vizLevel) * 0.18;             // JS-side lerp for extra smoothness
    applyVoiceVisualization(_vizLevel);
    voiceEngine.vizRaf = requestAnimationFrame(tick);
  }
  voiceEngine.vizRaf = requestAnimationFrame(tick);
}

function stopVoiceViz() {
  if (voiceEngine.vizRaf) { cancelAnimationFrame(voiceEngine.vizRaf); voiceEngine.vizRaf = null; }
  const glowEl = document.getElementById('home-glow-layer');
  if (glowEl) glowEl.style.boxShadow = '';
  const field = document.querySelector('.g-listen-field.compose-input');
  if (field) { field.style.transition = ''; field.style.boxShadow = ''; }
  if (glassUi.state !== GS.DISAMBIGUATE) {
    const dropMain = document.getElementById('drop-main');
    if (dropMain) dropMain.style.boxShadow = '';
  }
  document.querySelectorAll('.g-action-btn').forEach(btn => { btn.style.transition = ''; btn.style.boxShadow = ''; });
}

function initVoiceEngine() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { addSimLog('Voice input not supported in this browser', 'system'); return; }
  voiceEngine.supported = true;
  const r = new SR();
  r.lang = 'en-US';
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.continuous = false;
  r.onresult = (e) => {
    const result = e.results[e.results.length - 1];
    const transcript = result[0].transcript.trim();
    const isFinal = result.isFinal;
    onVoiceResult(transcript, isFinal);
  };
  r.onend = () => {
    voiceEngine.active = false;
    updateMicIndicator();
    if (voiceEngine.restartOnEnd && voiceEngine.mode !== 'off' && glassUi.active) {
      setTimeout(() => {
        if (voiceEngine.restartOnEnd && glassUi.active) voiceEngine.start(voiceEngine.mode);
      }, 120);
    }
  };
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      voiceEngine.supported = false;
      voiceEngine.restartOnEnd = false;
      addSimLog('Mic access denied — use typed input', 'system');
    } else if (e.error !== 'no-speech') {
      addSimLog(`Voice error: ${e.error}`, 'system');
    }
    voiceEngine.active = false;
    updateMicIndicator();
  };
  voiceEngine.recognition = r;
}

voiceEngine.start = function(mode) {
  if (!voiceEngine.supported || !voiceEngine.recognition) return;
  voiceEngine.mode = mode;
  if (mode === 'off') { voiceEngine.stop(); return; }
  voiceEngine.restartOnEnd = true;
  if (voiceEngine.active) return;
  try {
    voiceEngine.recognition.start();
    voiceEngine.active = true;
    updateMicIndicator();
    if (mode === 'dictation') _voiceVizDictationStart = Date.now();
    initVoiceAnalyser().then(() => startVoiceViz());
  } catch(e) {}
};

voiceEngine.stop = function() {
  stopVoiceViz();
  voiceEngine.restartOnEnd = false;
  voiceEngine.mode = 'off';
  if (voiceEngine.recognition && voiceEngine.active) {
    try { voiceEngine.recognition.stop(); } catch(e) {}
  }
  voiceEngine.active = false;
  updateMicIndicator();
};

function updateMicIndicator() {
  const el = document.getElementById('sim-mic');
  const dot = document.getElementById('sim-mic-dot');
  const lbl = document.getElementById('sim-mic-label');
  if (!el) return;
  if (!voiceEngine.supported || !voiceEngine.active || voiceEngine.mode === 'off') {
    el.classList.remove('active');
    return;
  }
  el.classList.add('active');
  dot.className = voiceEngine.mode === 'dictation' ? 'dictation' : 'command';
  lbl.textContent = voiceEngine.mode === 'dictation' ? 'Dictating…' : 'Listening…';
}

function onVoiceResult(transcript, isFinal) {
  if (input) input.value = transcript;
  onTranscriptUpdate(transcript, isFinal);
}

let glassLastContentHeightPx = 180;
const glassHeightByState = {
  [GS.DISAMBIGUATE]: 160,
  [GS.COMPOSE]: 240,
  [GS.CONFIRM]: 180,
};
let glassMeasureRaf = null;
let glassMeasureSettleTimer = null;
let glassRenderToken = 0;
let glassPrevState = GS.IDLE;
let glassManualComposeEntry = false;
let glassPreFlowShape = 'circle';
let glassPauseTimer = null;
let glassDotsTimer = null;
let glassThinkingTimer = null;
let glassSendTimer = null;
let glassSentTimer = null;
let glassControlsMode = '';
let glassControlsTrackRaf = null;

function clearGlassTimers() {
  if (glassPauseTimer) { clearTimeout(glassPauseTimer); glassPauseTimer = null; }
  if (glassDotsTimer) { clearInterval(glassDotsTimer); glassDotsTimer = null; }
  if (glassThinkingTimer) { clearTimeout(glassThinkingTimer); glassThinkingTimer = null; }
  if (glassSendTimer) { clearTimeout(glassSendTimer); glassSendTimer = null; }
  if (glassSentTimer) { clearTimeout(glassSentTimer); glassSentTimer = null; }
  cancelGlassMeasureSettle();
}

function addGlassLog(text, type = 'system') {
  addSimLog(text, type);
}

function speakOutput(text) {
  glassUi.aiVoice = text;
  setSimVoice(text);
  updateOrbLabel();
}

function setGlassOverlayOpacity(active) {
  C.prim.style.opacity = active ? '0' : '';
  C.sec.style.opacity = active ? '0' : '';
  C.det.style.opacity = active ? '0' : '';
  C.div.style.opacity = active ? '0' : '';
}

function glassStateShape(state) {
  if (state === GS.IDLE) return 'listening';
  if (state === GS.THINKING) return 'magic';
  if (state === GS.DISAMBIGUATE) return 'card-list';
  if (state === GS.COMPOSE) return 'card-form';
  if (state === GS.CONFIRM) return 'card';
  if (state === GS.SENDING) return 'magic';
  if (state === GS.SENT) return 'pill';
  return 'circle';
}

function maxGlassSel() {
  if (glassUi.state === GS.DISAMBIGUATE) return GLASS_CONTACTS.length - 1;
  if (glassUi.state === GS.COMPOSE && glassUi.showChips && !glassUi.composeText) {
    return Math.max(0, (glassUi.contact?.chips || []).length - 1);
  }
  if (glassUi.state === GS.CONFIRM) return 2;
  return 0;
}

function glassComposeHint() {
  if (glassUi.showCheck) return 'Keep talking to edit · Space = confirm · say "send"';
  return 'Type → glass · 2s pause = ✅ · Enter = done';
}

function isGlassCardState(state = glassUi.state) {
  return state === GS.DISAMBIGUATE || state === GS.COMPOSE || state === GS.CONFIRM;
}

function glassContentHeightPx() {
  const measureNodeHeight = (node) => {
    if (!node) return 0;
    return Math.ceil(Math.max(
      node.getBoundingClientRect().height || 0,
      node.offsetHeight || 0,
      node.scrollHeight || 0
    ));
  };
  let layer = document.getElementById('glass-measure-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'glass-measure-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.position = 'fixed';
    layer.style.left = '-10000px';
    layer.style.top = '-10000px';
    layer.style.width = '380px';
    layer.style.visibility = 'hidden';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '-1';
    document.body.appendChild(layer);
  }
  layer.innerHTML = C.rich.innerHTML;
  let body = layer.querySelector('[data-glass-body]');
  let raw = measureNodeHeight(body);
  if (raw <= 0) {
    body = C.rich.querySelector('[data-glass-body]');
    raw = measureNodeHeight(body);
  }
  if (raw > 0) {
    const resolved = clamp(raw, 60, GLASS_MAX_SHELL_H - GLASS_TOP_INSET - GLASS_BOTTOM_INSET);
    glassLastContentHeightPx = resolved;
    if (isGlassCardState(glassUi.state)) {
      glassHeightByState[glassUi.state] = resolved;
    }
    return resolved;
  }
  if (isGlassCardState(glassUi.state) && Number.isFinite(glassHeightByState[glassUi.state]) && glassHeightByState[glassUi.state] > 0) {
    return clamp(glassHeightByState[glassUi.state], 60, GLASS_MAX_SHELL_H - GLASS_TOP_INSET - GLASS_BOTTOM_INSET);
  }
  return clamp(glassLastContentHeightPx, 60, GLASS_MAX_SHELL_H - GLASS_TOP_INSET - GLASS_BOTTOM_INSET);
}

function glassDynamicGeo(shape, contentHeightPx) {
  const base = SHAPES[shape] || SHAPES.card;
  const shellHeight = clamp(
    Math.round(contentHeightPx + GLASS_TOP_INSET + GLASS_BOTTOM_INSET),
    GLASS_MIN_SHELL_H,
    GLASS_MAX_SHELL_H
  );
  const controlsLift = (glassUi.state === GS.CONFIRM || (glassUi.state === GS.COMPOSE && glassUi.showCheck))
    ? GLASS_CONTROLS_LIFT
    : 0;
  return {
    ...base,
    main: {
      ...base.main,
      h: shellHeight,
      ty: -(shellHeight / 2) - controlsLift,
    },
  };
}

function glassSentGeo() {
  const base = SHAPES.pill || SHAPES.card;
  const textEl = C.rich.querySelector('[data-glass-sent]');
  let w = 200;
  let h = 52;
  if (textEl) {
    const rect = textEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      w = clamp(Math.round(rect.width + 48), 140, 360);
      h = clamp(Math.round(rect.height + 32), 52, 140);
    }
  }
  return {
    ...base,
    main: {
      ...base.main,
      w,
      h,
      tx: -(w / 2),
      ty: -(h / 2),
    },
  };
}

function cancelGlassMeasure() {
  if (!glassMeasureRaf) return;
  cancelAnimationFrame(glassMeasureRaf);
  glassMeasureRaf = null;
}

function cancelGlassMeasureSettle() {
  if (!glassMeasureSettleTimer) return;
  clearTimeout(glassMeasureSettleTimer);
  glassMeasureSettleTimer = null;
}

function buildGlassControlsHtml(confirmEnter = false) {
  if (!glassUi.active) return '';
  if (glassUi.state === GS.COMPOSE) {
    return `<div class="g-glass-controls"><div class="g-checkmark ${glassUi.showCheck ? 'enter' : 'hidden'}"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L9 18l10-14"/></svg></div></div>`;
  }
  if (glassUi.state === GS.CONFIRM) {
    const icons = [
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="2,18 19,10 2,2 2,8 14,10 2,12"/></svg>`,
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l4 4-9 9H4v-4l9-9z"/></svg>`,
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>`,
    ];
    const buttons = icons.map((icon, i) => `<div class="g-action-btn ${i === glassUi.sel ? 'selected' : ''}">${icon}</div>`).join('');
    return `<div class="g-glass-controls"><div class="g-action-row${confirmEnter ? ' enter' : ''}">${buttons}</div></div>`;
  }
  return '';
}

function cancelGlassControlsTracking() {
  if (!glassControlsTrackRaf) return;
  cancelAnimationFrame(glassControlsTrackRaf);
  glassControlsTrackRaf = null;
}

function positionGlassControlsOverlay() {
  const layer = C.glassControlsLayer;
  if (!layer || !layer.classList.contains('visible')) return;
  const controls = layer.querySelector('.g-glass-controls');
  const stage = document.getElementById('stage');
  const main = document.getElementById('drop-main');
  if (!controls || !stage || !main) return;
  const stageRect = stage.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const controlsRect = controls.getBoundingClientRect();
  const centerX = (mainRect.left + (mainRect.width / 2)) - stageRect.left;
  const unclampedTop = (mainRect.bottom - stageRect.top) + GLASS_CONTROLS_GAP;
  const maxTop = Math.max(8, stageRect.height - controlsRect.height - 8);
  const topY = Math.min(unclampedTop, maxTop);
  controls.style.left = `${Math.round(centerX)}px`;
  controls.style.top = `${Math.round(topY)}px`;
}

function trackGlassControlsForTransition(ms = animDur + 120) {
  cancelGlassControlsTracking();
  const end = performance.now() + Math.max(120, ms);
  const tick = () => {
    if (!glassUi.active) return;
    if (!C.glassControlsLayer?.classList.contains('visible')) return;
    positionGlassControlsOverlay();
    if (performance.now() < end) {
      glassControlsTrackRaf = requestAnimationFrame(tick);
    } else {
      glassControlsTrackRaf = null;
    }
  };
  glassControlsTrackRaf = requestAnimationFrame(tick);
}

function renderGlassControlsOverlay() {
  const layer = C.glassControlsLayer;
  if (!layer) return;
  if (!glassUi.active) {
    layer.innerHTML = '';
    layer.classList.remove('visible');
    glassControlsMode = '';
    cancelGlassControlsTracking();
    return;
  }

  let mode = '';
  if (glassUi.state === GS.COMPOSE) mode = 'compose';
  else if (glassUi.state === GS.CONFIRM) mode = 'confirm';

  if (!mode) {
    layer.innerHTML = '';
    layer.classList.remove('visible');
    glassControlsMode = '';
    cancelGlassControlsTracking();
    return;
  }

  const modeChanged = glassControlsMode !== mode;
  if (modeChanged) {
    layer.innerHTML = buildGlassControlsHtml(mode === 'confirm');
    glassControlsMode = mode;
  } else if (mode === 'compose') {
    const mark = layer.querySelector('.g-checkmark');
    if (mark) mark.classList.toggle('hidden', !glassUi.showCheck);
  } else if (mode === 'confirm') {
    const buttons = layer.querySelectorAll('.g-action-btn');
    buttons.forEach((btn, idx) => btn.classList.toggle('selected', idx === glassUi.sel));
  }

  const controls = layer.querySelector('.g-glass-controls');
  const stage = document.getElementById('stage');
  const main = document.getElementById('drop-main');
  if (!controls || !stage || !main) {
    layer.classList.remove('visible');
    cancelGlassControlsTracking();
    return;
  }
  layer.classList.add('visible');
  positionGlassControlsOverlay();
  if (glassUi.state === GS.CONFIRM || (glassUi.state === GS.COMPOSE && glassUi.showCheck)) {
    trackGlassControlsForTransition();
  } else {
    cancelGlassControlsTracking();
  }
  const hdr = document.getElementById('intent-header');
  if (hdr && hdr.classList.contains('glass-intent') && hdr.classList.contains('visible')) {
    positionIntentHeaderAboveMain();
  }
}

function updateGlassSelectionUiOnly() {
  if (!glassUi.active) return false;
  if (glassUi.state === GS.DISAMBIGUATE) {
    const rows = C.rich.querySelectorAll('.g-contact-row');
    if (!rows.length) return false;
    rows.forEach((row, idx) => row.classList.toggle('selected', idx === glassUi.sel));
    return true;
  }
  if (glassUi.state === GS.COMPOSE && glassUi.showChips && !String(glassUi.composeText || '').trim()) {
    const chips = C.rich.querySelectorAll('.g-chip');
    if (!chips.length) return false;
    chips.forEach((chip, idx) => chip.classList.toggle('selected', idx === glassUi.sel));
    return true;
  }
  if (glassUi.state === GS.CONFIRM) {
    renderGlassControlsOverlay();
    return true;
  }
  return false;
}

function buildGlassContent() {
  if (glassUi.state === GS.IDLE) {
    return '';
  }
  if (glassUi.state === GS.THINKING) {
    return `
      <div class="g-center-row">
        <div class="g-spinner"></div>
        <span id="g-thinking-dots">·</span>
      </div>
    `;
  }
  if (glassUi.state === GS.DISAMBIGUATE) {
    const rows = GLASS_CONTACTS.map((contact, i) => `
      <div class="g-contact-row ${i === glassUi.sel ? 'selected' : ''}" data-g-contact="${i}">
        <div class="g-ava">${contact.initials}</div>
        <div class="g-contact-name">${contact.name}</div>
      </div>
    `).join('');
    return `
      <div data-glass-body>
        <div class="g-card-list">${rows}</div>
      </div>
    `;
  }
  if (glassUi.state === GS.COMPOSE) {
    const contact = glassUi.contact || GLASS_CONTACTS[0];
    const chips = (contact.chips || []).map((chip, i) => `
      <div class="g-chip ${i === glassUi.sel ? 'selected' : ''}">${chip.label}</div>
    `).join('');
    const hasText = !!String(glassUi.composeText || '').trim();
    return `
      <div data-glass-body>
        <div class="g-compose-card">
          <div class="g-card-header">
            <div class="g-ava">${contact.initials}</div>
            <div class="g-to-text">To: <span class="g-to-name">${contact.name}</span></div>
          </div>
          <div class="g-chips-wrap ${glassUi.showChips && !hasText ? '' : 'collapsed'}">
            <div class="g-chips">${chips}</div>
          </div>
          <div class="g-listen-field compose-input ${hasText ? 'has-text' : ''}">
            ${hasText ? `<div class="g-listen-text">${glassUi.composeText}</div>` : '<div class="g-listen-empty">Listening...</div>'}
          </div>
        </div>
      </div>
    `;
  }
  if (glassUi.state === GS.CONFIRM) {
    const contact = glassUi.contact || GLASS_CONTACTS[0];
    return `
      <div data-glass-body>
        <div class="g-compose-card">
          <div class="g-card-header">
            <div class="g-ava">${contact.initials}</div>
            <div class="g-to-text">To: <span class="g-to-name">${contact.name}</span></div>
          </div>
          <div class="g-listen-field" style="box-shadow:inset 0 1px 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.02);">
            <div class="g-listen-text">${glassUi.msg || ''}</div>
          </div>
        </div>
      </div>
    `;
  }
  if (glassUi.state === GS.SENDING) {
    return `
      <div class="g-center-row">
        <div class="g-spinner"></div>
        <span id="g-thinking-dots">·</span>
      </div>
    `;
  }
  if (glassUi.state === GS.SENT) {
    return `<div data-glass-sent class="g-sent-toast"><span class="g-sent-emoji">✅</span><span>Message sent</span></div>`;
  }
  return '';
}

function glassRender(shouldMorph = true) {
  glassRenderToken += 1;
  const renderToken = glassRenderToken;
  const shape = glassStateShape(glassUi.state);
  document.body.classList.toggle('glass-flow-active', glassUi.active);
  C.rich.innerHTML = buildGlassContent();
  const _enteringCompose = glassUi.state === GS.COMPOSE && glassPrevState !== GS.COMPOSE && !glassManualComposeEntry;
  glassPrevState = glassUi.state;
  if (_enteringCompose) {
    const _field = C.rich.querySelector('.g-listen-field');
    if (_field) {
      _field.classList.remove('compose-input');
      void _field.offsetHeight;
      requestAnimationFrame(() => _field.classList.add('compose-input'));
    }
  }
  C.rich.classList.toggle('visible', glassUi.active);
  C.rich.classList.toggle('glass-active', glassUi.active);
  C.rich.classList.toggle('glass-sent', glassUi.active && glassUi.state === GS.SENT);
  C.rich.dataset.glassState = glassUi.active ? String(glassUi.state) : '';
  C.rich.style.opacity = glassUi.active ? '1' : '';
  renderGlassControlsOverlay();

  cancelGlassMeasure();
  cancelGlassMeasureSettle();
  if (glassUi.active && isGlassCardState(glassUi.state)) {
    void C.rich.offsetHeight;
    const applyCardMorphFromBody = (force = false) => {
      const dynamicContentH = glassContentHeightPx();
      const geo = glassDynamicGeo(shape, dynamicContentH);
      const currentGeo = getCurrentMainGeometry() || {};
      const currentH = Number(currentGeo.h) || 0;
      const currentTy = Number(currentGeo.ty) || 0;
      if (force || Math.abs(geo.main.h - currentH) > 1 || Math.abs(geo.main.ty - currentTy) > 1) {
        morphTo(shape, { icon:'', primary:'', secondary:'', detail:'' }, geo);
      }
      const hdr = document.getElementById('intent-header');
      if (hdr && hdr.classList.contains('glass-intent') && hdr.classList.contains('visible')) {
        positionIntentHeaderAboveMain();
      }
      renderGlassControlsOverlay();
    };
    // Pass A: immediate settle right after content commit.
    applyCardMorphFromBody(shouldMorph);
    // Pass B: one more settle after next frame to absorb late layout/font changes.
    glassMeasureRaf = requestAnimationFrame(() => {
      glassMeasureRaf = null;
      if (renderToken !== glassRenderToken) return;
      if (!glassUi.active || !isGlassCardState(glassUi.state)) return;
      applyCardMorphFromBody(false);
    });
    // Pass C: delayed settle to catch late layout/font hydration on state entry.
    if (shouldMorph) {
      glassMeasureSettleTimer = setTimeout(() => {
        glassMeasureSettleTimer = null;
        if (renderToken !== glassRenderToken) return;
        if (!glassUi.active || !isGlassCardState(glassUi.state)) return;
        applyCardMorphFromBody(false);
      }, 80);
    }
  } else if (glassUi.active) {
    if (glassUi.state === GS.SENT) {
      const sentGeo = glassSentGeo();
      const current = getCurrentMainGeometry();
      if (shouldMorph || Math.abs(sentGeo.main.w - (current?.w || 0)) > 1 || Math.abs(sentGeo.main.h - (current?.h || 0)) > 1) {
        morphTo(shape, { icon:'', primary:'', secondary:'', detail:'' }, sentGeo);
      }
    } else if (shouldMorph) {
      morphTo(shape, { icon:'', primary:'', secondary:'', detail:'' });
    }
    renderGlassControlsOverlay();
  } else if (shouldMorph) {
    morphTo(shape, { icon:'', primary:'', secondary:'', detail:'' });
    renderGlassControlsOverlay();
  }

  setGlassOverlayOpacity(glassUi.active);
  const glow = document.getElementById('home-glow-layer');
  if (glow) glow.style.opacity = '';

  updateOrbLabel();

  if (glassUi.active && glassUi.state === GS.DISAMBIGUATE) {
    setIntentHeader('Which Hiro?', null);
    const hdr = document.getElementById('intent-header');
    if (hdr) hdr.classList.add('glass-intent');
    positionIntentHeaderAboveMain();
    trackIntentHeaderForTransition();
  } else {
    hideIntentHeader();
  }

  if (!glassUi.active) {
    setSimInputState({ label: 'Voice Command', placeholder: 'Book a flight, send a message…', hint: '', dictating: false });
  } else if (glassUi.state === GS.IDLE) {
    setSimInputState({ label: 'Voice Command', placeholder: 'Send a message to Hiro…', hint: '', dictating: false });
  } else if (glassUi.state === GS.THINKING) {
    setSimInputState({ label: 'Voice Command', placeholder: '', hint: '', dictating: false });
  } else if (glassUi.state === GS.DISAMBIGUATE) {
    setSimInputState({ label: 'Voice Command', placeholder: 'Say a name, e.g. "Tanaka"', hint: '', dictating: false });
  } else if (glassUi.state === GS.COMPOSE) {
    setSimInputState({ label: '🎤 Voice Dictation', placeholder: 'Speak (type to simulate)…', hint: glassComposeHint(), dictating: true });
  } else if (glassUi.state === GS.CONFIRM) {
    setSimInputState({ label: 'Voice Command', placeholder: '"send", "edit", or "cancel"', hint: '', dictating: false });
  }

  if (glassUi.state === GS.THINKING) {
    let frame = 0;
    const el = document.getElementById('g-thinking-dots');
    if (el) el.textContent = '·';
    glassDotsTimer = setInterval(() => {
      const dots = document.getElementById('g-thinking-dots');
      if (!dots) return;
      frame += 1;
      dots.textContent = ['·', '· ·', '· · ·'][frame % 3];
    }, 400);
  }
}

function _applyVoiceModeForState(state) {
  const dropMain = document.getElementById('drop-main');
  if (state === GS.IDLE || state === GS.DISAMBIGUATE || state === GS.CONFIRM) {
    voiceEngine.start('command');
    if (state === GS.DISAMBIGUATE) {
      if (dropMain) dropMain.style.boxShadow = lerpShadow(0);
    } else {
      if (dropMain) dropMain.style.boxShadow = '';
    }
  } else if (state === GS.COMPOSE) {
    if (dropMain) dropMain.style.boxShadow = '';
    voiceEngine.start('dictation');
  } else {
    if (dropMain) dropMain.style.boxShadow = '';
    voiceEngine.stop();
  }
}

function glassTransitionTo(state, voiceOutput = '') {
  if (glassDotsTimer) { clearInterval(glassDotsTimer); glassDotsTimer = null; }
  if (glassUi.state === GS.COMPOSE && state !== GS.COMPOSE) {
    const _field = C.rich?.querySelector('.g-listen-field.compose-input');
    if (_field) {
      _field.classList.remove('compose-input');
      setTimeout(() => {
        glassUi.state = state;
        glassUi.sel = 0;
        speakOutput(voiceOutput || '');
        glassRender(true);
        _applyVoiceModeForState(state);
      }, 380);
      return;
    }
  }
  glassUi.state = state;
  glassUi.sel = 0;
  speakOutput(voiceOutput || '');
  glassRender(true);
  _applyVoiceModeForState(state);
}

function glassReset() {
  voiceEngine.stop();
  clearGlassTimers();
  cancelGlassMeasure();
  glassUi.active = false;
  glassUi.state = GS.IDLE;
  glassUi.sel = 0;
  glassUi.contact = null;
  glassUi.msg = '';
  glassUi.composeText = '';
  glassUi.showChips = true;
  glassUi.showCheck = false;
  glassUi.aiVoice = '';
  glassUi.interimText = '';
  glassUi._pendingMsg = '';
  speakOutput('');
  renderGlassControlsOverlay();
  glassRender(false);
  morphTo(glassPreFlowShape || 'circle', { icon:'', primary:'', secondary:'', detail:'' });
  updateActive(glassPreFlowShape || 'circle');
}

async function parseIntent(text) {
  const lower = String(text || '').toLowerCase().trim();
  if (/\b(send|message|text|msg)\b/.test(lower)) {
    // Extract recipient: everything after "to" (greedy, to end or until message body heuristic)
    const toMatch = lower.match(/\bto\s+(.+)/i);
    const recipient = toMatch ? toMatch[1].trim() : '';
    // Extract message body: text between send/message/text/msg and "to"
    const bodyMatch = lower.match(/\b(?:send|message|text|msg)\s+(.+?)\s+to\s+/i);
    const messageBody = bodyMatch ? bodyMatch[1].trim() : '';
    return { intent: 'send_message', recipient, messageBody, confidence: 1.0 };
  }
  return { intent: 'unknown', recipient: '', messageBody: '', confidence: 0 };
}

function isMessageIntent(text) {
  return /\b(send|message|text|msg)\b/i.test(String(text || ''));
}

function parseDisambiguateVoice(text, contacts) {
  const lower = text.toLowerCase().trim();
  // Check second/third BEFORE first/one — "second one" contains "one" and would false-match first
  if (/\b(second|the\s*second|number\s*two|option\s*two)\b/.test(lower)) return 1;
  if (/\b(third|the\s*third|number\s*three|option\s*three)\b/.test(lower)) return 2;
  if (/\b(first|one|1|the\s*first|number\s*one|option\s*one)\b/.test(lower)) return 0;
  for (let i = 0; i < contacts.length; i++) {
    const nameParts = contacts[i].name.toLowerCase().split(' ');
    if (nameParts.some(part => part.length > 2 && lower.includes(part))) return i;
  }
  return -1;
}

function onTranscriptUpdate(text, isFinal = false) {
  if (!glassUi.active) return;
  switch (glassUi.state) {
    case GS.IDLE:
      glassUi.interimText = isFinal ? '' : text;
      updateOrbLabel();
      if (isFinal && text) { glassUi.interimText = ''; input.value = text; void handleGlassInputSubmit(); }
      break;
    case GS.DISAMBIGUATE:
      if (isFinal && text) {
        const idx = parseDisambiguateVoice(text, glassUi.disambiguateContacts);
        if (idx >= 0) {
          glassUi.sel = idx;
          input.value = '';
          updateGlassSelectionUiOnly();
          setTimeout(() => glassConfirm(), 400);
        }
        else { addGlassLog(`No match for "${text}" — try a name or "the first one"`, 'system'); }
      }
      break;
    case GS.COMPOSE:
      handleGlassInputChange(text);
      if (isFinal && text.trim() && input) input.value = text;
      break;
    case GS.CONFIRM:
      if (isFinal && text) { input.value = text; if (parseGlassVoice(text)) input.value = ''; }
      break;
    default: break;
  }
}

function startGlassFlow() {
  if (flightUi.active) resetFlightFlowToHome();
  clearGlassTimers();
  glassUi.active = true;
  glassUi.state = GS.IDLE;
  glassUi.sel = 0;
  glassUi.contact = null;
  glassUi.msg = '';
  glassUi.composeText = '';
  glassUi.showChips = true;
  glassUi.showCheck = false;
  speakOutput('');
  glassRender(true);
  setTimeout(() => { input.focus(); voiceEngine.start('command'); }, 50);
}

function findContacts(recipientHint = '', fullText = '') {
  const query = String(recipientHint || fullText || '').toLowerCase().trim();
  const pool = GLASS_CONTACTS.filter((c) => c.name.toLowerCase().includes('hiro'));
  if (!query) return pool;
  const tokens = query.split(/\s+/).filter((tok) => tok.length >= 2);
  return pool.filter((contact) => {
    const name = contact.name.toLowerCase();
    if (name.includes(query)) return true;
    return tokens.some((tok) => name.includes(tok));
  });
}

function glassAnimateToCompose(contact, voiceText) {
  // t=0 — fade out intent header, exit all contact rows (staggered), set state, morph to compose height
  const intentHdr = document.getElementById('intent-header');
  if (intentHdr) { intentHdr.classList.remove('visible'); intentHdr.classList.add('exiting'); }

  const rows = C.rich.querySelectorAll('.g-contact-row');
  rows.forEach((el, i) => {
    el.style.animationDelay = `${i * 25}ms`;
    el.classList.add('g-row-exit');
  });

  glassUi.contact = contact;
  glassUi.composeText = '';
  glassUi.msg = '';
  glassUi.showChips = true;
  glassUi.showCheck = false;
  glassUi.state = GS.COMPOSE;
  glassPrevState = GS.COMPOSE;       // suppress normal _enteringCompose rAF
  glassManualComposeEntry = true;
  const _dm = document.getElementById('drop-main');
  if (_dm) _dm.style.boxShadow = '';
  voiceEngine.start('dictation');

  // Measure compose height off-screen before rebuilding live DOM
  let layer = document.getElementById('glass-measure-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'glass-measure-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:380px;visibility:hidden;pointer-events:none;z-index:-1;';
    document.body.appendChild(layer);
  }
  layer.innerHTML = buildGlassContent();
  const measureBody = layer.querySelector('[data-glass-body]');
  const rawH = measureBody
    ? Math.ceil(Math.max(measureBody.getBoundingClientRect().height || 0, measureBody.offsetHeight || 0, measureBody.scrollHeight || 0))
    : 0;
  const contentH = rawH > 0
    ? clamp(rawH, 60, GLASS_MAX_SHELL_H - GLASS_TOP_INSET - GLASS_BOTTOM_INSET)
    : glassLastContentHeightPx;
  const shape = glassStateShape(GS.COMPOSE);
  const geo = glassDynamicGeo(shape, contentH);
  morphTo(shape, { icon: '', primary: '', secondary: '', detail: '' }, geo);

  // t=220ms — rebuild HTML, all content starts hidden
  setTimeout(() => {
    glassManualComposeEntry = false;
    C.rich.innerHTML = buildGlassContent();
    C.rich.classList.add('glass-active', 'visible');
    C.rich.dataset.glassState = String(GS.COMPOSE);
    C.rich.style.opacity = '1';

    // Hide all enter targets before their animations
    const hdr = C.rich.querySelector('.g-card-header');
    if (hdr) hdr.style.opacity = '0';
    const chipsWrap = C.rich.querySelector('.g-chips-wrap');
    if (chipsWrap) chipsWrap.style.opacity = '0';
    const field = C.rich.querySelector('.g-listen-field');
    if (field) { field.style.opacity = '0'; field.classList.remove('compose-input'); }

    renderGlassControlsOverlay();

    // t=280ms — header fades up
    setTimeout(() => {
      const h2 = C.rich.querySelector('.g-card-header');
      if (h2) { h2.style.opacity = ''; h2.classList.add('header-enter'); }
    }, 60);

    // t=380ms — chips stagger in
    setTimeout(() => {
      const wrap = C.rich.querySelector('.g-chips-wrap');
      if (wrap) wrap.style.opacity = '';
      const chips = C.rich.querySelectorAll('.g-chip');
      chips.forEach((el, i) => {
        el.style.animationDelay = `${i * 70}ms`;
        el.classList.add('chip-enter');
      });
    }, 160);

    // t=460ms — listen field fades in (no blue shadow yet)
    setTimeout(() => {
      const f = C.rich.querySelector('.g-listen-field');
      if (!f) return;
      f.style.opacity = '';
      f.classList.add('field-enter');

      // t=560ms — blue shadow fades in
      setTimeout(() => {
        const f2 = C.rich.querySelector('.g-listen-field');
        if (!f2) return;
        f2.classList.remove('compose-input');
        void f2.offsetHeight;
        requestAnimationFrame(() => f2.classList.add('compose-input'));
      }, 100);
    }, 240);
  }, 220);

  speakOutput(voiceText || '');
  setTimeout(() => input.focus(), 500);
}

function beginComposeForContact(contact, voiceText) {
  glassAnimateToCompose(contact, voiceText);
}

function doGlassAction(index) {
  if (index === 0) {
    glassTransitionTo(GS.SENDING, '');
    glassSendTimer = setTimeout(() => {
      glassTransitionTo(GS.SENT, 'Sent.');
      addGlassLog(`✓ Delivered to ${glassUi.contact?.name || 'contact'}`, 'success');
      glassSentTimer = setTimeout(() => glassReset(), 2500);
    }, 900);
    return;
  }
  if (index === 1) {
    glassUi.showChips = false;
    glassUi.showCheck = false;
    glassUi.composeText = glassUi.msg || glassUi.composeText;
    glassTransitionTo(GS.COMPOSE, 'Edit your message.');
    setTimeout(() => input.focus(), 200);
    return;
  }
  glassReset();
}

function glassChipSelect(idx) {
  const contact = glassUi.contact || GLASS_CONTACTS[0];
  const chip = contact?.chips?.[idx];
  if (!chip) return;

  addGlassLog(`Chip: "${chip.label}"`, 'action');

  // Update state immediately (checkmark deferred)
  glassUi.composeText = chip.message;
  glassUi.msg = chip.message;
  glassUi.showChips = false;
  glassUi.showCheck = false;

  // t=0 — exit all chips (staggered), collapse wrap, fade empty text, start container morph
  const chipEls = C.rich.querySelectorAll('.g-chip');
  chipEls.forEach((el, i) => {
    const delay = i === idx ? 0 : 40 + Math.abs(i - idx) * 30;
    el.style.animationDelay = `${delay}ms`;
    el.classList.add('g-chip-exit');
  });
  const wrap = C.rich.querySelector('.g-chips-wrap');
  if (wrap) wrap.classList.add('collapsed');
  const emptyEl = C.rich.querySelector('.g-listen-empty');
  if (emptyEl) { emptyEl.style.transition = 'opacity 300ms ease'; emptyEl.style.opacity = '0'; }

  // Start morph immediately — measure layer uses collapsed class so height is correct
  const shape = glassStateShape(glassUi.state);
  const h = glassContentHeightPx();
  const geo = glassDynamicGeo(shape, h);
  const cur = getCurrentMainGeometry() || {};
  if (Math.abs(geo.main.h - (Number(cur.h) || 0)) > 1 || Math.abs(geo.main.ty - (Number(cur.ty) || 0)) > 1) {
    morphTo(shape, { icon: '', primary: '', secondary: '', detail: '' }, geo);
  }

  // t=300ms — swap in message text (midway through 600ms container morph)
  setTimeout(() => {
    const field = C.rich.querySelector('.g-listen-field');
    if (!field) return;
    field.classList.add('has-text');
    const old = field.querySelector('.g-listen-empty');
    const textEl = document.createElement('div');
    textEl.className = 'g-listen-text g-text-magic';
    textEl.textContent = chip.message;
    if (old) old.replaceWith(textEl); else field.appendChild(textEl);
    // Pulse the field glow as text arrives
    field.classList.remove('text-arriving');
    void field.offsetHeight;
    field.classList.add('text-arriving');
  }, 300);

  // t=560ms — show checkmark + re-morph to apply controls lift (container morph ~done)
  setTimeout(() => {
    glassUi.showCheck = true;
    glassControlsMode = ''; // force fresh build so enter animation fires
    renderGlassControlsOverlay();
    const shape2 = glassStateShape(glassUi.state);
    const h2 = glassContentHeightPx();
    const geo2 = glassDynamicGeo(shape2, h2);
    morphTo(shape2, { icon: '', primary: '', secondary: '', detail: '' }, geo2);
  }, 560);
}

function glassConfirm() {
  if (!glassUi.active) return;
  if (glassUi.state === GS.DISAMBIGUATE) {
    const c = GLASS_CONTACTS[glassUi.sel];
    if (!c) return;
    glassUi.contact = c;
    addGlassLog(`Selected: ${c.name}`, 'action');
    const pendingMsg = glassUi._pendingMsg || '';
    glassUi._pendingMsg = '';
    if (pendingMsg) {
      glassUi.msg = pendingMsg;
      glassUi.composeText = pendingMsg;
      glassUi.showChips = false;
      glassUi.showCheck = true;
      glassTransitionTo(GS.CONFIRM, `Confirm message to ${c.name.split(' ')[0]}.`);
    } else {
      beginComposeForContact(c, `What would you like to say to ${c.name.split(' ')[0]}?`);
    }
    return;
  }
  if (glassUi.state === GS.COMPOSE && glassUi.showChips && !glassUi.composeText) {
    glassChipSelect(glassUi.sel);
    return;
  }
  if (glassUi.state === GS.COMPOSE && glassUi.showCheck) {
    glassUi.msg = String(glassUi.composeText || glassUi.msg || '').trim();
    glassTransitionTo(GS.CONFIRM, `Send to ${glassUi.contact?.name?.split(' ')[0] || 'contact'}?`);
    input.blur();
    return;
  }
  if (glassUi.state === GS.CONFIRM) {
    doGlassAction(glassUi.sel);
  }
}

function glassDismiss() {
  if (!glassUi.active) return;
  if (glassUi.state === GS.CONFIRM) {
    glassUi.showChips = false;
    glassUi.showCheck = false;
    glassUi.composeText = glassUi.msg || glassUi.composeText;
    glassTransitionTo(GS.COMPOSE, 'Edit your message.');
    setTimeout(() => input.focus(), 200);
    return;
  }
  if (glassUi.state === GS.COMPOSE || glassUi.state === GS.DISAMBIGUATE) {
    glassReset();
  }
}

function parseGlassVoice(text) {
  const lower = String(text || '').toLowerCase().trim();
  if (!lower) return false;
  if (glassUi.state === GS.CONFIRM) {
    if (/\b(send|yes|confirm)\b/.test(lower)) { doGlassAction(0); return true; }
    if (/\b(edit|change)\b/.test(lower)) { doGlassAction(1); return true; }
    if (/\b(cancel|nevermind|never mind)\b/.test(lower)) { doGlassAction(2); return true; }
  }
  if (glassUi.state === GS.COMPOSE && glassUi.showCheck && /\b(send|yes)\b/.test(lower)) {
    doGlassAction(0);
    return true;
  }
  if (glassUi.state === GS.DISAMBIGUATE) {
    const idx = GLASS_CONTACTS.findIndex((c) => c.name.toLowerCase().includes(lower));
    if (idx >= 0) {
      glassUi.sel = idx;
      glassConfirm();
      return true;
    }
  }
  if (glassUi.state === GS.COMPOSE && glassUi.showChips && !glassUi.composeText) {
    const idx = (glassUi.contact?.chips || []).findIndex((chip) => lower.includes(chip.label.toLowerCase()));
    if (idx >= 0) {
      glassUi.sel = idx;
      glassConfirm();
      return true;
    }
  }
  return false;
}

function handleGlassInputChange(val) {
  const text = String(val || '');
  glassUi.composeText = text;
  if (text.trim()) {
    glassUi.showChips = false;
    glassUi.showCheck = false;
    if (glassPauseTimer) clearTimeout(glassPauseTimer);
    glassPauseTimer = setTimeout(() => {
      if (!glassUi.active || glassUi.state !== GS.COMPOSE) return;
      glassUi.showCheck = true;
      glassUi.msg = glassUi.composeText.trim();
      glassRender(false);
    }, 2000);
  } else {
    glassUi.showChips = true;
    glassUi.showCheck = false;
    if (glassPauseTimer) { clearTimeout(glassPauseTimer); glassPauseTimer = null; }
  }
  glassRender(false);
}

async function handleGlassInputSubmit() {
  const text = input.value.trim();
  if (!text) return;

  addGlassLog(text, 'user');

  if (glassUi.state === GS.COMPOSE) {
    glassUi.composeText = text;
    glassUi.msg = text;
    glassUi.showChips = false;
    glassUi.showCheck = true;
    glassRender(false);
    input.blur();
    return;
  }

  if (parseGlassVoice(text)) {
    input.value = '';
    input.blur();
    return;
  }

  if (glassUi.state === GS.IDLE || glassUi.state === GS.DISAMBIGUATE) {
    glassTransitionTo(GS.THINKING, '');
    const intent = await parseIntent(text);
    const matches = findContacts(intent.recipient, text);
    glassThinkingTimer = setTimeout(() => {
      const fallbackMatches = matches.length > 0
        ? matches
        : GLASS_CONTACTS.filter((c) => c.name.toLowerCase().includes('hiro'));
      const msg = intent.messageBody || '';
      if (fallbackMatches.length === 1) {
        if (msg) {
          // Pre-fill message and go straight to CONFIRM
          glassUi.contact = fallbackMatches[0];
          glassUi.msg = msg;
          glassUi.composeText = msg;
          glassUi.showChips = false;
          glassUi.showCheck = true;
          glassTransitionTo(GS.CONFIRM, `Confirm message to ${fallbackMatches[0].name.split(' ')[0]}.`);
        } else {
          beginComposeForContact(fallbackMatches[0], `Message to ${fallbackMatches[0].name.split(' ')[0]}. What would you like to say?`);
        }
      } else if (fallbackMatches.length > 1) {
        glassUi.disambiguateContacts = fallbackMatches;
        glassUi._pendingMsg = msg;
        glassTransitionTo(GS.DISAMBIGUATE, 'Which Hiro?');
      } else {
        speakOutput('Contact not found.');
        addGlassLog('Contact not found', 'system');
        glassReset();
      }
    }, 1000);
    input.value = '';
    input.blur();
    return;
  }

  input.value = '';
  input.blur();
}

function flightStep() {
  return FLIGHT_FLOW_STEPS[flightUi.stepIndex] || FLIGHT_FLOW_STEPS[0];
}

function setFlightStep(step, highlight = 0) {
  if (typeof step === 'number') {
    flightUi.stepIndex = Math.max(0, Math.min(FLIGHT_FLOW_STEPS.length - 1, step));
  } else {
    const idx = FLIGHT_FLOW_STEPS.findIndex((entry) => entry.type === step);
    flightUi.stepIndex = idx >= 0 ? idx : 0;
  }
  flightUi.focused = Math.max(0, Number(highlight) || 0);
}

function resetFlightData() {
  flightUi.data = {
    origin: 'SFO',
    destination: '',
    depart: '',
    return: '',
    passengers: '',
    flight: '',
    paymentMethod: '',
  };
  flightUi.editReturnStepIndex = null;
}

function normalizeCity(input) {
  const text = String(input || '').trim();
  if (!text) return '';
  return text
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function cityToAirport(city) {
  const key = String(city || '').toLowerCase();
  const cityMap = {
    tokyo: 'NRT',
    paris: 'CDG',
    london: 'LHR',
    'new york': 'JFK',
    ny: 'JFK',
    nyc: 'JFK',
    manhattan: 'JFK',
    sydney: 'SYD',
    dubai: 'DXB',
    seoul: 'ICN',
    amsterdam: 'AMS',
    singapore: 'SIN',
    berlin: 'BER',
  };
  const found = Object.keys(cityMap).find((k) => key.includes(k));
  return found ? cityMap[found] : (city ? city.toUpperCase().slice(0, 3) : '---');
}

function flightOptionRows(options) {
  const step = flightStep();
  return options.map((opt, index) => `
    <div class="rich-flight-row ${index === flightUi.focused ? 'selected' : ''}" data-flight-opt="${index}">
      <div class="rich-flight-left">
        <div class="rich-flight-airline">${opt.icon || ''} ${opt.name}</div>
        <div class="rich-flight-times">${opt.sub || ''}</div>
      </div>
      <div class="rich-flight-right">${
        step.type === 'options' && step.key === 'flight'
          ? `<div class="rich-flight-price">${((String(opt.sub || '').match(/\$\d[\d,]*/) || [''])[0])}</div>`
          : ''
      }</div>
    </div>
    ${index < options.length - 1 ? '<div class="rich-divider"></div>' : ''}
  `).join('');
}

function buildFlightConfirmRows() {
  const departDate = flightUi.data.depart || '—';
  const returnDate = flightUi.data.return || '—';
  const fromCode = flightUi.data.origin || 'SFO';
  const toCode = cityToAirport(flightUi.data.destination || '');
  const outTime = flightUi.data.flight || '7:10 AM - 10:30 AM';
  const backTime = flightUi.data.returnFlight || '2:10 PM - 11:30 PM';
  return `
    <div class="flight-confirm-card">
      <div class="flight-confirm-head">Departing flight • ${departDate}</div>
      <div class="flight-confirm-time">${outTime}</div>
      <div class="flight-confirm-route">${fromCode} - ${toCode}</div>
    </div>
    <div style="height:14px;"></div>
    <div class="flight-confirm-card">
      <div class="flight-confirm-head">Returning flight • ${returnDate}</div>
      <div class="flight-confirm-time">${backTime}</div>
      <div class="flight-confirm-route">${toCode} - ${fromCode}</div>
    </div>
    <div class="flight-total-row">
      <div class="flight-total-lbl">Total</div>
      <div class="flight-total-val">$395</div>
    </div>
  `;
}

function buildPaymentRows() {
  const options = flightStep().options || [];
  return options.map((opt, index) => `
    <div class="rich-flight-row ${index === flightUi.focused ? 'selected' : ''}" data-flight-opt="${index}">
      <div class="rich-flight-left">
        <div class="rich-flight-airline">${opt.icon || ''} ${opt.name}</div>
        <div class="rich-flight-times">${opt.sub || ''}</div>
      </div>
      <div class="rich-flight-right"><div class="rich-flight-meta">Space</div></div>
    </div>
    ${index < options.length - 1 ? '<div class="rich-divider"></div>' : ''}
  `).join('');
}

function buildFlightRouteRowHtml(originCode, destinationText, destinationReady) {
  return `
    <div class="flight-route-row-core">
      <div class="flight-destination-origin">${originCode}</div>
      <div class="flight-destination-swap" aria-hidden="true">
        <svg viewBox="0 0 26 24.7279" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.8">
            <path d="M11 6.36396C10.4477 6.36396 10 6.81168 10 7.36396C10 7.91624 10.4477 8.36396 11 8.36396L11 7.36396L11 6.36396ZM25.7071 8.07107C26.0976 7.68054 26.0976 7.04738 25.7071 6.65685L19.3431 0.292893C18.9526 -0.0976311 18.3195 -0.0976312 17.9289 0.292893C17.5384 0.683418 17.5384 1.31658 17.9289 1.70711L23.5858 7.36396L17.9289 13.0208C17.5384 13.4113 17.5384 14.0445 17.9289 14.435C18.3195 14.8256 18.9526 14.8256 19.3431 14.435L25.7071 8.07107ZM11 7.36396L11 8.36396L25 8.36396L25 7.36396L25 6.36396L11 6.36396L11 7.36396Z" fill="white"/>
            <path d="M0.292893 16.6569C-0.0976311 17.0474 -0.0976311 17.6805 0.292893 18.0711L6.65685 24.435C7.04738 24.8256 7.68054 24.8256 8.07107 24.435C8.46159 24.0445 8.46159 23.4113 8.07107 23.0208L2.41421 17.364L8.07107 11.7071C8.46159 11.3166 8.46159 10.6834 8.07107 10.2929C7.68054 9.90237 7.04738 9.90237 6.65685 10.2929L0.292893 16.6569ZM15 18.364C15.5523 18.364 16 17.9162 16 17.364C16 16.8117 15.5523 16.364 15 16.364L15 17.364L15 18.364ZM1 17.364L1 18.364L15 18.364L15 17.364L15 16.364L1 16.364L1 17.364Z" fill="white"/>
          </g>
        </svg>
      </div>
      <div class="flight-destination-target ${destinationReady ? 'filled' : 'placeholder'}">${destinationText}</div>
    </div>
  `;
}

function renderFlightStep(skipGreet = false) {
  const step = flightStep();
  const isDestinationStep = step.type === 'destination';
  const isDatesStep = step.type === 'dates';
  if (flightThinkingTimer) {
    clearTimeout(flightThinkingTimer);
    flightThinkingTimer = null;
  }
  stopSiriOrb();
  hideRich();
  C.thumb.style.opacity = '0';

  if (step.shape === 'pill') {
    const pillContent = isDestinationStep
      ? { icon: '', primary: '', secondary: '' }
      : { icon: '✈', primary: '', secondary: '' };
    morphTo('pill', pillContent);
  } else if (step.shape === 'card-form') {
    morphTo('card-form', { icon: '', primary: '', secondary: '' }, isDatesStep ? DATE_SELECTION_STEP_GEO : null);
  } else if (step.shape === 'card-list') {
    morphTo('card-list', { icon: '', primary: '', secondary: '' });
  } else if (step.shape === 'card') {
    morphTo('card', { icon: '', primary: '', secondary: '' });
  } else if (step.shape === 'magic') {
    morphTo('magic', { icon:'', primary:'', secondary:'', detail:'' });
  }

  let html = '';
  if (step.type === 'destination') {
    const dest = String(flightUi.data.destination || '').trim();
    const destinationReady = dest.length > 0;
    const destinationText = destinationReady ? cityToAirport(dest) : 'Where to?';
    html = `
      <div class="flight-destination-step">
        ${buildFlightRouteRowHtml(flightUi.data.origin, destinationText, destinationReady)}
      </div>
    `;
  } else if (step.type === 'dates') {
    const destinationCode = cityToAirport(flightUi.data.destination || '');
    const destinationReady = !!String(flightUi.data.destination || '').trim();
    const departVal = String(flightUi.data.depart || '').trim();
    const returnVal = String(flightUi.data.return || '').trim();
    html = `
      <div class="flight-date-step">
        <div class="flight-date-route-shared">
          ${buildFlightRouteRowHtml(flightUi.data.origin, destinationReady ? destinationCode : 'Where to?', destinationReady)}
        </div>
        <div class="flight-date-panel">
          <div class="flight-date-panel-col">
            <div class="flight-date-panel-lbl">Depart</div>
            <div class="flight-date-panel-val ${departVal ? '' : 'placeholder'}">${departVal || 'Select'}</div>
          </div>
          <div class="flight-date-panel-divider"></div>
          <div class="flight-date-panel-col">
            <div class="flight-date-panel-lbl">Return</div>
            <div class="flight-date-panel-val ${returnVal ? '' : 'placeholder'}">${returnVal || 'Select'}</div>
          </div>
        </div>
      </div>
    `;
  } else if (step.type === 'options') {
    html = `
      <div class="rich-list-header">${step.label}</div>
      <div class="rich-divider"></div>
      <div style="flex:1;overflow-y:auto;margin:0 -20px;padding:0 20px;">${flightOptionRows(step.options || [])}</div>
    `;
  } else if (step.type === 'thinking') {
    html = '';
    addChatBubble('ai', 'Searching flights...');
    flightThinkingTimer = setTimeout(() => {
      flightThinkingTimer = null;
      stopSiriOrb();
      flightNextStep(true);
    }, THINKING_HOLD_MS);
  } else if (step.type === 'confirm') {
    html = `
      <div class="rich-list-header">Confirm flight</div>
      <div style="flex:1;overflow-y:auto;margin:0 -4px;padding:0 4px;">${buildFlightConfirmRows()}</div>
    `;
  } else if (step.type === 'payment') {
    html = `
      <div class="rich-list-header">Payment</div>
      <div class="rich-divider"></div>
      <div style="flex:1;overflow-y:auto;margin:0 -20px;padding:0 20px;">${buildPaymentRows()}</div>
    `;
  } else if (step.type === 'done') {
    html = `
      <div class="rich-list-header">Trip booked</div>
      <div class="rich-divider"></div>
      <div class="rich-route-sub" style="padding-top:10px;">${flightUi.data.flight || 'Flight'} to ${flightUi.data.destination}</div>
      <div class="rich-route-sub">${flightUi.data.depart || '—'} → ${flightUi.data.return || '—'} · ${flightUi.data.paymentMethod || 'Paid'}</div>
    `;
  }

  if (html) setTimeout(() => showRich(html), 180);
  if (!skipGreet && step.aiGreet) addChatBubble('ai', step.aiGreet);

  if (step.type === 'done') {
    setTimeout(() => resetFlightFlowToHome(), 2800);
  }
}

function flightCanAdvance() {
  const step = flightStep();
  if (step.type === 'dates') {
    return !!flightUi.data.depart && !!flightUi.data.return;
  }
  if (step.type === 'options' || step.type === 'payment') {
    return true;
  }
  return true;
}

function flightNextStep(skipGreet = false) {
  if (!flightCanAdvance()) return;
  if (flightUi.stepIndex >= FLIGHT_FLOW_STEPS.length - 1) return;
  flightUi.stepIndex += 1;
  flightUi.focused = 0;
  renderFlightStep(skipGreet);
}

function flightBackStep() {
  if (!flightUi.active) return;
  if (flightUi.stepIndex > 0) {
    flightUi.stepIndex -= 1;
    flightUi.focused = 0;
    renderFlightStep(true);
    return;
  }
  resetFlightFlowToHome();
}

function updateFlightOptionHighlight() {
  document.querySelectorAll('[data-flight-opt]').forEach((el, idx) => {
    el.classList.toggle('selected', idx === flightUi.focused);
  });
}

function moveFlightHighlight(dir) {
  const step = flightStep();
  if (!flightUi.active || (step.type !== 'options' && step.type !== 'payment')) return;
  const max = Math.max(0, (step.options || []).length - 1);
  flightUi.focused = Math.max(0, Math.min(max, flightUi.focused + dir));
  updateFlightOptionHighlight();
}

function confirmFlightStep() {
  if (!flightUi.active) return;
  const step = flightStep();
  if (step.type === 'options' || step.type === 'payment') {
    const selected = step.options?.[flightUi.focused];
    if (!selected) return;
    addChatBubble('user', selected.name);
    if (step.type === 'payment') {
      flightUi.data.paymentMethod = selected.name;
    } else {
      flightUi.data[step.key] = selected.name;
      if (step.key === 'flight') {
        flightUi.data.returnFlight = selected.sub?.split('·')?.[0]?.trim() || '2:10 PM - 11:30 PM';
      }
    }
    setTimeout(() => flightNextStep(), 140);
    return;
  }
  if (step.type === 'confirm' || step.type === 'dates') {
    if (step.type === 'dates' && flightUi.editReturnStepIndex != null && flightUi.data.depart && flightUi.data.return) {
      const returnIndex = flightUi.editReturnStepIndex;
      flightUi.editReturnStepIndex = null;
      flightUi.stepIndex = returnIndex;
      flightUi.focused = 0;
      renderFlightStep(true);
      return;
    }
    flightNextStep();
    return;
  }
  if (step.type === 'done') {
    resetFlightFlowToHome();
  }
}

function nextFlightStepFor(step) {
  if (flightUi?.editReturnStepIndex != null && step?.type === 'dates') {
    return FLIGHT_FLOW_STEPS[flightUi.editReturnStepIndex] || null;
  }
  const currentIndex = FLIGHT_FLOW_STEPS.findIndex((entry) =>
    entry.type === step?.type && entry.key === step?.key && entry.shape === step?.shape
  );
  if (currentIndex < 0) return null;
  return FLIGHT_FLOW_STEPS[currentIndex + 1] || null;
}

function flightStepIndexBy(type, key = null) {
  return FLIGHT_FLOW_STEPS.findIndex((entry) =>
    entry.type === type && (key == null || entry.key === key)
  );
}

function detectFlightEditTarget(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return null;
  if (/\b(date|dates|depart|departure|return)\b/.test(t)) return { type: 'dates' };
  if (/\b(passenger|passengers|adult|adults|people|traveler|travellers|traveler|travellers)\b/.test(t)) {
    return { type: 'options', key: 'passengers' };
  }
  if (/\b(flight|airline|time|times)\b/.test(t)) return { type: 'options', key: 'flight' };
  if (/\b(payment|pay|card|apple pay|visa|bank)\b/.test(t)) return { type: 'payment' };
  return null;
}

function jumpToFlightStep(target) {
  if (!target || !target.type) return false;
  const idx = flightStepIndexBy(target.type, target.key || null);
  if (idx < 0) return false;
  flightUi.stepIndex = idx;
  flightUi.focused = 0;
  renderFlightStep(true);
  return true;
}

function nextFlightQuestion(step) {
  if (!step) return 'What would you like to do next?';
  if (step.type === 'dates') return 'When are you departing and returning?';
  if (step.type === 'options' && step.key === 'passengers') return 'How many passengers?';
  if (step.type === 'thinking') return 'Want me to find flights now?';
  if (step.type === 'options' && step.key === 'flight') return 'Which flight do you want?';
  if (step.type === 'confirm') return 'Would you like to confirm this flight?';
  if (step.type === 'payment') return 'How would you like to pay?';
  if (step.type === 'done') return 'Ready to book this trip?';
  return 'What should we do next?';
}

function isDatesAdvanceIntent(text) {
  const t = String(text || '').toLowerCase().trim();
  if (!t) return false;
  return /\b(search|confirm|confirmed|continue|next|done|yes|okay|ok|proceed)\b/.test(t);
}

function enforceFlightProgressReply(reply, action, currentStep) {
  const text = String(reply || '').trim();
  if (action !== 'next' && action !== 'select') return text;
  const nextStep = nextFlightStepFor(currentStep);
  const nextQuestion = nextFlightQuestion(nextStep);
  if (!text) return nextQuestion;
  if (/\?\s*$/.test(text)) return text;
  if (text.toLowerCase().includes(nextQuestion.toLowerCase().replace(/\?$/, ''))) return text;
  return `${text} ${nextQuestion}`;
}

async function callGeminiFlightAction(userText) {
  const step = flightStep();
  const nextStep = nextFlightStepFor(step);
  const options = Array.isArray(step.options) ? step.options.map((o, i) => `[${i}] ${o.name} — ${o.sub}`).join('\n') : '';
  const nextStepHint = nextStep
    ? `${nextStep.type}${nextStep.key ? ` (${nextStep.key})` : ''}${nextStep.label ? ` — ${nextStep.label}` : ''}`
    : 'none';
  const nextQuestionHint = nextFlightQuestion(nextStep);
  const systemPrompt = `
You are the AI brain of a structured flight-booking UI with strict steps.
Return ONLY JSON:
{"reply":"short reply","action":"next|update|select|stay|back","data":{}}

Current step type: ${step.type}
Current step label: ${step.label || ''}
Next step type: ${nextStepHint}
Next-step question to ask: ${nextQuestionHint}
Editing from confirmation: ${flightUi.editReturnStepIndex != null ? 'yes' : 'no'}
Collected data: ${JSON.stringify(flightUi.data)}
${options ? `Available options:\n${options}` : ''}

Rules:
- destination: collect destination city only, action "next" with {"destination":"City"}
- dates: collect depart/return in short form like "Mar 24"; one date -> action "update"
- dates: when both dates are filled, stay on dates UI with action "update" and ask user to confirm
- dates: ONLY if user explicitly confirms (search/confirm/continue/next/done/yes/ok), use action "next"
- options/payment: match user text to one option and action "select" with {"index":N}
- confirm: confirm intent -> action "next"; change request -> action "update" or "back"
- done: action "stay"
- If editing from confirmation and current step is dates, once both dates are complete, action "next" should return to confirmation summary (not passengers)

When action is "next", your reply must confirm what was just collected AND ask the question for the upcoming step:
- After destination -> ask for departure and return dates
- After dates -> ask how many passengers
- After passengers -> tell them you're finding flights
- After flight selection -> show summary and ask to confirm

REPLY RULE: Every reply = confirmation of what was just collected + the next question.
Never end a reply without asking something. 1-2 sentences max.
Example: "Got it, flying to LAX! When are you departing and returning?"
Never: "Got it. Flying to Lax."
`.trim();

  const response = await fetch(apiUrl('/api/gemini'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userText,
      systemPrompt,
      maxTokens: 600,
      model: 'gemini-2.5-flash',
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Gemini ${response.status}`);
  }
  const raw = String(payload?.text || '').trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    // graceful fallback: return a safe reply object instead of throwing — keep the UI responsive
    return { reply: raw || 'AI returned an unexpected response', action: 'stay', data: {} };
  }
  return JSON.parse(match[0]);
}

function parseFlightDatesLocally(text) {
  const t = String(text || '').toLowerCase();
  const matches = [...t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/g)];
  const fmt = (m, d) => `${m.slice(0, 1).toUpperCase()}${m.slice(1, 3)} ${d}`;
  const out = {};
  if (matches[0]) out.depart = fmt(matches[0][1], matches[0][2]);
  if (matches[1]) out.return = fmt(matches[1][1], matches[1][2]);
  if (/\breturn|back\b/.test(t) && matches[0] && !out.return) {
    out.return = fmt(matches[0][1], matches[0][2]);
    delete out.depart;
  }
  return out;
}

function inferSingleDateSlot(rawText, dates, currentData) {
  const t = String(rawText || '').toLowerCase();
  const hasDepartKeyword = /\bdepart|departure|leave|outbound\b/.test(t);
  const hasReturnKeyword = /\breturn|back|inbound\b/.test(t);
  const next = { ...(dates || {}) };
  const incomingSingle = next.depart && !next.return;
  if (!incomingSingle) return next;

  const hasExistingDepart = !!String(currentData?.depart || '').trim();
  const hasExistingReturn = !!String(currentData?.return || '').trim();

  if (hasReturnKeyword) {
    next.return = next.depart;
    delete next.depart;
    return next;
  }
  if (hasDepartKeyword) {
    return next;
  }
  if (hasExistingDepart && !hasExistingReturn) {
    next.return = next.depart;
    delete next.depart;
    return next;
  }
  if (!hasExistingDepart && hasExistingReturn) {
    return next;
  }
  return next;
}

function localFlightFallback(userText) {
  const step = flightStep();
  const text = String(userText || '').trim();
  if (!text) return { reply: 'Tell me more.', action: 'stay', data: {} };
  if (step.type === 'destination') {
    const cleaned = normalizeCity(text.replace(/book a flight to|book a flight|fly to|to/ig, ' ').trim());
    return { reply: `Got it. Flying to ${cleaned}. When are you departing and returning?`, action: 'next', data: { destination: cleaned } };
  }
  if (step.type === 'dates') {
    if (isDatesAdvanceIntent(text) && flightUi.data.depart && flightUi.data.return) {
      return { reply: 'Great, dates are set. Moving on.', action: 'next', data: {} };
    }
    const dates = inferSingleDateSlot(text, parseFlightDatesLocally(text), flightUi.data);
    if (dates.depart && dates.return) {
      return { reply: `Perfect, ${dates.depart} to ${dates.return}. Say confirm or press Space to continue.`, action: 'update', data: dates };
    }
    if (dates.depart || dates.return) return { reply: 'Got one date. What is the other date?', action: 'update', data: dates };
    return { reply: 'Please give dates like "Mar 24 to Mar 31".', action: 'stay', data: {} };
  }
  if (step.type === 'options' || step.type === 'payment') {
    const idx = (step.options || []).findIndex((o) => text.toLowerCase().includes(o.name.toLowerCase().split(' ')[0]));
    if (idx >= 0) return { reply: `Selected ${step.options[idx].name}.`, action: 'select', data: { index: idx } };
    return { reply: 'Use arrow keys or type the option.', action: 'stay', data: {} };
  }
  if (step.type === 'confirm') {
    if (/\byes|ok|confirm|book\b/i.test(text)) return { reply: 'Confirmed. How would you like to pay?', action: 'next', data: {} };
    return { reply: 'Tell me what to change.', action: 'stay', data: {} };
  }
  return { reply: 'Done.', action: 'stay', data: {} };
}

async function handleFlightUserInput(userText) {
  if (!flightUi.active) return;
  const step = flightStep();
  const rawText = String(userText || '').trim();
  if (step.type === 'dates' && isDatesAdvanceIntent(rawText) && flightUi.data.depart && flightUi.data.return) {
    addChatBubble('user', userText);
    addChatBubble('ai', 'Great, moving on.');
    if (flightUi.editReturnStepIndex != null) {
      const returnIndex = flightUi.editReturnStepIndex;
      flightUi.editReturnStepIndex = null;
      flightUi.stepIndex = returnIndex;
      flightUi.focused = 0;
      renderFlightStep(true);
    } else {
      flightNextStep(true);
    }
    return;
  }
  addChatBubble('user', userText);
  // Quick local command: if user explicitly asks for 'destination', jump straight to destination step UI
  if (/\bdestination\b/i.test(rawText)) {
    if (jumpToFlightStep({ type: 'destination' })) return;
  }
  showTypingBubble();
  let result;
  try {
    result = await callGeminiFlightAction(userText);
  } catch (err) {
    console.warn('Gemini flight action failed, using local fallback', err);
    result = localFlightFallback(userText);
  } finally {
    hideTypingBubble();
  }

  // If the AI reply contains date text but no structured data, extract dates locally or resolve named events
  try {
    if ((!result?.data || Object.keys(result.data || {}).length === 0) && typeof result?.reply === 'string') {
      const lower = String(result.reply || '').toLowerCase();
      // Named event shortcut (hybrid): check for local events first, otherwise ask AI via /api/gemini
      if (/coachella/.test(lower)) {
        // try local map first (src/events.js)
        let eventDates = null;
        try {
          // dynamic import of the small events map
          const mod = await import('./events.js');
          const ev = (mod.EVENTS || {})['coachella'];
          if (ev && ev.weeks && ev.weeks.week1) {
            eventDates = { depart: ev.weeks.week1.depart, return: ev.weeks.week1.return };
          }
        } catch (e) {
          // ignore import errors
        }
        if (!eventDates) {
          // fallback: query the AI (server normalizes responses)
          try {
            const prompt = `Return JSON object {"depart":"Mon DD","return":"Mon DD"} for "Coachella week 1" in 2026. Provide only the JSON.`;
            const resp = await fetch(apiUrl('/api/gemini'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userText: prompt, systemPrompt: '', maxTokens: 200, model: 'gemini-2.5-flash' }),
            });
            const payload = await resp.json().catch(() => ({}));
            const rawText = String(payload?.text || '').trim();
            const match = rawText.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                const parsed = JSON.parse(match[0]);
                eventDates = { depart: parsed.depart || parsed.start || '', return: parsed.return || parsed.end || '' };
              } catch (e) {/* ignore */}
            }
          } catch (e) {
            console.warn('event lookup failed', e);
          }
        }

        if (eventDates && (eventDates.depart || eventDates.return)) {
          result.data = { ...(result.data || {}), ...eventDates };
        } else {
          const parsedDates = parseFlightDatesLocally(result.reply);
          if (parsedDates.depart || parsedDates.return) {
            result.data = { ...(result.data || {}), ...parsedDates };
          }
        }
      } else {
        const parsedDates = parseFlightDatesLocally(result.reply);
        if (parsedDates.depart || parsedDates.return) {
          result.data = { ...(result.data || {}), ...parsedDates };
        }
      }
    }
  } catch (e) {
    // fall through — do not let date parsing break the flow
    console.warn('date extraction fallback failed', e);
  }

  const action = String(result?.action || 'stay');
  if (step.type === 'confirm') {
    const editTarget = detectFlightEditTarget(rawText);
    if (editTarget) {
      flightUi.editReturnStepIndex = flightStepIndexBy('confirm');
      if (jumpToFlightStep(editTarget)) return;
    }
  }
  if (result?.data && typeof result.data === 'object') {
    const normalizedData = step.type === 'dates'
      ? inferSingleDateSlot(rawText, result.data, flightUi.data)
      : result.data;
    Object.assign(flightUi.data, normalizedData);
  }
  const aiReply = enforceFlightProgressReply(result?.reply, action, step);
  if (aiReply) addChatBubble('ai', aiReply);
  if (action === 'back') {
    flightBackStep();
    return;
  }
  if (action === 'select') {
    const index = Math.max(0, Math.min((flightStep().options || []).length - 1, Number(result?.data?.index) || 0));
    flightUi.focused = index;
    updateFlightOptionHighlight();
    confirmFlightStep();
    return;
  }
  if (action === 'next') {
    if (step.type === 'dates' && !isDatesAdvanceIntent(rawText)) {
      renderFlightStep(true);
      return;
    }
    if (step.type === 'dates' && flightUi.editReturnStepIndex != null && flightUi.data.depart && flightUi.data.return) {
      const returnIndex = flightUi.editReturnStepIndex;
      flightUi.editReturnStepIndex = null;
      flightUi.stepIndex = returnIndex;
      flightUi.focused = 0;
      renderFlightStep(true);
      return;
    }
    flightNextStep(true);
    return;
  }
  if (action === 'update') {
    renderFlightStep(true);
    return;
  }
}

function resetFlightFlowToHome() {
  if (flightThinkingTimer) {
    clearTimeout(flightThinkingTimer);
    flightThinkingTimer = null;
  }
  flightUi.active = false;
  flightUi.stepIndex = 0;
  flightUi.focused = 0;
  flightUi.editReturnStepIndex = null;
  hideTypingBubble();
  hideRich();
  stopSiriOrb();
  morphTo('circle', { icon: '', primary: '', secondary: '', detail: '' });
  document.getElementById('stage').classList.remove('flow-active');
  document.getElementById('stage-wrap')?.classList.remove('flow-active');
}

function cancelFlightFlow() {
  if (!flightUi.active) return;
  flightBackStep();
}

function startFlightFlow(seedText = '') {
  resetFlightData();
  if (seedText) syncFlightDestinationFromText(seedText);
  flightUi.active = true;
  flightUi.stepIndex = 0;
  flightUi.focused = 0;
  document.getElementById('stage').classList.add('flow-active');
  document.getElementById('stage-wrap')?.classList.add('flow-active');
  renderFlightStep(false);
  if (seedText && /\bto\s+[a-zA-Z]/i.test(seedText)) {
    addChatBubble('user', seedText);
    addChatBubble('ai', `Got it. Flying to ${flightUi.data.destination || 'your destination'}.`);
    flightNextStep(true);
  }
}

const FUTURE_ROUTE_ADAPTER = {
  provider: 'gemini',
  get mode() {
    return responseMode;
  },
};

const AI_PROVIDERS = {
  gemini: {
    async resolve({ userText, stageOverride, scenarios, selected }) {
      const text = String(userText || '').trim();
      const fallbackScenario = scenarios.find(item => scenarioMatchesText(item, text)) || selected || scenarios[0] || null;
      const fallbackBase = fallbackScenario ? scenarioToRenderContent(fallbackScenario) : {
        icon: createIcon('emoji', '✨'),
        primary: '',
        secondary: '',
        detail: '',
        image: null,
        typography: defaultTypographyForShape('pill'),
      };
      const fallbackShape = (stageOverride && stageOverride !== AI_STAGE_OVERRIDE.AUTO)
        ? stageOverride
        : (fallbackScenario?.shape || 'pill');

      try {
        const scenarioList = (scenarios || []).map((s) => ({
          id: s.id,
          name: s.name,
          shape: s.shape,
          triggers: s.triggers || [],
        }));
        const systemPrompt = `
Return ONLY JSON:
{"scenarioId":string|null,"shape":"dot|pill|card|card-s|image|idle","content":{"primary":string,"secondary":string,"detail":string}}
Pick the best scenario by name/triggers for the user text. Keep copy concise.
Scenarios: ${JSON.stringify(scenarioList)}
Selected scenario id: ${selected?.id || null}
Stage override: ${stageOverride}
`.trim();
        const response = await fetch(apiUrl('/api/gemini'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userText: text,
            systemPrompt,
            maxTokens: 600,
            model: 'gemini-2.5-flash',
          }),
        });
        if (!response.ok) throw new Error(`Gemini ${response.status}`);
        const payload = await response.json().catch(() => ({}));
        const raw = String(payload?.text || '').trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) {
          return {
            scenarioId: fallbackScenario?.id || null,
            shape: fallbackShape,
            content: {
              ...fallbackBase,
              primary: fallbackBase.primary || (fallbackScenario?.name || 'Generated response'),
              secondary: raw || fallbackBase.secondary || `User: ${text}`,
              detail: fallbackBase.detail || '',
            },
          };
        }
        const parsed = JSON.parse(match[0]);
        const shapeCandidate = String(parsed?.shape || fallbackShape);
        const safeShape = SCENARIO_SHAPES.includes(shapeCandidate) ? shapeCandidate : fallbackShape;
        const safeScenarioId = scenarios.some((s) => s.id === parsed?.scenarioId) ? parsed.scenarioId : (fallbackScenario?.id || null);
        return {
          scenarioId: safeScenarioId,
          shape: safeShape,
          content: {
            ...fallbackBase,
            primary: String(parsed?.content?.primary || fallbackBase.primary || fallbackScenario?.name || 'Generated response'),
            secondary: String(parsed?.content?.secondary || fallbackBase.secondary || `User: ${text}`),
            detail: String(parsed?.content?.detail || fallbackBase.detail || ''),
          },
        };
      } catch (err) {
        console.warn('Gemini resolve fallback');
        return {
          scenarioId: fallbackScenario?.id || null,
          shape: fallbackShape,
          content: {
            ...fallbackBase,
            primary: fallbackBase.primary || (fallbackScenario?.name || 'Generated response'),
            secondary: fallbackBase.secondary || `User: ${text}`,
            detail: fallbackBase.detail || `AI draft generated for "${text}"`,
          },
        };
      }
    },
  },
};

function syncFlightDestinationFromText(userText) {
  const destMatch = String(userText || '').match(/to\s+([a-zA-Z\s]+)/i);
  if (!destMatch) return;
  flightUi.data.destination = normalizeCity(destMatch[1].trim());
}

function isFlightIntent(userText) {
  return /(?:\bflight\b|\bfly\b|book\s+(?:a\s+)?flight|\bticket\b)/i.test(String(userText || ''));
}

function handleManualRequest(userText) {
  if (isFlightIntent(userText)) {
    syncFlightDestinationFromText(userText);
    startFlightFlow(userText);
    return;
  }
  const scenario = resolveScenario(userText);
  if (scenario) {
    selectedScenarioId = scenario.id;
    renderScenarioUi();
    previewScenario(scenario);
    return;
  }
  morphTo('pill', {
    icon: createIcon('emoji', '⚠'),
    primary: 'No Match',
    secondary: 'Create a scenario to preview this',
    detail: '',
  });
}

async function handleAiRequest(userText) {
  const provider = AI_PROVIDERS.gemini;
  try {
    const result = await provider.resolve({
      userText,
      stageOverride: aiStageOverride,
      scenarios: scenarioLibrary,
      selected: selectedScenario(),
    });
    const safeShape = SCENARIO_SHAPES.includes(result?.shape) ? result.shape : 'pill';
    const safeContent = result?.content || {
      icon: createIcon('emoji', '✨'),
      primary: 'Generated response',
      secondary: `User: ${userText}`,
      detail: '',
    };
    if (result?.scenarioId && scenarioLibrary.some(item => item.id === result.scenarioId)) {
      selectedScenarioId = result.scenarioId;
      renderScenarioUi();
    }
    previewScenario(createScenario({
      name: 'AI Preview',
      shape: safeShape,
      content: {
        icon: safeContent.icon,
        primary: safeContent.primary,
        secondary: safeContent.secondary,
        detail: safeContent.detail,
        image: safeContent.image,
        typography: safeContent.typography,
      },
      triggers: [],
    }));
  } catch (err) {
    console.warn('AI mode failed, falling back to manual mode', err);
    addChatBubble('ai', 'AI unavailable. Falling back to manual flow.');
    handleManualRequest(userText);
  }
}

async function processRequest(userText) {
  if (!glassUi.active && isMessageIntent(userText)) {
    startGlassFlow();
    setTimeout(() => {
      input.value = String(userText || '');
      void handleGlassInputSubmit();
    }, 60);
    return;
  }
  if (flightUi.active) {
    await handleFlightUserInput(userText);
    return;
  }
  hideRich();
  stopSiriOrb();
  if (isFlightIntent(userText)) {
    syncFlightDestinationFromText(userText);
    startFlightFlow(userText);
    return;
  }
  if (responseMode === RESPONSE_MODE.AI) {
    await handleAiRequest(userText);
    return;
  }
  handleManualRequest(userText);
}

const DEMO = {
  circle: { icon:createIcon('none', ''), primary:'', secondary:'', detail:'' },
  split:  { icon:createIcon('none', ''), primary:'', secondary:'', detail:'' },
  ai:     { icon:createIcon('none', ''), primary:'', secondary:'', detail:'' },
};

function resetSplitState() {
  clearSplitTimers();
  if (splitBridgeTimer) {
    clearTimeout(splitBridgeTimer);
    splitBridgeTimer = null;
  }
  if (listBridgeTimer) {
    clearTimeout(listBridgeTimer);
    listBridgeTimer = null;
  }
  suppressDeformation = false;
  if (splitAnimStyleBackup !== null) {
    const animStyle = document.getElementById('anim-style');
    if (animStyle) animStyle.textContent = splitAnimStyleBackup;
    splitAnimStyleBackup = null;
  }
  const main = DROPS.main;
  const left = DROPS.left;
  const right = DROPS.right;

  if (main._metaAnim) {
    main._metaAnim.cancel();
    main._metaAnim = null;
  }
  if (main._splitAnim) {
    main._splitAnim.cancel();
    main._splitAnim = null;
  }
  if (mainDeformAnim) {
    mainDeformAnim.cancel();
    mainDeformAnim = null;
  }

  const baseMain = lastMainGeo || SHAPES[currentShape]?.main || SHAPES.circle.main;
  main.classList.remove('metaball-prep');
  main.style.filter = '';
  main.style.scale = '1 1';
  main.style.width = baseMain.w + 'px';
  main.style.height = baseMain.h + 'px';
  main.style.borderRadius = baseMain.br;
  main.style.transform = `translate(${baseMain.tx}px,${baseMain.ty}px)`;
  main.style.opacity = String(baseMain.op);
  main.style.pointerEvents = baseMain.op > 0 ? 'auto' : 'none';

  [left, right].forEach((el) => {
    if (el._splitAnim) {
      el._splitAnim.cancel();
      el._splitAnim = null;
    }
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.borderRadius = '50px';
    el.style.transform = 'translate(-50px,-50px)';
    el.style.scale = '1 1';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });
}

function animateSplitMetaball() {
  stopSiriOrb();
  hideRich();
  hideIntentHeader();
  document.getElementById('drop-main').classList.remove('ai-mode');
  clearListPills();
  resetSplitState();

  const easing = getActiveEasing();
  const normalizeMs = 360;
  const splitMs = 560;
  const overlapMs = 90;
  const splitStartMs = Math.max(40, normalizeMs - overlapMs);
  const sideDelay = 70;

  splitAnimStyleBackup = document.getElementById('anim-style').textContent;
  const originalAnimCSS = splitAnimStyleBackup;
  document.getElementById('anim-style').textContent = `
    :root {
      --spring: ${easing};
      --anim-w:  ${normalizeMs}ms var(--spring);
      --anim-h:  ${normalizeMs}ms var(--spring);
      --anim-br: ${normalizeMs}ms var(--spring);
      --anim-tx: ${normalizeMs}ms var(--spring);
      --anim-t:  ${normalizeMs}ms var(--spring);
    }`;

  suppressDeformation = true;
  morphTo('dot', { icon:'', primary:'', secondary:'', detail:'' });
  C.thumb.style.opacity = '0';
  C.prim.style.opacity = '0';
  C.sec.style.opacity = '0';
  C.det.style.opacity = '0';
  C.div.style.opacity = '0';

  const main = DROPS.main;
  const left = DROPS.left;
  const right = DROPS.right;

  [left, right].forEach((el) => {
    el.style.width = '96px';
    el.style.height = '96px';
    el.style.borderRadius = '48px';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });
  left.style.transform = 'translate(-48px,-48px)';
  right.style.transform = 'translate(-48px,-48px)';

  scheduleSplitTimer(splitStartMs, () => {
    main.classList.add('metaball-prep');
    if (main._metaAnim) main._metaAnim.cancel();
    main._metaAnim = main.animate([
      { transform: 'translate(-50px,-50px) scale(1,1)', borderRadius: '50px', opacity: 1, filter: 'blur(0px)', offset: 0 },
      { transform: 'translate(-50px,-50px) scale(1.08,0.95)', borderRadius: '46px', opacity: 1, filter: 'blur(0px)', offset: 0.18 },
      { transform: 'translate(-50px,-50px) scale(1.16,0.89)', borderRadius: '40px', opacity: 0.94, filter: 'blur(0.4px)', offset: 0.68 },
      { transform: 'translate(-50px,-50px) scale(1.1,0.92)', borderRadius: '42px', opacity: 0, filter: 'blur(0px)', offset: 1 },
    ], { duration: splitMs, easing, fill: 'forwards' });

    [left, right].forEach((el) => {
      if (el._splitAnim) el._splitAnim.cancel();
    });

    left._splitAnim = left.animate([
      { transform: 'translate(-48px,-48px) scale(0.92,1.04)', opacity: 0, offset: 0 },
      { transform: 'translate(-76px,-48px) scale(1.02,0.98)', opacity: 0.72, offset: 0.5 },
      { transform: 'translate(-114px,-48px) scale(1.04,0.96)', opacity: 1, offset: 0.84 },
      { transform: 'translate(-108px,-48px) scale(1,1)', opacity: 1, offset: 1 },
    ], { duration: splitMs - sideDelay, delay: sideDelay, easing, fill: 'forwards' });

    right._splitAnim = right.animate([
      { transform: 'translate(-48px,-48px) scale(0.92,1.04)', opacity: 0, offset: 0 },
      { transform: 'translate(-20px,-48px) scale(1.02,0.98)', opacity: 0.72, offset: 0.5 },
      { transform: 'translate(18px,-48px) scale(1.04,0.96)', opacity: 1, offset: 0.84 },
      { transform: 'translate(12px,-48px) scale(1,1)', opacity: 1, offset: 1 },
    ], { duration: splitMs - sideDelay, delay: sideDelay, easing, fill: 'forwards' });

    scheduleSplitTimer(sideDelay, () => {
      left.style.pointerEvents = 'auto';
      right.style.pointerEvents = 'auto';
    });

    scheduleSplitTimer(splitMs + 12, () => {
      main.style.width = '96px';
      main.style.height = '96px';
      main.style.borderRadius = '48px';
      main.style.transform = 'translate(-48px,-48px)';
      main.style.opacity = '0';
      main.style.pointerEvents = 'none';

      left.style.opacity = '1';
      right.style.opacity = '1';
      left.style.transform = 'translate(-108px,-48px)';
      right.style.transform = 'translate(12px,-48px)';

      currentShape = 'split';
      lastMainGeo = { ...SHAPES.split.main };
      updateActive('split');
      main.classList.remove('metaball-prep');
      main.style.filter = '';
      document.getElementById('anim-style').textContent = originalAnimCSS;
      splitAnimStyleBackup = null;
      suppressDeformation = false;
      clearSplitTimers();
    });
  });
}

function manualShape(shape) {
  if (shape === 'ai') shape = 'magic';
  if (shape !== 'listening') { voiceEngine.stop(); if (glassUi.active) glassReset(); }
  document.getElementById('shape-panel').classList.remove('visible');
  hideRich();
  hideIntentHeader();
  document.getElementById('stage').classList.remove('flow-active');
  document.getElementById('stage-wrap')?.classList.remove('flow-active');
  const leavingSplit = currentShape === 'split' && shape !== 'split';
  const leavingList = currentShape === 'list' && shape !== 'list';
  if (!leavingList) clearListPills();

  if (shape === 'split') {
    morphTo('split', { icon:'', primary:'', secondary:'', detail:'' });
    return;
  }

  if (!leavingSplit && currentShape === 'split') resetSplitState();

  if (shape === 'list') {
    morphToList(DEMO_LIST);
    updateActive('list');
    return;
  }
  if (shape === 'magic') {
    morphTo('magic', { icon:'', primary:'', secondary:'', detail:'' });
    C.thumb.style.opacity = '0';
    updateActive('magic');
    return;
  }
  if (shape === 'listening') {
    glassPreFlowShape = currentShape || 'circle';
    startGlassFlow();
    updateActive('listening');
    return;
  }

  if (shape === 'idle') {
    if (currentShape === 'circle' || currentShape === 'magic') {
      bridgeHomeToThinking('idle');
      return;
    }
    stopSiriOrb();
    enterAiModeVisual(false);
    setAiBridgeWindow(Math.max(780, Math.round(animDur * 1.8)));
    morphTo('ai', { icon:'', primary:'', secondary:'', detail:'' });
    C.thumb.style.opacity = '0';
    showAiIdle();
    updateActive('idle');
    return;
  }

  stopSiriOrb();
  if (SCENARIO_SHAPES.includes(shape)) {
    const scenario = selectedScenario();
    const nextScenario = scenario ? createScenario({
      ...scenario,
      shape,
      content: scenario.content,
      triggers: scenario.triggers,
    }) : createScenario({ shape });
    previewScenario(nextScenario);
    return;
  }
  morphTo(shape, DEMO[shape] || {});
}

function updateActive(shape) {
  document.querySelectorAll('.sb-shape-btn').forEach(b => b.classList.toggle('active', b.dataset.shape === shape));
  const prompt = document.getElementById('home-start-prompt');
  if (!prompt) return;
  if (shape === 'circle' || shape === 'listening') {
    if (homePromptExitTimer) {
      clearTimeout(homePromptExitTimer);
      homePromptExitTimer = null;
    }
    prompt.classList.remove('to-thinking');
    prompt.classList.add('visible');
    return;
  }
  if (shape === 'magic') {
    animateHomePromptToThinking();
    return;
  }
  if (prompt.classList.contains('to-thinking')) return;
  prompt.classList.remove('visible');
}

function openCustom() {
  document.getElementById('shape-panel').classList.toggle('visible');
  updateActive('custom');
}

function applyCustomShape() {
  const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));
  const w = clamp(parseInt(document.getElementById('sp-w').value)||280, 60, 420);
  const h = clamp(parseInt(document.getElementById('sp-h').value)||140, 60, 360);
  const r = clamp(parseInt(document.getElementById('sp-r').value)||0, 0, Math.floor(Math.min(w,h)/2));
  document.getElementById('sp-w').value = w;
  document.getElementById('sp-h').value = h;
  document.getElementById('sp-r').value = r;
  const g = {
    main:  { w, h, br:r+'px', tx:-(w/2), ty:-(h/2), op:1 },
    left:  { w:100, h:100, br:'50px', tx:-(w/2), ty:-50, op:0 },
    right: { w:100, h:100, br:'50px', tx:(w/2)-100, ty:-50, op:0 },
  };
  hideRich();
  morphTo('custom', null, g);
  applyContentPositions('custom', w, h);
}

const input = document.getElementById('sim-input');

function handleSend() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  if (!glassUi.active && /\b(send|message|text|msg)\b/i.test(text)) {
    startGlassFlow();
    setTimeout(() => {
      input.value = text;
      void handleGlassInputSubmit();
    }, 60);
    return;
  }
  void processRequest(text);
}

function handleChipQuickAction(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return false;
  hideRich();
  stopSiriOrb();
  if (/\bbook\b.*\bflight\b|\bflight\b|\bfly\b/.test(t)) {
    if (flightUi.active) resetFlightFlowToHome();
    syncFlightDestinationFromText(text);
    startFlightFlow(text);
    return true;
  }
  if (/\bweather\b|\bforecast\b|\btemperature\b/.test(t)) {
    previewScenario(createScenario({
      name: 'Weather',
      shape: 'card',
      content: {
        icon: createIcon('emoji', '🌤'),
        primary: 'San Francisco',
        secondary: '57°F · Sunny',
        detail: 'H: 61°F  L: 51°F · 0% rain · Wind 8 mph',
      },
      triggers: [],
    }));
    return true;
  }
  if (/\btimer\b/.test(t)) {
    previewScenario(createScenario({
      name: 'Timer',
      shape: 'pill',
      content: {
        icon: createIcon('emoji', '⏱'),
        primary: '10 min timer',
        secondary: 'Ready to start',
        detail: '',
      },
      triggers: [],
    }));
    return true;
  }
  if (/\bcall\b/.test(t)) {
    previewScenario(createScenario({
      name: 'Call',
      shape: 'pill',
      content: {
        icon: createIcon('emoji', '📞'),
        primary: 'Call Mom',
        secondary: 'Ready to dial',
        detail: '',
      },
      triggers: [],
    }));
    return true;
  }
  return false;
}

function fireChip(el) {
  const text = el.textContent.trim();
  if (flightUi.active) resetFlightFlowToHome();
  input.value = text;
  setTimeout(() => {
    if (/^send a message to hiro$/i.test(text)) {
      handleSend();
      return;
    }
    input.value = '';
    if (handleChipQuickAction(text)) return;
    void processRequest(text);
  }, 120);
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (glassUi.active) {
      void handleGlassInputSubmit();
    } else {
      handleSend();
    }
  }
  if (e.key === 'Escape' && glassUi.active) {
    e.preventDefault();
    glassDismiss();
    input.blur();
  }
  e.stopPropagation();
});
input.addEventListener('input', e => {
  if (glassUi.active && glassUi.state === GS.COMPOSE) {
    onTranscriptUpdate(e.target.value);
    return;
  }
  if (glassUi.active || flightUi.active) return;
  const text = String(e.target.value || '');
  const hasText = text.trim().length > 0;
  if (hasText && currentShape === 'circle') {
    morphTo('listening', DEMO.circle || {});
    return;
  }
  if (!hasText && currentShape === 'listening') {
    morphTo('circle', DEMO.circle || {});
  }
});

document.addEventListener('keydown', e => {
  const focusedInTextInput = document.activeElement === input;

  if (glassUi.active) {
    if (e.key === 'Escape') {
      e.preventDefault();
      glassDismiss();
      return;
    }
    if (!focusedInTextInput && e.key === 'ArrowUp') {
      e.preventDefault();
      glassUi.sel = Math.max(0, glassUi.sel - 1);
      if (!updateGlassSelectionUiOnly()) glassRender(false);
      return;
    }
    if (!focusedInTextInput && e.key === 'ArrowDown') {
      e.preventDefault();
      glassUi.sel = Math.min(maxGlassSel(), glassUi.sel + 1);
      if (!updateGlassSelectionUiOnly()) glassRender(false);
      return;
    }
    if (!focusedInTextInput && e.code === 'Space') {
      e.preventDefault();
      glassConfirm();
      return;
    }
  }

  const activeInInput = document.activeElement?.matches?.('input, textarea, select');

  if (flightUi.active) {
    if (e.key === 'Escape') {
      e.preventDefault();
      resetFlightFlowToHome();
      manualShape('circle');
      return;
    }
    if ((e.key === 'x' || e.key === 'X') && !(activeInInput && input.value.trim().length > 0)) {
      e.preventDefault();
      flightBackStep();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFlightHighlight(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFlightHighlight(1);
      return;
    }
    if (e.code === 'Space' && !(activeInInput && input.value.length > 0)) {
      e.preventDefault();
      confirmFlightStep();
      return;
    }
  }

  if (activeInInput) {
    return;
  }

  if (e.key === '1') manualShape('circle');
  if (e.key === '9') manualShape('magic');
  if (e.key === '2') manualShape('dot');
  if (e.key === '3') manualShape('pill');
  if (e.key === '4') manualShape('card');
  if (e.key === '5') manualShape('list');
  if (e.key === '8') manualShape('magic');
  if (e.key === '6') manualShape('split');
  if (e.key === '7') openCustom();
  if (e.key === 'Escape') {
    document.getElementById('stage').classList.remove('flow-active');
    hideRich(); hideIntentHeader();
    if (responseMode === RESPONSE_MODE.AI) {
      manualShape('circle');
    } else {
      previewScenario(selectedScenario());
    }
  }
});

document.querySelectorAll('.bz-inp, .sp-inp, .sb-input, .sb-textarea, .typo-color').forEach(inp => inp.addEventListener('keydown', e => e.stopPropagation()));

function bindTypographyInputs(layer, sizeInput, colorInput) {
  const commitSize = (rawValue) => {
    const parsed = parseInt(String(rawValue || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    commitScenarioChange((scenario) => {
      scenario.content.typographyByShape = normalizeTypographyByShape(
        scenario.content.typographyByShape,
        scenario.shape
      );
      scenario.content.typographyByShape[scenario.shape][layer].size = clamp(
        parsed,
        12,
        96
      );
    });
  };
  sizeInput.addEventListener('change', (e) => commitSize(e.target.value));
  sizeInput.addEventListener('blur', (e) => {
    const value = String(e.target.value || '').trim();
    if (!value) {
      const scenario = selectedScenario();
      if (!scenario) return;
      e.target.value = String(getScenarioTypography(scenario, scenario.shape)[layer].size);
      return;
    }
    commitSize(value);
  });
  colorInput.addEventListener('input', (e) => {
    commitScenarioChange((scenario) => {
      scenario.content.typographyByShape = normalizeTypographyByShape(
        scenario.content.typographyByShape,
        scenario.shape
      );
      scenario.content.typographyByShape[scenario.shape][layer].color = e.target.value;
    });
  });
}

// ── Sidebar tab switching ──
function initSidebarTabs() {
  const tabBar = document.getElementById('sb-tab-bar');
  if (!tabBar) return;
  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.sb-tab');
    if (!tab) return;
    const targetPanel = tab.dataset.tab;
    // Update tab active state
    tabBar.querySelectorAll('.sb-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === targetPanel));
    // Show / hide panels
    document.querySelectorAll('#sidebar .sb-tab-panel[data-panel]').forEach(panel => {
      panel.classList.toggle('sb-tab-panel-hidden', panel.dataset.panel !== targetPanel);
    });
  });
}

// ── Layer row collapsible toggle ──
function initLayerRowToggles() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.addEventListener('click', (e) => {
    const header = e.target.closest('.layer-row-header');
    if (!header) return;
    const row = header.closest('.layer-row');
    if (!row) return;
    row.classList.toggle('expanded');
  });
}

// ── Layer row preview updates ──
function updateLayerPreviews() {
  const scenario = selectedScenario();
  if (!scenario) return;
  const typography = getScenarioTypography(scenario, scenario.shape);
  const stageIcon = stageIconForShape(scenario, scenario.shape);
  const stageText = stageTextForShape(scenario, scenario.shape);

  function setPreview(textId, sizeId, colorId, text, size, color) {
    const textEl = document.getElementById(textId);
    const sizeEl = document.getElementById(sizeId);
    const colorEl = document.getElementById(colorId);
    if (textEl) textEl.textContent = text || '—';
    if (sizeEl) sizeEl.textContent = size ? `${size}px` : '';
    if (colorEl) colorEl.style.background = color || '#fff';
  }

  const iconText = stageIcon.kind === 'emoji' ? stageIcon.value : (stageIcon.kind === 'image' ? 'PNG' : '—');
  setPreview('layer-preview-icon-text', 'layer-preview-icon-size', 'layer-preview-icon-color',
    iconText, typography.icon.size, typography.icon.color);
  setPreview('layer-preview-primary-text', 'layer-preview-primary-size', 'layer-preview-primary-color',
    stageText.primary, typography.primary.size, typography.primary.color);
  setPreview('layer-preview-secondary-text', 'layer-preview-secondary-size', 'layer-preview-secondary-color',
    stageText.secondary, typography.secondary.size, typography.secondary.color);
  setPreview('layer-preview-detail-text', 'layer-preview-detail-size', 'layer-preview-detail-color',
    stageText.detail, typography.detail.size, typography.detail.color);
}

function initSidebarCollapsibleSections() {
  const sidebars = [document.getElementById('left-sidebar'), document.getElementById('sidebar')].filter(Boolean);
  if (!sidebars.length) return;
  sidebars.forEach((sidebar) => {
    sidebar.addEventListener('click', (e) => {
      const toggle = e.target.closest('.sb-section-toggle');
      if (!toggle) return;
      const section = toggle.closest('.sb-section');
      if (!section || section.dataset.collapsible !== '1') return;
      section.classList.toggle('collapsed');
    });
  });
}

function isSupportedAssetFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'image/png' || type === 'image/gif') return true;
  const name = String(file.name || '').toLowerCase();
  return name.endsWith('.png') || name.endsWith('.gif');
}

if (UI.modeToggle && !PAGE_MODE_OVERRIDE) {
  UI.modeToggle.addEventListener('change', () => {
    responseMode = UI.modeToggle.checked ? RESPONSE_MODE.AI : RESPONSE_MODE.MANUAL;
    persistResponseMode();
    applyResponseModeUi();
    if (responseMode === RESPONSE_MODE.AI) {
      hideRich();
      hideIntentHeader();
      document.getElementById('stage').classList.remove('flow-active');
      previewAiStageOverride();
    }
  });
}

UI.aiStageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const stage = button.dataset.aiStage;
    if (!Object.values(AI_STAGE_OVERRIDE).includes(stage)) return;
    aiStageOverride = stage;
    persistAiStageOverride();
    renderAiStageOverrideUi();
    previewAiStageOverride();
  });
});

UI.bgToggle.addEventListener('change', () => {
  canvasSettings.backgroundEnabled = UI.bgToggle.checked;
  persistCanvasSettings();
  applyCanvasSettings();
});

UI.floatToggle.addEventListener('change', () => {
  canvasSettings.floatingEnabled = UI.floatToggle.checked;
  persistCanvasSettings();
  applyCanvasSettings();
});

UI.alignBottomToggle.addEventListener('change', () => {
  canvasSettings.bottomAlign = UI.alignBottomToggle.checked;
  persistCanvasSettings();
  applyCanvasSettings();
  if (responseMode === RESPONSE_MODE.AI) {
    previewAiStageOverride();
  } else {
    previewScenario(selectedScenario());
  }
});

UI.frameGlassesToggle.addEventListener('change', () => {
  const nextMode = UI.frameGlassesToggle.checked ? 'glasses' : 'none';
  if (nextMode === 'glasses' && UI.framePhoneToggle) UI.framePhoneToggle.checked = false;
  const scenario = selectedScenario();
  if (!scenario) return;
  scenario.content.canvas = normalizeScenarioCanvas(
    scenario.content.canvas,
    { frameMode: canvasSettings.frameMode }
  );
  scenario.content.canvas.frameMode = nextMode;
  persistScenarios();
  renderScenarioUi();
  applyCanvasSettings();
  applyStagePhoneBlur(scenario.shape);
});

UI.framePhoneToggle.addEventListener('change', () => {
  const nextMode = UI.framePhoneToggle.checked ? 'phone' : 'none';
  if (nextMode === 'phone' && UI.frameGlassesToggle) UI.frameGlassesToggle.checked = false;
  if (nextMode === 'phone') canvasSettings.floatingEnabled = false;
  persistCanvasSettings();
  const scenario = selectedScenario();
  if (!scenario) return;
  scenario.content.canvas = normalizeScenarioCanvas(
    scenario.content.canvas,
    { frameMode: canvasSettings.frameMode }
  );
  scenario.content.canvas.frameMode = nextMode;
  persistScenarios();
  renderScenarioUi();
  applyCanvasSettings();
  applyStagePhoneBlur(scenario.shape);
});

const commitPhoneFrameSize = (axis, rawValue) => {
  const parsed = parseInt(String(rawValue || '').trim(), 10);
  if (!Number.isFinite(parsed)) return;
  const key = axis === 'w' ? 'phoneFrameWidth' : 'phoneFrameHeight';
  const bounded = axis === 'w' ? clamp(parsed, 240, 600) : clamp(parsed, 420, 1200);
  canvasSettings[key] = bounded;
  persistCanvasSettings();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
};

UI.phoneFrameWidth.addEventListener('change', (e) => commitPhoneFrameSize('w', e.target.value));
UI.phoneFrameHeight.addEventListener('change', (e) => commitPhoneFrameSize('h', e.target.value));
UI.frameCornerRadius.addEventListener('change', (e) => {
  const parsed = parseInt(String(e.target.value || '').trim(), 10);
  if (!Number.isFinite(parsed)) return;
  canvasSettings.frameCornerRadius = clamp(parsed, 0, 120);
  persistCanvasSettings();
  applyCanvasSettings();
});

UI.phoneBgUpload.addEventListener('click', (e) => {
  e.target.value = '';
});
UI.phoneBgUpload.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!String(file.type || '').startsWith('image/')) {
    e.target.value = '';
    return;
  }
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
  canvasSettings.phoneFrameBackground = {
    src: dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
  persistCanvasSettings();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
  e.target.value = '';
});
UI.phoneBgReset.addEventListener('click', () => {
  canvasSettings.phoneFrameBackground = null;
  persistCanvasSettings();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
  UI.phoneBgUpload.value = '';
});

UI.phoneBgVisibleToggle.addEventListener('change', () => {
  canvasSettings.phoneBgEnabled = UI.phoneBgVisibleToggle.checked;
  persistCanvasSettings();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
});

UI.scenarioAdd.addEventListener('click', () => addScenario('pill'));
UI.scenarioDuplicate.addEventListener('click', duplicateScenario);
UI.scenarioDelete.addEventListener('click', deleteScenario);

UI.scenarioName.addEventListener('input', (e) => {
  commitScenarioChange((scenario) => {
    scenario.name = e.target.value.trim() || 'Untitled Scenario';
  });
});

UI.scenarioTriggers.addEventListener('input', (e) => {
  commitScenarioChange((scenario) => {
    scenario.triggers = normalizeTriggers(e.target.value);
  });
});

UI.scenarioIconInput.addEventListener('input', (e) => {
  commitScenarioChange((scenario) => {
    const value = String(e.target.value || '').trim();
    scenario.content.iconByShape = normalizeIconByShape(
      scenario.content.iconByShape,
      scenario.shape,
      scenario.content.icon
    );
    scenario.content.iconByShape[scenario.shape] = value ? createIcon('emoji', value) : createIcon('none', '');
  });
});

UI.scenarioPrimary.addEventListener('input', (e) => {
  commitScenarioChange((scenario) => {
    scenario.content.textByShape = normalizeStageTextByShape(
      scenario.content.textByShape,
      scenario.shape,
      scenario.content
    );
    scenario.content.textByShape[scenario.shape].primary = e.target.value;
  });
});

UI.scenarioSecondary.addEventListener('input', (e) => {
  commitScenarioChange((scenario) => {
    scenario.content.textByShape = normalizeStageTextByShape(
      scenario.content.textByShape,
      scenario.shape,
      scenario.content
    );
    scenario.content.textByShape[scenario.shape].secondary = e.target.value;
  });
});

UI.scenarioDetail.addEventListener('input', (e) => {
  commitScenarioChange((scenario) => {
    scenario.content.textByShape = normalizeStageTextByShape(
      scenario.content.textByShape,
      scenario.shape,
      scenario.content
    );
    scenario.content.textByShape[scenario.shape].detail = e.target.value;
  });
});

UI.scenarioShapeRow.addEventListener('click', (e) => {
  const button = e.target.closest('[data-scenario-shape]');
  if (!button) return;
  const shape = String(button.dataset.scenarioShape || '');
  if (!availableScenarioShapes().includes(shape)) return;
  commitScenarioChange((scenario) => {
    scenario.shape = shape;
    scenario.content.textByShape = normalizeStageTextByShape(
      scenario.content.textByShape,
      shape,
      scenario.content
    );
    scenario.content.typographyByShape = normalizeTypographyByShape(
      scenario.content.typographyByShape,
      shape
    );
    scenario.content.sizeByShape = normalizeStageSizeByShape(
      scenario.content.sizeByShape,
      shape,
      scenario.content
    );
  });
});

UI.stageAdd.addEventListener('click', () => {
  addStage();
});
UI.stageDelete.addEventListener('click', () => {
  deleteCurrentStage();
});
UI.stageReset.addEventListener('click', () => {
  resetCurrentStageToDefault();
});

UI.stageNameInput.addEventListener('input', (e) => {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  const nextName = String(e.target.value || '').trim();
  commitStageChange(stage.id, (draft) => {
    draft.name = nextName || 'Untitled Stage';
  });
});

const commitStageRadius = (rawValue) => {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  const parsed = parseInt(String(rawValue || '').trim(), 10);
  if (!Number.isFinite(parsed)) return;
  const nextRadius = clamp(parsed, 0, 120);
  commitStageChange(stage.id, (draft) => {
    draft.cornerRadius = nextRadius;
  });
};
UI.stageRadiusInput.addEventListener('change', (e) => commitStageRadius(e.target.value));
UI.stageRadiusInput.addEventListener('blur', (e) => {
  const value = String(e.target.value || '').trim();
  if (!value) {
    const scenario = selectedScenario();
    const stage = stageById(scenario?.shape);
    e.target.value = stage ? String(stage.cornerRadius) : '';
    return;
  }
  commitStageRadius(value);
});

const commitStageSizeOverride = (axis, rawValue) => {
  const scenario = selectedScenario();
  if (!scenario) return;
  const value = String(rawValue || '').trim();
  const key = axis === 'width' ? 'widthOverride' : 'heightOverride';
  if (!value) {
    commitScenarioChange((draftScenario) => {
      draftScenario.content.sizeByShape = normalizeStageSizeByShape(
        draftScenario.content.sizeByShape,
        draftScenario.shape,
        draftScenario.content
      );
      draftScenario.content.sizeByShape[draftScenario.shape][key] = null;
    });
    return;
  }
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return;
  const bounded = clamp(parsed, 40, 1400);
  commitScenarioChange((draftScenario) => {
    draftScenario.content.sizeByShape = normalizeStageSizeByShape(
      draftScenario.content.sizeByShape,
      draftScenario.shape,
      draftScenario.content
    );
    draftScenario.content.sizeByShape[draftScenario.shape][key] = bounded;
  });
};

UI.stageWidthInput.addEventListener('change', (e) => commitStageSizeOverride('width', e.target.value));
UI.stageWidthInput.addEventListener('blur', (e) => {
  const scenario = selectedScenario();
  const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
  const value = String(e.target.value || '').trim();
  if (!value) {
    e.target.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '';
    return;
  }
  commitStageSizeOverride('width', value);
});

UI.stageHeightInput.addEventListener('change', (e) => commitStageSizeOverride('height', e.target.value));
UI.stageHeightInput.addEventListener('blur', (e) => {
  const scenario = selectedScenario();
  const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
  const value = String(e.target.value || '').trim();
  if (!value) {
    e.target.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '';
    return;
  }
  commitStageSizeOverride('height', value);
});

const commitStageGapOverride = (rawValue) => {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  const value = String(rawValue || '').trim();
  if (!value) {
    commitStageChange(stage.id, (draft) => {
      draft.iconTextGap = null;
    });
    return;
  }
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return;
  const bounded = clamp(parsed, 0, 80);
  commitStageChange(stage.id, (draft) => {
    draft.iconTextGap = bounded;
  });
};
UI.stageGapInput.addEventListener('change', (e) => commitStageGapOverride(e.target.value));
UI.stageGapInput.addEventListener('blur', (e) => {
  const stage = stageById(selectedScenario()?.shape);
  const value = String(e.target.value || '').trim();
  if (!value) {
    e.target.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '';
    return;
  }
  commitStageGapOverride(value);
});

const commitStageIconPadOverride = (rawValue) => {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  const value = String(rawValue || '').trim();
  if (!value) {
    commitStageChange(stage.id, (draft) => {
      draft.iconLeftPadding = null;
    });
    return;
  }
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return;
  const bounded = clamp(parsed, 0, 120);
  commitStageChange(stage.id, (draft) => {
    draft.iconLeftPadding = bounded;
  });
};
UI.stageIconPadInput.addEventListener('change', (e) => commitStageIconPadOverride(e.target.value));
UI.stageIconPadInput.addEventListener('blur', (e) => {
  const stage = stageById(selectedScenario()?.shape);
  const value = String(e.target.value || '').trim();
  if (!value) {
    e.target.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '';
    return;
  }
  commitStageIconPadOverride(value);
});

UI.stagePhoneBlurToggle.addEventListener('change', (e) => {
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  commitStageChange(stage.id, (draft) => {
    draft.phoneBgBlur = e.target.checked;
  });
});

UI.stageComponentControls.addEventListener('click', (e) => {
  const button = e.target.closest('[data-stage-comp-action][data-stage-comp-type]');
  if (!button) return;
  const action = String(button.dataset.stageCompAction || '');
  const type = String(button.dataset.stageCompType || '');
  if (!STAGE_COMPONENT_TYPES.includes(type)) return;
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  commitStageChange(stage.id, (draft) => {
    const next = [...(draft.components || [])];
    if (action === 'add') {
      next.push(type);
    } else if (action === 'remove') {
      const removeIndex = next.lastIndexOf(type);
      if (removeIndex >= 0) next.splice(removeIndex, 1);
    }
    draft.components = next;
  });
});

UI.stageComponentControls.addEventListener('change', (e) => {
  const checkbox = e.target.closest('[data-stage-comp-toggle]');
  if (!checkbox) return;
  const type = String(checkbox.dataset.stageCompToggle || '');
  if (!['icon', 'primary', 'secondary', 'detail'].includes(type)) return;
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  commitStageChange(stage.id, (draft) => {
    const next = [...(draft.components || [])].filter((item) => item !== type);
    if (checkbox.checked) next.push(type);
    draft.components = next;
  });
});

UI.scenarioIconReset.addEventListener('click', () => {
  commitScenarioChange((scenario) => {
    scenario.content.iconByShape = normalizeIconByShape(
      scenario.content.iconByShape,
      scenario.shape,
      scenario.content.icon
    );
    scenario.content.iconByShape[scenario.shape] = createIcon('none', '');
  });
  UI.scenarioIconUpload.value = '';
});

UI.scenarioIconUpload.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!isSupportedAssetFile(file)) {
    e.target.value = '';
    return;
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  }).catch(() => '');
  if (!dataUrl) return;
  commitScenarioChange((scenario) => {
    scenario.content.iconByShape = normalizeIconByShape(
      scenario.content.iconByShape,
      scenario.shape,
      scenario.content.icon
    );
    scenario.content.iconByShape[scenario.shape] = createIcon('image', dataUrl);
  });
  e.target.value = '';
});
UI.scenarioIconUpload.addEventListener('click', (e) => {
  e.target.value = '';
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
    scenario.content.imagesByShape = normalizeImagesByShape(
      scenario.content.imagesByShape,
      scenario.shape,
      scenario.content.images
    );
    scenario.content.imagesByShape[scenario.shape] = images.filter(Boolean);
  });
});

UI.editorMedia.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-media-upload-index]');
  if (!input) return;
  const index = parseInt(input.dataset.mediaUploadIndex, 10);
  if (!Number.isFinite(index) || index < 0) return;
  const file = input.files?.[0];
  if (!file) return;
  if (!isSupportedAssetFile(file)) {
    input.value = '';
    return;
  }
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
    images[index] = {
      src: dataUrl,
      width: dimensions.width,
      height: dimensions.height,
    };
    scenario.content.imagesByShape = normalizeImagesByShape(
      scenario.content.imagesByShape,
      scenario.shape,
      scenario.content.images
    );
    scenario.content.imagesByShape[scenario.shape] = images.filter(Boolean);
  });
  input.value = '';
});
UI.editorMedia.addEventListener('click', (e) => {
  const input = e.target.closest('[data-media-upload-index]');
  if (!input) return;
  input.value = '';
});

bindTypographyInputs('icon', UI.scenarioIconSize, UI.scenarioIconColor);
bindTypographyInputs('primary', UI.scenarioPrimarySize, UI.scenarioPrimaryColor);
bindTypographyInputs('secondary', UI.scenarioSecondarySize, UI.scenarioSecondaryColor);
bindTypographyInputs('detail', UI.scenarioDetailSize, UI.scenarioDetailColor);

// Keep layer row previews in sync with live input
[UI.scenarioIconInput, UI.scenarioPrimary, UI.scenarioSecondary, UI.scenarioDetail,
 UI.scenarioIconSize, UI.scenarioIconColor, UI.scenarioPrimarySize, UI.scenarioPrimaryColor,
 UI.scenarioSecondarySize, UI.scenarioSecondaryColor, UI.scenarioDetailSize, UI.scenarioDetailColor,
].forEach(el => { if (el) el.addEventListener('input', updateLayerPreviews); });

let animDur = 600;
const SPRING_WITH_ANTICIPATION = `linear(
  0, -0.002 5%, -0.008 10%, -0.016 16%, -0.016 20%, -0.01 24%,
  0.16 30%, 0.64 38%, 0.9 46%, 1.0 54%,
  1.008 62%, 1.01 70%, 1.008 78%, 1.004 85%,
  1.004 92%, 1.001 97%, 1
)`;
const DEFAULT_CUSTOM_BEZIER = [0.35, 0.23, 0.13, 0.98];

function parseBezierInput(rawValue) {
  const parts = String(rawValue || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  if (parts.length !== 4) return null;
  const values = parts.map(v => Number(v));
  if (values.some(v => !Number.isFinite(v))) return null;
  return values;
}

function getCustomBezierValues() {
  const input = document.getElementById('bz-input-left') || document.getElementById('bz-input');
  const parsed = parseBezierInput(input?.value);
  return parsed || DEFAULT_CUSTOM_BEZIER;
}

function formatBezierValues(values) {
  return values.map(v => {
    const rounded = Math.round(v * 1000) / 1000;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }).join(', ');
}

const EASING_FN = {
  custom:  () => { const v = getCustomBezierValues(); return `cubic-bezier(${v.join(',')})`; },
  spring:  () => SPRING_WITH_ANTICIPATION,
  ease:    () => 'cubic-bezier(0.25,0.1,0.25,1)',
  linear:  () => 'linear',
};

function setAnimDuration(nextDuration) {
  animDur = nextDuration;
  const sliders = [
    document.getElementById('dur-sl-left'),
    document.getElementById('dur-sl'),
  ].filter(Boolean);
  const value = clamp(parseInt(nextDuration, 10) || animDur, 100, 1400);
  sliders.forEach((slider) => { slider.value = String(value); });
  const durVals = [
    document.getElementById('dur-val-left'),
    document.getElementById('dur-val'),
  ].filter(Boolean);
  durVals.forEach((el) => { el.textContent = value + 'ms'; });
  animDur = value;
  rebuildAnim();
}

function applyEasingPresetDefaults(preset) {
  if (preset === 'custom') {
    setAnimDuration(450);
    return;
  }
  if (preset === 'spring') {
    setAnimDuration(900);
  }
}

function rebuildAnim() {
  const curveEl = document.getElementById('ease-select-left') || document.getElementById('ease-select');
  const curve  = curveEl ? curveEl.value : 'custom';
  const easing = EASING_FN[curve]();
  const wDur   = animDur;
  const hDur   = animDur;
  const brDur  = animDur;
  const txDur  = animDur;
  document.getElementById('anim-style').textContent = `
    :root {
      --spring: ${easing};
      --anim-w:  ${wDur}ms var(--spring);
      --anim-h:  ${hDur}ms var(--spring);
      --anim-br: ${brDur}ms var(--spring);
      --anim-tx: ${txDur}ms var(--spring);
      --anim-t:  ${txDur}ms var(--spring);
    }`;
}
const animSliders = [
  document.getElementById('dur-sl-left'),
  document.getElementById('dur-sl'),
].filter(Boolean);
const animEasingSelects = [
  document.getElementById('ease-select-left'),
  document.getElementById('ease-select'),
].filter(Boolean);
const animBezierInputs = [
  document.getElementById('bz-input-left'),
  document.getElementById('bz-input'),
].filter(Boolean);
const animBezierGroups = [
  document.getElementById('bz-group-left'),
  document.getElementById('bz-group'),
].filter(Boolean);
const animBezierRows = [
  document.getElementById('bz-row-left'),
  document.getElementById('bz-row'),
].filter(Boolean);

function syncAnimationEasingUi(selectedValue) {
  animEasingSelects.forEach((sel) => { sel.value = selectedValue; });
  const showBz = selectedValue === 'custom';
  animBezierGroups.forEach((group) => { group.style.opacity = showBz ? '1' : '0.3'; });
  animBezierRows.forEach((row) => { row.classList.toggle('hidden', !showBz); });
}

animSliders.forEach((slider) => {
  slider.addEventListener('input', function() {
    setAnimDuration(parseInt(this.value, 10));
  });
});
animEasingSelects.forEach((select) => {
  select.addEventListener('change', function() {
    syncAnimationEasingUi(this.value);
    applyEasingPresetDefaults(this.value);
    if (this.value !== 'custom' && this.value !== 'spring') rebuildAnim();
  });
});
animBezierInputs.forEach((inp) => inp.addEventListener('input', rebuildAnim));
animBezierInputs.forEach((inp) => inp.addEventListener('blur', function() {
  const parsed = parseBezierInput(this.value);
  const normalized = formatBezierValues(parsed || DEFAULT_CUSTOM_BEZIER);
  animBezierInputs.forEach((other) => { other.value = normalized; });
}));
{
  const defaultCurve = (document.getElementById('ease-select-left') || document.getElementById('ease-select'))?.value || 'custom';
  syncAnimationEasingUi(defaultCurve);
  const normalizedBezier = formatBezierValues(getCustomBezierValues());
  animBezierInputs.forEach((inp) => { inp.value = normalizedBezier; });
  setAnimDuration(animDur);
}

initSidebarTabs();
initLayerRowToggles();
initSidebarCollapsibleSections();
applyCanvasSettings();
applyResponseModeUi();
renderScenarioUi();
if (responseMode === RESPONSE_MODE.AI) {
  manualShape('circle');
} else {
  previewScenarioInstant(selectedScenario());
}
rebuildAnim();

[[8,12,.04,3.8,0],[18,76,.03,5.1,.8],[28,34,.05,4.2,.3],[38,88,.04,6.0,1.1],
 [48,22,.05,3.5,.5],[58,65,.03,4.8,.9],[68,42,.04,5.5,.2],[78,10,.04,4.0,.7],
 [88,55,.05,3.2,1.3],[12,48,.03,5.8,.4],[22,90,.04,4.5,1.0],[32,18,.04,3.9,.6],
 [42,72,.05,5.2,.1],[52,38,.03,4.1,.8],[62,82,.04,3.7,1.2],[72,28,.05,5.6,.3],
 [82,60,.04,4.3,.9],[92,14,.05,3.4,.5],[5,55,.03,5.0,1.1],[15,25,.04,4.7,.2],
 [25,70,.04,3.6,.7],[35,5,.05,5.3,1.4],[45,85,.03,4.0,.6],[55,45,.04,3.8,1.0],
 [65,15,.04,5.1,.3],[75,75,.05,4.4,.8],[85,35,.03,3.5,1.3],[95,50,.04,4.9,.4]
].forEach(([l,t,op,dur,delay]) => {
  const s = document.createElement('div'); s.className = 'star';
  const big = Math.round(l+t) % 9 === 0;
  s.style.cssText = `left:${l}%;top:${t}%;width:${big?2:1}px;height:${big?2:1}px;background:rgba(255,255,255,1);--op:${op};--sd:${dur}s;--sdl:${delay}s;`;
  document.body.appendChild(s);
});

const LIST_PILL_W = 420;
const LIST_PILL_H = 120;
const LIST_GAP    = 12;
const LIST_STEP   = LIST_PILL_H + LIST_GAP;
const LIST_TOP_Y  = -60;
const LIST_OFF    = 140;
const DEMO_LIST = [
  { icon:'🌤', primary:'21°  Sunny', secondary:'San Francisco' },
  { icon:'✉', primary:'New Message', secondary:'Alice · Want to meet?' },
  { icon:'⏱', primary:'Timer', secondary:'10 minutes remaining' },
];

function clearListPills() {
  const wrap = document.getElementById('list-pills');
  wrap.innerHTML = '';
  wrap.style.pointerEvents = 'none';
  wrap.style.opacity = '';
  wrap.style.transition = '';
  wrap.dataset.collapsing = '';
}

function collapseListStack(ms = 220) {
  const wrap = document.getElementById('list-pills');
  if (!wrap) return;
  if (!wrap.children.length) {
    clearListPills();
    return;
  }
  if (wrap.dataset.collapsing === '1') return;
  wrap.dataset.collapsing = '1';
  wrap.style.pointerEvents = 'none';
  wrap.style.transition = `opacity ${ms}ms ease`;
  wrap.style.opacity = '0';
  setTimeout(() => {
    clearListPills();
  }, ms + 30);
}

function buildListPill(item, idx, items) {
  const el = document.createElement('div');
  el.className = 'list-pill';
  el.style.zIndex = String(Math.max(1, items.length - idx));
  el.innerHTML = `
    <div class="list-pill-thumb">${item.icon || '◉'}</div>
    <div class="list-pill-text">
      <div class="list-pill-primary">${item.primary || ''}</div>
      <div class="list-pill-secondary">${item.secondary || ''}</div>
    </div>`;
  el.addEventListener('click', () => selectListItem(el, idx, items));
  return el;
}

function morphToList(items) {
  stopSiriOrb();
  hideRich();
  document.getElementById('drop-main').classList.remove('ai-mode');
  setIntentHeader('Demo', 'List');

  if (currentShape === 'split') {
    morphTo('dot', { icon:'', primary:'', secondary:'', detail:'' });
    if (listBridgeTimer) clearTimeout(listBridgeTimer);
    listBridgeTimer = setTimeout(() => {
      listBridgeTimer = null;
      morphToList(items);
    }, splitBridgeMs() + 28);
    return;
  }

  const phaseOneMs = 600;
  const phaseTwoMs = 500;
  const overlapMs = 220;
  const phaseTwoStart = phaseOneMs - overlapMs;
  const easing = EASING_FN[document.getElementById('ease-select').value]();

  const originalAnimCSS = document.getElementById('anim-style').textContent;
  document.getElementById('anim-style').textContent = `
    :root {
      --spring: ${easing};
      --anim-w:  ${phaseOneMs}ms var(--spring);
      --anim-h:  ${phaseOneMs}ms var(--spring);
      --anim-br: ${phaseOneMs}ms var(--spring);
      --anim-tx: ${phaseOneMs}ms var(--spring);
      --anim-t:  ${phaseTwoMs}ms var(--spring);
    }`;

  morphTo('pill', {
    icon: items[0]?.icon || '◉',
    primary: items[0]?.primary || '',
    secondary: items[0]?.secondary || '',
    detail: ''
  });

  const stackHeight = items.length * LIST_PILL_H + (items.length - 1) * LIST_GAP;
  const stackTop = -stackHeight / 2;
  const firstPillY = stackTop;
  const incomingPillY = firstPillY + 20;

  const stage = document.getElementById('stage');
  if (stage) stage.style.height = stackHeight + 'px';

  const wrap = document.getElementById('list-pills');
  clearListPills();
  wrap.style.opacity = '1';
  wrap.style.transition = 'none';
  wrap.style.pointerEvents = 'none';

  const dm = DROPS.main;
  dm.style.transform = `translate(-210px, ${firstPillY}px)`;
  currentShape = 'list';
  lastMainGeo = { ...SHAPES.pill.main, ty: firstPillY };

  setTimeout(() => {
    items.slice(1).forEach((item, i) => {
      const idx = i + 1;
      const pill = buildListPill(item, idx, items);
      const finalY = stackTop + idx * LIST_STEP;
      pill.style.transition = `transform ${phaseTwoMs}ms ${easing}, opacity ${Math.max(220, phaseTwoMs - 80)}ms ${easing}`;
      pill.style.transform = `translateY(${incomingPillY}px)`;
      pill.style.opacity = '0.01';
      wrap.appendChild(pill);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pill.style.transform = `translateY(${finalY}px)`;
          pill.style.opacity = '1';
        });
      });
    });

    wrap.style.pointerEvents = 'auto';
    setTimeout(() => {
      document.getElementById('anim-style').textContent = originalAnimCSS;
    }, phaseTwoMs + overlapMs + 40);
  }, phaseTwoStart);
}

function selectListItem(el, idx, items) {
  document.querySelectorAll('.list-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

initVoiceEngine();

Object.assign(window, {
  applyCustomShape,
  fireChip,
  handleSend,
  manualShape,
  openCustom,
});
