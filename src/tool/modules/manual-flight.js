export function initManualFlight({
  hideRich,
  showRich,
  morphTo,
  startSiriOrb,
  stopSiriOrb,
  setIntentHeader,
  hideIntentHeader,
  createIcon,
  scenarioMatchesText,
  scenarioLibrary,
  selectedScenario,
  renderScenarioUi,
  previewScenario,
  createScenario,
  scenarioToRenderContent,
  defaultTypographyForShape,
  SCENARIO_SHAPES,
  AI_STAGE_OVERRIDE,
  RESPONSE_MODE,
  getResponseMode,
  getAiStageOverride,
  setSelectedScenarioId,
  C,
  createRootCircle,
  onFlowStateChange,
}) {
  let flightData = { origin: 'SFO', dest: 'NRT', destCity: 'Tokyo', depDate: 'Mar 15, 2026', retDate: 'Mar 22, 2026' };
  const flightUi = { active: false, step: 'idle', highlight: 0, depIdx: 0, retIdx: 0 };
  const FLIGHT_DEP_OPTIONS = ['Mar 15, 2026', 'Mar 16, 2026', 'Mar 17, 2026', 'Mar 18, 2026'];
  const FLIGHT_RET_OPTIONS = ['Mar 22, 2026', 'Mar 23, 2026', 'Mar 24, 2026', 'Mar 25, 2026'];
  const FLIGHTS = [
    { airline: 'ANA', code: 'NH 7', dep: '10:30', arr: '14:30', day: '+1', stops: 'Non-stop', duration: '13h 0m', price: '$899' },
    { airline: 'JAL', code: 'JL 61', dep: '12:00', arr: '15:45', day: '+1', stops: 'Non-stop', duration: '13h 45m', price: '$1,049' },
    { airline: 'United', code: 'UA 837', dep: '13:45', arr: '17:20', day: '+1', stops: '1 stop', duration: '15h 35m', price: '$649' },
  ];

  const AI_PROVIDERS = {
    gauss: {
      async resolve({ userText, stageOverride, scenarios, selected }) {
        const text = String(userText || '').trim();
        const scenario = scenarios.find((item) => scenarioMatchesText(item, text)) || selected || scenarios[0] || null;
        const base = scenario ? scenarioToRenderContent(scenario) : {
          icon: createIcon('emoji', '✨'),
          primary: '',
          secondary: '',
          detail: '',
          image: null,
          typography: defaultTypographyForShape('pill'),
        };
        const nextShape = (stageOverride && stageOverride !== AI_STAGE_OVERRIDE.AUTO)
          ? stageOverride
          : (scenario?.shape || 'pill');
        return {
          scenarioId: scenario?.id || null,
          shape: nextShape,
          content: {
            ...base,
            primary: base.primary || (scenario?.name || 'Generated response'),
            secondary: base.secondary || `User: ${text}`,
            detail: base.detail || `AI draft generated for "${text}"`,
          },
        };
      },
    },
  };

  function setFlightStep(step, highlight = 0) {
    flightUi.step = step;
    flightUi.highlight = highlight;
  }

  function setActive(next) {
    flightUi.active = next;
    onFlowStateChange?.(flightUi.active);
  }

  function syncFlightDateIndexes() {
    const dep = FLIGHT_DEP_OPTIONS.indexOf(flightData.depDate);
    const ret = FLIGHT_RET_OPTIONS.indexOf(flightData.retDate);
    flightUi.depIdx = dep >= 0 ? dep : 0;
    flightUi.retIdx = ret >= 0 ? ret : 0;
  }

  function updateFlightDateHighlight() {
    const ids = ['f-opt-dep', 'f-opt-ret', 'f-opt-search'];
    ids.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('selected', flightUi.highlight === idx);
    });
    const depVal = document.getElementById('f-dep-val');
    const retVal = document.getElementById('f-ret-val');
    if (depVal) depVal.textContent = flightData.depDate;
    if (retVal) retVal.textContent = flightData.retDate;
  }

  function updateFlightResultHighlight() {
    document.querySelectorAll('.rich-flight-row').forEach((r, i) => r.classList.toggle('selected', i === flightUi.highlight));
  }

  function cycleFlightDate(which) {
    if (which === 'dep') {
      flightUi.depIdx = (flightUi.depIdx + 1) % FLIGHT_DEP_OPTIONS.length;
      flightData.depDate = FLIGHT_DEP_OPTIONS[flightUi.depIdx];
    } else {
      flightUi.retIdx = (flightUi.retIdx + 1) % FLIGHT_RET_OPTIONS.length;
      flightData.retDate = FLIGHT_RET_OPTIONS[flightUi.retIdx];
    }
    updateFlightDateHighlight();
  }

  function moveFlightHighlight(dir) {
    if (flightUi.step === 'dates') {
      const max = 2;
      flightUi.highlight = (flightUi.highlight + dir + max + 1) % (max + 1);
      updateFlightDateHighlight();
      return;
    }
    if (flightUi.step === 'results') {
      const max = FLIGHTS.length - 1;
      flightUi.highlight = (flightUi.highlight + dir + max + 1) % (max + 1);
      updateFlightResultHighlight();
    }
  }

  function confirmFlightStep() {
    if (!flightUi.active) return;
    if (flightUi.step === 'route') {
      flowDateStep();
      return;
    }
    if (flightUi.step === 'dates') {
      if (flightUi.highlight === 0) return void cycleFlightDate('dep');
      if (flightUi.highlight === 1) return void cycleFlightDate('ret');
      submitDates();
      return;
    }
    if (flightUi.step === 'results') selectFlight(flightUi.highlight);
  }

  function cancelFlightFlow() {
    if (!flightUi.active) return;
    setFlightStep('idle', 0);
    setActive(false);
    stopSiriOrb();
    hideRich();
    hideIntentHeader();
    morphTo('circle', createRootCircle());
    document.getElementById('stage').classList.remove('flow-active');
    document.getElementById('input-area').classList.remove('hidden');
  }

  function startFlightFlow() {
    syncFlightDateIndexes();
    setActive(true);
    setFlightStep('confirming', 0);
    document.getElementById('stage').classList.add('flow-active');
    hideRich();
    morphTo('circle', createRootCircle());
    C.thumb.style.opacity = '0';
    startSiriOrb();
    setIntentHeader('Book a Flight', 'Confirming');

    setTimeout(() => {
      stopSiriOrb();
      morphTo('pill', {
        icon: '✈',
        primary: `${flightData.origin} → ${flightData.dest}`,
        secondary: `${flightData.destCity}, Japan`,
      });
      setIntentHeader('Book a Flight', 'Route · Space to Continue');
      setFlightStep('route', 0);
    }, 1200);
  }

  function flowDateStep() {
    setIntentHeader('Book a Flight', 'When?');
    hideRich();
    morphTo('card-form', null);
    setFlightStep('dates', 0);
    const html = `
      <div class="rich-route-row" style="margin-bottom:6px;">
        <span class="rich-route-main">${flightData.origin}</span>
        <span class="rich-route-arrow">→</span>
        <span class="rich-route-main">${flightData.dest}</span>
      </div>
      <div class="rich-route-sub" style="margin-bottom:14px;">San Francisco → Tokyo Narita · ↑/↓ move · Space confirm · X cancel</div>
      <div class="rich-divider"></div>
      <div class="rich-flight-row selected" id="f-opt-dep">
        <div class="rich-flight-left">
          <div class="rich-flight-airline">Departure</div>
          <div class="rich-flight-times" id="f-dep-val">${flightData.depDate}</div>
        </div>
        <div class="rich-flight-right"><div class="rich-flight-meta">Space: cycle</div></div>
      </div>
      <div class="rich-divider"></div>
      <div class="rich-flight-row" id="f-opt-ret">
        <div class="rich-flight-left">
          <div class="rich-flight-airline">Return</div>
          <div class="rich-flight-times" id="f-ret-val">${flightData.retDate}</div>
        </div>
        <div class="rich-flight-right"><div class="rich-flight-meta">Space: cycle</div></div>
      </div>
      <div class="rich-divider"></div>
      <div class="rich-flight-row" id="f-opt-search">
        <div class="rich-flight-left">
          <div class="rich-flight-airline">Search Flights</div>
          <div class="rich-flight-times">${flightData.origin} → ${flightData.dest}</div>
        </div>
        <div class="rich-flight-right"><div class="rich-flight-price">Space</div></div>
      </div>
    `;
    setTimeout(() => {
      showRich(html);
      updateFlightDateHighlight();
    }, 350);
  }

  function submitDates() {
    setFlightStep('searching', 0);
    setIntentHeader('Book a Flight', 'Searching');
    hideRich();
    morphTo('pill', {
      icon: '',
      primary: `${flightData.origin} → ${flightData.dest}`,
      secondary: flightData.depDate,
    });
    C.thumb.style.opacity = '0';
    startSiriOrb();
    setTimeout(() => {
      stopSiriOrb();
      flowResultsStep();
    }, 1800);
  }

  function flowResultsStep() {
    setFlightStep('results', 0);
    setIntentHeader('Book a Flight', 'Select');
    hideRich();
    morphTo('card-list', null);
    const rows = FLIGHTS.map((f, i) => `
      <div class="rich-flight-row ${i === flightUi.highlight ? 'selected' : ''}">
        <div class="rich-flight-left">
          <div class="rich-flight-airline">${f.airline} · ${f.dep} <span style="color:rgba(255,255,255,0.30);">→ ${f.arr}<sup style="font-size:10px;">${f.day}</sup></span></div>
          <div class="rich-flight-times">${f.stops} · ${f.duration}</div>
        </div>
        <div class="rich-flight-right">
          <div class="rich-flight-price">${f.price}</div>
          <div class="rich-flight-meta">${f.code}</div>
        </div>
      </div>
      ${i < FLIGHTS.length - 1 ? '<div class="rich-divider"></div>' : ''}
    `).join('');
    const html = `
      <div class="rich-list-header">${flightData.origin} → ${flightData.dest} · ${flightData.depDate} · ↑/↓ select · Space confirm · X cancel</div>
      <div class="rich-divider"></div>
      <div style="flex:1;overflow-y:auto;margin:0 -20px;padding:0 20px;">${rows}</div>
    `;
    setTimeout(() => {
      showRich(html);
      updateFlightResultHighlight();
    }, 350);
  }

  function selectFlight(idx) {
    if (!flightUi.active) return;
    setFlightStep('confirm', idx);
    flightUi.highlight = idx;
    const f = FLIGHTS[idx];
    updateFlightResultHighlight();
    setTimeout(() => {
      setIntentHeader('Book a Flight', 'Confirm');
      hideRich();
      morphTo('pill', {
        icon: '✈',
        primary: `${f.airline} · ${f.price}`,
        secondary: `${flightData.depDate} · ${f.stops}`,
      });
      setTimeout(() => {
        setIntentHeader('Book a Flight', 'Booked ✓');
        setFlightStep('booked', 0);
        morphTo('circle', { icon: '✓', primary: '', secondary: '', detail: '' });
        C.thumb.style.fontSize = '26px';
        setTimeout(() => {
          setActive(false);
          setFlightStep('idle', 0);
          hideIntentHeader();
          morphTo('circle', createRootCircle());
          document.getElementById('stage').classList.remove('flow-active');
          document.getElementById('input-area').classList.remove('hidden');
        }, 3000);
      }, 2000);
    }, 500);
  }

  function syncFlightDestinationFromText(userText) {
    const destMatch = String(userText || '').match(/to\s+([a-zA-Z\s]+)/i);
    if (!destMatch) return;
    flightData.destCity = destMatch[1].trim();
    const cityMap = { tokyo: 'NRT', paris: 'CDG', london: 'LHR', 'new york': 'JFK', sydney: 'SYD', dubai: 'DXB', seoul: 'ICN', amsterdam: 'AMS' };
    const key = flightData.destCity.toLowerCase();
    const found = Object.keys(cityMap).find((k) => key.includes(k));
    if (found) flightData.dest = cityMap[found];
  }

  async function handleAiRequest(userText) {
    const provider = AI_PROVIDERS.gauss;
    try {
      const result = await provider.resolve({
        userText,
        stageOverride: getAiStageOverride(),
        scenarios: scenarioLibrary(),
        selected: selectedScenario(),
      });
      const safeShape = SCENARIO_SHAPES.includes(result?.shape) ? result.shape : 'pill';
      const safeContent = result?.content || {
        icon: createIcon('emoji', '✨'),
        primary: 'Generated response',
        secondary: `User: ${userText}`,
        detail: '',
      };
      if (result?.scenarioId && scenarioLibrary().some((item) => item.id === result.scenarioId)) {
        setSelectedScenarioId(result.scenarioId);
        renderScenarioUi();
      }
      previewScenario(createScenario({
        name: 'AI Preview',
        shape: safeShape,
        content: {
          icon: safeContent.icon,
          primary: safeContent.primary,
          secondary: safeContent.secondary,
          detail: safeContent.detail,
          image: safeContent.image,
          typography: safeContent.typography,
        },
        triggers: [],
      }));
    } catch (err) {
      console.warn('AI mode failed, falling back to manual mode', err);
      setIntentHeader('AI unavailable', 'Fallback to manual');
      setTimeout(() => hideIntentHeader(), 1200);
      handleManualRequest(userText);
    }
  }

  function handleManualRequest(userText) {
    if (/flight|fly|book.*flight|ticket/i.test(userText)) {
      syncFlightDestinationFromText(userText);
      startFlightFlow();
      return;
    }
    const scenario = scenarioLibrary().find((item) => scenarioMatchesText(item, userText)) || selectedScenario();
    if (scenario) {
      setSelectedScenarioId(scenario.id);
      renderScenarioUi();
      previewScenario(scenario);
      return;
    }
    morphTo('pill', {
      icon: createIcon('emoji', '⚠'),
      primary: 'No Match',
      secondary: 'Create a scenario to preview this',
      detail: '',
    });
  }

  async function processRequest(userText) {
    hideRich();
    stopSiriOrb();
    if (getResponseMode() === RESPONSE_MODE.AI) {
      await handleAiRequest(userText);
      return;
    }
    handleManualRequest(userText);
  }

  function handleKeyDown(e) {
    if (!flightUi.active) return false;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFlightHighlight(-1);
      return true;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFlightHighlight(1);
      return true;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      confirmFlightStep();
      return true;
    }
    if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      cancelFlightFlow();
      return true;
    }
    return false;
  }

  return {
    isActive: () => flightUi.active,
    handleKeyDown,
    handleManualRequest,
    handleAiRequest,
    processRequest,
    startFlightFlow,
    cancelFlightFlow,
    syncFlightDestinationFromText,
  };
}
