export function initAnimControls({ document, clamp }) {
  let animDur = 600;
  const SPRING_WITH_ANTICIPATION = `linear(
    0, -0.002 5%, -0.008 10%, -0.016 16%, -0.016 20%, -0.01 24%,
    0.16 30%, 0.64 38%, 0.9 46%, 1.0 54%,
    1.008 62%, 1.01 70%, 1.008 78%, 1.004 85%,
    1.004 92%, 1.001 97%, 1
  )`;
  const DEFAULT_CUSTOM_BEZIER = [0.35, 0.23, 0.13, 0.98];
  const sliderEls = () => [document.getElementById('dur-sl-left'), document.getElementById('dur-sl')].filter(Boolean);
  const valueEls = () => [document.getElementById('dur-val-left'), document.getElementById('dur-val')].filter(Boolean);
  const selectEls = () => [document.getElementById('ease-select-left'), document.getElementById('ease-select')].filter(Boolean);
  const bezierInputs = () => [document.getElementById('bz-input-left'), document.getElementById('bz-input')].filter(Boolean);
  const bezierGroups = () => [document.getElementById('bz-group-left'), document.getElementById('bz-group')].filter(Boolean);
  const bezierRows = () => [document.getElementById('bz-row-left'), document.getElementById('bz-row')].filter(Boolean);

  const parseBezierInput = (rawValue) => {
    const parts = String(rawValue || '').split(',').map((v) => v.trim()).filter(Boolean);
    if (parts.length !== 4) return null;
    const values = parts.map((v) => Number(v));
    return values.some((v) => !Number.isFinite(v)) ? null : values;
  };
  const getCustomBezierValues = () => parseBezierInput((document.getElementById('bz-input-left') || document.getElementById('bz-input'))?.value) || DEFAULT_CUSTOM_BEZIER;
  const formatBezierValues = (values) => values.map((v) => String(Math.round(v * 1000) / 1000)).join(', ');
  const EASING_FN = {
    custom: () => `cubic-bezier(${getCustomBezierValues().join(',')})`,
    spring: () => SPRING_WITH_ANTICIPATION,
    ease: () => 'cubic-bezier(0.25,0.1,0.25,1)',
    linear: () => 'linear',
  };

  function syncAnimationEasingUi(selectedValue) {
    selectEls().forEach((sel) => { sel.value = selectedValue; });
    const showBezier = selectedValue === 'custom';
    bezierGroups().forEach((el) => { el.style.opacity = showBezier ? '1' : '0.3'; });
    bezierRows().forEach((el) => el.classList.toggle('hidden', !showBezier));
  }

  function rebuildAnim() {
    const curve = (document.getElementById('ease-select-left') || document.getElementById('ease-select'))?.value || 'custom';
    const easing = EASING_FN[curve]();
    document.getElementById('anim-style').textContent = `
      :root {
        --spring: ${easing};
        --anim-w:  ${animDur}ms var(--spring);
        --anim-h:  ${animDur}ms var(--spring);
        --anim-br: ${animDur}ms var(--spring);
        --anim-tx: ${animDur}ms var(--spring);
        --anim-t:  ${animDur}ms var(--spring);
      }`;
  }

  function setAnimDuration(nextDuration) {
    const value = clamp(parseInt(nextDuration, 10) || animDur, 100, 1400);
    animDur = value;
    sliderEls().forEach((el) => { el.value = String(value); });
    valueEls().forEach((el) => { el.textContent = `${value}ms`; });
    rebuildAnim();
  }

  function applyEasingPresetDefaults(preset) {
    if (preset === 'custom') return void setAnimDuration(600);
    if (preset === 'spring') setAnimDuration(900);
  }

  function bind() {
    sliderEls().forEach((slider) => slider.addEventListener('input', () => setAnimDuration(slider.value)));
    selectEls().forEach((select) => select.addEventListener('change', () => {
      syncAnimationEasingUi(select.value);
      applyEasingPresetDefaults(select.value);
      if (select.value !== 'custom' && select.value !== 'spring') rebuildAnim();
    }));
    bezierInputs().forEach((input) => input.addEventListener('input', rebuildAnim));
    bezierInputs().forEach((input) => input.addEventListener('blur', () => {
      const normalized = formatBezierValues(parseBezierInput(input.value) || DEFAULT_CUSTOM_BEZIER);
      bezierInputs().forEach((other) => { other.value = normalized; });
    }));
    const defaultCurve = (document.getElementById('ease-select-left') || document.getElementById('ease-select'))?.value || 'custom';
    syncAnimationEasingUi(defaultCurve);
    const normalized = formatBezierValues(getCustomBezierValues());
    bezierInputs().forEach((input) => { input.value = normalized; });
  }

  function initStarfield() {
    [[8,12,.04,3.8,0],[18,76,.03,5.1,.8],[28,34,.05,4.2,.3],[38,88,.04,6.0,1.1],[48,22,.05,3.5,.5],[58,65,.03,4.8,.9],[68,42,.04,5.5,.2],[78,10,.04,4.0,.7],[88,55,.05,3.2,1.3],[12,48,.03,5.8,.4],[22,90,.04,4.5,1.0],[32,18,.04,3.9,.6],[42,72,.05,5.2,.1],[52,38,.03,4.1,.8],[62,82,.04,3.7,1.2],[72,28,.05,5.6,.3],[82,60,.04,4.3,.9],[92,14,.05,3.4,.5],[5,55,.03,5.0,1.1],[15,25,.04,4.7,.2],[25,70,.04,3.6,.7],[35,5,.05,5.3,1.4],[45,85,.03,4.0,.6],[55,45,.04,3.8,1.0],[65,15,.04,5.1,.3],[75,75,.05,4.4,.8],[85,35,.03,3.5,1.3],[95,50,.04,4.9,.4]].forEach(([l,t,op,dur,delay]) => {
      const s = document.createElement('div');
      s.className = 'star';
      const big = Math.round(l + t) % 9 === 0;
      s.style.cssText = `left:${l}%;top:${t}%;width:${big ? 2 : 1}px;height:${big ? 2 : 1}px;background:rgba(255,255,255,1);--op:${op};--sd:${dur}s;--sdl:${delay}s;`;
      document.body.appendChild(s);
    });
  }

  bind();
  return { getAnimDuration: () => animDur, getEasingFns: () => EASING_FN, rebuildAnim, setAnimDuration, parseBezierInput, initStarfield, syncAnimationEasingUi };
}
