import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

const home = readFileSync('src/app/[locale]/page.tsx', 'utf8');

test('each locale has one landing route, not parallel source pages', () => {
  assert.equal(existsSync('src/app/[locale]/source-scene/page.tsx'), false);
  assert.equal(existsSync('src/app/[locale]/source-interactive/page.tsx'), false);
  assert.match(home, /preview === 'native'/);
});
test('canonical route mounts React while legacy and native remain comparison-only', () => {
  assert.match(home, /if \(preview === 'legacy'\)/);
  assert.match(home, /return <LegacyJourney locale=/);
  assert.match(home, /if \(preview === 'native'\)/);
  assert.match(home, /getV22SourceScene\(\)/);
  assert.match(home, /<V22SourceInteraction/);
  const canonical = home.split('\n').find(line => line.trimStart().startsWith('return <><link rel="stylesheet" href="/react-journey.css"'));
  assert.match(canonical, /<ReactJourneyPreview/);
  assert.match(canonical, /\/react-journey\.css/);
  assert.doesNotMatch(canonical, /<LegacyJourney|<V22SourceInteraction|\/legacy\/styles\.css/);
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
  const navbar = readFileSync('src/features/journey/components/JourneyNavbar.tsx', 'utf8');
  assert.doesNotMatch(navbar, /query: \{preview: "react"\}/);
  assert.match(navbar, /href=\{\x60\/uk\$\{localeDestination\}\x60\}/);
  assert.match(navbar, /href=\{\x60\/en\$\{localeDestination\}\x60\}/);
  assert.doesNotMatch(legacy, /<JourneyLocaleNav/);
});
test('preview mode never mounts both original runtime and port together', () => {
  const host = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
  assert.doesNotMatch(host, /<iframe|runtime-0\.js/);
  assert.match(host, /mountV22UI\(\)/);
  assert.match(host, /mountV22UIFixes\(\)/);
});
