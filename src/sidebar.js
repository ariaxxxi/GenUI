export function buildUiRefs(documentRef = document) {
  return {
    modeToggle: documentRef.getElementById('mode-toggle'),
    bgToggle: documentRef.getElementById('bg-toggle'),
    floatToggle: documentRef.getElementById('float-toggle'),
    alignBottomToggle: documentRef.getElementById('align-bottom-toggle'),
    frameGlassesToggle: documentRef.getElementById('frame-glasses-toggle'),
    framePhoneToggle: documentRef.getElementById('frame-phone-toggle'),
    phoneFrameControls: documentRef.getElementById('phone-frame-controls'),
    phoneFrameWidth: documentRef.getElementById('phone-frame-width'),
    phoneFrameHeight: documentRef.getElementById('phone-frame-height'),
    frameCornerRadius: documentRef.getElementById('frame-corner-radius'),
    phoneBgUpload: documentRef.getElementById('phone-bg-upload'),
    phoneBgReset: documentRef.getElementById('phone-bg-reset'),
    phoneBgState: documentRef.getElementById('phone-bg-state'),
    phoneBgVisibleToggle: documentRef.getElementById('phone-bg-visible-toggle'),
    phoneSceneVisibleRow: documentRef.getElementById('phone-scene-visible-row'),
    aiStageButtons: Array.from(documentRef.querySelectorAll('[data-ai-stage]')),
    scenarioList: documentRef.getElementById('scenario-list'),
    scenarioAdd: documentRef.getElementById('scenario-add'),
    scenarioDuplicate: documentRef.getElementById('scenario-duplicate'),
    scenarioDelete: documentRef.getElementById('scenario-delete'),
    scenarioName: documentRef.getElementById('scenario-name'),
    stageAdd: documentRef.getElementById('stage-add'),
    stageDelete: documentRef.getElementById('stage-delete'),
    stageReset: documentRef.getElementById('stage-reset'),
    stageNameInput: documentRef.getElementById('stage-name-input'),
    stageRadiusInput: documentRef.getElementById('stage-radius-input'),
    stageWidthInput: documentRef.getElementById('stage-width-input'),
    stageHeightInput: documentRef.getElementById('stage-height-input'),
    stageGapInput: documentRef.getElementById('stage-gap-input'),
    stageIconPadInput: documentRef.getElementById('stage-icon-pad-input'),
    stagePhoneBlurToggle: documentRef.getElementById('stage-phone-blur-toggle'),
    stageComponentsPanel: documentRef.getElementById('stage-components-panel'),
    stageComponentControls: documentRef.getElementById('stage-component-controls'),
    scenarioShapeRow: documentRef.getElementById('scenario-shape-row'),
    scenarioTriggers: documentRef.getElementById('scenario-triggers'),
    scenarioIconInput: documentRef.getElementById('scenario-icon-input'),
    scenarioIconUpload: documentRef.getElementById('scenario-icon-upload'),
    scenarioIconReset: documentRef.getElementById('scenario-icon-reset'),
    scenarioIconMode: documentRef.getElementById('scenario-icon-mode'),
    scenarioIconSize: documentRef.getElementById('scenario-icon-size'),
    scenarioIconColor: documentRef.getElementById('scenario-icon-color'),
    scenarioPrimary: documentRef.getElementById('scenario-primary'),
    scenarioPrimarySize: documentRef.getElementById('scenario-primary-size'),
    scenarioPrimaryColor: documentRef.getElementById('scenario-primary-color'),
    scenarioSecondary: documentRef.getElementById('scenario-secondary'),
    scenarioSecondarySize: documentRef.getElementById('scenario-secondary-size'),
    scenarioSecondaryColor: documentRef.getElementById('scenario-secondary-color'),
    scenarioDetail: documentRef.getElementById('scenario-detail'),
    scenarioDetailSize: documentRef.getElementById('scenario-detail-size'),
    scenarioDetailColor: documentRef.getElementById('scenario-detail-color'),
    scenarioMediaList: documentRef.getElementById('scenario-media-list'),
    editorPrimary: documentRef.getElementById('editor-primary-field'),
    editorSecondary: documentRef.getElementById('editor-secondary-field'),
    editorDetail: documentRef.getElementById('editor-detail-field'),
    editorMedia: documentRef.getElementById('editor-media-field'),
  };
}

