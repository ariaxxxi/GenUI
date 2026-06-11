const DEFAULT_SCENARIO_SHAPES = ['idle', 'dot', 'list', 'timer', 'recorder', 'pill', 'card', 'card-s', 'image'];
const DEFAULT_STAGE_COMPONENT_TYPES = ['icon', 'primary', 'secondary', 'detail', 'image', 'intent-header', 'action-row'];
export const TYPOGRAPHY_LAYERS = ['icon', 'primary', 'secondary', 'detail', 'intentHeader'];

const shapeHelperConfig = {
  clampFn: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
  getAvailableScenarioShapes: () => [],
  renderShapeForStageId: (id) => id,
  scenarioShapes: DEFAULT_SCENARIO_SHAPES,
  stageComponentTypes: DEFAULT_STAGE_COMPONENT_TYPES,
};

export function configureShapeHelpers(overrides = {}) {
  if (!overrides || typeof overrides !== 'object') return;
  if (typeof overrides.clampFn === 'function') shapeHelperConfig.clampFn = overrides.clampFn;
  if (typeof overrides.getAvailableScenarioShapes === 'function') {
    shapeHelperConfig.getAvailableScenarioShapes = overrides.getAvailableScenarioShapes;
  }
  if (typeof overrides.renderShapeForStageId === 'function') {
    shapeHelperConfig.renderShapeForStageId = overrides.renderShapeForStageId;
  }
  if (Array.isArray(overrides.scenarioShapes)) shapeHelperConfig.scenarioShapes = [...overrides.scenarioShapes];
  if (Array.isArray(overrides.stageComponentTypes)) {
    shapeHelperConfig.stageComponentTypes = [...overrides.stageComponentTypes];
  }
}

function clamp(v, lo, hi) {
  return shapeHelperConfig.clampFn(v, lo, hi);
}

function scenarioShapes() {
  return Array.isArray(shapeHelperConfig.scenarioShapes)
    ? shapeHelperConfig.scenarioShapes
    : DEFAULT_SCENARIO_SHAPES;
}

function stageComponentTypes() {
  return Array.isArray(shapeHelperConfig.stageComponentTypes)
    ? shapeHelperConfig.stageComponentTypes
    : DEFAULT_STAGE_COMPONENT_TYPES;
}

export function availableScenarioShapes() {
  const result = shapeHelperConfig.getAvailableScenarioShapes();
  return Array.isArray(result) ? result : [];
}

export function renderShapeForStageId(id) {
  return shapeHelperConfig.renderShapeForStageId(id);
}

function stageIdsForShapeMap(value = {}, fallbackShape = 'pill') {
  return Array.from(new Set([
    ...scenarioShapes(),
    ...availableScenarioShapes(),
    ...Object.keys(value || {}),
    fallbackShape,
  ].filter(Boolean)));
}

export function createIcon(kind = 'none', value = '') {
  return { kind, value: String(value || '') };
}

