import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(path,'utf8');

test('storm 404 is React-owned and reuses frozen Journey mountain paths',()=>{
  const source = read('src/features/not-found/NotFoundLandscape.tsx');
  const original = read('src/features/journey/components/scenes/MountainAndCloudLayers.tsx');
  const paths = [...source.matchAll(/d="([^"]+)"/g)].map(match=>match[1]);
  assert.ok(paths.length>=5,'Expected original multi-layer ridges and light facets');
  for(const path of paths) assert.ok(original.includes('d="'+path+'"'), 'Non-canonical ridge path: '+path.slice(0,40));
  assert.doesNotMatch(source,/forest|Forest|iframe|dangerouslySetInnerHTML/);
});

test('404 navigation links are real destinations and isolated from journey controller',()=>{
  const source=read('src/features/not-found/NotFoundNavigation.tsx');
  assert.match(source,/href=\{home \+ '#book'\}/);
  assert.match(source,/href="\/uk"/);
  assert.match(source,/href="\/en"/);
  assert.match(source,/onClick=\{\(\) => setOpen\(false\)\}/);
  assert.match(source,/event.key === 'Escape'/);
  assert.match(source,/event.key !== 'Tab'/);
  assert.match(source,/inert=\{!open\}/);
  assert.doesNotMatch(source,/JourneyStore|useJourneyProgress|data-journey-action/);
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
