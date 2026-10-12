const MEDIAPIPE_VERSION = '0.10.14';
const PINCH_CLOSE_THRESHOLD = 0.055;
const PINCH_OPEN_THRESHOLD = 0.085;
const LONG_PRESS_MS = 430;
const CLICK_MOVE_TOLERANCE_PX = 24;
const PRESS_DRAG_DEADZONE_PX = 18;
const VIRTUAL_POINTER_ID = 7007;
const DEFAULT_MOVEMENT_RATIO = 1;
const MOVEMENT_RATIO_STORAGE_KEY = 'genui.bubble.hand-movement-ratio.v1';

let handLandmarker = null;
let videoEl = null;
let canvasEl = null;
let canvasCtx = null;
let cursorEl = null;
let hudEl = null;
let animationFrameId = 0;
let lastVideoTime = -1;
let frameCount = 0;
let running = false;
let options = {};
let movementRatio = DEFAULT_MOVEMENT_RATIO;

const pointer = {
  initialized: false,
  rawX: 0,
  rawY: 0,
  x: 0,
  y: 0,
};

const gesture = {
  pinching: false,
  pressed: false,
  startAt: 0,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  pressX: 0,
  pressY: 0,
  pressPointerX: 0,
  pressPointerY: 0,
  dragActive: false,
  holdTimer: 0,
};

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

function setStatus(text, tone = '') {
  if (!options.status) return;
  options.status.textContent = text;
  options.status.dataset.tone = tone;
}

function setToggleChecked(checked) {
  if (options.toggle) options.toggle.checked = checked;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMovementRatio(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_MOVEMENT_RATIO;
  return clamp(numeric, 0.25, 2);
}

function readStoredMovementRatio() {
  try {
    const raw = localStorage.getItem(MOVEMENT_RATIO_STORAGE_KEY);
    if (raw == null) return DEFAULT_MOVEMENT_RATIO;
    return normalizeMovementRatio(JSON.parse(raw));
  } catch {
    return DEFAULT_MOVEMENT_RATIO;
  }
}

function persistMovementRatio() {
  try {
    localStorage.setItem(MOVEMENT_RATIO_STORAGE_KEY, JSON.stringify(movementRatio));
  } catch {
    // Non-critical; the slider still works for the current session.
  }
}

function syncMovementRatioUi() {
  const percent = Math.round(movementRatio * 100);
  if (options.movementRatioInput) options.movementRatioInput.value = String(percent);
  if (options.movementRatioState) options.movementRatioState.textContent = `${movementRatio.toFixed(2)}x`;
}

function handleMovementRatioInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  movementRatio = normalizeMovementRatio((Number(target.value) || 100) / 100);
  syncMovementRatioUi();
  persistMovementRatio();
}

function ensureVideo() {
  if (videoEl) return videoEl;
  videoEl = document.createElement('video');
  videoEl.className = 'g-hand-video';
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = true;
  document.body.appendChild(videoEl);
  return videoEl;
}

function ensureCanvas() {
  if (canvasEl) return canvasEl;
  canvasEl = document.createElement('canvas');
  canvasEl.className = 'g-hand-preview';
  canvasEl.width = 220;
  canvasEl.height = 165;
  document.body.appendChild(canvasEl);
  canvasCtx = canvasEl.getContext('2d');
  return canvasEl;
}

function ensureCursor() {
  if (cursorEl) return cursorEl;
  cursorEl = document.createElement('div');
  cursorEl.className = 'g-hand-cursor';
  cursorEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursorEl);
  return cursorEl;
}

function ensureHud() {
  if (hudEl) return hudEl;
  hudEl = document.createElement('div');
  hudEl.className = 'g-hand-hud';
  hudEl.setAttribute('aria-hidden', 'true');
  hudEl.textContent = 'Show hand to camera';
  document.body.appendChild(hudEl);
  return hudEl;
}

function setUiActive(active) {
  document.body.classList.toggle('g-hand-active', active);
  ensureCursor().classList.toggle('is-visible', active);
  ensureCanvas().classList.toggle('is-visible', active);
  ensureHud().classList.toggle('is-visible', active);
}

