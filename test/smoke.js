const playwright = require('playwright');
(async ()=>{
  const url = 'http://localhost:5180/ai.html';
  const browser = await playwright.chromium.launch({headless:true});
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => logs.push({type: 'pageerror', text: String(err)}));

  await page.goto(url, {waitUntil:'domcontentloaded', timeout: 15000});
  await page.waitForTimeout(400);

  const chip = await page.$('//button[contains(normalize-space(.), "Send a message to Alice")]');
  if (!chip) {
    console.log('MISSING_CHIP');
    console.log(JSON.stringify(logs, null, 2));
    await browser.close();
    process.exit(2);
  }
  await chip.click();
  await page.waitForTimeout(700);

  const currentShape = await page.evaluate(()=>window.currentShape || document.body.dataset.currentShape || '');
  console.log('SHAPE:'+currentShape);
  console.log('LOGS:'+JSON.stringify(logs));
  await browser.close();
})();
