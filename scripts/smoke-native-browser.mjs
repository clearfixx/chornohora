/**
 * Browser-level smoke check for both canonical and native comparison modes.
 * Runs against the production Next.js build with installed Chrome/Chromium.
 * No snapshots are accepted as visual parity evidence.
 */
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const candidates = ['google-chrome', 'chromium', 'chromium-browser'];
const browser = candidates.find(bin => spawnSync('which', [bin], {stdio: 'ignore'}).status === 0);
if (!browser) throw new Error('Chrome/Chromium is required for browser smoke checks');
const port = 3187;
const server = spawn('pnpm', ['start', '--port', String(port)], {stdio: 'pipe', detached: true, env: {...process.env, PORT: String(port)}});
let serverOutput = '';
server.stdout.on('data', data => {serverOutput += String(data);});
server.stderr.on('data', data => {serverOutput += String(data);});

async function ready() {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Next.js exited: ' + serverOutput);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/uk`);
      if (r.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error('Next.js server did not become ready: ' + serverOutput);
}
async function dump(path) {
  const result = spawnSync(browser, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--hide-scrollbars',
    '--virtual-time-budget=7000', '--dump-dom',
    `http://127.0.0.1:${port}${path}`,
  ], {encoding: 'utf8', timeout: 45000, maxBuffer: 10 * 1024 * 1024});
  if (result.status !== 0) throw new Error(`Chrome failed for ${path}: ${result.stderr.slice(-3000)}`);
  return result.stdout;
}
try {
  await ready();
  for (const locale of ['uk', 'en']) {
    const original = await dump(`/${locale}`);
    assert.match(original, /legacy-journey__frame/, `missing original iframe in ${locale}`);
    assert.match(original, /legacy\/index\.html/, `original asset missing in ${locale}`);
    const native = await dump(`/${locale}?preview=native`);
    for (const token of ['data-v22-source-scene', 'class="track"', 'class="stage"', 'route-ui-v6', 'class="fx hiker"', 'route-drawer']) {
      assert.ok(native.includes(token), `native ${locale} missing ${token}`);
    }
    assert.ok(!native.includes('legacy-journey__frame'), 'native comparison must not mount iframe');
    console.log(`Browser smoke OK: /${locale} and /${locale}?preview=native`);
  }
} finally {
  // pnpm launches Next.js as a child process; terminate the entire group.
  if (server.pid) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  }
  server.stdout.destroy();
  server.stderr.destroy();
}