export const SHAPES = {
  idle: {
    main: { w: 0, h: 0, br: '0px', tx: 0, ty: 0, op: 0 },
    left: { w: 0, h: 0, br: '0px', tx: 0, ty: 0, op: 0 },
    right: { w: 0, h: 0, br: '0px', tx: 0, ty: 0, op: 0 },
  },
  circle: {
    main: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 1 },
    left: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
    right: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
  },
  listening: {
    main: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 1 },
    left: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
    right: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
  },
  magic: {
    main: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 1 },
    left: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
    right: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
  },
  dot: {
    main: { w: 100, h: 100, br: '999px', tx: -50, ty: -50, op: 1 },
    left: { w: 100, h: 100, br: '999px', tx: -50, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '999px', tx: -50, ty: -50, op: 0 },
  },
  timer: {
    main: { w: 96, h: 32, br: '0px', tx: -48, ty: -16, op: 1 },
    left: { w: 0, h: 0, br: '0px', tx: 0, ty: 0, op: 0 },
    right: { w: 0, h: 0, br: '0px', tx: 0, ty: 0, op: 0 },
  },
  list: {
    main: { w: 50, h: 50, br: '25px', tx: -25, ty: -45, op: 0 },
    left: { w: 50, h: 50, br: '25px', tx: -25, ty: -45, op: 0 },
    right: { w: 50, h: 50, br: '25px', tx: -25, ty: -45, op: 0 },
  },
  pill: {
    main: { w: 420, h: 100, br: '60px', tx: -210, ty: -50, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -210, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: 60, ty: -50, op: 0 },
  },
  split: {
    main: { w: 96, h: 96, br: '48px', tx: -48, ty: -48, op: 0 },
    left: { w: 96, h: 96, br: '48px', tx: -108, ty: -48, op: 1 },
    right: { w: 96, h: 96, br: '48px', tx: 12, ty: -48, op: 1 },
  },
  card: {
    main: { w: 420, h: 260, br: '30px', tx: -210, ty: -130, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -210, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: 110, ty: -50, op: 0 },
  },
  'card-s': {
    main: { w: 420, h: 260, br: '30px', tx: -210, ty: -130, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -210, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: 110, ty: -50, op: 0 },
  },
  image: {
    main: { w: 420, h: 260, br: '30px', tx: -210, ty: -130, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -210, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: 110, ty: -50, op: 0 },
  },
  ai: {
    main: { w: 100, h: 100, br: '50px', tx: -50, ty: -50, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -50, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: -50, ty: -50, op: 0 },
  },
  'card-form': {
    main: { w: 420, h: 400, br: '30px', tx: -210, ty: -200, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -210, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: 110, ty: -50, op: 0 },
  },
  'card-list': {
    main: { w: 420, h: 360, br: '30px', tx: -210, ty: -180, op: 1 },
    left: { w: 100, h: 100, br: '50px', tx: -210, ty: -50, op: 0 },
    right: { w: 100, h: 100, br: '50px', tx: 110, ty: -50, op: 0 },
  },
};

export function defaultTypographyForShape(shape = 'pill') {
  return {
    icon: { size: (shape === 'card' || shape === 'card-s') ? 48 : (shape === 'dot' ? 42 : 40), color: '#ffffff' },
    primary: { size: shape === 'timer' ? 24 : 28, color: '#ffffff' },
    secondary: { size: 24, color: '#d4d4d4' },
    detail: { size: 24, color: '#a3a3a3' },
    intentHeader: { size: 18, color: '#a0a0a0' },
  };
}

