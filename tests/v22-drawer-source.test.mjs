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
  'getBoundingClientRect', 'requestAnimationFrame',
];
test('ported drawer retains original event and DOM contracts', () => {
  for (const signature of signatures) {
    assert.ok(original.includes(signature), 'source lacks ' + signature);
    assert.ok(port.includes(signature), 'port lacks ' + signature);
  }
});
test('ported drawer retains exact route positions and transition delay', () => {
  assert.match(original, /\.21,\.42,\.63,\.83/);
  assert.match(port, /\.21, \.42, \.63, \.83/);
  assert.ok(original.includes('), 80)'));
  assert.match(port, /\}, 80\)/);
});
test('ported drawer is not mounted while original script is active', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  assert.doesNotMatch(page, /mountV22RouteDrawer/);
});
