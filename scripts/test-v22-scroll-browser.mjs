/**
 * Real browser interaction regression for the v22 native comparison.
 * Uses Chrome DevTools Protocol over Node's built-in WebSocket (Node 22).
 * Requires a built Next.js app and system Chromium; no extra dependencies.
 */
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const browser = ['google-chrome', 'chromium', 'chromium-browser']
  .find(bin => spawnSync('which', [bin], {stdio: 'ignore'}).status === 0);
if (!browser) throw new Error('Chrome/Chromium required');
const port = 3188;
const debugPort = 9338;
const profile = mkdtempSync(join(tmpdir(), 'chornohora-cdp-'));
const screenshots = join(process.cwd(), 'artifacts', 'v22-browser');
mkdirSync(screenshots, {recursive: true});
const geometrySamples = [];
const server = spawn('pnpm', ['start', '--port', String(port)], {
  detached: true, stdio: 'ignore',
});
const chrome = spawn(browser, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
  '--window-size=1440,900', 'about:blank',
], {stdio: 'ignore'});
let ws;
const pending = new Map();
let sequence = 0;
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
  pending.set(id, {resolve, reject, timeout});
  ws.send(JSON.stringify({id, method, params}));
});
async function waitFor(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try { const response = await fetch(url); if (response.ok) return await response.json(); } catch {}
    await delay(250);
  }
  throw new Error('Browser endpoint unavailable: ' + url);
}
const evaluate = async expression => {
  const result = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.result.value;
};
const capture = async (locale, width, mode, name) => {
  const result = await command('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  writeFileSync(join(screenshots, `${locale}-${width}-${mode}-${name}.png`), Buffer.from(result.result.data, 'base64'));
};
const sampleGeometry = async (locale, width, mode, name) => {
  const data = await evaluate(`(() => {
    const doc = ${mode === 'original' ? "document.querySelector('iframe[src=\"/legacy/index.html\"]').contentDocument" : 'document'};
    const win = doc.defaultView;
    const selectors = {
      heroButtons: '.hero-actions .cta, .hero-actions a',
      routePanel: '.route-ui-v6',
      routeStops: '.route-ui-v6 .stop',
      hiker: '.track .stage .hiker',
      stage: '.track .stage',
      drawer: '.route-menu, .route-drawer',
    };
    const rect = element => {
      const r = element.getBoundingClientRect();
      return {x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2)};
    };
    return {
      scrollY: win.scrollY,
      elements: Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [
        key, [...doc.querySelectorAll(selector)].slice(0, 8).map(element => ({
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 70),
          rect: rect(element),
        })),
      ])),
    };
  })()`);
  geometrySamples.push({locale, width, mode, name, ...data});
};
const check = async (locale, width) => {
  await command('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 700});
  await command('Page.navigate', {url: `http://127.0.0.1:${port}/${locale}?preview=native`});
  let mounted = false;
  for (let i = 0; i < 100; i++) {
    mounted = await evaluate("!!document.querySelector('.track .stage .hiker') && !!document.querySelector('.route-ui-v6 .stop')");
    if (mounted) break;
    await delay(150);
  }
  assert.ok(mounted, `native scene missing: ${locale}/${width}`);
  const geometry = await evaluate(`(() => {
    const track = document.querySelector('.track');
    const stage = track.querySelector('.stage');
    return {top: track.getBoundingClientRect().top + scrollY, travel: track.offsetHeight - stage.offsetHeight};
  })()`);
  assert.ok(geometry.travel > 200, `no scrollable travel: ${locale}/${width}`);
  const peaks = [['hero', 0, null], ['hoverla', .21, '1'], ['brebeneskul', .42, '2'], ['nesamovyte', .63, '3'], ['petros', .83, '4']];
  let previousX = -1;
  for (const [name, p, expectedStop] of peaks) {
    const state = await evaluate(`(async () => {
      window.scrollTo({top: ${name === 'hero' ? 0 : `(${geometry.top} + ${geometry.travel} * ${p})`}, behavior: 'instant'});
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const hiker = document.querySelector('.track .stage .hiker');
      const active = [...document.querySelectorAll('.route-ui-v6 .stop.is-active')];
      return {started: document.body.classList.contains('route-started'), x: hiker.style.getPropertyValue('--hiker-x'), active: active.map(el => el.dataset.peak), scroll: scrollY};
    })()`);
    assert.equal(state.started, name !== 'hero', `route panel mismatch at ${name} ${locale}/${width}`);
    assert.ok(state.x.endsWith('px'), `hiker position missing at ${name}`);
    const x = Number.parseFloat(state.x);
    assert.ok(Number.isFinite(x) && x >= previousX, `hiker must progress monotonically at ${name}`);
    previousX = x;
    assert.deepEqual(state.active, expectedStop === null ? [] : [expectedStop], `wrong active summit at ${name} ${locale}/${width}`);
    // Route panel uses CSS transitions: measure only after they settle.
    await delay(650);
    await sampleGeometry(locale, width, 'native', name);
    await capture(locale, width, 'native', name);
    console.log(`CDP ${locale}/${width} ${name}: ${JSON.stringify(state)}`);
  }
  const reverse = await evaluate(`(async () => {
    window.scrollTo({top: 0, behavior: 'instant'});
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return {started: document.body.classList.contains('route-started'), active: [...document.querySelectorAll('.route-ui-v6 .stop.is-active')].map(el => el.dataset.peak)};
  })()`);
  assert.equal(reverse.started, false, `route panel failed to hide on reverse scroll: ${locale}/${width}`);
  assert.deepEqual(reverse.active, [], `active summit not cleared on reverse scroll: ${locale}/${width}`);
  await command('Page.navigate', {url: `http://127.0.0.1:${port}/${locale}`});
  let originalReady = false;
  for (let i = 0; i < 100; i++) {
    originalReady = await evaluate(`(() => {
      const frame = document.querySelector('iframe[src="/legacy/index.html"]');
      return !!frame?.contentDocument?.querySelector('.track .stage');
    })()`);
    if (originalReady) break;
    await delay(150);
  }
  assert.ok(originalReady, `approved v22 iframe failed to load: ${locale}/${width}`);
  for (const [name, p] of [['hero', 0], ['hoverla', .21], ['brebeneskul', .42], ['nesamovyte', .63], ['petros', .83]]) {
    await evaluate(`(async () => {
      const frame = document.querySelector('iframe[src="/legacy/index.html"]');
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      const track = doc.querySelector('.track');
      const stage = track.querySelector('.stage');
      const top = track.getBoundingClientRect().top + win.scrollY;
      const travel = track.offsetHeight - stage.offsetHeight;
      win.scrollTo({top: ${name === 'hero' ? '0' : `top + travel * ${p}`}, behavior: 'instant'});
      await new Promise(r => win.requestAnimationFrame(() => win.requestAnimationFrame(r)));
    })()`);
    // Original DCLogic may finish a frame after the scroll event; give it
    // the same settling interval as the native controller.
    await delay(650);
    await sampleGeometry(locale, width, 'original', name);
    await capture(locale, width, 'original', name);
  }
};
try {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/uk`)).ok) break; } catch {}
    if (i === 79) throw new Error('Next.js did not start');
    await delay(250);
  }
  const target = await waitFor(`http://127.0.0.1:${debugPort}/json/list`);
  const page = target.find(x => x.type === 'page');
  assert.ok(page?.webSocketDebuggerUrl);
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, {once: true});
    ws.addEventListener('error', reject, {once: true});
  });
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    const job = pending.get(msg.id);
    if (!job) return;
    clearTimeout(job.timeout);
    pending.delete(msg.id);
    if (msg.error) job.reject(new Error(JSON.stringify(msg.error)));
    else job.resolve(msg);
  });
  await command('Page.enable');
  await command('Runtime.enable');
  for (const locale of ['uk', 'en']) for (const width of [1440, 390]) await check(locale, width);
  writeFileSync(join(screenshots, 'geometry.json'), JSON.stringify({samples: geometrySamples}, null, 2));
  console.log('Saved geometry measurements:', geometrySamples.length);
} finally {
  ws?.close();
  const browserExit = chrome.exitCode === null ? once(chrome, 'exit') : Promise.resolve();
  if (chrome.exitCode === null) chrome.kill('SIGTERM');
  if (server.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); } }
  await Promise.race([browserExit, delay(5000)]);
  // Chrome may flush profile files briefly after exit. Retry transient races.
  for (let attempt = 0; attempt < 8; attempt++) {
    try { rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100}); break; }
    catch (error) { if (attempt === 7) throw error; await delay(250); }
  }
}
