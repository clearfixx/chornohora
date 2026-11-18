import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const loader = readFileSync('src/lib/v22-source-scene.ts', 'utf8');
const page = readFileSync('src/app/[locale]/source-scene/page.tsx', 'utf8');

test('extract the original static fallback, not the dynamic DC template', () => {
  const marker = '<sc-if data-dc-static="" value="{{ false }}">';
  const start = source.indexOf(marker);
  const end = source.indexOf('</sc-if></x-dc>', start);
  assert.ok(start >= 0 && end > start);
  const fragment = source.slice(start, end);
  assert.ok(fragment.includes('data-document-role="page"'));
  assert.ok(fragment.includes('class="track"'));
  assert.ok(fragment.includes('class="stage"'));
  assert.equal((fragment.match(/<svg\b/g) ?? []).length, 19);
  assert.match(loader, /staticMarker/);
  assert.match(loader, /drawerStart/);
});
test('independent original route drawer is extracted separately', () => {
  assert.ok(source.includes('<aside id="route-drawer"'));
  assert.match(page, /drawerHtml/);
});
test('React comparison route does not execute both original and ported runtimes', () => {
  assert.match(loader, /readFileSync\(SOURCE/);
  const host = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
  assert.match(page, /V22SourceInteraction/);
  assert.match(host, /scene.innerHTML = html/);
  assert.match(host, /drawer.innerHTML = drawerHtml/);
  assert.match(host, /useEffect/);
  assert.doesNotMatch(host, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /V22ScrollController|mountV22RouteDrawer|runtime-0/);
  assert.match(page, /\/legacy\/styles.css/);
});
