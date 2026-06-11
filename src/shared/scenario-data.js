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
  normalizeHexColor,
  createIcon,
  availableScenarioShapes as shapeAvailableScenarioShapes,
  renderShapeForStageId as shapeRenderShapeForStageId,
} from '../shapes.js';
import {
  celestialSelectedBlobColorDefaultsForRenderShape,
  celestialSelectedMaskBlurDefaultForRenderShape,
} from './celestial-selected-presets.js';

const DEFAULT_SCENARIO_SHAPES = ['idle', 'dot', 'list', 'list-pill', 'nudge', 'timer', 'recorder', 'pill', 'card', 'card-s', 'image'];
const STAGE_COMPONENT_TYPES = ['icon', 'primary', 'secondary', 'detail', 'image', 'intent-header', 'action-row'];
const TYPOGRAPHY_LAYERS = ['icon', 'primary', 'secondary', 'detail', 'intentHeader'];

const BUILTIN_STAGE_DEFS = Object.freeze([
  { id: 'idle', name: 'Idle', preset: true, renderShape: 'idle', cornerRadius: 0, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: [] },
  { id: 'dot', name: 'Dot', preset: true, renderShape: 'dot', cornerRadius: 50, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['icon'] },
  { id: 'list', name: 'List', preset: true, renderShape: 'list', cornerRadius: 25, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['icon', 'primary', 'secondary', 'detail'] },
  { id: 'list-pill', name: 'List-Pill', preset: true, renderShape: 'list', cornerRadius: 60, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['icon', 'primary', 'secondary'] },
  { id: 'nudge', name: 'Nudge', preset: true, renderShape: 'pill', cornerRadius: 60, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['primary', 'secondary'] },
  { id: 'timer', name: 'Timer', preset: true, renderShape: 'timer', cornerRadius: 0, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, hideShell: true, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['primary'] },
  { id: 'recorder', name: 'Recorder', preset: true, renderShape: 'timer', cornerRadius: 0, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, hideShell: true, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['primary'] },
  { id: 'pill', name: 'Pill', preset: true, renderShape: 'pill', cornerRadius: 60, widthOverride: null, heightOverride: null, iconTextGap: 8, iconLeftPadding: 16, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['icon', 'primary', 'secondary'] },
  { id: 'card', name: 'Card', preset: true, renderShape: 'card', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['icon', 'primary', 'secondary', 'detail', 'image'] },
  { id: 'card-s', name: 'Card-S', preset: true, renderShape: 'card-s', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: 8, iconLeftPadding: 16, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['icon', 'primary', 'secondary', 'detail', 'image'] },
  { id: 'image', name: 'Image', preset: true, renderShape: 'image', cornerRadius: 30, widthOverride: null, heightOverride: null, iconTextGap: null, iconLeftPadding: null, phoneBgBlur: false, listListeningOrb: false, listSelectable: true, selected: false, accentColor: '#90acff', secondaryAccentColor: '#9761ff', components: ['image'] },
]);

function isNudgeStageId(value) {
  const id = String(value || '').trim().toLowerCase();
  return id === 'nudge' || id.startsWith('nudge-');
}

function selectedBlobDefaultsForRenderShape(renderShape = 'pill') {
  return celestialSelectedBlobColorDefaultsForRenderShape(renderShape);
}