async function loadHandLandmarker() {
  if (handLandmarker) return handLandmarker;
  const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/+esm`);
  const { FilesetResolver, HandLandmarker } = vision;
  const fileset = await FilesetResolver.forVisionTasks(
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`,
  );
  handLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.52,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
  });
  return handLandmarker;
}

function pinchDistance(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  return Math.hypot(thumb.x - index.x, thumb.y - index.y);
}

function pointerPoint(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  return {
    x: (1 - ((thumb.x + index.x) / 2)) * window.innerWidth,
    y: ((thumb.y + index.y) / 2) * window.innerHeight,
  };
}

function applyMovementRatio(rawPoint) {
  if (!pointer.initialized) {
    pointer.initialized = true;
    pointer.rawX = rawPoint.x;
    pointer.rawY = rawPoint.y;
    pointer.x = rawPoint.x;
    pointer.y = rawPoint.y;
    return { x: pointer.x, y: pointer.y };
  }
  const dx = rawPoint.x - pointer.rawX;
  const dy = rawPoint.y - pointer.rawY;
  pointer.rawX = rawPoint.x;
  pointer.rawY = rawPoint.y;
  pointer.x = clamp(pointer.x + dx * movementRatio, 0, window.innerWidth);
  pointer.y = clamp(pointer.y + dy * movementRatio, 0, window.innerHeight);
  return { x: pointer.x, y: pointer.y };
}

function moveDistanceFromStart() {
  return Math.hypot(gesture.lastX - gesture.startX, gesture.lastY - gesture.startY);
}

function eventTargetAt(x, y) {
  return document.elementFromPoint(
    Math.max(0, Math.min(window.innerWidth - 1, x)),
    Math.max(0, Math.min(window.innerHeight - 1, y)),
  );
}

function pointIsInsideControlPanel(x, y) {
  const target = eventTargetAt(x, y);
  return Boolean(target && options.controlPanel?.contains(target));
}

function bubblePressPoint() {
  const orb = document.querySelector('.bubble2-orb:not(.is-home-orb-hidden)');
  const source = orb || options.shell || options.stage;
  const rect = source?.getBoundingClientRect?.();
  if (rect?.width && rect?.height) {
    return {
      x: rect.left + (rect.width / 2),
      y: rect.top + (rect.height / 2),
    };
  }
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

function createPointerEvent(type, x, y, pressed = false) {
  const init = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: type === 'pointerup' ? 0 : 0,
    buttons: pressed ? 1 : 0,
    pointerId: VIRTUAL_POINTER_ID,
    pointerType: 'mouse',
    isPrimary: true,
  };
  if (typeof PointerEvent === 'function') return new PointerEvent(type, init);
  return new MouseEvent(type.replace('pointer', 'mouse'), init);
}

function dispatchPointer(target, type, x, y, pressed = false) {
  if (!target) return;
  target.dispatchEvent(createPointerEvent(type, x, y, pressed));
}

function dispatchMouse(target, type, x, y, pressed = false) {
  if (!target) return;
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: 0,
    buttons: pressed ? 1 : 0,
  }));
}

function dispatchQuickClick(x, y) {
  const target = eventTargetAt(x, y);
  if (!target || cursorEl?.contains(target) || hudEl?.contains(target)) return;
  dispatchPointer(target, 'pointerdown', x, y, true);
  dispatchMouse(target, 'mousedown', x, y, true);
  dispatchPointer(target, 'pointerup', x, y, false);
  dispatchMouse(target, 'mouseup', x, y, false);
  if (target instanceof HTMLElement) {
    target.click();
    return;
  }
  target.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: 0,
  }));
}

function beginBubblePress() {
  if (!gesture.pinching || gesture.pressed || pointIsInsideControlPanel(gesture.lastX, gesture.lastY)) return;
  const pressPoint = bubblePressPoint();
  const pressTarget = options.shell || options.stage || eventTargetAt(pressPoint.x, pressPoint.y);
  gesture.pressed = true;
  gesture.dragActive = false;
  gesture.pressX = pressPoint.x;
  gesture.pressY = pressPoint.y;
  gesture.pressPointerX = gesture.lastX;
  gesture.pressPointerY = gesture.lastY;
  gesture.lastX = pressPoint.x;
  gesture.lastY = pressPoint.y;
  clearTimeout(gesture.holdTimer);
  gesture.holdTimer = 0;
  dispatchPointer(pressTarget, 'pointerdown', pressPoint.x, pressPoint.y, true);
  dispatchMouse(pressTarget, 'mousedown', pressPoint.x, pressPoint.y, true);
  cursorEl?.classList.add('is-pressing');
  setStatus('press active', 'active');
  if (hudEl) hudEl.textContent = 'Hold and move to drag';
}

