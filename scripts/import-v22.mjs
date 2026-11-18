#!/usr/bin/env node
/**
 * Import the approved v22 ZIP on Windows or Unix, without requiring Python.
 * Windows: PowerShell Expand-Archive; Unix: unzip.
 */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync,
} from 'node:fs';
import {join, resolve} from 'node:path';

const archive = process.argv[2];
if (!archive || !existsSync(archive)) {
  console.error('Usage: node scripts/import-v22.mjs <approved-v22.zip>');
  process.exit(2);
}
const destination = resolve('public/legacy');
if (existsSync(destination)) {
  console.error('Refusing to overwrite existing public/legacy. Remove it explicitly first.');
  process.exit(1);
}
const tmp = resolve('public/.legacy-import-tmp');
rmSync(tmp, {recursive: true, force: true});
mkdirSync(tmp, {recursive: true});

try {
  let result;
  if (process.platform === 'win32') {
    const escapedArchive = resolve(archive).replaceAll("'", "''");
    const escapedTmp = tmp.replaceAll("'", "''");
    const command = "Expand-Archive -LiteralPath '" + escapedArchive +
      "' -DestinationPath '" + escapedTmp + "' -Force -ErrorAction Stop";
    result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      encoding: 'utf8',
    });
  } else {
    result = spawnSync('unzip', ['-q', resolve(archive), '-d', tmp], {encoding: 'utf8'});
  }
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr || result.error?.message || 'Archive extraction failed');
  }
  const required = [
    'index.html', 'styles.css', 'assets/runtime-0.js', 'assets/runtime-1.js',
    'assets/runtime-2.js', 'assets/route-menu-v19.js',
    'assets/ui-v8.js', 'assets/ui-fixes-v11.js', 'assets/chornohora-mark.png',
    ...Array.from({length: 6}, (_, i) => 'assets/instagram-' + (i + 1) + '.svg'),
    ...[3, 4, 5, 6].map((i) => 'assets/font-' + i + '.woff2'),
  ];
  const missing = required.filter((file) => !existsSync(join(tmp, file)));
  if (missing.length) throw new Error('Missing approved v22 assets: ' + missing.join(', '));
  const html = readFileSync(join(tmp, 'index.html'), 'utf8');
  for (const anchor of ['govla', 'brebeneskul', 'nesamovyte', 'petros']) {
    if (!html.includes('id="' + anchor + '"')) {
      throw new Error('Missing route anchor: ' + anchor);
    }
  }
  if (!html.includes('<x-dc')) throw new Error('Missing original animation root');
  const hashes = [];
  function walk(dir, prefix = '') {
    for (const item of readdirSync(dir, {withFileTypes: true})) {
      const rel = prefix ? prefix + '/' + item.name : item.name;
      if (item.isDirectory()) walk(join(dir, item.name), rel);
      else if (item.isFile()) {
        hashes.push([
          rel,
          createHash('sha256').update(readFileSync(join(dir, item.name))).digest('hex'),
        ]);
      }
    }
  }
  walk(tmp);
  renameSync(tmp, destination);
  console.log('Imported ' + hashes.length + ' v22 files to public/legacy');
  for (const [path, hash] of hashes.sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(hash + '  ' + path);
  }
} catch (error) {
  rmSync(tmp, {recursive: true, force: true});
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
