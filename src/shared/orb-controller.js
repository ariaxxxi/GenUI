export function initOrbController({ document, C, clearListPills, morphTo }) {
  function showAiIdle() {
    document.getElementById('drop-main').classList.add('ai-mode');
    document.getElementById('siri-orb')?.classList.remove('visible');
  }

  function startSiriOrb() {
    document.getElementById('drop-main').classList.add('ai-mode');
    document.getElementById('siri-orb')?.classList.remove('visible');
  }

  function ambientFromAi(shape, contentData, customGeo) {
    stopSiriOrb();
    morphTo(shape, contentData, customGeo);
  }

  function stopSiriOrb(options = {}) {
    const keepAiMode = options?.keepAiMode === true;
    const preserveList = options?.preserveList === true;
    const currentShape = document.body?.dataset?.currentShape || '';
    const orb = document.getElementById('siri-orb');
    if (orb) orb.classList.remove('visible');
    if (!preserveList && currentShape !== 'list') clearListPills();
    if (!keepAiMode) document.getElementById('drop-main').classList.remove('ai-mode');
    C.thumb.style.opacity = '';
    C.thumb.style.fontSize = '';
  }

  return { showAiIdle, startSiriOrb, ambientFromAi, stopSiriOrb };
}
