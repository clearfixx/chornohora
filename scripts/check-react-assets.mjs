#!/usr/bin/env node
/**
 * React runtime gets its own approved artwork/fonts, not URLs under the old
 * legacy runtime. This check leaves all v22 source assets untouched.
 */
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {scanReactImports} from './check-react-ownership.mjs';
import {resolve} from 'node:path';
const root = resolve(import.meta.dirname, '..');
const filenames = [
  'chornohora-mark.png',
  'font-3.woff2','font-4.woff2','font-5.woff2','font-6.woff2',
  'instagram-1.svg','instagram-2.svg','instagram-3.svg',
  'instagram-4.svg','instagram-5.svg','instagram-6.svg',
];
// The new brand SVG is deliberately user-supplied, not a legacy byte-copy.
const authoredAssets = ['chornohora-mark.svg'];
const reactSources = scanReactImports().files;
const codeFiles = [...reactSources, 'public/react-journey.css'];
const problems = [];
const copied = readdirSync(resolve(root,'public/journey/assets')).sort();
if (copied.join(',') !== [...filenames, ...authoredAssets].sort().join(',')) {
  problems.push('React media directory contains unexpected assets or legacy scripts: ' + copied.join(', '));
}
for (const filename of filenames) {
  const original = resolve(root, 'public/legacy/assets', filename);
  const destination = resolve(root, 'public/journey/assets', filename);
  if (!existsSync(original) || !existsSync(destination)) {
    problems.push('Required artwork/font missing: '+filename);
    continue;
  }
  if (!readFileSync(original).equals(readFileSync(destination))) {
    problems.push('React asset differs from approved source: '+filename);
  }
}
for (const filename of authoredAssets) {
  if (!existsSync(resolve(root, 'public/journey/assets', filename))) {
    problems.push('Required new brand asset missing: ' + filename);
  }
}
for (const file of codeFiles) {
  const content = readFileSync(resolve(root,file),'utf8');
  if (content.includes('/legacy/assets/')) problems.push('React still references legacy assets: '+file);
}
for (const file of codeFiles) {
  const content = readFileSync(resolve(root,file),'utf8');
  for (const match of content.matchAll(/\/journey\/assets\/([a-zA-Z0-9_.-]+)/g)) {
    const name = match[1];
    if (![...filenames, ...authoredAssets].includes(name)) problems.push('Unexpected React asset: '+name+' in '+file);
    else if (!existsSync(resolve(root,'public/journey/assets',name))) problems.push('Missing referenced asset: '+name);
  }
}
if (problems.length) {
  console.error('React asset isolation failed:\n'+problems.map(x=>' - '+x).join('\n'));
  process.exitCode = 1;
} else {
  console.log('React asset isolation passed: '+filenames.length+' byte-identical legacy assets plus '+authoredAssets.length+' custom brand asset, '+reactSources.length+' React source modules scanned, no legacy runtime asset URLs.');
}
