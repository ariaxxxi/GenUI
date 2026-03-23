import { SHAPES, normalizeTypography, normalizeStageImages } from '../shapes.js';

export function createMorphRender(ctx) {
  const { DROPS, C, constants, callbacks, state, layout, bridges } = ctx;
  const { CARD_P, CARD_MEDIA_STACK_GAP, BOTTOM_ALIGN_REF_H, TS } = constants;
  const uiFadeTimers = state.uiFadeTimers;

  function applyGeometry(shape, resolvedGeo, stageId = null) {
    const geo = resolvedGeo || SHAPES[shape] || SHAPES.card;
    const mainRadius = stageId ? layout.stageCornerRadiusPx(stageId, geo.main.br) : geo.main.br;
    const bottomAlignRef = callbacks.getBottomAlignRefHeight?.() || BOTTOM_ALIGN_REF_H;
    const useBottomAlign = !!callbacks.getCanvasSettings()?.bottomAlign;
    const alignedStageHeight = useBottomAlign ? Math.max(bottomAlignRef, geo.main.h, SHAPES.dot.main.h) : geo.main.h;
    ['main', 'left', 'right'].forEach((k) => {
      const el = DROPS[k], s = geo[k];
      const anchorHeight = (shape === 'idle' && k === 'main') ? SHAPES.dot.main.h : s.h;
      const yOffset = useBottomAlign ? ((alignedStageHeight - anchorHeight) / 2) : 0;
      el.style.width = `${s.w}px`;
      el.style.height = `${s.h}px`;
      el.style.borderRadius = k === 'main' ? mainRadius : s.br;
      el.style.transform = `translate(${s.tx}px,${s.ty + yOffset}px)`;
      el.style.opacity = s.op;
      el.style.pointerEvents = s.op > 0 ? 'auto' : 'none';
    });
    const stage = document.getElementById('stage');
    if (stage) stage.style.height = `${alignedStageHeight}px`;
    state.lastMainGeo = { ...geo.main };
  }

  const clearUiFadeTimers = () => { while (uiFadeTimers.length) clearTimeout(uiFadeTimers.pop()); };
  const applyCardDetailLayout = (cardWidth) => {
    C.det.style.width = `${layout.cardDetailTextWidth(cardWidth)}px`;
    C.det.style.maxWidth = `${layout.cardDetailTextWidth(cardWidth)}px`;
    C.det.style.whiteSpace = 'normal';
    C.det.style.wordBreak = 'break-word';
  };
  const resetDetailInlineLayout = () => {
    C.det.style.width = '';
    C.det.style.maxWidth = '';
    C.det.style.whiteSpace = 'nowrap';
    C.det.style.wordBreak = '';
  };

  function setOpacityWithDelay(el, targetOpacity, inDelayMs = 0, outDelayMs = 0) {
    const target = Number(targetOpacity) || 0;
    const current = parseFloat(getComputedStyle(el).opacity);
    if (target <= 0) {
      if (outDelayMs > 0 && Number.isFinite(current) && current > 0.02) {
        uiFadeTimers.push(setTimeout(() => { el.style.opacity = '0'; }, outDelayMs));
        return;
      }
      el.style.opacity = '0';
      return;
    }
    if (inDelayMs <= 0) return void (el.style.opacity = String(target));
    if (Number.isFinite(current) && current <= 0.02) {
      el.style.opacity = '0';
      uiFadeTimers.push(setTimeout(() => { el.style.opacity = String(target); }, inDelayMs));
      return;
    }
    el.style.opacity = String(target);
  }

  function isIconOnlyThumb(shape) {
    if (state.thumbContentState.kind === 'image' && state.thumbContentState.value) return ['circle', 'magic', 'listening', 'dot', 'pill', 'card', 'card-s', 'card-form', 'card-list', 'custom'].includes(shape);
    const icon = (C.thumbLabel.textContent || '').trim();
    return !!icon && icon !== '···' && ['circle', 'magic', 'listening', 'dot', 'pill', 'card', 'card-s', 'card-form', 'card-list', 'custom'].includes(shape);
  }

  function applyThumbVisualMode(shape) {
    const icon = state.thumbContentState.kind === 'image' ? '__image__' : (C.thumbLabel.textContent || '').trim();
    const homeEmpty = (shape === 'circle' || shape === 'listening') && !icon;
    C.thumb.classList.toggle('thumb-empty', homeEmpty);
    const plain = isIconOnlyThumb(shape);
    C.thumb.classList.toggle('thumb-plain-icon', plain && !homeEmpty);
    if (!plain || homeEmpty) { C.thumb.style.fontSize = ''; C.thumb.style.color = ''; return; }
    C.thumb.style.fontSize = `${({ circle:42, listening:42, magic:42, dot:42, pill:40, card:48, 'card-s':48, 'card-form':48, 'card-list':48, custom:40 })[shape] || 40}px`;
  }

  function applyTypographyStyles(shape) {
    const typography = normalizeTypography(state.contentTypographyState, shape);
    C.thumb.style.color = typography.icon.color;
    if (state.thumbContentState.kind !== 'image') {
      C.thumb.style.fontSize = `${typography.icon.size}px`;
      C.thumbImg.style.width = '';
      C.thumbImg.style.height = '';
    } else {
      C.thumbImg.style.width = `${typography.icon.size}px`;
      C.thumbImg.style.height = `${typography.icon.size}px`;
    }
    C.prim.style.fontSize = `${typography.primary.size}px`; C.prim.style.color = typography.primary.color;
    C.sec.style.fontSize = `${typography.secondary.size}px`; C.sec.style.color = typography.secondary.color;
    C.det.style.fontSize = `${typography.detail.size}px`; C.det.style.color = typography.detail.color;
  }

  function ensureStageMediaEls(count) {
    const stage = document.getElementById('stage');
    if (!stage) return [C.media];
    const existing = Array.from(stage.querySelectorAll('.c-media-extra'));
    const neededExtra = Math.max(0, count - 1);
    while (existing.length < neededExtra) { const img = document.createElement('img'); img.className = 'c-media-extra'; img.alt = ''; stage.appendChild(img); existing.push(img); }
    while (existing.length > neededExtra) { const el = existing.pop(); if (el) el.remove(); }
    return [C.media, ...existing];
  }

  function hideAllStageMedia() {
    ensureStageMediaEls(1).forEach((el) => {
      el.style.display = 'none'; el.style.opacity = '0'; el.style.width = ''; el.style.height = ''; el.style.transform = '';
      if (el !== C.media) el.removeAttribute('src');
    });
  }

  function applyCardMediaLayout(cardWidth, shape = 'card') {
    const images = normalizeStageImages(state.stageMediaState);
    const mediaHeights = layout.measureCardMediaHeights(images, cardWidth, shape);
    const mediaHeight = layout.mediaStackHeight(mediaHeights);
    const typography = normalizeTypography(state.contentTypographyState, shape);
    const metrics = shape === 'image' ? { mediaHeight, mediaHeights, mediaTops: mediaHeights.map((_, index) => CARD_P + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index) } : (shape === 'card-s' ? layout.getCardSLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, state.thumbContentState) : layout.getCardLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, state.thumbContentState));
    if (!images.length || !metrics.mediaHeight) return void hideAllStageMedia();
    ensureStageMediaEls(images.length).forEach((el, idx) => {
      const image = images[idx];
      const mediaHeightValue = metrics.mediaHeights[idx];
      const mediaTop = metrics.mediaTops[idx];
      if (!image || !mediaHeightValue || !Number.isFinite(mediaTop)) { el.style.display = 'none'; el.style.opacity = '0'; return; }
      el.src = image.src; el.style.display = 'block'; el.style.width = `${layout.cardMediaWidth(cardWidth, shape)}px`; el.style.height = `${mediaHeightValue}px`; el.style.transform = `translate(${CARD_P}px,${mediaTop}px)`; el.style.opacity = '1';
    });
  }

  function applyOutgoingCardMediaLayout(imageValue, cardWidth, shape = 'card') {
    const images = normalizeStageImages(Array.isArray(imageValue) ? imageValue : (imageValue ? [imageValue] : []));
    const mediaHeights = layout.measureCardMediaHeights(images, cardWidth, shape);
    const mediaHeight = layout.mediaStackHeight(mediaHeights);
    const typography = normalizeTypography(state.contentTypographyState, shape);
    const metrics = shape === 'image' ? { mediaHeight, mediaHeights, mediaTops: mediaHeights.map((_, index) => CARD_P + mediaHeights.slice(0, index).reduce((sum, h) => sum + h, 0) + CARD_MEDIA_STACK_GAP * index) } : (shape === 'card-s' ? layout.getCardSLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, state.thumbContentState) : layout.getCardLayoutMetrics(cardWidth, typography, C.det.textContent, images, C.prim.textContent, C.sec.textContent, state.thumbContentState));
    if (!images.length || !metrics.mediaHeight) return false;
    ensureStageMediaEls(images.length).forEach((el, idx) => {
      const image = images[idx], mediaHeightValue = metrics.mediaHeights[idx], mediaTop = metrics.mediaTops[idx];
      if (!image || !mediaHeightValue || !Number.isFinite(mediaTop)) { el.style.display = 'none'; el.style.opacity = '0'; return; }
      el.src = image.src; el.style.display = 'block'; el.style.width = `${layout.cardMediaWidth(cardWidth, shape)}px`; el.style.height = `${mediaHeightValue}px`; el.style.transform = `translate(${CARD_P}px,${mediaTop}px)`; el.style.opacity = '0';
    });
    return true;
  }

  function setUiMotionProfile(fromShape, toShape, fromGeo = null, toGeo = null) {
    const root = document.documentElement;
    const transitionMs = bridges.transitionAnimMs(fromShape, toShape, callbacks.getAnimDuration(), fromGeo, toGeo);
    const fromCardLike = fromShape === 'card' || fromShape === 'card-s';
    const toCardLike = toShape === 'card' || toShape === 'card-s';
    let contentFadeMs = 260, detailFadeMs = 260, mediaFadeMs = 260, thumbFadeMs = 280, contentMoveMs = transitionMs, primarySizeAnimMs = transitionMs, textSizeAnimMs = transitionMs, secondaryInAdvanceMs = 0, detailInAdvanceMs = 0;
    if ((fromShape === 'pill' && toCardLike) || (fromCardLike && toShape === 'pill')) { primarySizeAnimMs = clamp(Math.round(transitionMs * 1.2), 420, 900); textSizeAnimMs = clamp(Math.round(transitionMs * 1.08), 360, 820); }
    if (fromShape === 'pill' && toCardLike) { secondaryInAdvanceMs = 60; detailInAdvanceMs = 200; }
    if (fromShape === 'dot' && toCardLike) contentMoveMs = 0;
    if (fromShape === 'image' && toShape === 'pill') contentMoveMs = 0;
    if (fromCardLike && toShape === 'dot') { contentFadeMs = 200; detailFadeMs = 200; }
    if (fromCardLike && toShape === 'pill') mediaFadeMs = transitionMs;
    if ((fromShape === 'idle' && toShape === 'dot') || (fromShape === 'dot' && toShape === 'idle')) thumbFadeMs = 200;
    state.contentDelayProfile = { secondaryInAdvanceMs, detailInAdvanceMs };
    state.currentContentFadeMs = contentFadeMs; state.currentDetailFadeMs = detailFadeMs; state.currentMediaFadeMs = mediaFadeMs; state.currentTransitionAnimMs = transitionMs;
    [['--anim-w', transitionMs], ['--anim-h', transitionMs], ['--anim-br', transitionMs], ['--anim-tx', transitionMs], ['--anim-t', transitionMs]].forEach(([k, v]) => root.style.setProperty(k, `${v}ms var(--spring)`));
    root.style.setProperty('--content-fade-ms', `${contentFadeMs}ms`); root.style.setProperty('--detail-fade-ms', `${detailFadeMs}ms`); root.style.setProperty('--media-fade-ms', `${mediaFadeMs}ms`); root.style.setProperty('--thumb-fade-ms', `${thumbFadeMs}ms`); root.style.setProperty('--content-move-t', `${contentMoveMs}ms var(--spring)`); root.style.setProperty('--primary-size-anim-ms', `${primarySizeAnimMs}ms`); root.style.setProperty('--text-size-anim-ms', `${textSizeAnimMs}ms`);
  }

  function applyContentPositions(shape, w, h, fadeInDelayMs = 0, fadeOutDelayMs = 0, fromShape = shape, fromWidth = w, fromHeight = h, outgoingMedia = null, outgoingTypography = null) {
    const pos = layout.contentPos(shape, w, h);
    C.thumb.style.cssText += `width:${pos.thumb.w}px;height:${pos.thumb.h}px;border-radius:${pos.thumb.br};transform:translate(${pos.thumb.x}px,${pos.thumb.y}px);`;
    applyThumbVisualMode(shape);
    let thumbOpacity = pos.thumb.op;
    if ((shape === 'circle' || shape === 'listening') && state.thumbContentState.kind === 'none') thumbOpacity = 0;
    setOpacityWithDelay(C.thumb, thumbOpacity, fadeInDelayMs, fadeOutDelayMs);
    const setEl = (el, p, customInDelayMs = fadeInDelayMs) => { el.style.transform = p.cx ? `translate(${p.x}px,${p.y}px) translate(-50%,-50%)` : `translate(${p.x}px,${p.y}px)`; setOpacityWithDelay(el, p.op, customInDelayMs, fadeOutDelayMs); if (p.fs) el.style.fontSize = `${p.fs}px`; };
    setEl(C.prim, pos.prim);
    setEl(C.sec, pos.sec, Math.max(0, fadeInDelayMs - (state.contentDelayProfile.secondaryInAdvanceMs || 0)));
    setEl(C.det, pos.det, Math.max(0, fadeInDelayMs - (state.contentDelayProfile.detailInAdvanceMs || 0)));
    applyTypographyStyles(shape);
    const mainLineWidth = layout.lineTextWidth(shape, w);
    ['prim', 'sec'].forEach((key) => {
      const el = C[key];
      el.style.width = mainLineWidth ? `${mainLineWidth}px` : '';
      el.style.maxWidth = mainLineWidth ? `${mainLineWidth}px` : '';
      el.style.overflow = mainLineWidth ? 'hidden' : '';
      el.style.textOverflow = mainLineWidth ? 'ellipsis' : '';
      el.style.whiteSpace = mainLineWidth ? 'nowrap' : '';
    });
    if (shape === 'card' || shape === 'card-s') { applyCardDetailLayout(w); applyCardMediaLayout(w, shape); }
    else if (shape === 'image') { resetDetailInlineLayout(); C.det.style.opacity = '0'; C.div.style.opacity = '0'; C.thumb.style.opacity = '0'; C.prim.style.opacity = '0'; C.sec.style.opacity = '0'; applyCardMediaLayout(w, 'image'); }
    else {
      if (fromShape === 'card' || fromShape === 'card-s') {
        applyCardDetailLayout(fromWidth);
        const outgoingLayout = outgoingTypography ? (fromShape === 'card-s' ? layout.getCardSLayoutMetrics(fromWidth, outgoingTypography, C.det.textContent, outgoingMedia, C.prim.textContent, C.sec.textContent, state.thumbContentState) : layout.getCardLayoutMetrics(fromWidth, outgoingTypography, C.det.textContent, outgoingMedia, C.prim.textContent, C.sec.textContent, state.thumbContentState)) : null;
        if (shape === 'dot' && outgoingTypography && outgoingLayout) {
          const cardSGap = callbacks.stageIconTextGap(callbacks.selectedScenario()?.shape, 'card-s');
          const cardSIconPad = callbacks.stageIconLeftPadding(callbacks.selectedScenario()?.shape, 'card-s');
          const outgoingTextX = fromShape === 'card-s' ? (layout.hasIconContent(state.thumbContentState) ? (cardSIconPad + TS + cardSGap) : CARD_P) : CARD_P;
          const outgoingLineWidth = fromShape === 'card-s' ? Math.max(120, fromWidth - (layout.hasIconContent(state.thumbContentState) ? (cardSIconPad + TS + cardSGap) : CARD_P) - CARD_P) : Math.max(120, fromWidth - CARD_P * 2);
          C.prim.style.transform = `translate(${outgoingTextX}px,${outgoingLayout.primaryTop}px)`; C.sec.style.transform = `translate(${outgoingTextX}px,${outgoingLayout.secondaryTop}px)`;
          C.prim.style.fontSize = `${outgoingTypography.primary.size}px`; C.sec.style.fontSize = `${outgoingTypography.secondary.size}px`; C.prim.style.color = outgoingTypography.primary.color; C.sec.style.color = outgoingTypography.secondary.color;
          C.prim.style.width = `${outgoingLineWidth}px`; C.prim.style.maxWidth = `${outgoingLineWidth}px`; C.sec.style.width = `${outgoingLineWidth}px`; C.sec.style.maxWidth = `${outgoingLineWidth}px`;
        }
        if (outgoingTypography && outgoingLayout) { C.det.style.transform = `translate(${CARD_P}px,${outgoingLayout.detailTop}px)`; C.det.style.fontSize = `${outgoingTypography.detail.size}px`; C.det.style.color = outgoingTypography.detail.color; }
        uiFadeTimers.push(setTimeout(resetDetailInlineLayout, fadeOutDelayMs + state.currentDetailFadeMs));
      } else resetDetailInlineLayout();
      if ((fromShape === 'card' || fromShape === 'card-s') && outgoingMedia && applyOutgoingCardMediaLayout(outgoingMedia, fromWidth, fromShape)) uiFadeTimers.push(setTimeout(() => { hideAllStageMedia(); if (!state.stageMediaState?.length) C.media.removeAttribute('src'); }, fadeOutDelayMs + state.currentMediaFadeMs));
      else hideAllStageMedia();
    }
    C.div.style.transform = `translate(${pos.div.x}px,${pos.div.y}px)`;
    C.div.style.width = `${pos.div.dw || 0}px`;
    setOpacityWithDelay(C.div, pos.div.op, fadeInDelayMs, fadeOutDelayMs);
  }

  function applyContent(data) {
    if (data.icon !== undefined) layout.setThumbContent(data.icon);
    if (data.primary !== undefined) C.prim.textContent = data.primary;
    if (data.secondary !== undefined) C.sec.textContent = data.secondary;
    if (data.detail !== undefined) C.det.textContent = data.detail;
    if (data.images !== undefined) layout.setStageMedia(data.images);
    else if (data.image !== undefined) layout.setStageMedia(data.image ? [data.image] : []);
    if (data.typography !== undefined) layout.setContentTypography(data.typography, state.currentShape);
  }

  function showRich(html) {
    C.rich.style.opacity = '0';
    C.rich.innerHTML = html;
    C.rich.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => { C.rich.style.opacity = '1'; }));
  }

  function hideRich() {
    if (callbacks.shouldPreserveRich?.()) return;
    C.rich.style.opacity = '0';
    setTimeout(() => {
      if (callbacks.shouldPreserveRich?.()) return;
      C.rich.classList.remove('visible');
      C.rich.innerHTML = '';
    }, 220);
  }

  function morphCore(shape, contentData, customGeo, skipActiveUpdate = false, uiFadeDelayMs = null, stageId = null) {
    clearUiFadeTimers();
    const fromShape = state.currentShape;
    const prevStageMedia = Array.isArray(state.stageMediaState) ? state.stageMediaState.map((item) => ({ ...item })) : [];
    const prevCardTypography = fromShape === 'card' ? normalizeTypography(state.contentTypographyState, 'card') : null;
    const prevGeo = bridges.getCurrentMainGeometry();
    const nextGeo = layout.resolveGeometryForContent(shape, contentData, customGeo, stageId);
    setUiMotionProfile(fromShape, shape, prevGeo, nextGeo);
    const prevArea = Math.max(1, prevGeo.w * prevGeo.h);
    const nextArea = Math.max(1, nextGeo.main.w * nextGeo.main.h);
    const autoInDelay = fromShape === 'dot' && shape === 'pill' ? 180 : (fromShape === 'idle' && shape === 'dot') ? 0 : (fromShape === 'dot' && (shape === 'card' || shape === 'card-s')) ? 200 : (nextArea > prevArea * 1.08 ? 300 : 0);
    const autoOutDelay = ((fromShape === 'pill' && shape === 'dot') || (fromShape === 'card' && shape === 'dot') || (fromShape === 'card-s' && shape === 'dot') || (fromShape === 'card' && shape === 'pill') || (fromShape === 'card-s' && shape === 'pill') || (fromShape === 'dot' && shape === 'idle')) ? 0 : (nextArea < prevArea * 0.92 ? 120 : 0);
    const fadeInDelayMs = uiFadeDelayMs === null ? autoInDelay : uiFadeDelayMs;
    const fadeOutDelayMs = uiFadeDelayMs === null ? autoOutDelay : 0;
    state.currentShape = shape;
    applyGeometry(shape, nextGeo, stageId);
    const isHomeShape = shape === 'circle' || shape === 'listening';
    const isMagicShape = shape === 'magic';
    const goingHome = isHomeShape && fromShape !== shape;
    if (goingHome) {
      DROPS.main.style.setProperty('--home-glow-delay', `${Math.max(0, state.currentTransitionAnimMs - 500)}ms`);
      DROPS.main.classList.remove('home-glow');
      void DROPS.main.offsetWidth;
      DROPS.main.classList.add('home-glow');
    } else {
      DROPS.main.style.setProperty('--home-glow-delay', '0ms');
      DROPS.main.classList.toggle('home-glow', isHomeShape || isMagicShape);
    }
    DROPS.main.classList.toggle('magic-glow', isMagicShape);
    DROPS.main.classList.toggle('listening-orb', shape === 'listening');
    if (contentData) applyContent(contentData);
    applyContentPositions(shape, nextGeo.main.w, nextGeo.main.h, fadeInDelayMs, fadeOutDelayMs, fromShape, prevGeo.w, prevGeo.h, prevStageMedia, prevCardTypography);
    if (!skipActiveUpdate) callbacks.updateActive(shape);
    bridges.runMainDeformation(fromShape, shape, prevGeo, nextGeo.main);
  }

  return { applyGeometry, clearUiFadeTimers, applyCardDetailLayout, resetDetailInlineLayout, setOpacityWithDelay, isIconOnlyThumb, applyThumbVisualMode, applyTypographyStyles, ensureStageMediaEls, hideAllStageMedia, applyCardMediaLayout, applyOutgoingCardMediaLayout, setUiMotionProfile, applyContentPositions, applyContent, showRich, hideRich, morphCore };
}
