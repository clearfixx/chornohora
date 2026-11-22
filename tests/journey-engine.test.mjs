import assert from 'node:assert/strict';
import test from 'node:test';
import {JourneyStore} from '../src/engine/journey-store.ts';

test('one snapshot drives all four approved scene thresholds', () => {
  const store = new JourneyStore();
  for (const [progress, id] of [[0, null], [0.21, 'govla'], [0.42, 'brebeneskul'], [0.63, 'nesamovyte'], [0.83, 'petros']]) {
    store.setProgress(progress);
    assert.equal(store.getSnapshot().activeStop?.id ?? null, id);
  }
});

test('store notifies only on changes and provides stable snapshots', () => {
  const store = new JourneyStore();
  const first = store.getSnapshot();
  let calls = 0;
  const stop = store.subscribe(() => { calls++; });
  store.setProgress(0);
  store.setProgress(Number.NaN);
  assert.equal(store.getSnapshot(), first);
  assert.equal(calls, 0);
  store.setProgress(0.42);
  assert.equal(calls, 1);
  assert.equal(store.getSnapshot().activeIndex, 1);
  store.setProgress(0.42);
  assert.equal(calls, 1);
  stop();
  store.setProgress(0.63);
  assert.equal(calls, 1);
});

test('navigation state is independent of scene progress', () => {
  const store = new JourneyStore();
  store.setProgress(0.5);
  store.setNavigation('petros');
  assert.equal(store.getSnapshot().isNavigating, true);
  assert.equal(store.getSnapshot().targetStop, 'petros');
  assert.equal(store.getSnapshot().activeStop.id, 'brebeneskul');
  store.setNavigation(null);
  assert.equal(store.getSnapshot().isNavigating, false);
  assert.equal(store.getSnapshot().progress, 0.5);
});

test('out-of-range progress and invalid numbers fail closed', () => {
  const store = new JourneyStore();
  store.setProgress(2);
  assert.equal(store.getSnapshot().progress, 1);
  store.setProgress(-4);
  assert.equal(store.getSnapshot().progress, 0);
  store.setProgress(Infinity);
  assert.equal(store.getSnapshot().progress, 0);
});
