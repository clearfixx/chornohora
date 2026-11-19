import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

const home = readFileSync('src/app/[locale]/page.tsx', 'utf8');

test('each locale has one landing route, not parallel source pages', () => {
  assert.equal(existsSync('src/app/[locale]/source-scene/page.tsx'), false);
  assert.equal(existsSync('src/app/[locale]/source-interactive/page.tsx'), false);
  assert.match(home, /preview === 'native'/);
});
test('default canonical landing preserves the approved original', () => {
  assert.match(home, /return <LegacyJourney locale=/);
  assert.match(home, /if \(preview === 'native'\)/);
  assert.match(home, /getV22SourceScene\(\)/);
  assert.match(home, /<V22SourceInteraction/);
});
test('original and native mode use only the navbar language control', () => {
  const nav = readFileSync('src/lib/v22-language-nav.ts', 'utf8');
  const legacy = readFileSync('src/components/journey/LegacyJourney.tsx', 'utf8');
  const native = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
  assert.match(nav, /\.nav \.nav-language/);
  assert.match(nav, /\?preview=native/);
  assert.match(legacy, /mountV22LanguageNav/);
  assert.match(native, /mountV22LanguageNav/);
  assert.doesNotMatch(home, /<JourneyLocaleNav/);
  assert.doesNotMatch(legacy, /<JourneyLocaleNav/);
});
test('preview mode never mounts both original runtime and port together', () => {
  const host = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
  assert.doesNotMatch(host, /<iframe|runtime-0\.js/);
  assert.match(host, /mountV22UI\(\)/);
  assert.match(host, /mountV22UIFixes\(\)/);
});
