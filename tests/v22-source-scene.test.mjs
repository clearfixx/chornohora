import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const loader = readFileSync('src/lib/v22-source-scene.ts', 'utf8');
const page = readFileSync('src/app/[locale]/page.tsx', 'utf8');

test('extract the original static fallback, not the dynamic DC template', () => {
  const marker = '<sc-if data-dc-static="" value="{{ false }}">';
  const start = source.indexOf(marker);
  const end = source.indexOf('</sc-if></x-dc>', start);
  assert.ok(start >= 0 && end > start);
  const fragment = source.slice(start, end);
  assert.ok(fragment.includes('data-document-role="page"'));
  assert.ok(fragment.includes('class="track"'));
  assert.ok(fragment.includes('class="stage"'));
  assert.equal((fragment.match(/<svg\b/g) ?? []).length, 19);
  assert.match(loader, /staticMarker/);
  assert.match(loader, /drawerStart/);
});
test('approved default accent is resolved from original DC component props', () => {
  const props = JSON.parse(source.match(/data-props='([^']+)'/)?.[1] ?? '{}');
  assert.equal(props.accent.default, '#FFE14D');
  assert.ok(loader.includes("replaceAll('{{accent}}', accent)"));
});
test('independent original route drawer is extracted separately', () => {
  assert.ok(source.includes('<aside id="route-drawer"'));
  assert.match(page, /drawerHtml/);
});
test('React comparison route does not execute both original and ported runtimes', () => {
  assert.match(loader, /readFileSync\(SOURCE/);
  const host = readFileSync('src/components/journey/V22SourceInteraction.tsx', 'utf8');
  assert.match(page, /V22SourceInteraction/);
  assert.match(host, /scene.innerHTML = html/);
  assert.match(host, /drawer.innerHTML = drawerHtml/);
  assert.match(host, /useEffect/);
  assert.doesNotMatch(host, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /V22ScrollController|mountV22RouteDrawer|runtime-0/);
  assert.match(page, /\/legacy\/styles.css/);
});

test('React preview loads CSS externally, never injects source CSS into a style element', () => {
  assert.match(page, /href="\/react-journey\.css"/);
  assert.doesNotMatch(page, /<style>\{inlineCss\}<\/style>/);
  const helmet = source.slice(source.indexOf('<helmet>'), source.indexOf('</helmet>'));
  const originalRules = [...helmet.matchAll(/<style>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1].replace(/url\((["']?)assets\//g, 'url($1/legacy/assets/').replace(/\r\n?/g, '\n'))
    .join('\n');
  const committed = readFileSync('public/v22-react-scene.css', 'utf8').replace(/\r\n?/g, '\n');
  assert.equal(committed, originalRules, 'checked-in React stylesheet must match both original CSS blocks');
  assert.doesNotMatch(committed, /<\/style\s*>|<style\s*>/i);
});

test('React has independent checked-in CSS with exact immutable legacy rule ordering', () => {
  const original = readFileSync('public/legacy/styles.css', 'utf8').replace(/\r\n?/g,'\n');
  const scene = readFileSync('public/v22-react-scene.css', 'utf8').replace(/\r\n?/g,'\n');
  const standalone = readFileSync('public/react-journey.css','utf8').replace(/\r\n?/g,'\n');
  // The React-only performance transform intentionally scopes one timeline
  // selector away from thousands of non-animated SVG descendants. Verify that
  // reversing ONLY that selector reproduces the frozen CSS byte for byte.
  const optimizedSelectors = standalone.match(/\.stage,\.stage :is\([^\n{}]+\),\.nav \.ul(?=\{animation-timeline:--cyc;)/g) ?? [];
  assert.equal(optimizedSelectors.length, 1, 'Expected exactly one React-only timeline selector');
  const originalTimeline = '.stage,.stage *,.nav .ul';
  const originalOrb = scene.match(/@keyframes orb\{[\s\S]*?\n\}/)?.[0];
  const compositedOrb = standalone.match(/@keyframes orb\{[\s\S]*?\n\}/)?.[0];
  assert.ok(originalOrb && compositedOrb, 'Both CSS variants must retain orb keyframes');
  assert.match(compositedOrb, /translate:-6vw -300px/);
  assert.doesNotMatch(compositedOrb, /left:|top:/,
    'Composited React orbit must not animate layout geometry');
  // Reverse the two performance optimizations and the four intentional
  // React-only logo aspect-ratio overrides. The frozen source is unchanged.
  const logoRules = [
    ['.brand-mark{width:38px;height:auto;', '.brand-mark{width:38px;height:38px;'],
    ['.nav .brand-mark{width:76px!important;height:auto!important;', '.nav .brand-mark{width:76px!important;height:38px!important;'],
    ['.footer-logo img{width:72px;height:auto;', '.footer-logo img{width:72px;height:38px;'],
    ['.route-drawer-brand img{width:70px;height:auto;', '.route-drawer-brand img{width:70px;height:38px;'],
  ];
  let restored = standalone.replace(optimizedSelectors[0], originalTimeline)
    .replace(compositedOrb, originalOrb);
  for (const [optimized, frozen] of logoRules) {
    assert.ok(restored.includes(optimized), 'Missing React-only logo rule: ' + optimized);
    restored = restored.replace(optimized, frozen);
  }
  assert.equal(restored, (original+'\n'+scene).replaceAll('/legacy/assets/', '/journey/assets/'),
    'React CSS must preserve frozen rule order and content except the six explicit React-only transformations');
  const reactBranch = page.split('\n').find(line => line.trimStart().startsWith('return <><link rel="stylesheet" href="/react-journey.css"'));
  assert.match(reactBranch, /href="\/react-journey\.css"/);
  assert.doesNotMatch(reactBranch, /href="\/legacy\/styles\.css"|href="\/v22-react-scene\.css"|getV22SourceScene/);
  assert.doesNotMatch(standalone, /\/legacy\/assets\//);
});
