import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:5173/prototype', { waitUntil: 'networkidle' });
const data = await page.evaluate(async () => {
  const src = new URL('assets/bg/living room.jpg', location.href).href;
  const img = new Image();
  const result = await new Promise((resolve) => {
    img.onload = () => resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight, currentSrc: img.currentSrc });
    img.onerror = () => resolve({ ok: false, width: 0, height: 0, currentSrc: img.currentSrc });
    img.src = src;
  });
  const fetched = await fetch(src).then(async (r) => ({ ok: r.ok, status: r.status, type: r.headers.get('content-type'), len: (await r.blob()).size }));
  return { src, result, fetched };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
