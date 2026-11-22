import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidFutureOrTodayDate, localISODate} from '../src/features/journey/booking/validation.ts';
test('local calendar day is valid, past date rejected', () => {
  const clock = new Date(2026,10,19,23,55,0);
  assert.equal(localISODate(clock), '2026-11-19');
  assert.equal(isValidFutureOrTodayDate('2026-11-19',clock), true);
  assert.equal(isValidFutureOrTodayDate('2026-11-20',clock), true);
  assert.equal(isValidFutureOrTodayDate('2026-11-18',clock), false);
});
test('invalid calendar dates rejected', () => {
  const clock = new Date(2026,0,1);
  for(const date of ['', '2026-02-30','2026-13-01','2026-00-05','2026-1-2','2027-02-29']) {
    assert.equal(isValidFutureOrTodayDate(date,clock), false, date);
  }
  assert.equal(isValidFutureOrTodayDate('2028-02-29',clock), true);
});
