#!/usr/bin/env node
/**
 * Reproducible, intentionally boring React stylesheet extraction.
 *
 * The two reference sources stay immutable. This builds a separate copy for
 * the checked-in React preview, preserving the full CSS cascade.
 */
import {readFileSync, writeFileSync} from 'node:fs';

const sources = ['public/legacy/styles.css', 'public/v22-react-scene.css'];
const destination = 'public/react-journey.css';
const normalize = value => value.replace(/\r\n?/g, '\n');
// The standalone React build owns its static URLs; the historical extract
// and frozen legacy styles remain unchanged for reference comparison.
const legacyTimelineSelector = '.stage,.stage *,.nav .ul';
// Only elements with actual scroll-driven animation names/ranges need a
// timeline. Applying it to every SVG path in the landscape is expensive.
// Keep this transformation React-only: frozen source CSS remains untouched.
const animatedSceneClasses = [
  'l1', 'l2', 'l3', 'l4', 'tr', 'cl', 'birds', 'orb', 'rays',
  'stars', 'aur', 'ghost', 'herottl', 'herosub', 'mouse',
  'show', 'nmi', 'final', 'hiker', 'fill',
  'd1', 'd2', 'd3', 'd4', 'alt', 'ul',
  'r1', 'r2', 'r3', 'r4', 'n1', 'n2', 'n3', 'n4',
  'k1', 'k2', 'k3', 'k4', 'g1', 'g2', 'g3', 'g4', 'fl', 'fn',
];
const optimizedTimelineSelector = '.stage,.stage :is(' +
  animatedSceneClasses.map(name => '.' + name).join(',') + '),.nav .ul';
const referenceCss = sources.map(source => normalize(readFileSync(source, 'utf8')))
  .join('\n').replaceAll('/legacy/assets/', '/journey/assets/');
if (!referenceCss.includes(legacyTimelineSelector + '{animation-timeline:--cyc;')) {
  throw new Error('Expected v22 timeline selector changed; review the React-only optimization.');
}
const expected = referenceCss.replace(
  legacyTimelineSelector + '{animation-timeline:--cyc;',
  optimizedTimelineSelector + '{animation-timeline:--cyc;',
);
const check = process.argv.includes('--check');
let current = '';
try {current = normalize(readFileSync(destination, 'utf8'));} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (check) {
  if (current !== expected) {
    console.error('React CSS is out of sync. Run pnpm sync:react-css, review the diff and commit it.');
    process.exitCode = 1;
  } else {
    console.log('React CSS verified: frozen styles and extracted scene rules match exactly.');
  }
} else if (current === expected) {
  console.log('React CSS already matches both sources.');
} else {
  writeFileSync(destination, expected, 'utf8');
  console.log('Updated ' + destination + ' (review before committing).');
}
