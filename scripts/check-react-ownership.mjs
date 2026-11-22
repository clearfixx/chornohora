#!/usr/bin/env node
/**
 * Ensure the React preview's *reachable* source graph cannot accidentally
 * import the legacy DOM/scroll runtimes during the migration.
 *
 * Do not ban old files from the repository: the canonical v22 and native
 * comparison mode intentionally keep working until human acceptance.
 */
import {existsSync, readFileSync} from 'node:fs';
import {dirname, extname, join, normalize, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(project, 'src');
const entry = join(root, 'components/journey/ReactJourneyPreview.tsx');
const extensions = ['.tsx', '.ts', '.jsx', '.js', '.mjs'];
const allowedSuffixes = [...extensions, ...extensions.map(ext => '/index' + ext)];
const importsPattern = /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const blocked = [
  {pattern:/\bdangerouslySetInnerHTML\b/, reason:'HTML injection'},
  {pattern:/\.innerHTML\s*=/, reason:'imperative HTML injection'},
  {pattern:/<iframe\b/i, reason:'embedded legacy runtime'},
  {pattern:/\b(?:LegacyJourney|V22SourceInteraction|V22ScrollController|mountV22RouteDrawer|mountV22UI|x-dc)\b/, reason:'legacy runtime/controller'},
];
const forbiddenModules = /(?:^|\/)(?:v22-(?:source-scene|scroll-controller|ui-v8|ui-fixes-v11|route-drawer|static-navigation|demo-booking)|LegacyJourney|V22SourceInteraction)(?:\.[^/]*)?$/;

export function resolveLocalImport(from, specifier) {
  const base = specifier.startsWith('@/') ? join(root, specifier.slice(2))
    : specifier.startsWith('.') ? resolve(dirname(from), specifier) : null;
  if (!base) return null;
  const normalized = normalize(base);
  if (!(normalized === root || normalized.startsWith(root + '/'))) {
    throw Error('Source import escapes src/: ' + specifier + ' from ' + relative(project, from));
  }
  for (const suffix of ['', ...allowedSuffixes]) {
    const candidate = normalized + suffix;
    if (existsSync(candidate) && extensions.includes(extname(candidate))) return candidate;
  }
  throw Error('Unresolved React-local module ' + specifier + ' from ' + relative(project, from));
}

export function scanReactImports(start = entry) {
  const checked = new Set();
  const issues = [];
  const stack = [start];
  while (stack.length) {
    const file = stack.pop();
    if (checked.has(file)) continue;
    checked.add(file);
    const content = readFileSync(file, 'utf8');
    const name = relative(project, file).replaceAll('\\', '/');
    for (const {pattern, reason} of blocked) {
      if (pattern.test(content)) issues.push(name + ': forbidden ' + reason);
    }
    for (const match of content.matchAll(importsPattern)) {
      const specifier = match[1] ?? match[2];
      if (!specifier) continue;
      if (forbiddenModules.test(specifier)) issues.push(name + ': imports legacy module ' + specifier);
      const dependency = resolveLocalImport(file, specifier);
      if (dependency) stack.push(dependency);
    }
  }
  const page = readFileSync(join(root, 'app/[locale]/page.tsx'), 'utf8');
  const reactBranch = page.split("if (preview === 'native')")[1]?.split('return <main')[0];
  if (!reactBranch) issues.push('Canonical React branch missing from server page');
  else {
    if (!reactBranch.includes('ReactJourneyPreview')) issues.push('React route does not mount its React component');
    if (/LegacyJourney|V22SourceInteraction|getV22SourceScene|\/legacy\/styles\.css|<iframe\b/.test(reactBranch)) {
      issues.push('Canonical React branch imports legacy HTML, styles or iframe runtime');
    }
  }
  return {files:[...checked].map(file => relative(project,file).replaceAll('\\','/')).sort(), issues};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = scanReactImports();
  if (result.issues.length) {
    console.error('React ownership boundary failed:\n' + result.issues.map(x=>' - '+x).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('React ownership graph verified: ' + result.files.length + ' local modules, zero legacy controllers, HTML injections or iframes.');
  }
}
