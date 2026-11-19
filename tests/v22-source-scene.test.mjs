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
  assert.equal(standalone, (original+'\n'+scene).replaceAll('/legacy/assets/', '/journey/assets/'),
    'React CSS must retain both former stylesheet contents exactly and in order');
  const reactBranch = page.split("if (preview === 'react')")[1]?.split("if (preview === 'native')")[0] ?? '';
  assert.match(reactBranch, /href="\/react-journey\.css"/);
  assert.doesNotMatch(reactBranch, /href="\/legacy\/styles\.css"|href="\/v22-react-scene\.css"|getV22SourceScene/);
  assert.doesNotMatch(standalone, /\/legacy\/assets\//);
});
