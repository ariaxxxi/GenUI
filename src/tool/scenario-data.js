import {
  STORAGE_KEYS,
  readStoredJson,
} from '../app-state.js';
import {
  SHAPES,
  configureShapeHelpers,
  defaultTypographyForShape,
  normalizeTypographyByShape,
  normalizeStage,
  normalizeStageImage,
  normalizeStageImages,
  normalizeIcon,
  normalizeIconByShape,
  normalizeImagesByShape,
  createIcon,
  availableScenarioShapes as shapeAvailableScenarioShapes,
  renderShapeForStageId as shapeRenderShapeForStageId,
  TYPOGRAPHY_LAYERS,
} from '../shapes.js';

const DEFAULT_SCENARIO_SHAPES = ['idle', 'dot', 'pill', 'card', 'card-s', 'image'];
const STAGE_COMPONENT_TYPES = ['icon', 'primary', 'secondary', 'detail', 'image'];

const BUILTIN_STAGE_DEFS = Object.freeze([
  { id: 'idle', name: 'Idle', preset: true, renderShape: 'idle', cornerRadius: 0, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: [] },
  { id: 'dot', name: 'Dot', preset: true, renderShape: 'dot', cornerRadius: 50, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: ['icon'] },
  { id: 'pill', name: 'Pill', preset: true, renderShape: 'pill', cornerRadius: 60, widthOverride: null, heightOverride: null, iconTextGap: 8, iconLeftPadding: 16, phoneBgBlur: false, components: ['icon', 'primary', 'secondary'] },
  { id: 'card', name: 'Card', preset: true, renderShape: 'card', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: ['icon', 'primary', 'secondary', 'detail', 'image'] },
  { id: 'card-s', name: 'Card-S', preset: true, renderShape: 'card-s', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: 8, iconLeftPadding: 16, phoneBgBlur: false, components: ['icon', 'primary', 'secondary', 'detail', 'image'] },
  { id: 'image', name: 'Image', preset: true, renderShape: 'image', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, components: ['image'] },
]);

