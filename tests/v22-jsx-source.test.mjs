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
  // Landscape geometry is deliberately replaced by the new uploaded reference.
  // The rest of the approved SVG icons and details must remain unchanged.
  const replacedMountainPaths = new Set(["M0,520 L0,116 L201,211 L439,115 L561,209 L762,120 L944,220 L1117,108 L1329,196 L1466,130 L1635,203 L1833,138 L2032,210 L2205,99 L2436,217 L2594,111 L2741,192 L2962,91 L3117,195 L3338,126 L3532,210 L3768,137 L4006,219 L4173,144 L4200,190 L4200,520 Z",
"M0,520 L0,225 L117,287 L251,190 L394,302 L574,236 L676,284 L788,211 L897,298 L1014,208 L1198,302 L1381,232 L1550,294 L1641,235 L1806,295 L1917,223 L2105,284 L2230,235 L2355,290 L2461,220 L2596,284 L2686,215 L2783,306 L2947,235 L3051,298 L3173,194 L3287,294 L3457,213 L3655,294 L3768,223 L3909,304 L4062,206 L4200,280 L4200,520 Z",
"M0,520 L0,291 L132,360 L247,288 L343,377 L492,282 L595,383 L687,288 L843,378 L970,318 L1048,368 L1202,314 L1345,376 L1470,297 L1624,379 L1736,294 L1893,380 L1999,285 L2154,375 L2281,318 L2392,367 L2514,287 L2599,386 L2758,284 L2889,385 L2997,311 L3076,370 L3153,296 L3273,368 L3385,289 L3530,384 L3675,290 L3828,388 L3904,299 L4047,388 L4200,360 L4200,520 Z",
"M0,520 L0,413 L57,462 L158,402 L250,453 L348,393 L420,445 L548,390 L665,445 L748,397 L839,456 L929,407 L1054,447 L1132,385 L1215,466 L1300,398 L1371,449 L1456,407 L1535,445 L1651,405 L1747,453 L1800,398 L1873,460 L1994,387 L2083,455 L2193,403 L2302,450 L2405,392 L2482,446 L2600,411 L2667,449 L2785,407 L2837,450 L2965,386 L3031,462 L3131,410 L3231,460 L3352,413 L3472,458 L3562,413 L3625,460 L3719,416 L3785,464 L3850,409 L3953,463 L4065,411 L4178,452 L4200,445 L4200,520 Z"]); 
  for (const path of paths.filter(path => path !== 'm6 9 6 6 6-6' && !replacedMountainPaths.has(path))) {
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
test('replacement mountain geometry and location headings are present', () => {
  const mountain=readFileSync('src/features/journey/components/scenes/MountainAndCloudLayers.tsx','utf8');
  for (const signature of ['M0,560 L0,178 L189,260','M0,800 L0,160 L153,615','M0,440 L0,207 L161,313']) assert.ok(mountain.includes(signature));
  assert.doesNotMatch(mountain,/className="ly l4"/);
  const content=readFileSync('src/features/journey/components/JourneyLocationContent.tsx','utf8');
  for (const subtitle of ["Сонце зустрічає вас першим","Озеро, що тримає небо","Вечір, який горить на воді","Ніч, повна зірок"]) assert.ok(content.includes(subtitle));
  assert.ok(content.includes('Ранок знову'));
});

test('four reference SVG previews, three-icon facts and night-only meteor component are present', () => {
  const preview=readFileSync('src/features/journey/components/LocationPreview.tsx','utf8');
  const metrics=readFileSync('src/features/journey/data/locations.ts','utf8');
  const meteors=readFileSync('src/features/journey/components/scenes/PetrosMeteors.tsx','utf8');
  for(const path of ['M0 130V98Q30 70 70 88T143 80V130Z',
    'M0 84 L40 38 L70 68 L100 30 L143 80 V130 H0 Z',
    'M0 88 L30 64 L60 84 L95 58 L143 88 V130 H0 Z',
    'M0 130 V102 L46 58 L62 78 L82 50 L143 106 V130 Z']) assert.ok(preview.includes(path));
  for(const text of ['≈ 25 млн років','найвисокогірніше озеро','льодовикове озеро','ніч під зорями'])
    assert.ok(metrics.includes(text));
  assert.match(meteors,/progress >= .76 && progress < .94/);
});
