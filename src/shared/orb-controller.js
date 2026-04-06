export function initOrbController({ document, C, clearListPills, morphTo }) {
  let siriRaf = null;
  let orbT = 0;
  let orbRamp = 0;
  let orbTarget = 0;
  const ORB_SPEED = 1 / 180;
  let orbCY = 0.5;
  let orbCYTarget = 0.5;
  const USE_THINKING_ORB = false;
  const BLOBS = [
    { r: 0.32, speed: 0.022, phase: 0.00, ax: 0.10, ay: 0.08, freq: 1.00 },
    { r: 0.28, speed: 0.027, phase: 2.10, ax: 0.09, ay: 0.11, freq: 1.31 },
    { r: 0.26, speed: 0.032, phase: 4.20, ax: 0.11, ay: 0.07, freq: 0.77 },
    { r: 0.24, speed: 0.022, phase: 1.05, ax: 0.08, ay: 0.09, freq: 1.61 },
  ];

  function ss(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function ensureOrbLoop() {
    if (!USE_THINKING_ORB || siriRaf) return;
    const orb = document.getElementById('siri-orb');
    const canvas = document.getElementById('siri-canvas');
    orb.classList.add('visible');
    const ctx = canvas.getContext('2d');

    function draw() {
      orbT += 1;
      if (orbRamp < orbTarget) orbRamp = Math.min(orbTarget, orbRamp + ORB_SPEED);
      if (orbRamp > orbTarget) orbRamp = Math.max(orbTarget, orbRamp - ORB_SPEED);

      const dm = document.getElementById('drop-main');
      const W = dm.offsetWidth || 100;
      const H = dm.offsetHeight || 100;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      orbCY += (orbCYTarget - orbCY) * 0.03;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      const r = ss(orbRamp);
      for (const b of BLOBS) {
        const px = (0.5 + Math.sin(orbT * b.speed + b.phase) * b.ax * r) * W;
        const py = (orbCY + Math.cos(orbT * b.speed * b.freq + b.phase) * b.ay * r) * H;
        const br = b.r * Math.min(W, H) * (1 + 0.06 * Math.sin(orbT * 0.027 + b.phase));
        const col = (b === BLOBS[1] || b === BLOBS[3]) ? 'rgba(210,232,255,1)' : 'rgba(255,255,255,1)';
        ctx.save();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      siriRaf = requestAnimationFrame(draw);
    }

    draw();
  }

  function showAiIdle() {
    document.getElementById('drop-main').classList.add('ai-mode');
    if (!USE_THINKING_ORB) {
      const orb = document.getElementById('siri-orb');
      if (orb) orb.classList.remove('visible');
      orbRamp = 0;
      orbTarget = 0;
      return;
    }
    orbTarget = 0;
    ensureOrbLoop();
  }

  function startSiriOrb(instant) {
    document.getElementById('drop-main').classList.add('ai-mode');
    if (!USE_THINKING_ORB) {
      const orb = document.getElementById('siri-orb');
      if (orb) orb.classList.remove('visible');
      orbRamp = 0;
      orbTarget = 0;
      return;
    }
    if (instant) orbRamp = 1;
    orbTarget = 1;
    ensureOrbLoop();
  }

  function ambientFromAi(shape, contentData, customGeo) {
    stopSiriOrb();
    morphTo(shape, contentData, customGeo);
  }

  function stopSiriOrb(options = {}) {
    const keepAiMode = options?.keepAiMode === true;
    const preserveList = options?.preserveList === true;
    const currentShape = document.body?.dataset?.currentShape || '';
    if (siriRaf) {
      cancelAnimationFrame(siriRaf);
      siriRaf = null;
    }
    const orb = document.getElementById('siri-orb');
    if (orb) orb.classList.remove('visible');
    if (!preserveList && currentShape !== 'list') clearListPills();
    if (!keepAiMode) document.getElementById('drop-main').classList.remove('ai-mode');
    C.thumb.style.opacity = '';
    C.thumb.style.fontSize = '';
    orbRamp = 0;
    orbTarget = 0;
  }

  return { showAiIdle, startSiriOrb, ambientFromAi, stopSiriOrb };
}