function endBubblePress() {
  dispatchPointer(window, 'pointerup', gesture.lastX, gesture.lastY, false);
  dispatchMouse(window, 'mouseup', gesture.lastX, gesture.lastY, false);
}

function clearHoldTimer() {
  if (!gesture.holdTimer) return;
  clearTimeout(gesture.holdTimer);
  gesture.holdTimer = 0;
}

function resetGesture() {
  clearHoldTimer();
  gesture.pinching = false;
  gesture.pressed = false;
  gesture.startAt = 0;
  gesture.startX = 0;
  gesture.startY = 0;
  gesture.lastX = 0;
  gesture.lastY = 0;
  gesture.pressX = 0;
  gesture.pressY = 0;
  gesture.pressPointerX = 0;
  gesture.pressPointerY = 0;
  gesture.dragActive = false;
  cursorEl?.classList.remove('is-pinching', 'is-pressing');
}

function startPinch(x, y) {
  gesture.pinching = true;
  gesture.pressed = false;
  gesture.startAt = performance.now();
  gesture.startX = x;
  gesture.startY = y;
  gesture.lastX = x;
  gesture.lastY = y;
  cursorEl?.classList.add('is-pinching');
  setStatus('pinch hold', 'hold');
  if (hudEl) hudEl.textContent = 'Release to click, hold to press';
  clearHoldTimer();
  gesture.holdTimer = window.setTimeout(beginBubblePress, LONG_PRESS_MS);
}

function updatePinch(x, y) {
  if (gesture.pressed) {
    const deltaX = x - gesture.pressPointerX;
    const deltaY = y - gesture.pressPointerY;
    if (!gesture.dragActive && Math.hypot(deltaX, deltaY) < PRESS_DRAG_DEADZONE_PX) {
      gesture.lastX = gesture.pressX;
      gesture.lastY = gesture.pressY;
      return;
    }
    gesture.dragActive = true;
    const dragX = gesture.pressX + deltaX;
    const dragY = gesture.pressY + deltaY;
    gesture.lastX = dragX;
    gesture.lastY = dragY;
    dispatchPointer(window, 'pointermove', dragX, dragY, true);
    dispatchMouse(window, 'mousemove', dragX, dragY, true);
  } else if (performance.now() - gesture.startAt >= LONG_PRESS_MS) {
    gesture.lastX = x;
    gesture.lastY = y;
    beginBubblePress();
  } else {
    gesture.lastX = x;
    gesture.lastY = y;
  }
}

function finishPinch({ cancelClick = false } = {}) {
  const wasPressed = gesture.pressed;
  const shouldClick = !cancelClick
    && !wasPressed
    && performance.now() - gesture.startAt < LONG_PRESS_MS + 120
    && moveDistanceFromStart() <= CLICK_MOVE_TOLERANCE_PX;
  clearHoldTimer();
  if (wasPressed) {
    endBubblePress();
  } else if (shouldClick) {
    dispatchQuickClick(gesture.lastX, gesture.lastY);
  }
  resetGesture();
  setStatus('hand ready', 'ready');
  if (hudEl) hudEl.textContent = 'Pinch to click';
}

function updateCursor(x, y, detected) {
  const cursor = ensureCursor();
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  cursor.classList.toggle('has-hand', detected);
}

