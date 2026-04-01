export function createSidebarRender(ctx, refs) {
  function stageComponentLabel(type) {
    return type === 'intent-header' ? 'intent header' : type;
  }

  function renderScenarioList() {
    const scenario = ctx.selectedScenario();
    if (!ctx.UI.scenarioList) return;
    ctx.UI.scenarioList.innerHTML = '';
    ctx.getScenarioLibrary().forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scenario-item' + (item.id === ctx.getSelectedScenarioId() ? ' active' : '');
      const stage = ctx.stageById(item.shape);
      button.innerHTML = `<span class="scenario-item-name">${item.name}</span><span class="scenario-item-meta">${stage?.name || item.shape}</span>`;
      button.addEventListener('click', () => refs.actions.selectScenario(item.id));
      ctx.UI.scenarioList.appendChild(button);
    });
    if (ctx.UI.scenarioDuplicate) ctx.UI.scenarioDuplicate.disabled = !scenario;
    if (ctx.UI.scenarioDelete) ctx.UI.scenarioDelete.disabled = ctx.getScenarioLibrary().length <= 1;
  }

  function renderScenarioStageChips() {
    const scenario = ctx.selectedScenario();
    if (!ctx.UI.scenarioShapeRow) return;
    ctx.UI.scenarioShapeRow.innerHTML = '';
    const stages = typeof ctx.visibleScenarioStages === 'function'
      ? ctx.visibleScenarioStages(scenario)
      : ctx.getStageLibrary();
    stages.forEach((stage) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'shape-chip' + (scenario?.shape === stage.id ? ' active' : '');
      button.dataset.scenarioShape = stage.id;
      button.textContent = stage.name;
      button.title = stage.id;
      ctx.UI.scenarioShapeRow.appendChild(button);
    });
  }

  function renderStageComponentControls(stage) {
    if (!ctx.UI.stageComponentControls) return;
    ctx.UI.stageComponentControls.innerHTML = '';
    if (!stage) return;
    const list = document.createElement('div');
    list.className = 'stage-comp-list';
    const counts = ctx.stageComponentCounts(stage);
    ctx.STAGE_COMPONENT_TYPES.forEach((type) => {
      const row = document.createElement('div');
      const isSingleToggle = ['icon', 'primary', 'secondary', 'detail', 'intent-header'].includes(type);
      row.className = 'stage-comp-row' + (isSingleToggle ? ' toggle' : '');
      if (isSingleToggle) {
        row.innerHTML = `<span class="stage-comp-label">${stageComponentLabel(type)}</span><input class="stage-comp-check" type="checkbox" data-stage-comp-toggle="${type}" ${counts[type] > 0 ? 'checked' : ''}/>`;
      } else {
        row.innerHTML = `<span class="stage-comp-label">${stageComponentLabel(type)}</span><button type="button" class="stage-comp-btn" data-stage-comp-action="remove" data-stage-comp-type="${type}">-</button><span class="stage-comp-count">${counts[type]}</span><button type="button" class="stage-comp-btn" data-stage-comp-action="add" data-stage-comp-type="${type}">+</button>`;
        const removeBtn = row.querySelector('[data-stage-comp-action="remove"]');
        if (removeBtn) removeBtn.disabled = counts[type] <= 0;
      }
      list.appendChild(row);
    });
    ctx.UI.stageComponentControls.appendChild(list);
  }

  function renderStageConfigPanel() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    const builtin = ctx.builtinStageById(stage?.id);
    const sizeOverride = ctx.scenarioStageSizeOverride(scenario, scenario?.shape);
    const stageSelected = ctx.stageSelectedForShape ? ctx.stageSelectedForShape(scenario, scenario?.shape) : !!stage?.selected;
    const stageAccentColor = ctx.stageAccentColorForShape ? ctx.stageAccentColorForShape(scenario, scenario?.shape) : String(stage?.accentColor || '#90acff');
    const stageAccentSecondaryColor = ctx.stageSecondaryAccentColorForShape ? ctx.stageSecondaryAccentColorForShape(scenario, scenario?.shape) : String(stage?.secondaryAccentColor || '#9761ff');
    const renderShape = ctx.stageRenderShapeForShape ? ctx.stageRenderShapeForShape(scenario, scenario?.shape) : String(stage?.renderShape || '');
    const isCardLike = renderShape === 'card' || renderShape === 'card-s';
    if (ctx.UI.stageNameInput) ctx.UI.stageNameInput.value = stage?.name || '';
    if (ctx.UI.stageRadiusInput) ctx.UI.stageRadiusInput.value = Number.isFinite(stage?.cornerRadius) ? String(stage.cornerRadius) : '';
    if (ctx.UI.stageWidthInput) ctx.UI.stageWidthInput.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '';
    if (ctx.UI.stageHeightInput) ctx.UI.stageHeightInput.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '';
    if (ctx.UI.stageGapInput) ctx.UI.stageGapInput.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '';
    if (ctx.UI.stageIconPadInput) ctx.UI.stageIconPadInput.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '';
    if (ctx.UI.stagePhoneBlurToggle) ctx.UI.stagePhoneBlurToggle.checked = !!stage?.phoneBgBlur;
    if (ctx.UI.stageCardSRow) ctx.UI.stageCardSRow.classList.toggle('hidden', !isCardLike);
    if (ctx.UI.stageCardSToggle) {
      ctx.UI.stageCardSToggle.checked = renderShape === 'card-s';
      ctx.UI.stageCardSToggle.disabled = !stage || !isCardLike;
    }
    if (ctx.UI.stageSelectedToggle) ctx.UI.stageSelectedToggle.checked = !!stageSelected;
    if (ctx.UI.stageAccentColor) {
      ctx.UI.stageAccentColor.value = String(stageAccentColor || '#90acff');
      ctx.UI.stageAccentColor.disabled = !stage;
    }
    if (ctx.UI.stageAccentSecondaryColor) {
      ctx.UI.stageAccentSecondaryColor.value = String(stageAccentSecondaryColor || '#9761ff');
      ctx.UI.stageAccentSecondaryColor.disabled = !stage;
    }
    if (ctx.UI.stageComponentsPanel) ctx.UI.stageComponentsPanel.classList.remove('hidden');
    if (ctx.UI.stageDuplicate) ctx.UI.stageDuplicate.disabled = !stage;
    if (ctx.UI.stageDelete) ctx.UI.stageDelete.disabled = !stage;
    if (ctx.UI.stageReset) ctx.UI.stageReset.disabled = !stage || !builtin;
    renderStageComponentControls(stage);
  }

  function renderScenarioMediaEditor(scenario, stage) {
    if (!ctx.UI.scenarioMediaList) return;
    ctx.UI.scenarioMediaList.innerHTML = '';
    const images = refs.actions.getScenarioImagesForStage(scenario, stage);
    if (!images.length) return;
    images.forEach((image, index) => {
      const row = document.createElement('div');
      row.className = 'media-upload-row';
      const inputId = `scenario-media-upload-${index}`;
      row.innerHTML = `<label class="sb-mini-btn upload-btn" for="${inputId}">PNG/GIF ${index + 1}<input id="${inputId}" data-media-upload-index="${index}" type="file" accept="image/png,image/gif"/></label><button class="sb-mini-btn" type="button" data-media-reset-index="${index}">Reset</button>`;
      ctx.UI.scenarioMediaList.appendChild(row);
      const badge = document.createElement('div');
      badge.className = 'icon-mode-badge';
      badge.textContent = image ? 'loaded' : 'empty';
      ctx.UI.scenarioMediaList.appendChild(badge);
    });
  }

  function renderScenarioEditor() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    const visibleTextFields = ctx.stageVisibleEditorFields(stage);
    const hasIcon = ctx.stageHasComponent(stage, 'icon');
    const hasImage = ctx.stageHasComponent(stage, 'image');
    const hasIntentHeader = ctx.stageHasComponent(stage, 'intent-header');
    if (ctx.UI.scenarioName) ctx.UI.scenarioName.value = scenario?.name || '';
    if (ctx.UI.scenarioTriggers) ctx.UI.scenarioTriggers.value = (scenario?.triggers || []).join(', ');
    const stageIcon = ctx.stageIconForShape(scenario, scenario?.shape);
    const stageText = ctx.stageTextForShape(scenario, scenario?.shape);
    const typography = ctx.getScenarioTypography(scenario, scenario?.shape);
    if (ctx.UI.scenarioIconInput) ctx.UI.scenarioIconInput.value = stageIcon.kind === 'emoji' ? stageIcon.value : '';
    if (ctx.UI.scenarioIconMode) ctx.UI.scenarioIconMode.textContent = stageIcon.kind === 'image' ? 'png/gif' : (stageIcon.kind || 'none');
    if (ctx.UI.scenarioPrimary) ctx.UI.scenarioPrimary.value = stageText.primary;
    if (ctx.UI.scenarioSecondary) ctx.UI.scenarioSecondary.value = stageText.secondary;
    if (ctx.UI.scenarioDetail) ctx.UI.scenarioDetail.value = stageText.detail;
    if (ctx.UI.scenarioIntentHeader) ctx.UI.scenarioIntentHeader.value = stageText.intentHeader || '';
    if (ctx.UI.scenarioIconSize) ctx.UI.scenarioIconSize.value = String(typography.icon.size);
    if (ctx.UI.scenarioIconColor) ctx.UI.scenarioIconColor.value = typography.icon.color;
    if (ctx.UI.scenarioPrimarySize) ctx.UI.scenarioPrimarySize.value = String(typography.primary.size);
    if (ctx.UI.scenarioPrimaryColor) ctx.UI.scenarioPrimaryColor.value = typography.primary.color;
    if (ctx.UI.scenarioSecondarySize) ctx.UI.scenarioSecondarySize.value = String(typography.secondary.size);
    if (ctx.UI.scenarioSecondaryColor) ctx.UI.scenarioSecondaryColor.value = typography.secondary.color;
    if (ctx.UI.scenarioDetailSize) ctx.UI.scenarioDetailSize.value = String(typography.detail.size);
    if (ctx.UI.scenarioDetailColor) ctx.UI.scenarioDetailColor.value = typography.detail.color;
    if (ctx.UI.scenarioIntentHeaderSize) ctx.UI.scenarioIntentHeaderSize.value = String(typography.intentHeader.size);
    if (ctx.UI.scenarioIntentHeaderColor) ctx.UI.scenarioIntentHeaderColor.value = typography.intentHeader.color;
    if (ctx.UI.editorIcon) ctx.UI.editorIcon.classList.toggle('hidden', !hasIcon);
    if (ctx.UI.editorPrimary) ctx.UI.editorPrimary.classList.toggle('hidden', !visibleTextFields.has('primary'));
    if (ctx.UI.editorSecondary) ctx.UI.editorSecondary.classList.toggle('hidden', !visibleTextFields.has('secondary'));
    if (ctx.UI.editorDetail) ctx.UI.editorDetail.classList.toggle('hidden', !visibleTextFields.has('detail'));
    if (ctx.UI.editorIntentHeader) ctx.UI.editorIntentHeader.classList.toggle('hidden', !hasIntentHeader);
    if (ctx.UI.editorMedia) ctx.UI.editorMedia.classList.toggle('hidden', !hasImage);
    renderScenarioStageChips();
    renderStageConfigPanel();
    renderScenarioMediaEditor(scenario, stage);
  }

  function renderScenarioUi() {
    refs.actions.renderAiStageOverrideUi();
    renderScenarioList();
    renderScenarioEditor();
    refs.bindings.updateLayerPreviews();
  }

  return {
    renderScenarioList,
    renderStageComponentControls,
    renderStageConfigPanel,
    renderScenarioMediaEditor,
    renderScenarioEditor,
    renderScenarioUi,
  };
}
