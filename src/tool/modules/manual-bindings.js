export function initManualBindings({
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
  renderAiStageOverrideUi,
  previewAiStageOverride,
  renderScenarioUi,
  addScenario,
  duplicateScenario,
  deleteScenario,
  commitScenarioChange,
  addStage,
  deleteCurrentStage,
  resetCurrentStageToDefault,
  commitStageChange,
  getScenarioImagesForStage,
  isSupportedAssetFile,
  bindTypographyInputs,
  updateLayerPreviews,
  initSidebarTabs,
  initLayerRowToggles,
  initSidebarCollapsibleSections,
  applyCanvasSettings,
  applyStagePhoneBlur,
  applyResponseModeUi,
  previewScenarioInstant,
  previewScenario,
  hideRich,
  hideIntentHeader,
  handleSend,
  manualShape,
  openCustom,
  flight,
  rebuildAnim,
  initStarfield,
}) {
  const input = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  const commitPhoneFrameSize = (axis, rawValue) => {
    const parsed = parseInt(String(rawValue || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    const key = axis === 'w' ? 'phoneFrameWidth' : 'phoneFrameHeight';
    const bounded = axis === 'w' ? clamp(parsed, 240, 600) : clamp(parsed, 420, 1200);
    const next = { ...canvasSettings(), [key]: bounded };
    setCanvasSettings(next);
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
  };

  const commitStageRadius = (rawValue) => {
    const scenario = selectedScenario();
    const stage = stageById(scenario?.shape);
    if (!stage) return;
    const parsed = parseInt(String(rawValue || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    const nextRadius = clamp(parsed, 0, 120);
    commitStageChange(stage.id, (draft) => { draft.cornerRadius = nextRadius; });
  };

  const commitStageSizeOverride = (axis, rawValue) => {
    const scenario = selectedScenario();
    if (!scenario) return;
    const value = String(rawValue || '').trim();
    const key = axis === 'width' ? 'widthOverride' : 'heightOverride';
    if (!value) {
      commitScenarioChange((draftScenario) => {
        draftScenario.content.sizeByShape = normalizeStageSizeByShape(draftScenario.content.sizeByShape, draftScenario.shape, draftScenario.content);
        draftScenario.content.sizeByShape[draftScenario.shape][key] = null;
      });
      return;
    }
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const bounded = clamp(parsed, 40, 1400);
    commitScenarioChange((draftScenario) => {
      draftScenario.content.sizeByShape = normalizeStageSizeByShape(draftScenario.content.sizeByShape, draftScenario.shape, draftScenario.content);
      draftScenario.content.sizeByShape[draftScenario.shape][key] = bounded;
    });
  };

  const commitStageGapOverride = (rawValue) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    const value = String(rawValue || '').trim();
    if (!value) return void commitStageChange(stage.id, (draft) => { draft.iconTextGap = null; });
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    commitStageChange(stage.id, (draft) => { draft.iconTextGap = clamp(parsed, 0, 80); });
  };

  const commitStageIconPadOverride = (rawValue) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    const value = String(rawValue || '').trim();
    if (!value) return void commitStageChange(stage.id, (draft) => { draft.iconLeftPadding = null; });
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    commitStageChange(stage.id, (draft) => { draft.iconLeftPadding = clamp(parsed, 0, 120); });
  };

  input.addEventListener('input', () => sendBtn.classList.toggle('active', input.value.trim().length > 0));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      handleSend();
    }
    e.stopPropagation();
  });

  document.addEventListener('keydown', (e) => {
    if (document.activeElement?.matches?.('input, textarea, select')) return;
    if (flight.handleKeyDown(e)) return;
    if (e.key === '1') manualShape('circle');
    if (e.key === '2') manualShape('dot');
    if (e.key === '3') manualShape('pill');
    if (e.key === '4') manualShape('card');
    if (e.key === '5') manualShape('list');
    if (e.key === '8') manualShape('ai');
    if (e.key === '6') manualShape('split');
    if (e.key === '7') openCustom();
    if (e.key === 'Escape') {
      document.getElementById('stage').classList.remove('flow-active');
      document.getElementById('input-area').classList.remove('hidden');
      hideRich();
      hideIntentHeader();
      previewScenario(selectedScenario());
    }
  });

  document.querySelectorAll('.bz-inp, .sp-inp, .sb-input, .sb-textarea, .typo-color').forEach((inp) => inp.addEventListener('keydown', (e) => e.stopPropagation()));

  if (UI.modeToggle && !PAGE_MODE_OVERRIDE) {
    UI.modeToggle.addEventListener('change', () => {
      setResponseMode(UI.modeToggle.checked ? RESPONSE_MODE.AI : RESPONSE_MODE.MANUAL);
      persistResponseMode();
      applyResponseModeUi();
      if (responseMode() === RESPONSE_MODE.AI) {
        hideRich();
        hideIntentHeader();
        document.getElementById('stage').classList.remove('flow-active');
        document.getElementById('input-area').classList.remove('hidden');
        previewAiStageOverride();
      }
    });
  }

  UI.aiStageButtons.forEach((button) => button.addEventListener('click', () => {
    const stage = button.dataset.aiStage;
    if (!Object.values(AI_STAGE_OVERRIDE).includes(stage)) return;
    setAiStageOverride(stage);
    persistAiStageOverride();
    renderAiStageOverrideUi();
    previewAiStageOverride();
  }));

  const updateCanvas = (updates) => { setCanvasSettings({ ...canvasSettings(), ...updates }); persistCanvasSettings(); applyCanvasSettings(); };
  UI.bgToggle.addEventListener('change', () => updateCanvas({ backgroundEnabled: UI.bgToggle.checked }));
  UI.floatToggle.addEventListener('change', () => updateCanvas({ floatingEnabled: UI.floatToggle.checked }));
  UI.alignBottomToggle.addEventListener('change', () => {
    updateCanvas({ bottomAlign: UI.alignBottomToggle.checked });
    if (responseMode() === RESPONSE_MODE.AI) previewAiStageOverride();
    else previewScenario(selectedScenario());
  });

  UI.frameGlassesToggle.addEventListener('change', () => {
    const nextMode = UI.frameGlassesToggle.checked ? 'glasses' : 'none';
    if (nextMode === 'glasses' && UI.framePhoneToggle) UI.framePhoneToggle.checked = false;
    const scenario = selectedScenario();
    if (!scenario) return;
    scenario.content.canvas = normalizeScenarioCanvas(scenario.content.canvas, { frameMode: canvasSettings().frameMode });
    scenario.content.canvas.frameMode = nextMode;
    persistScenarios();
    renderScenarioUi();
    applyCanvasSettings();
    applyStagePhoneBlur(scenario.shape);
  });

  UI.framePhoneToggle.addEventListener('change', () => {
    const nextMode = UI.framePhoneToggle.checked ? 'phone' : 'none';
    if (nextMode === 'phone' && UI.frameGlassesToggle) UI.frameGlassesToggle.checked = false;
    if (nextMode === 'phone') setCanvasSettings({ ...canvasSettings(), floatingEnabled: false });
    persistCanvasSettings();
    const scenario = selectedScenario();
    if (!scenario) return;
    scenario.content.canvas = normalizeScenarioCanvas(scenario.content.canvas, { frameMode: canvasSettings().frameMode });
    scenario.content.canvas.frameMode = nextMode;
    persistScenarios();
    renderScenarioUi();
    applyCanvasSettings();
    applyStagePhoneBlur(scenario.shape);
  });

  UI.phoneFrameWidth.addEventListener('change', (e) => commitPhoneFrameSize('w', e.target.value));
  UI.phoneFrameHeight.addEventListener('change', (e) => commitPhoneFrameSize('h', e.target.value));
  UI.frameCornerRadius.addEventListener('change', (e) => {
    const parsed = parseInt(String(e.target.value || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    setCanvasSettings({ ...canvasSettings(), frameCornerRadius: clamp(parsed, 0, 120) });
    persistCanvasSettings();
    applyCanvasSettings();
  });

  UI.phoneBgUpload.addEventListener('click', (e) => { e.target.value = ''; });
  UI.phoneBgUpload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) return void (e.target.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return;
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dimensions?.width || !dimensions?.height) return;
    setCanvasSettings({ ...canvasSettings(), phoneFrameBackground: { src: dataUrl, width: dimensions.width, height: dimensions.height } });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
    e.target.value = '';
  });
  UI.phoneBgReset.addEventListener('click', () => {
    setCanvasSettings({ ...canvasSettings(), phoneFrameBackground: null });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
    UI.phoneBgUpload.value = '';
  });
  UI.phoneBgVisibleToggle.addEventListener('change', () => {
    setCanvasSettings({ ...canvasSettings(), phoneBgEnabled: UI.phoneBgVisibleToggle.checked });
    persistCanvasSettings();
    applyCanvasSettings();
    applyStagePhoneBlur(selectedScenario()?.shape);
  });

  UI.scenarioAdd.addEventListener('click', () => addScenario('pill'));
  UI.scenarioDuplicate.addEventListener('click', duplicateScenario);
  UI.scenarioDelete.addEventListener('click', deleteScenario);
  UI.scenarioName.addEventListener('input', (e) => commitScenarioChange((scenario) => { scenario.name = e.target.value.trim() || 'Untitled Scenario'; }));
  UI.scenarioTriggers.addEventListener('input', (e) => commitScenarioChange((scenario) => { scenario.triggers = normalizeTriggers(e.target.value); }));
  UI.scenarioIconInput.addEventListener('input', (e) => commitScenarioChange((scenario) => {
    const value = String(e.target.value || '').trim();
    scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
    scenario.content.iconByShape[scenario.shape] = value ? createIcon('emoji', value) : createIcon('none', '');
  }));
  const commitTextField = (field, el) => el.addEventListener('input', (e) => commitScenarioChange((scenario) => {
    scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, scenario.shape, scenario.content);
    scenario.content.textByShape[scenario.shape][field] = e.target.value;
  }));
  commitTextField('primary', UI.scenarioPrimary);
  commitTextField('secondary', UI.scenarioSecondary);
  commitTextField('detail', UI.scenarioDetail);
  UI.scenarioShapeRow.addEventListener('click', (e) => {
    const button = e.target.closest('[data-scenario-shape]');
    if (!button) return;
    const shape = String(button.dataset.scenarioShape || '');
    if (!availableScenarioShapes().includes(shape)) return;
    commitScenarioChange((scenario) => {
      scenario.shape = shape;
      scenario.content.textByShape = normalizeStageTextByShape(scenario.content.textByShape, shape, scenario.content);
      scenario.content.typographyByShape = normalizeTypographyByShape(scenario.content.typographyByShape, shape);
      scenario.content.sizeByShape = normalizeStageSizeByShape(scenario.content.sizeByShape, shape, scenario.content);
    });
  });

  UI.stageAdd.addEventListener('click', () => {
    const kind = String(UI.stageAddKind?.value || 'card');
    addStage(kind);
  });
  UI.stageDelete.addEventListener('click', () => deleteCurrentStage());
  UI.stageReset.addEventListener('click', () => resetCurrentStageToDefault());
  UI.stageNameInput.addEventListener('input', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => { draft.name = String(e.target.value || '').trim() || 'Untitled Stage'; });
  });
  UI.stageRadiusInput.addEventListener('change', (e) => commitStageRadius(e.target.value));
  UI.stageRadiusInput.addEventListener('blur', (e) => {
    const value = String(e.target.value || '').trim();
    if (!value) {
      const stage = stageById(selectedScenario()?.shape);
      e.target.value = stage ? String(stage.cornerRadius) : '';
      return;
    }
    commitStageRadius(value);
  });
  UI.stageWidthInput.addEventListener('change', (e) => commitStageSizeOverride('width', e.target.value));
  UI.stageWidthInput.addEventListener('blur', (e) => {
    const scenario = selectedScenario();
    const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '');
    commitStageSizeOverride('width', value);
  });
  UI.stageHeightInput.addEventListener('change', (e) => commitStageSizeOverride('height', e.target.value));
  UI.stageHeightInput.addEventListener('blur', (e) => {
    const scenario = selectedScenario();
    const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '');
    commitStageSizeOverride('height', value);
  });
  UI.stageGapInput.addEventListener('change', (e) => commitStageGapOverride(e.target.value));
  UI.stageGapInput.addEventListener('blur', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '');
    commitStageGapOverride(value);
  });
  UI.stageIconPadInput.addEventListener('change', (e) => commitStageIconPadOverride(e.target.value));
  UI.stageIconPadInput.addEventListener('blur', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    const value = String(e.target.value || '').trim();
    if (!value) return void (e.target.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '');
    commitStageIconPadOverride(value);
  });
  UI.stagePhoneBlurToggle.addEventListener('change', (e) => {
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => { draft.phoneBgBlur = e.target.checked; });
  });

  UI.stageComponentControls.addEventListener('click', (e) => {
    const button = e.target.closest('[data-stage-comp-action][data-stage-comp-type]');
    if (!button) return;
    const action = String(button.dataset.stageCompAction || '');
    const type = String(button.dataset.stageCompType || '');
    if (!STAGE_COMPONENT_TYPES.includes(type)) return;
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => {
      const next = [...(draft.components || [])];
      if (action === 'add') next.push(type);
      else if (action === 'remove') {
        const removeIndex = next.lastIndexOf(type);
        if (removeIndex >= 0) next.splice(removeIndex, 1);
      }
      draft.components = next;
    });
  });
  UI.stageComponentControls.addEventListener('change', (e) => {
    const checkbox = e.target.closest('[data-stage-comp-toggle]');
    if (!checkbox) return;
    const type = String(checkbox.dataset.stageCompToggle || '');
    if (!['icon', 'primary', 'secondary', 'detail'].includes(type)) return;
    const stage = stageById(selectedScenario()?.shape);
    if (!stage) return;
    commitStageChange(stage.id, (draft) => {
      const next = [...(draft.components || [])].filter((item) => item !== type);
      if (checkbox.checked) next.push(type);
      draft.components = next;
    });
  });

  UI.scenarioIconReset.addEventListener('click', () => {
    commitScenarioChange((scenario) => {
      scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
      scenario.content.iconByShape[scenario.shape] = createIcon('none', '');
    });
    UI.scenarioIconUpload.value = '';
  });
  UI.scenarioIconUpload.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedAssetFile(file)) return void (e.target.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return;
    commitScenarioChange((scenario) => {
      scenario.content.iconByShape = normalizeIconByShape(scenario.content.iconByShape, scenario.shape, scenario.content.icon);
      scenario.content.iconByShape[scenario.shape] = createIcon('image', dataUrl);
    });
    e.target.value = '';
  });
  UI.scenarioIconUpload.addEventListener('click', (e) => { e.target.value = ''; });

  UI.editorMedia.addEventListener('click', (e) => {
    const button = e.target.closest('[data-media-reset-index]');
    if (!button) return;
    const index = parseInt(button.dataset.mediaResetIndex, 10);
    if (!Number.isFinite(index) || index < 0) return;
    commitScenarioChange((scenario) => {
      const stage = stageById(scenario.shape);
      const images = getScenarioImagesForStage(scenario, stage);
      images[index] = null;
      scenario.content.imagesByShape = normalizeImagesByShape(scenario.content.imagesByShape, scenario.shape, scenario.content.images);
      scenario.content.imagesByShape[scenario.shape] = images.filter(Boolean);
    });
  });
  UI.editorMedia.addEventListener('change', async (e) => {
    const inputEl = e.target.closest('[data-media-upload-index]');
    if (!inputEl) return;
    const index = parseInt(inputEl.dataset.mediaUploadIndex, 10);
    if (!Number.isFinite(index) || index < 0) return;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (!isSupportedAssetFile(file)) return void (inputEl.value = '');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) return;
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dimensions?.width || !dimensions?.height) return;
    commitScenarioChange((scenario) => {
      const stage = stageById(scenario.shape);
      const images = getScenarioImagesForStage(scenario, stage);
      images[index] = { src: dataUrl, width: dimensions.width, height: dimensions.height };
      scenario.content.imagesByShape = normalizeImagesByShape(scenario.content.imagesByShape, scenario.shape, scenario.content.images);
      scenario.content.imagesByShape[scenario.shape] = images.filter(Boolean);
    });
    inputEl.value = '';
  });
  UI.editorMedia.addEventListener('click', (e) => {
    const inputEl = e.target.closest('[data-media-upload-index]');
    if (!inputEl) return;
    inputEl.value = '';
  });

  bindTypographyInputs('icon', UI.scenarioIconSize, UI.scenarioIconColor);
  bindTypographyInputs('primary', UI.scenarioPrimarySize, UI.scenarioPrimaryColor);
  bindTypographyInputs('secondary', UI.scenarioSecondarySize, UI.scenarioSecondaryColor);
  bindTypographyInputs('detail', UI.scenarioDetailSize, UI.scenarioDetailColor);
  [UI.scenarioIconInput, UI.scenarioPrimary, UI.scenarioSecondary, UI.scenarioDetail,
    UI.scenarioIconSize, UI.scenarioIconColor, UI.scenarioPrimarySize, UI.scenarioPrimaryColor,
    UI.scenarioSecondarySize, UI.scenarioSecondaryColor, UI.scenarioDetailSize, UI.scenarioDetailColor,
  ].forEach((el) => { if (el) el.addEventListener('input', updateLayerPreviews); });

  initSidebarTabs();
  initLayerRowToggles();
  initSidebarCollapsibleSections();
  applyCanvasSettings();
  applyResponseModeUi();
  renderScenarioUi();
  previewScenarioInstant(selectedScenario());
  rebuildAnim();
  initStarfield();
}
