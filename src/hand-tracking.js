/**
 * Hand tracking module — thumb+index pinch → simulated pointer events on the orb.
 * Uses MediaPipe Hands via the @mediapipe/tasks-vision WASM bundle (CDN).
 */

const PINCH_THRESHOLD_CLOSE = 0.06;  // normalized distance to start pinch
const PINCH_THRESHOLD_OPEN  = 0.09;  // hysteresis — release pinch at this distance
const VIRTUAL_POINTER_ID    = 99;

let handLandmarker = null;
let videoEl         = null;
let canvasEl        = null;
let canvasCtx       = null;
let debugEl         = null;
let animFrameId     = null;
let isPinching      = false;
let lastPinchX      = 0;
let lastPinchY      = 0;
let pinchStartX     = 0;  // screen coords where pinch began
let pinchStartY     = 0;
let isRunning       = false;

const MOVE_SCALE    = 1 / 1.5;  // hand moves 1.5x to produce 1x mouse movement

// ── Toggle button UI ──────────────────────────────────────────────────────────

function createToggle() {
  const btn = document.createElement('button');
  btn.id = 'hand-tracking-toggle';
  btn.setAttribute('aria-label', 'Toggle hand tracking');
  btn.innerHTML = `<i class="bi bi-camera-video"></i>`;
  btn.title = 'Hand tracking off';

  Object.assign(btn.style, {
    position:       'fixed',
    top:            '16px',
    left:           '16px',
    zIndex:         '9999',
    width:          '40px',
    height:         '40px',
    borderRadius:   '50%',
    border:         '1px solid rgba(255,255,255,0.15)',
    background:     'rgba(255,255,255,0.06)',
    color:          'rgba(255,255,255,0.5)',
    fontSize:       '16px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    backdropFilter: 'blur(12px)',
    transition:     'background 200ms ease, color 200ms ease, border-color 200ms ease',
    outline:        'none',
  });

  btn.addEventListener('click', () => {
    if (isRunning) stop(btn);
    else start(btn);
  });

  document.body.appendChild(btn);
  return btn;
}

// ── Video element ─────────────────────────────────────────────────────────────

function createVideo() {
  const v = document.createElement('video');
  v.autoplay    = true;
  v.playsInline = true;
  v.muted       = true;
  Object.assign(v.style, {
    position:     'fixed',
    bottom:       '16px',
    left:         '16px',
    width:        '200px',
    height:       '150px',
    objectFit:    'cover',
    borderRadius: '10px',
    border:       '1px solid rgba(255,255,255,0.12)',
    opacity:      '0',           // hidden — canvas overlay replaces it visually
    zIndex:       '9990',
    transform:    'scaleX(-1)',
    display:      'none',
    pointerEvents: 'none',
  });
  document.body.appendChild(v);
  return v;
}

// ── Canvas overlay for debug drawing ─────────────────────────────────────────

function createCanvas() {
  const c = document.createElement('canvas');
  c.width  = 200;
  c.height = 150;
  Object.assign(c.style, {
    position:     'fixed',
    bottom:       '16px',
    left:         '16px',
    width:        '200px',
    height:       '150px',
    borderRadius: '10px',
    border:       '1px solid rgba(255,255,255,0.12)',
    zIndex:       '9991',
    display:      'none',
    pointerEvents: 'none',
    transform:    'scaleX(-1)',  // mirror to match video
  });
  document.body.appendChild(c);
  return c;
}

// ── Debug text panel ──────────────────────────────────────────────────────────

function createDebugPanel() {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position:     'fixed',
    bottom:       '174px',
    left:         '16px',
    width:        '200px',
    background:   'rgba(0,0,0,0.72)',
    color:        '#fff',
    fontSize:     '11px',
    fontFamily:   'monospace',
    padding:      '8px 10px',
    borderRadius: '8px',
    zIndex:       '9992',
    display:      'none',
    lineHeight:   '1.6',
    pointerEvents: 'none',
  });
  document.body.appendChild(el);
  return el;
}

// ── MediaPipe loader ──────────────────────────────────────────────────────────

async function loadHandLandmarker() {
  if (handLandmarker) return handLandmarker;

  console.log('[hand-tracking] loading MediaPipe…');

  const vision = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
  );

  const { HandLandmarker, FilesetResolver } = vision;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode:                'VIDEO',
    numHands:                   1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence:  0.4,
    minTrackingConfidence:      0.4,
  });

  console.log('[hand-tracking] model ready');
  return handLandmarker;
}

// ── Pinch detection ───────────────────────────────────────────────────────────

