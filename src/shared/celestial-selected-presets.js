const CELESTIAL_SELECTED_PRESETS = Object.freeze({
  chip: Object.freeze({
    blobTopCore: '#8fb2ef',
    blobTopEdge: '#8a72eb',
    blobBottomCore: '#a8bbf0',
    blobBottomEdge: '#572fff',
    maskBlur: 30,
    blobBlur: 37,
    blobTopX: -26,
    blobTopY: -36,
    blobBottomX: 45,
    blobBottomY: 38,
    highlightTopX: 0,
    highlightTopY: 0,
    highlightBottomX: 0,
    highlightBottomY: 0,
    highlightScale: 100,
    innerGlowBlur: 8,
  }),
  list: Object.freeze({
    blobTopCore: '#8fb2ef',
    blobTopEdge: '#8a72eb',
    blobBottomCore: '#a8bbf0',
    blobBottomEdge: '#572fff',
    maskBlur: 30,
    blobBlur: 37,
    blobTopX: -26,
    blobTopY: -36,
    blobBottomX: 45,
    blobBottomY: 38,
    highlightTopX: 0,
    highlightTopY: 0,
    highlightBottomX: 0,
    highlightBottomY: 0,
    highlightScale: 100,
    innerGlowBlur: 8,
  }),
  card: Object.freeze({
    blobTopCore: '#6386ef',
    blobTopEdge: '#a086ef',
    blobBottomCore: '#5973ef',
    blobBottomEdge: '#43367a',
    maskBlur: 10.5,
    blobBlur: 80,
    blobTopX: -27,
    blobTopY: -55,
    blobBottomX: 27,
    blobBottomY: 58,
    highlightTopX: 0,
    highlightTopY: 0,
    highlightBottomX: 0,
    highlightBottomY: 0,
    highlightScale: 100,
    innerGlowBlur: 2,
  }),
  pill: Object.freeze({
    blobTopCore: '#4f78ee',
    blobTopEdge: '#5d35ee',
    blobBottomCore: '#8ea7f2',
    blobBottomEdge: '#572fff',
    maskBlur: 24.5,
    blobBlur: 52,
    blobTopX: -30,
    blobTopY: -36,
    blobBottomX: 62,
    blobBottomY: 38,
    highlightTopX: 0,
    highlightTopY: 0,
    highlightBottomX: 0,
    highlightBottomY: 0,
    highlightScale: 157,
    innerGlowBlur: 5,
  }),
});

function isCardLikeShape(renderShape = 'pill') {
  const shape = String(renderShape || 'pill');
  return shape === 'card'
    || shape === 'card-s'
    || shape === 'image'
    || shape === 'card-form'
    || shape === 'card-list';
}

export function celestialSelectedPresetForRenderShape(renderShape = 'pill') {
  const shape = String(renderShape || 'pill');
  if (shape === 'pill') return CELESTIAL_SELECTED_PRESETS.pill;
  if (shape === 'chip' || shape === 'list' || shape === 'dot' || shape === 'circle') return CELESTIAL_SELECTED_PRESETS.list;
  if (isCardLikeShape(shape)) return CELESTIAL_SELECTED_PRESETS.card;
  return CELESTIAL_SELECTED_PRESETS.chip;
}

export function celestialSelectedBlobColorDefaultsForRenderShape(renderShape = 'pill') {
  const preset = celestialSelectedPresetForRenderShape(renderShape);
  return {
    accent: preset.blobTopCore,
    secondaryAccent: preset.blobBottomCore,
    topCore: preset.blobTopCore,
    topEdge: preset.blobTopEdge,
    bottomCore: preset.blobBottomCore,
    bottomEdge: preset.blobBottomEdge,
  };
}

export function celestialSelectedMaskBlurDefaultForRenderShape(renderShape = 'pill') {
  return celestialSelectedPresetForRenderShape(renderShape).maskBlur;
}
