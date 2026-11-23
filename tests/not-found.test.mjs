import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(path,'utf8');

test('storm 404 mounts canonical mountain and spruce forest components', () => {
  const source = read('src/features/not-found/NotFoundLandscape.tsx');
  const mountains = read('src/features/journey/components/scenes/MountainAndCloudLayers.tsx');
  const forest = read('src/features/journey/components/scenes/ForestLayers.tsx');
  assert.match(source, /import \{MountainAndCloudLayers\}/);
  assert.match(source, /import \{ForestBackLayer, ForestForegroundLayer\}/);
  for (const name of ['MountainAndCloudLayers', 'ForestBackLayer', 'ForestForegroundLayer']) {
    assert.match(source, new RegExp('<' + name + '\\s*\\/?>'));
  }
  assert.match(mountains, /reference-mountain/);
  assert.match(forest, /forest-foreground/);
  assert.match(forest, /viewBox="0 0 5000 220"/);
  assert.doesNotMatch(source, /<path|<svg|iframe|dangerouslySetInnerHTML|import[^\n]*JourneyStore/);
  const css = read('src/features/not-found/not-found.css');
  assert.match(css, /\.nf-landscape-stage/);
  assert.match(css, /\.nf-landscape \.tr/);
  assert.match(css, /\.nf-landscape \.l2/);
});

test('404 navigation links are real destinations and isolated from journey controller',()=>{
  const source=read('src/features/not-found/NotFoundNavigation.tsx');
  assert.match(source,/href=\{home \+ '#book'\}/);
  assert.ok(source.includes('href={ukHome}'));
  assert.ok(source.includes('href={enHome}'));
  assert.match(source,/onClick=\{\(\) => setOpen\(false\)\}/);
  assert.match(source,/event.key === 'Escape'/);
  assert.match(source,/event.key !== 'Tab'/);
  assert.match(source,/inert=\{!open\}/);
  assert.doesNotMatch(source, /import[^\n]*(JourneyStore|useJourneyProgress)|data-journey-action/);
});

test('404 is localized and has reduced motion / mobile rules',()=>{
  const uk=JSON.parse(read('messages/uk.json'));
  const en=JSON.parse(read('messages/en.json'));
  assert.deepEqual(Object.keys(uk.NotFound).sort(),Object.keys(en.NotFound).sort());
  assert.match(uk.NotFound.heading,/збилися зі стежки/);
  assert.match(en.NotFound.heading,/lost the trail/);
  const css=read('src/features/not-found/not-found.css');
  assert.match(css,/@media \(max-width:700px\)/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.nf-drawer-layer\.is-open/);
  const route=read('src/app/[locale]/[...rest]/page.tsx');
  assert.match(route,/notFound\(\)/);
  const page=read('src/app/[locale]/not-found.tsx');
  assert.match(page,/NotFoundScene/);
  assert.match(page,/getTranslations/);
});
