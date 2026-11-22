#!/usr/bin/env node
/**
 * Extract inline SVGs byte-for-byte from approved v22.
 * This is asset migration, NOT a replacement for DCLogic.
 * Do not edit public/legacy or normalize any SVG markup.
 */
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const sourcePath = 'public/legacy/index.html';
const destination = 'public/derived-v22/svg';
const html = readFileSync(sourcePath, 'utf8');
const svgMatches = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)];
if (svgMatches.length !== 39) {
  throw new Error('Expected 39 SVG blocks in approved v22, got ' + svgMatches.length);
}
const hash = (text) => createHash('sha256').update(text).digest('hex');
const unique = new Map();
const entries = svgMatches.map((match, index) => {
  const svg = match[0];
  const digest = hash(svg);
  if (!unique.has(digest)) unique.set(digest, svg);
  return {sourceIndex: index + 1, sha256: digest, file: 'svg-' + digest.slice(0, 16) + '.svg'};
});
rmSync(destination, {recursive: true, force: true});
mkdirSync(destination, {recursive: true});
for (const [digest, svg] of unique) {
  writeFileSync(join(destination, 'svg-' + digest.slice(0, 16) + '.svg'), svg);
}
const manifest = {
  source: sourcePath,
  sourceSha256: hash(html),
  extraction: 'Exact original SVG text, no DOM or JSX normalization',
  totalOccurrences: entries.length,
  uniqueAssets: unique.size,
  entries,
};
writeFileSync(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
for (const entry of entries) {
  const file = readFileSync(join(destination, entry.file), 'utf8');
  if (hash(file) !== entry.sha256) throw new Error('SVG mismatch: ' + entry.file);
}
console.log('Extracted ' + unique.size + ' unique SVG assets from ' + entries.length + ' original occurrences');
