import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original = readFileSync('public/legacy/index.html', 'utf8');
const port = readFileSync('src/lib/v22-scroll-controller.ts', 'utf8');
const controller = original.slice(original.indexOf('class Component extends DCLogic'));
const signatures = [
  '0.21', '0.42', '0.63', '0.83',
  '0.085', '2200', '800', '0.22',
  'deltaMode === 1', 'deltaMode === 2',
  'Math.abs(dist) < 2', 'Math.abs(diff) < 1',
  'prefers-reduced-motion: reduce',
  'overflowY', 'scrollHeight', 'clientHeight',
  'getBoundingClientRect', 'requestAnimationFrame',
];
test('ported scroll controller retains source constants and browser primitives', () => {
  for (const signature of signatures) {
    assert.ok(controller.includes(signature), 'original lacks ' + signature);
    assert.ok(port.includes(signature), 'port lacks ' + signature);
  }
});
test('ported controller stays isolated until DOM parity is verified', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  const legacy = readFileSync('src/components/journey/LegacyJourney.tsx', 'utf8');
  assert.doesNotMatch(page, /V22ScrollController/);
  assert.doesNotMatch(legacy, /V22ScrollController/);
});
