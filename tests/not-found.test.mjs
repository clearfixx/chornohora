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

test('404 scenery preserves the hero starting crop and its forest placement', () => {
  const source = read('src/features/not-found/not-found.css');
  assert.match(source, /\.nf-landscape-stage \{[\s\S]*?left:0;[\s\S]*?bottom:0;[\s\S]*?transform:none;/);
  assert.match(source, /\.nf-landscape \.tr \{left:0;bottom:88px!important;transform:none;/);
  assert.match(source, /\.nf-landscape \.forest-foreground \{bottom:88px!important;/);
  assert.doesNotMatch(source, /\.nf-ridge/);
});

test('404 rain follows original three-layer perspective, including loop speeds', () => {
  const css = read('src/features/not-found/not-found.css');
  const scene = read('src/features/not-found/NotFoundScene.tsx');
  for (const layer of ['back', 'mid', 'front']) {
    assert.ok(scene.includes('nf-rain nf-rain-' + layer));
    assert.ok(css.includes('.nf-rain-' + layer));
  }
  for (const [depth, width, height, speed, stroke] of [
    ['back', 100, 250, '.9s', 'stroke-width%3D%221%22'],
    ['mid', 140, 350, '.7s', 'stroke-width%3D%221.5%22'],
    ['front', 200, 500, '.55s', 'stroke-width%3D%222.2%22'],
  ]) {
    assert.ok(css.includes('background-size:' + width + 'px ' + height + 'px'), depth);
    assert.ok(css.includes('animation:nf-rain-' + depth + ' ' + speed), depth);
    assert.ok(css.includes(stroke), 'SVG stroke for ' + depth);
    assert.ok(css.includes('@keyframes nf-rain-' + depth), depth);
  }
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /mask-image: repeating-linear-gradient/);
});

test('404 mountains and forest use cold storm colors, not purple', () => {
  const css = read('src/features/not-found/not-found.css');
  for (const color of ['#52677b', '#354b60', '#17293a', '#0b1825']) {
    assert.ok(css.includes(color), 'missing storm tone ' + color);
  }
  for (const purple of ['#6b5188', '#42345f', '#251947', '#0a0521']) {
    assert.ok(!css.includes(purple), 'outdated purple tone ' + purple);
  }
});