export function initScenarioData({ getStageLibrary, getCanvasSettings, clampFn }) {
  const clamp = typeof clampFn === 'function' ? clampFn : ((v, lo, hi) => Math.max(lo, Math.min(hi, v)));
  const textMeasureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const textMeasureContext = textMeasureCanvas?.getContext?.('2d') || null;

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
    const legacyStored = Array.isArray(stored) ? stored : readStoredJson('undefined', null);
    if (!Array.isArray(legacyStored)) return defaultStageLibrary();
    const byId = new Map(BUILTIN_STAGE_DEFS.map((stage) => [stage.id, stage]));
    const normalized = legacyStored.map((item) => normalizeStage(item, byId.get(item?.id))).filter(Boolean).map((stage) => {
      if (stage.id !== 'action-card' || stage.components.includes('action-row')) return stage;
      return { ...stage, components: [...stage.components, 'action-row'] };
    });
    const ids = new Set(normalized.map((stage) => stage.id));
    BUILTIN_STAGE_DEFS.forEach((builtin) => {
      if (!ids.has(builtin.id)) normalized.unshift(normalizeStage(builtin, builtin));
    });
    return normalized;
  }

  function normalizeStageRenderShapeById(value = {}) {
    const output = {};
    const allowed = new Set(Object.keys(SHAPES));
    Object.entries(value || {}).forEach(([stageIdValue, renderShape]) => {
      const key = String(stageIdValue || '').trim();
      const normalizedShape = String(renderShape || '').trim();
      if (!key || !allowed.has(normalizedShape)) return;
      output[key] = normalizedShape;
    });
    return output;
  }

  function normalizeHiddenStageIds(value = []) {
    if (!Array.isArray(value)) return [];
    const known = new Set(stageLibrary().map((stage) => stage.id));
    const output = [];
    value.forEach((item) => {
      const id = String(item || '').trim();
      if (!id || !known.has(id) || output.includes(id)) return;
      output.push(id);
    });
    return output;
  }

  function stageById(id, scenario = null) {
    const stages = stageLibrary();
    const baseStage = stages.find((stage) => stage.id === id) || stages.find((stage) => stage.id === 'pill') || stages[0] || null;
    if (!baseStage) return null;
    const overrideShape = scenario?.content?.stageRenderShapeById?.[baseStage.id];
    return overrideShape ? { ...baseStage, renderShape: overrideShape } : baseStage;
  }

  function builtinStageById(id) {
    return BUILTIN_STAGE_DEFS.find((stage) => stage.id === id) || null;
  }

  function renderShapeForStageId(id, scenario = null) {
    const stage = stageById(id, scenario);
    return stage?.renderShape || 'pill';
  }

  function availableScenarioShapes() {
    return stageLibrary().map((stage) => stage.id);
  }

  function visibleScenarioStages(scenario = null) {
    const hidden = new Set(normalizeHiddenStageIds(scenario?.content?.hiddenStageIds));
    return stageLibrary()
      .filter((stage) => !hidden.has(stage.id))
      .map((stage) => stageById(stage.id, scenario));
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
    if (stage?.id === 'list-pill') return new Set();
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
      intentHeader: String(value?.intentHeader ?? fallback?.intentHeader ?? ''),
    };
  }

  function hasMeaningfulStageText(value = {}) {
    const entry = normalizeStageTextEntry(value);
    return !!(entry.primary.trim() || entry.secondary.trim() || entry.detail.trim() || entry.intentHeader.trim());
  }

  function defaultStageTextFallback(shape) {
    if (isNudgeStageId(shape)) {
      return { primary: 'Buy milk', secondary: 'Grocery list', detail: '', intentHeader: '' };
    }
    if (shape === 'timer') {
      return { primary: '03:00', secondary: '', detail: '', intentHeader: '' };
    }
    if (shape === 'recorder') {
      return { primary: '00:00:00', secondary: '', detail: '', intentHeader: '' };
    }
    const renderShape = renderShapeForStageId(shape) || shape;
    if (renderShape === 'pill') {
      return { primary: 'Primary text', secondary: 'Secondary text', detail: '', intentHeader: '' };
    }
    if (renderShape === 'list') {
      return { primary: 'Hiro Tanaka', secondary: 'Mina Park', detail: 'Sofia Chen', intentHeader: '' };
    }
    if (renderShape === 'card' || renderShape === 'card-s') {
      return { primary: 'Primary text', secondary: 'Secondary text', detail: 'Detail text example', intentHeader: '' };
    }
    return { primary: '', secondary: '', detail: '', intentHeader: '' };
  }

  function defaultListLabelsForShape(shape) {
    const fallback = normalizeStageTextEntry(defaultStageTextFallback(shape));
    return [fallback.primary, fallback.secondary, fallback.detail].filter(Boolean);
  }

  function createDefaultListItem(primary = '', secondary = '', icon = createIcon('none', '')) {
    return {
      primary: String(primary || ''),
      secondary: String(secondary || ''),
      icon: normalizeIcon(icon),
    };
  }

  function normalizeListItem(value = {}, fallback = {}) {
    const fallbackPrimary = String(fallback?.primary ?? fallback?.label ?? '');
    const fallbackSecondary = String(fallback?.secondary ?? '');
    return {
      primary: String(value?.primary ?? value?.label ?? fallbackPrimary),
      secondary: String(value?.secondary ?? fallbackSecondary),
      icon: normalizeIcon(value?.icon ?? fallback?.icon),
    };
  }

  function normalizeListItems(value = [], fallback = [], { min = 1, max = 8 } = {}) {
    const source = Array.isArray(value) ? value : [];
    const fallbackItems = Array.isArray(fallback) ? fallback : [];
    const normalized = source.map((item, index) => normalizeListItem(item, fallbackItems[index] || {}));
    const output = normalized.length ? normalized.slice(0, max) : fallbackItems.map((item) => normalizeListItem(item)).slice(0, max);
    while (output.length < Math.min(max, min)) {
      const nextIndex = output.length;
      output.push(normalizeListItem(undefined, fallbackItems[nextIndex] || createDefaultListItem(`List item ${nextIndex + 1}`)));
    }
    return output;
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

  function normalizeCardImagePaddingByShape(value = {}, fallbackShape = 'card') {
    const stageIds = scenarioStageIdsForMap(value, fallbackShape);
    const output = {};
    stageIds.forEach((shape) => {
      const raw = Number(value?.[shape]);
      output[shape] = Number.isFinite(raw) ? clamp(Math.round(raw), 0, 120) : 24;
    });
    return output;
  }

  function scenarioStageIdsForMap(value = {}, fallbackShape = 'pill') {
    return Array.from(new Set([
      ...DEFAULT_SCENARIO_SHAPES,
      ...availableScenarioShapes(),
      ...Object.keys(value || {}),
      fallbackShape,
    ].filter(Boolean)));
  }

  function normalizeSelectedByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const raw = value?.[shape];
      if (raw === true || raw === false) {
        output[shape] = raw;
        return;
      }
      output[shape] = !!stageById(shape)?.selected;
    });
    return output;
  }

  function normalizeAccentColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const stage = stageById(shape);
      const defaults = selectedBlobDefaultsForRenderShape(stage?.renderShape || shape);
      const legacyFallback = stage?.accentColor || '#90acff';
      const raw = value?.[shape];
      output[shape] = normalizeHexColor(raw, defaults.accent);
      if (normalizeHexColor(raw, legacyFallback) === normalizeHexColor(legacyFallback, legacyFallback)) {
        output[shape] = defaults.accent;
      }
    });
    return output;
  }

  function normalizeSecondaryAccentColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const stage = stageById(shape);
      const defaults = selectedBlobDefaultsForRenderShape(stage?.renderShape || shape);
      const legacyFallback = stage?.secondaryAccentColor || '#9761ff';
      const raw = value?.[shape];
      output[shape] = normalizeHexColor(raw, defaults.secondaryAccent);
      if (normalizeHexColor(raw, legacyFallback) === normalizeHexColor(legacyFallback, legacyFallback)) {
        output[shape] = defaults.secondaryAccent;
      }
    });
    return output;
  }

  function normalizeSelectedBlobTopCoreColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const stage = stageById(shape);
      const defaults = selectedBlobDefaultsForRenderShape(stage?.renderShape || shape);
      const legacyFallback = stage?.accentColor || '#90acff';
      const raw = value?.[shape];
      output[shape] = normalizeHexColor(raw, defaults.topCore);
      if (normalizeHexColor(raw, legacyFallback) === normalizeHexColor(legacyFallback, legacyFallback)) {
        output[shape] = defaults.topCore;
      }
    });
    return output;
  }

  function normalizeSelectedBlobTopEdgeColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const stage = stageById(shape);
      const defaults = selectedBlobDefaultsForRenderShape(stage?.renderShape || shape);
      const legacyFallback = stage?.secondaryAccentColor || '#9761ff';
      const raw = value?.[shape];
      output[shape] = normalizeHexColor(raw, defaults.topEdge);
      if (normalizeHexColor(raw, legacyFallback) === normalizeHexColor(legacyFallback, legacyFallback)) {
        output[shape] = defaults.topEdge;
      }
    });
    return output;
  }

  function normalizeSelectedBlobBottomCoreColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const stage = stageById(shape);
      const defaults = selectedBlobDefaultsForRenderShape(stage?.renderShape || shape);
      const legacyFallback = stage?.accentColor || '#90acff';
      const raw = value?.[shape];
      output[shape] = normalizeHexColor(raw, defaults.bottomCore);
      if (normalizeHexColor(raw, legacyFallback) === normalizeHexColor(legacyFallback, legacyFallback)) {
        output[shape] = defaults.bottomCore;
      }
    });
    return output;
  }

  function normalizeSelectedBlobBottomEdgeColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const stage = stageById(shape);
      const defaults = selectedBlobDefaultsForRenderShape(stage?.renderShape || shape);
      const legacyFallback = stage?.secondaryAccentColor || '#9761ff';
      const raw = value?.[shape];
      output[shape] = normalizeHexColor(raw, defaults.bottomEdge);
      if (normalizeHexColor(raw, legacyFallback) === normalizeHexColor(legacyFallback, legacyFallback)) {
        output[shape] = defaults.bottomEdge;
      }
    });
    return output;
  }

  function normalizeDividerColorByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      output[shape] = normalizeHexColor(value?.[shape], '#ffffff');
    });
    return output;
  }

  function normalizeSelectedMaskBlurByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      const renderShape = stageById(shape)?.renderShape || shape;
      const fallback = celestialSelectedMaskBlurDefaultForRenderShape(renderShape);
      const raw = Number(value?.[shape]);
      output[shape] = Number.isFinite(raw) ? clamp(raw, 0, 30) : fallback;
    });
    return output;
  }

  function normalizeListChipIconEntry(value = {}) {
    return {
      primary: normalizeIcon(value?.primary),
      secondary: normalizeIcon(value?.secondary),
      detail: normalizeIcon(value?.detail),
    };
  }

  function normalizeListChipIconsByShape(value = {}, fallbackShape = 'pill') {
    const output = {};
    scenarioStageIdsForMap(value, fallbackShape).forEach((shape) => {
      output[shape] = normalizeListChipIconEntry(value?.[shape]);
    });
    return output;
  }

  function listFallbackItemsForShape(shape, textByShape = {}, listChipIconsByShape = {}) {
    const text = normalizeStageTextEntry(textByShape?.[shape], defaultStageTextFallback(shape));
    const icons = normalizeListChipIconEntry(listChipIconsByShape?.[shape]);
    const labels = [text.primary, text.secondary, text.detail].filter((value) => String(value || '').trim());
    const fallbackLabels = labels.length ? labels : defaultListLabelsForShape(shape);
    return fallbackLabels.map((label, index) => createDefaultListItem(
      label,
      '',
      [icons.primary, icons.secondary, icons.detail][index] || createIcon('none', ''),
    ));
  }

  function normalizeListItemsByShape(value = {}, fallbackShape = 'pill', legacy = {}) {
    const stageIds = Array.from(new Set([
      ...DEFAULT_SCENARIO_SHAPES,
      ...availableScenarioShapes(),
      ...Object.keys(value || {}),
      fallbackShape,
    ].filter(Boolean)));
    const output = {};
    const textByShape = legacy?.textByShape || {};
    const listChipIconsByShape = legacy?.listChipIconsByShape || {};
    stageIds.forEach((shape) => {
      const renderShape = renderShapeForStageId(shape) || shape;
      output[shape] = renderShape === 'list'
        ? normalizeListItems(value?.[shape], listFallbackItemsForShape(shape, textByShape, listChipIconsByShape))
        : [];
    });
    return output;
  }

  function stageRenderShapeForShape(scenario, shape) {
    return renderShapeForStageId(shape, scenario);
  }

  function measureSingleLineWidth(text, fontSize, fontWeight = 400) {
    const value = String(text || '').trim();
    if (!value) return 0;
    if (textMeasureContext) {
      textMeasureContext.font = `${fontWeight} ${fontSize}px "DM Sans", sans-serif`;
      return Math.ceil(textMeasureContext.measureText(value).width);
    }
    return Math.ceil(value.length * fontSize * 0.58);
  }

  function stageTypographyForShape(stageIdValue, scenario = null) {
    const renderShape = renderShapeForStageId(stageIdValue, scenario) || stageIdValue || 'pill';
    const typographyByShape = normalizeTypographyByShape(scenario?.content?.typographyByShape, stageIdValue);
    return typographyByShape?.[stageIdValue] || defaultTypographyForShape(renderShape);
  }

  function scenarioStageSizeOverride(scenario, shape) {
    return normalizeStageSizeEntry(scenario?.content?.sizeByShape?.[shape]);
  }

  function stageCardImagePaddingForShape(scenario, shape) {
    const raw = Number(scenario?.content?.cardImagePaddingByShape?.[shape]);
    return Number.isFinite(raw) ? clamp(Math.round(raw), 0, 120) : 24;
  }

  function stageDefaultMainSize(stageIdValue) {
    if (stageIdValue === 'list-pill') {
      return { width: 300, height: 80 };
    }
    if (isNudgeStageId(stageIdValue)) {
      return { width: 240, height: 80 };
    }
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
    let defaultWidth = usePhoneDefaultWidth ? phoneDefaultWidth : defaults.width;
    if (isNudgeStageId(stage?.id)) {
      const text = stageTextForShape(scenario, stage.id);
      const typography = stageTypographyForShape(stage.id, scenario);
      const primaryText = String(text?.primary || '').trim();
      const secondaryText = String(text?.secondary || '').trim();
      const leftPad = 24;
      const rightPad = 24;
      const primaryToDividerGap = 12;
      const dividerToSecondaryGap = 14;
      const dividerWidth = 1;
      const primaryWidth = primaryText ? measureSingleLineWidth(primaryText, typography.primary.size, 500) : 0;
      const secondaryWidth = secondaryText ? measureSingleLineWidth(secondaryText, typography.secondary.size, 400) : 0;
      const dividerExtra = primaryText && secondaryText
        ? (primaryToDividerGap + dividerWidth + dividerToSecondaryGap)
        : 0;
      defaultWidth = clamp(
        Math.round(leftPad + primaryWidth + dividerExtra + secondaryWidth + rightPad),
        120,
        1400,
      );
    }
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

  function stageListChipIconsForShape(scenario, shape) {
    return normalizeListChipIconEntry(scenario?.content?.listChipIconsByShape?.[shape]);
  }

  function stageListItemsForShape(scenario, shape) {
    return normalizeListItems(
      scenario?.content?.listItemsByShape?.[shape],
      listFallbackItemsForShape(shape, scenario?.content?.textByShape, scenario?.content?.listChipIconsByShape)
    );
  }

  function stageListListeningOrbForShape(scenario, shape) {
    return !!stageById(shape, scenario)?.listListeningOrb;
  }

  function stageListSelectableForShape(scenario, shape) {
    return stageById(shape, scenario)?.listSelectable !== false;
  }

  function stageImagesForShape(scenario, shape) {
    return normalizeStageImages(
      scenario?.content?.imagesByShape?.[shape] || scenario?.content?.images || (scenario?.content?.image ? [scenario.content.image] : [])
    );
  }

  function stageSelectedForShape(scenario, shape) {
    const raw = scenario?.content?.selectedByShape?.[shape];
    if (raw === true || raw === false) return raw;
    return !!stageById(shape)?.selected;
  }

  function stageAccentColorForShape(scenario, shape) {
    const defaults = selectedBlobDefaultsForRenderShape(stageById(shape, scenario)?.renderShape || shape);
    return normalizeHexColor(scenario?.content?.accentColorByShape?.[shape], defaults.accent);
  }

  function stageSecondaryAccentColorForShape(scenario, shape) {
    const defaults = selectedBlobDefaultsForRenderShape(stageById(shape, scenario)?.renderShape || shape);
    return normalizeHexColor(scenario?.content?.secondaryAccentColorByShape?.[shape], defaults.secondaryAccent);
  }

  function stageSelectedBlobTopCoreColorForShape(scenario, shape) {
    const defaults = selectedBlobDefaultsForRenderShape(stageById(shape, scenario)?.renderShape || shape);
    return normalizeHexColor(
      scenario?.content?.selectedBlobTopCoreColorByShape?.[shape],
      defaults.topCore,
    );
  }

  function stageSelectedBlobTopEdgeColorForShape(scenario, shape) {
    const defaults = selectedBlobDefaultsForRenderShape(stageById(shape, scenario)?.renderShape || shape);
    return normalizeHexColor(
      scenario?.content?.selectedBlobTopEdgeColorByShape?.[shape],
      defaults.topEdge,
    );
  }

  function stageSelectedBlobBottomCoreColorForShape(scenario, shape) {
    const defaults = selectedBlobDefaultsForRenderShape(stageById(shape, scenario)?.renderShape || shape);
    return normalizeHexColor(
      scenario?.content?.selectedBlobBottomCoreColorByShape?.[shape],
      defaults.bottomCore,
    );
  }

  function stageSelectedBlobBottomEdgeColorForShape(scenario, shape) {
    const defaults = selectedBlobDefaultsForRenderShape(stageById(shape, scenario)?.renderShape || shape);
    return normalizeHexColor(
      scenario?.content?.selectedBlobBottomEdgeColorByShape?.[shape],
      defaults.bottomEdge,
    );
  }

  function stageNudgeDividerColorForShape(scenario, shape) {
    return normalizeHexColor(scenario?.content?.dividerColorByShape?.[shape], '#ffffff');
  }

  function stageSelectedMaskBlurForShape(scenario, shape) {
    const renderShape = stageById(shape, scenario)?.renderShape || shape;
    const fallback = celestialSelectedMaskBlurDefaultForRenderShape(renderShape);
    const raw = Number(scenario?.content?.selectedMaskBlurByShape?.[shape]);
    return Number.isFinite(raw) ? clamp(raw, 0, 30) : fallback;
  }

  function normalizeTriggers(value) {
    if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
    return String(value || '')
      .split(/[\n,]/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  function normalizeActionCardActionsByShape(value = {}, fallbackShape = 'action-card') {
    const output = {};
    const stageIds = Array.from(new Set([
      ...DEFAULT_SCENARIO_SHAPES,
      ...availableScenarioShapes(),
      ...Object.keys(value || {}),
      fallbackShape,
    ].filter(Boolean)));
    stageIds.forEach((shape) => {
      const source = value?.[shape] || {};
      const hasLeft = Object.prototype.hasOwnProperty.call(source, 'left');
      const hasRight = Object.prototype.hasOwnProperty.call(source, 'right');
      output[shape] = {
        left: hasLeft ? String(source.left ?? '') : 'Snooze',
        right: hasRight ? String(source.right ?? '') : 'Join now →',
      };
    });
    return output;
  }

  function createScenario({
    id = scenarioId(),
    name = 'New Scenario',
    shape = 'pill',
    content = {},
    triggers = [],
  } = {}) {
    const normalizedTextByShape = normalizeStageTextByShape(content.textByShape, shape, {
      primary: String(content.primary || ''),
      secondary: String(content.secondary || ''),
      detail: String(content.detail || ''),
    });
    const normalizedListChipIconsByShape = normalizeListChipIconsByShape(content.listChipIconsByShape, shape);
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
        textByShape: normalizedTextByShape,
        listItemsByShape: normalizeListItemsByShape(content.listItemsByShape, shape, {
          textByShape: normalizedTextByShape,
          listChipIconsByShape: normalizedListChipIconsByShape,
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
        cardImagePaddingByShape: normalizeCardImagePaddingByShape(content.cardImagePaddingByShape, shape),
        stageRenderShapeById: normalizeStageRenderShapeById(content.stageRenderShapeById),
        actionCardActionsByShape: normalizeActionCardActionsByShape(content.actionCardActionsByShape, shape),
        hiddenStageIds: normalizeHiddenStageIds(content.hiddenStageIds),
        selectedByShape: normalizeSelectedByShape(content.selectedByShape, shape),
        accentColorByShape: normalizeAccentColorByShape(content.accentColorByShape, shape),
        secondaryAccentColorByShape: normalizeSecondaryAccentColorByShape(content.secondaryAccentColorByShape, shape),
        dividerColorByShape: normalizeDividerColorByShape(content.dividerColorByShape, shape),
        selectedBlobTopCoreColorByShape: normalizeSelectedBlobTopCoreColorByShape(content.selectedBlobTopCoreColorByShape, shape),
        selectedBlobTopEdgeColorByShape: normalizeSelectedBlobTopEdgeColorByShape(content.selectedBlobTopEdgeColorByShape, shape),
        selectedBlobBottomCoreColorByShape: normalizeSelectedBlobBottomCoreColorByShape(content.selectedBlobBottomCoreColorByShape, shape),
        selectedBlobBottomEdgeColorByShape: normalizeSelectedBlobBottomEdgeColorByShape(content.selectedBlobBottomEdgeColorByShape, shape),
        selectedMaskBlurByShape: normalizeSelectedMaskBlurByShape(content.selectedMaskBlurByShape, shape),
        listChipIconsByShape: normalizedListChipIconsByShape,
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
    visibleScenarioStages,
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
    normalizeCardImagePaddingByShape,
    stageCardImagePaddingForShape,
    stageDefaultMainSize,
    stageMainSize,
    stageIconTextGap,
    stageIconLeftPadding,
    stageTextForShape,
    stageIconForShape,
    stageListChipIconsForShape,
    stageListItemsForShape,
    stageListListeningOrbForShape,
    stageListSelectableForShape,
    stageImagesForShape,
    stageRenderShapeForShape,
    stageSelectedForShape,
    stageAccentColorForShape,
    stageSecondaryAccentColorForShape,
    stageNudgeDividerColorForShape,
    stageSelectedBlobTopCoreColorForShape,
    stageSelectedBlobTopEdgeColorForShape,
    stageSelectedBlobBottomCoreColorForShape,
    stageSelectedBlobBottomEdgeColorForShape,
    stageSelectedMaskBlurForShape,
    createDefaultListItem,
    normalizeListItem,
    normalizeListItems,
    normalizeListChipIconEntry,
    normalizeListChipIconsByShape,
    normalizeListItemsByShape,
    createScenario,
    normalizeTriggers,
    normalizeScenario,
    defaultScenarioLibrary,
  };
}