export function initSidebar(context) {
  const { UI } = context;
  let scenarioLibrary;
  let stageLibrary;
  let selectedScenarioId;
  let responseMode;
  let aiStageOverride;

  const clamp = (...args) => context.clamp(...args);
  const selectedScenario = () => context.selectedScenario();
  const stageById = (...args) => context.stageById(...args);
  const availableScenarioShapes = (...args) => context.availableScenarioShapes(...args);
  const persistScenarios = (...args) => context.persistScenarios(...args);
  const persistStageLibrary = (...args) => context.persistStageLibrary(...args);
  const previewScenario = (...args) => context.previewScenario(...args);
  const applyCanvasSettings = (...args) => context.applyCanvasSettings(...args);
  const applyStagePhoneBlur = (...args) => context.applyStagePhoneBlur(...args);
  const applyResponseModeUi = (...args) => context.applyResponseModeUi(...args);
  const getScenarioTypography = (...args) => context.getScenarioTypography(...args);
  const RESPONSE_MODE = context.RESPONSE_MODE;
  const AI_STAGE_OVERRIDE = context.AI_STAGE_OVERRIDE;
  const createScenario = (...args) => context.createScenario(...args);
  const stageComponentCounts = (...args) => context.stageComponentCounts(...args);
  const STAGE_COMPONENT_TYPES = context.STAGE_COMPONENT_TYPES;
  const builtinStageById = (...args) => context.builtinStageById(...args);
  const scenarioStageSizeOverride = (...args) => context.scenarioStageSizeOverride(...args);
  const stageVisibleEditorFields = (...args) => context.stageVisibleEditorFields(...args);
  const stageHasComponent = (...args) => context.stageHasComponent(...args);
  const stageTextForShape = (...args) => context.stageTextForShape(...args);
  const stageIconForShape = (...args) => context.stageIconForShape(...args);
  const normalizeTriggers = (...args) => context.normalizeTriggers(...args);
  const normalizeIconByShape = (...args) => context.normalizeIconByShape(...args);
  const createIcon = (...args) => context.createIcon(...args);
  const normalizeStageTextByShape = (...args) => context.normalizeStageTextByShape(...args);
  const normalizeTypographyByShape = (...args) => context.normalizeTypographyByShape(...args);
  const normalizeStageSizeByShape = (...args) => context.normalizeStageSizeByShape(...args);
  const normalizeImagesByShape = (...args) => context.normalizeImagesByShape(...args);
  const getScenarioLibrary = () => context.getScenarioLibrary();
  const setScenarioLibrary = (value) => context.setScenarioLibrary(value);
  const getStageLibrary = () => context.getStageLibrary();
  const setStageLibrary = (value) => context.setStageLibrary(value);
  const getSelectedScenarioId = () => context.getSelectedScenarioId();
  const setSelectedScenarioId = (value) => context.setSelectedScenarioId(value);
  const getResponseMode = () => context.getResponseMode();
  const getAiStageOverride = () => context.getAiStageOverride();

  function sync() {
    scenarioLibrary = getScenarioLibrary();
    stageLibrary = getStageLibrary();
    selectedScenarioId = getSelectedScenarioId();
    responseMode = getResponseMode();
    aiStageOverride = getAiStageOverride();
  }

function renderAiStageOverrideUi() {
  sync();
  UI.aiStageButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.aiStage === aiStageOverride);
  });
}