function getPinchDistance(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchMidpoint(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  return { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 };
}

function toScreenCoords(nx, ny) {
  return {
    x: (1 - nx) * window.innerWidth,
    y: ny * window.innerHeight,
  };
}

// ── Debug drawing ─────────────────────────────────────────────────────────────

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function drawDebug(landmarks, dist, pinching) {
  if (!canvasCtx) return;
  const W = canvasEl.width;
  const H = canvasEl.height;
  canvasCtx.clearRect(0, 0, W, H);

  // Draw video frame (mirrored via canvas transform)
  canvasCtx.save();
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(videoEl, -W, 0, W, H);
  canvasCtx.restore();

  // Connections
  canvasCtx.strokeStyle = 'rgba(255,255,255,0.3)';
  canvasCtx.lineWidth = 1;
  for (const [a, b] of CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    // landmarks are in mirrored space (canvas is also scaleX(-1) via CSS) so draw as-is
    canvasCtx.beginPath();
    canvasCtx.moveTo(la.x * W, la.y * H);
    canvasCtx.lineTo(lb.x * W, lb.y * H);
    canvasCtx.stroke();
  }

  // All dots
  for (let i = 0; i < landmarks.length; i++) {
    const l = landmarks[i];
    const isKey = i === 4 || i === 8;
    canvasCtx.beginPath();
    canvasCtx.arc(l.x * W, l.y * H, isKey ? 5 : 2.5, 0, Math.PI * 2);
    canvasCtx.fillStyle = isKey ? (pinching ? '#7af' : '#fff') : 'rgba(255,255,255,0.5)';
    canvasCtx.fill();
  }

  // Line between thumb (4) and index (8)
  const t = landmarks[4];
  const idx = landmarks[8];
  canvasCtx.beginPath();
  canvasCtx.moveTo(t.x * W, t.y * H);
  canvasCtx.lineTo(idx.x * W, idx.y * H);
  canvasCtx.strokeStyle = pinching ? 'rgba(114,154,241,0.9)' : 'rgba(255,255,255,0.5)';
  canvasCtx.lineWidth = 2;
  canvasCtx.stroke();
}

function updateDebugPanel(handsFound, dist, pinching, screenX, screenY) {
  if (!debugEl) return;
  if (!handsFound) {
    debugEl.innerHTML = `<span style="color:#f87">✗ no hand detected</span>`;
    return;
  }
  const pct = dist !== null ? (dist * 100).toFixed(1) : '—';
  const bar = dist !== null
    ? `<div style="margin:2px 0;background:rgba(255,255,255,0.1);border-radius:3px;height:6px;overflow:hidden">
         <div style="width:${Math.min(dist/0.15*100,100).toFixed(1)}%;height:100%;background:${pinching ? '#7af' : '#aaa'};border-radius:3px;transition:width 80ms"></div>
       </div>`
    : '';
  debugEl.innerHTML = `
    ✓ hand detected<br>
    dist: <b>${pct}%</b> (close&lt;6% open&gt;9%)<br>
    ${bar}
    pinch: <b style="color:${pinching ? '#7af' : '#aaa'}">${pinching ? 'ACTIVE 🤌' : 'open'}</b><br>
    screen: ${screenX !== null ? `${Math.round(screenX)}, ${Math.round(screenY)}` : '—'}
  `;
}

// ── Synthetic pointer events ──────────────────────────────────────────────────

function firePointerDown(x, y) {
  // Find the orb button directly — pointerdown listener is on the button, not the shell
  const orb = document.querySelector('.bubble2-orb');
  if (!orb) {
    console.warn('[hand-tracking] .bubble2-orb not found');
    return;
  }
  console.log(`[hand-tracking] pointerdown on orb at ${Math.round(x)}, ${Math.round(y)}`);
  orb.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, cancelable: true,
    clientX: x, clientY: y,
    pointerId: VIRTUAL_POINTER_ID, pointerType: 'mouse', isPrimary: true,
  }));
}

function firePointerMove(x, y) {
  window.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true, cancelable: true,
    clientX: x, clientY: y,
    pointerId: VIRTUAL_POINTER_ID, pointerType: 'mouse', isPrimary: true,
  }));
}

function firePointerUp(x, y) {
  console.log(`[hand-tracking] pointerup at ${Math.round(x)}, ${Math.round(y)}`);
  window.dispatchEvent(new PointerEvent('pointerup', {
    bubbles: true, cancelable: true,
    clientX: x, clientY: y,
    pointerId: VIRTUAL_POINTER_ID, pointerType: 'mouse', isPrimary: true,
  }));
}

// ── Detection loop ────────────────────────────────────────────────────────────

let lastVideoTime = -1;
let frameCount    = 0;

