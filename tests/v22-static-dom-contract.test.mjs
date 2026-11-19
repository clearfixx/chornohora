import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const startMarker = '<sc-if data-dc-static="" value="{{ false }}">';
const start = source.indexOf(startMarker);
const end = source.indexOf('</sc-if></x-dc>', start);
const fallback = source.slice(start + startMarker.length, end);
const loader = readFileSync('src/lib/v22-source-scene.ts', 'utf8');
const component = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
const booking = readFileSync('src/lib/v22-demo-booking.ts', 'utf8');

test('static v22 fallback is a distinct DOM contract from dynamic DC template', () => {
  assert.ok(start > 0 && end > start);
  assert.ok(fallback.includes('class="track"'));
  assert.ok(fallback.includes('class="stage"'));
  assert.ok(fallback.includes('class="fx hiker"'));
  assert.ok(fallback.includes('route-ui-v6'));
  assert.equal((fallback.match(/<sc-if\b/g) || []).length, 0);
  assert.ok(loader.includes('fallback.slice(sceneStart)'));
});
test('demo booking targets real static siblings, not dynamic sc-if nodes', () => {
  const book = fallback.slice(fallback.indexOf('id="book"'));
  assert.ok(book.includes('<form'));
  assert.ok(book.includes('Заявку надіслано'));
  assert.ok(book.indexOf('</form>') < book.indexOf('Заявку надіслано'));
  assert.ok(booking.includes('form.nextElementSibling'));
  assert.ok(!booking.includes("form.closest('sc-if')"));
});
test('all original static navigation bindings are handled', () => {
  const bridge = readFileSync('src/lib/v22-static-navigation.ts', 'utf8');
  const names = [...new Set([...fallback.matchAll(/sc-camel-on-click="\{\{(\w+)\}\}"/g)].map(m => m[1]))];
  assert.equal(names.length, 6);
  for (const name of names) assert.ok(bridge.includes(name + ':'), 'missing handler: ' + name);
});
test('ported scene does not mount the DC runtime twice', () => {
  assert.ok(!component.includes('runtime-0.js'));
  assert.ok(!component.includes('ui-v8.js'));
  assert.ok(component.includes('mountV22UI()'));
  assert.ok(component.includes('mountV22UIFixes()'));
  assert.ok(component.includes('mountV22DemoBooking(scene)'));
});
