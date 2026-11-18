import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const port = readFileSync('src/lib/v22-demo-booking.ts', 'utf8');
const host = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');

test('original DC demo booking handlers are exactly sent/reset state transitions', () => {
  assert.match(source, /submit:\s*\(e\)\s*=>\s*\{\s*if \(e && e.preventDefault\) e.preventDefault\(\); this.setState\(\{ sent: true \}\); \}/);
  assert.match(source, /reset:\s*\(\)\s*=>\s*this.setState\(\{ sent: false \}\)/);
  assert.match(port, /render\(true\)/);
  assert.match(port, /render\(false\)/);
  assert.match(port, /event.preventDefault\(\)/);
});
test('fallback has form and success panel; port does not claim a backend', () => {
  const marker = '<sc-if data-dc-static="" value="{{ false }}">';
  const fallback = source.slice(source.indexOf(marker), source.indexOf('</sc-if></x-dc>'));
  assert.match(fallback, /<form style=/);
  assert.match(fallback, /Заявку надіслано/);
  assert.match(port, /does not send or store personal data/);
  assert.match(host, /mountV22DemoBooking\(scene\)/);
  assert.match(host, /unmountBooking\(\)/);
  assert.match(port, /form.removeEventListener\('submit', submit\)/);
});
test('one parity route remains, production still uses original v22', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');
  assert.match(page, /LegacyJourney/);
  const parity = readFileSync('src/app/[locale]/source-interactive/page.tsx', 'utf8');
  assert.match(parity, /V22SourceInteraction/);
});
