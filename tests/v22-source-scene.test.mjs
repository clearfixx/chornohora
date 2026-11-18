import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const loader = readFileSync('src/lib/v22-source-scene.ts', 'utf8');
const page = readFileSync('src/app/[locale]/source-scene/page.tsx', 'utf8');

test('approved source has stable exact DOM extraction boundaries', () => {
  const start = source.indexOf('<div data-canvas-height="8000"');
  const end = source.indexOf('</sc-if></x-dc>', start);
  assert.ok(start >= 0 && end > start);
  const fragment = source.slice(start, end);
  assert.ok(fragment.includes('class="track"'));
  assert.ok(fragment.includes('class="stage"'));
  assert.ok(fragment.includes('class="fx hiker"'));
  assert.ok(fragment.includes('id="route-drawer"'));
  assert.ok((fragment.match(/<svg\b/g) ?? []).length > 20);
});
test('React comparison route does not replace original SVG paths or run both runtimes', () => {
  assert.match(loader, /readFileSync\(SOURCE/);
  assert.match(page, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /V22ScrollController|mountV22RouteDrawer|runtime-0/);
  assert.match(page, /\/legacy\/styles.css/);
});