export function normalizeHexColor(value, fallback = '#90acff') {
  const raw = String(value || fallback || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  const short = raw.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    const [, hex] = short;
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  return String(fallback || '#90acff').toLowerCase();
}

export function normalizeTypography(value = {}, shape = 'pill') {
  const defaults = defaultTypographyForShape(shape);
  const output = {};
  TYPOGRAPHY_LAYERS.forEach((layer) => {
    const src = value?.[layer] || {};
    const fallback = defaults[layer];
    const size = Number(src.size);
    output[layer] = {
      size: Number.isFinite(size) ? clamp(Math.round(size), 12, 96) : fallback.size,
      color: /^#[0-9a-f]{6}$/i.test(String(src.color || '')) ? String(src.color) : fallback.color,
    };
  });
  return output;
}

export function normalizeTypographyByShape(value = {}, fallbackShape = 'pill') {
  const legacyTypography = value && TYPOGRAPHY_LAYERS.some((layer) => value[layer]);
  const output = {};
  const stageIds = stageIdsForShapeMap(value, fallbackShape);
  stageIds.forEach((shape) => {
    const renderShape = renderShapeForStageId(shape) || shape;
    const source = legacyTypography
      ? (shape === fallbackShape ? value : {})
      : (value?.[shape] || {});
    output[shape] = normalizeTypography(source, renderShape);
  });
  return output;
}

export function normalizeStage(raw, fallback) {
  const fallbackStage = fallback || {};
  const id = String(raw?.id || fallbackStage.id || '');
  const preset = !!raw?.preset;
  const renderShape = String(raw?.renderShape || fallbackStage.renderShape || 'card');
  const name = String(raw?.name || fallbackStage.name || id);
  const fallbackCorner = Number.isFinite(Number(fallbackStage.cornerRadius)) ? Number(fallbackStage.cornerRadius) : 30;
  const rawCorner = Number(raw?.cornerRadius);
  const cornerRadius = Number.isFinite(rawCorner)
    ? clamp(Math.round(rawCorner), 0, 120)
    : clamp(Math.round(fallbackCorner), 0, 120);
  const rawWidth = Number(raw?.widthOverride);
  const rawHeight = Number(raw?.heightOverride);
  const widthOverride = Number.isFinite(rawWidth) && rawWidth > 0 ? clamp(Math.round(rawWidth), 40, 1400) : null;
  const heightOverride = Number.isFinite(rawHeight) && rawHeight > 0 ? clamp(Math.round(rawHeight), 40, 1400) : null;
  const fallbackGap = Number(fallbackStage?.iconTextGap);
  const rawGap = Number(raw?.iconTextGap ?? fallbackGap);
  const iconTextGap = Number.isFinite(rawGap) && rawGap >= 0 ? clamp(Math.round(rawGap), 0, 80) : null;
  const fallbackIconPad = Number(fallbackStage?.iconLeftPadding);
  const rawIconPad = Number(raw?.iconLeftPadding ?? fallbackIconPad);
  const iconLeftPadding = Number.isFinite(rawIconPad) && rawIconPad >= 0 ? clamp(Math.round(rawIconPad), 0, 120) : null;
  const phoneBgBlur = raw?.phoneBgBlur === undefined
    ? !!fallbackStage.phoneBgBlur
    : raw?.phoneBgBlur === true;
  const listListeningOrb = raw?.listListeningOrb === undefined
    ? !!fallbackStage.listListeningOrb
    : raw?.listListeningOrb === true;
  const listSelectable = raw?.listSelectable === undefined
    ? fallbackStage.listSelectable !== false
    : raw?.listSelectable !== false;
  const selected = raw?.selected === undefined
    ? !!fallbackStage.selected
    : raw?.selected === true;
  const hideShell = raw?.hideShell === undefined
    ? !!fallbackStage.hideShell
    : raw?.hideShell === true;
  const accentColor = normalizeHexColor(raw?.accentColor, fallbackStage.accentColor || '#90acff');
  const secondaryAccentColor = normalizeHexColor(raw?.secondaryAccentColor, fallbackStage.secondaryAccentColor || '#9761ff');
  const components = Array.isArray(raw?.components)
    ? raw.components.map((item) => String(item || '')).filter((item) => stageComponentTypes().includes(item))
    : [...(fallbackStage.components || [])];
  return { id, name, preset, renderShape, cornerRadius, widthOverride, heightOverride, iconTextGap, iconLeftPadding, phoneBgBlur, listListeningOrb, listSelectable, selected, hideShell, accentColor, secondaryAccentColor, components };
}

export function normalizeStageImage(value) {
  if (!value || typeof value !== 'object') return null;
  const src = String(value.src || '').trim();
  const width = Number(value.width);
  const height = Number(value.height);
  if (!src || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { src, width, height };
}

export function normalizeStageImages(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeStageImage).filter(Boolean);
}

export function normalizeIcon(value) {
  if (value && typeof value === 'object') {
    const kind = ['emoji', 'image', 'none'].includes(value.kind) ? value.kind : 'none';
    return createIcon(kind, value.value || '');
  }
  const text = String(value || '').trim();
  return text ? createIcon('emoji', text) : createIcon('none', '');
}

export function normalizeIconByShape(value = {}, fallbackShape = 'pill', legacyIcon = null) {
  const stageIds = stageIdsForShapeMap(value, fallbackShape);
  const output = {};
  stageIds.forEach((shape) => {
    const stageValue = value?.[shape];
    const resolved = stageValue !== undefined ? stageValue : legacyIcon;
    output[shape] = normalizeIcon(resolved);
  });
  return output;
}

export function normalizeImagesByShape(value = {}, fallbackShape = 'pill', legacyImages = []) {
  const stageIds = stageIdsForShapeMap(value, fallbackShape);
  const output = {};
  stageIds.forEach((shape) => {
    output[shape] = normalizeStageImages(value?.[shape] || (shape === fallbackShape ? legacyImages : []));
  });
  return output;
}
