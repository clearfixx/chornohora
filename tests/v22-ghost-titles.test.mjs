import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync('public/legacy/index.html', 'utf8');

test('all four outline location titles remain in the original scene', () => {
  for (const [index, name] of ['Говерла', 'Бребенескул', 'Несамовите', 'Петрос'].entries()) {
    assert.match(html, new RegExp(`class="fx ghost g${index + 1}">${name}</div>`));
  }
});

test('ghost typography stays centered, legible and behind the mountain layers', () => {
  assert.match(html, /\.ghost\{left:50%;top:34%;z-index:3;/);
  assert.match(html, /font:800 clamp\(38px,8vw,126px\)/);
  assert.match(html, /-webkit-text-stroke:2px rgba\(255,255,255,\.42\)/);
  assert.match(html, /@keyframes ghost\{0%\{translate:-50% 0;opacity:0\}12%,88%\{translate:-50% 0;opacity:1\}100%\{translate:-50% 0;opacity:0\}\}/);
  assert.doesNotMatch(html, /@keyframes ghost\{0%\{translate:100vw/);
});

test('the four independent scene ranges remain unchanged', () => {
  for (const [index, start, end] of [[1,14,36],[2,35,57],[3,56,78],[4,77,97]]) {
    assert.ok(html.includes(`.track .g${index}{animation-range:contain ${start}% contain ${end}%}`));
  }
});
