/**
 * Browser-level smoke check for canonical React and isolated legacy/native comparison modes.
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
  let lastError = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = spawnSync(browser, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--hide-scrollbars',
    '--virtual-time-budget=7000', '--dump-dom',
    `http://127.0.0.1:${port}${path}`,
  ], {encoding: 'utf8', timeout: 45000, maxBuffer: 10 * 1024 * 1024});
    if (result.status === 0 && result.stdout.includes('<html')) return result.stdout;
    lastError = `status=${result.status}, signal=${result.signal}, stderr=${result.stderr?.slice(-1200)}, stdoutBytes=${result.stdout?.length ?? 0}`;
    console.warn(`Chrome attempt ${attempt + 1} failed for ${path}: ${lastError}`);
    await delay(800 * (attempt + 1));
  }
  throw new Error(`Chrome failed for ${path} after retries: ${lastError}`);
}
try {
  await ready();
  for (const locale of ['uk', 'en']) {
    const missing = await fetch(`http://127.0.0.1:${port}/${locale}/nonexistent-trail-404`);
    assert.equal(missing.status, 404, 'Unknown localized trail must return HTTP 404');
    const errorPage = await missing.text();
    assert.match(errorPage, /nf-scene/, 'Branded error scene must render');
    assert.ok(errorPage.includes(locale === 'en' ? "You've lost the trail" : 'Ви збилися зі стежки'),
      '404 scene must use the active locale');
    const original = await dump(`/${locale}?preview=legacy`);
    assert.match(original, /legacy-journey__frame/, `missing original iframe in ${locale}`);
    assert.match(original, /legacy\/index\.html/, `original asset missing in ${locale}`);
    const native = await dump(`/${locale}?preview=native`);
    for (const token of ['data-v22-source-scene', 'class="track"', 'class="stage"', 'route-ui-v6', 'class="fx hiker"', 'route-drawer']) {
      assert.ok(native.includes(token), `native ${locale} missing ${token}`);
    }
    assert.ok(!native.includes('legacy-journey__frame'), 'native comparison must not mount iframe');
    const react = await dump(`/${locale}`);
    assert.ok(react.includes('class="track"') && react.includes('class="stage"'), 'React JSX stage missing');
    assert.ok(!react.includes('legacy-journey__frame'), 'React preview must not use iframe');
    assert.ok(react.includes('/react-journey.css'), 'React standalone stylesheet must be linked externally');
    assert.ok(!react.includes('href="/legacy/styles.css"') && !react.includes('href="/v22-react-scene.css"'),
      'React must not load frozen legacy CSS as a separate runtime dependency');
    assert.ok(!react.includes('<style>/* cyrillic-ext */'), 'React preview must not embed legacy CSS as inline style');
    assert.ok(!react.includes('preview=react'),
      'canonical React language links must not add preview query parameters');
    assert.ok(react.includes('href="/uk') && react.includes('href="/en'),
      'canonical React language links must target the locale routes');

    if(locale === 'en') {
      for(const value of ['A day on the ridge','The sun greets you first','Morning again','Reserve your place on the ridge']){
        assert.ok(react.includes(value), 'English React text missing: '+value);
      }
      assert.ok(!react.includes('Найвища точка України.'),'English preview still renders Ukrainian scene copy');
    } else {
      assert.ok(react.includes('Сонце зустрічає вас першим'), 'Ukrainian scene copy missing');
    }
    console.log(`Browser smoke OK: /${locale} canonical React, legacy and native comparisons`);
  }
} finally {
  // pnpm launches Next.js as a child process; terminate the entire group.
  if (server.pid) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  }
  server.stdout.destroy();
  server.stderr.destroy();
}
