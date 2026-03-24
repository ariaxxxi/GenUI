import { createSidebarActions } from './sidebar-actions.js';
import { createSidebarRender } from './sidebar-render.js';
import { createSidebarBindings } from './sidebar-bindings.js';

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
    stageAddKind: documentRef.getElementById('stage-add-kind'),
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
  const refs = {};
  const ctx = {
    ...context,
    getScenarioLibrary: () => context.getScenarioLibrary(),
    setScenarioLibrary: (value) => context.setScenarioLibrary(value),
    getStageLibrary: () => context.getStageLibrary(),
    setStageLibrary: (value) => context.setStageLibrary(value),
    getSelectedScenarioId: () => context.getSelectedScenarioId(),
    setSelectedScenarioId: (value) => context.setSelectedScenarioId(value),
    getResponseMode: () => context.getResponseMode(),
    getAiStageOverride: () => context.getAiStageOverride(),
  };
  refs.actions = createSidebarActions(ctx, refs);
  refs.render = createSidebarRender(ctx, refs);
  refs.bindings = createSidebarBindings(ctx, refs);
  return { ...refs.actions, ...refs.render, ...refs.bindings };
}
