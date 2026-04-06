import { DEMO_LIST, LIST_PILL_H, LIST_GAP, LIST_STEP, clearListPills, collapseListStack, buildListPill, selectListItem } from '../../shared/list-demo.js';

export function initManualDemo({
  document,
  SHAPES,
  SCENARIO_SHAPES,
  createScenario,
  selectedScenario,
  previewScenario,
  morphTo,
  applyContentPositions,
  hideRich,
  hideIntentHeader,
  stopSiriOrb,
  startSiriOrb,
  showAiIdle,
  renderShapeForStageId,
  clearSplitTimers,
  scheduleSplitTimer,
  splitBridgeMs,
  getActiveEasing,
  updateActive,
  morphApi,
  getCurrentShape,
  setCurrentShape,
  getLastMainGeo,
  setLastMainGeo,
  getSplitAnimStyleBackup,
  setSplitAnimStyleBackup,
  getSuppressDeformation,
  setSuppressDeformation,
  DROPS,
  C,
}) {
  const DEMO = {
    circle: { icon: '', primary: '', secondary: '', detail: '' },
    split: { icon: '', primary: '', secondary: '', detail: '' },
    ai: { icon: '', primary: '', secondary: '', detail: '' },
  };
  const PROTOTYPE_THINKING_GEO = {
    main: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 1 },
    left: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
    right: { w: 80, h: 80, br: '40px', tx: -40, ty: -60, op: 0 },
  };
  const LIST_PILL_W = 420;
  function resetSplitState() {
    clearSplitTimers();
    morphApi.setSplitBridgeTimer(null);
    morphApi.setListBridgeTimer(null);
    setSuppressDeformation(false);
    const backup = getSplitAnimStyleBackup();
    if (backup !== null) {
      const animStyle = document.getElementById('anim-style');
      if (animStyle) animStyle.textContent = backup;
      setSplitAnimStyleBackup(null);
    }
    const main = DROPS.main;
    const left = DROPS.left;
    const right = DROPS.right;
    if (main._metaAnim) { main._metaAnim.cancel(); main._metaAnim = null; }
    if (main._splitAnim) { main._splitAnim.cancel(); main._splitAnim = null; }
    morphApi.cancelMainDeformation();
    const currentShape = getCurrentShape();
    const baseMain = getLastMainGeo() || SHAPES[currentShape]?.main || SHAPES.circle.main;
    main.classList.remove('metaball-prep');
    main.style.filter = '';
    main.style.scale = '1 1';
    main.style.width = `${baseMain.w}px`;
    main.style.height = `${baseMain.h}px`;
    main.style.borderRadius = baseMain.br;
    main.style.transform = `translate(${baseMain.tx}px,${baseMain.ty}px)`;
    main.style.opacity = String(baseMain.op);
    main.style.pointerEvents = baseMain.op > 0 ? 'auto' : 'none';
    [left, right].forEach((el) => {
      if (el._splitAnim) { el._splitAnim.cancel(); el._splitAnim = null; }
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
    setSplitAnimStyleBackup(document.getElementById('anim-style').textContent);
    const originalAnimCSS = getSplitAnimStyleBackup();
    document.getElementById('anim-style').textContent = `
      :root {
        --spring: ${easing};
        --anim-w: ${normalizeMs}ms var(--spring);
        --anim-h: ${normalizeMs}ms var(--spring);
        --anim-br: ${normalizeMs}ms var(--spring);
        --anim-tx: ${normalizeMs}ms var(--spring);
        --anim-t: ${normalizeMs}ms var(--spring);
      }`;
    setSuppressDeformation(true);
    morphTo('dot', { icon: '', primary: '', secondary: '', detail: '' });
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
      [left, right].forEach((el) => { if (el._splitAnim) el._splitAnim.cancel(); });
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
        setCurrentShape('split');
        setLastMainGeo({ ...SHAPES.split.main });
        morphApi.setCurrentShape('split');
        morphApi.setLastMainGeo({ ...SHAPES.split.main });
        morphApi.setSuppressDeformation(false);
        updateActive('split');
        main.classList.remove('metaball-prep');
        main.style.filter = '';
        document.getElementById('anim-style').textContent = originalAnimCSS;
        setSplitAnimStyleBackup(null);
        setSuppressDeformation(false);
        clearSplitTimers();
      });
    });
  }

  function morphToList(items = DEMO_LIST) {
    stopSiriOrb();
    hideRich();
    document.getElementById('drop-main').classList.remove('ai-mode');
    const currentShape = getCurrentShape();
    if (currentShape === 'split') {
      morphTo('dot', { icon: '', primary: '', secondary: '', detail: '' });
      const existing = morphApi.getListBridgeTimer();
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        morphApi.setListBridgeTimer(null);
        morphToList(items);
      }, splitBridgeMs() + 28);
      morphApi.setListBridgeTimer(timer);
      return;
    }
    const phaseOneMs = 600;
    const phaseTwoMs = 500;
    const overlapMs = 220;
    const phaseTwoStart = phaseOneMs - overlapMs;
    const easing = getActiveEasing();
    const originalAnimCSS = document.getElementById('anim-style').textContent;
    document.getElementById('anim-style').textContent = `
      :root {
        --spring: ${easing};
        --anim-w: ${phaseOneMs}ms var(--spring);
        --anim-h: ${phaseOneMs}ms var(--spring);
        --anim-br: ${phaseOneMs}ms var(--spring);
        --anim-tx: ${phaseOneMs}ms var(--spring);
        --anim-t: ${phaseTwoMs}ms var(--spring);
      }`;
    morphTo('pill', {
      icon: items[0]?.icon || '◉',
      primary: items[0]?.primary || '',
      secondary: items[0]?.secondary || '',
      detail: '',
    });
    const stackHeight = items.length * LIST_PILL_H + (items.length - 1) * LIST_GAP;
    const stackTop = -stackHeight / 2;
    const firstPillY = stackTop;
    const incomingPillY = firstPillY + 20;
    const stage = document.getElementById('stage');
    if (stage) stage.style.height = `${stackHeight}px`;
    const wrap = document.getElementById('list-pills');
    clearListPills();
    wrap.style.opacity = '1';
    wrap.style.transition = 'none';
    wrap.style.pointerEvents = 'none';
    DROPS.main.style.transform = `translate(-210px, ${firstPillY}px)`;
    setCurrentShape('list');
    setLastMainGeo({ ...SHAPES.pill.main, ty: firstPillY });
    setTimeout(() => {
      items.slice(1).forEach((item, i) => {
        const idx = i + 1;
        const pill = buildListPill(item, idx, items);
        const finalY = stackTop + idx * LIST_STEP;
        pill.style.transition = `transform ${phaseTwoMs}ms ${easing}, opacity ${Math.max(220, phaseTwoMs - 80)}ms ${easing}`;
        pill.style.transform = `translateY(${incomingPillY}px)`;
        pill.style.opacity = '0.01';
        wrap.appendChild(pill);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          pill.style.transform = `translateY(${finalY}px)`;
          pill.style.opacity = '1';
        }));
      });
      wrap.style.pointerEvents = 'auto';
      setTimeout(() => {
        document.getElementById('anim-style').textContent = originalAnimCSS;
      }, phaseTwoMs + overlapMs + 40);
    }, phaseTwoStart);
  }

  function manualShape(shape) {
    document.getElementById('shape-panel')?.classList.remove('visible');
    hideRich();
    hideIntentHeader();
    document.getElementById('stage').classList.remove('flow-active');
    document.getElementById('input-area')?.classList.remove('hidden');
    const currentShape = getCurrentShape();
    const leavingSplit = currentShape === 'split' && shape !== 'split';
    const leavingList = currentShape === 'list' && shape !== 'list';
    if (!leavingList) clearListPills();
    if (shape === 'split') return void morphTo('split', { icon: '', primary: '', secondary: '', detail: '' });
    if (!leavingSplit && currentShape === 'split') resetSplitState();
    if (shape === 'list') {
      morphToList(DEMO_LIST);
      updateActive('list');
      return;
    }
    if (shape === 'ai') {
      if (currentShape === 'circle') return void morphApi.bridgeHomeToThinking('ai');
      stopSiriOrb();
      morphTo('ai', { icon: '', primary: '', secondary: '', detail: '' });
      C.thumb.style.opacity = '0';
      document.getElementById('drop-main').classList.add('ai-mode');
      startSiriOrb(true);
      updateActive('ai');
      return;
    }
    if (shape === 'idle') {
      if (currentShape === 'circle') return void morphApi.bridgeHomeToThinking('idle');
      stopSiriOrb();
      morphTo('ai', { icon: '', primary: '', secondary: '', detail: '' });
      C.thumb.style.opacity = '0';
      document.getElementById('drop-main').classList.add('ai-mode');
      showAiIdle();
      updateActive('idle');
      return;
    }
    if (shape === 'magic') {
      morphTo('magic', DEMO[shape] || {}, PROTOTYPE_THINKING_GEO);
      return;
    }
    stopSiriOrb();
    if (SCENARIO_SHAPES.includes(shape)) {
      const scenario = selectedScenario();
      const nextScenario = scenario ? createScenario({ ...scenario, shape, content: scenario.content, triggers: scenario.triggers }) : createScenario({ shape });
      previewScenario(nextScenario);
      return;
    }
    morphTo(shape, DEMO[shape] || {});
  }

  function openCustom() {
    document.getElementById('shape-panel').classList.toggle('visible');
    updateActive('custom');
  }

  function applyCustomShape() {
    const localClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const w = localClamp(parseInt(document.getElementById('sp-w').value, 10) || 280, 60, 420);
    const h = localClamp(parseInt(document.getElementById('sp-h').value, 10) || 140, 60, 360);
    const r = localClamp(parseInt(document.getElementById('sp-r').value, 10) || 0, 0, Math.floor(Math.min(w, h) / 2));
    document.getElementById('sp-w').value = w;
    document.getElementById('sp-h').value = h;
    document.getElementById('sp-r').value = r;
    const g = {
      main: { w, h, br: `${r}px`, tx: -(w / 2), ty: -(h / 2), op: 1 },
      left: { w: 100, h: 100, br: '50px', tx: -(w / 2), ty: -50, op: 0 },
      right: { w: 100, h: 100, br: '50px', tx: (w / 2) - 100, ty: -50, op: 0 },
    };
    hideRich();
    morphTo('custom', null, g);
    applyContentPositions('custom', w, h);
  }

  return {
    DEMO_LIST,
    clearListPills,
    collapseListStack,
    selectListItem,
    morphToList,
    animateSplitMetaball,
    resetSplitState,
    manualShape,
    openCustom,
    applyCustomShape,
  };
}
