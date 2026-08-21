import {
  SHAPES,
  defaultTypographyForShape,
  normalizeTypography,
  normalizeStageImage,
  normalizeStageImages,
  normalizeIcon,
} from '../shapes.js';

function isNudgeStageId(value) {
  const id = String(value || '').trim().toLowerCase();
  return id === 'nudge' || id.startsWith('nudge-');
}

export function createMorphLayout(ctx) {
  const { C, detailMeasureEl, constants, callbacks, state } = ctx;
  const {
    P, PILL_NO_ICON_P, PILL_ICON_P, CARD_P, CARD_MEDIA_BOTTOM_P, CARD_DIVIDER_GAP,
    CARD_PRIMARY_GAP, CARD_PRIMARY_TO_SECONDARY_GAP, CARD_SECONDARY_TO_DETAIL_GAP,
    CARD_DETAIL_TO_MEDIA_GAP, CARD_MEDIA_STACK_GAP, TS, TBR, GAP,
  } = constants;

  function contentPos(shape, w, h) {
    if (shape === 'idle') return { thumb:{ x:w/2, y:h/2, w:0, h:0, br:'0px', op:0 }, prim:{ x:w/2, y:h/2, op:0, fs:28, cx:true }, sec:{ x:w/2, y:h/2, op:0, fs:24, cx:true }, div:{ x:w/2, y:h/2, dw:0, op:0 }, det:{ x:w/2, y:h/2, op:0, fs:24, cx:true } };
    if (shape === 'timer') {
      const typography = normalizeTypography(state.contentTypographyState, 'timer');
      const dotSize = 10;
      const dotGap = 12;
      const primarySize = typography.primary.size || 24;
      const primaryText = String(C.prim.textContent || '').trim();
      const primaryWidth = primaryText ? measureSingleLineWidth(primaryText, primarySize, 500) : 0;
      const primaryHeight = measureLineHeight(primarySize, 1.1);
      const rowWidth = dotSize + dotGap + primaryWidth;
      const rowX = Math.round((w - rowWidth) / 2);
      return {
        thumb:{ x:rowX, y:Math.round((h - dotSize) / 2), w:dotSize, h:dotSize, br:'999px', op:1 },
        prim:{ x:rowX + dotSize + dotGap, y:Math.round((h - primaryHeight) / 2), op:1, fs:primarySize, cx:false },
        sec:{ x:w/2, y:h/2, op:0, fs:24, cx:true },
        div:{ x:w/2, y:h/2, dw:0, op:0 },
        det:{ x:w/2, y:h/2, op:0, fs:24, cx:true },
      };
    }
    if (shape === 'list') {
      const scenario = callbacks.selectedScenario?.();
      const showListOrb = !!callbacks.stageListListeningOrbForShape?.(scenario, scenario?.shape || 'list');
      return {
        thumb:{ x:(w-TS)/2, y:(h-TS)/2, w:TS, h:TS, br:TBR, op:showListOrb ? 1 : 0 },
        prim:{ x:w/2, y:h/2, op:0, fs:28, cx:true },
        sec:{ x:w/2, y:h/2, op:0, fs:24, cx:true },
        div:{ x:P, y:h/2, dw:0, op:0 },
        det:{ x:w/2, y:h/2, op:0, fs:24, cx:true },
      };
    }
    if (['circle', 'magic', 'listening', 'dot'].includes(shape)) return { thumb:{ x:(w-TS)/2, y:(h-TS)/2, w:TS, h:TS, br:TBR, op:1 }, prim:{ x:w/2, y:h/2, op:0, fs:28, cx:true }, sec:{ x:w/2, y:h/2, op:0, fs:24, cx:true }, div:{ x:P, y:h/2, dw:0, op:0 }, det:{ x:w/2, y:h/2, op:0, fs:24, cx:true } };
    if (shape === 'pill') {
      const activeStageId = String(callbacks.selectedScenario?.()?.shape || '');
      if (isNudgeStageId(activeStageId)) {
        const typography = normalizeTypography(state.contentTypographyState, 'pill');
        const leftPad = 24;
        const rightPad = 24;
        const primaryToDividerGap = 12;
        const dividerToSecondaryGap = 14;
        const dividerWidth = 1;
        const dividerHeight = Math.max(18, Math.round(typography.primary.size * 0.9));
        const primaryText = String(C.prim.textContent || '').trim();
        const secondaryText = String(C.sec.textContent || '').trim();
        const primaryWidth = primaryText ? measureSingleLineWidth(primaryText, typography.primary.size, 500) : 0;
        const secondaryWidth = secondaryText ? measureSingleLineWidth(secondaryText, typography.secondary.size, 400) : 0;
        const primaryHeight = measureLineHeight(typography.primary.size, 1.1);
        const secondaryHeight = measureLineHeight(typography.secondary.size, 1.2);
        const rowWidth = primaryWidth
          + (primaryText && secondaryText ? (primaryToDividerGap + dividerWidth + dividerToSecondaryGap) : 0)
          + secondaryWidth;
        const primaryX = Math.max(leftPad, Math.round((w - rightPad - rowWidth) / 2));
        const dividerX = primaryX + primaryWidth + primaryToDividerGap;
        const secondaryX = primaryText && secondaryText ? (dividerX + dividerWidth + dividerToSecondaryGap) : primaryX;
        const dividerOp = primaryText && secondaryText ? 1 : 0;
        return {
          thumb:{ x:leftPad, y:(h-TS)/2, w:TS, h:TS, br:TBR, op:0 },
          prim:{ x:primaryX, y:Math.round((h - primaryHeight) / 2), op:primaryText ? 1 : 0, fs:typography.primary.size, cx:false },
          sec:{ x:secondaryX, y:Math.round((h - secondaryHeight) / 2), op:secondaryText ? 1 : 0, fs:typography.secondary.size, cx:false },
          div:{ x:dividerX, y:Math.round((h - dividerHeight) / 2), dw:dividerWidth, op:dividerOp, dh:dividerHeight },
          det:{ x:secondaryX, y:Math.round((h - secondaryHeight) / 2), op:0, fs:typography.detail.size, cx:false },
        };
      }
      const isAiHomeContext = document.body?.dataset?.pageMode === 'ai' && document.body?.dataset?.aiHomeState === 'context';
      if (isAiHomeContext) {
        const primarySize = 20;
        const secondarySize = 18;
        const dotSize = 10;
        const leftPad = 24;
        const rightPad = 24;
        const dotToPrimaryGap = 10;
        const primaryToDividerGap = 10;
        const dividerToSecondaryGap = 10;
        const dividerWidth = 1;
        const dividerHeight = 26;
        const iconY = Math.round((h - dotSize) / 2);
        const primaryText = String(C.prim.textContent || '').trim();
        const secondaryText = String(C.sec.textContent || '').trim();
        const primaryWidth = primaryText ? measureSingleLineWidth(primaryText, primarySize, 600) : 0;
        const primaryX = leftPad + dotSize + dotToPrimaryGap;
        const dividerX = primaryX + primaryWidth + primaryToDividerGap;
        const secondaryX = dividerX + dividerWidth + dividerToSecondaryGap;
        const dividerOp = primaryText && secondaryText ? 1 : 0;
        const fallbackSecondaryX = primaryText ? secondaryX : primaryX;
        const rowYPrimary = Math.round((h - 26) / 2);
        const rowYSecondary = 11.5;
        return {
          thumb:{ x:leftPad, y:iconY, w:6, h:6, br:'3px', op:1 },
          prim:{ x:primaryX, y:rowYPrimary, op:primaryText ? 1 : 0, fs:primarySize, cx:false },
          sec:{ x:fallbackSecondaryX, y:rowYSecondary, op:secondaryText ? 1 : 0, fs:secondarySize, cx:false },
          div:{ x:dividerX, y:Math.round((h - dividerHeight) / 2), dw:dividerWidth, op:dividerOp, dh:dividerHeight },
          det:{ x:fallbackSecondaryX, y:rowYSecondary, op:0, fs:secondarySize, cx:false },
        };
      }
      const typography = normalizeTypography(state.contentTypographyState, 'pill');
      const gap = callbacks.stageIconTextGap(callbacks.selectedScenario()?.shape, 'pill');
      const iconLeft = callbacks.stageIconLeftPadding(callbacks.selectedScenario()?.shape, 'pill');
      const hasIcon = hasIconContent(state.thumbContentState);
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
      return { thumb:{ x:iconLeft, y:tY, w:TS, h:TS, br:TBR, op:hasIcon ? 1 : 0 }, prim:{ x:textX, y:pY, op:1, fs:typography.primary.size, cx:false }, sec:{ x:textX, y:sY, op:1, fs:typography.secondary.size, cx:false }, div:{ x:P, y:h/2, dw:0, op:0 }, det:{ x:textX, y:sY, op:0, fs:typography.detail.size, cx:false } };
    }
    if (shape === 'card') {
      const typography = normalizeTypography(state.contentTypographyState, 'card');
      const layout = getCardLayoutMetrics(w, typography, C.det.textContent, state.stageMediaState, C.prim.textContent, C.sec.textContent, state.thumbContentState);
      const cardTextX = CARD_P;
      const hasPrimary = !!String(C.prim.textContent || '').trim();
      const hasSecondary = !!String(C.sec.textContent || '').trim();
      const hasIcon = hasIconContent(state.thumbContentState);
      return { thumb:{ x:CARD_P, y:CARD_P, w:TS, h:TS, br:TBR, op:layout.hasTopRow && hasIcon ? 1 : 0 }, prim:{ x:cardTextX, y:layout.primaryTop, op:hasPrimary ? 1 : 0, fs:typography.primary.size, cx:false }, sec:{ x:cardTextX, y:layout.secondaryTop, op:hasSecondary ? 1 : 0, fs:typography.secondary.size, cx:false }, div:{ x:CARD_P, y:layout.dividerY, dw:w-CARD_P*2, op:layout.hasTopRow ? 1 : 0 }, det:{ x:CARD_P, y:layout.detailTop, op:String(C.det.textContent || '').trim() ? 1 : 0, fs:typography.detail.size, cx:false } };
    }
    if (shape === 'card-s') {
      const typography = normalizeTypography(state.contentTypographyState, 'card-s');
      const gap = callbacks.stageIconTextGap(callbacks.selectedScenario()?.shape, 'card-s');
      const iconLeft = callbacks.stageIconLeftPadding(callbacks.selectedScenario()?.shape, 'card-s');
      const layout = getCardSLayoutMetrics(w, typography, C.det.textContent, state.stageMediaState, C.prim.textContent, C.sec.textContent, state.thumbContentState);
      const hasIcon = hasIconContent(state.thumbContentState);
      const textX = hasIcon ? (iconLeft + TS + gap) : CARD_P;
      const hasPrimary = !!String(C.prim.textContent || '').trim();
      const hasSecondary = !!String(C.sec.textContent || '').trim();
      return { thumb:{ x:iconLeft, y:CARD_P, w:TS, h:TS, br:TBR, op:layout.hasTopRow && hasIcon ? 1 : 0 }, prim:{ x:textX, y:layout.primaryTop, op:layout.hasTopRow && hasPrimary ? 1 : 0, fs:typography.primary.size, cx:false }, sec:{ x:textX, y:layout.secondaryTop, op:layout.hasTopRow && hasSecondary ? 1 : 0, fs:typography.secondary.size, cx:false }, div:{ x:CARD_P, y:layout.dividerY, dw:w-CARD_P*2, op:layout.hasTopRow ? 1 : 0 }, det:{ x:CARD_P, y:layout.detailTop, op:String(C.det.textContent || '').trim() ? 1 : 0, fs:typography.detail.size, cx:false } };
    }
    if (shape === 'image') return { thumb:{ x:CARD_P, y:CARD_P, w:0, h:0, br:'0px', op:0 }, prim:{ x:CARD_P, y:CARD_P, op:0, fs:28, cx:false }, sec:{ x:CARD_P, y:CARD_P, op:0, fs:24, cx:false }, div:{ x:CARD_P, y:CARD_P, dw:0, op:0 }, det:{ x:CARD_P, y:CARD_P, op:0, fs:24, cx:false } };
    return { thumb:{ x:(w-TS)/2, y:(h-TS)/2, w:TS, h:TS, br:TBR, op:0 }, prim:{ x:P, y:P, op:0, fs:28, cx:false }, sec:{ x:P, y:P+40, op:0, fs:24, cx:false }, div:{ x:P, y:P+TS+8, dw:0, op:0 }, det:{ x:P, y:P+80, op:0, fs:24, cx:false } };
  }

  function setThumbContent(iconValue) {
    state.thumbContentState = normalizeIcon(iconValue);
    const isImage = state.thumbContentState.kind === 'image' && !!state.thumbContentState.value;
    const isText = state.thumbContentState.kind === 'emoji' && !!state.thumbContentState.value;
    C.thumb.classList.toggle('thumb-image', isImage);
    C.thumbLabel.textContent = isText ? state.thumbContentState.value : '';
    if (isImage) C.thumbImg.src = state.thumbContentState.value;
    else C.thumbImg.removeAttribute('src');
  }

  function setContentTypography(typographyValue, shape = state.currentShape) {
    state.contentTypographyState = normalizeTypography(typographyValue, shape);
  }

  function setStageMedia(imageValue) {
    state.stageMediaState = normalizeStageImages(Array.isArray(imageValue) ? imageValue : (imageValue ? [imageValue] : []));
    if (state.stageMediaState[0]) C.media.src = state.stageMediaState[0].src;
    else C.media.removeAttribute('src');
  }

  function getScenarioTypography(scenario, shape = scenario?.shape || state.currentShape) {
    const renderShape = callbacks.renderShapeForStageId(shape) || shape;
    return normalizeTypography(scenario?.content?.typographyByShape?.[shape], renderShape);
  }

  function cardImagePadding(shape = state.currentShape, scenario = callbacks.selectedScenario?.()) {
    const stageId = scenario?.shape || callbacks.selectedScenario?.()?.shape || shape;
    const value = callbacks.stageCardImagePaddingForShape?.(scenario, stageId);
    return Number.isFinite(Number(value)) ? Math.max(0, Math.min(120, Math.round(Number(value)))) : CARD_P;
  }

  const cardDetailTextWidth = (cardWidth) => Math.max(120, cardWidth - CARD_P * 2);
  function lineTextWidth(shape, width) {
    const hasIcon = hasIconContent(state.thumbContentState);
    if (shape === 'pill') {
      const textX = hasIcon ? (callbacks.stageIconLeftPadding(callbacks.selectedScenario()?.shape, 'pill') + TS + callbacks.stageIconTextGap(callbacks.selectedScenario()?.shape, 'pill')) : PILL_NO_ICON_P;
      return Math.max(120, width - textX - P);
    }
    if (shape === 'card') return Math.max(120, width - CARD_P * 2);
    if (shape === 'card-s') {
      const textX = hasIcon ? (callbacks.stageIconLeftPadding(callbacks.selectedScenario()?.shape, 'card-s') + TS + callbacks.stageIconTextGap(callbacks.selectedScenario()?.shape, 'card-s')) : CARD_P;
      return Math.max(120, width - textX - CARD_P);
    }
    return null;
  }

  const cardMediaWidth = (cardWidth, shape = 'card', mediaPadding = cardImagePadding(shape)) => Math.max(shape === 'image' ? 40 : 120, cardWidth - mediaPadding * 2);
  const measureLineHeight = (fontSize, lineHeight = 1.2) => Math.ceil(Number(fontSize || 0) * lineHeight);
  const measureSingleLineWidth = (text, fontSize, fontWeight = 400) => {
    const value = String(text || '').trim();
    if (!value) return 0;
    detailMeasureEl.style.width = 'auto';
    detailMeasureEl.style.maxWidth = 'none';
    detailMeasureEl.style.whiteSpace = 'nowrap';
    detailMeasureEl.style.wordBreak = 'normal';
    detailMeasureEl.style.fontSize = `${fontSize}px`;
    detailMeasureEl.style.fontWeight = String(fontWeight);
    detailMeasureEl.textContent = value;
    return Math.ceil(detailMeasureEl.getBoundingClientRect().width);
  };
  const measureCardMediaHeight = (imageValue, cardWidth, shape = 'card', mediaPadding = cardImagePadding(shape)) => {
    const image = normalizeStageImage(imageValue);
    return image ? Math.ceil(cardMediaWidth(cardWidth, shape, mediaPadding) * (image.height / image.width)) : 0;
  };
  const measureCardMediaHeights = (imagesValue, cardWidth, shape = 'card', mediaPadding = cardImagePadding(shape)) => normalizeStageImages(Array.isArray(imagesValue) ? imagesValue : (imagesValue ? [imagesValue] : [])).map((image) => measureCardMediaHeight(image, cardWidth, shape, mediaPadding)).filter((height) => height > 0);
  const mediaStackHeight = (mediaHeights) => !Array.isArray(mediaHeights) || !mediaHeights.length ? 0 : mediaHeights.reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * Math.max(0, mediaHeights.length - 1);

  function measureCardDetailHeight(detailText, typography, cardWidth) {
    const text = String(detailText || '');
    if (!text.trim()) return 0;
    detailMeasureEl.style.width = `${cardDetailTextWidth(cardWidth)}px`;
    detailMeasureEl.style.fontSize = `${typography.detail.size}px`;
    detailMeasureEl.style.lineHeight = '1.4';
    detailMeasureEl.style.whiteSpace = 'pre-wrap';
    detailMeasureEl.style.wordBreak = 'break-word';
    detailMeasureEl.textContent = text;
    return Math.ceil(detailMeasureEl.getBoundingClientRect().height);
  }

  const hasIconContent = (iconValue) => {
    const icon = normalizeIcon(iconValue);
    return icon.kind !== 'none' && String(icon.value || '').trim().length > 0;
  };

  function getCardLayoutMetrics(cardWidth, typography, detailText = '', imageValue = null, primaryText = '', secondaryText = '', iconValue = null) {
    const mediaPadding = cardImagePadding('card');
    const hasPrimary = !!String(primaryText || '').trim();
    const hasSecondary = !!String(secondaryText || '').trim();
    const hasTopRow = hasIconContent(iconValue);
    const hasDetailText = String(detailText || '').trim().length > 0;
    const primaryHeight = measureLineHeight(typography.primary.size, 1.1);
    const secondaryHeight = measureLineHeight(typography.secondary.size, 1.2);
    const detailHeight = measureCardDetailHeight(detailText, typography, cardWidth);
    const mediaHeights = measureCardMediaHeights(imageValue, cardWidth, 'card', mediaPadding);
    const mediaHeight = mediaStackHeight(mediaHeights);
    const dividerY = hasTopRow ? (CARD_P + TS + CARD_DIVIDER_GAP) : CARD_P;
    const bodyStart = hasTopRow ? (dividerY + CARD_PRIMARY_GAP) : CARD_P;
    let cursorY = bodyStart;
    let primaryTop = bodyStart;
    let secondaryTop = bodyStart;
    if (hasPrimary) { primaryTop = cursorY; cursorY += primaryHeight; }
    if (hasSecondary) { if (hasPrimary) cursorY += CARD_PRIMARY_TO_SECONDARY_GAP; secondaryTop = cursorY; cursorY += secondaryHeight; }
    const detailTop = hasDetailText ? ((hasPrimary || hasSecondary) ? (cursorY + CARD_SECONDARY_TO_DETAIL_GAP) : bodyStart) : bodyStart;
    const mediaTop = hasDetailText ? detailTop + detailHeight + CARD_DETAIL_TO_MEDIA_GAP : ((hasPrimary || hasSecondary) ? (cursorY + CARD_DETAIL_TO_MEDIA_GAP) : mediaPadding);
    const contentBottom = mediaHeight > 0 ? mediaTop + mediaHeight : (detailHeight > 0 ? detailTop + detailHeight : ((hasPrimary || hasSecondary) ? cursorY : bodyStart));
    const bottomPadding = mediaHeight > 0 ? CARD_MEDIA_BOTTOM_P : CARD_P;
    return { hasTopRow, dividerY, primaryTop, secondaryTop, detailTop, detailHeight, mediaTop, mediaTops: mediaHeights.map((_, index) => mediaTop + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index), mediaHeights, mediaHeight, neededHeight: contentBottom + bottomPadding };
  }

  function getCardSLayoutMetrics(cardWidth, typography, detailText = '', imageValue = null, primaryText = '', secondaryText = '', iconValue = null) {
    const mediaPadding = cardImagePadding('card-s');
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
    const mediaHeights = measureCardMediaHeights(imageValue, cardWidth, 'card-s', mediaPadding);
    const mediaHeight = mediaStackHeight(mediaHeights);
    const hasDetailText = String(detailText || '').trim().length > 0;
    const mediaTop = hasDetailText ? detailTop + detailHeight + CARD_DETAIL_TO_MEDIA_GAP : (hasTopRow ? detailTop : mediaPadding);
    const contentBottom = mediaHeight > 0 ? mediaTop + mediaHeight : (detailHeight > 0 ? detailTop + detailHeight : (hasTopRow ? dividerY : CARD_P));
    const bottomPadding = mediaHeight > 0 ? CARD_MEDIA_BOTTOM_P : CARD_P;
    return { hasTopRow, dividerY, primaryTop, secondaryTop, detailTop, detailHeight, mediaTop, mediaTops: mediaHeights.map((_, index) => mediaTop + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index), mediaHeights, mediaHeight, neededHeight: contentBottom + bottomPadding };
  }

  function stageCornerRadiusPx(stageId, fallbackBr) {
    const stage = callbacks.stageById(stageId);
    if (!stage) return fallbackBr;
    const radius = Number(stage.cornerRadius);
    return Number.isFinite(radius) ? `${callbacks.clamp(Math.round(radius), 0, 120)}px` : fallbackBr;
  }

  function withStageSizeOverride(geo, stageId, scenario = callbacks.selectedScenario(), sizeOverride = null) {
    if (!stageId) return geo;
    const stage = callbacks.stageById(stageId);
    if (!stage) return geo;
    const normalizedOverride = callbacks.normalizeStageSizeEntry(sizeOverride);
    const width = Number.isFinite(normalizedOverride.widthOverride) ? normalizedOverride.widthOverride : callbacks.stageMainSize(stage, scenario).width;
    const height = Number.isFinite(normalizedOverride.heightOverride) ? normalizedOverride.heightOverride : callbacks.stageMainSize(stage, scenario).height;
    if (width === geo.main.w && height === geo.main.h) return geo;
    return { ...geo, main:{ ...geo.main, w:width, h:height, tx:-(width/2), ty:-(height/2) } };
  }

  function resolveGeometryForContent(shape, contentData, customGeo, stageId = null) {
    const scenario = callbacks.selectedScenario();
    const showListOrb = !customGeo && shape === 'list' && !!callbacks.stageListListeningOrbForShape?.(scenario, stageId || shape);
    const rawGeo = customGeo || (showListOrb ? SHAPES.circle : (SHAPES[shape] || SHAPES.card));
    const stageSizeOverride = callbacks.normalizeStageSizeEntry(contentData?.sizeOverride, callbacks.scenarioStageSizeOverride(scenario, stageId));
    const baseGeo = customGeo ? rawGeo : withStageSizeOverride(rawGeo, stageId, scenario, stageSizeOverride);
    const resolvedBaseGeo = shape === 'idle' && !customGeo
      ? {
        ...baseGeo,
        main: {
          ...baseGeo.main,
          w: 40,
          h: 40,
          br: '20px',
          tx: -20,
          ty: -20,
        },
      }
      : baseGeo;
    const hasHeightOverride = Number.isFinite(stageSizeOverride.heightOverride);
    const withStageRadius = (geo) => {
      if (!stageId) return geo;
      const nextRadius = stageCornerRadiusPx(stageId, geo.main.br);
      return nextRadius === geo.main.br ? geo : { ...geo, main:{ ...geo.main, br: nextRadius } };
    };
    if (showListOrb) {
      return rawGeo;
    }
    if ((shape !== 'card' && shape !== 'card-s' && shape !== 'image') || customGeo) {
      return withStageRadius(resolvedBaseGeo);
    }

    const detailText = contentData?.detail !== undefined ? contentData.detail : C.det.textContent;
    const typography = normalizeTypography(contentData?.typography || state.contentTypographyState, shape);
    const mediaValue = contentData?.images !== undefined
      ? contentData.images
      : (contentData?.image !== undefined ? [contentData.image] : state.stageMediaState);
    const primaryText = contentData?.primary !== undefined ? contentData.primary : C.prim.textContent;
    const secondaryText = contentData?.secondary !== undefined ? contentData.secondary : C.sec.textContent;
    const iconValue = contentData?.icon !== undefined ? contentData.icon : state.thumbContentState;

    if (shape === 'image') {
      if (hasHeightOverride) return withStageRadius(resolvedBaseGeo);
      const mediaPadding = cardImagePadding('image', scenario);
      const mediaHeight = mediaStackHeight(measureCardMediaHeights(mediaValue, baseGeo.main.w, 'image', mediaPadding));
      if (!mediaHeight) return withStageRadius(resolvedBaseGeo);
      const neededHeight = mediaHeight + mediaPadding * 2;
      if (neededHeight === baseGeo.main.h) return withStageRadius(resolvedBaseGeo);
      return withStageRadius({
        ...resolvedBaseGeo,
        main: {
          ...resolvedBaseGeo.main,
          h: neededHeight,
          ty: -(neededHeight / 2),
        },
      });
    }

    const layoutMetrics = shape === 'card-s'
      ? getCardSLayoutMetrics(baseGeo.main.w, typography, detailText, mediaValue, primaryText, secondaryText, iconValue)
      : getCardLayoutMetrics(baseGeo.main.w, typography, detailText, mediaValue, primaryText, secondaryText, iconValue);
    const hasDetailText = String(detailText || '').trim().length > 0;
    const hasMedia = layoutMetrics.mediaHeight > 0;
    const baselineLayout = shape === 'card-s'
      ? getCardSLayoutMetrics(baseGeo.main.w, defaultTypographyForShape(shape), detailText, mediaValue, primaryText, secondaryText, iconValue)
      : getCardLayoutMetrics(baseGeo.main.w, defaultTypographyForShape(shape), detailText, mediaValue, primaryText, secondaryText, iconValue);
    const neededHeight = (shape === 'card-s')
      ? Math.ceil(layoutMetrics.neededHeight)
      : (!hasDetailText && !hasMedia)
      ? Math.ceil(layoutMetrics.neededHeight)
      : Math.max(
        Math.round(baseGeo.main.h + (layoutMetrics.neededHeight - baselineLayout.neededHeight)),
        Math.ceil(layoutMetrics.neededHeight)
      );
    if (hasHeightOverride) return withStageRadius(resolvedBaseGeo);
    if (neededHeight === baseGeo.main.h) return withStageRadius(resolvedBaseGeo);
    return withStageRadius({
      ...resolvedBaseGeo,
      main: {
        ...resolvedBaseGeo.main,
        h: neededHeight,
        ty: -(neededHeight / 2),
      },
    });
  }

  function scenarioToRenderContent(scenario) {
    const shape = scenario?.shape || 'pill';
    const stage = callbacks.stageById?.(shape);
    const showListOrbIcon = stage?.renderShape === 'list' && stage?.listListeningOrb === true;
    const has = (component) => {
      if (!stage) return true;
      return (stage.components || []).includes(component);
    };
    const text = callbacks.stageTextForShape(scenario, shape);
    return {
      icon: (has('icon') || showListOrbIcon) ? callbacks.stageIconForShape(scenario, shape) : callbacks.createIcon('none', ''),
      listChipIcons: has('icon') ? callbacks.stageListChipIconsForShape?.(scenario, shape) : null,
      listItems: callbacks.stageListItemsForShape?.(scenario, shape) || [],
      primary: has('primary') ? text.primary : '',
      secondary: has('secondary') ? text.secondary : '',
      detail: has('detail') ? text.detail : '',
      images: has('image') ? callbacks.stageImagesForShape(scenario, shape) : [],
      actionCardActions: has('action-row') ? (scenario?.content?.actionCardActionsByShape?.[shape] || { left: 'Snooze', right: 'Join now →' }) : null,
      typography: getScenarioTypography(scenario, shape),
      sizeOverride: callbacks.scenarioStageSizeOverride(scenario, shape),
      scenario,
    };
  }

  return {
    contentPos,
    setThumbContent,
    setContentTypography,
    setStageMedia,
    getScenarioTypography,
    cardDetailTextWidth,
    cardImagePadding,
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
  };
}
