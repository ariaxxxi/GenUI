import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:5173/prototype', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'List-Pill' }).click();
await page.waitForTimeout(1100);
const info = await page.evaluate(() => {
  const active = document.querySelector('[data-scenario-shape].active');
  const pills = Array.from(document.querySelectorAll('[data-prototype-list-pill]')).map((el) => {
    const rect = el.getBoundingClientRect().toJSON();
    const text = el.querySelector('.g-disambiguation-pill-text')?.textContent?.trim() || '';
    const subtitle = el.querySelector('.g-disambiguation-pill-subtitle')?.textContent?.trim() || '';
    return { text, subtitle, rect };
  });
  return {
    activeStage: active?.textContent?.trim() || '',
    pillCount: pills.length,
    pills,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: './tmp-list-pill-stage.png', fullPage: true });
await browser.close();
