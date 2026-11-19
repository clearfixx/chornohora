import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source = readFileSync('public/legacy/index.html', 'utf8');
const jsx = readFileSync('src/components/journey/NativeV22Markup.tsx', 'utf8');
const marker = '<sc-if data-dc-static="" value="{{ false }}">';
const fallback = source.slice(source.indexOf(marker), source.indexOf('</sc-if></x-dc>', source.indexOf(marker)));
const geometry = fallback.slice(fallback.indexOf('<div data-canvas-height="8000"'));

test('native stage exists as JSX without injected HTML or legacy runtime', () => {
  assert.match(jsx, /function NativeV22StageMarkup/);
  assert.match(jsx, /function NativeV22DrawerMarkup/);
  assert.doesNotMatch(jsx, /dangerouslySetInnerHTML|\.innerHTML|<iframe|<x-dc/);
});

test('all approved path geometry and circle coordinates are preserved verbatim', () => {
  const paths = [...geometry.matchAll(/<path[^>]* d="([^"]+)"/g)].map(m => m[1]);
  const circles = [...geometry.matchAll(/<circle\s+cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].map(m => m.slice(1).join(','));
  assert.ok(paths.length > 15);
  assert.ok(circles.length > 50);
  for (const path of paths) assert.ok(jsx.includes('d="' + path + '"'), 'path geometry missing');
  for (const [cx,cy,r] of [...geometry.matchAll(/<circle\s+cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].map(m=>m.slice(1))) {
    assert.ok(jsx.includes('cx="' + cx + '" cy="' + cy + '" r="' + r + '"'), 'star geometry missing');
  }
});

test('native markup retains original scene and navigation landmarks', () => {
  for (const token of ['govla','brebeneskul','nesamovyte','petros','data-route-target','data-journey-action','route-drawer','data-canvas-height']) {
    assert.ok(jsx.includes(token), 'missing ' + token);
  }
});
