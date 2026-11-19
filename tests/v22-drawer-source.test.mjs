import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original = readFileSync('public/legacy/assets/route-menu-v19.js', 'utf8');
const port = readFileSync('src/lib/v22-route-drawer.ts', 'utf8');
const signatures = [
  'route-drawer', 'route-menu-open', 'data-route-menu-toggle',
  'data-route-menu-close', 'data-route-target',
  'aria-expanded', 'aria-hidden', 'inert',
  'preventScroll', 'Escape', 'Tab', 'stopImmediatePropagation',
];
test('ported drawer retains original event and DOM contracts', () => {
  for (const signature of signatures) {
    assert.ok(original.includes(signature), 'source lacks ' + signature);
    assert.ok(port.includes(signature), 'port lacks ' + signature);
  }
});
test('ported drawer delegates route positions and animation to the shared controller', () => {
  const controller = readFileSync('src/lib/v22-scroll-controller.ts', 'utf8');
  assert.match(original, /\.21,\.42,\.63,\.83/);
  assert.match(controller, /govla: \[0\.21, 0\]/);
  assert.match(controller, /brebeneskul: \[0\.42, 1\]/);
  assert.match(controller, /nesamovyte: \[0\.63, 2\]/);
  assert.match(controller, /petros: \[0\.83, 3\]/);
  assert.match(port, /controller\.navigate\(route\)/);
  assert.doesNotMatch(port, /window\.scrollTo/);
});
test('ported drawer is not mounted while original script is active', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  assert.doesNotMatch(page, /mountV22RouteDrawer/);
});
