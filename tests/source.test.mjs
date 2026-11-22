import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';

const root = join(process.cwd(), 'public', 'legacy');
const hasAssets = existsSync(join(root, 'index.html'));

test('legacy page is only mounted when assets are present', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  assert.match(page, /hasV22Assets/);
  assert.match(page, /<LegacyJourney/);
});

test('legacy iframe uses a fixed local source path', () => {
  const wrapper = readFileSync('src/components/journey/LegacyJourney.tsx', 'utf8');
  assert.match(wrapper, /src="\/legacy\/index\.html"/);
});

test('approved location IDs are retained by the importer', () => {
  const importer = readFileSync('scripts/import-v22.mjs', 'utf8');
  for (const id of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
    assert.ok(importer.includes(id));
  }
});

test('original v22 root and anchors are present after import', {skip: !hasAssets}, () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('<x-dc'));
  for (const id of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
    assert.ok(html.includes('id="' + id + '"'));
  }
});
