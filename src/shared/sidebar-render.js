export function createSidebarRender(ctx, refs) {
  let scenarioClickTimer = null;

  function captureFocusedEditableState() {
    const active = document.activeElement;
    const isTextInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    if (!isTextInput) return null;
    if (!active.closest('#sidebar, #left-sidebar')) return null;
    return {
      id: active.id,
      selectionStart: typeof active.selectionStart === 'number' ? active.selectionStart : null,
      selectionEnd: typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
      selectionDirection: active.selectionDirection || 'none',
      scrollTop: typeof active.scrollTop === 'number' ? active.scrollTop : null,
    };
  }

  function restoreFocusedEditableState(state) {
    if (!state?.id) return;
    const next = document.getElementById(state.id);
    const isTextInput = next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement;
    if (!isTextInput || next.disabled) return;
    next.focus({ preventScroll: true });
    if (typeof next.setSelectionRange === 'function' && state.selectionStart !== null && state.selectionEnd !== null) {
      try {
        next.setSelectionRange(state.selectionStart, state.selectionEnd, state.selectionDirection);
      } catch {}
    }
    if (state.scrollTop !== null) next.scrollTop = state.scrollTop;
  }

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
      button.dataset.scenarioId = item.id;
      const stage = ctx.stageById(item.shape);
      button.innerHTML = `<span class="scenario-item-name">${item.name}</span><span class="scenario-item-meta">${stage?.name || item.shape}</span>`;
      button.addEventListener('click', (event) => {
        if (event.target.closest('.sb-inline-rename-input')) return;
        if (scenarioClickTimer) clearTimeout(scenarioClickTimer);
        scenarioClickTimer = setTimeout(() => {
          scenarioClickTimer = null;
          refs.actions.selectScenario(item.id);
        }, 220);
      });
      button.addEventListener('dblclick', () => {
        if (!scenarioClickTimer) return;
        clearTimeout(scenarioClickTimer);
        scenarioClickTimer = null;
      });
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
    const renderShape = String(stage?.renderShape || '');
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
    if (renderShape === 'list') {
      const listItemCount = ctx.stageListItemsForShape ? ctx.stageListItemsForShape(ctx.selectedScenario(), stage.id).length : 0;
      const row = document.createElement('div');
      row.className = 'stage-comp-row';
      row.innerHTML = `<span class="stage-comp-label">items</span><button type="button" class="stage-comp-btn" data-stage-list-count-action="remove">-</button><span class="stage-comp-count">${listItemCount}</span><button type="button" class="stage-comp-btn" data-stage-list-count-action="add">+</button>`;
      const removeBtn = row.querySelector('[data-stage-list-count-action="remove"]');
      const addBtn = row.querySelector('[data-stage-list-count-action="add"]');
      if (removeBtn) removeBtn.disabled = listItemCount <= 1;
      if (addBtn) addBtn.disabled = listItemCount >= 8;
      list.appendChild(row);

      const orbRow = document.createElement('div');
      orbRow.className = 'stage-comp-row toggle';
      orbRow.innerHTML = `<span class="stage-comp-label">bottom orb</span><input class="stage-comp-check" type="checkbox" data-stage-list-orb-toggle="1" ${stage?.listListeningOrb ? 'checked' : ''}/>`;
      list.appendChild(orbRow);

      const selectableRow = document.createElement('div');
      selectableRow.className = 'stage-comp-row toggle';
      selectableRow.innerHTML = `<span class="stage-comp-label">selectable</span><input class="stage-comp-check" type="checkbox" data-stage-list-selectable-toggle="1" ${stage?.listSelectable !== false ? 'checked' : ''}/>`;
      list.appendChild(selectableRow);
    }
    ctx.UI.stageComponentControls.appendChild(list);
  }

  function renderStageConfigPanel() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    const builtin = ctx.builtinStageById(stage?.id);
    const sizeOverride = ctx.scenarioStageSizeOverride(scenario, scenario?.shape);
    const stageSelected = ctx.stageSelectedForShape ? ctx.stageSelectedForShape(scenario, scenario?.shape) : !!stage?.selected;
    const stageBlobTopCoreColor = ctx.stageSelectedBlobTopCoreColorForShape
      ? ctx.stageSelectedBlobTopCoreColorForShape(scenario, scenario?.shape)
      : String(stage?.accentColor || '#90acff');
    const stageBlobTopEdgeColor = ctx.stageSelectedBlobTopEdgeColorForShape
      ? ctx.stageSelectedBlobTopEdgeColorForShape(scenario, scenario?.shape)
      : String(stage?.secondaryAccentColor || '#9761ff');
    const stageBlobBottomCoreColor = ctx.stageSelectedBlobBottomCoreColorForShape
      ? ctx.stageSelectedBlobBottomCoreColorForShape(scenario, scenario?.shape)
      : String(stage?.accentColor || '#90acff');
    const stageBlobBottomEdgeColor = ctx.stageSelectedBlobBottomEdgeColorForShape
      ? ctx.stageSelectedBlobBottomEdgeColorForShape(scenario, scenario?.shape)
      : String(stage?.secondaryAccentColor || '#9761ff');
    const stageMaskBlur = ctx.stageSelectedMaskBlurForShape
      ? ctx.stageSelectedMaskBlurForShape(scenario, scenario?.shape)
      : '';
    const renderShape = ctx.stageRenderShapeForShape ? ctx.stageRenderShapeForShape(scenario, scenario?.shape) : String(stage?.renderShape || '');
    const isCardLike = renderShape === 'card' || renderShape === 'card-s';
    if (ctx.UI.stageRadiusInput) ctx.UI.stageRadiusInput.value = Number.isFinite(stage?.cornerRadius) ? String(stage.cornerRadius) : '';
    if (ctx.UI.stageWidthInput) ctx.UI.stageWidthInput.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '';
    if (ctx.UI.stageHeightInput) ctx.UI.stageHeightInput.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '';
    if (ctx.UI.stageGapInput) ctx.UI.stageGapInput.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '';
    if (ctx.UI.stageIconPadInput) ctx.UI.stageIconPadInput.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '';
    if (ctx.UI.stageCardSRow) ctx.UI.stageCardSRow.classList.toggle('hidden', !isCardLike);
    if (ctx.UI.stageListCountRow) ctx.UI.stageListCountRow.classList.add('hidden');
    if (ctx.UI.stageListListeningOrbRow) ctx.UI.stageListListeningOrbRow.classList.add('hidden');
    const listItemCount = renderShape === 'list' && ctx.stageListItemsForShape
      ? ctx.stageListItemsForShape(scenario, scenario?.shape).length
      : 0;
    if (ctx.UI.stageListCountVal) ctx.UI.stageListCountVal.textContent = String(Math.max(0, listItemCount));
    if (ctx.UI.stageListCountDec) ctx.UI.stageListCountDec.disabled = !stage || renderShape !== 'list' || listItemCount <= 1;
    if (ctx.UI.stageListCountInc) ctx.UI.stageListCountInc.disabled = !stage || renderShape !== 'list' || listItemCount >= 8;
    if (ctx.UI.stageListListeningOrbToggle) {
      ctx.UI.stageListListeningOrbToggle.checked = !!stage?.listListeningOrb;
      ctx.UI.stageListListeningOrbToggle.disabled = !stage || renderShape !== 'list';
    }
    if (ctx.UI.stageCardSToggle) {
      ctx.UI.stageCardSToggle.checked = renderShape === 'card-s';
      ctx.UI.stageCardSToggle.disabled = !stage || !isCardLike;
    }
    if (ctx.UI.stageSelectedToggle) ctx.UI.stageSelectedToggle.checked = !!stageSelected;
    if (ctx.UI.stageBlobTopCoreColor) {
      ctx.UI.stageBlobTopCoreColor.value = String(stageBlobTopCoreColor || '#90acff');
      ctx.UI.stageBlobTopCoreColor.disabled = !stage;
    }
    if (ctx.UI.stageBlobTopEdgeColor) {
      ctx.UI.stageBlobTopEdgeColor.value = String(stageBlobTopEdgeColor || '#9761ff');
      ctx.UI.stageBlobTopEdgeColor.disabled = !stage;
    }
    if (ctx.UI.stageBlobBottomCoreColor) {
      ctx.UI.stageBlobBottomCoreColor.value = String(stageBlobBottomCoreColor || '#90acff');
      ctx.UI.stageBlobBottomCoreColor.disabled = !stage;
    }
    if (ctx.UI.stageBlobBottomEdgeColor) {
      ctx.UI.stageBlobBottomEdgeColor.value = String(stageBlobBottomEdgeColor || '#9761ff');
      ctx.UI.stageBlobBottomEdgeColor.disabled = !stage;
    }
    if (ctx.UI.stageMaskBlurInput) {
      ctx.UI.stageMaskBlurInput.value = Number.isFinite(stageMaskBlur) ? String(stageMaskBlur) : '';
      ctx.UI.stageMaskBlurInput.disabled = !stage;
    }
    if (ctx.UI.stageComponentsPanel) ctx.UI.stageComponentsPanel.classList.remove('hidden');
    if (ctx.UI.stageDuplicate) ctx.UI.stageDuplicate.disabled = !stage;
    if (ctx.UI.stageDelete) ctx.UI.stageDelete.disabled = !stage;
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

  function renderScenarioListItemsEditor(scenario, renderShape) {
    if (!ctx.UI.scenarioListItemsEditor) return;
    ctx.UI.scenarioListItemsEditor.innerHTML = '';
    const preview = document.getElementById('layer-preview-list-items-count');
    if (preview) preview.textContent = '0 chips';
    if (renderShape !== 'list') return;
    const items = ctx.stageListItemsForShape ? ctx.stageListItemsForShape(scenario, scenario?.shape) : [];
    if (preview) preview.textContent = `${items.length} chip${items.length === 1 ? '' : 's'}`;
    items.forEach((item, index) => {
      const primaryId = `scenario-list-item-primary-${index}`;
      const secondaryId = `scenario-list-item-secondary-${index}`;
      const iconInputId = `scenario-list-item-icon-input-${index}`;
      const iconUploadId = `scenario-list-item-icon-upload-${index}`;
      const icon = item?.icon || ctx.createIcon('none', '');
      const iconValue = icon.kind === 'emoji' ? icon.value : '';
      const modeText = icon.kind === 'image'
        ? 'png/gif'
        : icon.kind === 'emoji'
        ? 'emoji'
        : 'default';
      const row = document.createElement('div');
      row.className = 'sb-row tight';
      row.innerHTML = `
        <label class="sb-lbl" for="${primaryId}">Row ${index + 1}</label>
        <input id="${primaryId}" class="sb-input" type="text" autocomplete="off" spellcheck="false" data-list-item-primary-index="${index}" value="${String(item?.primary || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}" placeholder="Primary text"/>
        <input id="${secondaryId}" class="sb-input" type="text" autocomplete="off" spellcheck="false" data-list-item-secondary-index="${index}" value="${String(item?.secondary || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}" placeholder="Secondary text"/>
        <div class="icon-upload-row">
          <input id="${iconInputId}" class="sb-input" type="text" maxlength="4" autocomplete="off" spellcheck="false" placeholder="Emoji or glyph" data-list-item-icon-input-index="${index}" value="${String(iconValue || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"/>
          <label class="sb-mini-btn upload-btn" for="${iconUploadId}">PNG<input id="${iconUploadId}" data-list-item-icon-upload-index="${index}" type="file" accept="image/png,image/gif"/></label>
          <button class="sb-mini-btn" type="button" data-list-item-icon-reset-index="${index}">×</button>
        </div>
        <div class="icon-mode-badge" data-list-item-icon-mode-index="${index}">${modeText}</div>
      `;
      ctx.UI.scenarioListItemsEditor.appendChild(row);
    });
  }

  function renderScenarioEditor() {
    const scenario = ctx.selectedScenario();
    const stage = ctx.stageById(scenario?.shape, scenario);
    const renderShape = ctx.stageRenderShapeForShape ? ctx.stageRenderShapeForShape(scenario, scenario?.shape) : String(stage?.renderShape || '');
    const visibleTextFields = ctx.stageVisibleEditorFields(stage);
    const hasIcon = ctx.stageHasComponent(stage, 'icon');
    const hasImage = ctx.stageHasComponent(stage, 'image');
    const hasIntentHeader = ctx.stageHasComponent(stage, 'intent-header');
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
    const showListOrbIconEditor = renderShape === 'list' && !!stage?.listListeningOrb;
    if (ctx.UI.editorIcon) ctx.UI.editorIcon.classList.toggle('hidden', !(hasIcon || showListOrbIconEditor));
    if (ctx.UI.editorListItems) ctx.UI.editorListItems.classList.toggle('hidden', renderShape !== 'list');
    if (ctx.UI.editorPrimary) ctx.UI.editorPrimary.classList.toggle('hidden', renderShape === 'list' || !visibleTextFields.has('primary'));
    if (ctx.UI.editorSecondary) ctx.UI.editorSecondary.classList.toggle('hidden', renderShape === 'list' || !visibleTextFields.has('secondary'));
    if (ctx.UI.editorDetail) ctx.UI.editorDetail.classList.toggle('hidden', renderShape === 'list' || !visibleTextFields.has('detail'));
    if (ctx.UI.editorIntentHeader) ctx.UI.editorIntentHeader.classList.toggle('hidden', !hasIntentHeader);
    if (ctx.UI.editorMedia) ctx.UI.editorMedia.classList.toggle('hidden', !hasImage);
    renderScenarioListItemsEditor(scenario, renderShape);
    renderScenarioStageChips();
    renderStageConfigPanel();
    renderScenarioMediaEditor(scenario, stage);
  }

  function renderScenarioUi() {
    const focusedEditableState = captureFocusedEditableState();
    refs.actions.renderAiStageOverrideUi();
    renderScenarioList();
    renderScenarioEditor();
    refs.bindings.updateLayerPreviews();
    restoreFocusedEditableState(focusedEditableState);
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
