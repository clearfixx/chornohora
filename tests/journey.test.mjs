import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ROUTE_STOPS, clampProgress, getJourneyState,
  getStopProgress, getStopScrollTop,
} from '../src/lib/journey.ts';

test('approved v22 location timing is preserved', () => {
  assert.deepEqual(ROUTE_STOPS.map(({id, progress}) => [id, progress]), [
    ['govla', 0.21],
    ['brebeneskul', 0.42],
    ['nesamovyte', 0.63],
    ['petros', 0.83],
  ]);
});

test('timeline clamps invalid and out-of-range inputs', () => {
  for (const value of [NaN, Infinity, -Infinity, -1]) {
    assert.equal(clampProgress(value), 0);
  }
  assert.equal(clampProgress(2), 1);
  assert.equal(clampProgress(0.5), 0.5);
});

test('scene switches exactly at approved anchors', () => {
  assert.equal(getJourneyState(0).activeStop, null);
  assert.equal(getJourneyState(0.2099).activeStop, null);
  for (const [index, stop] of ROUTE_STOPS.entries()) {
    assert.equal(getJourneyState(stop.progress).activeIndex, index);
    assert.equal(getJourneyState(stop.progress).activeStop?.id, stop.id);
  }
  assert.equal(getJourneyState(1).activeStop?.id, 'petros');
});

test('scroll targets include track document offset', () => {
  assert.equal(getStopScrollTop(1000, 9000, 1000, 'govla'), 2680);
  assert.equal(getStopScrollTop(1000, 9000, 1000, 'petros'), 7640);
  assert.equal(getStopScrollTop(1000, 600, 1000, 'petros'), 1000);
  assert.equal(getStopProgress('nesamovyte'), 0.63);
});

test('invalid stop IDs fail closed', () => {
  assert.throws(() => getStopProgress('missing'), /Unknown journey stop/);
});
