#!/usr/bin/env node
/**
 * Extract a read-only migration inventory from the approved v22 source.
 * Never rewrite or normalize the original HTML, CSS, JS, or SVG assets.
 */
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const root = 'public/legacy';
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'styles.css'), 'utf8');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const controller = scripts.find((match) => /type=["']text\/x-dc["']/.test(match[1]));
if (!controller) throw new Error('Approved v22 DCLogic controller not found');
if (!controller[2].includes('class Component extends DCLogic')) {
  throw new Error('Unexpected v22 controller signature');
}
const rootOpen = html.indexOf('<x-dc>');
const rootClose = html.indexOf('</x-dc>');
if (rootOpen < 0 || rootClose < rootOpen) throw new Error('Approved x-dc root not found');
const scene = html.slice(rootOpen, rootClose + '</x-dc>'.length);
const required = ['.track', '.stage', 'forest-foreground', 'fx hiker'];
for (const token of required) {
  if (!html.includes(token) && !css.includes(token)) {
    throw new Error('Expected source token missing: ' + token);
  }
}
const report = {
  source: 'public/legacy/index.html',
  note: 'Read-only inventory. Not a native React migration or proof of browser parity.',
  sourceSha256: sha256(html),
  cssSha256: sha256(css),
  dcRoot: {bytes: Buffer.byteLength(scene), sha256: sha256(scene)},
  controller: {bytes: Buffer.byteLength(controller[2]), sha256: sha256(controller[2])},
  scriptSources: [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]),
  routeAnchors: ['govla', 'brebeneskul', 'nesamovyte', 'petros'],
  scrollTargets: [0.21, 0.42, 0.63, 0.83],
  implementationDependencies: [
    'x-dc custom root and DCLogic class',
    'runtime-0.js plus runtime-1.js and runtime-2.js',
    'original CSS scroll-timeline and SVG geometry',
    'ui-v8.js and ui-fixes-v11.js',
    'route-menu-v19.js',
  ],
};
for (const id of report.routeAnchors) {
  if (!html.includes('id="' + id + '"')) throw new Error('Missing anchor: ' + id);
}
for (const p of report.scrollTargets) {
  if (!controller[2].includes(String(p))) throw new Error('Missing controller stop: ' + p);
}
mkdirSync('docs/generated', {recursive: true});
writeFileSync('docs/generated/v22-source-contract.json', JSON.stringify(report, null, 2) + '\n');
console.log('Generated source contract; original v22 unchanged.');
