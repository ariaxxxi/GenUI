import { layoutDisambiguationPillItems, renderDisambiguationPills } from '../flows/ui-primitives.js';
import { SHAPES, normalizeTypography, normalizeStageImages } from '../shapes.js';
import { celestialSelectedPresetForRenderShape } from './celestial-selected-presets.js';
import { applySelectedChromePreset, hexToCssColor } from './celestial-selection-chrome.js';
import { clamp } from '../utils.js';

export function createMorphRender(ctx) {
  const { DROPS, C, constants, callbacks, state, layout, bridges } = ctx;
  const { CARD_P, CARD_MEDIA_STACK_GAP, BOTTOM_ALIGN_REF_H, TS } = constants;
  const uiFadeTimers = state.uiFadeTimers;
  let richHideTimer = null;
  let thinkingVisualEnterTimer = null;
  let prototypeListSettleTimer = null;
  let prototypeListCollapseTimer = null;
  const prototypeListRoot = document.getElementById('list-pills');
  state.prototypeListContent = state.prototypeListContent || null;
  state.prototypeListSelectedIndex = Number.isFinite(state.prototypeListSelectedIndex) ? state.prototypeListSelectedIndex : 0;
  state.prototypeListDeselectTimers = state.prototypeListDeselectTimers || new Map();

  function clearThinkingVisualEnterTimer() {
    if (!thinkingVisualEnterTimer) return;
    clearTimeout(thinkingVisualEnterTimer);
    thinkingVisualEnterTimer = null;
  }

  function clearPrototypeListSettleTimer() {
    if (!prototypeListSettleTimer) return;
    clearTimeout(prototypeListSettleTimer);
    prototypeListSettleTimer = null;
  }

  function clearPrototypeListCollapseTimer() {
    if (!prototypeListCollapseTimer) return;
    clearTimeout(prototypeListCollapseTimer);
    prototypeListCollapseTimer = null;
  }

  function clearPrototypeListDeselectTimers() {
    if (!(state.prototypeListDeselectTimers instanceof Map)) return;
    state.prototypeListDeselectTimers.forEach((timerId) => clearTimeout(timerId));
    state.prototypeListDeselectTimers.clear();
  }

  function clearPrototypeSelectionMotionFrame() {
    if (!state.prototypeSelectionMotionFrame) return;
    cancelAnimationFrame(state.prototypeSelectionMotionFrame);
    state.prototypeSelectionMotionFrame = null;
  }

  function clearPrototypeSelectionChromeSyncFrame() {
    if (!state.prototypeSelectionChromeSyncFrame) return;
    cancelAnimationFrame(state.prototypeSelectionChromeSyncFrame);
    state.prototypeSelectionChromeSyncFrame = null;
  }

  function derivePrototypeListInitials(label = '') {
    const words = String(label || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '•';
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
    return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase();
  }

  function hexToRgbTriplet(value, fallback = '144 172 255') {
    const raw = String(value || '').trim();
    const full = raw.match(/^#([0-9a-f]{6})$/i);
    if (full) {
      const hex = full[1];
      return `${parseInt(hex.slice(0, 2), 16)} ${parseInt(hex.slice(2, 4), 16)} ${parseInt(hex.slice(4, 6), 16)}`;
    }
    const short = raw.match(/^#([0-9a-f]{3})$/i);
    if (short) {
      const hex = short[1];
      return `${parseInt(hex[0] + hex[0], 16)} ${parseInt(hex[1] + hex[1], 16)} ${parseInt(hex[2] + hex[2], 16)}`;
    }
    return fallback;
  }

  function prototypeListEntriesFromContent(contentData = {}) {
    const icon = contentData?.icon || callbacks.createIcon?.('none', '') || { kind: 'none', value: '' };
    const scenario = contentData?.scenario || callbacks.selectedScenario?.() || null;
    const shape = String(scenario?.shape || 'list');
    const blobTopCore = callbacks.stageSelectedBlobTopCoreColorForShape?.(scenario, shape) || '#8fb2ef';
    const blobTopEdge = callbacks.stageSelectedBlobTopEdgeColorForShape?.(scenario, shape) || '#8a72eb';
    const blobBottomCore = callbacks.stageSelectedBlobBottomCoreColorForShape?.(scenario, shape) || '#a8bbf0';
    const blobBottomEdge = callbacks.stageSelectedBlobBottomEdgeColorForShape?.(scenario, shape) || '#572fff';
    const sourceItems = Array.isArray(contentData?.listItems) && contentData.listItems.length
      ? contentData.listItems
      : [
        { primary: String(contentData?.primary || '').trim(), secondary: '', icon: contentData?.listChipIcons?.primary },
        { primary: String(contentData?.secondary || '').trim(), secondary: '', icon: contentData?.listChipIcons?.secondary },
        { primary: String(contentData?.detail || '').trim(), secondary: '', icon: contentData?.listChipIcons?.detail },
      ];
    const fallbackLabels = ['Hiro Tanaka', 'Mina Park', 'Sofia Chen'];
    return sourceItems.map((entry, index) => {
      const primary = String(entry?.primary ?? entry?.label ?? '').trim() || fallbackLabels[index] || `List item ${index + 1}`;
      const secondary = String(entry?.secondary || '').trim();
      const slotIcon = entry?.icon || { kind: 'none', value: '' };
      const resolvedIcon = slotIcon?.kind !== 'none' && String(slotIcon?.value || '').trim() ? slotIcon : icon;
      const baseEntry = resolvedIcon?.kind === 'image' && String(resolvedIcon?.value || '').trim()
        ? { avatar: String(resolvedIcon.value).trim(), initials: '' }
        : resolvedIcon?.kind === 'emoji' && String(resolvedIcon?.value || '').trim()
        ? { avatar: '', initials: String(resolvedIcon.value).trim() }
        : null;
      return ({
        name: primary,
        subtitle: secondary,
        avatar: baseEntry?.avatar || '',
        initials: baseEntry?.initials || derivePrototypeListInitials(primary),
        blobTopCore,
        blobTopEdge,
        blobBottomCore,
        blobBottomEdge,
      });
    });
  }

  function getPrototypeThinkingOrbAnchor() {
    const useBottomAlign = !!callbacks.getCanvasSettings?.()?.bottomAlign;
    const bottomAlignRef = callbacks.getBottomAlignRefHeight?.() || BOTTOM_ALIGN_REF_H;
    const orbGeo = SHAPES.magic?.main || SHAPES.circle.main;
    const alignedStageHeight = useBottomAlign
      ? Math.max(bottomAlignRef, orbGeo.h, SHAPES.dot.main.h)
      : orbGeo.h;
    const yOffset = useBottomAlign ? ((alignedStageHeight - orbGeo.h) / 2) : 0;
    return {
      x: Math.round((Number(orbGeo.tx) || 0) + ((Number(orbGeo.w) || 0) / 2)),
      y: Math.round((Number(orbGeo.ty) || 0) + yOffset + ((Number(orbGeo.h) || 0) / 2)),
    };
  }

  function syncPrototypeListPhase(phase = 'settled') {
    const cluster = prototypeListRoot?.querySelector?.('.g-disambiguation-pills');
    if (!cluster) return false;
    cluster.classList.toggle('entering', phase === 'entering');
    cluster.classList.toggle('settled', phase !== 'entering');
    return true;
  }

  function showPrototypeListStage(contentData = {}, { entering = false, selectedIndex = null } = {}) {
    if (!prototypeListRoot) return;
    clearPrototypeListCollapseTimer();
    clearPrototypeListSettleTimer();
    const scenario = contentData?.scenario || callbacks.selectedScenario?.() || null;
    const stageId = String(scenario?.shape || 'list');
    const pillListStyle = stageId === 'list-pill';
    const stage = callbacks.stageById?.(stageId, scenario) || null;
    const pillStageSize = pillListStyle
      ? (callbacks.stageMainSize?.(stage, scenario) || { width: 300, height: 80 })
      : null;
    const frameEl = document.getElementById('ui-frame') || document.getElementById('stage');
    const frameHeight = Math.max(240, Math.round(frameEl?.getBoundingClientRect?.().height || 420));
    const pillHeight = pillListStyle ? Math.max(40, Math.round(Number(pillStageSize?.height) || 80)) : 56;
    const bottomInset = 20;
    const hasOrb = listStageShowsOrb(contentData);
    const listSelectable = listStageAllowsSelection(contentData);
    const orbClearance = 8;
    let bottomY = Math.round((frameHeight / 2) - bottomInset - (pillHeight / 2));
    if (hasOrb) {
      const listGeo = state.lastMainGeo || SHAPES.list.main;
      bottomY = Math.round((Number(listGeo?.ty) || -45) - orbClearance - (pillHeight / 2));
    }
    const orbAnchor = getPrototypeThinkingOrbAnchor();
    const entries = prototypeListEntriesFromContent(contentData);
    const previousSelectedIndex = listSelectable
      ? clamp(
        Number.isFinite(state.prototypeListSelectedIndex) ? state.prototypeListSelectedIndex : 0,
        0,
        Math.max(0, entries.length - 1),
      )
      : -1;
    const resolvedSelectedIndex = listSelectable
      ? clamp(
        Number.isFinite(selectedIndex) ? selectedIndex : state.prototypeListSelectedIndex,
        0,
        Math.max(0, entries.length - 1),
      )
      : -1;
    const movingDown = resolvedSelectedIndex > previousSelectedIndex;
    const movingUp = resolvedSelectedIndex < previousSelectedIndex;
    const items = layoutDisambiguationPillItems(
      entries,
      resolvedSelectedIndex,
      'stack',
      { bottomY, gap: pillListStyle ? 10 : 8, startX: orbAnchor.x, startY: orbAnchor.y, itemHeight: pillHeight }
    ).map((item, index) => {
      let direction = 'bottom';
      if (movingDown) {
        if (index === previousSelectedIndex) direction = 'bottom';
        if (index === resolvedSelectedIndex) direction = 'top';
      } else if (movingUp) {
        if (index === previousSelectedIndex) direction = 'top';
        if (index === resolvedSelectedIndex) direction = 'bottom';
      } else if (index === resolvedSelectedIndex) {
        direction = entering ? 'bottom' : 'bottom';
      }
      return { ...item, direction };
    });
    state.prototypeListContent = contentData;
    state.prototypeListSelectedIndex = resolvedSelectedIndex;
    prototypeListRoot.dataset.collapsing = '';
    prototypeListRoot.dataset.active = '1';
    prototypeListRoot.dataset.listListeningOrb = listStageShowsOrb(contentData) ? '1' : '';
    prototypeListRoot.dataset.listSelectable = listSelectable ? '1' : '';
    if (pillListStyle) {
      prototypeListRoot.style.setProperty('--prototype-list-pill-width', `${Math.max(120, Math.round(Number(pillStageSize?.width) || 300))}px`);
      prototypeListRoot.style.setProperty('--prototype-list-pill-height', `${pillHeight}px`);
    } else {
      prototypeListRoot.style.removeProperty('--prototype-list-pill-width');
      prototypeListRoot.style.removeProperty('--prototype-list-pill-height');
    }
    prototypeListRoot.innerHTML = renderDisambiguationPills({
      items,
      selectedIndex: resolvedSelectedIndex,
      rowDataAttr: 'data-prototype-list-pill',
      clusterClass: `g-disambiguation-pills prototype-disambiguation-pills${pillListStyle ? ' prototype-disambiguation-pills--list-pill' : ''}`,
    });
    applyPrototypeListSelectedChromePresets(items);
    syncPrototypeListPhase(entering ? 'entering' : 'settled');
    if (!entering) return;
    prototypeListSettleTimer = setTimeout(() => {
      prototypeListSettleTimer = null;
      if (state.currentShape !== 'list') return;
      syncPrototypeListPhase('settled');
    }, 800);
  }

  function updatePrototypeListSelectionInPlace(nextIndex) {
    if (!prototypeListRoot || prototypeListRoot.dataset.active !== '1') return false;
    if (prototypeListRoot.dataset.listSelectable !== '1') return false;
    const cluster = prototypeListRoot.querySelector('.prototype-disambiguation-pills');
    if (!cluster) return false;
    const pills = Array.from(cluster.querySelectorAll('[data-prototype-list-pill]'));
    if (!pills.length) return false;
    const previousSelectedIndex = clamp(
      Number.isFinite(state.prototypeListSelectedIndex) ? state.prototypeListSelectedIndex : 0,
      0,
      pills.length - 1,
    );
    const resolvedSelectedIndex = clamp(
      Number.isFinite(nextIndex) ? nextIndex : previousSelectedIndex,
      0,
      pills.length - 1,
    );
    if (resolvedSelectedIndex === previousSelectedIndex) return false;
    const movingDown = resolvedSelectedIndex > previousSelectedIndex;
    const outgoingDirection = movingDown ? 'bottom' : 'top';
    const incomingDirection = movingDown ? 'top' : 'bottom';
    pills.forEach((pill, index) => {
      const chrome = pill.querySelector('.g-selection-chrome');
      if (!chrome) return;
      if (index === previousSelectedIndex) {
        const existingTimer = state.prototypeListDeselectTimers.get(pill);
        if (existingTimer) clearTimeout(existingTimer);
        chrome.dataset.stageDirection = outgoingDirection;
        pill.classList.add('deselecting');
        pill.classList.remove('selected');
        const timerId = setTimeout(() => {
          pill.classList.remove('deselecting');
          state.prototypeListDeselectTimers.delete(pill);
        }, 700);
        state.prototypeListDeselectTimers.set(pill, timerId);
        return;
      }
      if (index === resolvedSelectedIndex) {
        const existingTimer = state.prototypeListDeselectTimers.get(pill);
        if (existingTimer) {
          clearTimeout(existingTimer);
          state.prototypeListDeselectTimers.delete(pill);
        }
        chrome.dataset.stageDirection = incomingDirection;
        pill.classList.remove('deselecting');
        pill.classList.add('selected');
        return;
      }
      const existingTimer = state.prototypeListDeselectTimers.get(pill);
      if (existingTimer) {
        clearTimeout(existingTimer);
        state.prototypeListDeselectTimers.delete(pill);
      }
      pill.classList.remove('deselecting');
      if (!pill.classList.contains('selected')) {
        chrome.dataset.stageDirection = 'bottom';
      }
    });
    state.prototypeListSelectedIndex = resolvedSelectedIndex;
    return true;
  }

  function clearPrototypeListStage(immediate = false) {
    if (!prototypeListRoot) return;
    clearPrototypeListSettleTimer();
    clearPrototypeListDeselectTimers();
    if (immediate) clearPrototypeListCollapseTimer();
    if (!immediate && prototypeListRoot.dataset.collapsing === '1') return;
    state.prototypeListContent = null;
    state.prototypeListSelectedIndex = 0;
    prototypeListRoot.dataset.collapsing = '';
    prototypeListRoot.dataset.active = '';
    prototypeListRoot.dataset.listListeningOrb = '';
    prototypeListRoot.dataset.listSelectable = '';
    prototypeListRoot.innerHTML = '';
  }

  function movePrototypeListSelection(delta = 0) {
    if (!prototypeListRoot || prototypeListRoot.dataset.active !== '1') return false;
    if (prototypeListRoot.dataset.listSelectable !== '1') return false;
    const contentData = state.prototypeListContent;
    if (!contentData) return false;
    const entries = prototypeListEntriesFromContent(contentData);
    if (!entries.length) return false;
    const nextIndex = clamp(
      (Number.isFinite(state.prototypeListSelectedIndex) ? state.prototypeListSelectedIndex : 0) + delta,
      0,
      entries.length - 1,
    );
    if (nextIndex === state.prototypeListSelectedIndex) return false;
    return updatePrototypeListSelectionInPlace(nextIndex) || (showPrototypeListStage(contentData, { entering: false, selectedIndex: nextIndex }), true);
  }

  function collapsePrototypeListStack(ms = 600) {
    if (!prototypeListRoot) return;
    const cluster = prototypeListRoot.querySelector('.g-disambiguation-pills');
    if (!cluster) return clearPrototypeListStage(true);
    if (prototypeListRoot.dataset.collapsing === '1') return;
    clearPrototypeListSettleTimer();
    clearPrototypeListCollapseTimer();
    prototypeListRoot.dataset.collapsing = '1';
    cluster.classList.remove('entering', 'settled');
    cluster.classList.add('exiting-to-compose');
    prototypeListCollapseTimer = setTimeout(() => {
      prototypeListCollapseTimer = null;
      clearPrototypeListStage(true);
    }, Math.max(220, ms) + 40);
  }

  function setThinkingVisualState({ thinkingVisualShape = false, listeningShape = false, delayed = false } = {}) {
    clearThinkingVisualEnterTimer();
    DROPS.main.classList.toggle('listening-orb', listeningShape);
    if (delayed) {
      DROPS.main.classList.remove('home-blur', 'home-glow', 'magic-glow');
      thinkingVisualEnterTimer = setTimeout(() => {
        thinkingVisualEnterTimer = null;
        if (state.currentShape !== 'magic' && state.currentShape !== 'ai') return;
        DROPS.main.classList.add('home-glow', 'magic-glow');
        DROPS.main.classList.toggle('home-blur', state.currentShape === 'magic');
      }, 300);
      return;
    }
    DROPS.main.classList.toggle('home-blur', state.currentShape === 'magic');
    DROPS.main.classList.toggle('home-glow', listeningShape || thinkingVisualShape);
    DROPS.main.classList.toggle('magic-glow', thinkingVisualShape);
  }

  function listStageShowsOrb(contentData = {}) {
    const scenario = contentData?.scenario || callbacks.selectedScenario?.() || null;
    const shape = String(scenario?.shape || 'list');
    return !!callbacks.stageListListeningOrbForShape?.(scenario, shape);
  }

  function listStageAllowsSelection(contentData = {}) {
    const scenario = contentData?.scenario || callbacks.selectedScenario?.() || null;
    const shape = String(scenario?.shape || 'list');
    return callbacks.stageListSelectableForShape?.(scenario, shape) !== false;
  }

  function inferPrototypeSelectionDirection(fromGeo, toGeo) {
    if (!fromGeo || !toGeo) return 'bottom';
    const fromX = Number(fromGeo.tx) || 0;
    const fromY = Number(fromGeo.ty) || 0;
    const toX = Number(toGeo.tx) || 0;
    const toY = Number(toGeo.ty) || 0;
    const fromW = Number(fromGeo.w) || 0;
    const fromH = Number(fromGeo.h) || 0;
    const toW = Number(toGeo.w) || 0;
    const toH = Number(toGeo.h) || 0;
    const dx = (toX + (toW / 2)) - (fromX + (fromW / 2));
    const dy = (toY + (toH / 2)) - (fromY + (fromH / 2));
    const dw = toW - fromW;
    const dh = toH - fromH;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      return Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? 'right' : 'left')
        : (dy >= 0 ? 'bottom' : 'top');
    }
    if (Math.abs(dh) >= Math.abs(dw) && Math.abs(dh) > 4) return dh >= 0 ? 'bottom' : 'top';
    if (Math.abs(dw) > 4) return dw >= 0 ? 'right' : 'left';
    return 'bottom';
  }

  function playPrototypeSelectionMotion(selectionOverlay, selected) {
    if (!selectionOverlay) return;
    clearPrototypeSelectionMotionFrame();
    if (!selected) {
      selectionOverlay.dataset.motionPhase = 'pre';
      return;
    }
    selectionOverlay.dataset.motionPhase = 'pre';
    selectionOverlay.getBoundingClientRect();
    state.prototypeSelectionMotionFrame = requestAnimationFrame(() => {
      state.prototypeSelectionMotionFrame = null;
      selectionOverlay.dataset.motionPhase = 'active';
    });
  }

  function syncPrototypeSelectionChromeFrame(selectionOverlay, main, preset, colorOverrides, maskBlur) {
    if (!selectionOverlay || !main || !preset) return;
    const rect = main.getBoundingClientRect();
    const computed = getComputedStyle(main);
    applySelectedChromePreset(selectionOverlay, main, preset, colorOverrides, {
      width: rect.width,
      height: rect.height,
      radius: Number.parseFloat(computed.borderRadius) || Math.min(rect.width, rect.height) / 2,
    }, {
      maskBlur,
    });
  }

  function inferPrototypeSelectionPresetKey(requestedShape, main) {
    const shape = String(requestedShape || 'pill');
    if (!main) return shape;
    const rect = main.getBoundingClientRect();
    const width = Number.parseFloat(main.style.width) || rect.width || 0;
    const height = Number.parseFloat(main.style.height) || rect.height || 0;
    if (width <= 0 || height <= 0) return shape;
    const ratio = width / Math.max(1, height);
    if (ratio >= 1.42 && height >= 120) return 'card';
    if (ratio >= 2.2 && height <= 120) return 'pill';
    if (Math.abs(width - height) <= 16 && Math.min(width, height) <= 132) return 'dot';
    return shape;
  }

  function startPrototypeSelectionChromeSync(selectionOverlay, main, preset, colorOverrides, maskBlur) {
    if (!selectionOverlay || !main || !preset) return;
    clearPrototypeSelectionChromeSyncFrame();
    let stableFrameCount = 0;
    let lastSignature = '';
    const deadline = performance.now() + Math.max(1400, (Number(state.currentTransitionAnimMs) || 0) + 500);
    const syncForFrame = () => {
      syncPrototypeSelectionChromeFrame(selectionOverlay, main, preset, colorOverrides, maskBlur);
      const rect = main.getBoundingClientRect();
      const signature = [
        Math.round(rect.width * 10),
        Math.round(rect.height * 10),
        Math.round((Number.parseFloat(getComputedStyle(main).borderRadius) || 0) * 10),
      ].join(':');
      stableFrameCount = signature === lastSignature ? stableFrameCount + 1 : 0;
      lastSignature = signature;
      if (stableFrameCount >= 3 || performance.now() >= deadline) {
        state.prototypeSelectionChromeSyncFrame = null;
        return;
      }
      state.prototypeSelectionChromeSyncFrame = requestAnimationFrame(syncForFrame);
    };
    syncForFrame();
  }

  function applyPrototypeListSelectedChromePresets(entries = []) {
    if (!prototypeListRoot) return;
    const activeScenario = state.prototypeListContent?.scenario || callbacks.selectedScenario?.() || null;
    const shape = String(activeScenario?.shape || 'list');
    const preset = celestialSelectedPresetForRenderShape('list');
    const maskBlur = callbacks.stageSelectedMaskBlurForShape?.(activeScenario, shape) ?? preset.maskBlur;
    const pills = Array.from(prototypeListRoot.querySelectorAll('[data-prototype-list-pill]'));
    pills.forEach((pill, index) => {
      const chrome = pill.querySelector('.g-selection-chrome');
      if (!chrome) return;
      const entry = entries[index] || {};
      applySelectedChromePreset(chrome, pill, preset, {
        blobTopCore: entry.blobTopCore,
        blobTopEdge: entry.blobTopEdge,
        blobBottomCore: entry.blobBottomCore,
        blobBottomEdge: entry.blobBottomEdge,
      }, null, { maskBlur });
    });
  }

  function syncPrototypeFigmaButtonDemo(stageId = null, scenario = null) {
    const previews = document.querySelectorAll('.prototype-figma-button-demo');
    const activeScenario = scenario || callbacks.selectedScenario?.() || null;
    if (!previews.length) return;
    const renderShape = String(callbacks.renderShapeForStageId?.(stageId, activeScenario) || stageId || 'pill');
    const preset = celestialSelectedPresetForRenderShape(renderShape);
    const accentA = hexToCssColor(
      callbacks.stageSelectedBlobTopCoreColorForShape?.(activeScenario, stageId),
      hexToCssColor(preset.blobTopCore, 'rgb(144 172 255)'),
    );
    const accentB = hexToCssColor(
      callbacks.stageSelectedBlobBottomCoreColorForShape?.(activeScenario, stageId),
      hexToCssColor(preset.blobBottomCore, 'rgb(151 97 255)'),
    );
    previews.forEach((preview) => {
      if (preview.dataset.staticAccents === 'true') return;
      preview.style.setProperty('--prototype-figma-button-accent-a', accentA);
      preview.style.setProperty('--prototype-figma-button-accent-b', accentB);
    });
  }

  function syncPrototypeStageSelection(stageId = null, scenario = null) {
    const main = DROPS.main;
    const selectionOverlay = document.getElementById('prototype-stage-selection');
    if (!main) return;
    const activeScenario = scenario || callbacks.selectedScenario?.() || null;
    const stage = stageId ? callbacks.stageById?.(stageId) : null;
    const selectionOverride = callbacks.getPrototypeSelectionOverride?.() || null;
    const selected = selectionOverride?.enabled
      ? true
      : stageId
      ? (callbacks.stageSelectedForShape?.(activeScenario, stageId) ?? !!stage?.selected)
      : false;
    const renderShape = String(
      selectionOverride?.renderShape
      || stage?.renderShape
      || callbacks.renderShapeForStageId?.(stageId)
      || stageId
      || 'pill'
    );
    const presetKey = inferPrototypeSelectionPresetKey(renderShape, main);
    const preset = celestialSelectedPresetForRenderShape(presetKey);
    main.classList.toggle('prototype-stage-selected', selected);
    if (selectionOverlay) {
      selectionOverlay.dataset.stageDirection = state.prototypeSelectionDirection || 'bottom';
      selectionOverlay.dataset.renderShape = presetKey;
      selectionOverlay.style.width = main.style.width || `${state.lastMainGeo?.w || 0}px`;
      selectionOverlay.style.height = main.style.height || `${state.lastMainGeo?.h || 0}px`;
      selectionOverlay.style.borderRadius = main.style.borderRadius || String(state.lastMainGeo?.br || '0px');
    }
    if (!selected) {
      clearPrototypeSelectionChromeSyncFrame();
      main.style.removeProperty('--g-stage-selected-rgb');
      main.style.removeProperty('--g-stage-selected-secondary-rgb');
      main.style.removeProperty('--g-stage-selected-blob-top-core');
      main.style.removeProperty('--g-stage-selected-blob-top-edge');
      main.style.removeProperty('--g-stage-selected-blob-bottom-core');
      main.style.removeProperty('--g-stage-selected-blob-bottom-edge');
      selectionOverlay?.style.removeProperty('--g-stage-selected-rgb');
      selectionOverlay?.style.removeProperty('--g-stage-selected-secondary-rgb');
      selectionOverlay?.style.removeProperty('--g-stage-selected-blob-top-core');
      selectionOverlay?.style.removeProperty('--g-stage-selected-blob-top-edge');
      selectionOverlay?.style.removeProperty('--g-stage-selected-blob-bottom-core');
      selectionOverlay?.style.removeProperty('--g-stage-selected-blob-bottom-edge');
      playPrototypeSelectionMotion(selectionOverlay, false);
      return;
    }
    const blobTopCore = selectionOverride?.theme?.blobTopCore || callbacks.stageSelectedBlobTopCoreColorForShape?.(activeScenario, stageId) || preset.blobTopCore;
    const blobTopEdge = selectionOverride?.theme?.blobTopEdge || callbacks.stageSelectedBlobTopEdgeColorForShape?.(activeScenario, stageId) || preset.blobTopEdge;
    const blobBottomCore = selectionOverride?.theme?.blobBottomCore || callbacks.stageSelectedBlobBottomCoreColorForShape?.(activeScenario, stageId) || preset.blobBottomCore;
    const blobBottomEdge = selectionOverride?.theme?.blobBottomEdge || callbacks.stageSelectedBlobBottomEdgeColorForShape?.(activeScenario, stageId) || preset.blobBottomEdge;
    const maskBlur = selectionOverride?.maskBlur ?? callbacks.stageSelectedMaskBlurForShape?.(activeScenario, stageId) ?? preset.maskBlur;
    if (!selectionOverlay) return;
    const colorOverrides = {
      blobTopCore,
      blobTopEdge,
      blobBottomCore,
      blobBottomEdge,
    };
    syncPrototypeSelectionChromeFrame(selectionOverlay, main, preset, colorOverrides, maskBlur);
    startPrototypeSelectionChromeSync(selectionOverlay, main, preset, colorOverrides, maskBlur);
    playPrototypeSelectionMotion(selectionOverlay, true);
  }

  function applyGeometry(shape, resolvedGeo, stageId = null, scenario = null) {
    const geo = resolvedGeo || SHAPES[shape] || SHAPES.card;
    const mainRadius = stageId ? layout.stageCornerRadiusPx(stageId, geo.main.br) : geo.main.br;
    const bottomAlignRef = callbacks.getBottomAlignRefHeight?.() || BOTTOM_ALIGN_REF_H;
    const useBottomAlign = !!callbacks.getCanvasSettings()?.bottomAlign;
    const activeScenario = scenario || callbacks.selectedScenario?.() || null;
    const activeStageId = stageId || activeScenario?.shape || null;
    const shouldShowListOrbShell = shape === 'list' && !!callbacks.stageListListeningOrbForShape?.(activeScenario, activeStageId);
    const alignedStageHeight = useBottomAlign ? Math.max(bottomAlignRef, geo.main.h, SHAPES.dot.main.h) : geo.main.h;
    let appliedMainGeo = null;
    ['main', 'left', 'right'].forEach((k) => {
      const el = DROPS[k], s = geo[k];
      const anchorHeight = (shape === 'idle' && k === 'main') ? SHAPES.dot.main.h : s.h;
      const yOffset = useBottomAlign ? ((alignedStageHeight - anchorHeight) / 2) : 0;
      const appliedTy = s.ty + yOffset;
      el.style.width = `${s.w}px`;
      el.style.height = `${s.h}px`;
      if (k === 'main') el.style.setProperty('--g-stage-h', `${s.h}px`);
      el.style.borderRadius = k === 'main' ? mainRadius : s.br;
      el.style.transform = `translate(${s.tx}px,${appliedTy}px)`;
      const forcedVisible = k === 'main' && shouldShowListOrbShell;
      el.style.opacity = forcedVisible ? '1' : s.op;
      el.style.pointerEvents = forcedVisible || s.op > 0 ? 'auto' : 'none';
      if (k === 'main') {
        appliedMainGeo = {
          ...s,
          tx: s.tx,
          ty: appliedTy,
          br: mainRadius,
          op: forcedVisible ? 1 : s.op,
        };
      }
    });
    const stage = document.getElementById('stage');
    if (stage) stage.style.height = `${alignedStageHeight}px`;
    state.lastMainGeo = appliedMainGeo ? { ...appliedMainGeo } : { ...geo.main };
    syncPrototypeFigmaButtonDemo(stageId, scenario);
    syncPrototypeStageSelection(stageId, scenario);
  }

  const clearUiFadeTimers = () => { while (uiFadeTimers.length) clearTimeout(uiFadeTimers.pop()); };
  const applyCardDetailLayout = (cardWidth) => {
    C.det.style.width = `${layout.cardDetailTextWidth(cardWidth)}px`;
    C.det.style.maxWidth = `${layout.cardDetailTextWidth(cardWidth)}px`;
    C.det.style.whiteSpace = 'pre-wrap';
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
    const hasTextOrEmojiIcon = state.thumbContentState.kind === 'emoji' && !!icon;
    C.thumb.classList.toggle('thumb-empty', homeEmpty);
    const plain = hasTextOrEmojiIcon || isIconOnlyThumb(shape);
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
    let transitionMs = bridges.transitionAnimMs(fromShape, toShape, callbacks.getAnimDuration(), fromGeo, toGeo);
    const homeLikeShape = fromShape === 'circle' || fromShape === 'listening' || toShape === 'circle' || toShape === 'listening';
    const thinkingLikeShape = fromShape === 'ai' || fromShape === 'magic' || toShape === 'ai' || toShape === 'magic';
    const isHomeThinkingPair = homeLikeShape && thinkingLikeShape;
    if (fromShape === 'listening' && (toShape === 'magic' || toShape === 'ai')) {
      transitionMs = 450;
    } else if (isHomeThinkingPair) {
      transitionMs = clamp(Math.round(transitionMs * 1.45), 520, 1200);
    }
    const geometryEase = 'var(--motion-ease)';
    const fromCardLike = fromShape === 'card' || fromShape === 'card-s';
    const toCardLike = toShape === 'card' || toShape === 'card-s';
    const collapsingToDot = toShape === 'dot'
      && ['pill', 'card', 'card-s', 'image'].includes(fromShape);
    let contentFadeMs = 260, detailFadeMs = 260, mediaFadeMs = 260, thumbFadeMs = 280, contentMoveMs = transitionMs, primarySizeAnimMs = transitionMs, textSizeAnimMs = transitionMs, secondaryInAdvanceMs = 0, detailInAdvanceMs = 0;
    let borderRadiusAnimMs = transitionMs;
    if ((fromShape === 'pill' && toCardLike) || (fromCardLike && toShape === 'pill')) { primarySizeAnimMs = clamp(Math.round(transitionMs * 1.2), 420, 900); textSizeAnimMs = clamp(Math.round(transitionMs * 1.08), 360, 820); }
    if (fromShape === 'pill' && toCardLike) { secondaryInAdvanceMs = 60; detailInAdvanceMs = 200; }
    if (fromShape === 'dot' && toCardLike) contentMoveMs = 0;
    if (fromShape === 'image' && toShape === 'pill') contentMoveMs = 0;
    if (fromCardLike && toShape === 'dot') { contentFadeMs = 200; detailFadeMs = 200; }
    if (fromCardLike && toShape === 'pill') mediaFadeMs = transitionMs;
    if ((fromShape === 'idle' && toShape === 'dot') || (fromShape === 'dot' && toShape === 'idle')) thumbFadeMs = 200;
    if (collapsingToDot) {
      borderRadiusAnimMs = Math.min(140, transitionMs);
    }
    state.contentDelayProfile = { secondaryInAdvanceMs, detailInAdvanceMs };
    state.currentContentFadeMs = contentFadeMs; state.currentDetailFadeMs = detailFadeMs; state.currentMediaFadeMs = mediaFadeMs; state.currentTransitionAnimMs = transitionMs;
    [['--anim-w', transitionMs], ['--anim-h', transitionMs], ['--anim-br', borderRadiusAnimMs], ['--anim-tx', transitionMs], ['--anim-t', transitionMs]].forEach(([k, v]) => root.style.setProperty(k, `${v}ms ${geometryEase}`));
    root.style.setProperty('--content-fade-ms', `${contentFadeMs}ms`); root.style.setProperty('--detail-fade-ms', `${detailFadeMs}ms`); root.style.setProperty('--media-fade-ms', `${mediaFadeMs}ms`); root.style.setProperty('--thumb-fade-ms', `${thumbFadeMs}ms`); root.style.setProperty('--content-move-t', `${contentMoveMs}ms ${geometryEase}`); root.style.setProperty('--primary-size-anim-ms', `${primarySizeAnimMs}ms`); root.style.setProperty('--text-size-anim-ms', `${textSizeAnimMs}ms`);
  }

  function applyContentPositions(shape, w, h, fadeInDelayMs = 0, fadeOutDelayMs = 0, fromShape = shape, fromWidth = w, fromHeight = h, outgoingMedia = null, outgoingTypography = null) {
    const pos = layout.contentPos(shape, w, h);
    C.thumb.style.cssText += `width:${pos.thumb.w}px;height:${pos.thumb.h}px;border-radius:${pos.thumb.br};transform:translate(${pos.thumb.x}px,${pos.thumb.y}px);`;
    applyThumbVisualMode(shape);
    let thumbOpacity = pos.thumb.op;
    if (shape === 'circle' || shape === 'idle') thumbOpacity = 0;
    else if (shape === 'dot' && state.thumbContentState.kind === 'none') thumbOpacity = 0;
    else if (shape === 'dot' && fromShape === 'split') thumbOpacity = 0;
    else if (shape === 'magic' && state.thumbContentState.kind === 'none') thumbOpacity = 0;
    setOpacityWithDelay(C.thumb, thumbOpacity, fadeInDelayMs, fadeOutDelayMs);
    const setEl = (el, p, customInDelayMs = fadeInDelayMs) => {
      el.style.transform = p.cx ? `translate(${p.x}px,${p.y}px) translate(-50%,-50%)` : `translate(${p.x}px,${p.y}px)`;
      setOpacityWithDelay(el, p.op, customInDelayMs, fadeOutDelayMs);
      if (p.fs) el.style.fontSize = `${p.fs}px`;
      if (Object.prototype.hasOwnProperty.call(p, 'w') && Number.isFinite(p.w)) {
        el.style.width = `${p.w}px`;
        el.style.maxWidth = `${p.w}px`;
      }
    };
    setEl(C.prim, pos.prim);
    setEl(C.sec, pos.sec, Math.max(0, fadeInDelayMs - (state.contentDelayProfile.secondaryInAdvanceMs || 0)));
    setEl(C.det, pos.det, Math.max(0, fadeInDelayMs - (state.contentDelayProfile.detailInAdvanceMs || 0)));
    if (shape === 'ai' || shape === 'magic') {
      C.prim.textContent = '';
      C.sec.textContent = '';
      C.det.textContent = '';
      [C.thumb, C.prim, C.sec, C.det, C.div].forEach((el) => {
        if (!el) return;
        el.style.transitionDelay = '0ms';
        el.style.opacity = '0';
      });
      hideAllStageMedia();
      if (!document.body.classList.contains('glass-flow-active')) {
        hideRich();
      }
    }
    applyTypographyStyles(shape);
    const mainLineWidth = layout.lineTextWidth(shape, w);
    ['prim', 'sec'].forEach((key) => {
      const el = C[key];
      const customWidth = pos[key]?.w;
      if (Number.isFinite(customWidth)) {
        el.style.width = `${customWidth}px`;
        el.style.maxWidth = `${customWidth}px`;
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.whiteSpace = 'nowrap';
        return;
      }
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
    C.div.style.height = `${pos.div.dh || 1}px`;
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
    if (richHideTimer) {
      clearTimeout(richHideTimer);
      richHideTimer = null;
    }
    C.rich.style.opacity = '0';
    C.rich.innerHTML = html;
    C.rich.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => { C.rich.style.opacity = '1'; }));
  }

  function hideRich() {
    if (document.body.classList.contains('glass-flow-active') || callbacks.shouldPreserveRich?.()) return;
    if (richHideTimer) {
      clearTimeout(richHideTimer);
      richHideTimer = null;
    }
    C.rich.style.opacity = '0';
    richHideTimer = setTimeout(() => {
      richHideTimer = null;
      if (document.body.classList.contains('glass-flow-active') || callbacks.shouldPreserveRich?.()) return;
      C.rich.classList.remove('visible');
      C.rich.innerHTML = '';
    }, 220);
  }

  function morphCore(shape, contentData, customGeo, skipActiveUpdate = false, uiFadeDelayMs = null, stageId = null) {
    clearUiFadeTimers();
    DROPS.main.classList.remove('orb-thinking-bridge');
    const fromShape = state.currentShape;
    const prevStageMedia = Array.isArray(state.stageMediaState) ? state.stageMediaState.map((item) => ({ ...item })) : [];
    const prevCardTypography = fromShape === 'card' ? normalizeTypography(state.contentTypographyState, 'card') : null;
    const prevGeo = bridges.getCurrentMainGeometry();
    const nextGeo = layout.resolveGeometryForContent(shape, contentData, customGeo, stageId);
    state.prototypeSelectionDirection = inferPrototypeSelectionDirection(prevGeo, nextGeo.main);
    setUiMotionProfile(fromShape, shape, prevGeo, nextGeo);
    const prevArea = Math.max(1, prevGeo.w * prevGeo.h);
    const nextArea = Math.max(1, nextGeo.main.w * nextGeo.main.h);
    const autoInDelay = fromShape === 'dot' && shape === 'pill' ? 180 : (fromShape === 'idle' && shape === 'dot') ? 0 : (fromShape === 'dot' && (shape === 'card' || shape === 'card-s')) ? 200 : (nextArea > prevArea * 1.08 ? 300 : 0);
    const autoOutDelay = (
      shape === 'idle' ||
      (fromShape === 'pill' && shape === 'dot') ||
      (fromShape === 'card' && shape === 'dot') ||
      (fromShape === 'card-s' && shape === 'dot') ||
      (fromShape === 'card' && shape === 'pill') ||
      (fromShape === 'card-s' && shape === 'pill') ||
      (fromShape === 'dot' && shape === 'idle')
    ) ? 0 : (nextArea < prevArea * 0.92 ? 120 : 0);
    const fadeInDelayMs = uiFadeDelayMs === null ? autoInDelay : uiFadeDelayMs;
    const fadeOutDelayMs = uiFadeDelayMs === null ? autoOutDelay : 0;
    state.currentShape = shape;
    state.currentStageId = stageId || null;
    document.body.dataset.currentShape = shape;
    applyGeometry(shape, nextGeo, stageId, contentData?.scenario || null);
    const orbVisualShape = (value) => value === 'magic' || value === 'ai';
    const thinkingVisualShape = orbVisualShape(shape);
    const enteringThinking = thinkingVisualShape && !orbVisualShape(fromShape);
    const listeningToThinking = enteringThinking && fromShape === 'listening';
    DROPS.main.style.setProperty('--thinking-entry-delay', enteringThinking ? (listeningToThinking ? '140ms' : '300ms') : '0ms');
    DROPS.main.style.setProperty('--thinking-shell-delay', enteringThinking ? (listeningToThinking ? '180ms' : '300ms') : '0ms');
    DROPS.main.classList.toggle('home-blur', shape === 'magic');
    const enteringHomeLike = (shape === 'circle' || shape === 'listening' || shape === 'magic')
      && !(fromShape === 'circle' || fromShape === 'listening' || fromShape === 'magic');
    const goingHome = enteringHomeLike;
    if (goingHome) {
      DROPS.main.style.setProperty('--home-glow-delay', `${Math.max(0, state.currentTransitionAnimMs - 500)}ms`);
      DROPS.main.classList.remove('home-glow');
      void DROPS.main.offsetWidth;
      if (shape === 'listening' || thinkingVisualShape) DROPS.main.classList.add('home-glow');
    } else {
      DROPS.main.style.setProperty('--home-glow-delay', '0ms');
      DROPS.main.classList.toggle('home-glow', shape === 'listening' || thinkingVisualShape);
    }
    DROPS.main.classList.toggle('magic-glow', thinkingVisualShape);
    DROPS.main.classList.toggle('listening-orb', shape === 'listening');
    if (contentData) applyContent(contentData);
    applyContentPositions(shape, nextGeo.main.w, nextGeo.main.h, fadeInDelayMs, fadeOutDelayMs, fromShape, prevGeo.w, prevGeo.h, prevStageMedia, prevCardTypography);
    if (shape === 'list') {
      hideRich();
      showPrototypeListStage(contentData, { entering: fromShape !== 'list' });
    } else if (prototypeListRoot?.dataset.collapsing !== '1') {
      clearPrototypeListStage(true);
    }
    if (!skipActiveUpdate) callbacks.updateActive(shape);
  }

  return { applyGeometry, clearUiFadeTimers, applyCardDetailLayout, resetDetailInlineLayout, setOpacityWithDelay, isIconOnlyThumb, applyThumbVisualMode, applyTypographyStyles, ensureStageMediaEls, hideAllStageMedia, applyCardMediaLayout, applyOutgoingCardMediaLayout, setUiMotionProfile, applyContentPositions, applyContent, showRich, hideRich, showPrototypeListStage, clearPrototypeListStage, collapsePrototypeListStack, movePrototypeListSelection, morphCore };
}
