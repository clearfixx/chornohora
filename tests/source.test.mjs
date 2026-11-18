import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';

const root = join(process.cwd(), 'public', 'legacy');
const hasAssets = existsSync(join(root, 'index.html'));

test('legacy preservation mode is explicit and asset-gated', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  assert.match(page, /hasV22Assets/);
  assert.match(page, /<LegacyJourney/);
  assert.match(page, /public.*legacy.*index\.html/);
});

test('legacy iframe uses an absolute asset path', () => {
  const wrapper = readFileSync('src/components/journey/LegacyJourney.tsx', 'utf8');
  assert.match(wrapper, /src="\/legacy\/index\.html"/);
});

test('v22 import contains all required route anchor names', () => {
  const importer = readFileSync('scripts/import-v22.mjs', 'utf8');
  for (const id of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
    assert.ok(importer.includes(id));
  }
});

test('approved source assets are optional in scaffold but auditable when present', () => {
  if (!hasAssets) return;
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('<x-dc'));
  for (const id of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
    assert.ok(html.includes('id="' + id + '"'));
  }
});
