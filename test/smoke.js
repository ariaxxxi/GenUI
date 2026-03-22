const playwright = require('playwright');
const { spawn } = require('node:child_process');
const { createServer } = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function getFreePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once('error', rejectPort);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : null;
      server.close((err) => {
        if (err) return rejectPort(err);
        if (!port) return rejectPort(new Error('Failed to acquire free port'));
        resolvePort(port);
      });
    });
  });
}

async function waitForServerReady(baseUrl, timeoutMs, serverLogs) {
  const deadline = Date.now() + timeoutMs;
  const url = `${baseUrl}/ai.html`;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {}
    await sleep(150);
  }
  throw new Error(`Timed out waiting for server at ${url}\n${serverLogs.join('\n')}`);
}

function stopServer(proc) {
  if (!proc || proc.exitCode !== null) return Promise.resolve();
  return new Promise((resolveStop) => {
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
    }, 2000);
    proc.once('exit', () => {
      clearTimeout(timeout);
      resolveStop();
    });
    proc.kill('SIGTERM');
  });
}

async function createTarget() {
  const externalBaseUrl = process.env.SMOKE_BASE_URL;
  if (externalBaseUrl) {
    return {
      baseUrl: externalBaseUrl.replace(/\/$/, ''),
      server: null,
      serverLogs: [],
    };
  }

  const port = process.env.PORT ? Number(process.env.PORT) : await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const serverLogs = [];
  const server = spawn(process.execPath, ['server.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => serverLogs.push(String(chunk).trimEnd()));
  server.stderr.on('data', (chunk) => serverLogs.push(String(chunk).trimEnd()));

  await waitForServerReady(baseUrl, 10000, serverLogs);
  return { baseUrl, server, serverLogs };
}

(async ()=>{
  const { baseUrl, server, serverLogs } = await createTarget();
  const url = `${baseUrl}/ai.html`;
  let browser;
  try {
    browser = await playwright.chromium.launch({headless:true});
    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
    page.on('pageerror', err => logs.push({type: 'pageerror', text: String(err)}));

    await page.goto(url, {waitUntil:'domcontentloaded', timeout: 15000});
    await page.waitForTimeout(400);

    const chip = await page.$('//button[contains(normalize-space(.), "Send a message to Alice")]');
    if (!chip) {
      console.log('MISSING_CHIP');
      console.log(JSON.stringify({ logs, serverLogs }, null, 2));
      process.exit(2);
    }
    await chip.click();
    await page.waitForTimeout(700);

    const currentShape = await page.evaluate(()=>window.currentShape || document.body.dataset.currentShape || '');
    console.log('SHAPE:'+currentShape);
    console.log('LOGS:'+JSON.stringify(logs));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
})();
