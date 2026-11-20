import test from 'node:test';
import assert from 'node:assert/strict';
import {easeInOutCubic, journeyDuration, wheelScrollWasInterrupted} from '../src/engine/journey-easing.ts';

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
  assert.ok(journeyDuration(200, 900) >= 1990);
  assert.ok(journeyDuration(20000, 900) <= 4000);
  assert.equal(journeyDuration(Infinity, 900), 2500);
});

test('navigation durations are about fifteen percent faster than the previous policy', () => {
  const oldDuration = distance => Math.min(4600, Math.max(2300, 1800 + (distance / 900) * 780));
  for (const distance of [100, 1000, 2200, 6000, 15000]) {
    const ratio = journeyDuration(distance, 900) / oldDuration(distance);
    assert.ok(ratio > 0.86 && ratio < 0.88, `duration ratio unexpected for ${distance}: ${ratio}`);
  }
});

test('wheel easing yields to external jumps but tolerates pixel rounding', () => {
  assert.equal(wheelScrollWasInterrupted(900, null), false);
  assert.equal(wheelScrollWasInterrupted(900, 900), false);
  assert.equal(wheelScrollWasInterrupted(979, 900), false);
  assert.equal(wheelScrollWasInterrupted(981, 900), true);
  assert.equal(wheelScrollWasInterrupted(819, 900), true);
  assert.equal(wheelScrollWasInterrupted(Number.NaN, 900), false);
});
