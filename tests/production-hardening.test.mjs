import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(path, 'utf8');

test('canonical routes cannot disappear when optional legacy assets are missing', () => {
  const page = read('src/app/[locale]/page.tsx');
  const guard = page.indexOf('if (diagnosticsEnabled && hasV22Assets)');
  const canonical = page.indexOf('return <><link rel="stylesheet" href="/react-journey.css"');
  assert.ok(guard >= 0 && canonical > guard, 'Canonical React renderer must be outside optional asset guard');
  assert.match(page, /CHORNOHORA_ENABLE_DIAGNOSTICS === '1'/);
  assert.match(page, /if \(preview === 'legacy'\)/);
  assert.match(page, /if \(preview === 'native'\)/);
  assert.doesNotMatch(page, /getTranslations\('Migration'\)/);
});

test('production comparison routes and direct legacy files require opt-in', () => {
  const proxy = read('src/proxy.ts');
  assert.match(proxy, /request\.nextUrl\.pathname\.startsWith\('\/legacy\/'\)/);
  assert.match(proxy, /new NextResponse\('Not Found'/);
  assert.match(proxy, /status: 404/);
  assert.match(proxy, /matcher: \['\/legacy\/:path\*'/);
  assert.match(proxy, /CHORNOHORA_ENABLE_DIAGNOSTICS === '1'/);
  const smoke = read('scripts/smoke-native-browser.mjs');
  const scroll = read('scripts/test-v22-scroll-browser.mjs');
  assert.match(smoke, /CHORNOHORA_ENABLE_DIAGNOSTICS: '1'/);
  assert.match(scroll, /CHORNOHORA_ENABLE_DIAGNOSTICS: '1'/);
});

test('security headers do not break same-origin legacy diagnostics', () => {
  const config = read('next.config.ts');
  for (const header of [
    'X-Content-Type-Options', 'X-Frame-Options',
    'Referrer-Policy', 'Permissions-Policy',
  ]) assert.ok(config.includes(header), 'Missing '+header);
  assert.match(config, /SAMEORIGIN/);
  assert.doesNotMatch(config, /unsafe-inline|Content-Security-Policy/);
});