function previewAiStageOverride() {
  sync();
  if (responseMode !== RESPONSE_MODE.AI) return;
  const scenario = selectedScenario();
  if (!scenario) return;
  if (aiStageOverride === AI_STAGE_OVERRIDE.AUTO) {
    previewScenario(scenario);
    return;
  }
  const overrideShape = availableScenarioShapes().includes(aiStageOverride) ? aiStageOverride : scenario.shape;
  const preview = createScenario({
    ...scenario,
    shape: overrideShape,
    content: scenario.content,
    triggers: scenario.triggers,
  });
  previewScenario(preview);
}

function renderScenarioList() {
  sync();
  if (!UI.scenarioList) return;
  UI.scenarioList.innerHTML = '';
  scenarioLibrary.forEach((scenario) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scenario-item' + (scenario.id === selectedScenarioId ? ' active' : '');
    const stage = stageById(scenario.shape);
    button.innerHTML = `
      <span class="scenario-item-name">${scenario.name}</span>
      <span class="scenario-item-meta">${stage?.name || scenario.shape}</span>
    `;
    button.addEventListener('click', () => selectScenario(scenario.id));
    UI.scenarioList.appendChild(button);
  });
  if (UI.scenarioDuplicate) UI.scenarioDuplicate.disabled = !selectedScenario();
  if (UI.scenarioDelete) UI.scenarioDelete.disabled = scenarioLibrary.length <= 1;
}

function renderScenarioStageChips() {
  sync();
  if (!UI.scenarioShapeRow) return;
  const scenario = selectedScenario();
  UI.scenarioShapeRow.innerHTML = '';
  stageLibrary.forEach((stage) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shape-chip' + (scenario?.shape === stage.id ? ' active' : '');
    button.dataset.scenarioShape = stage.id;
    button.textContent = stage.name;
    button.title = stage.id;
    UI.scenarioShapeRow.appendChild(button);
  });
}

function renderStageComponentControls(stage) {
  sync();
  if (!UI.stageComponentControls) return;
  UI.stageComponentControls.innerHTML = '';
  if (!stage) return;
  const list = document.createElement('div');
  list.className = 'stage-comp-list';
  const counts = stageComponentCounts(stage);
  STAGE_COMPONENT_TYPES.forEach((type) => {
    const row = document.createElement('div');
    const isSingleToggle = type === 'icon' || type === 'primary' || type === 'secondary' || type === 'detail';
    row.className = 'stage-comp-row' + (isSingleToggle ? ' toggle' : '');
    if (isSingleToggle) {
      row.innerHTML = `
        <span class="stage-comp-label">${type}</span>
        <input class="stage-comp-check" type="checkbox" data-stage-comp-toggle="${type}" ${counts[type] > 0 ? 'checked' : ''}/>
      `;
    } else {
      row.innerHTML = `
        <span class="stage-comp-label">${type}</span>
        <button type="button" class="stage-comp-btn" data-stage-comp-action="remove" data-stage-comp-type="${type}">-</button>
        <span class="stage-comp-count">${counts[type]}</span>
        <button type="button" class="stage-comp-btn" data-stage-comp-action="add" data-stage-comp-type="${type}">+</button>
      `;
      const removeBtn = row.querySelector('[data-stage-comp-action="remove"]');
      if (removeBtn) removeBtn.disabled = counts[type] <= 0;
    }
    list.appendChild(row);
  });
  UI.stageComponentControls.appendChild(list);
}

