#!/usr/bin/env node
/**
 * Import the exact approved v22 archive without altering its files.
 * Usage: node scripts/import-v22.mjs /path/to/chornohora-illustrated-ui-v22.zip
 * Requires Python 3 for ZIP extraction (stdlib only).
 */
import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {join, resolve} from 'node:path';

const archive = process.argv[2];
if (!archive || !existsSync(archive)) {
  console.error('Usage: node scripts/import-v22.mjs <approved-v22.zip>');
  process.exit(2);
}
const destination = resolve('public/legacy');
const tmp = resolve('public/.legacy-import-tmp');
rmSync(tmp, {recursive: true, force: true});
mkdirSync(tmp, {recursive: true});
const python = [
  'import pathlib,sys,zipfile',
  'src,dst=map(pathlib.Path,sys.argv[1:])',
  'with zipfile.ZipFile(src) as z:',
  '  for member in z.infolist():',
  '    p=pathlib.PurePosixPath(member.filename)',
  '    if p.is_absolute() or ".." in p.parts: raise ValueError("Unsafe ZIP entry")',
  '    target=dst.joinpath(*p.parts)',
  '    if member.is_dir(): target.mkdir(parents=True,exist_ok=True); continue',
  '    target.parent.mkdir(parents=True,exist_ok=True)',
  '    target.write_bytes(z.read(member))',
].join('\n');
let result = spawnSync('python3', ['-c', python, resolve(archive), tmp], {encoding: 'utf8'});
if (result.error?.code === 'ENOENT') {
  result = spawnSync('python', ['-c', python, resolve(archive), tmp], {encoding: 'utf8'});
}
if (result.status !== 0) {
  rmSync(tmp, {recursive: true, force: true});
  console.error(result.stderr || result.error || 'Could not extract archive');
  process.exit(1);
}
const required = [
  'index.html', 'styles.css', 'assets/runtime-0.js', 'assets/runtime-1.js',
  'assets/runtime-2.js', 'assets/route-menu-v19.js', 'assets/ui-v8.js',
  'assets/ui-fixes-v11.js', 'assets/chornohora-mark.png',
  ...Array.from({length: 6}, (_, i) => 'assets/instagram-' + (i + 1) + '.svg'),
];
const missing = required.filter((file) => !existsSync(join(tmp, file)));
if (missing.length) {
  rmSync(tmp, {recursive: true, force: true});
  throw new Error('Missing approved v22 assets: ' + missing.join(', '));
}
const html = readFileSync(join(tmp, 'index.html'), 'utf8');
for (const anchor of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
  if (!html.includes('id="' + anchor + '"')) throw new Error('Missing route anchor ' + anchor);
}
const hashes = [];
function walk(dir, prefix = '') {
  for (const item of readdirSync(dir, {withFileTypes: true})) {
    const rel = prefix ? prefix + '/' + item.name : item.name;
    if (item.isDirectory()) walk(join(dir, item.name), rel);
    else if (item.isFile()) {
      const path = join(dir, item.name);
      hashes.push([rel, createHash('sha256').update(readFileSync(path)).digest('hex')]);
    }
  }
}
walk(tmp);
if (existsSync(destination)) {
  console.error('Refusing to overwrite existing public/legacy. Remove it explicitly first.');
  rmSync(tmp, {recursive: true, force: true});
  process.exit(1);
}
import {renameSync} from 'node:fs';
renameSync(tmp, destination);
console.log('Imported ' + hashes.length + ' approved v22 files to public/legacy');
for (const [path, hash] of hashes.sort((a,b) => a[0].localeCompare(b[0]))) console.log(hash + '  ' + path);