function drawPreview(landmarks, dist) {
  if (!canvasCtx || !canvasEl || !videoEl) return;
  const width = canvasEl.width;
  const height = canvasEl.height;
  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.drawImage(videoEl, 0, 0, width, height);
  canvasCtx.strokeStyle = 'rgba(255,255,255,0.32)';
  canvasCtx.lineWidth = 1.4;
  for (const [a, b] of HAND_CONNECTIONS) {
    const from = landmarks[a];
    const to = landmarks[b];
    canvasCtx.beginPath();
    canvasCtx.moveTo(from.x * width, from.y * height);
    canvasCtx.lineTo(to.x * width, to.y * height);
    canvasCtx.stroke();
  }
  landmarks.forEach((point, index) => {
    const keyPoint = index === 4 || index === 8;
    canvasCtx.beginPath();
    canvasCtx.arc(point.x * width, point.y * height, keyPoint ? 5 : 2.6, 0, Math.PI * 2);
    canvasCtx.fillStyle = keyPoint
      ? (gesture.pinching ? 'rgb(143, 220, 255)' : 'rgb(255, 255, 255)')
      : 'rgba(255,255,255,0.5)';
    canvasCtx.fill();
  });
  if (hudEl) {
    const confidence = Math.round(Math.max(0, Math.min(1, 1 - (dist / PINCH_OPEN_THRESHOLD))) * 100);
    hudEl.textContent = gesture.pressed
      ? 'Dragging bubble field'
      : gesture.pinching
        ? 'Pinch held'
        : `Hand ready ${confidence}%`;
  }
}

function clearPreview() {
  if (canvasCtx && canvasEl) canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ensureCursor().classList.remove('has-hand');
  pointer.initialized = false;
  if (hudEl) hudEl.textContent = 'Show hand to camera';
}

function detectFrame() {
  if (!running) return;
  animationFrameId = requestAnimationFrame(detectFrame);
  if (!videoEl || videoEl.readyState < 2 || !handLandmarker) return;
  if (videoEl.currentTime === lastVideoTime) return;
  lastVideoTime = videoEl.currentTime;
  frameCount += 1;

  const result = handLandmarker.detectForVideo(videoEl, performance.now());
  const landmarks = result.landmarks?.[0] || null;
  if (!landmarks) {
    clearPreview();
    setStatus('show hand', 'idle');
    if (gesture.pinching) finishPinch({ cancelClick: true });
    return;
  }

  const dist = pinchDistance(landmarks);
  const point = applyMovementRatio(pointerPoint(landmarks));
  updateCursor(point.x, point.y, true);
  drawPreview(landmarks, dist);

  if (!gesture.pinching && dist < PINCH_CLOSE_THRESHOLD) {
    startPinch(point.x, point.y);
  } else if (gesture.pinching && dist > PINCH_OPEN_THRESHOLD) {
    finishPinch();
  } else if (gesture.pinching) {
    updatePinch(point.x, point.y);
  } else if (frameCount % 12 === 0) {
    setStatus('hand ready', 'ready');
  }
}

async function start() {
  if (running) return;
  setStatus('starting camera', 'hold');
  setUiActive(true);
  setToggleChecked(true);
  try {
    await loadHandLandmarker();
    ensureVideo();
    ensureCanvas();
    ensureCursor();
    ensureHud();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 960 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    running = true;
    lastVideoTime = -1;
    frameCount = 0;
    setStatus('show hand', 'idle');
    animationFrameId = requestAnimationFrame(detectFrame);
  } catch (error) {
    console.warn('[hand-tracking] Unable to start webcam gesture control:', error);
    stop({ keepToggle: false });
    setStatus(error?.message || 'camera blocked', 'error');
  }
}

function stop({ keepToggle = true } = {}) {
  running = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  }
  if (gesture.pinching) finishPinch({ cancelClick: true });
  resetGesture();
  if (videoEl?.srcObject) {
    for (const track of videoEl.srcObject.getTracks()) track.stop();
    videoEl.srcObject = null;
  }
  clearPreview();
  setUiActive(false);
  setStatus('off');
  if (!keepToggle) setToggleChecked(false);
}

export function initHandTracking(config = {}) {
  options = { ...config };
  if (!options.toggle) return;
  movementRatio = readStoredMovementRatio();
  ensureVideo();
  ensureCanvas();
  ensureCursor();
  ensureHud();
  syncMovementRatioUi();
  setStatus('off');
  options.movementRatioInput?.addEventListener('input', handleMovementRatioInput);
  options.toggle.addEventListener('change', () => {
    if (options.toggle.checked) void start();
    else stop();
  });
  window.addEventListener('beforeunload', () => stop(), { once: true });
}
