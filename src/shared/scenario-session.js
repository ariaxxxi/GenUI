import {
  STORAGE_KEYS,
  PAGE_MODE_OVERRIDE,
  readStoredJson,
  persistToStorage,
  persistDurableJson,
  readDurableJsonRecord,
} from '../app-state.js';

export function initScenarioSession({
  defaultScenarioLibrary,
  getCanvasSettings,
  normalizeScenario,
  normalizeScenarioCanvas,
}) {
  function fallbackScenarioLibrary() {
    const scenarios = defaultScenarioLibrary();
    return Array.isArray(scenarios) ? scenarios : [];
  }

  function normalizeScenarioLibrary(source) {
    const fallback = fallbackScenarioLibrary();
    const frameMode = getCanvasSettings?.()?.frameMode || 'none';
    const scenarios = Array.isArray(source)
      ? source.map((item) => normalizeScenario(item)).filter(Boolean)
      : fallback;
    scenarios.forEach((scenario) => {
      scenario.content.canvas = normalizeScenarioCanvas(scenario?.content?.canvas, { frameMode });
    });
    return scenarios.length ? scenarios : fallback;
  }

  function loadScenarioLibrary() {
    return normalizeScenarioLibrary(readStoredJson(STORAGE_KEYS.scenarios, null));
  }

  function persistScenarios(scenarioLibrary) {
    const revision = Date.now();
    const localScenarioOk = persistToStorage(STORAGE_KEYS.scenarios, scenarioLibrary, 'scenarios');
    if (localScenarioOk) persistToStorage(STORAGE_KEYS.scenarioRevision, revision, 'scenario revision');
    void persistDurableJson(STORAGE_KEYS.scenarios, scenarioLibrary, { revision, label: 'scenarios' });
    return revision;
  }

  function persistCanvasSettings(canvasSettings) {
    persistToStorage(STORAGE_KEYS.settings, canvasSettings, 'canvas settings');
  }

  function persistResponseMode(responseMode) {
    if (!PAGE_MODE_OVERRIDE) persistToStorage(STORAGE_KEYS.mode, responseMode, 'response mode');
  }

  function persistAiStageOverride(aiStageOverride) {
    persistToStorage(STORAGE_KEYS.aiStage, aiStageOverride, 'AI stage override');
  }

  function normalizeSelectedScenarioId(scenarioLibrary, selectedScenarioId) {
    return scenarioLibrary.some((item) => item.id === selectedScenarioId)
      ? selectedScenarioId
      : (scenarioLibrary[0]?.id || '');
  }

  function applyScenarioLibrary(nextLibrary, selectedScenarioId) {
    const scenarioLibrary = Array.isArray(nextLibrary) ? nextLibrary : fallbackScenarioLibrary();
    return {
      scenarioLibrary,
      selectedScenarioId: normalizeSelectedScenarioId(scenarioLibrary, selectedScenarioId),
    };
  }

  function selectedScenario(scenarioLibrary, selectedScenarioId) {
    return scenarioLibrary.find((item) => item.id === selectedScenarioId) || scenarioLibrary[0] || null;
  }

  async function hydrateDurableScenarios(scenarioRevision) {
    const record = await readDurableJsonRecord(STORAGE_KEYS.scenarios);
    if (!Array.isArray(record?.value)) return null;
    const durableRevision = Number(record.revision) || 0;
    if (durableRevision <= scenarioRevision) return null;
    return {
      scenarioLibrary: normalizeScenarioLibrary(record.value),
      scenarioRevision: durableRevision,
    };
  }

  return {
    applyScenarioLibrary,
    hydrateDurableScenarios,
    loadScenarioLibrary,
    persistAiStageOverride,
    persistCanvasSettings,
    persistResponseMode,
    persistScenarios,
    selectedScenario,
  };
}
