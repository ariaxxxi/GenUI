export function initAnimControls({ document, clamp }) {
  let animDur = 450;
  const SPRING_WITH_ANTICIPATION = `linear(
    0, -0.002 5%, -0.008 10%, -0.016 16%, -0.016 20%, -0.01 24%,
    0.16 30%, 0.64 38%, 0.9 46%, 1.0 54%,
    1.008 62%, 1.01 70%, 1.008 78%, 1.004 85%,
    1.004 92%, 1.001 97%, 1
  )`;
  const DEFAULT_CUSTOM_BEZIER = [0.35, 0.23, 0.13, 0.98];

  function parseBezierInput(rawValue) {
    const parts = String(rawValue || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (parts.length !== 4) return null;
    const values = parts.map((v) => Number(v));
    if (values.some((v) => !Number.isFinite(v))) return null;
    return values;
  }

  function getCustomBezierValues() {
    const input = document.getElementById('bz-input');
    const parsed = parseBezierInput(input?.value);
    return parsed || DEFAULT_CUSTOM_BEZIER;
  }

  function formatBezierValues(values) {
    return values.map((v) => {
      const rounded = Math.round(v * 1000) / 1000;
      return Number.isInteger(rounded) ? String(rounded) : String(rounded);
    }).join(', ');
  }

  const EASING_FN = {
    custom: () => {
      const v = getCustomBezierValues();
      return `cubic-bezier(${v.join(',')})`;
    },
    spring: () => SPRING_WITH_ANTICIPATION,
    ease: () => 'cubic-bezier(0.25,0.1,0.25,1)',
    linear: () => 'linear',
  };

  function rebuildAnim() {
    const curve = document.getElementById('ease-select').value;
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
    animDur = nextDuration;
    const slider = document.getElementById('dur-sl');
    const value = clamp(parseInt(nextDuration, 10) || animDur, 100, 1400);
    if (slider) slider.value = String(value);
    document.getElementById('dur-val').textContent = value + 'ms';
    animDur = value;
    rebuildAnim();
  }

  function applyEasingPresetDefaults(preset) {
    if (preset === 'custom') {
      setAnimDuration(450);
      return;
    }
    if (preset === 'spring') setAnimDuration(900);
  }

  function bind() {
    document.getElementById('dur-sl').addEventListener('input', function () {
      setAnimDuration(parseInt(this.value, 10));
    });
    document.getElementById('ease-select').addEventListener('change', function () {
      const showBz = this.value === 'custom';
      document.getElementById('bz-group').style.opacity = showBz ? '1' : '0.3';
      document.getElementById('bz-row').classList.toggle('hidden', !showBz);
      applyEasingPresetDefaults(this.value);
      if (this.value !== 'custom' && this.value !== 'spring') rebuildAnim();
    });
    document.querySelectorAll('.bz-inp').forEach((inp) => inp.addEventListener('input', rebuildAnim));
    document.getElementById('bz-input').addEventListener('blur', function () {
      const parsed = parseBezierInput(this.value);
      this.value = formatBezierValues(parsed || DEFAULT_CUSTOM_BEZIER);
    });

    const showBz = document.getElementById('ease-select').value === 'custom';
    document.getElementById('bz-group').style.opacity = showBz ? '1' : '0.3';
    document.getElementById('bz-row').classList.toggle('hidden', !showBz);
    document.getElementById('bz-input').value = formatBezierValues(getCustomBezierValues());
  }

  function initStarfield() {
    [[8,12,.04,3.8,0],[18,76,.03,5.1,.8],[28,34,.05,4.2,.3],[38,88,.04,6.0,1.1],
     [48,22,.05,3.5,.5],[58,65,.03,4.8,.9],[68,42,.04,5.5,.2],[78,10,.04,4.0,.7],
     [88,55,.05,3.2,1.3],[12,48,.03,5.8,.4],[22,90,.04,4.5,1.0],[32,18,.04,3.9,.6],
     [42,72,.05,5.2,.1],[52,38,.03,4.1,.8],[62,82,.04,3.7,1.2],[72,28,.05,5.6,.3],
     [82,60,.04,4.3,.9],[92,14,.05,3.4,.5],[5,55,.03,5.0,1.1],[15,25,.04,4.7,.2],
     [25,70,.04,3.6,.7],[35,5,.05,5.3,1.4],[45,85,.03,4.0,.6],[55,45,.04,3.8,1.0],
     [65,15,.04,5.1,.3],[75,75,.05,4.4,.8],[85,35,.03,3.5,1.3],[95,50,.04,4.9,.4]]
      .forEach(([l,t,op,dur,delay]) => {
        const s = document.createElement('div');
        s.className = 'star';
        const big = Math.round(l + t) % 9 === 0;
        s.style.cssText = `left:${l}%;top:${t}%;width:${big ? 2 : 1}px;height:${big ? 2 : 1}px;background:rgba(255,255,255,1);--op:${op};--sd:${dur}s;--sdl:${delay}s;`;
        document.body.appendChild(s);
      });
  }

  bind();

  return {
    getAnimDuration: () => animDur,
    getEasingFns: () => EASING_FN,
    rebuildAnim,
    setAnimDuration,
    parseBezierInput,
    initStarfield,
  };
}
