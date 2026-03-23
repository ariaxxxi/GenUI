export function createSidebarActions(ctx, refs) {
  const sync = () => ({
    scenarioLibrary: ctx.getScenarioLibrary(),
    stageLibrary: ctx.getStageLibrary(),
    selectedScenarioId: ctx.getSelectedScenarioId(),
    responseMode: ctx.getResponseMode(),
    aiStageOverride: ctx.getAiStageOverride(),
  });

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
    const next = ctx.getScenarioLibrary().map((scenario) => scenario.id === ctx.getSelectedScenarioId() ? ctx.normalizeScenario(mutator(structuredClone(scenario)) || structuredClone(scenario)) : scenario);
    ctx.setScenarioLibrary(next);
    ctx.persistScenarios();
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function commitStageChange(stageIdValue, mutator) {
    const next = ctx.getStageLibrary().map((stage) => stage.id === stageIdValue ? ctx.normalizeStage(mutator(structuredClone(stage)) || structuredClone(stage), ctx.builtinStageById(stageIdValue)) : stage);
    ctx.setStageLibrary(next);
    ctx.persistStageLibrary();
    refs.render.renderScenarioUi();
    ctx.previewScenario(ctx.selectedScenario());
  }

  function addStage() {
    const shape = ctx.selectedScenario()?.shape || 'pill';
    const newStage = ctx.normalizeStage({
      id: ctx.stageId(),
      name: 'New Stage',
      preset: false,
      renderShape: ctx.renderShapeForStageId(shape) || 'pill',
      cornerRadius: 30,
      widthOverride: null,
      heightOverride: null,
      iconTextGap: 8,
      iconLeftPadding: 16,
      phoneBgBlur: false,
      components: ['icon', 'primary', 'secondary'],
    });
    ctx.setStageLibrary([...ctx.getStageLibrary(), newStage]);
    ctx.persistStageLibrary();
    commitScenarioChange((scenario) => { scenario.shape = newStage.id; return scenario; });
  }

  function deleteCurrentStage() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape);
    if (!stage || stage.preset) return;
    const nextStages = ctx.getStageLibrary().filter((item) => item.id !== stage.id);
    ctx.setStageLibrary(nextStages);
    ctx.persistStageLibrary();
    commitScenarioChange((draft) => { draft.shape = 'pill'; return draft; });
  }

  function resetCurrentStageToDefault() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape);
    const builtin = ctx.builtinStageById(stage?.id);
    if (!stage || !builtin) return;
    const nextStages = ctx.getStageLibrary().map((item) => item.id === stage.id ? ctx.normalizeStage(builtin, builtin) : item);
    ctx.setStageLibrary(nextStages);
    ctx.persistStageLibrary();
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
    deleteCurrentStage,
    resetCurrentStageToDefault,
    addScenario,
    duplicateScenario,
    deleteScenario,
    getScenarioImagesForStage,
  };
}
