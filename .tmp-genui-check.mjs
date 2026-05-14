import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:5173/prototype', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const main = document.getElementById('drop-main');
  const bodyStyle = getComputedStyle(document.body);
  const mainStyle = main ? getComputedStyle(main) : null;
  const blurBg = document.querySelector('.bg-blur-image');
  const blurStyle = blurBg ? getComputedStyle(blurBg) : null;
  return {
    bodyBackgroundImage: bodyStyle.backgroundImage,
    bodyBackgroundColor: bodyStyle.backgroundColor,
    bodyClasses: document.body.className,
    mainBackground: mainStyle?.backgroundImage || mainStyle?.background || '',
    mainBackdropFilter: mainStyle?.backdropFilter || '',
    mainWebkitBackdropFilter: mainStyle?.webkitBackdropFilter || '',
    mainBoxShadow: mainStyle?.boxShadow || '',
    blurBgBackgroundImage: blurStyle?.backgroundImage || '',
    blurBgOpacity: blurStyle?.opacity || '',
    blurBgZ: blurStyle?.zIndex || '',
    rect: main ? main.getBoundingClientRect().toJSON() : null,
  };
});
console.log(JSON.stringify(data, null, 2));
await page.screenshot({ path: './tmp-genui-prototype.png', fullPage: true });
await browser.close();
