const DEFAULT_TEXT_FONT = '500 20px "DM Sans", sans-serif';
const DEFAULT_METRICS = Object.freeze({
  iconSize: 52,
  gap: 10,
  paddingX: { left: 14, right: 20 },
  minWidth: 80,
});

const textMeasureContext = document.createElement('canvas').getContext('2d');

export function renderThinkingOrbStreamMarkup({
  id = '',
  textId = '',
  hidden = true,
} = {}) {
  const idAttr = id ? ` id="${id}"` : '';
  const textIdAttr = textId ? ` id="${textId}"` : '';
  const hiddenClass = hidden ? ' hidden' : '';
  return `
    <div${idAttr} class="g-thinking-orb-stream bubble2-orb-stream${hiddenClass}" aria-hidden="true">
      <span class="g-thinking-orb-stream-icon bubble2-orb-stream-icon">
        <img data-thinking-orb-stream-icon data-bubble2-orb-stream-icon alt="">
      </span>
      <span${textIdAttr} class="g-thinking-orb-stream-text bubble2-orb-stream-text"></span>
    </div>
  `.trim();
}

export function getThinkingOrbStreamParts(root = document) {
  const scope = root || document;
  const stream = scope.matches?.('.g-thinking-orb-stream')
    ? scope
    : scope.querySelector?.('.g-thinking-orb-stream');
  return {
    stream: stream || null,
    icon: stream?.querySelector?.('[data-thinking-orb-stream-icon]') || null,
    text: stream?.querySelector?.('.g-thinking-orb-stream-text') || null,
  };
}

export function setThinkingOrbStreamVisible(stream, visible) {
  stream?.classList?.toggle('hidden', !visible);
}

export function syncThinkingOrbStreamIcon(icon, {
  src = '',
  alt = '',
  animate = false,
  switchDirection = '',
  motion = 'swipe',
} = {}) {
  if (!icon) return;
  const value = String(src || '').trim();
  const currentSrc = icon.getAttribute('src') || '';
  icon.alt = String(alt || '');
  if (!value || currentSrc === value) return;
  if (!animate || typeof icon.animate !== 'function') {
    icon.src = value;
    return;
  }

  const parent = icon.parentElement;
  const crossfade = motion === 'crossfade' || motion === 'fade';
  const direction = switchDirection === 'right' ? 1 : -1;
  const next = icon.cloneNode(false);
  next.src = value;
  next.alt = String(alt || '');
  next.style.position = 'absolute';
  next.style.inset = '0';
  next.style.margin = 'auto';
  next.style.pointerEvents = 'none';
  next.style.transform = crossfade ? 'scale(1)' : `translateX(${-direction * 28}px) scale(0.92)`;
  next.style.opacity = '0';
  parent?.appendChild(next);

  const duration = 520;
  const easing = 'cubic-bezier(0.24, 0.27, 0.19, 1)';
  const outFrames = crossfade
    ? [{ opacity: 1 }, { opacity: 0 }]
    : [
      { transform: 'translateX(0) scale(1)', opacity: 1 },
      { transform: `translateX(${direction * 24}px) scale(0.94)`, opacity: 0 },
    ];
  const inFrames = crossfade
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [
      { transform: `translateX(${-direction * 28}px) scale(0.92)`, opacity: 0 },
      { transform: 'translateX(0) scale(1)', opacity: 1 },
    ];
  const outAnim = icon.animate(outFrames, { duration: crossfade ? 220 : duration, easing, fill: 'forwards' });
  const inAnim = next.animate(inFrames, { duration: crossfade ? 220 : duration, easing, fill: 'forwards' });
  const finish = () => {
    icon.src = value;
    icon.style.opacity = '';
    icon.style.transform = '';
    icon.getAnimations?.().forEach((animation) => animation.cancel());
    next.remove();
  };
  inAnim.onfinish = finish;
  inAnim.oncancel = finish;
  outAnim.oncancel = () => {
    icon.src = value;
    icon.style.opacity = '';
    icon.style.transform = '';
    next.remove();
  };
}

export function measureThinkingOrbStreamText(text, font = DEFAULT_TEXT_FONT) {
  const value = String(text || '');
  if (!value) return 0;
  if (!textMeasureContext) return value.length * 12;
  textMeasureContext.font = font;
  return textMeasureContext.measureText(value).width;
}

export function syncThinkingOrbStreamText(stream, textEl, text, {
  metrics = DEFAULT_METRICS,
  font = DEFAULT_TEXT_FONT,
  setText = true,
} = {}) {
  const value = String(text || '').trim();
  if (!value || !stream || !textEl) return { pillWidth: 0, textWidth: 0 };
  const iconSize = Number(metrics.iconSize) || DEFAULT_METRICS.iconSize;
  const gap = Number(metrics.gap) || 0;
  const paddingLeft = Number(metrics.paddingX?.left) || 0;
  const paddingRight = Number(metrics.paddingX?.right) || 0;
  const minWidth = Number(metrics.minWidth) || DEFAULT_METRICS.minWidth;
  const textWidth = Math.ceil(measureThinkingOrbStreamText(value, font)) + 2;
  const pillWidth = Math.max(minWidth, paddingLeft + iconSize + gap + textWidth + paddingRight);

  stream.style.setProperty('--g-thinking-pill-icon-size', `${iconSize}px`);
  stream.style.setProperty('--g-thinking-pill-gap', `${gap}px`);
  stream.style.setProperty('--g-thinking-pill-padding-left', `${paddingLeft}px`);
  stream.style.setProperty('--g-thinking-pill-padding-right', `${paddingRight}px`);
  stream.style.setProperty('--g-thinking-pill-width', `${pillWidth}px`);
  stream.style.setProperty('--g-thinking-text-width', `${textWidth}px`);
  stream.style.setProperty('--bubble2-thinking-pill-icon-size', `${iconSize}px`);
  stream.style.setProperty('--bubble2-thinking-pill-gap', `${gap}px`);
  stream.style.setProperty('--bubble2-thinking-pill-padding-left', `${paddingLeft}px`);
  stream.style.setProperty('--bubble2-thinking-pill-padding-right', `${paddingRight}px`);
  stream.style.setProperty('--bubble2-thinking-pill-width', `${pillWidth}px`);
  stream.style.setProperty('--bubble2-thinking-text-width', `${textWidth}px`);
  if (setText) textEl.textContent = value;
  return { pillWidth, textWidth };
}
