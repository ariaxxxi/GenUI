import { SHAPES, defaultTypographyForShape } from '../shapes.js';
import { createMorphLayout } from './morph-layout.js';
import { createMorphBridges } from './morph-bridges.js';
import { createMorphRender } from './morph-render.js';

export function initMorph({ DROPS, C, detailMeasureEl, callbacks }) {
  const state = {
    currentShape: 'circle',
    lastMainGeo: { ...SHAPES.circle.main },
    mainDeformAnim: null,
    splitTimers: [],
    suppressDeformation: false,
    splitBridgeTimer: null,
    listBridgeTimer: null,
    thinkingBridgeTimer: null,
    thumbContentState: callbacks.createIcon('none', ''),
    contentTypographyState: defaultTypographyForShape('pill'),
    contentDelayProfile: { secondaryInAdvanceMs: 0, detailInAdvanceMs: 0 },
    stageMediaState: [],
    uiFadeTimers: [],
    currentContentFadeMs: 260,
    currentDetailFadeMs: 260,
    currentMediaFadeMs: 260,
    currentTransitionAnimMs: 450,
  };

  const constants = { P:20, PILL_NO_ICON_P:32, PILL_ICON_P:16, CARD_P:24, BOTTOM_ALIGN_REF_H:420, CARD_MEDIA_BOTTOM_P:30, CARD_DIVIDER_GAP:10, CARD_PRIMARY_GAP:14, CARD_PRIMARY_TO_SECONDARY_GAP:8, CARD_SECONDARY_TO_DETAIL_GAP:8, CARD_DETAIL_TO_MEDIA_GAP:24, CARD_MEDIA_STACK_GAP:8, TS:60, TBR:'30px', GAP:8 };
  const runtime = {};
  const ctx = { DROPS, C, detailMeasureEl, callbacks, constants, state, runtime };
  const layout = createMorphLayout(ctx);
  const bridges = createMorphBridges({ ...ctx, layout, runtime });
  const render = createMorphRender({ ...ctx, layout, bridges });
  Object.assign(runtime, layout, bridges, render);

  function morphTo(shape, contentData, customGeo, stageId = null) {
    if (state.splitBridgeTimer) { clearTimeout(state.splitBridgeTimer); state.splitBridgeTimer = null; }
    if (state.listBridgeTimer) { clearTimeout(state.listBridgeTimer); state.listBridgeTimer = null; }
    if (state.thinkingBridgeTimer) { clearTimeout(state.thinkingBridgeTimer); state.thinkingBridgeTimer = null; }
    const inAiIdleState = state.currentShape === 'idle' && document.getElementById('drop-main')?.classList.contains('ai-mode');
    const homeLikeShape = state.currentShape === 'circle' || state.currentShape === 'listening';
    const thinkingLikeTarget = shape === 'magic' || shape === 'ai' || shape === 'idle';
    const inGlassFlow = document.body?.classList.contains('glass-flow-active') === true;
    if (!inGlassFlow && homeLikeShape && thinkingLikeTarget) {
      return void bridges.bridgeHomeToThinking(shape, contentData, customGeo, stageId);
    }
    if ((state.currentShape === 'ai' || inAiIdleState) && shape !== 'ai' && shape !== 'idle') {
      if (shape === 'circle' || shape === 'listening') return void bridges.bridgeThinkingToHome(contentData, customGeo, stageId);
      return void bridges.bridgeFromThinkingToTarget(shape, contentData, customGeo, stageId);
    }
    if (state.currentShape === 'split' && shape !== 'split') return void bridges.bridgeFromSplitToTarget(shape, contentData, customGeo, stageId);
    if (state.currentShape === 'list' && shape !== 'list') return void bridges.bridgeFromListToTarget(shape, contentData, customGeo, stageId);
    if (shape === 'split' && state.currentShape !== 'split') return void bridges.bridgeToSplitViaDot();
    render.morphCore(shape, contentData, customGeo, false, null, stageId);
  }

  return {
    ...layout,
    ...bridges,
    ...render,
    morphTo,
    getCurrentShape: () => state.currentShape,
    setCurrentShape: (value) => { state.currentShape = value; },
    getLastMainGeo: () => state.lastMainGeo,
    setLastMainGeo: (value) => { state.lastMainGeo = value; },
    getSplitBridgeTimer: () => state.splitBridgeTimer,
    setSplitBridgeTimer: (value) => { state.splitBridgeTimer = value; },
    getListBridgeTimer: () => state.listBridgeTimer,
    setListBridgeTimer: (value) => { state.listBridgeTimer = value; },
    getThinkingBridgeTimer: () => state.thinkingBridgeTimer,
    setThinkingBridgeTimer: (value) => { state.thinkingBridgeTimer = value; },
    getSuppressDeformation: () => state.suppressDeformation,
    setSuppressDeformation: (value) => { state.suppressDeformation = !!value; },
    cancelMainDeformation: () => { if (state.mainDeformAnim) { state.mainDeformAnim.cancel(); state.mainDeformAnim = null; } },
  };
}
