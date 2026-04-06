import { SHAPES } from '../shapes.js';

const EMPTY_CONTENT = { icon:'', primary:'', secondary:'', detail:'' };

export function createMorphBridges(ctx) {
  const { DROPS, C, callbacks, state, runtime } = ctx;
  const splitTimers = state.splitTimers;
  const clamp = callbacks.clamp;

  const splitBridgeMs = () => clamp(Math.round(callbacks.getAnimDuration() * 0.62), 300, 460);
  const listBridgeMs = () => 500;
  const listPhaseTwoStartMs = () => 500;
  const thinkingBridgeMs = () => clamp(Math.round(callbacks.getAnimDuration() * 0.55), 220, 420);
  const homeThinkingBridgeMs = () => clamp(Math.round(callbacks.getAnimDuration() * 0.48), 180, 320);
  const cardHeightForTransition = (fromShape, toShape, fromGeo, toGeo) => fromShape === 'card' && Number.isFinite(fromGeo?.h) ? fromGeo.h : toShape === 'card' && Number.isFinite(toGeo?.main?.h) ? toGeo.main.h : SHAPES.card.main.h;
  const cardDurationBonusMs = (cardHeight) => clamp(Math.round(((Number.isFinite(cardHeight) ? cardHeight : SHAPES.card.main.h) / 580) * 200), 0, 360);
  function transitionAnimMs(fromShape, toShape, baseMs = callbacks.getAnimDuration(), fromGeo = null, toGeo = null) {
    const fromCardLike = fromShape === 'card' || fromShape === 'card-s';
    const toCardLike = toShape === 'card' || toShape === 'card-s';
    const isMessageConfirmToSent = document.body?.classList.contains('message-confirm-to-sent') === true;
    const isDotPillPair = (fromShape === 'dot' && toShape === 'pill') || (fromShape === 'pill' && toShape === 'dot');
    const isPillCardPair = (fromShape === 'pill' && toCardLike) || (fromCardLike && toShape === 'pill');
    const isDotCardPair = (fromShape === 'dot' && toCardLike) || (fromCardLike && toShape === 'dot');
    const cardBonus = cardDurationBonusMs(cardHeightForTransition(fromShape, toShape, fromGeo, toGeo));
    if (isMessageConfirmToSent && fromShape === 'card-form' && toShape === 'magic') return 600;
    if (isDotPillPair) return clamp(baseMs, 100, 1800);
    if (isPillCardPair) return clamp(baseMs + Math.round(cardBonus * 0.5), 100, 1800);
    if (isDotCardPair) return clamp(baseMs + cardBonus, 100, 1800);
    return clamp(baseMs, 100, 1800);
  }
  const clearSplitTimers = () => { while (splitTimers.length) clearTimeout(splitTimers.pop()); };
  const scheduleSplitTimer = (ms, fn) => { const id = setTimeout(fn, ms); splitTimers.push(id); return id; };

  function clearSplitAnimationOverlays() {
    const main = DROPS.main;
    const left = DROPS.left;
    const right = DROPS.right;
    if (!main || !left || !right) return;
    if (main._metaAnim) { main._metaAnim.cancel(); main._metaAnim = null; }
    if (main._splitAnim) { main._splitAnim.cancel(); main._splitAnim = null; }
    [left, right].forEach((el) => { if (el._splitAnim) { el._splitAnim.cancel(); el._splitAnim = null; } });
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
    if (!main || !left || !right) return void runtime.morphCore(shape, contentData, customGeo, false, null, stageId);
    main.style.width = '100px'; main.style.height = '100px'; main.style.borderRadius = '50px'; main.style.transform = 'translate(-50px,-50px)'; main.style.pointerEvents = 'auto'; main.style.opacity = '0'; main.style.scale = '1 1';
    [left, right].forEach((el) => { el.style.width = '96px'; el.style.height = '96px'; el.style.borderRadius = '48px'; el.style.opacity = '1'; el.style.pointerEvents = 'none'; el.style.scale = '1 1'; });
    left.style.transform = 'translate(-108px,-48px)';
    right.style.transform = 'translate(12px,-48px)';
    main._splitAnim = main.animate([{ transform:'translate(-50px,-50px) scale(1.1,0.92)', borderRadius:'42px', opacity:0, filter:'blur(0.3px)', offset:0 }, { transform:'translate(-50px,-50px) scale(1.05,0.97)', borderRadius:'46px', opacity:0.58, filter:'blur(0px)', offset:0.58 }, { transform:'translate(-50px,-50px) scale(1,1)', borderRadius:'50px', opacity:1, filter:'blur(0px)', offset:1 }], { duration:phaseMs, easing, fill:'forwards' });
    left._splitAnim = left.animate([{ transform:'translate(-108px,-48px) scale(1,1)', opacity:1, offset:0 }, { transform:'translate(-76px,-48px) scale(1.02,0.98)', opacity:0.68, offset:0.56 }, { transform:'translate(-48px,-48px) scale(0.94,1.04)', opacity:0, offset:1 }], { duration:phaseMs, easing, fill:'forwards' });
    right._splitAnim = right.animate([{ transform:'translate(12px,-48px) scale(1,1)', opacity:1, offset:0 }, { transform:'translate(-20px,-48px) scale(1.02,0.98)', opacity:0.68, offset:0.56 }, { transform:'translate(-48px,-48px) scale(0.94,1.04)', opacity:0, offset:1 }], { duration:phaseMs, easing, fill:'forwards' });
    callbacks.updateActive('split');
    state.splitBridgeTimer = setTimeout(() => {
      state.splitBridgeTimer = null;
      clearSplitAnimationOverlays();
      main.style.width = '100px'; main.style.height = '100px'; main.style.borderRadius = '50px'; main.style.transform = 'translate(-50px,-50px)'; main.style.opacity = '1'; main.style.pointerEvents = 'auto'; main.style.scale = '1 1';
      left.style.transform = 'translate(-48px,-48px)'; right.style.transform = 'translate(-48px,-48px)'; left.style.opacity = '0'; right.style.opacity = '0'; left.style.pointerEvents = 'none'; right.style.pointerEvents = 'none';
      state.currentShape = 'dot';
      state.lastMainGeo = { ...SHAPES.dot.main };
      // Keep split->dot intermediate pass visually clean (no inner thumb flash).
      runtime.applyContentPositions('dot', SHAPES.dot.main.w, SHAPES.dot.main.h, 0, 0, 'split');
      if (shape === 'dot') {
        if (contentData) runtime.applyContent(contentData);
        callbacks.updateActive('dot');
        return;
      }
      void main.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(() => runtime.morphCore(shape, contentData, customGeo, false, null, stageId)));
    }, phaseMs + 12);
  }

  function bridgeToSplitViaDot() {
    clearSplitAnimationOverlays();
    clearSplitTimers();
    runtime.morphCore('dot', EMPTY_CONTENT, null, true, 0);
    state.splitBridgeTimer = setTimeout(() => {
      state.splitBridgeTimer = null;
      callbacks.animateSplitMetaball();
    }, splitBridgeMs());
  }

  function bridgeFromListToTarget(shape, contentData, customGeo, stageId = null) {
    callbacks.collapseListStack();
    callbacks.updateActive('list');
    state.listBridgeTimer = setTimeout(() => {
      state.listBridgeTimer = null;
      if (shape === 'idle') {
        runtime.morphCore('ai', EMPTY_CONTENT, null, true, 0);
        callbacks.showAiIdle();
        callbacks.updateActive('idle');
        return;
      }
      if (shape === 'ai') {
        runtime.morphCore('ai', EMPTY_CONTENT, null, true, 0);
        callbacks.startSiriOrb(true);
        callbacks.updateActive('ai');
        return;
      }
      if (shape === 'magic') {
        callbacks.stopSiriOrb({ keepAiMode: true });
        runtime.morphCore('magic', contentData, customGeo, false, 0, stageId);
        return;
      }
      if (shape === 'pill') return void runtime.morphCore('pill', contentData, customGeo, false, null, stageId);
      runtime.morphCore('pill', null, null, true);
      runtime.morphTo(shape, contentData, customGeo, stageId);
    }, listPhaseTwoStartMs());
  }

  function bridgeFromThinkingToTarget(shape, contentData, customGeo, stageId = null) {
    runtime.morphCore('circle', null, null, true, 0);
    callbacks.updateActive('ai');
    state.thinkingBridgeTimer = setTimeout(() => {
      state.thinkingBridgeTimer = null;
      runtime.morphTo(shape, contentData, customGeo, stageId);
    }, thinkingBridgeMs());
  }

  function bridgeHomeToThinking(targetShape, contentData = EMPTY_CONTENT, customGeo = null, stageId = null) {
    if (state.thinkingBridgeTimer) { clearTimeout(state.thinkingBridgeTimer); state.thinkingBridgeTimer = null; }
    const currentShape = state.currentShape === 'listening' ? 'listening' : 'circle';
    const bridgeMs = homeThinkingBridgeMs();
    runtime.morphCore(currentShape, EMPTY_CONTENT, null, true, 0);
    DROPS.main.classList.add('orb-thinking-bridge');
    C.thumb.style.opacity = '0';
    callbacks.updateActive(targetShape);
    state.thinkingBridgeTimer = setTimeout(() => {
      state.thinkingBridgeTimer = null;
      DROPS.main.classList.remove('orb-thinking-bridge');
      if (targetShape === 'idle') {
        runtime.morphCore('ai', EMPTY_CONTENT, null, true, 0);
        callbacks.showAiIdle();
        callbacks.updateActive('idle');
        return;
      }
      if (targetShape === 'ai') {
        runtime.morphCore('ai', EMPTY_CONTENT, null, true, 0);
        callbacks.startSiriOrb(true);
        callbacks.updateActive('ai');
        return;
      }
      callbacks.stopSiriOrb({ keepAiMode: true });
      runtime.morphCore(targetShape, contentData, customGeo, false, 0, stageId);
    }, bridgeMs);
  }

  function bridgeThinkingToHome(contentData = null, customGeo = null, stageId = null) {
    if (state.thinkingBridgeTimer) { clearTimeout(state.thinkingBridgeTimer); state.thinkingBridgeTimer = null; }
    DROPS.main.classList.remove('orb-thinking-bridge');
    callbacks.stopSiriOrb();
    runtime.morphCore('circle', contentData, customGeo, true, Math.round(homeThinkingBridgeMs() * 0.2), stageId);
    callbacks.updateActive('circle');
  }

  function getActiveEasing() {
    const sel = document.getElementById('ease-select-left') || document.getElementById('ease-select');
    const pick = sel ? callbacks.getEasingFns()?.[sel.value] : null;
    return pick ? pick() : 'cubic-bezier(0.35,0.23,0.13,0.98)';
  }

  function getCurrentMainGeometry() {
    const main = DROPS.main;
    if (!main) return { ...state.lastMainGeo };
    const cs = getComputedStyle(main);
    const g = { ...state.lastMainGeo };
    const w = parseFloat(cs.width); const h = parseFloat(cs.height); const op = parseFloat(cs.opacity);
    if (Number.isFinite(w)) g.w = w;
    if (Number.isFinite(h)) g.h = h;
    if (Number.isFinite(op)) g.op = op;
    if (cs.borderRadius) g.br = cs.borderRadius.split(' ')[0];
    const t = cs.transform;
    const applyMatrix = (parts, xIndex, yIndex) => { if (parts.length && Number.isFinite(parts[xIndex]) && Number.isFinite(parts[yIndex])) { g.tx = parts[xIndex]; g.ty = parts[yIndex]; } };
    if (t && t !== 'none') {
      const m2d = t.match(/^matrix\(([^)]+)\)$/);
      if (m2d) applyMatrix(m2d[1].split(',').map((v) => parseFloat(v.trim())), 4, 5);
      else {
        const m3d = t.match(/^matrix3d\(([^)]+)\)$/);
        if (m3d) applyMatrix(m3d[1].split(',').map((v) => parseFloat(v.trim())), 12, 13);
      }
    }
    return g;
  }

  const shouldUseStrongDeform = (fromShape, toShape) => new Set(['circle', 'pill', 'split']).has(fromShape) && new Set(['circle', 'pill', 'split']).has(toShape);
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
    if (!main || !fromMain || !toMain || state.suppressDeformation || toShape === 'split' || (fromMain.op ?? 1) <= 0.01 || (toMain.op ?? 1) <= 0.01) return;
    const dw = toMain.w - fromMain.w;
    const dh = toMain.h - fromMain.h;
    if (Math.abs(dw) < 2 && Math.abs(dh) < 2) return;
    if (state.mainDeformAnim) { state.mainDeformAnim.cancel(); state.mainDeformAnim = null; }
    main.style.scale = '1 1';
    const intensity = deformationIntensity(fromShape, toShape, fromMain, toMain);
    const horizontal = Math.abs(dw) >= Math.abs(dh);
    const direction = horizontal ? (dw >= 0 ? 1 : -1) : (dh >= 0 ? 1 : -1);
    const antMag = 0.04 * intensity;
    const relMag = 0.06 * intensity;
    let antX = 1, antY = 1, relX = 1, relY = 1;
    if (horizontal) { antX = 1 - direction * antMag; antY = 1 + direction * antMag * 0.95; relX = 1 + direction * relMag; relY = 1 - direction * relMag * 0.8; }
    else { antX = 1 + direction * antMag * 0.95; antY = 1 - direction * antMag; relX = 1 - direction * relMag * 0.8; relY = 1 + direction * relMag; }
    antX = clamp(antX, 0.93, 1.1); antY = clamp(antY, 0.93, 1.1); relX = clamp(relX, 0.9, 1.14); relY = clamp(relY, 0.9, 1.14);
    const totalMs = clamp(Math.round(state.currentTransitionAnimMs * 1.02), 340, 980);
    const anim = main.animate([{ scale:'1 1', offset:0, easing:getActiveEasing() }, { scale:`${antX} ${antY}`, offset:0.16, easing:getActiveEasing() }, { scale:`${relX} ${relY}`, offset:0.74, easing:getActiveEasing() }, { scale:'1 1', offset:1 }], { duration:totalMs, easing:'linear', fill:'none' });
    state.mainDeformAnim = anim;
    const clear = () => { if (state.mainDeformAnim === anim) { state.mainDeformAnim = null; main.style.scale = '1 1'; } };
    anim.onfinish = clear;
    anim.oncancel = clear;
  }

  return { splitBridgeMs, listBridgeMs, listPhaseTwoStartMs, thinkingBridgeMs, homeThinkingBridgeMs, cardHeightForTransition, cardDurationBonusMs, transitionAnimMs, clearSplitTimers, scheduleSplitTimer, clearSplitAnimationOverlays, bridgeFromSplitToTarget, bridgeToSplitViaDot, bridgeFromListToTarget, bridgeFromThinkingToTarget, bridgeHomeToThinking, bridgeThinkingToHome, getActiveEasing, getCurrentMainGeometry, shouldUseStrongDeform, deformationIntensity, runMainDeformation };
}