export function initScenarioData({ getStageLibrary, getCanvasSettings, clampFn }) {
  const clamp = typeof clampFn === 'function' ? clampFn : ((v, lo, hi) => Math.max(lo, Math.min(hi, v)));

  function stageLibrary() {
    const value = typeof getStageLibrary === 'function' ? getStageLibrary() : [];
    return Array.isArray(value) ? value : [];
  }

  function canvasSettings() {
    return typeof getCanvasSettings === 'function' ? getCanvasSettings() : {};
  }

  function stageId() {
    return 'stage-' + Math.random().toString(36).slice(2, 10);
  }

  function scenarioId() {
    return 'scenario-' + Math.random().toString(36).slice(2, 10);
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
    const normalized = stored.map((item) => normalizeStage(item, byId.get(item?.id))).filter(Boolean);
    const ids = new Set(normalized.map((stage) => stage.id));
    BUILTIN_STAGE_DEFS.forEach((builtin) => {
      if (!ids.has(builtin.id)) normalized.unshift(normalizeStage(builtin, builtin));
    });
    return normalized;
  }

  function stageById(id) {
    const stages = stageLibrary();
    return stages.find((stage) => stage.id === id) || stages.find((stage) => stage.id === 'pill') || stages[0] || null;
  }

  function builtinStageById(id) {
    return BUILTIN_STAGE_DEFS.find((stage) => stage.id === id) || null;
  }

  function renderShapeForStageId(id) {
    const stage = stageById(id);
    return stage?.renderShape || 'pill';
  }

  function availableScenarioShapes() {
    return stageLibrary().map((stage) => stage.id);
  }

  configureShapeHelpers({
    clampFn: clamp,
    getAvailableScenarioShapes: availableScenarioShapes,
    renderShapeForStageId,
    scenarioShapes: DEFAULT_SCENARIO_SHAPES,
    stageComponentTypes: STAGE_COMPONENT_TYPES,
  });

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
      return { primary: 'Primary text', secondary: 'Secondary text', detail: '' };
    }
    if (renderShape === 'card' || renderShape === 'card-s') {
      return { primary: 'Primary text', secondary: 'Secondary text', detail: 'Detail text example' };
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
      ...DEFAULT_SCENARIO_SHAPES,
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
      ...DEFAULT_SCENARIO_SHAPES,
      ...availableScenarioShapes(),
      ...Object.keys(value || {}),
      fallbackShape,
    ].filter(Boolean)));
    const output = {};
    stageIds.forEach((shape) => {
      output[shape] = normalizeStageSizeEntry(value?.[shape], shape === fallbackShape ? legacy : {});
    });
    return output;
  }

  function scenarioStageSizeOverride(scenario, shape) {
    return normalizeStageSizeEntry(scenario?.content?.sizeByShape?.[shape]);
  }

  function stageDefaultMainSize(stageIdValue) {
    const renderShape = renderShapeForStageId(stageIdValue);
    const base = SHAPES[renderShape] || SHAPES.pill;
    const width = Number(base?.main?.w);
    const height = Number(base?.main?.h);
    return {
      width: Number.isFinite(width) ? width : 420,
      height: Number.isFinite(height) ? height : 120,
    };
  }

  function stageMainSize(stage, scenario = null) {
    const defaults = stageDefaultMainSize(stage?.id);
    const sizeOverride = scenarioStageSizeOverride(scenario, stage?.id);
    const renderShape = stage?.renderShape || renderShapeForStageId(stage?.id);
    const frameMode = normalizeScenarioCanvas(
      scenario?.content?.canvas,
      { frameMode: canvasSettings()?.frameMode || 'none' }
    ).frameMode;
    const phoneDefaultWidth = clamp((Number(canvasSettings()?.phoneFrameWidth) || 390) - 20, 40, 1400);
    const usePhoneDefaultWidth = frameMode === 'phone' && ['pill', 'card', 'card-s', 'image'].includes(renderShape);
    const defaultWidth = usePhoneDefaultWidth ? phoneDefaultWidth : defaults.width;
    return {
      width: Number.isFinite(sizeOverride.widthOverride) ? sizeOverride.widthOverride : defaultWidth,
      height: Number.isFinite(sizeOverride.heightOverride) ? sizeOverride.heightOverride : defaults.height,
    };
  }

  function stageIconTextGap(stageIdValue, renderShape) {
    if (renderShape !== 'pill' && renderShape !== 'card-s') return 8;
    const stage = stageIdValue ? stageById(stageIdValue) : null;
    const value = Number(stage?.iconTextGap);
    return Number.isFinite(value) ? clamp(Math.round(value), 0, 80) : 8;
  }

  function stageIconLeftPadding(stageIdValue, renderShape) {
    if (renderShape !== 'pill' && renderShape !== 'card-s') return renderShape === 'pill' ? 16 : 24;
    const stage = stageIdValue ? stageById(stageIdValue) : null;
    const value = Number(stage?.iconLeftPadding);
    const fallback = (renderShape === 'pill' || renderShape === 'card-s') ? 16 : 24;
    return Number.isFinite(value) ? clamp(Math.round(value), 0, 120) : fallback;
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

  function normalizeTriggers(value) {
    if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
    return String(value || '')
      .split(/[\n,]/)
      .map(v => v.trim())
      .filter(Boolean);
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
            card: { primary: '21° Sunny', secondary: 'San Francisco', detail: 'H:24°  L:16° · Humidity 68%' },
            'card-s': { primary: '21° Sunny', secondary: 'San Francisco', detail: 'H:24°  L:16° · Humidity 68%' },
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

  return {
    BUILTIN_STAGE_DEFS,
    SCENARIO_SHAPES: DEFAULT_SCENARIO_SHAPES,
    STAGE_COMPONENT_TYPES,
    TYPOGRAPHY_LAYERS,
    SHAPES,
    defaultTypographyForShape,
    normalizeTypographyByShape,
    normalizeStage,
    normalizeStageImage,
    normalizeStageImages,
    normalizeIcon,
    normalizeIconByShape,
    normalizeImagesByShape,
    stageId,
    defaultStageLibrary,
    loadStageLibrary,
    stageById,
    builtinStageById,
    renderShapeForStageId,
    availableScenarioShapes,
    stageComponentCounts,
    stageHasComponent,
    stageVisibleEditorFields,
    scenarioId,
    createIcon,
    normalizeStageTextEntry,
    hasMeaningfulStageText,
    defaultStageTextFallback,
    isPlaceholderStageText,
    normalizeStageTextByShape,
    normalizeScenarioCanvas,
    normalizeStageSizeEntry,
    normalizeStageSizeByShape,
    scenarioStageSizeOverride,
    stageDefaultMainSize,
    stageMainSize,
    stageIconTextGap,
    stageIconLeftPadding,
    stageTextForShape,
    stageIconForShape,
    stageImagesForShape,
    createScenario,
    normalizeTriggers,
    normalizeScenario,
    defaultScenarioLibrary,
  };
}
