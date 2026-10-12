import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:5173/prototype', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const x = window.innerWidth / 2;
  const y = 180;
  const els = document.elementsFromPoint(x, y).map((el) => {
    const s = getComputedStyle(el);
    return {
      tag: el.tagName,
      id: el.id,
      className: el.className,
      bg: s.background,
      bgImage: s.backgroundImage,
      opacity: s.opacity,
      mixBlendMode: s.mixBlendMode,
      position: s.position,
      zIndex: s.zIndex,
      filter: s.filter,
      backdropFilter: s.backdropFilter,
    };
  });
  return {
    center: { x, y },
    elements: els,
    bodyInlineBg: document.body.style.backgroundImage,
    bodyRect: document.body.getBoundingClientRect().toJSON(),
    htmlBg: getComputedStyle(document.documentElement).background,
    bodyBg: getComputedStyle(document.body).background,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
