/**
 * Real browser interaction regression for the v22 native comparison.
 * Uses Chrome DevTools Protocol over Node's built-in WebSocket (Node 22).
 * Requires a built Next.js app and system Chromium; no extra dependencies.
 */
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const browser = ['google-chrome', 'chromium', 'chromium-browser']
  .find(bin => spawnSync('which', [bin], {stdio: 'ignore'}).status === 0);
if (!browser) throw new Error('Chrome/Chromium required');
const port = 3188;
const debugPort = 9338;
const profile = mkdtempSync(join(tmpdir(), 'chornohora-cdp-'));
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
  for (const [name, p] of [['hero', 0], ['hoverla', .21], ['brebeneskul', .42], ['nesamovyte', .63], ['petros', .83]]) {
    const state = await evaluate(`(async () => {
      window.scrollTo({top: ${name === 'hero' ? 0 : `(${geometry.top} + ${geometry.travel} * ${p})`}, behavior: 'instant'});
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const hiker = document.querySelector('.track .stage .hiker');
      const active = [...document.querySelectorAll('.route-ui-v6 .stop.is-active')];
      return {started: document.body.classList.contains('route-started'), x: hiker.style.getPropertyValue('--hiker-x'), active: active.map(el => el.dataset.peak), scroll: scrollY};
    })()`);
    assert.equal(state.started, name !== 'hero', `route panel mismatch at ${name} ${locale}/${width}`);
    assert.ok(state.x.endsWith('px'), `hiker position missing at ${name}`);
    assert.ok(state.active.length <= 1, `multiple active route stops at ${name}`);
    console.log(`CDP ${locale}/${width} ${name}: ${JSON.stringify(state)}`);
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
} finally {
  ws?.close();
  chrome.kill('SIGTERM');
  if (server.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); } }
  rmSync(profile, {recursive: true, force: true});
}
