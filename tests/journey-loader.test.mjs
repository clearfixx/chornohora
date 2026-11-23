import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(path,'utf8');

test('SSR-visible loader disappears only when JourneyController reports ready', () => {
  const preview=read('src/components/journey/ReactJourneyPreview.tsx');
  const loader=read('src/features/journey/components/JourneyLoader.tsx');
  const controller=read('src/hooks/useJourneyProgress.ts');
  assert.match(preview, /<JourneyLoader ready=\{ready\} locale=\{locale\}/);
  assert.match(controller, /ready: controller !== null/);
  assert.match(loader, /data-journey-loader=\{ready \? 'complete' : 'pending'\}/);
  assert.match(loader, /aria-hidden=\{ready\}/);
  assert.match(loader, /journey\/assets\/chornohora-mark\.svg/);
  assert.doesNotMatch(loader, /setTimeout|setInterval|window\.scrollTo|requestAnimationFrame|\d+%/);
});

test('loader has responsive styles and reduced-motion behavior', () => {
  const css=read('src/app/globals.css');
  assert.match(css, /\.journey-loader \{/);
  assert.match(css, /\.journey-loader--ready \{/);
  assert.match(css, /\.journey-loader__trace \{/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.journey-loader--ready \{[^}]*pointer-events:none/);
});