function renderStageConfigPanel() {
  sync();
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  const builtin = builtinStageById(stage?.id);
  const sizeOverride = scenarioStageSizeOverride(scenario, scenario?.shape);
  if (UI.stageNameInput) UI.stageNameInput.value = stage?.name || '';
  if (UI.stageRadiusInput) UI.stageRadiusInput.value = Number.isFinite(stage?.cornerRadius) ? String(stage.cornerRadius) : '';
  if (UI.stageWidthInput) UI.stageWidthInput.value = Number.isFinite(sizeOverride?.widthOverride) ? String(sizeOverride.widthOverride) : '';
  if (UI.stageHeightInput) UI.stageHeightInput.value = Number.isFinite(sizeOverride?.heightOverride) ? String(sizeOverride.heightOverride) : '';
  if (UI.stageGapInput) UI.stageGapInput.value = Number.isFinite(stage?.iconTextGap) ? String(stage.iconTextGap) : '';
  if (UI.stageIconPadInput) UI.stageIconPadInput.value = Number.isFinite(stage?.iconLeftPadding) ? String(stage.iconLeftPadding) : '';
  if (UI.stagePhoneBlurToggle) UI.stagePhoneBlurToggle.checked = !!stage?.phoneBgBlur;
  if (UI.stageComponentsPanel) UI.stageComponentsPanel.classList.remove('hidden');
  if (UI.stageDelete) UI.stageDelete.disabled = !stage || !!stage.preset;
  if (UI.stageReset) UI.stageReset.disabled = !stage || !builtin;
  renderStageComponentControls(stage);
}

function getScenarioImagesForStage(scenario, stage) {
  sync();
  const count = Math.max(0, stageComponentCounts(stage).image || 0);
  const source = stageImagesForShape(scenario, scenario?.shape);
  const output = [];
  for (let i = 0; i < count; i += 1) {
    output.push(source[i] || null);
  }
  return output;
}

function renderScenarioMediaEditor(scenario, stage) {
  sync();
  if (!UI.scenarioMediaList) return;
  UI.scenarioMediaList.innerHTML = '';
  const images = getScenarioImagesForStage(scenario, stage);
  if (!images.length) return;
  images.forEach((image, index) => {
    const row = document.createElement('div');
    row.className = 'media-upload-row';
    const inputId = `scenario-media-upload-${index}`;
    row.innerHTML = `
      <label class="sb-mini-btn upload-btn" for="${inputId}">PNG/GIF ${index + 1}<input id="${inputId}" data-media-upload-index="${index}" type="file" accept="image/png,image/gif"/></label>
      <button class="sb-mini-btn" type="button" data-media-reset-index="${index}">Reset</button>
    `;
    UI.scenarioMediaList.appendChild(row);
    const badge = document.createElement('div');
    badge.className = 'icon-mode-badge';
    badge.textContent = image ? 'loaded' : 'empty';
    UI.scenarioMediaList.appendChild(badge);
  });
}

function renderScenarioEditor() {
  sync();
  const scenario = selectedScenario();
  if (!scenario) return;
  const stageText = stageTextForShape(scenario, scenario.shape);
  const stageIcon = stageIconForShape(scenario, scenario.shape);
  UI.scenarioName.value = scenario.name;
  UI.scenarioTriggers.value = scenario.triggers.join(', ');
  UI.scenarioIconInput.value = stageIcon.kind === 'emoji' ? stageIcon.value : '';
  UI.scenarioPrimary.value = stageText.primary;
  UI.scenarioSecondary.value = stageText.secondary;
  UI.scenarioDetail.value = stageText.detail;
  const typography = getScenarioTypography(scenario, scenario.shape);
  UI.scenarioIconSize.value = typography.icon.size;
  UI.scenarioIconColor.value = typography.icon.color;
  UI.scenarioPrimarySize.value = typography.primary.size;
  UI.scenarioPrimaryColor.value = typography.primary.color;
  UI.scenarioSecondarySize.value = typography.secondary.size;
  UI.scenarioSecondaryColor.value = typography.secondary.color;
  UI.scenarioDetailSize.value = typography.detail.size;
  UI.scenarioDetailColor.value = typography.detail.color;
  UI.scenarioIconMode.textContent = stageIcon.kind === 'image' ? 'png' : (stageIcon.kind === 'emoji' ? 'emoji' : 'empty');
  const iconTextEditable = stageIcon.kind !== 'image';
  UI.scenarioIconInput.disabled = !iconTextEditable;
  UI.scenarioIconColor.disabled = !iconTextEditable;
  UI.scenarioIconInput.placeholder = iconTextEditable ? 'Emoji or glyph' : 'PNG icon active';
  renderScenarioStageChips();
  renderStageConfigPanel();
  const stage = stageById(scenario.shape);
  const visibleFields = stageVisibleEditorFields(stage);
  renderScenarioMediaEditor(scenario, stage);
  const iconLayerRow = document.getElementById('editor-icon-layer');
  if (iconLayerRow) iconLayerRow.classList.toggle('hidden', !visibleFields.has('primary') && !stageHasComponent(stage, 'icon'));
  UI.editorPrimary.classList.toggle('hidden', !visibleFields.has('primary'));
  UI.editorSecondary.classList.toggle('hidden', !visibleFields.has('secondary'));
  UI.editorDetail.classList.toggle('hidden', !visibleFields.has('detail'));
  UI.editorMedia.classList.toggle('hidden', !stageHasComponent(stage, 'image'));
  updateLayerPreviews();
}

