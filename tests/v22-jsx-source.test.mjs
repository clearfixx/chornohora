import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const structureFiles = [
  'src/features/journey/components/JourneyStage.tsx',
  'src/features/journey/components/JourneyNavbar.tsx',
  'src/features/journey/components/JourneyScenery.tsx',
  'src/features/journey/components/scenes/SkyAtmosphere.tsx',
  'src/features/journey/components/scenes/MountainAndCloudLayers.tsx',
  'src/features/journey/components/scenes/ForestLayers.tsx',
  'src/features/journey/components/JourneyHero.tsx',
  'src/features/journey/components/JourneyLocationContent.tsx',
  'src/features/journey/components/BookingSection.tsx',
  'src/features/journey/components/JourneyFooter.tsx',
  'src/features/journey/components/JourneyDrawer.tsx',
];
const jsx = structureFiles.map(path => readFileSync(path, 'utf8')).join('\n');
const motion = readFileSync('src/components/journey/ReactJourneyMotion.tsx', 'utf8');
const allJsx = jsx + '\n' + motion;
const marker = '<sc-if data-dc-static="" value="{{ false }}">';
const fallback = source.slice(source.indexOf(marker), source.indexOf('</sc-if></x-dc>', source.indexOf(marker)));
const geometry = fallback.slice(fallback.indexOf('<div data-canvas-height="8000"'));

test('native stage exists as JSX without injected HTML or legacy runtime', () => {
  assert.match(jsx, /function JourneyStage/);
  assert.match(jsx, /function JourneyDrawer/);
  assert.doesNotMatch(jsx, /dangerouslySetInnerHTML|\.innerHTML|<iframe|<x-dc/);
});

test('all approved path geometry and circle coordinates are preserved verbatim', () => {
  const paths = [...geometry.matchAll(/<path[^>]* d="([^"]+)"/g)].map(m => m[1]);
  const circles = [...geometry.matchAll(/<circle\s+cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].map(m => m.slice(1).join(','));
  assert.ok(paths.length > 15);
  assert.ok(circles.length > 50);
  // The decorative language chevron is intentionally replaced with real UA/EN links.
  // All landscape and other SVG paths must remain unchanged.
  for (const path of paths.filter(path => path !== 'm6 9 6 6 6-6')) {
    assert.ok(allJsx.includes('d="' + path + '"'), 'path geometry missing');
  }
  for (const [cx,cy,r] of [...geometry.matchAll(/<circle\s+cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].map(m=>m.slice(1))) {
    assert.ok(allJsx.includes('cx="' + cx + '" cy="' + cy + '" r="' + r + '"'), 'star geometry missing');
  }
});

test('native markup retains original scene and navigation landmarks', () => {
  for (const token of ['govla','brebeneskul','nesamovyte','petros','data-route-target','data-journey-action','route-drawer','data-canvas-height']) {
    assert.ok(jsx.includes(token), 'missing ' + token);
  }
});

test('React traveler and four-stop progress panel subscribe independently to the same journey store', () => {
  assert.match(jsx, /<ReactRouteIndicator store=\{store\}/);
  assert.match(jsx, /<ReactHiker store=\{store\}/);
  assert.match(motion, /useSyncExternalStore\(store\.subscribe, store\.getSnapshot, store\.getServerSnapshot\)/);
  assert.match(motion, /getRouteFill\(progress, centers\)/);
  assert.match(motion, /className=\{stopClass\(progress, activeIndex/);
  assert.match(motion, /--hiker-x/);
});


test('React components use Next Image with fixed dimensions and no plain images', () => {
  assert.doesNotMatch(jsx, /<img\b/);
  assert.equal([...jsx.matchAll(/<Image\b/g)].length, 9);
  for (const name of ['JourneyNavbar', 'JourneyFooter', 'JourneyDrawer']) {
    assert.match(readFileSync('src/features/journey/components/' + name + '.tsx','utf8'), /from 'next\/image'/);
  }
});

test('the imported JSX monolith is split into cohesive scene and page components', () => {
  for (const path of structureFiles) assert.ok(readFileSync(path, 'utf8').includes('export function'), path);
  assert.ok(readFileSync(structureFiles[0], 'utf8').length < 6000,
    'stage should coordinate components, not embed the entire legacy scene');
});