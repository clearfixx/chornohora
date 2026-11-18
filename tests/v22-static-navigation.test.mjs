import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const html = readFileSync('public/legacy/index.html', 'utf8');
const bridge = readFileSync('src/lib/v22-static-navigation.ts', 'utf8');
const component = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
const marker = '<sc-if data-dc-static="" value="{{ false }}">';
const start = html.indexOf(marker);
const end = html.indexOf('</sc-if></x-dc>', start);
const fallback = html.slice(start, end);

test('every original static DC navigation binding is handled', () => {
  const sourceNames = [...new Set([...fallback.matchAll(/sc-camel-on-click="\{\{(\w+)\}\}"/g)].map((m) => m[1]))].sort();
  const portNames = [...bridge.matchAll(/^  (go\w+): '/gm)].map((m) => m[1]).sort();
  assert.deepEqual(portNames, sourceNames);
  assert.equal(sourceNames.length, 6);
});
test('only interactive scene mounts navigation; cleanup is explicit', () => {
  assert.match(component, /if \(interactive\)/);
  assert.match(component, /mountV22StaticNavigation\(scene, scroll\)/);
  assert.match(component, /unmountNavigation\(\)/);
  assert.match(bridge, /scene.removeEventListener\('click', onClick\)/);
});