function detect() {
  if (!isRunning) return;

  animFrameId = requestAnimationFrame(detect);

  if (!videoEl || videoEl.readyState < 2) {
    if (frameCount++ % 60 === 0) console.log('[hand-tracking] waiting for video readyState…', videoEl?.readyState);
    return;
  }

  if (videoEl.currentTime === lastVideoTime) return;
  lastVideoTime = videoEl.currentTime;
  frameCount++;

  const now    = performance.now();
  const result = handLandmarker.detectForVideo(videoEl, now);

  if (frameCount % 30 === 0) {
    console.log(`[hand-tracking] frame ${frameCount} — hands: ${result.landmarks?.length ?? 0}`);
  }

  if (result.landmarks && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0];
    const dist      = getPinchDistance(landmarks);
    const mid       = getPinchMidpoint(landmarks);
    const { x, y } = toScreenCoords(mid.x, mid.y);

    drawDebug(landmarks, dist, isPinching);
    updateDebugPanel(true, dist, isPinching, x, y);

    if (frameCount % 10 === 0) {
      console.log(`[hand-tracking] dist=${(dist*100).toFixed(1)}% pinching=${isPinching} screen=(${Math.round(x)},${Math.round(y)})`);
    }

    if (!isPinching && dist < PINCH_THRESHOLD_CLOSE) {
      console.log(`[hand-tracking] PINCH START dist=${(dist*100).toFixed(1)}%`);
      isPinching  = true;
      pinchStartX = x;
      pinchStartY = y;
      lastPinchX  = x;
      lastPinchY  = y;
      firePointerDown(x, y);
    } else if (isPinching && dist > PINCH_THRESHOLD_OPEN) {
      console.log(`[hand-tracking] PINCH END dist=${(dist*100).toFixed(1)}%`);
      isPinching = false;
      firePointerUp(lastPinchX, lastPinchY);
    } else if (isPinching) {
      // Scale movement: hand must move 1.5x to produce 1x cursor movement
      const scaledX = pinchStartX + (x - pinchStartX) * MOVE_SCALE;
      const scaledY = pinchStartY + (y - pinchStartY) * MOVE_SCALE;
      lastPinchX = scaledX;
      lastPinchY = scaledY;
      firePointerMove(scaledX, scaledY);
    }
  } else {
    // Clear canvas
    if (canvasCtx) canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    updateDebugPanel(false, null, false, null, null);

    if (isPinching) {
      console.log('[hand-tracking] hand lost — releasing pinch');
      isPinching = false;
      firePointerUp(lastPinchX, lastPinchY);
    }
  }
}

// ── Start / stop ──────────────────────────────────────────────────────────────

async function start(btn) {
  btn.style.opacity      = '0.5';
  btn.style.pointerEvents = 'none';
  btn.title = 'Starting…';

  try {
    await loadHandLandmarker();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
    });
    console.log('[hand-tracking] camera stream acquired');

    videoEl = videoEl || createVideo();
    videoEl.srcObject = stream;
    videoEl.style.display = 'block';
    await videoEl.play();
    console.log('[hand-tracking] video playing, readyState:', videoEl.readyState);

    canvasEl = canvasEl || createCanvas();
    canvasCtx = canvasEl.getContext('2d');
    canvasEl.style.display = 'block';

    debugEl = debugEl || createDebugPanel();
    debugEl.style.display = 'block';

    isRunning  = true;
    isPinching = false;
    frameCount = 0;
    lastVideoTime = -1;

    animFrameId = requestAnimationFrame(detect);

    Object.assign(btn.style, {
      background:    'rgba(114, 154, 241, 0.18)',
      borderColor:   'rgba(114, 154, 241, 0.5)',
      color:         'rgb(114, 154, 241)',
      opacity:       '1',
      pointerEvents: 'auto',
    });
    btn.innerHTML = `<i class="bi bi-camera-video-fill"></i>`;
    btn.title = 'Hand tracking on — click to stop';

  } catch (err) {
    console.error('[hand-tracking] failed to start:', err);
    Object.assign(btn.style, { opacity: '1', pointerEvents: 'auto' });
    btn.title = `Failed: ${err.message}`;
  }
}

function stop(btn) {
  isRunning = false;

  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }

  if (isPinching) { firePointerUp(lastPinchX, lastPinchY); isPinching = false; }

  if (videoEl) {
    const stream = videoEl.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    videoEl.srcObject    = null;
    videoEl.style.display = 'none';
  }

  if (canvasEl) { canvasEl.style.display = 'none'; }
  if (debugEl)  { debugEl.style.display  = 'none'; }

  Object.assign(btn.style, {
    background:  'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    color:       'rgba(255,255,255,0.5)',
  });
  btn.innerHTML = `<i class="bi bi-camera-video"></i>`;
  btn.title = 'Hand tracking off';
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initHandTracking() {
  createToggle();
}
