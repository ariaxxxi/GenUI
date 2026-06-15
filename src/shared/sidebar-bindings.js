export function createSidebarBindings(ctx, refs) {
  function bindTypographyInputs(layer, sizeInput, colorInput) {
    const commitSize = (rawValue) => {
      const parsed = parseInt(String(rawValue || '').trim(), 10);
      if (!Number.isFinite(parsed)) return;
      refs.actions.commitScenarioChange((scenario) => {
        scenario.content.typographyByShape = ctx.normalizeTypographyByShape(scenario.content.typographyByShape, scenario.shape);
        scenario.content.typographyByShape[scenario.shape][layer].size = ctx.clamp(parsed, 12, 96);
        return scenario;
      });
    };
    sizeInput.addEventListener('change', (e) => commitSize(e.target.value));
    sizeInput.addEventListener('blur', (e) => {
      const value = String(e.target.value || '').trim();
      if (!value) {
        const scenario = ctx.selectedScenario();
        if (!scenario) return;
        e.target.value = String(ctx.getScenarioTypography(scenario, scenario.shape)[layer].size);
        return;
      }
      commitSize(value);
    });
    colorInput.addEventListener('input', (e) => {
      refs.actions.commitScenarioChange((scenario) => {
        scenario.content.typographyByShape = ctx.normalizeTypographyByShape(scenario.content.typographyByShape, scenario.shape);
        scenario.content.typographyByShape[scenario.shape][layer].color = e.target.value;
        return scenario;
      });
    });
  }

  function initSidebarTabs() {
    const tabBar = document.getElementById('sb-tab-bar');
    if (!tabBar) return;
    tabBar.addEventListener('click', (e) => {
      const tab = e.target.closest('.sb-tab');
      if (!tab) return;
      const targetPanel = tab.dataset.tab;
      tabBar.querySelectorAll('.sb-tab').forEach((item) => item.classList.toggle('active', item.dataset.tab === targetPanel));
      document.querySelectorAll('#sidebar .sb-tab-panel[data-panel]').forEach((panel) => panel.classList.toggle('sb-tab-panel-hidden', panel.dataset.panel !== targetPanel));
    });
  }

  function initLayerRowToggles() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.addEventListener('click', (e) => {
      const header = e.target.closest('.layer-row-header');
      if (!header) return;
      const row = header.closest('.layer-row');
      if (row) row.classList.toggle('expanded');
    });
  }

  function updateLayerPreviews() {
    const scenario = ctx.selectedScenario();
    if (!scenario) return;
    const typography = ctx.getScenarioTypography(scenario, scenario.shape);
    const stageIcon = ctx.stageIconForShape(scenario, scenario.shape);
    const stageText = ctx.stageTextForShape(scenario, scenario.shape);
    const setPreview = (textId, sizeId, colorId, text, size, color) => {
      const textEl = document.getElementById(textId);
      const sizeEl = document.getElementById(sizeId);
      const colorEl = document.getElementById(colorId);
      if (textEl) textEl.textContent = text || '—';
      if (sizeEl) sizeEl.textContent = size ? `${size}px` : '';
      if (colorEl) colorEl.style.background = color || '#fff';
    };
    const iconText = stageIcon.kind === 'emoji' ? stageIcon.value : (stageIcon.kind === 'image' ? 'PNG' : '—');
    setPreview('layer-preview-icon-text', 'layer-preview-icon-size', 'layer-preview-icon-color', iconText, typography.icon.size, typography.icon.color);
    setPreview('layer-preview-primary-text', 'layer-preview-primary-size', 'layer-preview-primary-color', stageText.primary, typography.primary.size, typography.primary.color);
    setPreview('layer-preview-secondary-text', 'layer-preview-secondary-size', 'layer-preview-secondary-color', stageText.secondary, typography.secondary.size, typography.secondary.color);
    setPreview('layer-preview-detail-text', 'layer-preview-detail-size', 'layer-preview-detail-color', stageText.detail, typography.detail.size, typography.detail.color);
    const intentPreview = document.getElementById('layer-preview-intent-header-text');
    const intentSizePreview = document.getElementById('layer-preview-intent-header-size');
    const intentColorPreview = document.getElementById('layer-preview-intent-header-color');
    if (intentPreview) intentPreview.textContent = stageText.intentHeader || '—';
    if (intentSizePreview) intentSizePreview.textContent = `${typography.intentHeader.size}px`;
    if (intentColorPreview) intentColorPreview.style.background = typography.intentHeader.color || '#a0a0a0';
    const nudgeDividerPreview = document.getElementById('layer-preview-nudge-divider-color');
    if (nudgeDividerPreview && ctx.stageNudgeDividerColorForShape) {
      nudgeDividerPreview.style.background = ctx.stageNudgeDividerColorForShape(scenario, scenario.shape) || '#ffffff';
    }
  }

  function initSidebarCollapsibleSections() {
    [document.getElementById('left-sidebar'), document.getElementById('sidebar')].filter(Boolean).forEach((sidebar) => {
      sidebar.addEventListener('click', (e) => {
        const toggle = e.target.closest('.sb-section-toggle');
        const section = toggle?.closest('.sb-section');
        if (section && section.dataset.collapsible === '1') section.classList.toggle('collapsed');
      });
    });
  }

  function isSupportedAssetFile(file) {
    if (!file) return false;
    const type = String(file.type || '').toLowerCase();
    if (type === 'image/png' || type === 'image/gif') return true;
    const name = String(file.name || '').toLowerCase();
    return name.endsWith('.png') || name.endsWith('.gif');
  }

  return {
    bindTypographyInputs,
    initSidebarTabs,
    initLayerRowToggles,
    updateLayerPreviews,
    initSidebarCollapsibleSections,
    isSupportedAssetFile,
  };
}
