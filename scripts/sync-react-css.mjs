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
// Motion path coordinates are unchanged. Moving the orb by left/top causes
// repeated layout during the scroll timeline; translate can be composited.
// Its original base is left:62%, top:600px in the full-viewport stage.
const legacyOrbKeyframes = `@keyframes orb{
  0%{left:62%;top:600px;scale:1}
  16%{left:60%;top:380px;scale:1.1}
  28%{left:56%;top:300px;scale:1}
  36%{left:64%;top:90px;scale:.9}
  49%{left:68%;top:120px;scale:.9}
  57%{left:66%;top:400px;scale:1.3}
  70%{left:64%;top:500px;scale:1.5}
  78%{left:62%;top:700px;scale:1.2}
  88%{left:66%;top:100px;scale:1}
  98%,100%{left:62%;top:520px;scale:1.1}
}`.replace(/^  /gm, '');
const compositedOrbKeyframes = `@keyframes orb{
  0%{translate:0 0;scale:1}
  16%{translate:-2vw -220px;scale:1.1}
  28%{translate:-6vw -300px;scale:1}
  36%{translate:2vw -510px;scale:.9}
  49%{translate:6vw -480px;scale:.9}
  57%{translate:4vw -200px;scale:1.3}
  70%{translate:2vw -100px;scale:1.5}
  78%{translate:0 100px;scale:1.2}
  88%{translate:4vw -500px;scale:1}
  98%,100%{translate:0 -80px;scale:1.1}
}`.replace(/^  /gm, '');
if (!referenceCss.includes(legacyOrbKeyframes)) {
  throw new Error('Expected v22 orb keyframes changed; review the React-only optimization.');
}
const expected = referenceCss.replace(
  legacyTimelineSelector + '{animation-timeline:--cyc;',
  optimizedTimelineSelector + '{animation-timeline:--cyc;',
).replace(legacyOrbKeyframes, compositedOrbKeyframes);
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
