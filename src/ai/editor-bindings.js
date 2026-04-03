export function initEditorBindings({
  document,
  UI,
  PAGE_MODE_OVERRIDE,
  RESPONSE_MODE,
  AI_STAGE_OVERRIDE,
  availableScenarioShapes,
  selectedScenario,
  stageById,
  normalizeScenarioCanvas,
  normalizeTriggers,
  normalizeIconByShape,
  normalizeListChipIconsByShape,
  createIcon,
  normalizeStageTextByShape,
  normalizeTypographyByShape,
  normalizeStageSizeByShape,
  normalizeImagesByShape,
  scenarioStageSizeOverride,
  STAGE_COMPONENT_TYPES,
  clamp,
  canvasSettings,
  setCanvasSettings,
  persistCanvasSettings,
  persistScenarios,
  responseMode,
  setResponseMode,
  persistResponseMode,
  aiStageOverride,
  setAiStageOverride,
  persistAiStageOverride,
  sidebar,
  applyCanvasSettings,
  applyStagePhoneBlur,
  applyResponseModeUi,
  previewScenario,
  previewAiStageOverride,
}) {
  const commitPhoneFrameSize = (axis, rawValue) => {
    const parsed = parseInt(String(rawValue || "").trim(), 10);
    if (!Number.isFinite(parsed)) return;
    const key = axis === "w" ? "phoneFrameWidth" : "phoneFrameHeight";
    const bounded = axis === "w" ? clamp(parsed, 240, 600) : clamp(parsed, 420, 1200);
    setCanvasSettings({ ...canvasSettings(), [key]: bounded });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
  };

  if (UI.modeToggle && !PAGE_MODE_OVERRIDE) {
    UI.modeToggle.addEventListener("change", () => {
      setResponseMode(UI.modeToggle.checked ? RESPONSE_MODE.AI : RESPONSE_MODE.MANUAL);
      persistResponseMode();
      applyResponseModeUi();
      if (responseMode() === RESPONSE_MODE.AI) previewAiStageOverride();
      else previewScenario(selectedScenario());
    });
  }
  UI.aiStageButtons.forEach((button) => button.addEventListener("click", () => {
    const stage = button.dataset.aiStage;
    if (!Object.values(AI_STAGE_OVERRIDE).includes(stage)) return;
    setAiStageOverride(stage);
    persistAiStageOverride();
    sidebar.renderAiStageOverrideUi();
    previewAiStageOverride();
  }));
  UI.bgToggle?.addEventListener("change", () => { setCanvasSettings({ ...canvasSettings(), backgroundEnabled: UI.bgToggle.checked }); persistCanvasSettings(); applyCanvasSettings(); });
  UI.floatToggle?.addEventListener("change", () => { setCanvasSettings({ ...canvasSettings(), floatingEnabled: UI.floatToggle.checked }); persistCanvasSettings(); applyCanvasSettings(); });
  UI.alignBottomToggle?.addEventListener("change", () => { setCanvasSettings({ ...canvasSettings(), bottomAlign: UI.alignBottomToggle.checked }); persistCanvasSettings(); applyCanvasSettings(); previewScenario(selectedScenario()); });
  UI.frameGlassesToggle?.addEventListener("change", () => {
    const scenario = selectedScenario();
    if (!scenario) return;
    scenario.content.canvas = normalizeScenarioCanvas(scenario.content.canvas, { frameMode: canvasSettings().frameMode });
    scenario.content.canvas.frameMode = UI.frameGlassesToggle.checked ? "glasses" : "none";
    if (UI.framePhoneToggle && UI.frameGlassesToggle.checked) UI.framePhoneToggle.checked = false;
    persistScenarios();
    sidebar.renderScenarioUi();
    applyCanvasSettings();
    applyStagePhoneBlur(scenario.shape);
  });
  UI.framePhoneToggle?.addEventListener("change", () => {
    const scenario = selectedScenario();
    if (!scenario) return;
    scenario.content.canvas = normalizeScenarioCanvas(scenario.content.canvas, { frameMode: canvasSettings().frameMode });
    scenario.content.canvas.frameMode = UI.framePhoneToggle.checked ? "phone" : "none";
    if (UI.frameGlassesToggle && UI.framePhoneToggle.checked) UI.frameGlassesToggle.checked = false;
    persistScenarios();
    sidebar.renderScenarioUi();
    applyCanvasSettings();
    applyStagePhoneBlur(scenario.shape);
  });
  UI.phoneFrameWidth?.addEventListener("change", (e) => commitPhoneFrameSize("w", e.target.value));
  UI.phoneFrameHeight?.addEventListener("change", (e) => commitPhoneFrameSize("h", e.target.value));
  UI.frameCornerRadius?.addEventListener("change", (e) => {
    const parsed = parseInt(String(e.target.value || "").trim(), 10);
    if (!Number.isFinite(parsed)) return;
    setCanvasSettings({ ...canvasSettings(), frameCornerRadius: clamp(parsed, 0, 120) });
    persistCanvasSettings();
    applyCanvasSettings();
  });

  UI.scenarioAdd?.addEventListener("click", () => sidebar.addScenario());
  UI.scenarioDuplicate?.addEventListener("click", () => sidebar.duplicateScenario());
  UI.scenarioDelete?.addEventListener("click", () => sidebar.deleteScenario());
  UI.scenarioName?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.name = String(e.target.value || ""); return scenario; }));
  UI.scenarioTriggers?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.triggers = normalizeTriggers(e.target.value); return scenario; }));
  UI.scenarioIconInput?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon); scenario.content.iconByShape[scenario.shape] = e.target.value.trim() ? createIcon("emoji", e.target.value.trim()) : createIcon("none", ""); return scenario; }));
  const commitListChipIconField = (slot, value) => sidebar.commitScenarioChange((scenario) => {
    scenario.content.listChipIconsByShape = normalizeListChipIconsByShape(scenario.content.listChipIconsByShape, scenario.shape);
    scenario.content.listChipIconsByShape[scenario.shape][slot] = value;
    return scenario;
  });
  const bindListChipIconInput = (slot, inputEl) => {
    inputEl?.addEventListener("input", (e) => {
      const value = String(e.target.value || "").trim();
      commitListChipIconField(slot, value ? createIcon("emoji", value) : createIcon("none", ""));
    });
  };
  bindListChipIconInput("primary", UI.scenarioListChipPrimaryIconInput);
  bindListChipIconInput("secondary", UI.scenarioListChipSecondaryIconInput);
  bindListChipIconInput("detail", UI.scenarioListChipDetailIconInput);
  UI.scenarioPrimary?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content); scenario.content.textByShape[scenario.shape].primary = e.target.value; return scenario; }));
  UI.scenarioSecondary?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content); scenario.content.textByShape[scenario.shape].secondary = e.target.value; return scenario; }));
  UI.scenarioDetail?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content); scenario.content.textByShape[scenario.shape].detail = e.target.value; return scenario; }));
  UI.scenarioIntentHeader?.addEventListener("input", (e) => sidebar.commitScenarioChange((scenario) => { scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content); scenario.content.textByShape[scenario.shape].intentHeader = e.target.value; return scenario; }));
  UI.scenarioShapeRow?.addEventListener("click", (e) => {
    const button = e.target.closest("[data-scenario-shape]");
    const shape = String(button?.dataset?.scenarioShape || "");
    if (!availableScenarioShapes().includes(shape)) return;
    sidebar.commitScenarioChange((scenario) => {
      scenario.shape = shape;
      scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, shape, scenario.content);
      scenario.content.typographyByShape = normalizeTypographyByShape(scenario.content.typographyByShape, shape);
      scenario.content.sizeByShape = normalizeStageSizeByShape(scenario.content.sizeByShape, shape, scenario.content);
      return scenario;
    });
  });

  UI.stageAdd?.addEventListener("click", () => sidebar.addStage());
  UI.stageDuplicate?.addEventListener("click", () => sidebar.duplicateCurrentStage());
  UI.stageDelete?.addEventListener("click", () => sidebar.deleteCurrentStage());
  UI.stageReset?.addEventListener("click", () => sidebar.resetCurrentStageToDefault());
  UI.stageNameInput?.addEventListener("input", (e) => { const stage = stageById(selectedScenario()?.shape); if (stage) sidebar.commitStageChange(stage.id, (draft) => { draft.name = String(e.target.value || ""); return draft; }); });
  UI.stageNameInput?.addEventListener("blur", (e) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    if (String(e.target.value || "").trim()) return;
    sidebar.commitStageChange(stage.id, (draft) => { draft.name = "Untitled Stage"; return draft; });
  });
  UI.stageCardSToggle?.addEventListener("change", (e) => {
    const scenario = selectedScenario();
    const stage = stageById(scenario?.shape, scenario);
    if (!scenario || !stage) return;
    sidebar.commitScenarioChange((draft) => {
      draft.content.stageRenderShapeById = { ...(draft.content.stageRenderShapeById || {}) };
      draft.content.stageRenderShapeById[stage.id] = e.target.checked ? "card-s" : "card";
      return draft;
    });
  });
  UI.stagePhoneBlurToggle?.addEventListener("change", (e) => { const stage = stageById(selectedScenario()?.shape); if (stage) sidebar.commitStageChange(stage.id, (draft) => { draft.phoneBgBlur = e.target.checked; return draft; }); });
  UI.stageSelectedToggle?.addEventListener("change", (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    sidebar.commitScenarioChange((draft) => {
      draft.content.selectedByShape = { ...(draft.content.selectedByShape || {}) };
      draft.content.selectedByShape[draft.shape] = e.target.checked;
      return draft;
    });
  });
  UI.stageAccentColor?.addEventListener("input", (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    sidebar.commitScenarioChange((draft) => {
      draft.content.accentColorByShape = { ...(draft.content.accentColorByShape || {}) };
      draft.content.accentColorByShape[draft.shape] = String(e.target.value || '#90acff');
      return draft;
    });
  });
  UI.stageAccentSecondaryColor?.addEventListener("input", (e) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    sidebar.commitScenarioChange((draft) => {
      draft.content.secondaryAccentColorByShape = { ...(draft.content.secondaryAccentColorByShape || {}) };
      draft.content.secondaryAccentColorByShape[draft.shape] = String(e.target.value || '#9761ff');
      return draft;
    });
  });
  UI.stageComponentControls?.addEventListener("click", (e) => {
    const button = e.target.closest("[data-stage-comp-action][data-stage-comp-type]");
    const type = String(button?.dataset?.stageCompType || "");
    const action = String(button?.dataset?.stageCompAction || "");
    const stage = stageById(selectedScenario()?.shape);
    if (!stage || !STAGE_COMPONENT_TYPES.includes(type)) return;
    sidebar.commitStageChange(stage.id, (draft) => { const next = [...(draft.components || [])]; if (action === "add") next.push(type); else if (action === "remove") { const idx = next.lastIndexOf(type); if (idx >= 0) next.splice(idx, 1); } draft.components = next; return draft; });
  });
  UI.stageComponentControls?.addEventListener("change", (e) => {
    const checkbox = e.target.closest("[data-stage-comp-toggle]");
    const type = String(checkbox?.dataset?.stageCompToggle || "");
    const stage = stageById(selectedScenario()?.shape);
    if (!stage || !["icon", "primary", "secondary", "detail", "intent-header"].includes(type)) return;
    sidebar.commitStageChange(stage.id, (draft) => { const next = [...(draft.components || [])].filter((item) => item !== type); if (checkbox.checked) next.push(type); draft.components = next; return draft; });
  });

  const readAssetDataUrl = async (file) => {
    if (!file || !sidebar.isSupportedAssetFile(file)) return "";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    }).catch(() => "");
  };
  UI.scenarioIconReset?.addEventListener("click", () => {
    sidebar.commitScenarioChange((scenario) => {
      scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
      scenario.content.iconByShape[scenario.shape] = createIcon("none", "");
      return scenario;
    });
    if (UI.scenarioIconUpload) UI.scenarioIconUpload.value = "";
  });
  UI.scenarioIconUpload?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    const dataUrl = await readAssetDataUrl(file);
    if (!dataUrl) return void (e.target.value = "");
    sidebar.commitScenarioChange((scenario) => {
      scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
      scenario.content.iconByShape[scenario.shape] = createIcon("image", dataUrl);
      return scenario;
    });
    e.target.value = "";
  });
  UI.scenarioIconUpload?.addEventListener("click", (e) => { e.target.value = ""; });
  const bindListChipIconUpload = (slot, uploadEl, resetEl) => {
    resetEl?.addEventListener("click", () => {
      commitListChipIconField(slot, createIcon("none", ""));
      if (uploadEl) uploadEl.value = "";
    });
    uploadEl?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      const dataUrl = await readAssetDataUrl(file);
      if (!dataUrl) return void (e.target.value = "");
      commitListChipIconField(slot, createIcon("image", dataUrl));
      e.target.value = "";
    });
    uploadEl?.addEventListener("click", (e) => { e.target.value = ""; });
  };
  bindListChipIconUpload("primary", UI.scenarioListChipPrimaryIconUpload, UI.scenarioListChipPrimaryIconReset);
  bindListChipIconUpload("secondary", UI.scenarioListChipSecondaryIconUpload, UI.scenarioListChipSecondaryIconReset);
  bindListChipIconUpload("detail", UI.scenarioListChipDetailIconUpload, UI.scenarioListChipDetailIconReset);

  sidebar.bindTypographyInputs("icon", UI.scenarioIconSize, UI.scenarioIconColor);
  sidebar.bindTypographyInputs("primary", UI.scenarioPrimarySize, UI.scenarioPrimaryColor);
  sidebar.bindTypographyInputs("secondary", UI.scenarioSecondarySize, UI.scenarioSecondaryColor);
  sidebar.bindTypographyInputs("detail", UI.scenarioDetailSize, UI.scenarioDetailColor);
  if (UI.scenarioIntentHeaderSize && UI.scenarioIntentHeaderColor) sidebar.bindTypographyInputs("intentHeader", UI.scenarioIntentHeaderSize, UI.scenarioIntentHeaderColor);
  [UI.scenarioIconInput, UI.scenarioListChipPrimaryIconInput, UI.scenarioListChipSecondaryIconInput, UI.scenarioListChipDetailIconInput, UI.scenarioPrimary, UI.scenarioSecondary, UI.scenarioDetail, UI.scenarioIntentHeader, UI.scenarioIconSize, UI.scenarioIconColor, UI.scenarioPrimarySize, UI.scenarioPrimaryColor, UI.scenarioSecondarySize, UI.scenarioSecondaryColor, UI.scenarioDetailSize, UI.scenarioDetailColor, UI.scenarioIntentHeaderSize, UI.scenarioIntentHeaderColor].forEach((el) => { if (el) el.addEventListener("input", sidebar.updateLayerPreviews); });
  sidebar.initSidebarTabs();
  sidebar.initLayerRowToggles();
  sidebar.initSidebarCollapsibleSections();
}
