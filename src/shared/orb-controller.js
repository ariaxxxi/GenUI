export function initOrbController({ document, C, clearListPills, morphTo }) {
  function showAiIdle() {
    document.getElementById('drop-main').classList.add('ai-mode');
    document.getElementById('siri-orb')?.classList.remove('visible');
  }

  function startSiriOrb(instant) {
    document.getElementById('drop-main').classList.add('ai-mode');
    document.getElementById('siri-orb')?.classList.remove('visible');
  }

  function ambientFromAi(shape, contentData, customGeo) {
    stopSiriOrb();
    morphTo(shape, contentData, customGeo);
  }

  function stopSiriOrb() {
    const orb = document.getElementById('siri-orb');
    if (orb) orb.classList.remove('visible');
    clearListPills();
    document.getElementById('drop-main').classList.remove('ai-mode');
    C.thumb.style.opacity = '';
    C.thumb.style.fontSize = '';
  }

  return { showAiIdle, startSiriOrb, ambientFromAi, stopSiriOrb };
}
