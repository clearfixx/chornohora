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
const expected = sources.map(source => normalize(readFileSync(source, 'utf8')))
  .join('\n').replaceAll('/legacy/assets/', '/journey/assets/');
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
