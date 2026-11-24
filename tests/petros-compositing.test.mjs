import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Petros aurora compositor hint targets actually animated properties', () => {
  const css = readFileSync('public/react-journey.css', 'utf8');
  assert.match(css, /\.stage\s+\.aur\s*\{\s*will-change:\s*opacity,\s*translate;\s*\}/);
  assert.match(css, /@keyframes aur\s*\{/);
  // The approved timeline is not changed by the compositor experiment.
  assert.match(css, /84%,90%\s*\{\s*opacity:\s*\.7\s*\}/);
});
