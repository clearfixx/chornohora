import test from 'node:test';
import assert from 'node:assert/strict';
import {easeInOutCubic, journeyDuration} from '../src/engine/journey-easing.ts';

test('navigation easing is smooth, monotonic and endpoint-exact', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeInOutCubic(.5), .5);
  assert.equal(easeInOutCubic(-1), 0);
  assert.equal(easeInOutCubic(2), 1);
  const samples = Array.from({length: 101}, (_, n) => easeInOutCubic(n / 100));
  for (let i = 1; i < samples.length; i++) assert.ok(samples[i] >= samples[i - 1]);
  assert.ok(easeInOutCubic(.1) < .1, 'slow initial acceleration');
  assert.ok(easeInOutCubic(.9) > .9, 'slow finish');
});

test('large jumps are slower but bounded; small jumps still animated', () => {
  assert.ok(journeyDuration(2000, 900) > journeyDuration(200, 900));
  assert.ok(journeyDuration(200, 900) >= 1100);
  assert.ok(journeyDuration(20000, 900) <= 2400);
  assert.equal(journeyDuration(Infinity, 900), 1500);
});
