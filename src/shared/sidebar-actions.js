export function createSidebarActions(ctx, refs) {
  const sync = () => ({
    scenarioLibrary: ctx.getScenarioLibrary(),
    stageLibrary: ctx.getStageLibrary(),
    selectedScenarioId: ctx.getSelectedScenarioId(),
    responseMode: ctx.getResponseMode(),
    aiStageOverride: ctx.getAiStageOverride(),
  });

  function applyDraftMutator(source, mutator, normalize, normalizeArg) {
    const draft = structuredClone(source);
    const mutated = mutator(draft);
    const candidate = mutated === undefined ? draft : mutated;
    return normalize(candidate, normalizeArg);
  }

  function renderAiStageOverrideUi() {
    const { aiStageOverride } = sync();
    ctx.UI.aiStageButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.aiStage === aiStageOverride));
  }

  function previewAiStageOverride() {
    const { responseMode, aiStageOverride } = sync();
    if (responseMode !== ctx.RESPONSE_MODE.AI) return;
    const scenario = ctx.selectedScenario();
    if (!scenario) return;
    if (aiStageOverride === ctx.AI_STAGE_OVERRIDE.AUTO) return void ctx.previewScenario(scenario);
    const overrideShape = ctx.availableScenarioShapes().includes(aiStageOverride) ? aiStageOverride : scenario.shape;
    ctx.previewScenario(ctx.createScenario({ ...scenario, shape: overrideShape, content: scenario.content, triggers: scenario.triggers }));
  }

  function selectScenario(id) {
    ctx.setSelectedScenarioId(id);
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function commitScenarioChange(mutator) {
    const next = ctx.getScenarioLibrary().map((scenario) => scenario.id === ctx.getSelectedScenarioId()
      ? applyDraftMutator(scenario, mutator, ctx.normalizeScenario)
      : scenario);
    ctx.setScenarioLibrary(next);
    ctx.persistScenarios();
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function commitStageChange(stageIdValue, mutator) {
    const next = ctx.getStageLibrary().map((stage) => stage.id === stageIdValue
      ? applyDraftMutator(stage, mutator, ctx.normalizeStage, ctx.builtinStageById(stageIdValue))
      : stage);
    ctx.setStageLibrary(next);
    ctx.persistStageLibrary();
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function stageTemplateFromKind(kind = 'card') {
    const value = String(kind || '').toLowerCase();
    if (value === 'dot') {
      return { renderShape: 'dot', name: 'Dot Stage', cornerRadius: 50, iconTextGap: null, iconLeftPadding: null, components: ['icon'] };
    }
    if (value === 'pill') {
      return { renderShape: 'pill', name: 'Pill Stage', cornerRadius: 60, iconTextGap: 8, iconLeftPadding: 16, components: ['icon', 'primary', 'secondary'] };
    }
    if (value === 'blank') {
      return { renderShape: 'card', name: 'Blank Stage', cornerRadius: 30, iconTextGap: null, iconLeftPadding: null, components: [] };
    }
    return { renderShape: 'card', name: 'Card Stage', cornerRadius: 30, iconTextGap: null, iconLeftPadding: null, components: ['icon', 'primary', 'secondary', 'detail', 'image'] };
  }

  function addStage(kind = 'card') {
    const template = stageTemplateFromKind(kind);
    const newStage = ctx.normalizeStage({
      id: ctx.stageId(),
      name: template.name,
      preset: false,
      renderShape: template.renderShape,
      cornerRadius: template.cornerRadius,
      widthOverride: null,
      heightOverride: null,
      iconTextGap: template.iconTextGap,
      iconLeftPadding: template.iconLeftPadding,
      phoneBgBlur: false,
      selected: false,
      accentColor: '#90acff',
      secondaryAccentColor: '#9761ff',
      components: template.components,
    });
    ctx.setStageLibrary([...ctx.getStageLibrary(), newStage]);
    ctx.persistStageLibrary();
    commitScenarioChange((scenario) => { scenario.shape = newStage.id; return scenario; });
  }

  function duplicateCurrentStage() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    if (!scenario || !stage) return;
    const sourceStageId = stage.id;
    const newStage = ctx.normalizeStage({
      ...stage,
      id: ctx.stageId(),
      name: `${stage.name} Copy`,
      preset: false,
      renderShape: stage.renderShape,
    });
    ctx.setStageLibrary([...ctx.getStageLibrary(), newStage]);
    ctx.persistStageLibrary();
    commitScenarioChange((draft) => {
      const sourceShape = draft.shape;
      draft.content.textByShape = ctx.normalizeStageTextByShape(draft.content.textByShape, sourceShape, draft.content);
      draft.content.textByShape[newStage.id] = structuredClone(draft.content.textByShape[sourceShape] || {});

      draft.content.iconByShape = ctx.normalizeIconByShape(draft.content.iconByShape, sourceShape, draft.content.icon);
      draft.content.iconByShape[newStage.id] = structuredClone(draft.content.iconByShape[sourceShape] || ctx.createIcon('none', ''));

      draft.content.listChipIconsByShape = ctx.normalizeListChipIconsByShape(draft.content.listChipIconsByShape, sourceShape);
      draft.content.listChipIconsByShape[newStage.id] = structuredClone(draft.content.listChipIconsByShape[sourceShape] || {
        primary: ctx.createIcon('none', ''),
        secondary: ctx.createIcon('none', ''),
        detail: ctx.createIcon('none', ''),
      });

      draft.content.imagesByShape = ctx.normalizeImagesByShape(draft.content.imagesByShape, sourceShape, draft.content.images);
      draft.content.imagesByShape[newStage.id] = structuredClone(draft.content.imagesByShape[sourceShape] || []);

      draft.content.typographyByShape = ctx.normalizeTypographyByShape(draft.content.typographyByShape, sourceShape);
      draft.content.typographyByShape[newStage.id] = structuredClone(draft.content.typographyByShape[sourceShape] || {});

      draft.content.sizeByShape = ctx.normalizeStageSizeByShape(draft.content.sizeByShape, sourceShape, draft.content);
      draft.content.sizeByShape[newStage.id] = structuredClone(draft.content.sizeByShape[sourceShape] || {});

      draft.content.selectedByShape = { ...(draft.content.selectedByShape || {}) };
      if (Object.prototype.hasOwnProperty.call(draft.content.selectedByShape, sourceShape)) {
        draft.content.selectedByShape[newStage.id] = draft.content.selectedByShape[sourceShape];
      }

      draft.content.accentColorByShape = { ...(draft.content.accentColorByShape || {}) };
      if (draft.content.accentColorByShape[sourceShape]) {
        draft.content.accentColorByShape[newStage.id] = draft.content.accentColorByShape[sourceShape];
      }

      draft.content.secondaryAccentColorByShape = { ...(draft.content.secondaryAccentColorByShape || {}) };
      if (draft.content.secondaryAccentColorByShape[sourceShape]) {
        draft.content.secondaryAccentColorByShape[newStage.id] = draft.content.secondaryAccentColorByShape[sourceShape];
      }

      draft.content.stageRenderShapeById = { ...(draft.content.stageRenderShapeById || {}) };
      delete draft.content.stageRenderShapeById[newStage.id];
      draft.content.hiddenStageIds = (draft.content.hiddenStageIds || []).filter((id) => id !== newStage.id);

      draft.shape = newStage.id;
      return draft;
    });
  }

  function deleteCurrentStage() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    if (!stage) return;
    const visibleStages = typeof ctx.visibleScenarioStages === 'function'
      ? ctx.visibleScenarioStages(scenario)
      : ctx.getStageLibrary();
    const currentIndex = visibleStages.findIndex((item) => item.id === stage.id);
    const fallbackStage = visibleStages[currentIndex + 1] || visibleStages[currentIndex - 1] || null;
    if (!fallbackStage) return;
    commitScenarioChange((draft) => {
      const hidden = new Set(draft.content.hiddenStageIds || []);
      hidden.add(stage.id);
      draft.content.hiddenStageIds = [...hidden];
      if (draft.shape === stage.id) draft.shape = fallbackStage.id;
    });
  }

  function resetCurrentStageToDefault() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    const builtin = ctx.builtinStageById(stage?.id);
    if (!stage || !builtin) return;
    const nextStages = ctx.getStageLibrary().map((item) => item.id === stage.id ? ctx.normalizeStage(builtin, builtin) : item);
    ctx.setStageLibrary(nextStages);
    ctx.persistStageLibrary();
    const nextScenarios = ctx.getScenarioLibrary().map((item) => {
      if (item.id !== ctx.getSelectedScenarioId()) return item;
      const draft = structuredClone(item);
      if (draft.content?.stageRenderShapeById) {
        draft.content.stageRenderShapeById = { ...draft.content.stageRenderShapeById };
        delete draft.content.stageRenderShapeById[stage.id];
      }
      if (Array.isArray(draft.content?.hiddenStageIds)) {
        draft.content.hiddenStageIds = draft.content.hiddenStageIds.filter((id) => id !== stage.id);
      }
      return ctx.normalizeScenario(draft);
    });
    ctx.setScenarioLibrary(nextScenarios);
    ctx.persistScenarios();
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function addScenario(shape = 'pill') {
    const next = ctx.createScenario({ name: 'New Scenario', shape });
    ctx.setScenarioLibrary([...ctx.getScenarioLibrary(), next]);
    ctx.setSelectedScenarioId(next.id);
    ctx.persistScenarios();
    refs.render.renderScenarioUi();
    ctx.previewScenario(next);
  }

  function duplicateScenario() {
    const scenario = ctx.selectedScenario();
    if (!scenario) return;
    const next = ctx.createScenario({ ...scenario, id: undefined, name: `${scenario.name} Copy`, shape: scenario.shape, content: scenario.content, triggers: scenario.triggers });
    ctx.setScenarioLibrary([...ctx.getScenarioLibrary(), next]);
    ctx.setSelectedScenarioId(next.id);
    ctx.persistScenarios();
    refs.render.renderScenarioUi();
    ctx.previewScenario(next);
  }

  function deleteScenario() {
    const scenarios = ctx.getScenarioLibrary();
    if (scenarios.length <= 1) return;
    const next = scenarios.filter((item) => item.id !== ctx.getSelectedScenarioId());
    ctx.setScenarioLibrary(next);
    ctx.setSelectedScenarioId(next[0]?.id || '');
    ctx.persistScenarios();
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function getScenarioImagesForStage(scenario, stage) {
    const count = Math.max(0, ctx.stageComponentCounts(stage).image || 0);
    const source = ctx.stageImagesForShape(scenario, scenario?.shape);
    return Array.from({ length: count }, (_, index) => source[index] || null);
  }

  return {
    renderAiStageOverrideUi,
    previewAiStageOverride,
    selectScenario,
    commitScenarioChange,
    commitStageChange,
    addStage,
    duplicateCurrentStage,
    deleteCurrentStage,
    resetCurrentStageToDefault,
    addScenario,
    duplicateScenario,
    deleteScenario,
    getScenarioImagesForStage,
  };
}
