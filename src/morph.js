import {
  SHAPES,
  defaultTypographyForShape,
  normalizeTypography,
  normalizeStageImage,
  normalizeStageImages,
  normalizeIcon,
} from './shapes.js';

export function initMorph({ DROPS, C, detailMeasureEl, callbacks }) {
  const P = 20;
  const PILL_NO_ICON_P = 32;
  const PILL_ICON_P = 16;
  const CARD_P = 24;
  const BOTTOM_ALIGN_REF_H = 580;
  const CARD_MEDIA_BOTTOM_P = CARD_P + 6;
  const CARD_DIVIDER_GAP = 10;
  const CARD_PRIMARY_GAP = 14;
  const CARD_PRIMARY_TO_SECONDARY_GAP = 8;
  const CARD_SECONDARY_TO_DETAIL_GAP = 8;
  const CARD_DETAIL_TO_MEDIA_GAP = 24;
  const CARD_MEDIA_STACK_GAP = 8;
  const TS = 60;
  const TBR = '30px';
  const GAP = 8;

  let currentShape = 'circle';
  let lastMainGeo = { ...SHAPES.circle.main };
  let mainDeformAnim = null;
  const splitTimers = [];
  let suppressDeformation = false;
  let splitBridgeTimer = null;
  let listBridgeTimer = null;
  let thinkingBridgeTimer = null;
  let thumbContentState = callbacks.createIcon('none', '');
  let contentTypographyState = defaultTypographyForShape('pill');
  let contentDelayProfile = { secondaryInAdvanceMs: 0, detailInAdvanceMs: 0 };
  let stageMediaState = [];
  const uiFadeTimers = [];
  let currentContentFadeMs = 260;
  let currentDetailFadeMs = 260;
  let currentMediaFadeMs = 260;
  let currentTransitionAnimMs = 450;

  const clamp = (...args) => callbacks.clamp(...args);
  const selectedScenario = () => callbacks.selectedScenario();
  const stageById = (...args) => callbacks.stageById(...args);
  const updateActive = (...args) => callbacks.updateActive(...args);
  const stopSiriOrb = (...args) => callbacks.stopSiriOrb(...args);
  const startSiriOrb = (...args) => callbacks.startSiriOrb(...args);
  const showAiIdle = (...args) => callbacks.showAiIdle(...args);
  const collapseListStack = (...args) => callbacks.collapseListStack(...args);
  const animateSplitMetaball = (...args) => callbacks.animateSplitMetaball(...args);
  const normalizeStageSizeEntry = (...args) => callbacks.normalizeStageSizeEntry(...args);
  const scenarioStageSizeOverride = (...args) => callbacks.scenarioStageSizeOverride(...args);
  const stageMainSize = (...args) => callbacks.stageMainSize(...args);
  const stageIconTextGap = (...args) => callbacks.stageIconTextGap(...args);
  const stageIconLeftPadding = (...args) => callbacks.stageIconLeftPadding(...args);
  const renderShapeForStageId = (...args) => callbacks.renderShapeForStageId(...args);
  const stageComponentCounts = (...args) => callbacks.stageComponentCounts(...args);
  const stageTextForShape = (...args) => callbacks.stageTextForShape(...args);
  const stageIconForShape = (...args) => callbacks.stageIconForShape(...args);
  const stageImagesForShape = (...args) => callbacks.stageImagesForShape(...args);
  const createIcon = (...args) => callbacks.createIcon(...args);
  const getAnimDuration = () => callbacks.getAnimDuration();
  const getEasingFns = () => callbacks.getEasingFns();
  const getCanvasSettings = () => callbacks.getCanvasSettings();

function contentPos(shape, w, h) {
  if (shape === 'idle') return {
    thumb:  { x:w/2, y:h/2, w:0, h:0, br:'0px', op:0 },
    prim:   { x:w/2, y:h/2, op:0, fs:28, cx:true },
    sec:    { x:w/2, y:h/2, op:0, fs:24, cx:true },
    div:    { x:w/2, y:h/2, dw:0, op:0 },
    det:    { x:w/2, y:h/2, op:0, fs:24, cx:true },
  };
  if (shape === 'circle' || shape === 'dot') return {
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
    const rowGap = 4;
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

function splitBridgeMs() {
  return clamp(Math.round(getAnimDuration() * 0.62), 300, 460);
}

function listBridgeMs() {
  return 500;
}

function listPhaseTwoStartMs() {
  return 500;
}

function thinkingBridgeMs() {
  return clamp(Math.round(getAnimDuration() * 0.55), 220, 420);
}

function homeThinkingBridgeMs() {
  return clamp(Math.round(getAnimDuration() * 0.48), 180, 320);
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

function transitionAnimMs(fromShape, toShape, baseMs = getAnimDuration(), fromGeo = null, toGeo = null) {
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

function bridgeHomeToThinking(targetShape) {
  if (thinkingBridgeTimer) {
    clearTimeout(thinkingBridgeTimer);
    thinkingBridgeTimer = null;
  }
  stopSiriOrb();
  morphCore('circle', { icon:'', primary:'', secondary:'', detail:'' }, null, true, 0);
  C.thumb.style.opacity = '0';
  updateActive(targetShape);
  thinkingBridgeTimer = setTimeout(() => {
    thinkingBridgeTimer = null;
    morphCore('ai', { icon:'', primary:'', secondary:'', detail:'' }, null, true, 0);
    if (targetShape === 'idle') {
      showAiIdle();
      updateActive('idle');
      return;
    }
    startSiriOrb(true);
    updateActive('ai');
  }, homeThinkingBridgeMs());
}

function bridgeThinkingToHome(contentData = null, customGeo = null, stageId = null) {
  if (thinkingBridgeTimer) {
    clearTimeout(thinkingBridgeTimer);
    thinkingBridgeTimer = null;
  }
  stopSiriOrb();
  morphCore('circle', contentData, customGeo, true, Math.round(homeThinkingBridgeMs() * 0.2), stageId);
  updateActive('circle');
}

function getActiveEasing() {
  const sel = document.getElementById('ease-select');
  if (!sel) return 'cubic-bezier(0.22,1,0.36,1)';
  const pick = getEasingFns()?.[sel.value];
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
  const compact = new Set(['circle', 'pill', 'split']);
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
  const useBottomAlign = !!getCanvasSettings()?.bottomAlign;
  const alignedStageHeight = useBottomAlign
    ? Math.max(BOTTOM_ALIGN_REF_H, geo.main.h, SHAPES.dot.main.h)
    : geo.main.h;
  ['main','left','right'].forEach(k => {
    const el = DROPS[k], s = geo[k];
    const anchorHeight = (shape === 'idle' && k === 'main') ? SHAPES.dot.main.h : s.h;
    const yOffset = useBottomAlign ? ((alignedStageHeight - anchorHeight) / 2) : 0;
    el.style.width        = s.w + 'px';
    el.style.height       = s.h + 'px';
    el.style.borderRadius = (k === 'main') ? mainRadius : s.br;
    el.style.transform    = `translate(${s.tx}px,${s.ty + yOffset}px)`;
    el.style.opacity      = s.op;
    el.style.pointerEvents = s.op > 0 ? 'auto' : 'none';
  });
  const stage = document.getElementById('stage');
  if (stage) stage.style.height = alignedStageHeight + 'px';
  lastMainGeo = { ...geo.main };
}

function clearUiFadeTimers() {
  while (uiFadeTimers.length) clearTimeout(uiFadeTimers.pop());
}

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
    return ['circle', 'dot', 'pill', 'card', 'card-s', 'card-form', 'card-list', 'custom'].includes(shape);
  }
  const icon = (C.thumbLabel.textContent || '').trim();
  if (!icon) return false;
  if (icon === '···') return false;
  return ['circle', 'dot', 'pill', 'card', 'card-s', 'card-form', 'card-list', 'custom'].includes(shape);
}

function applyThumbVisualMode(shape) {
  const icon = thumbContentState.kind === 'image' ? '__image__' : (C.thumbLabel.textContent || '').trim();
  const homeEmpty = shape === 'circle' && !icon;
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
  const transitionMs = transitionAnimMs(fromShape, toShape, getAnimDuration(), fromGeo, toGeo);
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
  root.style.setProperty('--anim-w', `${transitionMs}ms var(--spring)`);
  root.style.setProperty('--anim-h', `${transitionMs}ms var(--spring)`);
  root.style.setProperty('--anim-br', `${transitionMs}ms var(--spring)`);
  root.style.setProperty('--anim-tx', `${transitionMs}ms var(--spring)`);
  root.style.setProperty('--anim-t', `${transitionMs}ms var(--spring)`);
  root.style.setProperty('--content-fade-ms', `${contentFadeMs}ms`);
  root.style.setProperty('--detail-fade-ms', `${detailFadeMs}ms`);
  root.style.setProperty('--media-fade-ms', `${mediaFadeMs}ms`);
  root.style.setProperty('--thumb-fade-ms', `${thumbFadeMs}ms`);
  root.style.setProperty('--content-move-t', `${contentMoveMs}ms var(--spring)`);
  root.style.setProperty('--primary-size-anim-ms', `${primarySizeAnimMs}ms`);
  root.style.setProperty('--text-size-anim-ms', `${textSizeAnimMs}ms`);
}

function applyContentPositions(shape, w, h, fadeInDelayMs = 0, fadeOutDelayMs = 0, fromShape = shape, fromWidth = w, fromHeight = h, outgoingMedia = null, outgoingTypography = null) {
  const pos = contentPos(shape, w, h);
  C.thumb.style.cssText += `width:${pos.thumb.w}px;height:${pos.thumb.h}px;border-radius:${pos.thumb.br};transform:translate(${pos.thumb.x}px,${pos.thumb.y}px);`;
  applyThumbVisualMode(shape);
  let thumbOpacity = pos.thumb.op;
  if (shape === 'circle' && thumbContentState.kind === 'none') thumbOpacity = 0;
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

function showRich(html) {
  C.rich.style.opacity = '0';
  C.rich.innerHTML = html;
  C.rich.classList.add('visible');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    C.rich.style.opacity = '1';
  }));
}

function hideRich() {
  C.rich.style.opacity = '0';
  setTimeout(() => {
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
  const geo = nextGeo;
  const mw = geo.main.w, mh = geo.main.h;
  applyGeometry(shape, geo, stageId);
  const goingHome = shape === 'circle' && fromShape !== 'circle';
  if (goingHome) {
    DROPS.main.style.setProperty('--home-glow-delay', `${Math.max(0, currentTransitionAnimMs - 500)}ms`);
    DROPS.main.classList.remove('home-glow');
    void DROPS.main.offsetWidth;
    DROPS.main.classList.add('home-glow');
  } else {
    DROPS.main.style.setProperty('--home-glow-delay', '0ms');
    DROPS.main.classList.toggle('home-glow', shape === 'circle');
  }
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
    if (shape === 'circle') {
      bridgeThinkingToHome(contentData, customGeo, stageId);
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

  return {
    contentPos,
    setThumbContent,
    setContentTypography,
    setStageMedia,
    getScenarioTypography,
    cardDetailTextWidth,
    lineTextWidth,
    cardMediaWidth,
    measureLineHeight,
    measureCardMediaHeight,
    measureCardMediaHeights,
    mediaStackHeight,
    measureCardDetailHeight,
    hasIconContent,
    getCardLayoutMetrics,
    getCardSLayoutMetrics,
    stageCornerRadiusPx,
    withStageSizeOverride,
    resolveGeometryForContent,
    scenarioToRenderContent,
    splitBridgeMs,
    listBridgeMs,
    listPhaseTwoStartMs,
    thinkingBridgeMs,
    homeThinkingBridgeMs,
    cardHeightForTransition,
    cardDurationBonusMs,
    transitionAnimMs,
    clearSplitTimers,
    scheduleSplitTimer,
    clearSplitAnimationOverlays,
    bridgeFromSplitToTarget,
    bridgeToSplitViaDot,
    bridgeFromListToTarget,
    bridgeFromThinkingToTarget,
    bridgeHomeToThinking,
    bridgeThinkingToHome,
    getActiveEasing,
    getCurrentMainGeometry,
    shouldUseStrongDeform,
    deformationIntensity,
    runMainDeformation,
    applyGeometry,
    clearUiFadeTimers,
    applyCardDetailLayout,
    resetDetailInlineLayout,
    setOpacityWithDelay,
    isIconOnlyThumb,
    applyThumbVisualMode,
    applyTypographyStyles,
    ensureStageMediaEls,
    hideAllStageMedia,
    applyCardMediaLayout,
    applyOutgoingCardMediaLayout,
    setUiMotionProfile,
    applyContentPositions,
    applyContent,
    showRich,
    hideRich,
    morphCore,
    morphTo,
    getCurrentShape: () => currentShape,
    setCurrentShape: (value) => { currentShape = value; },
    getLastMainGeo: () => lastMainGeo,
    setLastMainGeo: (value) => { lastMainGeo = value; },
    getSplitBridgeTimer: () => splitBridgeTimer,
    setSplitBridgeTimer: (value) => { splitBridgeTimer = value; },
    getListBridgeTimer: () => listBridgeTimer,
    setListBridgeTimer: (value) => { listBridgeTimer = value; },
    getThinkingBridgeTimer: () => thinkingBridgeTimer,
    setThinkingBridgeTimer: (value) => { thinkingBridgeTimer = value; },
    getSuppressDeformation: () => suppressDeformation,
    setSuppressDeformation: (value) => { suppressDeformation = !!value; },
    cancelMainDeformation: () => { if (mainDeformAnim) { mainDeformAnim.cancel(); mainDeformAnim = null; } },
  };
}
