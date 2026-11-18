import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original = readFileSync('public/legacy/assets/ui-v8.js', 'utf8');
const port = readFileSync('src/lib/v22-ui-v8.ts', 'utf8');
const component = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');

test('original route and hiker geometry is preserved', () => {
  for (const expression of [
    '[0.21, 0.42, 0.63, 0.83]',
    'progress >= FIRST_SCENE_START - 0.0005',
    '(0.06+0.79*fraction)*viewportWidth',
    "'--hiker-x'",
    "'route-started'",
    "'.route-ui-v6'",
    "'.hiker'",
  ]) {
    assert.ok(original.includes(expression), 'missing in source: ' + expression);
    assert.ok(port.includes(expression), 'missing in port: ' + expression);
  }
});
test('UI port mounts after scene DOM and cleans up listeners', () => {
  assert.match(component, /mountV22UI\(\)/);
  assert.match(component, /unmountUI\(\)/);
  assert.match(port, /removeEventListener\('scroll',request\)/);
  assert.match(port, /removeEventListener\('resize',request\)/);
  assert.match(port, /cancelAnimationFrame\(raf\)/);
});