function renderScenarioUi() {
  sync();
  renderScenarioList();
  renderScenarioEditor();
  renderAiStageOverrideUi();
  applyCanvasSettings();
  applyStagePhoneBlur(selectedScenario()?.shape);
}

function selectScenario(id) {
  sync();
  if (!scenarioLibrary.some((item) => item.id === id)) return;
  setSelectedScenarioId(id);
  sync();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function commitScenarioChange(mutator) {
  sync();
  const scenario = selectedScenario();
  if (!scenario) return;
  mutator(scenario);
  persistScenarios();
  renderScenarioUi();
  previewScenario(scenario);
}

function commitStageChange(stageIdValue, mutator) {
  sync();
  const stages = getStageLibrary();
  const index = stages.findIndex((stage) => stage.id === stageIdValue);
  if (index < 0) return;
  const draft = { ...stages[index], components: [...stages[index].components] };
  mutator(draft);
  const nextStages = [...stages];
  nextStages[index] = context.normalizeStage(draft, stages[index]);
  setStageLibrary(nextStages);
  persistStageLibrary();
  setScenarioLibrary(getScenarioLibrary().map((scenario) => createScenario(scenario)));
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function addStage() {
  sync();
  const scenario = selectedScenario();
  const baseStage = stageById(scenario?.shape || 'card');
  const stage = context.normalizeStage({
    id: context.stageId(),
    name: 'New Stage',
    preset: false,
    renderShape: baseStage?.renderShape || 'card',
    cornerRadius: Number.isFinite(baseStage?.cornerRadius) ? baseStage.cornerRadius : 30,
    widthOverride: null,
    heightOverride: null,
    iconTextGap: Number.isFinite(baseStage?.iconTextGap) ? baseStage.iconTextGap : null,
    iconLeftPadding: Number.isFinite(baseStage?.iconLeftPadding) ? baseStage.iconLeftPadding : null,
    components: (baseStage?.components?.length ? [...baseStage.components] : ['icon', 'primary', 'secondary']),
  }, baseStage);
  setStageLibrary([...getStageLibrary(), stage]);
  persistStageLibrary();
  commitScenarioChange((active) => {
    active.shape = stage.id;
    active.content.typographyByShape = normalizeTypographyByShape(
      active.content.typographyByShape,
      stage.id
    );
    active.content.sizeByShape = normalizeStageSizeByShape(
      active.content.sizeByShape,
      stage.id,
      active.content
    );
  });
}

function deleteCurrentStage() {
  sync();
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage || stage.preset) return;
  const fallbackId = stageById('pill')?.id || getStageLibrary().find((item) => item.id !== stage.id)?.id;
  if (!fallbackId) return;
  setStageLibrary(getStageLibrary().filter((item) => item.id !== stage.id));
  setScenarioLibrary(getScenarioLibrary().map((item) => {
    if (item.shape !== stage.id) return item;
    return createScenario({
      ...item,
      shape: fallbackId,
      content: item.content,
      triggers: item.triggers,
    });
  }));
  if (scenario?.shape === stage.id) {
    setSelectedScenarioId(scenario.id);
  }
  persistStageLibrary();
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function resetCurrentStageToDefault() {
  sync();
  const scenario = selectedScenario();
  const stage = stageById(scenario?.shape);
  if (!stage) return;
  const builtin = builtinStageById(stage.id);
  if (!builtin) return;
  const stages = getStageLibrary();
  const index = stages.findIndex((item) => item.id === stage.id);
  if (index < 0) return;
  const nextStages = [...stages];
  nextStages[index] = context.normalizeStage(builtin, builtin);
  setStageLibrary(nextStages);
  persistStageLibrary();
  setScenarioLibrary(getScenarioLibrary().map((item) => createScenario(item)));
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function addScenario(shape = 'pill') {
  sync();
  const scenario = createScenario({
    name: shape === 'card' ? 'New Card' : (shape === 'dot' ? 'New Dot' : 'New Scenario'),
    shape,
    content: {
      icon: createIcon('emoji', shape === 'dot' ? '•' : '◉'),
      primary: '',
      secondary: '',
      detail: '',
    },
  });
  setScenarioLibrary([...getScenarioLibrary(), scenario]);
  setSelectedScenarioId(scenario.id);
  persistScenarios();
  renderScenarioUi();
  previewScenario(scenario);
}

function duplicateScenario() {
  sync();
  const scenario = selectedScenario();
  if (!scenario) return;
  const copy = createScenario({
    name: `${scenario.name} Copy`,
    shape: scenario.shape,
    content: typeof structuredClone === 'function'
      ? structuredClone(scenario.content)
      : JSON.parse(JSON.stringify(scenario.content)),
    triggers: [...scenario.triggers],
  });
  setScenarioLibrary([...getScenarioLibrary(), copy]);
  setSelectedScenarioId(copy.id);
  persistScenarios();
  renderScenarioUi();
  previewScenario(copy);
}

function deleteScenario() {
  sync();
  const scenarios = getScenarioLibrary();
  if (scenarios.length <= 1) return;
  const index = scenarios.findIndex((item) => item.id === selectedScenarioId);
  if (index < 0) return;
  const nextScenarios = scenarios.filter((_, idx) => idx !== index);
  setScenarioLibrary(nextScenarios);
  setSelectedScenarioId(nextScenarios[Math.max(0, index - 1)]?.id || nextScenarios[0]?.id || '');
  persistScenarios();
  renderScenarioUi();
  previewScenario(selectedScenario());
}

function bindTypographyInputs(layer, sizeInput, colorInput) {
  sync();
  const commitSize = (rawValue) => {
    const parsed = parseInt(String(rawValue || '').trim(), 10);
    if (!Number.isFinite(parsed)) return;
    commitScenarioChange((scenario) => {
      scenario.content.typographyByShape = normalizeTypographyByShape(
        scenario.content.typographyByShape,
        scenario.shape
      );
      scenario.content.typographyByShape[scenario.shape][layer].size = clamp(
        parsed,
        12,
        96
      );
    });
  };
  sizeInput.addEventListener('change', (e) => commitSize(e.target.value));
  sizeInput.addEventListener('blur', (e) => {
    const value = String(e.target.value || '').trim();
    if (!value) {
      const scenario = selectedScenario();
      if (!scenario) return;
      e.target.value = String(getScenarioTypography(scenario, scenario.shape)[layer].size);
      return;
    }
    commitSize(value);
  });
  colorInput.addEventListener('input', (e) => {
    commitScenarioChange((scenario) => {
      scenario.content.typographyByShape = normalizeTypographyByShape(
        scenario.content.typographyByShape,
        scenario.shape
      );
      scenario.content.typographyByShape[scenario.shape][layer].color = e.target.value;
    });
  });
}

// ── Sidebar tab switching ──
function initSidebarTabs() {
  sync();
  const tabBar = document.getElementById('sb-tab-bar');
  if (!tabBar) return;
  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.sb-tab');
    if (!tab) return;
    const targetPanel = tab.dataset.tab;
    // Update tab active state
    tabBar.querySelectorAll('.sb-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === targetPanel));
    // Show / hide panels
    document.querySelectorAll('#sidebar .sb-tab-panel[data-panel]').forEach(panel => {
      panel.classList.toggle('sb-tab-panel-hidden', panel.dataset.panel !== targetPanel);
    });
  });
}

// ── Layer row collapsible toggle ──
function initLayerRowToggles() {
  sync();
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.addEventListener('click', (e) => {
    const header = e.target.closest('.layer-row-header');
    if (!header) return;
    const row = header.closest('.layer-row');
    if (!row) return;
    row.classList.toggle('expanded');
  });
}

// ── Layer row preview updates ──
function updateLayerPreviews() {
  sync();
  const scenario = selectedScenario();
  if (!scenario) return;
  const typography = getScenarioTypography(scenario, scenario.shape);
  const stageIcon = stageIconForShape(scenario, scenario.shape);
  const stageText = stageTextForShape(scenario, scenario.shape);

  function setPreview(textId, sizeId, colorId, text, size, color) {
    const textEl = document.getElementById(textId);
    const sizeEl = document.getElementById(sizeId);
    const colorEl = document.getElementById(colorId);
    if (textEl) textEl.textContent = text || '—';
    if (sizeEl) sizeEl.textContent = size ? `${size}px` : '';
    if (colorEl) colorEl.style.background = color || '#fff';
  }

  const iconText = stageIcon.kind === 'emoji' ? stageIcon.value : (stageIcon.kind === 'image' ? 'PNG' : '—');
  setPreview('layer-preview-icon-text', 'layer-preview-icon-size', 'layer-preview-icon-color',
    iconText, typography.icon.size, typography.icon.color);
  setPreview('layer-preview-primary-text', 'layer-preview-primary-size', 'layer-preview-primary-color',
    stageText.primary, typography.primary.size, typography.primary.color);
  setPreview('layer-preview-secondary-text', 'layer-preview-secondary-size', 'layer-preview-secondary-color',
    stageText.secondary, typography.secondary.size, typography.secondary.color);
  setPreview('layer-preview-detail-text', 'layer-preview-detail-size', 'layer-preview-detail-color',
    stageText.detail, typography.detail.size, typography.detail.color);
}

function initSidebarCollapsibleSections() {
  sync();
  const sidebars = [document.getElementById('left-sidebar'), document.getElementById('sidebar')].filter(Boolean);
  if (!sidebars.length) return;
  sidebars.forEach((sidebar) => {
    sidebar.addEventListener('click', (e) => {
      const toggle = e.target.closest('.sb-section-toggle');
      if (!toggle) return;
      const section = toggle.closest('.sb-section');
      if (!section || section.dataset.collapsible !== '1') return;
      section.classList.toggle('collapsed');
    });
  });
}

function isSupportedAssetFile(file) {
  sync();
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'image/png' || type === 'image/gif') return true;
  const name = String(file.name || '').toLowerCase();
  return name.endsWith('.png') || name.endsWith('.gif');
}

  return {
    renderAiStageOverrideUi,
    previewAiStageOverride,
    renderScenarioUi,
    renderScenarioList,
    renderScenarioEditor,
    updateLayerPreviews,
    initSidebarTabs,
    initLayerRowToggles,
    initSidebarCollapsibleSections,
    bindTypographyInputs,
    isSupportedAssetFile,
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
