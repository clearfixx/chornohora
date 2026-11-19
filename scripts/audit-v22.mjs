#!/usr/bin/env node
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';

const root = resolve(process.argv[2] ?? 'public/legacy');
const htmlPath = join(root, 'index.html');
if (!existsSync(htmlPath)) {
  console.error('Missing approved v22 source: ' + htmlPath);
  process.exit(1);
}
const html = readFileSync(htmlPath, 'utf8');
const required = [
  'styles.css', 'assets/runtime-0.js', 'assets/runtime-1.js',
  'assets/runtime-2.js', 'assets/route-menu-v19.js',
  'assets/ui-v8.js', 'assets/ui-fixes-v11.js',
  'assets/chornohora-mark.png',
  ...Array.from({length: 6}, (_, i) => 'assets/instagram-' + (i + 1) + '.svg'),
  ...[3, 4, 5, 6].map(i => 'assets/font-' + i + '.woff2'),
];
const errors = [];
for (const name of required) {
  if (!existsSync(join(root, name))) errors.push('Missing required asset: ' + name);
}
for (const id of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
  if (!html.includes('id="' + id + '"')) errors.push('Missing route anchor: ' + id);
}
if (!html.includes('<x-dc')) errors.push('Missing original x-dc animation root');

const references = new Set();
function inspect(content, file) {
  const regex = /(?:src|href|poster)=["']([^"']+)["']|url\(\s*["']?([^)'"]+)["']?\s*\)/g;
  for (const match of content.matchAll(regex)) {
    const raw = match[1] || match[2];
    const value = raw.split(/[?#]/)[0];
    if (!value || /^(?:https?:|data:|blob:|mailto:|tel:|#|\/\/|\/)/i.test(value)) continue;
    if (value.includes('{{') || value.includes('${')) continue;
    const target = resolve(dirname(file), decodeURIComponent(value));
    const rel = relative(root, target);
    if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) {
      errors.push('Asset path escapes source directory: ' + value);
      continue;
    }
    references.add(target);
    if (!existsSync(target)) {
      errors.push('Broken reference in ' + relative(root, file) + ': ' + value);
    }
  }
}
inspect(html, htmlPath);
const cssPath = join(root, 'styles.css');
if (existsSync(cssPath)) inspect(readFileSync(cssPath, 'utf8'), cssPath);
let fileCount = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile()) fileCount++;
  }
}
walk(root);
if (errors.length) {
  for (const error of errors) console.error('FAIL:', error);
  process.exit(1);
}
console.log('PASS: v22 source validated (' + fileCount + ' files, ' + references.size + ' linked local assets)');
